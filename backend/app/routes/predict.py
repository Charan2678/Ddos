import os
import joblib
from typing import List
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status, UploadFile, File
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Prediction, TrainedModel, User, SystemLog
from app.schemas import PredictionCreate, PredictionResponse, BatchPredictionResponse, BatchPredictionItem
from app.security import get_current_user
from app.utils.ml_pipeline import FEATURE_COLS, INV_LABEL_MAP

router = APIRouter(prefix="/api", tags=["predictions"])

# Caches the model in-memory to prevent repeated heavy disk I/O reads during live traffic
MODEL_CACHE = {
    "model": None,
    "scaler": None,
    "timestamp": None
}

def load_champion_model():
    """Helper to load the active model and scaler from the persistent joblib storage."""
    model_path = "models/best_model.joblib"
    scaler_path = "models/scaler.joblib"
    
    if not os.path.exists(model_path) or not os.path.exists(scaler_path):
        return None, None
        
    # Check if we already have it in memory
    if MODEL_CACHE["model"] is not None:
        return MODEL_CACHE["model"], MODEL_CACHE["scaler"]
        
    try:
        # Load files from disk
        MODEL_CACHE["model"] = joblib.load(model_path)
        MODEL_CACHE["scaler"] = joblib.load(scaler_path)
        return MODEL_CACHE["model"], MODEL_CACHE["scaler"]
    except Exception as e:
        print(f"Failed to load model weights: {e}")
        return None, None

@router.post("/predict", response_model=PredictionResponse)
def predict_single_flow(
    payload: PredictionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Load active ML model
    model, scaler = load_champion_model()
    if not model or not scaler:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Champion ML model has not been trained yet. Please upload a dataset and train models first."
        )
        
    try:
        # 2. Extract features in the precise expected index order
        features_dict = {k.lower().strip(): v for k, v in payload.input_data.items()}
        
        feature_vector = []
        for col in FEATURE_COLS:
            val = features_dict.get(col, 0.0)
            feature_vector.append(float(val))
            
        # Reshape to a single sample matrix: (1, n_features)
        X_sample = [feature_vector]
        
        # 3. Apply the fitted StandardScaler
        X_scaled = scaler.transform(X_sample)
        
        # 4. Perform ML classification
        class_idx = int(model.predict(X_scaled)[0])
        probabilities = model.predict_proba(X_scaled)[0]
        confidence = float(probabilities[class_idx])
        
        # Map class index back to attack string
        label = INV_LABEL_MAP.get(class_idx, "UNKNOWN")
        
        # Determine threat severity rating
        if label == "BENIGN":
            threat_level = "LOW"
        elif label in ["ICMP Flood", "HTTP Flood"]:
            threat_level = "HIGH"
        else:
            threat_level = "CRITICAL" # SYN or UDP Floods
            
        champion_model = db.query(TrainedModel).filter(TrainedModel.file_path == 'models/best_model.joblib').order_by(TrainedModel.created_at.desc()).first()
        model_id = champion_model.id if champion_model else None
        model_name = champion_model.name if champion_model else "Champion Model"
        model_algorithm = champion_model.algorithm if champion_model else "Random Forest"
        
        # Save prediction entry in history database
        db_prediction = Prediction(
            input_data=payload.input_data,
            prediction_label=label,
            confidence=confidence,
            threat_level=threat_level,
            model_id=model_id,
            user_id=current_user.id
        )
        db.add(db_prediction)
        
        # Log critical attacks in system logs
        if label != "BENIGN":
            attack_log = SystemLog(
                action="ATTACK_DETECTED",
                details=f"Identified {label} anomaly from network stream with {confidence*100:.2f}% confidence",
                user_id=current_user.id
            )
            db.add(attack_log)
            
        db.commit()
        db.refresh(db_prediction)
        
        response_data = PredictionResponse.model_validate(db_prediction)
        response_data.model_name = model_name
        response_data.model_algorithm = model_algorithm
        
        return response_data
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference pipeline execution error: {str(e)}"
        )

@router.post("/predict/batch", response_model=BatchPredictionResponse)
async def predict_batch_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")
        
    # 1. Load active ML model
    model, scaler = load_champion_model()
    if not model or not scaler:
        raise HTTPException(status_code=400, detail="Champion model not trained.")
        
    try:
        # 2. Read CSV
        df = pd.read_csv(file.file)
        
        # 3. Identify Source IP column
        ip_col = None
        for col in df.columns:
            if col.strip().lower() in ["source ip", "source_ip", "src ip", "src_ip", "ip"]:
                ip_col = col
                break
                
        # 4. Normalize columns for feature extraction
        original_columns = list(df.columns)
        df.columns = [c.lower().strip() for c in df.columns]
        ip_col_lower = ip_col.lower().strip() if ip_col else "unknown_ip"
        
        feature_data = []
        source_ips = []
        
        for index, row in df.iterrows():
            sip = str(row.get(ip_col_lower, "Unknown IP")) if ip_col else "Unknown IP"
            source_ips.append(sip)
            
            vec = []
            for col in FEATURE_COLS:
                val = row.get(col, 0.0)
                vec.append(float(val) if not pd.isna(val) else 0.0)
            feature_data.append(vec)
            
        if not feature_data:
            raise ValueError("CSV is empty or missing features.")
            
        # 5. ML Classification
        X_scaled = scaler.transform(feature_data)
        predictions = model.predict(X_scaled)
        probabilities = model.predict_proba(X_scaled)
        
        anomalies = []
        benign_count = 0
        attack_count = 0
        attack_types = {}
        
        for i in range(len(predictions)):
            class_idx = int(predictions[i])
            conf = float(probabilities[i][class_idx])
            label = INV_LABEL_MAP.get(class_idx, "UNKNOWN")
            
            if label == "BENIGN":
                benign_count += 1
            else:
                attack_count += 1
                attack_types[label] = attack_types.get(label, 0) + 1
                threat = "HIGH" if label in ["ICMP Flood", "HTTP Flood"] else "CRITICAL"
                
                anomalies.append(BatchPredictionItem(
                    source_ip=source_ips[i],
                    prediction_label=label,
                    threat_level=threat,
                    confidence=conf
                ))
                
        # Limit anomalies sent to frontend to max 500 to prevent browser crash
        anomalies = anomalies[:500]
        
        # Save batch anomalies to the database so they appear in History Logs
        db_predictions = []
        for anomaly in anomalies:
            row_dict = {
                "src_ip": anomaly.source_ip,
                "protocol_name": "CSV Batch"
            }
            db_predictions.append(Prediction(
                input_data=row_dict,
                prediction_label=anomaly.prediction_label,
                confidence=anomaly.confidence,
                threat_level=anomaly.threat_level,
                model_id=None,
                user_id=current_user.id
            ))
            
        if db_predictions:
            db.bulk_save_objects(db_predictions)
            db.commit()
                
        champion_model = db.query(TrainedModel).filter(TrainedModel.file_path == 'models/best_model.joblib').order_by(TrainedModel.created_at.desc()).first()
        model_name = champion_model.name if champion_model else "Champion Model"
        model_algorithm = champion_model.algorithm if champion_model else "Random Forest"
                
        return BatchPredictionResponse(
            file_name=file.filename,
            total_scanned=len(predictions),
            benign_count=benign_count,
            attack_count=attack_count,
            attack_types=attack_types,
            model_name=model_name,
            model_algorithm=model_algorithm,
            anomalies=anomalies
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch processing failed: {str(e)}")


# ==========================================
# WEBSOCKET CONNECTION MANAGER
# ==========================================

class ConnectionManager:
    """Manages active WebSockets connections from React clients."""
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"WS client connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            print(f"WS client disconnected. Remaining: {len(self.active_connections)}")

    async def broadcast_packet(self, data: dict):
        """Sends packet telemetry to all connected client consoles."""
        for connection in self.active_connections:
            try:
                await connection.send_json(data)
            except Exception:
                # Handle disconnected or broken socket states silently
                pass

manager = ConnectionManager()

from app.utils.sniffer import start_sniffer, stop_sniffer

@router.post("/start-monitoring")
def start_traffic_sniffer(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        started = start_sniffer()
        
        if started:
            sys_log = SystemLog(
                action="SNIFFER_STARTED",
                details=f"Live packet capture listener activated by operator '{current_user.username}'",
                user_id=current_user.id
            )
            db.add(sys_log)
            db.commit()
            
        return {"status": "success", "message": "Intrusion detection sniffer thread activated."}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initialize packet capture: {str(e)}"
        )

@router.post("/stop-monitoring")
def stop_traffic_sniffer(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        stopped = stop_sniffer()
        
        if stopped:
            sys_log = SystemLog(
                action="SNIFFER_HALTED",
                details=f"Live packet capture listener paused by operator '{current_user.username}'",
                user_id=current_user.id
            )
            db.add(sys_log)
            db.commit()
            
        return {"status": "success", "message": "Intrusion detection sniffer thread halted."}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to pause packet capture: {str(e)}"
        )

@router.websocket("/live-traffic")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            print(f"Received WS command: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)


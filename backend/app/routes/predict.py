import os
import joblib
from typing import List
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Prediction, TrainedModel, User, SystemLog
from app.schemas import PredictionCreate, PredictionResponse
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
            
        # Fetch the active model metadata from database to link the prediction log
        latest_trained = db.query(TrainedModel).order_by(TrainedModel.created_at.desc()).first()
        model_id = latest_trained.id if latest_trained else None
        
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
        
        return db_prediction
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference pipeline execution error: {str(e)}"
        )


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


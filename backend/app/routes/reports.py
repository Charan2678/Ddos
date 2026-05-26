import os
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from app.database import get_db
from app.models import Report, Prediction, User, SystemLog
from app.schemas import ReportResponse, DashboardStatsResponse
from app.security import get_current_user
from app.utils.report_gen import generate_pdf_report, generate_csv_report

router = APIRouter(prefix="/api", tags=["reports"])

REPORTS_DIR = "reports"
os.makedirs(REPORTS_DIR, exist_ok=True)

@router.post("/generate-report", response_model=ReportResponse)
def generate_report(
    date_range: str = "24h", # 24h, 7d, 30d
    report_format: str = "pdf", # pdf, csv
    scope: str = "all",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Determine date filter threshold
    now = datetime.utcnow()
    if date_range == "24h":
        threshold = now - timedelta(hours=24)
    elif date_range == "7d":
        threshold = now - timedelta(days=7)
    else:
        threshold = now - timedelta(days=30)
        
    # 2. Query prediction logs from database
    predictions = db.query(Prediction).filter(Prediction.created_at >= threshold).order_by(Prediction.created_at.desc()).all()
    
    # Determine title based on scope
    if scope == "attacks":
        title_prefix = "Threat Log History"
        # Filter predictions to only anomalies
        predictions = [p for p in predictions if p.prediction_label != "BENIGN"]
    elif scope == "ml":
        title_prefix = "Classifier Accuracies & Benchmarks"
    else:
        title_prefix = "Full Security Summary"
        
    report_title = f"{title_prefix} ({date_range.upper()})"

    # Format database logs into serializable list-of-dicts for report generator
    logs_data = []
    total_anomalies = 0
    vector_counts = {}
    
    for p in predictions:
        is_anomaly = p.prediction_label != "BENIGN"
        if is_anomaly:
            total_anomalies += 1
            vector_counts[p.prediction_label] = vector_counts.get(p.prediction_label, 0) + 1
            
        logs_data.append({
            "timestamp": p.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "ip": p.input_data.get("src_ip", "192.168.1.100"), # Default fallback
            "proto": p.input_data.get("protocol_name", "TCP") if p.input_data.get("protocol") == 6 else "UDP",
            "classification": p.prediction_label,
            "confidence": p.confidence,
            "level": p.threat_level
        })
        
    # Determine top attack vector
    top_vector = "N/A"
    if vector_counts:
        top_vector = max(vector_counts, key=vector_counts.get)
        
    # Aggregate statistics
    stats = {
        "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "scope": scope.upper(),
        "creator": current_user.username,
        "total_scanned": len(predictions),
        "total_anomalies": total_anomalies,
        "top_vector": top_vector
    }
    
    # 3. Create document paths
    timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"report_{timestamp_str}.{report_format.lower()}"
    file_path = os.path.join(REPORTS_DIR, filename)
    
    try:
        # Compile document
        if report_format.lower() == "pdf":
            generate_pdf_report(file_path, stats, logs_data[:50]) # Limit PDF to latest 50 entries
        else:
            generate_csv_report(file_path, logs_data)
            
        # 4. Save metadata in DB
        db_report = Report(
            title=report_title,
            file_path=file_path,
            report_type=report_format.upper(),
            created_by=current_user.id
        )
        
        db.add(db_report)
        db.commit()
        db.refresh(db_report)
        
        # Log action
        sys_log = SystemLog(
            action="REPORT_GENERATED",
            details=f"Compiled security audit report '{filename}' ({report_format.upper()})",
            user_id=current_user.id
        )
        db.add(sys_log)
        db.commit()
        
        return db_report
        
    except Exception as e:
        db.rollback()
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Report compiler encountered an error: {str(e)}"
        )

@router.get("/reports", response_model=List[ReportResponse])
def list_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Report)
    if not current_user.is_admin:
        query = query.filter(Report.created_by == current_user.id)
        
    return query.order_by(Report.created_at.desc()).all()

@router.get("/reports/{report_id}/download")
def download_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report record not found"
        )
        
    if not os.path.exists(report.file_path):
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="Physical file was purged or deleted from server disk storage."
        )
        
    # Return file response streaming the PDF/CSV to the client browser
    return FileResponse(
        path=report.file_path,
        media_type="application/octet-stream",
        filename=os.path.basename(report.file_path)
    )

@router.get("/reports/history")
def get_prediction_history(
    limit: int = 150,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Prediction)
    
    # Isolate history based on user role
    if not current_user.is_admin:
        query = query.filter(Prediction.user_id == current_user.id)
        
    predictions = query.order_by(Prediction.created_at.desc()).limit(limit).all()
    
    logs = []
    for p in predictions:
        proto_name = p.input_data.get("protocol_name", "N/A")
        if proto_name == "N/A":
            proto_num = p.input_data.get("protocol", 6)
            proto_name = "TCP" if proto_num == 6 else "UDP" if proto_num == 17 else "ICMP"
            
        logs.append({
            "id": p.id,
            "timestamp": p.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "ip": p.input_data.get("src_ip", "192.168.1.100"),
            "proto": proto_name,
            "port": "Raw",
            "classification": p.prediction_label,
            "confidence": p.confidence,
            "level": p.threat_level
        })
        
    return logs

@router.get("/dashboard-stats", response_model=DashboardStatsResponse)
def get_dashboard_stats(db: Session = Depends(get_db)):
    # Calculate Total Scanned
    total_scanned = db.query(Prediction).count()
    
    # Calculate Attacks Blocked
    attacks_blocked = db.query(Prediction).filter(Prediction.prediction_label != "BENIGN").count()
    
    # Calculate Active Threats (threats in the last 24h as a proxy)
    threshold_24h = datetime.utcnow() - timedelta(hours=24)
    active_threats = db.query(Prediction).filter(
        Prediction.prediction_label != "BENIGN", 
        Prediction.created_at >= threshold_24h
    ).count()
    
    # Calculate Attack Distribution
    distribution = db.query(Prediction.prediction_label, func.count(Prediction.id)).group_by(Prediction.prediction_label).all()
    
    attack_distribution = []
    has_benign = False
    for label, count in distribution:
        attack_distribution.append({"name": label, "value": count})
        if label == "BENIGN":
            has_benign = True
            
    # Guarantee BENIGN exists so the chart renders properly
    if not has_benign:
        attack_distribution.append({"name": "BENIGN", "value": 0})
        
    # Get Recent Logs (last 50)
    recent_predictions = db.query(Prediction).order_by(Prediction.created_at.desc()).limit(50).all()
    recent_logs = []
    
    for p in recent_predictions:
        # Determine protocol
        proto_num = p.input_data.get("protocol", 6)
        proto_name = p.input_data.get("protocol_name", "TCP")
        if proto_name == "TCP" and proto_num == 17: proto_name = "UDP"
            
        recent_logs.append({
            "id": p.id,
            "time": p.created_at.strftime("%H:%M:%S"),
            "ip": p.input_data.get("src_ip", p.input_data.get("Source IP", "Unknown IP")),
            "type": p.prediction_label,
            "rate": "Batch / Inference", # Since it's from db
            "severity": p.threat_level
        })
        
    return DashboardStatsResponse(
        total_scanned=total_scanned,
        attacks_blocked=attacks_blocked,
        active_threats=active_threats,
        packet_rate=0, # Live packet rate from DB isn't applicable, keep 0 or mock
        attack_distribution=attack_distribution,
        recent_logs=recent_logs
    )

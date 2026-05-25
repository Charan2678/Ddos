import os
import shutil
import pandas as pd
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Dataset, User, SystemLog
from app.schemas import DatasetResponse
from app.security import get_current_user

router = APIRouter(prefix="/api", tags=["datasets"])

# Directory where training datasets are stored
DATASETS_DIR = "datasets"
os.makedirs(DATASETS_DIR, exist_ok=True)

# Required features template that our ML models depend on
# In a real environment, we check if the dataset has these core columns.
REQUIRED_TRAFFIC_COLUMNS = [
    "flow_duration", "tot_fwd_pkts", "tot_bwd_pkts", 
    "fwd_pkt_len_mean", "bwd_pkt_len_mean", "flow_byts_s", 
    "flow_pkts_s", "syn_flag_cnt", "protocol", "label"
]

@router.post("/upload-dataset", response_model=DatasetResponse)
async def upload_dataset(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Enforce file extensions
    if not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be in CSV format (.csv)"
        )
    
    # Save the file temporarily to inspect it
    temp_path = os.path.join(DATASETS_DIR, f"temp_{file.filename}")
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        # 2. Parse and validate dataset structure using Pandas
        # Read only top 5 rows to quickly validate headers without overloading RAM
        df = pd.read_csv(temp_path, nrows=5)
        columns_lower = [c.lower().strip() for c in df.columns]
        
        # Verify that our required headers are represented
        missing_cols = []
        for req_col in REQUIRED_TRAFFIC_COLUMNS:
            if req_col not in columns_lower:
                missing_cols.append(req_col)
                
        if missing_cols:
            os.remove(temp_path)
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Dataset is missing required DDoS features: {', '.join(missing_cols)}"
            )
            
        # Get full row count (read line count of file, much faster than df.shape for 100MB+ files)
        with open(temp_path, "r", encoding="utf-8", errors="ignore") as f:
            row_count = sum(1 for _ in f) - 1  # Subtract header row
            
        # 3. Save final file with a clean name
        clean_filename = f"{int(os.path.getctime(temp_path))}_{file.filename}"
        final_path = os.path.join(DATASETS_DIR, clean_filename)
        shutil.move(temp_path, final_path)
        
        # Save dataset details in database
        features_str = ",".join(df.columns)
        new_dataset = Dataset(
            name=file.filename,
            file_path=final_path,
            row_count=row_count,
            features=features_str,
            uploaded_by=current_user.id
        )
        
        db.add(new_dataset)
        db.commit()
        db.refresh(new_dataset)
        
        # Log event
        sys_log = SystemLog(
            action="DATASET_UPLOADED",
            details=f"Dataset '{new_dataset.name}' ({row_count} rows) uploaded by operator '{current_user.username}'",
            user_id=current_user.id
        )
        db.add(sys_log)
        db.commit()
        
        return new_dataset
        
    except HTTPException:
        # Re-raise FastAPIs HTTP exceptions
        raise
    except Exception as e:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to parse CSV dataset: {str(e)}"
        )

@router.get("/datasets", response_model=List[DatasetResponse])
def list_datasets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Dataset).order_by(Dataset.created_at.desc()).all()

@router.get("/datasets/{dataset_id}/preview")
def preview_dataset(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found"
        )
        
    try:
        # Load first 5 rows and convert to list-of-lists for frontend table rendering
        df = pd.read_csv(dataset.file_path, nrows=5)
        
        # Replace NaN values with None/null so they are JSON serializable
        df = df.where(pd.notnull(df), None)
        
        headers = df.columns.tolist()
        rows = df.values.tolist()
        
        return {
            "headers": headers,
            "rows": rows
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not load dataset preview: {str(e)}"
        )

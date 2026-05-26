from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import timedelta

from app.database import get_db
from app.models import Dataset, TrainedModel, User, SystemLog
from app.schemas import ModelResponse, ModelComparisonResponse
from app.security import get_current_user
from app.utils.ml_pipeline import preprocess_and_split, train_and_evaluate_all

router = APIRouter(prefix="/api", tags=["machine-learning"])

@router.post("/train-model", response_model=List[ModelResponse])
def train_models(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Verify dataset exists
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found"
        )
        
    if dataset.row_count < 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Dataset is too small for Machine Learning. It has {dataset.row_count} rows, but requires at least 100."
        )
        
    try:
        # Log training started
        start_log = SystemLog(
            action="MODEL_TRAIN_START",
            details=f"Retraining pipeline triggered on dataset '{dataset.name}' by operator '{current_user.username}'",
            user_id=current_user.id
        )
        db.add(start_log)
        db.commit()

        # 2. Run Preprocessing & Splitting
        X_train, X_test, y_train, y_test = preprocess_and_split(dataset.file_path)
        
        # 3. Train all 6 algorithms
        benchmarks, champion_name = train_and_evaluate_all(X_train, X_test, y_train, y_test)
        
        # 4. Save results to Database
        saved_models = []
        for b in benchmarks:
            # We save the model weights path. The active champion goes to 'models/best_model.joblib'
            # Others are documented with their scores.
            file_path = f"models/best_model.joblib" if b["name"] == champion_name else f"models/{b['name'].lower().replace(' ', '_')}.joblib"
            
            db_model = TrainedModel(
                name=b["name"],
                algorithm=b["name"].lower().replace(" ", "_"),
                file_path=file_path,
                accuracy=b["accuracy"],
                precision=b["precision"],
                recall=b["recall"],
                f1_score=b["f1_score"],
                training_time=b["training_time"],
                dataset_id=dataset.id,
                created_by_id=current_user.id
            )
            db.add(db_model)
            saved_models.append(db_model)
            
        db.commit()
        
        # Log training completion
        end_log = SystemLog(
            action="MODEL_TRAIN_COMPLETE",
            details=f"Retraining complete. Champion: {champion_name} (F1: {max(b['f1_score'] for b in benchmarks):.4f})",
            user_id=current_user.id
        )
        db.add(end_log)
        db.commit()
        
        # Refresh and return saved models
        for m in saved_models:
            db.refresh(m)
            
        return saved_models
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Model training pipeline failed: {str(e)}"
        )

@router.get("/compare-models", response_model=ModelComparisonResponse)
def compare_models(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Fetch models trained during the latest training cycle
    # We find the latest trained model's timestamp, and fetch all models trained around that time.
    latest_model = db.query(TrainedModel).order_by(TrainedModel.created_at.desc()).first()
    if not latest_model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No trained models found. Please train models in the ML Studio first."
        )
        
    # Get all models created within 2 minutes of the latest model (since a batch is trained together)
    time_threshold = latest_model.created_at - timedelta(minutes=2)
    models = db.query(TrainedModel).filter(TrainedModel.created_at >= time_threshold).order_by(TrainedModel.f1_score.desc()).all()
    
    champion = models[0].name if models else "Unknown"
    
    return {
        "champion": champion,
        "models": models
    }

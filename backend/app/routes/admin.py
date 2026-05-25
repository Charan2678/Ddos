import os
import shutil
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, SystemLog, Prediction
from app.schemas import UserResponse, SystemLogResponse
from app.security import get_current_user

router = APIRouter(prefix="/api", tags=["admin"])

def require_admin(current_user: User = Depends(get_current_user)):
    """FastAPI helper dependency to enforce administrative rights."""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrative privileges required to access this resource."
        )
    return current_user

@router.get("/users", response_model=List[UserResponse])
def list_operators(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    return db.query(User).order_by(User.created_at.asc()).all()

@router.delete("/users/{user_id}")
def revoke_operator(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Operator profile not found"
        )
        
    if user.username == "admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete main system administrator account."
        )
        
    # Log audit
    audit = SystemLog(
        action="OPERATOR_REVOKED",
        details=f"Operator profile '{user.username}' deleted by admin '{admin.username}'",
        user_id=admin.id
    )
    db.add(audit)
    
    db.delete(user)
    db.commit()
    return {"message": f"Successfully revoked operator access for '{user.username}'"}

@router.get("/logs", response_model=List[SystemLogResponse])
def get_audit_trail(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    return db.query(SystemLog).order_by(SystemLog.created_at.desc()).limit(100).all()

@router.post("/admin/purge-cache")
def purge_caches(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    dirs_to_purge = ["datasets", "reports", "uploads"]
    purged_files = 0
    
    for directory in dirs_to_purge:
        if os.path.exists(directory):
            for filename in os.listdir(directory):
                # Don't delete model files or running configs
                if filename.startswith("temp_") or filename.endswith(".csv") or filename.endswith(".pdf"):
                    file_path = os.path.join(directory, filename)
                    try:
                        if os.path.isfile(file_path):
                            os.remove(file_path)
                            purged_files += 1
                    except Exception:
                        pass
                        
    # Log action
    audit = SystemLog(
        action="CACHE_PURGED",
        details=f"Purged {purged_files} files from local storage directories",
        user_id=admin.id
    )
    db.add(audit)
    db.commit()
    
    return {"message": f"Purged {purged_files} cached files from cache directories."}

@router.post("/admin/wipe-history")
def wipe_predictions_history(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    try:
        # Delete predictions records
        deleted_count = db.query(Prediction).delete()
        
        # Log action
        audit = SystemLog(
            action="HISTORY_WIPED",
            details=f"Cleared all {deleted_count} traffic prediction logs from history",
            user_id=admin.id
        )
        db.add(audit)
        db.commit()
        
        return {"message": f"Wiped all {deleted_count} prediction histories."}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Wipe operation failed: {str(e)}"
        )

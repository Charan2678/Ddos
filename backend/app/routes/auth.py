from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, SystemLog
from app.schemas import UserCreate, UserLogin, UserResponse, Token
from app.security import verify_password, get_password_hash, create_access_token

router = APIRouter(prefix="/api", tags=["authentication"])

@router.post("/register", response_model=UserResponse)
def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    # Check if username exists
    existing_username = db.query(User).filter(User.username == user_data.username).first()
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username is already registered"
        )
    
    # Check if email exists
    existing_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address is already registered"
        )
    
    # Hash password and create user
    hashed_pwd = get_password_hash(user_data.password)
    
    # First user registered in the system is automatically an admin!
    # This is a very standard and convenient setup pattern for production microservices.
    is_first_user = db.query(User).count() == 0
    
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_pwd,
        is_admin=is_first_user
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Log the system action
    sys_log = SystemLog(
        action="OPERATOR_REGISTERED",
        details=f"New operator account '{new_user.username}' created (Admin: {new_user.is_admin})",
        user_id=new_user.id
    )
    db.add(sys_log)
    db.commit()
    
    return new_user

@router.post("/login", response_model=Token)
def login_user(login_data: UserLogin, db: Session = Depends(get_db)):
    # Look up user by username OR email
    user = db.query(User).filter(
        (User.username == login_data.username_or_email) | 
        (User.email == login_data.username_or_email)
    ).first()
    
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Generate token
    token_payload = {"sub": user.username}
    access_token = create_access_token(data=token_payload)
    
    # Log the successful connection
    sys_log = SystemLog(
        action="OPERATOR_LOGIN",
        details=f"Operator '{user.username}' authenticated successfully",
        user_id=user.id
    )
    db.add(sys_log)
    db.commit()
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

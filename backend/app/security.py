import datetime
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import User

# Configure passlib for bcrypt password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Configures FastAPI to look for a bearer token in the "Authorization" header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login", auto_error=False)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies that a plain password matches its hashed database record."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Generates a secure bcrypt hash of a plain password."""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None) -> str:
    """Generates a signed JSON Web Token (JWT) holding authentication claims."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.utcnow() + expires_delta
    else:
        expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


# =========================================================================
# EXERCISE: Complete the secure route dependency below.
# This function is used as a dependency in FastAPI to restrict access.
# =========================================================================

async def get_current_user(
    token: str = Depends(oauth2_scheme), 
    db: Session = Depends(get_db)
) -> User:
    """
    FastAPI dependency to authenticate and fetch the current user using the JWT token.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not token:
        raise credentials_exception

    try:
        # Decode the JWT token using the system secret key
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        # Catches expired signature or tampered token hashes
        raise credentials_exception

    # Query database to confirm the user profile exists and is active
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
        
    return user

def create_password_reset_token(email: str) -> str:
    """Generates a 15-minute JWT token specifically for password resets."""
    expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=15)
    to_encode = {"sub": email, "type": "password_reset", "exp": expire}
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

def verify_password_reset_token(token: str) -> Optional[str]:
    """Decodes a password reset token and returns the email if valid and not expired."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        if payload.get("type") != "password_reset":
            return None
        return payload.get("sub")
    except JWTError:
        return None


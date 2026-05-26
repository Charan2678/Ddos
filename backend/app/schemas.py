import datetime
from typing import List, Optional, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict

# ==========================================
# AUTHENTICATION SCHEMAS
# ==========================================

class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    username_or_email: str
    password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=6)

class UserResponse(UserBase):
    id: int
    is_admin: bool
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenData(BaseModel):
    username: Optional[str] = None

# ==========================================
# DATASET SCHEMAS
# ==========================================

class DatasetResponse(BaseModel):
    id: int
    name: str
    file_path: str
    row_count: int
    features: Optional[str] = None
    uploaded_by: int
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

# ==========================================
# ML MODEL SCHEMAS
# ==========================================

class ModelResponse(BaseModel):
    id: int
    name: str
    algorithm: str
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    training_time: float
    dataset_id: int
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

class ModelComparisonResponse(BaseModel):
    champion: str
    models: List[ModelResponse]

# ==========================================
# PREDICTION SCHEMAS
# ==========================================

class PredictionCreate(BaseModel):
    # Dictionary containing raw packet feature values
    input_data: dict

class PredictionResponse(BaseModel):
    id: int
    input_data: dict
    prediction_label: str
    confidence: float
    threat_level: str
    model_id: Optional[int] = None
    model_name: Optional[str] = None
    model_algorithm: Optional[str] = None
    user_id: Optional[int] = None
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

# ==========================================
# SYSTEM LOGS & REPORTS SCHEMAS
# ==========================================

class SystemLogResponse(BaseModel):
    id: int
    action: str
    details: str
    user_id: Optional[int] = None
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

class ReportResponse(BaseModel):
    id: int
    title: str
    file_path: str
    report_type: str
    created_by: int
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

class BatchPredictionItem(BaseModel):
    source_ip: str
    prediction_label: str
    threat_level: str
    confidence: float

class BatchPredictionResponse(BaseModel):
    file_name: str
    total_scanned: int
    benign_count: int
    attack_count: int
    attack_types: dict
    model_name: Optional[str] = None
    model_algorithm: Optional[str] = None
    anomalies: List[BatchPredictionItem]

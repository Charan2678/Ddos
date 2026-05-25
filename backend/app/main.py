import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database import engine, Base, get_db
from app.config import settings

# Import API Routers
from app.routes import auth, datasets, ml, predict, reports, admin

# Create required directories automatically at server startup
REQUIRED_DIRS = ["datasets", "models", "uploads", "reports"]
for directory in REQUIRED_DIRS:
    os.makedirs(directory, exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    print("Starting up server...")
    print("Initializing database tables...")
    # This automatically creates all database tables if they do not exist
    Base.metadata.create_all(bind=engine)
    yield
    # Shutdown actions
    print("Shutting down server...")

app = FastAPI(
    title="DDoS Detection & Classification API",
    description="Backend API for real-time DDoS classification using Machine Learning models",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration - enables React frontend to fetch backend resources
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, replace with specific frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Sub-Routers
app.include_router(auth.router)
app.include_router(datasets.router)
app.include_router(ml.router)
app.include_router(predict.router)
app.include_router(reports.router)
app.include_router(admin.router)

@app.get("/")
def read_root():
    return {"message": "DDoS Detection API is running. Go to /docs for API documentation."}

@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    try:
        # Run a simple query to verify the database connection is alive
        db.execute(text("SELECT 1"))
        db_status = "healthy"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
    
    return {
        "status": "online",
        "database": db_status
    }

from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker
from app.config import settings
from app.database import Base, engine, SessionLocal
from app.models import User
from app.security import get_password_hash

print(f"Connecting to: {settings.DATABASE_URL}")

def init_db():
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    
    # Check if tables were created
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"Tables in DB: {tables}")
    
    db = SessionLocal()
    try:
        # Check if admin exists
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            print("Creating default admin user...")
            admin_user = User(
                username="admin",
                email="admin@shield.com",
                hashed_password=get_password_hash("admin123"),
                is_admin=True
            )
            db.add(admin_user)
            db.commit()
            print("Admin user created successfully! (username: admin@shield.com, password: admin123)")
        else:
            print("Admin user already exists.")
            
        analyst = db.query(User).filter(User.username == "analyst").first()
        if not analyst:
            print("Creating default analyst user...")
            analyst_user = User(
                username="analyst",
                email="analyst@shield.com",
                hashed_password=get_password_hash("analyst123"),
                is_admin=False
            )
            db.add(analyst_user)
            db.commit()
            print("Analyst user created successfully! (username: analyst@shield.com, password: analyst123)")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_db()

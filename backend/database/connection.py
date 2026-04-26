"""Database connection and session management utilities."""
from sqlalchemy.orm import Session
from backend.database.models import SessionLocal


def get_db_session() -> Session:
    """Get a database session."""
    return SessionLocal()


def get_db():
    """FastAPI dependency for database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
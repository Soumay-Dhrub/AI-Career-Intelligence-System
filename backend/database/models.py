"""Database models for the Career Intelligence System using SQLAlchemy."""
from datetime import datetime
from typing import List, Optional

from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Text, ForeignKey,
    Boolean, JSON, create_engine
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker, Session

from backend.core.config import settings

Base = declarative_base()

# Database engine and session
engine = create_engine(settings.DATABASE_URL, echo=settings.DATABASE_ECHO)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Student(Base):
    """Student profile information."""
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=True)  # For authentication
    cgpa = Column(Float, nullable=True)
    branch = Column(String(100), nullable=True)
    year = Column(Integer, nullable=True)  # 1, 2, 3, 4
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    skills = relationship("Skills", back_populates="student", uselist=False, cascade="all, delete-orphan")
    internships = relationship("Internship", back_populates="student", cascade="all, delete-orphan")
    resumes = relationship("Resume", back_populates="student", cascade="all, delete-orphan")
    behavioral_data = relationship("BehavioralData", back_populates="student", cascade="all, delete-orphan")
    predictions = relationship("Prediction", back_populates="student", cascade="all, delete-orphan")


class Skills(Base):
    """Technical and soft skills assessment."""
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, unique=True)

    # Technical skills
    dsa_score = Column(Float, nullable=True)  # Data Structures & Algorithms
    aptitude_score = Column(Float, nullable=True)
    communication_score = Column(Float, nullable=True)
    projects_count = Column(Integer, default=0)

    # Additional skills (JSON for flexibility)
    technical_skills = Column(JSON, default=list)  # List of technical skills
    soft_skills = Column(JSON, default=list)      # List of soft skills

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    student = relationship("Student", back_populates="skills")


class Internship(Base):
    """Internship experience details."""
    __tablename__ = "internships"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)

    duration_months = Column(Float, nullable=False)
    domain = Column(String(100), nullable=True)
    company_tier = Column(Integer, nullable=False)  # 1=top, 2=good, 3=average, 4=low
    project_complexity = Column(Float, nullable=True)  # 0.0 to 1.0
    company_name = Column(String(255), nullable=True)
    role = Column(String(255), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    student = relationship("Student", back_populates="internships")


class Resume(Base):
    """Resume content and analysis."""
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)

    resume_text = Column(Text, nullable=True)
    resume_score = Column(Float, nullable=True)
    extracted_skills = Column(JSON, default=list)
    missing_skills = Column(JSON, default=list)
    file_path = Column(String(500), nullable=True)  # Path to uploaded resume file

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    student = relationship("Student", back_populates="resumes")


class BehavioralData(Base):
    """Daily behavioral and study pattern data."""
    __tablename__ = "behavioral_data"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)

    date = Column(DateTime, nullable=False, index=True)
    study_hours = Column(Float, default=0.0)
    coding_activity = Column(Float, default=0.0)  # Hours spent coding
    consistency_score = Column(Float, nullable=True)  # Daily consistency metric

    # Additional metrics
    assignments_completed = Column(Integer, default=0)
    tests_taken = Column(Integer, default=0)
    projects_worked = Column(Integer, default=0)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    student = relationship("Student", back_populates="behavioral_data")


class Prediction(Base):
    """ML model predictions and analysis results."""
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)

    # Placement predictions
    placement_probability = Column(Float, nullable=True)
    risk_level = Column(String(20), nullable=True)  # "Low", "Medium", "High"

    # Analysis results
    burnout_risk = Column(String(20), nullable=True)  # "Low", "Medium", "High"
    consistency_score = Column(Float, nullable=True)
    internship_score = Column(Float, nullable=True)
    placement_boost = Column(Float, nullable=True)

    # Failure analysis
    failure_reasons = Column(JSON, default=list)  # List of failure reasons
    weak_areas = Column(JSON, default=list)      # List of weak academic areas

    # Roadmap
    roadmap = Column(JSON, default=list)  # List of roadmap milestones

    # Metadata
    model_version = Column(String(50), nullable=True)
    prediction_date = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    student = relationship("Student", back_populates="predictions")


def get_db() -> Session:
    """Dependency to get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    """Create all database tables."""
    Base.metadata.create_all(bind=engine)


def drop_tables():
    """Drop all database tables."""
    Base.metadata.drop_all(bind=engine)


if __name__ == "__main__":
    # Create tables when run directly
    create_tables()
    print("Database tables created successfully!")
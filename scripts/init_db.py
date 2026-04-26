"""Database initialization and migration script."""
import os
from pathlib import Path

from backend.database.models import create_tables, drop_tables
from backend.core.config import settings


def init_database():
    """Initialize the database with tables."""
    print("Creating database tables...")
    create_tables()
    print("Database tables created successfully!")


def reset_database():
    """Reset the database (drop and recreate all tables)."""
    confirm = input("This will delete all data. Are you sure? (yes/no): ")
    if confirm.lower() == 'yes':
        print("Dropping existing tables...")
        drop_tables()
        print("Recreating tables...")
        create_tables()
        print("Database reset complete!")
    else:
        print("Operation cancelled.")


def seed_sample_data():
    """Add sample data for testing."""
    from backend.database.connection import SessionLocal
    from backend.database.models import Student, Skills, Internship, Resume, BehavioralData
    from backend.services.auth_service import auth_service
    from datetime import datetime, timedelta
    import random

    db = SessionLocal()

    try:
        # Create sample student
        student = auth_service.create_user(
            db=db,
            email="john.doe@example.com",
            password="pass123",
            name="John Doe",
            cgpa=8.5,
            branch="Computer Science",
            year=3
        )

        # Add skills
        skills = Skills(
            student_id=student.id,
            dsa_score=75.0,
            aptitude_score=80.0,
            communication_score=70.0,
            projects_count=5,
            technical_skills=["Python", "JavaScript", "SQL"],
            soft_skills=["Communication", "Teamwork"]
        )
        db.add(skills)

        # Add internship
        internship = Internship(
            student_id=student.id,
            duration_months=6,
            company_tier=2,
            project_complexity=0.8,
            company_name="Tech Solutions Inc.",
            role="Software Developer Intern",
            domain="Software Development"
        )
        db.add(internship)

        # Add resume
        resume = Resume(
            student_id=student.id,
            resume_text="Experienced software developer with Python and web development skills.",
            resume_score=0.75,
            extracted_skills=["Python", "JavaScript"],
            missing_skills=["Machine Learning", "AWS"]
        )
        db.add(resume)

        # Add behavioral data (last 30 days)
        base_date = datetime.utcnow()
        for i in range(30):
            date = base_date - timedelta(days=i)
            behavioral_data = BehavioralData(
                student_id=student.id,
                date=date,
                study_hours=random.uniform(4, 10),
                coding_activity=random.uniform(2, 8),
                consistency_score=random.uniform(0.5, 1.0),
                assignments_completed=random.randint(0, 3),
                tests_taken=random.randint(0, 1),
                projects_worked=random.randint(0, 1)
            )
            db.add(behavioral_data)

        db.commit()
        print("Sample data added successfully!")
        print(f"Sample student created with ID: {student.id}")
        print("Email: john.doe@example.com")
        print("Password: password123")

    except Exception as e:
        db.rollback()
        print(f"Error adding sample data: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python init_db.py [init|reset|seed]")
        sys.exit(1)

    command = sys.argv[1]

    if command == "init":
        init_database()
    elif command == "reset":
        reset_database()
    elif command == "seed":
        seed_sample_data()
    else:
        print("Invalid command. Use: init, reset, or seed")
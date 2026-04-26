"""Student management API routes."""
from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database.connection import get_db
from backend.database.models import Student, Skills, Internship, Resume, BehavioralData, Prediction
from backend.routes.auth import get_current_user
from backend.schemas.api import (
    StudentCreate, StudentResponse, StudentUpdate, SkillsResponse, SkillsCreate, SkillsUpdate,
    InternshipResponse, InternshipCreate, InternshipUpdate,
    ResumeResponse, ResumeCreate, ResumeUpdate,
    BehavioralDataResponse, BehavioralDataCreate, BehavioralDataUpdate,
    PredictionResponse
)

router = APIRouter(prefix="/students", tags=["students"])


@router.post("/", response_model=StudentResponse)
async def create_student(
    student_data: StudentCreate,
    db: Session = Depends(get_db),
    current_user: Student = Depends(get_current_user)
) -> Any:
    """Create a new student profile (admin only)."""
    # Check if email already exists
    existing_student = db.query(Student).filter(Student.email == student_data.email).first()
    if existing_student:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student with this email already exists"
        )

    student = Student(**student_data.dict())
    db.add(student)
    db.commit()
    db.refresh(student)

    return StudentResponse.from_orm(student)


@router.get("/{student_id}", response_model=StudentResponse)
async def get_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: Student = Depends(get_current_user)
) -> Any:
    """Get student profile by ID."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )

    return StudentResponse.from_orm(student)


@router.put("/{student_id}", response_model=StudentResponse)
async def update_student(
    student_id: int,
    student_data: StudentUpdate,
    db: Session = Depends(get_db),
    current_user: Student = Depends(get_current_user)
) -> Any:
    """Update student profile."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )

    # Update fields
    update_data = student_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(student, field, value)

    db.commit()
    db.refresh(student)

    return StudentResponse.from_orm(student)


@router.delete("/{student_id}")
async def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: Student = Depends(get_current_user)
) -> Any:
    """Delete student profile."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )

    db.delete(student)
    db.commit()

    return {"message": "Student deleted successfully"}


# Skills routes
@router.get("/{student_id}/skills", response_model=SkillsResponse)
async def get_student_skills(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: Student = Depends(get_current_user)
) -> Any:
    """Get student skills."""
    skills = db.query(Skills).filter(Skills.student_id == student_id).first()
    if not skills:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skills not found for this student"
        )

    return SkillsResponse.from_orm(skills)


@router.post("/{student_id}/skills", response_model=SkillsResponse)
async def create_student_skills(
    student_id: int,
    skills_data: SkillsCreate,
    db: Session = Depends(get_db),
    current_user: Student = Depends(get_current_user)
) -> Any:
    """Create or update student skills."""
    # Check if student exists
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )

    # Check if skills already exist
    existing_skills = db.query(Skills).filter(Skills.student_id == student_id).first()
    if existing_skills:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Skills already exist for this student. Use PUT to update."
        )

    skills = Skills(student_id=student_id, **skills_data.dict())
    db.add(skills)
    db.commit()
    db.refresh(skills)

    return SkillsResponse.from_orm(skills)


@router.put("/{student_id}/skills", response_model=SkillsResponse)
async def update_student_skills(
    student_id: int,
    skills_data: SkillsUpdate,
    db: Session = Depends(get_db),
    current_user: Student = Depends(get_current_user)
) -> Any:
    """Update student skills."""
    skills = db.query(Skills).filter(Skills.student_id == student_id).first()
    if not skills:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skills not found for this student"
        )

    update_data = skills_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(skills, field, value)

    db.commit()
    db.refresh(skills)

    return SkillsResponse.from_orm(skills)


# Internship routes
@router.get("/{student_id}/internships", response_model=List[InternshipResponse])
async def get_student_internships(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: Student = Depends(get_current_user)
) -> Any:
    """Get all internships for a student."""
    internships = db.query(Internship).filter(Internship.student_id == student_id).all()
    return [InternshipResponse.from_orm(internship) for internship in internships]


@router.post("/{student_id}/internships", response_model=InternshipResponse)
async def create_internship(
    student_id: int,
    internship_data: InternshipCreate,
    db: Session = Depends(get_db),
    current_user: Student = Depends(get_current_user)
) -> Any:
    """Create a new internship for a student."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )

    internship = Internship(student_id=student_id, **internship_data.dict())
    db.add(internship)
    db.commit()
    db.refresh(internship)

    return InternshipResponse.from_orm(internship)


# Resume routes
@router.get("/{student_id}/resume", response_model=ResumeResponse)
async def get_student_resume(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: Student = Depends(get_current_user)
) -> Any:
    """Get student resume."""
    resume = db.query(Resume).filter(Resume.student_id == student_id).first()
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found for this student"
        )

    return ResumeResponse.from_orm(resume)


@router.post("/{student_id}/resume", response_model=ResumeResponse)
async def create_student_resume(
    student_id: int,
    resume_data: ResumeCreate,
    db: Session = Depends(get_db),
    current_user: Student = Depends(get_current_user)
) -> Any:
    """Create or update student resume."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )

    existing_resume = db.query(Resume).filter(Resume.student_id == student_id).first()
    if existing_resume:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resume already exists for this student. Use PUT to update."
        )

    resume = Resume(student_id=student_id, **resume_data.dict())
    db.add(resume)
    db.commit()
    db.refresh(resume)

    return ResumeResponse.from_orm(resume)


# Behavioral data routes
@router.get("/{student_id}/behavioral-data", response_model=List[BehavioralDataResponse])
async def get_student_behavioral_data(
    student_id: int,
    limit: int = 30,
    db: Session = Depends(get_db),
    current_user: Student = Depends(get_current_user)
) -> Any:
    """Get behavioral data for a student."""
    behavioral_data = db.query(BehavioralData).filter(
        BehavioralData.student_id == student_id
    ).order_by(BehavioralData.date.desc()).limit(limit).all()

    return [BehavioralDataResponse.from_orm(data) for data in behavioral_data]


@router.post("/{student_id}/behavioral-data", response_model=BehavioralDataResponse)
async def create_behavioral_data(
    student_id: int,
    data: BehavioralDataCreate,
    db: Session = Depends(get_db),
    current_user: Student = Depends(get_current_user)
) -> Any:
    """Create behavioral data entry for a student."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )

    behavioral_data = BehavioralData(student_id=student_id, **data.dict())
    db.add(behavioral_data)
    db.commit()
    db.refresh(behavioral_data)

    return BehavioralDataResponse.from_orm(behavioral_data)


# Prediction routes
@router.get("/{student_id}/predictions", response_model=List[PredictionResponse])
async def get_student_predictions(
    student_id: int,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: Student = Depends(get_current_user)
) -> Any:
    """Get prediction history for a student."""
    predictions = db.query(Prediction).filter(
        Prediction.student_id == student_id
    ).order_by(Prediction.prediction_date.desc()).limit(limit).all()

    return [PredictionResponse.from_orm(prediction) for prediction in predictions]
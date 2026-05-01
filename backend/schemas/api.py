"""Pydantic schemas for API requests and responses."""
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, EmailStr, validator


# Authentication schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    name: str
    cgpa: Optional[float] = None
    branch: Optional[str] = None
    year: Optional[int] = Field(None, ge=1, le=4)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class GoogleAuth(BaseModel):
    token: Optional[str] = None
    credential: Optional[str] = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    email: Optional[str] = None


# Student schemas
class StudentBase(BaseModel):
    name: str
    email: EmailStr
    cgpa: Optional[float] = None
    branch: Optional[str] = None
    year: Optional[int] = Field(None, ge=1, le=4)


class StudentCreate(StudentBase):
    password: str = Field(..., min_length=6)


class StudentUpdate(BaseModel):
    name: Optional[str] = None
    cgpa: Optional[float] = None
    branch: Optional[str] = None
    year: Optional[int] = Field(None, ge=1, le=4)


class StudentResponse(StudentBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    token: str
    user: StudentResponse


# Skills schemas
class SkillsBase(BaseModel):
    dsa_score: Optional[float] = Field(None, ge=0, le=100)
    aptitude_score: Optional[float] = Field(None, ge=0, le=100)
    communication_score: Optional[float] = Field(None, ge=0, le=100)
    projects_count: int = Field(default=0, ge=0)
    technical_skills: List[str] = []
    soft_skills: List[str] = []


class SkillsCreate(SkillsBase):
    pass


class SkillsUpdate(SkillsBase):
    pass


class SkillsResponse(SkillsBase):
    id: int
    student_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Internship schemas
class InternshipBase(BaseModel):
    duration_months: float = Field(..., gt=0)
    company_tier: int = Field(..., ge=1, le=4)  # 1=top, 4=low
    project_complexity: Optional[float] = Field(None, ge=0, le=1)
    company_name: Optional[str] = None
    role: Optional[str] = None


class InternshipCreate(InternshipBase):
    pass


class InternshipUpdate(InternshipBase):
    pass


class InternshipResponse(InternshipBase):
    id: int
    student_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Resume schemas
class ResumeBase(BaseModel):
    resume_text: Optional[str] = None
    resume_score: Optional[float] = Field(None, ge=0, le=1)
    extracted_skills: List[str] = []
    missing_skills: List[str] = []
    file_path: Optional[str] = None


class ResumeCreate(ResumeBase):
    pass


class ResumeUpdate(ResumeBase):
    pass


class ResumeResponse(ResumeBase):
    id: int
    student_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Behavioral Data schemas
class BehavioralDataBase(BaseModel):
    date: datetime
    study_hours: float = Field(default=0.0, ge=0)
    coding_activity: float = Field(default=0.0, ge=0)
    consistency_score: Optional[float] = Field(None, ge=0, le=1)
    assignments_completed: int = Field(default=0, ge=0)
    tests_taken: int = Field(default=0, ge=0)
    projects_worked: int = Field(default=0, ge=0)


class BehavioralDataCreate(BehavioralDataBase):
    pass


class BehavioralDataUpdate(BehavioralDataBase):
    pass


class BehavioralDataResponse(BehavioralDataBase):
    id: int
    student_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Prediction schemas
class PredictionBase(BaseModel):
    placement_probability: Optional[float] = Field(None, ge=0, le=1)
    risk_level: Optional[str] = Field(None, pattern="^(Low|Medium|High)$")
    burnout_risk: Optional[str] = Field(None, pattern="^(Low|Medium|High)$")
    consistency_score: Optional[float] = Field(None, ge=0, le=1)
    internship_score: Optional[float] = None
    placement_boost: Optional[float] = None
    failure_reasons: List[str] = []
    weak_areas: List[str] = []
    roadmap: List[Dict[str, Any]] = []


class PredictionCreate(PredictionBase):
    pass


class PredictionUpdate(PredictionBase):
    pass


class PredictionResponse(PredictionBase):
    id: int
    student_id: int
    model_version: Optional[str]
    prediction_date: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Analysis schemas
class AnalyzeRequest(BaseModel):
    """Request for full placement analysis."""
    pass  # This would be populated based on student data


class PlacementReport(BaseModel):
    """Complete placement readiness report."""
    student_id: int
    placement_probability: float
    risk_level: str
    burnout_risk: str
    consistency_score: float
    resume_score: float
    internship_score: float
    placement_boost: float
    failure_reasons: List[str]
    weak_areas: List[str]
    roadmap: List[Dict[str, Any]]
    recommendations: List[str] = []


# Roadmap schemas
class SkillGap(BaseModel):
    current_skills: List[str]
    target_skills: List[str]
    target_role: str


class RoadmapRequest(SkillGap):
    pass


class Milestone(BaseModel):
    skill: str
    resources: List[str]
    priority: int
    estimated_time: Optional[str] = None


class RoadmapResponse(BaseModel):
    milestones: List[Milestone]
    total_estimated_time: Optional[str] = None


# Failure Analysis schemas
class PerformanceData(BaseModel):
    subject_scores: List[Dict[str, Any]]  # [{"subject": "Math", "score": 85}, ...]
    cgpa: float


class FailureAnalysisRequest(PerformanceData):
    pass


class FailureAnalysisResponse(BaseModel):
    failure_reasons: List[str]
    weak_areas: List[str]
    recommendations: List[str]


# Burnout Analysis schemas
class StudyLog(BaseModel):
    daily_hours: List[float]
    dates: List[str]


class BurnoutRequest(StudyLog):
    pass


class BurnoutResponse(BaseModel):
    burnout_risk: str
    consistency_score: float
    recommendations: List[str]


# Resume Analysis schemas
class ResumeAnalysisRequest(BaseModel):
    resume_text: str
    job_description: str


class ResumeAnalysisResponse(BaseModel):
    resume_score: float
    missing_skills: List[str]
    extracted_skills: List[str]
    recommendations: List[str]


# Internship Impact schemas
class InternshipImpactRequest(BaseModel):
    duration_months: float
    company_tier: int
    role_relevance: float
    project_count: int


class InternshipImpactResponse(BaseModel):
    internship_score: float
    placement_boost: float
    recommendations: List[str]
"""Pydantic schemas for the Failure Intelligence System."""
from typing import List, Literal, Optional, Dict
from pydantic import BaseModel, field_validator


# ── Legacy (kept for backward compat) ────────────────────────────────────────
class SubjectScore(BaseModel):
    subject: str
    score: float

class PerformanceData(BaseModel):
    subject_scores: List[SubjectScore]
    backlogs: int = 0
    project_failures: int = 0

    @field_validator("subject_scores")
    @classmethod
    def at_least_one(cls, v):
        if len(v) < 1:
            raise ValueError("At least one subject score is required")
        return v

class FailureRequest(BaseModel):
    performance: PerformanceData

class FailureResponse(BaseModel):
    failure_reasons: List[str]
    weak_areas: List[str]


# ── New: Full Student Profile ─────────────────────────────────────────────────
DSALevel = Literal["none", "beginner", "easy", "medium", "hard"]
ProjectType = Literal["none", "basic", "real-world", "scalable"]
ConsistencyLevel = Literal["very_irregular", "irregular", "moderate", "regular", "very_regular"]

class StudentAssessment(BaseModel):
    # Academic
    year: int                                    # 1–4
    domain: str                                  # "Web Dev", "AI/ML", "Data Science", etc.
    tech_stack: List[str]                        # ["React", "Node.js", "Python"]

    # Core skills
    dsa_level: DSALevel = "beginner"
    dsa_problems_solved: int = 0                 # number of problems solved
    coding_ability: int = 5                      # 1–10 self-rating
    aptitude_level: int = 5                      # 1–10
    verbal_ability: int = 5                      # 1–10

    # Projects & experience
    project_count: int = 0
    project_type: ProjectType = "basic"
    has_internship: bool = False
    internship_months: int = 0
    rejection_count: int = 0

    # Behavioral
    daily_study_hours: float = 2.0
    consistency: ConsistencyLevel = "moderate"
    mock_interviews_done: int = 0

    # Optional target
    target_company: Optional[str] = None
    target_role: Optional[str] = None

    @field_validator("year")
    @classmethod
    def valid_year(cls, v):
        if not 1 <= v <= 4:
            raise ValueError("year must be 1–4")
        return v

    @field_validator("coding_ability", "aptitude_level", "verbal_ability")
    @classmethod
    def valid_rating(cls, v):
        if not 1 <= v <= 10:
            raise ValueError("rating must be 1–10")
        return v


class DimensionScore(BaseModel):
    name: str
    score: float          # 0–100
    weight: float         # contribution weight
    label: str            # "Strong" / "Average" / "Weak"
    insight: str          # specific observation


class RootCause(BaseModel):
    cause: str
    severity: Literal["critical", "moderate", "minor"]
    explanation: str
    fix: str


class WeeklyPlan(BaseModel):
    week: str
    focus: str
    tasks: List[str]
    daily_target: str


class CompanyReadiness(BaseModel):
    company: str
    ready: bool
    readiness_pct: float
    missing: List[str]
    prep_weeks: int
    verdict: str


class FailureIntelligenceResponse(BaseModel):
    # Scores
    overall_score: float          # 0–100
    failure_risk_pct: float       # 0–100
    placement_readiness_pct: float

    # Dimensions
    dimensions: List[DimensionScore]

    # Diagnosis
    strengths: List[str]
    weaknesses: List[str]
    root_causes: List[RootCause]
    intelligent_insights: List[str]   # mentor-like observations

    # Domain & company
    domain_readiness: Dict[str, float]   # skill → coverage %
    company_readiness: Optional[CompanyReadiness] = None

    # Roadmap
    action_plan: List[WeeklyPlan]
    skill_gaps: List[str]

    # Summary
    mentor_summary: str

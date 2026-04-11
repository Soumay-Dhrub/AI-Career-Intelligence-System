"""Pydantic schemas for the orchestrator /analyze endpoint."""
from typing import List, Literal

from pydantic import BaseModel

from backend.schemas.burnout import StudyLog
from backend.schemas.failure import PerformanceData
from backend.schemas.internship import InternshipRequest
from backend.schemas.roadmap import Milestone, SkillGap


class AnalyzeRequest(BaseModel):
    """Composite request body for POST /analyze."""
    study_log: StudyLog
    resume_text: str
    job_description: str
    internship: InternshipRequest
    performance: PerformanceData
    skill_gap: SkillGap


class PlacementReport(BaseModel):
    """Aggregated placement readiness report returned by POST /analyze."""
    consistency_score: float
    burnout_risk: Literal["Low", "Medium", "High"]
    resume_score: float
    missing_skills: List[str]
    internship_score: float
    placement_boost: float
    failure_reasons: List[str]
    weak_areas: List[str]
    roadmap: List[Milestone]
    placement_probability: float   # 0.0 – 1.0
    risk_level: Literal["Low", "Medium", "High"]

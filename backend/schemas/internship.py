"""Pydantic schemas for the enhanced internship endpoint."""
from typing import List, Literal, Optional
from pydantic import BaseModel, field_validator


# ── Legacy request (kept for backward compat) ─────────────────────────────────
class InternshipRequest(BaseModel):
    duration_months: int
    company_tier: int
    role_relevance: float
    project_count: int

    @field_validator("duration_months")
    @classmethod
    def non_negative_duration(cls, v: int) -> int:
        if v < 0:
            raise ValueError("duration cannot be negative")
        return v

    @field_validator("company_tier")
    @classmethod
    def valid_tier(cls, v: int) -> int:
        if v not in (1, 2, 3):
            raise ValueError("company_tier must be 1, 2, or 3")
        return v

    @field_validator("role_relevance")
    @classmethod
    def valid_relevance(cls, v: float) -> float:
        if not 0.0 <= v <= 1.0:
            raise ValueError("role_relevance must be 0.0–1.0")
        return v


class InternshipResponse(BaseModel):
    internship_score: float
    placement_boost: float


# ── New profile-based request ─────────────────────────────────────────────────
class StudentProfile(BaseModel):
    year: int                          # 1–4
    course: str                        # BTech, BCA, etc.
    cgpa: float                        # 0–10
    skills: List[str]
    project_count: int
    project_domains: List[str]
    target_domain: str
    ats_score: Optional[float] = 50.0  # from Resume Analyzer
    resume_score: Optional[float] = 0.5

    @field_validator("year")
    @classmethod
    def valid_year(cls, v: int) -> int:
        if not 1 <= v <= 4:
            raise ValueError("year must be 1–4")
        return v

    @field_validator("cgpa")
    @classmethod
    def valid_cgpa(cls, v: float) -> float:
        if not 0.0 <= v <= 10.0:
            raise ValueError("cgpa must be 0–10")
        return v


class PlacementImpact(BaseModel):
    level: Literal["High", "Medium", "Low"]
    explanation: str


class CompanyRecommendation(BaseModel):
    company: str
    role: str
    tier: int
    tier_label: str
    match_score: float
    selection_probability: float
    required_skills: List[str]
    matched_skills: List[str]
    missing_skills: List[str]
    location: str
    salary_range: str
    placement_impact: PlacementImpact
    reason: str


class ProfileAnalysisResponse(BaseModel):
    readiness_score: float
    readiness_label: str
    company_recommendations: List[CompanyRecommendation]
    placement_impact_summary: str
    improvement_suggestions: List[str]
    top_missing_skills: List[str]
    profile_strengths: List[str]

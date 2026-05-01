"""Pydantic schemas for the enhanced resume/ATS endpoint."""
from typing import Dict, List, Optional
from pydantic import BaseModel, field_validator


class ResumeRequest(BaseModel):
    resume_text: str
    job_description: str

    @field_validator("resume_text", "job_description")
    @classmethod
    def not_empty(cls, v: str, info) -> str:
        if not v.strip():
            raise ValueError(f"{info.field_name} cannot be empty")
        return v


class ImprovementSuggestion(BaseModel):
    category: str
    original: Optional[str] = None
    suggestion: str
    reason: str


class ResumeResponse(BaseModel):
    ats_score: float
    resume_score: float
    keyword_match: float
    skill_match_pct: float
    matched_skills: List[str]
    missing_skills: List[str]
    weak_keywords: List[str]
    suggestions: List[ImprovementSuggestion]
    role_specific_tips: List[str]
    template_recommendation: str
    template_reason: str
    summary: str
    section_breakdown: Optional[Dict[str, float]] = None

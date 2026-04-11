"""Pydantic schemas for the resume endpoint."""
from typing import List

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


class ResumeResponse(BaseModel):
    resume_score: float        # 0.0 – 1.0
    keyword_match: float       # 0.0 – 100.0 (percentage)
    missing_skills: List[str]

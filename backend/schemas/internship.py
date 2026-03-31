"""Pydantic schemas for the internship endpoint."""
from pydantic import BaseModel, field_validator


class InternshipRequest(BaseModel):
    duration_months: int       # >= 0
    company_tier: int          # 1 (top) – 3 (other)
    role_relevance: float      # 0.0 – 1.0
    project_count: int         # >= 0

    @field_validator("duration_months")
    @classmethod
    def non_negative_duration(cls, v: int) -> int:
        if v < 0:
            raise ValueError("Internship duration cannot be negative")
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
            raise ValueError("role_relevance must be between 0.0 and 1.0")
        return v


class InternshipResponse(BaseModel):
    internship_score: float    # 0.0 – 10.0
    placement_boost: float     # 0.0 – 1.0

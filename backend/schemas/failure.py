"""Pydantic schemas for the failure analysis endpoint."""
from typing import List

from pydantic import BaseModel, field_validator


class SubjectScore(BaseModel):
    subject: str
    score: float   # 0 – 100


class PerformanceData(BaseModel):
    subject_scores: List[SubjectScore]
    backlogs: int = 0
    project_failures: int = 0

    @field_validator("subject_scores")
    @classmethod
    def at_least_one(cls, v: List[SubjectScore]) -> List[SubjectScore]:
        if len(v) < 1:
            raise ValueError("At least one subject score is required")
        return v


class FailureRequest(BaseModel):
    performance: PerformanceData


class FailureResponse(BaseModel):
    failure_reasons: List[str]
    weak_areas: List[str]

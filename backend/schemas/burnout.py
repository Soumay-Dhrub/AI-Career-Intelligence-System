"""Pydantic schemas for the burnout endpoint."""
from datetime import date
from typing import List, Literal

from pydantic import BaseModel, field_validator


class StudyLog(BaseModel):
    daily_hours: List[float]
    dates: List[date]

    @field_validator("daily_hours")
    @classmethod
    def min_seven_days(cls, v: List[float]) -> List[float]:
        if len(v) < 7:
            raise ValueError("Minimum 7 days of study logs required")
        for h in v:
            if h < 0:
                raise ValueError("Study hours cannot be negative")
        return v


class BurnoutRequest(BaseModel):
    study_log: StudyLog


class BurnoutResponse(BaseModel):
    consistency_score: float   # 0.0 – 1.0
    burnout_risk: Literal["Low", "Medium", "High"]

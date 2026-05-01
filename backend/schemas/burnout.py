"""Pydantic schemas for the enhanced burnout endpoint."""
from datetime import date
from typing import List, Literal, Optional

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
            if h < 0 or h > 24:
                raise ValueError("Study hours must be between 0 and 24")
        return v


class DailySchedule(BaseModel):
    """24-hour breakdown for a single day."""
    study_hours: float
    sleep_hours: float
    college_hours: float
    break_hours: float
    other_hours: float

    @field_validator("study_hours", "sleep_hours", "college_hours", "break_hours", "other_hours")
    @classmethod
    def non_negative(cls, v: float) -> float:
        if v < 0:
            raise ValueError("Hours cannot be negative")
        return v


class BurnoutRequest(BaseModel):
    study_log: StudyLog
    daily_schedule: Optional[DailySchedule] = None
    mood_description: Optional[str] = None   # free-text mood/stress input


class TimeBlock(BaseModel):
    start: str   # "08:00"
    end: str     # "09:30"
    activity: str
    category: Literal["study", "break", "sleep", "college", "other"]


class EmotionTag(BaseModel):
    label: str
    confidence: float


class BurnoutResponse(BaseModel):
    consistency_score: float                    # 0.0 – 1.0
    burnout_risk: Literal["Low", "Medium", "High"]
    burnout_level: float                        # 0.0 – 1.0 numeric
    workload_ratio: float                       # study / sleep ratio
    rest_efficiency: float                      # 0.0 – 1.0
    overwork_detected: bool
    sleep_deprivation_detected: bool
    emotion_analysis: Optional[dict] = None     # sentiment + emotion tags
    optimized_schedule: Optional[List[TimeBlock]] = None
    recommendations: List[str]
    insights: str                               # human-friendly summary

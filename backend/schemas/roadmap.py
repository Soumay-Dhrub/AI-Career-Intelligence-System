"""Pydantic schemas for the intelligent roadmap endpoint."""
from typing import List, Literal, Optional, Dict
from pydantic import BaseModel, field_validator


# ── Legacy (kept for backward compat) ────────────────────────────────────────
class SkillGap(BaseModel):
    current_skills: List[str]
    target_skills: List[str]
    target_role: str

    @field_validator("target_skills")
    @classmethod
    def at_least_one_target(cls, v):
        if len(v) < 1:
            raise ValueError("At least one target skill required")
        return v


class Milestone(BaseModel):
    skill: str
    resources: List[str]
    priority: int


class RoadmapRequest(BaseModel):
    skill_gap: SkillGap


class RoadmapResponse(BaseModel):
    roadmap: List[Milestone]


# ── New: Intelligent Roadmap ──────────────────────────────────────────────────
class RoadmapInput(BaseModel):
    # Academic
    year: int                          # 1–4
    domain: str                        # "Web Dev", "AI/ML", etc.
    target_role: str                   # "Frontend Developer", "SDE", etc.

    # Current state
    known_skills: List[str]
    dsa_level: Literal["none", "beginner", "easy", "medium", "hard"] = "beginner"
    project_count: int = 0
    has_internship: bool = False

    # Goals
    target_companies: List[str] = []
    hours_per_day: float = 3.0

    @field_validator("year")
    @classmethod
    def valid_year(cls, v):
        if not 1 <= v <= 4:
            raise ValueError("year must be 1–4")
        return v

    @field_validator("hours_per_day")
    @classmethod
    def valid_hours(cls, v):
        return max(0.5, min(v, 12.0))


class PhaseTask(BaseModel):
    task: str
    duration_weeks: int
    resources: List[str]
    completed: bool = False


class RoadmapPhase(BaseModel):
    phase_number: int
    title: str
    description: str
    duration_weeks: int
    skills: List[str]
    tasks: List[PhaseTask]
    milestone: str


class DailySchedule(BaseModel):
    dsa_minutes: int
    learning_minutes: int
    project_minutes: int
    revision_minutes: int
    total_hours: float
    schedule: List[Dict[str, str]]   # [{"time": "7:00–8:00", "activity": "DSA"}]


class WeeklyGoal(BaseModel):
    week_number: int
    focus_topic: str
    tasks: List[str]
    target_problems: int
    mock_test: bool


class ProjectIdea(BaseModel):
    title: str
    description: str
    tech_stack: List[str]
    difficulty: Literal["beginner", "intermediate", "advanced"]
    impact: str


class IndustryInsight(BaseModel):
    trend: str
    demand_level: Literal["high", "medium", "low"]
    relevance: str


class IntelligentRoadmapResponse(BaseModel):
    # Summary
    career_path_summary: str
    user_level: Literal["beginner", "intermediate", "advanced"]
    total_weeks: int

    # Industry
    industry_insights: List[IndustryInsight]
    required_skills: List[str]
    skill_gaps: List[str]

    # Roadmap
    phases: List[RoadmapPhase]
    daily_schedule: DailySchedule
    weekly_goals: List[WeeklyGoal]

    # Projects & interview
    project_suggestions: List[ProjectIdea]
    interview_prep: List[str]

    # Mentor insights
    mentor_insights: List[str]
    next_milestone: str

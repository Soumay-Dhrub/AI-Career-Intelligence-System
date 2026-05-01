"""Pydantic schemas for the enhanced Placement Predictor."""
from typing import List, Literal, Optional, Dict
from pydantic import BaseModel


class ModuleScores(BaseModel):
    """Normalized 0-100 scores from each module."""
    core_assessment: float      # DSA + coding + aptitude + verbal
    resume_ats: float           # ATS score from resume analyzer
    failure_risk: float         # inverted failure risk (100 - risk)
    internship_readiness: float # internship score normalized
    roadmap_consistency: float  # study consistency score


class CompanyReadinessItem(BaseModel):
    company: str
    readiness_pct: float
    ready: bool
    missing_skills: List[str]
    prep_weeks: int


class WhatIfScenario(BaseModel):
    scenario: str
    current_score: float
    projected_score: float
    delta: float
    action: str


class PriorityAction(BaseModel):
    rank: int
    action: str
    impact: str
    effort: Literal["low", "medium", "high"]
    timeline: str


class PlacementPrediction(BaseModel):
    # Core scores
    placement_score: float              # 0-100
    readiness_level: Literal["Not Ready", "Needs Improvement", "Almost Ready", "Ready"]
    selection_probability: float        # 0-100 %
    risk_level: Literal["Low", "Medium", "High"]
    confidence_score: float             # 0-100 %

    # Module breakdown
    module_scores: ModuleScores
    score_breakdown: Dict[str, float]   # weighted contributions

    # Insights
    strengths: List[str]
    weaknesses: List[str]
    smart_insights: List[str]           # mentor-like observations
    root_causes: List[str]

    # Skill gaps
    skill_gaps: List[str]
    top_missing_skills: List[str]

    # Company readiness
    company_readiness: List[CompanyReadinessItem]

    # Action plan
    priority_actions: List[PriorityAction]
    weekly_plan: List[str]

    # What-if simulations
    what_if_scenarios: List[WhatIfScenario]

    # Summary
    mentor_summary: str
    next_step: str


class PlacementAnalysisRequest(BaseModel):
    """Rich input aggregating all module data."""
    # Core assessment
    dsa_score: float = 50.0             # 0-100
    coding_ability: float = 50.0        # 0-100
    aptitude_score: float = 50.0        # 0-100
    verbal_score: float = 50.0          # 0-100

    # Resume
    ats_score: float = 50.0             # 0-100
    resume_skill_match: float = 50.0    # 0-100
    missing_skills: List[str] = []

    # Internship
    internship_score: float = 5.0       # 0-10
    has_internship: bool = False
    project_count: int = 0

    # Failure analysis
    failure_risk: float = 50.0          # 0-100 (higher = more risk)
    weak_areas: List[str] = []

    # Roadmap / consistency
    consistency_score: float = 0.5      # 0-1
    study_hours_per_day: float = 3.0
    mock_interviews_done: int = 0

    # Goals
    target_companies: List[str] = []
    target_role: str = "Software Engineer"
    year: int = 3


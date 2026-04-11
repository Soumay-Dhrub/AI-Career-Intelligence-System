"""Pydantic schemas for the roadmap endpoint."""
from typing import List

from pydantic import BaseModel, field_validator


class SkillGap(BaseModel):
    current_skills: List[str]
    target_skills: List[str]
    target_role: str

    @field_validator("target_skills")
    @classmethod
    def at_least_one_target(cls, v: List[str]) -> List[str]:
        if len(v) < 1:
            raise ValueError("At least one target skill must be specified")
        return v


class RoadmapRequest(BaseModel):
    skill_gap: SkillGap


class Milestone(BaseModel):
    skill: str
    resources: List[str]
    priority: int


class RoadmapResponse(BaseModel):
    roadmap: List[Milestone]

"""Property-based tests for RoadmapService.

Property 7: Roadmap milestones are ordered by priority
"""
from hypothesis import given, settings, strategies as st

from backend.schemas.roadmap import RoadmapRequest, SkillGap
from backend.services.model_registry import ModelRegistry
from backend.services.roadmap_service import RoadmapService

_registry = ModelRegistry()

_skill = st.text(min_size=1, max_size=20).filter(str.strip)


# Feature: placement-readiness-system, Property 7: Roadmap milestones are ordered by priority
@given(
    current_skills=st.lists(_skill, min_size=0, max_size=5),
    target_skills=st.lists(_skill, min_size=1, max_size=5),
    target_role=st.text(min_size=1, max_size=30).filter(str.strip),
)
@settings(max_examples=100)
def test_roadmap_sorted_by_priority(current_skills, target_skills, target_role):
    payload = RoadmapRequest(
        skill_gap=SkillGap(current_skills=current_skills, target_skills=target_skills, target_role=target_role)
    )
    result = RoadmapService(_registry).predict(payload)
    priorities = [m.priority for m in result.roadmap]
    assert priorities == sorted(priorities), f"Roadmap not sorted: {priorities}"

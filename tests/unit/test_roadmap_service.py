"""Unit tests for RoadmapService."""
import pytest

from backend.schemas.roadmap import RoadmapRequest, SkillGap
from backend.services.model_registry import ModelRegistry
from backend.services.roadmap_service import RoadmapService


def _registry():
    return ModelRegistry()


def _gap(current, target, role="Backend Engineer"):
    return RoadmapRequest(skill_gap=SkillGap(current_skills=current, target_skills=target, target_role=role))


def test_missing_skills_produce_milestones():
    result = RoadmapService(_registry()).predict(_gap(["Python"], ["Docker", "Kubernetes"]))
    assert len(result.roadmap) == 2


def test_no_missing_skills_returns_empty_roadmap():
    result = RoadmapService(_registry()).predict(_gap(["Python", "Docker"], ["Python", "Docker"]))
    assert result.roadmap == []


def test_milestones_sorted_by_priority():
    result = RoadmapService(_registry()).predict(_gap([], ["Docker", "Kubernetes", "System Design"]))
    priorities = [m.priority for m in result.roadmap]
    assert priorities == sorted(priorities)


def test_each_milestone_has_resources():
    result = RoadmapService(_registry()).predict(_gap([], ["Docker"]))
    for milestone in result.roadmap:
        assert len(milestone.resources) > 0


def test_empty_target_skills_raises_422():
    from fastapi.testclient import TestClient
    from backend.main import app
    from unittest.mock import MagicMock
    app.state.registry = MagicMock()
    client = TestClient(app)
    resp = client.post("/roadmap", json={"skill_gap": {"current_skills": [], "target_skills": [], "target_role": "Dev"}})
    assert resp.status_code == 422

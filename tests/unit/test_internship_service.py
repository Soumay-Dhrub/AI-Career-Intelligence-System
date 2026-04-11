"""Unit tests for InternshipService."""
import pytest

from backend.schemas.internship import InternshipRequest
from backend.services.internship_service import InternshipService
from backend.services.model_registry import ModelRegistry


def _registry():
    return ModelRegistry()


def _payload(**kwargs):
    defaults = dict(duration_months=6, company_tier=2, role_relevance=0.8, project_count=2)
    defaults.update(kwargs)
    return InternshipRequest(**defaults)


def test_score_in_range():
    result = InternshipService(_registry()).predict(_payload())
    assert 0.0 <= result.internship_score <= 10.0


def test_boost_in_range():
    result = InternshipService(_registry()).predict(_payload())
    assert 0.0 <= result.placement_boost <= 1.0


def test_boost_equals_score_over_ten():
    result = InternshipService(_registry()).predict(_payload())
    assert result.placement_boost == pytest.approx(result.internship_score / 10.0, abs=1e-6)


def test_zero_duration_gives_low_score():
    result = InternshipService(_registry()).predict(_payload(duration_months=0, project_count=0, role_relevance=0.0))
    assert result.internship_score < 5.0


def test_negative_duration_raises_422():
    from fastapi.testclient import TestClient
    from backend.main import app
    from unittest.mock import MagicMock
    app.state.registry = MagicMock()
    client = TestClient(app)
    resp = client.post("/internship", json={"duration_months": -1, "company_tier": 1, "role_relevance": 0.5, "project_count": 1})
    assert resp.status_code == 422

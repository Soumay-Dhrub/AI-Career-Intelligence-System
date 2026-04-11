"""Property-based tests for input validation.

Property 1: Invalid payload always returns HTTP 422
Validates: Requirements 2.2, 2.4
"""
from fastapi.testclient import TestClient
from hypothesis import given, settings, strategies as st
from unittest.mock import MagicMock

from backend.main import app
from backend.services.model_registry import MODEL_KEYS


def _client():
    mock_registry = MagicMock()
    mock_registry.status.return_value = {k: "fallback" for k in MODEL_KEYS}
    app.state.registry = mock_registry
    return TestClient(app, raise_server_exceptions=False)


# Feature: placement-readiness-system, Property 1: Invalid payload always returns HTTP 422

@given(bad_hours=st.lists(st.floats(min_value=0.0, max_value=24.0, allow_nan=False), min_size=1, max_size=6))
@settings(max_examples=50)
def test_burnout_short_log_returns_422(bad_hours):
    """StudyLog with fewer than 7 entries must return 422."""
    resp = _client().post("/burnout", json={
        "study_log": {
            "daily_hours": bad_hours,
            "dates": [f"2024-01-{i+1:02d}" for i in range(len(bad_hours))],
        }
    })
    assert resp.status_code == 422


@given(bad_value=st.one_of(st.none(), st.integers(max_value=-1)))
@settings(max_examples=50)
def test_internship_negative_duration_returns_422(bad_value):
    """Negative or null duration_months must return 422."""
    payload = {"duration_months": bad_value, "company_tier": 1, "role_relevance": 0.5, "project_count": 1}
    resp = _client().post("/internship", json=payload)
    assert resp.status_code == 422


@given(bad_tier=st.integers().filter(lambda x: x not in (1, 2, 3)))
@settings(max_examples=50)
def test_internship_invalid_tier_returns_422(bad_tier):
    """company_tier outside 1-3 must return 422."""
    payload = {"duration_months": 3, "company_tier": bad_tier, "role_relevance": 0.5, "project_count": 1}
    resp = _client().post("/internship", json=payload)
    assert resp.status_code == 422


@settings(max_examples=50)
@given(empty_field=st.sampled_from(["resume_text", "job_description"]))
def test_resume_empty_field_returns_422(empty_field):
    """Empty resume_text or job_description must return 422."""
    payload = {"resume_text": "some text", "job_description": "some text"}
    payload[empty_field] = "   "
    resp = _client().post("/resume", json=payload)
    assert resp.status_code == 422


def test_failure_empty_subject_scores_returns_422():
    """Empty subject_scores list must return 422."""
    resp = _client().post("/failure", json={
        "performance": {"subject_scores": [], "backlogs": 0, "project_failures": 0}
    })
    assert resp.status_code == 422


def test_roadmap_empty_target_skills_returns_422():
    """Empty target_skills list must return 422."""
    resp = _client().post("/roadmap", json={
        "skill_gap": {"current_skills": [], "target_skills": [], "target_role": "Dev"}
    })
    assert resp.status_code == 422

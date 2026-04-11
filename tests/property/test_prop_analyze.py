"""Property-based tests for the orchestrator endpoint.

Property 8: PlacementReport contains all required fields with valid ranges
Property 9: risk_level is always consistent with placement_probability
"""
from datetime import date, timedelta

from fastapi.testclient import TestClient
from hypothesis import given, settings, strategies as st

from backend.main import app
from backend.services.placement_service import _risk_level

_REQUIRED_FIELDS = {
    "consistency_score", "burnout_risk", "resume_score", "missing_skills",
    "internship_score", "placement_boost", "failure_reasons", "weak_areas",
    "roadmap", "placement_probability", "risk_level",
}


def _make_dates(n):
    return [(date(2024, 1, 1) + timedelta(days=i)).isoformat() for i in range(n)]


# Feature: placement-readiness-system, Property 8: PlacementReport contains all required fields with valid ranges
@given(
    daily_hours=st.lists(st.floats(min_value=0.0, max_value=24.0, allow_nan=False, allow_infinity=False), min_size=7, max_size=14),
    resume_text=st.text(min_size=5, max_size=200).filter(lambda s: s.strip()),
    job_description=st.text(min_size=5, max_size=200).filter(lambda s: s.strip()),
    duration_months=st.integers(min_value=0, max_value=24),
    company_tier=st.integers(min_value=1, max_value=3),
    role_relevance=st.floats(min_value=0.0, max_value=1.0, allow_nan=False, allow_infinity=False),
    project_count=st.integers(min_value=0, max_value=10),
    subject_scores=st.lists(st.floats(min_value=0.0, max_value=100.0, allow_nan=False, allow_infinity=False), min_size=1, max_size=5),
    backlogs=st.integers(min_value=0, max_value=5),
    project_failures=st.integers(min_value=0, max_value=5),
    current_skills=st.lists(st.text(min_size=1, max_size=20).filter(str.strip), min_size=0, max_size=3),
    target_skills=st.lists(st.text(min_size=1, max_size=20).filter(str.strip), min_size=1, max_size=3),
    target_role=st.text(min_size=1, max_size=30).filter(str.strip),
)
@settings(max_examples=100)
def test_placement_report_all_fields(
    daily_hours, resume_text, job_description,
    duration_months, company_tier, role_relevance, project_count,
    subject_scores, backlogs, project_failures,
    current_skills, target_skills, target_role,
):
    payload = {
        "study_log": {"daily_hours": daily_hours, "dates": _make_dates(len(daily_hours))},
        "resume_text": resume_text,
        "job_description": job_description,
        "internship": {"duration_months": duration_months, "company_tier": company_tier,
                       "role_relevance": role_relevance, "project_count": project_count},
        "performance": {
            "subject_scores": [{"subject": f"S{i}", "score": s} for i, s in enumerate(subject_scores)],
            "backlogs": backlogs, "project_failures": project_failures,
        },
        "skill_gap": {"current_skills": current_skills, "target_skills": target_skills, "target_role": target_role},
    }
    with TestClient(app) as client:
        resp = client.post("/analyze", json=payload)
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
    data = resp.json()
    for field in _REQUIRED_FIELDS:
        assert field in data, f"Missing field: {field}"
    assert 0.0 <= data["placement_probability"] <= 1.0
    assert data["burnout_risk"] in {"Low", "Medium", "High"}
    assert data["risk_level"] in {"Low", "Medium", "High"}


# Feature: placement-readiness-system, Property 9: risk_level is always consistent with placement_probability
@given(probability=st.floats(min_value=0.0, max_value=1.0, allow_nan=False, allow_infinity=False))
@settings(max_examples=100)
def test_risk_level_consistent_with_probability(probability):
    risk = _risk_level(probability)
    if probability < 0.4:
        assert risk == "High"
    elif probability <= 0.7:
        assert risk == "Medium"
    else:
        assert risk == "Low"

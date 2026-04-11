"""Property-based tests for BurnoutService.

Property 2: Burnout response values are within documented ranges
Property 3: Short study log is rejected
"""
from datetime import date, timedelta

from fastapi.testclient import TestClient
from hypothesis import given, settings, strategies as st

from backend.main import app
from backend.schemas.burnout import BurnoutRequest, StudyLog
from backend.services.burnout_service import BurnoutService
from backend.services.model_registry import ModelRegistry

_registry = ModelRegistry()


def _dates(n):
    return [date(2024, 1, 1) + timedelta(days=i) for i in range(n)]


# Feature: placement-readiness-system, Property 2: Burnout response values are within documented ranges
@given(
    daily_hours=st.lists(
        st.floats(min_value=0.0, max_value=24.0, allow_nan=False, allow_infinity=False),
        min_size=7, max_size=30,
    )
)
@settings(max_examples=100)
def test_burnout_response_ranges(daily_hours):
    payload = BurnoutRequest(study_log=StudyLog(daily_hours=daily_hours, dates=_dates(len(daily_hours))))
    result = BurnoutService(_registry).predict(payload)
    assert 0.0 <= result.consistency_score <= 1.0
    assert result.burnout_risk in {"Low", "Medium", "High"}


# Feature: placement-readiness-system, Property 3: Short study log is rejected
@given(
    daily_hours=st.lists(
        st.floats(min_value=0.0, max_value=24.0, allow_nan=False, allow_infinity=False),
        min_size=1, max_size=6,
    )
)
@settings(max_examples=100)
def test_short_study_log_rejected(daily_hours):
    with TestClient(app) as client:
        resp = client.post("/burnout", json={
            "study_log": {
                "daily_hours": daily_hours,
                "dates": [f"2024-01-{i+1:02d}" for i in range(len(daily_hours))],
            }
        })
    assert resp.status_code == 422
    body = resp.json()
    assert any("7 days" in str(e.get("msg", "")) for e in body.get("detail", []))

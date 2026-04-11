"""Unit tests for BurnoutService."""
from datetime import date, timedelta

import pytest

from backend.schemas.burnout import BurnoutRequest, StudyLog
from backend.services.burnout_service import BurnoutService
from backend.services.model_registry import ModelRegistry


def _dates(n: int):
    return [date(2024, 1, 1) + timedelta(days=i) for i in range(n)]


def _registry():
    return ModelRegistry()


def test_consistent_log_produces_high_score():
    # Perfectly consistent log → low CV → high consistency_score
    payload = BurnoutRequest(study_log=StudyLog(daily_hours=[5.0] * 7, dates=_dates(7)))
    result = BurnoutService(_registry()).predict(payload)
    assert result.consistency_score == pytest.approx(1.0)


def test_irregular_log_produces_lower_score():
    payload = BurnoutRequest(study_log=StudyLog(daily_hours=[1.0, 10.0, 1.0, 10.0, 1.0, 10.0, 1.0], dates=_dates(7)))
    result = BurnoutService(_registry()).predict(payload)
    assert result.consistency_score < 0.5


def test_burnout_risk_label_is_valid():
    payload = BurnoutRequest(study_log=StudyLog(daily_hours=[4.0] * 7, dates=_dates(7)))
    result = BurnoutService(_registry()).predict(payload)
    assert result.burnout_risk in {"Low", "Medium", "High"}


def test_high_hours_produces_high_burnout_risk():
    # Mean > 8 → "High" in rule-based fallback
    payload = BurnoutRequest(study_log=StudyLog(daily_hours=[10.0] * 7, dates=_dates(7)))
    result = BurnoutService(_registry()).predict(payload)
    assert result.burnout_risk == "High"


def test_zero_hours_consistency_is_zero():
    payload = BurnoutRequest(study_log=StudyLog(daily_hours=[0.0] * 7, dates=_dates(7)))
    result = BurnoutService(_registry()).predict(payload)
    assert result.consistency_score == 0.0

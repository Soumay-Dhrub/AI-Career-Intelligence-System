"""Unit tests for FailureService."""
import pytest

from backend.schemas.failure import FailureRequest, PerformanceData, SubjectScore
from backend.services.failure_service import FailureService
from backend.services.model_registry import ModelRegistry


def _registry():
    return ModelRegistry()


def _perf(scores: list, backlogs=0, project_failures=0):
    return PerformanceData(
        subject_scores=[SubjectScore(subject=f"S{i}", score=s) for i, s in enumerate(scores)],
        backlogs=backlogs,
        project_failures=project_failures,
    )


def test_low_score_produces_weak_area():
    result = FailureService(_registry()).predict(FailureRequest(performance=_perf([40.0, 80.0])))
    assert len(result.weak_areas) >= 1


def test_all_high_scores_no_weak_areas():
    result = FailureService(_registry()).predict(FailureRequest(performance=_perf([75.0, 80.0, 90.0])))
    assert result.weak_areas == []


def test_backlogs_appear_in_failure_reasons():
    result = FailureService(_registry()).predict(FailureRequest(performance=_perf([60.0], backlogs=2)))
    reasons_text = " ".join(result.failure_reasons)
    assert "backlog" in reasons_text.lower()


def test_empty_subject_scores_raises_422():
    from fastapi.testclient import TestClient
    from backend.main import app
    from unittest.mock import MagicMock
    app.state.registry = MagicMock()
    client = TestClient(app)
    resp = client.post("/failure", json={"performance": {"subject_scores": [], "backlogs": 0, "project_failures": 0}})
    assert resp.status_code == 422

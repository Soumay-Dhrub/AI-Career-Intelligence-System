"""Unit tests for OrchestratorService and POST /analyze endpoint."""
from datetime import date, timedelta
from unittest.mock import patch

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from backend.main import app
from backend.schemas.analyze import AnalyzeRequest
from backend.schemas.burnout import StudyLog
from backend.schemas.failure import PerformanceData, SubjectScore
from backend.schemas.internship import InternshipRequest
from backend.schemas.roadmap import SkillGap
from backend.services.model_registry import ModelRegistry
from backend.services.orchestrator_service import OrchestratorService


def _dates(n):
    return [date(2024, 1, 1) + timedelta(days=i) for i in range(n)]


def _valid_payload():
    return AnalyzeRequest(
        study_log=StudyLog(daily_hours=[4.0, 5.0, 3.0, 6.0, 4.0, 5.0, 4.0], dates=_dates(7)),
        resume_text="Python developer with Django and REST API experience",
        job_description="Looking for Python developer with Django REST API skills",
        internship=InternshipRequest(duration_months=6, company_tier=2, role_relevance=0.8, project_count=2),
        performance=PerformanceData(
            subject_scores=[SubjectScore(subject="Math", score=75.0), SubjectScore(subject="CS", score=82.0)]
        ),
        skill_gap=SkillGap(current_skills=["Python"], target_skills=["Docker", "Kubernetes"], target_role="Backend Engineer"),
    )


def test_happy_path_returns_all_fields():
    report = OrchestratorService(ModelRegistry()).analyze(_valid_payload())
    for field in ["consistency_score", "burnout_risk", "resume_score", "missing_skills",
                  "internship_score", "placement_boost", "failure_reasons", "weak_areas",
                  "roadmap", "placement_probability", "risk_level"]:
        assert hasattr(report, field)
    assert 0.0 <= report.placement_probability <= 1.0
    assert report.risk_level in {"Low", "Medium", "High"}


def test_failing_burnout_raises_500():
    with patch("backend.services.orchestrator_service.BurnoutService.predict",
               side_effect=RuntimeError("burnout exploded")):
        with pytest.raises(HTTPException) as exc:
            OrchestratorService(ModelRegistry()).analyze(_valid_payload())
    assert exc.value.status_code == 500
    assert exc.value.detail["failed_service"] == "BurnoutService"


def test_failing_resume_raises_500():
    with patch("backend.services.orchestrator_service.ResumeService.predict",
               side_effect=RuntimeError("resume exploded")):
        with pytest.raises(HTTPException) as exc:
            OrchestratorService(ModelRegistry()).analyze(_valid_payload())
    assert exc.value.status_code == 500
    assert exc.value.detail["failed_service"] == "ResumeService"


def test_analyze_endpoint_returns_200():
    payload = {
        "study_log": {"daily_hours": [4.0, 5.0, 3.0, 6.0, 4.0, 5.0, 4.0],
                      "dates": ["2024-01-01","2024-01-02","2024-01-03","2024-01-04","2024-01-05","2024-01-06","2024-01-07"]},
        "resume_text": "Python developer with Django and REST API experience",
        "job_description": "Looking for Python developer with Django REST API skills",
        "internship": {"duration_months": 6, "company_tier": 2, "role_relevance": 0.8, "project_count": 2},
        "performance": {"subject_scores": [{"subject": "Math", "score": 75.0}, {"subject": "CS", "score": 82.0}]},
        "skill_gap": {"current_skills": ["Python"], "target_skills": ["Docker", "Kubernetes"], "target_role": "Backend Engineer"},
    }
    with TestClient(app) as client:
        resp = client.post("/analyze", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "placement_probability" in data
    assert data["risk_level"] in {"Low", "Medium", "High"}

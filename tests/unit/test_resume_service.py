"""Unit tests for ResumeService."""
import pytest

from backend.schemas.resume import ResumeRequest
from backend.services.model_registry import ModelRegistry
from backend.services.resume_service import ResumeService


def _registry():
    return ModelRegistry()


def test_resume_score_in_range():
    payload = ResumeRequest(
        resume_text="Python developer with Django REST API experience",
        job_description="FastAPI Python developer with Docker and Kubernetes skills",
    )
    result = ResumeService(_registry()).predict(payload)
    assert 0.0 <= result.resume_score <= 1.0


def test_keyword_match_in_range():
    payload = ResumeRequest(
        resume_text="Python developer with Django REST API experience",
        job_description="FastAPI Python developer with Docker and Kubernetes skills",
    )
    result = ResumeService(_registry()).predict(payload)
    assert 0.0 <= result.keyword_match <= 100.0


def test_missing_skills_are_subset_of_jd():
    payload = ResumeRequest(
        resume_text="Python developer",
        job_description="Python Docker Kubernetes FastAPI developer",
    )
    result = ResumeService(_registry()).predict(payload)
    jd_lower = payload.job_description.lower()
    for skill in result.missing_skills:
        assert skill.lower() in jd_lower


def test_identical_texts_high_score():
    text = "Python FastAPI Docker Kubernetes developer with REST API experience"
    payload = ResumeRequest(resume_text=text, job_description=text)
    result = ResumeService(_registry()).predict(payload)
    assert result.resume_score > 0.5
    assert result.missing_skills == []


def test_empty_resume_raises_422():
    from fastapi.testclient import TestClient
    from backend.main import app
    from unittest.mock import MagicMock
    app.state.registry = MagicMock()
    client = TestClient(app)
    resp = client.post("/resume", json={"resume_text": "", "job_description": "Python developer"})
    assert resp.status_code == 422

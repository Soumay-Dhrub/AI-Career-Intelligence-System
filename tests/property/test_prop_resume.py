"""Property-based tests for ResumeService.

Property 4: Resume response values are within documented ranges
"""
from hypothesis import given, settings, strategies as st

from backend.schemas.resume import ResumeRequest
from backend.services.model_registry import ModelRegistry
from backend.services.resume_service import ResumeService

_registry = ModelRegistry()

_nonempty_text = st.text(min_size=3, max_size=300).filter(lambda s: s.strip())


# Feature: placement-readiness-system, Property 4: Resume response values are within documented ranges
@given(resume_text=_nonempty_text, job_description=_nonempty_text)
@settings(max_examples=100)
def test_resume_response_ranges(resume_text, job_description):
    payload = ResumeRequest(resume_text=resume_text, job_description=job_description)
    result = ResumeService(_registry).predict(payload)
    assert 0.0 <= result.resume_score <= 1.0
    assert 0.0 <= result.keyword_match <= 100.0
    # missing_skills must be subset of job_description terms
    jd_lower = job_description.lower()
    for skill in result.missing_skills:
        assert skill.lower() in jd_lower

"""Property-based tests for InternshipService.

Property 5: Internship response values are within documented ranges
"""
from hypothesis import given, settings, strategies as st

from backend.schemas.internship import InternshipRequest
from backend.services.internship_service import InternshipService
from backend.services.model_registry import ModelRegistry

_registry = ModelRegistry()


# Feature: placement-readiness-system, Property 5: Internship response values are within documented ranges
@given(
    duration_months=st.integers(min_value=0, max_value=24),
    company_tier=st.integers(min_value=1, max_value=3),
    role_relevance=st.floats(min_value=0.0, max_value=1.0, allow_nan=False, allow_infinity=False),
    project_count=st.integers(min_value=0, max_value=10),
)
@settings(max_examples=100)
def test_internship_response_ranges(duration_months, company_tier, role_relevance, project_count):
    payload = InternshipRequest(
        duration_months=duration_months,
        company_tier=company_tier,
        role_relevance=role_relevance,
        project_count=project_count,
    )
    result = InternshipService(_registry).predict(payload)
    assert 0.0 <= result.internship_score <= 10.0
    assert 0.0 <= result.placement_boost <= 1.0

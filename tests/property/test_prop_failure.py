"""Property-based tests for FailureService.

Property 6: Low subject scores always produce non-empty weak_areas
"""
from hypothesis import given, settings, strategies as st

from backend.schemas.failure import FailureRequest, PerformanceData, SubjectScore
from backend.services.failure_service import FailureService
from backend.services.model_registry import ModelRegistry

_registry = ModelRegistry()


# Feature: placement-readiness-system, Property 6: Low subject scores always produce non-empty weak_areas
@given(
    scores=st.lists(
        st.floats(min_value=0.0, max_value=49.9, allow_nan=False, allow_infinity=False),
        min_size=1, max_size=5,
    ),
    extra_scores=st.lists(
        st.floats(min_value=50.0, max_value=100.0, allow_nan=False, allow_infinity=False),
        min_size=0, max_size=3,
    ),
)
@settings(max_examples=100)
def test_low_scores_produce_weak_areas(scores, extra_scores):
    all_scores = scores + extra_scores
    subject_scores = [SubjectScore(subject=f"S{i}", score=s) for i, s in enumerate(all_scores)]
    payload = FailureRequest(performance=PerformanceData(subject_scores=subject_scores))
    result = FailureService(_registry).predict(payload)
    assert len(result.weak_areas) >= 1, f"Expected non-empty weak_areas for scores {all_scores}"

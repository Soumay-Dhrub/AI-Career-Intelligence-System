"""Unit tests for PlacementService."""
import pytest

from backend.services.model_registry import ModelRegistry
from backend.services.placement_service import PlacementService, _risk_level


def _registry():
    return ModelRegistry()


def _high_features():
    return dict(consistency_score=0.9, resume_score=0.85, internship_score=9.0,
                placement_boost=0.9, burnout_risk_encoded=0, avg_subject_score=88.0)


def _low_features():
    return dict(consistency_score=0.1, resume_score=0.1, internship_score=1.0,
                placement_boost=0.1, burnout_risk_encoded=2, avg_subject_score=25.0)


def test_risk_level_high():
    assert _risk_level(0.0) == "High"
    assert _risk_level(0.39) == "High"


def test_risk_level_medium_at_04():
    assert _risk_level(0.4) == "Medium"


def test_risk_level_medium_at_07():
    assert _risk_level(0.7) == "Medium"


def test_risk_level_low_above_07():
    assert _risk_level(0.71) == "Low"
    assert _risk_level(1.0) == "Low"


def test_high_scores_produce_low_risk():
    prob, risk = PlacementService(_registry()).predict(_high_features())
    assert risk == "Low"
    assert prob > 0.7


def test_low_scores_produce_high_risk():
    prob, risk = PlacementService(_registry()).predict(_low_features())
    assert risk == "High"
    assert prob < 0.4


def test_probability_clamped():
    for features in [_high_features(), _low_features()]:
        prob, _ = PlacementService(_registry()).predict(features)
        assert 0.0 <= prob <= 1.0

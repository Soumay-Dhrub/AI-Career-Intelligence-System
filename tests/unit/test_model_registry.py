"""Unit tests for ModelRegistry."""
import logging as _logging
import tempfile
from pathlib import Path
from unittest.mock import patch

import joblib
import pytest

from backend.services.model_registry import MODEL_KEYS, ModelRegistry


class _FakeSettings:
    def __init__(self, model_dir: Path):
        self.MODEL_DIR = model_dir


def test_all_missing_files_trigger_fallback():
    with tempfile.TemporaryDirectory() as tmpdir:
        settings = _FakeSettings(Path(tmpdir))
        registry = ModelRegistry()

        records: list[_logging.LogRecord] = []

        class _Collector(_logging.Handler):
            def emit(self, record):
                records.append(record)

        module_logger = _logging.getLogger("backend.services.model_registry")
        collector = _Collector()
        module_logger.addHandler(collector)
        try:
            with patch.dict("sys.modules", {"sentence_transformers": None}):
                registry.load_all(settings)
        finally:
            module_logger.removeHandler(collector)

        for key in MODEL_KEYS:
            assert registry.is_fallback(key), f"Expected fallback for {key}"
            assert registry.get(key) is None

        warnings = [r for r in records if r.levelno == _logging.WARNING]
        assert len(warnings) > 0


def test_loaded_artifact_is_returned(tmp_path):
    model_dir = tmp_path / "ml_models"
    artifact_path = model_dir / "consistency" / "burnout_model.joblib"
    artifact_path.parent.mkdir(parents=True)
    sentinel = {"model": "burnout_sentinel"}
    joblib.dump(sentinel, artifact_path)

    settings = _FakeSettings(model_dir)
    registry = ModelRegistry()
    with patch.dict("sys.modules", {"sentence_transformers": None}):
        registry.load_all(settings)

    assert not registry.is_fallback("burnout_model")
    assert registry.get("burnout_model") == sentinel


def test_status_returns_all_keys():
    with tempfile.TemporaryDirectory() as tmpdir:
        settings = _FakeSettings(Path(tmpdir))
        registry = ModelRegistry()
        with patch.dict("sys.modules", {"sentence_transformers": None}):
            registry.load_all(settings)

    result = registry.status()
    assert set(result.keys()) == set(MODEL_KEYS)
    for val in result.values():
        assert val in ("loaded", "fallback")


def test_status_all_fallback_when_no_files():
    with tempfile.TemporaryDirectory() as tmpdir:
        settings = _FakeSettings(Path(tmpdir))
        registry = ModelRegistry()
        with patch.dict("sys.modules", {"sentence_transformers": None}):
            registry.load_all(settings)

        for key in MODEL_KEYS:
            assert registry.status()[key] == "fallback"

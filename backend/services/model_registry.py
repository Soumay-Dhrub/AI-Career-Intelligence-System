"""ModelRegistry — loads and holds all ML model artifacts at startup."""
from __future__ import annotations

from pathlib import Path
from typing import Any

import joblib

from backend.core.logging import get_logger

logger = get_logger(__name__)

MODEL_KEYS = [
    "burnout_model",      # ml_models/consistency/
    "resume_tfidf",       # ml_models/resume_engine/
    "resume_bert",        # ml_models/resume_engine/ (sentence-transformers)
    "internship_model",   # ml_models/internship/
    "failure_model",      # ml_models/failure_analysis/
    "roadmap_model",      # ml_models/roadmap/
    "placement_model",    # ml_models/placement_engine/
]

_JOBLIB_PATHS: dict[str, str] = {
    "burnout_model":    "consistency/burnout_model.joblib",
    "resume_tfidf":     "resume_engine/tfidf_vectorizer.joblib",
    "internship_model": "internship/rf_model.joblib",
    "failure_model":    "failure_analysis/dt_model.joblib",
    "roadmap_model":    "roadmap/cf_model.joblib",
    "placement_model":  "placement_engine/xgb_model.joblib",
}


class ModelRegistry:
    """Loads and holds all ML model artifacts. Falls back to rule-based logic on missing files."""

    def __init__(self) -> None:
        self._models: dict[str, Any] = {k: None for k in MODEL_KEYS}
        self._fallbacks: dict[str, bool] = {k: False for k in MODEL_KEYS}

    def load_all(self, settings) -> None:
        """Load every model artifact; set fallback=True on any failure."""
        model_dir: Path = Path(settings.MODEL_DIR)

        for key, rel_path in _JOBLIB_PATHS.items():
            full_path = model_dir / rel_path
            try:
                self._models[key] = joblib.load(full_path)
                logger.info(f"Model loaded: {key}", extra={"path": str(full_path)})
            except FileNotFoundError:
                logger.warning(
                    f"Model '{key}' not found at '{full_path}', using fallback",
                    extra={"model": key, "path": str(full_path)},
                )
                self._fallbacks[key] = True
            except Exception as exc:
                logger.warning(
                    f"Model '{key}' failed to load, using fallback",
                    extra={"model": key, "path": str(full_path), "error": str(exc)},
                )
                self._fallbacks[key] = True

        # sentence-transformers for resume_bert
        try:
            from sentence_transformers import SentenceTransformer  # type: ignore
            self._models["resume_bert"] = SentenceTransformer("all-MiniLM-L6-v2")
            logger.info("Model loaded: resume_bert")
        except ImportError:
            logger.warning("sentence-transformers not installed, resume_bert using fallback")
            self._fallbacks["resume_bert"] = True
        except Exception as exc:
            logger.warning("resume_bert failed to load, using fallback", extra={"error": str(exc)})
            self._fallbacks["resume_bert"] = True

    def get(self, name: str) -> Any:
        """Return the loaded model artifact, or None if unavailable."""
        return self._models.get(name)

    def is_fallback(self, name: str) -> bool:
        """Return True if the named model is using rule-based fallback."""
        return self._fallbacks.get(name, True)

    def status(self) -> dict[str, str]:
        """Return a mapping of model_name -> 'loaded' | 'fallback'."""
        return {
            key: ("fallback" if self._fallbacks[key] else "loaded")
            for key in MODEL_KEYS
        }

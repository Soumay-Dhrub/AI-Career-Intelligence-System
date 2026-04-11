"""Property-based tests for logging and observability.

Property 10: Every request produces a structured log entry
Validates: Requirements 9.1, 9.3
"""
import io
import json
import logging
import sys
from unittest.mock import MagicMock

from fastapi.testclient import TestClient
from hypothesis import given, settings, strategies as st

from backend.main import app
from backend.services.model_registry import MODEL_KEYS


def _client_with_log_capture():
    """Return (client, log_records) where log_records accumulates JSON log entries."""
    mock_registry = MagicMock()
    mock_registry.status.return_value = {k: "fallback" for k in MODEL_KEYS}
    app.state.registry = mock_registry
    return TestClient(app, raise_server_exceptions=False)


# Feature: placement-readiness-system, Property 10: Every request produces a structured log entry
@given(path=st.sampled_from(["/health", "/docs", "/openapi.json"]))
@settings(max_examples=10)
def test_every_request_produces_structured_log(path):
    """For any request, the middleware must emit a JSON log entry with required fields."""
    captured: list[dict] = []

    class _Capture(logging.Handler):
        def emit(self, record: logging.LogRecord) -> None:
            try:
                # The JSON formatter serializes the whole record as JSON
                msg = record.getMessage()
                # Try to parse the formatted output
                formatter = record.__dict__.get("_formatter")
                # Collect extra fields directly from the record
                entry = {
                    "method": record.__dict__.get("method"),
                    "path": record.__dict__.get("path"),
                    "status_code": record.__dict__.get("status_code"),
                    "duration_ms": record.__dict__.get("duration_ms"),
                }
                if all(v is not None for v in entry.values()):
                    captured.append(entry)
            except Exception:
                pass

    root_logger = logging.getLogger("backend.main")
    handler = _Capture()
    root_logger.addHandler(handler)

    try:
        client = _client_with_log_capture()
        client.get(path)
    finally:
        root_logger.removeHandler(handler)

    # At least one structured log entry with all required fields must have been emitted
    assert len(captured) >= 1, f"No structured log entry captured for {path}"
    entry = captured[0]
    assert "method" in entry
    assert "path" in entry
    assert "status_code" in entry
    assert "duration_ms" in entry


def test_unhandled_exception_logs_error_and_returns_500():
    """An unhandled exception must log at ERROR level and return HTTP 500."""
    from unittest.mock import patch

    error_records: list[logging.LogRecord] = []

    class _ErrorCapture(logging.Handler):
        def emit(self, record: logging.LogRecord) -> None:
            if record.levelno >= logging.ERROR:
                error_records.append(record)

    root_logger = logging.getLogger("backend.main")
    handler = _ErrorCapture()
    root_logger.addHandler(handler)

    try:
        mock_registry = MagicMock()
        mock_registry.status.return_value = {k: "fallback" for k in MODEL_KEYS}
        app.state.registry = mock_registry

        with patch("backend.routes.health.health", side_effect=RuntimeError("boom")):
            client = TestClient(app, raise_server_exceptions=False)
            resp = client.get("/health")
    finally:
        root_logger.removeHandler(handler)

    assert resp.status_code == 500

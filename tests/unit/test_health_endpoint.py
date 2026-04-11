"""Unit tests for GET /health endpoint."""
from unittest.mock import MagicMock

from fastapi.testclient import TestClient

from backend.services.model_registry import MODEL_KEYS


def _make_client(status_map: dict) -> TestClient:
    from backend.main import app
    mock_registry = MagicMock()
    mock_registry.status.return_value = status_map
    client = TestClient(app, raise_server_exceptions=True)
    app.state.registry = mock_registry
    return client


def test_health_returns_200():
    client = _make_client({key: "fallback" for key in MODEL_KEYS})
    assert client.get("/health").status_code == 200


def test_health_response_has_ok_status():
    client = _make_client({key: "fallback" for key in MODEL_KEYS})
    assert client.get("/health").json()["status"] == "ok"


def test_health_response_contains_all_model_keys():
    client = _make_client({key: "fallback" for key in MODEL_KEYS})
    data = client.get("/health").json()
    assert {m["name"] for m in data["models"]} == set(MODEL_KEYS)


def test_health_model_status_values_are_valid():
    client = _make_client({key: "fallback" for key in MODEL_KEYS})
    for model in client.get("/health").json()["models"]:
        assert model["status"] in ("loaded", "fallback")


def test_health_reports_loaded_when_models_available():
    client = _make_client({key: "loaded" for key in MODEL_KEYS})
    for model in client.get("/health").json()["models"]:
        assert model["status"] == "loaded"


def test_health_mixed_status():
    status_map = {key: ("loaded" if i % 2 == 0 else "fallback") for i, key in enumerate(MODEL_KEYS)}
    client = _make_client(status_map)
    result = {m["name"]: m["status"] for m in client.get("/health").json()["models"]}
    assert result == status_map

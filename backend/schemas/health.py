"""Pydantic schemas for the health endpoint."""
from typing import List, Literal

from pydantic import BaseModel


class ModelStatus(BaseModel):
    name: str
    status: Literal["loaded", "fallback"]


class HealthResponse(BaseModel):
    status: str
    models: List[ModelStatus]

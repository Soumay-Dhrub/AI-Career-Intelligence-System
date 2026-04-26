"""Application configuration via Pydantic BaseSettings.

All settings can be overridden via environment variables.
"""
from pathlib import Path
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central configuration for the Placement Readiness System."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",   # ignore unknown env vars (DATABASE_URL, SUPABASE_*, etc.)
    )

    # Directory where ML model artifacts are stored
    MODEL_DIR: Path = Path("ml_models")

    # Logging configuration
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: Literal["json", "text"] = "json"

    # Path to the technical skills vocabulary used by ResumeService
    SKILLS_VOCAB_PATH: Path = Path("data/skills_vocab.json")

    # Auth (optional — used by auth route directly via os.getenv)
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30


# Module-level singleton — import this everywhere
settings = Settings()

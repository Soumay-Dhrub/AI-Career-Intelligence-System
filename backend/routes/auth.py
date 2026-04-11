"""Auth routes — signup, login, and Google OAuth.

User store: in-memory dict (swap for a real DB in production).
JWT tokens: HS256, 7-day expiry.
Google OAuth: verifies the ID token from the frontend Google Sign-In button.
"""
from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from jose import jwt
from passlib.context import CryptContext

from backend.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])

# ── Security config ───────────────────────────────────────────────────────────
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "placement-readiness-secret-key-change-in-prod")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "252249856920-lre0t9rlm51rmabu0p5hri47mmgsbenc.apps.googleusercontent.com")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ── In-memory user store ──────────────────────────────────────────────────────
# { email: { name, hashed_password, provider } }
_users: dict[str, dict[str, str]] = {}


# ── Schemas ───────────────────────────────────────────────────────────────────
class SignupRequest(BaseModel):
    name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class GoogleLoginRequest(BaseModel):
    credential: str  # Google ID token from the frontend


class AuthResponse(BaseModel):
    token: str
    user: dict[str, str]


# ── Helpers ───────────────────────────────────────────────────────────────────
def _hash_password(password: str) -> str:
    return pwd_context.hash(password)


def _verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def _create_token(data: dict[str, Any]) -> str:
    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


async def _verify_google_token(credential: str) -> dict[str, str]:
    """Verify a Google ID token and return the user info payload."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://oauth2.googleapis.com/tokeninfo",
            params={"id_token": credential},
            timeout=10.0,
        )
    if resp.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token.",
        )
    data = resp.json()

    # Verify audience if GOOGLE_CLIENT_ID is configured
    if GOOGLE_CLIENT_ID and data.get("aud") != GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google token audience mismatch.",
        )

    email = data.get("email", "").lower().strip()
    name = data.get("name") or data.get("email", "").split("@")[0]
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google token missing email.",
        )
    return {"email": email, "name": name}


# ── Routes ────────────────────────────────────────────────────────────────────
@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(body: SignupRequest):
    """Register a new user with email + password."""
    email = body.email.lower().strip()
    if email in _users:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )
    _users[email] = {
        "name": body.name.strip(),
        "hashed_password": _hash_password(body.password),
        "provider": "email",
    }
    logger.info("User registered", extra={"email": email})
    return {"message": "Account created successfully. Please sign in."}


@router.post("/login", response_model=AuthResponse)
async def login(body: LoginRequest):
    """Authenticate with email + password and return a JWT."""
    email = body.email.lower().strip()
    user = _users.get(email)

    if not user or user.get("provider") == "google":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )
    if not _verify_password(body.password, user.get("hashed_password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    token = _create_token({"sub": email, "name": user["name"]})
    logger.info("User logged in", extra={"email": email})
    return AuthResponse(token=token, user={"name": user["name"], "email": email})


@router.post("/google", response_model=AuthResponse)
async def google_login(body: GoogleLoginRequest):
    """Verify a Google ID token and return a JWT.

    The frontend sends the credential from Google Identity Services
    (window.google.accounts.id.initialize / renderButton).
    """
    google_user = await _verify_google_token(body.credential)
    email = google_user["email"]
    name = google_user["name"]

    # Auto-register on first Google login
    if email not in _users:
        _users[email] = {"name": name, "hashed_password": "", "provider": "google"}
        logger.info("Google user auto-registered", extra={"email": email})

    token = _create_token({"sub": email, "name": name})
    logger.info("Google user logged in", extra={"email": email})
    return AuthResponse(token=token, user={"name": name, "email": email})

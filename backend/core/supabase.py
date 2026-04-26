"""Supabase JWT verification for FastAPI dependency injection."""
from __future__ import annotations

import os
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

# Supabase JWT secret — set SUPABASE_JWT_SECRET in your .env
# Found in: Supabase Dashboard → Project Settings → API → JWT Secret
_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")
_ALGORITHM = "HS256"

_bearer = HTTPBearer(auto_error=False)


def verify_supabase_token(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
) -> dict:
    """Decode and verify a Supabase-issued JWT. Returns the payload dict."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization token",
        )
    try:
        payload = jwt.decode(
            credentials.credentials,
            _JWT_SECRET,
            algorithms=[_ALGORITHM],
            options={"verify_aud": False},  # Supabase tokens use 'authenticated' audience
        )
        return payload
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {exc}",
        )


def get_user_id(payload: dict = Depends(verify_supabase_token)) -> str:
    """Extract the Supabase user UUID (sub claim) from the verified token."""
    uid = payload.get("sub")
    if not uid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token missing sub claim")
    return uid

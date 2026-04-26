"""Placement prediction endpoints — intelligent multi-module predictor."""
from __future__ import annotations

import os
from typing import Optional

import httpx
from fastapi import APIRouter, Header, Request

from backend.schemas.placement import PlacementAnalysisRequest, PlacementPrediction
from backend.services.placement_predictor import PlacementPredictor

router = APIRouter(tags=["placement"])

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_JWT_SECRET", "")


@router.post("/placement/predict", response_model=PlacementPrediction)
async def placement_predict(
    payload: PlacementAnalysisRequest,
    request: Request,
    authorization: Optional[str] = Header(default=None),
) -> PlacementPrediction:
    """Run intelligent placement prediction and optionally save to Supabase."""
    result = PlacementPredictor().predict(payload)

    # Save to Supabase if authenticated
    if authorization and SUPABASE_URL:
        token = authorization.replace("Bearer ", "").strip()
        await _save_report(token, payload, result)

    return result


@router.get("/placement/history")
async def placement_history(
    authorization: Optional[str] = Header(default=None),
) -> dict:
    """Fetch placement report history for authenticated user."""
    if not authorization or not SUPABASE_URL:
        return {"reports": []}
    token = authorization.replace("Bearer ", "").strip()
    return await _fetch_history(token)


async def _save_report(token: str, inp: PlacementAnalysisRequest, result: PlacementPrediction) -> None:
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            user_resp = await client.get(
                f"{SUPABASE_URL}/auth/v1/user",
                headers={"Authorization": f"Bearer {token}", "apikey": SUPABASE_KEY},
            )
            if user_resp.status_code != 200:
                return
            user_id = user_resp.json().get("id")
            if not user_id:
                return
            await client.post(
                f"{SUPABASE_URL}/rest/v1/placement_reports",
                headers={
                    "Authorization": f"Bearer {token}",
                    "apikey": SUPABASE_KEY,
                    "Content-Type": "application/json",
                    "Prefer": "return=minimal",
                },
                json={
                    "user_id": user_id,
                    "placement_score": result.placement_score,
                    "readiness_level": result.readiness_level,
                    "prediction_data": result.model_dump(),
                },
            )
    except Exception:
        pass


async def _fetch_history(token: str) -> dict:
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            user_resp = await client.get(
                f"{SUPABASE_URL}/auth/v1/user",
                headers={"Authorization": f"Bearer {token}", "apikey": SUPABASE_KEY},
            )
            if user_resp.status_code != 200:
                return {"reports": []}
            user_id = user_resp.json().get("id")
            resp = await client.get(
                f"{SUPABASE_URL}/rest/v1/placement_reports",
                headers={"Authorization": f"Bearer {token}", "apikey": SUPABASE_KEY},
                params={"user_id": f"eq.{user_id}", "order": "created_at.desc", "limit": "10"},
            )
            data = resp.json()
            if isinstance(data, list):
                return {"reports": [{"score": r.get("placement_score"), "level": r.get("readiness_level"), "created_at": r.get("created_at")} for r in data]}
    except Exception:
        pass
    return {"reports": []}


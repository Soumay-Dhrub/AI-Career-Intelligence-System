"""Roadmap endpoints — legacy + intelligent generation + Supabase persistence."""
from __future__ import annotations

import json
import os
from typing import Optional

import httpx
from fastapi import APIRouter, Header, HTTPException, Request, status

from backend.schemas.roadmap import (
    IntelligentRoadmapResponse, RoadmapInput, RoadmapRequest, RoadmapResponse,
)
from backend.services.roadmap_service import RoadmapService

router = APIRouter(tags=["roadmap"])

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_JWT_SECRET", "")  # service role key for server-side ops


@router.post("/roadmap", response_model=RoadmapResponse)
async def roadmap_legacy(payload: RoadmapRequest, request: Request) -> RoadmapResponse:
    """Legacy: generate roadmap from skill gap."""
    registry = request.app.state.registry
    return RoadmapService(registry).predict(payload)


@router.post("/roadmap/generate", response_model=IntelligentRoadmapResponse)
async def roadmap_generate(
    payload: RoadmapInput,
    request: Request,
    authorization: Optional[str] = Header(default=None),
) -> IntelligentRoadmapResponse:
    """Generate intelligent personalized roadmap and optionally save to Supabase."""
    registry = request.app.state.registry
    result = RoadmapService(registry).generate(payload)

    # Save to Supabase if user is authenticated
    if authorization and SUPABASE_URL:
        token = authorization.replace("Bearer ", "").strip()
        await _save_roadmap(token, payload, result)

    return result


@router.get("/roadmap/saved")
async def roadmap_saved(
    authorization: Optional[str] = Header(default=None),
) -> dict:
    """Fetch saved roadmap for authenticated user from Supabase."""
    if not authorization or not SUPABASE_URL:
        return {"roadmap": None}
    token = authorization.replace("Bearer ", "").strip()
    return await _fetch_roadmap(token)


async def _save_roadmap(token: str, inp: RoadmapInput, result: IntelligentRoadmapResponse) -> None:
    """Upsert roadmap to Supabase user_roadmaps table."""
    try:
        # Get user id from Supabase
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

            # Upsert roadmap
            await client.post(
                f"{SUPABASE_URL}/rest/v1/user_roadmaps",
                headers={
                    "Authorization": f"Bearer {token}",
                    "apikey": SUPABASE_KEY,
                    "Content-Type": "application/json",
                    "Prefer": "resolution=merge-duplicates",
                },
                json={
                    "user_id": user_id,
                    "domain": inp.domain,
                    "role": inp.target_role,
                    "roadmap_data": result.model_dump(),
                },
            )
    except Exception:
        pass  # Non-critical — don't fail the request


async def _fetch_roadmap(token: str) -> dict:
    """Fetch latest roadmap for user from Supabase."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            user_resp = await client.get(
                f"{SUPABASE_URL}/auth/v1/user",
                headers={"Authorization": f"Bearer {token}", "apikey": SUPABASE_KEY},
            )
            if user_resp.status_code != 200:
                return {"roadmap": None}
            user_id = user_resp.json().get("id")

            resp = await client.get(
                f"{SUPABASE_URL}/rest/v1/user_roadmaps",
                headers={"Authorization": f"Bearer {token}", "apikey": SUPABASE_KEY},
                params={"user_id": f"eq.{user_id}", "order": "created_at.desc", "limit": "1"},
            )
            data = resp.json()
            if data and isinstance(data, list) and len(data) > 0:
                return {"roadmap": data[0].get("roadmap_data")}
    except Exception:
        pass
    return {"roadmap": None}


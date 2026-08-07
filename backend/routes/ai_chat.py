"""NextHire AI — career assistant using NVIDIA NIM API."""
from __future__ import annotations

import asyncio
import hashlib
import json
import os
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Optional

import httpx
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

# Explicitly load .env from project root
load_dotenv(Path(__file__).parent.parent.parent / ".env")

router = APIRouter(tags=["ai-chat"])

NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY", "")
NVIDIA_BASE_URL = os.getenv("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1")
NVIDIA_MODEL = os.getenv("NVIDIA_MODEL", "meta/llama-3.1-8b-instruct")

SYSTEM_PROMPT = """You are NextHire AI — a lightning-fast career assistant.

SPEED FIRST: Keep ALL responses under 150 words. Use bullet points. Be direct.

Help with: resume, jobs, interviews, skills, career guidance.

FORMAT: Direct answer → 3-5 bullets → optional 1-line tip.

FALLBACK: If unsure → "⚠️ AI service is busy. Please try again."
Empty input → "Please enter your question."

Be: fast, smart, friendly, professional. Never: long paragraphs, tables, huge code blocks."""

# Simple in-memory response cache
_cache: dict = {}
_CACHE_TTL = 3600


def _cache_key(messages: List) -> str:
    content = json.dumps([{"r": m.role, "c": m.content} for m in messages[-5:]])
    return hashlib.md5(content.encode()).hexdigest()


def _get_cached(key: str) -> Optional[str]:
    if key in _cache:
        entry = _cache[key]
        if datetime.now() < entry["exp"]:
            return entry["reply"]
        del _cache[key]
    return None


def _set_cache(key: str, reply: str) -> None:
    if len(_cache) > 200:
        del _cache[next(iter(_cache))]
    _cache[key] = {"reply": reply, "exp": datetime.now() + timedelta(seconds=_CACHE_TTL)}


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    user_name: Optional[str] = None


class ChatResponse(BaseModel):
    reply: str
    tokens_used: Optional[int] = None
    model_used: Optional[str] = None


@router.post("/ai-chat", response_model=ChatResponse)
async def ai_chat(payload: ChatRequest) -> ChatResponse:
    """Send messages to NVIDIA NIM and return NextHire AI response."""
    if not NVIDIA_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="NVIDIA_API_KEY not set. Add it to your .env file.",
        )

    # Cache check
    key = _cache_key(payload.messages)
    cached = _get_cached(key)
    if cached:
        return ChatResponse(reply=cached, model_used="cached")

    # Build messages
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for msg in payload.messages[-10:]:
        messages.append({"role": msg.role, "content": msg.content})

    # Models to try in order
    models = [NVIDIA_MODEL, "meta/llama-3.1-8b-instruct", "mistralai/mistral-7b-instruct-v0.3"]
    # Deduplicate while preserving order
    seen = set()
    models_to_try = [m for m in models if not (m in seen or seen.add(m))]

    last_error = "No models available"
    for model in models_to_try:
        try:
            reply, tokens = await _call_nvidia(model, messages)
            if reply:
                _set_cache(key, reply)
                return ChatResponse(reply=reply, tokens_used=tokens, model_used=model)
        except HTTPException as e:
            if e.status_code in (401, 403):
                raise  # Don't retry auth errors
            last_error = str(e.detail)
            continue
        except Exception as e:
            last_error = str(e)
            continue

    raise HTTPException(
        status_code=503,
        detail=f"⚠️ The AI service is temporarily busy. Please try again in a few seconds. ({last_error[:80]})",
    )


async def _call_nvidia(model: str, messages: list) -> tuple[str, Optional[int]]:
    """Call NVIDIA NIM API."""
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:  # Hard 15s timeout
            resp = await client.post(
                f"{NVIDIA_BASE_URL}/chat/completions",
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {NVIDIA_API_KEY}",
                },
                json={
                    "model": model,
                    "messages": messages,
                    "temperature": 0.4,   # Lower = faster, more deterministic
                    "top_p": 0.7,
                    "max_tokens": 200,    # Hard cap — forces short responses
                    "stream": False,
                },
            )

        if resp.status_code == 401:
            raise HTTPException(status_code=401, detail="Invalid NVIDIA API key.")
        if resp.status_code == 403:
            raise HTTPException(status_code=403, detail="NVIDIA API access denied.")
        if resp.status_code == 429:
            raise HTTPException(status_code=429, detail=f"Model {model} rate limited.")
        if resp.status_code == 404:
            raise HTTPException(status_code=404, detail=f"Model {model} not found.")
        if resp.status_code != 200:
            raise HTTPException(
                status_code=502,
                detail=f"NVIDIA error {resp.status_code}: {resp.text[:150]}",
            )

        data = resp.json()
        reply = ""
        tokens = data.get("usage", {}).get("total_tokens")

        if "choices" in data and data["choices"]:
            msg = data["choices"][0].get("message", {})
            reply = (msg.get("content") or "").strip()

        if not reply:
            raise HTTPException(status_code=502, detail="Empty response from model.")

        return reply, tokens

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail=f"Model {model} timed out.")
    except httpx.RequestError as exc:
        raise HTTPException(status_code=502, detail=f"Network error: {exc}")

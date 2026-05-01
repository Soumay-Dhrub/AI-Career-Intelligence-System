"""NextHire AI — career assistant chat endpoint using OpenAI GPT-3.5-turbo."""
from __future__ import annotations

import os
import hashlib
import json
import asyncio
from typing import List, Optional
from datetime import datetime, timedelta

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

router = APIRouter(tags=["ai-chat"])

# Use OpenAI API
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Simple in-memory cache for responses to reduce API costs
_response_cache: dict = {}
CACHE_TTL_SECONDS = 3600  # 1 hour

SYSTEM_PROMPT = """You are "NextHire AI", an intelligent career assistant integrated into a Placement Readiness Platform called PlaceReady.

Your ONLY purpose is to help users with:
- Resume analysis and ATS optimization
- Internship prediction and company matching
- Placement preparation strategies
- DSA / Coding / Aptitude / Verbal improvement
- Learning roadmap guidance
- Failure analysis and weak area identification
- Career growth within the platform context

STRICT RULES:
1. ONLY respond to placement, resume, internship, DSA, coding, aptitude, verbal, roadmap, and career-related queries.
2. If user asks ANYTHING unrelated (general knowledge, entertainment, politics, etc.), respond EXACTLY:
   "Sorry, I can only assist with placement preparation, resumes, internships, and career growth on this platform. Thank you."
3. Never hallucinate or make up company-specific data.
4. Always be structured, motivating, and actionable.

RESPONSE FORMAT for profile analysis:
🔍 Profile Summary
📊 Scores (ATS, DSA, Coding, etc.)
❌ Weak Areas
🚀 Improvement Plan
🎯 Placement Probability
🧭 Suggested Next Steps

TONE: Professional, motivating, clear, structured. No unnecessary long text. Focus on actionable insights.

When greeting a new user, say:
"Hi! I'm NextHire AI 👋 I can help you with:
• Resume Analyzer
• Internship Predictor
• Failure Analysis
• Roadmap Generator
• Placement Predictor
Or just describe your situation and I'll analyze it!"
"""


class ChatMessage(BaseModel):
    role: str   # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    user_name: Optional[str] = None


class ChatResponse(BaseModel):
    reply: str
    tokens_used: Optional[int] = None


def _build_openai_messages(messages: List[ChatMessage]) -> List[dict]:
    """Convert chat history to OpenAI format."""
    # OpenAI expects messages in this format:
    # [{"role": "system", "content": "..."}, {"role": "user", "content": "..."}, ...]

    openai_messages = []

    # Add system prompt
    openai_messages.append({
        "role": "system",
        "content": SYSTEM_PROMPT
    })

    # Add conversation history (keep last 10 messages for context)
    for msg in messages[-10:]:
        openai_messages.append({
            "role": msg.role,
            "content": msg.content
        })

    return openai_messages


def _get_cache_key(messages: List[ChatMessage]) -> str:
    """Generate a cache key from the messages."""
    content_hash = hashlib.md5(
        json.dumps([{"role": msg.role, "content": msg.content} for msg in messages[-10:]]).encode()
    ).hexdigest()
    return content_hash


def _check_cache(cache_key: str) -> Optional[dict]:
    """Check if response is cached and valid."""
    if cache_key in _response_cache:
        cached = _response_cache[cache_key]
        if datetime.now() < cached["expires_at"]:
            return cached["response"]
        else:
            del _response_cache[cache_key]
    return None


def _cache_response(cache_key: str, response: dict) -> None:
    """Cache a response."""
    _response_cache[cache_key] = {
        "response": response,
        "expires_at": datetime.now() + timedelta(seconds=CACHE_TTL_SECONDS)
    }


@router.post("/ai-chat", response_model=ChatResponse)
async def ai_chat(payload: ChatRequest) -> ChatResponse:
    """Send messages to OpenAI GPT-3.5-turbo and return NextHire AI response with retries."""

    # Check if API key is available
    if not OPENAI_API_KEY or OPENAI_API_KEY == "sk-your_openai_key_here":
        raise HTTPException(
            status_code=503,
            detail=(
                "🔴 OpenAI API Key Required\n"
                "The OpenAI API key is not configured in the backend.\n\n"
                "✅ FIX: Add OPENAI_API_KEY to your .env file:\n"
                "OPENAI_API_KEY=sk-your_actual_key_here\n\n"
                "Get your key from: https://platform.openai.com/api-keys\n\n"
                "Cost: ~$0.002 per 1K tokens (very cheap!)"
            ),
        )

    # Check cache first
    cache_key = _get_cache_key(payload.messages)
    cached_response = _check_cache(cache_key)
    if cached_response:
        return ChatResponse(reply=cached_response["reply"], tokens_used=cached_response.get("tokens_used"))

    # Build the messages for OpenAI
    openai_messages = _build_openai_messages(payload.messages)

    # OpenAI API request
    request_body = {
        "model": "gpt-3.5-turbo",
        "messages": openai_messages,
        "max_tokens": 1000,
        "temperature": 0.7,
        "top_p": 0.9,
    }

    # Retry logic with exponential backoff
    max_retries = 3
    timeout_seconds = 60.0

    for attempt in range(max_retries):
        try:
            async with httpx.AsyncClient(timeout=timeout_seconds) as client:
                resp = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {OPENAI_API_KEY}",
                        "Content-Type": "application/json",
                    },
                    json=request_body,
                )

            if resp.status_code == 429:
                raise HTTPException(
                    status_code=429,
                    detail=(
                        "🔴 OpenAI API Rate Limited\n"
                        "Too many requests. Please wait a moment and try again.\n\n"
                        "Check your OpenAI usage at:\n"
                        "https://platform.openai.com/usage\n\n"
                        "Upgrade your plan if needed:\n"
                        "https://platform.openai.com/account/billing"
                    ),
                )
            if resp.status_code == 401:
                raise HTTPException(
                    status_code=401,
                    detail=(
                        "🔴 OpenAI API Key Invalid\n"
                        "The API key in your .env file is invalid.\n\n"
                        "Fix: Update OPENAI_API_KEY in your .env file with a valid key from:\n"
                        "https://platform.openai.com/api-keys"
                    ),
                )
            if resp.status_code != 200:
                error_detail = resp.text[:300] if resp.text else "Unknown error"
                # For 5xx errors, retry
                if resp.status_code >= 500 and attempt < max_retries - 1:
                    wait_seconds = 2 ** attempt
                    print(f"[AI Chat] Server error {resp.status_code}, retrying in {wait_seconds}s...")
                    await asyncio.sleep(wait_seconds)
                    continue

                raise HTTPException(
                    status_code=502,
                    detail=f"Hugging Face API error: {resp.status_code} — {error_detail}",
                )

            data = resp.json()

            # Extract text from OpenAI response structure
            try:
                if "choices" in data and len(data["choices"]) > 0:
                    reply = data["choices"][0]["message"]["content"].strip()
                    tokens_used = data.get("usage", {}).get("total_tokens", 0)
                else:
                    reply = str(data).strip()
                    tokens_used = 0

                if not reply:
                    raise HTTPException(status_code=502, detail="Empty response from OpenAI API")

                # Clean up the response (OpenAI responses are usually clean)
                reply = reply.strip()

                # Ensure we have a meaningful response
                if not reply or len(reply) < 5:
                    reply = "I'd be happy to help you with your career goals! What specific assistance are you looking for?"

                # Cache the response
                _cache_response(cache_key, {"reply": reply, "tokens_used": tokens_used})

                return ChatResponse(reply=reply, tokens_used=tokens_used)

            except (KeyError, IndexError, TypeError) as exc:
                raise HTTPException(status_code=502, detail=f"Unexpected OpenAI response format: {exc}")

        except httpx.TimeoutException as e:
            if attempt < max_retries - 1:
                wait_seconds = 2 ** attempt
                print(f"[AI Chat] Timeout (attempt {attempt + 1}/{max_retries}), retrying in {wait_seconds}s...")
                await asyncio.sleep(wait_seconds)
                continue

            # Last attempt timed out
            raise HTTPException(
                status_code=504,
                detail=(
                    "🕐 AI Response Timeout\n"
                    "The service took too long to respond (>1 minute).\n\n"
                    "This can happen due to:\n"
                    "• High OpenAI API load\n"
                    "• Network connectivity issues\n\n"
                    "Try again in a few seconds. If the problem persists,\n"
                    "check your OpenAI API key and account status."
                ),
            )
        except httpx.RequestError as exc:
            if attempt < max_retries - 1:
                wait_seconds = 2 ** attempt
                print(f"[AI Chat] Request error, retrying in {wait_seconds}s: {exc}")
                await asyncio.sleep(wait_seconds)
                continue

            raise HTTPException(
                status_code=502,
                detail=f"Could not reach OpenAI service: {exc}"
            )

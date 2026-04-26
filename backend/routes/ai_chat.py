"""NextHire AI — career assistant chat endpoint using Google Gemini API."""
from __future__ import annotations

import os
from typing import List, Optional

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(tags=["ai-chat"])

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyAoO_si4P07b0YxoxFraVq6gssOSE9GsBg")
GEMINI_MODEL = "gemini-2.0-flash-lite"
GEMINI_URL = (
    f"https://generativelanguage.googleapis.com/v1beta/models/"
    f"{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
)

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


def _build_gemini_contents(messages: List[ChatMessage]) -> list:
    """Convert chat history to Gemini contents format."""
    contents = []
    for msg in messages[-20:]:
        # Gemini uses "user" and "model" roles
        role = "model" if msg.role == "assistant" else "user"
        contents.append({
            "role": role,
            "parts": [{"text": msg.content}]
        })
    return contents


@router.post("/ai-chat", response_model=ChatResponse)
async def ai_chat(payload: ChatRequest) -> ChatResponse:
    """Send messages to Gemini API and return NextHire AI response."""
    contents = _build_gemini_contents(payload.messages)

    # Gemini uses systemInstruction separately
    request_body = {
        "systemInstruction": {
            "parts": [{"text": SYSTEM_PROMPT}]
        },
        "contents": contents,
        "generationConfig": {
            "maxOutputTokens": 1024,
            "temperature": 0.7,
        },
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                GEMINI_URL,
                headers={"Content-Type": "application/json"},
                json=request_body,
            )

        if resp.status_code == 429:
            raise HTTPException(
                status_code=429,
                detail="AI quota exceeded. Please wait a moment and try again.",
            )
        if resp.status_code != 200:
            raise HTTPException(
                status_code=502,
                detail=f"Gemini API error: {resp.status_code} — {resp.text[:300]}",
            )

        data = resp.json()
        # Extract text from Gemini response structure
        try:
            reply = data["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError) as exc:
            raise HTTPException(status_code=502, detail=f"Unexpected Gemini response format: {exc}")

        tokens = data.get("usageMetadata", {}).get("totalTokenCount")
        return ChatResponse(reply=reply, tokens_used=tokens)

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="AI response timed out. Please try again.")
    except httpx.RequestError as exc:
        raise HTTPException(status_code=502, detail=f"Could not reach Gemini service: {exc}")

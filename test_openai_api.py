#!/usr/bin/env python3
"""
Test script to verify if OpenAI API is working.
"""
import os
import httpx
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

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

def test_huggingface_api():
    """Test the OpenAI GPT-3.5-turbo API connection."""
    print("=" * 80)
    print("OPENAI GPT-3.5-TURBO API TEST")
    print("=" * 80)

    print(f"\n📋 Configuration:")
    print(f"   API Key (last 10 chars): ...{OPENAI_API_KEY[-10:] if OPENAI_API_KEY else 'NOT SET'}")
    print(f"   Model: gpt-3.5-turbo")

    if not OPENAI_API_KEY or OPENAI_API_KEY == "sk-your_openai_key_here":
        print("\n❌ ERROR: OPENAI_API_KEY environment variable is not set!")
        print("   Please add OPENAI_API_KEY=sk-your_actual_key_here to your .env file")
        print("   Get your key from: https://platform.openai.com/api-keys")
        return False

    # Prepare a simple test conversation for OpenAI
    messages = [
        {
            "role": "system",
            "content": "You are NextHire AI, a career assistant. Be helpful and structured."
        },
        {
            "role": "user",
            "content": "Hi! Can you help me with resume optimization?"
        }
    ]

    request_body = {
        "model": "gpt-3.5-turbo",
        "messages": messages,
        "max_tokens": 200,
        "temperature": 0.7,
    }

    try:
        print(f"\n🔄 Sending test request to OpenAI API...")
        print(f"   (This should respond quickly)")

        with httpx.Client(timeout=60.0) as client:
            resp = client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENAI_API_KEY}",
                    "Content-Type": "application/json",
                },
                json=request_body,
            )

        print(f"\n📊 Response Status: {resp.status_code}")
        print(f"   Headers: Content-Type: {resp.headers.get('content-type', 'N/A')}")

        if resp.status_code == 429:
            print("\n❌ RATE LIMITED (429)")
            print(f"   Too many requests. Free tier limits exceeded.")
            print(f"   Response: {resp.text[:500]}")
            return False

        elif resp.status_code == 401:
            print("\n❌ UNAUTHORIZED (401)")
            print(f"   The API token is invalid.")
            print(f"   Response: {resp.text[:500]}")
            return False

        elif resp.status_code == 403:
            print("\n❌ FORBIDDEN (403)")
            print(f"   Access denied. Check token permissions.")
            print(f"   Response: {resp.text[:500]}")
            return False

        elif resp.status_code == 503:
            print("\n⚠️  MODEL LOADING (503)")
            print(f"   The model is still loading. This is normal for first request.")
            print(f"   Try again in 10-30 seconds.")
            print(f"   Response: {resp.text[:500]}")
            return False

        elif resp.status_code != 200:
            print(f"\n❌ ERROR (HTTP {resp.status_code})")
            print(f"   Response: {resp.text[:500]}")
            return False

        data = resp.json()
        print(f"\n✅ SUCCESS!")

        try:
            if "choices" in data and len(data["choices"]) > 0:
                reply = data["choices"][0]["message"]["content"].strip()
                tokens_used = data.get("usage", {}).get("total_tokens", 0)
            else:
                reply = str(data).strip()
                tokens_used = 0

            print(f"\n   📝 AI Response: {reply[:200]}{'...' if len(reply) > 200 else ''}")

            print(f"   🔢 Tokens Used: {tokens_used}")

            # Check if response is relevant
            if "resume" in reply.lower() or "placement" in reply.lower() or "career" in reply.lower() or "nexthire" in reply.lower():
                print(f"   ✅ Response is relevant to career/placement topics")
            else:
                print(f"   ⚠️  Response may not be career-focused (check system prompt)")

        except (KeyError, IndexError, TypeError) as e:
            print(f"   ⚠️  Could not parse response: {e}")
            print(f"   Raw response: {json.dumps(data, indent=2)[:500]}")

        return True

    except httpx.TimeoutException:
        print(f"\n❌ TIMEOUT")
        print(f"   The request took too long (>2 minutes).")
        print(f"   This can happen if the model is loading or there's high demand.")
        return False

    except httpx.RequestError as e:
        print(f"\n❌ REQUEST ERROR")
        print(f"   Could not reach Hugging Face service: {e}")
        return False

    except json.JSONDecodeError as e:
        print(f"\n❌ JSON PARSE ERROR")
        print(f"   Could not parse response as JSON: {e}")
        print(f"   Response text: {resp.text[:200]}")
        return False

    except Exception as e:
        print(f"\n❌ UNEXPECTED ERROR")
        print(f"   Error: {type(e).__name__}: {e}")
        return False

if __name__ == "__main__":
    success = test_huggingface_api()
    print("\n" + "=" * 80)
    if success:
        print("✅ OPENAI GPT-3.5-TURBO API IS WORKING CORRECTLY!")
        print("   NextHire AI should now function properly.")
        print("   Cost: ~$0.002 per 1K tokens")
    else:
        print("❌ OPENAI API HAS ISSUES - See details above")
        print("   Check your API key and try again.")
    print("=" * 80)
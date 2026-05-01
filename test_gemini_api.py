#!/usr/bin/env python3
"""
Test script to verify if Gemini API key is working and check for quota issues.
"""
import os
import httpx
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = "gemini-2.0-flash-lite"
GEMINI_URL = (
    f"https://generativelanguage.googleapis.com/v1beta/models/"
    f"{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
)

def test_gemini_api():
    """Test the Gemini API connection and quota."""
    print("=" * 80)
    print("GEMINI API TEST")
    print("=" * 80)
    
    print(f"\n📋 Configuration:")
    print(f"   API Key (last 10 chars): ...{GEMINI_API_KEY[-10:] if GEMINI_API_KEY else 'NOT SET'}")
    print(f"   Model: {GEMINI_MODEL}")
    print(f"   URL: {GEMINI_URL.split('?')[0]}...?key=***")
    
    if not GEMINI_API_KEY:
        print("\n❌ ERROR: GEMINI_API_KEY environment variable is not set!")
        return False
    
    # Prepare a simple request
    request_body = {
        "systemInstruction": {
            "parts": [{"text": "You are a helpful assistant."}]
        },
        "contents": [
            {
                "role": "user",
                "parts": [{"text": "Say 'Hello! I am working correctly.' if you can read this."}]
            }
        ],
        "generationConfig": {
            "maxOutputTokens": 100,
            "temperature": 0.5,
        },
    }
    
    try:
        print(f"\n🔄 Sending test request to Gemini API...")
        
        with httpx.Client(timeout=30.0) as client:
            resp = client.post(
                GEMINI_URL,
                headers={"Content-Type": "application/json"},
                json=request_body,
            )
        
        print(f"\n📊 Response Status: {resp.status_code}")
        print(f"   Headers: {dict(resp.headers)}")
        
        if resp.status_code == 429:
            print("\n❌ QUOTA EXCEEDED (429)")
            print(f"   The API has hit rate limits or quota has been exceeded.")
            print(f"   Response: {resp.text[:500]}")
            return False
        
        elif resp.status_code == 401:
            print("\n❌ UNAUTHORIZED (401)")
            print(f"   The API key is invalid or expired.")
            print(f"   Response: {resp.text[:500]}")
            return False
        
        elif resp.status_code == 403:
            print("\n❌ FORBIDDEN (403)")
            print(f"   Access denied. Check if the API is enabled in Google Cloud.")
            print(f"   Response: {resp.text[:500]}")
            return False
        
        elif resp.status_code != 200:
            print(f"\n❌ ERROR (HTTP {resp.status_code})")
            print(f"   Response: {resp.text[:500]}")
            return False
        
        data = resp.json()
        print(f"\n✅ SUCCESS!")
        print(f"   Response received successfully")
        
        try:
            reply = data["candidates"][0]["content"]["parts"][0]["text"]
            tokens = data.get("usageMetadata", {}).get("totalTokenCount", "N/A")
            print(f"\n   📝 AI Response: {reply}")
            print(f"   🔢 Tokens Used: {tokens}")
        except (KeyError, IndexError) as e:
            print(f"   ⚠️  Could not parse response: {e}")
            print(f"   Raw response: {json.dumps(data, indent=2)[:500]}")
        
        # Check usage metadata
        usage = data.get("usageMetadata", {})
        if usage:
            print(f"\n   📈 Usage Metrics:")
            print(f"      Input tokens: {usage.get('promptTokenCount', 'N/A')}")
            print(f"      Output tokens: {usage.get('candidatesTokenCount', 'N/A')}")
            print(f"      Total tokens: {usage.get('totalTokenCount', 'N/A')}")
        
        return True
        
    except httpx.TimeoutException:
        print(f"\n❌ TIMEOUT")
        print(f"   The request took too long and timed out.")
        return False
    
    except httpx.RequestError as e:
        print(f"\n❌ REQUEST ERROR")
        print(f"   Could not reach Gemini service: {e}")
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
    success = test_gemini_api()
    print("\n" + "=" * 80)
    if success:
        print("✅ GEMINI API IS WORKING CORRECTLY!")
    else:
        print("❌ GEMINI API HAS ISSUES - See details above")
    print("=" * 80)

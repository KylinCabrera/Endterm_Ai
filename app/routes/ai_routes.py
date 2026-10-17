import os
from fastapi import APIRouter
from google import genai

router = APIRouter(prefix="/api/ai", tags=["AI Test"])

@router.get("/test")
def test_gemini_key():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return {"status": "error", "message": "GEMINI_API_KEY not found in environment"}

    client = genai.Client(api_key=api_key)
    response = client.models.generate_content(
        model="gemini-3.8-flash",
        contents="Reply with 'Gemini API is connected successfully!'"
    )
    return {"status": "success", "response": response.text}
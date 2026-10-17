import json
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from google import genai
from google.genai import types

router = APIRouter(prefix="/api/ai", tags=["AI Integration"])

class NutritionLabelResponse(BaseModel):
    item_name: str
    calories: float
    protein: float
    carbs: float
    fat: float

@router.get("/test")
def test_ai():
    return {"status": "AI module active"}

@router.post("/scan-label", response_model=NutritionLabelResponse)
async def scan_nutrition_label(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        client = genai.Client()
        
        prompt = """
        Analyze this nutrition label image and extract the following values:
        - item_name: Name of the food/product (extract or estimate, e.g. "Scanned Food Item")
        - calories: Total calories (numeric value only)
        - protein: Total protein in grams (numeric value only)
        - carbs: Total carbohydrates in grams (numeric value only)
        - fat: Total fat in grams (numeric value only)
        """
        
        response = client.models.generate_content(
            model='gemini-3.8-flash',
            contents=[
                types.Part.from_bytes(data=contents, mime_type=file.content_type),
                prompt
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=NutritionLabelResponse,
            ),
        )
        
        return json.loads(response.text)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR Processing failed: {str(e)}")
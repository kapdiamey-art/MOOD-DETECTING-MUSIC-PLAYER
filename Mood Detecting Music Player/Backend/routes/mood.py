import os
import sys
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

# Path setup to import the recommendation engine
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CURRENT_DIR)
PROJECT_DIR = os.path.dirname(BACKEND_DIR)
RECOMMENDATION_SRC_DIR = os.path.join(PROJECT_DIR, "Recommendation engine", "src")

if RECOMMENDATION_SRC_DIR not in sys.path:
    sys.path.insert(0, RECOMMENDATION_SRC_DIR)

try:
    from week6_integration import recommend_from_text  # type: ignore
except ImportError as e:
    recommend_from_text = None
    print(f"Warning: Could not load recommendation engine. Error: {e}")

router = APIRouter()

class MoodRequest(BaseModel):
    text: str
    genre: Optional[str] = None
    artist: Optional[str] = None

@router.post("/detect")
def detect_mood(request: MoodRequest):
    if recommend_from_text is None:
        raise HTTPException(status_code=500, detail="Recommendation engine not loaded.")
    
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    preferences = {}
    if request.genre:
        preferences["genres"] = [request.genre]
    if request.artist:
        preferences["artists"] = [request.artist]
    
    if not preferences:
        preferences = None

    try:
        emotion, confidence, recommendations_df = recommend_from_text(
            request.text,
            n=5,
            preferences=preferences,
            use_spotify=False
        )
        
        # Convert DataFrame to list of dicts
        recommendations = recommendations_df.to_dict(orient="records")
        
        return {
            "emotion": emotion,
            "confidence": confidence,
            "recommendations": recommendations
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

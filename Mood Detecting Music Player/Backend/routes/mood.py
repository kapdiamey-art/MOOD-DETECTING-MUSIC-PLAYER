import os
import sys
import pandas as pd
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

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

from config.database import mood_sessions_col
from routes.auth import get_current_user

router = APIRouter()

# Optional auth — mood detection works even without a token (guest mode)
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


class MoodRequest(BaseModel):
    text: str
    genre: Optional[str] = None
    artist: Optional[str] = None


@router.post("/detect")
async def detect_mood(
    request: MoodRequest,
    token: Optional[str] = Depends(oauth2_scheme_optional)
):
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
            use_spotify=True
        )
        # Clean NaN values so FastAPI can serialize to JSON without error
        clean_df = recommendations_df.where(pd.notnull(recommendations_df), None)
        recommendations = clean_df.to_dict(orient="records")

        # ── Save mood session to MongoDB if user is logged in ──────────────
        if token and mood_sessions_col is not None:
            try:
                from routes.auth import resolve_user_from_token
                user = await resolve_user_from_token(token)
                if user:
                    await mood_sessions_col.insert_one({
                        "user_id":       str(user["_id"]),
                        "detected_mood": emotion,
                        "confidence":    float(confidence),
                        "input_text":    request.text,
                        "timestamp":     datetime.utcnow()
                    })
            except Exception as save_err:
                # Never break the main response if session saving fails
                print(f"[mood] session save skipped: {save_err}")
        # ───────────────────────────────────────────────────────────────────

        return {
            "emotion": emotion,
            "confidence": float(confidence),
            "recommendations": recommendations
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

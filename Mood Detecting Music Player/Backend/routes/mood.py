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
EMOTION_MODEL_SRC_DIR = os.path.join(PROJECT_DIR, "Emotion Detection Model", "src")

if RECOMMENDATION_SRC_DIR not in sys.path:
    sys.path.insert(0, RECOMMENDATION_SRC_DIR)

if EMOTION_MODEL_SRC_DIR not in sys.path:
    sys.path.insert(0, EMOTION_MODEL_SRC_DIR)

from input_validation import validate_input

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
    language: Optional[str] = "all"
    weather: Optional[str] = None


class MoodJourneyRequest(BaseModel):
    current_mood: str
    target_mood: str


EMOTION_TO_RECOMMENDER = {
    "sadness": "sadness", "joy": "joy", "love": "love",
    "anger": "angry", "fear": "fear", "surprise": "surprise"
}


@router.post("/detect")
async def detect_mood(
    request: MoodRequest,
    token: Optional[str] = Depends(oauth2_scheme_optional)
):
    if recommend_from_text is None:
        raise HTTPException(status_code=500, detail="Recommendation engine not loaded.")

    if not request.text.strip():
        return {
            "status": "invalid",
            "message": "Please enter a meaningful sentence describing how you feel."
        }

    is_valid, message = validate_input(request.text)
    if not is_valid:
        return {
            "status": "invalid",
            "message": message or "Please enter a meaningful sentence describing how you feel."
        }

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
            n=50,
            preferences=preferences,
            use_spotify=True,
            language=request.language or "all",
            weather=request.weather
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
                    first_song = recommendations[0] if recommendations else {}
                    await mood_sessions_col.insert_one({
                        "user_id":       str(user["_id"]),
                        "detected_mood": emotion,
                        "confidence":    float(confidence),
                        "input_text":    request.text,
                        "timestamp":     datetime.utcnow(),
                        "recommended_song": {
                            "title": first_song.get("track_name"),
                            "artist": first_song.get("artists")
                        } if first_song else None
                    })
            except Exception as save_err:
                # Never break the main response if session saving fails
                print(f"[mood] session save skipped: {save_err}")
        # ───────────────────────────────────────────────────────────────────

        return {
            "status": "confident",
            "emotion": emotion,
            "confidence": float(confidence),
            "recommendations": recommendations
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/journal")
async def get_journal(current_user=Depends(get_current_user)):
    """Read the existing mood sessions; no duplicate journal collection."""
    if mood_sessions_col is None:
        return {"entries": []}
    sessions = await mood_sessions_col.find(
        {"user_id": str(current_user["_id"])},
        {"input_text": 1, "detected_mood": 1, "timestamp": 1, "recommended_song": 1}
    ).sort("timestamp", -1).to_list(365)
    return {"entries": [
        {"id": str(item["_id"]), "input_text": item.get("input_text", ""),
         "detected_mood": item.get("detected_mood", "neutral"),
         "timestamp": item.get("timestamp"), "recommended_song": item.get("recommended_song")}
        for item in sessions
    ]}


@router.post("/journey")
async def create_mood_journey(request: MoodJourneyRequest, current_user=Depends(get_current_user)):
    """Blend existing recommender results: first current mood, then destination."""
    current = EMOTION_TO_RECOMMENDER.get(request.current_mood.lower())
    target = EMOTION_TO_RECOMMENDER.get(request.target_mood.lower())
    if not current or not target:
        raise HTTPException(400, "Choose moods from the six supported emotions.")
    try:
        from recommendation import recommend  # imported from existing engine path above
        start_frame = recommend(current, n=4, use_spotify=True)
        finish_frame = recommend(target, n=6, use_spotify=True)
        start = start_frame.where(pd.notnull(start_frame), None)
        finish = finish_frame.where(pd.notnull(finish_frame), None)
        return {"current_mood": request.current_mood, "target_mood": request.target_mood,
                "songs": start.to_dict(orient="records") + finish.to_dict(orient="records")}
    except Exception as error:
        raise HTTPException(500, detail=f"Could not build mood journey: {error}")


# Cache for dataset genres and top artists
_ALL_GENRES_CACHE = None
_TOP_ARTISTS_CACHE = None
_ARTIST_SET_CACHE = None


def _init_music_caches():
    global _ALL_GENRES_CACHE, _TOP_ARTISTS_CACHE, _ARTIST_SET_CACHE
    if _ALL_GENRES_CACHE is not None:
        return
    try:
        from recommendation import songs
        if songs is not None:
            # Build clean genres list
            genre_set = set()
            if "track_genre" in songs.columns:
                for g in songs['track_genre'].dropna().unique():
                    s = str(g).strip().lower().replace("[", "").replace("]", "").replace("'", "").replace('"', "")
                    for item in s.split(","):
                        clean_item = item.strip()
                        if clean_item:
                            genre_set.add(clean_item)
            _ALL_GENRES_CACHE = sorted(list(genre_set))

            # Build top artists by dataset count
            from collections import Counter
            counts = Counter()
            if "artists" in songs.columns:
                for a in songs['artists'].dropna():
                    if isinstance(a, str):
                        for p in a.split(';'):
                            name = p.strip()
                            if name:
                                counts.update([name])
            _TOP_ARTISTS_CACHE = [artist for artist, _ in counts.most_common(35)]
            _ARTIST_SET_CACHE = sorted(list(counts.keys()))
    except Exception as e:
        print(f"[music cache error] {e}")
        _ALL_GENRES_CACHE = []
        _TOP_ARTISTS_CACHE = []
        _ARTIST_SET_CACHE = []


@router.get("/genres")
async def get_genres(q: Optional[str] = None):
    """Get genres. If query 'q' is given, filter. Returns top genres when empty."""
    _init_music_caches()
    all_genres = _ALL_GENRES_CACHE or []

    if not q or not q.strip():
        # Popular/common genres when empty
        popular_defaults = ["pop", "rock", "indie", "bollywood", "lofi", "acoustic", "hip-hop", "dance", "edm", "classical", "jazz", "r-n-b", "metal", "soul", "ambient", "country"]
        existing_defaults = [g for g in popular_defaults if g in all_genres]
        rem = [g for g in all_genres if g not in existing_defaults]
        return {"genres": existing_defaults + rem[:15], "total": len(all_genres)}

    query = q.strip().lower()
    filtered = [g for g in all_genres if query in g]
    filtered.sort(key=lambda x: (not x.startswith(query), x))
    return {"genres": filtered[:15], "total": len(all_genres)}


@router.get("/artists")
async def search_artists(q: Optional[str] = None):
    """Search artists from dataset. If q is empty, returns top dataset artists."""
    _init_music_caches()
    top_artists = _TOP_ARTISTS_CACHE or []
    all_artists = _ARTIST_SET_CACHE or []

    if not q or not q.strip():
        return {"artists": top_artists[:20], "total": len(all_artists)}

    query = q.strip().lower()
    matches = []
    # Search in all artists
    for a in all_artists:
        if query in a.lower():
            matches.append(a)
            if len(matches) >= 40:
                break

    matches.sort(key=lambda x: (not x.lower().startswith(query), x.lower()))
    return {"artists": matches[:15], "total": len(all_artists)}



from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime

from config.database import liked_songs_col, recently_played_col, mood_sessions_col
from models.song import LikedSong
from ml.recommender import get_songs_for_mood, get_discover_songs
from routes.auth import get_current_user

router = APIRouter()


@router.get("/recommendations")
async def get_recommendations(mood: str = None, current_user=Depends(get_current_user)):
    if not mood:
        latest = await mood_sessions_col.find_one(
            {"user_id": str(current_user["_id"])},
            sort=[("timestamp", -1)]
        )
        mood = latest["detected_mood"] if latest else "Calm"

    return {"mood": mood, "songs": get_songs_for_mood(mood)}


@router.get("/discover")
async def discover(current_user=Depends(get_current_user)):
    return {"songs": get_discover_songs()}


@router.post("/recommendations/like")
async def like_song(data: LikedSong, current_user=Depends(get_current_user)):
    user_id = str(current_user["_id"])

    # check duplicate
    exists = await liked_songs_col.find_one({
        "user_id": user_id,
        "song_title": data.song_title,
        "artist": data.artist
    })
    if exists:
        raise HTTPException(400, "Already liked")

    now = datetime.utcnow()

    result = await liked_songs_col.insert_one({
        "user_id": user_id,
        "song_title": data.song_title,
        "artist": data.artist,
        "mood_tag": data.mood_tag,
        "liked_at": now
    })

    await recently_played_col.insert_one({
        "user_id": user_id,
        "song_title": data.song_title,
        "artist": data.artist,
        "mood_tag": data.mood_tag,
        "played_at": now
    })

    return {"message": "Song liked!", "song_id": str(result.inserted_id)}

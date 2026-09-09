from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from datetime import datetime
from typing import Optional
from pydantic import BaseModel

from config.database import liked_songs_col, recently_played_col, playlists_col
from models.playlist import PlaylistCreate
from routes.auth import get_current_user

router = APIRouter()


class RecentlyPlayedIn(BaseModel):
    song_title: str
    artist:     str
    mood_tag:   Optional[str] = ""


def fix_doc(doc):
    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    for field in ["liked_at", "played_at", "created_at"]:
        if field in doc:
            doc[field] = str(doc[field])
    return doc


@router.get("/liked")
async def get_liked_songs(current_user=Depends(get_current_user)):
    if liked_songs_col is None:
        return []
    songs = await liked_songs_col.find(
        {"user_id": str(current_user["_id"])}
    ).sort("liked_at", -1).to_list(100)
    return [fix_doc(s) for s in songs]


@router.delete("/liked/{song_id}")
async def unlike_song(song_id: str, current_user=Depends(get_current_user)):
    if liked_songs_col is None:
        raise HTTPException(503, "Database unavailable")
    try:
        oid = ObjectId(song_id)
    except Exception:
        raise HTTPException(400, "Invalid song ID")

    res = await liked_songs_col.delete_one({"_id": oid, "user_id": str(current_user["_id"])})
    if res.deleted_count == 0:
        raise HTTPException(404, "Not found")

    return {"message": "Removed"}


@router.get("/stats")
async def my_stats(current_user=Depends(get_current_user)):
    if liked_songs_col is None or recently_played_col is None or playlists_col is None:
        return {"liked_songs": 0, "playlists": 0, "listening_hours": 0, "recently_played": 0}
    uid = str(current_user["_id"])
    liked     = await liked_songs_col.count_documents({"user_id": uid})
    playlists = await playlists_col.count_documents({"user_id": uid})
    played    = await recently_played_col.count_documents({"user_id": uid})

    return {
        "liked_songs":     liked,
        "playlists":       playlists,
        "listening_hours": round((played * 3.5) / 60, 1),
        "recently_played": played
    }


@router.get("/recent")
async def recently_played(current_user=Depends(get_current_user)):
    if recently_played_col is None:
        return []
    songs = await recently_played_col.find(
        {"user_id": str(current_user["_id"])}
    ).sort("played_at", -1).limit(20).to_list(20)
    return [fix_doc(s) for s in songs]


@router.post("/recently-played")
async def add_recently_played(data: RecentlyPlayedIn, current_user=Depends(get_current_user)):
    """Called by the frontend player whenever a song starts playing."""
    if recently_played_col is None:
        return {"message": "DB unavailable, skipped"}
    await recently_played_col.insert_one({
        "user_id":    str(current_user["_id"]),
        "song_title": data.song_title,
        "artist":     data.artist,
        "mood_tag":   data.mood_tag,
        "played_at":  datetime.utcnow()
    })
    return {"message": "Saved"}


@router.get("/playlists")
async def get_playlists(current_user=Depends(get_current_user)):
    items = await playlists_col.find(
        {"user_id": str(current_user["_id"])}
    ).sort("created_at", -1).to_list(50)
    return [fix_doc(p) for p in items]


@router.post("/playlists")
async def create_playlist(data: PlaylistCreate, current_user=Depends(get_current_user)):
    result = await playlists_col.insert_one({
        "user_id": str(current_user["_id"]),
        "name": data.name,
        "emoji": data.emoji,
        "songs": [],
        "created_at": datetime.utcnow()
    })
    return {"message": "Playlist created", "playlist_id": str(result.inserted_id)}

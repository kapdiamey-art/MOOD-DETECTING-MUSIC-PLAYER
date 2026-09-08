import os
import sys
from fastapi import APIRouter, Query, HTTPException
from typing import Optional

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CURRENT_DIR)
PROJECT_DIR = os.path.dirname(BACKEND_DIR)
RECOMMENDATION_SRC_DIR = os.path.join(PROJECT_DIR, "Recommendation engine", "src")

if RECOMMENDATION_SRC_DIR not in sys.path:
    sys.path.insert(0, RECOMMENDATION_SRC_DIR)

try:
    from spotify_api import get_track_metadata, search_track  # type: ignore  # noqa: E402
except ImportError as e:
    get_track_metadata = None  # type: ignore
    search_track = None  # type: ignore
    print(f"Warning: spotify_api could not be imported: {e}")

router = APIRouter()


@router.get("/track")
def get_track_info(track: str = Query(..., description="Track title"), artist: Optional[str] = Query("", description="Artist name")):
    if get_track_metadata is None:
        raise HTTPException(status_code=500, detail="Spotify API module not available")
    
    meta = get_track_metadata(track, artist or "")
    if not meta:
        raise HTTPException(status_code=404, detail="Track metadata not found")
    return meta


@router.get("/search")
def search_tracks(q: str = Query(..., description="Search query")):
    if search_track is None:
        raise HTTPException(status_code=500, detail="Spotify API module not available")
    
    parts = q.strip().split(" - ")
    track_name = parts[0]
    artist = parts[1] if len(parts) > 1 else ""
    
    meta = search_track(track_name, artist)
    if not meta:
        return {"results": []}
    return {"results": [meta]}

import os
import sys
import random
import pandas as pd
from fastapi import APIRouter, Query, HTTPException
from typing import Optional

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CURRENT_DIR)
PROJECT_DIR = os.path.dirname(BACKEND_DIR)
RECOMMENDATION_SRC_DIR = os.path.join(PROJECT_DIR, "Recommendation engine", "src")
DATA_PATH = os.path.join(PROJECT_DIR, "Recommendation engine", "data", "processed", "spotify_metadata.csv")

if RECOMMENDATION_SRC_DIR not in sys.path:
    sys.path.insert(0, RECOMMENDATION_SRC_DIR)

try:
    from spotify_api import get_track_metadata  # type: ignore  # noqa: E402
except ImportError as e:
    get_track_metadata = None  # type: ignore
    print(f"Warning: spotify_api could not be imported: {e}")

router = APIRouter()

# ── Load dataset once at startup ──────────────────────────────────────────────
_df_cache: Optional[pd.DataFrame] = None

def _get_df() -> pd.DataFrame:
    global _df_cache
    if _df_cache is not None:
        return _df_cache
    try:
        df = pd.read_csv(DATA_PATH, low_memory=False)
        # Normalise column names
        df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]
        _df_cache = df
        return df
    except Exception as e:
        print(f"Warning: could not load dataset CSV: {e}")
        return pd.DataFrame()


def _row_to_dict(row) -> dict:
    """Convert a dataset row to the song dict the frontend expects."""
    return {
        "track_name":  str(row.get("track_name", row.get("track", "Unknown"))),
        "artists":     str(row.get("artists",    row.get("artist", "Unknown"))),
        "genre":       str(row.get("genre",       row.get("track_genre", ""))),
        "album_image": row.get("album_image",     row.get("album_art", None)),
        "preview_url": row.get("preview_url",     None),
        "spotify_url": row.get("spotify_url",     row.get("external_url", None)),
        "mood_tag":    row.get("mood_tag",        ""),
        "popularity":  row.get("popularity",      0),
    }


# ── keyword-aware category queries ───────────────────────────────────────────
_CATEGORY_KEYWORDS = {
    "late night":   ["late", "night", "chill", "dark", "sleep"],
    "chill":        ["chill", "relax", "calm", "easy"],
    "happy":        ["happy", "joy", "upbeat", "feel good", "good"],
    "popular":      [],   # empty → fall back to popularity sort
    "study":        ["study", "focus", "lofi", "concentration", "ambient"],
    "morning":      ["morning", "energy", "wake", "sunrise", "fresh"],
    "workout":      ["workout", "energy", "pump", "intense", "power"],
    "romantic":     ["love", "romantic", "heart", "passion"],
}

def _search_dataset(query: str, n: int = 15) -> list:
    df = _get_df()
    if df.empty:
        return []

    q = query.strip().lower()

    # Try to match against track/artist/genre text columns
    text_cols = []
    for col in ("track_name", "track", "artists", "artist", "genre", "track_genre", "mood_tag"):
        if col in df.columns:
            text_cols.append(col)

    if not text_cols:
        return []

    # Build a combined text column for matching
    combined = df[text_cols[0]].fillna("").str.lower()
    for col in text_cols[1:]:
        combined = combined + " " + df[col].fillna("").str.lower()

    # Keyword-aware: expand short category queries
    keywords = []
    for cat_key, words in _CATEGORY_KEYWORDS.items():
        if cat_key in q:
            keywords = words
            break

    if keywords:
        mask = combined.str.contains(keywords[0], na=False)
        for kw in keywords[1:]:
            mask = mask | combined.str.contains(kw, na=False)
    elif q:
        # Direct substring match across combined text
        mask = combined.str.contains(q, na=False, regex=False)
    else:
        mask = pd.Series([True] * len(df), index=df.index)

    matched = df[mask]

    # If we get fewer than n, sort by popularity and pad with popular songs
    if len(matched) < n:
        if "popularity" in df.columns:
            popular = df[~mask].nlargest(n - len(matched), "popularity")
            matched = pd.concat([matched, popular])
        else:
            fallback = df[~mask].sample(min(n - len(matched), len(df[~mask])))
            matched = pd.concat([matched, fallback])

    # Shuffle and take n
    sample = matched.sample(min(n, len(matched))) if len(matched) > 0 else matched
    return [_row_to_dict(row) for _, row in sample.iterrows()]


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/track")
def get_track_info(
    track: str = Query(..., description="Track title"),
    artist: Optional[str] = Query("", description="Artist name"),
):
    if get_track_metadata is None:
        raise HTTPException(status_code=500, detail="Spotify API module not available")

    meta = get_track_metadata(track, artist or "")
    if not meta:
        raise HTTPException(status_code=404, detail="Track metadata not found")
    return meta


@router.get("/search")
def search_tracks(
    q: str = Query(..., description="Search query"),
    limit: int = Query(15, description="Number of results", ge=1, le=50),
):
    """
    Multi-result search against the local dataset.
    Returns up to `limit` songs matching the query.
    """
    results = _search_dataset(q, n=limit)
    return {"results": results, "query": q, "count": len(results)}

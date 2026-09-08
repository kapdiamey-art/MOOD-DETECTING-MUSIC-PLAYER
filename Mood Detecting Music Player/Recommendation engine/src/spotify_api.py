import os
import re
import sys
import base64
import time
import urllib.parse
from datetime import date
import pandas as pd
import requests
from dotenv import load_dotenv

# Load environment variables
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.dirname(CURRENT_DIR)
load_dotenv(os.path.join(BASE_DIR, ".env"))
load_dotenv()

CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")

TOKEN_URL = "https://accounts.spotify.com/api/token"
SEARCH_URL = "https://api.spotify.com/v1/search"
CACHE_FILE = os.path.join(BASE_DIR, "data", "processed", "spotify_metadata.csv")

# Token cache
_cached_token = None
_token_expires_at = 0


def get_access_token():
    """Get a Spotify access token using Client Credentials with caching."""
    global _cached_token, _token_expires_at

    if _cached_token and time.time() < _token_expires_at - 60:
        return _cached_token

    if not CLIENT_ID or not CLIENT_SECRET:
        return None

    credentials = f"{CLIENT_ID}:{CLIENT_SECRET}"
    encoded_credentials = base64.b64encode(credentials.encode()).decode()

    headers = {
        "Authorization": f"Basic {encoded_credentials}",
        "Content-Type": "application/x-www-form-urlencoded"
    }
    data = {"grant_type": "client_credentials"}

    try:
        response = requests.post(TOKEN_URL, headers=headers, data=data, timeout=8)
        response.raise_for_status()
        json_data = response.json()
        _cached_token = json_data.get("access_token")
        expires_in = json_data.get("expires_in", 3600)
        _token_expires_at = time.time() + expires_in
        return _cached_token
    except Exception as e:
        print(f"Warning: Could not obtain Spotify access token: {e}")
        return None


def clean_track_query(track_name):
    t = str(track_name or "").strip()
    # Strip movie/album attribution suffixes
    t = re.sub(r'\s*-\s*From\s*["\'].*?["\']', '', t, flags=re.I)
    t = re.sub(r'\s*-\s*From\s+.*', '', t, flags=re.I)
    t = re.sub(r'\s*\(From\s*["\'].*?["\']\)', '', t, flags=re.I)
    t = re.sub(r'\s*\(From\s+.*?\)', '', t, flags=re.I)
    t = re.sub(r'\s*\(From\s+.*', '', t, flags=re.I)
    # Strip remaster / live / radio edit / feat
    t = re.sub(r'\s*-\s*Remaster(ed)?(\s*\d+)?', '', t, flags=re.I)
    t = re.sub(r'\s*\(Remaster(ed)?(\s*\d+)?\)', '', t, flags=re.I)
    t = re.sub(r'\s*-\s*Live.*', '', t, flags=re.I)
    t = re.sub(r'\s*\(Live.*?\)', '', t, flags=re.I)
    t = re.sub(r'\s*-\s*Radio\s*Edit.*', '', t, flags=re.I)
    t = re.sub(r'\s*\(feat\..*?\)', '', t, flags=re.I)
    t = re.sub(r'\s*ft\..*', '', t, flags=re.I)
    return t.strip() or str(track_name)


def clean_artist_query(artist):
    """Return the primary/first credited artist only."""
    a = str(artist or "").strip()
    # Split on semicolons, commas, ampersands, slashes
    primary = re.split(r'[;,/&]', a)[0].strip()
    return primary or a


def _itunes_search(q, limit=5):
    """Search iTunes and return list of result items."""
    try:
        res = requests.get(
            "https://itunes.apple.com/search",
            params={"term": q, "media": "music", "entity": "song", "limit": limit},
            timeout=5
        )
        if res.status_code == 200:
            return res.json().get("results", [])
    except Exception:
        pass
    return []


def _deezer_search(q, limit=5):
    """Search Deezer and return list of result items."""
    try:
        res = requests.get(
            "https://api.deezer.com/search",
            params={"q": q, "limit": limit},
            timeout=5
        )
        if res.status_code == 200:
            return res.json().get("data", [])
    except Exception:
        pass
    return []


def _best_itunes_match(results, track_name, artist):
    """
    From iTunes results pick the best match.
    Prefer items where track title and artist name partially match.
    Falls back to first result that has artwork.
    """
    clean_t = clean_track_query(track_name).lower()
    clean_a = clean_artist_query(artist).lower()

    scored = []
    for item in results:
        title = (item.get("trackName") or "").lower()
        art_name = (item.get("artistName") or "").lower()
        score = 0
        if clean_t and len(clean_t) >= 4 and clean_t[:6] in title:
            score += 2
        if clean_a and len(clean_a) >= 3 and clean_a[:5] in art_name:
            score += 1
        if item.get("artworkUrl100"):
            score += 1
        scored.append((score, item))

    scored.sort(key=lambda x: x[0], reverse=True)
    return scored[0][1] if scored else None


def fetch_audio_preview_and_artwork(track_name, artist):
    """
    Fetch direct audio preview stream (MP3/AAC) and high-res album artwork.
    Uses a multi-stage approach with up to 6 query variants:
      1. iTunes  (limit=5, picks best fuzzy match)
      2. Deezer  (limit=5, xl cover art preferred)
    Works for English, Indian, Portuguese, and other non-English tracks.
    """
    clean_t = clean_track_query(track_name)
    clean_a = clean_artist_query(artist)

    # Build a de-duped ordered list of query variants, most specific to least
    queries = []

    def _add(q):
        q = q.strip()
        if q and q not in queries:
            queries.append(q)

    _add(f"{clean_t} {clean_a}")      # cleaned title + primary artist
    _add(f"{clean_t}")                 # cleaned title only
    _add(f"{track_name} {clean_a}")   # raw title + primary artist
    _add(f"{track_name}")             # raw title only
    _add(f"{clean_a} {clean_t}")      # artist-first
    _add(f"{clean_a}")                # artist only (last resort for art)

    # ── 1. iTunes ────────────────────────────────────────────────────────
    for q in queries:
        results = _itunes_search(q, limit=5)
        if not results:
            continue
        item = _best_itunes_match(results, track_name, artist) or results[0]
        art = item.get("artworkUrl100", "")
        if art:
            art = art.replace("100x100bb.jpg", "600x600bb.jpg")
        preview = item.get("previewUrl")
        if preview or art:
            return {
                "preview_url": preview,
                "album_image": art or None,
                "album_name": item.get("collectionName", "")
            }

    # ── 2. Deezer ────────────────────────────────────────────────────────
    for q in queries:
        results = _deezer_search(q, limit=5)
        if not results:
            continue
        item = results[0]
        art = (
            item.get("album", {}).get("cover_xl")
            or item.get("album", {}).get("cover_big")
            or item.get("album", {}).get("cover_medium")
        )
        preview = item.get("preview")
        if preview or art:
            return {
                "preview_url": preview,
                "album_image": art,
                "album_name": item.get("album", {}).get("title", "")
            }

    return {"preview_url": None, "album_image": None, "album_name": None}


def search_track(track_name, artist):
    """
    Search Spotify for track metadata, album art, preview, and external Spotify URLs.
    Includes seamless fallback to public music stream CDN for instant audio playback.
    """
    token = get_access_token()
    spotify_data = None

    if token:
        try:
            headers = {"Authorization": f"Bearer {token}"}
            params = {
                "q": f"track:{track_name} artist:{artist}",
                "type": "track",
                "limit": 1
            }
            response = requests.get(SEARCH_URL, headers=headers, params=params, timeout=6)
            if response.status_code == 200:
                tracks = response.json().get("tracks", {}).get("items", [])
                if not tracks:
                    # Retry with looser search query
                    params["q"] = f"{track_name} {artist}"
                    response = requests.get(SEARCH_URL, headers=headers, params=params, timeout=6)
                    if response.status_code == 200:
                        tracks = response.json().get("tracks", {}).get("items", [])

                if tracks:
                    t = tracks[0]
                    images = t.get("album", {}).get("images", [])
                    spotify_data = {
                        "spotify_id": t.get("id"),
                        "release_date": t.get("album", {}).get("release_date", "2020-01-01"),
                        "release_date_precision": t.get("album", {}).get("release_date_precision", "year"),
                        "album_name": t.get("album", {}).get("name"),
                        "album_image": images[0]["url"] if images else None,
                        "preview_url": t.get("preview_url"),
                        "external_url": t.get("external_urls", {}).get("spotify"),
                        "spotify_url": t.get("external_urls", {}).get("spotify")
                    }
        except Exception as e:
            print(f"Spotify API search notice: {e}")

    # Fallback to direct streaming preview and album art if preview/image is missing
    preview_info = fetch_audio_preview_and_artwork(track_name, artist)

    spotify_url = f"https://open.spotify.com/search/{urllib.parse.quote(f'{track_name} {artist}')}"
    if spotify_data and spotify_data.get("spotify_url"):
        spotify_url = spotify_data["spotify_url"]

    album_image = None
    if spotify_data and spotify_data.get("album_image"):
        album_image = spotify_data["album_image"]
    elif preview_info.get("album_image"):
        album_image = preview_info["album_image"]

    preview_url = None
    if spotify_data and spotify_data.get("preview_url"):
        preview_url = spotify_data["preview_url"]
    elif preview_info.get("preview_url"):
        preview_url = preview_info["preview_url"]

    spotify_id = spotify_data.get("spotify_id") if spotify_data else None

    return {
        "track_name": track_name,
        "artists": artist,
        "spotify_id": spotify_id,
        "release_date": spotify_data.get("release_date", "2020-01-01") if spotify_data else "2020-01-01",
        "release_date_precision": spotify_data.get("release_date_precision", "year") if spotify_data else "year",
        "album_name": spotify_data.get("album_name") if spotify_data else preview_info.get("album_name"),
        "album_image": album_image,
        "preview_url": preview_url,
        "external_url": spotify_url,
        "spotify_url": spotify_url
    }


def calculate_recency_score(release_date, precision):
    """Convert a release date into a recency score from 0 to 1."""
    if not release_date:
        return 0.5
    try:
        if precision == "day":
            release = date(int(release_date[:4]), int(release_date[5:7]), int(release_date[8:10]))
        elif precision == "month":
            release = date(int(release_date[:4]), int(release_date[5:7]), 15)
        elif precision == "year":
            release = date(int(release_date[:4]), 7, 1)
        else:
            return 0.5
        today = date.today()
        age_days = max(0, (today - release).days)
        age_years = age_days / 365.25
        return round(2 ** (-age_years / 5), 4)
    except (ValueError, TypeError):
        return 0.5


def load_cache():
    """Load Spotify metadata cache."""
    columns = [
        "track_name", "artists", "spotify_id", "release_date",
        "release_date_precision", "album_name", "recency_score",
        "album_image", "preview_url", "external_url", "spotify_url"
    ]
    if not os.path.exists(CACHE_FILE):
        return pd.DataFrame(columns=columns)
    try:
        cache = pd.read_csv(CACHE_FILE)
        return cache if not cache.empty else pd.DataFrame(columns=columns)
    except Exception:
        return pd.DataFrame(columns=columns)


def save_cache(cache):
    """Save Spotify metadata cache."""
    try:
        os.makedirs(os.path.dirname(CACHE_FILE), exist_ok=True)
        cache.to_csv(CACHE_FILE, index=False)
    except Exception as e:
        print(f"Warning: Could not save cache: {e}")


def get_track_metadata(track_name, artist):
    """Get Spotify metadata using the local cache when available."""
    cache = load_cache()

    # Check cache first
    cached = cache[
        (cache["track_name"].astype(str).str.lower() == str(track_name).lower()) &
        (cache["artists"].astype(str).str.lower() == str(artist).lower())
    ]

    cached_id = None
    if not cached.empty:
        row_dict = cached.iloc[0].to_dict()
        # If cache already has both album_image and preview_url, return it
        if pd.notna(row_dict.get("album_image")) and pd.notna(row_dict.get("preview_url")):
            return row_dict
        cached_id = row_dict.get("spotify_id")

    result = search_track(track_name, artist)
    if result is None:
        return None

    if cached_id and not result.get("spotify_id"):
        result["spotify_id"] = cached_id
        result["spotify_url"] = f"https://open.spotify.com/track/{cached_id}"
        result["external_url"] = f"https://open.spotify.com/track/{cached_id}"

    result["recency_score"] = calculate_recency_score(
        result.get("release_date"),
        result.get("release_date_precision")
    )

    # Update cache (replace existing row or append new)
    new_row = pd.DataFrame([result])
    if cache.empty:
        cache = new_row
    else:
        # Drop old cached row if existed
        cache = cache[
            ~(
                (cache["track_name"].astype(str).str.lower() == str(track_name).lower()) &
                (cache["artists"].astype(str).str.lower() == str(artist).lower())
            )
        ]
        cache = pd.concat([cache, new_row], ignore_index=True)
    save_cache(cache)

    return result


if __name__ == "__main__":
    test_track = "Can't Help Falling In Love"
    test_artist = "Kina Grannis"
    res = get_track_metadata(test_track, test_artist)
    print("Enrichment test result:")
    print("Track:", res.get("track_name"))
    print("Artist:", res.get("artists"))
    print("Album Image:", res.get("album_image"))
    print("Audio Preview:", res.get("preview_url"))
    print("Spotify URL:", res.get("spotify_url"))
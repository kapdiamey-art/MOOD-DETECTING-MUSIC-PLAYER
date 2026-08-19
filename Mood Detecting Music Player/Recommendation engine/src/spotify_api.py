import os
import base64
from datetime import date

import pandas as pd
import requests
from dotenv import load_dotenv


load_dotenv()


CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")

TOKEN_URL = "https://accounts.spotify.com/api/token"
SEARCH_URL = "https://api.spotify.com/v1/search"

CACHE_FILE = "data/processed/spotify_metadata.csv"


def get_access_token():
    """Get a Spotify access token using Client Credentials."""

    if not CLIENT_ID or not CLIENT_SECRET:
        raise ValueError(
            "Spotify credentials are missing. "
            "Check your .env file."
        )

    credentials = f"{CLIENT_ID}:{CLIENT_SECRET}"

    encoded_credentials = base64.b64encode(
        credentials.encode()
    ).decode()

    headers = {
        "Authorization": f"Basic {encoded_credentials}",
        "Content-Type": "application/x-www-form-urlencoded"
    }

    data = {
        "grant_type": "client_credentials"
    }

    response = requests.post(
        TOKEN_URL,
        headers=headers,
        data=data,
        timeout=10
    )

    response.raise_for_status()

    return response.json()["access_token"]


def search_track(track_name, artist):
    """Search Spotify for a track and return its metadata."""

    token = get_access_token()

    headers = {
        "Authorization": f"Bearer {token}"
    }

    params = {
        "q": f"track:{track_name} artist:{artist}",
        "type": "track",
        "limit": 1
    }

    response = requests.get(
        SEARCH_URL,
        headers=headers,
        params=params,
        timeout=10
    )

    response.raise_for_status()

    tracks = response.json()["tracks"]["items"]

    if not tracks:
        return None

    track = tracks[0]

    return {
        "spotify_id": track["id"],
        "track_name": track["name"],
        "artists": ", ".join(
            artist["name"]
            for artist in track["artists"]
        ),
        "release_date": track["album"]["release_date"],
        "release_date_precision": track["album"]["release_date_precision"],
        "album_name": track["album"]["name"]
    }


def calculate_recency_score(release_date, precision):
    """
    Convert a Spotify release date into a recency score from 0 to 1.

    More recent releases receive higher scores.
    """

    if not release_date:
        return 0.5

    try:
        if precision == "day":
            release = date(
                int(release_date[:4]),
                int(release_date[5:7]),
                int(release_date[8:10])
            )

        elif precision == "month":
            release = date(
                int(release_date[:4]),
                int(release_date[5:7]),
                15
            )

        elif precision == "year":
            release = date(
                int(release_date[:4]),
                7,
                1
            )

        else:
            return 0.5

        today = date.today()

        age_days = max(
            0,
            (today - release).days
        )

        age_years = age_days / 365.25

        # Five-year half-life.
        score = 2 ** (-age_years / 5)

        return round(score, 4)

    except (ValueError, TypeError):
        return 0.5


def load_cache():
    """Load Spotify metadata cache."""

    columns = [
        "track_name",
        "artists",
        "spotify_id",
        "release_date",
        "release_date_precision",
        "album_name",
        "recency_score"
    ]

    if not os.path.exists(CACHE_FILE):
        return pd.DataFrame(columns=columns)

    try:
        cache = pd.read_csv(CACHE_FILE)

        if cache.empty:
            return pd.DataFrame(columns=columns)

        return cache

    except pd.errors.EmptyDataError:
        return pd.DataFrame(columns=columns)


def save_cache(cache):
    """Save Spotify metadata cache."""

    cache.to_csv(
        CACHE_FILE,
        index=False
    )


def get_track_metadata(track_name, artist):
    """
    Get Spotify metadata using the local cache when available.
    """

    cache = load_cache()

    # Check cache first
    cached = cache[
        (cache["track_name"] == track_name)
        & (cache["artists"] == artist)
    ]

    if not cached.empty:
        return cached.iloc[0].to_dict()

    # Not cached, so query Spotify
    result = search_track(
        track_name,
        artist
    )

    if result is None:
        return None

    # Calculate recency
    result["recency_score"] = calculate_recency_score(
        result["release_date"],
        result["release_date_precision"]
    )

    # Add to cache
    new_row = pd.DataFrame([result])

    if cache.empty:
        cache = new_row
    else:
        cache = pd.concat(
            [cache, new_row],
            ignore_index=True
        )

    save_cache(cache)

    return result


if __name__ == "__main__":

    result = get_track_metadata(
        "CASE 143",
        "Stray Kids"
    )

    print(result)

    if result:
        print(
            "Recency score:",
            result["recency_score"]
        )
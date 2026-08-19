import pandas as pd
import numpy as np

try:
    from .spotify_api import get_track_metadata
except ImportError:
    from spotify_api import get_track_metadata


# Load data
songs = pd.read_csv("data/processed/music_dataset_clean.csv")
moods = pd.read_csv("data/processed/mood_profiles.csv")


# Features used for mood matching
FEATURES = [
    "energy",
    "valence",
    "danceability",
    "acousticness"
]


# Mood-specific feature weights
MOOD_WEIGHTS = {
    "happy": {
        "energy": 0.25,
        "valence": 0.35,
        "danceability": 0.25,
        "acousticness": 0.15
    },
    "sad": {
        "energy": 0.30,
        "valence": 0.40,
        "danceability": 0.10,
        "acousticness": 0.20
    },
    "angry": {
        "energy": 0.40,
        "valence": 0.30,
        "danceability": 0.15,
        "acousticness": 0.15
    },
    "calm": {
        "energy": 0.30,
        "valence": 0.20,
        "danceability": 0.15,
        "acousticness": 0.35
    },
    "energetic": {
        "energy": 0.35,
        "valence": 0.20,
        "danceability": 0.35,
        "acousticness": 0.10
    }
}


def recommend(mood, n=10, candidate_size=50):
    """
    Recommend songs for a selected mood.

    Process:
    1. Select the target mood profile.
    2. Generate candidate songs using weighted mood distance.
    3. Retrieve Spotify release metadata.
    4. Calculate recency scores.
    5. Remove duplicate Spotify tracks.
    6. Rank using mood match, popularity, and recency.
    7. Return the top N songs.
    """

    mood = mood.lower()

    if mood not in MOOD_WEIGHTS:
        raise ValueError(
            f"Invalid mood '{mood}'. "
            f"Choose from: {list(MOOD_WEIGHTS.keys())}"
        )

    # Get selected mood profile
    profile = moods[moods["mood"] == mood].iloc[0]

    # Work on a copy
    data = songs.copy()

    # Get mood-specific weights
    weights = np.array(
        [MOOD_WEIGHTS[mood][feature] for feature in FEATURES]
    )

    # Target mood feature values
    target = profile[FEATURES].values.astype(float)

    # Song feature values
    song_features = data[FEATURES].values.astype(float)

    # Weighted Euclidean distance
    weighted_distance = np.sqrt(
        np.sum(
            weights * (song_features - target) ** 2,
            axis=1
        )
    )

    data["mood_distance"] = weighted_distance

    # Generate mood-based candidates
    candidates = data.nsmallest(
        candidate_size,
        "mood_distance"
    ).copy()

    # Remove duplicate dataset entries
    candidates = candidates.drop_duplicates(
        subset=["track_name", "artists"]
    )

    # Spotify metadata
    spotify_ids = []
    recency_scores = []

    for _, row in candidates.iterrows():

        metadata = get_track_metadata(
            row["track_name"],
            row["artists"]
        )

        if metadata:
            spotify_ids.append(
                metadata["spotify_id"]
            )

            recency_scores.append(
                metadata["recency_score"]
            )

        else:
            spotify_ids.append(None)

            # Neutral fallback when Spotify
            # cannot find the track
            recency_scores.append(0.5)

    candidates["spotify_id"] = spotify_ids
    candidates["recency_score"] = recency_scores

    # Remove duplicate Spotify tracks.
    # Keep songs that have no Spotify match.
    spotify_matches = candidates[
        candidates["spotify_id"].notna()
    ].drop_duplicates(
        subset=["spotify_id"]
    )

    spotify_unmatched = candidates[
        candidates["spotify_id"].isna()
    ]

    candidates = pd.concat(
        [spotify_matches, spotify_unmatched],
        ignore_index=True
    )

    # Popularity normalized to 0-1
    candidates["popularity_score"] = (
        candidates["popularity"] / 100.0
    )

    # Mood match score
    candidates["mood_score"] = (
        1 - candidates["mood_distance"]
    )

    # Final ranking score
    #
    # Mood similarity = 85%
    # Popularity       = 10%
    # Recency          = 5%
    candidates["final_score"] = (
        0.85 * candidates["mood_score"]
        + 0.10 * candidates["popularity_score"]
        + 0.05 * candidates["recency_score"]
    )

    # Final ranking
    recommendations = candidates.sort_values(
        "final_score",
        ascending=False
    ).head(n)

    return recommendations[
        [
            "track_name",
            "artists",
            "track_genre",
            "mood_score",
            "popularity",
            "recency_score",
            "final_score"
        ]
    ].reset_index(drop=True)


# Test all supported moods
if __name__ == "__main__":

    for mood in [
        "happy",
        "sad",
        "angry",
        "calm",
        "energetic"
    ]:

        print(f"\n--- {mood.upper()} ---")

        result = recommend(
            mood,
            n=5,
            candidate_size=50
        )

        print(
            result.to_string(index=False)
        )
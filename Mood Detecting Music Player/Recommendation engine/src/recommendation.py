import os
import sys
import numpy as np
import pandas as pd

# ---------------------------------------------------------
# Spotify API import
# ---------------------------------------------------------

try:
    from src.spotify_api import get_track_metadata
except ModuleNotFoundError:
    sys.path.append(
        os.path.dirname(os.path.abspath(__file__))
    )
    from spotify_api import get_track_metadata


# ---------------------------------------------------------
# Paths
# ---------------------------------------------------------

BASE_DIR = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
)

DATA_DIR = os.path.join(
    BASE_DIR,
    "data",
    "processed"
)

SONGS_PATH = os.path.join(
    DATA_DIR,
    "music_dataset_clean.csv"
)


# ---------------------------------------------------------
# Load dataset
# ---------------------------------------------------------

songs = pd.read_csv(
    SONGS_PATH
)


# ---------------------------------------------------------
# Audio features
# ---------------------------------------------------------

FEATURES = [
    "energy",
    "valence",
    "danceability",
    "acousticness"
]


# ---------------------------------------------------------
# Emotions produced by the ML model
# ---------------------------------------------------------

EMOTIONS = [
    "joy",
    "angry",
    "love",
    "surprise",
    "fear",
    "sadness"
]


# ---------------------------------------------------------
# Emotion music profiles
# ---------------------------------------------------------

EMOTION_PROFILES = {

    "joy": {
        "energy": 0.75,
        "valence": 0.85,
        "danceability": 0.75,
        "acousticness": 0.25
    },

    "angry": {
        "energy": 0.90,
        "valence": 0.25,
        "danceability": 0.55,
        "acousticness": 0.10
    },

    "love": {
        "energy": 0.55,
        "valence": 0.75,
        "danceability": 0.60,
        "acousticness": 0.45
    },

    "surprise": {
        "energy": 0.80,
        "valence": 0.65,
        "danceability": 0.70,
        "acousticness": 0.20
    },

    "fear": {
        "energy": 0.65,
        "valence": 0.20,
        "danceability": 0.30,
        "acousticness": 0.55
    },

    "sadness": {
        "energy": 0.30,
        "valence": 0.20,
        "danceability": 0.25,
        "acousticness": 0.65
    }
}


# ---------------------------------------------------------
# Emotion-specific feature weights
# ---------------------------------------------------------

EMOTION_WEIGHTS = {

    "joy": {
        "energy": 0.25,
        "valence": 0.35,
        "danceability": 0.25,
        "acousticness": 0.15
    },

    "angry": {
        "energy": 0.40,
        "valence": 0.30,
        "danceability": 0.20,
        "acousticness": 0.10
    },

    "love": {
        "energy": 0.20,
        "valence": 0.35,
        "danceability": 0.20,
        "acousticness": 0.25
    },

    "surprise": {
        "energy": 0.35,
        "valence": 0.25,
        "danceability": 0.30,
        "acousticness": 0.10
    },

    "fear": {
        "energy": 0.30,
        "valence": 0.40,
        "danceability": 0.10,
        "acousticness": 0.20
    },

    "sadness": {
        "energy": 0.25,
        "valence": 0.40,
        "danceability": 0.10,
        "acousticness": 0.25
    }
}


# ---------------------------------------------------------
# Base ranking weights
# ---------------------------------------------------------

BASE_RANKING_WEIGHTS = {

    "mood": 0.50,
    "genre": 0.15,
    "language": 0.10,
    "artist": 0.10,
    "audio": 0.10,
    "popularity": 0.03,
    "recency": 0.02
}


# ---------------------------------------------------------
# Text normalization
# ---------------------------------------------------------

def normalize_text(value):

    if pd.isna(value):
        return ""

    return str(value).strip().lower()


# ---------------------------------------------------------
# Convert preference to list
# ---------------------------------------------------------

def normalize_preferences(preferences):

    if preferences is None:
        return {}

    normalized = {}

    for key, value in preferences.items():

        if value is None:
            normalized[key] = []
            continue

        if isinstance(value, str):
            normalized[key] = [value]
        else:
            normalized[key] = value

    return normalized


# ---------------------------------------------------------
# Preference matching
# ---------------------------------------------------------

def preference_score(
    value,
    preferences
):

    if not preferences:
        return 0.0

    value = normalize_text(
        value
    )

    if isinstance(
        preferences,
        str
    ):
        preferences = [
            preferences
        ]

    for preference in preferences:

        preference = normalize_text(
            preference
        )

        if (
            preference
            and preference in value
        ):
            return 1.0

    return 0.0


# ---------------------------------------------------------
# Audio preference score
# ---------------------------------------------------------

def calculate_audio_preference_score(
    row,
    preferences
):

    if not preferences:
        return 0.0

    scores = []

    for feature in FEATURES:

        if feature not in preferences:
            continue

        try:

            target = float(
                preferences[feature]
            )

            actual = float(
                row[feature]
            )

        except (
            ValueError,
            TypeError
        ):

            continue

        difference = abs(
            actual - target
        )

        score = max(
            0.0,
            1.0 - difference
        )

        scores.append(
            score
        )

    if not scores:
        return 0.0

    return float(
        np.mean(scores)
    )


# ---------------------------------------------------------
# Feedback score
# ---------------------------------------------------------

def calculate_feedback_score(
    row,
    feedback
):

    if not feedback:
        return 0.0

    liked_artists = feedback.get(
        "liked_artists",
        []
    )

    liked_genres = feedback.get(
        "liked_genres",
        []
    )

    liked_tracks = feedback.get(
        "liked_tracks",
        []
    )

    skipped_artists = feedback.get(
        "skipped_artists",
        []
    )

    skipped_genres = feedback.get(
        "skipped_genres",
        []
    )

    skipped_tracks = feedback.get(
        "skipped_tracks",
        []
    )

    positive = 0.0
    negative = 0.0

    if preference_score(
        row["artists"],
        liked_artists
    ):
        positive += 1.0

    if preference_score(
        row["track_genre"],
        liked_genres
    ):
        positive += 1.0

    if preference_score(
        row["track_name"],
        liked_tracks
    ):
        positive += 1.0

    if preference_score(
        row["artists"],
        skipped_artists
    ):
        negative += 1.0

    if preference_score(
        row["track_genre"],
        skipped_genres
    ):
        negative += 1.0

    if preference_score(
        row["track_name"],
        skipped_tracks
    ):
        negative += 1.0

    if positive > 0:
        return min(
            positive / 3.0,
            1.0
        )

    if negative > 0:
        return -min(
            negative / 3.0,
            1.0
        )

    return 0.0


# ---------------------------------------------------------
# Emotion confidence adjustment
# ---------------------------------------------------------

def calculate_ranking_weights(
    confidence
):

    try:
        confidence = float(
            confidence
        )
    except (
        ValueError,
        TypeError
    ):
        confidence = 1.0

    confidence = min(
        max(
            confidence,
            0.0
        ),
        1.0
    )

    weights = BASE_RANKING_WEIGHTS.copy()

    # Emotion confidence controls how strongly
    # mood matching influences the result.
    #
    # High confidence:
    #     stronger mood influence
    #
    # Lower confidence:
    #     personalization has relatively more influence

    original_mood = weights["mood"]

    weights["mood"] = (
        original_mood
        * (
            0.70
            + 0.30 * confidence
        )
    )

    remaining = (
        1.0
        - weights["mood"]
    )

    original_non_mood = (
        1.0
        - original_mood
    )

    if original_non_mood > 0:

        for key in weights:

            if key == "mood":
                continue

            weights[key] = (
                weights[key]
                * remaining
                / original_non_mood
            )

    return weights


# ---------------------------------------------------------
# Spotify enrichment
# ---------------------------------------------------------

def enrich_with_spotify(
    data
):

    recency_scores = []
    spotify_ids = []

    for _, row in data.iterrows():

        metadata = get_track_metadata(
            row["track_name"],
            row["artists"]
        )

        if metadata:

            try:

                recency = float(
                    metadata.get(
                        "recency_score",
                        0.5
                    )
                )

            except (
                ValueError,
                TypeError
            ):

                recency = 0.5

            recency_scores.append(
                recency
            )

            spotify_ids.append(
                metadata.get(
                    "spotify_id"
                )
            )

        else:

            recency_scores.append(
                0.5
            )

            spotify_ids.append(
                None
            )

    data["recency_score"] = (
        recency_scores
    )

    data["spotify_id"] = (
        spotify_ids
    )

    return data


# ---------------------------------------------------------
# Recommendation engine
# ---------------------------------------------------------

def recommend(
    emotion,
    n=10,
    candidate_size=50,
    preferences=None,
    confidence=1.0,
    feedback=None,
    use_spotify=True
):

    """
    Generate personalized music recommendations.

    Parameters
    ----------
    emotion : str
        Emotion produced by the ML model.

    n : int
        Number of recommendations.

    candidate_size : int
        Number of candidates selected from each
        mood/preference pool.

    preferences : dict
        User preferences.

        Example:

        {
            "genres": ["k-pop", "pop"],
            "languages": ["english"],
            "artists": ["BTS"],
            "audio": {
                "energy": 0.8,
                "valence": 0.8,
                "danceability": 0.7,
                "acousticness": 0.2
            }
        }

    confidence : float
        Confidence score from the emotion model.
        Expected range: 0 to 1.

    feedback : dict
        Optional user feedback/history.

        Example:

        {
            "liked_artists": ["BTS"],
            "liked_genres": ["k-pop"],
            "liked_tracks": ["Like"],
            "skipped_artists": [],
            "skipped_genres": [],
            "skipped_tracks": []
        }

    use_spotify : bool
        Whether to retrieve Spotify metadata.
    """

    emotion = normalize_text(
        emotion
    )

    if emotion not in EMOTIONS:

        raise ValueError(
            f"Invalid emotion '{emotion}'. "
            f"Choose from: {EMOTIONS}"
        )

    preferences = normalize_preferences(
        preferences
    )

    if feedback is None:
        feedback = {}


    # -----------------------------------------------------
    # Emotion target
    # -----------------------------------------------------

    target = np.array(
        [
            EMOTION_PROFILES[
                emotion
            ][feature]
            for feature in FEATURES
        ],
        dtype=float
    )


    # -----------------------------------------------------
    # Emotion feature weights
    # -----------------------------------------------------

    feature_weights = np.array(
        [
            EMOTION_WEIGHTS[
                emotion
            ][feature]
            for feature in FEATURES
        ],
        dtype=float
    )


    # -----------------------------------------------------
    # Copy dataset
    # -----------------------------------------------------

    data = songs.copy()


    # -----------------------------------------------------
    # Calculate weighted mood distance
    # -----------------------------------------------------

    song_features = data[
        FEATURES
    ].values.astype(float)

    weighted_distance = np.sqrt(
        np.sum(
            feature_weights
            * (
                song_features
                - target
            ) ** 2,
            axis=1
        )
    )

    data["mood_distance"] = (
        weighted_distance
    )


    # -----------------------------------------------------
    # Mood candidate pool
    # -----------------------------------------------------

    mood_candidates = (
        data
        .nsmallest(
            candidate_size,
            "mood_distance"
        )
        .copy()
    )


    # -----------------------------------------------------
    # Preference candidate pool
    # -----------------------------------------------------

    preference_candidates = (
        pd.DataFrame()
    )

    genres = preferences.get(
        "genres",
        []
    )

    artists = preferences.get(
        "artists",
        []
    )

    if genres or artists:

        genre_mask = pd.Series(
            False,
            index=data.index
        )

        artist_mask = pd.Series(
            False,
            index=data.index
        )


        if genres:

            genre_mask = data[
                "track_genre"
            ].apply(
                lambda x:
                preference_score(
                    x,
                    genres
                ) > 0
            )


        if artists:

            artist_mask = data[
                "artists"
            ].apply(
                lambda x:
                preference_score(
                    x,
                    artists
                ) > 0
            )


        preference_candidates = data[
            genre_mask
            |
            artist_mask
        ].copy()


        preference_candidates = (
            preference_candidates
            .nsmallest(
                candidate_size,
                "mood_distance"
            )
        )


    # -----------------------------------------------------
    # Feedback candidate pool
    # -----------------------------------------------------

    feedback_candidates = (
        pd.DataFrame()
    )

    feedback_artists = feedback.get(
        "liked_artists",
        []
    )

    feedback_genres = feedback.get(
        "liked_genres",
        []
    )

    if (
        feedback_artists
        or feedback_genres
    ):

        feedback_artist_mask = (
            pd.Series(
                False,
                index=data.index
            )
        )

        feedback_genre_mask = (
            pd.Series(
                False,
                index=data.index
            )
        )

        if feedback_artists:

            feedback_artist_mask = (
                data[
                    "artists"
                ].apply(
                    lambda x:
                    preference_score(
                        x,
                        feedback_artists
                    ) > 0
                )
            )

        if feedback_genres:

            feedback_genre_mask = (
                data[
                    "track_genre"
                ].apply(
                    lambda x:
                    preference_score(
                        x,
                        feedback_genres
                    ) > 0
                )
            )

        feedback_candidates = data[
            feedback_artist_mask
            |
            feedback_genre_mask
        ].copy()

        feedback_candidates = (
            feedback_candidates
            .nsmallest(
                candidate_size,
                "mood_distance"
            )
        )


    # -----------------------------------------------------
    # Combine candidate pools
    # -----------------------------------------------------

    candidates = pd.concat(
        [
            mood_candidates,
            preference_candidates,
            feedback_candidates
        ],
        ignore_index=True
    )


    # -----------------------------------------------------
    # Remove duplicate songs
    # -----------------------------------------------------

    candidates = (
        candidates
        .drop_duplicates(
            subset=[
                "track_name",
                "artists"
            ]
        )
        .copy()
    )


    # -----------------------------------------------------
    # Mood score
    # -----------------------------------------------------

    candidates["mood_score"] = (
        1.0
        - candidates[
            "mood_distance"
        ]
    )

    candidates["mood_score"] = (
        candidates[
            "mood_score"
        ].clip(
            0.0,
            1.0
        )
    )


    # -----------------------------------------------------
    # Popularity score
    # -----------------------------------------------------

    candidates[
        "popularity_score"
    ] = (
        candidates[
            "popularity"
        ]
        .fillna(0)
        .clip(0, 100)
        / 100.0
    )


    # -----------------------------------------------------
    # Genre preference score
    # -----------------------------------------------------

    candidates[
        "genre_score"
    ] = candidates[
        "track_genre"
    ].apply(
        lambda x:
        preference_score(
            x,
            genres
        )
    )


    # -----------------------------------------------------
    # Language preference score
    # -----------------------------------------------------
    #
    # The current dataset has no language column.
    # Therefore this remains zero until language
    # metadata is added.
    # -----------------------------------------------------

    languages = preferences.get(
        "languages",
        []
    )

    if "language" in candidates.columns:

        candidates[
            "language_score"
        ] = candidates[
            "language"
        ].apply(
            lambda x:
            preference_score(
                x,
                languages
            )
        )

    else:

        candidates[
            "language_score"
        ] = 0.0


    # -----------------------------------------------------
    # Artist preference score
    # -----------------------------------------------------

    candidates[
        "artist_score"
    ] = candidates[
        "artists"
    ].apply(
        lambda x:
        preference_score(
            x,
            artists
        )
    )


    # -----------------------------------------------------
    # Audio preference score
    # -----------------------------------------------------

    audio_preferences = (
        preferences.get(
            "audio",
            {}
        )
    )

    candidates[
        "audio_score"
    ] = candidates.apply(
        lambda row:
        calculate_audio_preference_score(
            row,
            audio_preferences
        ),
        axis=1
    )


    # -----------------------------------------------------
    # Feedback score
    # -----------------------------------------------------

    candidates[
        "feedback_score"
    ] = candidates.apply(
        lambda row:
        calculate_feedback_score(
            row,
            feedback
        ),
        axis=1
    )


    # -----------------------------------------------------
    # Spotify recency
    # -----------------------------------------------------

    if use_spotify:

        candidates = (
            enrich_with_spotify(
                candidates
            )
        )

    else:

        candidates[
            "recency_score"
        ] = 0.0

        candidates[
            "spotify_id"
        ] = None


    # -----------------------------------------------------
    # Ranking weights
    # -----------------------------------------------------

    ranking_weights = (
        calculate_ranking_weights(
            confidence
        )
    )


    # -----------------------------------------------------
    # Personalized score
    # -----------------------------------------------------

    candidates[
        "final_score"
    ] = (

        ranking_weights[
            "mood"
        ]
        * candidates[
            "mood_score"
        ]

        +

        ranking_weights[
            "genre"
        ]
        * candidates[
            "genre_score"
        ]

        +

        ranking_weights[
            "language"
        ]
        * candidates[
            "language_score"
        ]

        +

        ranking_weights[
            "artist"
        ]
        * candidates[
            "artist_score"
        ]

        +

        ranking_weights[
            "audio"
        ]
        * candidates[
            "audio_score"
        ]

        +

        ranking_weights[
            "popularity"
        ]
        * candidates[
            "popularity_score"
        ]

        +

        ranking_weights[
            "recency"
        ]
        * candidates[
            "recency_score"
        ]

        +

        0.05
        * candidates[
            "feedback_score"
        ]
    )


    # -----------------------------------------------------
    # Penalize skipped songs/artists/genres
    # -----------------------------------------------------

    skipped_tracks = feedback.get(
        "skipped_tracks",
        []
    )

    skipped_artists = feedback.get(
        "skipped_artists",
        []
    )

    skipped_genres = feedback.get(
        "skipped_genres",
        []
    )

    if (
        skipped_tracks
        or skipped_artists
        or skipped_genres
    ):

        skip_mask = (

            candidates[
                "track_name"
            ].apply(
                lambda x:
                preference_score(
                    x,
                    skipped_tracks
                ) > 0
            )

            |

            candidates[
                "artists"
            ].apply(
                lambda x:
                preference_score(
                    x,
                    skipped_artists
                ) > 0
            )

            |

            candidates[
                "track_genre"
            ].apply(
                lambda x:
                preference_score(
                    x,
                    skipped_genres
                ) > 0
            )
        )

        candidates.loc[
            skip_mask,
            "final_score"
        ] *= 0.70


    # -----------------------------------------------------
    # Sort recommendations
    # -----------------------------------------------------

    candidates = (
        candidates
        .sort_values(
            "final_score",
            ascending=False
        )
    )


    # -----------------------------------------------------
    # Remove duplicate Spotify IDs
    # -----------------------------------------------------

    if "spotify_id" in candidates.columns:

        candidates = candidates[
            candidates[
                "spotify_id"
            ].isna()
            |
            ~candidates[
                "spotify_id"
            ].duplicated()
        ]


    # -----------------------------------------------------
    # Result columns
    # -----------------------------------------------------

    result_columns = [

        "track_name",

        "artists",

        "track_genre",

        "mood_score",

        "genre_score",

        "language_score",

        "artist_score",

        "audio_score",

        "feedback_score",

        "popularity",

        "recency_score",

        "final_score"
    ]


    return (
        candidates[
            result_columns
        ]
        .head(n)
        .reset_index(drop=True)
    )


# ---------------------------------------------------------
# Local testing
# ---------------------------------------------------------

if __name__ == "__main__":

    test_preferences = {

        "genres": [
            "k-pop",
            "pop",
            "indian"
        ],

        "languages": [
            "english",
            "hindi"
        ],

        "artists": [
            "BTS",
            "Diljit Dosanjh"
        ],

        "audio": {

            "energy": 0.80,

            "valence": 0.80,

            "danceability": 0.70,

            "acousticness": 0.20
        }
    }


    test_feedback = {

        "liked_artists": [
            "BTS"
        ],

        "liked_genres": [
            "k-pop"
        ],

        "liked_tracks": [],

        "skipped_artists": [],

        "skipped_genres": [],

        "skipped_tracks": []
    }


    for emotion in EMOTIONS:

        print(
            f"\n--- {emotion.upper()} ---"
        )

        result = recommend(

            emotion,

            n=5,

            preferences=test_preferences,

            confidence=0.90,

            feedback=test_feedback,

            use_spotify=False
        )

        print(
            result.to_string(
                index=False
            )
        )
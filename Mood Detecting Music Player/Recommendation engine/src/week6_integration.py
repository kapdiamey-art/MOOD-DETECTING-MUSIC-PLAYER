import os
import sys

import pandas as pd


# =========================================================
# PATHS
# =========================================================

CURRENT_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

RECOMMENDATION_ENGINE_DIR = os.path.dirname(
    CURRENT_DIR
)

PROJECT_DIR = os.path.dirname(
    RECOMMENDATION_ENGINE_DIR
)

ML_DIR = os.path.join(
    PROJECT_DIR,
    "Emotion Detection Model"
)

ML_SRC_DIR = os.path.join(
    ML_DIR,
    "src"
)

# =========================================================
# ADD ML SRC TO PATH (needed so predict.py can import its siblings)
# =========================================================

if ML_SRC_DIR not in sys.path:
    sys.path.insert(
        0,
        ML_SRC_DIR
    )


# =========================================================
# IMPORT RECOMMENDATION ENGINE
# =========================================================

if CURRENT_DIR not in sys.path:
    sys.path.insert(
        0,
        CURRENT_DIR
    )

from recommendation import recommend  # type: ignore[import-not-found]


# =========================================================
# ML EMOTION LABELS
# =========================================================

ML_LABELS = [
    "sadness",
    "joy",
    "love",
    "anger",
    "fear",
    "surprise"
]


# =========================================================
# RECOMMENDATION ENGINE EMOTION LABELS
# =========================================================

RECOMMENDATION_LABELS = [
    "joy",
    "angry",
    "love",
    "surprise",
    "fear",
    "sadness"
]


# =========================================================
# EMOTION MAPPING
# =========================================================

EMOTION_MAPPING = {

    "sadness": "sadness",

    "joy": "joy",

    "love": "love",

    "anger": "angry",

    "fear": "fear",

    "surprise": "surprise",

    "neutral": "neutral"
}


# =========================================================
# LOAD PREDICT FUNCTION (model is owned by predict.py)
# =========================================================

from predict import predict_emotion_legacy  # type: ignore[import-not-found]


def predict_emotion(text):
    return predict_emotion_legacy(text)


# =========================================================
# MAP ML EMOTION TO RECOMMENDATION EMOTION
# =========================================================

def map_emotion(emotion):

    emotion = emotion.lower().strip()

    if emotion not in EMOTION_MAPPING:

        raise ValueError(
            f"Unknown ML emotion: {emotion}"
        )

    return EMOTION_MAPPING[
        emotion
    ]


# =========================================================
# COMPLETE ML → RECOMMENDATION PIPELINE
# =========================================================

def recommend_from_text(
    text,
    n=5,
    preferences=None,
    feedback=None,
    use_spotify=False,
    language="all"
):

    if not text or not text.strip():

        raise ValueError(
            "Text cannot be empty."
        )

    # -----------------------------------------------------
    # Step 1: ML emotion prediction
    # -----------------------------------------------------

    ml_emotion, confidence = (
        predict_emotion(text)
    )


    if ml_emotion == "neutral" or ml_emotion is None:
        recommendations = recommend(
            "joy",
            n=n,
            preferences=preferences,
            confidence=0.60,
            feedback=feedback,
            use_spotify=use_spotify,
            text=text,
            language=language
        )
        return "neutral", confidence if confidence else 0.50, recommendations

    # -----------------------------------------------------
    # Step 2: Convert ML label
    # -----------------------------------------------------

    recommendation_emotion = (
        map_emotion(
            ml_emotion
        )
    )


    # -----------------------------------------------------
    # Step 3: Recommendation engine
    # -----------------------------------------------------

    recommendations = recommend(

        recommendation_emotion,

        n=n,

        preferences=preferences,

        confidence=confidence,

        feedback=feedback,

        use_spotify=use_spotify,

        text=text,

        language=language
    )


    return (
        ml_emotion,
        confidence,
        recommendations
    )


# =========================================================
# DISPLAY RESULTS
# =========================================================

def display_recommendations(
    text,
    recommendations,
    emotion,
    confidence,
    preferences=None
):

    print()
    print("=" * 60)
    print(
        "WEEK 6 ML → RECOMMENDATION PIPELINE"
    )
    print("=" * 60)

    print(
        f"Input text : {text}"
    )

    print(
        f"ML emotion : {emotion}"
    )

    print(
        f"Confidence : {confidence * 100:.2f}%"
    )

    print(
        f"Mapped emotion : {map_emotion(emotion)}"
    )

    print()

    if preferences:

        print("USER PREFERENCES")

        if preferences.get("genres"):
            print(
                f"Genre : {', '.join(preferences['genres'])}"
            )

        if preferences.get("artists"):
            print(
                f"Artist : {', '.join(preferences['artists'])}"
            )

        print()

    else:

        print(
            "User preferences : Any"
        )

        print()

    print(
        "RECOMMENDED SONGS"
    )

    print("-" * 60)

    columns = [
        "track_name",
        "artists",
        "track_genre",
        "mood_score",
        "final_score"
    ]

    print(
        recommendations[
            columns
        ].to_string(
            index=False
        )
    )

    print("=" * 60)


# =========================================================
# USER INTERFACE
# =========================================================

if __name__ == "__main__":

    print()
    print("=" * 60)
    print(
        "WEEK 6 EMOTION + RECOMMENDATION TEST"
    )
    print("=" * 60)

    print(
        "Emotion model loaded successfully (via predict.py)."
    )

    print()

    # -----------------------------------------------------
    # MOOD INPUT
    # -----------------------------------------------------

    text = input(
        "Enter a sentence describing how you feel: "
    )

    if not text.strip():

        print(
            "No text entered."
        )

        sys.exit(0)

    # -----------------------------------------------------
    # GENRE PREFERENCE
    # -----------------------------------------------------

    print()
    print("GENRE PREFERENCE")
    print("-" * 30)
    print(
        "Press Enter for any genre."
    )
    print(
        "Example: pop, k-pop, indie, rock"
    )

    genre_input = input(
        "Preferred genre: "
    ).strip()

    # -----------------------------------------------------
    # ARTIST PREFERENCE
    # -----------------------------------------------------

    print()
    print("ARTIST PREFERENCE")
    print("-" * 30)
    print(
        "Press Enter for any artist."
    )
    print(
        "Example: Taylor Swift, Lana Del Rey, Billie Eilish"
    )

    artist_input = input(
        "Preferred artist: "
    ).strip()

    # -----------------------------------------------------
    # BUILD PREFERENCES
    # -----------------------------------------------------

    preferences = {}

    if genre_input:

        preferences["genres"] = [
            genre_input
        ]

    if artist_input:

        preferences["artists"] = [
            artist_input
        ]

    if not preferences:

        preferences = None

    # -----------------------------------------------------
    # RUN COMPLETE PIPELINE
    # -----------------------------------------------------

    emotion, confidence, recommendations = (
        recommend_from_text(

            text,

            n=5,

            preferences=preferences,

            use_spotify=False
        )
    )

    # -----------------------------------------------------
    # DISPLAY RESULTS
    # -----------------------------------------------------

    display_recommendations(

        text,

        recommendations,

        emotion,

        confidence,

        preferences
    )
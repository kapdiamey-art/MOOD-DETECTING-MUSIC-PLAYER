import os
import sys
import json
import re

import torch


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

ML_MODELS_DIR = os.path.join(
    ML_DIR,
    "models"
)

VOCABULARY_PATH = os.path.join(
    ML_MODELS_DIR,
    "vocabulary.json"
)

MODEL_PATH = os.path.join(
    ML_MODELS_DIR,
    "emotion_model.pth"
)


# =========================================================
# IMPORT ML MODEL CLASS
# =========================================================

if ML_SRC_DIR not in sys.path:
    sys.path.insert(
        0,
        ML_SRC_DIR
    )

from model import EmotionModel


# =========================================================
# IMPORT RECOMMENDATION ENGINE
# =========================================================

if CURRENT_DIR not in sys.path:
    sys.path.insert(
        0,
        CURRENT_DIR
    )

from recommendation import recommend


# =========================================================
# MODEL CONFIGURATION
# =========================================================

MAX_LENGTH = 50
EMBEDDING_DIM = 128
HIDDEN_DIM = 128
NUM_CLASSES = 6


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

    "surprise": "surprise"
}


# =========================================================
# DEVICE
# =========================================================

device = torch.device(
    "cuda"
    if torch.cuda.is_available()
    else "cpu"
)


# =========================================================
# LOAD VOCABULARY
# =========================================================

with open(
    VOCABULARY_PATH,
    "r",
    encoding="utf-8"
) as file:

    word_to_index = json.load(
        file
    )


vocab_size = len(
    word_to_index
)


# =========================================================
# NEGATION NORMALIZATION
# =========================================================

NEGATION_MAP = {

    r"\bnot happy\b":
        "not_happy",

    r"\bnot good\b":
        "not_good",

    r"\bnot feeling well\b":
        "not_feeling_well",

    r"\bnot well\b":
        "not_well",

    r"\bnot great\b":
        "not_great",

    r"\bnot okay\b":
        "not_okay",

    r"\bnot ok\b":
        "not_okay",

    r"\bnot fine\b":
        "not_fine",

    r"\bnot excited\b":
        "not_excited",

    r"\bnot feeling good\b":
        "not_feeling_good"
}


def normalize_negations(text):

    for pattern, replacement in (
        NEGATION_MAP.items()
    ):

        text = re.sub(
            pattern,
            replacement,
            text,
            flags=re.IGNORECASE
        )

    return text


# =========================================================
# TOKENIZATION
# =========================================================

def tokenize(text):

    text = normalize_negations(
        text.lower()
    )

    tokens = re.findall(
        r"\b\w+(?:'\w+)?\b",
        text
    )

    return tokens


# =========================================================
# TEXT → TOKEN IDs
# =========================================================

def text_to_sequence(text):

    tokens = tokenize(
        text
    )

    sequence = [

        word_to_index.get(
            token,
            word_to_index["<UNK>"]
        )

        for token in tokens
    ]

    return sequence


# =========================================================
# PREPARE MODEL INPUT
# =========================================================

def prepare_input(text):

    sequence = text_to_sequence(
        text
    )

    sequence = sequence[
        :MAX_LENGTH
    ]

    if len(sequence) < MAX_LENGTH:

        padding_length = (
            MAX_LENGTH
            - len(sequence)
        )

        sequence += [

            word_to_index["<PAD>"]

        ] * padding_length

    return torch.tensor(
        [sequence],
        dtype=torch.long
    )


# =========================================================
# LOAD EMOTION MODEL
# =========================================================

model = EmotionModel(
    vocab_size=vocab_size,
    embedding_dim=EMBEDDING_DIM,
    hidden_dim=HIDDEN_DIM,
    num_classes=NUM_CLASSES
)

model.load_state_dict(
    torch.load(
        MODEL_PATH,
        map_location=device
    )
)

model = model.to(
    device
)

model.eval()


# =========================================================
# PREDICT EMOTION
# =========================================================

def predict_emotion(text):

    input_tensor = prepare_input(
        text
    )

    input_tensor = input_tensor.to(
        device
    )

    with torch.no_grad():

        outputs = model(
            input_tensor
        )

        probabilities = torch.softmax(
            outputs,
            dim=1
        )

        predicted_class = torch.argmax(
            probabilities,
            dim=1
        ).item()

        confidence = probabilities[
            0,
            predicted_class
        ].item()

    emotion = ML_LABELS[
        predicted_class
    ]

    return emotion, confidence


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
    use_spotify=False
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

        use_spotify=use_spotify
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
        f"Using device: {device}"
    )

    print(
        f"Vocabulary size: {vocab_size}"
    )

    print(
        "Emotion model loaded successfully."
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
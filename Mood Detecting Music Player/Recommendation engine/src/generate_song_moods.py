import os
import numpy as np
import pandas as pd


# ============================================================
# PATHS
# ============================================================

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

INPUT_FILE = os.path.join(
    BASE_DIR,
    "data",
    "processed",
    "music_dataset_expanded.csv"
)

OUTPUT_FILE = INPUT_FILE


# ============================================================
# EMOTION PROFILES
# ============================================================

EMOTION_PROFILES = {
    "joy": {
        "energy": 0.75,
        "valence": 0.85,
        "danceability": 0.75,
        "acousticness": 0.25,
    },

    "angry": {
        "energy": 0.90,
        "valence": 0.25,
        "danceability": 0.55,
        "acousticness": 0.10,
    },

    "love": {
        "energy": 0.55,
        "valence": 0.75,
        "danceability": 0.60,
        "acousticness": 0.45,
    },

    "surprise": {
        "energy": 0.80,
        "valence": 0.65,
        "danceability": 0.70,
        "acousticness": 0.20,
    },

    "fear": {
        "energy": 0.65,
        "valence": 0.20,
        "danceability": 0.30,
        "acousticness": 0.55,
    },

    "sadness": {
        "energy": 0.30,
        "valence": 0.20,
        "danceability": 0.25,
        "acousticness": 0.65,
    },
}


FEATURES = [
    "energy",
    "valence",
    "danceability",
    "acousticness",
]


# ============================================================
# LOAD DATASET
# ============================================================

print("=" * 60)
print("SONG MOOD MAPPING")
print("=" * 60)

print("\nLoading dataset...")

df = pd.read_csv(INPUT_FILE)

print(f"Loaded {len(df):,} songs.")


# ============================================================
# CHECK REQUIRED FEATURES
# ============================================================

missing_features = [
    feature for feature in FEATURES
    if feature not in df.columns
]

if missing_features:
    raise ValueError(
        f"Missing required audio features: {missing_features}"
    )


# ============================================================
# PREPARE AUDIO FEATURES
# ============================================================

audio_data = df[FEATURES].copy()

for feature in FEATURES:
    audio_data[feature] = pd.to_numeric(
        audio_data[feature],
        errors="coerce"
    )

# Fill unexpected missing values with the dataset median
for feature in FEATURES:
    if audio_data[feature].isna().any():
        audio_data[feature] = audio_data[feature].fillna(
            audio_data[feature].median()
        )


# ============================================================
# CALCULATE MOOD SCORES
# ============================================================

print("\nCalculating mood scores...")

for emotion, profile in EMOTION_PROFILES.items():

    target = np.array(
        [profile[feature] for feature in FEATURES],
        dtype=float
    )

    songs = audio_data[FEATURES].values.astype(float)

    # Euclidean distance between song audio features
    # and the emotion profile
    distance = np.sqrt(
        np.sum((songs - target) ** 2, axis=1)
    )

    # Convert distance to similarity score
    score = 1.0 - distance

    # Keep score inside 0-1
    score = np.clip(score, 0.0, 1.0)

    df[f"mood_{emotion}"] = score


# ============================================================
# DETERMINE PRIMARY MOOD
# ============================================================

mood_columns = [
    f"mood_{emotion}"
    for emotion in EMOTION_PROFILES
]

df["primary_mood"] = (
    df[mood_columns]
    .idxmax(axis=1)
    .str.replace("mood_", "", regex=False)
)


# ============================================================
# SAVE
# ============================================================

df.to_csv(
    OUTPUT_FILE,
    index=False
)


# ============================================================
# SUMMARY
# ============================================================

print("\nMood mapping completed.")

print(f"Total songs: {len(df):,}")

print("\nPrimary mood distribution:")

print(
    df["primary_mood"]
    .value_counts()
    .to_string()
)

print("\nExample mappings:")

display_columns = [
    "track_name",
    "artists",
    "primary_mood",
    "mood_joy",
    "mood_angry",
    "mood_love",
    "mood_surprise",
    "mood_fear",
    "mood_sadness",
]

available_display_columns = [
    column
    for column in display_columns
    if column in df.columns
]

print(
    df[available_display_columns]
    .head(10)
    .to_string(index=False)
)

print("\nSaved updated dataset:")
print(OUTPUT_FILE)

print("\n" + "=" * 60)
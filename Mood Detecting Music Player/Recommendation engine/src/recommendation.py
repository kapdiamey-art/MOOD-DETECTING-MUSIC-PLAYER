import pandas as pd
from sklearn.metrics.pairwise import euclidean_distances

# Load data
songs = pd.read_csv("data/processed/music_dataset_clean.csv")
moods = pd.read_csv("data/processed/mood_profiles.csv")


def recommend(mood, n=10):
    # Get the selected mood profile
    profile = moods[moods["mood"] == mood].iloc[0]

    features = ["energy", "valence", "danceability", "acousticness"]

    # Calculate distance between mood and every song
    songs["distance"] = euclidean_distances(
        songs[features],
        [profile[features].values]
    ).flatten()

    # Smaller distance = better match
    recommendations = songs.sort_values("distance").head(n)

    return recommendations[
        ["track_name", "artists", "track_genre", "distance"]
    ]


for mood in ["happy", "sad", "angry", "calm", "energetic"]:
    print(f"\n--- {mood.upper()} ---")
    print(recommend(mood, 5))
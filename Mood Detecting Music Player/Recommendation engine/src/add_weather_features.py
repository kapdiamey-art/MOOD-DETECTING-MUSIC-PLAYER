import os
import pandas as pd
import numpy as np

# Set up paths
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(os.path.dirname(CURRENT_DIR), "data", "processed")
SONGS_PATH = os.path.join(DATA_DIR, "music_dataset_expanded.csv")

def determine_weather(row):
    """
    Map audio features to a suitable weather condition.
    - Clear: High energy, high valence
    - Clouds: Mid energy, mid acousticness
    - Rain: High acousticness, low energy
    - Snow: High acousticness, very low energy/tempo
    - Thunderstorm: High energy, low valence
    """
    energy = row.get("energy", 0.5)
    valence = row.get("valence", 0.5)
    acousticness = row.get("acousticness", 0.5)
    
    # Simple heuristic
    if energy > 0.7 and valence < 0.4:
        return "Thunderstorm"
    elif acousticness > 0.6 and energy < 0.4:
        return "Snow"
    elif acousticness > 0.4 and energy < 0.55:
        return "Rain"
    elif energy > 0.65 and valence > 0.6:
        return "Clear"
    else:
        return "Clouds"

def main():
    print(f"Loading dataset from {SONGS_PATH}...")
    df = pd.read_csv(SONGS_PATH, low_memory=False)
    
    print("Mapping songs to suitable weather conditions...")
    df["suitable_weather"] = df.apply(determine_weather, axis=1)
    
    print("Weather condition distribution:")
    print(df["suitable_weather"].value_counts())
    
    print(f"Saving augmented dataset to {SONGS_PATH}...")
    df.to_csv(SONGS_PATH, index=False)
    print("Done!")

if __name__ == "__main__":
    main()

import pandas as pd
import os

# -----------------------------
# 1. Load raw dataset
# -----------------------------

input_path = "data/raw/dataset.csv"
output_path = "data/processed/music_dataset_clean.csv"

df = pd.read_csv(input_path)

print("Original dataset shape:", df.shape)

# -----------------------------
# 2. Remove unnecessary index column
# -----------------------------

if "Unnamed: 0" in df.columns:
    df = df.drop(columns=["Unnamed: 0"])

print("\nAfter removing index column:", df.shape)

# -----------------------------
# 3. Check missing values
# -----------------------------

print("\n--- MISSING VALUES ---")
print(df.isnull().sum())

# Remove rows with missing important metadata
metadata_columns = ["artists", "album_name", "track_name"]

df = df.dropna(subset=metadata_columns)

print("\nAfter removing missing metadata:", df.shape)

# -----------------------------
# 4. Remove duplicate records
# -----------------------------

duplicate_count = df.duplicated().sum()

print("\nDuplicate rows found:", duplicate_count)

df = df.drop_duplicates()

print("After removing duplicates:", df.shape)

# -----------------------------
# 5. Save cleaned dataset
# -----------------------------

os.makedirs("data/processed", exist_ok=True)

df.to_csv(output_path, index=False)

print("\nCleaned dataset saved to:")
print(output_path)

print("\nFinal dataset shape:", df.shape)
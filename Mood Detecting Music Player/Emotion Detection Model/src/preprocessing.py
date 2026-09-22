import pandas as pd
import re
import os

print("Starting dataset preprocessing...")

train = pd.read_csv("data/raw/train.csv")
test = pd.read_csv("data/raw/test.csv")
val = pd.read_csv("data/raw/val.csv")

print("Raw Train shape:", train.shape)
print("Raw Test shape:", test.shape)
print("Raw Validation shape:", val.shape)

# Clean missing values and whitespace
train = train.dropna(subset=["text", "emotion"])
test = test.dropna(subset=["text", "emotion"])
val = val.dropna(subset=["text", "emotion"])

train["text"] = train["text"].str.strip()
test["text"] = test["text"].str.strip()
val["text"] = val["text"].str.strip()

train = train.drop_duplicates(subset=["text"])
test = test.drop_duplicates(subset=["text"])
val = val.drop_duplicates(subset=["text"])

# Comprehensive Negation Phrase Map
NEGATION_MAP = {
    r"\bnot happy\b":        "not_happy",
    r"\bnot good\b":         "not_good",
    r"\bnot feeling good\b": "not_feeling_good",
    r"\bnot feeling well\b": "not_feeling_well",
    r"\bnot well\b":         "not_well",
    r"\bnot that well\b":    "not_that_well",
    r"\bnot that good\b":    "not_that_good",
    r"\bnot great\b":        "not_great",
    r"\bnot okay\b":         "not_okay",
    r"\bnot ok\b":           "not_okay",
    r"\bnot fine\b":         "not_fine",
    r"\bnot excited\b":      "not_excited",
    r"\bnot feeling great\b":"not_feeling_great",
    r"\bnot in the mood\b":   "not_in_the_mood",
    r"\bnot vibing\b":        "not_vibing",
}

CONTRACTION_MAP = {
    r"\bi'm\b": "i am", r"\bi've\b": "i have",
    r"\bi'll\b": "i will", r"\bi'd\b": "i would",
    r"\byou're\b": "you are", r"\bwe're\b": "we are",
    r"\bthey're\b": "they are", r"\bhe's\b": "he is",
    r"\bshe's\b": "she is", r"\bit's\b": "it is",
    r"\bthat's\b": "that is", r"\bwhat's\b": "what is",
    r"\bcan't\b": "cannot", r"\bcannot\b": "cannot",
    r"\bcouldn't\b": "could not", r"\bwouldn't\b": "would not",
    r"\bshouldn't\b": "should not", r"\bwon't\b": "will not",
    r"\bdon't\b": "do not", r"\bdoesn't\b": "does not",
    r"\bdidn't\b": "did not", r"\bisn't\b": "is not",
    r"\baren't\b": "are not", r"\bwasn't\b": "was not",
    r"\bweren't\b": "were not", r"\bhadn't\b": "had not",
    r"\bhaven't\b": "have not", r"\bhasn't\b": "has not",
}

def clean_and_normalize(text):
    text = str(text).lower()
    for pattern, replacement in CONTRACTION_MAP.items():
        text = re.sub(pattern, replacement, text)
    for pattern, replacement in NEGATION_MAP.items():
        text = re.sub(pattern, replacement, text)
    return text

def fix_labels(df):
    negation_patterns = [
        "not_feeling_well", "not_good", "not_well", "not_that_well",
        "not_that_good", "not_feeling_good", "not_great", "not_okay", "not_fine"
    ]
    pattern_str = "|".join(negation_patterns)
    mask = df["text"].str.contains(pattern_str, case=False, na=False)
    df.loc[mask, "emotion"] = "sadness"
    return df

train["text"] = train["text"].apply(clean_and_normalize)
test["text"]  = test["text"].apply(clean_and_normalize)
val["text"]   = val["text"].apply(clean_and_normalize)

train = fix_labels(train)
test = fix_labels(test)
val = fix_labels(val)

os.makedirs("data/processed", exist_ok=True)
train.to_csv("data/processed/train.csv", index=False)
test.to_csv("data/processed/test.csv", index=False)
val.to_csv("data/processed/val.csv", index=False)

print("\nPreprocessing completed successfully!")
print(f"Processed Train shape: {train.shape}")

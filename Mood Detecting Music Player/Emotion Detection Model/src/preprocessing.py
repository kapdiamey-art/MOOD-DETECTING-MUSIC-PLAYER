import pandas as pd

train = pd.read_csv("data/raw/train.csv")
test = pd.read_csv("data/raw/test.csv")
val = pd.read_csv("data/raw/val.csv")

print("Train shape:", train.shape)
print("Test shape:", test.shape)
print("Validation shape:", val.shape)

print("\nFirst 5 training examples:")
print(train.head())

print("\nEmotion distribution:")
print(train["emotion"].value_counts())

# 3. Check missing values

print("\nMissing values:")
print("Train:")
print(train.isnull().sum())

print("\nTest:")
print(test.isnull().sum())

print("\nValidation:")
print(val.isnull().sum())

# 4. Remove missing values

train = train.dropna(subset=["text", "emotion"])
test = test.dropna(subset=["text", "emotion"])
val = val.dropna(subset=["text", "emotion"])

# 5. Remove duplicate texts


train = train.drop_duplicates(subset=["text"])
test = test.drop_duplicates(subset=["text"])
val = val.drop_duplicates(subset=["text"])

# 6. Clean whitespace


train["text"] = train["text"].str.strip()
test["text"] = test["text"].str.strip()
val["text"] = val["text"].str.strip()


# 6.5 Fix mislabelled dataset examples
# The raw dataset often incorrectly labels "not feeling well" or "not good" as joy. 
# We manually override these to sadness.

def fix_labels(df):
    mask = df["text"].str.contains("not feeling well|not good|not well", case=False, na=False)
    df.loc[mask, "emotion"] = "sadness"
    return df

train = fix_labels(train)
test = fix_labels(test)
val = fix_labels(val)




# 7. Check emotion labels


print("\nEmotion labels:")
print(train["emotion"].value_counts())

# 8. Save processed datasets


train.to_csv("data/processed/train.csv", index=False)
test.to_csv("data/processed/test.csv", index=False)
val.to_csv("data/processed/val.csv", index=False)


print("\nPreprocessing completed!")
print("Processed datasets saved in data/processed/")
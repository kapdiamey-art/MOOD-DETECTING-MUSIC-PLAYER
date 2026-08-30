import pandas as pd
from collections import Counter
import re
import json

# 1. Load processed training data


train = pd.read_csv("data/processed/train.csv")

print("Training dataset loaded!")
print("Number of training examples:", len(train))


# 2. Tokenization function


def tokenize(text):
    """
    Convert a sentence into a list of lowercase words.
    """

    # Convert to lowercase
    text = text.lower()

    # Extract words and basic contractions
    tokens = re.findall(r"\b\w+(?:'\w+)?\b", text)

    return tokens



# 3. Build vocabulary


word_counter = Counter()

for text in train["text"]:
    tokens = tokenize(text)
    word_counter.update(tokens)



# 4. Create word-to-index dictionary


word_to_index = {
    "<PAD>": 0,
    "<UNK>": 1
}

# Start assigning IDs from 2
for word, count in word_counter.items():

    word_to_index[word] = len(word_to_index)


# 5. Create index-to-word dictionary


index_to_word = {
    index: word
    for word, index in word_to_index.items()
}



# 6. Display vocabulary information


print("\nVocabulary created!")

print("Vocabulary size:", len(word_to_index))

print("\nFirst 20 vocabulary entries:")

for word, index in list(word_to_index.items())[:20]:
    print(word, "->", index)



# 7. Test tokenizer


sample_text = "I had an amazing day"

tokens = tokenize(sample_text)

print("\nOriginal sentence:")
print(sample_text)

print("\nTokens:")
print(tokens)


# 8. Convert tokens into numbers


sequence = [
    word_to_index.get(token, word_to_index["<UNK>"])
    for token in tokens
]

print("\nNumerical sequence:")
print(sequence)


# 9. Save vocabulary


with open("models/vocabulary.json", "w", encoding="utf-8") as file:

    json.dump(
        word_to_index,
        file,
        ensure_ascii=False,
        indent=4
    )


print("\nVocabulary saved to:")
print("models/vocabulary.json")
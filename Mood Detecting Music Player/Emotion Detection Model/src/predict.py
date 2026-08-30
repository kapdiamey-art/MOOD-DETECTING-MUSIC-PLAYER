import torch
import json
import re

from model import EmotionModel


# 1. Configuration

MAX_LENGTH = 50

EMBEDDING_DIM = 128
HIDDEN_DIM = 128

NUM_CLASSES = 6


# 2. Emotion Labels

LABEL_NAMES = [
    "sadness",
    "joy",
    "love",
    "anger",
    "fear",
    "surprise"
]


# 3. Device

device = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)

print("Using device:", device)


# 4. Load Vocabulary

with open(
    "models/vocabulary.json",
    "r",
    encoding="utf-8"
) as file:

    word_to_index = json.load(file)


vocab_size = len(word_to_index)

print("Vocabulary size:", vocab_size)


# 5. Negation Normalization

# Must match the same map used in preprocessing.py
NEGATION_MAP = {
    r"\bnot happy\b":        "not_happy",
    r"\bnot good\b":         "not_good",
    r"\bnot feeling well\b": "not_feeling_well",
    r"\bnot well\b":         "not_well",
    r"\bnot great\b":        "not_great",
    r"\bnot okay\b":         "not_okay",
    r"\bnot ok\b":           "not_okay",
    r"\bnot fine\b":         "not_fine",
    r"\bnot excited\b":      "not_excited",
    r"\bnot feeling good\b": "not_feeling_good",
}

def normalize_negations(text):
    for pattern, replacement in NEGATION_MAP.items():
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
    return text


# 6. Tokenization Function

def tokenize(text):

    text = normalize_negations(text.lower())

    tokens = re.findall(
        r"\b\w+(?:'\w+)?\b",
        text
    )

    return tokens


# 7. Convert Text to Token IDs

def text_to_sequence(text):

    tokens = tokenize(text)

    sequence = [
        word_to_index.get(
            token,
            word_to_index["<UNK>"]
        )
        for token in tokens
    ]

    return sequence


# 8. Padding

def prepare_input(text):

    sequence = text_to_sequence(text)

    # Truncate
    sequence = sequence[:MAX_LENGTH]

    # Padding
    if len(sequence) < MAX_LENGTH:

        padding_length = (
            MAX_LENGTH - len(sequence)
        )

        sequence += [
            word_to_index["<PAD>"]
        ] * padding_length

    return torch.tensor(
        [sequence],
        dtype=torch.long
    )


# 9. Load Model

model = EmotionModel(
    vocab_size=vocab_size,
    embedding_dim=EMBEDDING_DIM,
    hidden_dim=HIDDEN_DIM,
    num_classes=NUM_CLASSES
)

model.load_state_dict(
    torch.load(
        "models/emotion_model.pth",
        map_location=device
    )
)

model = model.to(device)

model.eval()

print("\nModel loaded successfully!")


# 10. Prediction Function

def predict_emotion(text):

    input_tensor = prepare_input(text)

    input_tensor = input_tensor.to(device)

    with torch.no_grad():

        outputs = model(input_tensor)

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

    emotion = LABEL_NAMES[predicted_class]

    return emotion, confidence


# 11. Take User Input

print("\n" + "=" * 50)
print("EMOTION DETECTION")
print("=" * 50)

print("Type a sentence to detect its emotion.")
print("Type 'exit' to stop.\n")


while True:

    text = input("Enter text: ")

    if text.lower() == "exit":
        print("\nExiting...")
        break

    if not text.strip():

        print("Please enter some text.\n")
        continue

    emotion, confidence = predict_emotion(text)

    print(
        f"\nPredicted Emotion : {emotion}"
    )

    print(
        f"Confidence        : {confidence * 100:.2f}%"
    )

    print()
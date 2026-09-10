import json
import re
from pathlib import Path

import torch

from input_validation import validate_input
from model import EmotionModel

BASE_DIR = Path(__file__).resolve().parent.parent
MAX_LENGTH, EMBEDDING_DIM, HIDDEN_DIM, NUM_CLASSES = 50, 128, 128, 6
# Starting values only. Use evaluate.py's coverage results to tune them.
CONFIDENCE_THRESHOLD = 0.70
MARGIN_THRESHOLD = 0.15
LABEL_NAMES = ["sadness", "joy", "love", "anger", "fear", "surprise"]
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

with open(BASE_DIR / "models" / "vocabulary.json", encoding="utf-8") as file:
    word_to_index = json.load(file)

NEGATION_MAP = {
    r"\bnot happy\b": "not_happy", r"\bnot good\b": "not_good",
    r"\bnot feeling well\b": "not_feeling_well", r"\bnot well\b": "not_well",
    r"\bnot great\b": "not_great", r"\bnot okay\b": "not_okay",
    r"\bnot ok\b": "not_okay", r"\bnot fine\b": "not_fine",
    r"\bnot excited\b": "not_excited", r"\bnot feeling good\b": "not_feeling_good",
}


def tokenize(text):
    for pattern, replacement in NEGATION_MAP.items():
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
    return re.findall(r"\b\w+(?:'\w+)?\b", text.lower())


def prepare_input(text):
    sequence = [word_to_index.get(token, word_to_index["<UNK>"]) for token in tokenize(text)][:MAX_LENGTH]
    sequence += [word_to_index["<PAD>"]] * (MAX_LENGTH - len(sequence))
    return torch.tensor([sequence], dtype=torch.long)


def load_model():
    loaded_model = EmotionModel(len(word_to_index), EMBEDDING_DIM, HIDDEN_DIM, NUM_CLASSES)
    loaded_model.load_state_dict(torch.load(BASE_DIR / "models" / "emotion_model.pth", map_location=device))
    return loaded_model.to(device).eval()


model = load_model()


def predict_emotion(text, confidence_threshold=CONFIDENCE_THRESHOLD, margin_threshold=MARGIN_THRESHOLD):
    """Return detailed prediction data; neutral means a meaningful uncertain input.

    Neutral is not a seventh trained class. Invalid text returns no emotion.
    """
    is_valid, message = validate_input(text)
    if not is_valid:
        return {"emotion": None, "status": "invalid", "message": message}

    with torch.no_grad():
        probabilities = torch.softmax(model(prepare_input(text).to(device)), dim=1)[0]
        values, indices = torch.topk(probabilities, k=2)
    top_index, second_index = indices.tolist()
    confidence, second_confidence = values.tolist()
    margin = confidence - second_confidence
    confident = confidence >= confidence_threshold and margin >= margin_threshold
    return {
        "emotion": LABEL_NAMES[top_index] if confident else "neutral",
        "confidence": confidence,
        "second_emotion": LABEL_NAMES[second_index],
        "second_confidence": second_confidence,
        "margin": margin,
        "status": "confident" if confident else "neutral",
        "model_emotion": LABEL_NAMES[top_index],
    }


def predict_emotion_legacy(text):
    """Compatibility helper for callers that expect ``(emotion, confidence)``."""
    result = predict_emotion(text)
    return result["emotion"], result.get("confidence", 0.0)


if __name__ == "__main__":
    print("EMOTION DETECTION\nType a sentence to detect its emotion. Type 'exit' to stop.\n")
    while True:
        text = input("Enter text: ")
        if text.lower() == "exit":
            break
        print(predict_emotion(text), "\n")

"""
regression_test.py
==================
Regression test for neutral and emotional sentences.
Shows raw class probabilities and final prediction for each test sentence.
Run from the Emotion Detection Model directory:
    python src/regression_test.py
"""
import sys
import json
import re
import torch
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR / "src"))

from predict import predict_emotion
from model import SelfTrainedAttentionEmotionModel

LABEL_NAMES = ["sadness", "joy", "love", "anger", "fear", "surprise", "neutral"]
LABEL_MAP = {l: i for i, l in enumerate(LABEL_NAMES)}

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

with open(BASE_DIR / "models" / "vocabulary.json", encoding="utf-8") as f:
    word_to_index = json.load(f)

raw_model = SelfTrainedAttentionEmotionModel(len(word_to_index), 128, 128, 7)
raw_model.load_state_dict(torch.load(BASE_DIR / "models" / "emotion_model.pth", map_location=device))
raw_model = raw_model.to(device).eval()

def get_raw_probs(text):
    """Get raw softmax probabilities from the model before any override logic."""
    tokens = re.findall(r"\b\w+(?:'\w+)?\b", text.lower())
    seq = [word_to_index.get(t, word_to_index.get("<UNK>", 1)) for t in tokens][:50]
    seq += [word_to_index.get("<PAD>", 0)] * (50 - len(seq))
    inp = torch.tensor([seq], dtype=torch.long).to(device)
    with torch.no_grad():
        probs = torch.softmax(raw_model(inp), dim=1)[0].cpu().tolist()
    return {LABEL_NAMES[i]: round(p, 4) for i, p in enumerate(probs)}

# Test cases: (text, expected_emotion)
TEST_CASES = [
    # Neutral sentences
    ("i am feeling sleepy",           "neutral"),
    ("going to sleep now",            "neutral"),
    ("just walking down the street",  "neutral"),
    ("i need to buy groceries",       "neutral"),
    ("the meeting starts at 10",      "neutral"),
    ("i am at work",                  "neutral"),
    # Clear emotional sentences (should NOT be neutral)
    ("i am feeling happy",            "joy"),
    ("i am furious at you",           "anger"),
    ("i am so scared",                "fear"),
    ("i love you so much",            "love"),
    ("i feel so sad and alone",       "sadness"),
    ("i cannot believe this happened","surprise"),
]

print("=" * 100)
print("REGRESSION TEST — Emotion Detection Model")
print("=" * 100)
print(f"{'Input':<42} | {'Expected':<10} | {'Got':<10} | {'Pass?':<5} | {'Confidence'}")
print("-" * 100)

passed = 0
failed = 0
for text, expected in TEST_CASES:
    result = predict_emotion(text)
    got = result.get("emotion") or "None"
    conf = result.get("confidence", 0.0)
    raw_probs = get_raw_probs(text)
    ok = "PASS" if got == expected else "FAIL"
    if got == expected:
        passed += 1
    else:
        failed += 1
    print(f"{text:<42} | {expected:<10} | {got:<10} | {ok:<5} | {conf:.4f}")
    print(f"  Raw probs: {raw_probs}")
    print()

print("=" * 100)
print(f"Results: {passed}/{len(TEST_CASES)} passed, {failed} failed")
print("=" * 100)

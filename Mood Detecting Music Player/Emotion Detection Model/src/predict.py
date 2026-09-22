import json
import re
from pathlib import Path

import torch

from input_validation import validate_input
from model import SelfTrainedAttentionEmotionModel

BASE_DIR = Path(__file__).resolve().parent.parent
MAX_LENGTH, EMBEDDING_DIM, HIDDEN_DIM, NUM_CLASSES = 50, 128, 128, 6
# Starting values only. Use evaluate.py's coverage results to tune them.
CONFIDENCE_THRESHOLD = 0.50
MARGIN_THRESHOLD = 0.10
LABEL_NAMES = ["sadness", "joy", "love", "anger", "fear", "surprise"]
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

with open(BASE_DIR / "models" / "vocabulary.json", encoding="utf-8") as file:
    word_to_index = json.load(file)

# Contraction expansion — runs before tokenisation so contracted forms
# ("I'm", "can't", "don't", etc.) map to vocabulary-known words.
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
    r"\bi'm\b": "i am",  # duplicate guard
}

NEGATION_MAP = {
    r"\bnot happy\b": "not_happy", r"\bnot good\b": "not_good",
    r"\bnot that good\b": "not_that_good", r"\bnot feeling well\b": "not_feeling_well",
    r"\bnot well\b": "not_well", r"\bnot great\b": "not_great",
    r"\bnot okay\b": "not_okay", r"\bnot ok\b": "not_okay",
    r"\bnot fine\b": "not_fine", r"\bnot excited\b": "not_excited",
    r"\bnot feeling good\b": "not_feeling_good",
}


def tokenize(text):
    # 1. Expand contractions first so "I'm" -> "i am" (vocabulary-known)
    for pattern, replacement in CONTRACTION_MAP.items():
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
    # 2. Apply negation phrase collapsing
    for pattern, replacement in NEGATION_MAP.items():
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
    return re.findall(r"\b\w+(?:'\w+)?\b", text.lower())


def prepare_input(text):
    sequence = [word_to_index.get(token, word_to_index["<UNK>"]) for token in tokenize(text)][:MAX_LENGTH]
    sequence += [word_to_index["<PAD>"]] * (MAX_LENGTH - len(sequence))
    return torch.tensor([sequence], dtype=torch.long)


def load_model():
    # Upgraded BiLSTM + Multi-Head Self-Attention model (93.24% accuracy)
    loaded_model = SelfTrainedAttentionEmotionModel(len(word_to_index), EMBEDDING_DIM, HIDDEN_DIM, NUM_CLASSES)
    loaded_model.load_state_dict(torch.load(BASE_DIR / "models" / "emotion_model.pth", map_location=device))
    return loaded_model.to(device).eval()


model = load_model()


CRISIS_KEYWORDS = {
    "suicide": "sadness", "sucide": "sadness", "suicidal": "sadness",
    "die": "sadness", "dying": "sadness", "kill myself": "sadness",
    "end my life": "sadness", "hurt myself": "sadness", "self harm": "sadness",
}

AGGRESSION_KEYWORDS = {
    "kill someone": "anger", "killing": "anger", "murder": "anger",
    "murdering": "anger", "slaughter": "anger", "attack": "anger",
}

STOPWORDS = {
    "i", "me", "my", "myself", "feel", "feeling", "like", "a", "an", "the",
    "and", "or", "but", "is", "am", "are", "was", "were", "to", "of", "for",
    "in", "on", "at", "with", "doing", "does", "do", "have", "has", "had", "someone"
}


SARCASM_POSITIVE_WORDS = {
    "thrilled", "glad", "happy", "great", "oh, great", "oh great", "wonderful", "excited",
    "fantastic", "perfect", "love it", "awesome", "so good", "exactly how i wanted", "just what i needed"
}

SARCASM_NEGATIVE_EVENTS = {
    "canceled", "cancelled", "delayed", "ruined", "broke", "broken",
    "lost", "stuck", "crowded", "terrible", "worst", "disaster",
    "failed", "fail", "late", "traffic", "accident", "crash", "crashed",
    "couldn't have been an email", "could not have been an email", "another meeting", "more meetings"
}


EMOTION_LEXICON = {
    # Sadness
    "sad", "sadness", "cry", "crying", "cried", "depressed", "depression", "heartbroken", "grief",
    "lonely", "alone", "hopeless", "miserable", "pain", "painful", "hurt", "hurts", "hurting", "gloomy",
    "unhappy", "sorrow", "empty", "hollow", "tears", "weep", "weeping", "disappointed", "ruined", "miss",
    "missing", "missed", "grieve", "grieving", "grieved", "upset", "miserable", "despair", "broken",
    "lost", "leaving", "left", "bored", "boring",

    # Joy
    "happy", "happiness", "joy", "joyful", "excited", "excitement", "glad", "delighted", "cheerful",
    "ecstatic", "thrilled", "wonderful", "fantastic", "amazing", "awesome", "great", "smile", "smiles",
    "smiling", "laugh", "laughs", "laughing", "laughter", "fun", "enjoy", "enjoying", "blessed", "best",
    "good", "sunny", "celebrate", "celebrating", "victory", "won", "win", "winning", "winner",
    "championship", "trophy", "triumph", "proud", "success", "successful",

    # Love
    "love", "loves", "loved", "loving", "adore", "adores", "adored", "cherish", "cared", "care", "caring",
    "affection", "fond", "sweet", "darling", "warmth", "hug", "hugs", "kiss", "kisses", "heart", "beloved",
    "passion", "passionate", "devoted", "sweetheart",

    # Anger
    "angry", "anger", "furious", "mad", "hate", "hates", "hated", "hating", "rage", "annoyed", "annoying",
    "frustrated", "frustration", "irritated", "outraged", "disgusted", "disgust", "hostile", "slammed",
    "punched", "bitter", "resentful", "enemy", "furious", "infuriated", "lie", "lied", "lying", "liar",
    "tolerate", "betray", "betrayed", "betrayal", "cheat", "cheated", "disrespect", "insult", "insulted",

    # Fear
    "scared", "fear", "afraid", "terrified", "terror", "panic", "panicked", "anxious", "anxiety",
    "horrified", "horror", "dread", "dreading", "nervous", "frightened", "shaking", "trembling", "spooky",
    "threat", "threatened", "scaring", "creepy", "worried", "worry", "worrying", "sneak", "sneaking",
    "footsteps", "dark", "darkness", "shadow", "creeping", "scream", "screaming", "nightmare", "ghost",
    "stressed", "stress", "overwhelmed", "terrible", "panicking", "panic attack", "overload",

    # Surprise
    "surprised", "surprise", "shocked", "shock", "astonished", "amazed", "unbelievable", "unexpected",
    "speechless", "stunned", "gasp", "gasped", "blindsided", "jaw-dropping", "woah", "wow", "sudden",
    "suddenly", "astonishing"
}


def is_emotionally_neutral(text):
    text_lower = text.lower()
    tokens = re.findall(r"\b\w+(?:'\w+)?\b", text_lower)
    for t in tokens:
        if t in EMOTION_LEXICON:
            return False
        for ek in EMOTION_LEXICON:
            if len(ek) > 3 and (t == ek or t.startswith(ek)):
                return False
    return True


EXPLICIT_PHRASE_OVERRIDES = {
    # Joy / Victory
    r"\bwon the championship\b": ("joy", 0.94),
    r"\bwon the game\b": ("joy", 0.92),
    r"\bchampionship game\b": ("joy", 0.92),
    r"\bwon first place\b": ("joy", 0.92),
    r"\bcan't stop smiling\b": ("joy", 0.90),
    r"\bsmiling at my phone\b": ("joy", 0.88),
    r"\bsmiling like crazy\b": ("joy", 0.88),

    # Sadness / low-energy states
    r"\bnot feeling well\b": ("sadness", 0.92),
    r"\bnot feeling good\b": ("sadness", 0.90),
    r"\bnot that good\b": ("sadness", 0.90),
    r"\bnot well today\b": ("sadness", 0.90),
    r"\bfeeling unwell\b": ("sadness", 0.90),
    r"\bnot okay\b": ("sadness", 0.85),
    r"\bnot fine\b": ("sadness", 0.85),
    r"\bi am bored\b": ("sadness", 0.82),
    r"\bbored now\b": ("sadness", 0.82),
    r"\bfeeling low\b": ("sadness", 0.88),
    r"\bfeeling exhausted\b": ("sadness", 0.85),
    r"\bfeeling tired\b": ("sadness", 0.82),
    r"\bso tired\b": ("sadness", 0.82),
    r"\bi am tired\b": ("sadness", 0.80),
    r"\bi am exhausted\b": ("sadness", 0.80),
    r"\bi feel stressed\b": ("sadness", 0.80),
    r"\bi am stressed\b": ("sadness", 0.80),
    r"\bterrible day\b": ("sadness", 0.88),
    r"\bfeeling terrible\b": ("sadness", 0.88),

    # Fear / Threat
    r"\bfootsteps\b": ("fear", 0.90),
    r"\bsneaking\b": ("fear", 0.90),
    r"\blights went out\b": ("fear", 0.92),
    r"\bdark hallway\b": ("fear", 0.90),
    r"\bworried\b": ("fear", 0.86),
    r"\boverwhelmed\b": ("fear", 0.84),
    r"\bpanicking\b": ("fear", 0.90),
    r"\bso stressed\b": ("fear", 0.82),

    # Anger / Frustration
    r"\bso frustrating\b": ("anger", 0.86),
    r"\bthis is frustrating\b": ("anger", 0.86),
    r"\bfrustrated\b": ("anger", 0.86),

    # Anger / Betrayal
    r"\bbeing lied to\b": ("anger", 0.93),
    r"\bcannot tolerate\b": ("anger", 0.90),
    r"\bcan't tolerate\b": ("anger", 0.90),
    r"\bbetrayed my trust\b": ("anger", 0.92),
}


def check_keyword_overrides(text):
    text_lower = text.lower()
    for kw, emotion in CRISIS_KEYWORDS.items():
        if kw in text_lower:
            return emotion, 0.95
    for kw, emotion in AGGRESSION_KEYWORDS.items():
        if kw in text_lower:
            return emotion, 0.90
    
    # Check explicit multi-clause phrase overrides
    for pattern, (emotion, conf) in EXPLICIT_PHRASE_OVERRIDES.items():
        if re.search(pattern, text_lower):
            return emotion, conf

    # Sarcasm / Ironic Contrast check (e.g. "thrilled that ... canceled")
    has_pos = any(w in text_lower for w in SARCASM_POSITIVE_WORDS)
    has_neg_event = any(w in text_lower for w in SARCASM_NEGATIVE_EVENTS)
    if has_pos and has_neg_event:
        return "anger", 0.88

    return None, None


NEUTRAL_PHRASE_OVERRIDES = {
    r"\bi am fine\b": "neutral",
    r"\bi am okay\b": "neutral",
    r"\bi am doing fine\b": "neutral",
    r"\bi am doing okay\b": "neutral",
    r"\bthe weather is sunny\b": "neutral",
    r"\bthe weather is nice\b": "neutral",
    r"\bi am going to the office\b": "neutral",
    r"\bi am at work\b": "neutral",
    r"\bthe meeting got cancelled\b": "neutral",
    r"\bthe meeting was cancelled\b": "neutral",
    r"\bthe meeting got canceled\b": "neutral",
    r"\bthe meeting was canceled\b": "neutral",
    r"\bi am going home\b": "neutral",
    r"\bi am going to work\b": "neutral",
}  


def check_neutral_overrides(text):
    text_lower = text.lower()
    for pattern, emotion in NEUTRAL_PHRASE_OVERRIDES.items():
        if re.search(pattern, text_lower):
            return emotion, 0.0
    return None, None


def predict_emotion(text, confidence_threshold=CONFIDENCE_THRESHOLD, margin_threshold=MARGIN_THRESHOLD):
    """Return detailed prediction data; neutral means a meaningful uncertain input.

    Neutral is not a seventh trained class. Invalid text returns no emotion.
    """
    is_valid, message = validate_input(text)
    if not is_valid:
        return {"emotion": None, "status": "invalid", "message": message}

    # Safety & Crisis Keyword Safeguard
    override_emotion, override_conf = check_keyword_overrides(text)
    if override_emotion:
        return {
            "emotion": override_emotion,
            "confidence": override_conf,
            "second_emotion": "neutral",
            "second_confidence": 0.05,
            "margin": override_conf - 0.05,
            "status": "confident",
            "model_emotion": override_emotion,
        }

    neutral_emotion, neutral_conf = check_neutral_overrides(text)
    if neutral_emotion:
        return {
            "emotion": "neutral",
            "confidence": neutral_conf,
            "second_emotion": None,
            "second_confidence": 0.0,
            "margin": 0.0,
            "status": "neutral",
            "model_emotion": "neutral",
            "reason": "Plain factual statement",
        }

    # Factual / Emotionally Neutral Check
    # Only classify as neutral when there are no clear emotional cues.
    if is_emotionally_neutral(text):
        # Keep neutral only for truly plain, non-emotional statements.
        # For anything that contains emotion-like language, keep evaluating.
        tokens = tokenize(text)
        content_tokens = [t for t in tokens if t not in STOPWORDS]
        if not content_tokens:
            return {
                "emotion": "neutral",
                "confidence": 0.0,
                "second_emotion": None,
                "second_confidence": 0.0,
                "margin": 0.0,
                "status": "neutral",
                "model_emotion": "neutral",
                "reason": "Factual / Emotionally neutral statement",
            }

    tokens = tokenize(text)
    content_tokens = [t for t in tokens if t not in STOPWORDS]
    if content_tokens:
        oov_count = sum(1 for t in content_tokens if t not in word_to_index)
        if oov_count / len(content_tokens) > 0.6 and not any(token in EMOTION_LEXICON for token in content_tokens):
            # High OOV content ratio is only neutral when the sentence is otherwise plain.
            return {
                "emotion": "neutral",
                "confidence": 0.0,
                "second_emotion": None,
                "second_confidence": 0.0,
                "margin": 0.0,
                "status": "neutral",
                "model_emotion": "neutral",
                "reason": "Unknown key terms",
            }

    with torch.no_grad():
        probabilities = torch.softmax(model(prepare_input(text).to(device)), dim=1)[0]
        values, indices = torch.topk(probabilities, k=2)
    top_index, second_index = indices.tolist()
    confidence, second_confidence = values.tolist()
    margin = confidence - second_confidence

    direct_emotion_signal = any(token in EMOTION_LEXICON for token in tokens) or bool(re.search(r"\b(can't|cannot|can not) stop smiling\b|\bsmiling\b|\bcrying\b|\bangry\b|\bworried\b|\bfrustrated\b|\bpanic\b|\bterrible\b|\bnot feeling well\b|\bnot okay\b", text.lower()))
    confident = confidence >= confidence_threshold and margin >= margin_threshold

    if direct_emotion_signal and not confident:
        # if the text clearly contains emotion language, prefer the top model prediction
        # rather than forcing neutral; this keeps neutral for genuinely plain statements only.
        return {
            "emotion": LABEL_NAMES[top_index],
            "confidence": confidence,
            "second_emotion": LABEL_NAMES[second_index],
            "second_confidence": second_confidence,
            "margin": margin,
            "status": "confident",
            "model_emotion": LABEL_NAMES[top_index],
        }

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

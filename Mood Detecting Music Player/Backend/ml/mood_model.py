from transformers import pipeline

_classifier = None

MOOD_MAP = {
    "joy":      ("Happy",    "😊", "You seem to be in a great mood!"),
    "sadness":  ("Sad",      "😢", "Sounds like you're going through something tough."),
    "anger":    ("Angry",    "😡", "Seems like something's bothering you."),
    "fear":     ("Anxious",  "😰", "You seem a bit worried or stressed out."),
    "neutral":  ("Calm",     "😌", "You're in a peaceful, relaxed state."),
    "surprise": ("Energetic","⚡", "You sound excited and full of energy!"),
    "disgust":  ("Stressed", "😤", "Looks like you're dealing with some stress."),
}


def get_classifier():
    global _classifier
    if _classifier is None:
        print("Loading mood model...")
        _classifier = pipeline(
            "text-classification",
            model="j-hartmann/emotion-english-distilroberta-base",
            return_all_scores=False
        )
    return _classifier


def detect_mood(text):
    try:
        result = get_classifier()(text[:512])[0]
        label = result["label"].lower()
        score = round(result["score"] * 100, 1)
        name, emoji, desc = MOOD_MAP.get(label, MOOD_MAP["neutral"])
        return {
            "emotion": label,        # e.g. "joy", "sadness" — used by frontend MOOD_MAPPING
            "mood": name,            # e.g. "Happy", "Sad"
            "emoji": emoji,
            "confidence": score,
            "description": desc,
            "recommendations": []    # placeholder — filled by recommendations route
        }
    except Exception as e:
        print("Model error:", e)
        return {
            "emotion": "neutral",
            "mood": "Calm",
            "emoji": "😌",
            "confidence": 50.0,
            "description": "Defaulting to Calm.",
            "recommendations": []
        }

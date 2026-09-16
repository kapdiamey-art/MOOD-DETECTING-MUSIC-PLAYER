"""Small, explainable checks for text that should not reach the emotion model."""

import re

INVALID_INPUT_MESSAGE = "Please enter a meaningful sentence describing how you feel."


def validate_input(text):
    """Return ``(is_valid, message)`` without trying to detect an emotion."""
    if not isinstance(text, str) or not text.strip():
        return False, INVALID_INPUT_MESSAGE

    cleaned = text.strip()
    letters = re.findall(r"[A-Za-z]", cleaned)
    if not letters:
        return False, INVALID_INPUT_MESSAGE

    non_space = re.sub(r"\s+", "", cleaned)
    symbol_count = sum(not character.isalnum() for character in non_space)
    if len(non_space) >= 5 and symbol_count / len(non_space) > 0.4:
        return False, INVALID_INPUT_MESSAGE

    if len(non_space) >= 5 and len(set(non_space.lower())) == 1:
        return False, INVALID_INPUT_MESSAGE

    words = re.findall(r"[A-Za-z]+", cleaned.lower())
    vowels = set("aeiou")

    for word in words:
        # Catch long words without standard vowels
        if len(word) >= 7:
            vowel_count = sum(1 for c in word if c in vowels)
            if vowel_count == 0 or (vowel_count / len(word)) < 0.12:
                return False, INVALID_INPUT_MESSAGE
        # Catch very long continuous random strings
        if len(word) >= 18:
            return False, INVALID_INPUT_MESSAGE

    # Catch common keyboard smashes
    if any(pattern in cleaned.lower() for pattern in ["asdfgh", "ghjmg", "qwertyui", "zxcvbn"]):
        return False, INVALID_INPUT_MESSAGE

    return True, None

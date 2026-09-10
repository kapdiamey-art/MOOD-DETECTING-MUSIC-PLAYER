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
    if len(non_space) >= 5 and symbol_count / len(non_space) > 0.6:
        return False, INVALID_INPUT_MESSAGE

    if len(non_space) >= 5 and len(set(non_space.lower())) == 1:
        return False, INVALID_INPUT_MESSAGE

    words = re.findall(r"[A-Za-z]+", cleaned.lower())
    if len(words) == 1 and len(words[0]) >= 7 and not re.search(r"[aeiouy]", words[0]):
        return False, INVALID_INPUT_MESSAGE

    if len(words) == 1 and words[0] in {"asdfghjkl", "qwertyuiop", "zxcvbnm"}:
        return False, INVALID_INPUT_MESSAGE

    return True, None

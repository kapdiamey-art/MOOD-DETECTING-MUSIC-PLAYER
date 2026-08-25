from pydantic import BaseModel
from typing import Optional

class MoodDetectRequest(BaseModel):
    text: str

class MoodSession(BaseModel):
    input_text: str
    detected_mood: str
    mood_emoji: str
    confidence: float
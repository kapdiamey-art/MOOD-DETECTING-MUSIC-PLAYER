
import os
import httpx
from dotenv import load_dotenv
from fastapi import APIRouter
from pydantic import BaseModel, Field
from google import genai

load_dotenv()

router = APIRouter()


class CompanionRequest(BaseModel):
    message: str = Field(min_length=1, max_length=500)
    current_mood: str | None = None


def response_text(payload: dict) -> str:
    for item in payload.get("output", []):
        for content in item.get("content", []):
            if content.get("type") == "output_text":
                text = content.get("text", "")
                if text:
                    return text

    for candidate in payload.get("candidates", []):
        content = candidate.get("content", {})
        for part in content.get("parts", []):
            text = part.get("text")
            if text:
                return text

    text = payload.get("text")
    if isinstance(text, str) and text.strip():
        return text

    return "I could not create a music response right now."


def fallback_recommendation_reply(
    request: CompanionRequest,
    detected_mood: str,
    suggested_track: str
) -> str:

    phrase = request.message.strip().lower()
    mood_hint = detected_mood.strip().lower() if detected_mood else ""

    if "sad" in phrase or "low" in phrase or "unhappy" in phrase:
        mood = "sadness"
        direction = (
            "try a soft acoustic or warm vocal track "
            "and keep the pace gentle."
        )

    elif "angry" in phrase or "mad" in phrase or "stress" in phrase:
        mood = "anger"
        direction = (
            "try a steady rhythm with clean drum patterns "
            "or calm electronic energy."
        )

    elif "happy" in phrase or "joy" in phrase or "excited" in phrase:
        mood = "joy"
        direction = (
            "go for an upbeat groove with a bright chorus."
        )

    elif "love" in phrase or "romantic" in phrase:
        mood = "love"
        direction = (
            "listen to something soft, romantic, and smooth."
        )

    elif "fear" in phrase or "scared" in phrase or "anxious" in phrase:
        mood = "fear"
        direction = (
            "choose a slow, reassuring melody and "
            "keep the listening experience calm."
        )

    elif mood_hint in {
        "sadness",
        "anger",
        "joy",
        "love",
        "fear",
        "surprise"
    }:
        mood = mood_hint
        direction = "choose music that matches your current mood."

    else:
        mood = ""
        direction = "we can find something that fits your mood."

    if mood:
        reply = (
            f"I hear you. Since you're feeling {mood}, "
            f"{direction} "
            "Want me to suggest a music direction?"
        )
    else:
        reply = (
            "Hey! I'm Moodify Companion. "
            "Tell me how you're feeling and I'll suggest a music direction."
        )

    if suggested_track:
        reply += f" {suggested_track}"

    return reply


@router.post("/chat")
async def chat(request: CompanionRequest):
    """Music-focused AI companion for Moodify."""

    gemini_key = os.getenv("GEMINI_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")

    detected_mood = request.current_mood or ""
    suggested_track = ""

    if not gemini_key and not openai_key:
        return {
            "reply": fallback_recommendation_reply(
                request,
                detected_mood,
                suggested_track
            )
        }

    system_prompt = (
        "You are Moodify Companion, a friendly AI assistant inside a music app. "
        "Your purpose is to help users choose music based on how they feel. "

        "The user's latest message is the strongest signal for their current emotion. "
        "If the user explicitly mentions an emotion such as sad, angry, happy, "
        "excited, anxious, scared, or in love, follow that emotion. "
        "Never contradict an explicitly stated emotion using the previously detected mood. "

        "If the user does not mention an emotion, use the previously detected mood "
        "only when it is useful. "

        "For simple greetings such as hi, hello, hey, ok, thanks, or short unclear "
        "messages, respond naturally without pretending that the user is feeling a "
        "specific emotion. "

        "Keep responses short, natural, and conversational. "
        "Focus on music, playlists, songs, genres, artists, and listening moods. "
        "You may suggest a simple music-related next action. "

        "Do not act as a therapist. "
        "Do not give medical advice. "
        "Do not behave like a general-purpose chatbot. "

        f"Previously detected mood: {detected_mood or 'none'}."
    )

    # GEMINI

    if gemini_key:
        try:
            client = genai.Client(api_key=gemini_key)

            prompt = (
                f"{system_prompt}\n\n"
                f"User message: {request.message}"
            )

            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )

            if response.text:
                return {
                    "reply": response.text.strip()
                }

            print("Gemini returned an empty response.")

        except Exception as e:
            print("GEMINI ERROR:", repr(e))
            raise

    # OPENAI FALLBACK

    if openai_key:
        payload = {
            "model": os.getenv("OPENAI_MODEL", "gpt-4.1-mini"),
            "store": False,
            "instructions": system_prompt,
            "input": request.message,
            "max_output_tokens": 180
        }

        try:
            async with httpx.AsyncClient(timeout=20) as client:
                response = await client.post(
                    "https://api.openai.com/v1/responses",
                    json=payload,
                    headers={
                        "Authorization": f"Bearer {openai_key}",
                        "Content-Type": "application/json"
                    }
                )

            if response.status_code >= 400:
                print(
                    "OpenAI error:",
                    response.status_code,
                    response.text
                )
            else:
                reply = response_text(response.json())

                if reply:
                    return {
                        "reply": reply
                    }

        except httpx.HTTPError as e:
            print("OpenAI connection error:", repr(e))

    # LOCAL FALLBACK

    return {
        "reply": fallback_recommendation_reply(
            request,
            detected_mood,
            suggested_track
        )
    }


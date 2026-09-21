import os
import sys
import pandas as pd
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CURRENT_DIR)
PROJECT_DIR = os.path.dirname(BACKEND_DIR)
RECOMMENDATION_SRC_DIR = os.path.join(PROJECT_DIR, "Recommendation engine", "src")
EMOTION_MODEL_SRC_DIR = os.path.join(PROJECT_DIR, "Emotion Detection Model", "src")

if RECOMMENDATION_SRC_DIR not in sys.path:
    sys.path.insert(0, RECOMMENDATION_SRC_DIR)
if EMOTION_MODEL_SRC_DIR not in sys.path:
    sys.path.insert(0, EMOTION_MODEL_SRC_DIR)

from services.weather_service import get_weather_context
from predict import predict_emotion
from recommendation import recommend

router = APIRouter()


class ContextFuseRequest(BaseModel):
    text: Optional[str] = "I am chilling right now"
    emotion: Optional[str] = None
    city: Optional[str] = "Mumbai"
    lat: Optional[float] = None
    lon: Optional[float] = None
    language: Optional[str] = "all"


@router.get("/weather")
def get_weather(
    city: Optional[str] = "Mumbai",
    lat: Optional[float] = None,
    lon: Optional[float] = None
):
    """Fetch live weather context using OpenWeatherMap API."""
    return get_weather_context(city=city, lat=lat, lon=lon)


@router.post("/fuse")
def fuse_context(req: ContextFuseRequest):
    """Environmental & Contextual Sentiment Fusion Endpoint.

    Combines Live Weather + Time of Day + Text/Emotion into hyper-niche
    cinematic playlists.
    """
    env = get_weather_context(city=req.city, lat=req.lat, lon=req.lon)

    # Detect emotion if not explicitly passed
    detected_emotion = req.emotion
    confidence = 0.85

    if not detected_emotion and req.text:
        pred = predict_emotion(req.text)
        detected_emotion = pred.get("emotion") or "joy"
        confidence = pred.get("confidence") or 0.80

    if not detected_emotion:
        detected_emotion = "joy"

    # Map environmental + emotion combo to cinematic title & audio tweaks
    weather_cond = env["condition"].lower()
    time_tag = env["time_tag"]

    if "rain" in weather_cond or "drizzle" in weather_cond or "thunderstorm" in weather_cond:
        if detected_emotion in ["sadness", "neutral"]:
            title = f"{env['time_icon']} {env['time_of_day']} Rain & Melancholy"
            desc = f"Fused {env['temp_c']}°C Rain + {env['time_of_day']} + {detected_emotion.title()} into a cozy windowpane lofi experience."
            reco_emotion = "sadness"
        else:
            title = f"{env['time_icon']} Cozy Rainy {env['time_of_day']} Lofi"
            desc = f"Fused {env['temp_c']}°C Rain + {env['time_of_day']} into a comforting acoustic soundscape."
            reco_emotion = "love"
    elif time_tag == "late_night":
        if detected_emotion == "joy":
            title = "🌙 Late Night Neon Grooves"
            desc = f"Fused Late Night + {env['temp_c']}°C {env['condition']} into smooth midnight vibes."
            reco_emotion = "joy"
        else:
            title = "🌙 3 AM Midnight Reflections"
            desc = f"Fused Late Night + {env['temp_c']}°C {env['condition']} + {detected_emotion.title()} for quiet introspection."
            reco_emotion = "sadness" if detected_emotion in ["sadness", "neutral"] else "fear"
    elif time_tag == "sunset":
        title = "🌆 Golden Hour Sunset Highway Drive"
        desc = f"Fused Sunset + {env['temp_c']}°C {env['condition']} into warm synth-pop & roadtrip tracks."
        reco_emotion = "love" if detected_emotion in ["love", "joy"] else "joy"
    else: # Day / Clear / Clouds
        if detected_emotion == "joy":
            title = f"☀️ {env['condition']} Daytime Energy Boost"
            desc = f"Fused {env['temp_c']}°C {env['condition']} + High Energy Joy into vibrant anthems."
            reco_emotion = "joy"
        elif detected_emotion == "anger":
            title = "🌩️ High-Voltage Release"
            desc = f"Fused {detected_emotion.title()} + {env['condition']} into heavy, cathartic beats."
            reco_emotion = "angry"
        else:
            title = f"🌤️ Balanced {env['condition']} Day Soundtrack"
            desc = f"Fused {env['temp_c']}°C {env['condition']} + {detected_emotion.title()} into easy listening."
            reco_emotion = "joy"

    # Call recommendation engine
    recs_df = recommend(
        reco_emotion,
        n=6,
        confidence=confidence,
        use_spotify=True,
        text=req.text or title,
        language=req.language or "all"
    )

    clean_df = recs_df.where(pd.notnull(recs_df), None)
    recs = clean_df.to_dict(orient="records")

    return {
        "status": "success",
        "title": title,
        "description": desc,
        "detected_emotion": detected_emotion,
        "environment": env,
        "recommendations": recs
    }

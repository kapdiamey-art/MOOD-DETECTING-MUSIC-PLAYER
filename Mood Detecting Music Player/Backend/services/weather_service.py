import os
import requests
from datetime import datetime
from typing import Optional, Dict, Any

OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", "").strip()


def get_time_of_day(hour: Optional[int] = None) -> Dict[str, str]:
    if hour is None:
        hour = datetime.now().hour

    if 23 <= hour or hour < 4:
        return {"name": "Late Night", "icon": "🌙", "tag": "late_night"}
    elif 4 <= hour < 7:
        return {"name": "Early Morning / Dawn", "icon": "🌅", "tag": "dawn"}
    elif 7 <= hour < 17:
        return {"name": "Midday", "icon": "☀️", "tag": "day"}
    elif 17 <= hour < 20:
        return {"name": "Golden Hour / Sunset", "icon": "🌆", "tag": "sunset"}
    else:
        return {"name": "Night", "icon": "🌌", "tag": "night"}


def get_weather_context(
    city: Optional[str] = "Mumbai",
    lat: Optional[float] = None,
    lon: Optional[float] = None
) -> Dict[str, Any]:
    time_ctx = get_time_of_day()

    if not OPENWEATHER_API_KEY:
        # Fallback simulated weather if key is missing or blank
        return {
            "status": "simulated",
            "condition": "Clear",
            "description": "Clear Sky",
            "icon": "☀️",
            "temp_c": 24.0,
            "humidity": 60,
            "city": city or "Local",
            "time_of_day": time_ctx["name"],
            "time_icon": time_ctx["icon"],
            "time_tag": time_ctx["tag"],
        }

    try:
        if lat is not None and lon is not None:
            url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={OPENWEATHER_API_KEY}&units=metric"
        else:
            query_city = city or "Mumbai"
            url = f"https://api.openweathermap.org/data/2.5/weather?q={query_city}&appid={OPENWEATHER_API_KEY}&units=metric"

        res = requests.get(url, timeout=5)
        if res.status_code == 200:
            data = res.json()
            cond_main = data["weather"][0]["main"]
            cond_desc = data["weather"][0]["description"].title()
            temp_c = round(data["main"]["temp"], 1)
            humidity = data["main"]["humidity"]
            fetched_city = data.get("name", city or "Local")

            weather_icons = {
                "Rain": "🌧️",
                "Drizzle": "🌦️",
                "Thunderstorm": "🌩️",
                "Snow": "❄️",
                "Clear": "☀️",
                "Clouds": "☁️",
                "Mist": "🌫️",
                "Fog": "🌫️",
                "Haze": "🌫️",
                "Smoke": "🌫️",
            }
            icon = weather_icons.get(cond_main, "🌤️")

            return {
                "status": "live",
                "condition": cond_main,
                "description": cond_desc,
                "icon": icon,
                "temp_c": temp_c,
                "humidity": humidity,
                "city": fetched_city,
                "time_of_day": time_ctx["name"],
                "time_icon": time_ctx["icon"],
                "time_tag": time_ctx["tag"],
            }
        else:
            print(f"[weather_service] OpenWeather API error {res.status_code}: {res.text}")
    except Exception as e:
        print(f"[weather_service] Exception fetching weather: {e}")

    # Graceful fallback if weather request failed
    return {
        "status": "fallback",
        "condition": "Clear",
        "description": "Clear Sky",
        "icon": "🌤️",
        "temp_c": 25.0,
        "humidity": 55,
        "city": city or "Local",
        "time_of_day": time_ctx["name"],
        "time_icon": time_ctx["icon"],
        "time_tag": time_ctx["tag"],
    }

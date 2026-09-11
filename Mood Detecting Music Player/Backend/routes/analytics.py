from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timedelta
from collections import Counter

from config.database import mood_sessions_col, liked_songs_col, recently_played_col
from routes.auth import get_current_user

router = APIRouter()


def _build_user_filter(current_user: dict) -> dict:
    uid = str(current_user.get("_id", ""))
    email = current_user.get("email", "")
    if uid and email and email != uid:
        return {"$or": [{"user_id": uid}, {"user_id": email}]}
    return {"user_id": uid or email}


@router.get("/stats")
async def get_stats(current_user=Depends(get_current_user)):
    if mood_sessions_col is None or liked_songs_col is None or recently_played_col is None:
        return {"total_sessions": 0, "top_mood": "-", "songs_liked": 0, "songs_played": 0, "listening_hours": 0}

    user_filter = _build_user_filter(current_user)

    total_sessions = await mood_sessions_col.count_documents(user_filter)
    total_liked    = await liked_songs_col.count_documents(user_filter)
    total_played   = await recently_played_col.count_documents(user_filter)

    # find top mood
    sessions = await mood_sessions_col.find(
        user_filter, {"detected_mood": 1, "_id": 0}
    ).to_list(1000)

    top_mood = "-"
    if sessions:
        counts = Counter(s["detected_mood"] for s in sessions if s.get("detected_mood"))
        if counts:
            raw_top = counts.most_common(1)[0][0]
            top_mood = str(raw_top).capitalize()

    return {
        "total_sessions": total_sessions,
        "top_mood":       top_mood,
        "songs_liked":    total_liked,
        "songs_played":   total_played,
        "listening_hours": round((total_played * 3.5) / 60, 1)
    }


@router.get("/mood-distribution")
async def mood_distribution(current_user=Depends(get_current_user)):
    if mood_sessions_col is None:
        return []

    user_filter = _build_user_filter(current_user)

    sessions = await mood_sessions_col.find(
        user_filter, {"detected_mood": 1, "_id": 0}
    ).to_list(1000)

    if not sessions:
        return []

    counts = Counter(str(s["detected_mood"]).lower() for s in sessions if s.get("detected_mood"))
    total = sum(counts.values())
    if total == 0:
        return []

    return [
        {"mood": mood.capitalize(), "count": count, "percentage": round((count / total) * 100, 1)}
        for mood, count in counts.most_common()
    ]


@router.get("/mood-activity")
async def mood_activity(current_user=Depends(get_current_user)):
    if mood_sessions_col is None:
        # Return 8-day empty skeleton so the chart always renders
        result = []
        for i in range(7, -1, -1):
            day = (datetime.utcnow() - timedelta(days=i)).strftime("%a")
            result.append({"day": day, "sessions": 0})
        return result

    user_filter = _build_user_filter(current_user)

    # last 8 days
    since = datetime.utcnow() - timedelta(days=8)
    activity_filter = dict(user_filter)
    activity_filter["timestamp"] = {"$gte": since}

    sessions = await mood_sessions_col.find(
        activity_filter,
        {"timestamp": 1, "_id": 0}
    ).to_list(1000)

    # count per day — handle both native datetime and ISO string timestamps
    day_counts: Counter = Counter()
    for s in sessions:
        ts = s.get("timestamp")
        if ts is None:
            continue
        if hasattr(ts, "strftime"):
            day = ts.strftime("%a")
        elif isinstance(ts, str):
            try:
                day = datetime.fromisoformat(ts.replace("Z", "+00:00")).strftime("%a")
            except Exception:
                continue
        else:
            continue
        day_counts[day] += 1

    # build last 8 days in chronological order
    result = []
    for i in range(7, -1, -1):
        day = (datetime.utcnow() - timedelta(days=i)).strftime("%a")
        result.append({"day": day, "sessions": day_counts.get(day, 0)})

    return result


@router.get("/insight")
async def mood_insight(current_user=Depends(get_current_user)):
    if mood_sessions_col is None:
        return {"insight": "Database not connected. Please contact support."}

    user_filter = _build_user_filter(current_user)

    sessions = await mood_sessions_col.find(
        user_filter, {"detected_mood": 1, "_id": 0}
    ).sort("timestamp", -1).limit(20).to_list(20)

    if not sessions:
        return {"insight": "No mood data yet. Start by telling us how you feel on the Mood Detection page!"}

    counts = Counter(str(s["detected_mood"]).lower() for s in sessions if s.get("detected_mood"))
    if not counts:
        return {"insight": "No mood data yet. Start by telling us how you feel on the Mood Detection page!"}

    raw_top = counts.most_common(1)[0][0]
    total = len(sessions)
    top_count = counts.get(raw_top, 0)

    # comprehensive emotion insight messages
    messages = {
        "joy":      f"You've been radiating joy in {top_count} of your last {total} sessions. Keep that positive energy going!",
        "happy":    f"You've been feeling happy in {top_count} of your last {total} sessions. Keep that great energy going!",
        "sadness":  f"You've had {top_count} reflective or sad moments recently. Music can help — let us suggest something soothing.",
        "sad":      f"You've had {top_count} sad moments recently. Music can help — let us suggest something soothing.",
        "love":     f"Love and warm vibes detected in {top_count} sessions! Enjoy the heartwarming soundtrack.",
        "anger":    f"Seems like you've had some intense or frustrating moments ({top_count} sessions). Let music help you reset.",
        "angry":    f"Seems like you've had some frustrating moments ({top_count} sessions). Let music help you reset.",
        "fear":     f"You've felt anxious or fearful in {top_count} of your recent sessions. Try some grounding ambient music to ease your mind.",
        "surprise": f"You've experienced {top_count} surprising moments recently. Let's keep exploring new sounds!",
        "calm":     f"You're mostly calm lately ({top_count}/{total} sessions). Great state of mind for focus and productivity.",
    }

    return {"insight": messages.get(raw_top, f"Your dominant mood has been {raw_top.capitalize()} lately.")}

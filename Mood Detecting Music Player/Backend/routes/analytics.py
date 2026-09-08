from fastapi import APIRouter, Depends
from datetime import datetime, timedelta
from collections import Counter

from config.database import mood_sessions_col, liked_songs_col, recently_played_col
from routes.auth import get_current_user

router = APIRouter()


@router.get("/stats")
async def get_stats(current_user=Depends(get_current_user)):
    uid = str(current_user["_id"])

    total_sessions = await mood_sessions_col.count_documents({"user_id": uid})
    total_liked = await liked_songs_col.count_documents({"user_id": uid})
    total_played = await recently_played_col.count_documents({"user_id": uid})

    # find top mood
    sessions = await mood_sessions_col.find(
        {"user_id": uid}, {"detected_mood": 1, "_id": 0}
    ).to_list(1000)

    top_mood = "None"
    if sessions:
        counts = Counter(s["detected_mood"] for s in sessions)
        top_mood = counts.most_common(1)[0][0]

    return {
        "total_sessions": total_sessions,
        "top_mood": top_mood,
        "songs_liked": total_liked,
        "songs_played": total_played,
        "listening_hours": round((total_played * 3.5) / 60, 1)
    }


@router.get("/mood-distribution")
async def mood_distribution(current_user=Depends(get_current_user)):
    uid = str(current_user["_id"])

    sessions = await mood_sessions_col.find(
        {"user_id": uid}, {"detected_mood": 1, "_id": 0}
    ).to_list(1000)

    if not sessions:
        return []

    counts = Counter(s["detected_mood"] for s in sessions)
    total = len(sessions)

    return [
        {"mood": mood, "count": count, "percentage": round((count / total) * 100, 1)}
        for mood, count in counts.most_common()
    ]


@router.get("/mood-activity")
async def mood_activity(current_user=Depends(get_current_user)):
    uid = str(current_user["_id"])

    # last 8 days
    since = datetime.utcnow() - timedelta(days=8)

    sessions = await mood_sessions_col.find(
        {"user_id": uid, "timestamp": {"$gte": since}},
        {"timestamp": 1, "_id": 0}
    ).to_list(1000)

    # count per day
    day_counts = Counter()
    for s in sessions:
        day = s["timestamp"].strftime("%a") if hasattr(s["timestamp"], "strftime") else "N/A"
        day_counts[day] += 1

    # build last 8 days in order
    result = []
    for i in range(7, -1, -1):
        day = (datetime.utcnow() - timedelta(days=i)).strftime("%a")
        result.append({"day": day, "sessions": day_counts.get(day, 0)})

    return result


@router.get("/insight")
async def mood_insight(current_user=Depends(get_current_user)):
    uid = str(current_user["_id"])

    sessions = await mood_sessions_col.find(
        {"user_id": uid}, {"detected_mood": 1, "_id": 0}
    ).sort("timestamp", -1).limit(20).to_list(20)

    if not sessions:
        return {"insight": "No mood data yet. Start by telling us how you feel on the Mood Detection page!"}

    counts = Counter(s["detected_mood"] for s in sessions)
    top_mood = counts.most_common(1)[0][0]
    total = len(sessions)

    # simple rule-based insight
    messages = {
        "Happy":    f"You've been feeling happy in {counts.get('Happy', 0)} of your last {total} sessions. Keep that energy going!",
        "Sad":      f"You've had {counts.get('Sad', 0)} sad moments recently. Music can help — let us suggest something soothing.",
        "Calm":     f"You're mostly calm lately ({counts.get('Calm', 0)}/{total} sessions). Great state of mind for focus and productivity.",
        "Energetic":f"High energy detected in {counts.get('Energetic', 0)} sessions! You're on fire — keep it up.",
        "Angry":    f"Seems like you've had some frustrating moments ({counts.get('Angry', 0)} sessions). Let music help you reset.",
        "Anxious":  f"You've felt anxious {counts.get('Anxious', 0)} times recently. Try some calming music to ease your mind.",
        "Stressed": f"Stress detected in {counts.get('Stressed', 0)} of your sessions. Take a break and let the music do its thing.",
    }

    return {"insight": messages.get(top_mood, f"Your dominant mood has been {top_mood} lately.")}

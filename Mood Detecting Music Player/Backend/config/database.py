import motor.motor_asyncio
from dotenv import load_dotenv
import os

load_dotenv()

# DB connection is optional — will be set up by the DB team
# Server will still start without MONGO_URI / DB_NAME
try:
    _mongo_uri = os.getenv("MONGO_URI")
    _db_name   = os.getenv("DB_NAME")

    if _mongo_uri and _db_name:
        client = motor.motor_asyncio.AsyncIOMotorClient(_mongo_uri)
        db = client[_db_name]

        # All 5 collections
        users_col           = db["users"]
        mood_sessions_col   = db["mood_sessions"]
        liked_songs_col     = db["liked_songs"]
        playlists_col       = db["playlists"]
        recently_played_col = db["recently_played"]

        print("MongoDB connected successfully.")
    else:
        print("WARNING: MongoDB credentials not set. DB features will be unavailable.")
        client = None
        db = None
        users_col = mood_sessions_col = liked_songs_col = playlists_col = recently_played_col = None

except Exception as e:
    print(f"WARNING: MongoDB connection failed: {e}")
    client = None
    db = None
    users_col = mood_sessions_col = liked_songs_col = playlists_col = recently_played_col = None
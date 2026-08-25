import motor.motor_asyncio
from dotenv import load_dotenv
import os

load_dotenv()

client = motor.motor_asyncio.AsyncIOMotorClient(os.getenv("MONGO_URI"))
db = client[os.getenv("DB_NAME")]

# All 5 collections
users_col           = db["users"]
mood_sessions_col   = db["mood_sessions"]
liked_songs_col     = db["liked_songs"]
playlists_col       = db["playlists"]
recently_played_col = db["recently_played"]
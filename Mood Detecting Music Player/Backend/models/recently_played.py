from pydantic import BaseModel

class RecentlyPlayed(BaseModel):
    song_title: str
    artist: str
    mood_tag: str
from pydantic import BaseModel

class LikedSong(BaseModel):
    song_title: str
    artist: str
    mood_tag: str
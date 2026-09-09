from pydantic import BaseModel
from typing import Optional

class LikedSong(BaseModel):
    song_title:  str
    artist:      str
    mood_tag:    str
    # Playback fields — saved so MyMusic can play songs directly
    preview_url:  Optional[str] = None
    album_image:  Optional[str] = None
    spotify_url:  Optional[str] = None
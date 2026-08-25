from pydantic import BaseModel
from typing import List

class PlaylistCreate(BaseModel):
    name: str
    emoji: str
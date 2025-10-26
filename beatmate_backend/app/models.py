from pydantic import BaseModel

class GenerateRequest(BaseModel):
    lyrics: str # snippet from UI
    genre: str
    title: str = None
    duration: int = 60  # duration in seconds
    voiceType: str = "male"  # male, female, or duet


class GenerateResponse(BaseModel):
    song_url: str
    local_path: str


class RemixRequest(BaseModel):
    song_a: str  # filename of first song
    song_b: str  # filename of second song
    title: str
    genre: str
    voiceType: str = "male"
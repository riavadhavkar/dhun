from pydantic import BaseModel


class TrackSearchResult(BaseModel):
    id: str
    name: str
    artist: str
    album: str
    album_art: str | None
    duration_ms: int


class LyricLine(BaseModel):
    start_ms: int
    original: str
    pronunciation: str
    translated: str


class LyricsResponse(BaseModel):
    track_id: str
    language: str
    lines: list[LyricLine]


class Language(BaseModel):
    code: str
    name: str

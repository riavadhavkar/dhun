from pydantic import BaseModel


class TrackSearchResult(BaseModel):
    id: str
    name: str
    artist: str
    album: str
    album_art: str | None
    duration_ms: int


class OriginalLyricLine(BaseModel):
    start_ms: int
    text: str


class OriginalLyricsResponse(BaseModel):
    track_id: str
    lines: list[OriginalLyricLine]


class TranslationLine(BaseModel):
    start_ms: int
    pronunciation: str
    translation: str


class TranslationResponse(BaseModel):
    track_id: str
    language: str
    lines: list[TranslationLine]


class Language(BaseModel):
    code: str
    name: str

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.languages import LANGUAGE_NAMES_BY_CODE, SUPPORTED_LANGUAGES
from app.models import Song, Translation
from app.schemas import Language, LyricLine, LyricsResponse, TrackSearchResult
from app.services.lrclib_client import NoSyncedLyricsError, lrclib_client
from app.services.spotify_client import spotify_client
from app.services.translation_service import TranslationError, translation_service

router = APIRouter(prefix="/api", tags=["songs"])


@router.get("/languages", response_model=list[Language])
def list_languages() -> list[Language]:
    return [Language(**lang) for lang in SUPPORTED_LANGUAGES]


@router.get("/songs/{spotify_track_id}", response_model=TrackSearchResult)
async def get_track_metadata(spotify_track_id: str) -> TrackSearchResult:
    track = await spotify_client.get_track(spotify_track_id)
    return TrackSearchResult(**track)


@router.get("/songs/{spotify_track_id}/lyrics", response_model=LyricsResponse)
async def get_lyrics(
    spotify_track_id: str,
    lang: str = Query(default="en"),
    db: Session = Depends(get_db),
) -> LyricsResponse:
    if lang not in LANGUAGE_NAMES_BY_CODE:
        raise HTTPException(status_code=400, detail=f"unsupported language code: {lang}")

    song = db.scalar(select(Song).where(Song.spotify_track_id == spotify_track_id))

    if song is None:
        track = await spotify_client.get_track(spotify_track_id)
        try:
            synced_lyrics = await lrclib_client.get_synced_lyrics(
                track["artist"], track["name"], track.get("album"), track.get("duration_ms")
            )
        except NoSyncedLyricsError:
            raise HTTPException(
                status_code=404,
                detail="No synced lyrics available for this track.",
            ) from None

        song = Song(
            spotify_track_id=spotify_track_id,
            artist=track["artist"],
            title=track["name"],
            album=track.get("album"),
            duration_ms=track.get("duration_ms"),
            synced_lyrics=synced_lyrics,
        )
        db.add(song)
        db.commit()
        db.refresh(song)

    translation = db.scalar(
        select(Translation).where(Translation.song_id == song.id, Translation.language_code == lang)
    )

    if translation is None:
        original_texts = [line["text"] for line in song.synced_lyrics]
        try:
            translated_texts = translation_service.translate_lines(
                original_texts, LANGUAGE_NAMES_BY_CODE[lang]
            )
        except TranslationError as exc:
            raise HTTPException(status_code=502, detail=str(exc)) from exc

        translation = Translation(
            song_id=song.id,
            language_code=lang,
            translated_lines=translated_texts,
            model_used="claude-sonnet-4-5",
        )
        db.add(translation)
        db.commit()
        db.refresh(translation)

    lines = [
        LyricLine(
            start_ms=original["start_ms"],
            original=original["text"],
            translated=translated,
        )
        for original, translated in zip(song.synced_lyrics, translation.translated_lines)
    ]

    return LyricsResponse(track_id=spotify_track_id, language=lang, lines=lines)

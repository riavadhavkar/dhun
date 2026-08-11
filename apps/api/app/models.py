from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Song(Base):
    __tablename__ = "songs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    spotify_track_id: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    artist: Mapped[str] = mapped_column(String(255))
    title: Mapped[str] = mapped_column(String(255))
    album: Mapped[str | None] = mapped_column(String(255), nullable=True)
    duration_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # [{"start_ms": int, "text": str}, ...] sorted by start_ms
    synced_lyrics: Mapped[list[dict]] = mapped_column(JSONB)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    translations: Mapped[list["Translation"]] = relationship(
        back_populates="song", cascade="all, delete-orphan"
    )


class Translation(Base):
    __tablename__ = "translations"
    __table_args__ = (UniqueConstraint("song_id", "language_code", name="uq_song_language"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    song_id: Mapped[int] = mapped_column(ForeignKey("songs.id", ondelete="CASCADE"))
    language_code: Mapped[str] = mapped_column(String(8))

    # list[str], same order/length as song.synced_lyrics
    translated_lines: Mapped[list[str]] = mapped_column(JSONB)

    model_used: Mapped[str] = mapped_column(String(64))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    song: Mapped["Song"] = relationship(back_populates="translations")

"""initial schema: songs, translations

Revision ID: 0001
Revises:
Create Date: 2026-08-11

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "songs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("spotify_track_id", sa.String(length=64), nullable=False),
        sa.Column("artist", sa.String(length=255), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("album", sa.String(length=255), nullable=True),
        sa.Column("duration_ms", sa.Integer(), nullable=True),
        sa.Column("synced_lyrics", postgresql.JSONB(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_songs_spotify_track_id", "songs", ["spotify_track_id"], unique=True)

    op.create_table(
        "translations",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("song_id", sa.Integer(), sa.ForeignKey("songs.id", ondelete="CASCADE"), nullable=False),
        sa.Column("language_code", sa.String(length=8), nullable=False),
        sa.Column("translated_lines", postgresql.JSONB(), nullable=False),
        sa.Column("model_used", sa.String(length=64), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("song_id", "language_code", name="uq_song_language"),
    )


def downgrade() -> None:
    op.drop_table("translations")
    op.drop_index("ix_songs_spotify_track_id", table_name="songs")
    op.drop_table("songs")

"""add transliterated_lines to translations

Revision ID: 0002
Revises: 0001
Create Date: 2026-08-12

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "translations",
        sa.Column("transliterated_lines", postgresql.JSONB(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("translations", "transliterated_lines")

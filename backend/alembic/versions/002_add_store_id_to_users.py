"""add store_id to users

Revision ID: 002_add_store_id_to_users
Revises: 001_initial_schema
Create Date: 2026-04-05 00:10:00.000000
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "002_add_store_id_to_users"
down_revision: str | None = "001_initial_schema"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("users", sa.Column("store_id", postgresql.UUID(as_uuid=True), nullable=True))
    op.create_foreign_key(
        "fk_users_store_id_stores",
        "users",
        "stores",
        ["store_id"],
        ["id"],
    )


def downgrade() -> None:
    op.drop_constraint("fk_users_store_id_stores", "users", type_="foreignkey")
    op.drop_column("users", "store_id")

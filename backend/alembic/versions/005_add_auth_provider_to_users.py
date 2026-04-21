"""add auth provider to users

Revision ID: 005_auth_provider
Revises: 004_payment_tracking
Create Date: 2026-04-21 21:25:00.000000
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "005_auth_provider"
down_revision: str | None = "004_payment_tracking"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


auth_provider_enum = postgresql.ENUM(
    "email",
    "phone",
    "google",
    name="auth_provider",
    create_type=False,
)


def upgrade() -> None:
    bind = op.get_bind()
    auth_provider_enum.create(bind, checkfirst=True)

    op.add_column(
        "users",
        sa.Column(
            "auth_provider",
            auth_provider_enum,
            nullable=False,
            server_default="email",
        ),
    )


def downgrade() -> None:
    bind = op.get_bind()

    op.drop_column("users", "auth_provider")
    auth_provider_enum.drop(bind, checkfirst=True)

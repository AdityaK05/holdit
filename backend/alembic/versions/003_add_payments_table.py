"""add payments table

Revision ID: 003_add_payments_table
Revises: 002_add_store_id_to_users
Create Date: 2026-04-21 12:00:00.000000
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "003_add_payments_table"
down_revision: str | None = "002_add_store_id_to_users"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


payment_status_enum = postgresql.ENUM(
    "pending",
    "completed",
    "failed",
    "refunded",
    name="payment_status",
    create_type=False,
)


def upgrade() -> None:
    bind = op.get_bind()
    payment_status_enum.create(bind, checkfirst=True)

    op.create_table(
        "payments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "reservation_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("reservations.id"),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id"),
            nullable=False,
        ),
        sa.Column("razorpay_order_id", sa.String(255), nullable=False, unique=True),
        sa.Column("razorpay_payment_id", sa.String(255), nullable=True),
        sa.Column("razorpay_signature", sa.String(512), nullable=True),
        sa.Column("amount_paise", sa.Integer(), nullable=False),
        sa.Column("currency", sa.String(10), nullable=False, server_default="INR"),
        sa.Column(
            "status",
            payment_status_enum,
            nullable=False,
            server_default="pending",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )


def downgrade() -> None:
    bind = op.get_bind()
    op.drop_table("payments")
    payment_status_enum.drop(bind, checkfirst=True)

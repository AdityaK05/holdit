"""add payment tracking and barcode inventory support

Revision ID: 004_payment_tracking
Revises: 003_add_payments_table
Create Date: 2026-04-21 21:05:00.000000
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "004_payment_tracking"
down_revision: str | None = "003_add_payments_table"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


reservation_payment_status_enum = postgresql.ENUM(
    "pending",
    "partially_paid",
    "fully_paid",
    name="reservation_payment_status",
    create_type=False,
)

payment_mode_enum = postgresql.ENUM(
    "full",
    "partial",
    "remaining",
    name="payment_mode",
    create_type=False,
)


def upgrade() -> None:
    bind = op.get_bind()

    reservation_payment_status_enum.create(bind, checkfirst=True)
    payment_mode_enum.create(bind, checkfirst=True)

    op.add_column("products", sa.Column("barcode", sa.String(length=64), nullable=True))
    op.add_column(
        "products",
        sa.Column("price_paise", sa.Integer(), nullable=False, server_default="0"),
    )
    op.create_unique_constraint("uq_products_barcode", "products", ["barcode"])

    op.add_column(
        "reservations",
        sa.Column("total_amount_paise", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "reservations",
        sa.Column("paid_amount_paise", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "reservations",
        sa.Column(
            "payment_status",
            reservation_payment_status_enum,
            nullable=False,
            server_default="pending",
        ),
    )

    op.add_column(
        "payments",
        sa.Column(
            "payment_mode",
            payment_mode_enum,
            nullable=False,
            server_default="full",
        ),
    )

    op.execute(
        """
        UPDATE reservations AS r
        SET total_amount_paise = COALESCE(p.price_paise, 0)
        FROM products AS p
        WHERE p.id = r.product_id
        """
    )

    op.execute(
        """
        UPDATE reservations AS r
        SET paid_amount_paise = completed.total_paid
        FROM (
            SELECT reservation_id, COALESCE(SUM(amount_paise), 0) AS total_paid
            FROM payments
            WHERE status = 'completed'
            GROUP BY reservation_id
        ) AS completed
        WHERE r.id = completed.reservation_id
        """
    )

    # Preserve data integrity for older rows where paid amount exceeds product price.
    op.execute(
        """
        UPDATE reservations
        SET total_amount_paise = paid_amount_paise
        WHERE paid_amount_paise > total_amount_paise
        """
    )

    op.execute(
        """
        UPDATE reservations
        SET payment_status = CASE
            WHEN total_amount_paise <= 0 THEN 'fully_paid'::reservation_payment_status
            WHEN paid_amount_paise <= 0 THEN 'pending'::reservation_payment_status
            WHEN paid_amount_paise < total_amount_paise THEN 'partially_paid'::reservation_payment_status
            ELSE 'fully_paid'::reservation_payment_status
        END
        """
    )

    op.execute(
        """
        UPDATE payments AS p
        SET payment_mode = CASE
            WHEN r.total_amount_paise > 0 AND p.amount_paise < r.total_amount_paise
                THEN 'partial'::payment_mode
            ELSE 'full'::payment_mode
        END
        FROM reservations AS r
        WHERE r.id = p.reservation_id
        """
    )

    op.create_check_constraint(
        "ck_reservations_total_amount_non_negative",
        "reservations",
        "total_amount_paise >= 0",
    )
    op.create_check_constraint(
        "ck_reservations_paid_amount_non_negative",
        "reservations",
        "paid_amount_paise >= 0",
    )
    op.create_check_constraint(
        "ck_reservations_paid_lte_total",
        "reservations",
        "paid_amount_paise <= total_amount_paise",
    )


def downgrade() -> None:
    bind = op.get_bind()

    op.drop_constraint("ck_reservations_paid_lte_total", "reservations", type_="check")
    op.drop_constraint(
        "ck_reservations_paid_amount_non_negative",
        "reservations",
        type_="check",
    )
    op.drop_constraint(
        "ck_reservations_total_amount_non_negative",
        "reservations",
        type_="check",
    )

    op.drop_column("payments", "payment_mode")

    op.drop_column("reservations", "payment_status")
    op.drop_column("reservations", "paid_amount_paise")
    op.drop_column("reservations", "total_amount_paise")

    op.drop_constraint("uq_products_barcode", "products", type_="unique")
    op.drop_column("products", "price_paise")
    op.drop_column("products", "barcode")

    payment_mode_enum.drop(bind, checkfirst=True)
    reservation_payment_status_enum.drop(bind, checkfirst=True)

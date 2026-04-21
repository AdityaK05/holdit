import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, CreatedAtMixin, UUIDPrimaryKeyMixin


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


class PaymentMode(str, enum.Enum):
    FULL = "full"
    PARTIAL = "partial"
    REMAINING = "remaining"


class Payment(UUIDPrimaryKeyMixin, CreatedAtMixin, Base):
    __tablename__ = "payments"

    reservation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("reservations.id"),
        nullable=False,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
    )
    razorpay_order_id: Mapped[str] = mapped_column(
        String(255), nullable=False, unique=True
    )
    razorpay_payment_id: Mapped[str | None] = mapped_column(
        String(255), nullable=True
    )
    razorpay_signature: Mapped[str | None] = mapped_column(
        String(512), nullable=True
    )
    amount_paise: Mapped[int] = mapped_column(Integer, nullable=False)
    currency: Mapped[str] = mapped_column(
        String(10), nullable=False, default="INR", server_default="INR"
    )
    status: Mapped[PaymentStatus] = mapped_column(
        Enum(
            PaymentStatus,
            name="payment_status",
            values_callable=lambda enum_type: [member.value for member in enum_type],
            validate_strings=True,
        ),
        nullable=False,
        default=PaymentStatus.PENDING,
        server_default=PaymentStatus.PENDING.value,
    )
    payment_mode: Mapped[PaymentMode] = mapped_column(
        Enum(
            PaymentMode,
            name="payment_mode",
            values_callable=lambda enum_type: [member.value for member in enum_type],
            validate_strings=True,
        ),
        nullable=False,
        default=PaymentMode.FULL,
        server_default=PaymentMode.FULL.value,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    reservation: Mapped["Reservation"] = relationship(
        "Reservation", back_populates="payments"
    )
    user: Mapped["User"] = relationship("User", back_populates="payments")

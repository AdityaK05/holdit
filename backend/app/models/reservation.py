import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, CreatedAtMixin, UUIDPrimaryKeyMixin


class ReservationStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    REJECTED = "rejected"
    COMPLETED = "completed"
    EXPIRED = "expired"


class ReservationPaymentStatus(str, enum.Enum):
    PENDING = "pending"
    PARTIALLY_PAID = "partially_paid"
    FULLY_PAID = "fully_paid"


class Reservation(UUIDPrimaryKeyMixin, CreatedAtMixin, Base):
    __tablename__ = "reservations"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
    )
    store_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("stores.id"),
        nullable=False,
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id"),
        nullable=False,
    )
    status: Mapped[ReservationStatus] = mapped_column(
        Enum(
            ReservationStatus,
            name="reservation_status",
            values_callable=lambda enum_type: [member.value for member in enum_type],
            validate_strings=True,
        ),
        nullable=False,
        default=ReservationStatus.PENDING,
        server_default=ReservationStatus.PENDING.value,
    )
    otp: Mapped[str] = mapped_column(String(6), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    total_amount_paise: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )
    paid_amount_paise: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )
    payment_status: Mapped[ReservationPaymentStatus] = mapped_column(
        Enum(
            ReservationPaymentStatus,
            name="reservation_payment_status",
            values_callable=lambda enum_type: [member.value for member in enum_type],
            validate_strings=True,
        ),
        nullable=False,
        default=ReservationPaymentStatus.PENDING,
        server_default=ReservationPaymentStatus.PENDING.value,
    )

    user: Mapped["User"] = relationship("User", back_populates="reservations")
    store: Mapped["Store"] = relationship("Store", back_populates="reservations")
    product: Mapped["Product"] = relationship("Product", back_populates="reservations")
    payments: Mapped[list["Payment"]] = relationship(
        "Payment", back_populates="reservation"
    )

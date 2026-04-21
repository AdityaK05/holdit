from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.payment import PaymentMode, PaymentStatus
from app.models.reservation import ReservationPaymentStatus


class PaymentCreateRequest(BaseModel):
    """Create a payment order for a reservation."""

    reservation_id: UUID
    payment_mode: PaymentMode = Field(default=PaymentMode.FULL)
    amount: float | None = Field(
        default=None,
        gt=0,
        description="Optional amount in INR (rupees)",
    )


class PaymentOrderResponse(BaseModel):
    """Returned after creating a payment order."""

    reservation_id: UUID
    razorpay_order_id: str
    amount_paise: int
    currency: str
    key_id: str
    payment_id: UUID  # Our internal payment record ID
    payment_mode: PaymentMode
    reservation_payment_status: ReservationPaymentStatus
    total_amount_paise: int
    paid_amount_paise: int
    outstanding_amount_paise: int
    is_mock_gateway: bool


class PaymentVerifyRequest(BaseModel):
    """Frontend sends Razorpay callback data for server-side HMAC verification."""
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class PaymentOut(BaseModel):
    """Full payment record for API responses."""
    id: UUID
    reservation_id: UUID
    user_id: UUID
    razorpay_order_id: str
    razorpay_payment_id: str | None
    amount_paise: int
    currency: str
    status: PaymentStatus
    payment_mode: PaymentMode
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

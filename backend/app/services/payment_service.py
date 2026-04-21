import hashlib
import hmac
import logging
import uuid
from datetime import datetime, timedelta, timezone
from uuid import UUID

import razorpay
from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.inventory import StoreInventory
from app.models.payment import Payment, PaymentMode, PaymentStatus
from app.models.reservation import (
    Reservation,
    ReservationPaymentStatus,
    ReservationStatus,
)

logger = logging.getLogger(__name__)

_razorpay_client: razorpay.Client | None = None


def _get_razorpay_client() -> razorpay.Client:
    global _razorpay_client
    if _razorpay_client is None:
        _razorpay_client = razorpay.Client(
            auth=(settings.razorpay_key_id, settings.razorpay_key_secret)
        )
    return _razorpay_client


def _is_gateway_configured() -> bool:
    return bool(settings.razorpay_key_id and settings.razorpay_key_secret)


def _build_mock_order_id() -> str:
    return f"order_mock_{uuid.uuid4().hex[:18]}"


def _payment_status_from_amounts(
    total_amount_paise: int,
    paid_amount_paise: int,
) -> ReservationPaymentStatus:
    if total_amount_paise <= 0:
        return ReservationPaymentStatus.FULLY_PAID
    if paid_amount_paise <= 0:
        return ReservationPaymentStatus.PENDING
    if paid_amount_paise < total_amount_paise:
        return ReservationPaymentStatus.PARTIALLY_PAID
    return ReservationPaymentStatus.FULLY_PAID


def _resolve_order_amount_paise(
    reservation: Reservation,
    payment_mode: PaymentMode,
    amount_rupees: float | None,
) -> int:
    remaining_paise = reservation.total_amount_paise - reservation.paid_amount_paise
    if remaining_paise <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reservation is already fully paid",
        )

    amount_from_payload = None
    if amount_rupees is not None:
        amount_from_payload = int(round(amount_rupees * 100))
        if amount_from_payload <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment amount must be greater than zero",
            )

    if payment_mode == PaymentMode.REMAINING and reservation.paid_amount_paise <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Pay full or partial amount first before paying remaining amount",
        )

    if payment_mode == PaymentMode.PARTIAL and reservation.paid_amount_paise > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Use remaining payment mode for follow-up payments",
        )

    if payment_mode in (PaymentMode.FULL, PaymentMode.REMAINING):
        amount_paise = remaining_paise
        if amount_from_payload is not None and amount_from_payload != remaining_paise:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Amount must match the outstanding balance for full/remaining payments",
            )
        return amount_paise

    # Partial payment path
    if amount_from_payload is not None:
        amount_paise = amount_from_payload
    else:
        default_partial = max(int(reservation.total_amount_paise * 0.3), 1_000)
        amount_paise = min(default_partial, remaining_paise)

    if amount_paise >= remaining_paise:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Partial payment must be less than outstanding amount",
        )
    return amount_paise


async def _sync_reservation_payment_state(
    db: AsyncSession,
    reservation_id: UUID,
) -> Reservation:
    reservation = await db.scalar(
        select(Reservation)
        .where(Reservation.id == reservation_id)
        .with_for_update()
    )
    if reservation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reservation not found",
        )

    paid_amount = await db.scalar(
        select(func.coalesce(func.sum(Payment.amount_paise), 0)).where(
            Payment.reservation_id == reservation_id,
            Payment.status == PaymentStatus.COMPLETED,
        )
    )
    paid_amount_paise = int(paid_amount or 0)

    if reservation.total_amount_paise > 0:
        paid_amount_paise = min(paid_amount_paise, reservation.total_amount_paise)

    reservation.paid_amount_paise = paid_amount_paise
    reservation.payment_status = _payment_status_from_amounts(
        reservation.total_amount_paise,
        paid_amount_paise,
    )
    return reservation


async def create_razorpay_order(
    db: AsyncSession,
    user_id: UUID,
    reservation_id: UUID,
    payment_mode: PaymentMode,
    amount_rupees: float | None = None,
) -> Payment:
    """Create a payment order and store a pending payment record."""

    async with db.begin():
        reservation = await db.scalar(
            select(Reservation)
            .where(Reservation.id == reservation_id)
            .with_for_update()
        )
        if reservation is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Reservation not found",
            )
        if reservation.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not own this reservation",
            )
        if reservation.status not in (
            ReservationStatus.PENDING,
            ReservationStatus.CONFIRMED,
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reservation is not in a payable state",
            )
        if reservation.total_amount_paise <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Product price is not configured for payment",
            )

        existing_pending = await db.scalar(
            select(Payment).where(
                Payment.reservation_id == reservation_id,
                Payment.status == PaymentStatus.PENDING,
            )
        )
        if existing_pending is not None:
            return existing_pending

        amount_paise = _resolve_order_amount_paise(
            reservation,
            payment_mode,
            amount_rupees,
        )

        if _is_gateway_configured():
            client = _get_razorpay_client()
            try:
                order_data = client.order.create(
                    data={
                        "amount": amount_paise,
                        "currency": "INR",
                        "receipt": str(reservation_id),
                        "notes": {
                            "reservation_id": str(reservation_id),
                            "user_id": str(user_id),
                            "payment_mode": payment_mode.value,
                        },
                    }
                )
                order_id = order_data["id"]
            except Exception as exc:
                logger.error("Razorpay order creation failed: %s", exc)
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Payment gateway error. Please try again.",
                ) from exc
        else:
            order_id = _build_mock_order_id()

        payment = Payment(
            reservation_id=reservation_id,
            user_id=user_id,
            razorpay_order_id=order_id,
            amount_paise=amount_paise,
            currency="INR",
            status=PaymentStatus.PENDING,
            payment_mode=payment_mode,
        )
        db.add(payment)

    await db.refresh(payment)
    logger.info(
        "Payment order created: payment=%s order=%s amount=%d mode=%s",
        payment.id,
        payment.razorpay_order_id,
        payment.amount_paise,
        payment.payment_mode.value,
    )
    return payment


def _verify_razorpay_signature(
    order_id: str,
    payment_id: str,
    signature: str,
) -> bool:
    """HMAC-SHA256 verification of the Razorpay payment callback."""
    message = f"{order_id}|{payment_id}"
    expected = hmac.new(
        key=settings.razorpay_key_secret.encode(),
        msg=message.encode(),
        digestmod=hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


async def verify_payment(
    db: AsyncSession,
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str,
) -> Payment:
    """Verify payment and update aggregate reservation payment status."""

    payment = await db.scalar(
        select(Payment)
        .where(Payment.razorpay_order_id == razorpay_order_id)
        .with_for_update()
    )
    if payment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment record not found",
        )

    if payment.status == PaymentStatus.COMPLETED:
        await _sync_reservation_payment_state(db, payment.reservation_id)
        await db.commit()
        return payment

    is_mock_order = payment.razorpay_order_id.startswith("order_mock_")
    signature_valid = is_mock_order or _verify_razorpay_signature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
    )

    if not signature_valid:
        payment.status = PaymentStatus.FAILED
        await db.commit()
        logger.warning(
            "Signature verification failed for order %s", razorpay_order_id
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment verification failed — signature mismatch",
        )

    payment.razorpay_payment_id = razorpay_payment_id
    payment.razorpay_signature = razorpay_signature
    payment.status = PaymentStatus.COMPLETED

    await _sync_reservation_payment_state(db, payment.reservation_id)
    await db.commit()
    await db.refresh(payment)

    logger.info(
        "Payment verified: payment=%s razorpay_payment=%s",
        payment.id,
        razorpay_payment_id,
    )
    return payment


async def handle_webhook_event(
    db: AsyncSession,
    payload: dict,
    signature: str,
) -> None:
    """Process incoming Razorpay webhook events.

    Razorpay signs the entire request body. We verify using the webhook
    secret (same as key_secret for standard integrations).
    """
    import json

    body_str = json.dumps(payload, separators=(",", ":"))
    expected = hmac.new(
        key=settings.razorpay_key_secret.encode(),
        msg=body_str.encode(),
        digestmod=hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected, signature):
        logger.warning("Webhook signature mismatch")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid webhook signature",
        )

    event = payload.get("event", "")
    payment_entity = (
        payload.get("payload", {}).get("payment", {}).get("entity", {})
    )
    order_id = payment_entity.get("order_id")

    if not order_id:
        logger.debug("Webhook event %s has no order_id — skipping", event)
        return

    payment = await db.scalar(
        select(Payment).where(Payment.razorpay_order_id == order_id)
    )
    if payment is None:
        logger.debug("No payment record for order %s — skipping", order_id)
        return

    if event == "payment.captured" and payment.status != PaymentStatus.COMPLETED:
        payment.razorpay_payment_id = payment_entity.get("id")
        payment.status = PaymentStatus.COMPLETED
        await _sync_reservation_payment_state(db, payment.reservation_id)
        await db.commit()
        logger.info("Webhook: payment %s marked COMPLETED", payment.id)

    elif event == "payment.failed" and payment.status == PaymentStatus.PENDING:
        payment.status = PaymentStatus.FAILED
        await db.commit()
        logger.info("Webhook: payment %s marked FAILED", payment.id)


async def get_user_payments(
    db: AsyncSession,
    user_id: UUID,
) -> list[Payment]:
    """Return all payments for a given user, newest first."""
    result = await db.scalars(
        select(Payment)
        .where(Payment.user_id == user_id)
        .order_by(Payment.created_at.desc())
    )
    return list(result.all())


# ── Periodic Cleanup Functions ────────────────────────────────────────────────

async def expire_stale_payments(db: AsyncSession) -> int:
    """Expire PENDING payment records older than the configured expiry window.

    Returns the number of payments expired.
    """
    cutoff = datetime.now(timezone.utc) - timedelta(
        minutes=settings.payment_expiry_minutes
    )

    async with db.begin():
        stale_payments = await db.scalars(
            select(Payment)
            .where(
                Payment.status == PaymentStatus.PENDING,
                Payment.created_at < cutoff,
            )
            .with_for_update()
        )

        count = 0
        for payment in stale_payments.all():
            payment.status = PaymentStatus.FAILED
            count += 1
            logger.info(
                "Expired stale payment: payment=%s order=%s (age > %d min)",
                payment.id,
                payment.razorpay_order_id,
                settings.payment_expiry_minutes,
            )

    return count


async def cleanup_failed_payment_inventory(db: AsyncSession) -> int:
    """For reservations that are EXPIRED and had inventory already decremented,
    ensure the inventory is restored. This is a safety net, not normal flow.

    Returns the number of inventory restorations performed.
    """
    # This is handled by expire_reservation_by_id in reservation_service.
    # Keeping as a no-op safety hook for future edge-case handling.
    return 0

import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.payment import Payment
from app.models.user import User, UserRole
from app.models.reservation import Reservation
from app.schemas.payment import (
    PaymentCreateRequest,
    PaymentOrderResponse,
    PaymentOut,
    PaymentVerifyRequest,
)
from app.services.email_service import send_payment_receipt_email
from app.services.payment_service import (
    create_razorpay_order,
    get_user_payments,
    handle_webhook_event,
    verify_payment,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("/create-order", status_code=status.HTTP_201_CREATED)
async def create_payment_order(
    payload: PaymentCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Create a Razorpay order for a reservation. Returns the order details
    needed by the frontend to open the Razorpay checkout modal."""
    payment = await create_razorpay_order(
        db=db,
        user_id=current_user.id,
        reservation_id=payload.reservation_id,
        payment_mode=payload.payment_mode,
        amount_rupees=payload.amount,
    )
    reservation = await db.get(Reservation, payment.reservation_id)
    if reservation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reservation not found",
        )

    outstanding_amount_paise = max(
        reservation.total_amount_paise - reservation.paid_amount_paise,
        0,
    )

    return {
        "success": True,
        "data": {
            "order": PaymentOrderResponse(
                reservation_id=payment.reservation_id,
                razorpay_order_id=payment.razorpay_order_id,
                amount_paise=payment.amount_paise,
                currency=payment.currency,
                key_id=settings.razorpay_key_id or "rzp_mock_key",
                payment_id=payment.id,
                payment_mode=payment.payment_mode,
                reservation_payment_status=reservation.payment_status,
                total_amount_paise=reservation.total_amount_paise,
                paid_amount_paise=reservation.paid_amount_paise,
                outstanding_amount_paise=outstanding_amount_paise,
                is_mock_gateway=payment.razorpay_order_id.startswith("order_mock_"),
            ).model_dump(),
        },
        "message": "Order created",
    }


@router.post("/verify")
async def verify_payment_route(
    payload: PaymentVerifyRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Verify a Razorpay payment using server-side HMAC-SHA256 signature
    comparison. Marks the payment as COMPLETED if valid."""
    existing_payment = await db.scalar(
        select(Payment).where(Payment.razorpay_order_id == payload.razorpay_order_id)
    )
    if existing_payment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment record not found",
        )
    if (
        existing_payment.user_id != current_user.id
        and current_user.role != UserRole.ADMIN
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this payment",
        )

    payment = await verify_payment(
        db=db,
        razorpay_order_id=payload.razorpay_order_id,
        razorpay_payment_id=payload.razorpay_payment_id,
        razorpay_signature=payload.razorpay_signature,
    )
    
    # Send payment receipt asynchronously
    # Fetch reservation store logic
    reservation = await db.scalar(
        select(Reservation)
        .options(selectinload(Reservation.store))
        .where(Reservation.id == payment.reservation_id)
    )
    if reservation:
        background_tasks.add_task(
            send_payment_receipt_email,
            email=current_user.email,
            name=current_user.name,
            amount_rupees=payment.amount_paise / 100,
            payment_id=payment.id,
            store_name=reservation.store.name if hasattr(reservation, "store") and reservation.store else "HoldIt Partner",
        )

    return {
        "success": True,
        "data": {"payment": PaymentOut.model_validate(payment).model_dump()},
        "message": "Payment verified",
    }


@router.post("/webhook")
async def razorpay_webhook(request: Request, db: AsyncSession = Depends(get_db)) -> dict:
    """Webhook endpoint for Razorpay to push payment status updates.
    No JWT auth — security via HMAC signature in X-Razorpay-Signature header."""
    signature = request.headers.get("X-Razorpay-Signature", "")
    if not signature:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing signature header",
        )

    try:
        payload = await request.json()
    except Exception as exc:
        logger.error("Webhook body parse error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid request body",
        ) from exc

    await handle_webhook_event(db=db, payload=payload, signature=signature)
    return {"success": True, "data": None, "message": "Webhook processed"}


@router.get("/me")
async def list_user_payments(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """List all payments for the authenticated user."""
    payments = await get_user_payments(db, current_user.id)
    return {
        "success": True,
        "data": {
            "payments": [
                PaymentOut.model_validate(p).model_dump() for p in payments
            ]
        },
        "message": "",
    }

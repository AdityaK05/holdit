from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import case, cast, extract, func, select, Float
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.inventory import StoreInventory
from app.models.product import Product
from app.models.reservation import (
    Reservation,
    ReservationPaymentStatus,
    ReservationStatus,
)


def _dashboard_query():
    return select(Reservation).options(
        selectinload(Reservation.user),
        selectinload(Reservation.product),
        selectinload(Reservation.store),
    )


async def get_store_reservations(
    db: AsyncSession,
    store_id: UUID,
    status_filter: str | None = None,
) -> list[Reservation]:
    statement = _dashboard_query().where(Reservation.store_id == store_id)

    if status_filter is not None:
        statement = statement.where(Reservation.status == ReservationStatus(status_filter))
    else:
        statement = statement.where(
            Reservation.status.in_([ReservationStatus.PENDING, ReservationStatus.CONFIRMED])
        )

    result = await db.scalars(statement.order_by(Reservation.created_at.desc()))
    return list(result.all())


async def confirm_reservation(
    db: AsyncSession,
    reservation_id: UUID,
    store_id: UUID,
) -> Reservation:
    async with db.begin():
        reservation = await db.scalar(
            select(Reservation)
            .where(Reservation.id == reservation_id, Reservation.store_id == store_id)
            .with_for_update()
        )
        if reservation is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Reservation not found",
            )
        if reservation.status != ReservationStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Not in pending state",
            )

        reservation.status = ReservationStatus.CONFIRMED
        reservation.confirmed_at = datetime.now(timezone.utc)

    updated = await db.scalar(_dashboard_query().where(Reservation.id == reservation_id))
    if updated is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reservation not found",
        )
    return updated


async def reject_reservation(
    db: AsyncSession,
    reservation_id: UUID,
    store_id: UUID,
) -> Reservation:
    async with db.begin():
        reservation = await db.scalar(
            select(Reservation)
            .where(Reservation.id == reservation_id, Reservation.store_id == store_id)
            .with_for_update()
        )
        if reservation is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Reservation not found",
            )
        if reservation.status != ReservationStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Not in pending state",
            )

        inventory = await db.scalar(
            select(StoreInventory)
            .where(
                StoreInventory.store_id == reservation.store_id,
                StoreInventory.product_id == reservation.product_id,
            )
            .with_for_update()
        )
        if inventory is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Inventory not found",
            )

        reservation.status = ReservationStatus.REJECTED
        inventory.available_qty += 1

    updated = await db.scalar(_dashboard_query().where(Reservation.id == reservation_id))
    if updated is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reservation not found",
        )
    return updated


async def complete_pickup(
    db: AsyncSession,
    reservation_id: UUID,
    store_id: UUID,
    otp_input: str,
) -> Reservation:
    async with db.begin():
        reservation = await db.scalar(
            select(Reservation)
            .where(Reservation.id == reservation_id, Reservation.store_id == store_id)
            .with_for_update()
        )
        if reservation is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Reservation not found",
            )
        if reservation.status != ReservationStatus.CONFIRMED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Not confirmed yet",
            )
        if (
            reservation.total_amount_paise > 0
            and reservation.payment_status != ReservationPaymentStatus.FULLY_PAID
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Remaining payment pending",
            )
        if otp_input != reservation.otp:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid OTP",
            )

        inventory = await db.scalar(
            select(StoreInventory)
            .where(
                StoreInventory.store_id == reservation.store_id,
                StoreInventory.product_id == reservation.product_id,
            )
            .with_for_update()
        )
        if inventory is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Inventory not found",
            )
        if inventory.total_qty <= 0:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Inventory is inconsistent",
            )

        reservation.status = ReservationStatus.COMPLETED
        reservation.completed_at = datetime.now(timezone.utc)
        inventory.total_qty -= 1

    updated = await db.scalar(_dashboard_query().where(Reservation.id == reservation_id))
    if updated is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reservation not found",
        )
    return updated


# ── Store Analytics ───────────────────────────────────────────────────────────

async def get_store_analytics(
    db: AsyncSession,
    store_id: UUID,
) -> dict:
    """Return real-time KPIs for a store manager dashboard."""
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # Today's reservations count
    today_reservations = await db.scalar(
        select(func.count(Reservation.id)).where(
            Reservation.store_id == store_id,
            Reservation.created_at >= today_start,
        )
    ) or 0

    # Pending pickups (confirmed but not yet completed)
    pending_pickups = await db.scalar(
        select(func.count(Reservation.id)).where(
            Reservation.store_id == store_id,
            Reservation.status == ReservationStatus.CONFIRMED,
        )
    ) or 0

    # Completed today
    completed_today = await db.scalar(
        select(func.count(Reservation.id)).where(
            Reservation.store_id == store_id,
            Reservation.status == ReservationStatus.COMPLETED,
            Reservation.completed_at >= today_start,
        )
    ) or 0

    # Average pickup time (confirmed_at → completed_at) in minutes for
    # completed reservations, last 30 days
    thirty_days_ago = now - timedelta(days=30)
    avg_pickup_result = await db.scalar(
        select(
            func.avg(
                extract(
                    "epoch",
                    Reservation.completed_at - Reservation.confirmed_at,
                )
            )
        ).where(
            Reservation.store_id == store_id,
            Reservation.status == ReservationStatus.COMPLETED,
            Reservation.completed_at.isnot(None),
            Reservation.confirmed_at.isnot(None),
            Reservation.completed_at >= thirty_days_ago,
        )
    )
    avg_pickup_minutes = round(float(avg_pickup_result or 0) / 60, 1)

    # Weekly trend: reservation counts per day for the last 7 days
    weekly_trend: list[int] = []
    for days_back in range(6, -1, -1):
        day_start = (now - timedelta(days=days_back)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        day_end = day_start + timedelta(days=1)
        day_count = await db.scalar(
            select(func.count(Reservation.id)).where(
                Reservation.store_id == store_id,
                Reservation.created_at >= day_start,
                Reservation.created_at < day_end,
            )
        ) or 0
        weekly_trend.append(int(day_count))

    # Top products: most reserved products in the last 30 days
    top_products_result = await db.execute(
        select(
            Product.name,
            func.count(Reservation.id).label("count"),
        )
        .join(Product, Product.id == Reservation.product_id)
        .where(
            Reservation.store_id == store_id,
            Reservation.created_at >= thirty_days_ago,
        )
        .group_by(Product.name)
        .order_by(func.count(Reservation.id).desc())
        .limit(5)
    )
    top_products = [
        {"name": name, "count": int(count)}
        for name, count in top_products_result.all()
    ]

    # Revenue today (completed payments)
    from app.models.payment import Payment, PaymentStatus

    revenue_today = await db.scalar(
        select(func.coalesce(func.sum(Payment.amount_paise), 0)).where(
            Payment.status == PaymentStatus.COMPLETED,
            Payment.created_at >= today_start,
        )
        .join(Reservation, Reservation.id == Payment.reservation_id)
        .where(Reservation.store_id == store_id)
    ) or 0

    return {
        "todayReservations": int(today_reservations),
        "pendingPickups": int(pending_pickups),
        "completedToday": int(completed_today),
        "avgPickupMinutes": avg_pickup_minutes,
        "weeklyTrend": weekly_trend,
        "topProducts": top_products,
        "revenueTodayPaise": int(revenue_today),
    }

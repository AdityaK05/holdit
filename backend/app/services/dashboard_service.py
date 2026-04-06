from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.inventory import StoreInventory
from app.models.reservation import Reservation, ReservationStatus


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

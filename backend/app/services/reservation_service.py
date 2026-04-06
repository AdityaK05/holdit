from datetime import datetime, timedelta, timezone
from secrets import randbelow
from uuid import UUID

from fastapi import HTTPException, status
from redis.asyncio import Redis
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.redis_client import acquire_lock, release_lock
from app.models.inventory import StoreInventory
from app.models.reservation import Reservation, ReservationStatus


def _reservation_with_relations_query() -> select:
    return select(Reservation).options(
        selectinload(Reservation.store),
        selectinload(Reservation.product),
    )


def _generate_otp() -> str:
    return f"{randbelow(1_000_000):06d}"


async def create_reservation(
    db: AsyncSession,
    redis: Redis,
    user_id: UUID,
    store_id: UUID,
    product_id: UUID,
) -> Reservation:
    inventory_statement = select(StoreInventory.available_qty).where(
        StoreInventory.store_id == store_id,
        StoreInventory.product_id == product_id,
    )
    available_qty = await db.scalar(inventory_statement)
    if available_qty is None or available_qty <= 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Item unavailable",
        )

    await db.rollback()

    lock_key = f"lock:store:{store_id}:product:{product_id}"
    lock_token = await acquire_lock(redis, lock_key, ttl=5)
    if lock_token is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Item currently being reserved, try again",
        )

    reservation_id: UUID | None = None
    try:
        async with db.begin():
            inventory = await db.scalar(
                select(StoreInventory)
                .where(
                    StoreInventory.store_id == store_id,
                    StoreInventory.product_id == product_id,
                )
                .with_for_update()
            )
            if inventory is None or inventory.available_qty <= 0:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Item unavailable",
                )

            inventory.available_qty -= 1

            reservation = Reservation(
                user_id=user_id,
                store_id=store_id,
                product_id=product_id,
                status=ReservationStatus.PENDING,
                otp=_generate_otp(),
                expires_at=datetime.now(timezone.utc) + timedelta(minutes=10),
            )
            db.add(reservation)
            await db.flush()
            reservation_id = reservation.id
    finally:
        await release_lock(redis, lock_key, lock_token)

    if reservation_id is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create reservation",
        )

    reservation = await db.scalar(
        _reservation_with_relations_query().where(Reservation.id == reservation_id)
    )
    if reservation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reservation not found",
        )
    return reservation


async def get_reservation(
    db: AsyncSession,
    reservation_id: UUID,
    user_id: UUID,
) -> Reservation | None:
    reservation = await db.scalar(
        _reservation_with_relations_query().where(Reservation.id == reservation_id)
    )
    if reservation is None:
        return None
    if reservation.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this reservation",
        )
    return reservation


async def get_user_reservations(db: AsyncSession, user_id: UUID) -> list[Reservation]:
    result = await db.scalars(
        _reservation_with_relations_query()
        .where(Reservation.user_id == user_id)
        .order_by(Reservation.created_at.desc())
    )
    return list(result.all())


async def cancel_reservation(
    db: AsyncSession,
    redis: Redis,
    reservation_id: UUID,
    user_id: UUID,
) -> Reservation:
    existing_reservation = await db.scalar(
        select(Reservation).where(Reservation.id == reservation_id)
    )
    if existing_reservation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reservation not found",
        )
    if existing_reservation.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this reservation",
        )

    await db.rollback()

    lock_key = (
        f"lock:store:{existing_reservation.store_id}:product:{existing_reservation.product_id}"
    )
    lock_token = await acquire_lock(redis, lock_key, ttl=5)
    if lock_token is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Item currently being reserved, try again",
        )

    try:
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
                    detail="You do not have access to this reservation",
                )
            if reservation.status != ReservationStatus.PENDING:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Only pending reservations can be cancelled",
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

            reservation.status = ReservationStatus.EXPIRED
            inventory.available_qty += 1
    finally:
        await release_lock(redis, lock_key, lock_token)

    updated_reservation = await db.scalar(
        _reservation_with_relations_query().where(Reservation.id == reservation_id)
    )
    if updated_reservation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reservation not found",
        )
    return updated_reservation


async def expire_reservation_by_id(db: AsyncSession, reservation_id: UUID) -> None:
    async with db.begin():
        reservation = await db.scalar(
            select(Reservation)
            .where(Reservation.id == reservation_id)
            .with_for_update()
        )
        if reservation is None or reservation.status != ReservationStatus.PENDING:
            return

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

        reservation.status = ReservationStatus.EXPIRED
        inventory.available_qty += 1

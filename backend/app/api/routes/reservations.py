from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
import asyncio
from app.core.database import get_db, AsyncSessionLocal
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.reservation import ReservationCreate, ReservationOut
from app.services.email_service import send_reservation_otp_email
from app.services.reservation_service import (
    cancel_reservation,
    create_reservation,
    get_reservation,
    get_user_reservations,
    expire_reservation_by_id,
)

async def scheduled_expire_reservation(reservation_id: UUID) -> None:
    await asyncio.sleep(600)  # Wait 10 minutes
    async with AsyncSessionLocal() as db:
        await expire_reservation_by_id(db, reservation_id)

router = APIRouter(prefix="/reservations", tags=["reservations"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_reservation_route(
    payload: ReservationCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    reservation = await create_reservation(
        db=db,
        user_id=current_user.id,
        store_id=payload.store_id,
        product_id=payload.product_id,
    )
    
    background_tasks.add_task(scheduled_expire_reservation, reservation.id)
    
    # Send email asynchronously through FastAPI
    background_tasks.add_task(
        send_reservation_otp_email,
        email=current_user.email or "",
        name=current_user.name,
        otp=reservation.otp,
        store_name=reservation.store.name if hasattr(reservation, "store") and reservation.store else "HoldIt Partner",
    )

    return {
        "success": True,
        "data": {"reservation": ReservationOut.model_validate(reservation).model_dump()},
        "message": "Reserved successfully",
    }


@router.get("/me")
async def list_user_reservations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    reservations = await get_user_reservations(db, current_user.id)
    return {
        "success": True,
        "data": {
            "reservations": [
                ReservationOut.model_validate(reservation).model_dump()
                for reservation in reservations
            ]
        },
        "message": "",
    }


@router.get("/{reservation_id}")
async def get_reservation_route(
    reservation_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    reservation = await get_reservation(db, reservation_id, current_user.id)
    if reservation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reservation not found",
        )

    return {
        "success": True,
        "data": {"reservation": ReservationOut.model_validate(reservation).model_dump()},
        "message": "",
    }


@router.delete("/{reservation_id}")
async def cancel_reservation_route(
    reservation_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    reservation = await cancel_reservation(
        db=db,
        reservation_id=reservation_id,
        user_id=current_user.id,
    )
    return {
        "success": True,
        "data": {"reservation": ReservationOut.model_validate(reservation).model_dump()},
        "message": "Cancelled",
    }

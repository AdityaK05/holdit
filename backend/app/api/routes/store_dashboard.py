from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_role
from app.models.reservation import ReservationStatus
from app.models.user import User
from app.schemas.dashboard import (
    CompletePickupRequest,
    ConfirmReservationRequest,
    DashboardReservationOut,
    RejectReservationRequest,
)
from app.services.dashboard_service import (
    complete_pickup,
    confirm_reservation,
    get_store_analytics,
    get_store_reservations,
    reject_reservation,
)
from app.workers.tasks import notify_customer_confirmed, notify_customer_rejected

router = APIRouter(prefix="/dashboard", tags=["store-dashboard"])
ALLOWED_STATUS_FILTERS = {
    ReservationStatus.PENDING.value,
    ReservationStatus.CONFIRMED.value,
    ReservationStatus.COMPLETED.value,
    ReservationStatus.REJECTED.value,
}


def _require_staff_store(current_user: User) -> UUID:
    if current_user.store_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Store staff is not assigned to a store",
        )
    return current_user.store_id


@router.get("/reservations")
async def list_store_reservations(
    status_filter: str | None = Query(None, alias="status"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("store_staff")),
) -> dict:
    store_id = _require_staff_store(current_user)
    if status_filter is not None:
        if status_filter not in ALLOWED_STATUS_FILTERS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid reservation status",
            )

    reservations = await get_store_reservations(db, store_id, status_filter)
    return {
        "success": True,
        "data": {
            "reservations": [
                DashboardReservationOut.model_validate(reservation).model_dump()
                for reservation in reservations
            ]
        },
        "message": "",
    }


@router.post("/reservations/{reservation_id}/confirm")
async def confirm_store_reservation(
    reservation_id: UUID,
    _: ConfirmReservationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("store_staff")),
) -> dict:
    store_id = _require_staff_store(current_user)
    reservation = await confirm_reservation(db, reservation_id, store_id)
    notify_customer_confirmed.delay(str(reservation.id))
    return {
        "success": True,
        "data": {"reservation": DashboardReservationOut.model_validate(reservation).model_dump()},
        "message": "Confirmed",
    }


@router.post("/reservations/{reservation_id}/reject")
async def reject_store_reservation(
    reservation_id: UUID,
    _: RejectReservationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("store_staff")),
) -> dict:
    store_id = _require_staff_store(current_user)
    reservation = await reject_reservation(db, reservation_id, store_id)
    notify_customer_rejected.delay(str(reservation.id))
    return {
        "success": True,
        "data": {"reservation": DashboardReservationOut.model_validate(reservation).model_dump()},
        "message": "Rejected",
    }


@router.post("/reservations/{reservation_id}/complete")
async def complete_store_pickup(
    reservation_id: UUID,
    payload: CompletePickupRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("store_staff")),
) -> dict:
    store_id = _require_staff_store(current_user)
    reservation = await complete_pickup(db, reservation_id, store_id, payload.otp)
    return {
        "success": True,
        "data": {"reservation": DashboardReservationOut.model_validate(reservation).model_dump()},
        "message": "Pickup complete",
    }


@router.get("/analytics")
async def store_analytics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("store_staff")),
) -> dict:
    """Real-time KPIs for the store manager dashboard."""
    store_id = _require_staff_store(current_user)
    analytics = await get_store_analytics(db, store_id)
    return {
        "success": True,
        "data": {"analytics": analytics},
        "message": "",
    }


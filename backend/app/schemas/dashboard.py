from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.reservation import ReservationStatus


class DashboardReservationUserOut(BaseModel):
    id: UUID
    name: str
    phone: str

    model_config = ConfigDict(from_attributes=True)


class DashboardReservationProductOut(BaseModel):
    id: UUID
    name: str
    category: str
    image_url: str | None

    model_config = ConfigDict(from_attributes=True)


class DashboardReservationStoreOut(BaseModel):
    id: UUID
    name: str

    model_config = ConfigDict(from_attributes=True)


class DashboardReservationOut(BaseModel):
    id: UUID
    status: ReservationStatus
    otp: str
    expires_at: datetime
    confirmed_at: datetime | None
    completed_at: datetime | None = None
    created_at: datetime
    user: DashboardReservationUserOut
    product: DashboardReservationProductOut
    store: DashboardReservationStoreOut

    model_config = ConfigDict(from_attributes=True)


class ConfirmReservationRequest(BaseModel):
    pass


class RejectReservationRequest(BaseModel):
    pass


class CompletePickupRequest(BaseModel):
    otp: str = Field(..., min_length=6, max_length=6, pattern=r"^\d{6}$")

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.reservation import ReservationStatus
from app.schemas.product import ProductOut
from app.schemas.store import StoreOut


class ReservationCreate(BaseModel):
    product_id: UUID
    store_id: UUID


class ReservationOut(BaseModel):
    id: UUID
    user_id: UUID
    store_id: UUID
    product_id: UUID
    status: ReservationStatus
    otp: str
    expires_at: datetime
    confirmed_at: datetime | None
    completed_at: datetime | None
    created_at: datetime
    store: StoreOut
    product: ProductOut

    model_config = ConfigDict(from_attributes=True)


class CompletePickup(BaseModel):
    otp: str = Field(..., min_length=6, max_length=6, pattern=r"^\d{6}$")

from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class StoreOut(BaseModel):
    id: UUID
    name: str
    address: str
    lat: Decimal
    lng: Decimal
    phone: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class StoreWithDistance(StoreOut):
    distance_km: float
    available_qty: int

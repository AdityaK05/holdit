from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator


class InventoryOut(BaseModel):
    id: UUID
    store_id: UUID
    product_id: UUID
    total_qty: int
    available_qty: int
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class InventoryUpdate(BaseModel):
    store_id: UUID
    product_id: UUID
    total_qty: int = Field(..., ge=0)
    available_qty: int = Field(..., ge=0)

    @model_validator(mode="after")
    def validate_available_quantity(self) -> "InventoryUpdate":
        if self.available_qty > self.total_qty:
            raise ValueError("available_qty cannot be greater than total_qty")
        return self

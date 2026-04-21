from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.schemas.product import ProductOut


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


class InventoryItemOut(BaseModel):
    id: UUID
    store_id: UUID
    total_qty: int
    available_qty: int
    updated_at: datetime
    product: ProductOut

    model_config = ConfigDict(from_attributes=True)


class InventoryScanRequest(BaseModel):
    barcode: str = Field(..., min_length=3, max_length=64)
    quantity: int = Field(default=1, ge=1, le=500)
    name: str | None = Field(default=None, min_length=1, max_length=200)
    category: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = None
    image_url: str | None = None
    price_paise: int | None = Field(default=None, ge=0)

    @model_validator(mode="after")
    def normalize_barcode(self) -> "InventoryScanRequest":
        self.barcode = self.barcode.strip()
        if not self.barcode:
            raise ValueError("barcode is required")
        return self

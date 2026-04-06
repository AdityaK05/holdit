from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ProductOut(BaseModel):
    id: UUID
    name: str
    description: str | None
    category: str
    image_url: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

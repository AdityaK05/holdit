from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, CreatedAtMixin, UUIDPrimaryKeyMixin


class Product(UUIDPrimaryKeyMixin, CreatedAtMixin, Base):
    __tablename__ = "products"

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    image_url: Mapped[str | None] = mapped_column(String, nullable=True)

    inventories: Mapped[list["StoreInventory"]] = relationship(
        "StoreInventory",
        back_populates="product",
        cascade="all, delete-orphan",
    )
    reservations: Mapped[list["Reservation"]] = relationship(
        "Reservation",
        back_populates="product",
    )

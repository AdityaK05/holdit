import uuid

from sqlalchemy import CheckConstraint, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDPrimaryKeyMixin, UpdatedAtMixin


class StoreInventory(UUIDPrimaryKeyMixin, UpdatedAtMixin, Base):
    __tablename__ = "store_inventory"
    __table_args__ = (
        UniqueConstraint("store_id", "product_id", name="uq_store_inventory_store_product"),
        CheckConstraint("total_qty >= 0", name="ck_store_inventory_total_qty_non_negative"),
        CheckConstraint("available_qty >= 0", name="ck_store_inventory_available_qty_non_negative"),
    )

    store_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("stores.id", ondelete="CASCADE"),
        nullable=False,
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
    )
    total_qty: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )
    available_qty: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )

    store: Mapped["Store"] = relationship("Store", back_populates="inventories")
    product: Mapped["Product"] = relationship("Product", back_populates="inventories")

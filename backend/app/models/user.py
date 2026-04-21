import enum
import uuid

from sqlalchemy import Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, CreatedAtMixin, UUIDPrimaryKeyMixin


class UserRole(str, enum.Enum):
    CUSTOMER = "customer"
    STORE_STAFF = "store_staff"
    ADMIN = "admin"


class AuthProvider(str, enum.Enum):
    EMAIL = "email"
    PHONE = "phone"
    GOOGLE = "google"


class User(UUIDPrimaryKeyMixin, CreatedAtMixin, Base):
    __tablename__ = "users"

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20), unique=True, nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    password_hash: Mapped[str | None] = mapped_column(String, nullable=True)
    auth_provider: Mapped[AuthProvider] = mapped_column(
        Enum(
            AuthProvider,
            name="auth_provider",
            values_callable=lambda enum_type: [member.value for member in enum_type],
            validate_strings=True,
        ),
        nullable=False,
        default=AuthProvider.EMAIL,
        server_default=AuthProvider.EMAIL.value,
    )
    role: Mapped[UserRole] = mapped_column(
        Enum(
            UserRole,
            name="user_role",
            values_callable=lambda enum_type: [member.value for member in enum_type],
            validate_strings=True,
        ),
        nullable=False,
        default=UserRole.CUSTOMER,
        server_default=UserRole.CUSTOMER.value,
    )
    fcm_token: Mapped[str | None] = mapped_column(String, nullable=True)
    store_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("stores.id"),
        nullable=True,
    )

    reservations: Mapped[list["Reservation"]] = relationship(
        "Reservation",
        back_populates="user",
    )
    payments: Mapped[list["Payment"]] = relationship(
        "Payment",
        back_populates="user",
    )
    store: Mapped["Store | None"] = relationship("Store", back_populates="staff_users")

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.user import User, UserRole
from app.schemas.auth import LoginRequest, RefreshRequest, TokenResponse, RegisterRequest
from app.schemas.user import UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


def _build_token_response(user: User) -> TokenResponse:
    token_payload = {"sub": str(user.id), "role": user.role.value, "type": "access"}
    refresh_payload = {"sub": str(user.id), "role": user.role.value, "type": "refresh"}
    return TokenResponse(
        access_token=create_access_token(token_payload),
        refresh_token=create_refresh_token(refresh_payload),
    )


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(
    payload: RegisterRequest,
    db: AsyncSession = Depends(get_db),
) -> dict:
    normalized_email = payload.email.strip().lower()
    normalized_phone = payload.phone.strip()
    normalized_name = payload.name.strip()

    duplicate_query = select(User).where(
        or_(func.lower(User.email) == normalized_email, User.phone == normalized_phone)
    )
    duplicate_user = await db.scalar(duplicate_query)
    if duplicate_user is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email or phone already registered",
        )

    user = User(
        name=normalized_name,
        phone=normalized_phone,
        email=normalized_email,
        password_hash=hash_password(payload.password),
        role=UserRole.CUSTOMER,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return {
        "success": True,
        "data": {
            "tokens": _build_token_response(user).model_dump(),
            "user": UserOut.model_validate(user).model_dump(),
        },
        "message": "Registered",
    }


@router.post("/login")
async def login(
    payload: LoginRequest,
    db: AsyncSession = Depends(get_db),
) -> dict:
    normalized_email = payload.email.strip().lower()
    user = await db.scalar(select(User).where(func.lower(User.email) == normalized_email))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    return {
        "success": True,
        "data": {
            "tokens": _build_token_response(user).model_dump(),
            "user": UserOut.model_validate(user).model_dump(),
        },
        "message": "Login successful",
    }


@router.post("/refresh")
async def refresh_token(
    payload: RefreshRequest,
    db: AsyncSession = Depends(get_db),
) -> dict:
    token_data = decode_token(payload.refresh_token)
    if token_data.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
        )

    try:
        user_id = UUID(token_data["sub"])
    except (KeyError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        ) from exc

    user = await db.get(User, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    access_token = create_access_token(
        {"sub": str(user.id), "role": user.role.value, "type": "access"}
    )
    return {
        "success": True,
        "data": {"access_token": access_token},
        "message": "",
    }

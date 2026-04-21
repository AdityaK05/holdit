from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.core.database import get_db
from app.core.dependencies import require_role
from app.models.user import User
from app.schemas.inventory import (
    InventoryItemOut,
    InventoryOut,
    InventoryScanRequest,
    InventoryUpdate,
)
from app.services.inventory_service import (
    get_inventory,
    list_store_inventory_items,
    scan_and_upsert_inventory,
    update_inventory,
)

router = APIRouter(prefix="/inventory", tags=["inventory"])


def _require_staff_store(current_user: User) -> UUID:
    if current_user.store_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Store staff is not assigned to a store",
        )
    return current_user.store_id


@router.get("")
async def read_inventory(
    store_id: UUID = Query(...),
    product_id: UUID = Query(...),
    db: AsyncSession = Depends(get_db),
) -> dict:
    inventory = await get_inventory(db, store_id, product_id)
    if inventory is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory not found",
        )

    return {
        "success": True,
        "data": {"inventory": inventory.model_dump()},
        "message": "",
    }


@router.put("")
async def put_inventory(
    payload: InventoryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("admin")),
) -> dict:
    inventory = await update_inventory(
        db=db,
        store_id=payload.store_id,
        product_id=payload.product_id,
        total_qty=payload.total_qty,
        available_qty=payload.available_qty,
    )
    return {
        "success": True,
        "data": {"inventory": inventory.model_dump()},
        "message": "Updated",
    }


@router.get("/store-items")
async def list_assigned_store_inventory(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("store_staff")),
) -> dict:
    store_id = _require_staff_store(current_user)
    items = await list_store_inventory_items(db, store_id)
    return {
        "success": True,
        "data": {
            "items": [item.model_dump() for item in items],
        },
        "message": "",
    }


@router.post("/scan")
async def scan_inventory_barcode(
    payload: InventoryScanRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("store_staff")),
) -> dict:
    store_id = _require_staff_store(current_user)
    item = await scan_and_upsert_inventory(db, store_id, payload)
    return {
        "success": True,
        "data": {"item": item.model_dump()},
        "message": "Inventory updated from scan",
    }

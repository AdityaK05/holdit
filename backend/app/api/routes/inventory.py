from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.core.database import get_db
from app.core.dependencies import require_role
from app.schemas.inventory import InventoryOut, InventoryUpdate
from app.services.inventory_service import get_inventory, update_inventory

router = APIRouter(prefix="/inventory", tags=["inventory"])


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

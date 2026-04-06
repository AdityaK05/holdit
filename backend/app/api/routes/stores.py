from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.store import Store
from app.schemas.store import StoreOut
from app.services.inventory_service import get_nearby_stores

router = APIRouter(prefix="/stores", tags=["stores"])


@router.get("/nearby")
async def nearby_stores(
    lat: float = Query(..., ge=-90, le=90),
    lng: float = Query(..., ge=-180, le=180),
    product_id: UUID = Query(...),
    db: AsyncSession = Depends(get_db),
) -> dict:
    stores = await get_nearby_stores(db, lat=lat, lng=lng, product_id=product_id)
    return {
        "success": True,
        "data": {"stores": [store.model_dump() for store in stores]},
        "message": "",
    }


@router.get("/{store_id}")
async def get_store(store_id: UUID, db: AsyncSession = Depends(get_db)) -> dict:
    store = await db.get(Store, store_id)
    if store is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Store not found",
        )

    return {
        "success": True,
        "data": {"store": StoreOut.model_validate(store).model_dump()},
        "message": "",
    }

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.product import ProductOut
from app.services.inventory_service import get_product_by_id, search_products

router = APIRouter(prefix="/products", tags=["products"])


@router.get("")
async def list_products(
    q: str = Query(..., min_length=2),
    db: AsyncSession = Depends(get_db),
) -> dict:
    products = await search_products(db, q)
    return {
        "success": True,
        "data": {"products": [ProductOut.model_validate(product).model_dump() for product in products]},
        "message": "",
    }


@router.get("/{product_id}")
async def get_product(product_id: UUID, db: AsyncSession = Depends(get_db)) -> dict:
    product = await get_product_by_id(db, product_id)
    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    return {
        "success": True,
        "data": {"product": ProductOut.model_validate(product).model_dump()},
        "message": "",
    }

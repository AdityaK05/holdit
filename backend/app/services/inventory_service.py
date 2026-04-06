from uuid import UUID

from fastapi import HTTPException, status
from geoalchemy2 import Geography
from sqlalchemy import String, cast, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.inventory import StoreInventory
from app.models.product import Product
from app.models.store import Store
from app.schemas.inventory import InventoryOut
from app.schemas.store import StoreWithDistance


async def get_product_by_id(db: AsyncSession, product_id: UUID) -> Product | None:
    return await db.get(Product, product_id)


async def search_products(db: AsyncSession, query: str) -> list[Product]:
    search_term = f"%{query.strip()}%"
    statement = (
        select(Product)
        .where(
            or_(
                Product.name.ilike(search_term),
                Product.category.ilike(search_term),
                cast(Product.description, String).ilike(search_term),
            )
        )
        .order_by(Product.created_at.desc())
    )
    result = await db.scalars(statement)
    return list(result.all())


async def get_nearby_stores(
    db: AsyncSession,
    lat: float,
    lng: float,
    product_id: UUID,
    radius_km: float = 10,
) -> list[StoreWithDistance]:
    user_point = func.ST_SetSRID(func.ST_MakePoint(lng, lat), 4326)
    store_geography = cast(Store.location, Geography)
    user_geography = cast(user_point, Geography)
    distance_meters = func.ST_Distance(store_geography, user_geography)

    statement = (
        select(
            Store,
            distance_meters.label("distance_meters"),
            StoreInventory.available_qty.label("available_qty"),
        )
        .join(StoreInventory, StoreInventory.store_id == Store.id)
        .where(
            StoreInventory.product_id == product_id,
            StoreInventory.available_qty > 0,
            Store.is_active.is_(True),
            func.ST_DWithin(store_geography, user_geography, radius_km * 1000),
        )
        .order_by(distance_meters.asc())
    )

    result = await db.execute(statement)
    stores: list[StoreWithDistance] = []
    for store, distance_raw, available_qty in result.all():
        stores.append(
            StoreWithDistance(
                id=store.id,
                name=store.name,
                address=store.address,
                lat=store.lat,
                lng=store.lng,
                phone=store.phone,
                is_active=store.is_active,
                distance_km=round(float(distance_raw) / 1000, 2),
                available_qty=available_qty,
            )
        )
    return stores


async def get_inventory(
    db: AsyncSession,
    store_id: UUID,
    product_id: UUID,
) -> InventoryOut | None:
    statement = select(StoreInventory).where(
        StoreInventory.store_id == store_id,
        StoreInventory.product_id == product_id,
    )
    inventory = await db.scalar(statement)
    if inventory is None:
        return None
    return InventoryOut.model_validate(inventory)


async def update_inventory(
    db: AsyncSession,
    store_id: UUID,
    product_id: UUID,
    total_qty: int,
    available_qty: int,
) -> InventoryOut:
    if available_qty > total_qty:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="available_qty cannot be greater than total_qty",
        )

    async with db.begin():
        store = await db.get(Store, store_id)
        if store is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Store not found",
            )

        product = await db.get(Product, product_id)
        if product is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found",
            )

        statement = select(StoreInventory).where(
            StoreInventory.store_id == store_id,
            StoreInventory.product_id == product_id,
        )
        inventory = await db.scalar(statement)

        if inventory is None:
            inventory = StoreInventory(
                store_id=store_id,
                product_id=product_id,
                total_qty=total_qty,
                available_qty=available_qty,
            )
            db.add(inventory)
        else:
            inventory.total_qty = total_qty
            inventory.available_qty = available_qty

    await db.refresh(inventory)
    return InventoryOut.model_validate(inventory)

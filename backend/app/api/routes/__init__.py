from fastapi import APIRouter
from app.api.routes.auth import router as auth_router
from app.api.routes.inventory import router as inventory_router
from app.api.routes.products import router as products_router
from app.api.routes.reservations import router as reservations_router
from app.api.routes.store_dashboard import router as store_dashboard_router
from app.api.routes.stores import router as stores_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(products_router)
api_router.include_router(stores_router)
api_router.include_router(inventory_router)
api_router.include_router(reservations_router)
api_router.include_router(store_dashboard_router)

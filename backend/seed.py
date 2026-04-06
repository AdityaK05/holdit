import random
from decimal import Decimal

from geoalchemy2.elements import WKTElement
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings
from app.core.security import hash_password
from app.models.inventory import StoreInventory
from app.models.product import Product
from app.models.store import Store
from app.models.user import User, UserRole


def build_sync_database_url(database_url: str) -> str:
    if database_url.startswith("postgresql+asyncpg://"):
        return database_url.replace("postgresql+asyncpg://", "postgresql+psycopg2://", 1)
    if database_url.startswith("postgresql://"):
        return database_url.replace("postgresql://", "postgresql+psycopg2://", 1)
    return database_url


engine = create_engine(build_sync_database_url(settings.postgres_url), future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


USER_SEEDS = [
    {
        "name": "Admin User",
        "email": "admin@holdit.com",
        "phone": "+919876500000",
        "password": "admin123",
        "role": UserRole.ADMIN,
    },
    {
        "name": "Staff Rajesh",
        "email": "staff1@holdit.com",
        "phone": "+919876500001",
        "password": "staff123",
        "role": UserRole.STORE_STAFF,
    },
    {
        "name": "Staff Priya",
        "email": "staff2@holdit.com",
        "phone": "+919876500002",
        "password": "staff123",
        "role": UserRole.STORE_STAFF,
    },
    {
        "name": "Arjun Kumar",
        "email": "arjun@test.com",
        "phone": "+919876500003",
        "password": "test123",
        "role": UserRole.CUSTOMER,
    },
    {
        "name": "Sneha Rao",
        "email": "sneha@test.com",
        "phone": "+919876500004",
        "password": "test123",
        "role": UserRole.CUSTOMER,
    },
]

STORE_SEEDS = [
    {
        "name": "TechHub Electronics - Mysuru",
        "address": "Sayyaji Rao Road, Mysuru, Karnataka 570001",
        "lat": Decimal("12.3052"),
        "lng": Decimal("76.6553"),
        "phone": "+918212345001",
        "staff_email": "staff1@holdit.com",
    },
    {
        "name": "Digital World - VV Mohalla",
        "address": "VV Mohalla, Mysuru, Karnataka 570002",
        "lat": Decimal("12.2958"),
        "lng": Decimal("76.6394"),
        "phone": "+918212345002",
        "staff_email": "staff2@holdit.com",
    },
]

PRODUCT_SEEDS = [
    {
        "name": "iPhone 15",
        "description": "Apple iPhone 15 with A16 Bionic chip, dynamic island, and advanced dual-camera system.",
        "category": "Smartphones",
        "image_url": "https://images.unsplash.com/photo-1695048133142-1f74b7d1e7d0?auto=format&fit=crop&w=1200&q=80",
    },
    {
        "name": "Samsung Galaxy S24",
        "description": "Samsung flagship smartphone with AI-powered camera features and vivid AMOLED display.",
        "category": "Smartphones",
        "image_url": "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=1200&q=80",
    },
    {
        "name": "Sony WH-1000XM5 Headphones",
        "description": "Premium wireless noise-cancelling headphones with long battery life and rich sound.",
        "category": "Audio",
        "image_url": "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1200&q=80",
    },
    {
        "name": "iPad Air M2",
        "description": "Lightweight Apple tablet powered by the M2 chip for creative work and entertainment.",
        "category": "Tablets",
        "image_url": "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=1200&q=80",
    },
    {
        "name": "MacBook Air M3",
        "description": "Thin and powerful Apple laptop with the M3 chip and all-day battery life.",
        "category": "Laptops",
        "image_url": "https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=1200&q=80",
    },
    {
        "name": "boAt Airdopes 141",
        "description": "Budget-friendly true wireless earbuds with fast charging and punchy bass output.",
        "category": "Audio",
        "image_url": "https://images.unsplash.com/photo-1606220838315-056192d5e927?auto=format&fit=crop&w=1200&q=80",
    },
    {
        "name": "OnePlus 12",
        "description": "High-performance Android flagship with a bright display and ultra-fast charging.",
        "category": "Smartphones",
        "image_url": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=1200&q=80",
    },
    {
        "name": "Logitech MX Master 3 Mouse",
        "description": "Ergonomic productivity mouse with precision scrolling and multi-device support.",
        "category": "Accessories",
        "image_url": "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=1200&q=80",
    },
]


def get_user_by_email(session: Session, email: str) -> User | None:
    return session.scalar(select(User).where(User.email == email))


def get_store_by_name(session: Session, name: str) -> Store | None:
    return session.scalar(select(Store).where(Store.name == name))


def get_product_by_name(session: Session, name: str) -> Product | None:
    return session.scalar(select(Product).where(Product.name == name))


def create_or_update_users(session: Session) -> dict[str, User]:
    print("Creating users...")
    users: dict[str, User] = {}

    for seed in USER_SEEDS:
        user = get_user_by_email(session, seed["email"])
        if user is None:
            user = User(
                name=seed["name"],
                email=seed["email"],
                phone=seed["phone"],
                password_hash=hash_password(seed["password"]),
                role=seed["role"],
            )
            session.add(user)
        else:
            user.name = seed["name"]
            user.phone = seed["phone"]
            user.role = seed["role"]
            user.password_hash = hash_password(seed["password"])

        users[seed["email"]] = user

    session.flush()
    return users


def create_or_update_stores(session: Session, users: dict[str, User]) -> dict[str, Store]:
    print("Creating stores...")
    stores: dict[str, Store] = {}

    for seed in STORE_SEEDS:
        store = get_store_by_name(session, seed["name"])
        location = WKTElement(f"POINT({seed['lng']} {seed['lat']})", srid=4326)

        if store is None:
            store = Store(
                name=seed["name"],
                address=seed["address"],
                lat=seed["lat"],
                lng=seed["lng"],
                location=location,
                phone=seed["phone"],
                is_active=True,
            )
            session.add(store)
        else:
            store.address = seed["address"]
            store.lat = seed["lat"]
            store.lng = seed["lng"]
            store.location = location
            store.phone = seed["phone"]
            store.is_active = True

        stores[seed["name"]] = store

    session.flush()

    for seed in STORE_SEEDS:
        staff_user = users[seed["staff_email"]]
        staff_user.store_id = stores[seed["name"]].id

    session.flush()
    return stores


def create_or_update_products(session: Session) -> dict[str, Product]:
    print("Creating products...")
    products: dict[str, Product] = {}

    for seed in PRODUCT_SEEDS:
        product = get_product_by_name(session, seed["name"])
        if product is None:
            product = Product(
                name=seed["name"],
                description=seed["description"],
                category=seed["category"],
                image_url=seed["image_url"],
            )
            session.add(product)
        else:
            product.description = seed["description"]
            product.category = seed["category"]
            product.image_url = seed["image_url"]

        products[seed["name"]] = product

    session.flush()
    return products


def create_or_update_inventory(
    session: Session,
    stores: dict[str, Store],
    products: dict[str, Product],
) -> None:
    print("Creating inventory...")
    rng = random.Random(570001)

    for store in stores.values():
        for product in products.values():
            inventory = session.scalar(
                select(StoreInventory).where(
                    StoreInventory.store_id == store.id,
                    StoreInventory.product_id == product.id,
                )
            )

            total_qty = rng.randint(3, 10)
            available_qty = total_qty

            if (
                store.name == "TechHub Electronics - Mysuru"
                and product.name == "iPhone 15"
            ):
                total_qty = max(total_qty, 3)
                available_qty = 1

            if inventory is None:
                inventory = StoreInventory(
                    store_id=store.id,
                    product_id=product.id,
                    total_qty=total_qty,
                    available_qty=available_qty,
                )
                session.add(inventory)
            else:
                inventory.total_qty = total_qty
                inventory.available_qty = available_qty

    session.flush()


def main() -> None:
    with SessionLocal() as session:
        users = create_or_update_users(session)
        stores = create_or_update_stores(session, users)
        products = create_or_update_products(session)
        create_or_update_inventory(session, stores, products)
        session.commit()

    print("Done!")
    print("=== Seed Complete ===")
    print("Test Accounts:")
    print("Customer: arjun@test.com / test123")
    print("Staff:    staff1@holdit.com / staff123")
    print("Admin:    admin@holdit.com / admin123")


if __name__ == "__main__":
    main()

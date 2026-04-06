---
description: "Backend development guidance for FastAPI async Python routes, services, models, and database operations"
applyTo: "backend/**"
---

# Backend Development Guide (Python/FastAPI)

## Module Structure

Follow this pattern for all features:

```
backend/app/api/routes/feature.py       # FastAPI router with endpoints
backend/app/services/feature_service.py # Business logic
backend/app/models/feature.py           # SQLAlchemy ORM model
backend/app/schemas/feature.py          # Pydantic request/response schemas
```

---

## FastAPI Routes Pattern

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.dependencies import get_db, get_current_user
from app.services import feature_service
from app.schemas import feature as schemas
from app.models.user import User

router = APIRouter(prefix="/features", tags=["features"])

@router.get("/", status_code=200)
async def list_features(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Get all features. Requires authentication."""
    items = await feature_service.get_all(db, user.id)
    return {
        "success": True,
        "data": items,
        "message": None
    }

@router.post("/", status_code=201)
async def create_feature(
    req: schemas.CreateFeatureRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Create a new feature."""
    try:
        item = await feature_service.create(db, user.id, req)
        return {
            "success": True,
            "data": item,
            "message": "Feature created"
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
```

### Key Rules
- **Always async**: Use `async def` and `await` on all DB operations
- **Type hints**: Every parameter and return value
- **Standard response format**: `success`, `data`, `message`
- **Error handling**: Use `HTTPException` (caught by middleware)
- **Auth**: Use `get_current_user` dependency for protected routes
- **Validation**: Use Pydantic schemas, not raw dicts

---

## SQLAlchemy Models

```python
from app.models.base import Base
from sqlalchemy import Column, String, Integer, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid

class Feature(Base):
    __tablename__ = "features"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, unique=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    user = relationship("User", back_populates="features")
```

### Key Rules
- **UUID primary keys**: Use `UUID(as_uuid=True)` for all IDs
- **Timestamps**: Include `created_at` and `updated_at` (use base class if available)
- **Relationships**: Use `relationship()` and `back_populates` for foreign keys
- **Naming**: `snake_case` for columns, match Python attributes
- **No defaults in __init__**: Let SQLAlchemy handle it

---

## Pydantic Schemas

```python
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from uuid import UUID
from typing import Optional

class FeatureBase(BaseModel):
    """Shared fields"""
    name: str = Field(..., min_length=1, max_length=255)

class CreateFeatureRequest(FeatureBase):
    """Request for creating a feature"""
    pass

class UpdateFeatureRequest(BaseModel):
    """Request for updating a feature"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)

class FeatureResponse(FeatureBase):
    """Response containing feature data"""
    id: UUID
    user_id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True  # ORM mode (SQLAlchemy compatibility)
```

### Key Rules
- **Validation**: Use `Field()` for constraints (min/max, regex)
- **from_attributes**: Always set `Config.from_attributes=True` for ORM models
- **Separation**: Base → Request → Response to avoid circular dependencies
- **Typing**: Use `Optional[T]` for optional fields, `UUID` for IDs

---

## Services (Business Logic)

```python
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from app.models.feature import Feature
from app.schemas.feature import CreateFeatureRequest

class FeatureService:
    @staticmethod
    async def get_all(db: AsyncSession, user_id: UUID) -> list[Feature]:
        """Fetch all features for a user."""
        stmt = select(Feature).where(Feature.user_id == user_id)
        result = await db.execute(stmt)
        return result.scalars().all()
    
    @staticmethod
    async def create(db: AsyncSession, user_id: UUID, req: CreateFeatureRequest) -> Feature:
        """Create a new feature."""
        feature = Feature(name=req.name, user_id=user_id)
        db.add(feature)
        await db.commit()
        await db.refresh(feature)
        return feature
    
    @staticmethod
    async def delete(db: AsyncSession, feature_id: UUID) -> None:
        """Delete a feature."""
        stmt = select(Feature).where(Feature.id == feature_id)
        result = await db.execute(stmt)
        feature = result.scalar_one_or_none()
        if not feature:
            raise ValueError("Feature not found")
        await db.delete(feature)
        await db.commit()
```

### Key Rules
- **Static methods**: Each method is self-contained and testable
- **Exceptions**: Raise `ValueError` for business logic errors (routes convert to HTTPException)
- **Database ops**: Always `await` and include `commit()` for writes
- **Refresh**: Call `db.refresh()` for updated models after writes

---

## Database Queries (SQLAlchemy Async)

### Pattern: Select with Filter
```python
from sqlalchemy import select

stmt = select(User).where(User.email == "user@example.com")
result = await db.execute(stmt)
user = result.scalar_one_or_none()  # Returns None if not found, raises if multiple
```

### Pattern: Insert
```python
user = User(email="new@example.com", password_hash="...")
db.add(user)
await db.commit()
await db.refresh(user)  # Fetch updated state from DB
```

### Pattern: Update
```python
stmt = select(User).where(User.id == user_id)
result = await db.execute(stmt)
user = result.scalar_one()
user.email = "updated@example.com"
await db.commit()
```

### Pattern: Join
```python
stmt = select(Reservation).join(Product).where(Product.category == "Electronics")
result = await db.execute(stmt)
reservations = result.scalars().all()
```

### Pattern: Geospatial (PostGIS)
```python
from geoalchemy2 import Geography
from sqlalchemy import func

# Find stores within 5km of a point (lat, lng)
stmt = select(Store).where(
    func.ST_DWithin(Store.location, func.ST_Point(lng, lat), 5000)  # 5000 meters
)
result = await db.execute(stmt)
nearby_stores = result.scalars().all()
```

---

## Celery Async Tasks

```python
from app.workers.celery_app import celery_app
from app.core.database import get_db_session
import asyncio

@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def expire_old_reservations(self):
    """Cleanup old reservations (runs periodically)."""
    try:
        asyncio.run(_expire_reservations())
    except Exception as exc:
        # Retry with exponential backoff
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))

async def _expire_reservations():
    """Async function called from sync Celery task."""
    db = await get_db_session()
    # ... async database operations
    await db.close()
```

### Key Rules
- **Sync wrapper**: Celery tasks must be sync; use `asyncio.run()` for async DB calls
- **Retry logic**: Use `max_retries` and `default_retry_delay` for reliability
- **Error handling**: Catch exceptions and retry gracefully
- **Logging**: Use `self.update_state()` to report progress in long tasks

---

## Environment Variables (Backend)

```bash
# Database
POSTGRES_DATABASE=holdit
POSTGRES_USER=postgres
POSTGRES_PASSWORD=...
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET_KEY=your-secret-key-here
JWT_ALGORITHM=HS256
JWT_EXPIRY=3600

# CORS
ALLOWED_ORIGINS=["http://localhost:3000"]

# External APIs
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

---

## Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `RuntimeError: no running event loop` | Using sync code in async context | Use `await` on all async operations |
| `IntegrityError: duplicate key` | Unique constraint violated | Check for existing records before insert |
| `AttributeError: 'NoneType' object has no attribute` | `.scalar_one_or_none()` returned None | Check if result exists before accessing |
| `postgresql.errors.InsufficientPrivilegeError` | PostGIS not installed | `CREATE EXTENSION postgis;` in PostgreSQL |
| `ConnectionRefusedError: Redis` | Redis not running | Start Redis: `docker-compose up redis` |

---

## Testing (When Implemented)

Use `pytest-asyncio` for testing async code:

```bash
pip install pytest pytest-asyncio
```

```python
import pytest
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession

@pytest.mark.asyncio
async def test_create_user():
    db = AsyncSession(...)
    user = await user_service.create(db, UserCreateRequest(email="test@test.com"))
    assert user.email == "test@test.com"
```

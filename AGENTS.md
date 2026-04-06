# HoldIt Project Guidelines

HoldIt is a **geospatial inventory reservation system** that helps users reserve products at nearby stores. It's a full-stack monorepo with a FastAPI backend and Next.js frontend.

## Tech Stack

| Component | Technology |
|-----------|-----------|
| **Backend** | FastAPI 0.100+ (Python 3.9+) with async/await, SQLAlchemy ORM |
| **Frontend** | Next.js 14.2, React 18.3, TypeScript 5.7, Tailwind CSS 3.4 |
| **Database** | PostgreSQL 15 + PostGIS for geospatial queries |
| **Cache/Queue** | Redis 7 + Celery for async tasks |
| **Auth** | JWT (3600s expiry) + bcrypt password hashing |
| **Integrations** | Twilio (SMS), Firebase, AWS S3, Google Maps API |

---

## Quick Start

### Full Stack (Docker Compose - Recommended)
```bash
docker-compose up  # Starts all services: postgres, redis, backend, celery, frontend
```
Access: Backend (http://localhost:8000), Frontend (http://localhost:3000)

### Backend Only
```bash
cd backend
pip install -r requirements.txt
# Set up .env file with database and service credentials
uvicorn app.main:app --reload           # Port 8000
# In another terminal:
celery -A app.workers.celery_app worker --loglevel=info
```

### Frontend Only
```bash
cd frontend
npm install
npm run dev                              # Port 3000
```

### Database Migrations
```bash
cd backend
alembic revision --autogenerate -m "description"
alembic upgrade head
```

---

## Architecture & Conventions

### Response Format (Standardized Across All Endpoints)
All API responses follow this format:
```json
{
  "success": true,
  "data": { /* actual response data */ },
  "message": "Optional message"
}
```

### Backend Organization
- **`routes/`**: API endpoints (modular routers with path prefixes like `/auth`, `/products`)
- **`services/`**: Business logic layer (inventory, reservations, dashboard)
- **`models/`**: SQLAlchemy ORM models with UUID primary keys and timestamp mixins
- **`schemas/`**: Pydantic validation schemas (request/response)
- **`workers/`**: Celery async tasks (token expiry, OTP cleanup, etc.)
- **`core/`**: Config, database, security, dependencies, Redis client

### Frontend Organization
- **`app/`**: Next.js pages and layouts
- **`components/`**: Reusable React components
- **`lib/`**: Utilities (`api.ts` with axios client, `auth.ts`, `types.ts`)
- **`styles/`**: Tailwind CSS globals

### Naming Conventions
- **Python**: `snake_case` for functions/variables, `SCREAMING_SNAKE_CASE` for constants
- **TypeScript**: `PascalCase` for types/interfaces, `camelCase` for functions
- **Database**: `snake_case` columns, lowercase enum table names
- **Environment**: Prefixed (e.g., `POSTGRES_PASSWORD`, `NEXT_PUBLIC_API_URL`)

---

## Key Gotchas & Requirements

⚠️ **Critical Setup Issues:**

1. **Environment Files Required**
   - `backend/.env` and `frontend/.env` must exist (copy from `.env.example` or create manually)
   - Missing .env breaks service startup

2. **Redis is Non-Optional**
   - Required for auth token caching, inventory locks, and Celery broker
   - If Redis is unavailable, backend auth and task queue fail immediately

3. **PostgreSQL + PostGIS**
   - Must have PostGIS extension (`CREATE EXTENSION postgis;`)
   - Store location queries use `ST_Distance`, `ST_DWithin` for geospatial searches
   - All migrations must be applied: `alembic upgrade head`

4. **Async Patterns (Backend)**
   - ALL database queries are async via `AsyncSession`
   - Celery tasks use `asyncio.run()` wrapper when accessing async DB functions
   - Never use synchronous ORM operations in async context

5. **JWT Token Lifecycle**
   - **Access token**: 3600 seconds (1 hour)
   - **Refresh token**: 7 days
   - Frontend auto-refreshes tokens via axios interceptor on 401
   - Logout must clear `holdit_access_token`, `holdit_refresh_token`, `holdit_user` from localStorage

6. **Reservation OTP System**
   - 6-digit OTP, 10-minute expiry
   - Managed via Celery `expire_reservation` task (background cleanup)
   - No manual OTP validation needed if Celery is running

7. **CORS Configuration**
   - **Current**: `allow_origins=["*"]` (too permissive)
   - **Production**: Restrict to specific frontend domain in `backend/app/core/config.py`

---

## Code Style & Patterns

### Backend (FastAPI/Python)

- Use **type hints** on all functions: `def create_user(name: str, role: UserRole) -> User:`
- Leverage **FastAPI Depends()** for:
  - Database sessions: `db: AsyncSession = Depends(get_db)`
  - Auth checks: `user: User = Depends(get_current_user)`
  - Roles: `Depends(require_role("ADMIN"))`
- **Validation**: Use Pydantic schemas for request/response, not raw dicts
- **Error handling**: Raise `HTTPException` with status code; framework catches and formats
- **Async always**: Use `await` on all database operations

### Frontend (Next.js/TypeScript)

- Use **TypeScript strict mode** (tsconfig.json)
- Import types with `import type { User }` (zero runtime cost)
- Use **localStorage** for JWT tokens with `holdit_` prefix
- Axios client auto-injects Bearer token: use `api.get()` from `lib/api.ts`
- **Layouts**: Each page folder has `layout.tsx` for section-specific UI
- Use **"use client"** directive for interactive components (hooks, events)

---

## Testing (TODO)

⚠️ **Currently No Testing Framework**
- No pytest for backend, no Jest/Vitest for frontend
- Future: Add test suite before production deployment
- Recommended: pytest-asyncio for backend (async support), Vitest for frontend

---

## Database Schema Essentials

| Table | Key Columns | Notes |
|-------|------------|-------|
| `users` | id, email, phone, password_hash, role, store_id, fcm_token | Roles: CUSTOMER, STORE_STAFF, ADMIN |
| `stores` | id, name, location (PostGIS geography), address, phone | Discoverable via geospatial queries |
| `products` | id, name, category, description, image_url | No store affiliation (inventory via store_inventory join) |
| `store_inventory` | store_id, product_id, total_qty, available_qty | Tracks stock per store |
| `reservations` | id, user_id, product_id, otp, status, expires_at | Status: PENDING → CONFIRMED/REJECTED → COMPLETED/EXPIRED |

---

## Deployment Notes

- **Dockerized**: All services in docker-compose.yml
- **Production checklist**: Restrict CORS, enable database SSL, set Redis password, use environment secrets
- **Celery worker availability**: Critical for background tasks (OTP expiry, token cleanup)

---

## Related Documentation

- **Backend patterns**: See `backend/app/api/routes/` and `backend/app/services/` for examples
- **Frontend components**: See `frontend/components/` directory
- **Database schema**: See `backend/alembic/versions/` for migrations
- **Error handlers**: See `backend/main.py` for request/response error formatting

---

## For AI Agents

✅ **Context you already have:**
- Monorepo with independent backend/frontend
- Standardized API response format
- Async-first backend with clear dependency injection
- Type-safe frontend (TypeScript strict mode)
- Docker setup ready for development

⚠️ **Watch out for:**
- Missing .env files (setup blocker)
- PostGIS not installed (geospatial queries fail silently)
- Redis unavailable (auth/tasks break immediately)
- Async/await patterns (don't mix with sync operations)
- No test suite (manual testing currently required)

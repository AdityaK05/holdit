import asyncio
from uuid import UUID

from app.core.database import AsyncSessionLocal
from app.services.reservation_service import expire_reservation_by_id
from app.workers.celery_app import celery_app


@celery_app.task(name="notify_store", bind=True, max_retries=3, default_retry_delay=5)
def notify_store(self, reservation_id: str) -> dict[str, str]:
    return {"reservation_id": reservation_id, "status": "queued"}


@celery_app.task(
    name="notify_customer_confirmed",
    bind=True,
    max_retries=3,
    default_retry_delay=5,
)
def notify_customer_confirmed(self, reservation_id: str) -> dict[str, str]:
    return {"reservation_id": reservation_id, "status": "confirmed_queued"}


@celery_app.task(
    name="notify_customer_rejected",
    bind=True,
    max_retries=3,
    default_retry_delay=5,
)
def notify_customer_rejected(self, reservation_id: str) -> dict[str, str]:
    return {"reservation_id": reservation_id, "status": "rejected_queued"}


@celery_app.task(name="expire_reservation", bind=True, max_retries=3, default_retry_delay=5)
def expire_reservation(self, reservation_id: str) -> dict[str, str]:
    async def _run() -> None:
        async with AsyncSessionLocal() as db:
            await expire_reservation_by_id(db, UUID(reservation_id))

    asyncio.run(_run())
    return {"reservation_id": reservation_id, "status": "expired_checked"}

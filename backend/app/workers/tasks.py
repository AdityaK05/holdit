import asyncio
import logging
from uuid import UUID

from app.core.database import AsyncSessionLocal
from app.services.payment_service import expire_stale_payments
from app.services.reservation_service import (
    expire_reservation_by_id,
    sweep_expired_reservations,
)
from app.workers.celery_app import celery_app

logger = logging.getLogger(__name__)


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


# ── Periodic Cleanup Tasks ────────────────────────────────────────────────────

@celery_app.task(name="periodic_expire_stale_payments", bind=True, max_retries=1)
def periodic_expire_stale_payments(self) -> dict[str, int]:
    """Expire pending payment records older than the configured window."""
    async def _run() -> int:
        async with AsyncSessionLocal() as db:
            return await expire_stale_payments(db)

    count = asyncio.run(_run())
    if count > 0:
        logger.info("Expired %d stale payment(s)", count)
    return {"expired_payments": count}


@celery_app.task(name="periodic_sweep_expired_reservations", bind=True, max_retries=1)
def periodic_sweep_expired_reservations(self) -> dict[str, int]:
    """Safety net: expire reservations whose deadline has passed
    but were not caught by the individual countdown task."""
    async def _run() -> int:
        async with AsyncSessionLocal() as db:
            return await sweep_expired_reservations(db)

    count = asyncio.run(_run())
    if count > 0:
        logger.info("Swept %d expired reservation(s)", count)
    return {"swept_reservations": count}

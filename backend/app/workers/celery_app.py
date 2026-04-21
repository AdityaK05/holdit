from celery import Celery
from celery.schedules import crontab

from app.core.config import settings


app = Celery(
    "holdit",
    broker=settings.redis_url,
    backend=settings.redis_url,
)

app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    imports=("app.workers.tasks",),
    # Celery Beat periodic task schedule
    beat_schedule={
        "expire-stale-payments-every-5-min": {
            "task": "periodic_expire_stale_payments",
            "schedule": 300.0,  # Every 5 minutes
        },
        "sweep-expired-reservations-every-2-min": {
            "task": "periodic_sweep_expired_reservations",
            "schedule": 120.0,  # Every 2 minutes
        },
    },
    # Production safety settings
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_reject_on_worker_lost=True,
)

celery_app = app

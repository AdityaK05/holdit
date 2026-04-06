import asyncio
import uuid

from collections.abc import AsyncGenerator

from redis.asyncio import Redis

from app.core.config import settings

redis_client = Redis.from_url(settings.redis_url, decode_responses=True)


async def get_redis() -> AsyncGenerator[Redis, None]:
    yield redis_client


async def acquire_lock(redis: Redis, lock_key: str, ttl: int = 5) -> str | None:
    for attempt in range(3):
        token = str(uuid.uuid4())
        acquired = await redis.set(lock_key, token, ex=ttl, nx=True)
        if acquired:
            return token
        if attempt < 2:
            await asyncio.sleep(0.1)
    return None


async def release_lock(redis: Redis, lock_key: str, token: str | None) -> None:
    if token is None:
        return

    await redis.eval(
        """
        if redis.call('GET', KEYS[1]) == ARGV[1] then
            return redis.call('DEL', KEYS[1])
        end
        return 0
        """,
        1,
        lock_key,
        token,
    )

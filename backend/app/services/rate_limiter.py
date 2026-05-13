import time
from typing import Tuple

from redis.asyncio import Redis


class RateLimiter:
    def __init__(self, redis: Redis):
        self.redis = redis

    async def is_allowed(
        self, key: str, limit: int, window: int
    ) -> Tuple[bool, int, int]:
        """
        Sliding window rate limiter.
        Returns (is_allowed, remaining, reset_time)
        """

        now = time.time()
        window_start = now - window

        pipe = self.redis.pipeline()
        pipe.zremrangebyscore(key, 0, window_start)
        pipe.zadd(key, {str(now): now})
        pipe.zcard(key)
        pipe.expire(key, window)

        result = await pipe.execute()
        current_count = result[2]

        remaining = max(0, limit - current_count)
        reset_time = int(now + window)

        return current_count <= limit, remaining, reset_time

    async def check_rate_limit(
        self, identifier: str, limit: int = 100, window: int = 60
    ) -> dict:
        key = f"ratelimit:{identifier}"
        allowed, remaining, reset_time = await self.is_allowed(key, limit, window)
        return {
            "allowed": allowed,
            "limit": limit,
            "remaining": remaining,
            "rest": reset_time,
        }

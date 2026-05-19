import time
import uuid
from typing import Tuple

from redis.asyncio import Redis


class RateLimiter:
    def __init__(self, redis: Redis):
        self.redis = redis

    async def is_allowed(
        self,
        key: str,
        limit: int,
        window: int,
    ) -> Tuple[bool, int, int]:
        """
        Sliding window log rate limiter.
        Returns:
            (allowed, remaining, reset_time)
        """

        now = time.time()
        window_start = now - window
        member = str(uuid.uuid4())
        pipe = self.redis.pipeline(transaction=True)

        # remove expired requests
        pipe.zremrangebyscore(key, 0, window_start)

        # count active requests
        pipe.zcard(key)

        results = await pipe.execute()
        current_count = results[1]

        # reject before inserting
        if current_count >= limit:
            reset_time = int(now + window)

            return False, 0, reset_time

        # insert current request
        pipe = self.redis.pipeline(transaction=True)

        pipe.zadd(key, {member: now})
        pipe.expire(key, window)

        await pipe.execute()

        remaining = max(0, limit - (current_count + 1))
        reset_time = int(now + window)

        return True, remaining, reset_time

    async def check_rate_limit(
        self,
        identifier: str,
        limit: int = 100,
        window: int = 60,
    ) -> dict:
        key = f"ratelimit:{identifier}"

        allowed, remaining, reset_time = await self.is_allowed(
            key=key,
            limit=limit,
            window=window,
        )

        return {
            "allowed": allowed,
            "limit": limit,
            "remaining": remaining,
            "reset": reset_time,
        }

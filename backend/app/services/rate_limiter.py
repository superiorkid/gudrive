import time
import uuid
from typing import Tuple


class RateLimiter:
    def __init__(self, redis):
        self.redis = redis

    async def is_allowed(
        self,
        key: str,
        limit: int,
        window: int,
    ) -> Tuple[bool, int, int]:
        now = time.time()
        window_start = now - window
        member = str(uuid.uuid4())

        pipe = self.redis.pipeline(transaction=True)

        pipe.zremrangebyscore(key, 0, window_start)
        pipe.zadd(key, {member: now})
        pipe.zcard(key)
        pipe.expire(key, window)

        results = await pipe.execute()

        current_count = results[2]

        reset_time = int(now + window)

        if current_count > limit:
            return False, 0, reset_time

        remaining = max(0, limit - current_count)
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

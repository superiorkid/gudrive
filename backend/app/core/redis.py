from contextlib import asynccontextmanager

from fastapi import FastAPI
from redis.asyncio import ConnectionPool, Redis

from app.core.config import get_configs


class RedisClient:
    def __init__(self):
        self._config = get_configs()
        self._pool: ConnectionPool | None = None
        self._client: Redis | None = None

    async def connect(self) -> None:
        self._pool = ConnectionPool.from_url(
            url=self._config.redis_url, max_connections=50, decode_response=True
        )
        self._client = Redis(connection_pool=self._pool)

    async def disconnect(self) -> None:
        if self._client:
            await self._client.close()

        if self._pool:
            await self._pool.disconnect()

    @property
    async def client(self) -> Redis:
        if not self._client:
            raise RuntimeError("Redis client is not initialized")
        return self._client


redis_client = RedisClient()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await redis_client.connect()
    yield
    await redis_client.disconnect()

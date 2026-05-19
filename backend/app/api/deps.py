from typing import AsyncGenerator

from fastapi import Cookie, Depends, HTTPException, Request, status
from jose import jwt
from jose.exceptions import JWTError
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_user
from app.core.config import Settings, get_configs
from app.core.redis import redis_client
from app.database import async_session_maker
from app.models.user import User
from app.services.cache import CacheService
from app.services.rate_limiter import RateLimiter


async def get_async_db_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        yield session


async def get_current_user(
    db: AsyncSession = Depends(get_async_db_session),
    access_token: str | None = Cookie(
        default=None,
        alias="access-token",
    ),
    config: Settings = Depends(get_configs),
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
    )

    if not access_token:
        raise credentials_exception

    try:
        payload = jwt.decode(
            access_token,
            config.secret_key,
            algorithms=[config.algorithm],
        )

        email: str | None = payload.get("sub")
        if email is None:
            raise credentials_exception

    except JWTError as e:
        print("JWT ERROR:", e)
        raise credentials_exception

    user = await get_user(db, email)

    if user is None:
        raise credentials_exception

    return user


async def get_current_active_user(current_user: User = Depends(get_current_user)):
    if not current_user.is_verified:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


async def get_redis() -> Redis:
    return await redis_client.client


async def get_cache(redis: Redis = Depends(get_redis)) -> CacheService:
    return CacheService(redis)


def rate_limit(limit: int, window: int):
    async def dependency(
        request: Request,
        redis: Redis = Depends(get_redis),
    ):
        limiter = RateLimiter(redis)
        client_ip = request.client.host if request.client else "unknown"

        result = await limiter.check_rate_limit(f"api:{client_ip}", limit, window)

        if not result["allowed"]:
            raise HTTPException(
                status_code=429,
                detail="Rate limit exceeded",
            )

        return result

    return dependency

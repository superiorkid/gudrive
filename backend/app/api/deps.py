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


def rate_limit(limit: int = 100, window: int = 60):
    async def dependency(
        request: Request,
        redis=Depends(get_redis),
    ):
        limiter = RateLimiter(redis)
        client_ip = request.headers.get("x-forwarded-for")
        if client_ip:
            client_ip = client_ip.split(",")[0].strip()
        else:
            client_ip = request.client.host if request.client else "unknown"

        # Unique identifier per IP + HTTP Method + Route Path
        # e.g., "123.456.7.8:POST:/api/v1/auth/register"
        endpoint_identifier = f"{client_ip}:{request.method}:{request.url.path}"

        result = await limiter.check_rate_limit(
            identifier=endpoint_identifier,
            limit=limit,
            window=window,
        )

        if not result["allowed"]:
            raise HTTPException(
                status_code=429,
                detail="Rate limit exceeded. Please try again later.",
                headers={
                    "X-RateLimit-Limit": str(result["limit"]),
                    "X-RateLimit-Remaining": str(result["remaining"]),
                    "X-RateLimit-Reset": str(result["reset"]),
                },
            )

        return result

    return dependency

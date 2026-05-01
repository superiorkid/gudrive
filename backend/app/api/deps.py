from typing import AsyncGenerator

from fastapi import Depends, HTTPException, status
from jose import jwt
from jose.exceptions import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_user, oauth2_scheme
from app.core.config import Settings, get_configs
from app.database import async_session_maker
from app.models.user import User


async def get_async_db_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        yield session


async def get_current_user(
    db: AsyncSession = Depends(get_async_db_session),
    token: str = Depends(oauth2_scheme),
    config: Settings = Depends(get_configs),
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, config.secret_key, algorithms=[config.algorithm])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = await get_user(db, email)
    if user is None:
        raise credentials_exception
    return user


async def get_current_active_user(current_user: User = Depends(get_current_user)):
    if not current_user.is_verified:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

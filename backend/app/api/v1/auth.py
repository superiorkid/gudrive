from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_async_db_session, get_current_active_user
from app.common.exceptions import AlreadyExistsException
from app.core.auth import (
    authenticate_user,
    create_access_token,
    get_password_hash,
)
from app.core.config import Settings, get_configs
from app.models.user import User
from app.schemas.user import CreateUser
from app.utils.success_response import success_response

auth_router_v1 = APIRouter(tags=["Authentication"])


@auth_router_v1.post("/token")
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_async_db_session),
    config: Settings = Depends(get_configs),
):
    user = await authenticate_user(
        db=db, email=form_data.username, password=form_data.password
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    acces_token_expires = timedelta(minutes=config.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=acces_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@auth_router_v1.post("/register")
async def register_user(
    payload: CreateUser,
    db: AsyncSession = Depends(get_async_db_session),
):
    query = select(User).where(User.email == payload.email)
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if user:
        raise AlreadyExistsException("User", "email", payload.email)

    query = select(User).where(User.username == payload.username)
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if user:
        raise AlreadyExistsException("User", "username", payload.username)

    hashed_password = get_password_hash(payload.password)
    new_user = User(
        email=payload.email,
        username=payload.username,
        hashed_password=hashed_password,
        verified_at=datetime.now(),
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return success_response(message="create user successfully")


@auth_router_v1.get("/protected")
async def protected_route(current_user: User = Depends(get_current_active_user)):
    return {"message": f"Hello {current_user.username}, this is a protected route!"}

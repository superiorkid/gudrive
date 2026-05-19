from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_async_db_session, get_current_active_user, rate_limit
from app.common.exceptions import AlreadyExistsException
from app.core.auth import (
    authenticate_user,
    create_access_token,
    get_password_hash,
)
from app.core.config import Settings, get_configs
from app.lib.success_response import success_response
from app.models.user import User
from app.schemas.user import CreateUser, UserResponse

auth_router_v1 = APIRouter(tags=["Authentication"])


@auth_router_v1.post("/token", dependencies=[Depends(rate_limit(5, 60))])
async def login_for_access_token(
    response: Response,
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
    response.set_cookie(
        key=config.access_token_key,
        value=access_token,
        httponly=True,
        secure=config.app_env == "prod",
        samesite="lax",
        max_age=config.access_token_expire_minutes * 60,
        path="/",
    )

    return {"access_token": access_token, "token_type": "bearer"}


@auth_router_v1.post(
    "/register",
    dependencies=[Depends(rate_limit(5, 3600))],
)
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


@auth_router_v1.post(
    "/logout",
    dependencies=[Depends(rate_limit(30, 60))],
)
async def logout(
    response: Response,
    config: Settings = Depends(get_configs),
    _: User = Depends(get_current_active_user),
):
    response.delete_cookie(key=config.access_token_key, path="/")
    return success_response(message="Logged out")


@auth_router_v1.get(
    "/me",
    response_model=UserResponse,
    dependencies=[Depends(rate_limit(120, 60))],
)
async def session(current_user: User = Depends(get_current_active_user)):
    return current_user

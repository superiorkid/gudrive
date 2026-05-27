from fastapi import APIRouter, Depends, Request, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_async_db_session, get_current_active_user, rate_limit
from app.core.config import Settings, get_configs
from app.lib.success_response import success_response
from app.models.user import User
from app.schemas.user import CreateUser, UserResponse
from app.services.auth import (
    login_for_access_token_service,
    refresh_access_token_service,
    register_service,
)

auth_router_v1 = APIRouter(tags=["Authentication"])


@auth_router_v1.post("/token", dependencies=[Depends(rate_limit(5, 60))])
async def login_for_access_token(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_async_db_session),
    config: Settings = Depends(get_configs),
):
    await login_for_access_token_service(
        response=response, form_data=form_data, config=config, db=db
    )
    return success_response(data={"success": True})


@auth_router_v1.post("/refresh")
async def refresh_token(
    request: Request,
    response: Response,
    config: Settings = Depends(get_configs),
):
    await refresh_access_token_service(
        request=request, response=response, config=config
    )
    return success_response(data={"success": True})


@auth_router_v1.post(
    "/register",
    dependencies=[Depends(rate_limit(5, 3600))],
)
async def register_user(
    payload: CreateUser,
    db: AsyncSession = Depends(get_async_db_session),
):
    await register_service(db=db, payload=payload)
    return success_response(message="create user successfully")


@auth_router_v1.post(
    "/logout",
    dependencies=[Depends(rate_limit(30, 60)), Depends(get_current_active_user)],
)
async def logout(
    response: Response,
    config: Settings = Depends(get_configs),
):
    response.delete_cookie(key=config.access_token_key, path="/")
    response.delete_cookie(key=config.refresh_token_key, path="/")
    return success_response(message="Logged out successfully")


@auth_router_v1.get(
    "/me",
    response_model=UserResponse,
    dependencies=[Depends(rate_limit(120, 60))],
)
async def session(current_user: User = Depends(get_current_active_user)):
    return current_user

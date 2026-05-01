from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_async_db_session, get_current_active_user
from app.core.auth import authenticate_user, create_access_token
from app.core.config import Settings, get_configs
from app.models.user import User

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


@auth_router_v1.get("/protected")
async def protected_route(current_user: User = Depends(get_current_active_user)):
    return {"message": f"Hello {current_user.username}, this is a protected route!"}

from app.common.exceptions import AlreadyExistsException
from app.models import User
from sqlalchemy import select
from app.schemas.user import CreateUser
from app.core.config import Settings
from datetime import timedelta, datetime
from fastapi import HTTPException, status, Response, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.auth import authenticate_user, create_access_token, get_password_hash
from jose import jwt, JWTError


async def login_for_access_token_service(
    db: AsyncSession,
    form_data: OAuth2PasswordRequestForm,
    config: Settings,
    response: Response,
):
    user = await authenticate_user(
        db=db,
        email=form_data.username,
        password=form_data.password,
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    acces_token_expires = timedelta(minutes=config.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user.email, "type": "access"}, expires_delta=acces_token_expires
    )

    refresh_token_expires = timedelta(days=config.refresh_token_expire_days)
    refresh_token = create_access_token(
        data={"sub": user.email, "type": "refresh"}, expires_delta=refresh_token_expires
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

    response.set_cookie(
        key=config.refresh_token_key,
        value=refresh_token,
        httponly=True,
        secure=config.app_env == "prod",
        samesite="lax",
        # convert days to seconds
        max_age=config.refresh_token_expire_days * 24 * 60 * 60,
        path="/",
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


async def refresh_access_token_service(
    request: Request, response: Response, config: Settings
):
    refresh_token = request.cookies.get(config.refresh_token_key)
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token missing"
        )

    try:
        payload = jwt.decode(
            refresh_token, config.secret_key, algorithms=[config.algorithm]
        )
        email: str = payload.get("sub")
        token_type: str = payload.get("type")

        if email is None or token_type != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    access_token_expires = timedelta(minutes=config.access_token_expire_minutes)
    new_access_token = create_access_token(
        data={"sub": email, "type": "access"}, expires_delta=access_token_expires
    )

    response.set_cookie(
        key=config.access_token_key,
        value=new_access_token,
        httponly=True,
        secure=config.app_env == "prod",
        samesite="lax",
        max_age=config.access_token_expire_minutes * 60,
        path="/",
    )
    return {"access_token": new_access_token, "token_type": "bearer"}


async def register_service(db: AsyncSession, payload: CreateUser):
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
    return new_user

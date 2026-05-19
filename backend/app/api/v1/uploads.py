import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_async_db_session, get_cache, get_current_active_user
from app.core.config import Settings, get_configs
from app.lib.success_response import success_response
from app.models.user import User
from app.schemas.upload import InitializeUploadRequest, InitializeUploadResponse
from app.services.cache import CacheService
from app.services.upload import (
    finalize_upload_service,
    get_upload_status_service,
    initialize_upload_service,
    upload_chunk_service,
)

uploads_router_v1 = APIRouter(tags=["Uploads"])


@uploads_router_v1.post("/initialize")
async def initialize_upload(
    payload: InitializeUploadRequest,
    db: Annotated[AsyncSession, Depends(get_async_db_session)],
    config: Annotated[Settings, Depends(get_configs)],
    current_user: Annotated[User, Depends(get_current_active_user)],
    cache: CacheService = Depends(get_cache),
):
    data: InitializeUploadResponse = await initialize_upload_service(
        payload=payload, db=db, config=config, current_user=current_user, cache=cache
    )
    return success_response(data=data, message="Initialize upload successfully")


@uploads_router_v1.head("/{upload_id}")
async def get_upload_status(
    upload_id: uuid.UUID,
    response: Response,
    db: Annotated[AsyncSession, Depends(get_async_db_session)],
    current_user: Annotated[User, Depends(get_current_active_user)],
    cache: CacheService = Depends(get_cache),
):
    response = await get_upload_status_service(
        upload_id=upload_id,
        db=db,
        response=response,
        current_user=current_user,
        cache=cache,
    )
    return response


@uploads_router_v1.put("/{upload_id}/chunks")
async def upload_chunk(
    upload_id: uuid.UUID,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_async_db_session)],
    current_user: Annotated[User, Depends(get_current_active_user)],
    cache: CacheService = Depends(get_cache),
):
    result = await upload_chunk_service(
        upload_id=upload_id,
        request=request,
        db=db,
        current_user=current_user,
        cache=cache,
    )
    return success_response(data=result)


@uploads_router_v1.post("/{upload_id}/complete")
async def finalize_upload(
    upload_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_async_db_session)],
    config: Annotated[Settings, Depends(get_configs)],
    current_user: Annotated[User, Depends(get_current_active_user)],
    cache: CacheService = Depends(get_cache),
):
    result = await finalize_upload_service(
        upload_id=upload_id,
        db=db,
        config=config,
        current_user=current_user,
        cache=cache,
    )
    return success_response(data=result)

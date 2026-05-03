import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_async_db_session, get_current_active_user
from app.common.exceptions import NotFoundException
from app.core.config import Settings, get_configs
from app.models.upload_session import UploadSession
from app.models.user import User
from app.schemas.upload import InitializeUploadRequest
from app.services.upload import initialize_upload_service
from app.utils.success_response import success_response

uploads_router_v1 = APIRouter(tags=["Uploads"])


@uploads_router_v1.post("/initialize")
async def initialize_upload(
    payload: InitializeUploadRequest,
    db: Annotated[AsyncSession, Depends(get_async_db_session)],
    config: Annotated[Settings, Depends(get_configs)],
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    data = await initialize_upload_service(payload, db, config, current_user)
    return success_response(data=data, message="Initialize upload successfully")


@uploads_router_v1.head("/{upload_id}")
async def get_upload_status(
    upload_id: uuid.UUID,
    response: Response,
    db: Annotated[AsyncSession, Depends(get_async_db_session)],
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    query = select(UploadSession).where(
        UploadSession.id == upload_id, UploadSession.owner_id == current_user.id
    )
    result = await db.execute(query)
    session = result.scalar_one_or_none()

    if not session:
        raise NotFoundException("UploadSession", str(upload_id))

    response.headers["Upload-Offset"] = str(session.uploaded_bytes)
    response.headers["Upload-Length"] = str(session.total_size)
    response.headers["Upload-Status"] = session.status.value
    response.headers["Upload-Chunk-Size"] = str(session.chunk_size)
    response.status_code = 204
    return response


@uploads_router_v1.put("/{upload_id}/chunks")
def upload_chunk(upload_id: str):
    pass


@uploads_router_v1.post("/{upload_id}/complete")
def finalize_upload(upload_id: str):
    pass

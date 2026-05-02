from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_async_db_session, get_current_active_user
from app.core.config import Settings, get_configs
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
def get_upload_status(upload_id: str):
    pass


@uploads_router_v1.put("/{upload_id}/chunks")
def upload_chunk(upload_id: str):
    pass


@uploads_router_v1.post("/{upload_id}/complete")
def finalize_upload(upload_id: str):
    pass

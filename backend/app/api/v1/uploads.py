from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_async_db_session
from app.core.config import Settings, get_configs

uploads_router_v1 = APIRouter(tags=["Uploads"])


@uploads_router_v1.post("/initialize")
def initialize_upload(
    db: Annotated[AsyncSession, Depends(get_async_db_session)],
    config: Annotated[Settings, Depends(get_configs)],
):
    pass


@uploads_router_v1.head("/{upload_id}")
def get_upload_status(upload_id: str):
    pass


@uploads_router_v1.put("/{upload_id}/chunks")
def upload_chunk(upload_id: str):
    pass


@uploads_router_v1.post("/{upload_id}/complete")
def finalize_upload(upload_id: str):
    pass

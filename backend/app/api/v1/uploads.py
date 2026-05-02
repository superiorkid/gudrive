import os
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_async_db_session, get_current_active_user
from app.core.config import Settings, get_configs
from app.models.node import Node, NodeType
from app.models.upload_session import UploadSession, UploadStatus
from app.models.user import User
from app.schemas.upload import InitializeUploadRequest, InitializeUploadResponse

uploads_router_v1 = APIRouter(tags=["Uploads"])


@uploads_router_v1.post("/initialize")
async def initialize_upload(
    payload: InitializeUploadRequest,
    db: Annotated[AsyncSession, Depends(get_async_db_session)],
    config: Annotated[Settings, Depends(get_configs)],
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    if payload.parent_id:
        query = select(Node).where(
            Node.id == payload.parent_id,
            Node.owner_id == current_user.id,
            Node.deleted_at.is_(None),
        )
        result = await db.execute(query)
        parent = result.scalar_one_or_none()
        if not parent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Parent folder not found"
            )

        if parent.type != NodeType.FOLDER:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Parent must be a folder",
            )

    # prevent duplicate filename (same folder)
    query = select(Node).where(
        Node.parent_id == payload.parent_id,
        Node.owner_id == current_user.id,
        Node.name == payload.filename,
        Node.deleted_at.is_(None),
    )
    result = await db.execute(query)
    existing_folder = result.scalar_one_or_none()

    if existing_folder:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="File with same name already exists in this folder",
        )

    upload_id = uuid.uuid7()

    tmp_dir = config.upload_tmp_dir
    os.makedirs(tmp_dir, exist_ok=True)

    storage_path = os.path.join(tmp_dir, f"{upload_id}.bin")

    try:
        with open(storage_path, "wb") as f:
            f.truncate(payload.total_size)
    except OSError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to allocate file: {str(e)}",
        )

    session = UploadSession(
        id=upload_id,
        owner_id=current_user.id,
        filename=payload.filename,
        mime_type=payload.mime_type,
        total_size=payload.total_size,
        chunk_size=config.upload_chunk_size,
        uploaded_bytes=0,
        storage_path=storage_path,
        parent_id=payload.parent_id,
        status=UploadStatus.INITIATED,
    )
    db.add(session)

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        if os.path.exists(storage_path):
            os.remove(storage_path)
        raise HTTPException(status.HTTP_409_CONFLICT, "Upload session conflict")

    return InitializeUploadResponse(
        upload_id=upload_id, chunk_size=config.upload_chunk_size
    )


@uploads_router_v1.head("/{upload_id}")
def get_upload_status(upload_id: str):
    pass


@uploads_router_v1.put("/{upload_id}/chunks")
def upload_chunk(upload_id: str):
    pass


@uploads_router_v1.post("/{upload_id}/complete")
def finalize_upload(upload_id: str):
    pass

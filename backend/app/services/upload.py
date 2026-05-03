import errno
import os
import uuid
from typing import cast

from fastapi import status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.exceptions import (
    AlreadyExistsException,
    AppException,
    BadRequestException,
    NotFoundException,
)
from app.core.config import Settings
from app.models.node import Node, NodeType
from app.models.upload_session import UploadSession, UploadStatus
from app.models.user import User
from app.schemas.upload import InitializeUploadRequest, InitializeUploadResponse


async def initialize_upload_service(
    payload: InitializeUploadRequest,
    db: AsyncSession,
    config: Settings,
    current_user: User,
) -> InitializeUploadResponse:
    if payload.parent_id:
        query = select(Node).where(
            Node.id == payload.parent_id,
            Node.owner_id == current_user.id,
            Node.deleted_at.is_(None),
        )
        result = await db.execute(query)
        parent = result.scalar_one_or_none()
        if not parent:
            raise NotFoundException("Node", str(payload.parent_id))

        if parent.type != NodeType.FOLDER:
            raise BadRequestException(
                "Parent must be a folder", details={"parent_type": parent.type}
            )

    # prevent duplicate filename (same folder)
    query = select(Node).where(
        Node.parent_id == payload.parent_id,
        Node.owner_id == current_user.id,
        Node.name == payload.filename,
        Node.deleted_at.is_(None),
    )
    result = await db.execute(query)
    existing = result.scalar_one_or_none()

    if existing:
        raise AlreadyExistsException("Node", "name", payload.filename)

    upload_id = uuid.uuid7()

    tmp_dir = config.upload_tmp_dir
    os.makedirs(tmp_dir, exist_ok=True)

    storage_path = os.path.join(tmp_dir, f"{upload_id}.bin")

    try:
        with open(storage_path, "wb") as f:
            f.truncate(payload.total_size)
    except OSError as e:
        error_code = "FILE_ALLOCATION_FAILED"

        if e.errno == errno.ENOSPC:
            error_code = "DISK_FULL"
        elif e.errno == errno.EACCES:
            error_code = "PERMISSION_DENIED"

        raise AppException(
            error_code=error_code,
            message=f"Failed to allocate file: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            details={
                "errno": e.errno,
                "error_name": errno.errorcode.get(cast(int, e.errno), "UNKNOWN"),
                "path": storage_path,
                "requested_size": payload.total_size,
            },
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
        raise AlreadyExistsException("UploadSession", "id", str(upload_id))

    return InitializeUploadResponse(
        upload_id=upload_id, chunk_size=config.upload_chunk_size
    )


async def get_upload_status_service(upload_id: str):
    pass

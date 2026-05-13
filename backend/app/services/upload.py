import errno
import os
import shutil
import uuid
from typing import cast

from fastapi import Request, Response, status
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
from app.tasks.uploads import generate_file_preview


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


async def get_upload_status_service(
    upload_id: uuid.UUID, db: AsyncSession, response: Response, current_user: User
) -> Response:
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


async def upload_chunk_service(
    upload_id: uuid.UUID, request: Request, db: AsyncSession, current_user: User
):
    query = select(UploadSession).where(
        UploadSession.id == upload_id, UploadSession.owner_id == current_user.id
    )
    result = await db.execute(query)
    session = result.scalar_one_or_none()

    if not session:
        raise NotFoundException("UploadSession", str(upload_id))

    expected = session.uploaded_bytes
    try:
        got = int(request.headers.get("Upload-Offset", "-1"))
    except ValueError:
        raise BadRequestException(
            "Invalid Upload-Offset header", details={"expected": expected, "got": got}
        )

    if got != expected:
        raise AlreadyExistsException("UploadSession", "uploaded_bytes", str(expected))

    written = 0
    try:
        with open(session.storage_path, "r+b") as f:
            f.seek(expected)

            async for chunk in request.stream():
                if not chunk:
                    continue

                # prevent overflow
                if expected + written + len(chunk) > session.total_size:
                    raise BadRequestException(
                        "Chunk exceeds total file size",
                        details={
                            "chunk_size": expected + written + len(chunk),
                            "total_size": session.total_size,
                        },
                    )

                f.write(chunk)
                written += len(chunk)
    except FileNotFoundError:
        raise AppException(
            error_code="FILE_NOT_FOUND",
            message="Upload file missing on disk",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    session.uploaded_bytes += written
    session.status = UploadStatus.UPLOADING

    await db.commit()
    return {"received": written, "offset": session.uploaded_bytes}


async def finalize_upload_service(
    upload_id: uuid.UUID, db: AsyncSession, config: Settings, current_user: User
):
    query = select(UploadSession).where(
        UploadSession.id == upload_id, UploadSession.owner_id == current_user.id
    )
    result = await db.execute(query)
    session = result.scalar_one_or_none()

    if not session:
        raise NotFoundException("UploadSession", str(upload_id))

    if session.uploaded_bytes != session.total_size:
        raise BadRequestException(
            f"Upload Incomplete ({session.uploaded_bytes}/{session.total_size})",
            details={
                "offset": session.uploaded_bytes,
                "total_size": session.total_size,
            },
        )

    if session.status == UploadStatus.COMPLETED:
        return {"ok": True}  # idempotent

    tmp_path = session.storage_path
    if not os.path.exists(tmp_path):
        raise AppException(
            error_code="PATH_NOT_EXISTS",
            message="Upload file missing on disk",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    # move file to permanent location
    final_dir = config.upload_final_dir
    os.makedirs(final_dir, exist_ok=True)

    final_filename = f"{uuid.uuid7()}_{session.filename}"
    final_path = os.path.join(final_dir, final_filename)

    try:
        shutil.move(tmp_path, final_path)
    except OSError as e:
        raise AppException(
            error_code="OS_ERROR", message=f"Failed to move file: {str(e)}"
        )

    node = Node(
        name=session.filename,
        type=NodeType.FILE,
        parent_id=session.parent_id,
        owner_id=current_user.id,
        size=session.total_size,
        mime_type=session.mime_type,
        storage_path=final_path,
    )

    db.add(node)

    session.status = UploadStatus.COMPLETED
    await db.commit()
    await db.refresh(node)

    generate_file_preview.delay(str(node.id))

    return {
        "file_id": str(node.id),
        "path": final_path,
        "bytes": session.total_size,
    }

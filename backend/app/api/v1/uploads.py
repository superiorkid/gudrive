import os
import shutil
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_async_db_session, get_current_active_user
from app.common.exceptions import (
    AlreadyExistsException,
    AppException,
    BadRequestException,
    NotFoundException,
)
from app.core.config import Settings, get_configs
from app.models.node import Node, NodeType
from app.models.upload_session import UploadSession, UploadStatus
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
async def upload_chunk(
    upload_id: uuid.UUID,
    request: Request,
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
    return {"ok": True, "received": written, "offset": session.uploaded_bytes}


@uploads_router_v1.post("/{upload_id}/complete")
async def finalize_upload(
    upload_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_async_db_session)],
    config: Annotated[Settings, Depends(get_configs)],
    current_user: Annotated[User, Depends(get_current_active_user)],
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

    return {
        "ok": True,
        "file_id": str(node.id),
        "path": final_path,
        "bytes": session.total_size,
    }

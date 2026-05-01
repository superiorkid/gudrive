import enum
import uuid
from typing import Optional

from sqlalchemy import UUID, BigInteger, Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.mixins import TimestampMixin


class UploadStatus(enum.Enum):
    INITIATED = "initiated"
    UPLOADING = "uploading"
    COMPLETED = "completed"
    FAILED = "failed"


class UploadSession(Base, TimestampMixin):
    __tablename__ = "upload_sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid7
    )
    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    filename: Mapped[str] = mapped_column(String, nullable=False)
    mime_type: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    total_size: Mapped[int] = mapped_column(BigInteger, nullable=False)
    chunk_size: Mapped[int] = mapped_column(BigInteger, nullable=False)
    uploaded_bytes: Mapped[int] = mapped_column(BigInteger, default=0)
    storage_path: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[UploadStatus] = mapped_column(
        Enum(UploadStatus), default=UploadStatus.INITIATED
    )
    parent_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("nodes.id")
    )

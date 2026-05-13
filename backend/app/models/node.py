import enum
import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import (
    UUID,
    BigInteger,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from app.database import Base
from app.models.mixins import TimestampMixin


class NodeType(enum.Enum):
    FILE = "file"
    FOLDER = "folder"


class PreviewStatus(enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    READY = "ready"
    FAILED = "failed"


class Node(TimestampMixin, Base):
    __tablename__ = "nodes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid7
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    type: Mapped[NodeType] = mapped_column(Enum(NodeType), nullable=False)
    parent_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("nodes.id", ondelete="CASCADE"), nullable=True
    )
    parent: Mapped[Optional["Node"]] = relationship(
        "Node", remote_side="Node.id", back_populates="children"
    )
    children: Mapped[List["Node"]] = relationship(
        "Node",
        back_populates="parent",
    )
    owner: Mapped["User"] = relationship(
        "User",
        back_populates="nodes",
    )
    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    size: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    mime_type: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    storage_path: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    deleted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    preview_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    preview_status: Mapped[PreviewStatus] = mapped_column(
        Enum(PreviewStatus),
        nullable=False,
        default=PreviewStatus.PENDING,
    )

    __table_args__ = (
        Index("idx_parent_id", "parent_id"),
        Index("idx_owner_id", "owner_id"),
        Index("idx_deleted_at", "deleted_at"),
        UniqueConstraint(
            "parent_id",
            "name",
            "owner_id",
            name="uq_node_name_per_parent",
        ),
    )

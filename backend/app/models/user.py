import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import UUID, DateTime, String
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import TimestampMixin


class User(TimestampMixin, Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid7
    )
    email: Mapped[str] = mapped_column(
        String(255), nullable=False, unique=True, index=True
    )
    username: Mapped[str] = mapped_column(
        String(50), nullable=False, unique=True, index=True
    )
    hashed_password: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    verified_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    nodes: Mapped[List["Node"]] = relationship(
        "Node",
        back_populates="owner",
    )
    starred_nodes: Mapped[List["Node"]] = relationship(
        "Node",
        secondary="starred_nodes",
        back_populates="starred_by_users",
    )

    @hybrid_property
    def is_verified(self):
        return self.verified_at is not None

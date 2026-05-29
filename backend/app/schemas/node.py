import uuid
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class CreateNodeSchema(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    parent_id: uuid.UUID | None = None

    @field_validator("name")
    @classmethod
    def _normalize_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Folder name is required")
        # block path separators
        if "/" in v or "\\" in v:
            raise ValueError("Name cannot contain path separators.")
        return v


class UpdateNodeSchema(BaseModel):
    name: Optional[str] = None
    parent_id: Optional[uuid.UUID] = None
    mode: str  # 'copy' or 'cut'


class RenameNodeSchema(BaseModel):
    new_name: str

    @field_validator("new_name")
    @classmethod
    def _normalize_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Name is required")
        # block path separators
        if "/" in v or "\\" in v:
            raise ValueError("Name cannot contain path separators.")
        return v


class MoveNodeSchema(BaseModel):
    node_ids: list[uuid.UUID]
    parent_id: Optional[uuid.UUID] = None


class CopyNodeSchema(BaseModel):
    node_ids: list[uuid.UUID]
    parent_id: Optional[uuid.UUID] = None


class BulkDeleteNodeSchema(BaseModel):
    node_ids: list[uuid.UUID]


class BulkRestoreNodeSchema(BaseModel):
    node_ids: list[uuid.UUID]


class BulkForceDeleteNodeSchema(BaseModel):
    node_ids: list[uuid.UUID]


class BulkToggleStarNodeSchema(BaseModel):
    node_ids: list[uuid.UUID]

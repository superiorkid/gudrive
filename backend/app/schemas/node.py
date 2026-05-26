import uuid
from typing import Optional

from pydantic import BaseModel


class CreateNodeSchema(BaseModel):
    name: str
    parent_id: Optional[uuid.UUID]


class UpdateNodeSchema(BaseModel):
    name: Optional[str] = None
    parent_id: Optional[uuid.UUID] = None
    mode: str  # 'copy' or 'cut'


class RenameNodeSchema(BaseModel):
    new_name: str


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

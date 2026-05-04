import uuid
from typing import Optional

from pydantic import BaseModel


class CreateNodeSchema(BaseModel):
    name: str
    parent_id: Optional[uuid.UUID]


class UpdateNodeSchema(BaseModel):
    name: Optional[str] = None
    parent_id: Optional[uuid.UUID] = None


class UpdateNodeOut(BaseModel):
    pass

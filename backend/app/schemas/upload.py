import uuid
from typing import Optional

from pydantic import BaseModel


class InitializeUploadRequest(BaseModel):
    filename: str
    total_size: int
    mime_type: Optional[str] = None
    parent_id: Optional[uuid.UUID] = None


class InitializeUploadResponse(BaseModel):
    upload_id: uuid.UUID
    chunk_size: int

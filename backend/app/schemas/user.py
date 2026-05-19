from typing import Self
from uuid import UUID

from pydantic import BaseModel, model_validator


class CreateUser(BaseModel):
    username: str
    email: str
    password: str
    confirm_password: str

    @model_validator(mode="after")
    def check_password_match(self) -> Self:
        if self.password != self.confirm_password:
            raise ValueError("Password does not match")
        return self


class UserResponse(BaseModel):
    id: UUID
    email: str
    username: str
    is_verified: bool

    class Config:
        from_attributes = True

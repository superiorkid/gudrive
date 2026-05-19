from typing import Self

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

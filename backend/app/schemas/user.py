import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    email: EmailStr
    name: str
    roles: list[str] = []
    team_type: str = "internal"


class UserCreate(UserBase):
    password: str | None = None


class UserUpdate(BaseModel):
    name: str | None = None
    roles: list[str] | None = None
    is_active: bool | None = None
    team_type: str | None = None


class UserOut(UserBase):
    id: uuid.UUID
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}

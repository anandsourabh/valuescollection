import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr


class SignedLinkCreate(BaseModel):
    contributor_email: EmailStr
    assignment_ids: list[uuid.UUID] | None = None  # None = all assignments for this contributor
    link_model: str = "bundled"
    expires_days: int = 30


class SignedLinkOut(BaseModel):
    id: uuid.UUID
    campaign_id: uuid.UUID
    contributor_email: str
    link_model: str
    expires_at: datetime
    is_revoked: bool
    accessed_at: datetime | None
    created_at: datetime
    url: str | None = None  # assembled by the endpoint

    model_config = {"from_attributes": True}

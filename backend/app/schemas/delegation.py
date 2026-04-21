import uuid
from datetime import datetime, date
from pydantic import BaseModel


class DelegationCreate(BaseModel):
    assignment_id: uuid.UUID | None = None  # None = OOO blanket
    delegator_id: uuid.UUID
    delegate_id: uuid.UUID
    level: int = 1  # 1 or 2
    delegation_type: str = "specific"  # specific | ooo_blanket
    ooo_start: date | None = None
    ooo_end: date | None = None
    reason: str | None = None


class OOODelegationSet(BaseModel):
    delegate_id: uuid.UUID
    ooo_start: date
    ooo_end: date
    reason: str | None = None


class DelegationOut(BaseModel):
    id: uuid.UUID
    assignment_id: uuid.UUID | None
    delegator_id: uuid.UUID
    delegate_id: uuid.UUID
    level: int
    delegation_type: str
    ooo_start: date | None
    ooo_end: date | None
    is_active: bool
    reason: str | None
    created_by_id: uuid.UUID
    created_at: datetime
    revoked_at: datetime | None

    model_config = {"from_attributes": True}

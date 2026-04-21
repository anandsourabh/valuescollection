import uuid
from datetime import datetime, date
from pydantic import BaseModel


class CampaignCreate(BaseModel):
    name: str
    description: str | None = None
    due_date: date
    sla_days: int = 21
    link_model: str = "bundled"
    breach_policy: str = "escalate_and_continue"
    portfolio_ids: list[uuid.UUID] = []


class CampaignUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    due_date: date | None = None
    sla_days: int | None = None
    link_model: str | None = None
    breach_policy: str | None = None


class CampaignOut(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    owner_id: uuid.UUID
    status: str
    due_date: date
    sla_days: int
    link_model: str
    breach_policy: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ExtendDeadlineRequest(BaseModel):
    days: int
    reason_code: str
    reason_note: str | None = None
    notify_assignees: bool = True

import uuid
from datetime import datetime, date
from pydantic import BaseModel


class AssignmentCreate(BaseModel):
    property_id: uuid.UUID
    primary_assignee_id: uuid.UUID | None = None
    external_email: str | None = None
    assignee_type: str = "internal"
    due_date: date | None = None
    # Delegation at creation time
    delegate_l1_id: uuid.UUID | None = None
    delegate_l2_id: uuid.UUID | None = None


class AssignmentUpdate(BaseModel):
    primary_assignee_id: uuid.UUID | None = None
    external_email: str | None = None
    assignee_type: str | None = None
    due_date: date | None = None
    status: str | None = None


class AssignmentOut(BaseModel):
    id: uuid.UUID
    campaign_id: uuid.UUID
    property_id: uuid.UUID
    primary_assignee_id: uuid.UUID | None
    external_email: str | None
    assignee_type: str
    status: str
    due_date: date | None
    reminder_count: int
    last_reminded_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class BulkActionRequest(BaseModel):
    action: str  # remind | reassign | extend_deadline | delegate | bulk_approve
    ids: list[uuid.UUID]
    payload: dict = {}


class ExtendAssignmentDeadlineRequest(BaseModel):
    days: int
    reason_code: str
    reason_note: str | None = None
    notify_assignees: bool = True

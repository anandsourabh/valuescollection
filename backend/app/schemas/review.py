import uuid
from datetime import datetime
from pydantic import BaseModel


class ReviewCreate(BaseModel):
    decision: str  # approved | rejected | requested_info
    comment: str | None = None
    reason_code: str | None = None
    requires_escalation: bool = False


class ReviewOut(BaseModel):
    id: uuid.UUID
    submission_id: uuid.UUID
    reviewer_id: uuid.UUID
    decision: str
    comment: str | None
    reason_code: str | None
    requires_escalation: bool
    created_at: datetime

    model_config = {"from_attributes": True}

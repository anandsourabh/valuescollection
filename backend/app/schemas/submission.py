import uuid
from datetime import datetime
from pydantic import BaseModel


class SubmissionUpsert(BaseModel):
    data: dict
    actor_type: str = "primary"


class SubmissionOut(BaseModel):
    id: uuid.UUID
    assignment_id: uuid.UUID
    submitted_by_id: uuid.UUID | None
    actor_type: str
    data: dict
    total_tiv: float | None
    status: str
    version: int
    submitted_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

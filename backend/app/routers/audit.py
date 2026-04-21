import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.audit import AuditEvent
from app.models.assignment import Assignment
from app.deps import CurrentUser

router = APIRouter(prefix="/api", tags=["audit"])


@router.get("/campaigns/{campaign_id}/audit")
async def get_campaign_audit(
    campaign_id: uuid.UUID,
    limit: int = 50,
    offset: int = 0,
    user: CurrentUser = Depends(),
    db: AsyncSession = Depends(get_db),
):
    # Get assignment IDs for this campaign
    result = await db.execute(
        select(Assignment.id).where(Assignment.campaign_id == campaign_id)
    )
    assignment_ids = [row[0] for row in result]

    result2 = await db.execute(
        select(AuditEvent)
        .where(
            (AuditEvent.entity_type == "campaign") & (AuditEvent.entity_id == campaign_id) |
            (AuditEvent.entity_type == "assignment") & (AuditEvent.entity_id.in_(assignment_ids))
        )
        .order_by(AuditEvent.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    events = result2.scalars().all()
    return [
        {
            "id": str(e.id),
            "event_type": e.event_type,
            "actor_id": str(e.actor_id) if e.actor_id else None,
            "actor_ip": e.actor_ip,
            "entity_type": e.entity_type,
            "entity_id": str(e.entity_id),
            "payload": e.payload,
            "created_at": e.created_at.isoformat(),
        }
        for e in events
    ]


@router.get("/audit")
async def get_global_audit(
    limit: int = 100,
    offset: int = 0,
    user: CurrentUser = Depends(),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AuditEvent)
        .order_by(AuditEvent.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return result.scalars().all()

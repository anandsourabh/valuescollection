import uuid
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit import AuditEvent


async def emit(
    db: AsyncSession,
    event_type: str,
    entity_type: str,
    entity_id: uuid.UUID,
    actor_id: uuid.UUID | None = None,
    actor_ip: str | None = None,
    payload: dict | None = None,
) -> None:
    event = AuditEvent(
        event_type=event_type,
        entity_type=entity_type,
        entity_id=entity_id,
        actor_id=actor_id,
        actor_ip=actor_ip,
        payload=payload or {},
    )
    db.add(event)
    # Flush but don't commit — caller owns the transaction
    await db.flush()

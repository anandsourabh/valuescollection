import uuid
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.delegation import Delegation
from app.models.assignment import Assignment
from app.models.user import User
from app.schemas.delegation import DelegationCreate
from app.services import audit_service, notification_service


async def create_delegation(
    db: AsyncSession,
    data: DelegationCreate,
    created_by_id: uuid.UUID,
) -> Delegation:
    delegation = Delegation(
        assignment_id=data.assignment_id,
        delegator_id=data.delegator_id,
        delegate_id=data.delegate_id,
        level=data.level,
        delegation_type=data.delegation_type,
        ooo_start=data.ooo_start,
        ooo_end=data.ooo_end,
        reason=data.reason,
        created_by_id=created_by_id,
    )
    db.add(delegation)
    await db.flush()

    # Fetch delegate info for notification
    result = await db.execute(select(User).where(User.id == data.delegate_id))
    delegate = result.scalar_one_or_none()

    entity_id = data.assignment_id or data.delegator_id
    await audit_service.emit(
        db,
        event_type="delegation.created",
        entity_type="delegation",
        entity_id=delegation.id,
        actor_id=created_by_id,
        payload={
            "delegator_id": str(data.delegator_id),
            "delegate_id": str(data.delegate_id),
            "level": data.level,
            "type": data.delegation_type,
        },
    )

    if delegate and data.assignment_id:
        result2 = await db.execute(select(Assignment).where(Assignment.id == data.assignment_id))
        assignment = result2.scalar_one_or_none()
        if assignment:
            from app.models.portfolio import Property
            result3 = await db.execute(select(Property).where(Property.id == assignment.property_id))
            prop = result3.scalar_one_or_none()
            address = prop.address if prop else "property"
            await notification_service.notify_assignment_delegated(
                delegate_email=delegate.email,
                delegate_name=delegate.name,
                delegator_name="",
                property_address=address,
                level=data.level,
            )

    return delegation


async def revoke_delegation(
    db: AsyncSession,
    delegation_id: uuid.UUID,
    revoked_by_id: uuid.UUID,
) -> Delegation:
    result = await db.execute(select(Delegation).where(Delegation.id == delegation_id))
    delegation = result.scalar_one_or_none()
    if not delegation:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Delegation not found")

    delegation.is_active = False
    delegation.revoked_at = datetime.now(timezone.utc)
    delegation.revoked_by_id = revoked_by_id
    await db.flush()

    await audit_service.emit(
        db,
        event_type="delegation.revoked",
        entity_type="delegation",
        entity_id=delegation_id,
        actor_id=revoked_by_id,
    )
    return delegation


async def get_active_delegations_for_assignment(
    db: AsyncSession, assignment_id: uuid.UUID
) -> list[Delegation]:
    result = await db.execute(
        select(Delegation).where(
            Delegation.assignment_id == assignment_id,
            Delegation.is_active == True,  # noqa
        ).order_by(Delegation.level)
    )
    return list(result.scalars())


async def get_my_delegations(db: AsyncSession, user_id: uuid.UUID) -> list[Delegation]:
    result = await db.execute(
        select(Delegation).where(
            (Delegation.delegator_id == user_id) | (Delegation.delegate_id == user_id),
            Delegation.is_active == True,  # noqa
        )
    )
    return list(result.scalars())

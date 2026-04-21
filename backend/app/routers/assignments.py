import uuid
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.assignment import Assignment
from app.models.campaign import Campaign
from app.models.deadline_extension import DeadlineExtension
from app.models.delegation import Delegation
from app.models.user import User
from app.schemas.assignment import (
    AssignmentCreate, AssignmentUpdate, AssignmentOut,
    BulkActionRequest, ExtendAssignmentDeadlineRequest,
)
from app.deps import CurrentUser
from app.services import audit_service, notification_service, delegation_service
from app.schemas.delegation import DelegationCreate

router = APIRouter(tags=["assignments"])


@router.get("/api/campaigns/{campaign_id}/assignments", response_model=list[AssignmentOut])
async def list_campaign_assignments(
    campaign_id: uuid.UUID,
    status: str | None = None,
    user: CurrentUser = Depends(),
    db: AsyncSession = Depends(get_db),
):
    q = select(Assignment).where(Assignment.campaign_id == campaign_id)
    if status:
        q = q.where(Assignment.status == status)
    q = q.order_by(Assignment.created_at)
    result = await db.execute(q)
    return result.scalars().all()


@router.post("/api/campaigns/{campaign_id}/assignments", response_model=AssignmentOut, status_code=201)
async def create_assignment(
    campaign_id: uuid.UUID,
    body: AssignmentCreate,
    user: CurrentUser = Depends(),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Campaign).where(Campaign.id == campaign_id))
    campaign = result.scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    assignment = Assignment(
        campaign_id=campaign_id,
        property_id=body.property_id,
        primary_assignee_id=body.primary_assignee_id,
        external_email=body.external_email,
        assignee_type=body.assignee_type,
        due_date=body.due_date or campaign.due_date,
    )
    db.add(assignment)
    await db.flush()

    # Create first-level delegate if provided
    if body.delegate_l1_id and body.primary_assignee_id:
        await delegation_service.create_delegation(
            db,
            DelegationCreate(
                assignment_id=assignment.id,
                delegator_id=body.primary_assignee_id,
                delegate_id=body.delegate_l1_id,
                level=1,
            ),
            created_by_id=user.id,
        )

    # Create second-level delegate if provided
    if body.delegate_l2_id and body.primary_assignee_id:
        await delegation_service.create_delegation(
            db,
            DelegationCreate(
                assignment_id=assignment.id,
                delegator_id=body.primary_assignee_id,
                delegate_id=body.delegate_l2_id,
                level=2,
            ),
            created_by_id=user.id,
        )

    await audit_service.emit(db, "assignment.created", "assignment", assignment.id, actor_id=user.id)
    return assignment


@router.get("/api/assignments/{assignment_id}", response_model=AssignmentOut)
async def get_assignment(
    assignment_id: uuid.UUID,
    user: CurrentUser = Depends(),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Assignment).where(Assignment.id == assignment_id))
    a = result.scalar_one_or_none()
    if not a:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return a


@router.put("/api/assignments/{assignment_id}", response_model=AssignmentOut)
async def update_assignment(
    assignment_id: uuid.UUID,
    body: AssignmentUpdate,
    user: CurrentUser = Depends(),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Assignment).where(Assignment.id == assignment_id))
    a = result.scalar_one_or_none()
    if not a:
        raise HTTPException(status_code=404, detail="Assignment not found")

    old_status = a.status
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(a, field, value)
    await db.flush()

    if body.status and body.status != old_status:
        await audit_service.emit(
            db, "assignment.status_changed", "assignment", assignment_id,
            actor_id=user.id,
            payload={"from": old_status, "to": body.status},
        )
    return a


@router.post("/api/assignments/{assignment_id}/extend-deadline", response_model=AssignmentOut)
async def extend_assignment_deadline(
    assignment_id: uuid.UUID,
    body: ExtendAssignmentDeadlineRequest,
    user: CurrentUser = Depends(),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Assignment).where(Assignment.id == assignment_id))
    a = result.scalar_one_or_none()
    if not a:
        raise HTTPException(status_code=404, detail="Assignment not found")

    original_due = a.due_date
    new_due = original_due + timedelta(days=body.days)

    ext = DeadlineExtension(
        entity_type="assignment",
        entity_id=assignment_id,
        extended_by_id=user.id,
        original_due=original_due,
        new_due=new_due,
        reason_code=body.reason_code,
        reason_note=body.reason_note,
        notify_assignees=body.notify_assignees,
    )
    db.add(ext)
    a.due_date = new_due
    await db.flush()

    await audit_service.emit(
        db, "deadline.extended", "assignment", assignment_id,
        actor_id=user.id,
        payload={"original_due": str(original_due), "new_due": str(new_due)},
    )
    return a


@router.post("/api/assignments/bulk-action")
async def bulk_action(
    body: BulkActionRequest,
    user: CurrentUser = Depends(),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Assignment).where(Assignment.id.in_(body.ids)))
    assignments = list(result.scalars())

    if body.action == "remind":
        for a in assignments:
            a.reminder_count += 1
            await audit_service.emit(db, "reminder.sent", "assignment", a.id, actor_id=user.id)
        return {"detail": f"Reminders sent to {len(assignments)} assignees"}

    elif body.action == "reassign":
        new_assignee_id = body.payload.get("assignee_id")
        if not new_assignee_id:
            raise HTTPException(status_code=400, detail="assignee_id required")
        for a in assignments:
            a.primary_assignee_id = uuid.UUID(new_assignee_id)
        await db.flush()
        return {"detail": f"{len(assignments)} assignments reassigned"}

    elif body.action == "bulk_approve":
        for a in assignments:
            old = a.status
            a.status = "approved"
            await audit_service.emit(
                db, "assignment.status_changed", "assignment", a.id,
                actor_id=user.id, payload={"from": old, "to": "approved"},
            )
        await db.flush()
        return {"detail": f"{len(assignments)} assignments approved"}

    elif body.action == "extend_deadline":
        days = body.payload.get("days", 14)
        reason_code = body.payload.get("reason_code", "unspecified")
        for a in assignments:
            original_due = a.due_date
            new_due = original_due + timedelta(days=days)
            db.add(DeadlineExtension(
                entity_type="assignment", entity_id=a.id,
                extended_by_id=user.id,
                original_due=original_due, new_due=new_due,
                reason_code=reason_code,
                notify_assignees=body.payload.get("notify_assignees", True),
            ))
            a.due_date = new_due
        await db.flush()
        return {"detail": f"Deadlines extended for {len(assignments)} assignments"}

    elif body.action == "delegate":
        delegate_id = body.payload.get("delegate_id")
        level = body.payload.get("level", 1)
        if not delegate_id:
            raise HTTPException(status_code=400, detail="delegate_id required")
        for a in assignments:
            if a.primary_assignee_id:
                await delegation_service.create_delegation(
                    db,
                    DelegationCreate(
                        assignment_id=a.id,
                        delegator_id=a.primary_assignee_id,
                        delegate_id=uuid.UUID(delegate_id),
                        level=level,
                    ),
                    created_by_id=user.id,
                )
        return {"detail": f"Delegated {len(assignments)} assignments to delegate"}

    raise HTTPException(status_code=400, detail=f"Unknown action: {body.action}")

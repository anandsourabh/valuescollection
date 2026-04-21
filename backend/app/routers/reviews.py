import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.submission import Submission
from app.models.assignment import Assignment
from app.models.review import Review
from app.models.portfolio import Property
from app.schemas.review import ReviewCreate, ReviewOut
from app.deps import CurrentUser
from app.services import audit_service
from app.utils.tiv_calculator import compute_change_flags

router = APIRouter(tags=["reviews"])


@router.get("/api/reviews/queue")
async def get_review_queue(
    user: CurrentUser = Depends(),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Submission, Assignment, Property)
        .join(Assignment, Submission.assignment_id == Assignment.id)
        .join(Property, Assignment.property_id == Property.id)
        .where(Submission.status == "submitted")
        .order_by(Submission.submitted_at)
    )
    rows = result.all()
    items = []
    for sub, assignment, prop in rows:
        flags = compute_change_flags(sub.data, float(prop.prior_tiv) if prop.prior_tiv else None)
        items.append({
            "submission_id": str(sub.id),
            "assignment_id": str(assignment.id),
            "property_address": prop.address,
            "property_city": prop.city,
            "property_state": prop.state,
            "property_type": prop.property_type,
            "total_tiv": float(sub.total_tiv) if sub.total_tiv else None,
            "prior_tiv": float(prop.prior_tiv) if prop.prior_tiv else None,
            "submitted_at": sub.submitted_at.isoformat() if sub.submitted_at else None,
            "status": assignment.status,
            **flags,
        })
    return items


@router.post("/api/submissions/{submission_id}/review", response_model=ReviewOut)
async def review_submission(
    submission_id: uuid.UUID,
    body: ReviewCreate,
    user: CurrentUser = Depends(),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Submission).where(Submission.id == submission_id))
    sub = result.scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")

    if sub.status not in ("submitted", "under_review"):
        raise HTTPException(status_code=400, detail="Submission is not pending review")

    review = Review(
        submission_id=submission_id,
        reviewer_id=user.id,
        decision=body.decision,
        comment=body.comment,
        reason_code=body.reason_code,
        requires_escalation=body.requires_escalation,
    )
    db.add(review)

    # Update assignment status based on decision
    result2 = await db.execute(select(Assignment).where(Assignment.id == sub.assignment_id))
    assignment = result2.scalar_one_or_none()

    if body.decision == "approved":
        sub.status = "submitted"  # stays submitted; assignment gets approved
        if assignment:
            assignment.status = "approved"
    elif body.decision == "rejected":
        sub.status = "draft"  # reopen for editing
        if assignment:
            assignment.status = "rejected"
    elif body.decision == "requested_info":
        if assignment:
            assignment.status = "under_review"

    await db.flush()

    event = "submission.approved" if body.decision == "approved" else "submission.rejected"
    await audit_service.emit(db, event, "submission", submission_id, actor_id=user.id,
                              payload={"decision": body.decision, "reason": body.reason_code})
    return review

import uuid
import os
import aiofiles
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.assignment import Assignment
from app.models.submission import Submission, SubmissionHistory, Attachment
from app.schemas.submission import SubmissionUpsert, SubmissionOut
from app.deps import CurrentUser
from app.services import audit_service
from app.utils.tiv_calculator import calculate_total_tiv
from app.config import settings

router = APIRouter(tags=["submissions"])


async def _get_or_create_submission(db: AsyncSession, assignment_id: uuid.UUID) -> Submission:
    result = await db.execute(select(Submission).where(Submission.assignment_id == assignment_id))
    sub = result.scalar_one_or_none()
    if not sub:
        sub = Submission(assignment_id=assignment_id)
        db.add(sub)
        await db.flush()
    return sub


@router.get("/api/assignments/{assignment_id}/submission", response_model=SubmissionOut)
async def get_submission(
    assignment_id: uuid.UUID,
    user: CurrentUser = Depends(),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Submission).where(Submission.assignment_id == assignment_id))
    sub = result.scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=404, detail="No submission yet")
    return sub


@router.put("/api/assignments/{assignment_id}/submission", response_model=SubmissionOut)
async def upsert_submission(
    assignment_id: uuid.UUID,
    body: SubmissionUpsert,
    user: CurrentUser = Depends(),
    db: AsyncSession = Depends(get_db),
):
    # Verify assignment exists
    result = await db.execute(select(Assignment).where(Assignment.id == assignment_id))
    assignment = result.scalar_one_or_none()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    sub = await _get_or_create_submission(db, assignment_id)

    if sub.status == "submitted":
        raise HTTPException(status_code=400, detail="Cannot edit a submitted form — reopen required")

    # Save history snapshot
    if sub.data:
        history = SubmissionHistory(
            submission_id=sub.id,
            data=sub.data,
            version=sub.version,
            saved_by_id=user.id,
        )
        db.add(history)

    sub.data = body.data
    sub.actor_type = body.actor_type
    sub.submitted_by_id = user.id
    sub.total_tiv = calculate_total_tiv(body.data)
    sub.version += 1

    # Update assignment status to in_progress
    if assignment.status == "not_started":
        assignment.status = "in_progress"

    await db.flush()
    await audit_service.emit(db, "submission.draft_saved", "submission", sub.id, actor_id=user.id)
    return sub


@router.post("/api/assignments/{assignment_id}/submission/submit", response_model=SubmissionOut)
async def submit_submission(
    assignment_id: uuid.UUID,
    user: CurrentUser = Depends(),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Assignment).where(Assignment.id == assignment_id))
    assignment = result.scalar_one_or_none()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    sub = await _get_or_create_submission(db, assignment_id)
    if not sub.data:
        raise HTTPException(status_code=400, detail="No data to submit")

    sub.status = "submitted"
    sub.submitted_at = datetime.now(timezone.utc)
    sub.submitted_by_id = user.id
    sub.total_tiv = calculate_total_tiv(sub.data)

    assignment.status = "submitted"
    await db.flush()

    await audit_service.emit(db, "submission.submitted", "submission", sub.id, actor_id=user.id)
    return sub


@router.post("/api/assignments/{assignment_id}/submission/attachments")
async def upload_attachment(
    assignment_id: uuid.UUID,
    file: UploadFile = File(...),
    user: CurrentUser = Depends(),
    db: AsyncSession = Depends(get_db),
):
    sub = await _get_or_create_submission(db, assignment_id)

    upload_dir = os.path.join(settings.upload_dir, str(assignment_id))
    os.makedirs(upload_dir, exist_ok=True)

    safe_filename = f"{uuid.uuid4()}_{file.filename}"
    filepath = os.path.join(upload_dir, safe_filename)

    async with aiofiles.open(filepath, "wb") as f:
        content = await file.read()
        await f.write(content)

    attachment = Attachment(
        submission_id=sub.id,
        filename=file.filename,
        filepath=filepath,
        mime_type=file.content_type,
        size_bytes=len(content),
        uploaded_by=user.id,
    )
    db.add(attachment)
    await db.flush()

    return {
        "id": str(attachment.id),
        "filename": file.filename,
        "size_bytes": len(content),
    }


@router.get("/api/submissions/{submission_id}/history")
async def get_submission_history(
    submission_id: uuid.UUID,
    user: CurrentUser = Depends(),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(SubmissionHistory)
        .where(SubmissionHistory.submission_id == submission_id)
        .order_by(SubmissionHistory.version.desc())
    )
    return result.scalars().all()

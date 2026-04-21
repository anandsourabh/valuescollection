import uuid
import secrets
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from passlib.context import CryptContext

from app.database import get_db
from app.models.signed_link import SignedLink, SignedLinkAssignment
from app.models.assignment import Assignment
from app.schemas.signed_link import SignedLinkCreate, SignedLinkOut
from app.deps import CurrentUser, get_external_token_payload
from app.utils.jwt import create_external_token
from app.config import settings
from app.services import audit_service, notification_service

router = APIRouter(tags=["signed_links"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@router.post("/api/campaigns/{campaign_id}/signed-links", response_model=SignedLinkOut, status_code=201)
async def create_signed_link(
    campaign_id: uuid.UUID,
    body: SignedLinkCreate,
    user: CurrentUser = Depends(),
    db: AsyncSession = Depends(get_db),
):
    passcode = str(secrets.randbelow(900000) + 100000)  # 6-digit
    passcode_hash = pwd_context.hash(passcode)
    expires_at = datetime.now(timezone.utc) + timedelta(days=body.expires_days)

    # Build the invite JWT (short payload, just the link ID)
    # Full token created after link is saved
    link = SignedLink(
        campaign_id=campaign_id,
        token="pending",  # placeholder; updated below
        contributor_email=body.contributor_email,
        passcode_hash=passcode_hash,
        link_model=body.link_model,
        expires_at=expires_at,
        created_by_id=user.id,
    )
    db.add(link)
    await db.flush()

    # Determine assignment IDs for this link
    if body.assignment_ids:
        assignment_ids = body.assignment_ids
    else:
        # Auto-select all unassigned-or-external assignments for this campaign
        result = await db.execute(
            select(Assignment).where(
                Assignment.campaign_id == campaign_id,
                Assignment.external_email == body.contributor_email,
            )
        )
        assignment_ids = [a.id for a in result.scalars()]

    for aid in assignment_ids:
        db.add(SignedLinkAssignment(signed_link_id=link.id, assignment_id=aid))

    # Generate the actual invite token
    token = create_external_token(str(link.id), [str(a) for a in assignment_ids], body.contributor_email)
    link.token = token
    await db.flush()

    url = f"{settings.frontend_url}/ext/{token}"
    await audit_service.emit(db, "link.issued", "signed_link", link.id, actor_id=user.id)

    # Send email
    await notification_service.send_email(
        body.contributor_email,
        "You have been invited to submit property values",
        f"Access your secure form here: {url}\n\nYour passcode: {passcode}\n(Sent separately for security)",
    )

    result_out = SignedLinkOut.model_validate(link)
    result_out.url = url
    return result_out


@router.get("/api/signed-links/{link_id}", response_model=SignedLinkOut)
async def get_signed_link(
    link_id: uuid.UUID,
    user: CurrentUser = Depends(),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(SignedLink).where(SignedLink.id == link_id))
    link = result.scalar_one_or_none()
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    return link


@router.delete("/api/signed-links/{link_id}", status_code=204)
async def revoke_signed_link(
    link_id: uuid.UUID,
    user: CurrentUser = Depends(),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(SignedLink).where(SignedLink.id == link_id))
    link = result.scalar_one_or_none()
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    link.is_revoked = True
    await db.flush()
    await audit_service.emit(db, "link.revoked", "signed_link", link_id, actor_id=user.id)


@router.get("/api/ext/assignments")
async def get_external_assignments(
    payload: dict = Depends(get_external_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """Return assignments scoped to the external contributor's signed link."""
    assignment_ids = [uuid.UUID(a) for a in payload.get("assignment_ids", [])]
    if not assignment_ids:
        return []

    from app.models.portfolio import Property
    result = await db.execute(
        select(Assignment, Property)
        .join(Property, Assignment.property_id == Property.id)
        .where(Assignment.id.in_(assignment_ids))
        .order_by(Property.address)
    )
    rows = result.all()
    return [
        {
            "assignment_id": str(a.id),
            "status": a.status,
            "due_date": str(a.due_date) if a.due_date else None,
            "property": {
                "id": str(p.id),
                "address": p.address,
                "city": p.city,
                "state": p.state,
                "property_type": p.property_type,
                "prior_tiv": float(p.prior_tiv) if p.prior_tiv else None,
            },
        }
        for a, p in rows
    ]

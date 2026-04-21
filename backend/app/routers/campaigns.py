import uuid
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models.campaign import Campaign
from app.models.portfolio import CampaignPortfolio
from app.models.assignment import Assignment
from app.models.deadline_extension import DeadlineExtension
from app.schemas.campaign import CampaignCreate, CampaignUpdate, CampaignOut, ExtendDeadlineRequest
from app.deps import CurrentUser
from app.services import audit_service

router = APIRouter(prefix="/api/campaigns", tags=["campaigns"])


@router.get("", response_model=list[CampaignOut])
async def list_campaigns(
    status: str | None = None,
    user: CurrentUser = Depends(),
    db: AsyncSession = Depends(get_db),
):
    q = select(Campaign)
    if status:
        q = q.where(Campaign.status == status)
    q = q.order_by(Campaign.created_at.desc())
    result = await db.execute(q)
    return result.scalars().all()


@router.post("", response_model=CampaignOut, status_code=201)
async def create_campaign(
    body: CampaignCreate,
    user: CurrentUser = Depends(),
    db: AsyncSession = Depends(get_db),
):
    campaign = Campaign(
        name=body.name,
        description=body.description,
        owner_id=user.id,
        due_date=body.due_date,
        sla_days=body.sla_days,
        link_model=body.link_model,
        breach_policy=body.breach_policy,
    )
    db.add(campaign)
    await db.flush()

    for pf_id in body.portfolio_ids:
        db.add(CampaignPortfolio(campaign_id=campaign.id, portfolio_id=pf_id))

    await audit_service.emit(db, "campaign.created", "campaign", campaign.id, actor_id=user.id)
    return campaign


@router.get("/{campaign_id}", response_model=CampaignOut)
async def get_campaign(
    campaign_id: uuid.UUID,
    user: CurrentUser = Depends(),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Campaign).where(Campaign.id == campaign_id))
    c = result.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return c


@router.put("/{campaign_id}", response_model=CampaignOut)
async def update_campaign(
    campaign_id: uuid.UUID,
    body: CampaignUpdate,
    user: CurrentUser = Depends(),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Campaign).where(Campaign.id == campaign_id))
    c = result.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(c, field, value)
    await db.flush()
    await audit_service.emit(db, "campaign.updated", "campaign", campaign_id, actor_id=user.id)
    return c


@router.post("/{campaign_id}/activate", response_model=CampaignOut)
async def activate_campaign(
    campaign_id: uuid.UUID,
    user: CurrentUser = Depends(),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Campaign).where(Campaign.id == campaign_id))
    c = result.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if c.status != "draft":
        raise HTTPException(status_code=400, detail="Campaign is not in draft status")

    c.status = "active"
    await db.flush()
    await audit_service.emit(db, "campaign.activated", "campaign", campaign_id, actor_id=user.id)
    return c


@router.post("/{campaign_id}/extend-deadline", response_model=CampaignOut)
async def extend_campaign_deadline(
    campaign_id: uuid.UUID,
    body: ExtendDeadlineRequest,
    user: CurrentUser = Depends(),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Campaign).where(Campaign.id == campaign_id))
    c = result.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")

    original_due = c.due_date
    new_due = original_due + timedelta(days=body.days)

    ext = DeadlineExtension(
        entity_type="campaign",
        entity_id=campaign_id,
        extended_by_id=user.id,
        original_due=original_due,
        new_due=new_due,
        reason_code=body.reason_code,
        reason_note=body.reason_note,
        notify_assignees=body.notify_assignees,
    )
    db.add(ext)

    c.due_date = new_due
    await db.flush()

    await audit_service.emit(
        db, "deadline.extended", "campaign", campaign_id,
        actor_id=user.id,
        payload={"original_due": str(original_due), "new_due": str(new_due), "reason": body.reason_code},
    )

    if body.notify_assignees:
        # Schedule notifications via background (simplified: fire-and-forget log)
        from app.services.notification_service import send_email
        import asyncio
        asyncio.create_task(send_email(
            "all-assignees",
            f"Campaign deadline extended — {c.name}",
            f"The deadline for campaign '{c.name}' has been extended to {new_due}. Reason: {body.reason_code}",
        ))

    return c


@router.get("/{campaign_id}/stats")
async def get_campaign_stats(
    campaign_id: uuid.UUID,
    user: CurrentUser = Depends(),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Campaign).where(Campaign.id == campaign_id))
    c = result.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")

    # Count assignments by status
    result2 = await db.execute(
        select(Assignment.status, func.count(Assignment.id))
        .where(Assignment.campaign_id == campaign_id)
        .group_by(Assignment.status)
    )
    status_counts = {row[0]: row[1] for row in result2}

    return {
        "campaign_id": str(campaign_id),
        "status_counts": status_counts,
        "total": sum(status_counts.values()),
    }

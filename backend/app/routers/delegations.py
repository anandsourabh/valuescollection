import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.delegation import Delegation
from app.schemas.delegation import DelegationCreate, DelegationOut, OOODelegationSet
from app.deps import CurrentUser
from app.services import delegation_service

router = APIRouter(prefix="/api/delegations", tags=["delegations"])


@router.get("", response_model=list[DelegationOut])
async def get_my_delegations(user: CurrentUser = Depends(), db: AsyncSession = Depends(get_db)):
    return await delegation_service.get_my_delegations(db, user.id)


@router.get("/campaign/{campaign_id}", response_model=list[DelegationOut])
async def get_campaign_delegations(
    campaign_id: uuid.UUID,
    user: CurrentUser = Depends(),
    db: AsyncSession = Depends(get_db),
):
    from app.models.assignment import Assignment
    # Fetch all assignment IDs for the campaign
    result = await db.execute(
        select(Assignment.id).where(Assignment.campaign_id == campaign_id)
    )
    assignment_ids = [row[0] for row in result]

    result2 = await db.execute(
        select(Delegation).where(
            Delegation.assignment_id.in_(assignment_ids),
            Delegation.is_active == True,  # noqa
        )
    )
    return result2.scalars().all()


@router.post("", response_model=DelegationOut, status_code=201)
async def create_delegation(
    body: DelegationCreate,
    user: CurrentUser = Depends(),
    db: AsyncSession = Depends(get_db),
):
    return await delegation_service.create_delegation(db, body, created_by_id=user.id)


@router.delete("/{delegation_id}", status_code=204)
async def revoke_delegation(
    delegation_id: uuid.UUID,
    user: CurrentUser = Depends(),
    db: AsyncSession = Depends(get_db),
):
    await delegation_service.revoke_delegation(db, delegation_id, revoked_by_id=user.id)


@router.get("/users/{user_id}/ooo", response_model=DelegationOut | None)
async def get_user_ooo(
    user_id: uuid.UUID,
    user: CurrentUser = Depends(),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Delegation).where(
            Delegation.delegator_id == user_id,
            Delegation.delegation_type == "ooo_blanket",
            Delegation.is_active == True,  # noqa
        )
    )
    return result.scalar_one_or_none()


@router.post("/users/{user_id}/ooo", response_model=DelegationOut, status_code=201)
async def set_user_ooo(
    user_id: uuid.UUID,
    body: OOODelegationSet,
    user: CurrentUser = Depends(),
    db: AsyncSession = Depends(get_db),
):
    return await delegation_service.create_delegation(
        db,
        DelegationCreate(
            assignment_id=None,
            delegator_id=user_id,
            delegate_id=body.delegate_id,
            level=1,
            delegation_type="ooo_blanket",
            ooo_start=body.ooo_start,
            ooo_end=body.ooo_end,
            reason=body.reason,
        ),
        created_by_id=user.id,
    )

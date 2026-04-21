import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.database import get_db
from app.models.portfolio import Portfolio, Property, CampaignPortfolio
from app.deps import CurrentUser

router = APIRouter(tags=["portfolios"])


class PortfolioCreate(BaseModel):
    name: str
    description: str | None = None


class PropertyCreate(BaseModel):
    portfolio_id: uuid.UUID | None = None
    address: str
    city: str | None = None
    state: str | None = None
    country: str = "US"
    property_type: str | None = None
    prior_tiv: float | None = None
    lat: float | None = None
    lng: float | None = None


class PortfolioOut(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    model_config = {"from_attributes": True}


class PropertyOut(BaseModel):
    id: uuid.UUID
    portfolio_id: uuid.UUID | None
    address: str
    city: str | None
    state: str | None
    country: str
    property_type: str | None
    prior_tiv: float | None
    model_config = {"from_attributes": True}


@router.get("/api/portfolios", response_model=list[PortfolioOut])
async def list_portfolios(user: CurrentUser = Depends(), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Portfolio).order_by(Portfolio.name))
    return result.scalars().all()


@router.post("/api/portfolios", response_model=PortfolioOut, status_code=201)
async def create_portfolio(
    body: PortfolioCreate,
    user: CurrentUser = Depends(),
    db: AsyncSession = Depends(get_db),
):
    pf = Portfolio(name=body.name, description=body.description)
    db.add(pf)
    await db.flush()
    return pf


@router.get("/api/portfolios/{portfolio_id}/properties", response_model=list[PropertyOut])
async def list_portfolio_properties(
    portfolio_id: uuid.UUID,
    user: CurrentUser = Depends(),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Property).where(Property.portfolio_id == portfolio_id).order_by(Property.address)
    )
    return result.scalars().all()


@router.post("/api/properties", response_model=PropertyOut, status_code=201)
async def create_property(
    body: PropertyCreate,
    user: CurrentUser = Depends(),
    db: AsyncSession = Depends(get_db),
):
    prop = Property(**body.model_dump())
    db.add(prop)
    await db.flush()
    return prop


@router.get("/api/properties/{property_id}", response_model=PropertyOut)
async def get_property(
    property_id: uuid.UUID,
    user: CurrentUser = Depends(),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Property).where(Property.id == property_id))
    p = result.scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="Property not found")
    return p

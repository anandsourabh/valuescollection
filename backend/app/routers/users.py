import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from passlib.context import CryptContext

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate, UserOut
from app.deps import CurrentUser, require_role

router = APIRouter(prefix="/api/users", tags=["users"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@router.get("/me", response_model=UserOut)
async def get_me(user: CurrentUser):
    return user


@router.get("", response_model=list[UserOut])
async def list_users(
    user: CurrentUser,
    _: User = Depends(require_role("admin", "super_admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).order_by(User.name))
    return result.scalars().all()


@router.post("", response_model=UserOut, status_code=201)
async def create_user(
    body: UserCreate,
    _: User = Depends(require_role("admin", "super_admin")),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already registered")

    hashed = pwd_context.hash(body.password) if body.password else None
    new_user = User(
        email=body.email,
        name=body.name,
        hashed_password=hashed,
        roles=body.roles,
        team_type=body.team_type,
    )
    db.add(new_user)
    await db.flush()
    return new_user


@router.put("/{user_id}", response_model=UserOut)
async def update_user(
    user_id: uuid.UUID,
    body: UserUpdate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    if current_user.id != user_id and "admin" not in (current_user.roles or []):
        raise HTTPException(status_code=403, detail="Cannot update another user")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(user, field, value)
    await db.flush()
    return user

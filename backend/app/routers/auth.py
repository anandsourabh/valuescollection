from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from passlib.context import CryptContext

from app.database import get_db
from app.models.user import User
from app.models.signed_link import SignedLink, SignedLinkAssignment
from app.schemas.auth import (
    LoginRequest, TokenResponse, RefreshRequest,
    ExternalVerifyRequest, ExternalTokenResponse,
)
from app.utils.jwt import create_access_token, create_refresh_token, create_external_token, verify_token
from app.deps import CurrentUser
from datetime import datetime, timezone

router = APIRouter(prefix="/api/auth", tags=["auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if not user or not user.hashed_password:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not pwd_context.verify(body.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Account inactive")

    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(body: RefreshRequest, db: AsyncSession = Depends(get_db)):
    payload = verify_token(body.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    import uuid
    result = await db.execute(select(User).where(User.id == uuid.UUID(payload["sub"])))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
    )


@router.post("/external-verify", response_model=ExternalTokenResponse)
async def external_verify(body: ExternalVerifyRequest, db: AsyncSession = Depends(get_db)):
    payload = verify_token(body.token)
    if not payload or payload.get("type") != "external_invite":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid link token")

    link_id = payload.get("sub")
    import uuid as uuid_mod
    result = await db.execute(select(SignedLink).where(SignedLink.id == uuid_mod.UUID(link_id)))
    link = result.scalar_one_or_none()
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    if link.is_revoked:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Link has been revoked")
    if link.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Link has expired")
    if not pwd_context.verify(body.passcode, link.passcode_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid passcode")

    # Load assignment IDs for this link
    result2 = await db.execute(
        select(SignedLinkAssignment).where(SignedLinkAssignment.signed_link_id == link.id)
    )
    sla_rows = result2.scalars().all()
    assignment_ids = [str(r.assignment_id) for r in sla_rows]

    # Mark first access
    if not link.accessed_at:
        link.accessed_at = datetime.now(timezone.utc)

    token = create_external_token(str(link.id), assignment_ids, link.contributor_email)
    return ExternalTokenResponse(
        access_token=token,
        assignment_ids=assignment_ids,
        link_model=link.link_model,
    )


@router.post("/logout")
async def logout(user: CurrentUser):
    # JWT is stateless; client discards tokens
    return {"detail": "Logged out"}

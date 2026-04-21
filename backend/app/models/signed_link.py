import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class SignedLink(Base):
    __tablename__ = "signed_links"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    campaign_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("campaigns.id"), nullable=False)
    token: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    contributor_email: Mapped[str] = mapped_column(String(255), nullable=False)
    passcode_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    link_model: Mapped[str] = mapped_column(String(20), default="bundled")
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    is_revoked: Mapped[bool] = mapped_column(Boolean, default=False)
    accessed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class SignedLinkAssignment(Base):
    __tablename__ = "signed_link_assignments"

    signed_link_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("signed_links.id"), primary_key=True)
    assignment_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("assignments.id"), primary_key=True)

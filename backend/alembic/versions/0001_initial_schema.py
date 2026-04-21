"""Initial schema

Revision ID: 0001
Revises:
Create Date: 2026-04-21
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=True),
        sa.Column("roles", postgresql.ARRAY(sa.String), server_default="{}"),
        sa.Column("is_active", sa.Boolean, server_default="true"),
        sa.Column("team_type", sa.String(20), server_default="internal"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_table(
        "portfolios",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_table(
        "campaigns",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("owner_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("status", sa.String(20), server_default="draft"),
        sa.Column("due_date", sa.Date, nullable=False),
        sa.Column("sla_days", sa.Integer, server_default="21"),
        sa.Column("link_model", sa.String(20), server_default="bundled"),
        sa.Column("breach_policy", sa.String(40), server_default="escalate_and_continue"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_table(
        "properties",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("portfolio_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("portfolios.id"), nullable=True),
        sa.Column("address", sa.String(500), nullable=False),
        sa.Column("city", sa.String(100), nullable=True),
        sa.Column("state", sa.String(100), nullable=True),
        sa.Column("country", sa.String(10), server_default="US"),
        sa.Column("property_type", sa.String(100), nullable=True),
        sa.Column("prior_tiv", sa.Numeric(18, 2), nullable=True),
        sa.Column("lat", sa.Numeric(10, 7), nullable=True),
        sa.Column("lng", sa.Numeric(10, 7), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_table(
        "campaign_portfolios",
        sa.Column("campaign_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("campaigns.id"), primary_key=True),
        sa.Column("portfolio_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("portfolios.id"), primary_key=True),
    )
    op.create_table(
        "assignments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("campaign_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("campaigns.id"), nullable=False),
        sa.Column("property_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("properties.id"), nullable=False),
        sa.Column("primary_assignee_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("external_email", sa.String(255), nullable=True),
        sa.Column("assignee_type", sa.String(20), server_default="internal"),
        sa.Column("status", sa.String(30), server_default="not_started"),
        sa.Column("due_date", sa.Date, nullable=True),
        sa.Column("reminder_count", sa.Integer, server_default="0"),
        sa.Column("last_reminded_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_table(
        "delegations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("assignment_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("assignments.id"), nullable=True),
        sa.Column("delegator_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("delegate_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("level", sa.Integer, server_default="1"),
        sa.Column("delegation_type", sa.String(20), server_default="specific"),
        sa.Column("ooo_start", sa.Date, nullable=True),
        sa.Column("ooo_end", sa.Date, nullable=True),
        sa.Column("is_active", sa.Boolean, server_default="true"),
        sa.Column("reason", sa.Text, nullable=True),
        sa.Column("created_by_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("revoked_by_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
    )
    op.create_table(
        "form_schemas",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("campaign_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("campaigns.id"), unique=True, nullable=False),
        sa.Column("version", sa.Integer, server_default="1"),
        sa.Column("schema", postgresql.JSONB, nullable=False, server_default="{}"),
        sa.Column("is_published", sa.Boolean, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_table(
        "submissions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("assignment_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("assignments.id"), unique=True, nullable=False),
        sa.Column("submitted_by_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("actor_type", sa.String(20), server_default="primary"),
        sa.Column("data", postgresql.JSONB, nullable=False, server_default="{}"),
        sa.Column("total_tiv", sa.Numeric(18, 2), nullable=True),
        sa.Column("status", sa.String(20), server_default="draft"),
        sa.Column("version", sa.Integer, server_default="1"),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_table(
        "submission_history",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("submission_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("submissions.id"), nullable=False),
        sa.Column("data", postgresql.JSONB, nullable=False),
        sa.Column("version", sa.Integer, nullable=False),
        sa.Column("saved_by_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("saved_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_table(
        "attachments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("submission_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("submissions.id"), nullable=False),
        sa.Column("filename", sa.String(255), nullable=False),
        sa.Column("filepath", sa.Text, nullable=False),
        sa.Column("mime_type", sa.String(100), nullable=True),
        sa.Column("size_bytes", sa.Integer, nullable=True),
        sa.Column("uploaded_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("uploaded_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_table(
        "reviews",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("submission_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("submissions.id"), nullable=False),
        sa.Column("reviewer_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("decision", sa.String(30), nullable=False),
        sa.Column("comment", sa.Text, nullable=True),
        sa.Column("reason_code", sa.String(100), nullable=True),
        sa.Column("requires_escalation", sa.Boolean, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_table(
        "signed_links",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("campaign_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("campaigns.id"), nullable=False),
        sa.Column("token", sa.Text, unique=True, nullable=False),
        sa.Column("contributor_email", sa.String(255), nullable=False),
        sa.Column("passcode_hash", sa.String(255), nullable=False),
        sa.Column("link_model", sa.String(20), server_default="bundled"),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("is_revoked", sa.Boolean, server_default="false"),
        sa.Column("accessed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_table(
        "signed_link_assignments",
        sa.Column("signed_link_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("signed_links.id"), primary_key=True),
        sa.Column("assignment_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("assignments.id"), primary_key=True),
    )
    op.create_table(
        "deadline_extensions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("entity_type", sa.String(20), nullable=False),
        sa.Column("entity_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("extended_by_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("original_due", sa.Date, nullable=False),
        sa.Column("new_due", sa.Date, nullable=False),
        sa.Column("reason_code", sa.String(100), nullable=False),
        sa.Column("reason_note", sa.Text, nullable=True),
        sa.Column("notify_assignees", sa.Boolean, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_table(
        "reminders",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("campaign_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("campaigns.id"), nullable=False),
        sa.Column("assignment_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("assignments.id"), nullable=True),
        sa.Column("reminder_type", sa.String(30), nullable=False),
        sa.Column("scheduled_for", sa.DateTime(timezone=True), nullable=False),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", sa.String(20), server_default="pending"),
    )
    op.create_table(
        "audit_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("event_type", sa.String(100), nullable=False),
        sa.Column("actor_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("actor_ip", sa.String(50), nullable=True),
        sa.Column("entity_type", sa.String(50), nullable=False),
        sa.Column("entity_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("payload", postgresql.JSONB, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("audit_events")
    op.drop_table("reminders")
    op.drop_table("deadline_extensions")
    op.drop_table("signed_link_assignments")
    op.drop_table("signed_links")
    op.drop_table("reviews")
    op.drop_table("attachments")
    op.drop_table("submission_history")
    op.drop_table("submissions")
    op.drop_table("form_schemas")
    op.drop_table("delegations")
    op.drop_table("assignments")
    op.drop_table("campaign_portfolios")
    op.drop_table("properties")
    op.drop_table("campaigns")
    op.drop_table("portfolios")
    op.drop_table("users")

-- Values Collection Tool - PostgreSQL Schema
-- ux_vc schema: Tables consumed by frontend UX
-- wf_vc schema: All backend internal tables

-- ==========================================
-- SCHEMAS
-- ==========================================
CREATE SCHEMA ux_vc;
CREATE SCHEMA wf_vc;

-- ==========================================
-- UX_VC SCHEMA (Frontend-facing tables)
-- ==========================================

-- Users table
CREATE TABLE ux_vc.users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    hashed_password VARCHAR(255),
    roles TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    team_type VARCHAR(20) DEFAULT 'internal',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Portfolios table
CREATE TABLE ux_vc.portfolios (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Properties table
CREATE TABLE ux_vc.properties (
    id UUID PRIMARY KEY,
    portfolio_id UUID REFERENCES ux_vc.portfolios(id),
    address VARCHAR(500) NOT NULL,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(10) DEFAULT 'US',
    property_type VARCHAR(100),
    prior_tiv NUMERIC(18, 2),
    lat NUMERIC(10, 7),
    lng NUMERIC(10, 7),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaigns table
CREATE TABLE ux_vc.campaigns (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES ux_vc.users(id),
    status VARCHAR(20) DEFAULT 'draft',
    due_date DATE NOT NULL,
    sla_days INTEGER DEFAULT 21,
    link_model VARCHAR(20) DEFAULT 'bundled',
    breach_policy VARCHAR(40) DEFAULT 'escalate_and_continue',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assignments table
CREATE TABLE ux_vc.assignments (
    id UUID PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES ux_vc.campaigns(id),
    property_id UUID NOT NULL REFERENCES ux_vc.properties(id),
    primary_assignee_id UUID REFERENCES ux_vc.users(id),
    external_email VARCHAR(255),
    assignee_type VARCHAR(20) DEFAULT 'internal',
    status VARCHAR(30) DEFAULT 'not_started',
    due_date DATE,
    reminder_count INTEGER DEFAULT 0,
    last_reminded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Delegations table
CREATE TABLE ux_vc.delegations (
    id UUID PRIMARY KEY,
    assignment_id UUID REFERENCES ux_vc.assignments(id),
    delegator_id UUID NOT NULL REFERENCES ux_vc.users(id),
    delegate_id UUID NOT NULL REFERENCES ux_vc.users(id),
    level INTEGER DEFAULT 1,
    delegation_type VARCHAR(20) DEFAULT 'specific',
    ooo_start DATE,
    ooo_end DATE,
    is_active BOOLEAN DEFAULT TRUE,
    reason TEXT,
    created_by_id UUID NOT NULL REFERENCES ux_vc.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_by_id UUID REFERENCES ux_vc.users(id)
);

-- Submissions table
CREATE TABLE ux_vc.submissions (
    id UUID PRIMARY KEY,
    assignment_id UUID NOT NULL UNIQUE REFERENCES ux_vc.assignments(id),
    submitted_by_id UUID REFERENCES ux_vc.users(id),
    actor_type VARCHAR(20) DEFAULT 'primary',
    data JSONB NOT NULL DEFAULT '{}',
    total_tiv NUMERIC(18, 2),
    status VARCHAR(20) DEFAULT 'draft',
    version INTEGER DEFAULT 1,
    submitted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews table
CREATE TABLE ux_vc.reviews (
    id UUID PRIMARY KEY,
    submission_id UUID NOT NULL REFERENCES ux_vc.submissions(id),
    reviewer_id UUID NOT NULL REFERENCES ux_vc.users(id),
    decision VARCHAR(30) NOT NULL,
    comment TEXT,
    reason_code VARCHAR(100),
    requires_escalation BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Signed Links table (for external contributor access)
CREATE TABLE ux_vc.signed_links (
    id UUID PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES ux_vc.campaigns(id),
    token TEXT NOT NULL UNIQUE,
    contributor_email VARCHAR(255) NOT NULL,
    passcode_hash VARCHAR(255) NOT NULL,
    link_model VARCHAR(20) DEFAULT 'bundled',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE,
    accessed_at TIMESTAMP WITH TIME ZONE,
    created_by_id UUID NOT NULL REFERENCES ux_vc.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reminders table
CREATE TABLE ux_vc.reminders (
    id UUID PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES ux_vc.campaigns(id),
    assignment_id UUID REFERENCES ux_vc.assignments(id),
    reminder_type VARCHAR(30) NOT NULL,
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'pending'
);

-- Audit Events table
CREATE TABLE ux_vc.audit_events (
    id UUID PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    actor_id UUID REFERENCES ux_vc.users(id),
    actor_ip VARCHAR(50),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    payload JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- WF_VC SCHEMA (Backend internal tables)
-- ==========================================

-- Campaign-Portfolio mapping (many-to-many join)
CREATE TABLE wf_vc.campaign_portfolios (
    campaign_id UUID NOT NULL REFERENCES ux_vc.campaigns(id),
    portfolio_id UUID NOT NULL REFERENCES ux_vc.portfolios(id),
    PRIMARY KEY (campaign_id, portfolio_id)
);

-- Form Schemas table (backend config)
CREATE TABLE wf_vc.form_schemas (
    id UUID PRIMARY KEY,
    campaign_id UUID NOT NULL UNIQUE REFERENCES ux_vc.campaigns(id),
    version INTEGER DEFAULT 1,
    schema JSONB NOT NULL DEFAULT '{}',
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Submission History table (internal version control)
CREATE TABLE wf_vc.submission_history (
    id UUID PRIMARY KEY,
    submission_id UUID NOT NULL REFERENCES ux_vc.submissions(id),
    data JSONB NOT NULL,
    version INTEGER NOT NULL,
    saved_by_id UUID REFERENCES ux_vc.users(id),
    saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attachments table (internal file storage)
CREATE TABLE wf_vc.attachments (
    id UUID PRIMARY KEY,
    submission_id UUID NOT NULL REFERENCES ux_vc.submissions(id),
    filename VARCHAR(255) NOT NULL,
    filepath TEXT NOT NULL,
    mime_type VARCHAR(100),
    size_bytes INTEGER,
    uploaded_by UUID REFERENCES ux_vc.users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Signed Link Assignments mapping (many-to-many join)
CREATE TABLE wf_vc.signed_link_assignments (
    signed_link_id UUID NOT NULL REFERENCES ux_vc.signed_links(id),
    assignment_id UUID NOT NULL REFERENCES ux_vc.assignments(id),
    PRIMARY KEY (signed_link_id, assignment_id)
);

-- Deadline Extensions table (backend audit trail)
CREATE TABLE wf_vc.deadline_extensions (
    id UUID PRIMARY KEY,
    entity_type VARCHAR(20) NOT NULL,
    entity_id UUID NOT NULL,
    extended_by_id UUID NOT NULL REFERENCES ux_vc.users(id),
    original_due DATE NOT NULL,
    new_due DATE NOT NULL,
    reason_code VARCHAR(100) NOT NULL,
    reason_note TEXT,
    notify_assignees BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- INDEXES (UX_VC)
-- ==========================================
CREATE INDEX idx_ux_vc_assignments_campaign_id ON ux_vc.assignments(campaign_id);
CREATE INDEX idx_ux_vc_assignments_primary_assignee_id ON ux_vc.assignments(primary_assignee_id);
CREATE INDEX idx_ux_vc_assignments_status ON ux_vc.assignments(status);
CREATE INDEX idx_ux_vc_delegations_delegator_id ON ux_vc.delegations(delegator_id);
CREATE INDEX idx_ux_vc_delegations_delegate_id ON ux_vc.delegations(delegate_id);
CREATE INDEX idx_ux_vc_delegations_is_active ON ux_vc.delegations(is_active);
CREATE INDEX idx_ux_vc_submissions_assignment_id ON ux_vc.submissions(assignment_id);
CREATE INDEX idx_ux_vc_submissions_status ON ux_vc.submissions(status);
CREATE INDEX idx_ux_vc_reviews_submission_id ON ux_vc.reviews(submission_id);
CREATE INDEX idx_ux_vc_reviews_reviewer_id ON ux_vc.reviews(reviewer_id);
CREATE INDEX idx_ux_vc_audit_events_entity_id ON ux_vc.audit_events(entity_id);
CREATE INDEX idx_ux_vc_audit_events_created_at ON ux_vc.audit_events(created_at);
CREATE INDEX idx_ux_vc_reminders_scheduled_for ON ux_vc.reminders(scheduled_for);
CREATE INDEX idx_ux_vc_reminders_status ON ux_vc.reminders(status);
CREATE INDEX idx_ux_vc_campaigns_owner_id ON ux_vc.campaigns(owner_id);
CREATE INDEX idx_ux_vc_campaigns_status ON ux_vc.campaigns(status);

-- ==========================================
-- INDEXES (WF_VC)
-- ==========================================
CREATE INDEX idx_wf_vc_campaign_portfolios_portfolio_id ON wf_vc.campaign_portfolios(portfolio_id);
CREATE INDEX idx_wf_vc_form_schemas_campaign_id ON wf_vc.form_schemas(campaign_id);
CREATE INDEX idx_wf_vc_submission_history_submission_id ON wf_vc.submission_history(submission_id);
CREATE INDEX idx_wf_vc_attachments_submission_id ON wf_vc.attachments(submission_id);
CREATE INDEX idx_wf_vc_signed_link_assignments_assignment_id ON wf_vc.signed_link_assignments(assignment_id);
CREATE INDEX idx_wf_vc_deadline_extensions_entity_id ON wf_vc.deadline_extensions(entity_id);

-- ==========================================
-- ANALYTICS VIEWS
-- ==========================================

-- Campaign Performance Overview
CREATE VIEW ux_vc.v_campaign_performance AS
SELECT
    c.id,
    c.name,
    c.status,
    c.due_date,
    c.created_at,
    COUNT(DISTINCT a.id) as total_assignments,
    COUNT(DISTINCT CASE WHEN a.status = 'completed' THEN a.id END) as completed_assignments,
    COUNT(DISTINCT CASE WHEN a.status = 'pending' THEN a.id END) as pending_assignments,
    COUNT(DISTINCT CASE WHEN a.status = 'in_progress' THEN a.id END) as in_progress_assignments,
    ROUND(
        (COUNT(DISTINCT CASE WHEN a.status = 'completed' THEN a.id END)::numeric /
         NULLIF(COUNT(DISTINCT a.id), 0) * 100)::numeric, 2
    ) as completion_percentage,
    COUNT(DISTINCT CASE WHEN s.status = 'approved' THEN s.id END) as approved_submissions,
    COUNT(DISTINCT CASE WHEN s.status = 'rejected' THEN s.id END) as rejected_submissions,
    AVG(s.tiv_delta_pct) as avg_tiv_delta_pct,
    COUNT(DISTINCT CASE WHEN s.material_change = TRUE THEN s.id END) as material_changes_count
FROM ux_vc.campaigns c
LEFT JOIN ux_vc.assignments a ON c.id = a.campaign_id
LEFT JOIN ux_vc.submissions s ON a.id = s.assignment_id
GROUP BY c.id, c.name, c.status, c.due_date, c.created_at;

-- User Performance Metrics
CREATE VIEW ux_vc.v_user_performance AS
SELECT
    u.id,
    u.name,
    u.email,
    COUNT(DISTINCT a.id) as total_assignments,
    COUNT(DISTINCT CASE WHEN a.status = 'completed' THEN a.id END) as completed_assignments,
    COUNT(DISTINCT CASE WHEN a.status = 'pending' THEN a.id END) as pending_assignments,
    COUNT(DISTINCT CASE WHEN s.status = 'submitted' THEN s.id END) as submitted_count,
    COUNT(DISTINCT CASE WHEN s.status = 'approved' THEN s.id END) as approved_count,
    COUNT(DISTINCT CASE WHEN s.status = 'rejected' THEN s.id END) as rejected_count,
    ROUND(
        AVG(CASE WHEN s.tiv_delta_pct IS NOT NULL THEN s.tiv_delta_pct ELSE 0 END)::numeric, 2
    ) as avg_tiv_change_pct,
    MAX(s.submitted_at) as last_submission_date
FROM ux_vc.users u
LEFT JOIN ux_vc.assignments a ON u.id = a.primary_assignee_id
LEFT JOIN ux_vc.submissions s ON a.id = s.assignment_id
GROUP BY u.id, u.name, u.email;

-- SLA Compliance View
CREATE VIEW ux_vc.v_sla_compliance AS
SELECT
    c.id as campaign_id,
    c.name as campaign_name,
    c.due_date,
    c.sla_days,
    COUNT(DISTINCT a.id) as total_assignments,
    COUNT(DISTINCT CASE
        WHEN s.submitted_at IS NOT NULL AND
             (s.submitted_at - a.assigned_at) <= (c.sla_days || ' days')::interval
        THEN a.id
    END) as sla_compliant_submissions,
    COUNT(DISTINCT CASE
        WHEN s.submitted_at IS NOT NULL AND
             (s.submitted_at - a.assigned_at) > (c.sla_days || ' days')::interval
        THEN a.id
    END) as sla_breached_submissions,
    ROUND(
        (COUNT(DISTINCT CASE
            WHEN s.submitted_at IS NOT NULL AND
                 (s.submitted_at - a.assigned_at) <= (c.sla_days || ' days')::interval
            THEN a.id
        END)::numeric /
         NULLIF(COUNT(DISTINCT CASE WHEN s.submitted_at IS NOT NULL THEN a.id END), 0) * 100)::numeric, 2
    ) as sla_compliance_percentage
FROM ux_vc.campaigns c
LEFT JOIN ux_vc.assignments a ON c.id = a.campaign_id
LEFT JOIN ux_vc.submissions s ON a.id = s.assignment_id
GROUP BY c.id, c.name, c.due_date, c.sla_days;

-- Review Queue Status
CREATE VIEW ux_vc.v_review_queue_status AS
SELECT
    'pending' as status,
    COUNT(DISTINCT s.id) as count,
    COUNT(DISTINCT CASE WHEN s.material_change = TRUE THEN s.id END) as material_changes,
    ROUND(AVG(s.tiv_delta_pct)::numeric, 2) as avg_tiv_delta_pct
FROM ux_vc.submissions s
WHERE s.status = 'submitted'

UNION ALL

SELECT
    'approved' as status,
    COUNT(DISTINCT s.id) as count,
    COUNT(DISTINCT CASE WHEN s.material_change = TRUE THEN s.id END) as material_changes,
    ROUND(AVG(s.tiv_delta_pct)::numeric, 2) as avg_tiv_delta_pct
FROM ux_vc.submissions s
WHERE s.status = 'approved'

UNION ALL

SELECT
    'rejected' as status,
    COUNT(DISTINCT s.id) as count,
    COUNT(DISTINCT CASE WHEN s.material_change = TRUE THEN s.id END) as material_changes,
    ROUND(AVG(s.tiv_delta_pct)::numeric, 2) as avg_tiv_delta_pct
FROM ux_vc.submissions s
WHERE s.status = 'rejected';

-- Portfolio Summary
CREATE VIEW ux_vc.v_portfolio_summary AS
SELECT
    p.id,
    p.name,
    COUNT(DISTINCT pr.id) as property_count,
    SUM(pr.prior_tiv) as total_prior_tiv,
    COUNT(DISTINCT CASE WHEN s.status = 'approved' THEN a.id END) as completed_assignments,
    COUNT(DISTINCT a.id) as total_assignments,
    ROUND(
        (COUNT(DISTINCT CASE WHEN s.status = 'approved' THEN a.id END)::numeric /
         NULLIF(COUNT(DISTINCT a.id), 0) * 100)::numeric, 2
    ) as completion_percentage
FROM ux_vc.portfolios p
LEFT JOIN ux_vc.properties pr ON p.id = pr.portfolio_id
LEFT JOIN wf_vc.campaign_portfolios cp ON p.id = cp.portfolio_id
LEFT JOIN ux_vc.assignments a ON cp.campaign_id = a.campaign_id
LEFT JOIN ux_vc.submissions s ON a.id = s.assignment_id
GROUP BY p.id, p.name;

-- Delegation Impact Analysis
CREATE VIEW ux_vc.v_delegation_impact AS
SELECT
    d.delegator_id,
    u1.name as delegator_name,
    d.delegate_id,
    u2.name as delegate_name,
    d.delegation_type,
    d.start_date,
    d.end_date,
    COUNT(DISTINCT a.id) as assignments_under_delegation,
    COUNT(DISTINCT CASE WHEN a.status = 'completed' THEN a.id END) as completed_under_delegation,
    COUNT(DISTINCT s.id) as submissions_from_delegation
FROM ux_vc.delegations d
LEFT JOIN ux_vc.users u1 ON d.delegator_id = u1.id
LEFT JOIN ux_vc.users u2 ON d.delegate_id = u2.id
LEFT JOIN ux_vc.assignments a ON d.delegate_id = a.primary_assignee_id
LEFT JOIN ux_vc.submissions s ON a.id = s.assignment_id
WHERE d.is_active = TRUE
GROUP BY d.id, d.delegator_id, u1.name, d.delegate_id, u2.name, d.delegation_type, d.start_date, d.end_date;

-- Daily Submission Trends
CREATE VIEW ux_vc.v_submission_trends AS
SELECT
    DATE(s.submitted_at) as submission_date,
    COUNT(DISTINCT s.id) as submissions_count,
    COUNT(DISTINCT CASE WHEN s.status = 'approved' THEN s.id END) as approved_count,
    COUNT(DISTINCT CASE WHEN s.status = 'rejected' THEN s.id END) as rejected_count,
    AVG(s.tiv) as avg_tiv_submitted,
    AVG(s.tiv_delta_pct) as avg_tiv_change_pct
FROM ux_vc.submissions s
WHERE s.submitted_at IS NOT NULL
GROUP BY DATE(s.submitted_at)
ORDER BY submission_date DESC;

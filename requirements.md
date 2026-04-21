# Values Collection Tool — Requirements

## 1. Overview

A web application for insurance property renewal values collection. Campaign owners create collection campaigns, assign properties to internal and external contributors, contributors fill structured COPE/TIV forms, reviewers approve or reject submissions, and the data feeds exposure systems.

**Stack:** Angular 19 + PrimeNG · FastAPI (Python) · PostgreSQL 16 · JWT auth · local install

---

## 2. User Roles

| Role | Description | Access |
|---|---|---|
| **Admin / Campaign Owner** | Creates and manages campaigns, assigns contributors, monitors progress, issues links | Full write access to campaigns they own |
| **Reviewer** | Approves or rejects submitted values, can reopen for revision | Read all submissions; write review decisions |
| **Internal Contributor** | Fills forms for assigned properties inside the app | Read/write their assigned submissions only |
| **External Contributor** | Fills forms via a signed link + passcode, no account required | Scoped to assignments on their signed link |
| **Auditor** | Read-only view of campaigns, submissions, audit trail | Read-only |
| **Super Admin** | Platform-wide config, user management, SLA defaults | Full access |

---

## 3. Core Modules

### 3.1 Authentication & Users

- JWT-based auth (access token 15 min, refresh token 7 days)
- User registration / invite by email
- Role assignment (a user may hold multiple roles)
- External contributors authenticate via **signed link + one-time passcode** — no account required
- Password reset flow
- Session invalidation on password change

### 3.2 Campaigns

A **campaign** is a time-boxed value-collection event targeting a set of properties.

**Fields:**
- Name, description, owner (user)
- Portfolio(s) targeted
- Due date, SLA days
- Status: `draft` → `active` → `completed` | `archived`
- External link model: `bundled` (one link per contributor covering all their assignments) or `per_location` (one link per assignment)
- Created / updated timestamps

**Actions:**
- Create, edit, activate, complete, archive
- Extend campaign-level deadline (with mandatory reason, notifies all open assignees)
- Bulk export (CSV)
- Clone campaign (copy config, not submissions)

### 3.3 Properties & Portfolios

**Portfolio:** named group of properties (e.g. "North America portfolio").

**Property fields:**
- Address, city, state/region, country
- Property type (Warehouse, Office, Retail, Manufacturing, Cold storage, etc.)
- Prior-year TIV (reference value)
- Geocoordinates (lat/lng)
- Unique property ID (carries across campaigns)

Properties are global records — shared across campaigns. A campaign targets one or more portfolios.

### 3.4 Assignments

An **assignment** links one property to one campaign and one primary assignee.

**Fields:**
- Campaign, property
- Primary assignee (user or external contact email)
- Assignee type: `internal` | `external`
- Status: `not_started` → `in_progress` → `submitted` → `under_review` → `approved` | `rejected`
- Due date (defaults to campaign due date; can be extended independently)
- Reminder count, last reminder sent
- Created / updated timestamps

**Delegation (first and second level):**

Delegation is configured **at assignment creation / edit time**:

- **First-level delegate**: the person who acts if the primary assignee cannot. When a first-level delegate is set, they immediately see the assignment in their queue alongside the primary. Either may fill the form; whichever submits first locks the other out.
- **Second-level delegate**: acts if both primary and first-level are unavailable (e.g. both on leave). Visible in their queue only when the primary or first-level manually activates the escalation, or when the assignment breaches SLA.

Audit trail records which actor (primary / first-level / second-level) performed each action, tagged "acting on behalf of [primary assignee]".

Admin can also create **OOO blanket delegations**: a time-boxed rule that routes all assignments from User A to User B for a date range. Assignments delegated this way carry the same first/second-level semantics; the OOO delegation is a system-generated first-level delegation.

**Bulk actions:**
- Bulk remind (send reminder email)
- Bulk reassign (replace primary assignee)
- Bulk extend deadline (per-assignment extension with mandatory reason)
- Bulk delegate (apply first-level delegate to selected assignments)
- Bulk approve (reviewer only)

### 3.5 Form Builder

Admins design the data-collection schema per campaign. A **form schema** is a versioned JSON document.

**Field types:**
- Text, Number, Currency, Select (single/multi), Date, Address+geo, File upload, Calculated (formula), Conditional (show-if), Repeating group

**Key sections (default template):**
1. Property identity (address, occupancy)
2. COPE attributes (year built, construction class, sprinkler coverage, roof type, stories)
3. Values — repeating per building (Building TIV, Contents TIV, BI 12-month, auto-calculated Total TIV)
4. Attachments (valuation letter, property photos)

Repeating groups support one or more buildings per property. Total TIV is calculated server-side and stored.

### 3.6 Submissions

A **submission** is the data a contributor fills for one assignment.

**Features:**
- Auto-save draft every 30 seconds
- Manual "Save draft" at any time
- Final submit locks the form and triggers review queue entry
- Per-field change tracking vs prior-year values (change flags: `unchanged` | `changed` | `material_change`)
- Material change threshold: configurable per field (default: >10% TIV change)
- File attachments (stored on disk / object storage path)
- Submission history (list of all versions for re-submissions after rejection)

### 3.7 Reviews

Reviewers see a queue of `submitted` / `under_review` assignments.

**Review actions:**
- **Approve** — moves assignment to `approved`; triggers exposure system webhook (stubbed)
- **Reject & reopen** — requires reason + comment; moves to `rejected`; contributor is notified and can resubmit
- **Request info** — adds a comment thread without changing status
- **Escalate** — flags for secondary approval (analyst → manager workflow)

**Review detail view shows:**
- Side-by-side diff of current submission vs prior year
- Material change flags
- Attached files
- Review activity timeline
- Outlier detection alerts (server-side: flags if TIV delta > threshold)

### 3.8 Signed Links (External Contributor Flow)

For external contributors (brokers, site managers) who have no account:

1. Admin generates a signed link (JWT containing: campaign ID, list of assignment IDs, contributor email, expiry)
2. System sends email with link + separate 6-digit passcode
3. Contributor opens link → enters passcode → authenticated for session
4. **Bundled model**: one link covers all their assignments; they see a portfolio dashboard, submit each independently
5. **Per-location model**: each link covers exactly one assignment
6. Signed links have an expiry date; admin can revoke early or regenerate

### 3.9 Reminders & SLA

**SLA clock:** starts when campaign is activated. Each assignment has a `due_date`.

**Default reminder schedule (per campaign, overridable):**
- Day 0: Initial invite
- T−7 days: First reminder
- T−2 days: Urgent reminder
- T+1 days: Escalation to manager
- T+5 days: Final notice

Reminders are sent via email. Template content is configurable per campaign.

**Breach policy** (configurable per campaign):
- `escalate_and_continue` — notify manager, keep collecting
- `expire_and_lock` — freeze assignment at breach date

### 3.10 Deadline Extension

**Campaign-level:** Admin extends the overall campaign due date.
- Requires a reason (dropdown + optional note)
- Notifies all open assignees via email
- SLA reminder schedule shifts to match new due date
- Logged in audit trail

**Per-assignment:** Admin or reviewer extends one or many assignments independently.
- Campaign due date is unchanged
- Requires a reason
- Optional: notify affected assignee(s)
- Logged in audit trail

### 3.11 Audit Trail

Every significant action is logged:

| Event | Actor | Entity |
|---|---|---|
| campaign.created / activated / completed | User | Campaign |
| assignment.created / status_changed | User / System | Assignment |
| submission.draft_saved / submitted / approved / rejected | User | Submission |
| delegation.created / revoked | User | Assignment / User |
| deadline.extended | User | Campaign / Assignment |
| link.issued / accessed / revoked | User / System | Signed link |
| reminder.sent / escalation.triggered | System | Assignment |
| field.changed (material) | User | Submission field |

Audit records are immutable. Stored with: actor ID, actor IP, timestamp (UTC), event type, entity type + ID, payload diff.

---

## 4. Non-Functional Requirements

- **API-first**: all business logic in FastAPI; Angular consumes REST API
- **Pagination**: all list endpoints support cursor or offset pagination
- **Validation**: server-side validation is authoritative; client-side is UX-only
- **File uploads**: multipart/form-data; files stored on local disk (configurable path)
- **Emails**: SMTP via Python `fastapi-mail`; dev mode logs to console
- **Background tasks**: FastAPI `BackgroundTasks` for reminders and SLA checks (no Celery for simplicity)
- **CORS**: configured for Angular dev server origin
- **Error handling**: structured JSON error responses `{ detail, code, field? }`
- **Tests**: pytest for API routes; at least happy-path + auth coverage per module
- **Local DB**: PostgreSQL 16 on localhost:5432, database name `values_collection`

---

## 5. Out of Scope (v1)

- Real email delivery (dev mode only)
- Mobile native apps
- Dark mode
- Multi-tenancy / org isolation
- Real-time WebSocket updates (polling is fine)
- SSO / SAML / OAuth
- BI dashboards with charts beyond what's in the prototype

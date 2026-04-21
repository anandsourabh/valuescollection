# Values Collection Tool — Implementation Plan

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Angular 19, PrimeNG, Angular Material Icons |
| API | FastAPI (Python 3.12), SQLAlchemy 2.x (async), Alembic |
| Database | PostgreSQL 16 (localhost:5432) |
| Auth | JWT (python-jose), bcrypt password hashing |
| Email | fastapi-mail (console output in dev) |
| File storage | Local filesystem (`./uploads/`) |
| Testing | pytest, pytest-asyncio, httpx |

---

## Repository Structure

```
repo/
├── backend/
│   ├── alembic/              # DB migrations
│   ├── app/
│   │   ├── main.py           # FastAPI app factory
│   │   ├── config.py         # Settings (pydantic-settings)
│   │   ├── database.py       # Async SQLAlchemy engine + session
│   │   ├── models/           # SQLAlchemy ORM models
│   │   │   ├── user.py
│   │   │   ├── campaign.py
│   │   │   ├── property.py
│   │   │   ├── assignment.py
│   │   │   ├── delegation.py
│   │   │   ├── submission.py
│   │   │   ├── review.py
│   │   │   ├── signed_link.py
│   │   │   ├── audit.py
│   │   │   └── reminder.py
│   │   ├── schemas/          # Pydantic request/response schemas
│   │   ├── routers/          # FastAPI route handlers
│   │   │   ├── auth.py
│   │   │   ├── users.py
│   │   │   ├── campaigns.py
│   │   │   ├── properties.py
│   │   │   ├── assignments.py
│   │   │   ├── delegations.py
│   │   │   ├── submissions.py
│   │   │   ├── reviews.py
│   │   │   ├── signed_links.py
│   │   │   ├── forms.py
│   │   │   └── audit.py
│   │   ├── services/         # Business logic
│   │   │   ├── auth_service.py
│   │   │   ├── assignment_service.py
│   │   │   ├── delegation_service.py
│   │   │   ├── submission_service.py
│   │   │   ├── review_service.py
│   │   │   ├── sla_service.py
│   │   │   └── notification_service.py
│   │   ├── deps.py           # FastAPI dependency injection
│   │   └── utils/
│   │       ├── jwt.py
│   │       ├── signed_link.py
│   │       └── tiv_calculator.py
│   ├── tests/
│   ├── requirements.txt
│   ├── alembic.ini
│   └── seed.py               # Dev seed data
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/
│   │   │   │   ├── auth/         # AuthService, JWT interceptor, guards
│   │   │   │   ├── http/         # API client services
│   │   │   │   └── models/       # TypeScript interfaces
│   │   │   ├── shared/
│   │   │   │   ├── components/   # StatusBadge, Avatar, ProgressBar, etc.
│   │   │   │   └── pipes/        # currency-short, time-ago, etc.
│   │   │   ├── features/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── campaigns/
│   │   │   │   ├── assignments/
│   │   │   │   ├── form-builder/
│   │   │   │   ├── submissions/
│   │   │   │   ├── reviews/
│   │   │   │   ├── delegations/
│   │   │   │   ├── settings/
│   │   │   │   └── external/     # Signed-link contributor flow
│   │   │   ├── app.routes.ts
│   │   │   └── app.config.ts
│   │   ├── styles/
│   │   │   ├── _tokens.scss      # Design tokens (mirrors prototype)
│   │   │   └── styles.scss
│   │   └── environments/
│   └── package.json
│
├── requirements.md
└── plan.md
```

---

## Database Schema

### `users`
```sql
id          uuid PK
email       text UNIQUE NOT NULL
name        text NOT NULL
hashed_pw   text
role        text[] DEFAULT '{}'   -- ['admin','reviewer','contributor','auditor']
is_active   bool DEFAULT true
team_type   text DEFAULT 'internal'  -- 'internal' | 'external'
created_at  timestamptz
updated_at  timestamptz
```

### `portfolios`
```sql
id          uuid PK
name        text NOT NULL
description text
created_at  timestamptz
```

### `properties`
```sql
id          uuid PK
portfolio_id uuid FK portfolios
address     text NOT NULL
city        text
state       text
country     text DEFAULT 'US'
property_type text
prior_tiv   numeric(18,2)
lat         numeric(10,7)
lng         numeric(10,7)
created_at  timestamptz
updated_at  timestamptz
```

### `campaigns`
```sql
id              uuid PK
name            text NOT NULL
description     text
owner_id        uuid FK users
status          text DEFAULT 'draft'   -- draft|active|completed|archived
due_date        date NOT NULL
sla_days        int DEFAULT 21
link_model      text DEFAULT 'bundled' -- bundled|per_location
breach_policy   text DEFAULT 'escalate_and_continue'
created_at      timestamptz
updated_at      timestamptz
```

### `campaign_portfolios`
```sql
campaign_id  uuid FK campaigns
portfolio_id uuid FK portfolios
PK (campaign_id, portfolio_id)
```

### `assignments`
```sql
id                  uuid PK
campaign_id         uuid FK campaigns
property_id         uuid FK properties
primary_assignee_id uuid FK users NULL  -- NULL for external
external_email      text NULL           -- set when assignee is external
assignee_type       text DEFAULT 'internal'
status              text DEFAULT 'not_started'
due_date            date
reminder_count      int DEFAULT 0
last_reminded_at    timestamptz
created_at          timestamptz
updated_at          timestamptz
```

### `delegations`
```sql
id              uuid PK
assignment_id   uuid FK assignments NULL  -- NULL = OOO blanket
delegator_id    uuid FK users
delegate_id     uuid FK users NOT NULL
level           int DEFAULT 1           -- 1 = first-level, 2 = second-level
delegation_type text DEFAULT 'specific' -- specific|ooo_blanket
ooo_start       date NULL
ooo_end         date NULL
is_active       bool DEFAULT true
reason          text
created_by_id   uuid FK users
created_at      timestamptz
revoked_at      timestamptz NULL
revoked_by_id   uuid FK users NULL
```

### `form_schemas`
```sql
id          uuid PK
campaign_id uuid FK campaigns UNIQUE
version     int DEFAULT 1
schema      jsonb NOT NULL  -- sections + fields definition
is_published bool DEFAULT false
created_at  timestamptz
updated_at  timestamptz
```

### `submissions`
```sql
id              uuid PK
assignment_id   uuid FK assignments UNIQUE
submitted_by_id uuid FK users NULL
actor_type      text DEFAULT 'primary'  -- primary|delegate_l1|delegate_l2|external
data            jsonb NOT NULL DEFAULT '{}'
total_tiv       numeric(18,2)
status          text DEFAULT 'draft'   -- draft|submitted
version         int DEFAULT 1
submitted_at    timestamptz NULL
created_at      timestamptz
updated_at      timestamptz
```

### `submission_history`
```sql
id            uuid PK
submission_id uuid FK submissions
data          jsonb NOT NULL
version       int
saved_by_id   uuid FK users NULL
saved_at      timestamptz
```

### `attachments`
```sql
id            uuid PK
submission_id uuid FK submissions
filename      text
filepath      text
mime_type     text
size_bytes    int
uploaded_by   uuid FK users NULL
uploaded_at   timestamptz
```

### `reviews`
```sql
id              uuid PK
submission_id   uuid FK submissions
reviewer_id     uuid FK users
decision        text   -- approved|rejected|requested_info
comment         text
reason_code     text NULL
requires_escalation bool DEFAULT false
created_at      timestamptz
```

### `signed_links`
```sql
id              uuid PK
campaign_id     uuid FK campaigns
token           text UNIQUE NOT NULL  -- JWT payload stored for revocation check
contributor_email text NOT NULL
passcode_hash   text NOT NULL
link_model      text DEFAULT 'bundled'
expires_at      timestamptz NOT NULL
is_revoked      bool DEFAULT false
accessed_at     timestamptz NULL
created_by_id   uuid FK users
created_at      timestamptz
```

### `signed_link_assignments`
```sql
signed_link_id  uuid FK signed_links
assignment_id   uuid FK assignments
PK (signed_link_id, assignment_id)
```

### `deadline_extensions`
```sql
id              uuid PK
entity_type     text NOT NULL  -- 'campaign' | 'assignment'
entity_id       uuid NOT NULL
extended_by_id  uuid FK users
original_due    date NOT NULL
new_due         date NOT NULL
reason_code     text NOT NULL
reason_note     text NULL
notify_assignees bool DEFAULT true
created_at      timestamptz
```

### `reminders`
```sql
id              uuid PK
campaign_id     uuid FK campaigns
assignment_id   uuid FK assignments NULL  -- NULL = campaign-wide
reminder_type   text   -- initial|reminder_1|reminder_2|escalation|final
scheduled_for   timestamptz
sent_at         timestamptz NULL
status          text DEFAULT 'pending'  -- pending|sent|skipped
```

### `audit_events`
```sql
id          uuid PK
event_type  text NOT NULL
actor_id    uuid FK users NULL
actor_ip    text
entity_type text NOT NULL
entity_id   uuid NOT NULL
payload     jsonb DEFAULT '{}'
created_at  timestamptz
```

---

## API Endpoints

### Auth
```
POST /api/auth/login            { email, password } → { access_token, refresh_token, user }
POST /api/auth/refresh          { refresh_token } → { access_token }
POST /api/auth/logout
POST /api/auth/external-verify  { token, passcode } → { access_token }
```

### Users
```
GET  /api/users                 List users (admin only)
POST /api/users                 Create/invite user
GET  /api/users/me              Current user
PUT  /api/users/{id}            Update user
```

### Portfolios & Properties
```
GET  /api/portfolios
POST /api/portfolios
GET  /api/portfolios/{id}/properties
POST /api/properties
GET  /api/properties/{id}
PUT  /api/properties/{id}
```

### Campaigns
```
GET  /api/campaigns             List (filterable by status, owner)
POST /api/campaigns
GET  /api/campaigns/{id}
PUT  /api/campaigns/{id}
POST /api/campaigns/{id}/activate
POST /api/campaigns/{id}/extend-deadline   { days, reason_code, reason_note, notify }
GET  /api/campaigns/{id}/stats
```

### Assignments
```
GET  /api/campaigns/{id}/assignments    Filterable, paginated
POST /api/campaigns/{id}/assignments    Single or bulk
GET  /api/assignments/{id}
PUT  /api/assignments/{id}
POST /api/assignments/bulk-action       { action, ids, payload }
  actions: remind | reassign | extend_deadline | delegate | bulk_approve
POST /api/assignments/{id}/extend-deadline
```

### Delegations
```
GET  /api/delegations           My active delegations (as delegator or delegate)
GET  /api/campaigns/{id}/delegations  Admin: all delegations in a campaign
POST /api/delegations           Create delegation (assignment-level or OOO blanket)
  body: { assignment_id?, delegator_id, delegate_id, level, type, ooo_start?, ooo_end?, reason }
DELETE /api/delegations/{id}    Revoke
GET  /api/users/{id}/ooo-delegation  Get active OOO for user
POST /api/users/{id}/ooo-delegation  Set OOO blanket delegation
```

### Form Schemas
```
GET  /api/campaigns/{id}/form-schema
PUT  /api/campaigns/{id}/form-schema   { schema }
POST /api/campaigns/{id}/form-schema/publish
```

### Submissions
```
GET  /api/assignments/{id}/submission
PUT  /api/assignments/{id}/submission   Upsert (draft auto-save + manual save)
POST /api/assignments/{id}/submission/submit  Final submit
POST /api/assignments/{id}/submission/attachments  File upload
DELETE /api/submissions/{id}/attachments/{att_id}
```

### Reviews
```
GET  /api/reviews/queue         Reviewer's pending queue
POST /api/submissions/{id}/review   { decision, comment, reason_code, requires_escalation }
GET  /api/submissions/{id}/history
```

### Signed Links
```
POST /api/campaigns/{id}/signed-links   { contributor_email, assignment_ids?, link_model }
GET  /api/signed-links/{id}
DELETE /api/signed-links/{id}   Revoke
GET  /api/signed-links/{id}/assignments  (used by external contributor after auth)
```

### Audit
```
GET  /api/campaigns/{id}/audit  Paginated audit trail for a campaign
GET  /api/audit                 Global audit (admin only)
```

---

## Frontend Routes

```
/login                          Login page
/dashboard                      Admin overview (KPIs, active campaigns)
/campaigns                      Campaigns list
/campaigns/new                  Create campaign wizard (multi-step)
/campaigns/:id                  Campaign detail (assignments tab, progress, reminders, audit, delegations)
/campaigns/:id/form-builder     Form schema editor
/assignments                    All-assignments cross-campaign view
/reviews                        Reviewer queue
/reviews/:submissionId          Review detail (diff, approve/reject)
/settings                       Settings (Reminders & SLA, Delegations, Roles, etc.)
/settings/delegations           Delegations panel
/ext/:token                     External contributor landing (passcode entry)
/ext/:token/locations           Contributor portfolio (bundled model)
/ext/:token/locations/:locId    Contributor form for one location
```

---

## Implementation Phases

### Phase 1 — Project Scaffold & Database (Day 1)
1. Init FastAPI project structure, install deps (`requirements.txt`)
2. Init Angular 19 project, install PrimeNG, configure routing
3. Create PostgreSQL database `values_collection`
4. Write all Alembic migrations (full schema up front)
5. Configure `config.py` with env vars (DB URL, JWT secret, upload path)
6. Create `database.py` async session factory
7. Write dev seed script (`seed.py`) with users, portfolios, properties, campaigns, assignments

### Phase 2 — Auth & Users (Day 1–2)
1. SQLAlchemy User model
2. JWT helpers (create/decode access + refresh tokens)
3. `POST /api/auth/login` + `POST /api/auth/refresh`
4. `GET /api/users/me`, user CRUD
5. `deps.py`: `get_current_user`, `require_role` dependencies
6. Angular: `AuthService`, JWT interceptor, login page, route guards

### Phase 3 — Campaigns, Properties, Assignments (Day 2–3)
1. SQLAlchemy models: Campaign, Portfolio, Property, Assignment
2. Campaign CRUD API + activate endpoint
3. Assignments CRUD + bulk-action endpoint
4. Angular: campaigns list, campaign detail shell, assignments table with sort/filter/bulk select, create-campaign wizard (3-step: details → form schema → assignments)

### Phase 4 — Delegations & Deadline Extension (Day 3)
1. Delegation model + service
2. `POST /api/delegations`, `DELETE /api/delegations/:id`
3. OOO blanket delegation endpoints
4. `GET /api/campaigns/:id/delegations` for admin view
5. Assignment-level and campaign-level deadline extension endpoints
6. Angular: delegation drawer (opens from assignment row + bulk action), OOO delegation form in Settings, delegations tab in Campaign detail, extend-deadline modal

### Phase 5 — Form Builder & Submissions (Day 3–4)
1. FormSchema model + CRUD
2. Submission model + upsert endpoint (draft save)
3. Submit endpoint (validates required fields, calculates TIV)
4. File attachment upload endpoint
5. Submission history
6. Angular: form builder (drag + field inspector), contributor form (multi-section, repeating buildings, live TIV calc, file upload, draft auto-save, submit)

### Phase 6 — Reviews & Audit Trail (Day 4–5)
1. Review model + decision endpoint
2. Diff computation (current submission vs prior TIV values)
3. Material change detection (>10% threshold)
4. Audit event service (emit events from all write endpoints)
5. Angular: review queue, review detail (diff table, approve/reject modal, activity timeline)

### Phase 7 — Signed Links & External Flow (Day 5)
1. SignedLink model
2. `POST /api/campaigns/:id/signed-links` — generates JWT + 6-digit passcode, sends email
3. `POST /api/auth/external-verify` — validates token + passcode, returns scoped access token
4. External contributor endpoints return only their scoped assignments
5. Angular: `/ext/:token` landing (passcode entry), contributor portfolio, location form

### Phase 8 — Reminders & SLA (Day 5–6)
1. Reminder model + schedule generation (computed from campaign due date)
2. `BackgroundTasks`: on campaign activate → schedule reminders; on submission approved/submitted → cancel pending reminders
3. SLA breach detection (FastAPI startup event runs hourly check)
4. Angular: reminders panel in campaign detail, SLA settings page

### Phase 9 — Polish & Integration (Day 6)
1. Wire all Angular feature modules to real API (replace mock data)
2. Add loading states, error handling, empty states
3. Pagination on all list views
4. CORS final config
5. Run seed script, smoke-test all flows end-to-end
6. Pytest: at minimum auth, campaigns, assignments, delegations, submissions happy-path tests

---

## Key Design Decisions

### Delegation semantics
- `level=1` delegate sees the assignment immediately (shared queue)
- `level=2` delegate only sees the assignment if: (a) primary activates escalation, or (b) SLA breaches
- Whichever actor submits first, the submission is locked; other actors see read-only
- All submission actions by a delegate are stamped with `actor_type` and a back-reference to the primary assignee for audit

### JWT scopes
- Internal user token: `{ sub: user_id, roles: [...], type: "internal" }`
- External contributor token: `{ sub: signed_link_id, assignment_ids: [...], email: "...", type: "external" }`
- External tokens are short-lived (8 hours) and non-refreshable

### TIV calculation
- `total_tiv = building_tiv + contents_tiv + bi_12mo`
- Calculated server-side on every submission save; stored in `submissions.total_tiv`
- Change % vs prior: `(total_tiv - property.prior_tiv) / property.prior_tiv * 100`
- Material change threshold: 10% by default (configurable in form schema)

### Async database
- SQLAlchemy `AsyncSession` with `asyncpg` driver
- All DB calls `await`ed inside route handlers
- Connection pool: min 5, max 20

---

## Environment Variables (`.env`)

```
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/values_collection
JWT_SECRET=change-me-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
UPLOAD_DIR=./uploads
MAIL_FROM=noreply@values-collection.local
MAIL_SERVER=localhost
MAIL_PORT=1025
MAIL_DEV_CONSOLE=true
FRONTEND_URL=http://localhost:4200
```

---

## Dev Setup Commands

```bash
# Database
createdb values_collection

# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
python seed.py
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm install
ng serve   # http://localhost:4200

# API docs
open http://localhost:8000/docs
```

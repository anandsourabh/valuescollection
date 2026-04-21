# Values Collection Tool - Development Setup Guide

## Overview
Values Collection Tool is a full-stack property insurance renewal platform with:
- **Backend**: FastAPI with PostgreSQL 16, async SQLAlchemy, JWT auth
- **Frontend**: Angular 19 with PrimeNG component library
- **Database**: PostgreSQL with ux_vc (frontend) and wf_vc (backend) schemas

## Prerequisites
- **Node.js** 18+ & npm 9+
- **Python** 3.10+
- **PostgreSQL** 16
- **Git**

## Quick Start (5 minutes)

### 1. Setup PostgreSQL
```bash
# Create database
createdb valuescollection

# Load schema
psql valuescollection < valuescollection_schema.sql
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # macOS/Linux
# OR on Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations (creates all tables)
python -m alembic upgrade head

# Seed test data (7 users, 3 portfolios, 10 properties, 1 campaign)
python seed.py

# Start dev server
python -m uvicorn app.main:app --reload
```

Backend runs on `http://localhost:8000`
- API docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies (--legacy-peer-deps for PrimeNG compatibility)
npm install --legacy-peer-deps

# Start dev server
npm start
```

Frontend runs on `http://localhost:4200`

## Test Credentials
```
Email:    alex.morgan@hartwell.com
Password: password123
Role:     admin
```

## Environment Configuration

### Backend (.env)
```ini
DATABASE_URL=postgresql+asyncpg://user:password@localhost/valuescollection
JWT_SECRET=your-secret-key-min-32-chars
UPLOAD_DIR=./uploads
MAIL_DEV_CONSOLE=true
```

### Frontend (environments/environment.ts)
```typescript
export const environment = {
  apiUrl: 'http://localhost:8000/api',
  production: false
};
```

## Project Structure

```
repo/
├── backend/
│   ├── app/
│   │   ├── models/          # SQLAlchemy ORM models (16 tables)
│   │   ├── routers/         # API endpoint groups
│   │   ├── schemas/         # Pydantic request/response schemas
│   │   ├── services/        # Business logic (auth, notifications, delegations)
│   │   ├── utils/           # JWT, TIV calculator helpers
│   │   ├── config.py        # Settings (pydantic-settings)
│   │   ├── database.py      # SQLAlchemy async engine
│   │   ├── deps.py          # Dependency injection (auth, roles)
│   │   └── main.py          # FastAPI app
│   ├── alembic/             # Database migrations
│   ├── tests/               # Pytest test suite
│   ├── requirements.txt     # Python dependencies
│   └── seed.py              # Test data seeding script
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/        # Auth service, HTTP client, models
│   │   │   ├── features/    # Feature modules (campaigns, reviews, etc.)
│   │   │   ├── shared/      # Reusable shell, pipes, components
│   │   │   ├── app.routes.ts   # Route definitions with lazy loading
│   │   │   ├── app.config.ts   # Angular config (PrimeNG theme)
│   │   │   └── main.ts      # Bootstrap
│   │   └── styles/          # Global styles, design tokens
│   ├── angular.json         # Angular CLI config
│   ├── package.json         # npm dependencies
│   └── tsconfig.json        # TypeScript config
└── valuescollection_schema.sql  # Complete PostgreSQL schema

```

## Database Schema

Two separate namespaces:

**ux_vc** (Frontend-facing tables):
- users, portfolios, properties, campaigns, assignments, delegations
- submissions, reviews, signed_links, reminders, audit_events

**wf_vc** (Backend internal tables):
- campaign_portfolios, form_schemas, submission_history, attachments
- signed_link_assignments, deadline_extensions

## API Endpoints Overview

### Auth
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/external-verify` - Verify external contributor passcode
- `POST /auth/logout` - Logout (client-side token removal)

### Campaigns
- `GET /campaigns` - List campaigns (with optional status filter)
- `POST /campaigns` - Create campaign
- `GET /campaigns/{id}` - Campaign detail
- `POST /campaigns/{id}/activate` - Activate campaign
- `POST /campaigns/{id}/extend-deadline` - Extend due date
- `GET /campaigns/{id}/stats` - Campaign statistics
- `GET /campaigns/{id}/audit` - Campaign audit trail

### Assignments
- `GET /campaigns/{campaignId}/assignments` - Campaign assignments
- `GET /assignments` - All assignments (cross-campaign)
- `POST /assignments/bulk-action` - Bulk operations (remind, extend, delegate, approve)
- `POST /assignments/{id}/submission/submit` - Submit assignment

### Delegations
- `GET /delegations` - My delegations
- `GET /delegations/campaign/{campaignId}` - Campaign delegations
- `POST /delegations/users/{userId}/ooo` - Set OOO blanket delegation
- `DELETE /delegations/{id}` - Revoke delegation

### Submissions & Reviews
- `GET /assignments/{id}/submission` - Get submission data
- `PUT /assignments/{id}/submission` - Save submission (upsert)
- `GET /reviews/queue` - Submissions awaiting review
- `POST /submissions/{id}/review` - Submit review decision

### Forms & External
- `GET /campaigns/{id}/form-schema` - Campaign form schema
- `PUT /campaigns/{id}/form-schema` - Save form schema
- `POST /campaigns/{id}/form-schema/publish` - Publish form
- `POST /auth/external-verify` - External contributor verification

## Key Features

### Authentication
- JWT with access (15min) and refresh (7 days) tokens
- Scoped external tokens (8 hours) for contributor signed links
- Role-based access control (admin, reviewer, coordinator, data_provider, read_only)

### Delegations
- **Level 1**: Immediate (receives assignment immediately)
- **Level 2**: Escalated (activates on SLA breach or manual trigger)
- **OOO Blanket**: Time-boxed, all assignments route to delegate

### Submissions
- Form-based data entry (COPE/TIV values)
- Automatic history snapshots with version tracking
- Material change detection (>10% TIV delta from prior year)
- File attachments support

### Reviews
- Reviewer queue with TIV delta display
- Approve/reject with reason codes
- Escalation flagging

### External Contributors
- Secure signed links (bundled or per-location)
- 6-digit passcode verification
- Restricted assignment access

## Common Tasks

### Run Tests
```bash
# Backend
cd backend
pytest tests/

# Frontend
cd frontend
npm test
```

### Create New Migration
```bash
cd backend
alembic revision --autogenerate -m "Description"
alembic upgrade head
```

### View Database
```bash
psql valuescollection

\dt ux_vc.*       # View frontend tables
\dt wf_vc.*       # View backend tables
\d ux_vc.campaigns  # Show table structure
```

### Check API Docs
Navigate to `http://localhost:8000/docs` (Swagger UI)

### Format Code
```bash
# Backend
cd backend
pip install black
black app/

# Frontend
cd frontend
npm run lint
```

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 8000
lsof -i :8000
kill -9 <PID>

# Or use different port
python -m uvicorn app.main:app --reload --port 8001
```

### Database Connection Failed
```bash
# Check PostgreSQL is running
pg_isready

# Verify credentials in .env
psql -U postgres valuescollection
```

### Node Module Issues
```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### CORS Errors
Frontend on `localhost:4200` is configured in backend `main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    ...
)
```

## Performance Tips

- Use `--reload` in dev; remove in production
- Database indexes on assignment.status, campaign.owner_id, etc.
- Frontend uses lazy-loaded routes (only load modules when needed)
- Async/await for non-blocking I/O in backend

## Next Steps

- Read `requirements.md` for detailed feature specifications
- Check `plan.md` for implementation architecture
- Review `valuescollection_schema.sql` for complete data model
- Start with `http://localhost:8000/docs` to explore API

## Support

For issues or questions:
1. Check logs: Backend writes to stdout; Frontend to browser console
2. Review test files in `backend/tests/` for usage examples
3. Check Angular components in `frontend/src/app/features/` for UI patterns

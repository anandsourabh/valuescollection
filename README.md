# Values Collection Tool

A comprehensive property values collection platform for insurance renewal campaigns, built with Angular 19, FastAPI, and PostgreSQL.

## Overview

The Values Collection Tool automates the process of gathering and validating property values from insureds during policy renewal. It provides:

- **Campaign Management** - Create and manage multi-location renewal campaigns
- **Assignment Tracking** - Assign properties to teams with deadline tracking
- **Smart Delegations** - Flexible user delegation for out-of-office situations
- **Value Submission** - Collect COPE and TIV data with automatic delta calculation
- **Review Workflow** - Multi-level review and approval process with reason codes
- **Form Builder** - JSON schema editor for customizable submission forms
- **External Contributor Access** - Passcode-based access for external parties
- **Analytics & Insights** - 7 SQL views for campaign performance monitoring
- **Comprehensive Testing** - 100+ backend tests + frontend unit tests with Karma/Jasmine

## Technology Stack

### Frontend
- **Framework**: Angular 19 (latest)
- **UI Library**: PrimeNG 21 with Aura theme
- **State Management**: RxJS Observables + Angular signals
- **Testing**: Jasmine + Karma
- **Build**: Angular CLI 19

### Backend
- **Framework**: FastAPI (async)
- **Database**: PostgreSQL 16 with asyncpg
- **ORM**: SQLAlchemy 2.x (async)
- **Testing**: pytest + pytest-asyncio
- **Auth**: JWT (access/refresh tokens)

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Web Server**: Nginx (reverse proxy)
- **CI/CD**: GitHub Actions ready

## Quick Start

### Option 1: Docker (Recommended)

```bash
git clone https://github.com/anandsourabh/valuescollection.git
cd valuescollection

# Setup environment
echo "JWT_SECRET=$(openssl rand -base64 32)" > .env

# Start all services
docker-compose up -d

# Access: http://localhost
```

### Option 2: Local Development

See [SETUP.md](SETUP.md) for detailed local setup.

## Project Structure

```
backend/          # FastAPI application
├── app/          # Main application code
├── tests/        # 106 tests (2600+ lines)
└── alembic/      # Database migrations

frontend/         # Angular 19 application
├── src/          # Source code
├── karma.conf.js # Test runner
└── package.json  # Dependencies

valuescollection_schema.sql  # PostgreSQL with 7 views
docker-compose.yml           # Multi-container setup
```

## Features

### Campaign Management
- Create multi-property campaigns with customizable SLA
- Deadline tracking with breach detection
- Status: Draft → Active → Completed → Archived

### Assignment Workflow
- Bulk assignment with deadline extension
- Flexible delegation system
- Progress tracking and analytics

### Value Submission
- Dynamic form schema editor
- COPE and TIV data collection
- Automatic change delta calculation
- Material change detection (>10% threshold)

### Review Process
- 3-level approval workflow
- Approve/Reject with reason codes
- Data confirmation
- Escalation for material changes

### User Management
- Role-based access control
- Two-level delegation (L1, L2)
- Out-of-office delegation
- External contributor access
- Complete audit trail

## API Endpoints

**Base URL**: `/api`

- **Auth**: `/auth/login`, `/auth/refresh`, `/auth/logout`
- **Campaigns**: `/campaigns` (CRUD, publish, extend-deadline)
- **Assignments**: `/assignments` (list, create, bulk-action)
- **Submissions**: `/submissions` (create, update, finalize)
- **Reviews**: `/reviews` (queue, approve/reject)
- **Users**: `/users/me` (current user info)
- **Delegations**: `/delegations` (create, revoke, OOO)

Full docs available at `/api/docs` when running.

## Testing

### Backend (pytest)
```bash
cd backend
python -m pytest tests/ -v
```
- 106 tests across 6 test files
- Authentication, campaigns, assignments, delegations, submissions, reviews
- Full CRUD coverage with error scenarios

### Frontend (Jasmine/Karma)
```bash
cd frontend
npm run test -- --watch=false
```
- 100+ test cases
- Service, component, and guard tests
- Coverage thresholds: 60% statements/lines, 50% branches/functions

## Configuration

**Required Environment Variables:**
```bash
JWT_SECRET=your-secret-key-min-32-chars
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/valuescollection
```

See [SETUP.md](SETUP.md) for complete configuration.

## Database

**PostgreSQL 16** with two namespaces:

- **ux_vc** (11 tables) - Frontend-facing data
- **wf_vc** (6 tables) - Backend workflow data
- **7 Views** - Analytics and reporting

Includes pre-built indexes and optimized queries.

## Deployment

### Docker Compose (Development)
```bash
docker-compose up -d
```

### Production
See [DEPLOYMENT.md](DEPLOYMENT.md) for:
- Docker registry push
- Kubernetes deployment
- AWS (ECS/Fargate)
- GCP (Cloud Run)
- Azure (Container Instances)

## Documentation

- [SETUP.md](SETUP.md) - Local development setup
- [DOCKER.md](DOCKER.md) - Docker deployment guide
- [DEPLOYMENT.md](DEPLOYMENT.md) - Production deployment
- [frontend/TESTING.md](frontend/TESTING.md) - Frontend testing
- API Docs - Available at `/api/docs` when running

## Security

- JWT authentication with token refresh
- Role-based access control (RBAC)
- Input validation with Pydantic
- SQL injection prevention (parameterized queries)
- Security headers (HSTS, CSP, X-Frame-Options)
- Rate limiting (100 req/min)
- Complete audit trail

## Support

**Documentation**: See files above

**Issues**: https://github.com/anandsourabh/valuescollection/issues

## Version

Current: **1.0.0** | Status: **Production Ready**

---

Built with ❤️ using Angular 19, FastAPI, and PostgreSQL

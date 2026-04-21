# Docker Setup Guide

## Quick Start

### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+

### Start All Services
```bash
docker-compose up -d
```

This starts:
- **PostgreSQL** (port 5432) - Database with schema pre-loaded
- **Backend** (port 8000) - FastAPI with hot-reload
- **Frontend** (port 80) - Angular served by Nginx

### Access the Application
- **Frontend**: http://localhost
- **Backend API**: http://localhost/api
- **API Docs**: http://localhost/api/docs
- **Database**: `psql -h localhost -U postgres valuescollection`

### Stop Services
```bash
docker-compose down
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

## Development Workflow

### Backend Changes
The backend container has hot-reload enabled. Changes to `backend/app/` automatically reload:
```bash
docker-compose logs -f backend
```

### Frontend Changes
For frontend changes, rebuild the image:
```bash
docker-compose up -d --build frontend
```

Or run frontend locally instead:
```bash
cd frontend
npm install --legacy-peer-deps
npm start  # Runs on localhost:4200
```

### Database Access
```bash
# Connect to database
docker-compose exec postgres psql -U postgres valuescollection

# Run queries
\dt ux_vc.*       # View frontend tables
\dt wf_vc.*       # View backend tables
\q               # Quit
```

## Configuration

### Environment Variables
Create `.env` file in repo root:
```ini
JWT_SECRET=your-very-secret-key-at-least-32-characters-long
```

### PostgreSQL
- **Host**: `postgres` (or `localhost` from host machine)
- **Port**: 5432
- **User**: postgres
- **Password**: postgres
- **Database**: valuescollection

### Backend
- **Host**: `backend:8000` (from other containers)
- **Host**: `http://localhost:8000` (from host machine)
- **Reload**: Automatic on file changes

### Frontend
- **Host**: `http://localhost` (from host machine)
- **API**: Proxied to backend via Nginx

## Common Tasks

### Seed New Data
```bash
docker-compose exec backend python seed.py
```

### Run Migrations
```bash
docker-compose exec backend python -m alembic upgrade head
```

### View Uploaded Files
```bash
docker-compose exec backend ls -la uploads/
```

### Clean Everything
```bash
# Stop containers, remove volumes
docker-compose down -v

# Rebuild from scratch
docker-compose up -d --build
```

## Production Deployment

### Build Images
```bash
docker build -f Dockerfile.backend -t valuescollection:backend .
docker build -f Dockerfile.frontend -t valuescollection:frontend .
```

### Push to Registry
```bash
docker tag valuescollection:backend myregistry/valuescollection:backend
docker push myregistry/valuescollection:backend

docker tag valuescollection:frontend myregistry/valuescollection:frontend
docker push myregistry/valuescollection:frontend
```

### Deploy with Compose
```bash
docker-compose -f docker-compose.yml up -d
```

### Kubernetes Example
See `k8s/` directory for Kubernetes manifests (if available).

## Troubleshooting

### Port Already in Use
```bash
# Change ports in docker-compose.yml
# Or free the port:
lsof -i :8000
kill -9 <PID>
```

### Database Connection Failed
```bash
# Check if postgres is running
docker-compose logs postgres

# Restart postgres
docker-compose restart postgres
```

### Frontend Not Connecting to Backend
```bash
# Check Nginx logs
docker-compose logs frontend

# Verify backend is healthy
curl http://localhost:8000/health
```

### Clear Cache and Rebuild
```bash
docker-compose down
docker system prune -a
docker-compose up -d --build
```

## Performance Optimization

### Disable Hot-Reload (Production)
In `docker-compose.yml`, change backend command:
```yaml
command: uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend Caching
Nginx is configured with cache headers for static assets (1 year).

### Database Optimization
- Indexes are pre-created on all foreign keys
- Use `EXPLAIN` to analyze query performance:
  ```bash
  docker-compose exec postgres psql -U postgres valuescollection
  EXPLAIN ANALYZE SELECT * FROM ux_vc.campaigns;
  ```

## Monitoring

### Health Checks
All services have health checks enabled:
```bash
docker-compose ps
```

### Resource Usage
```bash
docker stats
```

### Logs
```bash
# Real-time logs
docker-compose logs -f --tail=100

# Specific service
docker-compose logs backend | tail -50
```

## CI/CD Integration

### GitHub Actions
Use the provided `.github/workflows/deploy.yml` for automated builds and pushes.

### Environment Secrets
Set these in GitHub repository settings:
- `DOCKER_REGISTRY_USER`
- `DOCKER_REGISTRY_PASSWORD`
- `JWT_SECRET`

## Support

For issues:
1. Check logs: `docker-compose logs -f`
2. Verify services: `docker-compose ps`
3. Check health: `curl http://localhost/health`
4. Review `SETUP.md` for non-Docker setup


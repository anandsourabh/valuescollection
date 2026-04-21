# Deployment Guide

## Overview

The Values Collection Tool can be deployed in multiple ways:
1. **Local Development** - Using docker-compose
2. **Docker Hub/Registry** - Pre-built containers
3. **Kubernetes** - Enterprise-grade orchestration
4. **Cloud Providers** - AWS, GCP, Azure integrations

## Prerequisites

### For All Deployments
- PostgreSQL 16+
- Node.js 18+ (for frontend builds)
- Python 3.10+ (for backend builds)
- Docker & Docker Compose 2.0+ (for containerized deployment)

### For Cloud Deployments
- AWS CLI / GCP CLI / Azure CLI (as applicable)
- Container registry credentials
- Cloud provider account with appropriate permissions

## Quick Start (Local Docker)

### 1. Clone Repository
```bash
git clone https://github.com/anandsourabh/valuescollection.git
cd valuescollection
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Start Services
```bash
docker-compose up -d
```

### 4. Access Application
- **Frontend**: http://localhost
- **API Docs**: http://localhost/api/docs
- **Backend API**: http://localhost:8000

## Environment Configuration

### Required Environment Variables

```bash
# JWT Configuration
JWT_SECRET=your-very-secret-key-at-least-32-characters-long

# Database (for non-Docker deployments)
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/valuescollection

# Frontend
FRONTEND_URL=http://localhost:3000
API_BASE_URL=http://localhost:8000/api

# Email Configuration (Optional)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=noreply@valuescollection.com

# Upload Directory
UPLOAD_DIR=/app/uploads
MAX_UPLOAD_SIZE_MB=20

# Logging
LOG_LEVEL=INFO
```

### Generate JWT Secret
```bash
# Linux/macOS
openssl rand -base64 32

# Windows
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

## Database Migrations

### Initialize Schema
```bash
# Using Docker
docker-compose exec backend python -m alembic upgrade head

# Local Python
python -m alembic upgrade head
```

### Create Migration
```bash
alembic revision --autogenerate -m "Description of changes"
alembic upgrade head
```

### Seed Test Data
```bash
docker-compose exec backend python seed.py
```

## Docker Deployment

### Build Images
```bash
# Backend
docker build -f Dockerfile.backend -t valuescollection:backend-latest .

# Frontend
docker build -f Dockerfile.frontend -t valuescollection:frontend-latest .
```

### Push to Registry
```bash
# Login to registry
docker login ghcr.io

# Tag images
docker tag valuescollection:backend-latest ghcr.io/anandsourabh/valuescollection/backend:latest
docker tag valuescollection:frontend-latest ghcr.io/anandsourabh/valuescollection/frontend:latest

# Push images
docker push ghcr.io/anandsourabh/valuescollection/backend:latest
docker push ghcr.io/anandsourabh/valuescollection/frontend:latest
```

### Run Containers
```bash
# Backend
docker run -d \
  --name valuescollection-backend \
  -p 8000:8000 \
  -e DATABASE_URL=postgresql+asyncpg://user:pass@postgres:5432/valuescollection \
  -e JWT_SECRET=your-secret \
  valuescollection:backend-latest

# Frontend
docker run -d \
  --name valuescollection-frontend \
  -p 80:80 \
  valuescollection:frontend-latest
```

## Kubernetes Deployment

### Prerequisites
```bash
# Install kubectl
kubectl cluster-info

# Create namespace
kubectl create namespace valuescollection
```

### Create ConfigMaps and Secrets
```bash
kubectl create configmap valuescollection-config \
  -n valuescollection \
  --from-literal=LOG_LEVEL=INFO

kubectl create secret generic valuescollection-secrets \
  -n valuescollection \
  --from-literal=JWT_SECRET=your-secret-key
```

### Deploy Using Helm (Optional)
```bash
helm repo add valuescollection https://charts.valuescollection.com
helm install valuescollection valuescollection/valuescollection \
  -n valuescollection
```

### Deploy Using kubectl
```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/database.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/ingress.yaml
```

### Verify Deployment
```bash
kubectl get pods -n valuescollection
kubectl logs -f deployment/valuescollection-backend -n valuescollection
```

## AWS Deployment

### Using ECS (Elastic Container Service)

1. **Create ECR Repositories**
```bash
aws ecr create-repository --repository-name valuescollection/backend
aws ecr create-repository --repository-name valuescollection/frontend
```

2. **Push Images**
```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com

docker tag valuescollection:backend <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/valuescollection/backend:latest
docker push <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/valuescollection/backend:latest
```

3. **Create RDS PostgreSQL**
```bash
aws rds create-db-instance \
  --db-instance-identifier valuescollection-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username postgres \
  --master-user-password <PASSWORD>
```

4. **Create ECS Cluster**
```bash
aws ecs create-cluster --cluster-name valuescollection
```

5. **Deploy Services**
See AWS documentation for task definition and service creation.

### Using Lambda (For Serverless Backend)

Not recommended for FastAPI - use ECS or Fargate instead.

## GCP Deployment

### Using Cloud Run
```bash
# Build image
gcloud builds submit --tag gcr.io/PROJECT_ID/valuescollection-backend

# Deploy backend
gcloud run deploy valuescollection-backend \
  --image gcr.io/PROJECT_ID/valuescollection-backend \
  --platform managed \
  --region us-central1 \
  --set-env-vars JWT_SECRET=your-secret

# Deploy frontend to Cloud Storage + Cloud CDN
gsutil -m cp -r frontend/dist/* gs://valuescollection-frontend/
```

## Azure Deployment

### Using Container Instances
```bash
az container create \
  --resource-group valuescollection \
  --name valuescollection-backend \
  --image valuescollection:backend-latest \
  --ports 8000 \
  --environment-variables JWT_SECRET=your-secret
```

### Using App Service
```bash
az appservice plan create \
  --name valuescollection-plan \
  --resource-group valuescollection \
  --sku B2 --is-linux

az webapp create \
  --resource-group valuescollection \
  --plan valuescollection-plan \
  --name valuescollection-app \
  --deployment-container-image-name valuescollection:backend-latest
```

## Production Hardening

### Security Best Practices

1. **Use HTTPS/TLS**
```nginx
# In nginx.conf
listen 443 ssl http2;
ssl_certificate /etc/ssl/certs/cert.pem;
ssl_certificate_key /etc/ssl/private/key.pem;
```

2. **Enable CORS Properly**
```python
# In main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],  # Specific origin
    allow_methods=["GET", "POST", "PUT", "DELETE"],  # Specific methods
    allow_headers=["Authorization", "Content-Type"],
)
```

3. **Database Backups**
```bash
# PostgreSQL backup
pg_dump -h localhost -U postgres valuescollection > backup.sql

# Restore
psql -h localhost -U postgres valuescollection < backup.sql
```

4. **Rotate Secrets**
```bash
# Update JWT_SECRET periodically
# Update database passwords every 90 days
# Rotate API keys monthly
```

### Performance Optimization

1. **Enable Caching**
```python
from fastapi.staticfiles import StaticFiles
app.mount("/static", StaticFiles(directory="frontend/dist"), name="static")
```

2. **Database Indexing**
```sql
-- Already included in schema.sql
-- Verify indexes are created:
SELECT * FROM pg_indexes WHERE schemaname='ux_vc';
```

3. **Connection Pooling**
```python
# In database.py - already configured
engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    poolclass=NullPool,  # Or use QueuePool for connection pooling
    pool_size=20,
    max_overflow=10,
)
```

## Monitoring and Logging

### Configure Logging
```python
# In main.py - already configured
import logging
logging.basicConfig(level=logging.INFO)
```

### Health Checks
```bash
# Backend health
curl http://localhost:8000/health

# Database health
curl http://localhost:8000/api/health/db

# Frontend health
curl http://localhost/health
```

### Metrics Monitoring
```python
# Optional: Add Prometheus metrics
from prometheus_client import Counter, Histogram
from fastapi_prometheus_instrumentator import Instrumentator

Instrumentator().instrument(app).expose(app)
```

## Troubleshooting Deployment

### Container Won't Start
```bash
# Check logs
docker-compose logs backend

# Verify environment
docker-compose config | grep -A10 backend
```

### Database Connection Failed
```bash
# Test connection
psql -h localhost -U postgres -d valuescollection

# Check logs
docker-compose logs postgres
```

### API Not Responding
```bash
# Check service status
docker-compose ps

# Restart service
docker-compose restart backend

# View API logs
docker-compose logs -f backend
```

### High Memory Usage
```bash
# Monitor container stats
docker stats valuescollection_backend

# Increase Docker limits
# In docker-compose.yml, add:
# mem_limit: 2gb
# memswap_limit: 4gb
```

## Backup and Recovery

### Automated Backups
```bash
# Daily backup script
#!/bin/bash
BACKUP_DIR="/backups/valuescollection"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

pg_dump -h postgres -U postgres valuescollection | gzip > $BACKUP_DIR/backup_$TIMESTAMP.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -type f -mtime +30 -delete
```

### Recovery Procedure
```bash
# 1. Stop application
docker-compose down

# 2. Restore database
gunzip < backup.sql.gz | psql -h localhost -U postgres valuescollection

# 3. Restart application
docker-compose up -d

# 4. Verify
curl http://localhost:8000/health
```

## Documentation

- **Setup Guide**: [SETUP.md](SETUP.md)
- **Docker Guide**: [DOCKER.md](DOCKER.md)
- **API Documentation**: http://localhost:8000/api/docs
- **Frontend Testing**: [frontend/TESTING.md](frontend/TESTING.md)
- **Backend Testing**: [backend/README.md](backend/README.md)

## Support and Issues

For deployment issues:
1. Check logs: `docker-compose logs -f`
2. Review error codes in [exceptions.py](backend/app/exceptions.py)
3. Verify environment variables
4. Check [Troubleshooting](#troubleshooting-deployment) section
5. Open issue on GitHub: https://github.com/anandsourabh/valuescollection/issues

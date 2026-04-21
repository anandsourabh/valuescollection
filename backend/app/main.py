import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi

from app.config import settings
from app.routers import auth, users, campaigns, properties, assignments, delegations, submissions, reviews, signed_links, forms, audit


@asynccontextmanager
async def lifespan(app: FastAPI):
    os.makedirs(settings.upload_dir, exist_ok=True)
    yield


app = FastAPI(
    title="Values Collection API",
    version="1.0.0",
    description="Property Insurance Renewal Values Collection Platform - Manage campaigns, assignments, and submissions",
    lifespan=lifespan,
    contact={
        "name": "Blue[i] Support",
        "email": "support@bluei.com",
        "url": "https://bluei.com/support",
    },
    license_info={
        "name": "Copyright © 2024 Blue[i]. All rights reserved.",
    },
    servers=[
        {"url": "http://localhost:8000", "description": "Development server"},
        {"url": "/api", "description": "API prefix via reverse proxy"},
    ],
)


def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title="Values Collection API",
        version="1.0.0",
        description="Property Insurance Renewal Values Collection Platform",
        routes=app.routes,
    )
    openapi_schema["info"]["x-logo"] = {
        "url": "https://bluei.com/logo.png",
        "altText": "Blue[i] Logo",
    }
    openapi_schema["externalDocs"] = {
        "description": "Project Documentation",
        "url": "https://github.com/anandsourabh/valuescollection",
    }
    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(campaigns.router)
app.include_router(properties.router)
app.include_router(assignments.router)
app.include_router(delegations.router)
app.include_router(submissions.router)
app.include_router(reviews.router)
app.include_router(signed_links.router)
app.include_router(forms.router)
app.include_router(audit.router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "values-collection-api"}

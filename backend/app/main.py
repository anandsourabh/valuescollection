import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import auth, users, campaigns, properties, assignments, delegations, submissions, reviews, signed_links, forms, audit


@asynccontextmanager
async def lifespan(app: FastAPI):
    os.makedirs(settings.upload_dir, exist_ok=True)
    yield


app = FastAPI(
    title="Values Collection API",
    version="1.0.0",
    description="Blue[i] Property Values Collection Tool",
    lifespan=lifespan,
)

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

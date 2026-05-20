"""
WealthyMinds Analytics Service
FastAPI microservice for portfolio analytics, risk computation,
allocation intelligence, behavioral analytics, and wealth projections.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.api.v1 import router as api_router
from app.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    # Startup
    print(f"🚀 WealthyMinds Analytics Service starting on port {settings.PORT}")
    yield
    # Shutdown
    print("👋 Analytics Service shutting down")


app = FastAPI(
    title="WealthyMinds Analytics Service",
    description="Portfolio analytics, risk computation, and AI preprocessing microservice.",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "wealthyminds-analytics",
        "version": "0.1.0",
    }

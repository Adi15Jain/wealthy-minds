"""
API v1 router — aggregates all analytics endpoints.
"""

from fastapi import APIRouter
from app.api.v1.endpoints import risk, projection, behavioral, allocation

router = APIRouter()

router.include_router(risk.router, prefix="/risk", tags=["Risk Analytics"])
router.include_router(projection.router, prefix="/projection", tags=["Wealth Projection"])
router.include_router(behavioral.router, prefix="/behavioral", tags=["Behavioral Analytics"])
router.include_router(allocation.router, prefix="/allocation", tags=["Allocation Intelligence"])

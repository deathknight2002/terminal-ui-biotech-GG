"""
API Router Configuration

Main router setup for all API endpoints.
"""

from fastapi import APIRouter
from .endpoints import biotech, financial, market, analytics

# Main API router
api_router = APIRouter()

# Include endpoint routers
api_router.include_router(
    biotech.router,
    prefix="/biotech",
    tags=["biotech"]
)

api_router.include_router(
    financial.router,
    prefix="/financial", 
    tags=["financial"]
)

api_router.include_router(
    market.router,
    prefix="/market",
    tags=["market"]
)

api_router.include_router(
    analytics.router,
    prefix="/analytics",
    tags=["analytics"]
)
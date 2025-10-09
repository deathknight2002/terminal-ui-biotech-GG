"""
API Router Configuration

Main router setup for all API endpoints.
"""

from fastapi import APIRouter
from .endpoints import biotech, financial, market, analytics, search, news, insights, catalysts, competition, admin, loe, reports

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
    prefix="/financials", 
    tags=["financials"]
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

# New routers for Aurora Taskbar features
api_router.include_router(
    search.router,
    prefix="/search",
    tags=["search"]
)

api_router.include_router(
    news.router,
    prefix="/news",
    tags=["news"]
)

api_router.include_router(
    insights.router,
    prefix="/insights",
    tags=["insights"]
)

api_router.include_router(
    catalysts.router,
    prefix="/catalysts",
    tags=["catalysts"]
)

api_router.include_router(
    competition.router,
    prefix="/competition",
    tags=["competition"]
)

api_router.include_router(
    admin.router,
    prefix="/admin",
    tags=["admin"]
)

# Financials module routers
api_router.include_router(
    loe.router,
    prefix="/loe",
    tags=["loe"]
)

api_router.include_router(
    reports.router,
    prefix="/reports",
    tags=["reports"]
)
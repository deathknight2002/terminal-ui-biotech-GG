"""
API Router Configuration

Main router setup for all API endpoints.
"""

from fastapi import APIRouter
from .endpoints import biotech, financial, market, analytics, search, news, insights, catalysts, competition, admin, loe, reports, evidence, therapeutic_areas, company_profile, science_events, catalysts_v2, kol, intelligence, fda, trials, research, ml_endpoints, pipeline, evidence_graph, iv_catalyst, predictions

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
    prefix="/catalysts/legacy",
    tags=["catalysts-legacy"]
)

# Enhanced Catalyst API with Provenance (v2)
api_router.include_router(
    catalysts_v2.router,
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

# Evidence Journal endpoints
api_router.include_router(
    evidence.router,
    prefix="/evidence",
    tags=["evidence"]
)

# Science Event Store endpoints - Persistent, queryable, versioned
api_router.include_router(
    science_events.router,
    prefix="/science",
    tags=["science-events"]
)

# Therapeutic area intelligence endpoints
api_router.include_router(
    therapeutic_areas.router,
    prefix="/therapeutic-areas",
    tags=["therapeutic-areas"]
)

# Company Profile endpoints
api_router.include_router(
    company_profile.router,
    prefix="/companies",
    tags=["companies"]
)

# KOL Tracking endpoints
api_router.include_router(
    kol.router,
    tags=["kol"]
)

# Advanced Intelligence endpoints
api_router.include_router(
    intelligence.router,
    prefix="/intelligence",
    tags=["intelligence"]
)

# FDA Intelligence endpoints
api_router.include_router(
    fda.router,
    prefix="/fda",
    tags=["fda-intelligence"]
)

# Clinical Trials Intelligence endpoints
api_router.include_router(
    trials.router,
    prefix="/trials",
    tags=["clinical-trials"]
)

# Research Intelligence endpoints (PubMed)
api_router.include_router(
    research.router,
    prefix="/research",
    tags=["research-intelligence"]
)

# ML endpoints (sentiment analysis, backtesting)
api_router.include_router(
    ml_endpoints.ml_router,
    tags=["machine-learning"]
)

# Pipeline scraper endpoints
api_router.include_router(
    pipeline.router,
    prefix="/pipeline",
    tags=["pipeline"]
)

# Evidence Graph endpoints - Graph-based evidence tracking
api_router.include_router(
    evidence_graph.router,
    prefix="/evidence-graph",
    tags=["evidence-graph"]
)

# IV Catalyst Tracking endpoints - Implied volatility signals for biotech catalysts
api_router.include_router(
    iv_catalyst.router,
    prefix="/iv",
    tags=["iv-catalyst"]
)

# Catalyst Prediction endpoints - ML-powered timing and outcome predictions
api_router.include_router(
    predictions.router,
    prefix="/predictions",
    tags=["predictions"]
)
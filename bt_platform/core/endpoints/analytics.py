"""
Analytics endpoints

Temporary analytics feed offering deterministic data for the UI.
"""

from fastapi import APIRouter

router = APIRouter()


@router.get("/insights")
async def get_analytics_insights() -> dict:
    """Return mocked multi-factor analytics for dashboard widgets."""

    return {
        "factor_scores": {
            "innovation": 0.92,
            "clinical_velocity": 0.81,
            "partnering": 0.67,
            "funding": 0.73,
        },
        "risk_rating": "moderate",
        "last_updated": "2025-10-06T12:00:00Z",
    }

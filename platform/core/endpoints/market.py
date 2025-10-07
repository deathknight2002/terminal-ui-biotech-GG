"""
Market intelligence endpoints

Provides mocked market activity used by the React dashboard.
"""

from fastapi import APIRouter

router = APIRouter()


@router.get("/summary")
async def get_market_summary() -> dict:
    """Expose sample market breadth and sentiment figures."""

    return {
        "sentiment_score": 0.78,
        "advancers": 142,
        "decliners": 38,
        "volume_spike": 1.35,
    }


@router.get("/catalysts")
async def get_market_catalysts() -> dict:
    """Return a light-weight catalyst ticker feed."""

    return {
        "items": [
            {"symbol": "BRX", "event": "FDA Priority Review", "impact": "positive"},
            {"symbol": "GNX", "event": "Phase II data readout", "impact": "watch"},
            {"symbol": "NXO", "event": "Secondary offering", "impact": "negative"},
        ]
    }

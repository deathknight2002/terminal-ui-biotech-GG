"""
Financial endpoints

Placeholder endpoints that surface mocked financial metrics until
provider integrations are wired up.
"""

from fastapi import APIRouter

router = APIRouter()


@router.get("/metrics")
async def get_financial_metrics() -> dict:
    """Return sample financial KPIs used on the dashboard."""

    return {
        "dcf": {"symbol": "BIOX", "npv": 1.42e9, "upside": 0.27},
        "revenue_growth": {"ttm": 0.18, "yoy": 0.22},
        "cash_runway": {"months": 24, "status": "stable"},
    }


@router.get("/valuation")
async def get_sample_valuation() -> dict:
    """Mock valuation multiples so the UI has live data to render."""

    return {
        "ev_to_ebitda": 14.2,
        "price_to_sales": 9.7,
        "sector_percentile": 0.84,
    }

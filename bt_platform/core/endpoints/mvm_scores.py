"""
MVM (Market-Moving) Scoring API Endpoints

Exposes MVM alpha scoring for biotech catalyst events.
Provides backtests, upcoming predictions, and custom event scoring.
"""

from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ..prediction.mvm_alpha import (
    CatalystEvent,
    mini_backtest,
    score_events,
    upcoming_watchlist,
)

router = APIRouter()


class CatalystEventRequest(BaseModel):
    """Request model for scoring a custom catalyst event."""

    ticker: str = Field(..., description="Stock ticker symbol")
    company: str = Field(..., description="Company name")
    date: str = Field(..., description="Event date in ISO format (YYYY-MM-DD)")
    event_type: str = Field(
        ...,
        description="Event type: Phase3_readout, Phase2_readout, Approval, CRL, BTD",
    )
    note: str = Field(..., description="Event description")
    cap_tier: str = Field(..., description="Market cap tier: micro, smid, or large")
    effect_ratio: Optional[float] = Field(
        None,
        description="Optional effect ratio (e.g., PFS treatment/control >= 1.0)",
    )
    attention: str = Field(
        "press",
        description="Attention channel: ESMO, FDA_CR, FDA_approval, BTD_viral, press",
    )


@router.get("/mvm/backtest")
async def get_mvm_backtest():
    """
    Get backtest results on recent 2025 market-moving events.

    Returns precision, recall, accuracy, and direction hit rate for 5 documented events:
    - CELC (Celcuity): +52% on Phase 3 ESMO data
    - SPRB (Spruce): +1,378% on BTD
    - INBX (Inhibrx): +70% on Phase 2 data
    - SRRK (Scholar Rock): -12% on CRL
    - IONS (Ionis): +1.1% on approval

    Returns:
        Dict with table of predictions and performance metrics
    """
    try:
        return mini_backtest()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backtest failed: {str(e)}") from e


@router.get("/mvm/upcoming")
async def get_mvm_upcoming():
    """
    Get MVM scores for upcoming catalyst events.

    Includes November 2025 watchlist:
    - ARWR (Arrowhead): plozasiran PDUFA 11/18
    - OTSKF (Otsuka): sibeprenlimab PDUFA 11/28

    Returns:
        Dict with predictions array containing MVM scores and trade stances
    """
    try:
        predictions = score_events(upcoming_watchlist())
        return {"predictions": predictions}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get upcoming events: {str(e)}"
        ) from e


@router.post("/mvm/score")
async def score_custom_event(event: CatalystEventRequest):
    """
    Score a custom catalyst event.

    Calculate MVM score and trade playbook for any catalyst event.

    Args:
        event: CatalystEventRequest with event details

    Returns:
        Dict with MVM score, expected direction, and trade stance
    """
    try:
        # Convert request to CatalystEvent
        catalyst = CatalystEvent(
            ticker=event.ticker,
            company=event.company,
            date=event.date,
            event_type=event.event_type,
            note=event.note,
            cap_tier=event.cap_tier,
            effect_ratio=event.effect_ratio,
            attention=event.attention,
        )

        # Score the event
        result = score_events([catalyst])

        return result[0] if result else {}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to score event: {str(e)}"
        ) from e


@router.post("/mvm/score-batch")
async def score_batch_events(events: list[CatalystEventRequest]):
    """
    Score multiple catalyst events in batch.

    Args:
        events: List of CatalystEventRequest objects

    Returns:
        Dict with predictions array containing MVM scores for all events
    """
    try:
        # Convert requests to CatalystEvents
        catalysts = [
            CatalystEvent(
                ticker=e.ticker,
                company=e.company,
                date=e.date,
                event_type=e.event_type,
                note=e.note,
                cap_tier=e.cap_tier,
                effect_ratio=e.effect_ratio,
                attention=e.attention,
            )
            for e in events
        ]

        # Score all events
        predictions = score_events(catalysts)

        return {"predictions": predictions}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to score batch: {str(e)}"
        ) from e


@router.get("/mvm/metrics")
async def get_mvm_metrics():
    """
    Get MVM scoring methodology and performance metrics.

    Returns methodology description, feature weights, and backtest performance.

    Returns:
        Dict with methodology details and backtest metrics
    """
    backtest_results = mini_backtest()

    return {
        "methodology": {
            "name": "Market-Moving (MVM) Score",
            "description": "Interpretable, monotone scoring for biotech catalyst events",
            "features": {
                "impact": {
                    "weight": 0.40,
                    "description": "Event type importance (Phase 3, CRL, Approval)",
                },
                "surprise": {
                    "weight": 0.30,
                    "description": "Effect size or event-type prior (PFS ratios, etc.)",
                },
                "attention": {
                    "weight": 0.15,
                    "description": "Visibility channel (ESMO, FDA, BTD viral)",
                },
                "asymmetry": {
                    "weight": 0.15,
                    "description": "Cap-tier potential (micro > smid > large)",
                },
            },
            "score_bands": {
                "high": {"range": "70-100", "stance": "Long gamma into event"},
                "medium": {
                    "range": "60-69",
                    "stance": "Directional with defined risk",
                },
                "low": {"range": "0-59", "stance": "Sell premium / fade IV"},
            },
        },
        "backtest_performance": backtest_results["metrics"],
        "backtest_date_range": "2025-08-21 to 2025-10-23",
        "n_events": 5,
    }

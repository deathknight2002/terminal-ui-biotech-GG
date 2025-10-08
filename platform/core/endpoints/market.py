"""
Market intelligence endpoints

Provides market activity used by the React dashboard.
"""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..database import get_db, MarketData

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


@router.get("/openbb/chart")
async def get_openbb_chart(
    symbol: str = Query(..., description="Ticker symbol to chart"),
    limit: int = Query(60, ge=10, le=365, description="Number of observations to include"),
    db: Session = Depends(get_db),
) -> dict:
    """Serve Plotly-compatible payload for the OpenBB integration."""

    ticker = symbol.upper()
    records = (
        db.query(MarketData)
        .filter(MarketData.ticker == ticker)
        .order_by(MarketData.timestamp.asc())
        .limit(limit)
        .all()
    )

    if not records:
        raise HTTPException(status_code=404, detail=f"No market data found for {ticker}")

    dates = [record.timestamp.isoformat() for record in records]
    opens = [record.open_price for record in records]
    highs = [record.high_price for record in records]
    lows = [record.low_price for record in records]
    closes = [record.close_price for record in records]
    volumes = [record.volume for record in records]

    # Simple trailing moving average
    window = min(10, len(closes))
    moving_average = []
    for idx in range(len(closes)):
        start = max(0, idx - window + 1)
        sample = closes[start : idx + 1]
        moving_average.append(round(sum(sample) / len(sample), 2))

    candlestick = {
        "type": "candlestick",
        "name": ticker,
        "x": dates,
        "open": opens,
        "high": highs,
        "low": lows,
        "close": closes,
        "increasing": {"line": {"color": "#10b981"}},
        "decreasing": {"line": {"color": "#ef4444"}},
    }

    volume_trace = {
        "type": "bar",
        "name": "Volume",
        "x": dates,
        "y": volumes,
        "yaxis": "y2",
        "marker": {"color": "#6366f1"},
        "opacity": 0.35,
    }

    moving_average_trace = {
        "type": "scatter",
        "mode": "lines",
        "name": f"{window}-day MA",
        "x": dates,
        "y": moving_average,
        "line": {"color": "#f97316", "width": 2},
    }

    layout = {
        "title": {"text": f"{ticker} Price & Volume", "font": {"color": "#f8fafc"}},
        "xaxis": {"title": "Date", "rangeslider": {"visible": False}, "gridcolor": "#1e293b"},
        "yaxis": {"title": "Price (USD)", "domain": [0.25, 1], "gridcolor": "#1e293b"},
        "yaxis2": {
            "title": "Volume",
            "domain": [0, 0.18],
            "showgrid": False,
            "overlaying": "y",
            "side": "right",
        },
        "legend": {"orientation": "h", "x": 0, "y": 1.05},
        "margin": {"l": 70, "r": 70, "t": 70, "b": 30},
        "paper_bgcolor": "#0f172a",
        "plot_bgcolor": "#0f172a",
        "hovermode": "x unified",
    }

    config = {
        "responsive": True,
        "displaylogo": False,
        "modeBarButtonsToRemove": ["lasso2d", "autoScale2d"],
    }

    return {
        "data": [candlestick, moving_average_trace, volume_trace],
        "layout": layout,
        "config": config,
        "theme": "dark",
        "command_location": "/equity/price/historical",
        "python_version": "3.11",
        "terminal_version": "biotech-terminal-dev",
        "generated_at": datetime.utcnow().isoformat(),
    }

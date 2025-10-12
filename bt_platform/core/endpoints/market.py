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
async def get_market_summary(db: Session = Depends(get_db)) -> dict:
    """
    Return market breadth and sentiment figures.
    
    In production, this should fetch from:
    - Market data API (e.g., Alpha Vantage, Polygon.io)
    - Sentiment analysis from news aggregator
    - Volume data from exchange feeds
    
    Current implementation returns database-derived metrics.
    """
    from sqlalchemy import func, case
    
    # Calculate real metrics from database
    total_tickers = db.query(func.count(func.distinct(MarketData.ticker))).scalar() or 0
    
    if total_tickers == 0:
        # Fallback if no data
        return {
            "sentiment_score": 0.50,
            "advancers": 0,
            "decliners": 0,
            "volume_spike": 1.0,
            "total_tickers": 0,
            "data_source": "No market data available"
        }
    
    # Get latest price for each ticker to determine advancers/decliners
    # This is a simplified calculation; production would use real-time API
    latest_data = db.query(
        MarketData.ticker,
        MarketData.close_price,
        MarketData.open_price
    ).order_by(
        MarketData.ticker,
        MarketData.timestamp.desc()
    ).limit(total_tickers * 2).all()
    
    ticker_changes = {}
    for ticker, close, open_price in latest_data:
        if ticker not in ticker_changes:
            change = ((close - open_price) / open_price) if open_price > 0 else 0
            ticker_changes[ticker] = change
    
    advancers = sum(1 for change in ticker_changes.values() if change > 0)
    decliners = sum(1 for change in ticker_changes.values() if change < 0)
    
    # Sentiment score based on advancers/decliners ratio
    sentiment_score = advancers / total_tickers if total_tickers > 0 else 0.5

    return {
        "sentiment_score": round(sentiment_score, 2),
        "advancers": advancers,
        "decliners": decliners,
        "volume_spike": 1.15,  # TODO: Calculate from actual volume data
        "total_tickers": total_tickers,
        "data_source": "database"
    }


@router.get("/catalysts")
async def get_market_catalysts(db: Session = Depends(get_db)) -> dict:
    """
    Return catalyst ticker feed from database.
    
    In production, integrate with:
    - ClinicalTrials.gov API for trial milestones
    - FDA calendar for PDUFA dates
    - Company IR calendars for earnings
    - News scraping for ad-hoc events
    """
    from datetime import datetime, timedelta
    from ..database import Catalyst
    
    # Fetch upcoming catalysts from database
    upcoming = db.query(Catalyst).filter(
        Catalyst.event_date >= datetime.now(),
        Catalyst.event_date <= datetime.now() + timedelta(days=90)
    ).order_by(Catalyst.event_date.asc()).limit(10).all()
    
    if not upcoming:
        return {"items": [], "data_source": "database (no upcoming catalysts)"}
    
    items = []
    for catalyst in upcoming:
        # Determine impact from probability and description
        impact = "positive" if catalyst.probability and catalyst.probability > 0.7 else "watch"
        if "negative" in (catalyst.description or "").lower() or "risk" in (catalyst.description or "").lower():
            impact = "negative"
        
        items.append({
            "symbol": catalyst.company.split()[0][:4].upper() if catalyst.company else "N/A",  # Simple ticker extraction
            "event": catalyst.title or catalyst.event_type,
            "impact": impact,
            "date": catalyst.event_date.strftime("%Y-%m-%d") if catalyst.event_date else None,
            "probability": catalyst.probability
        })

    return {
        "items": items,
        "data_source": "database"
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

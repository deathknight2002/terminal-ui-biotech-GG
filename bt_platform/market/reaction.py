"""
Market Reaction Engine
======================

Tracks price, implied volatility, and volume reactions to catalyst events.
Computes relative performance vs XBI benchmark.

Features:
- Multi-window tracking (D-5, D-1, D0, D+1, D+5, D+10)
- XBI-relative performance
- IV z-scores vs 1-year history
- Volume multiples vs 30-day average
- NTP-synced timestamps for alignment
"""

import logging
from typing import Dict, List, Optional, Tuple
from datetime import datetime, date, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import and_

from ..core.schema_catalyst_extensions import MarketReaction
from ..core.contracts_catalyst_extensions import MarketReactionContract

logger = logging.getLogger(__name__)


# ============================================================================
# Constants
# ============================================================================

REACTION_WINDOWS = ["D-5", "D-1", "D0", "D+1", "D+5", "D+10"]

# Time alignment tolerance (minutes)
TIME_ALIGNMENT_TOLERANCE = 2


# ============================================================================
# Helper Functions
# ============================================================================

def parse_window(window: str) -> int:
    """
    Parse window string to day offset.
    
    Args:
        window: Window string like "D0", "D+1", "D-5"
        
    Returns:
        Day offset as integer
    """
    if window == "D0":
        return 0
    
    match = window.replace("D", "")
    return int(match)


def get_window_date(event_date: date, window: str) -> date:
    """
    Calculate date for a given window relative to event.
    
    Args:
        event_date: Date of the catalyst event
        window: Window string
        
    Returns:
        Date for the window
    """
    offset = parse_window(window)
    return event_date + timedelta(days=offset)


# ============================================================================
# Price Data Fetching
# ============================================================================

def fetch_price_data(
    ticker: str,
    start_date: date,
    end_date: date
) -> Dict[date, Dict[str, float]]:
    """
    Fetch price data for ticker in date range.
    
    This is a stub - in production would fetch from:
    - Yahoo Finance API
    - Local market data cache
    - Database historical prices
    
    Args:
        ticker: Stock ticker
        start_date: Start date
        end_date: End date
        
    Returns:
        Dict mapping date to price data
    """
    logger.info(f"Fetching price data for {ticker} from {start_date} to {end_date}")
    
    # Stub implementation - replace with actual data source
    # Would fetch from MarketData table or external API
    return {}


def fetch_xbi_data(
    start_date: date,
    end_date: date
) -> Dict[date, float]:
    """
    Fetch XBI benchmark data for date range.
    
    Args:
        start_date: Start date
        end_date: End date
        
    Returns:
        Dict mapping date to XBI daily return %
    """
    logger.info(f"Fetching XBI data from {start_date} to {end_date}")
    
    # Stub implementation
    return {}


# ============================================================================
# Price Reaction Calculation
# ============================================================================

def calculate_price_reaction(
    ticker: str,
    event_date: date,
    window: str,
    price_data: Dict[date, Dict[str, float]],
    xbi_data: Dict[date, float]
) -> Dict[str, Optional[float]]:
    """
    Calculate price reaction for a single window.
    
    Args:
        ticker: Stock ticker
        event_date: Event date
        window: Window string (D-5, D0, etc)
        price_data: Price data dict
        xbi_data: XBI data dict
        
    Returns:
        Dict with price_abs, price_rel_vs_xbi, intraday_high, intraday_low
    """
    window_date = get_window_date(event_date, window)
    
    if window_date not in price_data:
        logger.warning(f"No price data for {ticker} on {window_date}")
        return {
            "price_abs": None,
            "price_rel_vs_xbi": None,
            "intraday_high": None,
            "intraday_low": None
        }
    
    prices = price_data[window_date]
    
    # Calculate absolute % change (close to close)
    if window == "D0":
        # For D0, use open to close
        price_abs = ((prices['close'] - prices['open']) / prices['open']) * 100 if prices.get('open') else None
    else:
        # For other windows, use close to close
        prev_date = window_date - timedelta(days=1)
        if prev_date in price_data:
            prev_close = price_data[prev_date]['close']
            price_abs = ((prices['close'] - prev_close) / prev_close) * 100
        else:
            price_abs = None
    
    # Calculate relative vs XBI
    price_rel_vs_xbi = None
    if price_abs is not None and window_date in xbi_data:
        xbi_return = xbi_data[window_date]
        price_rel_vs_xbi = price_abs - xbi_return
    
    return {
        "price_abs": price_abs,
        "price_rel_vs_xbi": price_rel_vs_xbi,
        "intraday_high": prices.get('high'),
        "intraday_low": prices.get('low')
    }


# ============================================================================
# IV Data Fetching and Calculation
# ============================================================================

def fetch_iv_data(
    ticker: str,
    date: date,
    tenor: str = "1m"
) -> Optional[float]:
    """
    Fetch implied volatility for ticker on date.
    
    Args:
        ticker: Stock ticker
        date: Date
        tenor: Option tenor (1w, 1m, 3m)
        
    Returns:
        IV percentage or None
    """
    # Stub implementation - would fetch from options data
    return None


def calculate_iv_zscore(
    ticker: str,
    date: date,
    current_iv: float,
    lookback_days: int = 365
) -> Optional[float]:
    """
    Calculate z-score of current IV vs historical.
    
    Args:
        ticker: Stock ticker
        date: Current date
        current_iv: Current IV value
        lookback_days: Days to look back for historical distribution
        
    Returns:
        Z-score or None
    """
    # Stub implementation
    # Would fetch historical IVs, calculate mean/std, return z-score
    return None


# ============================================================================
# Volume Calculation
# ============================================================================

def calculate_volume_multiple(
    ticker: str,
    date: date,
    current_volume: int,
    lookback_days: int = 30
) -> Optional[float]:
    """
    Calculate volume as multiple of average.
    
    Args:
        ticker: Stock ticker
        date: Current date
        current_volume: Current day volume
        lookback_days: Days for average calculation
        
    Returns:
        Volume multiple or None
    """
    # Stub implementation
    # Would fetch historical volumes, calculate average, return multiple
    return None


# ============================================================================
# Main Reaction Calculation
# ============================================================================

def get_reaction(
    ticker: str,
    event_date: date,
    event_time: Optional[datetime] = None,
    windows: List[str] = None
) -> List[MarketReactionContract]:
    """
    Calculate market reactions for all windows.
    
    Args:
        ticker: Stock ticker
        event_date: Date of catalyst event
        event_time: Time of event (for NTP sync alignment)
        windows: List of windows to calculate (default all)
        
    Returns:
        List of MarketReactionContract objects
    """
    if windows is None:
        windows = REACTION_WINDOWS
    
    logger.info(f"Calculating market reaction for {ticker} on {event_date}")
    
    # Calculate date range for data fetch
    min_offset = min(parse_window(w) for w in windows)
    max_offset = max(parse_window(w) for w in windows)
    start_date = event_date + timedelta(days=min_offset - 1)  # Extra day for prev close
    end_date = event_date + timedelta(days=max_offset + 1)
    
    # Fetch data
    price_data = fetch_price_data(ticker, start_date, end_date)
    xbi_data = fetch_xbi_data(start_date, end_date)
    
    # Calculate reactions for each window
    reactions = []
    for window in windows:
        window_date = get_window_date(event_date, window)
        
        # Price reaction
        price_reaction = calculate_price_reaction(
            ticker, event_date, window, price_data, xbi_data
        )
        
        # IV reaction (for D0 and D+1 typically)
        iv_1m = None
        iv_zscore = None
        if window in ["D0", "D+1"]:
            iv_1m = fetch_iv_data(ticker, window_date, "1m")
            if iv_1m:
                iv_zscore = calculate_iv_zscore(ticker, window_date, iv_1m)
        
        # Volume
        volume = price_data.get(window_date, {}).get('volume')
        volume_multiple = None
        if volume:
            volume_multiple = calculate_volume_multiple(ticker, window_date, volume)
        
        # Create contract
        reaction = MarketReactionContract(
            event_id="",  # Will be set by caller
            ticker=ticker,
            window=window,
            window_date=window_date,
            price_abs=price_reaction['price_abs'],
            price_rel_vs_xbi=price_reaction['price_rel_vs_xbi'],
            intraday_high=price_reaction['intraday_high'],
            intraday_low=price_reaction['intraday_low'],
            iv_1m_tenor=iv_1m,
            iv_1m_zscore=iv_zscore,
            call_skew=None,  # Would calculate from options chain
            volume=volume,
            volume_multiple_vs_30d=volume_multiple
        )
        
        reactions.append(reaction)
    
    return reactions


# ============================================================================
# Database Operations
# ============================================================================

def save_reactions(
    db: Session,
    event_id: str,
    reactions: List[MarketReactionContract]
) -> int:
    """
    Save market reactions to database.
    
    Args:
        db: Database session
        event_id: Event identifier
        reactions: List of reaction contracts
        
    Returns:
        Number of records saved
    """
    saved = 0
    
    for reaction in reactions:
        # Check for existing record
        existing = db.query(MarketReaction).filter(
            and_(
                MarketReaction.event_id == event_id,
                MarketReaction.ticker == reaction.ticker,
                MarketReaction.window == reaction.window
            )
        ).first()
        
        if existing:
            # Update existing
            existing.window_date = reaction.window_date
            existing.price_abs = reaction.price_abs
            existing.price_rel_vs_xbi = reaction.price_rel_vs_xbi
            existing.intraday_high = reaction.intraday_high
            existing.intraday_low = reaction.intraday_low
            existing.iv_1m_tenor = reaction.iv_1m_tenor
            existing.iv_1m_zscore = reaction.iv_1m_zscore
            existing.call_skew = reaction.call_skew
            existing.volume = reaction.volume
            existing.volume_multiple_vs_30d = reaction.volume_multiple_vs_30d
            existing.updated_at = datetime.utcnow()
        else:
            # Create new
            record = MarketReaction(
                event_id=event_id,
                ticker=reaction.ticker,
                window=reaction.window,
                window_date=reaction.window_date,
                price_abs=reaction.price_abs,
                price_rel_vs_xbi=reaction.price_rel_vs_xbi,
                intraday_high=reaction.intraday_high,
                intraday_low=reaction.intraday_low,
                iv_1m_tenor=reaction.iv_1m_tenor,
                iv_1m_zscore=reaction.iv_1m_zscore,
                call_skew=reaction.call_skew,
                volume=reaction.volume,
                volume_multiple_vs_30d=reaction.volume_multiple_vs_30d
            )
            db.add(record)
            saved += 1
    
    try:
        db.commit()
        logger.info(f"Saved {saved} market reactions for event {event_id}")
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to save market reactions: {e}")
        raise
    
    return saved


def compute_expectation_delta(
    outcome: Dict[str, any],
    expectation_band: Dict[str, any]
) -> Dict[str, any]:
    """
    Compute expectation delta as specified in problem statement.
    Returns +1 (beat), 0 (in-line), -1 (miss) with magnitude score 0..1
    
    Args:
        outcome: Dict with 'value' key
        expectation_band: Dict with 'band_low' and 'band_high' keys
        
    Returns:
        Dict with 'class' and 'score' keys
    """
    val = outcome.get("value")
    lo = expectation_band.get("band_low")
    hi = expectation_band.get("band_high")
    
    if val is None or (lo is None and hi is None):
        return {"class": "unknown", "score": 0.0}
    
    # Convert to float for comparison
    val = float(val)
    
    if hi is not None:
        hi = float(hi)
        if val > hi:
            # Beat
            score = min((val - hi) / (hi if hi > 0 else 1), 1.0)
            return {"class": "beat", "score": score}
    
    if lo is not None:
        lo = float(lo)
        if val < lo:
            # Miss
            score = min((lo - val) / (lo if lo > 0 else 1), 1.0)
            return {"class": "miss", "score": score}
    
    # In-line (within bands)
    return {"class": "inline", "score": 0.2}

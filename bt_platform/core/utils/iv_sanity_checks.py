"""
IV Catalyst Sanity Checks

Validation logic to filter out false positive IV signals caused by:
- Sector-wide volatility spikes
- Earnings weeks
- FDA class-wide actions
- Insufficient liquidity
"""

from datetime import datetime, timedelta
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

import logging

logger = logging.getLogger(__name__)


# ============================================================================
# Sector-Wide Volatility Controls
# ============================================================================

def get_xbi_iv_change(
    db: Session,
    date: datetime,
    tenor_days: int = 7,
    lookback_days: int = 7
) -> Optional[float]:
    """
    Get XBI ETF IV change over lookback period.
    Used to subtract sector-wide moves from individual ticker IV.
    
    Args:
        db: Database session
        date: Current date
        tenor_days: IV tenor (typically 7 or 30)
        lookback_days: Period to measure change
    
    Returns:
        XBI IV change percentage (e.g., 5.0 for +5% move)
    """
    try:
        from ..database import OptionsIV
        
        # Get current XBI IV
        current_iv = db.query(OptionsIV).filter(
            and_(
                OptionsIV.ticker == "XBI",
                OptionsIV.tenor_days == tenor_days,
                OptionsIV.date >= date - timedelta(days=1),
                OptionsIV.date <= date
            )
        ).order_by(OptionsIV.date.desc()).first()
        
        # Get historical XBI IV
        past_date = date - timedelta(days=lookback_days)
        past_iv = db.query(OptionsIV).filter(
            and_(
                OptionsIV.ticker == "XBI",
                OptionsIV.tenor_days == tenor_days,
                OptionsIV.date >= past_date - timedelta(days=1),
                OptionsIV.date <= past_date
            )
        ).order_by(OptionsIV.date.desc()).first()
        
        if not current_iv or not past_iv:
            logger.warning(f"XBI IV data not available for date range")
            return None
        
        # Calculate change
        iv_change = current_iv.iv_mid - past_iv.iv_mid
        
        logger.debug(f"XBI IV change ({lookback_days}D): {iv_change:.1f}%")
        return iv_change
        
    except Exception as e:
        logger.error(f"Error calculating XBI IV change: {e}")
        return None


def adjust_for_sector_iv(
    ticker_iv: float,
    xbi_iv_change: Optional[float],
    threshold: float = 5.0
) -> Tuple[float, bool]:
    """
    Adjust ticker IV for sector-wide moves.
    
    Args:
        ticker_iv: Individual ticker IV level
        xbi_iv_change: XBI IV change (from get_xbi_iv_change)
        threshold: Minimum sector move to adjust (default 5%)
    
    Returns:
        (adjusted_iv, is_sector_driven)
        - adjusted_iv: Ticker IV minus sector component
        - is_sector_driven: True if move primarily sector-wide
    """
    if xbi_iv_change is None or abs(xbi_iv_change) < threshold:
        # No significant sector move
        return ticker_iv, False
    
    # Subtract sector component
    adjusted_iv = ticker_iv - xbi_iv_change
    
    # Check if move is primarily sector-driven
    # If ticker IV move is similar to sector, it's not idiosyncratic
    is_sector_driven = abs(adjusted_iv) < threshold
    
    return adjusted_iv, is_sector_driven


# ============================================================================
# Earnings Week Masking
# ============================================================================

def is_earnings_week(
    db: Session,
    ticker: str,
    catalyst_date: datetime,
    window_days: int = 5
) -> bool:
    """
    Check if catalyst falls within earnings window.
    IV signals near earnings are unreliable (earnings IV dominates).
    
    Args:
        db: Database session
        ticker: Stock ticker
        catalyst_date: Catalyst event date
        window_days: Days before/after earnings to mask (default ±5)
    
    Returns:
        True if within earnings window, False otherwise
    """
    try:
        from ..database import Catalyst
        
        # Check for earnings events nearby
        min_date = catalyst_date - timedelta(days=window_days)
        max_date = catalyst_date + timedelta(days=window_days)
        
        earnings_events = db.query(Catalyst).filter(
            and_(
                Catalyst.company == ticker,
                Catalyst.event_type.in_(["Earnings", "Earnings Call", "Q1 Earnings", "Q2 Earnings", "Q3 Earnings", "Q4 Earnings"]),
                Catalyst.event_date >= min_date,
                Catalyst.event_date <= max_date
            )
        ).first()
        
        if earnings_events:
            logger.info(f"{ticker}: Catalyst within earnings window - MASKED")
            return True
        
        return False
        
    except Exception as e:
        logger.error(f"Error checking earnings window for {ticker}: {e}")
        return False  # Assume not earnings week on error


# ============================================================================
# Liquidity Filters
# ============================================================================

def meets_liquidity_requirements(
    db: Session,
    ticker: str,
    min_oi: int = 1000,
    min_avg_volume: int = 100_000,
    min_market_cap: float = 500_000_000  # $500M
) -> Tuple[bool, str]:
    """
    Validate that ticker meets minimum liquidity thresholds.
    
    Args:
        db: Database session
        ticker: Stock ticker
        min_oi: Minimum open interest (contracts)
        min_avg_volume: Minimum average daily volume (shares)
        min_market_cap: Minimum market capitalization ($)
    
    Returns:
        (meets_requirements, failure_reason)
    """
    try:
        from ..database import OptionsIV, PriceData, Company
        
        # Check company market cap
        company = db.query(Company).filter(Company.ticker == ticker).first()
        if not company or not company.market_cap or company.market_cap < min_market_cap:
            return False, f"Market cap ${company.market_cap / 1_000_000:.0f}M < ${min_market_cap / 1_000_000:.0f}M threshold"
        
        # Check options open interest
        latest_oi = db.query(OptionsIV).filter(
            and_(
                OptionsIV.ticker == ticker,
                OptionsIV.tenor_days == 7,
                OptionsIV.total_oi.isnot(None)
            )
        ).order_by(OptionsIV.date.desc()).first()
        
        if not latest_oi or latest_oi.total_oi < min_oi:
            oi_value = latest_oi.total_oi if latest_oi else 0
            return False, f"Open interest {oi_value} < {min_oi} threshold"
        
        # Check average volume
        latest_price = db.query(PriceData).filter(
            PriceData.ticker == ticker
        ).order_by(PriceData.date.desc()).first()
        
        if not latest_price or not latest_price.volume_20d_avg or latest_price.volume_20d_avg < min_avg_volume:
            vol_value = latest_price.volume_20d_avg if latest_price else 0
            return False, f"Average volume {vol_value:,.0f} < {min_avg_volume:,.0f} threshold"
        
        # All checks passed
        return True, "OK"
        
    except Exception as e:
        logger.error(f"Error checking liquidity for {ticker}: {e}")
        return False, f"Error: {str(e)}"


def check_oi_float_sanity(
    db: Session,
    ticker: str,
    max_oi_to_float_ratio: float = 0.10  # 10% max
) -> Tuple[bool, str]:
    """
    Sanity check: Options OI should not be > 10% of float.
    Extremely high ratios suggest data issues or manipulation.
    
    Args:
        db: Database session
        ticker: Stock ticker
        max_oi_to_float_ratio: Maximum OI/float ratio (default 0.10 = 10%)
    
    Returns:
        (is_sane, message)
    """
    try:
        from ..database import OptionsIV, Company
        
        company = db.query(Company).filter(Company.ticker == ticker).first()
        if not company or not company.market_cap:
            return True, "No float data available"
        
        # Estimate float from market cap (rough approximation)
        # Assume average biotech float is ~80% of shares
        # Shares = market_cap / assumed_price
        # This is a rough check - real float data would be better
        
        latest_oi = db.query(OptionsIV).filter(
            and_(
                OptionsIV.ticker == ticker,
                OptionsIV.tenor_days == 7,
                OptionsIV.total_oi.isnot(None)
            )
        ).order_by(OptionsIV.date.desc()).first()
        
        if not latest_oi:
            return True, "No OI data available"
        
        # OI in contracts (each = 100 shares)
        oi_shares = latest_oi.total_oi * 100
        
        # Very rough float estimate (for sanity check only)
        # Better to use actual float from data provider
        assumed_price = 100  # Rough average biotech price
        estimated_float = (company.market_cap / assumed_price) * 0.8
        
        oi_to_float = oi_shares / estimated_float if estimated_float > 0 else 0
        
        if oi_to_float > max_oi_to_float_ratio:
            return False, f"OI/Float ratio {oi_to_float:.1%} exceeds {max_oi_to_float_ratio:.1%} - potential data issue"
        
        return True, f"OI/Float ratio {oi_to_float:.2%} OK"
        
    except Exception as e:
        logger.error(f"Error checking OI/float for {ticker}: {e}")
        return True, "Unable to verify"  # Don't block on error


# ============================================================================
# Catalyst Date Validation
# ============================================================================

def check_for_catalyst_date_slip(
    db: Session,
    catalyst_id: int,
    days_threshold: int = 14
) -> Tuple[bool, Optional[datetime]]:
    """
    Check if catalyst date has been updated recently (guidance slip).
    
    Args:
        db: Database session
        catalyst_id: Catalyst ID to check
        days_threshold: Days to look back for updates
    
    Returns:
        (date_changed, new_date)
        - date_changed: True if date changed recently
        - new_date: New event date if changed, None otherwise
    """
    try:
        from ..database import Catalyst
        
        catalyst = db.query(Catalyst).filter(Catalyst.id == catalyst_id).first()
        if not catalyst:
            return False, None
        
        # In production, this would track a history table
        # For now, we check if updated_at is recent
        # This is a placeholder - proper implementation needs audit log
        
        logger.debug(f"Catalyst date validation not fully implemented - requires audit table")
        return False, None
        
    except Exception as e:
        logger.error(f"Error checking catalyst date slip: {e}")
        return False, None


# ============================================================================
# FDA Class-Wide Actions Check
# ============================================================================

def check_fda_class_concerns(
    db: Session,
    ticker: str,
    lookback_days: int = 30
) -> Tuple[bool, str]:
    """
    Check for recent FDA class-wide warnings or concerns.
    
    This is a placeholder - in production, would integrate with:
    - FDA safety communications database
    - News sentiment analysis
    - Regulatory filings (8-K)
    
    Args:
        db: Database session
        ticker: Stock ticker
        lookback_days: Days to look back for FDA actions
    
    Returns:
        (has_concerns, description)
    """
    # Placeholder for FDA class-wide action checking
    # In production, this would:
    # 1. Query FDA database for safety communications
    # 2. Check company's drug class/mechanism
    # 3. Flag if recent class warning issued
    
    logger.debug(f"FDA class-wide check for {ticker} - placeholder implementation")
    return False, "No known class-wide concerns"


# ============================================================================
# Master Validation Function
# ============================================================================

def validate_iv_signal(
    db: Session,
    ticker: str,
    catalyst_id: int,
    catalyst_date: datetime,
    current_date: datetime = None
) -> Tuple[bool, list]:
    """
    Run all sanity checks on an IV catalyst signal.
    
    Args:
        db: Database session
        ticker: Stock ticker
        catalyst_id: Catalyst ID
        catalyst_date: Catalyst event date
        current_date: Current date (defaults to now)
    
    Returns:
        (is_valid, warnings)
        - is_valid: True if signal passes all checks
        - warnings: List of warning messages (empty if all clear)
    """
    if current_date is None:
        current_date = datetime.utcnow()
    
    warnings = []
    
    # 1. Earnings week check
    if is_earnings_week(db, ticker, catalyst_date):
        warnings.append("Within earnings window - IV signal may be unreliable")
        return False, warnings
    
    # 2. Liquidity check
    meets_liquidity, liquidity_msg = meets_liquidity_requirements(db, ticker)
    if not meets_liquidity:
        warnings.append(f"Liquidity insufficient: {liquidity_msg}")
        return False, warnings
    
    # 3. OI/Float sanity
    oi_sane, oi_msg = check_oi_float_sanity(db, ticker)
    if not oi_sane:
        warnings.append(f"OI sanity check failed: {oi_msg}")
        return False, warnings
    
    # 4. Sector-wide vol check
    xbi_change = get_xbi_iv_change(db, current_date)
    if xbi_change is not None and abs(xbi_change) > 10:
        warnings.append(f"Large sector-wide IV move detected: XBI {xbi_change:+.1f}%")
        # Don't fail, but flag for review
    
    # 5. FDA class concerns
    has_concerns, concern_msg = check_fda_class_concerns(db, ticker)
    if has_concerns:
        warnings.append(f"FDA class concern: {concern_msg}")
        # Don't fail, but flag
    
    # 6. Catalyst date slip
    date_changed, new_date = check_for_catalyst_date_slip(db, catalyst_id)
    if date_changed:
        warnings.append(f"Catalyst date recently changed to {new_date}")
        # Don't fail, but flag
    
    # All critical checks passed
    return True, warnings

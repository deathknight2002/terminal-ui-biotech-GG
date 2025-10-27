"""
IV Data ETL Pipeline

Generates sample implied volatility data for biotech tickers.
In production, this would pull from options data providers (CBOE, TD Ameritrade, etc.)

For demo purposes, this generates synthetic but realistic IV data based on:
- Historical volatility patterns
- Catalyst proximity effects
- XBI constituent tickers
"""

import logging
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import random
import math

from sqlalchemy.orm import Session
from sqlalchemy import and_, func

from ..database import (
    SessionLocal,
    OptionsIV,
    PriceData,
    Catalyst,
    Company
)

logger = logging.getLogger(__name__)

# XBI constituent tickers (sample)
XBI_TICKERS = [
    "VRTX", "ALNY", "SGEN", "BMRN", "IONS", "EXEL", "MRNA", "ARWR",
    "REGN", "BIIB", "GILD", "AMGN", "INCY", "NBIX", "TECH", "UTHR",
    "RARE", "FOLD", "PTCT", "BLUE", "CRSP", "EDIT", "NTLA", "BEAM"
]


def generate_base_iv(ticker: str, date: datetime) -> float:
    """
    Generate base IV level for a ticker.
    Uses ticker hash for consistency across runs.
    """
    # Use ticker as seed for consistent but different IVs per ticker
    seed = sum(ord(c) for c in ticker)
    random.seed(seed + date.toordinal())
    
    # Base IV typically 40-80% for biotech
    base_iv = 45.0 + random.uniform(0, 35)
    
    # Add some time-series variation
    day_factor = math.sin(date.toordinal() / 30.0) * 5.0
    
    return base_iv + day_factor


def calculate_term_structure(
    base_iv: float,
    tenor_days: int,
    has_near_catalyst: bool = False
) -> float:
    """
    Calculate IV for a specific tenor.
    
    Term structure normally slopes upward (contango).
    But near catalysts, front-end IV rises (backwardation).
    """
    # Normal term structure: longer tenors have higher IV
    tenor_premium = (tenor_days / 30.0) * 2.0  # +2% per 30 days
    
    iv = base_iv + tenor_premium
    
    # If catalyst is near, invert term structure (front-end spike)
    if has_near_catalyst:
        # Front-end spikes more
        if tenor_days <= 14:
            iv += random.uniform(8, 15)  # Big spike for 7D/14D
        elif tenor_days == 30:
            iv += random.uniform(2, 5)   # Moderate for 30D
        # 60D+ stays normal
    
    return round(iv, 2)


def calculate_skew(iv: float, has_catalyst: bool = False) -> float:
    """
    Calculate 25-delta put-call skew.
    
    Normal skew: puts more expensive than calls (positive skew ~2-5)
    Pre-catalyst: call skew can flip (negative skew) as traders buy upside
    """
    base_skew = random.uniform(1.5, 4.5)  # Normal put skew
    
    if has_catalyst:
        # Pre-catalyst: calls get bid up, skew flips negative
        if random.random() > 0.5:
            base_skew = -random.uniform(2, 8)  # Negative skew
    
    return round(base_skew, 2)


def calculate_iv_percentile(
    current_iv: float,
    historical_ivs: List[float]
) -> float:
    """
    Calculate percentile rank of current IV vs historical.
    """
    if not historical_ivs:
        return 50.0
    
    rank = sum(1 for iv in historical_ivs if iv < current_iv)
    percentile = (rank / len(historical_ivs)) * 100
    
    return round(percentile, 1)


def generate_price_data(
    ticker: str,
    date: datetime,
    session: Session
) -> Optional[PriceData]:
    """
    Generate synthetic price data for a ticker.
    """
    # Check if already exists
    existing = session.query(PriceData).filter(
        and_(
            PriceData.ticker == ticker,
            PriceData.date == date
        )
    ).first()
    
    if existing:
        return existing
    
    # Generate synthetic price
    seed = sum(ord(c) for c in ticker) + date.toordinal()
    random.seed(seed)
    
    base_price = 50.0 + random.uniform(0, 150)
    daily_return = random.gauss(0, 0.015)  # 1.5% daily vol
    
    close_price = base_price * (1 + daily_return)
    
    # Generate OHLCV
    high = close_price * (1 + abs(random.gauss(0, 0.005)))
    low = close_price * (1 - abs(random.gauss(0, 0.005)))
    open_price = random.uniform(low, high)
    volume = int(random.uniform(100000, 5000000))
    
    # Calculate returns
    returns_1d = daily_return
    returns_5d = random.gauss(0, 0.035)  # 3.5% 5-day vol
    returns_20d = random.gauss(0, 0.08)  # 8% monthly vol
    
    # Realized volatility (annualized %)
    realized_vol_20d = abs(random.gauss(45, 15))
    realized_vol_60d = abs(random.gauss(50, 12))
    
    price_data = PriceData(
        ticker=ticker,
        date=date,
        open=round(open_price, 2),
        high=round(high, 2),
        low=round(low, 2),
        close=round(close_price, 2),
        volume=volume,
        returns_1d=round(returns_1d, 4),
        returns_5d=round(returns_5d, 4),
        returns_20d=round(returns_20d, 4),
        realized_vol_20d=round(realized_vol_20d, 2),
        realized_vol_60d=round(realized_vol_60d, 2),
        volume_20d_avg=volume * random.uniform(0.8, 1.2),
        relative_volume=random.uniform(0.7, 1.5)
    )
    
    session.add(price_data)
    return price_data


def generate_iv_data(
    ticker: str,
    date: datetime,
    tenors: List[int],
    session: Session,
    has_near_catalyst: bool = False
) -> List[OptionsIV]:
    """
    Generate IV data for multiple tenors for a ticker on a specific date.
    """
    results = []
    
    base_iv = generate_base_iv(ticker, date)
    
    # Get historical IVs for percentile calculation (last 252 trading days)
    lookback_date = date - timedelta(days=365)
    historical_ivs = session.query(OptionsIV.iv_mid).filter(
        and_(
            OptionsIV.ticker == ticker,
            OptionsIV.date >= lookback_date,
            OptionsIV.date < date,
            OptionsIV.tenor_days == 7  # Use 7D tenor for historical
        )
    ).all()
    
    historical_iv_values = [iv[0] for iv in historical_ivs] if historical_ivs else []
    
    for tenor in tenors:
        # Check if already exists
        existing = session.query(OptionsIV).filter(
            and_(
                OptionsIV.ticker == ticker,
                OptionsIV.date == date,
                OptionsIV.tenor_days == tenor
            )
        ).first()
        
        if existing:
            results.append(existing)
            continue
        
        # Calculate IV for this tenor
        iv_mid = calculate_term_structure(base_iv, tenor, has_near_catalyst)
        
        # Bid-ask spread (~0.5-2% of IV)
        spread = iv_mid * random.uniform(0.005, 0.02)
        iv_bid = iv_mid - spread / 2
        iv_ask = iv_mid + spread / 2
        
        # Skew
        skew_25d = calculate_skew(iv_mid, has_near_catalyst)
        skew_10d = skew_25d * random.uniform(1.2, 1.5)  # Deeper OTM
        
        # Open interest
        total_oi = int(random.uniform(5000, 50000))
        call_oi = int(total_oi * random.uniform(0.4, 0.6))
        put_oi = total_oi - call_oi
        put_call_ratio = put_oi / call_oi if call_oi > 0 else 1.0
        
        # Volume
        total_volume = int(total_oi * random.uniform(0.1, 0.3))
        
        # Calculate percentile
        iv_pctile_1y = calculate_iv_percentile(iv_mid, historical_iv_values)
        iv_pctile_6m = calculate_iv_percentile(
            iv_mid,
            historical_iv_values[-126:] if len(historical_iv_values) >= 126 else historical_iv_values
        )
        
        # Calculate 20D median skew for comparison
        historical_skews = session.query(OptionsIV.skew_25d).filter(
            and_(
                OptionsIV.ticker == ticker,
                OptionsIV.date >= date - timedelta(days=30),
                OptionsIV.date < date,
                OptionsIV.tenor_days == tenor
            )
        ).all()
        
        skew_25d_20d_median = (
            sorted([s[0] for s in historical_skews if s[0] is not None])[len(historical_skews) // 2]
            if historical_skews and len(historical_skews) > 0
            else skew_25d
        )
        
        # Detect backwardation (7D > 30D)
        is_backwardation = False
        if tenor == 7:
            iv30 = session.query(OptionsIV.iv_mid).filter(
                and_(
                    OptionsIV.ticker == ticker,
                    OptionsIV.date == date,
                    OptionsIV.tenor_days == 30
                )
            ).first()
            
            if iv30:
                is_backwardation = iv_mid > iv30[0]
        
        iv_data = OptionsIV(
            ticker=ticker,
            date=date,
            tenor_days=tenor,
            iv_mid=round(iv_mid, 2),
            iv_bid=round(iv_bid, 2),
            iv_ask=round(iv_ask, 2),
            skew_25d=round(skew_25d, 2),
            skew_10d=round(skew_10d, 2),
            total_oi=total_oi,
            total_volume=total_volume,
            call_oi=call_oi,
            put_oi=put_oi,
            put_call_ratio=round(put_call_ratio, 3),
            iv_pctile_1y=iv_pctile_1y,
            iv_pctile_6m=iv_pctile_6m,
            skew_25d_20d_median=round(skew_25d_20d_median, 2),
            is_backwardation=is_backwardation
        )
        
        session.add(iv_data)
        results.append(iv_data)
    
    return results


def run_iv_etl(
    tickers: Optional[List[str]] = None,
    lookback_days: int = 252,  # 1 year of trading days
    tenors: Optional[List[int]] = None
):
    """
    Main ETL function to generate IV data.
    
    Args:
        tickers: List of tickers to process (defaults to XBI_TICKERS)
        lookback_days: Number of days of historical data to generate
        tenors: List of tenor days to generate (defaults to [7, 14, 30, 60])
    """
    if tickers is None:
        tickers = XBI_TICKERS
    
    if tenors is None:
        tenors = [7, 14, 30, 60]
    
    session = SessionLocal()
    
    try:
        logger.info(f"Starting IV ETL for {len(tickers)} tickers, {lookback_days} days lookback")
        
        # Generate data for the past year
        end_date = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        start_date = end_date - timedelta(days=lookback_days)
        
        total_records = 0
        
        for ticker in tickers:
            logger.info(f"Processing ticker: {ticker}")
            
            # Check if ticker has upcoming catalysts
            upcoming_catalysts = session.query(Catalyst).filter(
                and_(
                    Catalyst.company == ticker,
                    Catalyst.event_date >= end_date - timedelta(days=7),
                    Catalyst.event_date <= end_date + timedelta(days=60)
                )
            ).all()
            
            has_catalyst = len(upcoming_catalysts) > 0
            
            # Generate data for each day
            current_date = start_date
            while current_date <= end_date:
                # Skip weekends (simple approximation)
                if current_date.weekday() < 5:
                    # Generate price data first
                    generate_price_data(ticker, current_date, session)
                    
                    # Check if near catalyst for this specific date
                    near_catalyst = any(
                        abs((cat.event_date - current_date).days) <= 30
                        for cat in upcoming_catalysts
                    )
                    
                    # Generate IV data
                    iv_records = generate_iv_data(
                        ticker,
                        current_date,
                        tenors,
                        session,
                        has_near_catalyst=near_catalyst
                    )
                    
                    total_records += len(iv_records)
                
                current_date += timedelta(days=1)
            
            # Commit after each ticker
            session.commit()
            logger.info(f"✓ Completed {ticker}")
        
        logger.info(f"✅ IV ETL completed: {total_records} records generated for {len(tickers)} tickers")
        
    except Exception as e:
        logger.error(f"❌ IV ETL failed: {e}")
        session.rollback()
        raise
    
    finally:
        session.close()


def backfill_iv_percentiles():
    """
    Backfill IV percentiles for existing data.
    Run this after initial data load to populate percentile fields.
    """
    session = SessionLocal()
    
    try:
        logger.info("Backfilling IV percentiles...")
        
        # Get all unique ticker/date combinations
        unique_records = session.query(
            OptionsIV.ticker,
            OptionsIV.date
        ).distinct().all()
        
        for ticker, date in unique_records:
            # Get historical IVs for this ticker
            lookback_date = date - timedelta(days=365)
            
            historical_ivs = session.query(OptionsIV.iv_mid).filter(
                and_(
                    OptionsIV.ticker == ticker,
                    OptionsIV.date >= lookback_date,
                    OptionsIV.date < date,
                    OptionsIV.tenor_days == 7
                )
            ).all()
            
            historical_values = [iv[0] for iv in historical_ivs]
            
            # Update records for this date
            records = session.query(OptionsIV).filter(
                and_(
                    OptionsIV.ticker == ticker,
                    OptionsIV.date == date
                )
            ).all()
            
            for record in records:
                if historical_values:
                    record.iv_pctile_1y = calculate_iv_percentile(
                        record.iv_mid,
                        historical_values
                    )
                    record.iv_pctile_6m = calculate_iv_percentile(
                        record.iv_mid,
                        historical_values[-126:]
                    )
        
        session.commit()
        logger.info("✅ IV percentiles backfilled")
        
    except Exception as e:
        logger.error(f"❌ Backfill failed: {e}")
        session.rollback()
        raise
    
    finally:
        session.close()


if __name__ == "__main__":
    import sys
    
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Command-line arguments
    if len(sys.argv) > 1:
        if sys.argv[1] == "--backfill":
            backfill_iv_percentiles()
        elif sys.argv[1] == "--quick":
            # Quick test: 5 tickers, 30 days
            run_iv_etl(
                tickers=XBI_TICKERS[:5],
                lookback_days=30
            )
        else:
            logger.error(f"Unknown command: {sys.argv[1]}")
            sys.exit(1)
    else:
        # Full ETL
        run_iv_etl()

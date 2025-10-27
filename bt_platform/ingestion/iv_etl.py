"""
IV Data ETL Pipeline

Nightly job to pull options chains and compute IV metrics:
- 7D, 14D, 30D, 60D implied volatility
- 25-delta skew (put-call spread)
- Open interest and volume tracking
- IV percentiles (1Y and 6M lookback)
- Term structure analysis
"""

import logging
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, func

from ..core.database import (
    SessionLocal,
    OptionsIV,
    PriceData,
    Catalyst,
    Company
)

logger = logging.getLogger(__name__)

# Configuration
TENORS = [7, 14, 30, 60, 90]  # Days to expiration
PERCENTILE_LOOKBACK_DAYS = 365  # 1 year for percentile calculation
SKEW_MEDIAN_DAYS = 20  # 20-day median for skew comparison


class IVETLPipeline:
    """ETL pipeline for options IV data"""
    
    def __init__(self, db: Optional[Session] = None):
        self.db = db or SessionLocal()
    
    def run(self, tickers: Optional[List[str]] = None) -> Dict:
        """
        Run the full IV ETL pipeline
        
        Args:
            tickers: Optional list of tickers to process. If None, processes all XBI constituents
        
        Returns:
            Dict with summary statistics
        """
        logger.info("Starting IV ETL pipeline")
        
        try:
            # Get tickers to process
            if not tickers:
                tickers = self._get_xbi_tickers()
            
            logger.info(f"Processing {len(tickers)} tickers")
            
            stats = {
                "tickers_processed": 0,
                "iv_records_created": 0,
                "errors": []
            }
            
            for ticker in tickers:
                try:
                    self._process_ticker(ticker, stats)
                except Exception as e:
                    logger.error(f"Error processing {ticker}: {e}")
                    stats["errors"].append({"ticker": ticker, "error": str(e)})
            
            logger.info(f"IV ETL complete: {stats}")
            return stats
            
        except Exception as e:
            logger.error(f"IV ETL pipeline failed: {e}")
            raise
        finally:
            if self.db:
                self.db.close()
    
    def _get_xbi_tickers(self) -> List[str]:
        """Get all XBI constituent tickers"""
        companies = self.db.query(Company).filter(
            Company.is_xbi_constituent == True
        ).all()
        
        tickers = [c.ticker for c in companies if c.ticker]
        logger.info(f"Found {len(tickers)} XBI constituent tickers")
        return tickers
    
    def _process_ticker(self, ticker: str, stats: Dict):
        """Process IV data for a single ticker"""
        logger.debug(f"Processing {ticker}")
        
        # In a real implementation, this would:
        # 1. Fetch options chain from data provider (e.g., IBKR, Tradier, Yahoo Finance)
        # 2. Calculate implied volatility for each tenor
        # 3. Compute skew metrics
        # 4. Calculate percentiles
        # 5. Store in database
        
        # For now, we'll create a placeholder that generates synthetic data
        today = datetime.utcnow().date()
        
        for tenor in TENORS:
            iv_record = self._generate_iv_data(ticker, today, tenor)
            
            # Check if record already exists
            existing = self.db.query(OptionsIV).filter(
                and_(
                    OptionsIV.ticker == ticker,
                    OptionsIV.date == datetime.combine(today, datetime.min.time()),
                    OptionsIV.tenor_days == tenor
                )
            ).first()
            
            if not existing:
                self.db.add(iv_record)
                stats["iv_records_created"] += 1
        
        self.db.commit()
        stats["tickers_processed"] += 1
    
    def _generate_iv_data(self, ticker: str, date, tenor_days: int) -> OptionsIV:
        """
        Generate synthetic IV data for demonstration
        
        In production, this would call actual options data providers.
        """
        import random
        
        # Base IV varies by tenor (term structure)
        base_iv = 40 + (tenor_days / 30) * 5  # Higher IV for longer tenors
        iv_mid = base_iv + random.gauss(0, 5)
        
        # Calculate percentiles based on historical data
        iv_pctile_1y = self._calculate_percentile(ticker, tenor_days, days=365)
        iv_pctile_6m = self._calculate_percentile(ticker, tenor_days, days=180)
        
        # Calculate skew median
        skew_25d_median = self._calculate_skew_median(ticker, tenor_days)
        
        # Detect backwardation
        if tenor_days == 7:
            # Check if 7D > 30D
            iv30_latest = self.db.query(OptionsIV).filter(
                and_(
                    OptionsIV.ticker == ticker,
                    OptionsIV.tenor_days == 30
                )
            ).order_by(OptionsIV.date.desc()).first()
            
            is_backwardation = iv30_latest and iv_mid > iv30_latest.iv_mid
        else:
            is_backwardation = False
        
        return OptionsIV(
            ticker=ticker,
            date=datetime.combine(date, datetime.min.time()),
            tenor_days=tenor_days,
            iv_mid=iv_mid,
            iv_bid=iv_mid - 0.5,
            iv_ask=iv_mid + 0.5,
            skew_25d=random.gauss(5, 2),  # Typical put skew
            skew_10d=random.gauss(8, 3),  # Higher for deeper OTM
            total_oi=random.randint(1000, 50000),
            total_volume=random.randint(500, 20000),
            call_oi=random.randint(500, 25000),
            put_oi=random.randint(500, 25000),
            put_call_ratio=random.uniform(0.8, 1.5),
            iv_pctile_1y=iv_pctile_1y,
            iv_pctile_6m=iv_pctile_6m,
            skew_25d_20d_median=skew_25d_median,
            is_backwardation=is_backwardation
        )
    
    def _calculate_percentile(self, ticker: str, tenor_days: int, days: int = 365) -> float:
        """Calculate IV percentile over lookback period"""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        # Get historical IV data
        historical = self.db.query(OptionsIV.iv_mid).filter(
            and_(
                OptionsIV.ticker == ticker,
                OptionsIV.tenor_days == tenor_days,
                OptionsIV.date >= cutoff_date
            )
        ).all()
        
        if not historical or len(historical) < 10:
            return 50.0  # Default to median if insufficient data
        
        # Get current IV (most recent)
        latest = self.db.query(OptionsIV).filter(
            and_(
                OptionsIV.ticker == ticker,
                OptionsIV.tenor_days == tenor_days
            )
        ).order_by(OptionsIV.date.desc()).first()
        
        if not latest:
            return 50.0
        
        current_iv = latest.iv_mid
        values = [h[0] for h in historical]
        
        # Calculate percentile rank
        below = sum(1 for v in values if v < current_iv)
        percentile = (below / len(values)) * 100
        
        return round(percentile, 1)
    
    def _calculate_skew_median(self, ticker: str, tenor_days: int) -> float:
        """Calculate 20-day median skew for comparison"""
        cutoff_date = datetime.utcnow() - timedelta(days=SKEW_MEDIAN_DAYS)
        
        historical = self.db.query(OptionsIV.skew_25d).filter(
            and_(
                OptionsIV.ticker == ticker,
                OptionsIV.tenor_days == tenor_days,
                OptionsIV.date >= cutoff_date,
                OptionsIV.skew_25d.isnot(None)
            )
        ).all()
        
        if not historical:
            return 5.0  # Default typical put skew
        
        values = sorted([h[0] for h in historical])
        mid = len(values) // 2
        
        if len(values) % 2 == 0:
            median = (values[mid - 1] + values[mid]) / 2
        else:
            median = values[mid]
        
        return round(median, 2)


def run_nightly_iv_etl(tickers: Optional[List[str]] = None):
    """
    Entry point for nightly IV ETL job
    
    Can be called from cron or scheduler:
    python -m bt_platform.ingestion.iv_etl
    """
    pipeline = IVETLPipeline()
    stats = pipeline.run(tickers=tickers)
    
    logger.info(f"Nightly IV ETL completed: {stats}")
    return stats


if __name__ == "__main__":
    # Command-line execution
    import sys
    
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    tickers = sys.argv[1:] if len(sys.argv) > 1 else None
    run_nightly_iv_etl(tickers=tickers)

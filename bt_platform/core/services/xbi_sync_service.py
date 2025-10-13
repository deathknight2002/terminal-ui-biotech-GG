"""
XBI Constituents Sync Service

Automatically syncs XBI ETF constituents and their company profiles from Yahoo Finance.
Handles bulk updates, error recovery, and maintains data consistency.
"""

from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging

from ...providers.yfinance_provider import get_yfinance_provider
from ..database import Company, MarketData

logger = logging.getLogger(__name__)


class XBISyncService:
    """Service for syncing XBI constituents and company profiles"""
    
    def __init__(self, db: Session):
        self.db = db
        self.provider = get_yfinance_provider()
    
    def sync_xbi_constituents(self, force_refresh: bool = False) -> Dict[str, Any]:
        """
        Sync all XBI constituents and their profiles.
        
        Args:
            force_refresh: If True, clear cache and fetch fresh data
            
        Returns:
            Summary statistics of the sync operation
        """
        logger.info("Starting XBI constituents sync")
        
        if force_refresh:
            self.provider.clear_cache()
        
        stats = {
            'total_constituents': 0,
            'new_companies': 0,
            'updated_companies': 0,
            'failed_companies': 0,
            'errors': []
        }
        
        # Get XBI holdings
        holdings = self.provider.get_xbi_holdings()
        stats['total_constituents'] = len(holdings)
        
        logger.info(f"Found {len(holdings)} XBI constituents")
        
        # Get profiles for all constituents
        tickers = [h['ticker'] for h in holdings]
        profiles = self.provider.get_multiple_profiles(tickers)
        
        # Process each profile
        for ticker, profile in profiles.items():
            try:
                if profile is None:
                    logger.warning(f"No profile data for {ticker}")
                    stats['failed_companies'] += 1
                    stats['errors'].append(f"No data available for {ticker}")
                    continue
                
                self._upsert_company(ticker, profile, stats)
                
            except Exception as e:
                logger.error(f"Error processing {ticker}: {e}")
                stats['failed_companies'] += 1
                stats['errors'].append(f"{ticker}: {str(e)}")
        
        # Commit all changes
        try:
            self.db.commit()
            logger.info(f"Sync completed: {stats}")
        except Exception as e:
            logger.error(f"Error committing sync: {e}")
            self.db.rollback()
            raise
        
        return stats
    
    def _upsert_company(self, ticker: str, profile: Dict[str, Any], stats: Dict[str, Any]):
        """Insert or update company record"""
        
        # Check if company exists
        company = self.db.query(Company).filter(Company.ticker == ticker.upper()).first()
        
        is_new = company is None
        if is_new:
            company = Company(ticker=ticker.upper())
            stats['new_companies'] += 1
        else:
            stats['updated_companies'] += 1
        
        # Update company fields from profile
        company.name = profile.get('name', ticker)
        company.company_type = self._determine_company_type(profile)
        company.market_cap = profile.get('market_cap')
        company.headquarters = profile.get('headquarters', 'Unknown')
        company.employees = profile.get('employees')
        company.description = profile.get('business_summary', '')
        company.website = profile.get('website', '')
        
        # Mark as XBI constituent
        company.is_xbi_constituent = True
        if company.xbi_added_date is None:
            company.xbi_added_date = datetime.utcnow()
        
        # Add sector and industry as therapeutic areas (approximation)
        therapeutic_areas = []
        if profile.get('sector'):
            therapeutic_areas.append(profile['sector'])
        if profile.get('industry') and profile['industry'] != profile.get('sector'):
            therapeutic_areas.append(profile['industry'])
        company.therapeutic_areas = ','.join(therapeutic_areas) if therapeutic_areas else None
        
        if is_new:
            self.db.add(company)
        
        # Also update market data
        self._update_market_data(ticker, profile)
        
        logger.info(f"{'Created' if is_new else 'Updated'} company: {ticker}")
    
    def _determine_company_type(self, profile: Dict[str, Any]) -> str:
        """Determine company type from profile data"""
        market_cap = profile.get('market_cap', 0)
        
        if market_cap is None:
            return 'Biotech'
        
        # Classification based on market cap
        if market_cap > 50_000_000_000:  # > $50B
            return 'Big Pharma'
        elif market_cap > 10_000_000_000:  # > $10B
            return 'Large Biotech'
        elif market_cap > 2_000_000_000:  # > $2B
            return 'Mid Biotech'
        else:
            return 'Small Biotech'
    
    def _update_market_data(self, ticker: str, profile: Dict[str, Any]):
        """Update or create market data record"""
        
        current_price = profile.get('current_price')
        if current_price is None:
            return
        
        # Create market data snapshot
        market_data = MarketData(
            ticker=ticker.upper(),
            timestamp=datetime.utcnow(),
            open_price=profile.get('previous_close') or current_price,
            high_price=profile.get('fifty_two_week_high') or current_price,
            low_price=profile.get('fifty_two_week_low') or current_price,
            close_price=current_price,
            volume=profile.get('volume'),
            market_cap=profile.get('market_cap')
        )
        
        self.db.add(market_data)
    
    def get_sync_status(self) -> Dict[str, Any]:
        """Get current sync status"""
        
        # Count XBI constituents in database
        xbi_count = self.db.query(Company).filter(
            Company.is_xbi_constituent == True
        ).count()
        
        # Get latest sync info (approximate)
        latest_company = self.db.query(Company).filter(
            Company.is_xbi_constituent == True
        ).order_by(Company.created_at.desc()).first()
        
        return {
            'xbi_constituents_count': xbi_count,
            'last_updated': latest_company.created_at.isoformat() if latest_company else None,
        }
    
    def sync_single_company(self, ticker: str) -> Dict[str, Any]:
        """
        Sync a single company profile.
        
        Args:
            ticker: Stock ticker symbol
            
        Returns:
            Company profile data
        """
        logger.info(f"Syncing single company: {ticker}")
        
        profile = self.provider.get_company_profile(ticker)
        
        if profile is None:
            raise ValueError(f"No profile data available for {ticker}")
        
        stats = {
            'new_companies': 0,
            'updated_companies': 0,
            'failed_companies': 0,
            'errors': []
        }
        
        self._upsert_company(ticker, profile, stats)
        self.db.commit()
        
        logger.info(f"Synced {ticker}: {stats}")
        
        return profile


def sync_xbi_data(db: Session, force_refresh: bool = False) -> Dict[str, Any]:
    """
    Convenience function to sync XBI data.
    
    Args:
        db: Database session
        force_refresh: If True, clear cache and fetch fresh data
        
    Returns:
        Sync statistics
    """
    service = XBISyncService(db)
    return service.sync_xbi_constituents(force_refresh=force_refresh)

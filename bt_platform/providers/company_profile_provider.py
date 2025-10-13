"""
Company Profile Data Provider

Fetches comprehensive company profiles from free financial data sources.
Uses yfinance for Yahoo Finance data - provides company info, financials, 
business summaries, and more at no cost.

Implements caching to avoid rate limits and improve performance.
"""

import yfinance as yf
import logging
from typing import Dict, Optional, List
from datetime import datetime, timedelta
import json
from pathlib import Path

logger = logging.getLogger(__name__)


class CompanyProfileProvider:
    """Provider for fetching company profiles from Yahoo Finance via yfinance"""
    
    def __init__(self, cache_dir: Optional[Path] = None, cache_ttl_hours: int = 24):
        """
        Initialize the provider with optional caching.
        
        Args:
            cache_dir: Directory to store cached profiles. If None, uses temp directory.
            cache_ttl_hours: How long to cache profiles (default: 24 hours)
        """
        self.cache_ttl_hours = cache_ttl_hours
        
        if cache_dir is None:
            cache_dir = Path("/tmp/company_profile_cache")
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        
        logger.info(f"CompanyProfileProvider initialized with cache at {self.cache_dir}")
    
    def _get_cache_path(self, ticker: str) -> Path:
        """Get cache file path for a ticker"""
        return self.cache_dir / f"{ticker.upper()}.json"
    
    def _is_cache_valid(self, ticker: str) -> bool:
        """Check if cached profile is still valid"""
        cache_path = self._get_cache_path(ticker)
        
        if not cache_path.exists():
            return False
        
        try:
            with open(cache_path, 'r') as f:
                cached_data = json.load(f)
            
            cached_time = datetime.fromisoformat(cached_data.get("cached_at", "2000-01-01"))
            age_hours = (datetime.now() - cached_time).total_seconds() / 3600
            
            return age_hours < self.cache_ttl_hours
        except Exception as e:
            logger.warning(f"Error checking cache for {ticker}: {e}")
            return False
    
    def _load_from_cache(self, ticker: str) -> Optional[Dict]:
        """Load profile from cache"""
        cache_path = self._get_cache_path(ticker)
        
        try:
            with open(cache_path, 'r') as f:
                data = json.load(f)
            logger.debug(f"Loaded {ticker} from cache")
            return data.get("profile")
        except Exception as e:
            logger.warning(f"Error loading cache for {ticker}: {e}")
            return None
    
    def _save_to_cache(self, ticker: str, profile: Dict):
        """Save profile to cache"""
        cache_path = self._get_cache_path(ticker)
        
        try:
            cache_data = {
                "ticker": ticker,
                "cached_at": datetime.now().isoformat(),
                "profile": profile
            }
            with open(cache_path, 'w') as f:
                json.dump(cache_data, f, indent=2)
            logger.debug(f"Saved {ticker} to cache")
        except Exception as e:
            logger.warning(f"Error saving cache for {ticker}: {e}")
    
    def get_company_profile(self, ticker: str, force_refresh: bool = False) -> Optional[Dict]:
        """
        Get comprehensive company profile for a ticker.
        
        Args:
            ticker: Stock ticker symbol
            force_refresh: If True, bypass cache and fetch fresh data
            
        Returns:
            Dictionary with company profile data, or None if not found
        """
        ticker = ticker.upper()
        
        # Check cache first
        if not force_refresh and self._is_cache_valid(ticker):
            cached_profile = self._load_from_cache(ticker)
            if cached_profile:
                return cached_profile
        
        # Fetch fresh data
        logger.info(f"Fetching profile for {ticker} from Yahoo Finance")
        
        try:
            stock = yf.Ticker(ticker)
            info = stock.info
            
            if not info or 'symbol' not in info:
                logger.warning(f"No data found for ticker {ticker}")
                return None
            
            # Extract comprehensive profile data
            profile = {
                "ticker": ticker,
                "name": info.get("longName", info.get("shortName", ticker)),
                "company_type": self._classify_company_type(info),
                "description": info.get("longBusinessSummary", ""),
                "website": info.get("website", ""),
                "headquarters": self._format_headquarters(info),
                "sector": info.get("sector", ""),
                "industry": info.get("industry", ""),
                "employees": info.get("fullTimeEmployees"),
                "founded_year": self._extract_founded_year(info),
                
                # Financial metrics
                "market_cap": info.get("marketCap"),
                "enterprise_value": info.get("enterpriseValue"),
                "cash": info.get("totalCash"),
                "debt": info.get("totalDebt"),
                "revenue": info.get("totalRevenue"),
                "revenue_per_share": info.get("revenuePerShare"),
                "ebitda": info.get("ebitda"),
                "gross_margins": info.get("grossMargins"),
                "operating_margins": info.get("operatingMargins"),
                "profit_margins": info.get("profitMargins"),
                
                # Stock metrics
                "current_price": info.get("currentPrice"),
                "previous_close": info.get("previousClose"),
                "day_high": info.get("dayHigh"),
                "day_low": info.get("dayLow"),
                "volume": info.get("volume"),
                "avg_volume": info.get("averageVolume"),
                "shares_outstanding": info.get("sharesOutstanding"),
                "float_shares": info.get("floatShares"),
                
                # Valuation ratios
                "pe_ratio": info.get("trailingPE"),
                "forward_pe": info.get("forwardPE"),
                "peg_ratio": info.get("pegRatio"),
                "price_to_book": info.get("priceToBook"),
                "price_to_sales": info.get("priceToSalesTrailing12Months"),
                "enterprise_to_revenue": info.get("enterpriseToRevenue"),
                "enterprise_to_ebitda": info.get("enterpriseToEbitda"),
                
                # Analyst coverage
                "target_mean_price": info.get("targetMeanPrice"),
                "target_high_price": info.get("targetHighPrice"),
                "target_low_price": info.get("targetLowPrice"),
                "recommendation_mean": info.get("recommendationMean"),
                "recommendation_key": info.get("recommendationKey"),
                "number_of_analyst_opinions": info.get("numberOfAnalystOpinions"),
                
                # Dates and metadata
                "ipo_date": info.get("ipoDate"),
                "last_updated": datetime.now().isoformat(),
                "data_source": "Yahoo Finance (yfinance)"
            }
            
            # Save to cache
            self._save_to_cache(ticker, profile)
            
            return profile
            
        except Exception as e:
            logger.error(f"Error fetching profile for {ticker}: {e}")
            return None
    
    def _classify_company_type(self, info: Dict) -> str:
        """Classify company as Big Pharma, Biotech, or SMid based on market cap and industry"""
        market_cap = info.get("marketCap", 0)
        industry = info.get("industry", "").lower()
        sector = info.get("sector", "").lower()
        
        # Check if it's pharma/biotech related
        is_biotech = any(term in industry or term in sector for term in 
                        ["biotech", "pharmaceutical", "drug", "biotechnology"])
        
        if not is_biotech:
            return "Other"
        
        # Classify by market cap
        if market_cap >= 100_000_000_000:  # $100B+
            return "Big Pharma"
        elif market_cap >= 10_000_000_000:  # $10B - $100B
            return "Large Cap Biotech"
        elif market_cap >= 2_000_000_000:  # $2B - $10B
            return "Mid Cap Biotech"
        else:
            return "Small Cap Biotech"
    
    def _format_headquarters(self, info: Dict) -> str:
        """Format headquarters string from available location data"""
        city = info.get("city", "")
        state = info.get("state", "")
        country = info.get("country", "")
        
        parts = []
        if city:
            parts.append(city)
        if state:
            parts.append(state)
        if country and country != "United States":
            parts.append(country)
        
        return ", ".join(parts) if parts else ""
    
    def _extract_founded_year(self, info: Dict) -> Optional[int]:
        """Try to extract founding year from available data"""
        # Yahoo Finance doesn't consistently provide founding year
        # Could be enhanced by checking company description or other sources
        return None
    
    def get_batch_profiles(self, tickers: List[str], max_failures: int = 10) -> Dict[str, Optional[Dict]]:
        """
        Fetch profiles for multiple tickers.
        
        Args:
            tickers: List of ticker symbols
            max_failures: Maximum number of consecutive failures before stopping
            
        Returns:
            Dictionary mapping tickers to their profiles (or None if failed)
        """
        results = {}
        consecutive_failures = 0
        
        for ticker in tickers:
            profile = self.get_company_profile(ticker)
            results[ticker] = profile
            
            if profile is None:
                consecutive_failures += 1
                if consecutive_failures >= max_failures:
                    logger.warning(f"Stopping batch fetch after {max_failures} consecutive failures")
                    break
            else:
                consecutive_failures = 0
        
        return results
    
    def clear_cache(self, ticker: Optional[str] = None):
        """
        Clear cached profiles.
        
        Args:
            ticker: If provided, clear only this ticker. Otherwise clear all.
        """
        if ticker:
            cache_path = self._get_cache_path(ticker)
            if cache_path.exists():
                cache_path.unlink()
                logger.info(f"Cleared cache for {ticker}")
        else:
            for cache_file in self.cache_dir.glob("*.json"):
                cache_file.unlink()
            logger.info("Cleared all cache files")


# Convenience function for quick access
def get_company_profile(ticker: str, cache_ttl_hours: int = 24) -> Optional[Dict]:
    """
    Quick function to get a company profile with default settings.
    
    Args:
        ticker: Stock ticker symbol
        cache_ttl_hours: Cache time-to-live in hours
        
    Returns:
        Company profile dictionary or None
    """
    provider = CompanyProfileProvider(cache_ttl_hours=cache_ttl_hours)
    return provider.get_company_profile(ticker)

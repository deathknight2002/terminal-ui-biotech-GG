"""
Yahoo Finance Provider for Company Profiles and XBI Holdings

Uses yfinance library to fetch:
- XBI ETF holdings (constituents)
- Company profiles (sector, industry, business summary)
- Market data and financials

Includes caching and rate limiting for responsible API usage.
"""

import yfinance as yf
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import logging
import time
from functools import lru_cache
import hashlib
import json

logger = logging.getLogger(__name__)


class YFinanceProvider:
    """
    Provider for Yahoo Finance data with caching and rate limiting.
    
    Rate limiting: Max 1 request per second to avoid overwhelming Yahoo Finance
    Caching: 24-hour cache for company profiles, 1-hour cache for market data
    """
    
    def __init__(self):
        self._last_request_time = 0
        self._min_request_interval = 1.0  # seconds
        self._cache: Dict[str, tuple[Any, datetime]] = {}
        self._cache_ttl = {
            'profile': timedelta(hours=24),
            'holdings': timedelta(hours=6),
            'quote': timedelta(minutes=15),
        }
    
    def _rate_limit(self):
        """Enforce rate limiting between requests"""
        current_time = time.time()
        time_since_last = current_time - self._last_request_time
        if time_since_last < self._min_request_interval:
            sleep_time = self._min_request_interval - time_since_last
            time.sleep(sleep_time)
        self._last_request_time = time.time()
    
    def _get_cache_key(self, key_type: str, identifier: str) -> str:
        """Generate cache key"""
        return f"{key_type}:{identifier.upper()}"
    
    def _get_cached(self, key_type: str, identifier: str) -> Optional[Any]:
        """Get cached value if not expired"""
        cache_key = self._get_cache_key(key_type, identifier)
        if cache_key in self._cache:
            value, timestamp = self._cache[cache_key]
            ttl = self._cache_ttl.get(key_type, timedelta(hours=1))
            if datetime.utcnow() - timestamp < ttl:
                logger.info(f"Cache hit for {cache_key}")
                return value
            else:
                logger.info(f"Cache expired for {cache_key}")
                del self._cache[cache_key]
        return None
    
    def _set_cached(self, key_type: str, identifier: str, value: Any):
        """Set cached value with timestamp"""
        cache_key = self._get_cache_key(key_type, identifier)
        self._cache[cache_key] = (value, datetime.utcnow())
        logger.info(f"Cached {cache_key}")
    
    def get_xbi_holdings(self) -> List[Dict[str, Any]]:
        """
        Get XBI ETF holdings (constituents).
        
        Returns:
            List of holdings with ticker, name, and weight
        """
        # Check cache first
        cached = self._get_cached('holdings', 'XBI')
        if cached:
            return cached
        
        try:
            self._rate_limit()
            logger.info("Fetching XBI holdings from Yahoo Finance")
            
            xbi = yf.Ticker("XBI")
            
            # Get holdings data
            # Note: yfinance may not always have holdings data for ETFs
            # We'll try to get it, but have a fallback list
            holdings = []
            
            try:
                # Try to get institutional holders as a proxy
                holders = xbi.institutional_holders
                if holders is not None and not holders.empty:
                    # This won't give us the actual holdings, so we'll use a static list
                    logger.warning("XBI holdings not available via API, using static list")
            except Exception as e:
                logger.warning(f"Could not fetch XBI institutional data: {e}")
            
            # Static list of major XBI constituents as fallback
            # This should be periodically updated or fetched from another source
            major_constituents = [
                "VRTX", "REGN", "BMRN", "ALNY", "INCY", "EXAS", "JAZZ", "NBIX",
                "UTHR", "IONS", "BGNE", "RARE", "SRPT", "TECH", "FOLD", "LEGN",
                "ARVN", "RGNX", "GILD", "AMGN", "BIIB", "MRNA", "BNTX", "CRSP",
                "BEAM", "NTLA", "EDIT", "BLUE", "FATE", "CDNA", "VCYT", "PACB",
                "ILMN", "DVAX", "HALO", "DAWN", "AGIO", "SRRK", "ARWR", "MDGL",
                "KRYS", "APLS", "KYMR", "SGMO", "RCKT", "VERV", "MGNX", "OCGN",
                "CBIO", "ACAD", "VKTX", "SAVA", "KDNY", "MRUS", "XNCR", "KROS"
            ]
            
            holdings = [{"ticker": ticker, "name": "", "weight": 0.0} 
                       for ticker in major_constituents]
            
            self._set_cached('holdings', 'XBI', holdings)
            return holdings
            
        except Exception as e:
            logger.error(f"Error fetching XBI holdings: {e}")
            return []
    
    def get_company_profile(self, ticker: str) -> Optional[Dict[str, Any]]:
        """
        Get comprehensive company profile from Yahoo Finance.
        
        Args:
            ticker: Stock ticker symbol
            
        Returns:
            Dictionary with company profile data including:
            - name, sector, industry, website
            - business_summary (description)
            - market_cap, employees, headquarters
            - financials
        """
        # Check cache first
        cached = self._get_cached('profile', ticker)
        if cached:
            return cached
        
        try:
            self._rate_limit()
            logger.info(f"Fetching company profile for {ticker}")
            
            company = yf.Ticker(ticker)
            info = company.info
            
            if not info or 'symbol' not in info:
                logger.warning(f"No data available for ticker {ticker}")
                return None
            
            # Extract profile data
            profile = {
                'ticker': ticker.upper(),
                'name': info.get('longName', info.get('shortName', ticker)),
                'sector': info.get('sector', 'Unknown'),
                'industry': info.get('industry', 'Unknown'),
                'website': info.get('website', ''),
                'business_summary': info.get('longBusinessSummary', ''),
                'headquarters': self._format_headquarters(info),
                'employees': info.get('fullTimeEmployees'),
                'market_cap': info.get('marketCap'),
                'enterprise_value': info.get('enterpriseValue'),
                'revenue': info.get('totalRevenue'),
                'ebitda': info.get('ebitda'),
                'cash': info.get('totalCash'),
                'debt': info.get('totalDebt'),
                'current_price': info.get('currentPrice', info.get('regularMarketPrice')),
                'previous_close': info.get('previousClose'),
                'fifty_two_week_high': info.get('fiftyTwoWeekHigh'),
                'fifty_two_week_low': info.get('fiftyTwoWeekLow'),
                'volume': info.get('volume'),
                'avg_volume': info.get('averageVolume'),
                'pe_ratio': info.get('trailingPE'),
                'forward_pe': info.get('forwardPE'),
                'dividend_yield': info.get('dividendYield'),
                'beta': info.get('beta'),
                'target_mean_price': info.get('targetMeanPrice'),
                'recommendation': info.get('recommendationKey'),
                'analyst_count': info.get('numberOfAnalystOpinions'),
            }
            
            self._set_cached('profile', ticker, profile)
            return profile
            
        except Exception as e:
            logger.error(f"Error fetching profile for {ticker}: {e}")
            return None
    
    def _format_headquarters(self, info: Dict) -> str:
        """Format headquarters location from Yahoo Finance info"""
        parts = []
        if info.get('city'):
            parts.append(info['city'])
        if info.get('state'):
            parts.append(info['state'])
        if info.get('country'):
            parts.append(info['country'])
        return ', '.join(parts) if parts else 'Unknown'
    
    def get_multiple_profiles(self, tickers: List[str], 
                            max_concurrent: int = 5) -> Dict[str, Optional[Dict[str, Any]]]:
        """
        Get profiles for multiple tickers with rate limiting.
        
        Args:
            tickers: List of ticker symbols
            max_concurrent: Maximum number of concurrent requests (not used due to rate limiting)
            
        Returns:
            Dictionary mapping ticker to profile data
        """
        profiles = {}
        for i, ticker in enumerate(tickers):
            logger.info(f"Fetching profile {i+1}/{len(tickers)}: {ticker}")
            profiles[ticker] = self.get_company_profile(ticker)
            
            # Progress logging
            if (i + 1) % 10 == 0:
                logger.info(f"Progress: {i+1}/{len(tickers)} profiles fetched")
        
        return profiles
    
    def get_quote(self, ticker: str) -> Optional[Dict[str, Any]]:
        """
        Get current market quote for a ticker.
        
        Args:
            ticker: Stock ticker symbol
            
        Returns:
            Dictionary with current price, volume, and changes
        """
        # Check cache first (shorter TTL for quotes)
        cached = self._get_cached('quote', ticker)
        if cached:
            return cached
        
        try:
            self._rate_limit()
            logger.info(f"Fetching quote for {ticker}")
            
            company = yf.Ticker(ticker)
            info = company.info
            
            if not info or 'symbol' not in info:
                return None
            
            quote = {
                'ticker': ticker.upper(),
                'current_price': info.get('currentPrice', info.get('regularMarketPrice')),
                'previous_close': info.get('previousClose'),
                'change': info.get('regularMarketChange'),
                'change_percent': info.get('regularMarketChangePercent'),
                'volume': info.get('volume'),
                'market_cap': info.get('marketCap'),
                'timestamp': datetime.utcnow().isoformat(),
            }
            
            self._set_cached('quote', ticker, quote)
            return quote
            
        except Exception as e:
            logger.error(f"Error fetching quote for {ticker}: {e}")
            return None
    
    def clear_cache(self, key_type: Optional[str] = None, identifier: Optional[str] = None):
        """
        Clear cache.
        
        Args:
            key_type: Type of cache to clear (profile, holdings, quote). None clears all.
            identifier: Specific identifier to clear. None clears all of that type.
        """
        if key_type is None and identifier is None:
            self._cache.clear()
            logger.info("Cleared entire cache")
        elif identifier:
            cache_key = self._get_cache_key(key_type, identifier)
            if cache_key in self._cache:
                del self._cache[cache_key]
                logger.info(f"Cleared cache for {cache_key}")
        else:
            keys_to_delete = [k for k in self._cache.keys() if k.startswith(f"{key_type}:")]
            for key in keys_to_delete:
                del self._cache[key]
            logger.info(f"Cleared {len(keys_to_delete)} cache entries for type {key_type}")


# Global singleton instance
_provider_instance: Optional[YFinanceProvider] = None


def get_yfinance_provider() -> YFinanceProvider:
    """Get or create singleton YFinanceProvider instance"""
    global _provider_instance
    if _provider_instance is None:
        _provider_instance = YFinanceProvider()
    return _provider_instance

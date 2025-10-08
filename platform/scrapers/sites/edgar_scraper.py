"""
SEC EDGAR Scraper

Scrapes SEC filings (8-K, 10-Q, 10-K) for biotech/pharma companies.
"""

from typing import Dict, List, Optional, Any
from datetime import datetime

from platform.scrapers.sites.press_release_scraper import PressReleaseScraper
from platform.scrapers.base.interface import ContentType, ScraperResult


class EDGARScraper(PressReleaseScraper):
    """SEC EDGAR filings scraper"""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        config = config or {}
        config.setdefault('base_url', 'https://www.sec.gov')
        config.setdefault('source_key', 'edgar')
        config.setdefault('max_rps', 0.1)  # SEC is strict
        super().__init__(config)
    
    async def normalize(self, parsed_data: Dict[str, Any]) -> ScraperResult:
        """Normalize to SEC filing format"""
        result = await super().normalize(parsed_data)
        result.content_type = ContentType.REGULATORY
        result.data['tags'] = ['sec-filing', 'regulatory'] + result.data.get('tags', [])
        return result

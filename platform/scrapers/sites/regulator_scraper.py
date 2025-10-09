"""
Regulatory Authority Scrapers

FDA, EMA, MHRA scrapers for regulatory news and approvals.
"""

from typing import Dict, List, Optional, Any
from datetime import datetime

from platform.scrapers.sites.press_release_scraper import PressReleaseScraper
from platform.scrapers.base.interface import ContentType, ScraperResult


class RegulatorScraper(PressReleaseScraper):
    """Base class for regulatory authority scrapers"""
    
    async def normalize(self, parsed_data: Dict[str, Any]) -> ScraperResult:
        """Normalize to regulatory format"""
        result = await super().normalize(parsed_data)
        result.content_type = ContentType.REGULATORY
        result.data['tags'] = ['regulatory'] + result.data.get('tags', [])
        return result


class FDAScraper(RegulatorScraper):
    """FDA news and approvals scraper"""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        config = config or {}
        config.setdefault('base_url', 'https://www.fda.gov')
        config.setdefault('rss_url', 'https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds/drugs/rss.xml')
        config.setdefault('source_key', 'fda')
        config.setdefault('max_rps', 1.0)
        super().__init__(config)


class EMAScraper(RegulatorScraper):
    """EMA (European Medicines Agency) scraper"""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        config = config or {}
        config.setdefault('base_url', 'https://www.ema.europa.eu')
        config.setdefault('rss_url', 'https://www.ema.europa.eu/en/news/rss.xml')
        config.setdefault('source_key', 'ema')
        config.setdefault('max_rps', 1.0)
        super().__init__(config)


class MHRAScraper(RegulatorScraper):
    """MHRA (UK) scraper"""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        config = config or {}
        config.setdefault('base_url', 'https://www.gov.uk')
        config.setdefault('rss_url', 'https://www.gov.uk/government/organisations/medicines-and-healthcare-products-regulatory-agency.atom')
        config.setdefault('source_key', 'mhra')
        config.setdefault('max_rps', 1.0)
        super().__init__(config)

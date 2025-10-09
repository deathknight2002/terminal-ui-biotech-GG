"""
ClinicalTrials.gov Scraper

Scrapes clinical trial information from ClinicalTrials.gov.
"""

from typing import Dict, List, Optional, Any
from datetime import datetime

from platform.scrapers.sites.press_release_scraper import PressReleaseScraper
from platform.scrapers.base.interface import ContentType, ScraperResult


class ClinicalTrialsScraper(PressReleaseScraper):
    """ClinicalTrials.gov scraper"""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        config = config or {}
        config.setdefault('base_url', 'https://clinicaltrials.gov')
        config.setdefault('rss_url', 'https://clinicaltrials.gov/ct2/results/rss.xml')
        config.setdefault('source_key', 'clinicaltrials')
        config.setdefault('max_rps', 1.0)
        super().__init__(config)
    
    async def normalize(self, parsed_data: Dict[str, Any]) -> ScraperResult:
        """Normalize to clinical trial format"""
        result = await super().normalize(parsed_data)
        result.content_type = ContentType.CLINICAL_TRIAL
        result.data['tags'] = ['clinical-trial'] + result.data.get('tags', [])
        return result

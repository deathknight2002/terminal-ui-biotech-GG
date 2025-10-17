"""
Pipeline Scraper - Base class and company-specific implementations
Extracts pipeline data (phase, indication, asset, logo) from company websites
"""

import hashlib
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from abc import ABC, abstractmethod

import httpx
from bs4 import BeautifulSoup
from selectolax.parser import HTMLParser
from sqlalchemy.orm import Session

from ..base.interface import ScraperInterface
from ..utils.rate_limiter import TokenBucketRateLimiter
from ...core.database import PipelineAsset, Company

logger = logging.getLogger(__name__)


class PipelineScraperBase(ScraperInterface, ABC):
    """
    Base class for pipeline scrapers.
    Provides common functionality for extracting pipeline data from company websites.
    """
    
    def __init__(
        self,
        company_name: str,
        pipeline_url: str,
        rate_limit: float = 0.5,
        timeout: int = 30
    ):
        """
        Initialize pipeline scraper.
        
        Args:
            company_name: Name of the company
            pipeline_url: URL of the company's pipeline page
            rate_limit: Requests per second (default: 0.5 = 1 request per 2 seconds)
            timeout: HTTP request timeout in seconds
        """
        self.company_name = company_name
        self.pipeline_url = pipeline_url
        self.rate_limiter = TokenBucketRateLimiter(rate_limit)
        self.timeout = timeout
        
        self.client = httpx.AsyncClient(
            timeout=timeout,
            follow_redirects=True,
            headers={
                'User-Agent': 'BiotechTerminal/1.0 Pipeline Aggregator (research@bioterminal.dev)',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
            }
        )
    
    async def discover(self, since: Optional[datetime] = None, limit: int = 100) -> List[str]:
        """
        Discover URLs to scrape. For pipeline scrapers, this is typically just the main pipeline page.
        
        Args:
            since: Not used for pipeline scrapers (pipelines are point-in-time snapshots)
            limit: Maximum number of URLs to return
            
        Returns:
            List of URLs to scrape
        """
        return [self.pipeline_url]
    
    async def fetch(self, url: str) -> str:
        """
        Fetch HTML content from URL with rate limiting.
        
        Args:
            url: URL to fetch
            
        Returns:
            HTML content as string
        """
        await self.rate_limiter.acquire()
        
        try:
            logger.info(f"Fetching pipeline data from {url}")
            response = await self.client.get(url)
            response.raise_for_status()
            return response.text
        except Exception as e:
            logger.error(f"Failed to fetch {url}: {e}")
            raise
    
    @abstractmethod
    async def parse(self, html: str, url: str) -> List[Dict[str, Any]]:
        """
        Parse HTML and extract pipeline assets.
        Must be implemented by company-specific scrapers.
        
        Args:
            html: HTML content
            url: Source URL
            
        Returns:
            List of dictionaries containing asset data:
            [
                {
                    'asset_name': str,
                    'phase': str,
                    'indication': str,
                    'therapeutic_area': str,
                    'mechanism_of_action': str,
                    'modality': str,
                    'logo_url': str,
                    'metadata': dict
                },
                ...
            ]
        """
        pass
    
    async def normalize(self, parsed_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Normalize parsed data to standard format.
        
        Args:
            parsed_data: List of parsed asset dictionaries
            
        Returns:
            Normalized asset data
        """
        normalized = []
        
        for asset in parsed_data:
            # Create data hash for deduplication
            hash_input = f"{asset['asset_name']}|{self.company_name}|{asset.get('phase', '')}|{asset.get('indication', '')}"
            data_hash = hashlib.sha256(hash_input.encode()).hexdigest()
            
            # Normalize phase names
            phase = self._normalize_phase(asset.get('phase', ''))
            
            normalized_asset = {
                'asset_name': asset['asset_name'],
                'company_name': self.company_name,
                'phase': phase,
                'indication': asset.get('indication', ''),
                'therapeutic_area': asset.get('therapeutic_area', ''),
                'mechanism_of_action': asset.get('mechanism_of_action', ''),
                'modality': asset.get('modality', ''),
                'development_status': asset.get('development_status', 'Active'),
                'source_url': self.pipeline_url,
                'source_company': self.company_name,
                'logo_url': asset.get('logo_url', ''),
                'data_hash': data_hash,
                'metadata': asset.get('metadata', {}),
            }
            
            normalized.append(normalized_asset)
        
        return normalized
    
    def _normalize_phase(self, phase: str) -> str:
        """
        Normalize phase names to standard format.
        
        Args:
            phase: Raw phase string
            
        Returns:
            Normalized phase string
        """
        phase_lower = phase.lower().strip()
        
        # Phase mapping
        phase_map = {
            'preclinical': 'Preclinical',
            'pre-clinical': 'Preclinical',
            'discovery': 'Preclinical',
            'phase 1': 'Phase I',
            'phase i': 'Phase I',
            'phase 1/2': 'Phase I/II',
            'phase i/ii': 'Phase I/II',
            'phase 2': 'Phase II',
            'phase ii': 'Phase II',
            'phase 2/3': 'Phase II/III',
            'phase ii/iii': 'Phase II/III',
            'phase 3': 'Phase III',
            'phase iii': 'Phase III',
            'nda': 'Filed',
            'bla': 'Filed',
            'maa': 'Filed',
            'filed': 'Filed',
            'approved': 'Approved',
            'marketed': 'Approved',
            'commercial': 'Approved',
        }
        
        return phase_map.get(phase_lower, phase)
    
    async def link(self, normalized_data: List[Dict[str, Any]], db: Session) -> List[Dict[str, Any]]:
        """
        Link pipeline assets to companies in database.
        
        Args:
            normalized_data: Normalized asset data
            db: Database session
            
        Returns:
            Asset data with company_id added
        """
        # Look up company ID
        company = db.query(Company).filter(Company.name == self.company_name).first()
        
        for asset in normalized_data:
            asset['company_id'] = company.id if company else None
        
        return normalized_data
    
    async def upsert(self, linked_data: List[Dict[str, Any]], db: Session) -> Dict[str, int]:
        """
        Insert or update pipeline assets in database.
        
        Args:
            linked_data: Asset data with company links
            db: Database session
            
        Returns:
            Dictionary with counts: {'inserted': int, 'updated': int, 'skipped': int}
        """
        stats = {'inserted': 0, 'updated': 0, 'skipped': 0}
        
        for asset_data in linked_data:
            try:
                # Check if asset already exists
                existing = db.query(PipelineAsset).filter(
                    PipelineAsset.data_hash == asset_data['data_hash']
                ).first()
                
                if existing:
                    # Update existing asset
                    for key, value in asset_data.items():
                        if key not in ['created_at']:
                            setattr(existing, key, value)
                    existing.last_verified = datetime.utcnow()
                    stats['updated'] += 1
                    logger.debug(f"Updated existing asset: {asset_data['asset_name']}")
                else:
                    # Insert new asset
                    new_asset = PipelineAsset(**asset_data)
                    db.add(new_asset)
                    stats['inserted'] += 1
                    logger.info(f"Inserted new asset: {asset_data['asset_name']}")
                
                db.commit()
                
            except Exception as e:
                logger.error(f"Failed to upsert asset {asset_data.get('asset_name', 'unknown')}: {e}")
                db.rollback()
                stats['skipped'] += 1
        
        return stats
    
    async def scrape(self, db: Session, since: Optional[datetime] = None, limit: int = 100) -> Dict[str, Any]:
        """
        Execute full scraping pipeline.
        
        Args:
            db: Database session
            since: Not used for pipeline scrapers
            limit: Maximum number of assets to process
            
        Returns:
            Dictionary with scraping statistics
        """
        start_time = datetime.utcnow()
        
        try:
            # 1. Discover URLs
            urls = await self.discover(since, limit)
            logger.info(f"Discovered {len(urls)} URL(s) for {self.company_name}")
            
            # 2. Fetch and parse
            all_assets = []
            for url in urls:
                html = await self.fetch(url)
                parsed = await self.parse(html, url)
                all_assets.extend(parsed)
            
            logger.info(f"Parsed {len(all_assets)} assets from {self.company_name}")
            
            # 3. Normalize
            normalized = await self.normalize(all_assets)
            
            # 4. Link
            linked = await self.link(normalized, db)
            
            # 5. Upsert
            upsert_stats = await self.upsert(linked, db)
            
            end_time = datetime.utcnow()
            duration = (end_time - start_time).total_seconds()
            
            return {
                'company': self.company_name,
                'source_url': self.pipeline_url,
                'started_at': start_time.isoformat(),
                'completed_at': end_time.isoformat(),
                'duration_seconds': duration,
                'assets_found': len(all_assets),
                'assets_inserted': upsert_stats['inserted'],
                'assets_updated': upsert_stats['updated'],
                'assets_skipped': upsert_stats['skipped'],
                'status': 'success'
            }
            
        except Exception as e:
            logger.error(f"Pipeline scraping failed for {self.company_name}: {e}")
            return {
                'company': self.company_name,
                'source_url': self.pipeline_url,
                'status': 'error',
                'error': str(e)
            }
    
    async def close(self):
        """Close HTTP client connection."""
        await self.client.aclose()


# ============================================================================
# COMPANY-SPECIFIC PIPELINE SCRAPERS
# ============================================================================

class BiogenPipelineScraper(PipelineScraperBase):
    """Scraper for Biogen's pipeline page."""
    
    def __init__(self):
        super().__init__(
            company_name="Biogen",
            pipeline_url="https://www.biogen.com/science-and-innovation/pipeline.html"
        )
    
    async def parse(self, html: str, url: str) -> List[Dict[str, Any]]:
        """Parse Biogen pipeline page."""
        soup = BeautifulSoup(html, 'html.parser')
        assets = []
        
        # Example parsing logic - adjust based on actual site structure
        # This is a template that should be customized for each company
        try:
            # Look for pipeline table or cards
            pipeline_rows = soup.find_all('tr', class_='pipeline-row') or soup.find_all('div', class_='asset-card')
            
            for row in pipeline_rows:
                asset = {
                    'asset_name': self._extract_text(row, ['asset-name', 'drug-name', 'product']),
                    'phase': self._extract_text(row, ['phase', 'development-phase', 'stage']),
                    'indication': self._extract_text(row, ['indication', 'disease', 'condition']),
                    'therapeutic_area': self._extract_text(row, ['therapeutic-area', 'area', 'category']),
                    'mechanism_of_action': self._extract_text(row, ['moa', 'mechanism', 'target']),
                    'modality': self._extract_text(row, ['modality', 'type']),
                    'logo_url': self._extract_image(row),
                    'metadata': {}
                }
                
                if asset['asset_name']:  # Only add if we found an asset name
                    assets.append(asset)
        
        except Exception as e:
            logger.error(f"Error parsing Biogen pipeline: {e}")
        
        return assets
    
    def _extract_text(self, element, class_names: List[str]) -> str:
        """Extract text from element by trying multiple class names."""
        for class_name in class_names:
            found = element.find(class_=class_name)
            if found:
                return found.get_text(strip=True)
        return ''
    
    def _extract_image(self, element) -> str:
        """Extract image URL from element."""
        img = element.find('img')
        if img and img.get('src'):
            return img.get('src')
        return ''


class AmgenPipelineScraper(PipelineScraperBase):
    """Scraper for Amgen's pipeline page."""
    
    def __init__(self):
        super().__init__(
            company_name="Amgen",
            pipeline_url="https://www.amgen.com/science/pipeline"
        )
    
    async def parse(self, html: str, url: str) -> List[Dict[str, Any]]:
        """Parse Amgen pipeline page."""
        parser = HTMLParser(html)
        assets = []
        
        try:
            # Adjust selectors based on actual Amgen page structure
            pipeline_items = parser.css('.pipeline-item') or parser.css('[data-pipeline-asset]')
            
            for item in pipeline_items:
                name_elem = item.css_first('.asset-name') or item.css_first('h3')
                phase_elem = item.css_first('.phase') or item.css_first('[data-phase]')
                indication_elem = item.css_first('.indication')
                
                asset = {
                    'asset_name': name_elem.text(strip=True) if name_elem else '',
                    'phase': phase_elem.text(strip=True) if phase_elem else '',
                    'indication': indication_elem.text(strip=True) if indication_elem else '',
                    'therapeutic_area': '',
                    'mechanism_of_action': '',
                    'modality': '',
                    'logo_url': '',
                    'metadata': {}
                }
                
                if asset['asset_name']:
                    assets.append(asset)
        
        except Exception as e:
            logger.error(f"Error parsing Amgen pipeline: {e}")
        
        return assets


class GileadPipelineScraper(PipelineScraperBase):
    """Scraper for Gilead's pipeline page."""
    
    def __init__(self):
        super().__init__(
            company_name="Gilead Sciences",
            pipeline_url="https://www.gilead.com/science-and-medicine/pipeline"
        )
    
    async def parse(self, html: str, url: str) -> List[Dict[str, Any]]:
        """Parse Gilead pipeline page."""
        soup = BeautifulSoup(html, 'html.parser')
        assets = []
        
        try:
            # Gilead-specific parsing logic
            pipeline_sections = soup.find_all('div', class_='pipeline-section')
            
            for section in pipeline_sections:
                therapeutic_area = section.find('h2')
                ta_name = therapeutic_area.get_text(strip=True) if therapeutic_area else ''
                
                asset_cards = section.find_all('div', class_='asset-card')
                for card in asset_cards:
                    asset = {
                        'asset_name': self._safe_extract(card, 'h3'),
                        'phase': self._safe_extract(card, '.phase'),
                        'indication': self._safe_extract(card, '.indication'),
                        'therapeutic_area': ta_name,
                        'mechanism_of_action': self._safe_extract(card, '.mechanism'),
                        'modality': '',
                        'logo_url': '',
                        'metadata': {}
                    }
                    
                    if asset['asset_name']:
                        assets.append(asset)
        
        except Exception as e:
            logger.error(f"Error parsing Gilead pipeline: {e}")
        
        return assets
    
    def _safe_extract(self, element, selector: str) -> str:
        """Safely extract text from element."""
        found = element.select_one(selector)
        return found.get_text(strip=True) if found else ''


# Factory function to create scrapers
def get_pipeline_scraper(company_name: str) -> Optional[PipelineScraperBase]:
    """
    Factory function to get pipeline scraper for a specific company.
    
    Args:
        company_name: Name of the company
        
    Returns:
        Pipeline scraper instance or None if not available
    """
    scrapers = {
        'biogen': BiogenPipelineScraper,
        'amgen': AmgenPipelineScraper,
        'gilead': GileadPipelineScraper,
        'gilead sciences': GileadPipelineScraper,
    }
    
    scraper_class = scrapers.get(company_name.lower())
    if scraper_class:
        return scraper_class()
    
    logger.warning(f"No pipeline scraper available for {company_name}")
    return None


# List of all available company scrapers
AVAILABLE_SCRAPERS = [
    'Biogen',
    'Amgen',
    'Gilead Sciences',
]

"""
Base Scraper Interface

Defines the strict interface all scrapers must implement:
discover → fetch → parse → normalize → link → upsert
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional
from enum import Enum


class ContentType(Enum):
    """Content type classification"""
    ARTICLE = "article"
    CATALYST = "catalyst"
    THERAPEUTIC = "therapeutic"
    PRESS_RELEASE = "press_release"
    REGULATORY = "regulatory"
    CLINICAL_TRIAL = "clinical_trial"


@dataclass
class ScraperResult:
    """Result from scraper pipeline"""
    content_type: ContentType
    data: Dict[str, Any]
    metadata: Dict[str, Any] = field(default_factory=dict)
    raw_html: Optional[str] = None
    fixture_path: Optional[str] = None
    
    # Deduplication fields
    url: str = ""
    hash: str = ""
    fingerprint: str = ""
    
    # Linking fields
    companies: List[str] = field(default_factory=list)
    diseases: List[str] = field(default_factory=list)
    catalysts: List[str] = field(default_factory=list)
    
    # Quality metrics
    confidence: float = 1.0
    link_valid: bool = True
    
    # Timestamps
    published_at: Optional[datetime] = None
    scraped_at: datetime = field(default_factory=datetime.utcnow)


class ScraperInterface(ABC):
    """
    Base interface for all scrapers.
    
    Pipeline: discover → fetch → parse → normalize → link → upsert
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.name = self.__class__.__name__
        self.source_key = self.config.get("source_key", self.name.lower())
    
    @abstractmethod
    async def discover(
        self,
        method: str = "rss",  # rss, sitemap, archive, url
        since: Optional[datetime] = None,
        limit: Optional[int] = None,
        **kwargs
    ) -> List[str]:
        """
        Discover URLs to scrape.
        
        Args:
            method: Discovery method (rss, sitemap, archive, url)
            since: Only discover content after this date
            limit: Maximum number of URLs to discover
            **kwargs: Additional method-specific parameters
            
        Returns:
            List of URLs to scrape
        """
        pass
    
    @abstractmethod
    async def fetch(
        self,
        urls: List[str],
        batch_size: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Fetch content from URLs in batches.
        
        Args:
            urls: List of URLs to fetch
            batch_size: Number of concurrent requests
            
        Returns:
            List of raw responses with metadata
        """
        pass
    
    @abstractmethod
    async def parse(
        self,
        raw_content: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Parse HTML/JSON content into structured data.
        
        Prefers structured data (JSON-LD, Microdata, OpenGraph)
        over HTML parsing.
        
        Args:
            raw_content: Raw HTML/JSON from fetch
            
        Returns:
            Parsed structured data
        """
        pass
    
    @abstractmethod
    async def normalize(
        self,
        parsed_data: Dict[str, Any]
    ) -> ScraperResult:
        """
        Normalize parsed data into standard models.
        
        Args:
            parsed_data: Parsed data from parse step
            
        Returns:
            ScraperResult with normalized data
        """
        pass
    
    @abstractmethod
    async def link(
        self,
        result: ScraperResult
    ) -> ScraperResult:
        """
        Link result to companies, diseases, and catalysts.
        
        Uses entity resolution with dictionary lookup.
        
        Args:
            result: Normalized scraper result
            
        Returns:
            ScraperResult with linked entities
        """
        pass
    
    async def upsert(
        self,
        result: ScraperResult,
        dry_run: bool = False
    ) -> bool:
        """
        Insert or update result in database.
        
        Args:
            result: Final scraper result
            dry_run: If True, don't actually write to DB
            
        Returns:
            True if successful
        """
        # Default implementation - can be overridden
        if dry_run:
            return True
        # Actual DB logic handled by caller
        return True
    
    async def run(
        self,
        since: Optional[datetime] = None,
        limit: Optional[int] = None,
        dry_run: bool = False,
        save_fixture: bool = False,
        **kwargs
    ) -> List[ScraperResult]:
        """
        Run the complete scraper pipeline.
        
        Args:
            since: Only scrape content after this date
            limit: Maximum number of items to scrape
            dry_run: Don't write to database
            save_fixture: Save raw HTML and parsed JSON
            **kwargs: Additional parameters
            
        Returns:
            List of scraper results
        """
        # Discover URLs
        urls = await self.discover(
            since=since,
            limit=limit,
            **kwargs
        )
        
        if not urls:
            return []
        
        # Fetch content
        raw_contents = await self.fetch(urls)
        
        results = []
        for raw_content in raw_contents:
            try:
                # Parse
                parsed = await self.parse(raw_content)
                
                # Normalize
                result = await self.normalize(parsed)
                
                # Link entities
                result = await self.link(result)
                
                # Save fixture if requested
                if save_fixture:
                    result.fixture_path = await self._save_fixture(
                        raw_content, parsed, result
                    )
                
                # Upsert
                await self.upsert(result, dry_run=dry_run)
                
                results.append(result)
                
            except Exception as e:
                # Log error but continue processing
                print(f"Error processing {raw_content.get('url', 'unknown')}: {e}")
                continue
        
        return results
    
    async def _save_fixture(
        self,
        raw_content: Dict[str, Any],
        parsed_data: Dict[str, Any],
        result: ScraperResult
    ) -> str:
        """
        Save fixture for offline testing.
        
        Returns:
            Path to saved fixture
        """
        import orjson
        from pathlib import Path
        
        # Create fixture directory
        timestamp = datetime.utcnow().strftime("%Y%m%d")
        fixture_dir = Path("tmp/fixtures") / self.source_key / timestamp
        fixture_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate unique filename
        url_hash = result.hash or "unknown"
        fixture_file = fixture_dir / f"{url_hash}.json"
        
        # Save fixture
        fixture_data = {
            "url": result.url,
            "raw_html": raw_content.get("html", ""),
            "parsed": parsed_data,
            "normalized": {
                "content_type": result.content_type.value,
                "data": result.data,
                "metadata": result.metadata,
            },
            "scraped_at": result.scraped_at.isoformat(),
        }
        
        with open(fixture_file, "wb") as f:
            f.write(orjson.dumps(fixture_data, option=orjson.OPT_INDENT_2))
        
        return str(fixture_file)

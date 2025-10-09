"""
Fierce Biotech/Pharma Scraper

RSS and archive-based scraper for FierceBiotech and FiercePharma.
"""

import asyncio
from datetime import datetime
from typing import Dict, List, Optional, Any
import feedparser
from platform.scrapers.base.interface import ScraperInterface, ScraperResult, ContentType
from platform.scrapers.utils.http_client import AsyncHTTPClient
from platform.scrapers.utils.rate_limiter import TokenBucketRateLimiter
from platform.scrapers.utils.parsing import extract_article_metadata, extract_text_content
from platform.scrapers.utils.deduplication import canonical_url, content_hash, content_fingerprint


class FierceScraper(ScraperInterface):
    """
    Scraper for FierceBiotech and FiercePharma.
    
    Uses RSS feed for discovery and HTML parsing for content.
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        super().__init__(config)
        
        # Configuration
        self.base_url = config.get('base_url', 'https://www.fiercebiotech.com')
        self.rss_url = config.get('rss_url', f'{self.base_url}/rss/xml')
        
        # HTTP client
        self.http_client = AsyncHTTPClient(
            user_agent=config.get('user_agent', 'BiotechTerminal/1.0'),
            timeout=30.0,
        )
        
        # Rate limiter
        max_rps = config.get('max_rps', 0.5)  # 1 req per 2 seconds
        self.rate_limiter = TokenBucketRateLimiter(
            default_rate=max_rps,
            default_capacity=int(max_rps * 10),
        )
    
    async def discover(
        self,
        method: str = "rss",
        since: Optional[datetime] = None,
        limit: Optional[int] = None,
        urls: Optional[List[str]] = None,
        **kwargs
    ) -> List[str]:
        """
        Discover article URLs from RSS feed or direct URLs.
        """
        if method == "url" and urls:
            return urls
        
        if method != "rss":
            raise ValueError(f"Method {method} not supported for FierceScraper")
        
        # Fetch RSS feed (not rate limited)
        feed = feedparser.parse(self.rss_url)
        
        discovered_urls = []
        for entry in feed.entries:
            # Check date filter
            if since:
                try:
                    pub_date = datetime(*entry.published_parsed[:6])
                    if pub_date < since:
                        continue
                except (AttributeError, TypeError):
                    pass
            
            # Add URL
            url = entry.get('link', '')
            if url:
                discovered_urls.append(canonical_url(url))
            
            # Check limit
            if limit and len(discovered_urls) >= limit:
                break
        
        return discovered_urls
    
    async def fetch(
        self,
        urls: List[str],
        batch_size: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Fetch article HTML with rate limiting.
        """
        results = []
        
        for url in urls:
            # Rate limit
            await self.rate_limiter.acquire(url)
            
            try:
                response = await self.http_client.get(url)
                results.append(response)
            except Exception as e:
                print(f"Error fetching {url}: {e}")
                continue
        
        return results
    
    async def parse(
        self,
        raw_content: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Parse article HTML into structured data.
        """
        html = raw_content.get('html', '')
        url = raw_content.get('url', '')
        
        # Extract metadata using structured data
        metadata = extract_article_metadata(html)
        
        # Extract article content
        content = extract_text_content(html, selector='article')
        
        return {
            'url': url,
            'title': metadata.get('title', ''),
            'description': metadata.get('description', ''),
            'author': metadata.get('author', ''),
            'published_at': metadata.get('published'),
            'image_url': metadata.get('image', ''),
            'content': content,
            'metadata': metadata,
        }
    
    async def normalize(
        self,
        parsed_data: Dict[str, Any]
    ) -> ScraperResult:
        """
        Normalize parsed data into Article model.
        """
        url = canonical_url(parsed_data['url'])
        content = parsed_data.get('content', '')
        
        # Generate hashes
        content_hash_value = content_hash(content)
        fingerprint = content_fingerprint(content)
        
        # Extract tags from content (simple keyword extraction)
        tags = self._extract_tags(parsed_data)
        
        result = ScraperResult(
            content_type=ContentType.ARTICLE,
            data={
                'title': parsed_data['title'],
                'url': url,
                'summary': parsed_data['description'][:500] if parsed_data.get('description') else '',
                'source': self.source_key,
                'published_at': parsed_data.get('published_at'),
                'tags': tags,
                'hash': content_hash_value,
                'link_valid': True,
            },
            metadata={
                'author': parsed_data.get('author', ''),
                'image_url': parsed_data.get('image_url', ''),
                'content_length': len(content),
            },
            url=url,
            hash=content_hash_value,
            fingerprint=fingerprint,
            published_at=parsed_data.get('published_at'),
        )
        
        return result
    
    async def link(
        self,
        result: ScraperResult
    ) -> ScraperResult:
        """
        Link article to companies, diseases, and catalysts.
        
        TODO: Implement entity resolution with database lookups.
        """
        # Placeholder - will be implemented with entity resolution
        content = result.data.get('title', '') + ' ' + result.data.get('summary', '')
        
        # Simple keyword matching (will be replaced with proper NER)
        result.companies = self._extract_companies(content)
        result.diseases = self._extract_diseases(content)
        
        return result
    
    def _extract_tags(self, parsed_data: Dict[str, Any]) -> List[str]:
        """Extract tags from parsed data"""
        tags = []
        
        # Domain classification (simple keyword matching)
        content = (parsed_data.get('title', '') + ' ' + parsed_data.get('content', '')).lower()
        
        if any(word in content for word in ['fda', 'approval', 'regulatory', 'clearance']):
            tags.append('regulatory')
        
        if any(word in content for word in ['trial', 'phase', 'clinical', 'study', 'data']):
            tags.append('clinical')
        
        if any(word in content for word in ['acquisition', 'merger', 'deal', 'partnership']):
            tags.append('mna')
        
        return tags
    
    def _extract_companies(self, text: str) -> List[str]:
        """Extract company names (placeholder)"""
        # TODO: Implement with entity resolution
        return []
    
    def _extract_diseases(self, text: str) -> List[str]:
        """Extract disease names (placeholder)"""
        # TODO: Implement with entity resolution
        return []
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.http_client.close()

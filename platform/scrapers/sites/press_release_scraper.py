"""
Press Release Scrapers

BusinessWire, GlobeNewswire, PRNewswire scrapers with near-duplicate detection.
"""

from typing import Dict, List, Optional, Any
from datetime import datetime
import feedparser

from platform.scrapers.base.interface import ScraperInterface, ScraperResult, ContentType
from platform.scrapers.utils.http_client import AsyncHTTPClient
from platform.scrapers.utils.rate_limiter import TokenBucketRateLimiter
from platform.scrapers.utils.parsing import extract_article_metadata, extract_text_content
from platform.scrapers.utils.deduplication import canonical_url, content_hash, content_fingerprint


class PressReleaseScraper(ScraperInterface):
    """
    Base class for press release scrapers.
    
    Handles common press release scraping patterns.
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        super().__init__(config)
        
        self.base_url = config.get('base_url', '')
        self.rss_url = config.get('rss_url', '')
        
        self.http_client = AsyncHTTPClient(
            user_agent=config.get('user_agent', 'BiotechTerminal/1.0'),
            timeout=30.0,
        )
        
        max_rps = config.get('max_rps', 2.0)
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
        """Discover URLs from RSS or direct URLs"""
        if method == "url" and urls:
            return urls
        
        if not self.rss_url:
            return []
        
        feed = feedparser.parse(self.rss_url)
        
        discovered_urls = []
        for entry in feed.entries:
            if since:
                try:
                    pub_date = datetime(*entry.published_parsed[:6])
                    if pub_date < since:
                        continue
                except (AttributeError, TypeError):
                    pass
            
            url = entry.get('link', '')
            if url:
                discovered_urls.append(canonical_url(url))
            
            if limit and len(discovered_urls) >= limit:
                break
        
        return discovered_urls
    
    async def fetch(
        self,
        urls: List[str],
        batch_size: int = 10
    ) -> List[Dict[str, Any]]:
        """Fetch with rate limiting"""
        results = []
        
        for url in urls:
            await self.rate_limiter.acquire(url)
            
            try:
                response = await self.http_client.get(url)
                results.append(response)
            except Exception as e:
                print(f"Error fetching {url}: {e}")
                continue
        
        return results
    
    async def parse(self, raw_content: Dict[str, Any]) -> Dict[str, Any]:
        """Parse press release HTML"""
        html = raw_content.get('html', '')
        url = raw_content.get('url', '')
        
        metadata = extract_article_metadata(html)
        content = extract_text_content(html)
        
        return {
            'url': url,
            'title': metadata.get('title', ''),
            'description': metadata.get('description', ''),
            'published_at': metadata.get('published'),
            'content': content,
            'metadata': metadata,
        }
    
    async def normalize(self, parsed_data: Dict[str, Any]) -> ScraperResult:
        """Normalize to press release format"""
        url = canonical_url(parsed_data['url'])
        content = parsed_data.get('content', '')
        
        content_hash_value = content_hash(content)
        fingerprint = content_fingerprint(content)
        
        result = ScraperResult(
            content_type=ContentType.PRESS_RELEASE,
            data={
                'title': parsed_data['title'],
                'url': url,
                'summary': parsed_data['description'][:500] if parsed_data.get('description') else '',
                'source': self.source_key,
                'published_at': parsed_data.get('published_at'),
                'tags': ['press-release'],
                'hash': content_hash_value,
                'link_valid': True,
            },
            url=url,
            hash=content_hash_value,
            fingerprint=fingerprint,
            published_at=parsed_data.get('published_at'),
        )
        
        return result
    
    async def link(self, result: ScraperResult) -> ScraperResult:
        """Link entities (placeholder)"""
        # TODO: Implement entity linking
        return result
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.http_client.close()


class BusinessWireScraper(PressReleaseScraper):
    """BusinessWire scraper"""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        config = config or {}
        config.setdefault('base_url', 'https://www.businesswire.com')
        config.setdefault('source_key', 'businesswire')
        super().__init__(config)


class GlobeNewswireScraper(PressReleaseScraper):
    """GlobeNewswire scraper"""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        config = config or {}
        config.setdefault('base_url', 'https://www.globenewswire.com')
        config.setdefault('source_key', 'globenewswire')
        super().__init__(config)


class PRNewswireScraper(PressReleaseScraper):
    """PR Newswire scraper"""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        config = config or {}
        config.setdefault('base_url', 'https://www.prnewswire.com')
        config.setdefault('source_key', 'prnewswire')
        super().__init__(config)

# Source Packs Guide

Creating new scrapers using the source pack template system.

## What is a Source Pack?

A source pack is a template for rapidly adding new scrapers to the Biotech Terminal. It includes:

- **Scraper implementation** - Python class extending `ScraperInterface`
- **Selectors** - CSS/XPath selectors for content extraction
- **Normalizer** - Logic to map raw HTML to our data models
- **Tests** - Unit tests with golden snapshots
- **Registry entry** - Configuration in `registry.yaml`
- **Checklist** - robots.txt/TOS compliance review

## Quick Start

### 1. Copy the Template

```bash
cp -r platform/scrapers/sites/template/ platform/scrapers/sites/my_source/
cd platform/scrapers/sites/my_source/
```

### 2. Update Registry

Add to `platform/scrapers/registry.yaml`:

```yaml
scrapers:
  news_press:  # or regulators, registries, exchanges, company_sites
    - source_key: my_source
      name: My Source
      base_url: https://mysource.com
      enabled: true
      rate_limit:
        max_rps: 1.0  # Requests per second
        max_concurrent: 2
      discovery:
        has_rss: true
        rss_url: https://mysource.com/rss
        has_sitemap: false
        has_archive: true
        archive_url: https://mysource.com/news
      robots:
        respect: true
        user_agent: "BiotechTerminal/1.0 (contact@bioterminal.dev)"
      extra:
        timezone: "America/New_York"
```

### 3. Create Scraper Class

```python
# platform/scrapers/sites/my_source_scraper.py
from typing import Dict, List, Optional, Any
from datetime import datetime
import feedparser

from platform.scrapers.base.interface import ScraperInterface, ScraperResult, ContentType
from platform.scrapers.utils.http_client import AsyncHTTPClient
from platform.scrapers.utils.rate_limiter import TokenBucketRateLimiter
from platform.scrapers.utils.parsing import extract_article_metadata, extract_text_content
from platform.scrapers.utils.deduplication import canonical_url, content_hash, content_fingerprint


class MySourceScraper(ScraperInterface):
    """
    Scraper for My Source.
    
    Uses RSS feed for discovery and HTML parsing for content.
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        super().__init__(config)
        
        self.base_url = config.get('base_url', 'https://mysource.com')
        self.rss_url = config.get('rss_url', f'{self.base_url}/rss')
        
        self.http_client = AsyncHTTPClient(
            user_agent=config.get('user_agent', 'BiotechTerminal/1.0'),
            timeout=30.0,
        )
        
        max_rps = config.get('max_rps', 1.0)
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
        """Discover article URLs from RSS feed"""
        if method == "url" and urls:
            return urls
        
        # Fetch RSS feed
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
        """Fetch article HTML with rate limiting"""
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
    
    async def parse(
        self,
        raw_content: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Parse article HTML into structured data"""
        html = raw_content.get('html', '')
        url = raw_content.get('url', '')
        
        # Extract metadata (JSON-LD, OpenGraph, etc.)
        metadata = extract_article_metadata(html)
        
        # Extract article content
        # Customize selector for your source
        content = extract_text_content(html, selector='article.main-content')
        
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
        """Normalize parsed data into Article model"""
        url = canonical_url(parsed_data['url'])
        content = parsed_data.get('content', '')
        
        # Generate hashes
        content_hash_value = content_hash(content)
        fingerprint = content_fingerprint(content)
        
        # Extract tags (customize for your source)
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
        """Link article to companies, diseases, and catalysts"""
        # TODO: Implement entity resolution
        return result
    
    def _extract_tags(self, parsed_data: Dict[str, Any]) -> List[str]:
        """Extract tags from parsed data"""
        tags = []
        
        # Simple keyword matching
        content = (parsed_data.get('title', '') + ' ' + parsed_data.get('content', '')).lower()
        
        # Add domain tags
        if any(word in content for word in ['fda', 'approval', 'regulatory']):
            tags.append('regulatory')
        
        if any(word in content for word in ['trial', 'phase', 'clinical']):
            tags.append('clinical')
        
        if any(word in content for word in ['acquisition', 'merger', 'deal']):
            tags.append('mna')
        
        return tags
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.http_client.close()
```

### 4. Add to CLI

Edit `platform/cli/scrape.py`:

```python
from platform.scrapers.sites.my_source_scraper import MySourceScraper

SCRAPER_MAP = {
    # ...
    'mysource': MySourceScraper,
}
```

### 5. Create Tests

```python
# platform/scrapers/tests/test_my_source.py
import pytest
from platform.scrapers.sites.my_source_scraper import MySourceScraper


@pytest.mark.asyncio
async def test_my_source_discover():
    """Test URL discovery"""
    scraper = MySourceScraper()
    urls = await scraper.discover(limit=5)
    
    assert len(urls) > 0
    assert all(url.startswith('https://') for url in urls)


@pytest.mark.asyncio
async def test_my_source_fetch():
    """Test content fetching"""
    scraper = MySourceScraper()
    urls = await scraper.discover(limit=2)
    
    results = await scraper.fetch(urls)
    
    assert len(results) > 0
    assert 'html' in results[0]
    assert 'url' in results[0]


@pytest.mark.asyncio
async def test_my_source_parse():
    """Test HTML parsing"""
    scraper = MySourceScraper()
    
    # Use a fixture
    with open('platform/scrapers/tests/fixtures/my_source_sample.html', 'r') as f:
        html = f.read()
    
    raw_content = {
        'url': 'https://mysource.com/article',
        'html': html,
    }
    
    parsed = await scraper.parse(raw_content)
    
    assert parsed['title']
    assert parsed['url']
    assert parsed['content']


@pytest.mark.asyncio
async def test_my_source_normalize():
    """Test normalization"""
    scraper = MySourceScraper()
    
    parsed_data = {
        'url': 'https://mysource.com/article',
        'title': 'Test Article',
        'description': 'Test description',
        'published_at': None,
        'content': 'Test content',
    }
    
    result = await scraper.normalize(parsed_data)
    
    assert result.content_type.value == 'article'
    assert result.data['title'] == 'Test Article'
    assert result.hash
    assert result.fingerprint
```

### 6. Generate Fixtures

```bash
# Generate test fixtures
python -m platform.cli.scrape --source mysource --save-fixture --limit 5

# Fixtures saved to tmp/fixtures/mysource/YYYYMMDD/
```

### 7. Compliance Checklist

Create `platform/scrapers/sites/my_source/COMPLIANCE.md`:

```markdown
# My Source Compliance Checklist

## robots.txt Review
- [x] Checked robots.txt: https://mysource.com/robots.txt
- [x] User-Agent allowed: BiotechTerminal/1.0
- [x] No disallowed paths in our scope
- [x] Crawl-delay respected: 1 second

## Terms of Service
- [x] Read TOS: https://mysource.com/terms
- [x] Scraping allowed for non-commercial research
- [x] Attribution provided in User-Agent
- [x] No copyright violations

## Rate Limiting
- [x] Max 1 req/s configured
- [x] Jitter enabled
- [x] Respects Retry-After headers

## Content Usage
- [x] Metadata only (no full-text copying)
- [x] Links back to original source
- [x] No paywalled content

## Contact
- [x] Contact email in User-Agent
- [x] Ready to respond to cease-and-desist

## Notes
- Source is public, non-paywalled
- Content is biotech/pharma news
- Used for aggregation and research
```

## Template Structure

```
platform/scrapers/sites/my_source/
├── __init__.py
├── my_source_scraper.py     # Main scraper implementation
├── selectors.py              # CSS/XPath selectors (optional)
├── normalizer.py             # Custom normalization logic (optional)
├── COMPLIANCE.md             # Legal/TOS review
└── tests/
    ├── __init__.py
    ├── test_my_source.py     # Unit tests
    └── fixtures/
        └── sample.html       # Golden snapshot
```

## Advanced Features

### Custom Selectors

```python
# selectors.py
ARTICLE_SELECTORS = {
    'title': 'h1.article-title',
    'author': '.author-name',
    'published': 'time.published',
    'content': 'div.article-body',
    'tags': '.tag-list a',
}

# Use in scraper
from .selectors import ARTICLE_SELECTORS

async def parse(self, raw_content):
    tree = HTMLParser(raw_content['html'])
    
    title = tree.css_first(ARTICLE_SELECTORS['title'])
    # ...
```

### Sitemap Discovery

```python
async def discover(self, method="sitemap", **kwargs):
    if method == "sitemap":
        import xml.etree.ElementTree as ET
        
        response = await self.http_client.get(f'{self.base_url}/sitemap.xml')
        root = ET.fromstring(response['content'])
        
        urls = []
        for url_elem in root.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}url'):
            loc = url_elem.find('{http://www.sitemaps.org/schemas/sitemap/0.9}loc')
            if loc is not None and '/news/' in loc.text:
                urls.append(loc.text)
        
        return urls[:limit] if limit else urls
```

### Archive Pagination

```python
async def discover(self, method="archive", **kwargs):
    if method == "archive":
        urls = []
        page = 1
        
        while True:
            archive_url = f'{self.base_url}/news?page={page}'
            response = await self.http_client.get(archive_url)
            
            tree = HTMLParser(response['html'])
            articles = tree.css('.article-link')
            
            if not articles:
                break
            
            for article in articles:
                url = article.attributes.get('href')
                if url:
                    urls.append(url)
            
            page += 1
            
            if limit and len(urls) >= limit:
                break
        
        return urls[:limit] if limit else urls
```

### Date Parsing

```python
from dateutil import parser as date_parser
import pytz

async def parse(self, raw_content):
    # ...
    
    # Parse date with timezone
    date_str = metadata.get('published', '')
    if date_str:
        try:
            pub_date = date_parser.parse(date_str)
            
            # Convert to UTC
            if pub_date.tzinfo is None:
                # Assume source timezone
                tz = pytz.timezone(self.config.get('timezone', 'UTC'))
                pub_date = tz.localize(pub_date)
            
            pub_date = pub_date.astimezone(pytz.UTC)
            
        except Exception as e:
            pub_date = None
    
    return {
        'published_at': pub_date,
        # ...
    }
```

## Best Practices

### 1. Start with RSS/Sitemap
Prefer structured data over HTML scraping.

### 2. Use Fixtures for Development
Save fixtures early to avoid hitting the source repeatedly.

### 3. Test Offline
Run tests with fixtures, no network required.

### 4. Handle Errors Gracefully
Continue processing even if one URL fails.

### 5. Log Everything
Use structured logging for debugging.

### 6. Respect Rate Limits
Be conservative with request rates.

### 7. Check robots.txt
Always review before deploying.

### 8. Monitor for Changes
Source sites update their HTML structure regularly.

## Troubleshooting

### "No URLs discovered"
- Check RSS/sitemap URL is correct
- Verify site structure hasn't changed
- Try increasing `limit` parameter

### "Parse errors"
- Inspect HTML structure with browser DevTools
- Update selectors in `selectors.py`
- Check for JavaScript-rendered content (may need Playwright)

### "Rate limited"
- Reduce `max_rps` in registry
- Add delay between batches
- Check for Retry-After headers

### "Duplicate articles"
- Content fingerprinting is working
- Check `hash` field uniqueness
- Verify URL canonicalization

## See Also

- [SCRAPERS_GUIDE.md](./SCRAPERS_GUIDE.md) - Complete scraper docs
- [REFRESH_MODEL.md](./REFRESH_MODEL.md) - Manual refresh model
- [API.md](./API.md) - Admin API reference

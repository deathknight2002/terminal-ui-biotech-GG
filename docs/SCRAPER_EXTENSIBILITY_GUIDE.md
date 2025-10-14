# Scraper Extensibility: Adding New Data Sources

This document explains how to add new scrapers to the Biotech Terminal platform using the extensibility framework.

## Quick Start

### 1. Create Your Scraper

Create a new file in `bt_platform/scrapers/sites/`:

```python
from bt_platform.scrapers.base.interface import ScraperInterface, ScraperResult, ContentType
from typing import Dict, List, Optional, Any
from datetime import datetime

class MyCustomScraper(ScraperInterface):
    """Your scraper description"""
    
    async def discover(self, method: str = "rss", since: Optional[datetime] = None, 
                      limit: Optional[int] = None, **kwargs) -> List[str]:
        """Find URLs to scrape"""
        # Implementation
        return []
    
    async def fetch(self, urls: List[str], batch_size: int = 10) -> List[Dict[str, Any]]:
        """Fetch content from URLs"""
        # Implementation
        return []
    
    async def parse(self, raw_content: Dict[str, Any]) -> Dict[str, Any]:
        """Extract structured data"""
        # Implementation
        return {}
    
    async def normalize(self, parsed_data: Dict[str, Any]) -> ScraperResult:
        """Map to standard format"""
        return ScraperResult(
            content_type=ContentType.ARTICLE,
            data=parsed_data,
            url=parsed_data.get('url', ''),
            companies=[],
            published_at=datetime.utcnow()
        )
```

### 2. Register in registry.yaml

Add your scraper to `bt_platform/scrapers/registry.yaml`:

```yaml
scrapers:
  your_category:
    - source_key: my_scraper
      name: My Scraper
      base_url: https://example.com
      enabled: true
      rate_limit:
        max_rps: 1.0
        max_concurrent: 2
      discovery:
        has_rss: true
        rss_url: https://example.com/rss
      robots:
        respect: true
        user_agent: "BiotechTerminal/1.0 (contact@bioterminal.dev)"
```

### 3. Test Your Scraper

```bash
# Dry run (no database writes)
poetry run python -m bt_platform.cli.scrape --source my_scraper --dry-run --limit 10

# Test with fixtures
poetry run python -m bt_platform.cli.scrape --source my_scraper --save-fixture --limit 5

# Production run
poetry run python -m bt_platform.cli.scrape --source my_scraper --since 7d --limit 50
```

## Examples

### Example 1: LinkedIn Jobs Scraper

See `examples/scraper_extensibility_example.py` for a complete implementation.

### Example 2: PubMed Scraper

```python
class PubMedScraper(ScraperInterface):
    """Scrape PubMed publications"""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        super().__init__(config)
        self.api_key = config.get('api_key') if config else None
    
    async def discover(self, method: str = "api", **kwargs) -> List[str]:
        """Use PubMed E-utilities API"""
        # Query API: https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi
        # Return list of PubMed IDs
        return []
    
    async def fetch(self, urls: List[str], batch_size: int = 10) -> List[Dict[str, Any]]:
        """Fetch article details"""
        # Use efetch API
        return []
    
    async def parse(self, raw_content: Dict[str, Any]) -> Dict[str, Any]:
        """Extract article metadata"""
        return {
            'pmid': '...',
            'title': '...',
            'authors': [],
            'abstract': '...',
            'journal': '...',
            'publication_date': '...'
        }
```

### Example 3: Conference Calendar Scraper

```python
class ConferenceCalendarScraper(ScraperInterface):
    """Scrape biotech conference calendars"""
    
    async def discover(self, method: str = "sitemap", **kwargs) -> List[str]:
        """Find conference event pages"""
        # Scrape from ASH, ASCO, JPM Healthcare Conference sites
        return []
    
    async def parse(self, raw_content: Dict[str, Any]) -> Dict[str, Any]:
        """Extract conference details"""
        return {
            'conference_name': 'ASH Annual Meeting',
            'date': '2024-12-07',
            'location': 'San Diego, CA',
            'abstracts_url': '...',
            'companies_presenting': []
        }
```

## Planned Scrapers (Priority Order)

1. ✅ **PubMed** - Academic publications
2. ✅ **LinkedIn Jobs** - Hiring trends
3. **FDA PDUFA Dates** - Regulatory calendar
4. **SEC Form 4** - Insider transactions
5. **SEC 8-K** - Material events
6. **Conference Calendars** - ASH, ASCO, JPM
7. **ClinicalTrials.gov Enhanced** - Phase 3 trials
8. **Twitter/X** - Key opinion leaders
9. **USPTO Patents** - Biotech patent filings
10. **Analyst Reports** - Street consensus
11. **Reddit r/biotech** - Community discussions
12. **GEN Magazine** - Industry news
13. **13F Filings** - Institutional holdings
14. **Biotech Forums** - BioSpace, others
15. **EMA Decisions** - European regulatory
16. **Company IR Pages** - Press releases

## Best Practices

### Rate Limiting

Always respect rate limits:

```python
async def fetch(self, urls: List[str], batch_size: int = 10):
    for i in range(0, len(urls), batch_size):
        batch = urls[i:i + batch_size]
        # Process batch
        await asyncio.sleep(2.0)  # Rate limit delay
```

### Error Handling

Handle errors gracefully:

```python
async def _fetch_single(self, url: str):
    try:
        # Fetch logic
        pass
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP error {e.response.status_code} for {url}")
        return None
    except Exception as e:
        logger.error(f"Failed to fetch {url}: {e}")
        return None
```

### User-Agent

Always use a descriptive User-Agent:

```python
headers = {
    'User-Agent': 'BiotechTerminal/1.0 (contact@bioterminal.dev)'
}
```

### Respect robots.txt

Check robots.txt before scraping:

```python
from urllib.robotparser import RobotFileParser

rp = RobotFileParser()
rp.set_url('https://example.com/robots.txt')
rp.read()

if rp.can_fetch('BiotechTerminal', url):
    # OK to scrape
    pass
```

## Testing

### Unit Tests

Create tests in `bt_platform/scrapers/tests/`:

```python
import pytest
from bt_platform.scrapers.sites.my_scraper import MyCustomScraper

@pytest.mark.asyncio
async def test_discover():
    scraper = MyCustomScraper()
    urls = await scraper.discover(limit=5)
    assert len(urls) <= 5

@pytest.mark.asyncio
async def test_parse():
    scraper = MyCustomScraper()
    raw = {'html': '<html>...</html>', 'url': 'https://example.com'}
    parsed = await scraper.parse(raw)
    assert 'title' in parsed
```

### Fixture Testing

Save fixtures for offline testing:

```bash
poetry run python -m bt_platform.cli.scrape --source my_scraper --save-fixture --limit 10
```

Fixtures are saved to `bt_platform/scrapers/tests/fixtures/`.

## Integration with Catalyst Scoring

Once scraped, data can be integrated with the catalyst scoring system:

1. **Parse catalysts** from scraped content
2. **Score using existing algorithm** (event_leverage, timing_clarity, etc.)
3. **Publish to WebSocket** for real-time updates
4. **Store in database** for backtesting

Example:

```python
from bt_platform.events.catalyst_events import publish_catalyst_event

# After scraping and parsing
catalyst_data = {
    'title': 'FDA approval expected',
    'company': 'VRTX',
    'date': '2024-03-15',
    'event_leverage': 4,
    'timing_clarity': 3,
    # ...
}

# Publish event
await publish_catalyst_event(catalyst_data)
```

## Support

- See [EXTENSIBILITY_FRAMEWORK.md](../docs/EXTENSIBILITY_FRAMEWORK.md) for comprehensive guide
- Check [Scraper README](../bt_platform/scrapers/README.md) for detailed scraper docs
- Review [examples/scraper_extensibility_example.py](../examples/scraper_extensibility_example.py)

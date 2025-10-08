# Scrapers Guide

Complete guide to the Biotech Terminal scraper framework.

## Overview

The scraper framework provides a plugin-based system for collecting biotech/pharma intelligence from public sources. All scrapers follow a strict pipeline: **discover → fetch → parse → normalize → link → upsert**.

## Quick Start

### Run a scraper

```bash
# Scrape FierceBiotech (last 7 days, max 20 articles)
python -m platform.cli.scrape --source fierce --since 7d --limit 20

# Scrape FDA with fixtures for testing
python -m platform.cli.scrape --source fda --save-fixture --limit 10

# Dry run without database writes
python -m platform.cli.scrape --source businesswire --dry-run

# Scrape specific URL
python -m platform.cli.scrape --source fierce --url https://www.fiercebiotech.com/biotech/...
```

### Available sources

**News/Press:**
- `fierce` / `fiercebiotech` / `fiercepharma` - FierceBiotech/FiercePharma
- `businesswire` - Business Wire press releases
- `globenewswire` - GlobeNewswire press releases
- `prnewswire` - PR Newswire press releases

**Regulators:**
- `fda` - FDA news and approvals
- `ema` - EMA (European Medicines Agency)
- `mhra` - MHRA (UK)

**Registries:**
- `clinicaltrials` - ClinicalTrials.gov

**Exchanges:**
- `edgar` - SEC EDGAR filings

**Company Sites:**
- `company:<slug>` - Company-specific IR pages (coming soon)

## Architecture

### Scraper Interface

All scrapers implement `ScraperInterface` with these methods:

```python
async def discover(method, since, limit, **kwargs) -> List[str]:
    """Discover URLs to scrape (RSS, sitemap, archive)"""
    
async def fetch(urls, batch_size) -> List[Dict]:
    """Fetch content with rate limiting"""
    
async def parse(raw_content) -> Dict:
    """Parse HTML/JSON into structured data"""
    
async def normalize(parsed_data) -> ScraperResult:
    """Normalize to standard models (Article, Catalyst, etc.)"""
    
async def link(result) -> ScraperResult:
    """Link to companies, diseases, catalysts"""
    
async def upsert(result, dry_run) -> bool:
    """Insert/update in database"""
```

### Registry System

Scrapers are configured in `platform/scrapers/registry.yaml`:

```yaml
scrapers:
  news_press:
    - source_key: fierce_biotech
      name: FierceBiotech
      base_url: https://www.fiercebiotech.com
      enabled: true
      rate_limit:
        max_rps: 0.5  # 1 request per 2 seconds
        max_concurrent: 2
      discovery:
        has_rss: true
        rss_url: https://www.fiercebiotech.com/rss/xml
      robots:
        respect: true
        user_agent: "BiotechTerminal/1.0 (contact@bioterminal.dev)"
```

## Performance Features

### HTTP/2 with Connection Pooling

Uses `httpx.AsyncClient` with:
- HTTP/2 multiplexing
- Connection pooling (max 100 connections, 20 keep-alive)
- gzip/brotli compression
- Automatic redirects

### Rate Limiting

Token bucket algorithm with:
- Per-host rate limits (configurable in registry)
- Burst capacity
- Jitter (10%) to avoid thundering herd
- Automatic backoff

### Conditional Requests

Caches ETag and Last-Modified headers:
- Sends `If-None-Match` with ETags
- Sends `If-Modified-Since` for date-based caching
- Link validation cache (7 days)

### Content Deduplication

**Exact duplicates:**
- SHA-256 hash of content
- URL canonicalization (removes tracking params)

**Near-duplicates:**
- SimHash fingerprinting (64-bit)
- Hamming distance threshold (default: 3)

**Press release clustering:**
- MinHash LSH for fast similarity search
- Jaccard similarity threshold (default: 0.8)
- Groups reprints across BusinessWire/PRNewswire/GlobeNewswire

## Content Processing

### Structured Data Extraction

Priority order:
1. **JSON-LD** - Schema.org structured data
2. **OpenGraph** - Facebook/social metadata
3. **Microdata** - HTML microdata
4. **Standard meta tags** - Fallback

### HTML Parsing

Uses `selectolax` for fast parsing:
- Pre-compiled selectors (where possible)
- Automatic boilerplate removal (scripts, styles, navs)
- Content extraction with CSS selectors

### Text Processing

**Entity resolution:**
- Company dictionary (from database)
- Disease dictionary (ICD-10 + aliases)
- Ticker symbol matching

**Domain tagging:**
- Keyword lexicons (regulatory/clinical/M&A)
- Simple logistic regression classifier

**Summarization:**
- Extractive (TextRank) - no LLM costs

## Fixtures & Testing

### Save Fixtures

```bash
python -m platform.cli.scrape --source fierce --save-fixture --limit 5
```

Saves to `tmp/fixtures/<source>/YYYYMMDD/<hash>.json`:
```json
{
  "url": "https://...",
  "raw_html": "<!DOCTYPE html>...",
  "parsed": {
    "title": "...",
    "published_at": "..."
  },
  "normalized": {
    "content_type": "article",
    "data": {...}
  },
  "scraped_at": "2024-01-15T12:00:00Z"
}
```

### Run Tests with Fixtures

```bash
# Run all scraper tests (uses fixtures, no network)
pytest -k scraper

# Run specific scraper tests
pytest platform/scrapers/tests/test_fierce_scraper.py
```

## Adding a New Scraper

### 1. Add to Registry

Edit `platform/scrapers/registry.yaml`:

```yaml
scrapers:
  news_press:
    - source_key: my_source
      name: My Source
      base_url: https://mysource.com
      enabled: true
      rate_limit:
        max_rps: 1.0
        max_concurrent: 2
      discovery:
        has_rss: true
        rss_url: https://mysource.com/rss
      robots:
        respect: true
```

### 2. Create Scraper Class

```python
# platform/scrapers/sites/my_scraper.py
from platform.scrapers.base.interface import ScraperInterface, ScraperResult
from platform.scrapers.sites.press_release_scraper import PressReleaseScraper

class MySourceScraper(PressReleaseScraper):
    """My Source scraper"""
    
    def __init__(self, config=None):
        config = config or {}
        config.setdefault('base_url', 'https://mysource.com')
        config.setdefault('source_key', 'my_source')
        super().__init__(config)
```

### 3. Add to CLI

Edit `platform/cli/scrape.py`:

```python
from platform.scrapers.sites.my_scraper import MySourceScraper

SCRAPER_MAP = {
    # ...
    'mysource': MySourceScraper,
}
```

### 4. Create Tests

```python
# platform/scrapers/tests/test_my_scraper.py
import pytest
from platform.scrapers.sites.my_scraper import MySourceScraper

@pytest.mark.asyncio
async def test_my_scraper_discover():
    scraper = MySourceScraper()
    urls = await scraper.discover(limit=5)
    assert len(urls) > 0
```

## Best Practices

### Respect robots.txt

```python
# Check robots.txt before scraping
import urllib.robotparser

rp = urllib.robotparser.RobotFileParser()
rp.set_url("https://example.com/robots.txt")
rp.read()

can_fetch = rp.can_fetch("BiotechTerminal/1.0", url)
```

### Rate Limiting

- Default: 1 req/second
- News sites: 0.5 req/s (1 req per 2 seconds)
- Government sites: 1 req/s
- SEC EDGAR: 0.1 req/s (very strict)

### Error Handling

```python
try:
    response = await self.http_client.get(url)
except httpx.HTTPStatusError as e:
    if e.response.status_code == 429:
        # Rate limited - back off
        await asyncio.sleep(60)
    elif e.response.status_code >= 500:
        # Server error - retry
        await asyncio.sleep(5)
except httpx.RequestError as e:
    # Network error - log and continue
    logger.error(f"Request failed: {e}")
```

## Observability

### Structured Logging

Logs include:
- `source` - Source key
- `qps` - Queries per second
- `bytes` - Bytes transferred
- `cache_hit` - Cache hit rate
- `http_status` - Status codes

### Metrics

Track:
- Throughput (items/minute)
- Dedupe rate (%)
- Median parse time (ms)
- Last refresh timestamp
- Error rate (%)

## Manual Refresh Model

**No background jobs or schedulers.**

Scrapers run only when:
1. User clicks "Refresh" in UI
2. CLI command executed manually
3. API endpoint called: `POST /api/v1/admin/ingest`

This ensures:
- Predictable resource usage
- No surprise costs
- Full control over scraping
- Easy debugging

## See Also

- [REFRESH_MODEL.md](./REFRESH_MODEL.md) - Manual refresh philosophy
- [SOURCE_PACKS.md](./SOURCE_PACKS.md) - Creating source templates
- [API.md](./API.md) - Admin API endpoints

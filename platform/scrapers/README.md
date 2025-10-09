# Biotech Terminal - Scraper Framework

A comprehensive, production-ready scraper framework for biotech and pharmaceutical intelligence.

## Features

✅ **Plugin Architecture** - Strict interface (discover → fetch → parse → normalize → link → upsert)  
✅ **High Performance** - HTTP/2, connection pooling, async I/O  
✅ **Rate Limiting** - Token bucket with per-host limits and jitter  
✅ **Deduplication** - SimHash fingerprinting, MinHash LSH clustering  
✅ **Offline Testing** - Fixture system with golden snapshots  
✅ **Manual Refresh** - No background jobs, full control  
✅ **Observability** - Structured logs, metrics, stats API  
✅ **Legal Compliance** - robots.txt, User-Agent, TOS review checklist  

## Quick Start

### Prerequisites

```bash
# Install Poetry (if not already installed)
curl -sSL https://install.python-poetry.org | python3 -

# Or use pip
pip install httpx[http2,brotli] pyyaml selectolax feedparser python-dateutil \
    orjson simhash datasketch beautifulsoup4 lxml
```

### Install Dependencies

```bash
# Using Poetry
poetry install

# Or using pip
pip install -r requirements.txt
```

### Run a Scraper

```bash
# Scrape FierceBiotech (last 7 days, max 20 articles)
python -m platform.cli.scrape --source fierce --since 7d --limit 20

# Scrape FDA with fixtures for testing
python -m platform.cli.scrape --source fda --save-fixture --limit 10

# Dry run (no database writes)
python -m platform.cli.scrape --source businesswire --dry-run

# Scrape specific URL
python -m platform.cli.scrape --source fierce --url https://www.fiercebiotech.com/...
```

### Using Make

```bash
# Individual sources
make scrape-fierce
make scrape-fda
make scrape-businesswire

# All news sources
make scrape-all

# Generate test fixtures
make scrape-fixtures

# Scrape specific URL
make scrape-url URL=https://...
```

### Using the Script

```bash
# Full control with bash script
./scripts/scrape.sh --source fierce --since 7d --limit 50
./scripts/scrape.sh --source fda --save-fixture --dry-run
./scripts/scrape.sh --help  # See all options
```

## Available Sources

### News & Press
- **fierce** / **fiercebiotech** / **fiercepharma** - FierceBiotech/FiercePharma  
- **businesswire** - Business Wire press releases  
- **globenewswire** - GlobeNewswire press releases  
- **prnewswire** - PR Newswire press releases  

### Regulators
- **fda** - FDA news and approvals  
- **ema** - EMA (European Medicines Agency)  
- **mhra** - MHRA (UK)  

### Registries
- **clinicaltrials** - ClinicalTrials.gov  

### Exchanges
- **edgar** - SEC EDGAR filings  

### Company Sites
- **company:<slug>** - Company-specific IR pages (coming soon)  

## Architecture

### Scraper Pipeline

```
discover()  → Find URLs (RSS, sitemap, archive)
    ↓
fetch()     → Retrieve HTML with rate limiting
    ↓
parse()     → Extract structured data (JSON-LD, OpenGraph)
    ↓
normalize() → Map to standard models (Article, Catalyst, etc.)
    ↓
link()      → Link to companies, diseases, catalysts
    ↓
upsert()    → Insert/update in database
```

### Directory Structure

```
platform/
├── scrapers/
│   ├── base/
│   │   ├── interface.py         # ScraperInterface base class
│   │   └── registry.py          # Registry loader
│   ├── sites/
│   │   ├── fierce_scraper.py    # FierceBiotech/Pharma
│   │   ├── press_release_scraper.py  # BusinessWire, etc.
│   │   ├── regulator_scraper.py      # FDA, EMA, MHRA
│   │   ├── clinical_trials_scraper.py
│   │   └── edgar_scraper.py
│   ├── utils/
│   │   ├── http_client.py       # AsyncHTTPClient
│   │   ├── rate_limiter.py      # TokenBucketRateLimiter
│   │   ├── deduplication.py     # SimHash, MinHash LSH
│   │   └── parsing.py           # HTML/JSON-LD extraction
│   ├── tests/
│   │   └── test_base.py
│   └── registry.yaml            # Source configurations
├── cli/
│   └── scrape.py                # CLI harness
└── core/
    └── endpoints/
        └── admin.py             # Admin API endpoints
```

## API Endpoints

### Manual Ingest

```bash
POST /api/v1/admin/ingest

{
  "sources": ["fierce", "fda"],
  "since": "7d",
  "limit": 50
}

Response:
{
  "sources": ["fierce", "fda"],
  "started_at": "2024-01-15T12:00:00Z",
  "completed_at": "2024-01-15T12:05:00Z",
  "duration_seconds": 300,
  "records_processed": 75,
  "records_inserted": 45,
  "records_updated": 30,
  "by_source": {
    "fierce": {
      "processed": 50,
      "inserted": 30,
      "updated": 20
    },
    "fda": {
      "processed": 25,
      "inserted": 15,
      "updated": 10
    }
  },
  "errors": []
}
```

### Preview Scraper

```bash
GET /api/v1/admin/scrape/preview?source=fierce&url=https://...

Response:
{
  "normalized": {
    "content_type": "article",
    "data": {
      "title": "...",
      "url": "...",
      "summary": "...",
      "tags": ["clinical", "regulatory"]
    },
    "companies": ["Pfizer", "Moderna"],
    "diseases": ["COVID-19"]
  },
  "fixture_path": "tmp/fixtures/fierce_biotech/20240115/abc123.json",
  "hash": "...",
  "fingerprint": "..."
}
```

### Scraper Stats

```bash
GET /api/v1/admin/scrape/stats

Response:
{
  "last_refresh": {
    "fierce_biotech": "2024-01-15T12:00:00Z",
    "fda": "2024-01-14T09:00:00Z"
  },
  "source_counts": {
    "fierce_biotech": 1250,
    "fda": 340
  },
  "throughput": {
    "fierce_biotech": 15.2,  // items/minute
    "fda": 8.5
  },
  "dedupe_rate": {
    "fierce_biotech": 0.12,  // 12% duplicates
    "fda": 0.05
  },
  "total_articles": 3500,
  "available_sources": ["fierce", "fda", ...]
}
```

## Configuration

### Registry (registry.yaml)

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
        has_archive: true
        archive_url: https://www.fiercebiotech.com/biotech
      robots:
        respect: true
        user_agent: "BiotechTerminal/1.0 (contact@bioterminal.dev)"
      extra:
        timezone: "America/New_York"
```

## Testing

### Run Tests

```bash
# All scraper tests
pytest -k scraper

# Specific test file
pytest platform/scrapers/tests/test_base.py

# With coverage
pytest --cov=platform.scrapers platform/scrapers/tests/
```

### Generate Fixtures

```bash
# Save fixtures for offline testing
python -m platform.cli.scrape --source fierce --save-fixture --limit 5

# Fixtures saved to: tmp/fixtures/<source>/YYYYMMDD/<hash>.json
```

### Fixture Format

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

## Performance

### HTTP/2 Benefits
- Multiplexing (multiple requests over one connection)
- Header compression
- Server push (if supported)
- Reduced latency

### Rate Limiting
- Token bucket algorithm
- Per-host limits
- Jitter (10%) to avoid thundering herd
- Automatic backoff on 429

### Deduplication
- **Exact**: SHA-256 hash + URL canonicalization
- **Near**: SimHash (64-bit) with Hamming distance ≤ 3
- **Clustering**: MinHash LSH for press release reprints

### Caching
- ETag caching (304 Not Modified)
- Last-Modified caching
- Link validation cache (7 days)

## Manual Refresh Model

**No background jobs or schedulers.** Scrapers run only when:

1. User clicks "Refresh" in UI
2. CLI command executed manually
3. API endpoint called: `POST /api/v1/admin/ingest`

Benefits:
- Predictable resource usage
- Full control over scraping
- Easy debugging
- No surprise costs

## Legal & Compliance

### robots.txt
All scrapers check and respect `robots.txt`.

### User-Agent
Descriptive User-Agent with contact email:
```
BiotechTerminal/1.0 (contact@bioterminal.dev)
```

### TOS Review
Each source has a compliance checklist in `COMPLIANCE.md`.

### Rate Limiting
Conservative defaults (0.5-2 req/s) to avoid server load.

### Content Usage
- Metadata only (no full-text copying)
- Links back to original source
- No paywalled content

## Adding New Sources

See [docs/SOURCE_PACKS.md](./docs/SOURCE_PACKS.md) for detailed guide.

Quick steps:
1. Add to `registry.yaml`
2. Create scraper class (extend `ScraperInterface`)
3. Add to CLI mapping
4. Create tests
5. Generate fixtures
6. Review compliance

## Documentation

- **[SCRAPERS_GUIDE.md](./docs/SCRAPERS_GUIDE.md)** - Complete scraper documentation
- **[REFRESH_MODEL.md](./docs/REFRESH_MODEL.md)** - Manual refresh philosophy
- **[SOURCE_PACKS.md](./docs/SOURCE_PACKS.md)** - Creating new scrapers

## Monitoring

### Structured Logs

```json
{
  "timestamp": "2024-01-15T12:00:00Z",
  "source": "fierce_biotech",
  "action": "fetch",
  "urls_fetched": 25,
  "bytes_transferred": 1048576,
  "http_statuses": {"200": 23, "304": 2},
  "duration_ms": 8500,
  "qps": 0.5,
  "cache_hit_rate": 0.08
}
```

### Metrics
- Throughput (items/minute)
- Dedupe rate (%)
- Median parse time (ms)
- Last refresh timestamp
- Error rate (%)

## Troubleshooting

### "No URLs discovered"
- Check RSS/sitemap URL
- Verify site structure
- Try wider time window: `--since 30d`

### "Rate limited"
- Reduce `max_rps` in registry
- Increase delay between batches
- Check source's robots.txt

### "Parse errors"
- Inspect HTML with DevTools
- Update selectors
- Check for JS-rendered content

### "Duplicate articles"
- Content fingerprinting working correctly
- Check URL canonicalization
- Review `hash` field

## License

MIT License - See LICENSE file for details

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests
4. Submit a pull request

## Support

- **Issues**: https://github.com/your-repo/issues
- **Email**: contact@bioterminal.dev
- **Docs**: ./docs/

---

**Built with ❤️ for the biotech community**

# Refresh Model

## Philosophy: Manual Refresh Only

The Biotech Terminal uses a **manual-refresh-only model** with zero background jobs.

## Why Manual Refresh?

### Predictability
- **Resource usage**: No surprise CPU/memory spikes
- **Network traffic**: Only when you explicitly trigger it
- **Database load**: Controlled, not continuous

### Control
- **When to refresh**: You decide the timing
- **What to refresh**: Select specific sources
- **How much to refresh**: Set limits per run

### Cost Efficiency
- **No background workers**: Simpler deployment
- **No scheduler overhead**: One less moving part
- **Pay only for what you use**: No idle scraping

### Debugging
- **Reproducible**: Same command, same result
- **Traceable**: Clear audit trail of refreshes
- **Testable**: Easy to verify with fixtures

## How It Works

### 1. CLI Commands

```bash
# Manual refresh via CLI
python -m platform.cli.scrape --source fierce --since 7d --limit 20

# Dry run to preview
python -m platform.cli.scrape --source fda --dry-run

# Save fixtures for testing
python -m platform.cli.scrape --source businesswire --save-fixture
```

### 2. UI Button

Terminal app includes a refresh button in the top bar:
```
[Refresh ↻] → Selector dropdown → POST /api/v1/admin/ingest
```

User selects:
- Source(s) to refresh
- Time window (last 24h, 7d, 30d)
- Limit (optional)

### 3. API Endpoint

```bash
# Trigger refresh via API
curl -X POST http://localhost:8000/api/v1/admin/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "sources": ["fierce", "fda"],
    "since": "7d",
    "limit": 50
  }'
```

## Refresh Workflow

```
User Action → API/CLI → Scraper Pipeline → Database → UI Update
     ↓
  Manual trigger (button/command)
     ↓
  discover() → fetch() → parse() → normalize() → link() → upsert()
     ↓
  Articles, Catalysts, etc. in database
     ↓
  UI shows "Last refreshed: 2 minutes ago"
```

## Incremental Crawling

### Last Seen Tracking

Each source tracks `last_seen` timestamp:

```python
# Database table: scraper_metadata
{
  "source_key": "fierce_biotech",
  "last_seen": "2024-01-15T12:00:00Z",
  "last_url": "https://...",
  "items_count": 156
}
```

### Smart Discovery

```python
# Only fetch new content
since = get_last_seen('fierce_biotech') or datetime.utcnow() - timedelta(days=30)
urls = await scraper.discover(since=since)
```

## Deduplication

### Content Fingerprinting

Prevents duplicate articles from being stored:

```python
# Check if article exists
existing = db.query(Article).filter_by(hash=content_hash).first()
if existing:
    # Update metadata only
    existing.ingested_at = datetime.utcnow()
else:
    # Create new article
    db.add(Article(...))
```

### Near-Duplicate Detection

Groups press release reprints:

```python
# MinHash LSH clustering
deduplicator = MinHashDeduplicator(threshold=0.8)
clusters = deduplicator.get_clusters()

# Show as "3 versions of this press release"
for cluster in clusters:
    primary = cluster[0]
    variants = cluster[1:]
    # UI shows primary with "Also on: BusinessWire, PRNewswire"
```

## Diff Detection

### Change Tracking

After each refresh, calculate diffs:

```python
# Before refresh
before_count = db.query(Article).filter(Article.source == 'fierce').count()
before_ids = set(db.query(Article.id).filter(Article.source == 'fierce').all())

# After refresh
after_count = db.query(Article).filter(Article.source == 'fierce').count()
after_ids = set(db.query(Article.id).filter(Article.source == 'fierce').all())

# Diff
new_ids = after_ids - before_ids
updated_ids = before_ids & after_ids  # Check for modifications

diff = {
    "added": len(new_ids),
    "updated": len(updated_ids),
    "total": after_count
}
```

### UI Diff Ribbon

Terminal shows diff after refresh:

```
✅ Refresh complete (2 minutes ago)
   📰 FierceBiotech: +12 new, 3 updated
   🏛️  FDA: +2 new, 0 updated
   
   [View Changes →]
```

## Refresh Frequency Recommendations

### Daily Sources
- News sites (Fierce, BusinessWire, etc.)
- FDA/EMA announcements
- Company IR pages

**Suggested:** Once per day or on-demand

### Weekly Sources
- ClinicalTrials.gov updates
- SEC EDGAR filings
- Scientific publications

**Suggested:** Once per week or on-demand

### On-Demand Only
- Specific URL scraping
- Historical archive fetching
- Fixture generation for testing

## Advanced: Scheduled Refreshes (Optional)

While the default is manual-only, you can add scheduled refreshes using system cron:

```bash
# crontab -e
# Refresh news sources daily at 9 AM
0 9 * * * cd /path/to/terminal && python -m platform.cli.scrape --source fierce --since 1d >> /var/log/scraper.log 2>&1
```

**Important:** This is opt-in and not part of the default deployment.

## API Preview Endpoint

Preview scraper output before ingesting:

```bash
GET /api/v1/admin/scrape/preview?source=fierce&url=https://...
```

Response:
```json
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
  "fixture_path": "tmp/fixtures/fierce_biotech/20240115/abc123.json"
}
```

Use this to:
- Verify scraper output
- Debug parsing issues
- Test entity linking

## Observability

### Metrics Dashboard

Track refresh activity:

```
GET /api/v1/admin/scrape/stats

{
  "last_refresh": {
    "fierce_biotech": "2024-01-15T12:00:00Z",
    "fda": "2024-01-14T09:00:00Z"
  },
  "throughput": {
    "fierce_biotech": 15.2,  // items/minute
    "fda": 8.5
  },
  "dedupe_rate": {
    "fierce_biotech": 0.12,  // 12% duplicates
    "fda": 0.05
  },
  "median_parse_time": {
    "fierce_biotech": 245,  // ms
    "fda": 189
  }
}
```

### Structured Logs

Every scrape operation logs:

```json
{
  "timestamp": "2024-01-15T12:00:00Z",
  "source": "fierce_biotech",
  "action": "discover",
  "urls_found": 25,
  "qps": 0.5,
  "cache_hit_rate": 0.15
}
```

```json
{
  "timestamp": "2024-01-15T12:01:00Z",
  "source": "fierce_biotech",
  "action": "fetch",
  "urls_fetched": 25,
  "bytes_transferred": 1048576,
  "http_statuses": {"200": 23, "304": 2},
  "duration_ms": 8500
}
```

## Best Practices

### 1. Regular Manual Refreshes
Set a routine (morning, afternoon) to click refresh.

### 2. Use Limits
Don't fetch everything at once:
```bash
--limit 50  # Reasonable batch size
```

### 3. Check Diffs
Review what changed before accepting into the UI.

### 4. Save Fixtures
For new sources, save fixtures first:
```bash
--save-fixture --limit 10  # Generate test data
```

### 5. Monitor Metrics
Keep an eye on dedupe rate and parse times.

## Troubleshooting

### "No new articles found"
- Check `last_seen` timestamp
- Verify source is publishing new content
- Try wider time window: `--since 30d`

### "Rate limited"
- Reduce `max_rps` in registry.yaml
- Increase delay between batches
- Check source's robots.txt

### "Duplicate articles"
- Content fingerprinting working correctly
- Check if URL canonicalization is enabled
- Review `hash` field in database

### "Entity linking not working"
- Verify company/disease dictionaries are populated
- Check entity resolution logic
- Use `--save-fixture` to debug parsed data

## See Also

- [SCRAPERS_GUIDE.md](./SCRAPERS_GUIDE.md) - Complete scraper documentation
- [SOURCE_PACKS.md](./SOURCE_PACKS.md) - Creating new scrapers
- [API.md](./API.md) - Admin API reference

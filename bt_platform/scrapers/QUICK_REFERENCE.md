# Next-Gen Ingestion - Quick Reference

Quick reference for the next-generation news acquisition system.

## 🎯 Core Concepts

### Dual Refresh Modes

| Mode | Timeout | Sources | Use Case |
|------|---------|---------|----------|
| **Quick** | ≤10s | High-priority only | Routine checks |
| **Deep** | ≤60s | All sources | Comprehensive analysis |

### Priority Levels

1. **CRITICAL** - FDA approvals, regulatory updates (priority: 0)
2. **IR_PAGE** - Company investor relations (priority: 1)
3. **REGULATOR** - FDA, EMA, MHRA news (priority: 2)
4. **PRESS_RELEASE** - Business Wire, PR Newswire (priority: 3)
5. **NEWS_TIER1** - FierceBiotech, Endpoints (priority: 4)
6. **NEWS_TIER2** - BioSpace, Science Daily (priority: 5)
7. **ARCHIVE** - Historical backfill (priority: 6)

### Discovery Methods

1. **RSS/Atom** - Fastest, most efficient
2. **Sitemap** - Good for archive discovery
3. **HTML** - Fallback when no feeds
4. **Headless** - Only when absolutely necessary

## 📚 Common Commands

### CLI Usage

```bash
# Quick refresh (≤10s)
python -m bt_platform.cli.nextgen_ingest quick --since 7d

# Deep refresh (≤60s) with verbose output
python -m bt_platform.cli.nextgen_ingest deep --since 24h -v

# Import price CSV
python -m bt_platform.cli.nextgen_ingest import prices.csv --ticker BLUE --save

# Check parser health
python -m bt_platform.cli.nextgen_ingest health
```

### Time Filters

- `7d` - Last 7 days
- `24h` - Last 24 hours
- `2w` - Last 2 weeks
- `30d` - Last 30 days

## 🐍 Python API

### Priority Queue

```python
from bt_platform.scrapers.utils import PriorityQueue, Priority

queue = PriorityQueue()

# Auto-detect priority from source
queue.add('https://www.fda.gov/news', 'fda')

# Explicit priority
queue.add('https://example.com', 'source', Priority.IR_PAGE)

# Process queue
item = await queue.get_next()
```

### Refresh Manager

```python
from bt_platform.scrapers.utils import RefreshManager

manager = RefreshManager()

sources = {
    'fda': 'https://www.fda.gov',
    'fierce': 'https://www.fiercebiotech.com',
}

# Quick mode
results = await manager.quick_refresh(sources)

# Deep mode
results = await manager.deep_refresh(sources)

# Stats
stats = manager.get_stats()
```

### PDF Intelligence

```python
from bt_platform.scrapers.utils import PDFIntelligence

intelligence = PDFIntelligence()
data = intelligence.extract_from_text(pdf_text)

# Access extracted data
print(data.trial_ids)      # ['NCT12345678', ...]
print(data.phases)         # ['Phase II', ...]
print(data.endpoints)      # ['Overall Survival', ...]
print(data.success_rate)   # 85.7
```

### CSV Drop-Zone

```python
from bt_platform.scrapers.utils import CSVDropZone

drop_zone = CSVDropZone()

# Parse CSV file
records = drop_zone.parse_csv_file(Path('prices.csv'))

# Parse CSV string
records = drop_zone.parse_csv(csv_content, ticker='BLUE')

# Save snapshot
snapshot_path = drop_zone.save_snapshot(records)
```

### Self-Healing Parser

```python
from bt_platform.scrapers.utils import SelfHealingParser

parser = SelfHealingParser()

# Register custom selectors
parser.register_selectors('source_key', {
    'title': 'h1.title',
    'content': 'div.content',
})

# Parse with automatic fallback
result = await parser.parse(html, source_key='source_key')

# Check health
dashboard = parser.get_health_dashboard()
```

## 📊 Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Quick refresh | ≤10s | 20 high-priority sources |
| Deep refresh | ≤60s | All sources |
| Delta fetching | 70-90% | Cache efficiency |
| PDF extraction | ≥70% | Field success rate |
| Duplicate reduction | ≥60% | Via SimHash/MinHash |
| Parser success | ≥80% | Per-source threshold |

## 🔒 Compliance

### robots.txt
- ✅ Automatic parsing
- ✅ Respect crawl-delay
- ✅ User-Agent identification

### Rate Limiting
- ✅ 0.5-2 req/s per domain
- ✅ Token bucket algorithm
- ✅ Exponential backoff

### Data Storage
- ✅ ≤250 char summaries
- ✅ Source URL tracking
- ✅ Timestamp recording
- ✅ No redistribution

## 🐛 Troubleshooting

### Slow Performance

**Quick refresh > 10s?**
- Check network connectivity
- Reduce number of sources
- Increase cache usage

**Deep refresh > 60s?**
- Reduce time window (--since)
- Check source availability
- Review rate limits

### Parser Issues

**Low success rate?**
```bash
python -m bt_platform.cli.nextgen_ingest health
```
Review failure reasons and update selectors.

**Structured data not found?**
- Check if site has JSON-LD
- Verify OpenGraph tags
- Fallback will use readability

### CSV Import

**Parse errors?**
- Verify CSV format
- Check date column exists
- Ensure proper delimiter

**Validation fails?**
- Check OHLC relationships
- Look for duplicate dates
- Verify ticker symbols

## 🔧 Configuration

### Custom Rate Limits

```python
queue = PriorityQueue()
queue.set_domain_rate_limit('example.com', 0.5)  # 0.5 req/s
```

### Custom Selectors

```python
parser = SelfHealingParser()
parser.register_selectors('source', {
    'title': 'h1.article-title',
    'content': 'article.body',
    'date': 'time.published',
})
```

### Storage Path

```python
drop_zone = CSVDropZone(storage_path=Path('/data/price_imports'))
```

## 📁 File Locations

```
bt_platform/
├── scrapers/
│   ├── utils/
│   │   ├── priority_queue.py      # Priority scheduling
│   │   ├── discovery.py           # RSS/sitemap discovery
│   │   ├── refresh_manager.py     # Dual refresh modes
│   │   ├── pdf_intelligence.py    # PDF extraction
│   │   ├── csv_dropzone.py        # Price import
│   │   └── self_healing_parser.py # Multi-strategy parsing
│   ├── NEXT_GEN_INGESTION.md     # Full documentation
│   └── tests/
│       └── test_nextgen.py        # Tests
└── cli/
    └── nextgen_ingest.py          # CLI tool
```

## 🎓 Examples

See `examples/nextgen_ingestion_demo.py` for comprehensive examples of all features.

## 📖 Further Reading

- **Full Documentation**: `bt_platform/scrapers/NEXT_GEN_INGESTION.md`
- **Architecture**: See "Component Overview" in main docs
- **API Reference**: See "API Usage" section in main docs
- **Testing**: `bt_platform/scrapers/tests/test_nextgen.py`

## 🆘 Getting Help

1. Check full documentation: `NEXT_GEN_INGESTION.md`
2. Review examples: `examples/nextgen_ingestion_demo.py`
3. Run demo: `python examples/nextgen_ingestion_demo.py`
4. Check tests for usage patterns: `test_nextgen.py`

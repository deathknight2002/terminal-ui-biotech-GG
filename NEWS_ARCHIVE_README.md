# Point-in-Time News Archive System

A comprehensive news aggregation system with point-in-time archival, entity extraction, price reactions, and read-through analysis for biotech intelligence.

## Features

### 1. Manual Refresh Pipeline (NO DAEMONS)

- **On-demand refresh** - Manual trigger only, no background jobs
- **Multi-source aggregation** - Fetch from configured news sources in parallel
- **Smart deduplication** - Canonical key clustering (domain::normalized_title)
- **Therapeutic area tagging** - Automatic TA detection (SMA, GLP-1, Oncology, etc.)
- **Entity extraction** - Companies, drugs, diseases, targets from text
- **Cross-source validation** - Track article coverage across sources

### 2. Point-in-Time Archive

- **Reproducibility** - All data is point-in-time snapshots
- **Audit trail** - Track fetched_at, published_at, created_at
- **Market cap snapshots** - Historical company valuations
- **ETF constituent snapshots** - Point-in-time XBI holdings
- **Canonical keys** - Deduplication across sources

### 3. Price Reaction Engine

- **Event study methodology** - Calculate abnormal returns vs benchmarks
- **Multiple time windows** - Intraday ([0,+60m]) and daily ([-1d,+1d])
- **XBI benchmark** - Compare to biotech sector ETF
- **Statistical significance** - P-value calculations
- **Recompute on demand** - Recalculate with different parameters

### 4. Entity Graph & Read-Through

- **Entity relationships** - Companies, drugs, diseases, targets, ETFs
- **Competitor detection** - Automatic read-through suggestions
- **Exposure weights** - Direct (1.0), Competitor (0.6), ETF (constituent weight)
- **Role-based linking** - primary, mentioned, competitor, etf

## API Endpoints

### Manual Refresh

```bash
GET /api/v1/news/refresh-now?max_articles=50
```

**Response:**
```json
{
  "success": true,
  "message": "News refresh completed",
  "stats": {
    "success": true,
    "total_fetched": 100,
    "unique_articles": 75,
    "new_articles": 45,
    "updated_articles": 30,
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### Get Article Exposures

```bash
GET /api/v1/news/{article_id}/exposures
```

**Response:**
```json
{
  "article_id": 123,
  "article_title": "Scholar Rock Announces Positive SMA Results",
  "published_at": "2024-01-15T09:00:00Z",
  "exposures": {
    "direct": [
      {
        "entity_id": 1,
        "name": "Scholar Rock",
        "ticker": "SRRK",
        "role": "primary",
        "weight": 1.0,
        "confidence": 0.95
      }
    ],
    "competitor": [
      {
        "entity_id": 2,
        "name": "Ionis Pharmaceuticals",
        "ticker": "IONS",
        "weight": 0.6,
        "rationale": "Same indication (SMA), different mechanism"
      }
    ],
    "etf": [
      {
        "entity_id": 10,
        "name": "SPDR S&P Biotech ETF",
        "ticker": "XBI",
        "weight": 0.015
      }
    ]
  }
}
```

### Get Price Reactions

```bash
GET /api/v1/news/{article_id}/reactions
```

**Response:**
```json
{
  "article_id": 123,
  "reactions": [
    {
      "entity_ticker": "SRRK",
      "window": "[-1d,+1d]",
      "raw_return": 0.124,
      "abnormal_return": 0.101,
      "benchmark_ticker": "XBI",
      "p_value": 0.01,
      "event_time": "2024-01-15T09:00:00Z"
    },
    {
      "entity_ticker": "SRRK",
      "window": "[0,+60m]",
      "raw_return": 0.087,
      "abnormal_return": 0.082,
      "benchmark_ticker": "XBI",
      "p_value": 0.05,
      "event_time": "2024-01-15T09:00:00Z"
    }
  ]
}
```

### Recompute Reaction

```bash
POST /api/v1/news/{article_id}/recompute-reaction?entity_id=1&window=[-5d,+5d]&benchmark_ticker=XBI
```

**Response:**
```json
{
  "success": true,
  "reaction": {
    "raw_return": 0.156,
    "benchmark_return": 0.045,
    "abnormal_return": 0.111,
    "p_value": 0.01,
    "window": "[-5d,+5d]",
    "entity_ticker": "SRRK",
    "benchmark_ticker": "XBI"
  }
}
```

### Get ETF Constituents

```bash
GET /api/v1/news/etf/XBI/constituents?asof=2024-01-15
```

**Response:**
```json
{
  "etf_ticker": "XBI",
  "etf_name": "SPDR S&P Biotech ETF",
  "asof_date": "2024-01-15T00:00:00Z",
  "constituents": [
    {
      "entity_id": 1,
      "name": "Scholar Rock",
      "ticker": "SRRK",
      "weight": 0.015,
      "asof_date": "2024-01-15T00:00:00Z"
    }
  ],
  "count": 100
}
```

## Database Schema

### Entities

```sql
CREATE TABLE entities (
    id INTEGER PRIMARY KEY,
    kind VARCHAR(50) NOT NULL,  -- company, drug, disease, target, etf
    name VARCHAR(255) NOT NULL,
    ticker VARCHAR(10),
    exchange VARCHAR(50),
    synonyms JSON,
    attributes JSON
);
```

### Article-Entity Links

```sql
CREATE TABLE article_entities (
    article_id INTEGER NOT NULL,
    entity_id INTEGER NOT NULL,
    role VARCHAR(50) NOT NULL,  -- primary, mentioned, competitor, etf
    confidence FLOAT,
    weight FLOAT
);
```

### Article Reactions

```sql
CREATE TABLE article_reactions (
    article_id INTEGER NOT NULL,
    entity_id INTEGER NOT NULL,
    event_time TIMESTAMP NOT NULL,
    window VARCHAR(50) NOT NULL,
    raw_return FLOAT,
    benchmark_entity_id INTEGER,
    abnormal_return FLOAT,
    p_value FLOAT
);
```

## Usage Examples

### Python Service Usage

```python
from bt_platform.core.services import (
    NewsRefreshService,
    EntityExtractionService,
    PriceReactionService
)

# Initialize services
db = SessionLocal()
refresh_service = NewsRefreshService(db)
entity_service = EntityExtractionService(db)
reaction_service = PriceReactionService(db)

# Refresh news
stats = refresh_service.refresh_from_sources(sources, max_articles=50)
print(f"Fetched {stats['new_articles']} new articles")

# Extract entities from text
text = "Scholar Rock ($SRRK) announces positive Phase 3 results for SMA"
entities = entity_service.extract_all_entities(text)
print(f"Found companies: {entities['companies']}")
print(f"Found drugs: {entities['drugs']}")
print(f"Found diseases: {entities['diseases']}")

# Calculate price reaction
reaction = reaction_service.calculate_reaction(
    article_id=123,
    entity_id=1,
    event_time=datetime.now(),
    window="[-1d,+1d]",
    benchmark_ticker="XBI"
)
print(f"Abnormal return: {reaction['abnormal_return']:.2%}")
```

### Deduplication Logic

```python
# Canonical key generation
service = NewsRefreshService(db)

title1 = "FDA Approves New Drug for SMA Treatment!"
url1 = "https://source1.com/article1"

title2 = "FDA approves new drug for SMA treatment."
url2 = "https://source1.com/article2"

key1 = service.canonical_key(title1, url1)
key2 = service.canonical_key(title2, url2)

# Both normalize to: "source1.com::fda approves new drug for sma treatment"
assert key1 == key2
```

### Therapeutic Area Tagging

```python
text = "New GLP-1 agonist shows promise in obesity treatment"
tas = service.detect_therapeutic_areas(text)
# Returns: ["GLP-1", "Obesity"]

importance = service.score_importance(text)
# Returns: "Medium" (clinical development)
```

### Entity Extraction

```python
text = "Scholar Rock ($SRRK) and Ionis (NASDAQ:IONS) announce partnership"
companies = entity_service.extract_companies(text)
# Returns: [
#   {"entity_id": 1, "ticker": "SRRK", "confidence": 0.95},
#   {"entity_id": 2, "ticker": "IONS", "confidence": 0.95}
# ]
```

## Testing

Run the comprehensive test suite:

```bash
poetry run pytest tests/test_news_archive.py -v
```

**Test Coverage:**
- 19 tests passing
- Canonical key generation
- Therapeutic area detection
- Importance scoring
- Deduplication
- Entity extraction
- Price reactions

## Configuration

### Therapeutic Area Keywords

Edit `NewsRefreshService.TA_KEYWORDS` to customize:

```python
TA_KEYWORDS = {
    "SMA": ["spinal muscular atrophy", "sma", "nusinersen"],
    "GLP-1": ["glp-1", "glp1", "semaglutide", "obesity"],
    "Oncology": ["cancer", "oncology", "tumor", "carcinoma"],
    # Add more...
}
```

### Catalyst Keywords for Importance

Edit `NewsRefreshService.CATALYST_KEYWORDS`:

```python
CATALYST_KEYWORDS = {
    "Critical": ["fda approval", "pdufa", "adcom", "breakthrough"],
    "High": ["phase 3", "clinical trial", "readout", "merger"],
    # Add more...
}
```

### Known Tickers

Edit `EntityExtractionService.KNOWN_TICKERS`:

```python
KNOWN_TICKERS = {
    "SRRK": "Scholar Rock Holding Corporation",
    "IONS": "Ionis Pharmaceuticals",
    # Add more...
}
```

## Migration

Apply the schema migration:

```bash
# SQLite
sqlite3 biotech_terminal.db < bt_platform/core/migrations/002_point_in_time_news_archive.sql

# Or use SQLAlchemy
poetry run python -c "from bt_platform.core.database import init_db; import asyncio; asyncio.run(init_db())"
```

## Architecture Decisions

### 1. Manual Refresh Only

**Why:** Analyst control, no background complexity, predictable resource usage

**Trade-off:** Not real-time (acceptable for daily workflow)

### 2. Point-in-Time Snapshots

**Why:** Reproducibility, audit trail, backtest accuracy

**Trade-off:** Storage overhead (acceptable for data quality)

### 3. Canonical Key Deduplication

**Format:** `domain::normalized_title`

**Why:** Cluster near-identical articles across sources

**Example:**
- `source1.com::fda approves drug for sma`
- `source2.com::fda approves drug for sma` → Different keys (different sources)

### 4. Mock Price Data

**Current:** Hash-based mock returns

**Production:** Replace `_fetch_price_return()` with real market data API (OpenBB, Yahoo Finance, etc.)

## Future Enhancements

1. **Full-text search** - Add PostgreSQL FTS or Elasticsearch
2. **Embeddings** - Semantic search with sentence transformers
3. **NER integration** - Replace regex with spaCy/transformers
4. **Real market data** - Integrate OpenBB or vendor API
5. **UI components** - React cards with reactions, exposures, sparklines
6. **Export** - PPT/Slack/CSV export for pinned articles
7. **Analyst workflow** - Pin, annotate, mark impact

## License

MIT License - See LICENSE file for details

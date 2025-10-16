# Scraper Migration Implementation - Quick Start Guide

## Overview

The scraper migration to manual-refresh architecture is now complete with all core components implemented:

✅ **Configuration & Dictionaries**
- SCRAPER_MIGRATION_PLAN.md - Complete specifications
- SOURCES_ALLOWLIST.yaml - Legal compliance tracking
- TA_KEYWORDS.yaml - Therapeutic area classifications
- CATALYST_KEYWORDS.yaml - Catalyst types with weights
- ENTITY_SYNONYMS.csv - Company/drug/disease/target lookups
- ENTITY_GRAPH.csv - Competitor relationships

✅ **Services**
- EntityExtractionService - Dictionary-based extraction with LLM support
- ImportanceScoringService - Tradability scoring with catalyst weights
- PriceReactionService - Event study with abnormal returns
- DropZoneService - Manual CSV/HTML upload handler
- LLMPrompts - Structured prompts for article enhancement

✅ **API Endpoints**
- News refresh with entity extraction and scoring
- Price reaction calculations with multiple windows
- Read-through exposures (direct, competitor, ETF)
- Drop zone for manual uploads
- Point-in-time ETF constituent queries

---

## Quick Start

### 1. Manual News Refresh

Trigger a manual refresh of news from configured sources:

```bash
POST /api/v1/news/refresh-now?max_articles=50
```

**What happens:**
1. Scrapes from allowed sources (respects robots.txt)
2. Extracts entities using dictionaries
3. Scores importance using catalyst weights
4. Identifies read-through exposures
5. Stores with point-in-time snapshots

**Response:**
```json
{
  "success": true,
  "message": "News refresh completed",
  "stats": {
    "sources_processed": 5,
    "articles_fetched": 50,
    "articles_inserted": 45,
    "articles_updated": 5,
    "entities_extracted": 120,
    "reactions_calculated": 30
  }
}
```

### 2. Upload Price Data (Drop Zone)

When scraping is unavailable or you have proprietary data:

```bash
POST /api/v1/admin/drop-zone/price-data
Content-Type: multipart/form-data

file: price_data.csv
source: "yahoo_finance"
uploaded_by: "analyst_name"
```

**CSV Format:**
```csv
ticker,date,open,high,low,close,volume,source
VRTX,2024-01-15,420.50,425.30,418.20,423.10,1250000,yahoo_finance
IONS,2024-01-15,45.20,46.10,44.80,45.90,850000,yahoo_finance
XBI,2024-01-15,95.30,96.20,94.80,95.70,5000000,yahoo_finance
```

### 3. Upload ETF Constituents

```bash
POST /api/v1/admin/drop-zone/etf-constituents
Content-Type: multipart/form-data

file: xbi_constituents.csv
etf_ticker: "XBI"
asof_date: "2024-01-15"
source: "ssga_factsheet"
```

**CSV Format:**
```csv
etf_ticker,member_ticker,member_name,weight,asof_date,source
XBI,VRTX,Vertex Pharmaceuticals,0.0245,2024-01-15,ssga_factsheet
XBI,IONS,Ionis Pharmaceuticals,0.0198,2024-01-15,ssga_factsheet
```

### 4. Query Article with Full Intelligence

```bash
GET /api/v1/news/123
```

**Response:**
```json
{
  "id": 123,
  "title": "Vertex Announces Positive Phase 3 Data for VX-548",
  "url": "https://...",
  "source": "FierceBiotech",
  "published_at": "2024-01-15T10:30:00Z",
  "summary": "Vertex reports positive Phase 3 topline data...",
  "importance": "High",
  "relevance_score": 78,
  "catalyst_tags": ["Phase_3", "Topline"],
  "ta_tags": ["Rare_Disease"],
  "entities": [
    {
      "kind": "company",
      "name": "Vertex Pharmaceuticals",
      "ticker": "VRTX",
      "role": "primary",
      "confidence": 0.95
    },
    {
      "kind": "drug",
      "name": "VX-548",
      "role": "primary",
      "confidence": 0.9
    }
  ],
  "exposures": {
    "direct": [
      {"ticker": "VRTX", "weight": 1.0}
    ],
    "competitor": [
      {"ticker": "IONS", "weight": 0.6, "rationale": "CF competitor"}
    ],
    "etf": [
      {"ticker": "XBI", "weight": 0.0245, "rationale": "XBI constituent"}
    ]
  },
  "reactions": [
    {
      "ticker": "VRTX",
      "window": "[-1d,+1d]",
      "raw_return": 0.082,
      "benchmark_return": 0.015,
      "abnormal_return": 0.067,
      "p_value": 0.01
    }
  ]
}
```

### 5. Get Read-Through Exposures

```bash
GET /api/v1/news/123/exposures
```

**Returns:**
- **Direct exposures** - Companies explicitly mentioned (weight 1.0)
- **Competitor exposures** - Same indication/target/class (weight 0.3-0.6)
- **ETF exposures** - XBI constituent with point-in-time weight

### 6. Calculate Price Reactions

```bash
GET /api/v1/news/123/reactions
```

**Returns reactions for:**
- Intraday: [0,+60m], [0,+4h]
- Daily: [-1d,+1d], [-5d,+5d]
- Abnormal return = Raw - XBI

### 7. Recompute with Custom Window

```bash
POST /api/v1/news/123/recompute-reaction
  ?entity_id=456
  &window=[-2d,+2d]
  &benchmark_ticker=IBB
```

**Uses stored price snapshots for reproducibility.**

---

## LLM Integration (Optional)

### Article Structuring

Use the LLM prompts service to enhance articles:

```python
from bt_platform.core.services.llm_prompts import LLMPrompts

# Generate prompt
prompt = LLMPrompts.article_to_structured_record(
    title="Vertex Announces Phase 3 Data",
    summary="Positive topline results...",
    source_url="https://...",
    published_at="2024-01-15T10:30:00Z"
)

# Send to LLM (OpenAI, Anthropic, etc.)
response = llm_client.complete(prompt)

# Parse response
structured = LLMPrompts.parse_json_response(response)

# structured contains:
# - ta_tags
# - catalyst_tags
# - entities with roles and confidence
# - importance
# - summary_250
# - rationale
```

### Competitor Suggestions

```python
prompt = LLMPrompts.competitor_read_throughs(
    article_json=structured,
    portfolio_watchlist=["VRTX", "IONS", "SRPT"]
)

response = llm_client.complete(prompt)
exposures = LLMPrompts.parse_json_response(response)
```

### Importance Re-Scoring

```python
prompt = LLMPrompts.importance_rescoring(
    article_json=structured,
    cross_source_count=3,
    portfolio_relevance=True
)

response = llm_client.complete(prompt)
updated_score = LLMPrompts.parse_json_response(response)
```

---

## Data Quality Gates

All uploads and scraped articles pass through validation:

✅ **Required Fields**
- Title present (≥10 chars)
- URL valid and resolvable
- Published date sane (±2 years)

✅ **Entity Extraction**
- At least one TA tag, catalyst tag, or entity extracted

✅ **Price Reactions**
- Price snapshot present for ticker and benchmark
- Window calculation succeeds

❌ **Rejection → "Needs Review" Queue**
- Visible in UI
- Can be corrected and re-uploaded

---

## Operating Principles

### Manual Refresh Only

**No background jobs. No cron. No automated polling.**

Refresh triggered only via:
1. User clicks "Refresh Now" in UI
2. CLI command: `python -m bt_platform.cli.scrape`
3. API call: `POST /api/v1/news/refresh-now`

### Point-in-Time Snapshots

All data stamped with:
- `fetched_at` - When scraped
- `published_at` - Original publish time
- `asof_date` - For ETF constituents
- `source` - Data provenance

**Reproducibility:** Reopening any article yields same exposures and reactions.

### Lane A vs Lane B

**Lane A (Preferred):** Automated scraping where allowed
- RSS/Atom feeds
- Public newsroom pages
- Respects robots.txt

**Lane B (Fallback):** Manual analyst upload
- CSV drop zone
- HTML file upload
- When scraping disallowed or impractical

---

## Compliance & Legal

### Robots.txt Compliance

All scrapers check and respect robots.txt:
- Blocked paths → skipped (logged)
- Rate limits enforced per source
- User-Agent: `BiotechTerminal/1.0 (contact@bioterminal.dev)`

### Copyright & Fair Use

- **Store:** Title + summary (≤250 chars) + link
- **Never:** Full article text
- **Paywalled sources:** Title + URL + metadata only

### Attribution

Every article shows:
- Source name prominently
- Link back to original
- Publish timestamp

---

## Monitoring & Debugging

### Scraper Stats

```bash
GET /api/v1/admin/scrape/stats
```

**Returns:**
- Last refresh per source
- Article counts
- Throughput (items/min)
- Dedupe rate
- Error counts

### Upload History

```bash
GET /api/v1/admin/drop-zone/uploads?limit=50
```

**Returns:**
- Recent uploads
- Success/partial/error status
- Records processed/inserted/rejected

### Logs

Structured logs include:
- Source, action, timestamp
- URLs fetched, bytes transferred
- HTTP statuses, cache hits
- Parse errors, validation failures

---

## Next Steps

### Immediate (Production-Ready)

1. **Configure LLM Client** - Add OpenAI/Anthropic API key for enhanced extraction
2. **Populate Dictionaries** - Add more companies to ENTITY_SYNONYMS.csv
3. **Seed Price Data** - Upload historical OHLCV via drop zone
4. **Schedule Manual Refreshes** - Analyst workflow: 2-4x daily

### Future Enhancements

1. **Headless Browser** - For JS-rendered sites (respecting robots)
2. **Vector Search** - Find similar catalysts across articles
3. **Intraday Data** - Minute-bars if you add a legit source
4. **Alert System** - High-importance articles → Slack/email

---

## Support

**Documentation:**
- `SCRAPER_MIGRATION_PLAN.md` - Full specifications
- `DROP_ZONE_README.md` - Upload guide
- `SOURCES_ALLOWLIST.yaml` - Legal compliance

**API Docs:**
- http://localhost:8000/docs (Swagger UI)
- http://localhost:8000/redoc (ReDoc)

**Questions:**
- Check logs: `bt_platform/core/app.log`
- Review scraper registry: `bt_platform/scrapers/registry.yaml`
- Consult entity graph: `data/dictionaries/ENTITY_GRAPH.csv`

---

**Built with ❤️ for biotech intelligence**

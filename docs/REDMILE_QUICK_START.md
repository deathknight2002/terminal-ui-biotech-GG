# Redmile Catalyst System - Quick Start Guide

> **TL;DR**: Institutional-grade biotech catalyst tracking system tailored for portfolio manager workflows

## What This System Provides

### 1. **Portfolio-Centric Intelligence** 🎯
- Automatically tracks Redmile Group's public biotech holdings via 13F filings
- Filters all catalysts through portfolio lens
- Shows position sizing changes quarter-over-quarter

### 2. **Multi-Source Data Aggregation** 🕸️
Catalyst discovery from:
- ✅ FDA PDUFA dates & AdComm meetings
- ✅ ClinicalTrials.gov Phase 3 readouts
- ✅ SEC 8-K material event detection
- ✅ Conference presentations (ASCO, ASH, AHA, etc.)
- ✅ Insider transactions (Form 4 filings)

### 3. **Enhanced Scoring Algorithm** 📊
**8-dimension scoring** (0-24 scale):
1. Event Leverage (0-4) - Hard vs surrogate endpoints
2. Timing Clarity (0-3) - Fixed date vs event-driven
3. Surprise Factor (0-3) - Street mispricing potential
4. Downside Contained (0-3) - Risk mitigation factors
5. Market Depth (0-3) - Commercial opportunity size
6. **NEW:** Street Differential (0-3) - Consensus disconnect
7. **NEW:** Volatility Potential (0-2) - Expected price movement
8. **NEW:** Execution Risk (0-2) - Operational complexity

**Tier System:**
- 🚀 **Ultra-High (16-24)**: Highest conviction, asymmetric setups
- ⚡ **High-Torque (12-15)**: Strong risk/reward
- 📊 **Tradable (8-11)**: Moderate opportunities
- 👁️ **Watch (<8)**: Lower conviction

### 4. **PM-Style Calendar UI** 📅
- 30/60/90 day rolling views
- Visual encoding:
  - **Color** = Therapeutic area (Oncology red, Rare purple, Cardio blue)
  - **Size** = Market opportunity (market cap or peak sales)
  - **Border** = Tradeability score (thick = Ultra-High)
  - **Icon** = Event type (💊 FDA, 🔬 Clinical, 📋 8-K, 🎤 Conference)
- One-click drill-downs to scoring details
- Portfolio overlay highlighting

### 5. **Intelligence Features** 🧠
- **Surprise Detector**: Identifies where Street consensus is wrong
- **Historical Analogues**: Pattern matching against past catalyst outcomes
- **Competitive Landscape**: Maps competing assets and differentiation
- **Endpoint Differentiation**: Hard events > surrogate biomarkers
- **Cash Runway**: Risk assessment for catalyst timing

---

## Architecture Overview

```
Data Sources → Scrapers → Intelligence Engine → API → UI
    ↓            ↓              ↓              ↓      ↓
  13F,FDA,    Rate-limited   Scoring,      FastAPI  React
  CTGov,      connectors    Enrichment,    REST    Calendar
  SEC,8-K                   Dedup, Filter
```

**Key Technologies:**
- **Backend**: Python FastAPI, SQLAlchemy, DuckDB
- **Frontend**: React/TypeScript, Recharts, D3.js
- **Data**: PostgreSQL, Redis cache, DuckDB analytics
- **Scraping**: aiohttp, BeautifulSoup, CloudEvents bus

---

## Quick Implementation Checklist

### Phase 1: Portfolio Foundation (2 weeks)
- [ ] Build SEC 13F scraper for Redmile holdings
- [ ] Create portfolio database schema
- [ ] API endpoints for holdings & history
- [ ] Test with latest Redmile 13F filing

### Phase 2: Enhanced Scoring (2 weeks)
- [ ] Implement 8-dimension algorithm
- [ ] Add Street consensus data integration
- [ ] Update database schema for new scores
- [ ] Rescore existing 50-catalyst watchlist

### Phase 3: Data Aggregation (3 weeks)
- [ ] FDA PDUFA & AdComm scrapers
- [ ] Enhanced CTGov Phase 3 tracker
- [ ] SEC 8-K catalyst detector
- [ ] Conference calendar integration
- [ ] Insider transaction tracker

### Phase 4: PM Calendar UI (2 weeks)
- [ ] React calendar component with visual encoding
- [ ] Time horizon selector & filters
- [ ] Drill-down panels
- [ ] Portfolio overlay

### Phase 5: Intelligence (3 weeks)
- [ ] Surprise factor detector
- [ ] Historical catalyst database
- [ ] Competitive landscape analyzer
- [ ] Cash runway calculator

### Phase 6: Polish (1 week)
- [ ] Documentation & tutorials
- [ ] Performance optimization
- [ ] Security audit
- [ ] Admin monitoring dashboard

**Total Timeline**: ~13 weeks (3 months)

---

## Key Files & Locations

### Documentation
- **Master Blueprint**: `docs/REDMILE_CATALYST_SYSTEM.md` (detailed spec)
- **Quick Start**: `docs/REDMILE_QUICK_START.md` (this file)

### Backend (Python)
```
bt_platform/
├── scrapers/sites/
│   ├── sec_13f_scraper.py           # 13F holdings scraper
│   ├── fda_pdufa_scraper.py         # PDUFA date tracker
│   ├── enhanced_ctgov_scraper.py    # Phase 3 trials
│   ├── edgar_8k_scraper.py          # Material events
│   ├── conference_scraper.py        # ASCO, ASH, etc.
│   └── insider_scraper.py           # Form 4 filings
├── ingestion/
│   └── catalyst_pipeline.py         # Orchestration
├── logic/
│   ├── surprise_detector.py         # Street mispricing detector
│   └── competitive_analyzer.py      # Competitive landscape
└── core/
    ├── database.py                  # Enhanced schemas
    └── endpoints/
        ├── portfolio.py             # Holdings APIs
        ├── catalysts_v2.py          # Enhanced catalyst APIs
        └── intelligence.py          # Analytics APIs
```

### Frontend (React/TypeScript)
```
frontend-components/src/biotech/organisms/
├── CatalystCalendarPM/              # PM calendar component
│   ├── CatalystCalendarPM.tsx
│   └── CatalystCalendarPM.module.css
├── CatalystScoringRadar/            # Enhanced radar (8-dim)
└── SurpriseFactorDashboard/         # Street differential UI
```

### Utilities
```
src/utils/
├── catalystScoring.ts               # Enhanced scoring algorithm
├── portfolioFilters.ts              # Portfolio-based filtering
└── surpriseDetection.ts             # Client-side analytics
```

---

## API Endpoints Reference

### Portfolio
```bash
# Get current Redmile holdings
GET /api/v1/portfolio/redmile/holdings

# Get historical position sizing for ticker
GET /api/v1/portfolio/redmile/holdings/history?ticker=VRTX

# Manually sync latest 13F
POST /api/v1/portfolio/redmile/sync
```

### Catalysts
```bash
# Get portfolio-filtered catalyst calendar
GET /api/v1/catalysts/calendar?portfolio=redmile&days=90&min_score=12

# Get specific catalyst with full scoring
GET /api/v1/catalysts/{id}

# Get high-conviction opportunities only
GET /api/v1/catalysts/high-conviction

# Get mispricing opportunities
GET /api/v1/catalysts/surprise-opportunities
```

### Intelligence
```bash
# Analyze surprise potential for catalyst
GET /api/v1/intelligence/surprise-analysis/{catalyst_id}

# Get competitive landscape
GET /api/v1/intelligence/competitive-landscape/{catalyst_id}

# Find historical analogues
GET /api/v1/intelligence/analogues/{catalyst_id}

# Get Street consensus vs internal
GET /api/v1/street/differential/{catalyst_id}
```

---

## Environment Setup

### Required Environment Variables
```bash
# SEC EDGAR (no API key needed, but use email for user-agent)
SEC_USER_AGENT="your-email@example.com"

# FDA (optional, for higher rate limits)
OPENFDA_API_KEY="your-api-key"

# Database
DATABASE_URL="postgresql://user:pass@localhost/biotech_terminal"
REDIS_URL="redis://localhost:6379"

# Scrapers
MAX_CONCURRENT_SCRAPERS=5
SCRAPER_RATE_LIMIT_PER_MINUTE=60
```

### Installation
```bash
# Python dependencies
poetry install

# Node.js dependencies
npm install

# Run database migrations
poetry run alembic upgrade head

# Seed initial data
poetry run python -m bt_platform.ingestion.catalyst_pipeline
```

---

## Usage Examples

### 1. Get Redmile Holdings
```python
import requests

response = requests.get('http://localhost:8000/api/v1/portfolio/redmile/holdings')
holdings = response.json()

print(f"Total positions: {holdings['total_positions']}")
for holding in holdings['holdings']:
    print(f"{holding['ticker']}: {holding['weight']:.2%} ({holding['change_pct']:+.1%} QoQ)")
```

### 2. Get High-Conviction Catalysts
```python
response = requests.get('http://localhost:8000/api/v1/catalysts/calendar', params={
    'portfolio': 'redmile',
    'days': 90,
    'min_score': 16  # Ultra-High tier only
})

catalysts = response.json()
for catalyst in catalysts['events']:
    print(f"{catalyst['company']} - {catalyst['drug']}")
    print(f"  Event: {catalyst['kind']} on {catalyst['date']}")
    print(f"  Score: {catalyst['total_score']}/24 ({catalyst['tier']})")
    print(f"  Rationale: {', '.join(catalyst['rationale'])}")
    print()
```

### 3. Analyze Surprise Potential
```python
response = requests.get(f'http://localhost:8000/api/v1/intelligence/surprise-analysis/{catalyst_id}')
analysis = response.json()

print(f"Street PoS: {analysis['street_pos']:.0%}")
print(f"Internal PoS: {analysis['internal_pos']:.0%}")
print(f"Differential: {analysis['differential']:+.0%}")
print(f"Risk/Reward: {analysis['risk_reward']:.1f}x")
print(f"Conviction: {analysis['conviction']}")
```

### 4. Frontend Calendar Component
```tsx
import { CatalystCalendarPM } from '@biotech-terminal/frontend-components/biotech';

function HomePage() {
  const [catalysts, setCatalysts] = useState([]);

  useEffect(() => {
    fetch('/api/v1/catalysts/calendar?portfolio=redmile&days=90')
      .then(res => res.json())
      .then(data => setCatalysts(data.events));
  }, []);

  return (
    <CatalystCalendarPM
      catalysts={catalysts}
      portfolio="redmile"
      defaultHorizon={90}
    />
  );
}
```

---

## Data Sources & Attribution

### Primary Sources
1. **SEC EDGAR** - 13F holdings, 8-K filings, Form 4 insider trades
   - Rate limit: 10 requests/second
   - User-Agent required with email

2. **FDA.gov** - PDUFA dates, AdComm meetings, drug approvals
   - Rate limit: 240 requests/minute with API key
   - Free tier: 40 requests/minute

3. **ClinicalTrials.gov** - Phase 3 trial completion dates
   - API v2: https://clinicaltrials.gov/api/v2/
   - Rate limit: 10 requests/second

4. **Conference Databases** - ASCO, ASH, AHA, EASL abstract archives
   - Varies by conference
   - Respect robots.txt

### Secondary Sources
- Company press releases (for 8-K supplementation)
- Analyst reports (for Street consensus, manually curated)
- Options markets (implied volatility, via broker APIs)

---

## Maintenance & Operations

### Daily Operations
```bash
# Run catalyst ingestion pipeline (cron at 6 AM ET)
poetry run python -m bt_platform.ingestion.catalyst_pipeline

# Sync latest 13F (quarterly, within 45 days of quarter-end)
curl -X POST http://localhost:8000/api/v1/portfolio/redmile/sync

# Check pipeline health
curl http://localhost:8000/api/scraping/health
```

### Monitoring
- **Logs**: `logs/catalyst_pipeline.log`
- **Metrics**: `/api/scraping/metrics` (Prometheus format)
- **Alerts**: Email on pipeline failures, stale data (>48 hours old)

### Troubleshooting
```bash
# Debug scraper issues
poetry run python -m bt_platform.scrapers.sites.sec_13f_scraper --dry-run

# Check database connectivity
poetry run python -c "from bt_platform.core.database import engine; print(engine.connect())"

# Clear Redis cache
redis-cli FLUSHALL
```

---

## Success Metrics

### Coverage
- [ ] **>90%** of Redmile portfolio companies have catalyst coverage
- [ ] **>50** catalysts in next 90 days
- [ ] **>10** Ultra-High tier catalysts per quarter

### Accuracy
- [ ] **>80%** of catalyst dates within ±7 days of actual event
- [ ] **<24 hours** lag from source publication to system ingestion
- [ ] **<5%** duplicate rate after deduplication

### Value
- [ ] Identify **10+** high-conviction surprise setups per quarter
- [ ] Surface catalysts **1-2 weeks** before Street coverage
- [ ] **>2x** risk/reward on Ultra-High tier catalysts (backtested)

---

## Next Steps

1. **Read Full Spec**: Review `docs/REDMILE_CATALYST_SYSTEM.md` for detailed implementation
2. **Sprint Planning**: Break down into 2-week sprints (see Phase checklist above)
3. **Proof of Concept**: Start with Phase 1 (13F scraper + portfolio API)
4. **Iterate**: Build incrementally, get PM feedback after each phase
5. **Scale**: Once validated, expand to other funds (Baker Bros, Perceptive, etc.)

---

## Contact & Support

- **Documentation**: `docs/REDMILE_CATALYST_SYSTEM.md`
- **GitHub Issues**: For bugs and feature requests
- **Slack Channel**: `#catalyst-intelligence` (internal)

---

**Version**: 1.0
**Last Updated**: 2024-10-13
**Status**: Ready for Implementation

*Built for Jeremy Green himself to look at* 🚀

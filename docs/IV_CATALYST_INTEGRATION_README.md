# IV Catalyst Integration - Complete Guide

## Overview

This document provides a comprehensive guide to the **Implied Volatility (IV) Catalyst Tracking System** integrated into the GGets biotech terminal. This system helps traders identify asymmetric trading opportunities by detecting IV spikes ahead of biotech catalysts.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [System Architecture](#system-architecture)
3. [Data Pipeline](#data-pipeline)
4. [API Endpoints](#api-endpoints)
5. [UI Components](#ui-components)
6. [Trading Strategies](#trading-strategies)
7. [Maintenance & Operations](#maintenance--operations)

---

## Quick Start

### Initial Setup

```bash
# 1. Install dependencies
cd /path/to/terminal-ui-biotech-GG
npm install
poetry install

# 2. Load XBI universe
python -m bt_platform.core.ingest_xbi_companies

# 3. Backfill IV data (synthetic for demo)
python -m bt_platform.ingestion.iv_etl

# 4. Start the backend
poetry run uvicorn bt_platform.core.app:app --reload --port 8000

# 5. Start the frontend
cd terminal && npm run dev
```

### Access the System

- **Web UI**: http://localhost:3000/iv-catalyst
- **API Docs**: http://localhost:8000/docs
- **IV Signals**: http://localhost:8000/api/v1/iv/signals

---

## System Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                      GGets Terminal                          │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ IV Catalyst  │  │ IV Calendar  │  │ Peer Compare │     │
│  │    Page      │  │   Heatmap    │  │   Widget     │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                 │
│                            ▼                                 │
│                  ┌─────────────────┐                        │
│                  │   FastAPI       │                        │
│                  │   Backend       │                        │
│                  │  /api/v1/iv/*   │                        │
│                  └────────┬────────┘                        │
│                           │                                  │
│                           ▼                                  │
│         ┌─────────────────────────────────┐                 │
│         │      PostgreSQL / SQLite        │                 │
│         │  - options_iv                   │                 │
│         │  - price_data                   │                 │
│         │  - catalysts                    │                 │
│         │  - iv_catalyst_signals          │                 │
│         └─────────────────────────────────┘                 │
│                           ▲                                  │
│                           │                                  │
│                  ┌────────┴────────┐                        │
│                  │   IV ETL        │                        │
│                  │   Pipeline      │                        │
│                  │ (Nightly Job)   │                        │
│                  └─────────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Nightly ETL** → Fetches options data, computes IV metrics
2. **Database** → Stores historical IV, price, catalyst data
3. **Signal Generation** → Analyzes patterns, generates signals
4. **API** → Exposes data to frontend
5. **UI** → Displays interactive dashboards

---

## Data Pipeline

### ETL Process (Nightly)

**File**: `bt_platform/ingestion/iv_etl.py`

**Steps**:

1. **Fetch XBI Constituents**
   ```python
   tickers = get_xbi_tickers()  # ~120 biotech stocks
   ```

2. **For Each Ticker**:
   - Fetch options chain (7D, 14D, 30D, 60D tenors)
   - Calculate implied volatility
   - Compute skew metrics (25Δ put-call spread)
   - Track open interest and volume
   - Calculate IV percentiles (1Y, 6M lookback)
   - Detect term structure (backwardation)

3. **Compute Derived Metrics**:
   - IV/RV ratio (implied vs realized volatility)
   - Skew change vs 20D median
   - OI spike detection (current vs 30D average)

4. **Store in Database**:
   - `options_iv` table
   - `price_data` table (for RV calculation)

### Database Schema

#### `options_iv`
```sql
CREATE TABLE options_iv (
    id INTEGER PRIMARY KEY,
    ticker VARCHAR NOT NULL,
    date DATETIME NOT NULL,
    tenor_days INTEGER NOT NULL,  -- 7, 14, 30, 60
    
    -- IV metrics
    iv_mid FLOAT NOT NULL,
    skew_25d FLOAT,  -- 25Δ put IV - 25Δ call IV
    
    -- OI tracking
    total_oi INTEGER,
    call_oi INTEGER,
    put_oi INTEGER,
    put_call_ratio FLOAT,
    
    -- Historical context
    iv_pctile_1y FLOAT,  -- Percentile rank (0-100)
    skew_25d_20d_median FLOAT,  -- 20D median for comparison
    
    -- Flags
    is_backwardation BOOLEAN  -- 7D > 30D
);
```

#### `iv_catalyst_signals`
```sql
CREATE TABLE iv_catalyst_signals (
    id INTEGER PRIMARY KEY,
    ticker VARCHAR NOT NULL,
    signal_date DATETIME NOT NULL,
    catalyst_id INTEGER,
    event_date DATETIME NOT NULL,
    event_type VARCHAR,
    days_to_event INTEGER,
    
    -- IV metrics
    iv7 FLOAT,
    iv30 FLOAT,
    iv_rv_ratio FLOAT,
    term_backwardation FLOAT,
    skew25d FLOAT,
    skew_change FLOAT,
    iv7_pctile FLOAT,
    
    -- Signal flags (0 or 1)
    backw_flag INTEGER,  -- Term structure inverted
    ivrv_flag INTEGER,   -- IV/RV elevated
    skew_flag INTEGER,   -- Skew change significant
    oi_flag INTEGER,     -- OI spike detected
    
    -- Combined score (0-4)
    signal_score INTEGER,
    quality VARCHAR,  -- High, Medium, Low
    confidence FLOAT  -- 0-1
);
```

---

## API Endpoints

### Base URL
```
http://localhost:8000/api/v1/iv
```

### Endpoints

#### 1. Get IV Signals
```http
GET /signals?min_score=2&max_days_to_event=60&quality=High
```

**Response**:
```json
{
  "signals": [
    {
      "ticker": "REGN",
      "signal_date": "2024-10-27T12:00:00Z",
      "event_date": "2024-12-15T00:00:00Z",
      "event_type": "Phase 3 Data Readout",
      "days_to_event": 49,
      "signal_score": 3,
      "confidence": 0.75,
      "quality": "High",
      "metrics": {
        "iv7": 58.2,
        "iv30": 47.1,
        "iv_rv_ratio": 1.52,
        "term_backwardation": 11.1,
        "skew25d": 8.5,
        "skew_change": 12.3,
        "iv7_pctile": 82.0,
        "price": 487.50,
        "ret5d": 0.0085
      },
      "flags": {
        "backwardation": true,
        "iv_rv_elevated": true,
        "skew_significant": true,
        "oi_spike": false
      }
    }
  ],
  "count": 1
}
```

#### 2. Get IV Calendar
```http
GET /calendar?from_date=2024-11-01&to_date=2024-12-31&tickers=REGN,VRTX
```

Returns catalyst calendar with IV overlays for heatmap visualization.

#### 3. Get IV Data Time Series
```http
GET /data/REGN?from_date=2024-01-01&tenors=7,30
```

Returns historical IV data for charting.

#### 4. Get IV Stats
```http
GET /stats/REGN
```

Returns current IV stats, percentiles, and term structure.

#### 5. Compute Signals
```http
POST /compute-signals?lookback_days=90&min_iv_rv_ratio=1.4
```

Manually trigger signal computation.

#### 6. Peer Comparison
```http
GET /peer-comparison/REGN?therapeutic_area=Rare%20Disease
```

Compare IV percentile vs peers with similar profiles.

---

## UI Components

### 1. IV Catalyst Page (`/iv-catalyst`)

**Location**: `terminal/src/pages/IVCatalystPage.tsx`

**Features**:
- Signal list with quality badges
- Real-time filtering (score, days to event, quality)
- Click to expand details
- Embedded peer comparison charts
- Refresh button for live updates

**Screenshot**:
```
┌─ IV CATALYST TRACKER ─────────────────────────────────────┐
│                                                            │
│  Filters: Min Score: [2] | Max Days: [60] | Quality: All │
│                                                            │
│  ┌─ REGN ────────────────────────────────────────────┐   │
│  │ Score: 3/4 | Quality: HIGH | Event: Dec 15, 2024 │   │
│  │ IV7: 58.2% (82%ile) | IV/RV: 1.52 | Days: 49     │   │
│  │ Flags: ✓ Backwardation | ✓ IV/RV | ✓ Skew        │   │
│  │ [View Details] [Peer Comparison]                  │   │
│  └────────────────────────────────────────────────────┘   │
│                                                            │
│  ┌─ VRTX ────────────────────────────────────────────┐   │
│  │ Score: 2/4 | Quality: MEDIUM | Event: Nov 28, 2024│   │
│  │ IV7: 52.1% (68%ile) | IV/RV: 1.38 | Days: 32     │   │
│  │ Flags: ✓ Backwardation | ✓ IV/RV                 │   │
│  └────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘
```

### 2. IV Catalyst Heatmap

**Location**: `terminal/src/components/IVCatalystHeatmap.tsx`

**Features**:
- Calendar view (D-30 → D+5)
- Cells shaded by IV z-score
- Badges on critical days (D-7, D-3, D-1)
- Hover tooltips with IV drift, skew change, OI spikes

**Visual**:
```
┌─ CATALYST CALENDAR ───────────────────────────────────┐
│                                                        │
│ Ticker │ D-30 │ D-15 │ D-7  │ D-3  │ D-1  │ Event   │
│────────┼──────┼──────┼──────┼──────┼──────┼─────────┤
│ REGN   │  ░░  │  ▓▓  │  ██  │  ██  │  ██  │   ⚠️    │
│ VRTX   │      │      │  ░░  │  ▓▓  │  ██  │   📅    │
│                                                        │
│ Legend: ░░ Low | ▓▓ Medium | ██ High | ⚠️ Signal     │
└────────────────────────────────────────────────────────┘
```

### 3. IV Peer Comparison

**Location**: `terminal/src/components/IVPeerComparison.tsx`

**Features**:
- Horizontal bar chart of IV percentiles
- Highlights target ticker
- Shows sector median
- Detects idiosyncratic moves

**Visual**:
```
┌─ PEER IV PERCENTILE ──────────────────────────────┐
│                                                    │
│  YOU → REGN  ████████████████░░░░ 75%            │
│        VRTX  ██████████████░░░░░░ 68%            │
│        ALNY  ████████░░░░░░░░░░░░ 52%            │
│        BMRN  ████████████░░░░░░░░ 61%            │
│                                                    │
│  Sector Median: 61% | IDIOSYNCRATIC ⚠️            │
└────────────────────────────────────────────────────┘
```

---

## Trading Strategies

See **[IV_CATALYST_COMPLETE_PLAYBOOK.md](./IV_CATALYST_COMPLETE_PLAYBOOK.md)** for:

- Entry/exit strategies
- Position sizing (Kelly criterion)
- Risk management rules
- Portfolio construction
- Post-event handling
- Stop loss & profit taking

**Quick Reference**:

| Signal Quality | Position Size | Structure | Stop Loss |
|---------------|---------------|-----------|-----------|
| High (3-4/4) | 2-3% risk | Debit spreads, naked calls | -40% |
| Medium (2/4) | 1-2% risk | Tight spreads, butterflies | -50% |
| Low (<2/4) | AVOID | - | - |

---

## Maintenance & Operations

### Nightly ETL Job

**Schedule**: Every weekday at 4:30 PM ET (after market close)

**Cron Entry**:
```bash
30 16 * * 1-5 cd /path/to/terminal && python -m bt_platform.ingestion.iv_etl
```

**Manual Trigger**:
```bash
python -m bt_platform.ingestion.iv_etl
```

**With Specific Tickers**:
```bash
python -m bt_platform.ingestion.iv_etl REGN VRTX ALNY
```

### Signal Generation

**Auto-compute** (after ETL):
```bash
curl -X POST "http://localhost:8000/api/v1/iv/compute-signals?min_iv_rv_ratio=1.4"
```

**Manual Trigger** (from UI):
Click "Compute Signals" button on IV Catalyst Page

### Monitoring

**Health Checks**:
```bash
# Check if IV data is fresh (< 24 hours old)
curl "http://localhost:8000/api/v1/iv/stats/REGN" | jq '.as_of_date'

# Check signal count
curl "http://localhost:8000/api/v1/iv/signals?min_score=2" | jq '.count'
```

**Logs**:
```bash
# Check ETL logs
tail -f logs/iv_etl.log

# Check API logs
tail -f logs/uvicorn.log
```

### Troubleshooting

#### No Signals Generated
```bash
# 1. Check if catalysts exist
curl "http://localhost:8000/api/v1/catalysts?upcoming=true" | jq '.count'

# 2. Check if IV data exists
curl "http://localhost:8000/api/v1/iv/data/REGN?tenors=7" | jq '.count'

# 3. Re-run signal computation
curl -X POST "http://localhost:8000/api/v1/iv/compute-signals"
```

#### IV Data Stale
```bash
# Re-run ETL pipeline
python -m bt_platform.ingestion.iv_etl

# Check database directly
sqlite3 biotech_terminal.db "SELECT MAX(date) FROM options_iv;"
```

---

## Advanced Topics

### Adding Real Options Data

To integrate real options data (e.g., from IBKR, Tradier):

1. **Modify ETL**: Edit `bt_platform/ingestion/iv_etl.py`
2. **Replace** `_generate_iv_data()` with actual API calls
3. **Add** API credentials to `.env`
4. **Test** with one ticker before full rollout

**Example** (IBKR):
```python
from ib_insync import IB, Stock, Option

def fetch_iv_from_ibkr(ticker: str, tenor_days: int):
    ib = IB()
    ib.connect('127.0.0.1', 7497, clientId=1)
    
    stock = Stock(ticker, 'SMART', 'USD')
    chains = ib.reqSecDefOptParams(stock.symbol, '', stock.secType, stock.conId)
    
    # Calculate IV for specific tenor...
    # (Implementation details omitted)
    
    return iv_data
```

### Sanity Check Configuration

**File**: `bt_platform/ingestion/iv_etl.py`

**Adjust Thresholds**:
```python
MIN_OI_THRESHOLD = 1000       # Minimum OI for liquidity
MAX_OI_FLOAT_RATIO = 0.05     # Max OI/float
VIX_SPIKE_THRESHOLD = 20.0    # VIX % change threshold
```

---

## References

- **[IV Catalyst Complete Playbook](./IV_CATALYST_COMPLETE_PLAYBOOK.md)** - Full trading guide
- **[IV Catalyst API](./IV_CATALYST_API.md)** - API documentation
- **[IV Catalyst User Guide](./IV_CATALYST_USER_GUIDE.md)** - UI walkthrough
- **[IV Catalyst Quick Start](./IV_CATALYST_QUICK_START.md)** - Getting started

---

## Support

For issues or questions:

- **GitHub Issues**: https://github.com/deathknight2002/terminal-ui-biotech-GG/issues
- **API Docs**: http://localhost:8000/docs
- **Community**: Discord (link TBD)

---

**Last Updated**: 2024-10-27
**Version**: 1.0.0
**Maintained by**: GGets Terminal Team

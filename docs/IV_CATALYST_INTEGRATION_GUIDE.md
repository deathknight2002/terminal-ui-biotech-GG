# IV Catalyst Integration - Complete System Guide

> **How to wire implied volatility signals into the GGets terminal for asymmetric biotech setups**

## 🎯 System Overview

This guide describes the complete IV catalyst tracking system integrated into the biotech terminal, enabling users to identify asymmetric trading setups by monitoring implied volatility spikes ahead of catalyst events.

---

## 📊 Architecture

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    DATA SOURCES (External)                   │
├─────────────────────────────────────────────────────────────┤
│  • Options Chains (7D, 14D, 30D, 60D IV)                    │
│  • Price Data (OHLCV + Realized Vol)                        │
│  • Catalyst Calendar (PDUFA, AdCom, Readouts)               │
│  • Company Profiles (XBI constituents)                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  ETL PIPELINE (Nightly)                      │
├─────────────────────────────────────────────────────────────┤
│  bt_platform/ingestion/iv_etl.py                            │
│                                                              │
│  • Pull options chains → compute tenor IVs                  │
│  • Compute realized vol (20D) and IV percentiles (1Y)       │
│  • Normalize catalyst dates with event windows              │
│  • Detect term structure patterns (backwardation)           │
│  • Calculate 25-delta skew metrics                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   DATABASE (SQLite)                          │
├─────────────────────────────────────────────────────────────┤
│  Tables:                                                     │
│  • options_iv      - IV data by ticker, date, tenor         │
│  • price_data      - OHLCV with realized volatility         │
│  • catalysts       - Upcoming events with dates             │
│  • iv_catalyst_signals - Pre-computed signals               │
│  • companies       - XBI constituent companies              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              SIGNAL COMPUTATION ENGINE                       │
├─────────────────────────────────────────────────────────────┤
│  POST /api/v1/iv/compute-signals                            │
│                                                              │
│  For each upcoming catalyst (0-60 days):                    │
│  1. Fetch latest IV7, IV30 data                             │
│  2. Fetch price data (realized vol, returns)                │
│  3. Compute 4 signal flags:                                 │
│     • Backwardation: IV7 > IV30 by >10%                     │
│     • IV/RV Elevated: IV7/RV20D > 1.4, quiet price          │
│     • Skew Significant: Skew change > 10 pts                │
│     • OI Spike: OI > 2× 30D average                         │
│  4. Calculate signal_score (sum of flags, 0-4)              │
│  5. Assign quality tier (High/Medium/Low)                   │
│  6. Store in iv_catalyst_signals table                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    REST API (FastAPI)                        │
├─────────────────────────────────────────────────────────────┤
│  GET  /api/v1/iv/signals          - Active signals list     │
│  GET  /api/v1/iv/calendar         - Calendar heatmap data   │
│  GET  /api/v1/iv/data/{ticker}    - IV time series          │
│  GET  /api/v1/iv/stats/{ticker}   - Current IV statistics   │
│  POST /api/v1/iv/compute-signals  - Trigger computation     │
│  GET  /api/v1/iv/peer-comparison/{ticker} - Peer analysis   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   FRONTEND (React)                           │
├─────────────────────────────────────────────────────────────┤
│  Route: /catalysts/iv                                        │
│                                                              │
│  Components:                                                 │
│  • IVCatalystPage       - Main dashboard                    │
│  • IVCatalystHeatmap    - Calendar/list view                │
│  • IVSparkTile          - Mini price+IV chart               │
│  • IVPeerComparison     - Peer IV percentile comparison     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema

### Table: `options_iv`

Stores implied volatility data by ticker, date, and tenor.

```sql
CREATE TABLE options_iv (
    id INTEGER PRIMARY KEY,
    ticker VARCHAR NOT NULL,
    date DATETIME NOT NULL,
    tenor_days INTEGER NOT NULL,  -- 7, 14, 30, 60, 90
    
    -- IV Metrics
    iv_mid FLOAT NOT NULL,         -- Mid-point IV (%)
    iv_bid FLOAT,
    iv_ask FLOAT,
    
    -- Skew Metrics
    skew_25d FLOAT,                -- 25-delta put-call skew
    skew_10d FLOAT,
    
    -- OI and Volume
    total_oi INTEGER,
    total_volume INTEGER,
    call_oi INTEGER,
    put_oi INTEGER,
    put_call_ratio FLOAT,
    
    -- Historical Context
    iv_pctile_1y FLOAT,            -- IV percentile (1Y lookback)
    iv_pctile_6m FLOAT,
    skew_25d_20d_median FLOAT,     -- 20D median skew for comparison
    
    -- Flags
    is_backwardation BOOLEAN,      -- 7D > 30D
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_ticker_date (ticker, date),
    INDEX idx_ticker_tenor_date (ticker, tenor_days, date)
);
```

### Table: `price_data`

OHLCV data with realized volatility calculations.

```sql
CREATE TABLE price_data (
    id INTEGER PRIMARY KEY,
    ticker VARCHAR NOT NULL,
    date DATETIME NOT NULL,
    
    -- OHLCV
    open FLOAT,
    high FLOAT,
    low FLOAT,
    close FLOAT NOT NULL,
    volume INTEGER,
    
    -- Returns
    returns_1d FLOAT,
    returns_5d FLOAT,
    returns_20d FLOAT,
    
    -- Realized Volatility
    realized_vol_20d FLOAT,        -- 20-day realized vol (%)
    realized_vol_60d FLOAT,
    
    -- Volume Metrics
    volume_20d_avg FLOAT,
    relative_volume FLOAT,         -- Volume / 20D avg
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_ticker_date (ticker, date)
);
```

### Table: `catalysts`

Upcoming catalyst events.

```sql
CREATE TABLE catalysts (
    id INTEGER PRIMARY KEY,
    name VARCHAR,
    title VARCHAR,
    company VARCHAR,               -- Ticker symbol
    drug VARCHAR,
    kind VARCHAR,                  -- FDA, Clinical, M&A
    event_type VARCHAR,            -- PDUFA, AdCom, Readout
    event_date DATETIME NOT NULL,
    probability FLOAT,
    impact VARCHAR,                -- High, Medium, Low
    description TEXT,
    status VARCHAR DEFAULT 'Upcoming',
    source_url VARCHAR,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_company (company),
    INDEX idx_event_date (event_date)
);
```

### Table: `iv_catalyst_signals`

Pre-computed IV catalyst signals.

```sql
CREATE TABLE iv_catalyst_signals (
    id INTEGER PRIMARY KEY,
    ticker VARCHAR NOT NULL,
    signal_date DATETIME NOT NULL,
    catalyst_id INTEGER REFERENCES catalysts(id),
    
    -- Event Details
    event_date DATETIME NOT NULL,
    event_type VARCHAR,
    days_to_event INTEGER,
    
    -- IV Metrics at Signal Generation
    iv7 FLOAT,
    iv30 FLOAT,
    iv_rv_ratio FLOAT,             -- IV7 / Realized Vol 20D
    term_backwardation FLOAT,      -- IV7 - IV30
    skew25d FLOAT,
    skew_change FLOAT,             -- Current - 20D median
    iv7_pctile FLOAT,
    
    -- Price Metrics
    price FLOAT,
    ret5d FLOAT,
    
    -- Signal Flags (0 or 1)
    backw_flag INTEGER DEFAULT 0,
    ivrv_flag INTEGER DEFAULT 0,
    skew_flag INTEGER DEFAULT 0,
    oi_flag INTEGER DEFAULT 0,
    
    -- Combined Score
    signal_score INTEGER,          -- Sum of flags (0-4)
    confidence FLOAT,              -- 0-1
    quality VARCHAR,               -- High, Medium, Low
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_ticker_date (ticker, signal_date),
    INDEX idx_event_date (event_date),
    INDEX idx_signal_score (signal_score)
);
```

---

## 🔄 ETL Pipeline

### Location
```
bt_platform/ingestion/iv_etl.py
```

### Nightly Schedule

The ETL pipeline runs nightly to:
1. Pull latest options chains
2. Compute IV for 5 tenors (7D, 14D, 30D, 60D, 90D)
3. Calculate IV percentiles (1Y and 6M lookback)
4. Detect term structure patterns
5. Compute 25-delta skew metrics
6. Update `options_iv` and `price_data` tables

### Manual Execution

```bash
# Run for all XBI constituents
poetry run python -m bt_platform.ingestion.iv_etl

# Run for specific tickers
poetry run python -m bt_platform.ingestion.iv_etl REGN VRTX MRNA

# With options
poetry run python -m bt_platform.ingestion.iv_etl --force-refresh --verbose
```

### Output

```
Processing ticker: REGN
  ✓ Fetched options chain (7D, 30D)
  ✓ Computed IV percentiles (1Y: 65.2%)
  ✓ Detected backwardation (7D: 55%, 30D: 48%)
  ✓ Calculated skew (25Δ: +8.5)
  ✓ Stored 2 records

Processing ticker: VRTX
  ✓ Fetched options chain (7D, 30D)
  ...

Summary: 10 tickers processed, 50 IV records created
```

---

## 🚀 API Endpoints

### 1. GET `/api/v1/iv/signals`

Get active IV catalyst signals.

**Query Parameters**:
- `min_score` (int, default=2): Minimum signal score (0-4)
- `max_days_to_event` (int, default=60): Maximum days to event
- `min_confidence` (float, default=0.5): Minimum confidence (0-1)
- `ticker` (str, optional): Filter by ticker
- `quality` (str, optional): Filter by quality (High/Medium/Low)

**Example Request**:
```bash
curl "http://localhost:8000/api/v1/iv/signals?min_score=2&quality=High"
```

**Example Response**:
```json
{
  "signals": [
    {
      "ticker": "REGN",
      "signal_date": "2025-10-27T00:00:00",
      "event_date": "2025-11-26T00:00:00",
      "event_type": "Phase 3 Data Readout",
      "days_to_event": 30,
      "signal_score": 3,
      "confidence": 0.85,
      "quality": "High",
      "metrics": {
        "iv7": 55.0,
        "iv30": 48.0,
        "iv_rv_ratio": 1.57,
        "term_backwardation": 7.0,
        "skew25d": 8.5,
        "skew_change": 3.2,
        "iv7_pctile": 72.0,
        "price": 895.50,
        "ret5d": 0.0125
      },
      "flags": {
        "backwardation": true,
        "iv_rv_elevated": true,
        "skew_significant": false,
        "oi_spike": false
      }
    }
  ],
  "count": 1,
  "filters": {
    "min_score": 2,
    "max_days_to_event": 60,
    "min_confidence": 0.5,
    "quality": "High"
  }
}
```

---

### 2. GET `/api/v1/iv/calendar`

Get catalyst calendar with IV overlays.

**Query Parameters**:
- `from_date` (ISO date): Start date (default: 30 days ago)
- `to_date` (ISO date): End date (default: 60 days ahead)
- `tickers` (comma-separated): Filter by tickers

**Example Request**:
```bash
curl "http://localhost:8000/api/v1/iv/calendar?tickers=REGN,VRTX"
```

**Example Response**:
```json
{
  "events": [
    {
      "id": 1,
      "ticker": "REGN",
      "name": "Dupixent Phase 3 COPD Data",
      "event_date": "2025-11-10T00:00:00",
      "event_type": "Clinical",
      "days_to_event": 14,
      "marker": "D-7",
      "iv_data": {
        "iv7": 55.0,
        "iv30": 48.0,
        "iv7_pctile": 72.0,
        "skew_25d": 8.5,
        "is_backwardation": true,
        "iv_date": "2025-10-27T00:00:00"
      },
      "price_data": {
        "price": 895.50,
        "returns_5d": 0.0125,
        "realized_vol_20d": 35.0
      }
    }
  ],
  "count": 1,
  "months": {
    "2025-11": [...]
  },
  "date_range": {
    "from": "2025-09-27T00:00:00",
    "to": "2025-12-26T00:00:00"
  }
}
```

---

### 3. POST `/api/v1/iv/compute-signals`

Trigger signal computation for all upcoming catalysts.

**Query Parameters**:
- `lookback_days` (int, default=90): Days of history to analyze
- `min_iv_rv_ratio` (float, default=1.4): IV/RV threshold
- `min_skew_change` (float, default=10.0): Skew change threshold

**Example Request**:
```bash
curl -X POST "http://localhost:8000/api/v1/iv/compute-signals"
```

**Example Response**:
```json
{
  "status": "success",
  "signals_generated": 8,
  "catalysts_analyzed": 15,
  "timestamp": "2025-10-27T10:30:00"
}
```

---

## 🎨 Frontend Components

### 1. IVCatalystPage

**Location**: `terminal/src/pages/IVCatalystPage.tsx`

Main dashboard for IV catalyst tracking.

**Features**:
- Signal cards with metrics and flags
- Filtering by score, quality, days to event
- Quality-based color coding
- Event timing display
- Methodology panel

**Route**: `/catalysts/iv`

---

### 2. IVCatalystHeatmap

**Location**: `terminal/src/components/IVCatalystHeatmap.tsx`

Calendar grid view with IV overlays.

**Features**:
- Ticker rows × timeline columns
- IV percentile color coding
- Event proximity markers (D-30, D-7, D-3, D-1)
- Toggle between calendar and list views
- Click through to signal details

**Usage**:
```tsx
import IVCatalystHeatmap from '../components/IVCatalystHeatmap';

<IVCatalystHeatmap />
```

---

### 3. IVSparkTile

**Location**: `terminal/src/components/IVSparkTile.tsx`

Compact 200×80px visualization showing price + IV overlay.

**Props**:
```typescript
interface IVSparkTileProps {
  ticker: string;
  data: Array<{
    date: string;
    price: number;
    iv7: number;
    realized_vol?: number;
  }>;
  width?: number;
  height?: number;
  showIVRV?: boolean;
}
```

**Usage**:
```tsx
import { IVSparkTile } from '../components/IVSparkTile';

<IVSparkTile
  ticker="REGN"
  data={ivHistoricalData}
  width={200}
  height={80}
  showIVRV={true}
/>
```

---

### 4. IVPeerComparison

**Location**: `terminal/src/components/IVPeerComparison.tsx`

Compare IV7 percentile across peer companies.

**Features**:
- Horizontal percentile bars
- Color coding (green=low, amber=medium, red=high)
- MOA and therapeutic area filtering
- Upcoming catalyst display
- Idiosyncratic vs sector-wide detection

**Usage**:
```tsx
import { IVPeerComparison } from '../components/IVPeerComparison';

<IVPeerComparison 
  ticker="REGN"
  therapeuticArea="Immunology"
/>
```

---

## 🛠️ Setup Guide

### Initial Setup (One-Time)

```bash
# 1. Install dependencies
cd /path/to/terminal-ui-biotech-GG
npm install
poetry install

# 2. Seed XBI companies and catalysts
poetry run python -m bt_platform.core.seed_iv_catalysts

# 3. Run initial IV ETL
poetry run python -m bt_platform.ingestion.iv_etl

# 4. Compute signals
curl -X POST http://localhost:8000/api/v1/iv/compute-signals

# 5. Build frontend
npm run build:components
```

---

### Daily Workflow

```bash
# Morning: Refresh data
poetry run python -m bt_platform.ingestion.iv_etl
curl -X POST http://localhost:8000/api/v1/iv/compute-signals

# Review signals in terminal
# Navigate to: http://localhost:3000/catalysts/iv
```

---

## 📖 Usage Examples

### Example 1: Find High-Quality Signals

```bash
# Get signals with score ≥3, max 30 days to event
curl "http://localhost:8000/api/v1/iv/signals?min_score=3&max_days_to_event=30&quality=High"
```

### Example 2: Track Specific Ticker

```bash
# Get IV stats for REGN
curl "http://localhost:8000/api/v1/iv/stats/REGN"

# Get historical IV data
curl "http://localhost:8000/api/v1/iv/data/REGN?tenors=7,30"
```

### Example 3: Compare Peers

```bash
# Compare REGN vs Immunology peers
curl "http://localhost:8000/api/v1/iv/peer-comparison/REGN?therapeutic_area=Immunology"
```

---

## 🔍 Signal Quality Interpretation

### High Quality (Score ≥3)
- **Confidence**: 75-95%
- **Position Size**: 1-2% of portfolio
- **Entry**: Debit call spreads, calendars
- **Exit**: Stop -20%, target +50%, close by D-1

### Medium Quality (Score = 2)
- **Confidence**: 50-75%
- **Position Size**: 0.5-1% of portfolio
- **Entry**: Tighter spreads, closer to event
- **Exit**: Stop -15%, target +30%, close by D-3

### Watch (Score <2)
- **Confidence**: <50%
- **Position Size**: 0% (monitor only)
- **Action**: Wait for signal to escalate

---

## 📚 Related Documentation

- [IV Catalyst Playbook](./IV_CATALYST_PLAYBOOK.md) - Trading strategies and position sizing
- [IV Implementation Summary](../IV_CATALYST_IMPLEMENTATION_SUMMARY.md) - Technical architecture
- [Database Models](../bt_platform/core/database.py) - Schema definitions
- [API Endpoints](../bt_platform/core/endpoints/iv_catalyst.py) - Endpoint implementation

---

## 🐛 Troubleshooting

### Signal Count is Zero

**Check**:
1. Are catalysts loaded? `SELECT COUNT(*) FROM catalysts WHERE status='Upcoming'`
2. Are IV data loaded? `SELECT COUNT(*) FROM options_iv WHERE date >= DATE('now', '-1 day')`
3. Run signal computation: `POST /api/v1/iv/compute-signals`

### IV Data Missing for Ticker

**Check**:
1. Is ticker in XBI? `SELECT * FROM companies WHERE ticker='XXXX'`
2. Run ETL manually: `poetry run python -m bt_platform.ingestion.iv_etl XXXX`
3. Check for errors in logs

### Frontend Not Showing Signals

**Check**:
1. Backend running? `curl http://localhost:8000/api/v1/iv/signals`
2. Frontend build? `npm run build:components`
3. Browser console for errors

---

*Last Updated: 2025-10-27*

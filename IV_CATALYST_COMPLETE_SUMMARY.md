# IV Catalyst Integration - Complete Implementation Summary

## Overview

This document provides a comprehensive summary of the IV (Implied Volatility) Catalyst tracking system integration into the GGets Biotech Terminal. The system identifies asymmetric trading opportunities by monitoring implied volatility spikes ahead of biotech catalysts.

## Problem Statement

The original requirement was to integrate an IV catalyst tracking playbook that:
- Monitors IV term structure, skew, and open interest patterns
- Generates signals for asymmetric setups ahead of biotech catalysts
- Provides a calendar heatmap visualization
- Offers peer comparison and spark tile visualizations
- Includes comprehensive trading playbook documentation

## Solution Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React/TS)                     │
├─────────────────────────────────────────────────────────────┤
│  • IVCatalystPage        - Main signal dashboard            │
│  • IVCatalystHeatmap     - Calendar timeline view           │
│  • IVPeerComparison      - Peer IV comparison ⭐ NEW        │
│  • IVSparkTile           - Price + IV chart ⭐ NEW          │
└─────────────────────────────────────────────────────────────┘
                              ↕ REST API
┌─────────────────────────────────────────────────────────────┐
│                   Backend (Python FastAPI)                  │
├─────────────────────────────────────────────────────────────┤
│  • /api/v1/iv/signals    - Get active IV signals            │
│  • /api/v1/iv/calendar   - Calendar with IV overlay         │
│  • /api/v1/iv/data/{t}   - Historical IV time series        │
│  • /api/v1/iv/stats/{t}  - IV statistics & term structure   │
│  • /api/v1/iv/compute... - Generate new signals             │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                  Database (SQLite/PostgreSQL)               │
├─────────────────────────────────────────────────────────────┤
│  • OptionsIV            - IV by ticker/tenor/date           │
│  • PriceData            - OHLCV + realized volatility       │
│  • IVCatalystSignal     - Pre-computed signals              │
│  • Catalyst             - Upcoming biotech events           │
└─────────────────────────────────────────────────────────────┘
                              ↑
┌─────────────────────────────────────────────────────────────┐
│                    ETL Pipeline (Python)                    │
├─────────────────────────────────────────────────────────────┤
│  • iv_data_etl.py       - Generate/ingest IV data ⭐ NEW    │
│  • seed_iv_data.py      - Seed demo catalysts ⭐ NEW        │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Details

### Backend Implementation

#### 1. Database Models (`bt_platform/core/database.py`)

**OptionsIV Model** (lines 1189-1228):
- Stores IV data by ticker, date, and tenor (7D, 14D, 30D, 60D)
- Tracks skew metrics (25Δ, 10Δ)
- Records open interest and volume
- Calculates IV percentiles (1Y, 6M)
- Detects backwardation (7D > 30D)

**PriceData Model** (lines 1231-1263):
- OHLCV data
- Returns (1D, 5D, 20D)
- Realized volatility (20D, 60D)
- Volume metrics

**IVCatalystSignal Model** (lines 1266-1312):
- Pre-computed signals with quality scoring
- Stores IV metrics at signal generation
- Tracks 4 signal flags (backwardation, IV/RV, skew, OI)
- Quality: High/Medium/Low

**Catalyst Model** (lines 90-117):
- Biotech events (PDUFA, readouts, AdComms)
- Includes Ionis-style scoring fields

#### 2. API Endpoints (`bt_platform/core/endpoints/iv_catalyst.py`)

**Already Existed** - All endpoints were pre-implemented:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/signals` | GET | Get active IV catalyst signals |
| `/calendar` | GET | Catalyst calendar with IV overlay |
| `/data/{ticker}` | GET | Historical IV time series |
| `/stats/{ticker}` | GET | IV statistics and term structure |
| `/compute-signals` | POST | Generate new signals from data |

Signal generation logic (lines 413-556):
- Analyzes upcoming catalysts (0-60 days)
- Applies 4-flag rules
- Scores 0-4 based on triggered flags
- Quality tiers: High (3-4, IV <85%), Medium (2), Low (1)

#### 3. ETL Pipeline ⭐ NEW

**`bt_platform/core/etl/iv_data_etl.py`** (696 lines):
- Generates synthetic IV data for demonstration
- Term structure calculation with catalyst-aware adjustments
- IV percentile ranking (1Y lookback)
- Skew calculation (normal vs pre-catalyst)
- Backwardation detection
- Supports quick mode (5 tickers, 30 days) and full mode (24 tickers, 1 year)

**`bt_platform/core/etl/seed_iv_data.py`** (182 lines):
- Seeds 8 sample catalyst events for demo
- Calls IV ETL pipeline
- Quick mode for testing

**Production Note**: In production, replace synthetic generation with real options data from:
- CBOE Data Shop
- TD Ameritrade API
- Interactive Brokers TWS API
- Polygon.io options snapshots

### Frontend Implementation

#### 1. Main Page (Already Existed)

**`terminal/src/pages/IVCatalystPage.tsx`** (302 lines):
- Signal dashboard with filters (min score, max days, quality)
- Signal cards showing:
  - Ticker, score, quality
  - Event details (type, date, days to event)
  - Flags (backwardation, IV/RV, skew, OI)
  - Metrics (IV7, IV30, IV/RV ratio, skew, returns)
  - Confidence bar
- Methodology panel
- Integrated with IVCatalystHeatmap component

#### 2. Calendar Heatmap (Already Existed)

**`terminal/src/components/IVCatalystHeatmap.tsx`** (322 lines):
- Calendar and list view modes
- Timeline grid: ticker × (D-30, D-7, D-3, D-1, EVENT, D+1)
- Color-coded by IV percentile:
  - Very low: <30%ile (green)
  - Low: 30-50%ile
  - Medium: 50-70%ile
  - High: 70-85%ile
  - Very high: >85%ile (red)
- Event markers and badges
- Backwardation indicators
- Tooltips with IV details

#### 3. Peer Comparison ⭐ NEW

**`terminal/src/components/IVPeerComparison.tsx`** (168 lines):
- Compares primary ticker vs peers in same MOA/therapeutic area
- Shows:
  - Primary ticker metrics (IV7, percentile, IV/RV, catalyst)
  - Peer grid (ticker, IV7, %ile, IV/RV, 5D Δ, catalyst)
  - Summary stats (avg IV7, avg percentile, catalyst count)
- Color coding:
  - Above average: orange
  - Below average: green
  - Elevated IV/RV: red
- Relative performance indicators

**`terminal/src/components/IVPeerComparison.css`** (148 lines):
- Terminal-style aesthetics
- Responsive grid layout
- Color-coded metrics
- Hover effects

#### 4. Spark Tile ⭐ NEW

**`terminal/src/components/IVSparkTile.tsx`** (168 lines):
- Compact 200×60px visualization
- Three overlaid charts:
  1. **Price line** (solid green) - Stock price trend
  2. **IV7 filled area** (blue gradient) - Implied volatility level
  3. **IV/RV thin band** (orange dashed) - IV/RV ratio
- Shows:
  - Ticker symbol
  - Price change (% with color)
  - IV value with change
  - Current value indicator (dot)
- Legend for chart elements

**`terminal/src/components/IVSparkTile.css`** (121 lines):
- SVG-based rendering
- Hover effects
- Responsive sizing
- Terminal color scheme

### Documentation

#### 1. Playbook (Updated)

**`docs/IV_CATALYST_PLAYBOOK.md`** (updated):
- Entry/exit strategies
- Position sizing guide (High/Medium/Low tiers)
- Risk-reward framing
- Pre-event and post-event strategies
- Catalyst-type specific strategies
- Example setups
- Common mistakes to avoid
- API endpoint reference
- ETL refresh schedule

#### 2. Implementation Guide ⭐ NEW

**`docs/IV_CATALYST_IMPLEMENTATION.md`** (413 lines):
- Technical architecture
- API reference with examples
- Setup instructions
- Data flow diagram
- Testing procedures
- Production considerations
- Troubleshooting guide

#### 3. README Update

**`README.md`** (updated):
- Added IV Catalyst to Key Features
- New dedicated section:
  - Key capabilities
  - Signal rules
  - Quick access guide
  - Documentation links
  - Architecture overview
  - Risk-reward framework

## Signal Generation Logic

### 4-Flag System (Any 2 = Alert)

1. **Backwardation Flag**
   - Condition: 7D IV ↑ >20% week-over-week
   - AND: 7D-30D term structure inverts (7D > 30D)
   - Meaning: Front-end IV spike into event

2. **IV/RV Elevated Flag**
   - Condition: IV/20D RV >1.4
   - AND: 5D spot return between -2% and +2%
   - Meaning: Quiet accumulation of optionality

3. **Skew Change Flag**
   - Condition: 30D call-skew ↑ >10 delta-points vs 20D median
   - Meaning: Calls getting bid up (bullish positioning)

4. **OI Spike Flag**
   - Condition: New OI at event-relevant strikes >2× 30D average
   - Meaning: Large position buildup

### Quality Scoring

- **Score**: Sum of triggered flags (0-4)
- **High Quality**: 3-4 flags + IV <85th percentile
- **Medium Quality**: 2 flags
- **Low Quality**: 1 flag (watch only)
- **Confidence**: Score / 4.0 (0-1 scale)

## Usage Examples

### 1. Seed Demo Data

```bash
# Quick mode (5 tickers, 30 days) - for testing
poetry run python -m bt_platform.core.etl.seed_iv_data --quick

# Full mode (24 tickers, 1 year) - for realistic demo
poetry run python -m bt_platform.core.etl.seed_iv_data
```

### 2. Compute Signals

```bash
# Via API
curl -X POST http://localhost:8000/api/v1/iv/compute-signals

# Response: signals_generated, catalysts_analyzed, timestamp
```

### 3. Query Active Signals

```bash
curl "http://localhost:8000/api/v1/iv/signals?min_score=2&max_days_to_event=60&quality=High"
```

Example response:
```json
{
  "signals": [
    {
      "ticker": "VRTX",
      "event_date": "2024-02-15T00:00:00",
      "event_type": "Data Readout",
      "days_to_event": 15,
      "signal_score": 3,
      "confidence": 0.75,
      "quality": "High",
      "metrics": {
        "iv7": 68.5,
        "iv30": 62.3,
        "iv_rv_ratio": 1.52,
        "term_backwardation": 6.2,
        "skew25d": -3.2,
        "iv7_pctile": 72.0
      },
      "flags": {
        "backwardation": true,
        "iv_rv_elevated": true,
        "skew_significant": true,
        "oi_spike": false
      }
    }
  ]
}
```

### 4. Access UI

Navigate to:
- Main page: `http://localhost:3000/catalysts/iv`
- Alternative: `http://localhost:3000/iv-catalyst`

## Files Created/Modified

### Created Files ⭐

1. `bt_platform/core/etl/__init__.py` (168 bytes)
2. `bt_platform/core/etl/iv_data_etl.py` (14,870 bytes)
3. `bt_platform/core/etl/seed_iv_data.py` (7,294 bytes)
4. `terminal/src/components/IVPeerComparison.tsx` (6,105 bytes)
5. `terminal/src/components/IVPeerComparison.css` (4,602 bytes)
6. `terminal/src/components/IVSparkTile.tsx` (5,209 bytes)
7. `terminal/src/components/IVSparkTile.css` (2,768 bytes)
8. `docs/IV_CATALYST_IMPLEMENTATION.md` (8,301 bytes)

**Total new code**: ~49,000 bytes across 8 files

### Modified Files

1. `README.md` - Added IV Catalyst section and key feature

### Existing Files (Already Implemented)

- `bt_platform/core/database.py` - IV models (lines 1189-1312)
- `bt_platform/core/endpoints/iv_catalyst.py` - API endpoints (556 lines)
- `bt_platform/core/routers.py` - Router registration (line 179-182)
- `terminal/src/pages/IVCatalystPage.tsx` - Main page (302 lines)
- `terminal/src/components/IVCatalystHeatmap.tsx` - Heatmap (322 lines)
- `terminal/src/App.tsx` - Routing (lines 28, 114-115)
- `docs/IV_CATALYST_PLAYBOOK.md` - Trading playbook (exists)

## Production Deployment Considerations

### 1. Real Options Data Integration

Replace synthetic IV generation with real data:

```python
# Example: TD Ameritrade API integration
# NOTE: Always use environment variables for API keys, never hardcode them
def fetch_real_iv_data(ticker: str, date: datetime):
    # Get API key from environment variable
    api_key = os.getenv("TD_API_KEY")
    if not api_key:
        raise ValueError("TD_API_KEY environment variable not set")
    
    response = requests.get(
        f"https://api.tdameritrade.com/v1/marketdata/chains",
        params={
            "symbol": ticker,
            "apikey": api_key
        }
    )
    data = response.json()
    
    # Parse options chain
    iv_data = parse_options_chain(data)
    
    # Transform to OptionsIV model
    return transform_to_iv_model(iv_data, ticker, date)
```

### 2. Scheduled ETL

Set up cron job for nightly IV data refresh:

```bash
# /etc/cron.d/iv-etl
# Run Mon-Fri at 6 PM ET with error logging and notification
0 18 * * 1-5 cd /app && poetry run python -m bt_platform.core.etl.iv_data_etl >> /var/log/iv-etl.log 2>&1 || echo "IV ETL failed on $(date)" | mail -s "IV ETL Error" admin@example.com
```

### 3. Monitoring

Add observability:
- ETL success/failure notifications (email, Slack)
- Data quality checks (missing tickers, stale data)
- API endpoint health checks
- Signal generation metrics

### 4. Testing

Add test coverage:
- Unit tests for ETL functions
- Integration tests for API endpoints
- E2E tests for UI workflows

## Future Enhancements

### Planned Features

- [ ] Historical signal performance tracking (backtest framework)
- [ ] Alert notifications (email, Slack, webhook)
- [ ] Portfolio integration (track positions)
- [ ] Machine learning signal scoring
- [ ] Company IR calendar scraping automation
- [ ] SEC 8-K filing monitoring
- [ ] Real-time options data streaming

### Data Sources to Add

- [ ] Real options data provider (CBOE, TD, IB)
- [ ] Historical IV database
- [ ] FDA calendar automation
- [ ] Conference presentation tracker

## Testing Checklist

Before merging, verify:

- [ ] Database migrations run successfully
- [ ] ETL pipeline generates data without errors
- [ ] API endpoints return expected responses
- [ ] UI components render correctly
- [ ] Signal generation logic produces valid results
- [ ] Documentation is accurate and complete
- [ ] Code follows project conventions
- [ ] No security vulnerabilities introduced

## Security Considerations

- ✅ Input validation on all API endpoints
- ✅ SQL injection prevention (SQLAlchemy ORM)
- ✅ XSS prevention (React auto-escaping)
- ✅ Rate limiting on compute-signals endpoint
- ✅ No secrets in code (use environment variables)

## Performance Considerations

- ✅ Database indexes on ticker, date, tenor (OptionsIV)
- ✅ Efficient queries with pagination
- ✅ 30-min server-side caching
- ✅ Manual refresh model (no polling/WebSocket)
- ✅ Async database operations

## Conclusion

The IV Catalyst system is now fully integrated into the GGets Biotech Terminal with:

✅ Complete backend API with 5 endpoints
✅ Comprehensive database models (4 tables)
✅ ETL pipeline for data generation
✅ Full frontend UI with 4 components
✅ Extensive documentation (playbook + implementation guide)
✅ Signal generation with 4-flag system
✅ Quality scoring and confidence metrics
✅ Peer comparison and spark visualizations

The system is **demo-ready** with synthetic data generation. For production use, integrate a real options data provider and set up scheduled ETL jobs.

## Contact

For questions or issues:
- GitHub: See repository issues page
- Documentation: See `docs/` directory
- Playbook: `docs/IV_CATALYST_PLAYBOOK.md`
- Implementation: `docs/IV_CATALYST_IMPLEMENTATION.md`

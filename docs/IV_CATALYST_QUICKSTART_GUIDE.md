# IV Catalyst Integration - Quick Start Guide

> **Get up and running with IV catalyst tracking in 5 minutes**

## System Overview

The IV Catalyst system identifies high-probability biotech trading setups by monitoring implied volatility patterns ahead of known catalysts (FDA decisions, data readouts, advisory committees).

**Key Features**:
- 4-flag signal detection system (2-of-4 triggers alert)
- Sanity checks filter false positives (earnings, sector moves, liquidity)
- Quality tiers (High/Medium/Low) guide position sizing
- Peer comparison identifies idiosyncratic vs sector-wide moves
- Comprehensive playbook with entry/exit strategies

---

## Quick Access

### API Endpoints

**Base URL**: `http://localhost:8000` (development)

| Endpoint | Description | Example |
|----------|-------------|---------|
| `GET /api/v1/iv/signals` | Get active IV signals | `?min_score=2&max_days_to_event=60` |
| `GET /api/v1/iv/calendar` | Catalyst calendar with IV overlay | `?from_date=2024-10-01&to_date=2024-12-31` |
| `GET /api/v1/iv/data/{ticker}` | Time series IV data | `/data/VRTX?tenors=7,30` |
| `GET /api/v1/iv/stats/{ticker}` | IV statistics and percentiles | `/stats/REGN` |
| `GET /api/v1/iv/peer-comparison/{ticker}` | Cross-sectional IV analysis | `/peer-comparison/VRTX` |
| `POST /api/v1/iv/compute-signals` | Generate new signals | Body: `{"min_iv_rv_ratio": 1.4}` |

**API Documentation**: http://localhost:8000/docs

### Frontend Routes

| Route | Component | Purpose |
|-------|-----------|---------|
| `/iv-catalyst` | IVCatalystPage | Main signal dashboard |
| `/iv-catalyst#calendar` | IVCatalystHeatmap | Calendar view with timeline |

---

## 5-Minute Setup

### 1. Start Backend Services

```bash
# From repository root
cd /home/runner/work/terminal-ui-biotech-GG/terminal-ui-biotech-GG

# Start Python backend (FastAPI)
poetry run uvicorn bt_platform.core.app:app --reload --port 8000
```

### 2. Seed Sample Data

```python
# In Python console or script
from bt_platform.core.seed_iv_catalysts import seed_all
from bt_platform.core.database import SessionLocal

db = SessionLocal()
seed_all(db)

# Output:
# ✅ Seeded 10 companies
# ✅ Seeded 10 catalysts
# ✅ Generated sample price/IV data
```

### 3. Generate Signals

```bash
# Call compute-signals endpoint
curl -X POST http://localhost:8000/api/v1/iv/compute-signals

# Response:
# {
#   "status": "success",
#   "signals_generated": 7,
#   "catalysts_analyzed": 10,
#   "timestamp": "2024-10-28T10:00:00Z"
# }
```

### 4. View Signals

**Via Browser**:
- Open http://localhost:3000/iv-catalyst
- See signal cards with quality badges
- Filter by score, days to event, quality

**Via API**:
```bash
curl http://localhost:8000/api/v1/iv/signals?min_score=2

# Response:
# {
#   "signals": [
#     {
#       "ticker": "VRTX",
#       "signal_score": 3,
#       "quality": "High",
#       "days_to_event": 35,
#       "event_type": "Phase 3 Data",
#       "metrics": {
#         "iv7": 58.2,
#         "iv30": 51.0,
#         "iv_rv_ratio": 1.65,
#         "iv7_pctile": 68.0
#       },
#       "flags": {
#         "backwardation": true,
#         "iv_rv_elevated": true,
#         "skew_significant": true,
#         "oi_spike": false
#       }
#     }
#   ],
#   "count": 7
# }
```

---

## Understanding Signals

### Signal Flags (2-of-4 Triggers Alert)

1. **Backwardation** ✅ `iv7 > iv30 * 1.1`
   - Front-end IV exceeds back-end
   - Indicates imminent event risk pricing

2. **IV/RV Elevated** ✅ `(iv7 / rv20 > 1.4) AND (abs(ret5d) < 0.02)`
   - IV much higher than realized volatility
   - Price quiet (within ±2% over 5 days)
   - Smart money accumulating optionality

3. **Skew Shift** ✅ `skew_change > 10 delta-points`
   - Call skew rising vs 20D median
   - Market pricing upside optionality

4. **OI Spike** ✅ `current_oi > 2 * oi_30d_avg`
   - Open interest surge at event strikes
   - Positioning for catalyst outcome

### Quality Tiers

| Quality | Criteria | Position Size | Use Case |
|---------|----------|---------------|----------|
| **High** | Score 3-4, IV <85%ile | 2-3% portfolio | Primary entry, debit spreads |
| **Medium** | Score 2, IV 75-85%ile | 1-2% portfolio | Tighter spreads, cautious |
| **Low** | Score 1 or IV >85%ile | Skip or 0.5% | Avoid or fade |

---

## Daily Workflow (15 Minutes)

### Morning Routine (9:00 AM ET)

```bash
# 1. Check overnight alerts (5 min)
curl http://localhost:8000/api/v1/iv/signals?min_score=2 | jq '.signals[] | {ticker, quality, days_to_event}'

# 2. Review signals in UI (5 min)
# Open http://localhost:3000/iv-catalyst
# Filter: Quality = "High", Days ≤ 45

# 3. Cross-reference peers (5 min)
curl http://localhost:8000/api/v1/iv/peer-comparison/VRTX | jq '.is_idiosyncratic'
```

### Position Monitoring

```python
# Check signals for open positions
import requests

tickers = ["VRTX", "REGN", "MRNA"]
for ticker in tickers:
    response = requests.get(f"http://localhost:8000/api/v1/iv/stats/{ticker}")
    stats = response.json()
    
    print(f"{ticker}:")
    print(f"  IV7: {stats['iv_by_tenor'][7]['iv_mid']:.1f}%")
    print(f"  IV/RV: {stats['iv_rv_ratio']:.2f}")
    print(f"  Term: {stats['term_structure']}")
    print()
```

---

## Sanity Checks Explained

### What Gets Filtered

1. **Earnings Week** ❌
   - Signal within ±5 days of earnings
   - Earnings IV dominates catalyst IV
   - **Action**: Skipped automatically

2. **Sector-Wide Vol** ⚠️
   - XBI ETF IV up >10%
   - Ticker IV move matches sector
   - **Action**: Quality downgraded

3. **Illiquid** ❌
   - Market cap < $500M
   - OI < 1,000 contracts
   - Volume < 100,000 shares/day
   - **Action**: Rejected

4. **OI/Float Sanity** ❌
   - OI > 10% of float
   - Suggests data issue
   - **Action**: Flagged

### Quality Downgrade Logic

```
Sector-driven signals:
High → Medium (1 tier down)
Medium → Low (1 tier down)
Low → SKIP (don't create)
```

---

## Key Files & Locations

### Backend (Python)
```
bt_platform/core/
├── endpoints/iv_catalyst.py      # API routes
├── utils/iv_sanity_checks.py     # Validation logic
├── database.py                    # Models (OptionsIV, IVCatalystSignal)
├── seed_iv_catalysts.py          # Sample data generator
└── mock_iv_data.py                # Mock data for dev
```

### Frontend (React/TypeScript)
```
terminal/src/
├── pages/IVCatalystPage.tsx      # Main page
├── components/
│   ├── IVCatalystHeatmap.tsx     # Calendar view
│   ├── IVSparkTile.tsx           # Spark chart component
│   └── IVPeerComparison.tsx      # Peer analysis
```

### Documentation
```
docs/
├── Playbook.md                    # Trading strategies (NEW!)
├── IV_CATALYST_PLAYBOOK.md       # Legacy playbook
├── IV_CATALYST_QUICK_START.md    # Quick start
└── IV_CATALYST_API.md             # API reference
```

### Tests
```
tests/
├── test_iv_catalyst.py            # Signal computation tests
├── test_iv_sanity_checks.py       # Validation tests (NEW!)
└── test_iv_peer_comparison.py     # Peer analysis tests
```

---

## Common Use Cases

### Use Case 1: Daily Signal Scan

**Goal**: Find new high-quality setups

```bash
# Get today's High quality signals
curl "http://localhost:8000/api/v1/iv/signals?quality=High&max_days_to_event=45" \
  | jq '.signals[] | {ticker, event_type, days_to_event, metrics: {iv7, iv_rv_ratio}}'
```

**Expected Output**:
```json
{
  "ticker": "VRTX",
  "event_type": "Phase 3 Data",
  "days_to_event": 35,
  "metrics": {
    "iv7": 58.2,
    "iv_rv_ratio": 1.65
  }
}
```

### Use Case 2: Monitor Existing Position

**Goal**: Check if thesis still intact

```bash
# Check signal for VRTX position
curl "http://localhost:8000/api/v1/iv/signals?ticker=VRTX" \
  | jq '.signals[0] | {quality, signal_score, iv7_pctile}'
```

**Decision Tree**:
- Quality downgraded? → Consider scaling out 25-50%
- IV percentile >90? → Close position (IV too high)
- Signal score dropped? → Tighten stop loss

### Use Case 3: Peer Comparison

**Goal**: Confirm move is idiosyncratic

```bash
# Compare VRTX to peers
curl "http://localhost:8000/api/v1/iv/peer-comparison/VRTX" \
  | jq '{is_idiosyncratic, sector_median: .sector_stats.median_iv_pctile, target_pctile: .target_iv.iv7_pctile}'
```

**Interpretation**:
- `is_idiosyncratic: true` → Ticker-specific catalyst ✅
- `is_idiosyncratic: false` → Sector-wide move ⚠️

### Use Case 4: Historical IV Data

**Goal**: Chart IV term structure over time

```bash
# Get 30 days of 7D and 30D IV
curl "http://localhost:8000/api/v1/iv/data/VRTX?tenors=7,30" \
  | jq '.tenors["7"][] | {date, iv_mid, iv_pctile_1y}'
```

**Use**: Plot in spreadsheet or charting tool

---

## Troubleshooting

### No Signals Generated

**Symptoms**: `compute-signals` returns `"signals_generated": 0`

**Causes**:
1. No upcoming catalysts in database
2. Missing IV or price data
3. All signals filtered by sanity checks

**Solutions**:
```bash
# 1. Check catalyst count
curl http://localhost:8000/api/v1/iv/calendar | jq '.count'

# 2. Verify IV data exists
curl http://localhost:8000/api/v1/iv/data/VRTX?tenors=7 | jq '.count'

# 3. Run compute-signals with verbose logging
# (Check backend logs for "failed validation" messages)
```

### API 404 Errors

**Symptoms**: `/api/v1/iv/...` returns 404

**Causes**:
1. Backend not running
2. Wrong port (should be 8000 for Python)
3. Endpoint not registered in router

**Solutions**:
```bash
# Check backend is running
curl http://localhost:8000/health
# → Should return 200 OK

# Verify API docs
open http://localhost:8000/docs
# → Should show all /api/v1/iv/* endpoints
```

### Frontend Not Loading

**Symptoms**: `/iv-catalyst` page blank or 404

**Causes**:
1. Frontend not built
2. Wrong port (should be 3000 for terminal)
3. Components not imported

**Solutions**:
```bash
# Build frontend components
cd frontend-components && npm run build

# Start terminal app
cd ../terminal && npm run dev

# Check browser console for errors
# (F12 → Console tab)
```

---

## Next Steps

### For Traders
1. ✅ Read [Playbook.md](./Playbook.md) - Complete trading strategies
2. ✅ Run daily scan - 15-minute routine
3. ✅ Paper trade - Track 5 signals for 2 weeks
4. ✅ Go live - Start with 1% positions

### For Developers
1. ✅ Read [IV_CATALYST_API.md](./IV_CATALYST_API.md) - Full API reference
2. ✅ Explore database models - `bt_platform/core/database.py`
3. ✅ Customize filters - Edit `iv_sanity_checks.py`
4. ✅ Add data sources - Integrate real options data

### For Data Scientists
1. ✅ Backtest signals - Use historical IV data
2. ✅ Optimize thresholds - IV/RV ratio, skew change
3. ✅ ML enhancements - Predict signal quality
4. ✅ Performance tracking - Win rate, Sharpe ratio

---

## Support & Resources

### Documentation
- **API Docs**: http://localhost:8000/docs (interactive Swagger UI)
- **Playbook**: [docs/Playbook.md](./Playbook.md)
- **Architecture**: [ARCHITECTURE.md](../ARCHITECTURE.md)

### Code Examples
- **Mock Data**: `bt_platform/core/mock_iv_data.py`
- **Seed Script**: `bt_platform/core/seed_iv_catalysts.py`
- **Demo**: `examples/iv_catalyst_demo.py`

### Testing
```bash
# Run all IV tests
pytest tests/test_iv_*.py -v

# Run specific test
pytest tests/test_iv_sanity_checks.py::TestSectorIVAdjustment -v

# Check test coverage
pytest --cov=bt_platform.core.endpoints.iv_catalyst tests/ --cov-report=html
```

---

## Cheat Sheet

### Signal Quality Quick Reference
| Score | IV %ile | Quality | Action |
|-------|---------|---------|---------|
| 3-4 | <75% | **High** | Enter 2-3% |
| 3-4 | 75-85% | Medium | Enter 1-2% |
| 2 | <85% | Medium | Enter 1-2% |
| 2 | >85% | Low | Skip/0.5% |
| 1 | Any | Low | Skip |

### Key Thresholds
- **Backwardation**: `iv7 > iv30 * 1.1`
- **IV/RV**: `ratio > 1.4` with `|ret5d| < 0.02`
- **Skew**: `change > 10 delta-points`
- **OI**: `current > 2 * oi_30d_avg`
- **Sector**: `XBI_change > 5%` → downgrade quality
- **Liquidity**: `OI > 1000`, `volume > 100K`, `market_cap > $500M`

### Exit Rules
- **Stop Loss**: -40% max
- **Profit Target 1**: +75% → take 50% off
- **Profit Target 2**: +125% → close remainder
- **Time Exit**: D-3 if underwater + IV falling
- **Thesis Exit**: Peer negative data or event delay

---

**Version**: 1.0  
**Last Updated**: 2024-10-28  
**Maintained By**: Biotech Terminal Platform Team

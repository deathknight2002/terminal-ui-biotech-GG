# IV Catalyst Quick Start Guide

## 🚀 Get Started in 5 Minutes

This guide will get you up and running with the IV Catalyst tracking system.

---

## Step 1: Install & Setup

```bash
# Clone the repository
git clone https://github.com/deathknight2002/terminal-ui-biotech-GG.git
cd terminal-ui-biotech-GG

# Install dependencies
npm install
poetry install

# Load XBI biotech universe (120+ stocks)
python -m bt_platform.core.ingest_xbi_companies

# Generate sample IV data for demo
python -m bt_platform.ingestion.iv_etl
```

---

## Step 2: Start the System

### Terminal 1: Backend API
```bash
poetry run uvicorn bt_platform.core.app:app --reload --port 8000
```

### Terminal 2: Frontend
```bash
cd terminal
npm run dev
```

**Access Points**:
- **Web UI**: http://localhost:3000/iv-catalyst
- **API Docs**: http://localhost:8000/docs

---

## Step 3: Generate Signals

Open a new terminal:

```bash
# Generate IV catalyst signals
curl -X POST "http://localhost:8000/api/v1/iv/compute-signals?min_iv_rv_ratio=1.4"
```

**Response**:
```json
{
  "status": "success",
  "signals_generated": 8,
  "catalysts_analyzed": 25,
  "timestamp": "2024-10-27T12:00:00Z"
}
```

---

## Step 4: View Signals in UI

1. Open http://localhost:3000/iv-catalyst
2. You'll see a list of signals like:

```
┌─ IV CATALYST TRACKER ─────────────────────────┐
│                                                │
│  Filters: Min Score: [2] | Max Days: [60]    │
│                                                │
│  ┌─ REGN ──────────────────────────────┐     │
│  │ Score: 3/4 | Quality: HIGH          │     │
│  │ Event: Phase 3 Data - Dec 15, 2024  │     │
│  │ IV7: 58.2% (82%ile) | IV/RV: 1.52   │     │
│  │ Flags: ✓ Backwardation | ✓ IV/RV    │     │
│  └──────────────────────────────────────┘     │
└────────────────────────────────────────────────┘
```

---

## Step 5: Analyze a Signal

Click "View Details" on any signal to see:

### Signal Breakdown
- **Score**: 3/4 (High Quality)
- **Confidence**: 75%
- **Days to Event**: 49 days

### IV Metrics
- **IV7**: 58.2% (82nd percentile) ⚠️ Elevated but not extreme
- **IV30**: 47.1%
- **IV/RV Ratio**: 1.52 ✓ Options pricing in more vol than recent history
- **Term Backwardation**: +11.1 pts ✓ Front-end IV spike

### Signal Flags
- ✓ **Backwardation**: 7D > 30D IV
- ✓ **IV/RV Elevated**: Ratio > 1.4
- ✓ **Skew Change**: +12.3 delta-points
- ○ **OI Spike**: No spike detected

### Price Action
- **Current Price**: $487.50
- **5D Return**: +0.85% (quiet - good!)

---

## Step 6: Compare with Peers

Click "Peer Comparison" to see:

```
┌─ PEER IV PERCENTILE ──────────────────┐
│                                        │
│  YOU → REGN  ████████████████░░░░ 75% │
│        VRTX  ██████████████░░░░░░ 68% │
│        ALNY  ████████░░░░░░░░░░░░ 52% │
│        BMRN  ████████████░░░░░░░░ 61% │
│                                        │
│  Sector Median: 61%                   │
│  IDIOSYNCRATIC MOVE ⚠️                 │
└────────────────────────────────────────┘
```

**Interpretation**: REGN's IV is 14 percentile points above sector median → company-specific catalyst, not sector rotation

---

## Step 7: Plan Your Trade

Based on the signal, plan your entry:

### Entry Framework (from Playbook)

**Signal Quality**: High (3/4)
**IV Percentile**: 82% (elevated but <85%)
**Recommended Structure**: Debit call spread

**Example Entry**:
```
REGN Phase 3 Data - Dec 15, 2024

Buy: Dec 480/490 call spread @ $4.20
- Max Risk: $420/contract
- Max Profit: $580/contract (138% RoR)
- Position Size: 2.5% of portfolio (10 contracts)
- Total Risk: $4,200

Stop Loss: -40% ($2,520 loss)
Profit Target: +75% ($7,350 profit)
```

---

## Step 8: Monitor & Manage

### Daily Monitoring

```bash
# Check signal updates (run daily)
curl "http://localhost:8000/api/v1/iv/signals?ticker=REGN&min_score=2"
```

### Position Management Rules

| Days to Event | Action |
|---------------|--------|
| D-30 to D-14 | Hold, monitor IV drift |
| D-14 to D-7 | Take 25% off if IV +30% |
| D-7 to D-3 | Take 50% off if IV +75% |
| D-3 to D-1 | Hold to event or stop out |
| D+0 (Event) | **CLOSE IMMEDIATELY** (IV collapse) |

---

## Common Workflows

### Workflow 1: Find New Signals

```bash
# Get all High quality signals in next 60 days
curl "http://localhost:8000/api/v1/iv/signals?min_score=3&max_days_to_event=60&quality=High"
```

### Workflow 2: Deep Dive on Ticker

```bash
# Get IV stats
curl "http://localhost:8000/api/v1/iv/stats/REGN"

# Get historical IV data for charting
curl "http://localhost:8000/api/v1/iv/data/REGN?from_date=2024-01-01&tenors=7,30"

# Get peer comparison
curl "http://localhost:8000/api/v1/iv/peer-comparison/REGN"
```

### Workflow 3: Scan Calendar

```bash
# Get catalyst calendar for next month with IV overlays
curl "http://localhost:8000/api/v1/iv/calendar?from_date=2024-11-01&to_date=2024-11-30"
```

---

## Using the Enhanced Heatmap

The example heatmap component (`examples/IVCatalystHeatmapNext.tsx`) can be integrated into your Next.js app:

```typescript
import IVCatalystHeatmapNext from './examples/IVCatalystHeatmapNext';

function MyPage() {
  return (
    <div>
      <h1>Catalyst Dashboard</h1>
      <IVCatalystHeatmapNext />
    </div>
  );
}
```

---

## Troubleshooting

### No signals generated?

```bash
# Check if catalysts exist
curl "http://localhost:8000/api/v1/biotech/catalysts?status=Upcoming" | jq '.count'

# Check if IV data exists
curl "http://localhost:8000/api/v1/iv/data/REGN?tenors=7" | jq '.count'

# Re-run signal computation
curl -X POST "http://localhost:8000/api/v1/iv/compute-signals"
```

### API not responding?

```bash
# Check if backend is running
curl http://localhost:8000/health

# Check logs
tail -f logs/uvicorn.log
```

### UI not loading data?

1. Open browser DevTools (F12)
2. Check Console for errors
3. Check Network tab for failed API calls
4. Verify backend is running at correct port (8000)

---

## Next Steps

1. **Read the Playbook**: See [IV_CATALYST_COMPLETE_PLAYBOOK.md](./IV_CATALYST_COMPLETE_PLAYBOOK.md) for full trading strategies

2. **Explore the API**: Visit http://localhost:8000/docs for interactive API documentation

3. **Set Up Daily ETL**: Configure nightly IV data updates:
   ```bash
   # Add to crontab (runs at 4:30 PM ET weekdays)
   30 16 * * 1-5 cd /path/to/terminal && python -m bt_platform.ingestion.iv_etl
   ```

4. **Connect Real Data**: Replace synthetic IV generation with real options data provider (IBKR, Tradier, etc.)

---

## Need Help?

- **Documentation**: [docs/IV_CATALYST_INTEGRATION_README.md](./IV_CATALYST_INTEGRATION_README.md)
- **API Reference**: http://localhost:8000/docs
- **GitHub Issues**: https://github.com/deathknight2002/terminal-ui-biotech-GG/issues

---

## Summary Cheat Sheet

```bash
# Start backend
poetry run uvicorn bt_platform.core.app:app --reload --port 8000

# Start frontend
cd terminal && npm run dev

# Generate signals
curl -X POST "http://localhost:8000/api/v1/iv/compute-signals"

# View signals
open http://localhost:3000/iv-catalyst

# Get API data
curl "http://localhost:8000/api/v1/iv/signals?min_score=2"
```

**Happy Trading! 🚀📈**

---

**Last Updated**: 2024-10-27

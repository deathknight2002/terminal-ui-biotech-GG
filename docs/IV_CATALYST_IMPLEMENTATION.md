# IV Catalyst Implementation Summary

## Overview

The IV Catalyst system identifies asymmetric trading opportunities by tracking implied volatility spikes ahead of biotech catalysts. It combines options market data with upcoming catalyst events to generate high-quality signals.

## Architecture

### Backend (Python FastAPI)

**Location**: `bt_platform/core/`

#### Database Models (`database.py`)
- `OptionsIV`: IV data by ticker and tenor (7D, 14D, 30D, 60D)
- `PriceData`: OHLCV + realized volatility
- `IVCatalystSignal`: Pre-computed signals with quality scoring
- `Catalyst`: Upcoming biotech events (PDUFAs, readouts, AdComms)

#### API Endpoints (`endpoints/iv_catalyst.py`)
- `GET /api/v1/iv/signals` - Get active IV catalyst signals
- `GET /api/v1/iv/calendar` - Catalyst calendar with IV overlay
- `GET /api/v1/iv/data/{ticker}` - Historical IV time series
- `GET /api/v1/iv/stats/{ticker}` - IV statistics and term structure
- `POST /api/v1/iv/compute-signals` - Generate new signals

#### ETL Pipeline (`core/etl/`)
- `iv_data_etl.py`: Generates synthetic IV data for demo
  - Term structure calculation
  - IV percentile ranking
  - Skew metrics (25Δ, 10Δ)
  - Backwardation detection
- `seed_iv_data.py`: Seeds sample catalyst events and IV data
  - Quick mode: 5 tickers, 30 days
  - Full mode: 24 tickers, 1 year

### Frontend (React/TypeScript)

**Location**: `terminal/src/`

#### Pages
- `pages/IVCatalystPage.tsx`: Main IV tracker page
  - Signal dashboard with filters
  - Active signals grid
  - Methodology panel
  
#### Components
- `components/IVCatalystHeatmap.tsx`: Calendar heatmap
  - Timeline view (D-30 → D+5)
  - Color-coded by IV percentile
  - Event markers and badges
  - List and calendar view modes

#### Routing
- `/catalysts/iv` - Main IV tracker
- `/iv-catalyst` - Alternative route

## Signal Generation Logic

### Signal Rules (Any 2 Trigger Alert)

1. **Backwardation Flag**
   - 7D IV ↑ >20% week-over-week
   - AND 7D-30D term structure inverts

2. **IV/RV Flag**
   - IV/20D RV >1.4
   - While 5D return between -2% and +2%

3. **Skew Flag**
   - 30D call-skew ↑ >10 delta-points vs 20D median

4. **OI Spike Flag**
   - New OI at event-relevant strikes >2× 30D average

### Signal Scoring

**Score**: 0-4 (sum of triggered flags)
- **High Quality**: Score 3-4, IV <85th percentile
- **Medium Quality**: Score 2
- **Low Quality**: Score 1

**Confidence**: Signal score / 4.0 (0-1 scale)

## Data Flow

```
1. Catalyst Events → Database (manual entry or API scrape)
2. IV Data ETL → OptionsIV + PriceData tables
3. Signal Computation → Analyze IV patterns + catalysts
4. API → Serve signals to frontend
5. UI → Display signals, heatmap, alerts
```

## Setup and Usage

### 1. Database Initialization

```bash
cd bt_platform
poetry run python -m bt_platform.core.database
```

### 2. Seed Data (Demo Mode)

```bash
# Quick seed (5 tickers, 30 days)
poetry run python -m bt_platform.core.etl.seed_iv_data --quick

# Full seed (24 tickers, 1 year)
poetry run python -m bt_platform.core.etl.seed_iv_data
```

### 3. Compute Signals

```bash
# Via API
curl -X POST http://localhost:8000/api/v1/iv/compute-signals

# Or programmatically
poetry run python -c "from bt_platform.core.endpoints.iv_catalyst import compute_iv_signals; compute_iv_signals()"
```

### 4. Start Backend

```bash
poetry run uvicorn bt_platform.core.app:app --reload --port 8000
```

### 5. Start Frontend

```bash
cd terminal
npm run dev
```

### 6. Access UI

Navigate to: `http://localhost:3000/catalysts/iv`

## API Examples

### Get Active Signals
```bash
curl "http://localhost:8000/api/v1/iv/signals?min_score=2&max_days_to_event=60"
```

Response:
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
        "iv7_pctile": 72.0
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

### Get IV Calendar
```bash
curl "http://localhost:8000/api/v1/iv/calendar?tickers=VRTX,ALNY,IONS"
```

### Get IV Stats for Ticker
```bash
curl "http://localhost:8000/api/v1/iv/stats/VRTX"
```

## UI Features

### Signal Dashboard
- **Filters**: Min score, max days, quality tier
- **Cards**: Ticker, score, quality, event details
- **Metrics**: IV7, IV30, IV/RV, skew, returns
- **Flags**: Visual indicators for triggered conditions
- **Confidence bars**: Visual confidence scoring

### IV Heatmap
- **Calendar view**: Grid by ticker × timeline
- **Color coding**: IV percentile (green → yellow → red)
- **Event markers**: D-30, D-7, D-3, D-1, EVENT, D+1
- **Tooltips**: IV details on hover
- **List view**: Alternative card-based layout

### Methodology Panel
- Signal rules explanation
- Risk-reward framing guidance
- Sanity checks reference

## Production Considerations

### Real Options Data

Replace synthetic data generation with real options provider:
- **CBOE Data**: Official exchange data
- **TD Ameritrade API**: Real-time options chains
- **Interactive Brokers**: Professional-grade data
- **Polygon.io**: Options snapshots

Example integration:
```python
def fetch_real_iv_data(ticker: str, date: datetime):
    # Replace synthetic generation with API call
    response = requests.get(f"https://api.tdameritrade.com/v1/marketdata/chains?symbol={ticker}")
    data = response.json()
    # Parse and transform to OptionsIV model
    return transform_to_iv_model(data)
```

### Scheduled ETL

Set up cron job or scheduler:
```bash
# Daily at 6 PM ET (after market close)
0 18 * * 1-5 cd /path/to/bt_platform && poetry run python -m core.etl.iv_data_etl
```

### Monitoring

Add logging and alerting:
- ETL success/failure notifications
- Data quality checks (missing tickers, stale data)
- Signal generation metrics
- API endpoint health checks

## Testing

### Unit Tests

```bash
# Test ETL functions
poetry run pytest bt_platform/core/etl/test_iv_data_etl.py

# Test API endpoints
poetry run pytest bt_platform/core/endpoints/test_iv_catalyst.py
```

### Integration Tests

```bash
# Test end-to-end flow
poetry run pytest tests/integration/test_iv_catalyst_flow.py
```

### Manual Testing

1. Seed data
2. Compute signals
3. Verify signals in database
4. Check API responses
5. Verify UI displays correctly

## Documentation

- **Playbook**: `docs/IV_CATALYST_PLAYBOOK.md`
  - Entry/exit strategies
  - Position sizing
  - Risk management
  - Example setups
  
- **Implementation**: This file
  - Technical architecture
  - API reference
  - Setup guide

## Future Enhancements

### Planned Features
- [ ] Peer comparison strip (compare IV vs same MOA/endpoint)
- [ ] Spark tile visualizations (price + IV overlay)
- [ ] Historical signal performance tracking
- [ ] Alert notifications (email, Slack, webhook)
- [ ] Portfolio integration (track positions)
- [ ] Backtesting framework
- [ ] Machine learning signal scoring

### Data Sources to Add
- [ ] Real options data provider
- [ ] Historical IV database
- [ ] Company IR calendar scraping
- [ ] SEC 8-K filing monitoring
- [ ] FDA calendar automation

## Troubleshooting

### No Signals Appearing

1. Check if catalyst events exist:
   ```sql
   SELECT * FROM catalysts WHERE event_date > NOW() LIMIT 10;
   ```

2. Check if IV data exists:
   ```sql
   SELECT * FROM options_iv ORDER BY date DESC LIMIT 10;
   ```

3. Run signal computation manually:
   ```bash
   curl -X POST http://localhost:8000/api/v1/iv/compute-signals
   ```

### ETL Errors

- **Import errors**: Run `poetry install` to install dependencies
- **Database errors**: Check database connection in `config.py`
- **Data quality**: Verify catalyst dates are in future

### API Errors

- **500 errors**: Check backend logs for Python exceptions
- **404 errors**: Verify API routes in `routers.py`
- **Empty responses**: Check database has data

## Contact

For issues or questions:
- GitHub Issues: https://github.com/deathknight2002/terminal-ui-biotech-GG/issues
- Documentation: See `docs/` directory
- Playbook: `docs/IV_CATALYST_PLAYBOOK.md`

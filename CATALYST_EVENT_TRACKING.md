# Catalyst Event Tracking System

Hyper-granular catalyst event tracking with expectation bands, market reactions, peer analysis, and quadrant slide visualization.

## Overview

The Catalyst Event Tracking System provides comprehensive tracking and analysis of biotech catalyst events (M&A, clinical readouts, safety pauses, approvals, label updates) with:

- **Expectation Bands**: Street consensus vs actual outcomes
- **Market Reactions**: Price movements, implied volatility, volume
- **Peer Analysis**: Competitor comparative metrics
- **Quadrant Slides**: Structured visualization for investment decisions
- **Alerting**: Automated alerts based on expectation deltas and market moves

## Features

### 1. Global Event Schema

All catalyst events follow a standardized schema with:

```typescript
{
  event_id: string (ULID)
  as_of: UTC timestamp
  company: { name, ticker, exchange, logo_url }
  catalyst: {
    type: M&A | PH3_READOUT | SAFETY_PAUSE | APPROVAL | LABEL_UPDATE
    subtype: string (e.g., "TenderOffer", "Interim", "sNDA")
    program: string (e.g., "BBP-418 FORTIFY")
    indication: string (e.g., "LGMD2I/R9")
    geography: ["US", "EU", "Global"]
  }
  expectations: {
    source: sell_side | mgmt_guide | consensus | internal
    metrics: [{ name, unit, expected, band_low, band_high, what_matters }]
  }
  outcome: {
    metrics: [{ name, unit, value, pvalue?, n?, window }]
  }
  market_reaction: {
    rel_windows: ["D-5", "D-1", "D0", "D+1", "D+5", "D+10"]
    price: [{ window, abs, rel_vs_XBI, intraday_high_low }]
    iv: [{ tenor, window, iv, zscore_vs_1y }]
    vol: [{ window, volume_multiple_vs_30d }]
  }
  peers: {
    moat_axes: ["MoA", "Stage", "Indication", "Delivery", "Target"]
    list: [{ ticker, reason_tag, weight }]
    comp_metrics: [{ metric, value, peer_median, peer_p75, delta_to_median }]
  }
  sources: [{ title, url, ts, type }]
}
```

### 2. Expectation Delta Calculation

Calculates beat/inline/miss with magnitude scoring:

```python
from bt_platform.core.catalyst_utils import compute_expectation_delta

outcome = {"value": 1.8}
expectation = {"band_low": 1.3, "band_high": 1.6, "expected": 1.5}

delta = compute_expectation_delta(outcome, expectation)
# Returns: {"class": "beat", "score": 0.125}
```

**Classification Logic**:
- **Beat**: `value > band_high` → Green
- **Miss**: `value < band_low` → Red  
- **Inline**: `band_low ≤ value ≤ band_high` → Amber

### 3. Market Reaction Tracking

Tracks price movements across multiple windows:

- **D-5**: 5 days before event
- **D-1**: 1 day before event
- **D0**: Event day
- **D+1**: 1 day after event
- **D+5**: 5 days after event
- **D+10**: 10 days after event

Relative performance vs XBI (biotech index) provided for each window.

### 4. Peer Comparison

Identifies and compares peers based on moat axes:

- **MoA**: Mechanism of action similarity
- **Stage**: Development phase proximity
- **Indication**: Disease/condition overlap
- **Delivery**: Route of administration
- **Target**: Molecular target similarity

### 5. Quadrant Slide Structure

Four-quadrant layout for investment decision-making:

```
┌─────────────────┬─────────────────┐
│ Q1: Headline    │ Q2: Key Metrics │
│     + TL;DR     │     + Charts    │
├─────────────────┼─────────────────┤
│ Q3: Street vs   │ Q4: Competitive │
│     Outcome +   │     Landscape + │
│     Stock Move  │     Next Steps  │
└─────────────────┴─────────────────┘
```

### 6. Alerting Logic

Triggers alerts based on:

1. **Expectation Delta**: `score ≥ 0.5` (material beat or miss)
2. **Price Reaction**: `|CAR_D0| ≥ 5%` (large day-of move)
3. **Kill Switch**: Suppresses alerts for microcaps with low volume

## Database Schema

### CatalystEvent (Main Table)

```sql
CREATE TABLE catalyst_events (
    id INTEGER PRIMARY KEY,
    event_id VARCHAR UNIQUE NOT NULL,  -- ULID
    as_of TIMESTAMP NOT NULL,
    company_name VARCHAR NOT NULL,
    company_ticker VARCHAR,
    company_exchange VARCHAR,
    company_logo_url VARCHAR,
    catalyst_type VARCHAR NOT NULL,
    catalyst_subtype VARCHAR,
    program VARCHAR,
    indication VARCHAR,
    geography JSON,
    expectation_source VARCHAR,
    expectation_metrics JSON,
    outcome_metrics JSON,
    market_reaction_data JSON,
    peer_analysis_data JSON,
    sources JSON,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP
);
```

### ExpectationBand (Per-Metric)

```sql
CREATE TABLE expectation_bands (
    id INTEGER PRIMARY KEY,
    event_id VARCHAR REFERENCES catalyst_events(event_id),
    metric VARCHAR NOT NULL,
    unit VARCHAR,
    expected FLOAT,
    band_low FLOAT,
    band_high FLOAT,
    what_matters TEXT,
    source VARCHAR NOT NULL,
    collected_at TIMESTAMP DEFAULT NOW()
);
```

### PriceReaction (Per-Window)

```sql
CREATE TABLE price_reactions (
    id INTEGER PRIMARY KEY,
    event_id VARCHAR REFERENCES catalyst_events(event_id),
    window VARCHAR NOT NULL,  -- D-5, D0, D+1, etc.
    abs_change FLOAT,
    rel_vs_xbi FLOAT,
    intraday_high FLOAT,
    intraday_low FLOAT,
    timestamp TIMESTAMP NOT NULL
);
```

### IVReaction (Implied Volatility)

```sql
CREATE TABLE iv_reactions (
    id INTEGER PRIMARY KEY,
    event_id VARCHAR REFERENCES catalyst_events(event_id),
    tenor VARCHAR NOT NULL,  -- 1w, 1m, 3m
    window VARCHAR NOT NULL,
    iv FLOAT,
    zscore_vs_1y FLOAT,
    timestamp TIMESTAMP NOT NULL
);
```

### PeerComparison

```sql
CREATE TABLE peer_comparisons (
    id INTEGER PRIMARY KEY,
    event_id VARCHAR REFERENCES catalyst_events(event_id),
    peer_ticker VARCHAR NOT NULL,
    reason_tag VARCHAR,
    weight FLOAT,
    metric VARCHAR,
    value FLOAT,
    peer_median FLOAT,
    peer_p75 FLOAT,
    delta_to_median FLOAT
);
```

## API Endpoints

### List Events

```bash
GET /api/v1/catalyst-events/events
```

**Query Parameters**:
- `catalyst_type`: Filter by type (M&A, PH3_READOUT, etc.)
- `company_ticker`: Filter by ticker
- `program`: Filter by program name
- `start_date`: ISO timestamp (events after)
- `end_date`: ISO timestamp (events before)
- `limit`: Results per page (default: 100)
- `offset`: Pagination offset

**Example**:
```bash
curl "http://localhost:8000/api/v1/catalyst-events/events?catalyst_type=M%26A&limit=10"
```

### Get Event Details

```bash
GET /api/v1/catalyst-events/events/{event_id}
```

Returns full event with expectations, outcomes, reactions, and peer comparisons.

### Get Expectation Deltas

```bash
GET /api/v1/catalyst-events/events/{event_id}/deltas
```

Calculates beat/inline/miss for all metrics.

### Get Quadrant Slide

```bash
GET /api/v1/catalyst-events/events/{event_id}/quadrant
```

Returns structured quadrant data for visualization.

### Check Alert Criteria

```bash
GET /api/v1/catalyst-events/events/{event_id}/alert-check
```

Returns whether event should trigger alert and reason.

### Get Summary Statistics

```bash
GET /api/v1/catalyst-events/summary?days=30
```

Returns counts by type, beat/miss distribution, and top companies.

### Get Available Types

```bash
GET /api/v1/catalyst-events/types
```

Returns list of all catalyst types in database.

## Example Catalyst Events

The system is seeded with 5 real-world examples:

### 1. Novartis → Avidity M&A ($12B)

- **Event Type**: M&A
- **Deal Premium**: 46% (vs 30% expected)
- **Classification**: Beat
- **Stock Reaction**: +3.0% (D0), +4.5% (D+1)
- **Peers**: DYNE, PEPG

### 2. BridgeBio FORTIFY (BBP-418)

- **Event Type**: PH3_READOUT
- **Key Metrics**:
  - α-DG: 1.8× (expected 1.5×) → Beat
  - CK: -82% (expected -60%) → Beat
  - Velocity: +0.27 m/s (expected +0.20) → Beat
- **Stock Reaction**: +12.5% (D0), +15.3% (D+1)

### 3. Intellia MAGNITUDE Safety Pause

- **Event Type**: SAFETY_PAUSE
- **SAE Grade**: 4 (expected ≤3) → Miss
- **Signal**: Hepatotoxicity
- **Stock Reaction**: -18.2% (D0), -22.1% (D+1)
- **Peers**: CRSP, BEAM, VERV

### 4. Bayer Lynkuet Approval

- **Event Type**: APPROVAL
- **Indication**: Menopause VMS
- **VMS Reduction**: -2.8 (expected -2.5) → Beat
- **Stock Reaction**: +1.2% (D0)

### 5. Lilly Omvoh Label Update

- **Event Type**: LABEL_UPDATE
- **Change**: 2 injections → 1 injection per month
- **Expected Adherence Uplift**: 15%
- **Stock Reaction**: +0.8% (D0)

## UI Components

### CatalystEventCard

Displays catalyst event summary with key metrics and market reaction.

```tsx
import { CatalystEventCard } from '../components/charts/CatalystEventChart';

<CatalystEventCard
  event={event}
  onViewDetails={(eventId) => console.log(eventId)}
/>
```

### ExpectationBandChart

Shows expectation bands with actual outcomes as bar chart.

```tsx
import { ExpectationBandChart } from '../components/charts/CatalystEventChart';

<ExpectationBandChart
  metrics={expectations}
  outcomes={outcomes}
  height={400}
  transparent={false}
/>
```

### QuadrantSlideView

Full quadrant slide visualization for investment decisions.

```tsx
import { QuadrantSlideView } from '../components/charts/CatalystEventChart';

<QuadrantSlideView quadrant={quadrantData} />
```

## Usage Examples

### Python Backend

```python
from bt_platform.core.catalyst_utils import (
    compute_expectation_delta,
    batch_compute_deltas,
    should_alert
)

# Calculate single delta
outcome = {"value": 1.8}
expectation = {"band_low": 1.3, "band_high": 1.6}
delta = compute_expectation_delta(outcome, expectation)
print(delta)  # {"class": "beat", "score": 0.125}

# Batch calculate deltas
outcomes = [
    {"name": "Metric A", "value": 100},
    {"name": "Metric B", "value": 200}
]
expectations = [
    {"name": "Metric A", "band_low": 80, "band_high": 120},
    {"name": "Metric B", "band_low": 150, "band_high": 250}
]
deltas = batch_compute_deltas(outcomes, expectations)

# Check alerting criteria
should_trigger, reason = should_alert(deltas, market_reaction)
if should_trigger:
    print(f"ALERT: {reason}")
```

### React Frontend

```tsx
import { useState, useEffect } from 'react';

function CatalystDashboard() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetch('http://localhost:8000/api/v1/catalyst-events/events?limit=10')
      .then(res => res.json())
      .then(data => setEvents(data.events));
  }, []);

  return (
    <div>
      {events.map(event => (
        <CatalystEventCard key={event.event_id} event={event} />
      ))}
    </div>
  );
}
```

## Testing

Run tests with pytest:

```bash
# All tests
pytest tests/test_catalyst_utils.py -v

# Specific test class
pytest tests/test_catalyst_utils.py::TestExpectationDelta -v

# With coverage
pytest tests/test_catalyst_utils.py --cov=bt_platform.core.catalyst_utils
```

## Development

### Seeding Data

```bash
# Seed catalyst events
python -m bt_platform.core.seed_catalyst_events

# Or as part of full database seed
python -m bt_platform.core.seed_data
```

### Running API Server

```bash
# Development mode
uvicorn bt_platform.core.app:app --reload --port 8000

# Production mode
uvicorn bt_platform.core.app:app --host 0.0.0.0 --port 8000
```

### Running Frontend

```bash
# Development mode
cd terminal && npm run dev

# Access at http://localhost:3000/catalyst-events
```

## Next Steps

### Planned Enhancements

1. **Transparent Chart Service**: Vega-Lite/SVG rendering with alpha=0 backgrounds
2. **Expectation Knowledge Base**: Model-assisted extraction from broker notes
3. **Event Impact Classifier**: ML model to predict CAR_D1 from expectation deltas
4. **Payor Friction Model**: Prior auth and step therapy analysis for approvals
5. **Class Risk Ontology**: Safety event categorization and mitigation playbooks
6. **One-Click Deck Builder**: Bundle events into board-ready PDF presentations
7. **Scenario Harness**: Sensitivity analysis for different outcomes

### Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for development guidelines.

## License

MIT © [Deaxu](https://github.com/deaxu)

## References

- Problem Statement: Issue requirements document
- Database Schema: `bt_platform/core/database.py`
- API Endpoints: `bt_platform/core/endpoints/catalyst_events.py`
- Utilities: `bt_platform/core/catalyst_utils.py`
- TypeScript Types: `src/types/biotech.ts`
- UI Components: `terminal/src/components/charts/CatalystEventChart.tsx`

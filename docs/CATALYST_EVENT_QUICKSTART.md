# Catalyst Event System - Quick Start

## Overview

The Catalyst Event System tracks biotech catalyst events with quantitative expectation deltas, market reactions, and peer comparisons. This implementation provides the data layer and API infrastructure for the full catalyst tracking workflow described in the problem statement.

## What's Implemented

### ✅ Core Features

1. **Global Event Schema** - Consistent structure for all catalyst events
2. **Expectation Bands** - Street expectations with confidence bands
3. **Outcome Tracking** - Actual results (numeric and categorical)
4. **Expectation Deltas** - Beat/inline/miss calculation with magnitude scoring
5. **Market Reactions** - Price, IV, and volume tracking across multiple windows
6. **Peer Analysis** - Weighted peer lists with 5-axis moat framework
7. **Source Attribution** - Timestamped references to PRs, filings, press

### ✅ Database Schema

**6 New Tables:**
- `catalyst_expectation_bands` - What the Street expected
- `catalyst_outcome_metrics` - What actually happened
- `catalyst_market_reactions` - Stock price and IV reactions
- `catalyst_peers` - Peer companies with moat axes
- `catalyst_peer_metrics` - Comparative benchmarks
- `catalyst_sources` - Reference links

### ✅ API Endpoints

```
GET /api/v1/catalysts/events/{id}              # Full event
GET /api/v1/catalysts/events/{id}/expectations # Expectation bands
GET /api/v1/catalysts/events/{id}/deltas       # Beat/miss calculation
GET /api/v1/catalysts/events/{id}/reactions    # Market reactions
GET /api/v1/catalysts/events/{id}/peers        # Peer analysis
```

### ✅ Pre-Seeded Examples

5 detailed catalyst events ready to query:

1. **Novartis → Avidity** ($12B M&A) - ID: 1
2. **BridgeBio FORTIFY** (Phase 3) - ID: 2
3. **Intellia MAGNITUDE** (Safety pause) - ID: 3
4. **Bayer Lynkuet** (FDA approval) - ID: 4
5. **Lilly Omvoh** (Label update) - ID: 5

## Quick Start

### 1. Setup Database

```bash
# Install dependencies
poetry install

# Initialize database (creates tables + seeds examples)
poetry run uvicorn bt_platform.core.app:app --reload --port 8000
```

The database will be automatically created and seeded on first run.

### 2. Test API Endpoints

```bash
# Get full event
curl http://localhost:8000/api/v1/catalysts/events/1 | jq

# Calculate expectation deltas
curl http://localhost:8000/api/v1/catalysts/events/2/deltas | jq

# Get peer analysis
curl http://localhost:8000/api/v1/catalysts/events/3/peers | jq
```

### 3. Run Examples

```bash
# Interactive example script
poetry run python examples/catalyst_event_usage.py
```

This walks through all 5 examples with formatted output.

### 4. Run Tests

```bash
# Unit tests
poetry run pytest tests/test_catalyst_event_service.py -v

# All tests
poetry run pytest
```

## Example: BridgeBio FORTIFY Analysis

```bash
# Get full event
curl http://localhost:8000/api/v1/catalysts/events/2

# Calculate deltas for all metrics
curl http://localhost:8000/api/v1/catalysts/events/2/deltas
```

**Response:**
```json
{
  "deltas": [
    {
      "metric": "α-DG glycosylation",
      "expected": 1.5,
      "actual": 1.8,
      "delta": {"class": "beat", "score": 0.2}
    },
    {
      "metric": "CK reduction",
      "expected": 60.0,
      "actual": -82.0,
      "delta": {"class": "beat", "score": 0.367}
    },
    // ...
  ]
}
```

**Interpretation:**
- 4/4 endpoints beat expectations
- α-DG: 1.8x vs 1.5x expected (mechanism proof)
- CK: -82% vs -60% expected (biomarker)
- Velocity: +0.27 vs +0.20 expected (function)
- FVC: +5pp vs +4pp expected (respiratory)

## Architecture

### Data Flow

```
1. Catalyst Event Created
   ↓
2. Expectation Bands Added (from sell-side, consensus)
   ↓
3. Outcome Metrics Added (when event occurs)
   ↓
4. Deltas Calculated (beat/inline/miss)
   ↓
5. Market Reactions Tracked (D-5 to D+10)
   ↓
6. Peer Analysis Added (moat axes + comparative metrics)
```

### Expectation Delta Algorithm

```python
def compute_expectation_delta(outcome, band):
    if outcome > band_high:
        return {"class": "beat", "score": magnitude}
    elif outcome < band_low:
        return {"class": "miss", "score": magnitude}
    else:
        return {"class": "inline", "score": 0.2}
```

**Score Ranges:**
- 0.0-0.3: Small delta
- 0.3-0.7: Moderate delta
- 0.7-1.0: Large delta (capped at 1.0)

### Moat Axes (Peer Comparison)

5-axis framework for competitive positioning:

1. **MoA** - Mechanism of action similarity
2. **Stage** - Development phase proximity
3. **Indication** - Same disease/condition
4. **Delivery** - Route of administration
5. **Target** - Biological target overlap

## Files Reference

### Core Implementation
- `bt_platform/core/database.py` - 6 new tables (lines 119-268)
- `bt_platform/core/services/catalyst_event_service.py` - Business logic
- `bt_platform/core/endpoints/catalysts.py` - API endpoints
- `bt_platform/core/seed_catalyst_events.py` - Example data

### Type Definitions
- `src/types/biotech.ts` - TypeScript interfaces for frontend

### Tests
- `tests/test_catalyst_event_service.py` - Unit tests (20+ tests)

### Documentation
- `docs/CATALYST_EVENT_API.md` - Full API reference
- `examples/catalyst_event_usage.py` - Usage examples

## What's NOT Implemented (Out of Scope)

These features would require additional dependencies and are planned for future iterations:

1. **Quadrant Slide Generator** - Would require `python-pptx` for PPTX generation
2. **Vega-Lite Chart Service** - Would require separate Node.js service with Puppeteer
3. **Real-time IV Data** - Would require market data subscription (Bloomberg/IB/OptionsPrice)
4. **Automated Expectation ETL** - Would require LLM integration for broker note parsing
5. **Alert System** - Would require notification service integration
6. **Frontend Components** - Would require React component library additions

## Future Enhancements

### Phase 2 Features
- [ ] Automated expectation extraction from broker PDFs
- [ ] Real-time IV curve integration
- [ ] Quadrant slide PPTX generation
- [ ] Alert rules engine (high-magnitude deltas)
- [ ] Event impact classifier (predict CAR from deltas)
- [ ] Payer friction model for launch events
- [ ] Class-risk ontology for safety events
- [ ] Scenario analysis/sensitivity cards
- [ ] Multi-source deduplication with confidence scoring

### Frontend Components (Separate PR)
- [ ] `CatalystEventCard` - Event summary with deltas
- [ ] `ExpectationBandChart` - Visual expectation vs outcome
- [ ] `PeerComparisonTable` - Tabular peer analysis
- [ ] `MarketReactionTimeline` - Price reaction over windows
- [ ] `CatalystCalendar` - Calendar view with filters

## API Reference

See `docs/CATALYST_EVENT_API.md` for complete API documentation including:
- Global conventions and data structure
- All endpoint specifications
- Algorithm explanations
- Use case examples
- Schema diagrams

## Contributing

When adding new catalyst events:

1. Follow the global event schema
2. Add expectation bands with source attribution
3. Include outcome metrics with p-values where available
4. Add peer companies with moat axes
5. Track market reactions across multiple windows
6. Add source references with timestamps

## Questions?

- API Documentation: `docs/CATALYST_EVENT_API.md`
- Usage Examples: `examples/catalyst_event_usage.py`
- Unit Tests: `tests/test_catalyst_event_service.py`
- TypeScript Types: `src/types/biotech.ts`

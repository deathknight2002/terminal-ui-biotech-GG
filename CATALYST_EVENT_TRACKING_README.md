# Enhanced Catalyst Event Tracking System

## Overview

A comprehensive framework for tracking pharmaceutical catalyst events with **expectation vs outcome analysis**, market reaction monitoring, and peer competitive benchmarking.

This implementation follows the specifications from the problem statement, providing a complete data model, API, and example catalyst events.

## Features

### 1. Expectation Band Framework
- Track Street expectations (sell-side, consensus, management guidance, internal)
- Store expectation ranges (band_low, band_high, expected)
- Capture "what matters" context for each metric

### 2. Automatic Delta Calculations
- Compute expectation vs outcome deltas automatically
- Classify results as "beat", "inline", or "miss"
- Calculate magnitude scores (0-1) for quantitative assessment
- Support weighted multi-metric aggregation

### 3. Market Reaction Tracking
- Price reactions by relative window (D-5, D-1, D0, D+1, D+5, D+10)
- Absolute and XBI-relative returns
- Volume multiples vs 30-day average
- Intraday high/low tracking

### 4. Implied Volatility Snapshots
- IV by tenor (1w, 1m, 2m, 3m)
- Z-scores vs 1-year history
- Percentile rankings
- Call/put skew metrics

### 5. Peer Competitive Analysis
- Moat-based peer identification (MoA, Stage, Indication, Delivery, Target)
- Weighted peer relevance scores
- Comparative metrics with peer medians, quartiles, and deltas

### 6. Source Attribution
- Full provenance tracking
- Source type classification (press_release, analyst_note, company_pr, news_wire)
- Timestamp tracking for footnote generation

## Database Schema

### New Tables

1. **expectation_bands** - Street expectations for metrics
2. **catalyst_outcomes** - Actual outcomes with computed deltas
3. **market_reactions** - Price/volume reactions by window
4. **iv_snapshots** - IV tracking by tenor and window
5. **catalyst_peers** - Peer companies for analysis
6. **catalyst_peer_metrics** - Comparative peer metrics
7. **catalyst_sources** - Source attribution

All tables link to `catalyst_events` via foreign key.

## API Endpoints

### Expectation Management

```http
POST   /api/catalyst-events/{id}/expectations
GET    /api/catalyst-events/{id}/expectations
POST   /api/catalyst-events/{id}/expectations/batch
```

**Example Request:**
```json
{
  "metric": "α-DG glycosylation",
  "unit": "× at 3m",
  "expected": 1.5,
  "band_low": 1.3,
  "band_high": 1.6,
  "what_matters": "Biomarker restoration shows MOA",
  "source": "consensus"
}
```

### Outcome Recording (with automatic delta calculation)

```http
POST   /api/catalyst-events/{id}/outcomes
GET    /api/catalyst-events/{id}/outcomes
POST   /api/catalyst-events/{id}/outcomes/batch
```

**Example Request:**
```json
{
  "metric": "α-DG glycosylation",
  "unit": "× at 3m",
  "value": 1.8,
  "window": "@3m"
}
```

**Response includes computed delta:**
```json
{
  "id": 123,
  "catalyst_event_id": 1,
  "metric": "α-DG glycosylation",
  "value": 1.8,
  "delta_class": "beat",
  "delta_score": 0.12,
  ...
}
```

### Market Reactions

```http
POST   /api/catalyst-events/{id}/market-reactions
GET    /api/catalyst-events/{id}/market-reactions?rel_window=D0
POST   /api/catalyst-events/{id}/market-reactions/batch
```

### IV Snapshots

```http
POST   /api/catalyst-events/{id}/iv-snapshots
GET    /api/catalyst-events/{id}/iv-snapshots?tenor=1m&rel_window=D0
```

### Peer Analysis

```http
POST   /api/catalyst-events/{id}/peers
GET    /api/catalyst-events/{id}/peers?moat_axis=MoA
POST   /api/catalyst-events/{id}/peer-metrics
GET    /api/catalyst-events/{id}/peer-metrics
```

### Complete Event Aggregation

```http
GET    /api/catalyst-events/{id}/complete
```

Returns all related data in a single response:
- Expectations
- Outcomes with deltas
- Market reactions
- IV snapshots
- Peers and peer metrics
- Sources

## Example Catalyst Events

Five concrete examples are provided as seed data:

### 1. Novartis → Avidity ($12B M&A)
```python
from bt_platform.core.seed_catalyst_examples import NOVARTIS_AVIDITY_EVENT
```

**Key Features:**
- Deal premium: 46% (vs 30% expected)
- Consideration: $12B
- SpinCo required (unexpected)
- Peer ripple: DYNE, PEPG

### 2. BridgeBio FORTIFY (BBP-418)
```python
from bt_platform.core.seed_catalyst_examples import BRIDGEBIO_FORTIFY_EVENT
```

**Key Features:**
- Phase 3 interim in LGMD2I/R9
- 4 metrics: α-DG (1.8× vs 1.5×), CK (-82% vs -60%), Velocity (+0.27 vs +0.20), FVC (+5pp vs +4pp)
- All metrics beat or inline-high
- +18.5% D0 CAR, +16.8% rel vs XBI

### 3. Intellia MAGNITUDE Pause
```python
from bt_platform.core.seed_catalyst_examples import INTELLIA_MAGNITUDE_EVENT
```

**Key Features:**
- G4 hepatotoxicity (vs G2-3 expected)
- -28.5% D0 CAR
- Class read-through to CRSP, BEAM, VERV
- IV spike: 95 (z=3.2)

### 4. Bayer Lynkuet Approval
```python
from bt_platform.core.seed_catalyst_examples import BAYER_LYNKUET_EVENT
```

**Key Features:**
- Menopause VMS indication
- VMS reduction: -5.2/day @12w (vs -4.8 expected)
- Competitive vs Veozah (Astellas)
- +2.8% D0 CAR

### 5. Lilly Omvoh (single-injection label)
```python
from bt_platform.core.seed_catalyst_examples import LILLY_OMVOH_EVENT
```

**Key Features:**
- sNDA for single-injection (vs 2-injection rivals)
- Adherence uplift expected: +8pp
- Convenience positioning vs Skyrizi, Stelara
- +1.2% D0 CAR

## Usage Examples

### Creating Expectations and Outcomes

```python
from bt_platform.core.services.catalyst_delta_service import compute_expectation_delta

# Define expectation
expectation = {
    "expected": 1.5,
    "band_low": 1.3,
    "band_high": 1.6
}

# Record outcome
outcome = {"value": 1.8}

# Compute delta
result = compute_expectation_delta(outcome, expectation)
print(f"Delta: {result.delta_class} (score: {result.delta_score:.2f})")
# Output: Delta: beat (score: 0.12)
```

### Multi-Metric Analysis

```python
from bt_platform.core.services.catalyst_delta_service import analyze_fortify_catalyst

result = analyze_fortify_catalyst()
print(f"Aggregate: {result['aggregate_class']} (score: {result['aggregate_score']:.2f})")

for metric, delta in result["metric_deltas"].items():
    print(f"  {metric}: {delta['class']} (score: {delta['score']:.2f})")
```

### Loading Seed Data

```python
from bt_platform.core.seed_catalyst_examples import (
    ALL_CATALYST_EXAMPLES,
    get_example_by_id,
    get_example_by_company
)

# Get all examples
for event in ALL_CATALYST_EXAMPLES:
    print(f"{event['company']['name']}: {event['catalyst']['type']}")

# Get by ID
bbio = get_example_by_id("01J9Z3XAMPLE00000000000002")

# Get by ticker
nvs_events = get_example_by_company("NVS")
```

## TypeScript Types

Complete type definitions are available in `src/types/biotech.ts`:

```typescript
import type {
  EnhancedCatalystEvent,
  ExpectationMetric,
  OutcomeMetric,
  MarketReactionData,
  PeerAnalysis,
  QuadrantSlideData
} from '@/types/biotech';
```

## Delta Calculation Algorithm

The expectation delta is computed using the following logic:

1. **Beat**: `value > band_high`
   - Score: `min((value - band_high) / band_high, 1.0)`
   
2. **Miss**: `value < band_low`
   - Score: `min((band_low - value) / band_low, 1.0)`
   
3. **Inline**: `band_low <= value <= band_high`
   - Score: `0.2 + |value - expected| / expected * 0.3`

For multi-metric aggregation:
- Weighted average of signed scores (positive for beat, negative for miss)
- Classification based on dominant class (>60% threshold)
- Classes: "beat", "inline", "miss", "mixed"

## Testing

Run tests with:

```bash
pytest tests/test_catalyst_delta_service.py -v
```

Test coverage includes:
- Beat/miss/inline scenarios
- Edge cases (boundaries, no expectations)
- Multi-metric calculations
- Weighted aggregation
- BridgeBio FORTIFY example validation

## Architecture

```
bt_platform/core/
├── schema.py                          # Database models (7 new tables)
├── contracts.py                        # Pydantic validation models
├── endpoints/
│   └── catalyst_enhanced.py            # REST API endpoints (20+)
├── services/
│   └── catalyst_delta_service.py       # Delta calculation logic
└── seed_catalyst_examples.py           # 5 concrete examples

src/types/
└── biotech.ts                          # TypeScript type definitions

tests/
└── test_catalyst_delta_service.py      # Test suite (29 tests)
```

## Integration with Existing Code

The enhanced catalyst system integrates with:

1. **Existing Catalyst table** - Compatible with current `catalysts` table
2. **Evidence Graph** - Can link to evidence nodes
3. **Company Profile** - Links to company via `company_id`
4. **Market Data** - Uses existing price/volume data
5. **Options Data** - Integrates with `options_snapshots` table

## Next Steps (Optional Enhancements)

1. **Chart Service**: Vega-Lite renderer for transparent PNGs
2. **Slide Generator**: PPTX quadrant slide automation
3. **Market Reaction Fetcher**: Live price/IV data integration
4. **Peer Discovery**: Automated peer selection algorithm
5. **Alerting**: Slack notifications for significant deltas
6. **ETL Pipeline**: Expectation extraction from analyst notes
7. **Frontend Components**: React visualization components

## References

- Problem Statement: Original specification document
- Database Schema: `bt_platform/core/schema.py`
- API Contracts: `bt_platform/core/contracts.py`
- Service Logic: `bt_platform/core/services/catalyst_delta_service.py`
- Seed Data: `bt_platform/core/seed_catalyst_examples.py`
- Tests: `tests/test_catalyst_delta_service.py`

## License

MIT License - See main repository LICENSE file

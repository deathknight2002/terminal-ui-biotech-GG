# Catalyst Event Tracking System

Comprehensive catalyst event tracking with expectations, outcomes, market reactions, and peer analysis.

## Overview

This system implements the catalyst tracking framework described in the requirements, enabling:

- **Expectation Bands**: Track Street expectations with confidence bands
- **Outcomes**: Record actual results with automatic expectation delta computation
- **Market Reactions**: Multi-window price, IV, and volume tracking
- **Peer Comparisons**: Automated peer identification across moat axes
- **Event Sources**: Footnote-ready source tracking
- **Special Event Types**: Safety events (clinical holds) and M&A deals

## Quick Start

### 1. Seed Example Events

```bash
poetry run python bt_platform/core/seed_catalyst_events.py
```

This creates 3 example events:
- Novartis → Avidity M&A
- BridgeBio FORTIFY readout
- Intellia MAGNITUDE pause

### 2. API Usage

#### Add Expectations

```python
POST /api/v1/catalyst-events/{event_id}/expectations

[
  {
    "event_id": "01J9...",
    "metric": "α-DG glycosylation",
    "unit": "x",
    "expected": 1.5,
    "band_low": 1.3,
    "band_high": 1.6,
    "source": "sell_side",
    "what_matters": "Biomarker response",
    "collected_at": "2025-10-25T12:00:00Z"
  }
]
```

#### Add Outcomes

```python
POST /api/v1/catalyst-events/{event_id}/outcomes

[
  {
    "event_id": "01J9...",
    "metric": "α-DG glycosylation",
    "unit": "x",
    "value": 1.8,
    "window": "3m"
  }
]
```

The system automatically computes expectation delta (beat/inline/miss).

#### Calculate Market Reactions

```python
POST /api/v1/catalyst-events/{event_id}/market-reactions?ticker=BBIO&event_date=2025-10-26

# Calculates reactions for all windows (D-5, D-1, D0, D+1, D+5, D+10)
```

#### Get Peer Analysis

```python
POST /api/v1/catalyst-events/{event_id}/peers?ticker=BBIO&indication=LGMD2I

# Returns top peers ranked by similarity across moat axes
```

#### Get Complete Event

```python
GET /api/v1/catalyst-events/{event_id}/expectations
GET /api/v1/catalyst-events/{event_id}/outcomes
GET /api/v1/catalyst-events/{event_id}/market-reactions
GET /api/v1/catalyst-events/{event_id}/peers
```

## Data Models

### Database Schema

**Core Tables:**
- `expectation_bands` - Street expectations with confidence bands
- `catalyst_outcomes` - Actual outcomes with expectation deltas
- `market_reactions` - Price/IV/volume across time windows
- `peer_comparisons` - Peer companies with moat axis matching
- `peer_metric_comparisons` - Peer benchmark statistics
- `event_sources` - Source URLs with timestamps
- `safety_event_details` - Clinical hold/pause details
- `manda_deal_details` - M&A transaction details

### TypeScript Types

All types available in `src/types/biotech.ts`:

```typescript
import { CatalystEventFull, ExpectationMetric, OutcomeMetric } from '@/types/biotech';

const event: CatalystEventFull = {
  event_id: "01J9...",
  as_of: "2025-10-27T...",
  company: { name: "Novartis", ticker: "NVS" },
  catalyst: { 
    type: "M&A", 
    subtype: "TenderOffer",
    program: "AOC platform"
  },
  expectations: { ... },
  outcome: { ... },
  market_reaction: { ... },
  peers: { ... },
  sources: [ ... ]
};
```

## Modules

### ETL Pipeline (`bt_platform/etl/expectations.py`)

Extracts expectations from semi-structured text:

```python
from bt_platform.etl.expectations import extract_expectations_from_text

text = "α-DG glycosylation: 1.5x (range 1.3-1.6x)"
expectations = extract_expectations_from_text(text, event_id, "sell_side")
```

Features:
- Regex-based parsing with extensible patterns
- Unit normalization (%, x, $B, m/s, pp, etc.)
- Band validation (ensures band_low < expected < band_high)
- Outlier detection using IQR method
- Quality flagging (VERIFIED, INVALID, LOW_CONFIDENCE)

### Market Reaction Engine (`bt_platform/market/reaction.py`)

Calculates price, IV, and volume reactions:

```python
from bt_platform.market.reaction import get_reaction

reactions = get_reaction(
    ticker="BBIO",
    event_date=date(2025, 10, 26)
)
# Returns reactions for all windows: D-5, D-1, D0, D+1, D+5, D+10
```

Features:
- Multi-window tracking
- XBI-relative performance
- IV z-scores vs 1-year history
- Volume multiples vs 30-day average
- Expectation delta computation

### Peer Comparator (`bt_platform/comparator/peers.py`)

Identifies similar companies across moat axes:

```python
from bt_platform.comparator.peers import get_peers

peers = get_peers(
    db=session,
    ticker="BBIO",
    indication="LGMD2I/R9",
    max_peers=10
)
```

Moat Axes:
- **MoA**: Mechanism of action similarity
- **Stage**: Development phase proximity
- **Indication**: Therapeutic area/indication match
- **Delivery**: Modality similarity (oral, mAb, gene therapy, etc.)
- **Target**: Target protein/pathway match

Features:
- Weighted scoring (configurable weights per axis)
- Deterministic ranking
- Explainability strings ("MoA, Stage match")
- Peer benchmark statistics (median, p25, p75, percentile)

## Examples

### Example 1: BridgeBio FORTIFY

**Expectations:**
- α-DG: 1.5x (band 1.3-1.6x)
- CK: -60% (band 50-70%)
- Velocity: +0.20 m/s (band 0.10-0.25)
- FVC: +4pp (band 2-5pp)

**Outcomes:**
- α-DG: 1.8x → **BEAT**
- CK: -82% → **BEAT**
- Velocity: +0.27 m/s → **BEAT**
- FVC: +5pp → **INLINE**

**Peers:**
- Sarepta (SRPT) - Neuromuscular leader
- Dyne (DYNE) - RNA muscle peer

### Example 2: Novartis → Avidity

**Expectations:**
- Deal Premium: 30% (band 20-40%)
- SpinCo Required: No

**Outcomes:**
- Deal Premium: 46% → **BEAT**
- Consideration: $12.0B
- SpinCo Required: Yes → **MISS**

**Market Reaction:**
- D0: +3.0% abs, +2.1% vs XBI
- D+1: +4.5% abs, +3.2% vs XBI

**Peers:**
- Dyne (DYNE) - RNA muscle peer (weight 0.5)
- PepGen (PEPG) - AOC-adjacent (weight 0.3)

### Example 3: Intellia MAGNITUDE Pause

**Safety Details:**
- SAE Grade: 4 (CTCAE)
- Signal: Hepatotoxicity
- Status: Paused
- Expected pause: 4 weeks
- Resumption probability: 70%

**Market Reaction:**
- D0: -12.5% abs, -13.2% vs XBI
- IV spike: 85% (z-score +2.1)

**Peers:**
- CRISPR (CRSP) - In vivo CRISPR peer (weight 0.8)
- Beam (BEAM) - Base editing alternative (weight 0.6)

## Testing

Run seed script to populate test data:

```bash
poetry run python bt_platform/core/seed_catalyst_events.py
```

Query example data:

```python
from bt_platform.core.database import SessionLocal
from bt_platform.core.schema_catalyst_extensions import ExpectationBand, CatalystOutcome

session = SessionLocal()

# Get expectations for an event
expectations = session.query(ExpectationBand).filter(
    ExpectationBand.event_id == "01J9BRIDGEBIO_FORTIFY"
).all()

# Get outcomes
outcomes = session.query(CatalystOutcome).filter(
    CatalystOutcome.event_id == "01J9BRIDGEBIO_FORTIFY"
).all()

for outcome in outcomes:
    print(f"{outcome.metric}: {outcome.value} {outcome.unit} ({outcome.expectation_class})")
```

## Coverage Targets

Per problem statement acceptance criteria:

- **Expectations**: 90% of events should have ≥1 expectation within 24h of ingest
- **Quality**: False positive rate <10% for alerting
- **Alert Latency**: <60s for high-impact events

## Next Steps

### Remaining Components

1. **Transparent Chart Service** - Vega-Lite → PNG/SVG with alpha=0
2. **Quadrant Slide Generator** - PPTX with glass theme
3. **Alerting Rules** - Slack notifications for high-impact events
4. **Test Suite** - Unit and integration tests
5. **Frontend Components** - React visualizations

### Future Enhancements

1. **LLM-Assisted Extraction** - Hybrid regex+LLM for expectation parsing
2. **Impact Classifier** - ML model to predict CAR_D1 from expectation deltas
3. **Payer Friction Model** - Prior auth and step therapy impact
4. **Class Risk Ontology** - Safety event mitigation playbooks
5. **Scenario Harness** - Sensitivity analysis for what-if scenarios
6. **Multi-Source Dedup** - Confidence scoring across press wires

## API Reference

See `bt_platform/core/endpoints/catalyst_extensions.py` for full API documentation.

**Base URL:** `/api/v1`

**Endpoints:**
- `POST /catalyst-events/{event_id}/expectations` - Add expectations
- `GET /catalyst-events/{event_id}/expectations` - Get expectations
- `POST /catalyst-events/{event_id}/outcomes` - Add outcomes
- `GET /catalyst-events/{event_id}/outcomes` - Get outcomes
- `POST /catalyst-events/{event_id}/market-reactions` - Calculate reactions
- `GET /catalyst-events/{event_id}/market-reactions` - Get reactions
- `POST /catalyst-events/{event_id}/peers` - Calculate peers
- `GET /catalyst-events/{event_id}/peers` - Get peers
- `POST /catalyst-events/{event_id}/sources` - Add sources
- `GET /catalyst-events/{event_id}/sources` - Get sources
- `POST /catalyst-events/{event_id}/safety-details` - Add safety details
- `POST /catalyst-events/{event_id}/manda-details` - Add M&A details

## Contributing

Follow existing patterns:
- Database models in `bt_platform/core/schema_catalyst_extensions.py`
- Contracts in `bt_platform/core/contracts_catalyst_extensions.py`
- Business logic in dedicated modules (`etl/`, `market/`, `comparator/`)
- API endpoints in `bt_platform/core/endpoints/catalyst_extensions.py`
- TypeScript types in `src/types/biotech.ts`

## License

MIT

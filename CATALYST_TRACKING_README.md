# Catalyst Tracking Platform

> **Hyper-granular, repo-ready catalyst intelligence with expectations, outcomes, market reactions, and peer comparisons.**

## Overview

This implementation provides a comprehensive catalyst tracking system for pharmaceutical events, supporting:

- **Expectation Tracking**: Consensus, sell-side, and management guidance
- **Outcome Measurement**: Actual results with statistical significance
- **Expectation Deltas**: Beat/inline/miss classification with magnitude scoring
- **Market Reactions**: Price, IV, and volume across D-5 to D+10 windows
- **Peer Comparisons**: Moat-based competitive analysis
- **Transparent Charts**: Vega-Lite specs with alpha=0.0 backgrounds
- **Quadrant Slides**: Bloomberg-style data density layouts

## Architecture

### Data Models

#### Core Tables (schema_catalyst_extensions.py)

1. **ExpectationBand** - What the Street expected
   - Metric definitions with band ranges
   - Source attribution (sell_side, consensus, mgmt_guide)
   - Confidence scoring

2. **OutcomeMetric** - Actual results
   - Measured values with p-values
   - Statistical significance indicators
   - Measurement windows

3. **MarketReaction** - Stock price/IV/volume
   - Price changes relative to XBI
   - Implied volatility z-scores
   - Volume multiples vs 30-day average

4. **PeerComparison** - Competitive benchmarks
   - Moat axes (MoA, Stage, Indication, Delivery, Target)
   - Weighted peer lists
   - Comparative metrics

5. **EventSource** - Citations
   - Per-slide footnote injection
   - Reliability scoring
   - Timestamp tracking

6. **ExpectationDelta** - Computed classifications
   - Beat/inline/miss with magnitude
   - Statistical significance flags

### Backend Services

#### Expectation Delta Engine (services/expectation_delta.py)

**Core Function**:
```python
compute_expectation_delta(
    outcome_value: float,
    expected_value: Optional[float],
    band_low: Optional[float],
    band_high: Optional[float],
    metric_name: str = "",
    p_value: Optional[float] = None
) -> ExpectationDelta
```

**Logic**:
- If `outcome > band_high` → **BEAT** with magnitude `min((outcome - band_high) / band_width, 1.0)`
- If `outcome < band_low` → **MISS** with magnitude `min((band_low - outcome) / band_width, 1.0)`
- If `band_low <= outcome <= band_high` → **INLINE** with small magnitude

**Aggregate Function**:
```python
compute_aggregate_delta(
    deltas: list[ExpectationDelta],
    weights: Optional[list[float]] = None
) -> Tuple[DeltaClass, float]
```

Returns overall beat/inline/miss when multiple metrics are involved.

#### Chart Specifications (services/chart_specs.py)

**Vega-Lite Generators**:

1. **expectation_outcome_bar_chart()** - Expectation band with outcome marker
   - Dashed rule for band (gold)
   - Point for expected value (gold circle)
   - Point for actual outcome (green/white/red based on delta)
   - Value labels

2. **market_reaction_timeline_chart()** - Price movement D-5 to D+10
   - Line chart with points
   - Vertical rule at D0 (event day)
   - Cyan line on transparent background

3. **peer_comparison_bar_chart()** - Horizontal bars with median overlay
   - Primary company highlighted (cyan)
   - Peers in gray
   - Gold median line with label

4. **iv_spike_chart()** - Implied volatility over time
   - Purple area chart
   - Z-score annotations

5. **generate_quadrant_slide_spec()** - Full slide layout
   - Q1: Headline + TL;DR
   - Q2: Key Metrics charts
   - Q3: Street vs Outcome + Stock Reaction
   - Q4: Competitive Read-through

### API Endpoints (endpoints/catalyst_examples.py)

#### GET `/api/v1/catalysts/catalyst-examples`

Query parameters:
- `catalyst_type`: Filter by M&A, PH3_READOUT, SAFETY_PAUSE, APPROVAL, LABEL_UPDATE
- `company_ticker`: Filter by ticker
- `include_deltas`: Compute expectation deltas (default: true)

Response:
```json
{
  "count": 5,
  "catalyst_examples": [
    {
      "event_id": "01J9...",
      "company": {"name": "...", "ticker": "..."},
      "catalyst": {"type": "...", "program": "..."},
      "expectations": {"metrics": [...]},
      "outcome": {"metrics": [...]},
      "market_reaction": {"price": [...], "iv": [...], "vol": [...]},
      "peers": {"list": [...], "comp_metrics": [...]},
      "sources": [...],
      "aggregate_delta": {"class": "beat", "score": 0.85},
      "expectation_deltas": [...]
    }
  ]
}
```

#### GET `/api/v1/catalysts/catalyst-examples/{event_id}`

Get single event with full details.

#### GET `/api/v1/catalysts/catalyst-examples/summary`

Aggregate statistics:
- Count by catalyst type
- Average expectation deltas
- Market reaction averages

#### GET `/api/v1/catalysts/catalyst-types`

List available catalyst types and subtypes.

### Frontend Types (src/types/biotech.ts)

**Key Interfaces**:

```typescript
interface CatalystEvent {
  event_id: string;
  as_of: string;
  company: CompanyInfo;
  catalyst: CatalystInfo;
  expectations: Expectations;
  outcome: Outcome;
  market_reaction: MarketReaction;
  peers: Peers;
  sources: EventSource[];
}

interface ExpectationDelta {
  delta_class: "beat" | "inline" | "miss";
  magnitude: number;
  badge_color: "success" | "info" | "error";
  arrow: "↑" | "→" | "↓";
  label: "Beat" | "In-line" | "Miss";
}
```

## Example Catalysts

### 1. Novartis → Avidity M&A ($12B)

**Catalyst Type**: M&A (Tender Offer)
**Program**: AOC platform
**Indication**: Neuromuscular RNA

**Expectations**:
- Deal Premium: 30% (band 20-40%)
- EV/Sales: N/A
- SpinCo Required: False

**Outcomes**:
- Deal Premium: **46%** → **BEAT** (magnitude: 0.30)
- Consideration: $12.0B
- SpinCo Required: True (deal complexity)

**Market Reaction**:
- D0: +3.0% abs, +2.1% vs XBI
- D+1: +4.5% abs, +3.2% vs XBI

**Peers**:
- DYNE (RNA muscle peer, weight 0.5)
- PEPG (AOC-adjacent, weight 0.3)
- ARWR (RNA therapeutics, weight 0.2)

### 2. BridgeBio FORTIFY Phase 3 (BBP-418 LGMD2I/R9)

**Catalyst Type**: Phase 3 Readout (Interim)
**Program**: BBP-418 FORTIFY
**Indication**: LGMD2I/R9

**Expectations vs Outcomes**:
- α-DG glycosylation: 1.8× vs expected 1.5× → **BEAT** (p=0.002)
- CK reduction: -82% vs -60% → **BEAT** (p=0.001)
- Velocity Δ: +0.27 m/s vs 0.20 → **BEAT** (p=0.015)
- FVC Δ: +5 pp vs 4 → **INLINE** (p=0.042)

**Aggregate**: **BEAT** (score: 0.35)

**Market Reaction**:
- D0: +12.5% abs, +11.2% vs XBI
- Volume: 4.8× vs 30D average
- IV: 72.5% (z-score: +1.3)

### 3. Intellia MAGNITUDE Safety Pause

**Catalyst Type**: Safety Pause (Hold/Partial)
**Program**: nex-z
**Indication**: ATTR amyloidosis

**Expectations vs Outcomes**:
- Safety Grade: 4 vs expected 0 (band 0-2) → **MISS** (magnitude: 1.0)
- Signal Type: Hepatotoxicity
- Enrollment: Paused

**Market Reaction**:
- D0: -18.2% abs, -19.1% vs XBI
- Volume: 6.2× vs 30D average
- IV: 88.7% (z-score: +2.8)

**Peers**:
- CRSP (in vivo editing)
- BEAM (base editing)
- VERV (liver target)

### 4. Bayer Lynkuet Approval (Elinzanetant VMS)

**Catalyst Type**: Approval (FDA)
**Program**: Elinzanetant
**Indication**: Menopause VMS

**Expectations vs Outcomes**:
- VMS reduction @12wk: 3.4 vs 3.2 → **BEAT**
- Hepatic monitoring: Required (as expected)

**Peers**: Veozah (Astellas)

### 5. Lilly Omvoh Label Update (Mirikizumab UC)

**Catalyst Type**: Label Update (sNDA)
**Program**: Mirikizumab
**Indication**: Ulcerative Colitis

**Expectations vs Outcomes**:
- Injections/month: 1 → **INLINE**
- Adherence uplift: Expected Q1'26 → Achieved

**Peers**: Skyrizi, Tremfya, Entyvio

## Usage Examples

### Backend: Compute Expectation Delta

```python
from bt_platform.core.services.expectation_delta import compute_expectation_delta

# Example: Clinical endpoint
delta = compute_expectation_delta(
    outcome_value=1.8,  # Actual: 1.8× fold change
    expected_value=1.5,  # Expected: 1.5×
    band_low=1.3,  # Lower bound
    band_high=1.6,  # Upper bound
    metric_name="α-DG glycosylation",
    p_value=0.002  # Statistically significant
)

print(f"Delta class: {delta.delta_class}")  # "beat"
print(f"Magnitude: {delta.delta_score}")  # 0.67
print(f"Significant: {delta.is_statistically_significant}")  # True
```

### Backend: Generate Chart Spec

```python
from bt_platform.core.services.chart_specs import expectation_outcome_bar_chart

spec = expectation_outcome_bar_chart(
    metric_name="α-DG glycosylation",
    expected_value=1.5,
    band_low=1.3,
    band_high=1.6,
    actual_value=1.8,
    unit="×",
    delta_class="beat"
)

# spec is Vega-Lite JSON with transparent background
# Render with: vega-lite renderer or plotly
```

### API: Fetch Catalyst Examples

```bash
# Get all examples with deltas
curl "http://localhost:8000/api/v1/catalysts/catalyst-examples?include_deltas=true"

# Filter by type
curl "http://localhost:8000/api/v1/catalysts/catalyst-examples?catalyst_type=PH3_READOUT"

# Get specific event
curl "http://localhost:8000/api/v1/catalysts/catalyst-examples/01J9..."
```

### Frontend: Display Expectation Delta

```typescript
import type { ExpectationDelta } from '@/types/biotech';

function DeltaBadge({ delta }: { delta: ExpectationDelta }) {
  return (
    <Badge variant={delta.badge_color}>
      {delta.arrow} {delta.label} ({delta.magnitude.toFixed(2)})
    </Badge>
  );
}
```

## Testing

### Unit Tests

```bash
# Run all tests
poetry run pytest tests/unit/test_expectation_delta.py -v

# Expected: 24 tests pass
```

**Test Coverage**:
- Beat/inline/miss classification
- Boundary conditions
- Statistical significance detection
- Missing expectation handling
- Magnitude scaling
- Aggregate delta computation
- Weighted aggregation
- Real-world examples (BridgeBio, Novartis, Intellia)

### Integration Test

```bash
# Test API endpoint
curl "http://localhost:8000/api/v1/catalysts/catalyst-examples/summary"

# Expected response:
# {
#   "total_examples": 5,
#   "by_catalyst_type": {"M&A": 1, "PH3_READOUT": 1, ...},
#   "aggregate_deltas": {"beats": 3, "inlines": 1, "misses": 1},
#   "market_reactions": {"avg_d0_move_pct": 5.2}
# }
```

## Next Steps

### Phase 1: MVP (Implemented) ✅
- [x] Schema extensions
- [x] Expectation delta logic
- [x] 5 catalyst examples
- [x] API endpoints
- [x] TypeScript types
- [x] Chart specifications
- [x] Unit tests

### Phase 2: Production Features
- [ ] ETL for expectation ingestion (parse broker notes)
- [ ] Market reaction fetching (Yahoo Finance, Polygon)
- [ ] Peer comparator service
- [ ] Quadrant slide PPTX generator
- [ ] Transparent chart renderer (Node/Puppeteer)
- [ ] Alerting & playbook (Slack integration)

### Phase 3: ML & Analytics
- [ ] Expectation knowledge-base (broker snippets → structured bands)
- [ ] Event impact classifier (predict CAR_D1 from deltas)
- [ ] Payer friction model
- [ ] Class-risk ontology for safety events
- [ ] Scenario harness (sensitivity analysis)

### Phase 4: Advanced Features
- [ ] One-click deck builder (bundle 5-8 events)
- [ ] Multi-source dedup + confidence scoring
- [ ] WebSocket live updates for D0 reactions
- [ ] Portfolio impact simulator

## PRD Fragments

### Ticket: BridgeBio FORTIFY Page

**Goal**: Produce quadrant slide + web card with expectation deltas and peer bars.

**Acceptance**:
- α-DG, CK, Velocity, FVC all plotted with bands & actuals
- Stock/IV mini-panels
- Footer cites PR with timestamp
- Out of scope: payer model

**Effort**: 5 points

### Ticket: M&A Premium Comparator

**Goal**: RNA M&A premium chart with sector medians; ripple to peers.

**Acceptance**:
- Transparent PNG
- Bars labeled
- Ripple mini-chart present

**Effort**: 3 points

### Ticket: Safety Class Comparator (CRISPR)

**Goal**: Show NTLA vs CRSP/BEAM/VERV 30D CAR & IV z-scores, previous pauses overlay.

**Acceptance**:
- Single grid
- Clear legend
- Sources

**Effort**: 3 points

## References

- [Problem Statement](https://github.com/deathknight2002/terminal-ui-biotech-GG/issues/XXX)
- [Schema Extensions](bt_platform/core/schema_catalyst_extensions.py)
- [Expectation Delta Logic](bt_platform/core/services/expectation_delta.py)
- [Chart Specifications](bt_platform/core/services/chart_specs.py)
- [Seed Data](bt_platform/core/seed_catalyst_examples.py)
- [API Endpoints](bt_platform/core/endpoints/catalyst_examples.py)
- [TypeScript Types](src/types/biotech.ts)
- [Unit Tests](tests/unit/test_expectation_delta.py)

## License

MIT

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

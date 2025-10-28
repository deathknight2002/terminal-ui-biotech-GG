# Catalyst Event Tracking - Quick Start Guide

## Installation

The catalyst event tracking system is already integrated into the platform. No additional installation required.

## Creating Your First Enhanced Catalyst Event

### Step 1: Create Base Catalyst Event

First, create a catalyst event in the `catalyst_events` table:

```sql
INSERT INTO catalyst_events (
    company_id,
    event_type,
    title,
    description,
    expected_date,
    status
) VALUES (
    1,  -- company_id for BridgeBio
    'TOPLINE_READOUT',
    'BBP-418 FORTIFY Interim Data',
    'Phase 3 interim analysis for LGMD2I/R9',
    '2025-10-26',
    'UPCOMING'
);
```

### Step 2: Add Expectation Bands

Use the batch endpoint to add multiple expectations at once:

```bash
curl -X POST "http://localhost:3001/api/catalyst-events/1/expectations/batch" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "metric": "α-DG glycosylation",
      "unit": "× at 3m",
      "expected": 1.5,
      "band_low": 1.3,
      "band_high": 1.6,
      "what_matters": "Biomarker restoration shows MOA",
      "source": "consensus"
    },
    {
      "metric": "CK reduction",
      "unit": "%",
      "expected": 60,
      "band_low": 50,
      "band_high": 70,
      "what_matters": "Muscle damage biomarker",
      "source": "consensus"
    },
    {
      "metric": "Velocity Δ vs PBO",
      "unit": "m/s",
      "expected": 0.20,
      "band_low": 0.10,
      "band_high": 0.25,
      "what_matters": "Functional endpoint",
      "source": "consensus"
    },
    {
      "metric": "FVC Δ vs PBO",
      "unit": "pp",
      "expected": 4.0,
      "band_low": 2.0,
      "band_high": 5.0,
      "what_matters": "Respiratory function",
      "source": "consensus"
    }
  ]'
```

### Step 3: Record Outcomes (after event occurs)

When the data is announced, record outcomes. The API will automatically compute deltas:

```bash
curl -X POST "http://localhost:3001/api/catalyst-events/1/outcomes/batch" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "metric": "α-DG glycosylation",
      "unit": "× at 3m",
      "value": 1.8,
      "window": "@3m"
    },
    {
      "metric": "CK reduction",
      "unit": "%",
      "value": 82,
      "window": "@12m"
    },
    {
      "metric": "Velocity Δ vs PBO",
      "unit": "m/s",
      "value": 0.27,
      "pvalue": 0.03,
      "n": 38
    },
    {
      "metric": "FVC Δ vs PBO",
      "unit": "pp",
      "value": 5.0,
      "pvalue": 0.02,
      "n": 38
    }
  ]'
```

**Response will include computed deltas:**
```json
[
  {
    "id": 1,
    "catalyst_event_id": 1,
    "metric": "α-DG glycosylation",
    "value": 1.8,
    "delta_class": "beat",
    "delta_score": 0.12,
    "created_at": "2025-10-26T08:00:00Z"
  },
  ...
]
```

### Step 4: Add Market Reactions

Record market price reactions:

```bash
curl -X POST "http://localhost:3001/api/catalyst-events/1/market-reactions/batch" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "ticker": "BBIO",
      "rel_window": "D0",
      "abs_return": 18.5,
      "rel_vs_xbi": 16.8,
      "volume_multiple_vs_30d": 8.2,
      "window_date": "2025-10-26"
    },
    {
      "ticker": "BBIO",
      "rel_window": "D+1",
      "abs_return": 22.3,
      "rel_vs_xbi": 20.1,
      "window_date": "2025-10-27"
    },
    {
      "ticker": "BBIO",
      "rel_window": "D+5",
      "abs_return": 25.0,
      "rel_vs_xbi": 22.0,
      "window_date": "2025-10-31"
    }
  ]'
```

### Step 5: Add IV Snapshots

Record implied volatility around the event:

```bash
curl -X POST "http://localhost:3001/api/catalyst-events/1/iv-snapshots" \
  -H "Content-Type: application/json" \
  -d '{
    "ticker": "BBIO",
    "rel_window": "D0",
    "tenor": "1m",
    "iv": 110.0,
    "zscore_vs_1y": 2.5,
    "percentile_vs_1y": 95.0,
    "snapshot_date": "2025-10-26"
  }'
```

### Step 6: Add Peers

Identify peer companies for competitive analysis:

```bash
curl -X POST "http://localhost:3001/api/catalyst-events/1/peers" \
  -H "Content-Type: application/json" \
  -d '{
    "peer_ticker": "SRPT",
    "peer_name": "Sarepta Therapeutics",
    "reason_tag": "Muscular dystrophy leader",
    "moat_axis": "Indication",
    "weight": 0.6
  }'
```

### Step 7: Add Peer Metrics

Compare your event to peer benchmarks:

```bash
curl -X POST "http://localhost:3001/api/catalyst-events/1/peer-metrics" \
  -H "Content-Type: application/json" \
  -d '{
    "metric": "D0 CAR",
    "value": 18.5,
    "peer_median": 12.0,
    "peer_p25": 8.0,
    "peer_p75": 15.5,
    "delta_to_median": 6.5,
    "percentile_rank": 85.0
  }'
```

### Step 8: Add Source Attribution

Record sources for provenance:

```bash
curl -X POST "http://localhost:3001/api/catalyst-events/1/sources" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "BridgeBio FORTIFY Interim Data PR",
    "url": "https://bridgebio.com/fortify-interim",
    "source_type": "press_release",
    "published_at": "2025-10-26T07:00:00Z"
  }'
```

### Step 9: Get Complete Event

Retrieve all data in a single call:

```bash
curl -X GET "http://localhost:3001/api/catalyst-events/1/complete"
```

**Response:**
```json
{
  "catalyst_event": {
    "id": 1,
    "event_type": "TOPLINE_READOUT",
    "title": "BBP-418 FORTIFY Interim Data",
    "expected_date": "2025-10-26",
    "status": "OCCURRED"
  },
  "expectations": [
    {
      "metric": "α-DG glycosylation",
      "expected": 1.5,
      "band_low": 1.3,
      "band_high": 1.6,
      "what_matters": "Biomarker restoration shows MOA"
    }
  ],
  "outcomes": [
    {
      "metric": "α-DG glycosylation",
      "value": 1.8,
      "delta_class": "beat",
      "delta_score": 0.12
    }
  ],
  "market_reactions": [...],
  "iv_snapshots": [...],
  "peers": [...],
  "peer_metrics": [...],
  "sources": [...]
}
```

## Using Seed Data

Load one of the 5 pre-configured examples:

```python
from bt_platform.core.seed_catalyst_examples import BRIDGEBIO_FORTIFY_EVENT
import json

# Get the complete event structure
event = BRIDGEBIO_FORTIFY_EVENT

# Access specific sections
print(f"Company: {event['company']['name']}")
print(f"Program: {event['catalyst']['program']}")

# Iterate over expectations
for metric in event['expectations']['metrics']:
    print(f"{metric['name']}: {metric['expected']} (band: {metric['band_low']}-{metric['band_high']})")

# Check outcomes
for metric in event['outcome']['metrics']:
    print(f"{metric['name']}: {metric['value']}")
```

## Python Service Usage

Use the delta service directly in your code:

```python
from bt_platform.core.services.catalyst_delta_service import (
    compute_expectation_delta,
    compute_multi_metric_delta,
    compute_aggregate_delta_score
)

# Single metric
expectation = {"expected": 1.5, "band_low": 1.3, "band_high": 1.6}
outcome = {"value": 1.8}
result = compute_expectation_delta(outcome, expectation)
print(f"{result.delta_class}: {result.delta_score:.2f}")

# Multiple metrics
outcomes = {
    "metric1": {"value": 1.8},
    "metric2": {"value": 0.27}
}
expectations = {
    "metric1": {"expected": 1.5, "band_low": 1.3, "band_high": 1.6},
    "metric2": {"expected": 0.20, "band_low": 0.10, "band_high": 0.25}
}
results = compute_multi_metric_delta(outcomes, expectations)

# Aggregate score
weights = {"metric1": 0.4, "metric2": 0.6}
score, agg_class = compute_aggregate_delta_score(results, weights)
print(f"Aggregate: {agg_class} (score: {score:.2f})")
```

## TypeScript Frontend Usage

```typescript
import type { EnhancedCatalystEvent, OutcomeMetric } from '@/types/biotech';

// Fetch complete event
const response = await fetch(`/api/catalyst-events/${eventId}/complete`);
const event: EnhancedCatalystEvent = await response.json();

// Display expectations vs outcomes
event.expectations.metrics.forEach(exp => {
  const outcome = event.outcome?.metrics.find(o => o.name === exp.name);
  if (outcome) {
    console.log(`${exp.name}:`);
    console.log(`  Expected: ${exp.expected} (${exp.band_low}-${exp.band_high})`);
    console.log(`  Actual: ${outcome.value}`);
    console.log(`  Delta: ${outcome.delta_class} (${outcome.delta_score?.toFixed(2)})`);
  }
});

// Display market reactions
event.market_reaction?.price?.forEach(reaction => {
  console.log(`${reaction.window}: ${reaction.abs}% (rel XBI: ${reaction.rel_vs_XBI}%)`);
});

// Display peers
event.peers?.list.forEach(peer => {
  console.log(`${peer.ticker}: ${peer.reason_tag} (weight: ${peer.weight})`);
});
```

## Common Queries

### Get all beats for a catalyst
```sql
SELECT 
    co.metric,
    co.value,
    eb.expected,
    co.delta_score
FROM catalyst_outcomes co
JOIN expectation_bands eb ON co.catalyst_event_id = eb.catalyst_event_id 
    AND co.metric = eb.metric
WHERE co.catalyst_event_id = 1
  AND co.delta_class = 'beat'
ORDER BY co.delta_score DESC;
```

### Find catalyst events with significant market reactions
```sql
SELECT 
    ce.title,
    mr.ticker,
    mr.abs_return,
    mr.rel_vs_xbi
FROM catalyst_events ce
JOIN market_reactions mr ON ce.id = mr.catalyst_event_id
WHERE mr.rel_window = 'D0'
  AND ABS(mr.abs_return) > 10.0
ORDER BY ABS(mr.abs_return) DESC;
```

### Get peer comparison for a catalyst
```sql
SELECT 
    cp.peer_ticker,
    cp.reason_tag,
    cpm.metric,
    cpm.value,
    cpm.peer_median,
    cpm.delta_to_median
FROM catalyst_peers cp
JOIN catalyst_peer_metrics cpm ON cp.catalyst_event_id = cpm.catalyst_event_id
WHERE cp.catalyst_event_id = 1
ORDER BY cp.weight DESC, cpm.metric;
```

### Find catalysts with highest aggregate beat scores
```sql
WITH outcome_scores AS (
    SELECT 
        catalyst_event_id,
        AVG(delta_score) as avg_score,
        COUNT(*) as metric_count
    FROM catalyst_outcomes
    WHERE delta_class = 'beat'
    GROUP BY catalyst_event_id
)
SELECT 
    ce.title,
    ce.company_id,
    os.avg_score,
    os.metric_count
FROM catalyst_events ce
JOIN outcome_scores os ON ce.id = os.catalyst_event_id
ORDER BY os.avg_score DESC
LIMIT 10;
```

## Tips and Best Practices

### 1. Set Expectations Early
Add expectation bands as soon as you have Street consensus (ideally weeks before the event).

### 2. Use Batch Endpoints
When adding multiple items, use batch endpoints for better performance:
- `/expectations/batch`
- `/outcomes/batch`
- `/market-reactions/batch`

### 3. Track Market Reactions Continuously
Record price/volume at multiple windows to see full reaction arc:
- Pre-event: D-5, D-1
- Event day: D0
- Post-event: D+1, D+5, D+10, D+30

### 4. Weight Functional Endpoints Higher
In the aggregate score, weight functional endpoints (e.g., velocity, FVC) higher than biomarkers (e.g., α-DG, CK).

### 5. Use Moat Axes for Peer Selection
Choose peers based on:
- **MoA** (mechanism of action)
- **Stage** (development phase)
- **Indication** (disease)
- **Delivery** (modality)
- **Target** (molecular target)

### 6. Add Context in "what_matters"
Always explain why each metric matters:
- Regulatory precedent?
- Payer relevance?
- Competitive positioning?
- Clinical meaningfulness?

### 7. Source Everything
Add sources for:
- Expectations (analyst notes, company guidance)
- Outcomes (press releases, conference presentations)
- Market data (data provider timestamps)

## Troubleshooting

### Delta not computing automatically
**Issue**: Outcome created but delta_class is null.

**Solution**: Ensure expectation band exists for the same metric name (exact match).

### Aggregate score seems wrong
**Issue**: Multi-metric aggregate doesn't match intuition.

**Solution**: Check weights. Default is equal weights. For better results, weight functional endpoints higher.

### Peer metrics not showing
**Issue**: Peer metrics endpoint returns empty.

**Solution**: Make sure you've added both peers (via `/peers`) AND peer metrics (via `/peer-metrics`).

### TypeScript type errors
**Issue**: Type mismatch when using EnhancedCatalystEvent.

**Solution**: Ensure you imported from correct path: `@/types/biotech` not `@biotech-terminal/frontend-components`.

## Next Steps

1. **Automate Data Collection**: Set up cron jobs to fetch market reactions daily
2. **Build Visualizations**: Create React components for expectation vs outcome charts
3. **Add Alerting**: Send Slack notifications for significant deltas
4. **Generate Reports**: Create PDF/PPTX quadrant slides automatically
5. **Integrate ML**: Use delta patterns to train outcome prediction models

## Support

For questions or issues:
1. Check the main README: `CATALYST_EVENT_TRACKING_README.md`
2. Review test cases: `tests/test_catalyst_delta_service.py`
3. Inspect seed examples: `bt_platform/core/seed_catalyst_examples.py`
4. Check API implementation: `bt_platform/core/endpoints/catalyst_enhanced.py`

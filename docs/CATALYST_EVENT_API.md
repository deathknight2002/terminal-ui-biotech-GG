# Catalyst Event System API Documentation

## Overview

The Catalyst Event System provides detailed tracking of biotech catalyst events with expectation bands, outcome metrics, market reactions, and peer comparisons. This enables quantitative analysis of catalyst impact and Street expectation deltas.

## Global Conventions

All catalyst events follow a consistent structure:

### Event Keys

```typescript
{
  event_id: string;           // ULID format
  as_of: string;              // UTC timestamp (ISO 8601)
  company: {
    name: string;
    ticker: string;
    exchange?: string;
    logo_url?: string;
  };
  catalyst: {
    type: CatalystEventType;  // M&A, PH3_READOUT, SAFETY_PAUSE, APPROVAL, LABEL_UPDATE
    subtype?: string;          // TenderOffer, Interim, Hold/Partial, sNDA
    program: string;           // Asset/program name
    indication: string;        // Disease indication
    geography?: string[];      // ["US", "EU", "Global"]
  };
  expectations: {
    source: string;            // sell_side, mgmt_guide, consensus, internal
    metrics: Array<{
      name: string;
      unit: string;
      expected?: number;
      band_low?: number;
      band_high?: number;
      what_matters: string;
    }>;
  };
  outcome: {
    metrics: Array<{
      name: string;
      unit: string;
      value?: number;
      value_str?: string;     // For non-numeric (e.g., "true", "false")
      pvalue?: number;
      n?: number;
      window?: string;        // Time window (e.g., "@3m", "@12m")
    }>;
  };
  market_reaction?: {
    price: Array<{
      window: string;         // D-5, D-1, D0, D+1, D+5, D+10
      abs: number;            // Absolute % return
      rel_vs_XBI?: number;    // Relative to XBI
      intraday_high_low?: string;
    }>;
    iv?: Array<{
      tenor: string;          // 1w, 1m, 3m
      window: string;
      iv: number;             // Implied volatility %
      zscore_vs_1y: number;
    }>;
    vol?: Array<{
      window: string;
      volume_multiple_vs_30d: number;
    }>;
  };
  peers?: {
    moat_axes: string[];      // ["MoA", "Stage", "Indication", "Delivery", "Target"]
    list: Array<{
      ticker: string;
      name?: string;
      reason_tag: string;
      weight: number;         // 0-1 relevance weight
    }>;
    comp_metrics: Array<{
      metric: string;
      value: number;
      peer_median: number;
      peer_p75: number;
      delta_to_median: number;
    }>;
  };
  sources: Array<{
    title: string;
    url: string;
    ts: string;               // ISO timestamp
    type: string;             // company_pr, sec_filing, press, analyst
  }>;
}
```

## API Endpoints

### 1. Get Detailed Catalyst Event

**Endpoint:** `GET /api/v1/catalysts/events/{catalyst_id}`

Retrieves full catalyst event with all related data including expectations, outcomes, market reactions, peers, and sources.

**Response:**
```json
{
  "event": {
    "event_id": "catalyst_1",
    "as_of": "2025-10-27T00:00:00",
    "company": {
      "name": "Novartis",
      "ticker": "NVS"
    },
    "catalyst": {
      "type": "M&A",
      "subtype": "M&A",
      "program": "AOC platform",
      "indication": "$12B tender offer for Avidity's AOC platform (Neuromuscular RNA)"
    },
    "expectations": {
      "source": "sell_side",
      "metrics": [...]
    },
    "outcome": {
      "metrics": [...]
    },
    "market_reaction": {...},
    "peers": {...},
    "sources": [...]
  }
}
```

### 2. Get Expectation Bands

**Endpoint:** `GET /api/v1/catalysts/events/{catalyst_id}/expectations`

Retrieves expectation bands (what the Street expected) for a catalyst.

**Response:**
```json
{
  "catalyst_id": 1,
  "expectations": [
    {
      "metric": "Deal Premium",
      "unit": "%",
      "expected": 30.0,
      "band_low": 20.0,
      "band_high": 40.0,
      "source": "sell_side",
      "what_matters": "Signal on RNA appetite",
      "collected_at": "2025-10-27T00:00:00"
    }
  ],
  "count": 1
}
```

### 3. Calculate Expectation Deltas

**Endpoint:** `GET /api/v1/catalysts/events/{catalyst_id}/deltas`

Calculates expectation deltas (beat/inline/miss) for all metrics.

**Algorithm:**
```python
def compute_expectation_delta(outcome, expectation_band):
    """
    Returns +1 (beat), 0 (in-line), -1 (miss) with magnitude score 0..1
    """
    val = outcome["value"]
    lo, hi = expectation_band["band_low"], expectation_band["band_high"]
    
    if val > hi: 
        return {"class": "beat", "score": min((val-hi)/(hi or 1), 1.0)}
    if val < lo: 
        return {"class": "miss", "score": min((lo-val)/(lo or 1), 1.0)}
    return {"class": "inline", "score": 0.2}
```

**Response:**
```json
{
  "catalyst_id": 1,
  "deltas": [
    {
      "metric": "Deal Premium",
      "expected": 30.0,
      "actual": 46.0,
      "delta": {
        "class": "beat",
        "score": 0.4
      }
    }
  ],
  "count": 1
}
```

**Delta Classes:**
- `beat`: Outcome exceeds high band → positive surprise
- `inline`: Outcome within expectation band → in line with expectations
- `miss`: Outcome below low band → negative surprise

**Score Interpretation:**
- `0.0-0.3`: Small delta
- `0.3-0.7`: Moderate delta
- `0.7-1.0`: Large delta

### 4. Get Market Reactions

**Endpoint:** `GET /api/v1/catalysts/events/{catalyst_id}/reactions`

Retrieves market price and IV reactions for a catalyst event.

**Response:**
```json
{
  "catalyst_id": 1,
  "price": [
    {
      "ticker": "NVS",
      "window": "D0",
      "abs_return": 3.0,
      "rel_vs_xbi": 2.1,
      "intraday_high_low": null
    },
    {
      "ticker": "NVS",
      "window": "D+1",
      "abs_return": 4.5,
      "rel_vs_xbi": 3.2,
      "intraday_high_low": null
    }
  ],
  "iv": [
    {
      "ticker": "NVS",
      "tenor": "1m",
      "window": "D+1",
      "iv": 28.1,
      "zscore_vs_1y": 0.9
    }
  ],
  "volume": [
    {
      "ticker": "BBIO",
      "window": "D0",
      "volume_multiple_vs_30d": 3.2
    }
  ]
}
```

**Window Definitions:**
- `D-5`: 5 days before event
- `D-1`: 1 day before event
- `D0`: Event day
- `D+1`: 1 day after event
- `D+5`: 5 days after event
- `D+10`: 10 days after event

### 5. Get Peer Analysis

**Endpoint:** `GET /api/v1/catalysts/events/{catalyst_id}/peers`

**Query Parameters:**
- `indication` (optional): Filter peers by indication
- `moa` (optional): Filter peers by mechanism of action

**Response:**
```json
{
  "catalyst_id": 1,
  "peers": [
    {
      "ticker": "DYNE",
      "name": "Dyne Therapeutics",
      "reason_tag": "RNA muscle peer",
      "weight": 0.5,
      "moat_axes": ["MoA", "Indication"]
    },
    {
      "ticker": "PEPG",
      "name": "PepGen",
      "reason_tag": "AOC-adjacent",
      "weight": 0.3,
      "moat_axes": ["MoA"]
    }
  ],
  "peer_metrics": [
    {
      "metric": "1D move post-print",
      "value": 2.8,
      "peer_median": 4.2,
      "peer_p75": 6.0,
      "delta_to_median": -1.4
    }
  ],
  "moat_axes": ["MoA", "Stage", "Indication", "Delivery", "Target"]
}
```

**Moat Axes Explained:**
- `MoA`: Similar mechanism of action
- `Stage`: Similar development stage
- `Indication`: Same disease indication
- `Delivery`: Similar delivery method (oral, IV, subQ, etc.)
- `Target`: Same biological target

## Example Use Cases

### 1. Analyze M&A Premium vs. Sector

```bash
# Get Novartis/Avidity M&A event
GET /api/v1/catalysts/events/1

# Check expectation deltas
GET /api/v1/catalysts/events/1/deltas
# Response: Deal premium beat (46% vs 30% expected)

# Get peer comparisons
GET /api/v1/catalysts/events/1/peers
# Response: 2.8% 1D move vs 4.2% peer median
```

### 2. Phase 3 Readout Analysis

```bash
# Get BridgeBio FORTIFY event
GET /api/v1/catalysts/events/2

# Check all metrics
GET /api/v1/catalysts/events/2/deltas
# Response: 
# - α-DG: beat (1.8x vs 1.5x expected)
# - CK: beat (-82% vs -60% expected)
# - Velocity: beat (0.27 vs 0.20 expected)
# - FVC: beat (5pp vs 4pp expected)

# Market reaction
GET /api/v1/catalysts/events/2/reactions
# Response: +18.5% D0, +15.2% vs XBI
```

### 3. Safety Event Class Impact

```bash
# Get Intellia MAGNITUDE pause
GET /api/v1/catalysts/events/3

# Expectation delta
GET /api/v1/catalysts/events/3/deltas
# Response: Grade 4 event (miss vs expected Grade 2)

# Peer read-through
GET /api/v1/catalysts/events/3/peers
# Response: CRSP, BEAM, VERV with moat_axes ["MoA", "Delivery"]

# Market reactions
GET /api/v1/catalysts/events/3/reactions
# Response: -15.2% NTLA vs -8.5% peer median
```

## Database Schema

### Tables

1. **catalyst_expectation_bands**
   - Stores Street expectations with confidence bands
   - Links to catalysts table via `catalyst_id`

2. **catalyst_outcome_metrics**
   - Stores actual outcomes
   - Supports numeric and string values

3. **catalyst_market_reactions**
   - Price, IV, and volume reactions
   - Multiple windows per catalyst

4. **catalyst_peers**
   - Peer companies with moat axes
   - Weighted relevance scores

5. **catalyst_peer_metrics**
   - Comparative metrics vs peers
   - Median and P75 benchmarks

6. **catalyst_sources**
   - Reference links to PRs, SEC filings, press
   - Timestamped for audit trail

## Pre-Seeded Examples

The system includes 5 detailed catalyst examples:

1. **Novartis → Avidity** (M&A, $12B)
   - 46% premium (beat vs 30% expected)
   - SpinCo required (miss vs no SpinCo expected)

2. **BridgeBio FORTIFY** (Phase 3 interim, LGMD2I/R9)
   - 4 biomarker/function endpoints, all beat
   - +18.5% D0 stock move

3. **Intellia MAGNITUDE** (Safety pause)
   - Grade 4 hepatotoxicity (miss)
   - Class read-through to CRSP, BEAM, VERV

4. **Bayer Lynkuet** (FDA approval, menopause VMS)
   - Inline with expectations
   - Dual NK1/NK3 positioning vs Veozah

5. **Lilly Omvoh** (Label update, UC)
   - Single-injection convenience
   - Adherence uplift positioning

## Future Enhancements

### Planned Features
- Automated expectation extraction from broker notes (LLM-assisted)
- Real-time IV data integration
- Quadrant slide PPTX generation
- Alert system for high-magnitude deltas
- Scenario analysis for sensitivity modeling

### Next-Level Analytics
- Event impact classifier (predict CAR from deltas)
- Payer friction model for launches
- Class-risk ontology for safety events
- One-click deck builder
- Multi-source deduplication with confidence scores

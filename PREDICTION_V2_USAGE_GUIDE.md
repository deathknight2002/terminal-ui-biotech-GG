# Prediction Models v2 - Usage Guide

## Overview

The v2 prediction models provide enhanced capabilities for catalyst timing, outcome prediction, momentum scoring, and alpha scoring. All models use stdlib only (no scipy, no sklearn at runtime) for production efficiency.

## Key Features

### 1. **Calibration Module** - Reliability Calibration
- **PAV (Pool-Adjacent-Violators)** isotonic calibration
- Ensures predicted probabilities match observed frequencies
- Train offline, serialize to JSON, load at runtime

### 2. **Timing Predictor v2** - Calendar-Aware Timing
- Weibull distribution with hazard spikes
- FDA dates and major congress support (ASCO, ESMO, AHA)
- Therapeutic area scaling factors
- Optional 2-component mixtures for bimodal trials

### 3. **Outcome Predictor v2** - Calibrated Bayesian
- Evidence stacking in odds space (proper composition)
- PAV calibration for reliability
- Phase-based priors from BIO industry data
- Therapeutic area adjustments

### 4. **Momentum Scorer v2** - Peer-Neutral Momentum
- Exponential recency decay (30-day half-life)
- Streak detection and boosting (capped at 5)
- Therapeutic area z-score comparison
- 0-100 scaling via tanh

### 5. **Alpha Scorer** - Expected Value with Risk
- Combines probability × expected moves
- Downside penalty (1.1x weight on losses)
- Timing confidence weighting
- Directionally-honest edge score (0-100)

## API Endpoints

### Enhanced Timing Prediction
```http
GET /predictions/v2/predict/timing/{catalyst_id}
```

**Response:**
```json
{
  "catalyst_id": "XYZ-P3-READOUT",
  "type": "TRIAL_READOUT",
  "reference": "Weibull_v2(TA_scale=0.9)",
  "quarterly_probabilities": [0.38, 0.18, 0.04, 0.00],
  "bins": [
    ["2025-01-01", "2025-03-31"],
    ["2025-04-01", "2025-06-30"],
    ["2025-07-01", "2025-09-30"],
    ["2025-10-01", "2025-12-31"]
  ],
  "outside_window": 0.40,
  "catalyst": {
    "id": "XYZ-P3-READOUT",
    "ticker": "XYZ",
    "company": "XYZ Pharma",
    "therapeutic_area": "Oncology",
    "catalyst_type": "TRIAL_READOUT",
    "phase": "P3"
  }
}
```

### Enhanced Outcome Prediction
```http
GET /predictions/v2/predict/outcome/{catalyst_id}
```

**Response:**
```json
{
  "probability_of_success": 0.71,
  "prior_probability": 0.48,
  "evidence_factors": [
    {"factor": "prior_phase_success", "impact": "+15%"},
    {"factor": "biomarker_enrichment", "impact": "+10%"},
    {"factor": "hard_endpoints", "impact": "+5%"}
  ],
  "calibrated": true,
  "catalyst": {
    "id": "XYZ-P3-READOUT",
    "ticker": "XYZ",
    "company": "XYZ Pharma",
    "therapeutic_area": "Oncology",
    "phase": "P3"
  }
}
```

### Advanced Company Momentum
```http
GET /predictions/v2/momentum/company/{company_name}?lookback_days=730
```

**Response:**
```json
{
  "company": "XYZ Pharma",
  "momentum_score": 73.4,
  "components": {
    "base": 2.45,
    "streak": 12.0,
    "ta_z": 1.23
  },
  "event_count": 8,
  "lookback_days": 730
}
```

### Therapeutic Area Momentum
```http
GET /predictions/v2/momentum/therapeutic-areas?lookback_days=730
```

**Response:**
```json
{
  "lookback_days": 730,
  "therapeutic_areas": {
    "Oncology": {
      "therapeutic_area": "Oncology",
      "momentum_score": 68.2,
      "components": {"base": 1.89, "streak": 6.0, "ta_z": 0.0},
      "event_count": 42,
      "rank": 1,
      "percentile": 100.0
    },
    "Rare Disease": {
      "therapeutic_area": "Rare Disease",
      "momentum_score": 58.5,
      "components": {"base": 0.45, "streak": 0.0, "ta_z": 0.0},
      "event_count": 15,
      "rank": 2,
      "percentile": 75.0
    }
  }
}
```

### Enhanced Upcoming Catalysts
```http
GET /predictions/v2/upcoming?limit=20&min_confidence=0.6
```

**Response:**
```json
{
  "count": 12,
  "min_confidence": 0.6,
  "upcoming": [
    {
      "catalyst_id": "XYZ-P3-READOUT",
      "ticker": "XYZ",
      "company": "XYZ Pharma",
      "therapeutic_area": "Oncology",
      "catalyst_type": "TRIAL_READOUT",
      "phase": "P3",
      "timing": {
        "quarterly_probabilities": [0.38, 0.18, 0.04, 0.00],
        "outside_window": 0.40
      },
      "outcome": {
        "probability_of_success": 0.71,
        "prior_probability": 0.48,
        "evidence_factors": [...],
        "calibrated": true
      }
    }
  ]
}
```

### Top Alpha Opportunities (The Feed)
```http
GET /predictions/v2/alpha/top?limit=20
```

**Response:**
```json
{
  "count": 20,
  "top": [
    {
      "catalyst_id": "XYZ-P3-READOUT",
      "ticker": "XYZ",
      "company": "XYZ Pharma",
      "therapeutic_area": "Oncology",
      "catalyst_type": "TRIAL_READOUT",
      "phase": "P3",
      "prob_success": 0.71,
      "mu_up": 0.23,
      "mu_down": 0.19,
      "ev": 0.065,
      "edge_score": 73.4,
      "timing_confidence": 0.60,
      "timing": {
        "quarterly_probabilities": [0.38, 0.18, 0.04, 0.00]
      }
    }
  ]
}
```

## Python Usage Examples

### Example 1: Using the Calibration Module

```python
from bt_platform.core.prediction.calibration import fit_pav, apply_pav, calibration_metrics

# Train calibration on historical predictions
historical_predictions = [0.3, 0.5, 0.7, 0.8, 0.9]
actual_outcomes = [0, 1, 1, 1, 1]

# Fit PAV calibration
calibrator = fit_pav(historical_predictions, actual_outcomes)

# Save to JSON for production use
import json
with open('pav_calibrator.json', 'w') as f:
    json.dump(calibrator, f)

# Apply to new predictions
new_prediction = 0.65
calibrated_prediction = apply_pav(new_prediction, calibrator)
print(f"Raw: {new_prediction}, Calibrated: {calibrated_prediction}")

# Evaluate calibration quality
metrics = calibration_metrics(historical_predictions, actual_outcomes, calibrator)
print(f"Brier score: {metrics['brier_score']}")
print(f"Log loss: {metrics['log_loss']}")
```

### Example 2: Timing Prediction with Hazard Windows

```python
from bt_platform.core.prediction.timing_predictor_v2 import predict_quarterly_distribution_v2
from bt_platform.core.prediction.adapters import get_catalyst_by_id
from sqlalchemy.orm import Session
import datetime as dt

# Define hazard windows (e.g., ASCO conference in June)
hazard_windows = [
    (dt.date(2025, 6, 1), dt.date(2025, 6, 15), 1.3),  # 30% boost during ASCO
    (dt.date(2025, 9, 15), dt.date(2025, 9, 30), 1.2),  # 20% boost during ESMO
]

# Get catalyst and predict timing
catalyst = get_catalyst_by_id(db, "catalyst-123")
result = predict_quarterly_distribution_v2(
    c=catalyst,
    hazard_windows=hazard_windows
)

print(f"Quarterly probabilities: {result['quarterly_probabilities']}")
print(f"Most likely quarter: Q{result['quarterly_probabilities'].index(max(result['quarterly_probabilities'])) + 1}")
```

### Example 3: Outcome Prediction with Calibration

```python
from bt_platform.core.prediction.outcome_predictor_v2 import predict_outcome_bayesian_v2
from bt_platform.core.prediction.adapters import get_catalyst_by_id
import json

# Load calibrator from file
with open('pav_calibrator.json', 'r') as f:
    calibrator = json.load(f)

# Get catalyst and predict outcome
catalyst = get_catalyst_by_id(db, "catalyst-123")
result = predict_outcome_bayesian_v2(
    c=catalyst,
    pav_calibrator=calibrator
)

print(f"Probability of success: {result.probability_of_success}")
print(f"Prior probability: {result.prior_probability}")
print(f"Evidence factors: {result.evidence_factors}")
print(f"Calibrated: {result.calibrated}")
```

### Example 4: Alpha Scoring for Top Opportunities

```python
from bt_platform.core.prediction.alpha_scorer import expected_alpha_for_catalyst
from bt_platform.core.prediction.adapters import list_upcoming_catalysts

# Get upcoming catalysts
catalysts = list_upcoming_catalysts(db, limit=50)

# Score each catalyst
scored = []
for catalyst in catalysts:
    alpha_result = expected_alpha_for_catalyst(
        c=catalyst,
        pav_calib=calibrator,
        hazard_windows=hazard_windows
    )
    scored.append(alpha_result)

# Sort by edge score
scored.sort(key=lambda x: x['edge_score'], reverse=True)

# Print top 5 opportunities
print("Top 5 Alpha Opportunities:")
for i, opp in enumerate(scored[:5], 1):
    print(f"{i}. {opp['ticker']}: Edge={opp['edge_score']:.1f}, "
          f"P(success)={opp['prob_success']:.2f}, EV={opp['ev']:.3f}")
```

## Production Configuration

### 1. Calibration Configuration

Create `config/calibration.json`:
```json
{
  "pav_calibrator": {
    "levels": [0.12, 0.35, 0.58, 0.82],
    "thresholds": [0.25, 0.50, 0.75]
  },
  "updated": "2025-01-15T10:30:00Z",
  "samples": 1234,
  "brier_score": 0.082
}
```

### 2. Hazard Windows Configuration

Create `config/hazard_windows.json`:
```json
{
  "windows": [
    {
      "name": "ASCO 2025",
      "start": "2025-06-01",
      "end": "2025-06-15",
      "boost": 1.3
    },
    {
      "name": "ESMO 2025",
      "start": "2025-09-15",
      "end": "2025-09-30",
      "boost": 1.2
    },
    {
      "name": "AHA 2025",
      "start": "2025-11-15",
      "end": "2025-11-20",
      "boost": 1.25
    }
  ]
}
```

### 3. Load Configuration at Startup

In `bt_platform/core/endpoints/predictions_v2.py`:
```python
import json
import os
from pathlib import Path

# Load calibrator
config_dir = Path(__file__).parent.parent.parent.parent / "config"
calibrator_path = config_dir / "calibration.json"
if calibrator_path.exists():
    with open(calibrator_path) as f:
        config = json.load(f)
        PAV_CALIBRATOR = config.get("pav_calibrator")

# Load hazard windows
windows_path = config_dir / "hazard_windows.json"
if windows_path.exists():
    with open(windows_path) as f:
        config = json.load(f)
        HAZARD_WINDOWS = [
            (
                dt.date.fromisoformat(w["start"]),
                dt.date.fromisoformat(w["end"]),
                w["boost"]
            )
            for w in config.get("windows", [])
        ]
```

## Calibration Training Workflow

### Step 1: Export Historical Predictions

```python
from bt_platform.core.database import get_db, Catalyst
from bt_platform.core.prediction.outcome_predictor_v2 import predict_outcome_bayesian_v2
import json

db = next(get_db())

# Get completed catalysts with outcomes
completed = db.query(Catalyst).filter(
    Catalyst.outcome.isnot(None),
    Catalyst.date < datetime.now()
).all()

predictions = []
actuals = []

for cat in completed:
    # Get prediction
    result = predict_outcome_bayesian_v2(cat, pav_calibrator=None)
    
    # Get actual outcome
    actual = 1 if "success" in cat.outcome.lower() else 0
    
    predictions.append(result.probability_of_success)
    actuals.append(actual)

# Save for offline training
with open('training_data.json', 'w') as f:
    json.dump({"predictions": predictions, "actuals": actuals}, f)
```

### Step 2: Train Calibration Offline

```python
from bt_platform.core.prediction.calibration import fit_pav, calibration_metrics
import json

# Load training data
with open('training_data.json') as f:
    data = json.load(f)

# Fit calibrator
calibrator = fit_pav(data["predictions"], data["actuals"])

# Evaluate
metrics = calibration_metrics(data["predictions"], data["actuals"], calibrator)
print(f"Brier score improvement: {metrics['brier_score']}")
print(f"Log loss: {metrics['log_loss']}")

# Save calibrator
with open('config/calibration.json', 'w') as f:
    json.dump({
        "pav_calibrator": calibrator,
        "updated": datetime.now().isoformat(),
        "samples": len(data["predictions"]),
        **metrics
    }, f, indent=2)
```

## Integration with Terminal UI

### React Component Example

```typescript
import { useState, useEffect } from 'react';
import { Panel } from '@biotech-terminal/frontend-components/terminal';

interface AlphaOpportunity {
  catalyst_id: string;
  ticker: string;
  company: string;
  prob_success: number;
  edge_score: number;
  ev: number;
}

export function AlphaFeed() {
  const [opportunities, setOpportunities] = useState<AlphaOpportunity[]>([]);

  useEffect(() => {
    fetch('/api/v1/predictions/v2/alpha/top?limit=20')
      .then(res => res.json())
      .then(data => setOpportunities(data.top));
  }, []);

  return (
    <Panel title="TOP ALPHA OPPORTUNITIES" cornerBrackets>
      <div className="alpha-feed">
        {opportunities.map((opp, idx) => (
          <div key={opp.catalyst_id} className="alpha-item">
            <span className="rank">#{idx + 1}</span>
            <span className="ticker">{opp.ticker}</span>
            <span className="company">{opp.company}</span>
            <span className="edge">{opp.edge_score.toFixed(1)}</span>
            <span className="prob">{(opp.prob_success * 100).toFixed(0)}%</span>
            <span className="ev">{(opp.ev * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}
```

## Performance Notes

- **Stdlib Only**: All math uses Python stdlib (math, statistics, datetime)
- **No scipy/sklearn**: Production runtime has zero ML dependencies
- **JSON Serialization**: Calibration and config loaded at startup
- **Lightweight**: Each prediction < 1ms on modern hardware
- **Batch Friendly**: Can score 1000+ catalysts in < 1 second

## Maintenance

### Recalibration Schedule
- **Weekly**: Check calibration drift on recent predictions
- **Monthly**: Retrain calibrator with last 90 days of data
- **Quarterly**: Full recalibration with last 2 years of data

### Hazard Window Updates
- **Annually**: Update conference dates for next year
- **Ad-hoc**: Add new major conferences or FDA calendar changes

### Monitoring
- Track Brier score and log loss over time
- Alert if calibration drift > 10%
- Monitor edge score distribution for stability

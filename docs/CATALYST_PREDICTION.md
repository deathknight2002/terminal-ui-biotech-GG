# Catalyst Prediction & Trading Intelligence

## Overview

The Catalyst Prediction & Trading Intelligence system provides ML-powered predictions for biotech catalyst events. This implementation focuses on three core capabilities:

1. **Timing Prediction** - When will catalyst events occur?
2. **Outcome Prediction** - What's the probability of success?
3. **Momentum Scoring** - How is a company/sector trending?

## Architecture

```
bt_platform/core/prediction/
├── __init__.py              # Module exports
├── timing_predictor.py      # Event timing models
├── outcome_predictor.py     # Bayesian outcome models
└── momentum_scorer.py       # Momentum analytics

bt_platform/core/endpoints/
└── predictions.py           # REST API endpoints
```

## API Endpoints

### 1. Predict Catalyst Timing

**Endpoint:** `GET /api/v1/predictions/predict/timing/{catalyst_id}`

Predicts when an upcoming catalyst event will occur using statistical duration models.

**Response:**
```json
{
  "predicted_date": "2025-06-15T00:00:00",
  "confidence_interval_days": 90,
  "early_date": "2025-03-15T00:00:00",
  "late_date": "2025-09-15T00:00:00",
  "probability_by_quarter": {
    "Q1 2025": 0.15,
    "Q2 2025": 0.45,
    "Q3 2025": 0.30,
    "Q4 2025": 0.10
  },
  "model": "weibull_duration",
  "confidence_score": 0.6,
  "catalyst": {
    "id": 123,
    "company": "Biotech Corp",
    "drug_name": "BTC-101",
    "description": "Phase 3 Readout"
  }
}
```

**Key Features:**
- Uses Weibull distribution models based on historical trial durations
- Adjusts for indication (oncology trials typically faster)
- Provides confidence intervals and quarterly probability distributions
- PDUFA dates have higher confidence (0.9) than trial readouts (0.6)

### 2. Predict Catalyst Outcome

**Endpoint:** `GET /api/v1/predictions/predict/outcome/{catalyst_id}`

Predicts the probability of a positive outcome using Bayesian models.

**Response:**
```json
{
  "probability_of_success": 0.62,
  "confidence_interval": {
    "lower": 0.52,
    "upper": 0.72
  },
  "prior_probability": 0.48,
  "evidence_factors": [
    {
      "factor": "prior_phase_success",
      "impact": "+10%",
      "rationale": "100% success in earlier phases"
    },
    {
      "factor": "biomarker_enrichment",
      "impact": "+10%",
      "rationale": "Genetic biomarker increases target population likelihood"
    }
  ],
  "model": "bayesian_update",
  "confidence_score": 0.8,
  "catalyst": {
    "id": 123,
    "company": "Biotech Corp",
    "drug_name": "BTC-101"
  }
}
```

**Key Features:**
- Starts with industry base rates (priors) from BIO Industry Analysis
- Updates probability based on drug-specific evidence:
  - Prior phase outcomes
  - Biomarker enrichment
  - Hard clinical endpoints
  - Trial size
- Provides transparent evidence trail showing what factors influenced the prediction
- Confidence intervals narrow as more evidence is incorporated

**Industry Base Rates:**
- Phase 1: 63% overall, 68% oncology
- Phase 2: 30% overall, 31% oncology, 42% rare disease
- Phase 3: 48% overall, 62% rare disease
- FDA Approval: 85% overall

### 3. Company Momentum Score

**Endpoint:** `GET /api/v1/predictions/momentum/company/{company_name}?lookback_months=6`

Calculates momentum score (0-100) based on recent catalyst outcomes.

**Response:**
```json
{
  "company": "Biotech Corp",
  "overall_score": 78.5,
  "trend": "strong_positive",
  "catalyst_count": 5,
  "success_rate": 0.8,
  "key_metrics": {
    "catalyst_count": 5,
    "success_count": 4,
    "failure_count": 1,
    "success_rate": 0.8,
    "streak": 3,
    "cadence": 0.83
  }
}
```

**Scoring Components:**
1. **Success Rate** (0-100): Base score from recent outcomes
2. **Cadence Boost** (+0-20): More catalysts = more momentum
3. **Recency Weighting**: Recent events weighted more heavily
4. **Streak Bonus** (±15): Consecutive wins/losses amplify momentum

**Trend Labels:**
- `strong_positive` (75+): High asymmetric upside
- `positive` (60-74): Moderate positive momentum
- `neutral` (40-59): No clear direction
- `negative` (25-39): Weakening momentum
- `strong_negative` (<25): Consecutive failures

### 4. Therapeutic Area Momentum

**Endpoint:** `GET /api/v1/predictions/momentum/therapeutic-areas?lookback_months=6`

Compares momentum across therapeutic areas.

**Response:**
```json
{
  "lookback_months": 6,
  "total_catalysts": 45,
  "areas": {
    "Oncology": {
      "overall_score": 82.3,
      "trend": "strong_positive",
      "catalyst_count": 20,
      "success_rate": 0.75,
      "rank": 1,
      "percentile": 100.0
    },
    "Rare Disease": {
      "overall_score": 71.5,
      "trend": "positive",
      "catalyst_count": 15,
      "success_rate": 0.67,
      "rank": 2,
      "percentile": 75.0
    },
    "Neurology": {
      "overall_score": 45.2,
      "trend": "neutral",
      "catalyst_count": 10,
      "success_rate": 0.4,
      "rank": 3,
      "percentile": 50.0
    }
  }
}
```

**Use Cases:**
- Identify "hot" therapeutic areas for thematic investing
- Spot emerging trends across sectors
- Compare relative momentum for portfolio allocation

### 5. Upcoming Predictions Batch

**Endpoint:** `GET /api/v1/predictions/upcoming?limit=20&min_confidence=0.6`

Get timing and outcome predictions for all upcoming catalysts.

**Response:**
```json
{
  "count": 15,
  "predictions": [
    {
      "catalyst_id": 123,
      "company": "Biotech Corp",
      "drug_name": "BTC-101",
      "description": "Phase 3 Readout",
      "scheduled_date": "2025-06-30T00:00:00",
      "timing_prediction": { ... },
      "outcome_prediction": { ... }
    },
    ...
  ]
}
```

**Parameters:**
- `limit` (default: 20): Maximum number of predictions
- `min_confidence` (default: 0.0): Filter by minimum confidence score

## Models & Methodology

### Timing Prediction Model

**Approach:** Parametric survival analysis using Weibull distributions

**Data:** Historical trial duration patterns by phase and indication

**Default Durations (mean, std_dev in days):**
- Phase 1 Readout: (365, 180)
- Phase 2 Readout: (730, 210)
- Phase 3 Readout: (1095, 365)
- FDA Decision: (365, 90)
- PDUFA: (365, 30) - most predictable

**Adjustments:**
- Oncology trials: 10% faster (unmet need accelerates)
- Regulatory events: Tighter confidence intervals

**Output:** Probability distribution over time with quarterly aggregation

### Outcome Prediction Model

**Approach:** Bayesian inference with industry priors and drug-specific evidence

**Priors:** Industry success rates from BIO Industry Analysis 2016-2020
- Vary by phase (Phase 1: 63%, Phase 2: 30%, Phase 3: 48%)
- Vary by indication (Rare disease higher, neurology lower)

**Evidence Updates:**
1. **Prior Phase Success** (+30% boost max): Track record matters
2. **Biomarker Enrichment** (+10%): Genetic validation
3. **Hard Endpoints** (+5%): Direct clinical benefit vs surrogate
4. **Large Trial Size** (+3%): Well-powered studies (n>500)

**Formula:**
```
Posterior = Prior + Σ(Evidence Factors)
Clamped to [0.05, 0.95] to avoid overconfidence
```

**Confidence:** Increases with more evidence factors (0.6 base → 0.9 max)

### Momentum Scoring Model

**Approach:** Weighted success rate with cadence, recency, and streak adjustments

**Formula:**
```
Score = (Success_Rate × 100) + Cadence_Boost + Recency_Adj + Streak_Bonus
```

**Components:**
1. **Success Rate**: Proportion of positive outcomes (0-100 base)
2. **Cadence Boost**: +2 points per catalyst, max +20
3. **Recency Weighting**: Exponential decay (recent events weighted 2x)
4. **Streak Bonus**: ±5 points per consecutive win/loss, max ±15

**Trend Classification:**
- Strong Positive: Score ≥75 OR (success_rate ≥0.7 AND streak ≥2)
- Positive: Score ≥60 OR success_rate ≥0.6
- Neutral: Score 40-60
- Negative: Score ≤40 OR success_rate ≤0.4
- Strong Negative: Score ≤25 OR (success_rate ≤0.3 AND streak ≤-2)

## Usage Examples

### Python SDK

```python
import requests

BASE_URL = "http://localhost:8000/api/v1/predictions"

# Predict timing for catalyst
response = requests.get(f"{BASE_URL}/predict/timing/123")
timing = response.json()
print(f"Predicted date: {timing['predicted_date']}")
print(f"Q2 2025 probability: {timing['probability_by_quarter']['Q2 2025']}")

# Predict outcome
response = requests.get(f"{BASE_URL}/predict/outcome/123")
outcome = response.json()
print(f"Success probability: {outcome['probability_of_success']}")
for factor in outcome['evidence_factors']:
    print(f"  - {factor['factor']}: {factor['impact']}")

# Get company momentum
response = requests.get(f"{BASE_URL}/momentum/company/Biotech Corp")
momentum = response.json()
print(f"Momentum score: {momentum['overall_score']} ({momentum['trend']})")
print(f"Success rate: {momentum['success_rate']}")

# Compare therapeutic areas
response = requests.get(f"{BASE_URL}/momentum/therapeutic-areas")
areas = response.json()['areas']
for area, data in sorted(areas.items(), key=lambda x: x[1]['rank']):
    print(f"{area}: {data['overall_score']} (rank {data['rank']})")
```

### TypeScript/React

```typescript
// Fetch prediction for catalyst
const fetchPrediction = async (catalystId: number) => {
  const response = await fetch(`/api/v1/predictions/predict/outcome/${catalystId}`);
  const prediction = await response.json();
  return prediction;
};

// Component
function CatalystPrediction({ catalystId }: { catalystId: number }) {
  const [prediction, setPrediction] = useState(null);
  
  useEffect(() => {
    fetchPrediction(catalystId).then(setPrediction);
  }, [catalystId]);
  
  if (!prediction) return <div>Loading...</div>;
  
  return (
    <div>
      <h3>Success Probability: {(prediction.probability_of_success * 100).toFixed(1)}%</h3>
      <div>Confidence: {prediction.confidence_interval.lower} - {prediction.confidence_interval.upper}</div>
      
      <h4>Evidence Factors:</h4>
      <ul>
        {prediction.evidence_factors.map(factor => (
          <li key={factor.factor}>
            <strong>{factor.impact}</strong> - {factor.rationale}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Testing

```bash
# Run prediction tests
poetry run pytest tests/prediction/ -v

# Test coverage
poetry run pytest tests/prediction/ --cov=bt_platform.core.prediction --cov-report=html
```

**Test Coverage:**
- ✅ Timing prediction with various catalyst types
- ✅ Outcome prediction with evidence factors
- ✅ Momentum scoring with successes/failures
- ✅ Streak detection and recency weighting
- ✅ Therapeutic area comparisons

## Future Enhancements

### Module 2: Structured Event Archive (Planned)
- Graph database for entity relationships
- Time-series queries with DuckDB
- Automated insights generation

### Module 4: Signal Composition Layer (Planned)
- Composite alpha signals combining predictions + market data
- Risk-adjusted portfolio recommendations
- Event-driven strategy backtesting

### Module 5: iOS SwiftUI App (Planned)
- Native mobile interface
- Push notifications for high-confidence predictions
- Interactive catalyst calendar

### Advanced ML Models (Planned)
- Neural networks for complex pattern recognition
- Hawkes processes for catalyst clustering
- Graph neural networks for cross-company impact

## Data Sources

**Current:**
- Industry base rates from BIO Industry Analysis 2016-2020
- Historical duration patterns (parameterized models)

**Planned Integrations:**
- ClinicalTrials.gov API v2 for real-time trial data
- FDA PDUFA calendar for regulatory timelines
- SEC EDGAR for 8-K catalyst filings
- PubMed for scientific evidence

## Performance

**API Response Times:**
- Timing prediction: <50ms
- Outcome prediction: <50ms
- Company momentum: <100ms (depends on catalyst count)
- Therapeutic area momentum: <200ms (multiple aggregations)

**Caching:**
- Predictions cached for 30 minutes (configurable)
- Cache invalidation on catalyst updates

## Security

**Authentication:**
- Read-only endpoints: Public access
- Write operations: API token required

**Rate Limiting:**
- 60 requests/minute per IP (configurable)

## License

MIT - Open source biotech intelligence platform

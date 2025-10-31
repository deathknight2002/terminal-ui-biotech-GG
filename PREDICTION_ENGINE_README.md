# Enhanced Prediction Engine

Advanced prediction capabilities for biotech catalyst events with Weibull timing, Bayesian outcome prediction, and momentum scoring.

## Overview

This module implements sophisticated prediction models for pharmaceutical catalyst events, including:

- **Weibull-based timing predictions** with quarterly probability distributions
- **Bayesian outcome prediction** with evidence stacking in odds space
- **Advanced momentum scoring** with recency decay, streak detection, and therapeutic area comparison
- **Adapter pattern** for clean separation between prediction logic and data access
- **Backtest & calibration tools** for tuning parameters from historical data

## Quick Start

### Installation

The prediction engine uses only standard library dependencies plus SQLAlchemy and Pydantic (already in the project):

```bash
# Already included in project dependencies
poetry install
```

### Basic Usage

```python
from bt_platform.core.prediction import (
    predict_quarterly_distribution,
    predict_outcome_bayesian,
    score_company_advanced,
)

# 1. Timing Prediction
timing = predict_quarterly_distribution(
    catalyst_type="TRIAL_READOUT",
    phase="P3",
    anchor_date=trial_start_date,
    therapeutic_area="Oncology",
)
# Returns: quarterly_probabilities, confidence, bins

# 2. Outcome Prediction
outcome = predict_outcome_bayesian(
    phase="P3",
    therapeutic_area="Rare Disease",
    prior_phase_success=True,
    biomarker_enrichment=True,
    hard_endpoints=True,
    large_trial=True,
)
# Returns: probability_of_success, evidence_factors, prior_probability

# 3. Momentum Scoring
momentum = score_company_advanced(
    company_events=[(date, polarity, weight), ...],
    ta_events_map={"Oncology": [...], "Cardiology": [...]},
)
# Returns: momentum_score (0-100), components, event_count
```

### Run the Demo

```bash
python scripts/demo_prediction_engine.py
```

This demonstrates all three prediction types with real examples.

## Architecture

### Module Structure

```
bt_platform/core/prediction/
├── __init__.py              # Public API exports
├── adapters.py              # Database adapter layer (400+ lines)
├── timing_predictor.py      # Weibull timing models
├── outcome_predictor.py     # Bayesian outcome prediction
├── momentum_scorer.py       # Advanced momentum scoring
└── backtest_calibrate.py    # Calibration tools (300+ lines)
```

### Key Design Principles

1. **Adapter Pattern**: Clean separation between prediction logic and data access
2. **Backward Compatibility**: Original functions remain unchanged, new functions added
3. **Statistical Rigor**: Industry-standard models (Weibull, Bayesian inference)
4. **Interpretability**: Clear component breakdown and evidence factors
5. **Calibration**: Tools to tune parameters from historical data

## Features

### 1. Weibull Timing Prediction

Uses Weibull distributions to model time-to-event for catalyst readouts:

```python
timing = predict_quarterly_distribution(
    catalyst_type="TRIAL_READOUT",  # or "PDUFA"
    phase="P3",
    anchor_date=trial_start_date,
    pdufa_date=None,  # Optional for PDUFA type
    therapeutic_area="Oncology",
)
```

**Key Features:**
- PDUFA dates: 90% confidence point mass in target quarter
- Trial readouts: Weibull distribution from anchor date
- Therapeutic area adjustments (Oncology 0.9x, Rare Disease 1.1x)
- Confidence scaling by phase (P1: 50%, P2: 55%, P3: 60%, FDA: 70%)
- Returns quarterly probabilities over next 4 quarters

**Parameters:**
- `k` (shape): Controls distribution shape (default by phase)
- `λ` (scale): Controls timing spread (default by phase, adjusted by TA)

### 2. Bayesian Outcome Prediction

Bayesian model with industry priors and evidence-based updates:

```python
outcome = predict_outcome_bayesian(
    phase="P3",
    therapeutic_area="Rare Disease",
    prior_phase_success=True,
    biomarker_enrichment=True,
    hard_endpoints=True,
    large_trial=True,
)
```

**Base Priors (BIO 2016-2020 data):**
- Phase 1: 63%
- Phase 2: 30%
- Phase 3: 48%
- FDA Approval: 85%

**Therapeutic Area Adjustments:**
- Rare Disease: +14% absolute uplift
- (Others can be added based on calibration)

**Evidence Impacts (multiplicative in odds space):**
- Prior phase success: +15% odds
- Biomarker enrichment: +10% odds
- Hard clinical endpoints: +5% odds
- Large trial size: +3% odds

**Why Odds Space?**

Evidence is applied multiplicatively in odds space (not probability space) for proper Bayesian stacking:

```
Prior Prob → Odds → Apply Evidence → Back to Prob
```

This ensures evidence factors compound correctly.

### 3. Advanced Momentum Scoring

Multi-component momentum score (0-100) with recency weighting:

```python
momentum = score_company_advanced(
    company_events=[
        (date, polarity, weight),  # polarity: +1 or -1
        ...
    ],
    ta_events_map={
        "Oncology": [(date, polarity, weight), ...],
        "Cardiology": [...],
    },
)
```

**Components:**

1. **Base Momentum** - Exponential decay weighting
   - 30-day half-life: recent events weigh more
   - Formula: `weight = 0.5^(days_ago / 30)`

2. **Streak Bonus** - Consecutive win/loss detection
   - ±6 points per streak step
   - Capped at 5 consecutive events
   - Encourages consistent performance

3. **TA Z-Score** - Peer comparison
   - Compares company to therapeutic area peers
   - Z-score standardization (μ, σ)
   - 35% weight in final score

**Final Scaling:**
```
combined = base + streak + 0.35 * ta_z
score = 50 + 50 * tanh(0.25 * combined)  # Squash to 0-100
```

### 4. Adapter Layer

Clean interface between prediction engine and database:

```python
from bt_platform.core.prediction.adapters import (
    get_catalyst_by_id,
    get_company_outcomes,
    get_ta_outcomes,
    list_upcoming_catalysts,
)

# Get catalyst in prediction format
catalyst = get_catalyst_by_id(db, catalyst_id)

# Get company outcome history
events = get_company_outcomes(db, "Tectonic Therapeutic", lookback_days=730)

# Get TA outcomes for comparison
ta_map = get_ta_outcomes(db, lookback_days=730)

# List upcoming catalysts
upcoming = list_upcoming_catalysts(db, limit=20)
```

**Adapter Benefits:**
- Converts database models to prediction format
- Handles missing data gracefully
- Provides mock data for development
- Single source of truth for data transformations

### 5. Backtest & Calibration

Tools to tune parameters from historical data:

```python
from bt_platform.core.prediction.backtest_calibrate import (
    calibrate_weibull_by_phase,
    calculate_reliability_curve,
    backtest_momentum_scoring,
    run_calibration_suite,
)

# Calibrate Weibull parameters
params = calibrate_weibull_by_phase(historical_catalysts)
# Returns: {phase: (k, λ)}

# Check outcome calibration
reliability = calculate_reliability_curve(predictions, outcomes)
# Returns: calibration_curve, brier_score

# Backtest momentum
results = backtest_momentum_scoring(company_history)
# Returns: correlation, n_datapoints

# Run full suite
results = run_calibration_suite("data/historical.json")
```

## API Endpoints

### V2 Enhanced Endpoints

All enhanced endpoints are under `/v2/` prefix to maintain backward compatibility.

#### GET `/v2/predict/timing/{catalyst_id}`

Weibull-based quarterly timing prediction.

**Response:**
```json
{
  "catalyst_type": "TRIAL_READOUT",
  "phase": "P3",
  "reference": "Weibull(k=1.6, λ=540)",
  "quarterly_probabilities": [0.25, 0.20, 0.15, 0.00],
  "bins": [["2025-10-01", "2025-12-31"], ...],
  "confidence": 0.60,
  "outside_window": 0.40,
  "catalyst": {
    "id": "123",
    "ticker": "TECX",
    "company": "Tectonic Therapeutic",
    "therapeutic_area": "Cardiovascular"
  }
}
```

#### GET `/v2/predict/outcome/{catalyst_id}`

Bayesian outcome prediction with odds-space evidence stacking.

**Response:**
```json
{
  "probability_of_success": 0.691,
  "prior_probability": 0.480,
  "evidence_factors": [
    {
      "factor": "prior_phase_success",
      "impact": "+15%",
      "description": "Prior phase(s) met endpoints"
    },
    ...
  ],
  "model": "bayesian_odds",
  "catalyst": {...}
}
```

#### GET `/v2/momentum/company/{company_name}`

Advanced momentum score with decay, streaks, and TA comparison.

**Query Params:**
- `lookback_days` (default: 730, max: 1460)

**Response:**
```json
{
  "company": "Tectonic Therapeutic",
  "momentum_score": 75.3,
  "components": {
    "base": 1.2,
    "streak": 12.0,
    "ta_z": 1.5
  },
  "event_count": 5,
  "lookback_days": 730
}
```

#### GET `/v2/momentum/therapeutic-areas`

TA momentum comparison with rankings.

**Query Params:**
- `lookback_days` (default: 730, max: 1460)

**Response:**
```json
{
  "lookback_days": 730,
  "therapeutic_areas": {
    "Oncology": {
      "momentum_score": 68.5,
      "components": {...},
      "event_count": 42,
      "rank": 1,
      "percentile": 100.0
    },
    ...
  }
}
```

#### GET `/v2/upcoming`

Enhanced upcoming catalyst predictions.

**Query Params:**
- `limit` (default: 20, max: 100)
- `min_confidence` (default: 0.6, range: 0.0-1.0)

**Response:**
```json
{
  "count": 15,
  "min_confidence": 0.6,
  "upcoming": [
    {
      "catalyst_id": "123",
      "ticker": "TECX",
      "company": "Tectonic Therapeutic",
      "therapeutic_area": "Cardiovascular",
      "catalyst_type": "TRIAL_READOUT",
      "phase": "P3",
      "timing": {...},
      "outcome": {...}
    },
    ...
  ]
}
```

### V1 Endpoints (Legacy)

Original endpoints remain unchanged:
- `/predict/timing/{catalyst_id}`
- `/predict/outcome/{catalyst_id}`
- `/momentum/company/{company_name}`
- `/momentum/therapeutic-areas`
- `/predictions/upcoming`

## Testing

### Run All Tests

```bash
# Run enhanced prediction tests (37 tests)
pytest tests/prediction/test_enhanced_prediction.py -v

# Run original prediction tests (12 tests)
pytest tests/prediction/test_prediction.py -v

# Run all prediction tests (49 total)
pytest tests/prediction/ -v
```

### Test Coverage

- **TestAdapters**: Adapter layer functionality (2 tests)
- **TestWeibullTiming**: Timing predictions (8 tests)
- **TestBayesianOutcome**: Outcome predictions (10 tests)
- **TestAdvancedMomentum**: Momentum scoring (16 tests)
- **TestIntegration**: End-to-end workflow (1 test)
- **Original Tests**: Backward compatibility (12 tests)

All 49 tests passing ✅

## Calibration Guide

### 1. Prepare Historical Data

Create a JSON file with historical catalyst data:

```json
{
  "catalysts": [
    {
      "phase": "P3",
      "start_date": "2023-01-01",
      "end_date": "2024-06-01"
    },
    ...
  ],
  "outcome_predictions": [
    {"probability_of_success": 0.65},
    ...
  ],
  "outcome_actuals": [true, false, true, ...],
  "company_histories": {
    "Company A": [
      {"date": "2023-01-01", "polarity": 1, "weight": 1.0},
      ...
    ]
  }
}
```

### 2. Run Calibration Suite

```bash
python -m bt_platform.core.prediction.backtest_calibrate data/historical.json
```

This will:
- Fit Weibull parameters per phase
- Calculate reliability curves for outcome predictions
- Backtest momentum scoring predictive power
- Save results to `data/historical_calibration_results.json`

### 3. Update Parameters

Edit parameter constants in the prediction modules:

- `timing_predictor.py`: `DEFAULT_WEIBULL_PARAMS`
- `outcome_predictor.py`: `EVIDENCE_ODDS_MULT`
- `momentum_scorer.py`: `HALF_LIFE_DAYS`, `STREAK_UNIT`, `TA_Z_WEIGHT`

## Performance Considerations

### Computational Complexity

- **Timing Prediction**: O(1) - Simple Weibull CDF evaluations
- **Outcome Prediction**: O(1) - Fixed number of evidence factors
- **Momentum Scoring**: O(n log n) - Sorting events by date
- **Adapter Queries**: O(n) - Database query complexity

### Caching Recommendations

For high-traffic production use:
1. Cache catalyst adapter results (TTL: 1 hour)
2. Cache TA outcomes (TTL: 6 hours)
3. Precompute predictions for upcoming catalysts (daily batch)
4. Use Redis for distributed caching

## Troubleshooting

### Common Issues

**Issue**: Predictions return mock data
- **Cause**: Catalyst not found in database
- **Fix**: Verify catalyst ID exists, or use mock IDs for development

**Issue**: Low timing confidence
- **Cause**: Missing anchor_date or phase information
- **Fix**: Ensure catalyst has trial_start_date or created_at

**Issue**: Unexpected outcome probabilities
- **Cause**: Evidence factors not mapped correctly from DB
- **Fix**: Check adapter mappings in `adapters.py`

**Issue**: Momentum score stuck at 50
- **Cause**: No recent outcome history
- **Fix**: Ensure catalysts have status/outcome fields populated

## Future Enhancements

Planned improvements (from issue spec):

1. **Hawkes Process**: Model clustered catalyst timing (post-readout waves)
2. **Market Reaction Priors**: Incorporate expected price moves into scoring
3. **Conference Calendar Integration**: Tighten timing windows around major events
4. **Replay Backtesting**: Day-by-day PnL simulation for strategy validation
5. **Per-Indication Calibration**: TA-specific parameter tuning
6. **Continuous Calibration**: Auto-update parameters as new data arrives

## References

- **BIO Industry Analysis 2016-2020**: Clinical success rates by phase
- **Weibull Distribution**: Time-to-event modeling in reliability theory
- **Bayesian Inference**: Updating beliefs with evidence
- **Exponential Decay**: Recency weighting in time series
- **Z-Score Normalization**: Peer comparison standardization

## Contributing

When adding new features:

1. **Maintain backward compatibility**: Don't break existing functions
2. **Add comprehensive tests**: Aim for >90% coverage
3. **Update calibration tools**: Add backtest support for new features
4. **Document parameters**: Explain all tunable constants
5. **Follow adapter pattern**: Keep prediction logic separate from data access

## License

MIT License - See LICENSE file for details

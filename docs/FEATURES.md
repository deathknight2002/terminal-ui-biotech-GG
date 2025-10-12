# Feature Definitions and Engineering

## Overview

The feature store provides a versioned, deterministic set of features for catalyst event prediction. All features are materialized as FeatureSnapshots with content-addressable hashing for reproducibility.

## Feature Schema Version: v1.0

### Clinical Trial Features

#### 1. `phase_encoded` (float, 0-1)
**Definition**: Numeric encoding of development phase.
```
Preclinical: 0.0
Phase I:     0.25
Phase II:    0.50
Phase III:   0.75
Filed:       0.90
Approved:    1.0
```
**Rationale**: Linear progression assumption, higher phase = more mature.
**Drift Check**: Monitor phase distribution shifts in new data.

#### 2. `sample_size` (int)
**Definition**: Enrollment target for pivotal trial.
**Transformation**: Log(sample_size) / 10 for normalization.
**Rationale**: Larger trials generally have lower variance, higher confidence.
**Drift Check**: Alert if median sample size changes >20% QoQ.

#### 3. `endpoint_hardness` (float, 0-1)
**Definition**: Clarity and objectivity of primary endpoint.
```
Hard (1.0):   Overall survival, objective response rate
Medium (0.5): Progression-free survival, time-to-event
Soft (0.0):   Symptom scores, quality of life, surrogate markers
```
**Rationale**: Harder endpoints correlate with regulatory acceptance.
**Drift Check**: Track endpoint type distribution over time.

#### 4. `enrollment_velocity` (float)
**Definition**: Patients enrolled per month.
```
velocity = enrollment_actual / months_since_start
```
**Rationale**: Fast enrollment indicates strong interest, feasible design.
**Drift Check**: Alert if median velocity drops >30%.

#### 5. `prior_effect_size` (float)
**Definition**: Mean effect size from related historical programs.
```
related = programs with same target, indication, or mechanism
effect_size = ln(HR) or standardized mean difference
```
**Rationale**: Class prior information; similar mechanisms behave similarly.
**Drift Check**: Update priors annually as new data accumulates.

#### 6. `safety_score` (float, 0-1)
**Definition**: Inverse of safety concerns based on FAERS data.
```
safety_score = 1 - (adverse_events_rate / baseline_rate)
Clipped to [0, 1]
```
**Rationale**: High adverse event rates predict failure or black box warnings.
**Drift Check**: Monitor for sudden spikes in adverse events.

---

### Market and Sentiment Features

#### 7. `options_implied_move` (float)
**Definition**: At-the-money straddle price as % of stock price.
```
implied_move = (ATM_call_price + ATM_put_price) / stock_price
```
**Rationale**: Market's expectation of volatility around event.
**Drift Check**: Compare to historical volatility; alert if ratio >2x.

#### 8. `short_interest_pct` (float, 0-100)
**Definition**: % of float sold short.
**Source**: FINRA bi-monthly reports, interpolated.
**Rationale**: High short interest may amplify moves (short squeeze risk).
**Drift Check**: Track median short interest across biotech sector.

#### 9. `consensus_dispersion` (float)
**Definition**: Standard deviation of analyst price targets.
```
dispersion = std(price_targets) / mean(price_targets)
```
**Rationale**: Wide dispersion = high uncertainty, potential surprise.
**Drift Check**: Alert if dispersion increases >50% MoM.

#### 10. `pr_cadence_30d` (int)
**Definition**: Number of press releases in trailing 30 days.
**Source**: Company IR pages, SEC 8-K filings.
**Rationale**: High PR cadence may indicate pre-event positioning.
**Drift Check**: Compare to company historical baseline.

---

### Historical Priors and Baselines

#### 11. `class_prior_success_rate` (float, 0-1)
**Definition**: Historical success rate for similar events.
```
similar_events = events with same (indication, phase, event_type)
success_rate = count(successes) / count(total)
Min N = 10 for credibility
```
**Rationale**: Strong base rate information; avoid overfitting.
**Drift Check**: Recalculate priors annually; alert if >10% shift.

#### 12. `conference_tier` (float, 0-1)
**Definition**: Prestige of conference for data presentation.
```
Tier 1 (1.0):   ASCO, ESMO, ASH, AHA (plenary sessions)
Tier 2 (0.7):   ASCO/ESMO posters, regional conferences
Tier 3 (0.3):   Company webcasts, investor days
None (0.0):     No presentation scheduled
```
**Rationale**: Top-tier venues signal confidence, higher impact.
**Drift Check**: Track venue selection patterns.

---

### Timing and Execution Features

#### 13. `timing_clarity_score` (float, 0-1)
**Definition**: Certainty of event date.
```
PDUFA date:           1.0
AdCom meeting:        0.95
Data readout (fixed): 0.8
Event-driven fog:     0.3
```
**Rationale**: Clear dates reduce positioning risk, increase attention.
**Drift Check**: N/A (categorical).

#### 14. `event_leverage` (float, 0-1)
**Definition**: Importance of event to company valuation.
```
leverage = program_NPV / company_market_cap
Clipped to [0, 1]
```
**Rationale**: Binary events on large programs drive outsized moves.
**Drift Check**: Recalculate as market cap changes.

#### 15. `market_depth` (float)
**Definition**: Total addressable market (TAM) relevance.
```
market_depth = ln(TAM_USD) / ln(100B)
Clipped to [0, 1]
```
**Rationale**: Large markets attract attention, justify premium valuations.
**Drift Check**: Update TAM estimates annually.

---

### Derived and Interaction Features

#### 16. `read_through_risk` (float, 0-1)
**Definition**: Likelihood of correlated moves across similar programs.
```
read_through = count(related_programs_active) / 10
```
**Rationale**: Failed mechanisms poison the well; successes lift class.
**Drift Check**: Track class-level correlations.

#### 17. `days_to_event` (int)
**Definition**: Calendar days from feature snapshot to expected event date.
**Transformation**: Bucketed into [0-30, 31-60, 61-90, 91-180, 180+].
**Rationale**: Captures time decay and positioning dynamics.
**Drift Check**: N/A (time-based).

#### 18. `volatility_rank` (float, 0-100)
**Definition**: Current IV percentile vs 1-year history.
```
rank = percentile(current_iv, historical_iv_1y)
```
**Rationale**: High rank = elevated expectations, potential mean reversion.
**Drift Check**: Track sector-wide volatility regime shifts.

#### 19. `analyst_coverage_count` (int)
**Definition**: Number of analysts with active coverage.
**Rationale**: More coverage = more attention, liquidity.
**Drift Check**: Alert if coverage drops >50%.

#### 20. `liquidity_score` (float, 0-1)
**Definition**: Composite of avg daily volume and bid-ask spread.
```
liquidity = min(1, (avg_volume_30d / 1M)) * (1 - spread_bps / 100)
```
**Rationale**: Illiquid stocks may have exaggerated moves or execution risk.
**Drift Check**: Monitor for liquidity deterioration.

---

## Feature Engineering Pipeline

### Step 1: Raw Data Collection
- Fetch latest trial data, market data, and historical outcomes
- Store in Postgres tables (Trial, CatalystEvent, PriceBar, OptionsSnapshot)

### Step 2: Feature Computation
```python
from ml.features import FeatureEngineer

engineer = FeatureEngineer()
features = engineer.build_features(catalyst_event_id=123)
```

### Step 3: Versioning and Hashing
```python
import hashlib, json

feature_json = json.dumps(features, sort_keys=True)
feature_hash = hashlib.sha256(feature_json.encode()).hexdigest()

feature_snapshot = FeatureSnapshot(
    catalyst_event_id=123,
    feature_schema_version="v1.0",
    hash=feature_hash,
    features_json=features,
    **features  # Unpack for columnar storage
)
```

### Step 4: Validation
- Check for missing values (impute with class medians)
- Verify feature ranges (clip outliers to 99th percentile)
- Flag anomalies for manual review

---

## Drift Detection

### Statistical Tests
- **KS Test**: Compare feature distributions (training vs production)
- **PSI** (Population Stability Index): Alert if PSI > 0.2
- **Chi-Square**: For categorical features (phase, event_type)

### Monitoring Cadence
- **Daily**: Check for nulls, range violations
- **Weekly**: Distribution comparisons (KS test)
- **Monthly**: PSI calculation, feature importance tracking

### Alerting Thresholds
- **Critical**: PSI > 0.25, missing > 5%
- **Warning**: PSI 0.15-0.25, new categories, outliers > 2%

### Remediation
1. Investigate root cause (data source change, market regime shift)
2. Retrain model with recent data if drift confirmed
3. Update feature definitions if necessary
4. Increment schema version (v1.0 → v1.1)

---

## Feature Importance

### SHAP Values
- Compute Shapley values for each prediction
- Aggregate top features across all predictions
- Store in `prediction_explanations` table

### Expected Top Features (by historical importance)
1. `class_prior_success_rate` (25%)
2. `endpoint_hardness` (18%)
3. `phase_encoded` (15%)
4. `options_implied_move` (12%)
5. `event_leverage` (10%)

### Visualization
- SHAP waterfall plots for individual predictions
- SHAP beeswarm plots for global importance

---

## Feature Schema Evolution

### Adding New Features
1. Define feature in this document
2. Implement in `ml/features/engineer.py`
3. Backfill historical snapshots
4. Increment schema version
5. Retrain models with new features

### Deprecating Features
1. Mark as deprecated in schema (keep for compatibility)
2. Stop computing in new snapshots
3. Remove from model training after 90 days
4. Archive historical data

### Version Management
```
v1.0: Initial 20 features (2024-01-01)
v1.1: Add sentiment_score, remove analyst_coverage_count (2024-06-01)
v2.0: Major refactor, add interaction terms (2025-01-01)
```

---

## Feature Store Interface

### Read Features
```python
from platform.core.schema import FeatureSnapshot

snapshot = db.query(FeatureSnapshot).filter(
    FeatureSnapshot.catalyst_event_id == 123,
    FeatureSnapshot.feature_schema_version == "v1.0"
).first()

features = snapshot.features_json
```

### Write Features
```python
from ml.features import FeatureEngineer

engineer = FeatureEngineer()
feature_snapshot = engineer.create_snapshot(catalyst_event_id=123)
db.add(feature_snapshot)
db.commit()
```

### Batch Processing
```python
# Materialize features for all upcoming catalysts
upcoming = db.query(CatalystEvent).filter(
    CatalystEvent.expected_date.between(today, today + timedelta(days=365))
).all()

for event in upcoming:
    engineer.create_snapshot(catalyst_event_id=event.id)
```

---

## Testing

### Unit Tests
- Test each feature computation independently
- Verify edge cases (nulls, zeros, extremes)
- Check idempotency (same inputs → same outputs)

### Integration Tests
- End-to-end pipeline from raw data to features
- Verify schema compliance (Pydantic contracts)
- Test hash stability across runs

### Golden Fixtures
- Store known-good feature snapshots as test fixtures
- Regression test: ensure new code produces same features

---

## Performance

### Computation Time
- Single catalyst: ~50ms
- Batch (100 catalysts): ~3s
- Full refresh (1000+ catalysts): ~30s

### Storage
- Per snapshot: ~2 KB (JSON + columns)
- 1000 events * 12 months: ~24 MB

### Caching
- Cache expensive computations (class priors, TAM estimates)
- Invalidate daily or on data updates

---

## References

- Feature engineering best practices: Kuhn & Johnson, *Feature Engineering and Selection* (2019)
- Drift detection: Gama et al., *A Survey on Concept Drift Adaptation* (2014)
- SHAP values: Lundberg & Lee, *A Unified Approach to Interpreting Model Predictions* (2017)

# MVM Alpha Production Validation System

## Overview

This system transforms the MVM alpha scoring into a robust production system with institutional-grade validation hygiene through López de Prado's purged cross-validation, probability calibration, risk-constrained position sizing, real-time drift monitoring, and biotech-specific stress testing.

## Components

### 1. Purged Cross-Validation (`purged_cv.py`)

Implements López de Prado's combinatorially purged cross-validation to eliminate lookahead bias in time-series models.

**Key Features:**
- K-fold cross-validation with temporal ordering
- Purging of overlapping samples between train and test
- Embargo periods to prevent information leakage
- Timestamp validation

**Usage:**
```python
from bt_platform.core.validation import PurgedKFold, EmbargoValidator

# Create validator
cv = PurgedKFold(
    n_splits=5,
    embargo_pct=0.01,  # 1% embargo
    purge_pct=0.02      # 2% purge
)

# Split data
for train_idx, test_idx in cv.split(X, y, pred_times, eval_times):
    # Train and evaluate model
    pass

# Validate no leakage
validator = EmbargoValidator()
result = validator.validate_no_leakage(train_idx, test_idx, pred_times, eval_times)
```

**Reference:** "Advances in Financial Machine Learning" by Marcos López de Prado, Chapter 7

---

### 2. Probability Calibration (`probability_calibration.py`)

Converts raw MVM scores into properly calibrated probabilities using Platt scaling or isotonic regression.

**Key Features:**
- Platt scaling (parametric logistic calibration)
- Isotonic regression (non-parametric calibration)
- Auto-selection via out-of-fold log loss
- Brier score and ECE tracking

**Usage:**
```python
from bt_platform.core.validation import AutoCalibrator

# Fit calibrator with auto-selection
calibrator = AutoCalibrator()
best_method = calibrator.fit(scores, labels)

# Predict calibrated probabilities
calibrated_probs = calibrator.predict_proba(new_scores)

# Evaluate calibration
metrics = calibrator.evaluate(test_scores, test_labels)
print(f"Brier Score: {metrics.brier_score:.4f}")
print(f"ECE: {metrics.ece:.4f}")
```

**Calibration Metrics:**
- **Brier Score**: Mean squared error of probabilities (0 = perfect)
- **Log Loss**: Cross-entropy loss (lower is better)
- **ECE**: Expected Calibration Error (average deviation from perfect calibration)
- **MCE**: Maximum Calibration Error (worst bin deviation)

---

### 3. Position Sizing (`position_sizing.py`)

Quarter-Kelly position sizing with comprehensive risk constraints.

**Key Features:**
- Kelly Criterion-based sizing (25% of full Kelly for safety)
- 8% maximum position cap
- 10% ADV (Average Daily Volume) limits
- Volatility dampening above 50% realized volatility
- Drawdown throttling (linear reduction 10-20%, kill switch at 20%)

**Usage:**
```python
from bt_platform.core.validation import PositionSizer, PositionSizingConfig

# Configure position sizer
config = PositionSizingConfig(
    kelly_fraction=0.25,
    max_position_pct=0.08,
    max_adv_pct=0.10,
    volatility_threshold=0.50,
    drawdown_critical_pct=0.20
)

sizer = PositionSizer(config)
sizer.set_portfolio_state(
    portfolio_value=1_000_000,
    current_drawdown=0.08,
    current_positions={'EXISTING': 0.15}
)

# Calculate position
rec = sizer.calculate_position(
    ticker='CELC',
    win_prob=0.85,
    expected_gain_pct=0.35,
    expected_loss_pct=0.15,
    current_price=50.0,
    avg_daily_volume=500_000,
    realized_volatility=0.45
)

print(f"Recommended: {rec.final_position_pct:.1%}")
print(f"Kill switch: {rec.kill_switch_active}")
```

**Risk Constraints:**
1. **Portfolio Cap**: Maximum 8% per position
2. **ADV Limit**: Maximum 10% of average daily volume
3. **Volatility Dampening**: Reduce position by 50% when vol > 50%
4. **Drawdown Throttling**:
   - 10-20% drawdown: Linear reduction
   - >20% drawdown: Kill switch (no new positions)

---

### 4. Drift Monitoring (`drift_monitoring.py`)

Real-time monitoring of feature and score distributions using PSI and KS tests.

**Key Features:**
- Population Stability Index (PSI) with <0.2 threshold
- Kolmogorov-Smirnov tests for distribution comparison
- Automatic exposure reduction on drift detection
- Alert generation

**Usage:**
```python
from bt_platform.core.validation import DriftMonitor

# Initialize monitor
monitor = DriftMonitor(
    psi_threshold=0.2,
    ks_pvalue_threshold=0.05
)

# Set baseline distribution
baseline_features = ['mvm_score', 'win_prob', 'volatility']
monitor.set_baseline(baseline_df, baseline_features)

# Add new observations
monitor.add_observations(current_df, baseline_features)

# Check for drift
drift_status = monitor.check_drift(baseline_features)

for feature, metrics in drift_status.items():
    if metrics.drift_detected:
        print(f"⚠️ Drift in {feature}: PSI={metrics.psi_value:.3f}")

# Get exposure adjustment
print(f"Exposure multiplier: {monitor.get_exposure_multiplier():.1%}")
```

**PSI Interpretation:**
- PSI < 0.1: No significant change
- 0.1 ≤ PSI < 0.2: Moderate change, investigate
- PSI ≥ 0.2: Significant change, recalibrate model

**Automatic Actions:**
- **Medium drift** (0.15-0.2): Reduce exposure to 75%
- **High/Critical drift** (>0.2): Reduce exposure to 50%

---

### 5. Stress Testing (`stress_testing.py`)

Biotech-specific stress test scenarios.

**Key Scenarios:**
1. **Binary Readout Shocks**: ±40% moves on Phase 3 trial results
2. **CRL Cascades**: Multiple Complete Response Letters causing sector sell-off
3. **AdCom Volatility**: FDA Advisory Committee uncertainty
4. **Sector Drawdowns**: XBI ETF drawdowns (20% and 35%)
5. **Regulatory Shock**: FDA policy changes

**Usage:**
```python
from bt_platform.core.validation import BiotechStressTester

# Create portfolio
portfolio = pd.DataFrame([
    {
        'ticker': 'CELC',
        'position_pct': 0.08,
        'mvm_score': 88,
        'win_prob': 0.85,
        'phase': 'Phase3',
        'market_cap': 800e6
    }
])

# Run stress tests
tester = BiotechStressTester()
results_df = tester.run_all_scenarios(portfolio)

# Generate report
report = tester.generate_stress_report()
print(report)
```

**Stress Metrics:**
- Portfolio return under stress
- Maximum drawdown
- Sharpe ratio
- Value at Risk (95%)
- Number of positions stopped
- Kill switch activation

---

### 6. Production Validator (`production_validator.py`)

Integrated validation system with complete reproducibility.

**Key Features:**
- Combines all validation components
- Git lineage tracking for reproducibility
- Automated validation reports
- Production readiness assessment

**Usage:**
```python
from bt_platform.core.validation import ProductionValidator

# Initialize validator
validator = ProductionValidator(
    n_cv_splits=5,
    embargo_pct=0.01,
    psi_threshold=0.2
)

# Run full validation
result = validator.run_full_validation(
    historical_data=historical_df,
    current_portfolio=portfolio_df,
    baseline_features=baseline_df
)

# Generate report
validator.generate_validation_report(result, "validation_report.md")

# Check production readiness
if result.production_ready:
    print("✅ System is production-ready")
else:
    print("❌ Issues to address:")
    for warning in result.warnings:
        print(f"  - {warning}")
```

**Git Lineage Tracking:**
The system automatically captures:
- Commit hash
- Branch name
- Author
- Timestamp
- Repository URL
- Dirty flag (uncommitted changes)

This ensures complete reproducibility of validation results.

---

## Installation

```bash
# Install required dependencies
pip install numpy pandas scipy scikit-learn

# For development
pip install pytest hypothesis
```

---

## Quick Start

```python
import numpy as np
import pandas as pd
from bt_platform.core.validation import ProductionValidator

# Generate sample data
dates = pd.date_range(start='2023-01-01', periods=100, freq='W')
historical_data = pd.DataFrame({
    'date': dates,
    'ticker': [f'TICKER{i%10}' for i in range(100)],
    'mvm_score': np.random.uniform(50, 95, 100),
    'actual_outcome': (np.random.random(100) > 0.3).astype(int),
    'realized_move_pct': np.random.normal(15, 25, 100),
    'expected_gain_pct': np.random.uniform(0.20, 0.50, 100),
    'expected_loss_pct': np.random.uniform(0.10, 0.25, 100)
})

# Create portfolio
portfolio = pd.DataFrame([
    {
        'ticker': 'TEST',
        'win_prob': 0.80,
        'expected_gain_pct': 0.35,
        'expected_loss_pct': 0.15,
        'current_price': 50.0,
        'avg_daily_volume': 500_000,
        'realized_volatility': 0.45,
        'position_pct': 0.08,
        'mvm_score': 85,
        'phase': 'Phase3',
        'market_cap': 800e6
    }
])

# Run validation
validator = ProductionValidator()
result = validator.run_full_validation(
    historical_data=historical_data,
    current_portfolio=portfolio,
    baseline_features=historical_data.iloc[:50]
)

# View results
print(f"Production Ready: {result.production_ready}")
print(f"Risk Level: {result.risk_level}")
```

---

## Testing

```bash
# Run all tests
pytest tests/validation/test_production_validation.py -v

# Run specific test class
pytest tests/validation/test_production_validation.py::TestPurgedCV -v

# Run with coverage
pytest tests/validation/test_production_validation.py --cov=bt_platform.core.validation
```

---

## Production Deployment Checklist

- [ ] Run full validation pipeline
- [ ] Review validation report
- [ ] Check git lineage (no uncommitted changes)
- [ ] Verify calibration metrics (Brier < 0.25, ECE < 0.15)
- [ ] Confirm no drift detected (all PSI < 0.2)
- [ ] Review stress test results (worst case acceptable)
- [ ] Ensure kill switches not triggered
- [ ] Document validation ID for reproducibility

---

## Troubleshooting

### High Calibration Error
- Increase training data
- Try different calibration method (Platt vs Isotonic)
- Check for outliers in scores

### Drift Detected
- Recalibrate model with recent data
- Review feature distributions
- Consider reducing exposure temporarily

### Kill Switch Activated
- Review current drawdown
- Reassess risk tolerance
- Wait for drawdown recovery before resuming

### Stress Test Failures
- Review position sizes
- Increase diversification
- Reduce exposure to high-risk positions

---

## References

1. López de Prado, M. (2018). "Advances in Financial Machine Learning". Wiley.
2. Platt, J. (1999). "Probabilistic outputs for support vector machines".
3. Kelly, J. L. (1956). "A New Interpretation of Information Rate".
4. Siddiqi, N. (2006). "Credit Risk Scorecards: Developing and Implementing Intelligent Credit Scoring".

---

## License

MIT License - See LICENSE file for details

---

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

---

## Support

For issues or questions:
- Open an issue on GitHub
- Review the documentation
- Check the examples in `scripts/demo_*.py`

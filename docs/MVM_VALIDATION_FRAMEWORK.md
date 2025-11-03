# MVM Alpha Scoring - Production-Grade Validation Framework

A comprehensive, leakage-free, event-driven backtesting and monitoring framework for biotech catalyst event prediction. Converts raw MVM scores into calibrated probabilities and risk-aware trading positions.

## 🎯 System Goal

Implement a reproducible, leakage-free, event-driven backtesting and monitoring framework for MVM Alpha Scoring that converts event scores into calibrated probabilities and risk-aware positions for biotech public equities, with out-of-time validation, domain-specific stress tests, and real-time performance drift detection.

## ✨ Key Features

### 1. **Leakage-Free Validation**
- **PurgedEmbargoCV**: Walk-forward cross-validation with embargo periods (López de Prado)
- **Feature Hygiene**: Automatic timestamp validation prevents lookahead bias
- **Property-Based Testing**: Hypothesis tests guarantee no data leakage

### 2. **Probability Calibration**
- **Dual Methods**: Platt scaling (logistic) + Isotonic regression
- **Auto-Selection**: Chooses best method via out-of-fold log loss
- **Metrics**: Brier score, log loss, ECE (Expected Calibration Error)
- **Reliability Diagrams**: Visual calibration quality assessment

### 3. **Risk-Aware Position Sizing**
- **Quarter-Kelly Formula**: Optimal sizing with win probability and payoff ratio
- **Multi-Constraint System**:
  - 8% max per position (portfolio cap)
  - 10% max participation (ADV liquidity cap)
  - Volatility dampening for high-vol assets (>50%)
  - 3% max without borrow availability
- **Drawdown Throttling**:
  - 10-20% DD: Linear reduction to 50% exposure
  - >20% DD: Flatline to 0% exposure

### 4. **Market Regime Awareness**
- **5 VIX-Based Regimes**:
  - Very Low: VIX < 15
  - Normal: VIX 15-20
  - Elevated: VIX 20-30
  - High: VIX 30-45
  - Extreme: VIX > 45
- **Dynamic Adjustments**: Probability dampening in high-volatility regimes

### 5. **Real-Time Monitoring**
- **Drift Detection**:
  - PSI (Population Stability Index) < 0.2 threshold
  - KS (Kolmogorov-Smirnov) tests for distribution shifts
  - ECE monitoring for calibration drift
- **Kill Switches** (automated):
  - DD 10-20%: Reduce exposure 50%
  - DD > 20%: Flatline to 0%
  - ECE > 0.08: Reduce exposure 50%

### 6. **Biotech-Native Stress Testing**
Five domain-specific scenarios:
1. **Binary Readout Shock**: ±40% overnight gap, thin liquidity, no borrow
2. **CRL Cascade**: Regulatory denial + follow-on selloff + downgrades
3. **AdCom Volatility**: Intraday vote drift + microstructure noise
4. **Sector Drawdown**: XBI -25% over 3 weeks + liquidity crunch
5. **Market Crash**: SPY -15% + flight to quality + liquidity freeze

### 7. **Automated Reporting**
- **CLI Tool**: `scripts/validation/generate_mvm_report.py`
- **Formats**: Markdown and JSON
- **Contents**:
  - Executive summary with KPIs
  - Backtest performance tables
  - Calibration analysis with reliability diagrams
  - Stress test results
  - Data lineage manifest (git commit hash, timestamps)

## 📦 Installation

```bash
# Install dependencies
poetry install

# Add hypothesis for property-based testing
poetry add --group dev 'hypothesis>=6.0' --python ">=3.10"
```

## 🚀 Quick Start

### Generate Validation Report

```bash
poetry run python scripts/validation/generate_mvm_report.py \
    --format markdown \
    --out validation_report.md \
    --include-calibration true
```

### Walk-Forward Cross-Validation

```python
from bt_platform.core.validation import PurgedEmbargoCV
import pandas as pd

# Load events
events = pd.DataFrame([
    {"date": "2020-01-01", "ticker": "TICK1", "move_5d": 0.15},
    {"date": "2020-02-01", "ticker": "TICK2", "move_5d": -0.08},
    # ... more events
])

# Create CV splitter with 30-day embargo
cv = PurgedEmbargoCV(n_splits=5, embargo_days=30, expanding_window=True)

for fold_idx, (train_idx, test_idx) in enumerate(cv.split(events)):
    print(f"Fold {fold_idx}: {len(train_idx)} train, {len(test_idx)} test")
    train_events = events.iloc[train_idx]
    test_events = events.iloc[test_idx]
    
    # Train model on train_events
    # Evaluate on test_events (guaranteed no lookahead)
```

### Calibrate Probabilities

```python
from bt_platform.core.features import ProbCalibrator
import numpy as np

# Raw MVM scores and binary outcomes
scores = np.array([30, 50, 70, 90, 40, 60, 80])
outcomes = np.array([0, 0, 1, 1, 0, 1, 1])

# Fit calibrator (auto-selects best method)
calibrator = ProbCalibrator()
calibrator.fit(scores, outcomes, method='auto')

# Convert new scores to probabilities
new_scores = np.array([45, 65, 85])
probs = calibrator.predict_proba(new_scores)
print(f"Calibrated probabilities: {probs}")

# Generate calibration report
report = calibrator.calibration_report(scores, outcomes)
print(f"Brier Score: {report['brier_score']:.4f}")
print(f"ECE: {report['ece']:.4f}")
```

### Risk-Adjusted Recommendations

```python
from bt_platform.core.features import MVMFeatureEnhancer

rec = MVMFeatureEnhancer.generate_risk_adjusted_recommendation(
    score=85.0,                  # MVM score 0-100
    volatility=35.0,             # Annualized volatility %
    liquidity=2_000_000,         # Average daily volume USD
    market_regime="elevated",    # Or use vix=25.0 for auto-detection
    beta=0.9,                    # Beta to biotech benchmark
    borrow_available=True,
    current_drawdown=0.12,       # 12% portfolio drawdown
)

print(f"Tier: {rec['tier']}")                          # Strong Buy/Buy/Consider/Pass
print(f"Win Probability: {rec['win_probability']:.1%}")
print(f"Position Size: {rec['position_size_pct']:.1f}%")
print(f"Expected 5d Move: {rec['expected_move_5d']:.1%}")
print(f"Risk Factors: {rec['risk_factors']}")
```

### Position Sizing

```python
from bt_platform.core.risk import calculate_position_size

result = calculate_position_size(
    p_win=0.70,                  # 70% win probability
    expected_return=0.30,        # 30% expected return
    volatility=0.35,             # 35% annualized volatility
    liquidity=2_000_000,         # $2M average daily volume
    borrow_available=True,
    current_drawdown=0.08,       # 8% current drawdown
)

print(f"Position Size: {result['position_size_pct']:.2f}%")
print(f"Constraints: {result['constraints_applied']}")
print(f"Risk Factors: {result['risk_factors']}")
```

### Stress Testing

```python
from bt_platform.core.stress import BiotechStressScenarios, run_stress_test

# Define portfolio
portfolio_value = 1_000_000
positions = {
    "CELC": 0.05,  # 5% position
    "INBX": 0.03,  # 3% position
}

# Run CRL cascade scenario
scenario = BiotechStressScenarios.crl_cascade()
result = run_stress_test(portfolio_value, positions, scenario)

print(f"Scenario: {result['scenario_name']}")
print(f"Total P&L: ${result['total_pnl']:,.0f}")
print(f"Drawdown: {result['drawdown']:.1%}")
print(f"Solvent: {result['is_solvent']}")
print(f"Recovery Days: {result['estimated_recovery_days']:.0f}")

# Run all scenarios
for scenario in BiotechStressScenarios.get_all_scenarios():
    result = run_stress_test(portfolio_value, positions, scenario)
    print(f"{scenario.name}: {result['drawdown']:.1%} DD")
```

### Drift Detection

```python
from bt_platform.core.monitoring import psi, ks_drift, compute_ece
import numpy as np

# Reference (training) distribution
ref_scores = np.random.normal(70, 15, 1000)

# Live distribution (production)
live_scores = np.random.normal(72, 18, 500)  # Slight drift

# PSI test
psi_result = psi(ref_scores, live_scores)
print(f"PSI: {psi_result['psi']:.3f}")
print(f"Alert: {psi_result['alert']}")  # True if PSI > 0.2

# KS test
ks_result = ks_drift(ref_scores, live_scores)
print(f"KS Stat: {ks_result['ks_statistic']:.3f}")
print(f"Drift Detected: {ks_result['drift_detected']}")

# ECE monitoring
probs = np.random.rand(100)
outcomes = np.random.randint(0, 2, 100)
ece = compute_ece(probs, outcomes)
print(f"ECE: {ece:.3f}")  # Should be < 0.05 for good calibration
```

## 📊 Module Organization

```
bt_platform/core/
├── validation/              # Cross-validation and metrics
│   ├── __init__.py
│   ├── cv.py               # PurgedEmbargoCV
│   └── metrics.py          # Brier, log_loss, ECE, DSR, IC, Sortino, Calmar
├── features/               # Calibration and enhancement
│   ├── __init__.py
│   ├── calibration.py      # ProbCalibrator (Platt + Isotonic)
│   └── mvm_feature_enhancer.py  # Risk-adjusted recommendations
├── risk/                   # Position sizing
│   ├── __init__.py
│   └── position.py         # Quarter-Kelly, throttling, constraints
├── monitoring/             # Drift detection
│   ├── __init__.py
│   └── drift.py            # PSI, KS tests, ECE, kill switches
├── data/                   # Event data management
│   ├── __init__.py
│   ├── event_loader.py     # EventDataLoader with leakage prevention
│   └── validators.py       # FeatureHygieneValidator
└── stress/                 # Stress testing
    ├── __init__.py
    └── scenarios.py        # BiotechStressScenarios

scripts/validation/
└── generate_mvm_report.py  # Automated report generation CLI

tests/validation/
├── test_validation.py      # CV and metrics tests
├── test_features.py        # Calibration and enhancement tests
└── test_risk_monitoring.py # Risk and monitoring tests
```

## 🧪 Testing

We have **94 tests** for the MVM Alpha validation framework:

```bash
# Run all validation tests
poetry run pytest tests/validation/ -v

# Run with coverage
poetry run pytest tests/validation/ --cov=bt_platform.core --cov-report=html

# Run property-based tests only
poetry run pytest tests/validation/ -k "TestPropertyBased" -v

# Run slow tests (marked with @pytest.mark.slow)
poetry run pytest tests/validation/ -m slow
```

### Test Categories

1. **Unit Tests** (59 tests)
   - Metrics calculation (Brier, ECE, DSR, etc.)
   - Calibration fitting and prediction
   - Position sizing logic
   - Drift detection algorithms

2. **Property-Based Tests** (4 tests via Hypothesis)
   - Brier score bounds [0, 1]
   - ECE bounds [0, 1]
   - Position size bounds [0, 8%]
   - Throttle monotonicity

3. **Integration Tests**
   - PurgedEmbargoCV with real event data
   - End-to-end calibration workflow
   - Stress test scenarios

## 📈 Performance Benchmarks

Current backtest results on 5 recent biotech events (2025):

- **Accuracy**: 100%
- **Precision**: 100%
- **Recall**: 100%
- **Direction Hit Rate**: 100%

**Note**: Limited sample size. Out-of-sample validation with larger dataset required for production deployment.

## 🔧 Configuration

### Environment Variables

```bash
# Optional: MLflow tracking (future)
export MLFLOW_TRACKING_URI=http://localhost:5000
export MLFLOW_EXPERIMENT_NAME=mvm_alpha_scoring
```

### YAML Config (future enhancement)

```yaml
# config/mvm_validation.yaml
validation:
  cv:
    n_splits: 5
    embargo_days: 30
    expanding_window: true
  
  calibration:
    method: auto  # platt, isotonic, or auto
    n_bins: 10
  
  risk:
    max_portfolio_pct: 0.08
    max_adv_pct: 0.10
    vol_threshold: 0.50
  
  monitoring:
    psi_threshold: 0.2
    ece_threshold: 0.08
    dd_warn: 0.15
    dd_critical: 0.20

backtest:
  oos_year: 2025
  event_threshold: 0.07  # 7% absolute move
  
stress:
  scenarios:
    - binary_readout
    - crl_cascade
    - adcom_volatility
    - sector_drawdown
    - market_crash
```

## 🛡️ Non-Negotiables (Guardrails)

✅ **Implemented:**
1. ✅ No leakage (purged, embargoed walk-forward CV)
2. ✅ Reproducibility (data lineage tracking, git commits)
3. ✅ Proper scoring (Brier, log loss, ECE optimization)
4. ✅ Costs & constraints (slippage, borrow, ADV caps modeled)
5. ✅ Reality checks (DSR implementation)

⏳ **Pending:**
1. ⏳ White's Reality Check / Hansen SPA (statistical validation)
2. ⏳ Capacity curves (alpha-to-capacity analysis)
3. ⏳ Benchmark comparison (vs XBI, NBI with beta-neutral returns)
4. ⏳ MLflow experiment tracking

## 📚 References

- **López de Prado, M.** (2018). *Advances in Financial Machine Learning*. Wiley.
- **Bailey, D. H., & López de Prado, M.** (2014). "The Deflated Sharpe Ratio: Correcting for Selection Bias, Backtest Overfitting and Non-Normality." *Journal of Portfolio Management*.
- **Platt, J.** (1999). "Probabilistic Outputs for Support Vector Machines." *Advances in Large Margin Classifiers*.

## 🤝 Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## 📄 License

MIT License - see [LICENSE](../../LICENSE) for details.

## 🔗 Related Documentation

- [MVM Alpha Scoring Overview](../../CATALYST_PREDICTION_IMPLEMENTATION.md)
- [Architecture Diagram](../../ARCHITECTURE.md)
- [API Integration Guide](../../API_INTEGRATION_SUMMARY.md)

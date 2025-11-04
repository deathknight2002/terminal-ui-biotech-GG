# MVM Alpha Production System - Quick Reference

## One-Line Summary
Institutional-grade validation framework with purged CV, probability calibration, Kelly sizing, drift monitoring, and biotech stress testing.

## Quick Start

```python
from bt_platform.core.validation import ProductionValidator

# Run full validation
validator = ProductionValidator()
result = validator.run_full_validation(historical_data, current_portfolio, baseline_features)
validator.generate_validation_report(result, "report.md")
```

## Key Thresholds

| Component | Metric | Threshold | Action |
|-----------|--------|-----------|--------|
| **Calibration** | Brier Score | < 0.25 | Good calibration |
| | ECE | < 0.15 | Well calibrated |
| **Drift** | PSI | < 0.1 | No drift |
| | PSI | 0.1-0.2 | Monitor closely |
| | PSI | ≥ 0.2 | Recalibrate |
| **Position Sizing** | Max Position | 8% | Portfolio cap |
| | ADV Limit | 10% | Liquidity cap |
| | Volatility | > 50% | Dampen by 50% |
| **Drawdown** | 10-20% | — | Linear throttling |
| | > 20% | — | Kill switch |
| **Cross-Validation** | Precision | ≥ 70% | Acceptable |
| | Recall | ≥ 70% | Acceptable |

## Command Reference

### Individual Modules

```python
# Purged Cross-Validation
from bt_platform.core.validation import PurgedKFold
cv = PurgedKFold(n_splits=5, embargo_pct=0.01)
for train_idx, test_idx in cv.split(X, y, pred_times, eval_times):
    # train model

# Probability Calibration
from bt_platform.core.validation import AutoCalibrator
calibrator = AutoCalibrator()
calibrator.fit(scores, labels)
probs = calibrator.predict_proba(new_scores)

# Position Sizing
from bt_platform.core.validation import PositionSizer
sizer = PositionSizer()
rec = sizer.calculate_position(ticker, win_prob, gain_pct, loss_pct, price, volume, vol)

# Drift Monitoring
from bt_platform.core.validation import DriftMonitor
monitor = DriftMonitor(psi_threshold=0.2)
monitor.set_baseline(baseline_df, features)
drift_status = monitor.check_drift(features)

# Stress Testing
from bt_platform.core.validation import BiotechStressTester
tester = BiotechStressTester()
results = tester.run_all_scenarios(portfolio)
```

## Stress Test Scenarios

1. **Binary Readout Shock (±40%)** - Phase 3 trial results
2. **CRL Cascade** - Multiple regulatory setbacks
3. **AdCom Uncertainty** - FDA committee volatility
4. **Sector Drawdown -20%** - Moderate XBI selloff
5. **Sector Drawdown -35%** - Severe bear market
6. **Regulatory Shock** - FDA policy changes

## Production Checklist

- [ ] Run full validation pipeline
- [ ] Review automated report
- [ ] Check git lineage (no uncommitted changes)
- [ ] Verify Brier score < 0.25
- [ ] Verify ECE < 0.15
- [ ] Confirm PSI < 0.2 on all features
- [ ] Review stress test results
- [ ] Ensure no kill switches triggered
- [ ] Document validation ID
- [ ] Archive report for audit trail

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| High calibration error | Increase training data or try different method |
| Drift detected | Recalibrate with recent data |
| Kill switch active | Review drawdown, reduce positions |
| Low precision | Adjust score threshold or retrain |
| Stress test failures | Reduce position sizes, diversify |

## Demo Scripts

```bash
# Individual component demos
python bt_platform/core/validation/purged_cv.py
python bt_platform/core/validation/probability_calibration.py
python bt_platform/core/validation/position_sizing.py
python bt_platform/core/validation/drift_monitoring.py
python bt_platform/core/validation/stress_testing.py

# Full system demo
python scripts/demo_production_validator.py
```

## Testing

```bash
# Run all tests (16 tests)
pytest tests/validation/test_production_validation.py -v

# Run specific test class
pytest tests/validation/test_production_validation.py::TestPurgedCV -v
```

## Documentation

- `PRODUCTION_VALIDATION_SYSTEM.md` - Complete API documentation
- `PRODUCTION_SYSTEM_COMPLETE.md` - Implementation summary
- Module docstrings - Inline documentation

## Key Files

```
bt_platform/core/validation/
├── purged_cv.py                 # Purged cross-validation
├── probability_calibration.py   # Calibration layer
├── position_sizing.py           # Position sizing
├── drift_monitoring.py          # Drift monitoring
├── stress_testing.py            # Stress testing
└── production_validator.py      # Integrated system
```

## Support

- GitHub Issues: Report bugs or request features
- Documentation: See PRODUCTION_VALIDATION_SYSTEM.md
- Examples: Check scripts/demo_production_validator.py

## Version

v2.0.0 - Production Validation System

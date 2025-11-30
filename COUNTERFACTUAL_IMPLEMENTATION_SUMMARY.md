# Counterfactual Validation Tracker - Implementation Summary

## Overview

Successfully implemented a lightweight counterfactual tracker for the MVM Alpha Scoring validation system. The tracker logs "what would've happened" if you'd acted (or not) on every predicted catalyst, isolating signal decay, bias drift, and regime-dependence.

## Implementation Completed

### 1. Database Models ✅

Added 4 new SQLAlchemy models to `bt_platform/core/database.py`:

- **`CounterfactualEvent`**: Tracks events with features, scores, and classification
  - Fields: event_id, ticker, dt_trade, score, conf, catalyst_type, therapeutic_area, MoA, market_cap_decile, liquidity_bucket, features_json
  
- **`RealizedOutcome`**: Stores actual trade outcomes
  - Fields: event_id, IV metrics (pre, T+1, T+3, T+5), price metrics, PnL at horizons, drawdown, slippage, borrow costs, time-to-alpha
  
- **`CounterfactualOutcome`**: Alternative path results
  - Fields: cf_id, event_id, cf_type (skip/alt_name/alt_ticker), selection_rule, alt_ticker, alt_score, realized_cf_metrics_json
  
- **`RegimeContext`**: Market regime tracking
  - Fields: date, VIX + bucket, XBI returns + quartile, liquidity bucket, spreads, SPX returns, rates

### 2. Core Logic ✅

Implemented `CounterfactualRunner` class in `bt_platform/core/validation/counterfactual_runner.py`:

**Selection Rules:**
- Skip baseline: No trade → PnL = 0
- Nearest alternative: Same date window ±3d, matching TA/catalyst type, closest by score
- Propensity matching: Random sample (n=3) matched by market cap decile & liquidity

**Metrics Calculation:**
- **Edge Quality**: Actual PnL vs counterfactual median
- **Time-to-Alpha**: Days to peak PnL/IV
- **Risk Metrics**: Sharpe, Sortino, hit rate, max drawdown, VaR/CVaR (95%)
- **Drift Detection**: Kendall τ correlation, p-value test (drift when p > 0.05)
- **Regime Analysis**: Framework for VIX buckets and XBI quartile splits

### 3. CLI Interface ✅

Created `bt_platform/core/validation/counterfactual_cli.py`:

```bash
python -m bt_platform.core.validation.counterfactual_cli \
    --window 2020-01-01:2025-10-31 \
    --horizons 1,3,5 \
    --vix-buckets 0-20,20-30,30+ \
    --alts 3 \
    --output validation_report.md \
    --parquet results.parquet
```

Features:
- Configurable date windows, horizons, VIX buckets
- Random seed for reproducibility
- Markdown report generation
- Parquet snapshot export
- Database persistence option

### 4. Testing ✅

Created comprehensive test suite in `tests/validation/test_counterfactual_validation.py`:

- 20 tests covering all components
- Database model validation
- Selection logic verification
- Metrics calculation accuracy
- Edge detection
- Risk metrics
- Report generation
- All tests passing (36/36 including existing tests)

### 5. Documentation ✅

Created extensive documentation:

- **`COUNTERFACTUAL_README.md`**: Complete guide with examples, API docs, architecture
- **Helper script**: `scripts/validation/generate_counterfactual_report.py` for easy execution
- **Inline docs**: Comprehensive docstrings and comments throughout code

### 6. Code Quality ✅

- All linting checks passed (ruff)
- Code formatted consistently
- Type hints throughout
- Code review feedback addressed
- No breaking changes to existing code

## Key Architectural Decisions

1. **Database-First**: Models designed for persistence and querying
2. **Async Pattern**: Follows existing FastAPI async patterns
3. **Config-Driven**: CounterfactualConfig dataclass for flexibility
4. **Modular Design**: Separate methods for each selection rule
5. **Report Generation**: Markdown output for easy consumption
6. **Minimal Changes**: No modifications to existing validation code

## Technical Highlights

### Systematic Selection Rules

1. **Skip Baseline**: Provides zero-PnL baseline (no action)
2. **Nearest Alternative**: Matches on temporal proximity and catalyst characteristics
3. **Propensity Matching**: Controls for market cap and liquidity bias

### Comprehensive Metrics

- **Edge**: Actual - Median(Counterfactuals)
- **Sharpe/Sortino**: Risk-adjusted returns
- **VaR/CVaR**: Tail risk measures
- **Kendall τ**: Non-parametric correlation stability
- **Time-to-Alpha**: Optimal holding period detection

### Robust Implementation

- Handles missing data gracefully
- Configurable horizons (T+1, T+3, T+5)
- Reproducible (seeded random sampling)
- Scalable (SQL queries, not memory-intensive)

## Integration Points

1. **MVM Alpha Scoring**: Uses same event data and scores
2. **Production Validator**: Complementary validation infrastructure
3. **Drift Monitor**: Shares PSI calculation framework
4. **Database**: Extends existing schema cleanly

## Usage Examples

### Python API

```python
from bt_platform.core.validation import CounterfactualRunner, CounterfactualConfig

config = CounterfactualConfig(
    start_date='2024-01-01',
    end_date='2024-12-31',
    horizons=[1, 3, 5],
    vix_buckets=[(0, 20), (20, 30), (30, 100)],
    n_alternatives=3
)

runner = CounterfactualRunner(db_session, config)
results = await runner.run_validation()
runner.generate_report(results, 'validation_report.md')
```

### CLI

```bash
# Quick validation
python scripts/validation/generate_counterfactual_report.py

# Custom date range
python -m bt_platform.core.validation.counterfactual_cli \
    --window 2024-01-01:2024-12-31 \
    --output cf_validation_2024.md
```

## Files Added/Modified

**New Files (5):**
1. `bt_platform/core/validation/counterfactual_runner.py` (540 lines)
2. `bt_platform/core/validation/counterfactual_cli.py` (260 lines)
3. `bt_platform/core/validation/COUNTERFACTUAL_README.md` (340 lines)
4. `scripts/validation/generate_counterfactual_report.py` (200 lines)
5. `tests/validation/test_counterfactual_validation.py` (400 lines)

**Modified Files (2):**
1. `bt_platform/core/database.py` (+146 lines for 4 models)
2. `bt_platform/core/validation/__init__.py` (+9 lines for exports)

**Total**: ~1900 lines of production code + tests + documentation

## What's Next (Future Enhancements)

### Phase 2: Visualization
- [ ] Dash dashboard blocks (Bloomberg/FactSet style)
- [ ] Rolling edge plot with confidence intervals
- [ ] Decay heatmap (score deciles × horizon days)
- [ ] Regime panel (small multiples by VIX/XBI)
- [ ] Drift monitor with monthly PSI tracking

### Phase 3: Advanced Testing
- [ ] Placebo tests (shift timestamps, edge should vanish)
- [ ] Leakage checks (recompute with T-1 data only)
- [ ] Ablation studies (remove feature groups)
- [ ] Cost realism (spread, borrow, slippage stress tests)

### Phase 4: Production Integration
- [ ] Real-time trust badge (red/yellow/green)
- [ ] Automated nightly validation runs
- [ ] Alert system for drift detection
- [ ] Integration with PM dashboard

## Success Metrics

- ✅ All 36 validation tests passing
- ✅ Zero linting errors
- ✅ Comprehensive documentation
- ✅ Code review feedback addressed
- ✅ No breaking changes
- ✅ Ready for production deployment

## Conclusion

The counterfactual validation tracker provides institutional-grade validation for the MVM Alpha Scoring system. It systematically quantifies edge quality, detects signal decay, and enables regime-based performance attribution—all critical for trust and risk sizing in production trading systems.

The implementation follows best practices:
- Minimal, surgical changes
- Comprehensive testing
- Clear documentation
- Production-ready code quality
- Extensible architecture

**Status**: ✅ Ready for review and merge

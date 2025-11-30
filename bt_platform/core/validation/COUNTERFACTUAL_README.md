# MVM Alpha Counterfactual Validation System

A battle-tested upgrade for MVM Alpha Scoring validation: a lightweight counterfactual tracker that logs "what would've happened" if you'd acted (or not) on every predicted catalyst. It isolates signal decay, bias drift, and regime-dependence so you can trust the score before you size risk.

## What It Does (Plain English)

For every trading day:
1. **Pair** (a) your predicted IV-spike events with (b) missed neutral/negative catalysts that were plausible alternatives
2. **Simulate both paths**: "took the trade" vs "did nothing / chose the other catalyst"
3. **Log realized outcomes**: IV change, PnL, drawdown, slippage, borrow cost, and time-to-alpha
4. **Compare** in rolling windows (7d/30d/90d) to detect signal decay, selection bias, and regime shifts (e.g., VIX buckets, biotech beta, liquidity)

## Quick Start

### Installation

The counterfactual validation system is included in the main platform. Ensure dependencies are installed:

```bash
poetry install
```

### Run Validation

Use the convenience script:

```bash
python scripts/validation/generate_counterfactual_report.py \
    --start-date 2024-01-01 \
    --end-date 2024-12-31 \
    --output cf_validation_2024.md
```

Or use the CLI directly:

```bash
python -m bt_platform.core.validation.counterfactual_cli \
    --window 2020-01-01:2025-10-31 \
    --horizons 1,3,5 \
    --vix-buckets 0-20,20-30,30+ \
    --alts 3 \
    --output validation_report.md
```

### Python API

```python
from bt_platform.core.validation import CounterfactualRunner, CounterfactualConfig
from sqlalchemy.orm import Session

# Create config
config = CounterfactualConfig(
    start_date='2024-01-01',
    end_date='2024-12-31',
    horizons=[1, 3, 5],
    vix_buckets=[(0, 20), (20, 30), (30, 100)],
    n_alternatives=3
)

# Run validation
runner = CounterfactualRunner(db_session, config)
results = await runner.run_validation()

# Generate report
runner.generate_report(results, 'validation_report.md')
```

## Data Model

### Core Tables

**`counterfactual_events`**: Events for validation tracking
- `event_id`: Unique event identifier
- `ticker`, `dt_trade`, `score`, `conf`: Event details
- `catalyst_type`, `therapeutic_area`, `mechanism_of_action`: Classification
- `market_cap_decile`, `liquidity_bucket`: Matching attributes
- `features_json`: Feature vector as JSON

**`realized_outcomes`**: Realized outcomes for actual trades
- `event_id`: Reference to event
- `iv30_pre`, `iv30_post_t{1,3,5}`: Implied volatility metrics
- `close_pre`, `close_post_t{1,3,5}`: Price metrics
- `pnl_bp_t{1,3,5}`: PnL in basis points at different horizons
- `dd_bp`: Maximum drawdown
- `days_to_peak_pnl`, `days_to_peak_iv`: Time to alpha

**`counterfactual_outcomes`**: Alternative path outcomes
- `cf_id`: Unique counterfactual identifier
- `event_id`: Reference to event
- `cf_type`: `skip`, `alt_name`, `alt_ticker`
- `selection_rule`: `noop`, `nearest_name_match`, `propensity_match`
- `realized_cf_metrics_json`: Counterfactual metrics
- `cf_pnl_bp_t5`: Summary PnL metric

**`regime_context`**: Market regime for attribution
- `date`: Trading date
- `vix`, `vix_bucket`: Volatility regime
- `xbi_ret`, `xbi_quartile`: Biotech market context
- `liq_bucket`, `spread_bp`: Liquidity conditions

## Selection Rules (Systematic)

1. **Skip Baseline**: Same ticker/date, action=0 (no trade) → PnL = 0
2. **Nearest Alternative Catalyst**: Same date window ±3d within TA/MoA cluster
3. **Randomized Alternatives** (seeded): 3 samples matched by market cap & liquidity (propensity matching)

## Core Metrics

### Edge Quality
- **Edge**: ΔIV30_actual − median(ΔIV30_counterfactual) with confidence intervals
- **Time-to-Alpha**: Days to peak ΔIV/ΔPnL

### Performance
- **Precision/Recall/F1**: By score threshold
- **Hit Rate**: Percentage of positive PnL trades
- **Sharpe/Sortino**: Risk-adjusted returns

### Risk
- **Max Drawdown**: Maximum peak-to-trough decline
- **VaR/CVaR (95%)**: Value at Risk and Conditional VaR

### Drift Detection
- **Kendall τ**: Score-outcome correlation stability over time
- **PSI**: Population Stability Index for feature distributions (framework in place)
- **Regime Sensitivity**: Performance split by VIX buckets and XBI quartiles

## CLI Options

```bash
python -m bt_platform.core.validation.counterfactual_cli --help

Options:
  --window          Date window (YYYY-MM-DD:YYYY-MM-DD)
  --horizons        Horizons in days (comma-separated)
  --vix-buckets     VIX buckets for regime analysis
  --alts            Number of propensity-matched alternatives
  --seed            Random seed for reproducibility
  --matching-window Window in days for finding alternatives
  --output          Output path for validation report
  --persist         Persist results to database
  --parquet         Save results snapshot as parquet
  --verbose         Enable verbose logging
```

## Report Format

The generated report includes:

1. **Summary**: Overall statistics, edge, Sharpe, hit rate
2. **Edge Quality Metrics**: Mean, median, percentiles, distribution
3. **Risk Metrics**: Sharpe, Sortino, max drawdown, VaR, CVaR
4. **Drift Detection**: Kendall τ, p-value, drift status
5. **Regime Analysis**: Performance by VIX bucket and XBI quartile (when data available)

## Testing

Run the test suite:

```bash
poetry run pytest tests/validation/test_counterfactual_validation.py -v
```

Test coverage:
- Database models
- Counterfactual selection logic
- Edge metrics calculation
- Risk metrics calculation
- Drift detection
- Report generation

## Architecture

### Key Components

- **`CounterfactualRunner`**: Main validation engine
- **`CounterfactualConfig`**: Configuration dataclass
- **`EdgeMetrics`**: Edge quality metrics
- **`RegimeMetrics`**: Regime-based performance metrics
- **CLI**: Command-line interface for running validation

### Integration Points

- **Database**: SQLAlchemy models for persistence
- **MVM Alpha Scoring**: Uses same event data and scores
- **Production Validator**: Complementary to existing validation infrastructure

## Why This Helps (Practical Alpha)

1. **Proves edge net of alternatives**, not just vs zero
2. **Flags when the engine needs a retune** (e.g., post-FDA cycle or liquidity shocks)
3. **Gives PMs a simple "deploy / size down / freeze" signal** tied to real decay and regime
4. **Isolates selection bias** through propensity matching
5. **Detects regime dependence** with VIX and biotech beta splits
6. **Tracks time-to-alpha** for optimal trade timing

## Future Enhancements

- [ ] Dash dashboard blocks (FactSet/Bloomberg style)
  - [ ] Rolling edge plot with CI bands
  - [ ] Decay heatmap (score deciles × horizon days)
  - [ ] Regime panel (small multiples by VIX bucket + XBI quartile)
  - [ ] Drift monitor (monthly PSI for top 10 features)
- [ ] Placebo tests (shift timestamps +7d, edge should vanish)
- [ ] Leakage checks (recompute scores with T-1 data only)
- [ ] Ablation studies (remove feature groups, track ΔF1/ΔSharpe)
- [ ] Cost realism (include spread, borrow, fees; stress ±50% slippage)

## References

- Original specification: See problem statement in issue
- Production validator: `bt_platform/core/validation/production_validator.py`
- Drift monitoring: `bt_platform/core/validation/drift_monitoring.py`
- MVM backtest: `bt_platform/core/validation/mvm_backtest_enhanced.py`

## License

Part of the Biotech Terminal Platform - MVM Alpha Scoring System

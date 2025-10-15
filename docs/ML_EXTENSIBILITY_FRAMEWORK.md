# ML Extensibility Framework Documentation

## Overview

This document describes the ML sentiment analysis and backtesting framework added to the Biotech Terminal platform as part of PR #72.

## Components Added

### 1. ML Sentiment Classifier (`ml/sentiment/trainer.py`)

A scikit-learn based sentiment classifier for biotech news, press releases, and SEC filings.

**Features:**
- TF-IDF vectorization with configurable n-grams
- Logistic regression with class balancing
- Three sentiment categories: Bullish (1), Neutral (0), Bearish (-1)
- Cross-validation and comprehensive metrics
- Model persistence with joblib
- Feature importance analysis

**Usage:**
```python
from ml.sentiment.trainer import SentimentTrainer

# Train model
trainer = SentimentTrainer()
texts = ["FDA approves new drug", "Trial fails endpoint"]
labels = [1, -1]
metrics = trainer.fit(texts, labels)

# Predict sentiment
predictions = trainer.predict(["Positive news"])
scores = trainer.get_sentiment_scores(["Positive news"])

# Save/load model
trainer.save("model.joblib")
loaded = SentimentTrainer.load("model.joblib")
```

### 2. Backtesting Engine (`ml/backtesting/engine.py`)

Expanding-window backtesting framework for catalyst prediction models.

**Features:**
- Expanding window design to avoid lookahead bias
- Multiple evaluation metrics (AUC-PR, Brier score, Spearman IC)
- Time-based train/test splits
- Portfolio simulation (long/short IR)
- Top-decile hit rate analysis

**Metrics:**
- **AUC-PR**: Precision-recall curve area for binary classification
- **Brier Score**: Probability calibration metric (lower is better)
- **Spearman IC**: Rank correlation with actual outcomes
- **Top-Decile Hit Rate**: Accuracy on highest-confidence predictions
- **Long/Short IR**: Information ratio for portfolio strategy

**Usage:**
```python
from ml.backtesting.engine import BacktestEngine

# Initialize engine
engine = BacktestEngine(move_threshold=0.10)

# Run backtest
results = engine.run_expanding_window_backtest(
    start_date="2020-01-01",
    end_date="2024-12-31",
    min_train_days=365,
    step_days=90
)

# Get summary
print(engine.get_summary_report())
```

### 3. FastAPI Endpoints (`bt_platform/core/endpoints/ml_endpoints.py`)

REST API integration for ML features.

**Endpoints:**

#### Sentiment Analysis
- `POST /api/v1/ml/sentiment/predict` - Predict sentiment for texts
- `GET /api/v1/ml/sentiment/info` - Get model information
- `GET /api/v1/ml/sentiment/features?n=20` - Get top features

#### Backtesting
- `POST /api/v1/ml/backtest/run` - Run backtesting analysis
- `GET /api/v1/ml/backtest/summary` - Get summary report

#### Health Check
- `GET /api/v1/ml/health` - Check ML services status

**Example Request:**
```bash
curl -X POST "http://localhost:8000/api/v1/ml/sentiment/predict" \
  -H "Content-Type: application/json" \
  -d '{
    "texts": [
      "FDA approves breakthrough therapy",
      "Clinical trial fails primary endpoint"
    ]
  }'
```

**Example Response:**
```json
{
  "results": [
    {
      "text": "FDA approves breakthrough therapy",
      "prediction": 1,
      "confidence": 0.87,
      "probabilities": {"-1": 0.05, "0": 0.08, "1": 0.87}
    },
    {
      "text": "Clinical trial fails primary endpoint",
      "prediction": -1,
      "confidence": 0.92,
      "probabilities": {"-1": 0.92, "0": 0.05, "1": 0.03}
    }
  ],
  "model_version": "1.0.0",
  "timestamp": "2025-10-15T03:30:00.000Z"
}
```

## Testing

### Unit Tests

**31 tests total** covering both sentiment analysis and backtesting:

- **Sentiment Trainer Tests** (`ml/sentiment/test_trainer.py`): 16 tests
  - Model initialization and configuration
  - Training with valid and invalid data
  - Prediction functionality
  - Probability estimation
  - Feature extraction
  - Model persistence (save/load)
  - Cross-validation
  - Evaluation metrics

- **Backtesting Engine Tests** (`ml/backtesting/test_engine.py`): 15 tests
  - Synthetic data generation
  - Expanding window execution
  - Single window evaluation
  - Metrics aggregation
  - Summary report generation
  - Different threshold configurations
  - Edge cases (insufficient data, perfect predictions, random predictions)
  - Input validation

**Run tests:**
```bash
poetry run pytest ml/ -v
```

### Integration Tests

Test the API endpoints:
```bash
# Start the FastAPI server
poetry run uvicorn bt_platform.core.app:app --reload

# Test sentiment endpoint
curl -X POST "http://localhost:8000/api/v1/ml/sentiment/predict" \
  -H "Content-Type: application/json" \
  -d '{"texts": ["FDA approval news"]}'

# Test backtest endpoint
curl -X POST "http://localhost:8000/api/v1/ml/backtest/run" \
  -H "Content-Type: application/json" \
  -d '{
    "start_date": "2020-01-01",
    "end_date": "2021-12-31",
    "min_train_days": 180,
    "step_days": 90
  }'
```

## Dependencies Added

The following dependencies were added to `pyproject.toml`:

```toml
joblib = "^1.3.2"      # Model persistence
pandas = "^2.0.0"      # Data manipulation
numpy = "^1.24.0"      # Numerical operations
```

These work with existing dependencies:
- `scikit-learn = "^1.3.2"` - ML algorithms
- `xgboost = "^2.0.0"` - Gradient boosting
- `lightgbm = "^4.0.0"` - Gradient boosting
- `shap = "^0.45.0"` - Model interpretation

## Architecture Integration

### Module Structure
```
ml/
├── __init__.py
├── sentiment/
│   ├── __init__.py
│   ├── trainer.py          # Sentiment classifier
│   └── test_trainer.py     # Unit tests
├── backtesting/
│   ├── __init__.py
│   ├── engine.py           # Backtesting framework
│   └── test_engine.py      # Unit tests
└── models/
    ├── __init__.py
    └── prediction_pipeline.py  # Existing catalyst prediction models
```

### API Integration
```
bt_platform/core/
├── routers.py              # Router registration (updated)
└── endpoints/
    └── ml_endpoints.py     # New ML API endpoints
```

## Backward Compatibility

✅ **No breaking changes** - All existing functionality preserved:
- Existing scoring systems remain unchanged
- Scraper framework continues to work
- All existing API endpoints functional
- ML features are additive and optional

## Performance Considerations

### Sentiment Analysis
- **Training**: ~3-5 seconds for sample data (24 examples)
- **Prediction**: <100ms for batch of 100 texts
- **Memory**: ~50MB for trained model

### Backtesting
- **Execution**: ~1-2 seconds per window
- **Typical run**: 5-10 windows for 1-year period
- **Memory**: Depends on event count, typically <200MB

### Optimization Tips
1. Cache trained sentiment models to disk
2. Use batch prediction for multiple texts
3. Adjust backtesting window sizes based on data availability
4. Consider parallel execution for multiple backtest scenarios

## Future Enhancements

### Planned Features
1. **Advanced Sentiment Models**: FinBERT, domain-specific BERT models
2. **Real-time Predictions**: WebSocket streaming for live sentiment
3. **Model Monitoring**: Track model performance over time
4. **A/B Testing**: Compare different model configurations
5. **Feature Store**: Cache and version feature extractions
6. **AutoML**: Automatic hyperparameter tuning
7. **Ensemble Models**: Combine multiple sentiment classifiers

### Integration Opportunities
1. **Catalyst Scoring**: Use sentiment as input feature
2. **News Intelligence**: Real-time sentiment on news feeds
3. **Portfolio Optimization**: Sentiment-based position sizing
4. **Alert System**: Trigger alerts on sentiment shifts
5. **Dashboard**: Visualize sentiment trends over time

## Troubleshooting

### Common Issues

**Issue**: Import errors for `ml` module
```bash
# Solution: Ensure Poetry environment is activated
poetry shell
poetry install
```

**Issue**: Model not found errors
```bash
# Solution: Train model first or ensure model file exists
python -c "from ml.sentiment import SentimentTrainer, create_sample_training_data; trainer = SentimentTrainer(); texts, labels = create_sample_training_data(); trainer.fit(texts, labels); trainer.save('/tmp/sentiment_model.joblib')"
```

**Issue**: Backtest runs slowly
```bash
# Solution: Increase step_days or reduce date range
# Fast test: step_days=60, 6-month period
# Production: step_days=90, multi-year period
```

## References

- **Scikit-learn**: https://scikit-learn.org/
- **TF-IDF**: https://en.wikipedia.org/wiki/Tf%E2%80%93idf
- **Precision-Recall**: https://scikit-learn.org/stable/modules/generated/sklearn.metrics.precision_recall_curve.html
- **Brier Score**: https://en.wikipedia.org/wiki/Brier_score
- **Spearman Correlation**: https://en.wikipedia.org/wiki/Spearman%27s_rank_correlation_coefficient

## Support

For issues or questions:
1. Check test files for usage examples
2. Review API endpoint documentation
3. Examine log output for debugging
4. Run health check: `GET /api/v1/ml/health`

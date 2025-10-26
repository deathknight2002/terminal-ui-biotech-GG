# Advanced ML Models - Implementation Guide

## Overview

This implementation adds advanced machine learning capabilities to the Biotech Terminal platform, including:

1. **Advanced Sentiment Models**: FinBERT and BioBERT for financial and biomedical text analysis
2. **Ensemble Models**: Combine multiple sentiment analyzers for robust predictions
3. **Catalyst Integration**: Integrate sentiment analysis with catalyst scoring system
4. **Model Monitoring**: Track model performance and detect drift
5. **A/B Testing**: Compare model configurations with statistical rigor
6. **Automated Retraining**: Pipeline for continuous model improvement

## Installation

### Core Dependencies (Already Included)
```bash
# Already in pyproject.toml
pip install numpy pandas scikit-learn scipy joblib
```

### Optional: Transformers for Advanced Models
```bash
# For FinBERT and BioBERT support
pip install transformers torch

# Or with Poetry
poetry install --with transformers
```

## Usage Examples

### 1. FinBERT Sentiment Analysis

```python
from ml.sentiment.finbert_analyzer import FinBERTAnalyzer

# Initialize analyzer
analyzer = FinBERTAnalyzer()

# Analyze sentiment
texts = [
    "FDA approves breakthrough therapy designation",
    "Clinical trial fails primary endpoint"
]

predictions = analyzer.predict(texts)
scores = analyzer.get_sentiment_scores(texts)

for score in scores:
    print(f"Text: {score['text']}")
    print(f"Sentiment: {score['sentiment']} ({score['confidence']:.3f})")
```

### 2. BioBERT Domain-Specific Analysis

```python
from ml.sentiment.biobert_analyzer import BioBERTAnalyzer

# Initialize analyzer (uses rule-based sentiment if transformers not installed)
analyzer = BioBERTAnalyzer()

# Analyze biomedical text
texts = [
    "Positive phase 3 results demonstrate statistically significant efficacy",
    "Safety concerns halt enrollment in clinical trial"
]

scores = analyzer.get_sentiment_scores(texts)
```

### 3. Ensemble Models

```python
from ml.sentiment.ensemble_analyzer import create_default_ensemble

# Create ensemble with all available models
ensemble = create_default_ensemble()

# Analyze with multiple models
texts = ["FDA approves new drug"]
predictions = ensemble.predict(texts)

# Compare models
comparison = ensemble.compare_models(texts)
for model_name, results in comparison.items():
    print(f"{model_name}: {results['avg_confidence']:.3f} confidence")
```

### 4. Catalyst Sentiment Integration

```python
from ml.sentiment.catalyst_integration import create_catalyst_sentiment_scorer

# Create scorer
scorer = create_catalyst_sentiment_scorer(model_type="tfidf")

# Enhance catalyst with sentiment
catalyst = {
    'title': 'FDA PDUFA decision',
    'event_leverage': 4,
    'timing_clarity': 3,
    'surprise_factor': 2,
    'downside_contained': 3,
    'market_depth': 3
}

enhanced = scorer.enhance_catalyst_score(catalyst)
print(f"Original score: {enhanced['original_total_score']}")
print(f"Enhanced score: {enhanced['enhanced_total_score']}")
print(f"Sentiment: {enhanced['sentiment_label']}")

# Batch process multiple catalysts
catalysts = [catalyst1, catalyst2, catalyst3]
enhanced_catalysts = scorer.batch_score_catalysts(catalysts)
```

### 5. Model Monitoring

```python
from ml.monitoring.model_monitor import ModelMonitor

# Initialize monitor
monitor = ModelMonitor(drift_threshold=0.05, window_size=100)

# Set baseline
baseline_preds = [1, 0, -1] * 33  # 100 predictions
baseline_confs = [0.8] * 100
baseline_features = [{'feature1': 1.0}] * 100
monitor.set_baseline(baseline_preds, baseline_confs, baseline_features)

# Log predictions
for pred, conf in zip(predictions, confidences):
    monitor.log_prediction(pred, conf)

# Check for drift
summary = monitor.get_summary_report()
print(f"Drift detected: {summary['drift_detection']['prediction_drift']['drift_detected']}")

# Check alerts
alerts = monitor.check_alerts()
for alert in alerts:
    print(f"[{alert['severity']}] {alert['message']}")
```

### 6. A/B Testing

```python
from ml.monitoring.ab_testing import create_ab_test

# Create A/B test
ab_test = create_ab_test(
    test_name="TF-IDF vs FinBERT",
    model_a_name="tfidf",
    model_b_name="finbert",
    traffic_split=0.5,
    min_samples=100
)

# Log predictions
for text, true_label in zip(test_texts, test_labels):
    variant = ab_test.assign_variant()

    if variant == 'model_a':
        pred = model_a.predict([text])[0]
        conf = model_a.predict_proba([text])[0][pred]
    else:
        pred = model_b.predict([text])[0]
        conf = model_b.predict_proba([text])[0][pred]

    ab_test.log_prediction(variant, pred, conf, true_label)

# Analyze results
if ab_test.is_ready_for_analysis():
    result = ab_test.analyze()
    print(f"Winner: {result.winner}")
    print(f"Recommendation: {result.recommendation}")
```

### 7. Automated Retraining

```python
from ml.retraining.pipeline import RetrainingPipeline

# Initialize pipeline
pipeline = RetrainingPipeline(
    model_dir="/tmp/models",
    min_training_samples=100,
    min_accuracy_threshold=0.6
)

# Run retraining pipeline
results = pipeline.run_pipeline(
    train_texts=train_texts,
    train_labels=train_labels,
    test_texts=test_texts,
    test_labels=test_labels,
    model_type="tfidf",
    model_name="sentiment_classifier",
    auto_deploy=True  # Auto-deploy if passes checks
)

print(f"Status: {results['status']}")
print(f"Accuracy: {results['evaluation_metrics']['accuracy']:.3f}")
print(f"Recommendation: {results['comparison']['recommendation']}")
```

## Architecture

### Module Structure

```
ml/
├── sentiment/
│   ├── trainer.py              # TF-IDF sentiment classifier (existing)
│   ├── finbert_analyzer.py     # FinBERT analyzer (new)
│   ├── biobert_analyzer.py     # BioBERT analyzer (new)
│   ├── ensemble_analyzer.py    # Ensemble models (new)
│   └── catalyst_integration.py # Catalyst scoring integration (new)
├── monitoring/
│   ├── model_monitor.py        # Model monitoring & drift detection (new)
│   └── ab_testing.py           # A/B testing framework (new)
└── retraining/
    └── pipeline.py             # Automated retraining (new)
```

## API Integration

### Adding Sentiment to Catalyst Endpoints

Update `bt_platform/core/endpoints/biotech.py`:

```python
from ml.sentiment.catalyst_integration import create_catalyst_sentiment_scorer

# Initialize scorer (can be global or per-request)
sentiment_scorer = create_catalyst_sentiment_scorer(model_type="tfidf")

@router.get("/catalysts")
async def get_catalysts(
    include_sentiment: bool = False,
    db: Session = Depends(get_db)
):
    catalysts = db.query(Catalyst).all()

    # Convert to dict
    catalyst_dicts = [catalyst_to_dict(c) for c in catalysts]

    # Optionally add sentiment
    if include_sentiment:
        catalyst_dicts = sentiment_scorer.batch_score_catalysts(catalyst_dicts)

    return {"data": catalyst_dicts}
```

## Performance Considerations

### FinBERT/BioBERT
- **Latency**: 50-100ms per text (CPU), 10-20ms (GPU)
- **Memory**: ~500MB model size
- **Batch Processing**: Use `batch_predict()` for efficiency

### TF-IDF Baseline
- **Latency**: <5ms per text
- **Memory**: ~50MB model size
- **Best for**: High-throughput, real-time applications

### Ensemble
- **Latency**: Sum of individual models
- **Memory**: Sum of individual models
- **Best for**: High-accuracy, offline processing

## Testing

Run all tests:
```bash
# All ML tests
pytest ml/

# Specific modules
pytest ml/sentiment/test_ensemble.py
pytest ml/monitoring/test_ab_testing.py
```

## Monitoring in Production

### Drift Detection
```python
# Set up monitoring
monitor = ModelMonitor(drift_threshold=0.05)
monitor.set_baseline(historical_predictions, historical_confidences, features)

# In prediction endpoint
prediction = model.predict([text])[0]
confidence = model.predict_proba([text])[0][prediction]
monitor.log_prediction(prediction, confidence)

# Check periodically (e.g., daily cron job)
alerts = monitor.check_alerts()
if alerts:
    send_alert_notification(alerts)
```

### A/B Testing
```python
# Progressive rollout
ab_test = create_ab_test(
    test_name="new_model_rollout",
    model_a_name="production",
    model_b_name="candidate",
    traffic_split=0.1  # 10% to new model
)

# After sufficient data
result = ab_test.analyze()
if result.winner == "candidate":
    # Increase traffic_split gradually
    pass
```

## Troubleshooting

### Transformers Not Installed
If you see `ImportError: transformers not installed`:
```bash
pip install transformers torch
```

Or use TF-IDF/ensemble without transformers:
```python
from ml.sentiment.trainer import SentimentTrainer
model = SentimentTrainer()  # Works without transformers
```

### Memory Issues with BERT Models
```python
# Use CPU to reduce memory
analyzer = FinBERTAnalyzer(device="cpu")

# Or reduce batch size
predictions, probs = analyzer.batch_predict(texts, batch_size=4)
```

### Drift Alerts
If you get too many drift alerts:
```python
# Increase threshold
monitor = ModelMonitor(drift_threshold=0.10)

# Or increase window size
monitor = ModelMonitor(window_size=200)
```

## Future Enhancements

1. **GPU Support**: Optimize for GPU inference
2. **Model Distillation**: Compress large models for faster inference
3. **Active Learning**: Prioritize uncertain predictions for labeling
4. **Feature Store**: Cache embeddings and features
5. **Real-time Monitoring Dashboard**: Visualize drift and performance

## Support

For issues or questions:
- Check the test files for usage examples
- Review the module docstrings
- See the main documentation in `docs/ML_EXTENSIBILITY_FRAMEWORK.md`

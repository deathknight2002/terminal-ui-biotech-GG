"""
Tests for Model Monitor
========================
"""

import pytest
import numpy as np
from datetime import datetime, timedelta
from ml.monitoring.model_monitor import ModelMonitor, create_model_monitor


def test_model_monitor_initialization():
    """Test monitor initialization."""
    monitor = ModelMonitor(drift_threshold=0.05, window_size=100)

    assert monitor.drift_threshold == 0.05
    assert monitor.window_size == 100
    assert len(monitor.predictions) == 0
    assert monitor.baseline_pred_dist is None


def test_log_prediction():
    """Test logging predictions."""
    monitor = ModelMonitor()

    monitor.log_prediction(
        prediction=1,
        confidence=0.85,
        features={'feature1': 1.5},
        true_label=1
    )

    assert len(monitor.predictions) == 1
    assert monitor.predictions[0] == 1
    assert monitor.confidences[0] == 0.85
    assert len(monitor.features) == 1
    assert monitor.true_labels[0] == 1


def test_set_baseline():
    """Test setting baseline statistics."""
    monitor = ModelMonitor()

    baseline_preds = [1] * 40 + [0] * 30 + [-1] * 30
    baseline_confs = np.random.uniform(0.7, 0.95, 100).tolist()
    baseline_features = [{'feature1': np.random.normal(0, 1)} for _ in range(100)]

    monitor.set_baseline(baseline_preds, baseline_confs, baseline_features)

    assert monitor.baseline_pred_dist is not None
    assert 1 in monitor.baseline_pred_dist
    assert 0 in monitor.baseline_pred_dist
    assert -1 in monitor.baseline_pred_dist


def test_detect_prediction_drift_no_baseline():
    """Test drift detection without baseline."""
    monitor = ModelMonitor()

    result = monitor.detect_prediction_drift()

    assert not result['drift_detected']
    assert 'reason' in result


def test_detect_prediction_drift_with_drift():
    """Test drift detection with actual drift."""
    monitor = ModelMonitor(drift_threshold=0.05, window_size=50)

    # Set baseline
    baseline_preds = [1] * 40 + [0] * 30 + [-1] * 30
    baseline_confs = [0.8] * 100
    baseline_features = [{}] * 100
    monitor.set_baseline(baseline_preds, baseline_confs, baseline_features)

    # Add drifted predictions
    for _ in range(50):
        monitor.log_prediction(-1, 0.8)  # Mostly negative now

    result = monitor.detect_prediction_drift()

    assert 'drift_detected' in result
    assert 'kl_divergence' in result


def test_detect_feature_drift():
    """Test feature drift detection."""
    monitor = ModelMonitor(window_size=50)

    # Set baseline
    baseline_features = [{'feature1': np.random.normal(0, 1)} for _ in range(100)]
    monitor.set_baseline([1] * 100, [0.8] * 100, baseline_features)

    # Add features with drift
    for _ in range(50):
        monitor.log_prediction(1, 0.8, features={'feature1': np.random.normal(5, 1)})

    result = monitor.detect_feature_drift()

    assert 'drift_detected' in result
    assert 'drifted_features' in result


def test_compute_performance_metrics():
    """Test computing performance metrics."""
    monitor = ModelMonitor()

    # Add predictions with labels
    for i in range(100):
        pred = 1 if i < 80 else -1
        label = 1 if i < 80 else -1  # 100% accuracy
        monitor.log_prediction(pred, 0.8, true_label=label)

    metrics = monitor.compute_performance_metrics()

    assert 'accuracy' in metrics
    assert 'precision' in metrics
    assert 'recall' in metrics
    assert 'f1_score' in metrics
    assert metrics['accuracy'] == 1.0  # Perfect accuracy


def test_compute_performance_metrics_no_labels():
    """Test performance metrics without labels."""
    monitor = ModelMonitor()

    # Add predictions without labels
    for _ in range(100):
        monitor.log_prediction(1, 0.8)

    metrics = monitor.compute_performance_metrics()

    assert 'error' in metrics


def test_get_confidence_trends():
    """Test confidence trend analysis."""
    monitor = ModelMonitor()

    # Add predictions with decreasing confidence
    for i in range(100):
        conf = 0.9 - (i * 0.003)  # Decrease from 0.9 to 0.6
        monitor.log_prediction(1, conf)

    trends = monitor.get_confidence_trends(window_size=50)

    assert 'recent_avg_confidence' in trends
    assert 'older_avg_confidence' in trends
    assert 'trend' in trends
    assert trends['trend'] == 'decreasing'


def test_check_alerts():
    """Test alert checking."""
    monitor = ModelMonitor(drift_threshold=0.05, window_size=50)

    # Set baseline
    baseline_preds = [1] * 50
    baseline_confs = [0.9] * 50
    monitor.set_baseline(baseline_preds, baseline_confs, [])

    # Add drifted predictions with low confidence
    for _ in range(50):
        monitor.log_prediction(-1, 0.5)

    alerts = monitor.check_alerts()

    assert isinstance(alerts, list)
    # Should have alerts for drift and confidence degradation
    alert_types = [alert['type'] for alert in alerts]
    assert len(alert_types) > 0


def test_get_summary_report():
    """Test generating summary report."""
    monitor = ModelMonitor()

    # Add some predictions
    for i in range(50):
        monitor.log_prediction(
            prediction=1 if i < 30 else -1,
            confidence=0.8,
            true_label=1 if i < 30 else -1
        )

    summary = monitor.get_summary_report()

    assert 'monitoring_info' in summary
    assert 'prediction_distribution' in summary
    assert 'drift_detection' in summary
    assert 'performance_metrics' in summary
    assert 'alerts' in summary


def test_factory_function():
    """Test factory function."""
    monitor = create_model_monitor(drift_threshold=0.1)
    assert isinstance(monitor, ModelMonitor)
    assert monitor.drift_threshold == 0.1

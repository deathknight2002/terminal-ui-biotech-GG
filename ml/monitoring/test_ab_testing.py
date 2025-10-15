"""
Tests for A/B Testing Framework
================================
"""

import pytest
import numpy as np
from datetime import datetime
from ml.monitoring.ab_testing import (
    ABTester,
    ABTestConfig,
    ABTestResult,
    create_ab_test
)


def test_ab_test_config():
    """Test A/B test configuration."""
    config = ABTestConfig(
        test_name="Test A vs B",
        model_a_name="model_a",
        model_b_name="model_b",
        traffic_split=0.6
    )
    
    assert config.test_name == "Test A vs B"
    assert config.model_a_name == "model_a"
    assert config.model_b_name == "model_b"
    assert config.traffic_split == 0.6


def test_ab_tester_initialization():
    """Test AB tester initialization."""
    config = ABTestConfig(
        test_name="test",
        model_a_name="a",
        model_b_name="b"
    )
    tester = ABTester(config)
    
    assert tester.config == config
    assert len(tester.model_a_predictions) == 0
    assert len(tester.model_b_predictions) == 0


def test_assign_variant():
    """Test variant assignment."""
    config = ABTestConfig(
        test_name="test",
        model_a_name="a",
        model_b_name="b",
        traffic_split=0.5
    )
    tester = ABTester(config)
    
    # Run multiple assignments
    assignments = [tester.assign_variant() for _ in range(100)]
    
    # Both variants should be assigned
    assert 'model_a' in assignments
    assert 'model_b' in assignments


def test_log_prediction():
    """Test logging predictions."""
    config = ABTestConfig(test_name="test", model_a_name="a", model_b_name="b")
    tester = ABTester(config)
    
    tester.log_prediction('model_a', 1, 0.8, true_label=1, latency_ms=10.5)
    tester.log_prediction('model_b', -1, 0.9, true_label=-1, latency_ms=50.2)
    
    assert len(tester.model_a_predictions) == 1
    assert tester.model_a_predictions[0] == 1
    assert tester.model_a_confidences[0] == 0.8
    
    assert len(tester.model_b_predictions) == 1
    assert tester.model_b_predictions[0] == -1


def test_compute_metrics():
    """Test computing metrics for a variant."""
    config = ABTestConfig(test_name="test", model_a_name="a", model_b_name="b")
    tester = ABTester(config)
    
    predictions = [1, 1, 0, 0, -1]
    confidences = [0.8, 0.9, 0.7, 0.85, 0.95]
    true_labels = [1, 0, 0, -1, -1]  # 3/5 correct = 0.6 accuracy
    latencies = [10.0, 12.0, 11.0, 9.0, 13.0]
    
    metrics = tester.compute_metrics(predictions, confidences, true_labels, latencies)
    
    assert metrics['n_predictions'] == 5
    assert 'avg_confidence' in metrics
    assert 'avg_latency_ms' in metrics
    assert 'accuracy' in metrics
    assert metrics['accuracy'] == 0.6


def test_test_statistical_significance():
    """Test statistical significance testing."""
    config = ABTestConfig(test_name="test", model_a_name="a", model_b_name="b")
    tester = ABTester(config)
    
    # Model A better than B
    values_a = np.random.normal(0.8, 0.1, 100).tolist()
    values_b = np.random.normal(0.6, 0.1, 100).tolist()
    
    result = tester.test_statistical_significance('accuracy', values_a, values_b)
    
    assert 'metric' in result
    assert 'mean_a' in result
    assert 'mean_b' in result
    assert 'p_value' in result
    assert 'significant' in result
    assert result['mean_a'] > result['mean_b']


def test_is_ready_for_analysis():
    """Test checking if ready for analysis."""
    config = ABTestConfig(
        test_name="test",
        model_a_name="a",
        model_b_name="b",
        min_samples=100
    )
    tester = ABTester(config)
    
    # Not ready yet
    assert not tester.is_ready_for_analysis()
    
    # Add samples
    for i in range(100):
        tester.log_prediction('model_a', 1, 0.8)
        tester.log_prediction('model_b', 1, 0.8)
    
    # Now ready
    assert tester.is_ready_for_analysis()


def test_analyze_ab_test():
    """Test analyzing A/B test results."""
    config = ABTestConfig(
        test_name="test",
        model_a_name="a",
        model_b_name="b",
        min_samples=100
    )
    tester = ABTester(config)
    
    # Add predictions - model A better
    np.random.seed(42)
    for i in range(100):
        # Model A: 75% accuracy
        true_label = np.random.choice([1, 0, -1])
        pred_a = true_label if np.random.random() < 0.75 else np.random.choice([1, 0, -1])
        tester.log_prediction('model_a', pred_a, 0.85, true_label=true_label, latency_ms=10.0)
        
        # Model B: 60% accuracy
        pred_b = true_label if np.random.random() < 0.60 else np.random.choice([1, 0, -1])
        tester.log_prediction('model_b', pred_b, 0.80, true_label=true_label, latency_ms=50.0)
    
    result = tester.analyze()
    
    assert isinstance(result, ABTestResult)
    assert result.model_a_metrics['accuracy'] > 0.5
    assert 'winner' in result.__dict__
    assert result.recommendation != ""


def test_analyze_insufficient_data():
    """Test analyzing with insufficient data."""
    config = ABTestConfig(
        test_name="test",
        model_a_name="a",
        model_b_name="b",
        min_samples=100
    )
    tester = ABTester(config)
    
    # Add only 50 samples
    for i in range(50):
        tester.log_prediction('model_a', 1, 0.8)
        tester.log_prediction('model_b', 1, 0.8)
    
    with pytest.raises(ValueError, match="Insufficient data"):
        tester.analyze()


def test_get_summary():
    """Test getting test summary."""
    config = ABTestConfig(test_name="test", model_a_name="a", model_b_name="b")
    tester = ABTester(config)
    
    # Add some data
    for i in range(50):
        tester.log_prediction('model_a', 1, 0.8)
    
    summary = tester.get_summary()
    
    assert summary['test_name'] == "test"
    assert summary['model_a'] == "a"
    assert summary['model_b'] == "b"
    assert summary['samples_a'] == 50
    assert summary['samples_b'] == 0


def test_factory_function():
    """Test factory function."""
    tester = create_ab_test(
        test_name="Test",
        model_a_name="model_a",
        model_b_name="model_b",
        traffic_split=0.6
    )
    
    assert isinstance(tester, ABTester)
    assert tester.config.test_name == "Test"
    assert tester.config.traffic_split == 0.6


def test_determine_winner_by_accuracy():
    """Test winner determination based on accuracy."""
    config = ABTestConfig(test_name="test", model_a_name="a", model_b_name="b", min_samples=50)
    tester = ABTester(config)
    
    # Model A: 80% accuracy
    # Model B: 60% accuracy
    for i in range(50):
        label = 1
        pred_a = 1 if i < 40 else 0
        pred_b = 1 if i < 30 else 0
        
        tester.log_prediction('model_a', pred_a, 0.8, true_label=label)
        tester.log_prediction('model_b', pred_b, 0.75, true_label=label)
    
    result = tester.analyze()
    
    # Model A should win
    assert result.winner is not None
    assert result.model_a_metrics['accuracy'] > result.model_b_metrics['accuracy']

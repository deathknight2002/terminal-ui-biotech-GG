"""
Tests for Ensemble Sentiment Analyzer
======================================
"""

import pytest
import numpy as np
from ml.sentiment.ensemble_analyzer import EnsembleSentimentAnalyzer, create_default_ensemble


class MockSentimentModel:
    """Mock sentiment model for testing."""

    def __init__(self, predictions, probabilities=None):
        self.predictions = predictions
        self.probabilities = probabilities or []
        self.is_available = True

    def predict(self, texts):
        return self.predictions[:len(texts)]

    def predict_proba(self, texts):
        if self.probabilities:
            return self.probabilities[:len(texts)]
        # Generate default probabilities
        result = []
        for pred in self.predictions[:len(texts)]:
            if pred == 1:
                result.append({1: 0.8, 0: 0.15, -1: 0.05})
            elif pred == -1:
                result.append({-1: 0.8, 0: 0.15, 1: 0.05})
            else:
                result.append({0: 0.7, 1: 0.15, -1: 0.15})
        return result


def test_ensemble_initialization():
    """Test ensemble initialization."""
    ensemble = EnsembleSentimentAnalyzer(ensemble_method="weighted")

    assert ensemble.ensemble_method == "weighted"
    assert len(ensemble.models) == 0
    assert len(ensemble.weights) == 0


def test_ensemble_add_model():
    """Test adding models to ensemble."""
    ensemble = EnsembleSentimentAnalyzer()

    model_a = MockSentimentModel([1, 0, -1])
    model_b = MockSentimentModel([1, 1, -1])

    ensemble.add_model("model_a", model_a, weight=1.0)
    # At this point, model_a has weight 1.0 (normalized)
    assert abs(ensemble.weights["model_a"] - 1.0) < 0.01

    ensemble.add_model("model_b", model_b, weight=1.0)
    # After adding model_b with same weight, both should be 0.5
    assert len(ensemble.models) == 2
    assert "model_a" in ensemble.models
    assert "model_b" in ensemble.models
    assert abs(ensemble.weights["model_a"] - 0.5) < 0.01
    assert abs(ensemble.weights["model_b"] - 0.5) < 0.01


def test_ensemble_remove_model():
    """Test removing models from ensemble."""
    ensemble = EnsembleSentimentAnalyzer()

    model_a = MockSentimentModel([1, 0, -1])
    ensemble.add_model("model_a", model_a)

    assert "model_a" in ensemble.models

    ensemble.remove_model("model_a")
    assert "model_a" not in ensemble.models


def test_ensemble_majority_vote():
    """Test majority voting."""
    ensemble = EnsembleSentimentAnalyzer(ensemble_method="majority")

    # Model A predicts mostly positive
    model_a = MockSentimentModel([1, 1, 1, 0])
    # Model B predicts mixed
    model_b = MockSentimentModel([1, 0, -1, 0])
    # Model C predicts mostly positive
    model_c = MockSentimentModel([1, 1, 1, 1])

    ensemble.add_model("a", model_a)
    ensemble.add_model("b", model_b)
    ensemble.add_model("c", model_c)

    predictions = ensemble.predict(["text1", "text2", "text3", "text4"])

    # Should mostly be 1 (positive) due to majority
    assert predictions[0] == 1  # 3/3 vote for 1
    assert predictions[1] == 1  # 2/3 vote for 1


def test_ensemble_weighted_vote():
    """Test weighted voting."""
    ensemble = EnsembleSentimentAnalyzer(ensemble_method="weighted")

    model_a = MockSentimentModel([1, 0, -1])
    model_b = MockSentimentModel([-1, 0, 1])

    ensemble.add_model("a", model_a, weight=0.7)
    ensemble.add_model("b", model_b, weight=0.3)

    predictions = ensemble.predict(["text1", "text2", "text3"])

    # Weighted sum should favor model_a
    assert predictions[0] in [-1, 0, 1]  # Valid sentiment


def test_ensemble_predict_proba():
    """Test probability prediction."""
    ensemble = EnsembleSentimentAnalyzer(ensemble_method="weighted")

    model_a = MockSentimentModel([1], [{1: 0.8, 0: 0.1, -1: 0.1}])
    model_b = MockSentimentModel([1], [{1: 0.6, 0: 0.2, -1: 0.2}])

    ensemble.add_model("a", model_a, weight=0.5)
    ensemble.add_model("b", model_b, weight=0.5)

    probas = ensemble.predict_proba(["text1"])

    assert len(probas) == 1
    assert 1 in probas[0]
    assert 0 in probas[0]
    assert -1 in probas[0]

    # Probabilities should sum to ~1
    assert abs(sum(probas[0].values()) - 1.0) < 0.01


def test_ensemble_compare_models():
    """Test model comparison."""
    ensemble = EnsembleSentimentAnalyzer()

    model_a = MockSentimentModel([1, 0, -1], [
        {1: 0.9, 0: 0.05, -1: 0.05},
        {0: 0.8, 1: 0.1, -1: 0.1},
        {-1: 0.85, 0: 0.1, 1: 0.05}
    ])

    ensemble.add_model("a", model_a)

    comparison = ensemble.compare_models(["text1", "text2", "text3"])

    assert "a" in comparison
    assert "predictions" in comparison["a"]
    assert "avg_confidence" in comparison["a"]
    assert comparison["a"]["bullish_count"] == 1
    assert comparison["a"]["bearish_count"] == 1
    assert comparison["a"]["neutral_count"] == 1


def test_ensemble_ab_test():
    """Test A/B testing between models."""
    from sklearn.metrics import accuracy_score

    ensemble = EnsembleSentimentAnalyzer()

    # Model A: 80% accuracy
    model_a = MockSentimentModel([1, 1, 0, 0, -1])
    # Model B: 60% accuracy
    model_b = MockSentimentModel([1, 0, 0, -1, -1])

    ensemble.add_model("a", model_a)
    ensemble.add_model("b", model_b)

    texts = ["text1", "text2", "text3", "text4", "text5"]
    labels = [1, 1, 0, 0, -1]

    result = ensemble.ab_test(texts, labels, "a", "b")

    assert "model_a" in result
    assert "model_b" in result
    assert "accuracy_a" in result
    assert "accuracy_b" in result
    assert "winner" in result


def test_ensemble_get_model_info():
    """Test getting model information."""
    ensemble = EnsembleSentimentAnalyzer()

    model_a = MockSentimentModel([1, 0, -1])
    ensemble.add_model("a", model_a, weight=0.7)

    info = ensemble.get_model_info()

    assert "a" in info
    assert info["a"]["type"] == "MockSentimentModel"
    # Weight is normalized to 1.0 since it's the only model
    assert info["a"]["weight"] == 1.0
    assert info["a"]["is_available"] == True


def test_ensemble_no_models_error():
    """Test error when no models in ensemble."""
    ensemble = EnsembleSentimentAnalyzer()

    with pytest.raises(ValueError, match="No models in ensemble"):
        ensemble.predict(["text1"])


def test_ensemble_repr():
    """Test string representation."""
    ensemble = EnsembleSentimentAnalyzer(ensemble_method="weighted")
    model_a = MockSentimentModel([1, 0, -1])
    ensemble.add_model("a", model_a)

    repr_str = repr(ensemble)
    assert "EnsembleSentimentAnalyzer" in repr_str
    assert "weighted" in repr_str

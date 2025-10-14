"""
Tests for ML Sentiment Classifier

Tests the sentiment trainer including:
- Data preparation
- Model training
- Prediction
- Model persistence
"""

import pytest
import pandas as pd
import numpy as np
from pathlib import Path
import tempfile
import shutil

from ml.sentiment.trainer import SentimentTrainer


@pytest.fixture
def sample_data():
    """Create sample training data"""
    data = {
        'text': [
            'FDA approves breakthrough therapy for cancer treatment',
            'Clinical trial fails to meet primary endpoints',
            'Company announces positive Phase 3 results',
            'Regulatory setback delays drug approval',
            'Partnership announced for drug development',
            'Stock price surges on positive trial data',
            'Disappointing results from late-stage trial',
            'FDA grants orphan drug designation',
            'Trial halted due to safety concerns',
            'Positive interim analysis released'
        ],
        'outcome': [
            'positive', 'negative', 'positive', 'negative', 'neutral',
            'positive', 'negative', 'positive', 'negative', 'positive'
        ],
        'event_leverage': [4, 2, 4, 2, 2, 3, 2, 3, 1, 3],
        'timing_clarity': [3, 2, 3, 2, 2, 2, 2, 2, 1, 2],
        'surprise_factor': [3, 1, 3, 1, 2, 3, 1, 2, 1, 2],
        'downside_contained': [2, 1, 3, 1, 2, 3, 1, 2, 1, 2],
        'market_depth': [3, 2, 3, 2, 2, 3, 2, 2, 2, 2]
    }
    return pd.DataFrame(data)


@pytest.fixture
def temp_model_dir():
    """Create temporary directory for model storage"""
    temp_dir = tempfile.mkdtemp()
    yield temp_dir
    shutil.rmtree(temp_dir)


def test_sentiment_trainer_initialization(temp_model_dir):
    """Test SentimentTrainer initialization"""
    trainer = SentimentTrainer(model_dir=temp_model_dir)
    
    assert trainer.model_dir == Path(temp_model_dir)
    assert trainer.model is None
    assert trainer.vectorizer is None


def test_prepare_data(sample_data, temp_model_dir):
    """Test data preparation"""
    trainer = SentimentTrainer(model_dir=temp_model_dir)
    
    X_train_text, X_test_text, X_train_num, X_test_num, y_train, y_test = trainer.prepare_data(
        sample_data
    )
    
    # Check shapes
    assert len(X_train_text) + len(X_test_text) == len(sample_data)
    assert len(y_train) + len(y_test) == len(sample_data)
    
    # Check label encoding
    assert set(np.unique(y_train)) <= {0, 1, 2}  # negative, positive, neutral
    assert set(np.unique(y_test)) <= {0, 1, 2}


def test_train_model(sample_data, temp_model_dir):
    """Test model training"""
    trainer = SentimentTrainer(model_dir=temp_model_dir)
    
    # Prepare data
    X_train_text, X_test_text, X_train_num, X_test_num, y_train, y_test = trainer.prepare_data(
        sample_data
    )
    
    # Train with small parameter grid for speed
    param_grid = {
        'tfidf__max_features': [100],
        'tfidf__ngram_range': [(1, 1)],
        'clf__C': [1.0],
        'clf__penalty': ['l2']
    }
    
    metrics = trainer.train(X_train_text, X_train_num, y_train, param_grid=param_grid)
    
    # Check metrics
    assert 'best_params' in metrics
    assert 'best_cv_score' in metrics
    assert 'timestamp' in metrics
    assert metrics['best_cv_score'] >= 0.0
    assert metrics['best_cv_score'] <= 1.0
    
    # Check model is trained
    assert trainer.model is not None


def test_evaluate_model(sample_data, temp_model_dir):
    """Test model evaluation"""
    trainer = SentimentTrainer(model_dir=temp_model_dir)
    
    # Prepare and train
    X_train_text, X_test_text, X_train_num, X_test_num, y_train, y_test = trainer.prepare_data(
        sample_data
    )
    
    param_grid = {
        'tfidf__max_features': [100],
        'tfidf__ngram_range': [(1, 1)],
        'clf__C': [1.0],
        'clf__penalty': ['l2']
    }
    
    trainer.train(X_train_text, X_train_num, y_train, param_grid=param_grid)
    
    # Evaluate
    eval_metrics = trainer.evaluate(X_test_text, y_test)
    
    # Check metrics
    assert 'accuracy' in eval_metrics
    assert 'precision' in eval_metrics
    assert 'recall' in eval_metrics
    assert 'f1_score' in eval_metrics
    assert 'confusion_matrix' in eval_metrics
    
    # Check ranges
    assert 0.0 <= eval_metrics['accuracy'] <= 1.0
    assert 0.0 <= eval_metrics['precision'] <= 1.0
    assert 0.0 <= eval_metrics['recall'] <= 1.0
    assert 0.0 <= eval_metrics['f1_score'] <= 1.0


def test_predict(sample_data, temp_model_dir):
    """Test single prediction"""
    trainer = SentimentTrainer(model_dir=temp_model_dir)
    
    # Prepare and train
    X_train_text, X_test_text, X_train_num, X_test_num, y_train, y_test = trainer.prepare_data(
        sample_data
    )
    
    param_grid = {
        'tfidf__max_features': [100],
        'tfidf__ngram_range': [(1, 1)],
        'clf__C': [1.0],
        'clf__penalty': ['l2']
    }
    
    trainer.train(X_train_text, X_train_num, y_train, param_grid=param_grid)
    
    # Predict
    test_text = "FDA approves new cancer drug"
    result = trainer.predict(test_text)
    
    # Check result structure
    assert 'sentiment' in result
    assert 'confidence' in result
    assert 'probabilities' in result
    
    # Check sentiment is valid
    assert result['sentiment'] in ['positive', 'negative', 'neutral']
    
    # Check confidence
    assert 0.0 <= result['confidence'] <= 1.0
    
    # Check probabilities
    assert 'positive' in result['probabilities']
    assert 'negative' in result['probabilities']
    assert 'neutral' in result['probabilities']
    
    # Probabilities should sum to ~1.0
    total_prob = sum(result['probabilities'].values())
    assert abs(total_prob - 1.0) < 0.01


def test_predict_batch(sample_data, temp_model_dir):
    """Test batch prediction"""
    trainer = SentimentTrainer(model_dir=temp_model_dir)
    
    # Prepare and train
    X_train_text, X_test_text, X_train_num, X_test_num, y_train, y_test = trainer.prepare_data(
        sample_data
    )
    
    param_grid = {
        'tfidf__max_features': [100],
        'tfidf__ngram_range': [(1, 1)],
        'clf__C': [1.0],
        'clf__penalty': ['l2']
    }
    
    trainer.train(X_train_text, X_train_num, y_train, param_grid=param_grid)
    
    # Predict batch
    test_texts = [
        "FDA approves new drug",
        "Trial fails to meet endpoints",
        "Partnership announced"
    ]
    
    results = trainer.predict_batch(test_texts)
    
    # Check results
    assert len(results) == len(test_texts)
    
    for result in results:
        assert 'sentiment' in result
        assert 'confidence' in result
        assert 'probabilities' in result


def test_model_persistence(sample_data, temp_model_dir):
    """Test model saving and loading"""
    trainer = SentimentTrainer(model_dir=temp_model_dir)
    
    # Prepare and train
    X_train_text, X_test_text, X_train_num, X_test_num, y_train, y_test = trainer.prepare_data(
        sample_data
    )
    
    param_grid = {
        'tfidf__max_features': [100],
        'tfidf__ngram_range': [(1, 1)],
        'clf__C': [1.0],
        'clf__penalty': ['l2']
    }
    
    trainer.train(X_train_text, X_train_num, y_train, param_grid=param_grid)
    
    # Make prediction before saving
    test_text = "FDA approves new drug"
    result_before = trainer.predict(test_text)
    
    # Save model
    trainer.save_model(version="test")
    
    # Create new trainer and load model
    trainer2 = SentimentTrainer(model_dir=temp_model_dir)
    trainer2.load_model(version="test")
    
    # Make same prediction with loaded model
    result_after = trainer2.predict(test_text)
    
    # Results should be identical
    assert result_before['sentiment'] == result_after['sentiment']
    assert abs(result_before['confidence'] - result_after['confidence']) < 0.001


def test_predict_without_training(temp_model_dir):
    """Test that prediction fails without training"""
    trainer = SentimentTrainer(model_dir=temp_model_dir)
    
    with pytest.raises(ValueError, match="Model not trained or loaded"):
        trainer.predict("test text")


def test_load_nonexistent_model(temp_model_dir):
    """Test loading non-existent model"""
    trainer = SentimentTrainer(model_dir=temp_model_dir)
    
    with pytest.raises(FileNotFoundError):
        trainer.load_model(version="nonexistent")


def test_prepare_data_with_missing_columns(temp_model_dir):
    """Test data preparation with missing numeric columns"""
    trainer = SentimentTrainer(model_dir=temp_model_dir)
    
    # Data without numeric features
    data = pd.DataFrame({
        'text': ['test 1', 'test 2', 'test 3', 'test 4'],
        'outcome': ['positive', 'negative', 'positive', 'negative']
    })
    
    X_train_text, X_test_text, X_train_num, X_test_num, y_train, y_test = trainer.prepare_data(
        data
    )
    
    # Should work without numeric features
    assert X_train_num is None
    assert X_test_num is None

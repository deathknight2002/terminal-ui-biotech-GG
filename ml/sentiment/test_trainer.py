"""
Unit Tests for ML Sentiment Trainer
====================================

Tests the SentimentTrainer class with various scenarios.
"""

import pytest
import numpy as np
from ml.sentiment.trainer import SentimentTrainer, create_sample_training_data


class TestSentimentTrainer:
    """Test cases for SentimentTrainer."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.trainer = SentimentTrainer(max_features=1000, random_state=42)
        self.texts, self.labels = create_sample_training_data()
    
    def test_initialization(self):
        """Test that trainer initializes correctly."""
        assert self.trainer.max_features == 1000
        assert self.trainer.ngram_range == (1, 2)
        assert self.trainer.random_state == 42
        assert not self.trainer.is_fitted
    
    def test_fit_basic(self):
        """Test basic model training."""
        metrics = self.trainer.fit(self.texts, self.labels, validation_split=0.2)
        
        assert self.trainer.is_fitted
        assert 'accuracy' in metrics
        assert 'cv_mean' in metrics
        assert 0.0 <= metrics['accuracy'] <= 1.0
        assert 0.0 <= metrics['cv_mean'] <= 1.0
    
    def test_fit_with_invalid_labels(self):
        """Test that fit raises error with invalid labels."""
        invalid_labels = [0, 1, 2, 3]  # Invalid labels
        texts = ["text 1", "text 2", "text 3", "text 4"]
        
        with pytest.raises(ValueError, match="Labels must be"):
            self.trainer.fit(texts, invalid_labels)
    
    def test_predict_before_fit(self):
        """Test that predict raises error before fitting."""
        with pytest.raises(RuntimeError, match="must be fitted"):
            self.trainer.predict(["test text"])
    
    def test_predict_after_fit(self):
        """Test prediction after training."""
        self.trainer.fit(self.texts, self.labels, validation_split=0.2)
        
        test_texts = [
            "FDA approves new cancer treatment",
            "Company reports quarterly earnings",
            "Clinical trial fails to meet endpoints"
        ]
        
        predictions = self.trainer.predict(test_texts)
        
        assert len(predictions) == len(test_texts)
        assert all(pred in [-1, 0, 1] for pred in predictions)
    
    def test_predict_proba(self):
        """Test probability predictions."""
        self.trainer.fit(self.texts, self.labels, validation_split=0.2)
        
        test_texts = ["FDA approval", "Quarterly update"]
        probas = self.trainer.predict_proba(test_texts)
        
        assert probas.shape[0] == len(test_texts)
        assert probas.shape[1] == len(self.trainer.classes)
        assert np.allclose(probas.sum(axis=1), 1.0)  # Probabilities sum to 1
    
    def test_get_sentiment_scores(self):
        """Test detailed sentiment scoring."""
        self.trainer.fit(self.texts, self.labels, validation_split=0.2)
        
        test_texts = ["Positive approval news", "Negative trial failure"]
        scores = self.trainer.get_sentiment_scores(test_texts)
        
        assert len(scores) == len(test_texts)
        for score in scores:
            assert 'prediction' in score
            assert 'confidence' in score
            assert 'probabilities' in score
            assert 0.0 <= score['confidence'] <= 1.0
    
    def test_get_top_features(self):
        """Test feature extraction."""
        self.trainer.fit(self.texts, self.labels, validation_split=0.2)
        
        features = self.trainer.get_top_features(n=10)
        
        assert isinstance(features, dict)
        for class_label, feature_list in features.items():
            assert class_label in self.trainer.classes
            assert len(feature_list) <= 10
            assert all(isinstance(f, tuple) and len(f) == 2 for f in feature_list)
    
    def test_save_and_load(self, tmp_path):
        """Test model persistence."""
        # Train and save
        self.trainer.fit(self.texts, self.labels, validation_split=0.2)
        model_path = tmp_path / "model.joblib"
        self.trainer.save(str(model_path))
        
        assert model_path.exists()
        
        # Load and test
        loaded_trainer = SentimentTrainer.load(str(model_path))
        
        assert loaded_trainer.is_fitted
        assert loaded_trainer.max_features == self.trainer.max_features
        
        # Test predictions are consistent
        test_text = ["FDA approval news"]
        orig_pred = self.trainer.predict(test_text)
        loaded_pred = loaded_trainer.predict(test_text)
        
        assert orig_pred[0] == loaded_pred[0]
    
    def test_evaluate(self):
        """Test model evaluation."""
        # Train on sample data
        self.trainer.fit(self.texts, self.labels, validation_split=0.2)
        
        # Evaluate on same data (not realistic, but tests the method)
        eval_metrics = self.trainer.evaluate(self.texts[:10], self.labels[:10])
        
        assert 'accuracy' in eval_metrics
        assert 'classification_report' in eval_metrics
        assert 'confusion_matrix' in eval_metrics
        assert 0.0 <= eval_metrics['accuracy'] <= 1.0
    
    def test_cross_validation_scores(self):
        """Test cross-validation during training."""
        metrics = self.trainer.fit(self.texts, self.labels, validation_split=0.2)
        
        assert 'cv_mean' in metrics
        assert 'cv_std' in metrics
        assert metrics['cv_mean'] >= 0.0
        assert metrics['cv_std'] >= 0.0
    
    def test_class_distribution(self):
        """Test that class distribution is tracked."""
        metrics = self.trainer.fit(self.texts, self.labels, validation_split=0.2)
        
        assert 'class_distribution' in metrics
        assert isinstance(metrics['class_distribution'], dict)
        
        # Check all classes are represented
        for label in [-1, 0, 1]:
            assert label in metrics['class_distribution']
    
    def test_feature_count(self):
        """Test feature extraction count."""
        self.trainer.fit(self.texts, self.labels, validation_split=0.2)
        
        assert self.trainer.feature_names is not None
        assert len(self.trainer.feature_names) <= self.trainer.max_features
    
    def test_different_ngram_ranges(self):
        """Test with different n-gram ranges."""
        trainer_unigram = SentimentTrainer(ngram_range=(1, 1), random_state=42)
        trainer_trigram = SentimentTrainer(ngram_range=(1, 3), random_state=42)
        
        trainer_unigram.fit(self.texts, self.labels, validation_split=0.2)
        trainer_trigram.fit(self.texts, self.labels, validation_split=0.2)
        
        assert trainer_unigram.is_fitted
        assert trainer_trigram.is_fitted


class TestSampleData:
    """Test the sample data generation."""
    
    def test_create_sample_data(self):
        """Test sample data creation."""
        texts, labels = create_sample_training_data()
        
        assert len(texts) == len(labels)
        assert len(texts) > 0
        
        # Check label distribution
        unique_labels = set(labels)
        assert unique_labels == {-1, 0, 1}
        
        # Check texts are non-empty strings
        assert all(isinstance(t, str) and len(t) > 0 for t in texts)
    
    def test_sample_data_balance(self):
        """Test that sample data has reasonable balance."""
        texts, labels = create_sample_training_data()
        
        label_counts = {
            -1: labels.count(-1),
            0: labels.count(0),
            1: labels.count(1)
        }
        
        # Each class should have some samples
        assert all(count > 0 for count in label_counts.values())
        
        # Classes should be relatively balanced (each at least 20% of total)
        total = len(labels)
        assert all(count >= total * 0.2 for count in label_counts.values())

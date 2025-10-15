"""
Tests for Active Learning Module
"""

import pytest
from unittest.mock import Mock
from ml.optimization.active_learning import (
    ActiveLearner, 
    EnsembleActiveLearner, 
    create_active_learner,
    SamplePriority
)


class TestActiveLearner:
    """Test active learner functionality."""
    
    def test_initialization(self):
        """Test active learner initialization."""
        learner = ActiveLearner(strategy="uncertainty", batch_size=5)
        
        assert learner.strategy == "uncertainty"
        assert learner.batch_size == 5
        assert len(learner.labeled_texts) == 0
        assert len(learner.unlabeled_texts) == 0
    
    def test_add_unlabeled_data(self):
        """Test adding unlabeled data."""
        learner = ActiveLearner()
        
        texts = ["text1", "text2", "text3"]
        learner.add_unlabeled_data(texts)
        
        assert len(learner.unlabeled_texts) == 3
        assert learner.unlabeled_texts == texts
    
    def test_add_labeled_data(self):
        """Test adding labeled data."""
        learner = ActiveLearner()
        
        texts = ["text1", "text2"]
        labels = [1, -1]
        learner.add_labeled_data(texts, labels)
        
        assert len(learner.labeled_texts) == 2
        assert len(learner.labeled_labels) == 2
        assert learner.labeled_texts == texts
        assert learner.labeled_labels == labels
    
    def test_uncertainty_sampling(self):
        """Test uncertainty sampling strategy."""
        learner = ActiveLearner(strategy="uncertainty", batch_size=2)
        learner.add_unlabeled_data(["text1", "text2", "text3"])
        
        # Mock model
        mock_model = Mock()
        mock_model.predict.return_value = [1, 0, -1]
        mock_model.predict_proba.return_value = [
            {-1: 0.1, 0: 0.2, 1: 0.7},  # High confidence
            {-1: 0.3, 0: 0.4, 1: 0.3},  # Low confidence
            {-1: 0.8, 0: 0.1, 1: 0.1},  # High confidence
        ]
        
        selected = learner.select_samples(mock_model)
        
        assert len(selected) == 2
        assert isinstance(selected[0], SamplePriority)
        # text2 should be selected first (lowest confidence)
        assert selected[0].text == "text2"
    
    def test_margin_sampling(self):
        """Test margin sampling strategy."""
        learner = ActiveLearner(strategy="margin", batch_size=2)
        learner.add_unlabeled_data(["text1", "text2", "text3"])
        
        # Mock model
        mock_model = Mock()
        mock_model.predict.return_value = [1, 0, -1]
        mock_model.predict_proba.return_value = [
            {-1: 0.1, 0: 0.2, 1: 0.7},  # Large margin
            {-1: 0.3, 0: 0.35, 1: 0.35},  # Small margin
            {-1: 0.8, 0: 0.15, 1: 0.05},  # Large margin
        ]
        
        selected = learner.select_samples(mock_model)
        
        assert len(selected) == 2
        # text2 should be selected first (smallest margin)
        assert selected[0].text == "text2"
    
    def test_entropy_sampling(self):
        """Test entropy sampling strategy."""
        learner = ActiveLearner(strategy="entropy", batch_size=2)
        learner.add_unlabeled_data(["text1", "text2", "text3"])
        
        # Mock model
        mock_model = Mock()
        mock_model.predict.return_value = [1, 0, -1]
        mock_model.predict_proba.return_value = [
            {-1: 0.1, 0: 0.1, 1: 0.8},  # Low entropy
            {-1: 0.33, 0: 0.34, 1: 0.33},  # High entropy
            {-1: 0.9, 0: 0.05, 1: 0.05},  # Low entropy
        ]
        
        selected = learner.select_samples(mock_model)
        
        assert len(selected) == 2
        # text2 should be selected first (highest entropy)
        assert selected[0].text == "text2"
    
    def test_update_pools(self):
        """Test updating labeled and unlabeled pools."""
        learner = ActiveLearner()
        learner.add_unlabeled_data(["text1", "text2", "text3"])
        
        # Select indices 0 and 2
        selected_indices = [0, 2]
        labels = [1, -1]
        
        learner.update_pools(selected_indices, labels)
        
        assert len(learner.unlabeled_texts) == 1
        assert learner.unlabeled_texts[0] == "text2"
        assert len(learner.labeled_texts) == 2
        assert "text1" in learner.labeled_texts
        assert "text3" in learner.labeled_texts
    
    def test_get_training_data(self):
        """Test getting training data."""
        learner = ActiveLearner()
        
        texts = ["text1", "text2"]
        labels = [1, -1]
        learner.add_labeled_data(texts, labels)
        
        train_texts, train_labels = learner.get_training_data()
        
        assert train_texts == texts
        assert train_labels == labels
    
    def test_get_stats(self):
        """Test getting statistics."""
        learner = ActiveLearner(strategy="uncertainty", batch_size=10)
        learner.add_unlabeled_data(["text1", "text2"])
        learner.add_labeled_data(["text3"], [1])
        
        stats = learner.get_stats()
        
        assert stats['labeled_samples'] == 1
        assert stats['unlabeled_samples'] == 2
        assert stats['strategy'] == "uncertainty"
        assert stats['batch_size'] == 10
    
    def test_log_iteration(self):
        """Test logging iteration."""
        learner = ActiveLearner()
        
        learner.log_iteration(
            model_accuracy=0.85,
            samples_added=10,
            avg_uncertainty=0.42
        )
        
        assert len(learner.iteration_history) == 1
        assert learner.iteration_history[0]['model_accuracy'] == 0.85
        assert learner.iteration_history[0]['samples_added'] == 10
    
    def test_empty_unlabeled_pool(self):
        """Test selecting samples with empty unlabeled pool."""
        learner = ActiveLearner()
        
        mock_model = Mock()
        selected = learner.select_samples(mock_model)
        
        assert len(selected) == 0


class TestEnsembleActiveLearner:
    """Test ensemble active learner functionality."""
    
    def test_initialization(self):
        """Test ensemble active learner initialization."""
        mock_models = [Mock(), Mock()]
        learner = EnsembleActiveLearner(models=mock_models, batch_size=5)
        
        assert learner.strategy == "committee"
        assert len(learner.models) == 2
        assert learner.batch_size == 5
    
    def test_committee_disagreement(self):
        """Test committee disagreement strategy."""
        # Create mock models
        mock_model1 = Mock()
        mock_model1.predict.return_value = [1, 1, 1]
        mock_model1.predict_proba.return_value = [
            {-1: 0.1, 0: 0.2, 1: 0.7},
            {-1: 0.2, 0: 0.2, 1: 0.6},
            {-1: 0.1, 0: 0.3, 1: 0.6},
        ]
        
        mock_model2 = Mock()
        mock_model2.predict.return_value = [-1, 1, 1]
        mock_model2.predict_proba.return_value = [
            {-1: 0.7, 0: 0.2, 1: 0.1},
            {-1: 0.1, 0: 0.3, 1: 0.6},
            {-1: 0.2, 0: 0.2, 1: 0.6},
        ]
        
        learner = EnsembleActiveLearner(
            models=[mock_model1, mock_model2],
            batch_size=2
        )
        learner.add_unlabeled_data(["text1", "text2", "text3"])
        
        selected = learner.select_samples()
        
        assert len(selected) == 2
        # text1 should have highest disagreement
        assert selected[0].text == "text1"


class TestFactoryFunction:
    """Test factory function."""
    
    def test_create_uncertainty_learner(self):
        """Test creating uncertainty learner."""
        learner = create_active_learner(strategy="uncertainty", batch_size=15)
        
        assert isinstance(learner, ActiveLearner)
        assert learner.strategy == "uncertainty"
        assert learner.batch_size == 15
    
    def test_create_ensemble_learner(self):
        """Test creating ensemble learner."""
        mock_models = [Mock(), Mock()]
        learner = create_active_learner(
            strategy="committee",
            batch_size=10,
            models=mock_models
        )
        
        assert isinstance(learner, EnsembleActiveLearner)
        assert len(learner.models) == 2


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

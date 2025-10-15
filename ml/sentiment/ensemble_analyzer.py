"""
Ensemble Sentiment Analyzer
============================

Combines multiple sentiment models (TF-IDF, FinBERT, BioBERT)
for robust sentiment analysis with model comparison and A/B testing.
"""

import logging
from typing import Dict, List, Optional, Tuple, Any
import numpy as np

logger = logging.getLogger(__name__)


class EnsembleSentimentAnalyzer:
    """
    Ensemble sentiment analyzer combining multiple models.
    
    Supports:
    - Majority voting
    - Weighted averaging
    - Confidence-based selection
    - Model comparison and A/B testing
    """
    
    def __init__(
        self,
        models: Optional[Dict[str, Any]] = None,
        ensemble_method: str = "weighted",
        weights: Optional[Dict[str, float]] = None
    ):
        """
        Initialize ensemble analyzer.
        
        Args:
            models: Dictionary of {model_name: model_instance}
            ensemble_method: 'majority', 'weighted', or 'confidence_based'
            weights: Dictionary of {model_name: weight} for weighted ensemble
        """
        self.models = models or {}
        self.ensemble_method = ensemble_method
        self.weights = weights or {}
        
        # Initialize default weights if not provided
        if not self.weights and self.models:
            self.weights = {name: 1.0 / len(self.models) for name in self.models}
    
    def add_model(self, name: str, model: Any, weight: float = 1.0):
        """Add a model to the ensemble."""
        self.models[name] = model
        self.weights[name] = weight
        
        # Normalize weights
        total_weight = sum(self.weights.values())
        self.weights = {k: v / total_weight for k, v in self.weights.items()}
        
        logger.info(f"Added model '{name}' with weight {self.weights[name]:.3f}")
    
    def remove_model(self, name: str):
        """Remove a model from the ensemble."""
        if name in self.models:
            del self.models[name]
            del self.weights[name]
            
            # Renormalize weights
            if self.weights:
                total_weight = sum(self.weights.values())
                self.weights = {k: v / total_weight for k, v in self.weights.items()}
            
            logger.info(f"Removed model '{name}'")
    
    def predict(self, texts: List[str]) -> List[int]:
        """
        Predict sentiment using ensemble method.
        
        Args:
            texts: List of text strings
            
        Returns:
            List of sentiment predictions
        """
        if not self.models:
            raise ValueError("No models in ensemble")
        
        # Get predictions from all models
        all_predictions = {}
        for name, model in self.models.items():
            try:
                all_predictions[name] = model.predict(texts)
            except Exception as e:
                logger.warning(f"Model '{name}' failed to predict: {e}")
                continue
        
        if not all_predictions:
            raise RuntimeError("All models failed to predict")
        
        # Apply ensemble method
        if self.ensemble_method == "majority":
            return self._majority_vote(all_predictions, len(texts))
        elif self.ensemble_method == "weighted":
            return self._weighted_vote(all_predictions, len(texts))
        elif self.ensemble_method == "confidence_based":
            return self._confidence_based(texts, all_predictions)
        else:
            raise ValueError(f"Unknown ensemble method: {self.ensemble_method}")
    
    def _majority_vote(self, all_predictions: Dict[str, List[int]], n_texts: int) -> List[int]:
        """Majority voting across models."""
        ensemble_predictions = []
        
        for i in range(n_texts):
            votes = [preds[i] for preds in all_predictions.values()]
            
            # Count votes
            vote_counts = {-1: 0, 0: 0, 1: 0}
            for vote in votes:
                vote_counts[vote] += 1
            
            # Select majority
            ensemble_predictions.append(max(vote_counts, key=vote_counts.get))
        
        return ensemble_predictions
    
    def _weighted_vote(self, all_predictions: Dict[str, List[int]], n_texts: int) -> List[int]:
        """Weighted voting across models."""
        ensemble_predictions = []
        
        for i in range(n_texts):
            # Weighted sum of predictions
            weighted_sum = 0.0
            for name, preds in all_predictions.items():
                weighted_sum += preds[i] * self.weights[name]
            
            # Round to nearest sentiment class
            if weighted_sum > 0.33:
                ensemble_predictions.append(1)
            elif weighted_sum < -0.33:
                ensemble_predictions.append(-1)
            else:
                ensemble_predictions.append(0)
        
        return ensemble_predictions
    
    def _confidence_based(self, texts: List[str], all_predictions: Dict[str, List[int]]) -> List[int]:
        """Select prediction from most confident model."""
        ensemble_predictions = []
        
        # Get probabilities from models
        all_probas = {}
        for name, model in self.models.items():
            if name in all_predictions:
                try:
                    all_probas[name] = model.predict_proba(texts)
                except Exception as e:
                    logger.warning(f"Model '{name}' failed to get probabilities: {e}")
        
        for i in range(len(texts)):
            best_confidence = 0.0
            best_prediction = 0
            
            for name in all_predictions.keys():
                if name in all_probas:
                    probs = all_probas[name][i]
                    confidence = max(probs.values())
                    
                    if confidence > best_confidence:
                        best_confidence = confidence
                        best_prediction = all_predictions[name][i]
            
            ensemble_predictions.append(best_prediction)
        
        return ensemble_predictions
    
    def predict_proba(self, texts: List[str]) -> List[Dict[int, float]]:
        """
        Predict probabilities using ensemble averaging.
        
        Args:
            texts: List of text strings
            
        Returns:
            List of probability dictionaries
        """
        if not self.models:
            raise ValueError("No models in ensemble")
        
        # Get probabilities from all models
        all_probas = {}
        for name, model in self.models.items():
            try:
                all_probas[name] = model.predict_proba(texts)
            except Exception as e:
                logger.warning(f"Model '{name}' failed to get probabilities: {e}")
                continue
        
        if not all_probas:
            raise RuntimeError("All models failed to get probabilities")
        
        # Average probabilities
        ensemble_probas = []
        for i in range(len(texts)):
            avg_probs = {-1: 0.0, 0: 0.0, 1: 0.0}
            
            for name, probas in all_probas.items():
                weight = self.weights.get(name, 1.0 / len(all_probas))
                for sentiment, prob in probas[i].items():
                    avg_probs[sentiment] += prob * weight
            
            # Normalize
            total = sum(avg_probs.values())
            if total > 0:
                avg_probs = {k: v / total for k, v in avg_probs.items()}
            
            ensemble_probas.append(avg_probs)
        
        return ensemble_probas
    
    def compare_models(self, texts: List[str]) -> Dict[str, Dict[str, Any]]:
        """
        Compare predictions across all models.
        
        Args:
            texts: List of text strings
            
        Returns:
            Dictionary with comparison results
        """
        comparison = {}
        
        for name, model in self.models.items():
            try:
                predictions = model.predict(texts)
                probas = model.predict_proba(texts)
                
                # Calculate statistics
                confidences = [max(p.values()) for p in probas]
                
                comparison[name] = {
                    'predictions': predictions,
                    'probabilities': probas,
                    'avg_confidence': np.mean(confidences),
                    'min_confidence': np.min(confidences),
                    'max_confidence': np.max(confidences),
                    'bullish_count': sum(1 for p in predictions if p == 1),
                    'bearish_count': sum(1 for p in predictions if p == -1),
                    'neutral_count': sum(1 for p in predictions if p == 0),
                }
            except Exception as e:
                logger.error(f"Error comparing model '{name}': {e}")
                comparison[name] = {'error': str(e)}
        
        return comparison
    
    def ab_test(
        self,
        texts: List[str],
        labels: List[int],
        model_a: str,
        model_b: str
    ) -> Dict[str, Any]:
        """
        Run A/B test between two models.
        
        Args:
            texts: List of text strings
            labels: True labels
            model_a: Name of model A
            model_b: Name of model B
            
        Returns:
            Dictionary with A/B test results
        """
        if model_a not in self.models:
            raise ValueError(f"Model '{model_a}' not in ensemble")
        if model_b not in self.models:
            raise ValueError(f"Model '{model_b}' not in ensemble")
        
        # Get predictions
        preds_a = self.models[model_a].predict(texts)
        preds_b = self.models[model_b].predict(texts)
        
        # Calculate accuracies
        acc_a = sum(1 for p, l in zip(preds_a, labels) if p == l) / len(labels)
        acc_b = sum(1 for p, l in zip(preds_b, labels) if p == l) / len(labels)
        
        # Agreement between models
        agreement = sum(1 for a, b in zip(preds_a, preds_b) if a == b) / len(texts)
        
        # Per-class performance
        from sklearn.metrics import classification_report
        
        report_a = classification_report(labels, preds_a, output_dict=True, zero_division=0)
        report_b = classification_report(labels, preds_b, output_dict=True, zero_division=0)
        
        return {
            'model_a': model_a,
            'model_b': model_b,
            'accuracy_a': acc_a,
            'accuracy_b': acc_b,
            'accuracy_diff': acc_b - acc_a,
            'agreement': agreement,
            'winner': model_a if acc_a > acc_b else (model_b if acc_b > acc_a else 'tie'),
            'classification_report_a': report_a,
            'classification_report_b': report_b,
        }
    
    def get_model_info(self) -> Dict[str, Dict[str, Any]]:
        """Get information about all models in ensemble."""
        info = {}
        
        for name, model in self.models.items():
            info[name] = {
                'type': type(model).__name__,
                'weight': self.weights.get(name, 0.0),
                'is_available': hasattr(model, 'is_available') and model.is_available,
            }
        
        return info
    
    def __repr__(self) -> str:
        model_names = list(self.models.keys())
        return f"EnsembleSentimentAnalyzer(models={model_names}, method={self.ensemble_method})"


def create_default_ensemble() -> EnsembleSentimentAnalyzer:
    """Create ensemble with all available models."""
    from ml.sentiment.trainer import SentimentTrainer
    
    ensemble = EnsembleSentimentAnalyzer(ensemble_method="weighted")
    
    # Add TF-IDF model
    try:
        tfidf_model = SentimentTrainer()
        ensemble.add_model("tfidf", tfidf_model, weight=0.4)
        logger.info("Added TF-IDF model to ensemble")
    except Exception as e:
        logger.warning(f"Could not add TF-IDF model: {e}")
    
    # Add FinBERT model (if available)
    try:
        from ml.sentiment.finbert_analyzer import FinBERTAnalyzer
        finbert_model = FinBERTAnalyzer()
        if finbert_model.is_available:
            ensemble.add_model("finbert", finbert_model, weight=0.3)
            logger.info("Added FinBERT model to ensemble")
    except Exception as e:
        logger.warning(f"Could not add FinBERT model: {e}")
    
    # Add BioBERT model (if available)
    try:
        from ml.sentiment.biobert_analyzer import BioBERTAnalyzer
        biobert_model = BioBERTAnalyzer()
        if biobert_model.is_available:
            ensemble.add_model("biobert", biobert_model, weight=0.3)
            logger.info("Added BioBERT model to ensemble")
    except Exception as e:
        logger.warning(f"Could not add BioBERT model: {e}")
    
    return ensemble


if __name__ == "__main__":
    # Example usage
    logging.basicConfig(level=logging.INFO)
    
    print("Creating ensemble sentiment analyzer...")
    ensemble = create_default_ensemble()
    
    # Sample texts
    texts = [
        "FDA approves breakthrough therapy designation",
        "Clinical trial fails to meet primary endpoint",
        "Company reports quarterly earnings"
    ]
    
    print(f"\nEnsemble: {ensemble}")
    print(f"Models: {ensemble.get_model_info()}")
    
    if ensemble.models:
        print("\nComparing models...")
        comparison = ensemble.compare_models(texts)
        
        for model_name, results in comparison.items():
            if 'error' not in results:
                print(f"\n{model_name}:")
                print(f"  Average confidence: {results['avg_confidence']:.3f}")
                print(f"  Predictions: {results['predictions']}")

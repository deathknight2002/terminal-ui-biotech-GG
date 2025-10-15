"""
A/B Testing Framework for ML Models
====================================

Framework for comparing and testing different model configurations.
"""

import logging
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime
import numpy as np
from collections import defaultdict
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)


@dataclass
class ABTestConfig:
    """Configuration for A/B test."""
    test_name: str
    model_a_name: str
    model_b_name: str
    traffic_split: float = 0.5  # Fraction going to model_a
    min_samples: int = 100
    confidence_level: float = 0.95
    started_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class ABTestResult:
    """Results from A/B test."""
    config: ABTestConfig
    model_a_metrics: Dict[str, Any]
    model_b_metrics: Dict[str, Any]
    statistical_significance: Dict[str, Any]
    winner: Optional[str]
    recommendation: str
    completed_at: datetime = field(default_factory=datetime.utcnow)


class ABTester:
    """
    A/B testing framework for ML models.
    
    Features:
    - Traffic splitting
    - Statistical significance testing
    - Multi-metric comparison
    - Progressive rollout support
    """
    
    def __init__(self, config: ABTestConfig):
        """
        Initialize A/B tester.
        
        Args:
            config: A/B test configuration
        """
        self.config = config
        
        # Storage for model results
        self.model_a_predictions = []
        self.model_a_confidences = []
        self.model_a_true_labels = []
        self.model_a_latencies = []
        
        self.model_b_predictions = []
        self.model_b_confidences = []
        self.model_b_true_labels = []
        self.model_b_latencies = []
        
        # Random state for reproducibility
        self.rng = np.random.RandomState(42)
    
    def assign_variant(self) -> str:
        """
        Assign request to variant based on traffic split.
        
        Returns:
            'model_a' or 'model_b'
        """
        if self.rng.random() < self.config.traffic_split:
            return 'model_a'
        else:
            return 'model_b'
    
    def log_prediction(
        self,
        variant: str,
        prediction: int,
        confidence: float,
        true_label: Optional[int] = None,
        latency_ms: Optional[float] = None
    ):
        """
        Log a prediction from a variant.
        
        Args:
            variant: 'model_a' or 'model_b'
            prediction: Model prediction
            confidence: Prediction confidence
            true_label: True label (if available)
            latency_ms: Prediction latency in milliseconds
        """
        if variant == 'model_a':
            self.model_a_predictions.append(prediction)
            self.model_a_confidences.append(confidence)
            self.model_a_true_labels.append(true_label)
            self.model_a_latencies.append(latency_ms)
        elif variant == 'model_b':
            self.model_b_predictions.append(prediction)
            self.model_b_confidences.append(confidence)
            self.model_b_true_labels.append(true_label)
            self.model_b_latencies.append(latency_ms)
        else:
            raise ValueError(f"Unknown variant: {variant}")
    
    def compute_metrics(
        self,
        predictions: List[int],
        confidences: List[float],
        true_labels: List[Optional[int]],
        latencies: List[Optional[float]]
    ) -> Dict[str, Any]:
        """
        Compute metrics for a variant.
        
        Args:
            predictions: List of predictions
            confidences: List of confidences
            true_labels: List of true labels
            latencies: List of latencies
            
        Returns:
            Dictionary of metrics
        """
        metrics = {
            'n_predictions': len(predictions),
            'avg_confidence': np.mean(confidences) if confidences else 0.0,
            'std_confidence': np.std(confidences) if confidences else 0.0,
        }
        
        # Latency metrics
        valid_latencies = [l for l in latencies if l is not None]
        if valid_latencies:
            metrics.update({
                'avg_latency_ms': np.mean(valid_latencies),
                'p50_latency_ms': np.percentile(valid_latencies, 50),
                'p95_latency_ms': np.percentile(valid_latencies, 95),
                'p99_latency_ms': np.percentile(valid_latencies, 99),
            })
        
        # Accuracy metrics (if labels available)
        valid_indices = [i for i, label in enumerate(true_labels) if label is not None]
        if valid_indices:
            valid_preds = [predictions[i] for i in valid_indices]
            valid_labels = [true_labels[i] for i in valid_indices]
            
            from sklearn.metrics import accuracy_score, precision_recall_fscore_support
            
            accuracy = accuracy_score(valid_labels, valid_preds)
            precision, recall, f1, _ = precision_recall_fscore_support(
                valid_labels, valid_preds, average='weighted', zero_division=0
            )
            
            metrics.update({
                'n_labeled': len(valid_labels),
                'accuracy': accuracy,
                'precision': precision,
                'recall': recall,
                'f1_score': f1,
            })
        
        return metrics
    
    def test_statistical_significance(
        self,
        metric_name: str,
        values_a: List[float],
        values_b: List[float]
    ) -> Dict[str, Any]:
        """
        Test statistical significance between two metrics.
        
        Args:
            metric_name: Name of the metric
            values_a: Values for model A
            values_b: Values for model B
            
        Returns:
            Dictionary with significance test results
        """
        from scipy import stats
        
        # Remove None values
        values_a = [v for v in values_a if v is not None]
        values_b = [v for v in values_b if v is not None]
        
        if not values_a or not values_b:
            return {
                'metric': metric_name,
                'significant': False,
                'reason': 'Insufficient data'
            }
        
        # Two-sample t-test
        t_stat, p_value = stats.ttest_ind(values_a, values_b)
        
        # Effect size (Cohen's d)
        pooled_std = np.sqrt((np.std(values_a)**2 + np.std(values_b)**2) / 2)
        cohens_d = (np.mean(values_a) - np.mean(values_b)) / pooled_std if pooled_std > 0 else 0
        
        significant = p_value < (1 - self.config.confidence_level)
        
        return {
            'metric': metric_name,
            'mean_a': np.mean(values_a),
            'mean_b': np.mean(values_b),
            'diff': np.mean(values_a) - np.mean(values_b),
            'diff_pct': ((np.mean(values_a) - np.mean(values_b)) / np.mean(values_b) * 100) if np.mean(values_b) != 0 else 0,
            't_statistic': t_stat,
            'p_value': p_value,
            'cohens_d': cohens_d,
            'significant': significant,
            'confidence_level': self.config.confidence_level
        }
    
    def is_ready_for_analysis(self) -> bool:
        """Check if test has enough data for analysis."""
        return (
            len(self.model_a_predictions) >= self.config.min_samples and
            len(self.model_b_predictions) >= self.config.min_samples
        )
    
    def analyze(self) -> ABTestResult:
        """
        Analyze A/B test results.
        
        Returns:
            ABTestResult with complete analysis
        """
        if not self.is_ready_for_analysis():
            raise ValueError(
                f"Insufficient data for analysis. "
                f"Need {self.config.min_samples} samples per variant. "
                f"Current: A={len(self.model_a_predictions)}, B={len(self.model_b_predictions)}"
            )
        
        # Compute metrics for both models
        metrics_a = self.compute_metrics(
            self.model_a_predictions,
            self.model_a_confidences,
            self.model_a_true_labels,
            self.model_a_latencies
        )
        
        metrics_b = self.compute_metrics(
            self.model_b_predictions,
            self.model_b_confidences,
            self.model_b_true_labels,
            self.model_b_latencies
        )
        
        # Statistical significance tests
        significance_tests = {}
        
        # Confidence test
        significance_tests['confidence'] = self.test_statistical_significance(
            'confidence',
            self.model_a_confidences,
            self.model_b_confidences
        )
        
        # Latency test
        if self.model_a_latencies and self.model_b_latencies:
            significance_tests['latency'] = self.test_statistical_significance(
                'latency',
                [l for l in self.model_a_latencies if l is not None],
                [l for l in self.model_b_latencies if l is not None]
            )
        
        # Accuracy test (if labels available)
        if 'accuracy' in metrics_a and 'accuracy' in metrics_b:
            # For accuracy, we use the predictions themselves
            valid_a = [i for i, label in enumerate(self.model_a_true_labels) if label is not None]
            valid_b = [i for i, label in enumerate(self.model_b_true_labels) if label is not None]
            
            if valid_a and valid_b:
                # Binary indicator: 1 if correct, 0 if incorrect
                correct_a = [
                    1 if self.model_a_predictions[i] == self.model_a_true_labels[i] else 0
                    for i in valid_a
                ]
                correct_b = [
                    1 if self.model_b_predictions[i] == self.model_b_true_labels[i] else 0
                    for i in valid_b
                ]
                
                significance_tests['accuracy'] = self.test_statistical_significance(
                    'accuracy',
                    correct_a,
                    correct_b
                )
        
        # Determine winner
        winner = self._determine_winner(metrics_a, metrics_b, significance_tests)
        recommendation = self._make_recommendation(metrics_a, metrics_b, significance_tests, winner)
        
        return ABTestResult(
            config=self.config,
            model_a_metrics=metrics_a,
            model_b_metrics=metrics_b,
            statistical_significance=significance_tests,
            winner=winner,
            recommendation=recommendation
        )
    
    def _determine_winner(
        self,
        metrics_a: Dict[str, Any],
        metrics_b: Dict[str, Any],
        significance: Dict[str, Any]
    ) -> Optional[str]:
        """Determine winner based on metrics and significance."""
        # Primary metric: accuracy (if available)
        if 'accuracy' in significance and significance['accuracy']['significant']:
            if significance['accuracy']['mean_a'] > significance['accuracy']['mean_b']:
                return self.config.model_a_name
            else:
                return self.config.model_b_name
        
        # Secondary metric: confidence
        if 'confidence' in significance and significance['confidence']['significant']:
            if significance['confidence']['mean_a'] > significance['confidence']['mean_b']:
                return self.config.model_a_name
            else:
                return self.config.model_b_name
        
        # No clear winner
        return None
    
    def _make_recommendation(
        self,
        metrics_a: Dict[str, Any],
        metrics_b: Dict[str, Any],
        significance: Dict[str, Any],
        winner: Optional[str]
    ) -> str:
        """Make deployment recommendation."""
        if winner:
            return f"Deploy {winner} to 100% of traffic. Shows statistically significant improvement."
        
        # Check if models are similar
        if 'accuracy' in metrics_a and 'accuracy' in metrics_b:
            acc_diff = abs(metrics_a['accuracy'] - metrics_b['accuracy'])
            if acc_diff < 0.01:  # Less than 1% difference
                # Choose faster model
                if 'avg_latency_ms' in metrics_a and 'avg_latency_ms' in metrics_b:
                    if metrics_a['avg_latency_ms'] < metrics_b['avg_latency_ms']:
                        return f"Deploy {self.config.model_a_name}. Similar accuracy, lower latency."
                    else:
                        return f"Deploy {self.config.model_b_name}. Similar accuracy, lower latency."
                
                return "Models perform similarly. No strong recommendation."
        
        return "Continue testing. Collect more data for conclusive results."
    
    def get_summary(self) -> Dict[str, Any]:
        """Get test summary."""
        return {
            'test_name': self.config.test_name,
            'model_a': self.config.model_a_name,
            'model_b': self.config.model_b_name,
            'traffic_split': self.config.traffic_split,
            'samples_a': len(self.model_a_predictions),
            'samples_b': len(self.model_b_predictions),
            'ready_for_analysis': self.is_ready_for_analysis(),
            'started_at': self.config.started_at.isoformat()
        }


def create_ab_test(test_name: str, model_a_name: str, model_b_name: str, **kwargs) -> ABTester:
    """Factory function to create A/B tester."""
    config = ABTestConfig(
        test_name=test_name,
        model_a_name=model_a_name,
        model_b_name=model_b_name,
        **kwargs
    )
    return ABTester(config)


if __name__ == "__main__":
    # Example usage
    logging.basicConfig(level=logging.INFO)
    
    print("Testing A/B Framework...")
    ab_test = create_ab_test(
        test_name="TF-IDF vs FinBERT",
        model_a_name="tfidf",
        model_b_name="finbert",
        traffic_split=0.5,
        min_samples=100
    )
    
    # Simulate predictions
    for i in range(200):
        variant = ab_test.assign_variant()
        
        # Simulate different performance
        if variant == 'model_a':
            pred = np.random.choice([1, 0, -1], p=[0.4, 0.3, 0.3])
            conf = np.random.uniform(0.7, 0.9)
            latency = np.random.uniform(5, 15)
        else:
            # Model B is slightly better
            pred = np.random.choice([1, 0, -1], p=[0.45, 0.25, 0.3])
            conf = np.random.uniform(0.75, 0.95)
            latency = np.random.uniform(50, 100)  # But slower
        
        # Ground truth
        true_label = np.random.choice([1, 0, -1], p=[0.45, 0.25, 0.3])
        
        ab_test.log_prediction(variant, pred, conf, true_label, latency)
    
    # Analyze results
    if ab_test.is_ready_for_analysis():
        result = ab_test.analyze()
        print(f"\nWinner: {result.winner or 'No clear winner'}")
        print(f"Recommendation: {result.recommendation}")
        print(f"\nModel A Metrics:")
        print(f"  Accuracy: {result.model_a_metrics.get('accuracy', 'N/A')}")
        print(f"  Avg Confidence: {result.model_a_metrics['avg_confidence']:.3f}")
        print(f"  Avg Latency: {result.model_a_metrics.get('avg_latency_ms', 'N/A')}")
        print(f"\nModel B Metrics:")
        print(f"  Accuracy: {result.model_b_metrics.get('accuracy', 'N/A')}")
        print(f"  Avg Confidence: {result.model_b_metrics['avg_confidence']:.3f}")
        print(f"  Avg Latency: {result.model_b_metrics.get('avg_latency_ms', 'N/A')}")

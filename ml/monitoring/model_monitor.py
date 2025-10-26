"""
ML Model Monitoring and Drift Detection
========================================

Monitors ML model performance, detects data/concept drift,
and tracks prediction quality over time.
"""

import logging
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
import numpy as np
import pandas as pd
from collections import defaultdict

logger = logging.getLogger(__name__)


class ModelMonitor:
    """
    Monitors model performance and detects drift.

    Tracks:
    - Prediction distribution drift
    - Feature distribution drift
    - Model performance metrics
    - Prediction confidence trends
    """

    def __init__(
        self,
        drift_threshold: float = 0.05,
        window_size: int = 100,
        alert_threshold: float = 0.10
    ):
        """
        Initialize model monitor.

        Args:
            drift_threshold: Threshold for drift detection (0-1)
            window_size: Window size for rolling statistics
            alert_threshold: Threshold for triggering alerts
        """
        self.drift_threshold = drift_threshold
        self.window_size = window_size
        self.alert_threshold = alert_threshold

        # Storage for predictions
        self.predictions = []
        self.timestamps = []
        self.confidences = []
        self.features = []
        self.true_labels = []

        # Baseline statistics
        self.baseline_pred_dist = None
        self.baseline_feature_stats = None
        self.baseline_performance = None

    def log_prediction(
        self,
        prediction: int,
        confidence: float,
        features: Optional[Dict[str, Any]] = None,
        true_label: Optional[int] = None,
        timestamp: Optional[datetime] = None
    ):
        """
        Log a prediction for monitoring.

        Args:
            prediction: Model prediction
            confidence: Prediction confidence
            features: Feature dictionary
            true_label: True label (if available)
            timestamp: Prediction timestamp
        """
        self.predictions.append(prediction)
        self.confidences.append(confidence)
        self.features.append(features or {})
        self.true_labels.append(true_label)
        self.timestamps.append(timestamp or datetime.utcnow())

    def set_baseline(self, predictions: List[int], confidences: List[float], features: List[Dict[str, Any]]):
        """
        Set baseline statistics for drift detection.

        Args:
            predictions: Baseline predictions
            confidences: Baseline confidences
            features: Baseline features
        """
        # Prediction distribution
        unique, counts = np.unique(predictions, return_counts=True)
        self.baseline_pred_dist = dict(zip(unique, counts / len(predictions)))

        # Feature statistics
        if features:
            self.baseline_feature_stats = self._compute_feature_stats(features)

        logger.info("Baseline statistics set for monitoring")

    def _compute_feature_stats(self, features: List[Dict[str, Any]]) -> Dict[str, Dict[str, float]]:
        """Compute feature statistics."""
        stats = defaultdict(lambda: {'mean': 0, 'std': 0, 'min': 0, 'max': 0})

        if not features:
            return stats

        # Convert to DataFrame for easier computation
        df = pd.DataFrame(features)

        for col in df.columns:
            if pd.api.types.is_numeric_dtype(df[col]):
                stats[col] = {
                    'mean': float(df[col].mean()),
                    'std': float(df[col].std()),
                    'min': float(df[col].min()),
                    'max': float(df[col].max())
                }

        return dict(stats)

    def detect_prediction_drift(self, window: Optional[List[int]] = None) -> Dict[str, Any]:
        """
        Detect drift in prediction distribution.

        Args:
            window: Prediction window (default: last window_size predictions)

        Returns:
            Dictionary with drift detection results
        """
        if self.baseline_pred_dist is None:
            return {'drift_detected': False, 'reason': 'No baseline set'}

        if window is None:
            if len(self.predictions) < self.window_size:
                return {'drift_detected': False, 'reason': 'Insufficient data'}
            window = self.predictions[-self.window_size:]

        # Current distribution
        unique, counts = np.unique(window, return_counts=True)
        current_dist = dict(zip(unique, counts / len(window)))

        # Calculate KL divergence (approximation)
        kl_div = 0.0
        for label in set(list(self.baseline_pred_dist.keys()) + list(current_dist.keys())):
            p = self.baseline_pred_dist.get(label, 1e-10)
            q = current_dist.get(label, 1e-10)
            kl_div += p * np.log(p / q)

        drift_detected = kl_div > self.drift_threshold

        return {
            'drift_detected': drift_detected,
            'kl_divergence': kl_div,
            'threshold': self.drift_threshold,
            'baseline_distribution': self.baseline_pred_dist,
            'current_distribution': current_dist,
            'window_size': len(window)
        }

    def detect_feature_drift(self, window_features: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
        """
        Detect drift in feature distributions.

        Args:
            window_features: Feature window (default: last window_size features)

        Returns:
            Dictionary with drift detection results
        """
        if self.baseline_feature_stats is None:
            return {'drift_detected': False, 'reason': 'No baseline set'}

        if window_features is None:
            if len(self.features) < self.window_size:
                return {'drift_detected': False, 'reason': 'Insufficient data'}
            window_features = self.features[-self.window_size:]

        current_stats = self._compute_feature_stats(window_features)

        # Calculate drift for each feature
        drifted_features = []
        for feature, baseline in self.baseline_feature_stats.items():
            if feature in current_stats:
                current = current_stats[feature]

                # Z-score based drift detection
                if baseline['std'] > 0:
                    z_score = abs((current['mean'] - baseline['mean']) / baseline['std'])
                    if z_score > 2:  # 2 standard deviations
                        drifted_features.append({
                            'feature': feature,
                            'z_score': z_score,
                            'baseline_mean': baseline['mean'],
                            'current_mean': current['mean']
                        })

        drift_detected = len(drifted_features) > 0

        return {
            'drift_detected': drift_detected,
            'drifted_features': drifted_features,
            'num_drifted': len(drifted_features),
            'total_features': len(self.baseline_feature_stats)
        }

    def compute_performance_metrics(self, window_size: Optional[int] = None) -> Dict[str, Any]:
        """
        Compute performance metrics on labeled data.

        Args:
            window_size: Window size for metrics (default: all data with labels)

        Returns:
            Dictionary with performance metrics
        """
        # Filter to only labeled predictions
        labeled_indices = [i for i, label in enumerate(self.true_labels) if label is not None]

        if not labeled_indices:
            return {'error': 'No labeled data available'}

        if window_size:
            labeled_indices = labeled_indices[-window_size:]

        preds = [self.predictions[i] for i in labeled_indices]
        labels = [self.true_labels[i] for i in labeled_indices]
        confs = [self.confidences[i] for i in labeled_indices]

        # Calculate metrics
        from sklearn.metrics import accuracy_score, precision_recall_fscore_support, confusion_matrix

        accuracy = accuracy_score(labels, preds)
        precision, recall, f1, support = precision_recall_fscore_support(
            labels, preds, average='weighted', zero_division=0
        )
        conf_matrix = confusion_matrix(labels, preds)

        return {
            'accuracy': accuracy,
            'precision': precision,
            'recall': recall,
            'f1_score': f1,
            'confusion_matrix': conf_matrix.tolist(),
            'avg_confidence': np.mean(confs),
            'n_samples': len(preds),
            'support': support.tolist() if hasattr(support, 'tolist') else support
        }

    def get_confidence_trends(self, window_size: int = 50) -> Dict[str, Any]:
        """
        Analyze confidence trends over time.

        Args:
            window_size: Window size for trend analysis

        Returns:
            Dictionary with confidence trend statistics
        """
        if len(self.confidences) < window_size:
            return {'error': 'Insufficient data for trend analysis'}

        # Recent vs older confidence
        recent_conf = np.mean(self.confidences[-window_size:])
        older_conf = np.mean(self.confidences[-2*window_size:-window_size]) if len(self.confidences) >= 2*window_size else recent_conf

        # Trend direction
        trend = 'increasing' if recent_conf > older_conf else ('decreasing' if recent_conf < older_conf else 'stable')

        return {
            'recent_avg_confidence': recent_conf,
            'older_avg_confidence': older_conf,
            'confidence_change': recent_conf - older_conf,
            'trend': trend,
            'min_confidence': np.min(self.confidences[-window_size:]),
            'max_confidence': np.max(self.confidences[-window_size:]),
            'std_confidence': np.std(self.confidences[-window_size:])
        }

    def check_alerts(self) -> List[Dict[str, Any]]:
        """
        Check for alert conditions.

        Returns:
            List of alert dictionaries
        """
        alerts = []

        # Check prediction drift
        drift_result = self.detect_prediction_drift()
        if drift_result.get('drift_detected'):
            alerts.append({
                'type': 'prediction_drift',
                'severity': 'warning',
                'message': f"Prediction drift detected: KL divergence = {drift_result['kl_divergence']:.4f}",
                'details': drift_result
            })

        # Check feature drift
        feature_drift_result = self.detect_feature_drift()
        if feature_drift_result.get('drift_detected'):
            alerts.append({
                'type': 'feature_drift',
                'severity': 'warning',
                'message': f"Feature drift detected in {feature_drift_result['num_drifted']} features",
                'details': feature_drift_result
            })

        # Check confidence trends
        if len(self.confidences) >= self.window_size:
            conf_trends = self.get_confidence_trends(self.window_size)
            if conf_trends.get('confidence_change', 0) < -self.alert_threshold:
                alerts.append({
                    'type': 'confidence_degradation',
                    'severity': 'warning',
                    'message': f"Model confidence decreasing: {conf_trends['confidence_change']:.4f}",
                    'details': conf_trends
                })

        # Check performance degradation (if labeled data available)
        labeled_count = sum(1 for label in self.true_labels if label is not None)
        if labeled_count >= self.window_size:
            perf_metrics = self.compute_performance_metrics(self.window_size)
            if not perf_metrics.get('error'):
                if perf_metrics['accuracy'] < 0.6:  # Threshold
                    alerts.append({
                        'type': 'performance_degradation',
                        'severity': 'critical',
                        'message': f"Model accuracy below threshold: {perf_metrics['accuracy']:.3f}",
                        'details': perf_metrics
                    })

        return alerts

    def get_summary_report(self) -> Dict[str, Any]:
        """
        Generate comprehensive monitoring summary.

        Returns:
            Dictionary with monitoring summary
        """
        return {
            'monitoring_info': {
                'total_predictions': len(self.predictions),
                'labeled_predictions': sum(1 for label in self.true_labels if label is not None),
                'time_range': {
                    'start': self.timestamps[0].isoformat() if self.timestamps else None,
                    'end': self.timestamps[-1].isoformat() if self.timestamps else None
                }
            },
            'prediction_distribution': dict(zip(*np.unique(self.predictions, return_counts=True))) if self.predictions else {},
            'drift_detection': {
                'prediction_drift': self.detect_prediction_drift(),
                'feature_drift': self.detect_feature_drift()
            },
            'performance_metrics': self.compute_performance_metrics(),
            'confidence_trends': self.get_confidence_trends() if len(self.confidences) >= 50 else None,
            'alerts': self.check_alerts()
        }


def create_model_monitor(**kwargs) -> ModelMonitor:
    """Factory function to create model monitor."""
    return ModelMonitor(**kwargs)


if __name__ == "__main__":
    # Example usage
    logging.basicConfig(level=logging.INFO)

    print("Testing Model Monitor...")
    monitor = ModelMonitor(drift_threshold=0.05, window_size=50)

    # Simulate baseline predictions
    baseline_preds = [1] * 40 + [0] * 30 + [-1] * 30
    baseline_confs = np.random.uniform(0.7, 0.95, 100).tolist()
    baseline_features = [{'feature1': np.random.normal(0, 1)} for _ in range(100)]

    monitor.set_baseline(baseline_preds, baseline_confs, baseline_features)

    # Simulate new predictions with drift
    for i in range(100):
        # Introduce drift
        if i < 50:
            pred = np.random.choice([1, 0, -1], p=[0.4, 0.3, 0.3])
        else:
            # Drifted distribution
            pred = np.random.choice([1, 0, -1], p=[0.2, 0.2, 0.6])

        conf = np.random.uniform(0.6, 0.9)
        features = {'feature1': np.random.normal(0 if i < 50 else 1, 1)}

        monitor.log_prediction(pred, conf, features)

    # Check for alerts
    summary = monitor.get_summary_report()
    print("\nMonitoring Summary:")
    print(f"Total predictions: {summary['monitoring_info']['total_predictions']}")
    print(f"Alerts: {len(summary['alerts'])}")

    for alert in summary['alerts']:
        print(f"\n[{alert['severity'].upper()}] {alert['type']}: {alert['message']}")

"""
Real-time Performance Monitoring and Alerting for MVM Alpha Scoring

This module provides:
- Real-time prediction tracking
- Performance degradation alerts
- Historical performance analysis
- Feature importance tracking
- Dashboard generation
"""

import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from collections import defaultdict
import json


class MVMPerformanceTracker:
    """Real-time performance monitoring and alerting for MVM Alpha Scoring"""
    
    def __init__(self):
        self.performance_history: List[Dict] = []
        self.baseline_metrics: Optional[Dict] = None
        
        # Alert thresholds for performance degradation
        self.alert_thresholds = {
            "precision_decline": 0.15,  # Alert if precision drops >15%
            "recall_decline": 0.20,     # Alert if recall drops >20%
            "score_drift": 5.0,          # Alert if avg score drifts >5 points
            "direction_accuracy_decline": 0.20,  # Alert if direction accuracy drops >20%
        }
        
        # Alert history
        self.alerts: List[Dict] = []
    
    def track_prediction(
        self,
        prediction: Dict,
        actual_outcome: Optional[Dict] = None,
    ) -> None:
        """
        Track a prediction and its outcome.
        
        Args:
            prediction: Dict with predicted_score, predicted_move, ticker, date, etc.
            actual_outcome: Optional dict with actual_move, actual_direction
        """
        track_record = {
            "timestamp": datetime.now(),
            "ticker": prediction.get("ticker", "UNKNOWN"),
            "date": prediction.get("date", datetime.now().isoformat()),
            "predicted_score": prediction.get("score", 0),
            "predicted_move": prediction.get("predicted_move", 0),
            "event_type": prediction.get("event_type", "Unknown"),
        }
        
        # Add actual outcome if provided
        if actual_outcome:
            track_record["actual_move"] = actual_outcome.get("actual_move", 0)
            track_record["direction_correct"] = (
                np.sign(prediction.get("predicted_move", 0)) == 
                np.sign(actual_outcome.get("actual_move", 0))
            )
            track_record["magnitude_error"] = abs(
                prediction.get("predicted_move", 0) - 
                actual_outcome.get("actual_move", 0)
            )
        
        self.performance_history.append(track_record)
        
        # Check for alerts if we have actual outcome
        if actual_outcome:
            self._check_alerts()
    
    def _get_recent_performance(self, days: int = 30) -> Dict:
        """
        Calculate performance metrics for recent period.
        
        Args:
            days: Number of days to look back
        
        Returns:
            Dict with recent performance metrics
        """
        cutoff_date = datetime.now() - timedelta(days=days)
        
        # Filter to recent records with actual outcomes
        recent = [
            r for r in self.performance_history
            if r["timestamp"] >= cutoff_date and "actual_move" in r
        ]
        
        if len(recent) < 5:
            return {"error": "Insufficient recent data", "n_events": len(recent)}
        
        # Calculate metrics
        score_threshold = 60
        move_threshold = 7.0
        
        predicted_movers = sum(1 for r in recent if r["predicted_score"] >= score_threshold)
        actual_movers = sum(1 for r in recent if abs(r["actual_move"]) >= move_threshold)
        
        true_positives = sum(
            1 for r in recent
            if r["predicted_score"] >= score_threshold and abs(r["actual_move"]) >= move_threshold
        )
        
        precision = true_positives / predicted_movers if predicted_movers > 0 else 0
        recall = true_positives / actual_movers if actual_movers > 0 else 0
        
        direction_correct = sum(1 for r in recent if r.get("direction_correct", False))
        direction_accuracy = direction_correct / len(recent)
        
        avg_score = np.mean([r["predicted_score"] for r in recent])
        avg_magnitude_error = np.mean([r["magnitude_error"] for r in recent])
        
        return {
            "n_events": len(recent),
            "precision": round(precision, 3),
            "recall": round(recall, 3),
            "direction_accuracy": round(direction_accuracy, 3),
            "avg_score": round(avg_score, 2),
            "avg_magnitude_error": round(avg_magnitude_error, 2),
        }
    
    def _get_baseline_performance(self) -> Dict:
        """
        Calculate baseline performance from historical data.
        
        Uses first 90 days or all available data as baseline.
        
        Returns:
            Dict with baseline metrics
        """
        if self.baseline_metrics is not None:
            return self.baseline_metrics
        
        # Calculate from all historical data with outcomes
        historical = [r for r in self.performance_history if "actual_move" in r]
        
        if len(historical) < 10:
            # Not enough data for baseline yet
            return {
                "precision": 0.85,  # Default expected values
                "recall": 0.80,
                "direction_accuracy": 0.75,
                "avg_score": 70.0,
            }
        
        # Use first 90 days as baseline (or all if less than 90 days)
        baseline_cutoff = historical[0]["timestamp"] + timedelta(days=90)
        baseline_records = [r for r in historical if r["timestamp"] <= baseline_cutoff]
        
        if len(baseline_records) < 10:
            baseline_records = historical[:min(len(historical), 50)]
        
        # Calculate baseline metrics
        score_threshold = 60
        move_threshold = 7.0
        
        predicted_movers = sum(1 for r in baseline_records if r["predicted_score"] >= score_threshold)
        actual_movers = sum(1 for r in baseline_records if abs(r["actual_move"]) >= move_threshold)
        
        true_positives = sum(
            1 for r in baseline_records
            if r["predicted_score"] >= score_threshold and abs(r["actual_move"]) >= move_threshold
        )
        
        precision = true_positives / predicted_movers if predicted_movers > 0 else 0.85
        recall = true_positives / actual_movers if actual_movers > 0 else 0.80
        
        direction_correct = sum(1 for r in baseline_records if r.get("direction_correct", False))
        direction_accuracy = direction_correct / len(baseline_records)
        
        avg_score = np.mean([r["predicted_score"] for r in baseline_records])
        
        self.baseline_metrics = {
            "precision": round(precision, 3),
            "recall": round(recall, 3),
            "direction_accuracy": round(direction_accuracy, 3),
            "avg_score": round(avg_score, 2),
        }
        
        return self.baseline_metrics
    
    def _check_alerts(self) -> None:
        """
        Check for performance degradation alerts.
        
        Compares recent performance to baseline and triggers alerts if
        metrics fall below thresholds.
        """
        recent_performance = self._get_recent_performance(30)
        
        if "error" in recent_performance:
            return
        
        baseline_performance = self._get_baseline_performance()
        
        # Check for precision decline
        precision_decline = baseline_performance["precision"] - recent_performance["precision"]
        if precision_decline > self.alert_thresholds["precision_decline"]:
            self._trigger_alert(
                "PRECISION_DECLINE",
                f"Precision declined by {precision_decline:.2f} "
                f"(baseline: {baseline_performance['precision']:.2f}, "
                f"recent: {recent_performance['precision']:.2f})"
            )
        
        # Check for recall decline
        recall_decline = baseline_performance["recall"] - recent_performance["recall"]
        if recall_decline > self.alert_thresholds["recall_decline"]:
            self._trigger_alert(
                "RECALL_DECLINE",
                f"Recall declined by {recall_decline:.2f} "
                f"(baseline: {baseline_performance['recall']:.2f}, "
                f"recent: {recent_performance['recall']:.2f})"
            )
        
        # Check for score drift
        score_drift = abs(baseline_performance["avg_score"] - recent_performance["avg_score"])
        if score_drift > self.alert_thresholds["score_drift"]:
            self._trigger_alert(
                "SCORE_DRIFT",
                f"Average score drifted by {score_drift:.1f} points "
                f"(baseline: {baseline_performance['avg_score']:.1f}, "
                f"recent: {recent_performance['avg_score']:.1f})"
            )
        
        # Check for direction accuracy decline
        dir_decline = baseline_performance["direction_accuracy"] - recent_performance["direction_accuracy"]
        if dir_decline > self.alert_thresholds["direction_accuracy_decline"]:
            self._trigger_alert(
                "DIRECTION_ACCURACY_DECLINE",
                f"Direction accuracy declined by {dir_decline:.2f} "
                f"(baseline: {baseline_performance['direction_accuracy']:.2f}, "
                f"recent: {recent_performance['direction_accuracy']:.2f})"
            )
    
    def _trigger_alert(self, alert_type: str, message: str) -> None:
        """
        Trigger a performance alert.
        
        Args:
            alert_type: Type of alert
            message: Alert message
        """
        alert = {
            "timestamp": datetime.now(),
            "type": alert_type,
            "message": message,
        }
        
        self.alerts.append(alert)
        
        # Log alert (in production, this would send notifications)
        print(f"\n⚠️  ALERT [{alert_type}]: {message}\n")
    
    def get_performance_dashboard(self) -> Dict:
        """
        Generate comprehensive performance dashboard.
        
        Returns:
            Dict with summary metrics, trends, feature importance, recommendations
        """
        summary_metrics = self._calculate_summary_metrics()
        recent_trends = self._calculate_recent_trends()
        feature_importance = self._calculate_feature_importance()
        recommendations = self._generate_recommendations()
        
        return {
            "summary_metrics": summary_metrics,
            "recent_trends": recent_trends,
            "feature_importance": feature_importance,
            "recommendations": recommendations,
            "recent_alerts": self.alerts[-5:] if self.alerts else [],
        }
    
    def _calculate_summary_metrics(self) -> Dict:
        """Calculate overall summary metrics"""
        all_with_outcomes = [r for r in self.performance_history if "actual_move" in r]
        
        if len(all_with_outcomes) < 5:
            return {"error": "Insufficient data for summary"}
        
        # Overall performance
        score_threshold = 60
        move_threshold = 7.0
        
        predicted_movers = sum(1 for r in all_with_outcomes if r["predicted_score"] >= score_threshold)
        actual_movers = sum(1 for r in all_with_outcomes if abs(r["actual_move"]) >= move_threshold)
        
        true_positives = sum(
            1 for r in all_with_outcomes
            if r["predicted_score"] >= score_threshold and abs(r["actual_move"]) >= move_threshold
        )
        
        precision = true_positives / predicted_movers if predicted_movers > 0 else 0
        recall = true_positives / actual_movers if actual_movers > 0 else 0
        
        direction_correct = sum(1 for r in all_with_outcomes if r.get("direction_correct", False))
        direction_accuracy = direction_correct / len(all_with_outcomes)
        
        avg_magnitude_error = np.mean([r["magnitude_error"] for r in all_with_outcomes])
        
        return {
            "total_predictions": len(self.performance_history),
            "predictions_with_outcomes": len(all_with_outcomes),
            "precision": round(precision, 3),
            "recall": round(recall, 3),
            "direction_accuracy": round(direction_accuracy, 3),
            "avg_magnitude_error": round(avg_magnitude_error, 2),
        }
    
    def _calculate_recent_trends(self) -> Dict:
        """Calculate recent performance trends"""
        # Get performance for last 7, 30, 90 days
        trends = {}
        
        for period in [7, 30, 90]:
            perf = self._get_recent_performance(period)
            if "error" not in perf:
                trends[f"last_{period}_days"] = perf
        
        return trends
    
    def _calculate_feature_importance(self) -> Dict:
        """
        Calculate feature importance based on prediction accuracy.
        
        Analyzes which features (event type, score ranges) correlate with
        better prediction accuracy.
        
        Returns:
            Dict with feature importance scores
        """
        records_with_outcomes = [r for r in self.performance_history if "actual_move" in r]
        
        if len(records_with_outcomes) < 10:
            return {"error": "Insufficient data"}
        
        # Group by event type
        event_performance = defaultdict(lambda: {"correct": 0, "total": 0})
        
        for r in records_with_outcomes:
            event_type = r["event_type"]
            event_performance[event_type]["total"] += 1
            if r.get("direction_correct", False):
                event_performance[event_type]["correct"] += 1
        
        # Calculate accuracy by event type
        event_accuracies = {
            event_type: perf["correct"] / perf["total"]
            for event_type, perf in event_performance.items()
            if perf["total"] >= 3  # Minimum sample size
        }
        
        # Analyze score ranges
        score_ranges = [
            ("High (80+)", lambda r: r["predicted_score"] >= 80),
            ("Medium-High (70-79)", lambda r: 70 <= r["predicted_score"] < 80),
            ("Medium (60-69)", lambda r: 60 <= r["predicted_score"] < 70),
            ("Low (<60)", lambda r: r["predicted_score"] < 60),
        ]
        
        range_accuracies = {}
        for range_name, range_filter in score_ranges:
            filtered = [r for r in records_with_outcomes if range_filter(r)]
            if len(filtered) >= 3:
                correct = sum(1 for r in filtered if r.get("direction_correct", False))
                range_accuracies[range_name] = round(correct / len(filtered), 3)
        
        return {
            "by_event_type": {k: round(v, 3) for k, v in event_accuracies.items()},
            "by_score_range": range_accuracies,
        }
    
    def _generate_recommendations(self) -> List[str]:
        """
        Generate actionable recommendations based on performance.
        
        Returns:
            List of recommendation strings
        """
        recommendations = []
        
        recent_perf = self._get_recent_performance(30)
        
        if "error" in recent_perf:
            recommendations.append("Collect more prediction data to enable monitoring")
            return recommendations
        
        baseline = self._get_baseline_performance()
        
        # Precision recommendations
        if recent_perf["precision"] < 0.70:
            recommendations.append(
                "⚠️  Precision below target (70%) - Consider raising score threshold"
            )
        elif recent_perf["precision"] >= 0.85:
            recommendations.append(
                "✅ Precision excellent - Model performing well on positive predictions"
            )
        
        # Recall recommendations
        if recent_perf["recall"] < 0.70:
            recommendations.append(
                "⚠️  Recall below target (70%) - May be missing market-moving events"
            )
        elif recent_perf["recall"] >= 0.85:
            recommendations.append(
                "✅ Recall excellent - Model capturing most market-moving events"
            )
        
        # Direction accuracy recommendations
        if recent_perf["direction_accuracy"] < 0.70:
            recommendations.append(
                "⚠️  Direction accuracy below target - Review event type classifications"
            )
        elif recent_perf["direction_accuracy"] >= 0.80:
            recommendations.append(
                "✅ Direction accuracy strong - Model predicting move direction well"
            )
        
        # Magnitude error recommendations
        if recent_perf["avg_magnitude_error"] > 15.0:
            recommendations.append(
                "⚠️  High magnitude error - Move size predictions need calibration"
            )
        
        return recommendations


if __name__ == "__main__":
    """Example usage of performance tracker"""
    
    print("MVM Performance Tracker - Example Usage")
    print("=" * 70)
    
    tracker = MVMPerformanceTracker()
    
    # Simulate tracking several predictions
    print("\n📊 Tracking example predictions...")
    
    example_predictions = [
        {
            "ticker": "CELC",
            "date": "2025-10-20",
            "score": 88.5,
            "predicted_move": 35.0,
            "event_type": "Phase 3",
        },
        {
            "ticker": "SPRB",
            "date": "2025-10-06",
            "score": 91.2,
            "predicted_move": 60.0,
            "event_type": "BTD",
        },
        {
            "ticker": "IONS",
            "date": "2025-08-21",
            "score": 62.0,
            "predicted_move": 5.0,
            "event_type": "Approval",
        },
        {
            "ticker": "SRRK",
            "date": "2025-09-23",
            "score": 82.4,
            "predicted_move": -15.0,
            "event_type": "CRL",
        },
    ]
    
    example_outcomes = [
        {"actual_move": 52.0},
        {"actual_move": 1378.0},
        {"actual_move": 1.1},
        {"actual_move": -12.0},
    ]
    
    for pred, outcome in zip(example_predictions, example_outcomes):
        tracker.track_prediction(pred, outcome)
        print(f"  ✓ Tracked {pred['ticker']} prediction")
    
    # Generate dashboard
    print("\n📈 Performance Dashboard")
    print("-" * 70)
    
    dashboard = tracker.get_performance_dashboard()
    
    print("\nSUMMARY METRICS:")
    for key, value in dashboard["summary_metrics"].items():
        print(f"  {key:30s}: {value}")
    
    print("\nFEATURE IMPORTANCE:")
    if "by_event_type" in dashboard["feature_importance"]:
        print("  By Event Type:")
        for event_type, accuracy in dashboard["feature_importance"]["by_event_type"].items():
            print(f"    {event_type:20s}: {accuracy:.1%}")
    
    print("\nRECOMMENDATIONS:")
    for rec in dashboard["recommendations"]:
        print(f"  {rec}")
    
    print("\n" + "=" * 70)
    print("✅ Performance tracking example complete!")

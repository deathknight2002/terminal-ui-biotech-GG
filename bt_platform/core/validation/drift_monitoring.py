"""
Real-time Drift Monitoring with PSI and KS Tests

Implements Population Stability Index (PSI) and Kolmogorov-Smirnov tests
to detect distribution drift in features and scores over time. Triggers
automatic exposure reduction when calibration drift is detected.

Key Features:
- Population Stability Index (PSI) monitoring with <0.2 threshold
- Kolmogorov-Smirnov (KS) tests for distribution comparison
- Feature-level drift detection
- Score distribution drift detection
- Automatic exposure reduction on calibration drift
- Alerting and logging system

References:
- Siddiqi, N. (2006). "Credit Risk Scorecards: Developing and Implementing Intelligent Credit Scoring"
- Massey, F. J. (1951). "The Kolmogorov-Smirnov Test for Goodness of Fit"
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from collections import deque
import warnings


@dataclass
class DriftMetrics:
    """Metrics for distribution drift detection"""
    
    feature_name: str
    psi_value: float
    ks_statistic: float
    ks_pvalue: float
    drift_detected: bool
    drift_severity: str  # "none", "low", "medium", "high", "critical"
    timestamp: datetime = field(default_factory=datetime.now)
    
    # Additional statistics
    baseline_mean: float = 0.0
    current_mean: float = 0.0
    baseline_std: float = 0.0
    current_std: float = 0.0
    mean_shift_pct: float = 0.0


@dataclass
class DriftAlert:
    """Alert for detected drift"""
    
    alert_type: str  # "psi", "ks", "calibration"
    severity: str  # "warning", "critical"
    message: str
    affected_features: List[str]
    metrics: Dict[str, float]
    recommended_action: str
    timestamp: datetime = field(default_factory=datetime.now)


class PSICalculator:
    """
    Population Stability Index (PSI) Calculator
    
    PSI measures the shift in distribution between two datasets (baseline and current).
    It's commonly used in credit scoring to detect population drift.
    
    PSI Interpretation:
    - PSI < 0.1: No significant change
    - 0.1 ≤ PSI < 0.2: Moderate change, investigation needed
    - PSI ≥ 0.2: Significant change, model may need recalibration
    """
    
    @staticmethod
    def calculate_psi(
        baseline: np.ndarray,
        current: np.ndarray,
        n_bins: int = 10,
        bin_edges: Optional[np.ndarray] = None
    ) -> Tuple[float, np.ndarray]:
        """
        Calculate PSI between baseline and current distributions
        
        Args:
            baseline: Baseline distribution samples
            current: Current distribution samples
            n_bins: Number of bins for discretization
            bin_edges: Custom bin edges (optional)
            
        Returns:
            Tuple of (PSI value, bin_edges used)
        """
        # Create bins based on baseline distribution
        if bin_edges is None:
            bin_edges = np.percentile(
                baseline, 
                np.linspace(0, 100, n_bins + 1)
            )
            # Ensure unique bin edges
            bin_edges = np.unique(bin_edges)
            if len(bin_edges) < 2:
                return 0.0, bin_edges
        
        # Calculate distributions
        baseline_dist = np.histogram(baseline, bins=bin_edges)[0]
        current_dist = np.histogram(current, bins=bin_edges)[0]
        
        # Convert to proportions
        baseline_prop = baseline_dist / len(baseline)
        current_prop = current_dist / len(current)
        
        # Add small epsilon to avoid log(0)
        epsilon = 1e-10
        baseline_prop = np.maximum(baseline_prop, epsilon)
        current_prop = np.maximum(current_prop, epsilon)
        
        # Calculate PSI
        psi = np.sum((current_prop - baseline_prop) * np.log(current_prop / baseline_prop))
        
        return psi, bin_edges
    
    @staticmethod
    def interpret_psi(psi_value: float) -> str:
        """
        Interpret PSI value
        
        Args:
            psi_value: PSI value
            
        Returns:
            Severity level string
        """
        if psi_value < 0.1:
            return "none"
        elif psi_value < 0.15:
            return "low"
        elif psi_value < 0.2:
            return "medium"
        elif psi_value < 0.3:
            return "high"
        else:
            return "critical"


class KSTestCalculator:
    """
    Kolmogorov-Smirnov Test Calculator
    
    KS test compares two distributions to determine if they are significantly different.
    """
    
    @staticmethod
    def calculate_ks_statistic(
        baseline: np.ndarray,
        current: np.ndarray
    ) -> Tuple[float, float]:
        """
        Calculate KS statistic and p-value
        
        Args:
            baseline: Baseline distribution samples
            current: Current distribution samples
            
        Returns:
            Tuple of (KS statistic, p-value)
        """
        # Sort the data
        baseline_sorted = np.sort(baseline)
        current_sorted = np.sort(current)
        
        # Calculate empirical CDFs
        n1 = len(baseline)
        n2 = len(current)
        
        # Combine and sort all data points
        all_data = np.concatenate([baseline_sorted, current_sorted])
        all_data_sorted = np.sort(all_data)
        
        # Calculate CDFs at each point
        cdf1 = np.searchsorted(baseline_sorted, all_data_sorted, side='right') / n1
        cdf2 = np.searchsorted(current_sorted, all_data_sorted, side='right') / n2
        
        # KS statistic is maximum difference between CDFs
        ks_stat = np.max(np.abs(cdf1 - cdf2))
        
        # Calculate p-value (two-tailed test)
        # Using asymptotic approximation
        n = (n1 * n2) / (n1 + n2)
        pvalue = KSTestCalculator._ks_pvalue(ks_stat, n)
        
        return ks_stat, pvalue
    
    @staticmethod
    def _ks_pvalue(ks_stat: float, n: float) -> float:
        """
        Calculate p-value for KS statistic
        
        Uses Kolmogorov distribution asymptotic approximation
        """
        # Asymptotic formula
        lambda_val = (np.sqrt(n) + 0.12 + 0.11 / np.sqrt(n)) * ks_stat
        
        # Calculate p-value using series approximation
        pvalue = 0.0
        for k in range(1, 11):  # Sum first 10 terms
            pvalue += 2 * ((-1) ** (k - 1)) * np.exp(-2 * k**2 * lambda_val**2)
        
        return min(1.0, max(0.0, pvalue))


class DriftMonitor:
    """
    Real-time drift monitoring system
    
    Monitors multiple features and score distributions over time,
    detecting drift using PSI and KS tests.
    """
    
    def __init__(
        self,
        psi_threshold: float = 0.2,
        ks_pvalue_threshold: float = 0.05,
        baseline_window_days: int = 90,
        monitoring_window_days: int = 30,
        max_history_size: int = 1000
    ):
        """
        Initialize drift monitor
        
        Args:
            psi_threshold: PSI threshold for drift alert (default: 0.2)
            ks_pvalue_threshold: KS p-value threshold (default: 0.05)
            baseline_window_days: Days of data for baseline (default: 90)
            monitoring_window_days: Days of data for monitoring (default: 30)
            max_history_size: Maximum samples to keep in memory
        """
        self.psi_threshold = psi_threshold
        self.ks_pvalue_threshold = ks_pvalue_threshold
        self.baseline_window_days = baseline_window_days
        self.monitoring_window_days = monitoring_window_days
        self.max_history_size = max_history_size
        
        # Storage
        self.baseline_data: Dict[str, deque] = {}
        self.current_data: Dict[str, deque] = {}
        self.bin_edges: Dict[str, np.ndarray] = {}
        
        # Drift history
        self.drift_history: List[DriftMetrics] = []
        self.alerts: List[DriftAlert] = []
        
        # Exposure adjustment
        self.exposure_multiplier: float = 1.0
        self.exposure_history: List[Tuple[datetime, float]] = []
    
    def set_baseline(
        self,
        data: pd.DataFrame,
        feature_columns: List[str]
    ) -> None:
        """
        Set baseline distributions for features
        
        Args:
            data: DataFrame with feature data
            feature_columns: List of feature column names
        """
        for feature in feature_columns:
            if feature not in data.columns:
                warnings.warn(f"Feature {feature} not found in data")
                continue
            
            values = data[feature].dropna().values
            self.baseline_data[feature] = deque(values, maxlen=self.max_history_size)
            
            # Calculate bin edges for PSI
            _, bin_edges = PSICalculator.calculate_psi(
                values, values, n_bins=10
            )
            self.bin_edges[feature] = bin_edges
            
            # Initialize current data storage
            self.current_data[feature] = deque(maxlen=self.max_history_size)
    
    def add_observations(
        self,
        data: pd.DataFrame,
        feature_columns: List[str]
    ) -> None:
        """
        Add new observations to current window
        
        Args:
            data: DataFrame with feature data
            feature_columns: List of feature column names
        """
        for feature in feature_columns:
            if feature not in data.columns:
                continue
            
            values = data[feature].dropna().values
            
            if feature not in self.current_data:
                self.current_data[feature] = deque(maxlen=self.max_history_size)
            
            self.current_data[feature].extend(values)
    
    def check_drift(
        self,
        feature_columns: Optional[List[str]] = None
    ) -> Dict[str, DriftMetrics]:
        """
        Check for drift in monitored features
        
        Args:
            feature_columns: Features to check (None = all)
            
        Returns:
            Dict of feature_name -> DriftMetrics
        """
        if feature_columns is None:
            feature_columns = list(self.baseline_data.keys())
        
        results = {}
        
        for feature in feature_columns:
            if feature not in self.baseline_data or feature not in self.current_data:
                continue
            
            if len(self.current_data[feature]) < 10:
                # Not enough current data
                continue
            
            baseline = np.array(self.baseline_data[feature])
            current = np.array(self.current_data[feature])
            
            # Calculate PSI
            psi_value, _ = PSICalculator.calculate_psi(
                baseline, current, 
                bin_edges=self.bin_edges.get(feature)
            )
            
            # Calculate KS test
            ks_stat, ks_pval = KSTestCalculator.calculate_ks_statistic(
                baseline, current
            )
            
            # Determine drift severity
            psi_severity = PSICalculator.interpret_psi(psi_value)
            ks_significant = ks_pval < self.ks_pvalue_threshold
            
            drift_detected = (
                psi_value >= self.psi_threshold or
                ks_significant
            )
            
            # Calculate statistics
            baseline_mean = np.mean(baseline)
            current_mean = np.mean(current)
            mean_shift_pct = (current_mean - baseline_mean) / baseline_mean if baseline_mean != 0 else 0
            
            metrics = DriftMetrics(
                feature_name=feature,
                psi_value=psi_value,
                ks_statistic=ks_stat,
                ks_pvalue=ks_pval,
                drift_detected=drift_detected,
                drift_severity=psi_severity,
                baseline_mean=baseline_mean,
                current_mean=current_mean,
                baseline_std=np.std(baseline),
                current_std=np.std(current),
                mean_shift_pct=mean_shift_pct
            )
            
            results[feature] = metrics
            self.drift_history.append(metrics)
            
            # Generate alerts if needed
            if drift_detected:
                self._generate_alert(metrics)
        
        return results
    
    def _generate_alert(self, metrics: DriftMetrics) -> None:
        """
        Generate drift alert
        
        Args:
            metrics: DriftMetrics object
        """
        if metrics.drift_severity in ["high", "critical"]:
            severity = "critical"
            action = "REDUCE EXPOSURE IMMEDIATELY - Recalibrate model"
        elif metrics.drift_severity == "medium":
            severity = "warning"
            action = "MONITOR CLOSELY - Consider reducing exposure"
        else:
            severity = "warning"
            action = "INVESTIGATE - Review feature distribution"
        
        alert = DriftAlert(
            alert_type="psi" if metrics.psi_value >= self.psi_threshold else "ks",
            severity=severity,
            message=f"Distribution drift detected in {metrics.feature_name}",
            affected_features=[metrics.feature_name],
            metrics={
                "psi": metrics.psi_value,
                "ks_stat": metrics.ks_statistic,
                "ks_pval": metrics.ks_pvalue,
                "mean_shift_pct": metrics.mean_shift_pct
            },
            recommended_action=action
        )
        
        self.alerts.append(alert)
        
        # Adjust exposure based on severity
        if severity == "critical":
            self._adjust_exposure(0.5)  # Reduce to 50%
        elif metrics.drift_severity == "medium":
            self._adjust_exposure(0.75)  # Reduce to 75%
    
    def _adjust_exposure(self, multiplier: float) -> None:
        """
        Adjust exposure multiplier
        
        Args:
            multiplier: New exposure multiplier
        """
        self.exposure_multiplier = min(self.exposure_multiplier, multiplier)
        self.exposure_history.append((datetime.now(), self.exposure_multiplier))
    
    def get_exposure_multiplier(self) -> float:
        """Get current exposure multiplier"""
        return self.exposure_multiplier
    
    def reset_exposure(self) -> None:
        """Reset exposure multiplier to 1.0"""
        self.exposure_multiplier = 1.0
        self.exposure_history.append((datetime.now(), 1.0))
    
    def get_drift_summary(self) -> pd.DataFrame:
        """
        Get summary of recent drift metrics
        
        Returns:
            DataFrame with drift metrics
        """
        if not self.drift_history:
            return pd.DataFrame()
        
        return pd.DataFrame([
            {
                'feature': m.feature_name,
                'psi': m.psi_value,
                'ks_stat': m.ks_statistic,
                'ks_pval': m.ks_pvalue,
                'severity': m.drift_severity,
                'drift': m.drift_detected,
                'mean_shift': f"{m.mean_shift_pct:.1%}",
                'timestamp': m.timestamp
            }
            for m in self.drift_history[-20:]  # Last 20 checks
        ])
    
    def get_active_alerts(self) -> List[DriftAlert]:
        """Get alerts from last 24 hours"""
        cutoff = datetime.now() - timedelta(hours=24)
        return [alert for alert in self.alerts if alert.timestamp > cutoff]


# Example usage and testing
if __name__ == "__main__":
    print("=" * 80)
    print("Drift Monitoring Demo")
    print("=" * 80)
    
    # Generate baseline data
    np.random.seed(42)
    n_baseline = 500
    
    baseline_df = pd.DataFrame({
        'mvm_score': np.random.normal(70, 15, n_baseline),
        'win_prob': np.random.beta(5, 2, n_baseline),
        'volatility': np.random.gamma(2, 15, n_baseline),
        'market_cap': np.random.lognormal(18, 1.5, n_baseline)
    })
    
    print(f"\n📊 Baseline Data ({n_baseline} samples)")
    print(baseline_df.describe().round(2))
    
    # Initialize drift monitor
    monitor = DriftMonitor(
        psi_threshold=0.2,
        ks_pvalue_threshold=0.05
    )
    
    features = ['mvm_score', 'win_prob', 'volatility', 'market_cap']
    monitor.set_baseline(baseline_df, features)
    
    print("\n✅ Baseline set for features:", features)
    print("-" * 80)
    
    # Test 1: No drift (same distribution)
    print("\n🔍 Test 1: NO DRIFT")
    current_df = pd.DataFrame({
        'mvm_score': np.random.normal(70, 15, 100),
        'win_prob': np.random.beta(5, 2, 100),
        'volatility': np.random.gamma(2, 15, 100),
        'market_cap': np.random.lognormal(18, 1.5, 100)
    })
    
    monitor.add_observations(current_df, features)
    drift_results = monitor.check_drift(features)
    
    for feature, metrics in drift_results.items():
        status = "🔴 DRIFT" if metrics.drift_detected else "✅ OK"
        print(f"{feature:15s}: PSI={metrics.psi_value:.3f} | KS p-val={metrics.ks_pvalue:.3f} | {status}")
    
    # Test 2: Mean shift (moderate drift)
    print("\n🔍 Test 2: MEAN SHIFT (Moderate Drift)")
    monitor.current_data = {f: deque(maxlen=1000) for f in features}
    
    current_df = pd.DataFrame({
        'mvm_score': np.random.normal(80, 15, 100),  # Mean shifted +10
        'win_prob': np.random.beta(5, 2, 100),
        'volatility': np.random.gamma(2, 15, 100),
        'market_cap': np.random.lognormal(18, 1.5, 100)
    })
    
    monitor.add_observations(current_df, features)
    drift_results = monitor.check_drift(features)
    
    for feature, metrics in drift_results.items():
        status = "🔴 DRIFT" if metrics.drift_detected else "✅ OK"
        print(f"{feature:15s}: PSI={metrics.psi_value:.3f} | Shift={metrics.mean_shift_pct:+.1%} | {status}")
    
    # Test 3: Distribution change (severe drift)
    print("\n🔍 Test 3: DISTRIBUTION CHANGE (Severe Drift)")
    monitor.current_data = {f: deque(maxlen=1000) for f in features}
    
    current_df = pd.DataFrame({
        'mvm_score': np.random.normal(70, 30, 100),  # Variance doubled
        'win_prob': np.random.beta(2, 5, 100),  # Distribution changed
        'volatility': np.random.gamma(2, 15, 100),
        'market_cap': np.random.lognormal(19, 2, 100)  # Mean and variance shifted
    })
    
    monitor.add_observations(current_df, features)
    drift_results = monitor.check_drift(features)
    
    for feature, metrics in drift_results.items():
        status = "🔴 DRIFT" if metrics.drift_detected else "✅ OK"
        severity = metrics.drift_severity.upper()
        print(f"{feature:15s}: PSI={metrics.psi_value:.3f} | Severity={severity:8s} | {status}")
    
    # Show alerts
    print("\n⚠️  ACTIVE ALERTS")
    print("-" * 80)
    alerts = monitor.get_active_alerts()
    if alerts:
        for alert in alerts:
            print(f"\n[{alert.severity.upper()}] {alert.alert_type.upper()}")
            print(f"  {alert.message}")
            print(f"  Action: {alert.recommended_action}")
            print(f"  Metrics: PSI={alert.metrics.get('psi', 0):.3f}")
    else:
        print("No active alerts")
    
    # Show exposure adjustment
    print(f"\n📉 EXPOSURE ADJUSTMENT")
    print(f"  Current multiplier: {monitor.get_exposure_multiplier():.1%}")
    print(f"  History: {len(monitor.exposure_history)} adjustments")
    
    print("\n" + "=" * 80)
    print("✅ Drift monitoring demo complete!")
    print("=" * 80)

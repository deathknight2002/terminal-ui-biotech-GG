"""
Probability Calibration Layer for MVM Alpha Scoring

Implements Platt scaling and isotonic regression to convert raw MVM scores
into properly calibrated probabilities. Includes auto-selection via out-of-fold
log loss and comprehensive calibration metrics.

Key Features:
- Platt scaling (logistic calibration)
- Isotonic regression (non-parametric calibration)
- Auto-selection based on out-of-fold log loss
- Brier score tracking
- Expected Calibration Error (ECE) tracking
- Reliability diagrams

References:
- Platt, J. (1999). "Probabilistic outputs for support vector machines"
- Niculescu-Mizil & Caruana (2005). "Predicting good probabilities with supervised learning"
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from dataclasses import dataclass
from typing import Tuple, Optional, Literal
import warnings


@dataclass
class CalibrationMetrics:
    """Metrics for evaluating probability calibration"""
    
    brier_score: float  # Lower is better (0 = perfect)
    log_loss: float  # Lower is better
    ece: float  # Expected Calibration Error (lower is better)
    mce: float  # Maximum Calibration Error (lower is better)
    calibration_slope: float  # Should be close to 1.0
    calibration_intercept: float  # Should be close to 0.0
    method: str  # "platt" or "isotonic"
    n_bins: int = 10  # Number of bins used for ECE calculation


class PlattScaling:
    """
    Platt Scaling for probability calibration
    
    Fits a logistic regression model to map raw scores to calibrated probabilities.
    This is a parametric method that assumes a sigmoid relationship.
    
    Formula: P(y=1|s) = 1 / (1 + exp(A*s + B))
    where s is the raw score, and A, B are learned parameters.
    """
    
    def __init__(self):
        self.A: Optional[float] = None
        self.B: Optional[float] = None
        self.is_fitted: bool = False
    
    def fit(
        self,
        scores: np.ndarray,
        labels: np.ndarray,
        max_iter: int = 100,
        learning_rate: float = 0.01
    ) -> None:
        """
        Fit Platt scaling parameters
        
        Args:
            scores: Raw scores (e.g., MVM scores 0-100)
            labels: Binary labels (0 or 1)
            max_iter: Maximum iterations for optimization
            learning_rate: Learning rate for gradient descent
        """
        # Normalize scores to [0, 1] range for numerical stability
        scores_norm = self._normalize_scores(scores)
        
        # Initialize parameters
        self.A = 0.0
        self.B = 0.0
        
        # Prior probabilities (for regularization)
        prior1 = np.sum(labels) / len(labels)
        prior0 = 1 - prior1
        
        # Target probabilities (with smoothing to avoid log(0))
        hiTarget = (prior1 + 1) / (prior1 + 2)
        loTarget = 1 / (prior0 + 2)
        
        # Gradient descent optimization
        for iteration in range(max_iter):
            # Compute predicted probabilities
            probs = self._sigmoid(self.A * scores_norm + self.B)
            
            # Compute gradients
            targets = np.where(labels == 1, hiTarget, loTarget)
            errors = probs - targets
            
            grad_A = np.mean(errors * scores_norm)
            grad_B = np.mean(errors)
            
            # Update parameters
            self.A -= learning_rate * grad_A
            self.B -= learning_rate * grad_B
            
            # Check convergence
            if iteration > 10 and abs(grad_A) < 1e-6 and abs(grad_B) < 1e-6:
                break
        
        self.is_fitted = True
    
    def predict_proba(self, scores: np.ndarray) -> np.ndarray:
        """
        Predict calibrated probabilities
        
        Args:
            scores: Raw scores to calibrate
            
        Returns:
            Array of calibrated probabilities
        """
        if not self.is_fitted:
            raise ValueError("PlattScaling must be fitted before prediction")
        
        scores_norm = self._normalize_scores(scores)
        return self._sigmoid(self.A * scores_norm + self.B)
    
    @staticmethod
    def _normalize_scores(scores: np.ndarray) -> np.ndarray:
        """Normalize scores to [0, 1] range"""
        min_score = np.min(scores)
        max_score = np.max(scores)
        if max_score == min_score:
            return np.ones_like(scores) * 0.5
        return (scores - min_score) / (max_score - min_score)
    
    @staticmethod
    def _sigmoid(x: np.ndarray) -> np.ndarray:
        """Sigmoid function with numerical stability"""
        return np.where(
            x >= 0,
            1 / (1 + np.exp(-x)),
            np.exp(x) / (1 + np.exp(x))
        )


class IsotonicCalibration:
    """
    Isotonic Regression for probability calibration
    
    Fits a non-decreasing step function to map raw scores to calibrated probabilities.
    This is a non-parametric method that makes no assumptions about the relationship.
    """
    
    def __init__(self):
        self.thresholds: Optional[np.ndarray] = None
        self.probabilities: Optional[np.ndarray] = None
        self.is_fitted: bool = False
    
    def fit(self, scores: np.ndarray, labels: np.ndarray) -> None:
        """
        Fit isotonic regression
        
        Args:
            scores: Raw scores (e.g., MVM scores 0-100)
            labels: Binary labels (0 or 1)
        """
        # Sort by scores
        sort_idx = np.argsort(scores)
        scores_sorted = scores[sort_idx]
        labels_sorted = labels[sort_idx]
        
        # Perform isotonic regression using pool adjacent violators algorithm
        self.thresholds, self.probabilities = self._isotonic_regression(
            scores_sorted, labels_sorted
        )
        
        self.is_fitted = True
    
    def predict_proba(self, scores: np.ndarray) -> np.ndarray:
        """
        Predict calibrated probabilities
        
        Args:
            scores: Raw scores to calibrate
            
        Returns:
            Array of calibrated probabilities
        """
        if not self.is_fitted:
            raise ValueError("IsotonicCalibration must be fitted before prediction")
        
        # Find corresponding probability for each score
        probs = np.zeros(len(scores))
        for i, score in enumerate(scores):
            # Find the bin this score falls into
            idx = np.searchsorted(self.thresholds, score, side='right')
            if idx == 0:
                probs[i] = self.probabilities[0]
            elif idx >= len(self.probabilities):
                probs[i] = self.probabilities[-1]
            else:
                probs[i] = self.probabilities[idx - 1]
        
        return probs
    
    @staticmethod
    def _isotonic_regression(
        scores: np.ndarray,
        labels: np.ndarray
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Pool Adjacent Violators Algorithm for isotonic regression
        
        Args:
            scores: Sorted scores
            labels: Corresponding labels
            
        Returns:
            Tuple of (thresholds, probabilities)
        """
        # Initialize with each point as its own group
        groups = [[s] for s in scores]
        averages = [float(l) for l in labels]
        
        # Merge adjacent violators (groups where average decreases)
        i = 0
        while i < len(averages) - 1:
            if averages[i] > averages[i + 1]:
                # Merge groups
                groups[i].extend(groups[i + 1])
                del groups[i + 1]
                
                # Recalculate average
                start_idx = sum(len(g) for g in groups[:i])
                end_idx = start_idx + len(groups[i])
                averages[i] = np.mean(labels[start_idx:end_idx])
                del averages[i + 1]
                
                # Backtrack to check previous groups
                i = max(0, i - 1)
            else:
                i += 1
        
        # Extract thresholds and probabilities
        thresholds = []
        probabilities = []
        
        idx = 0
        for group, avg in zip(groups, averages):
            thresholds.append(scores[idx])
            probabilities.append(avg)
            idx += len(group)
        
        return np.array(thresholds), np.array(probabilities)


class CalibrationEvaluator:
    """
    Evaluates calibration quality using multiple metrics
    """
    
    @staticmethod
    def brier_score(y_true: np.ndarray, y_prob: np.ndarray) -> float:
        """
        Calculate Brier score (mean squared error of probabilities)
        
        Args:
            y_true: True binary labels
            y_prob: Predicted probabilities
            
        Returns:
            Brier score (0 = perfect, 1 = worst)
        """
        return np.mean((y_true - y_prob) ** 2)
    
    @staticmethod
    def log_loss(y_true: np.ndarray, y_prob: np.ndarray, eps: float = 1e-15) -> float:
        """
        Calculate log loss (cross-entropy)
        
        Args:
            y_true: True binary labels
            y_prob: Predicted probabilities
            eps: Small value to avoid log(0)
            
        Returns:
            Log loss (lower is better)
        """
        # Clip probabilities to avoid log(0)
        y_prob = np.clip(y_prob, eps, 1 - eps)
        return -np.mean(y_true * np.log(y_prob) + (1 - y_true) * np.log(1 - y_prob))
    
    @staticmethod
    def expected_calibration_error(
        y_true: np.ndarray,
        y_prob: np.ndarray,
        n_bins: int = 10
    ) -> Tuple[float, float]:
        """
        Calculate Expected Calibration Error (ECE) and Maximum Calibration Error (MCE)
        
        ECE measures the average difference between predicted probabilities and
        observed frequencies across bins.
        
        Args:
            y_true: True binary labels
            y_prob: Predicted probabilities
            n_bins: Number of bins for binning probabilities
            
        Returns:
            Tuple of (ECE, MCE)
        """
        bin_edges = np.linspace(0, 1, n_bins + 1)
        bin_indices = np.digitize(y_prob, bin_edges[1:-1])
        
        ece = 0.0
        mce = 0.0
        
        for bin_idx in range(n_bins):
            mask = bin_indices == bin_idx
            if np.sum(mask) > 0:
                bin_prob = np.mean(y_prob[mask])
                bin_acc = np.mean(y_true[mask])
                bin_size = np.sum(mask)
                
                error = abs(bin_prob - bin_acc)
                ece += (bin_size / len(y_true)) * error
                mce = max(mce, error)
        
        return ece, mce
    
    @staticmethod
    def calibration_curve(
        y_true: np.ndarray,
        y_prob: np.ndarray,
        n_bins: int = 10
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Calculate calibration curve (reliability diagram data)
        
        Args:
            y_true: True binary labels
            y_prob: Predicted probabilities
            n_bins: Number of bins
            
        Returns:
            Tuple of (mean_predicted_prob, observed_frequency, bin_counts)
        """
        bin_edges = np.linspace(0, 1, n_bins + 1)
        bin_indices = np.digitize(y_prob, bin_edges[1:-1])
        
        mean_pred = np.zeros(n_bins)
        obs_freq = np.zeros(n_bins)
        bin_counts = np.zeros(n_bins)
        
        for bin_idx in range(n_bins):
            mask = bin_indices == bin_idx
            if np.sum(mask) > 0:
                mean_pred[bin_idx] = np.mean(y_prob[mask])
                obs_freq[bin_idx] = np.mean(y_true[mask])
                bin_counts[bin_idx] = np.sum(mask)
        
        return mean_pred, obs_freq, bin_counts
    
    @staticmethod
    def evaluate_all_metrics(
        y_true: np.ndarray,
        y_prob: np.ndarray,
        method: str = "unknown",
        n_bins: int = 10
    ) -> CalibrationMetrics:
        """
        Calculate all calibration metrics
        
        Args:
            y_true: True binary labels
            y_prob: Predicted probabilities
            method: Calibration method name
            n_bins: Number of bins for ECE
            
        Returns:
            CalibrationMetrics object
        """
        brier = CalibrationEvaluator.brier_score(y_true, y_prob)
        logloss = CalibrationEvaluator.log_loss(y_true, y_prob)
        ece, mce = CalibrationEvaluator.expected_calibration_error(y_true, y_prob, n_bins)
        
        # Calculate calibration slope and intercept
        # Perfect calibration: slope=1, intercept=0
        try:
            from sklearn.linear_model import LinearRegression
            lr = LinearRegression()
            lr.fit(y_prob.reshape(-1, 1), y_true)
            slope = lr.coef_[0]
            intercept = lr.intercept_
        except ImportError:
            # Fallback to simple linear regression
            slope = np.corrcoef(y_prob, y_true)[0, 1] * (np.std(y_true) / np.std(y_prob)) if np.std(y_prob) > 0 else 0
            intercept = np.mean(y_true) - slope * np.mean(y_prob)
        
        return CalibrationMetrics(
            brier_score=brier,
            log_loss=logloss,
            ece=ece,
            mce=mce,
            calibration_slope=slope,
            calibration_intercept=intercept,
            method=method,
            n_bins=n_bins
        )


class AutoCalibrator:
    """
    Automatically selects best calibration method via out-of-fold validation
    """
    
    def __init__(self, n_bins: int = 10):
        self.n_bins = n_bins
        self.best_method: Optional[str] = None
        self.platt: Optional[PlattScaling] = None
        self.isotonic: Optional[IsotonicCalibration] = None
    
    def fit(
        self,
        scores: np.ndarray,
        labels: np.ndarray,
        cv_splits: Optional[list] = None
    ) -> str:
        """
        Fit both calibration methods and select the best via cross-validation
        
        Args:
            scores: Raw scores
            labels: Binary labels
            cv_splits: List of (train_idx, val_idx) tuples for CV
            
        Returns:
            Name of best method ("platt" or "isotonic")
        """
        if cv_splits is None:
            # Simple train/validation split if no CV provided
            n_train = int(0.8 * len(scores))
            cv_splits = [(np.arange(n_train), np.arange(n_train, len(scores)))]
        
        platt_losses = []
        isotonic_losses = []
        
        # Evaluate both methods via cross-validation
        for train_idx, val_idx in cv_splits:
            # Platt scaling
            platt_temp = PlattScaling()
            platt_temp.fit(scores[train_idx], labels[train_idx])
            platt_probs = platt_temp.predict_proba(scores[val_idx])
            platt_loss = CalibrationEvaluator.log_loss(labels[val_idx], platt_probs)
            platt_losses.append(platt_loss)
            
            # Isotonic regression
            isotonic_temp = IsotonicCalibration()
            isotonic_temp.fit(scores[train_idx], labels[train_idx])
            isotonic_probs = isotonic_temp.predict_proba(scores[val_idx])
            isotonic_loss = CalibrationEvaluator.log_loss(labels[val_idx], isotonic_probs)
            isotonic_losses.append(isotonic_loss)
        
        # Compare average losses
        avg_platt_loss = np.mean(platt_losses)
        avg_isotonic_loss = np.mean(isotonic_losses)
        
        print(f"Cross-validation results:")
        print(f"  Platt scaling:       {avg_platt_loss:.4f} (log loss)")
        print(f"  Isotonic regression: {avg_isotonic_loss:.4f} (log loss)")
        
        # Select best method and fit on full data
        if avg_platt_loss < avg_isotonic_loss:
            self.best_method = "platt"
            self.platt = PlattScaling()
            self.platt.fit(scores, labels)
            print(f"✅ Selected: Platt scaling")
        else:
            self.best_method = "isotonic"
            self.isotonic = IsotonicCalibration()
            self.isotonic.fit(scores, labels)
            print(f"✅ Selected: Isotonic regression")
        
        return self.best_method
    
    def predict_proba(self, scores: np.ndarray) -> np.ndarray:
        """
        Predict calibrated probabilities using best method
        
        Args:
            scores: Raw scores to calibrate
            
        Returns:
            Array of calibrated probabilities
        """
        if self.best_method is None:
            raise ValueError("AutoCalibrator must be fitted before prediction")
        
        if self.best_method == "platt":
            return self.platt.predict_proba(scores)
        else:
            return self.isotonic.predict_proba(scores)
    
    def evaluate(self, scores: np.ndarray, labels: np.ndarray) -> CalibrationMetrics:
        """
        Evaluate calibration on test data
        
        Args:
            scores: Raw scores
            labels: True binary labels
            
        Returns:
            CalibrationMetrics object
        """
        probs = self.predict_proba(scores)
        return CalibrationEvaluator.evaluate_all_metrics(
            labels, probs, method=self.best_method, n_bins=self.n_bins
        )


# Example usage and testing
if __name__ == "__main__":
    print("=" * 80)
    print("Probability Calibration Demo")
    print("=" * 80)
    
    # Generate synthetic data
    np.random.seed(42)
    n_samples = 200
    
    # Raw scores (e.g., MVM scores from 0-100)
    raw_scores = np.random.uniform(30, 95, n_samples)
    
    # True probabilities (scores are imperfectly calibrated)
    true_probs = 1 / (1 + np.exp(-0.08 * (raw_scores - 50)))
    
    # Generate binary labels from true probabilities
    labels = (np.random.random(n_samples) < true_probs).astype(int)
    
    print(f"\nGenerated {n_samples} synthetic events")
    print(f"Score range: [{raw_scores.min():.1f}, {raw_scores.max():.1f}]")
    print(f"Positive rate: {labels.mean():.1%}")
    
    # Split into train and test
    n_train = int(0.7 * n_samples)
    train_scores, test_scores = raw_scores[:n_train], raw_scores[n_train:]
    train_labels, test_labels = labels[:n_train], labels[n_train:]
    
    print(f"Train: {len(train_scores)} samples | Test: {len(test_scores)} samples")
    print("\n" + "-" * 80)
    
    # Evaluate uncalibrated scores
    print("\n📊 UNCALIBRATED SCORES")
    uncalib_probs = raw_scores / 100  # Naive conversion
    test_uncalib_probs = test_scores / 100
    
    uncalib_metrics = CalibrationEvaluator.evaluate_all_metrics(
        test_labels, test_uncalib_probs, method="uncalibrated"
    )
    print(f"  Brier Score: {uncalib_metrics.brier_score:.4f}")
    print(f"  Log Loss:    {uncalib_metrics.log_loss:.4f}")
    print(f"  ECE:         {uncalib_metrics.ece:.4f}")
    print(f"  MCE:         {uncalib_metrics.mce:.4f}")
    
    # Auto-select and fit best calibration method
    print("\n🔧 AUTO-CALIBRATION")
    print("-" * 80)
    
    calibrator = AutoCalibrator(n_bins=10)
    best_method = calibrator.fit(train_scores, train_labels)
    
    # Evaluate calibrated scores
    print(f"\n📈 CALIBRATED SCORES ({best_method.upper()})")
    calib_metrics = calibrator.evaluate(test_scores, test_labels)
    
    print(f"  Brier Score: {calib_metrics.brier_score:.4f} (↓ {uncalib_metrics.brier_score - calib_metrics.brier_score:.4f})")
    print(f"  Log Loss:    {calib_metrics.log_loss:.4f} (↓ {uncalib_metrics.log_loss - calib_metrics.log_loss:.4f})")
    print(f"  ECE:         {calib_metrics.ece:.4f} (↓ {uncalib_metrics.ece - calib_metrics.ece:.4f})")
    print(f"  MCE:         {calib_metrics.mce:.4f}")
    print(f"  Slope:       {calib_metrics.calibration_slope:.3f} (target: 1.0)")
    print(f"  Intercept:   {calib_metrics.calibration_intercept:.3f} (target: 0.0)")
    
    print("\n" + "=" * 80)
    print("✅ Probability calibration demo complete!")
    print("=" * 80)

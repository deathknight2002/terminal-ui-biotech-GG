"""
López de Prado's Purged Cross-Validation with Embargo Periods

Implements combinatorially purged cross-validation to eliminate lookahead bias
in time-series prediction models. This is critical for financial models where
information leakage can lead to overly optimistic backtest results.

Key Features:
- Purged K-fold cross-validation
- Embargo periods between train/test sets
- Timestamp validation to prevent lookahead bias
- Rigorous data leakage prevention

References:
- "Advances in Financial Machine Learning" by Marcos López de Prado
- Chapter 7: Cross-Validation in Finance
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import List, Tuple, Optional, Iterator
import warnings


@dataclass
class PurgedCVConfig:
    """Configuration for purged cross-validation"""
    
    n_splits: int = 5  # Number of folds
    embargo_pct: float = 0.01  # Embargo period as percentage of training set
    purge_pct: float = 0.02  # Purge period as percentage of training set
    min_train_length: int = 30  # Minimum training set size
    min_test_length: int = 10  # Minimum test set size


class PurgedKFold:
    """
    Purged K-Fold Cross-Validation
    
    Implements López de Prado's purged K-fold cross-validation which:
    1. Splits data into K folds chronologically
    2. Purges training samples that overlap with test samples in time
    3. Adds embargo periods after test sets to prevent information leakage
    
    This prevents lookahead bias in time-series models where prediction
    events may have overlapping effects.
    """
    
    def __init__(
        self,
        n_splits: int = 5,
        embargo_pct: float = 0.01,
        purge_pct: float = 0.02,
        min_train_length: int = 30,
        min_test_length: int = 10
    ):
        """
        Initialize purged K-fold cross-validator
        
        Args:
            n_splits: Number of folds for cross-validation
            embargo_pct: Embargo period as fraction of training set (e.g., 0.01 = 1%)
            purge_pct: Purge period as fraction of training set (e.g., 0.02 = 2%)
            min_train_length: Minimum number of samples in training set
            min_test_length: Minimum number of samples in test set
        """
        self.n_splits = n_splits
        self.embargo_pct = embargo_pct
        self.purge_pct = purge_pct
        self.min_train_length = min_train_length
        self.min_test_length = min_test_length
    
    def split(
        self,
        X: pd.DataFrame,
        y: Optional[pd.Series] = None,
        pred_times: Optional[pd.Series] = None,
        eval_times: Optional[pd.Series] = None
    ) -> Iterator[Tuple[np.ndarray, np.ndarray]]:
        """
        Generate purged train/test splits
        
        Args:
            X: Feature matrix with datetime index
            y: Target variable (optional, for compatibility)
            pred_times: Series with prediction times (when prediction was made)
            eval_times: Series with evaluation times (when outcome was determined)
            
        Yields:
            Tuple of (train_indices, test_indices) for each fold
        """
        if not isinstance(X.index, pd.DatetimeIndex):
            raise ValueError("X must have a DatetimeIndex for purged cross-validation")
        
        # Use pred_times and eval_times if provided, otherwise use index
        if pred_times is None:
            pred_times = pd.Series(X.index, index=X.index)
        if eval_times is None:
            eval_times = pd.Series(X.index, index=X.index)
        
        # Validate timestamps
        self._validate_timestamps(pred_times, eval_times)
        
        indices = np.arange(len(X))
        test_ranges = self._get_test_ranges(len(X))
        
        for test_start, test_end in test_ranges:
            # Get test indices
            test_indices = indices[test_start:test_end]
            
            if len(test_indices) < self.min_test_length:
                warnings.warn(f"Test set too small ({len(test_indices)} samples), skipping fold")
                continue
            
            # Get test time range
            test_times = eval_times.iloc[test_indices]
            test_start_time = test_times.min()
            test_end_time = test_times.max()
            
            # Calculate embargo period
            embargo_td = self._calculate_embargo_period(len(X))
            
            # Purge training samples that overlap with test period
            train_indices = self._purge_train_samples(
                indices=indices,
                test_indices=test_indices,
                pred_times=pred_times,
                eval_times=eval_times,
                test_start_time=test_start_time,
                test_end_time=test_end_time,
                embargo_td=embargo_td
            )
            
            if len(train_indices) < self.min_train_length:
                warnings.warn(f"Training set too small ({len(train_indices)} samples), skipping fold")
                continue
            
            yield train_indices, test_indices
    
    def _validate_timestamps(
        self,
        pred_times: pd.Series,
        eval_times: pd.Series
    ) -> None:
        """
        Validate that prediction times come before evaluation times
        
        Args:
            pred_times: Series with prediction times
            eval_times: Series with evaluation times
            
        Raises:
            ValueError: If any prediction time is after its evaluation time
        """
        invalid = pred_times > eval_times
        if invalid.any():
            n_invalid = invalid.sum()
            raise ValueError(
                f"Found {n_invalid} samples where prediction time is after evaluation time. "
                "This indicates lookahead bias in the data."
            )
    
    def _get_test_ranges(self, n_samples: int) -> List[Tuple[int, int]]:
        """
        Calculate test set ranges for each fold
        
        Args:
            n_samples: Total number of samples
            
        Returns:
            List of (start_idx, end_idx) tuples for each fold
        """
        test_size = n_samples // self.n_splits
        ranges = []
        
        for i in range(self.n_splits):
            test_start = i * test_size
            test_end = (i + 1) * test_size if i < self.n_splits - 1 else n_samples
            ranges.append((test_start, test_end))
        
        return ranges
    
    def _calculate_embargo_period(self, n_samples: int) -> timedelta:
        """
        Calculate embargo period duration
        
        Args:
            n_samples: Total number of samples
            
        Returns:
            Timedelta representing embargo period
        """
        # Embargo is a percentage of the training set size
        embargo_samples = int(n_samples * self.embargo_pct)
        # Convert to days (assuming roughly daily data)
        embargo_days = max(1, embargo_samples)
        return timedelta(days=embargo_days)
    
    def _purge_train_samples(
        self,
        indices: np.ndarray,
        test_indices: np.ndarray,
        pred_times: pd.Series,
        eval_times: pd.Series,
        test_start_time: datetime,
        test_end_time: datetime,
        embargo_td: timedelta
    ) -> np.ndarray:
        """
        Purge training samples that overlap with test period
        
        Removes training samples where:
        1. Prediction time overlaps with test period
        2. Evaluation time overlaps with test period
        3. Sample falls within embargo period after test set
        
        Args:
            indices: All sample indices
            test_indices: Test set indices
            pred_times: Series with prediction times
            eval_times: Series with evaluation times
            test_start_time: Start of test period
            test_end_time: End of test period
            embargo_td: Embargo period duration
            
        Returns:
            Array of valid training indices
        """
        # Start with all non-test indices
        train_mask = np.ones(len(indices), dtype=bool)
        train_mask[test_indices] = False
        
        # Purge samples that overlap with test period
        for idx in indices[train_mask]:
            pred_time = pred_times.iloc[idx]
            eval_time = eval_times.iloc[idx]
            
            # Check if sample overlaps with test period
            overlaps_test = (
                (pred_time >= test_start_time and pred_time <= test_end_time) or
                (eval_time >= test_start_time and eval_time <= test_end_time) or
                (pred_time <= test_start_time and eval_time >= test_end_time)
            )
            
            # Check if sample is in embargo period (after test set)
            in_embargo = (
                pred_time >= test_end_time and
                pred_time <= test_end_time + embargo_td
            )
            
            if overlaps_test or in_embargo:
                train_mask[idx] = False
        
        return indices[train_mask]
    
    def get_n_splits(self, X=None, y=None, groups=None) -> int:
        """Return the number of splitting iterations"""
        return self.n_splits


class EmbargoValidator:
    """
    Validates that embargo periods are properly enforced
    
    Performs rigorous checks to ensure no information leakage between
    train and test sets.
    """
    
    @staticmethod
    def validate_no_leakage(
        train_indices: np.ndarray,
        test_indices: np.ndarray,
        pred_times: pd.Series,
        eval_times: pd.Series,
        min_embargo_days: int = 1
    ) -> dict:
        """
        Validate that there is no information leakage between train and test
        
        Args:
            train_indices: Training set indices
            test_indices: Test set indices
            pred_times: Series with prediction times
            eval_times: Series with evaluation times
            min_embargo_days: Minimum embargo period in days
            
        Returns:
            Dict with validation results
        """
        results = {
            "valid": True,
            "issues": [],
            "warnings": [],
            "stats": {}
        }
        
        # Get time ranges
        train_pred_times = pred_times.iloc[train_indices]
        train_eval_times = eval_times.iloc[train_indices]
        test_pred_times = pred_times.iloc[test_indices]
        test_eval_times = eval_times.iloc[test_indices]
        
        # Check 1: No overlap in indices
        overlap = set(train_indices) & set(test_indices)
        if overlap:
            results["valid"] = False
            results["issues"].append(f"Index overlap detected: {len(overlap)} samples")
        
        # Check 2: Test period comes after some training data
        if train_eval_times.max() > test_pred_times.min():
            gap_days = (test_pred_times.min() - train_eval_times.max()).days
            if gap_days < min_embargo_days:
                results["warnings"].append(
                    f"Insufficient embargo period: {gap_days} days (minimum: {min_embargo_days})"
                )
        
        # Check 3: No training sample evaluated during test period
        for idx in train_indices:
            eval_time = eval_times.iloc[idx]
            if test_pred_times.min() <= eval_time <= test_eval_times.max():
                results["valid"] = False
                results["issues"].append(
                    f"Training sample {idx} evaluated during test period"
                )
                break
        
        # Collect statistics
        results["stats"] = {
            "train_size": len(train_indices),
            "test_size": len(test_indices),
            "train_time_span_days": (train_eval_times.max() - train_pred_times.min()).days,
            "test_time_span_days": (test_eval_times.max() - test_pred_times.min()).days,
            "gap_days": (test_pred_times.min() - train_eval_times.max()).days
        }
        
        return results


def create_time_series_events(
    events: List[dict],
    prediction_horizon_days: int = 7
) -> pd.DataFrame:
    """
    Create time-series events dataframe with prediction and evaluation times
    
    Args:
        events: List of event dictionaries with 'date', 'ticker', etc.
        prediction_horizon_days: Days before event to make prediction
        
    Returns:
        DataFrame with pred_time and eval_time columns
    """
    df = pd.DataFrame(events)
    
    # Convert date strings to datetime
    df['eval_time'] = pd.to_datetime(df['date'])
    
    # Prediction time is N days before evaluation
    df['pred_time'] = df['eval_time'] - pd.Timedelta(days=prediction_horizon_days)
    
    # Set index to prediction time for chronological splitting
    df = df.set_index('pred_time').sort_index()
    
    return df


# Example usage and testing
if __name__ == "__main__":
    print("=" * 80)
    print("Purged Cross-Validation Demo")
    print("=" * 80)
    
    # Create synthetic time-series data
    dates = pd.date_range(start='2023-01-01', end='2023-12-31', freq='7D')
    n_samples = len(dates)
    
    # Create feature matrix
    X = pd.DataFrame({
        'feature1': np.random.randn(n_samples),
        'feature2': np.random.randn(n_samples),
        'feature3': np.random.randn(n_samples),
    }, index=dates)
    
    # Create prediction and evaluation times
    # Predictions made 7 days before event, evaluated at event date
    pred_times = pd.Series(dates - pd.Timedelta(days=7), index=dates)
    eval_times = pd.Series(dates, index=dates)
    
    # Create target
    y = pd.Series(np.random.randn(n_samples), index=dates)
    
    # Initialize purged K-fold
    purged_cv = PurgedKFold(
        n_splits=5,
        embargo_pct=0.02,
        purge_pct=0.02
    )
    
    print(f"\nDataset: {n_samples} samples from {dates[0].date()} to {dates[-1].date()}")
    print(f"Cross-validation: {purged_cv.n_splits} folds with {purged_cv.embargo_pct*100:.1f}% embargo")
    print("\n" + "-" * 80)
    
    # Perform cross-validation
    validator = EmbargoValidator()
    
    for fold_idx, (train_idx, test_idx) in enumerate(purged_cv.split(X, y, pred_times, eval_times)):
        print(f"\nFold {fold_idx + 1}:")
        print(f"  Train: {len(train_idx):3d} samples | {X.index[train_idx[0]].date()} to {X.index[train_idx[-1]].date()}")
        print(f"  Test:  {len(test_idx):3d} samples | {X.index[test_idx[0]].date()} to {X.index[test_idx[-1]].date()}")
        
        # Validate no leakage
        validation = validator.validate_no_leakage(
            train_idx, test_idx, pred_times, eval_times, min_embargo_days=1
        )
        
        if validation["valid"]:
            print(f"  ✅ Validation passed - No information leakage detected")
        else:
            print(f"  ❌ Validation failed - Issues: {validation['issues']}")
        
        if validation["warnings"]:
            print(f"  ⚠️  Warnings: {validation['warnings']}")
        
        print(f"  Gap: {validation['stats']['gap_days']} days between train and test")
    
    print("\n" + "=" * 80)
    print("✅ Purged cross-validation demo complete!")
    print("=" * 80)

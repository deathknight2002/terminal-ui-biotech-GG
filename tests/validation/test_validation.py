"""
Tests for validation module: CV, metrics, and statistical tests.
"""

import numpy as np
import pandas as pd
import pytest
from hypothesis import given, strategies as st

from bt_platform.core.validation.cv import EventWindow, PurgedEmbargoCV
from bt_platform.core.validation.metrics import (
    brier_score,
    calculate_calmar_ratio,
    calculate_deflated_sharpe,
    calculate_information_coefficient,
    calculate_max_drawdown,
    calculate_sortino_ratio,
    expected_calibration_error,
    log_loss,
)


class TestMetrics:
    """Test probability and return quality metrics."""

    def test_brier_score_perfect(self):
        """Test Brier score for perfect predictions."""
        y_true = np.array([1, 0, 1, 0])
        y_prob = np.array([1.0, 0.0, 1.0, 0.0])
        score = brier_score(y_true, y_prob)
        assert score == 0.0

    def test_brier_score_worst(self):
        """Test Brier score for worst predictions."""
        y_true = np.array([1, 0, 1, 0])
        y_prob = np.array([0.0, 1.0, 0.0, 1.0])
        score = brier_score(y_true, y_prob)
        assert score == 1.0

    def test_brier_score_range(self):
        """Test Brier score is in valid range."""
        y_true = np.array([1, 0, 1, 0, 1])
        y_prob = np.array([0.7, 0.3, 0.8, 0.2, 0.6])
        score = brier_score(y_true, y_prob)
        assert 0.0 <= score <= 1.0

    def test_log_loss_perfect(self):
        """Test log loss for perfect predictions."""
        y_true = np.array([1, 0, 1, 0])
        y_prob = np.array([1.0, 0.0, 1.0, 0.0])
        loss = log_loss(y_true, y_prob)
        assert loss < 0.01  # Nearly zero due to epsilon

    def test_log_loss_range(self):
        """Test log loss is positive."""
        y_true = np.array([1, 0, 1, 0, 1])
        y_prob = np.array([0.7, 0.3, 0.8, 0.2, 0.6])
        loss = log_loss(y_true, y_prob)
        assert loss > 0.0

    def test_ece_perfect_calibration(self):
        """Test ECE for perfectly calibrated predictions."""
        y_true = np.array([1, 1, 0, 0, 1, 1, 0, 0, 1, 0])
        y_prob = np.array([0.7, 0.7, 0.3, 0.3, 0.7, 0.7, 0.3, 0.3, 0.7, 0.3])
        ece = expected_calibration_error(y_true, y_prob, n_bins=2)
        assert ece < 0.5  # Should be reasonably calibrated

    def test_ece_range(self):
        """Test ECE is in valid range."""
        y_true = np.random.randint(0, 2, 100)
        y_prob = np.random.rand(100)
        ece = expected_calibration_error(y_true, y_prob)
        assert 0.0 <= ece <= 1.0

    def test_deflated_sharpe(self):
        """Test Deflated Sharpe Ratio calculation."""
        # Simulate returns
        np.random.seed(42)
        returns = np.random.normal(0.001, 0.02, 252)  # Daily returns

        result = calculate_deflated_sharpe(returns, n_trials=10)

        assert "sharpe_ratio" in result
        assert "deflated_sharpe" in result
        assert "p_value" in result
        assert 0 <= result["p_value"] <= 1

    def test_information_coefficient(self):
        """Test Information Coefficient calculation."""
        predictions = np.array([1, 2, 3, 4, 5])
        actuals = np.array([1.1, 2.2, 2.9, 4.1, 4.9])
        ic = calculate_information_coefficient(predictions, actuals)
        assert 0.9 < ic <= 1.0  # Should be highly correlated

    def test_sortino_ratio(self):
        """Test Sortino ratio calculation."""
        returns = np.array([0.01, -0.02, 0.03, -0.01, 0.02])
        sortino = calculate_sortino_ratio(returns)
        assert sortino > 0  # Should be positive for positive mean

    def test_max_drawdown(self):
        """Test maximum drawdown calculation."""
        cumulative = np.array([1.0, 1.1, 1.2, 1.0, 0.9, 1.1, 1.3])
        result = calculate_max_drawdown(cumulative)
        assert "max_drawdown" in result
        assert result["max_drawdown"] < 0  # Drawdown is negative
        assert abs(result["max_drawdown"]) > 0.2  # Should detect the drawdown

    def test_calmar_ratio(self):
        """Test Calmar ratio calculation."""
        returns = np.array([0.01, -0.02, 0.03, -0.01, 0.02] * 50)
        calmar = calculate_calmar_ratio(returns)
        assert calmar > 0  # Should be positive


class TestPurgedEmbargoCV:
    """Test Purged K-Fold Cross-Validation."""

    def test_basic_split(self):
        """Test basic CV split functionality."""
        # Create sample events
        events = pd.DataFrame(
            {
                "date": pd.date_range("2020-01-01", periods=10, freq="7D"),
                "ticker": [f"TICK{i}" for i in range(10)],
            }
        )

        cv = PurgedEmbargoCV(n_splits=3, embargo_days=7)
        splits = cv.split(events)

        assert len(splits) > 0
        assert all(len(train) > 0 and len(test) > 0 for train, test in splits)

    def test_no_overlap(self):
        """Test that train and test sets don't overlap."""
        events = pd.DataFrame(
            {
                "date": pd.date_range("2020-01-01", periods=20, freq="7D"),
                "ticker": [f"TICK{i}" for i in range(20)],
            }
        )

        cv = PurgedEmbargoCV(n_splits=3, embargo_days=14)
        splits = cv.split(events)

        for train_idx, test_idx in splits:
            # No overlap
            overlap = set(train_idx) & set(test_idx)
            assert len(overlap) == 0

    def test_expanding_window(self):
        """Test expanding window mode."""
        events = pd.DataFrame(
            {
                "date": pd.date_range("2020-01-01", periods=30, freq="7D"),
                "ticker": [f"TICK{i}" for i in range(30)],
            }
        )

        cv = PurgedEmbargoCV(n_splits=3, expanding_window=True)
        splits = cv.split(events)

        # In expanding window, train size should generally increase
        train_sizes = [len(train) for train, _ in splits]
        # Allow some flexibility due to purging
        assert train_sizes[-1] >= train_sizes[0]

    def test_custom_event_windows(self):
        """Test with custom event windows."""
        from datetime import datetime, timedelta

        events = pd.DataFrame(
            {
                "date": pd.date_range("2020-01-01", periods=10, freq="7D"),
                "ticker": [f"TICK{i}" for i in range(10)],
            }
        )

        # Create custom event windows
        event_windows = []
        for idx, row in events.iterrows():
            t0 = pd.to_datetime(row["date"])
            event_windows.append(
                EventWindow(
                    event_id=idx,
                    t0=t0,
                    t_start=t0 - timedelta(days=1),
                    t_end=t0 + timedelta(days=20),
                )
            )

        cv = PurgedEmbargoCV(n_splits=3)
        splits = cv.split(events, event_windows)

        assert len(splits) > 0

    def test_get_n_splits(self):
        """Test get_n_splits method."""
        cv = PurgedEmbargoCV(n_splits=5)
        assert cv.get_n_splits() == 5


class TestPropertyBased:
    """Property-based tests using Hypothesis."""

    @given(
        st.lists(st.floats(0, 1), min_size=10, max_size=100),
        st.lists(st.integers(0, 1), min_size=10, max_size=100),
    )
    def test_brier_score_bounds(self, y_prob, y_true):
        """Property: Brier score is always in [0, 1]."""
        # Ensure same length
        min_len = min(len(y_prob), len(y_true))
        y_prob = np.array(y_prob[:min_len])
        y_true = np.array(y_true[:min_len])

        score = brier_score(y_true, y_prob)
        assert 0.0 <= score <= 1.0

    @given(st.lists(st.floats(0.01, 0.99), min_size=10, max_size=100))
    def test_ece_bounds(self, y_prob):
        """Property: ECE is always in [0, 1]."""
        y_prob = np.array(y_prob)
        y_true = np.random.randint(0, 2, len(y_prob))

        ece = expected_calibration_error(y_true, y_prob)
        assert 0.0 <= ece <= 1.0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

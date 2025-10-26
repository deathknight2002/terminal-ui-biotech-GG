"""
Unit Tests for Backtesting Engine
==================================

Tests the BacktestEngine class with various scenarios.
"""

import pytest
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from ml.backtesting.engine import BacktestEngine


class TestBacktestEngine:
    """Test cases for BacktestEngine."""

    def setup_method(self):
        """Set up test fixtures."""
        self.engine = BacktestEngine(move_threshold=0.10)

    def test_initialization(self):
        """Test that engine initializes correctly."""
        assert self.engine.move_threshold == 0.10
        assert len(self.engine.quantile_levels) > 0
        assert self.engine.min_events_per_window > 0

    def test_synthetic_data_generation(self):
        """Test synthetic data generation."""
        df = self.engine._generate_synthetic_data(
            start_date="2020-01-01",
            end_date="2021-01-01",
            n_events=100
        )

        assert len(df) == 100
        assert 'date' in df.columns
        assert 'prediction' in df.columns
        assert 'actual_move' in df.columns
        assert 'success' in df.columns

        # Check date range
        assert df['date'].min() >= pd.to_datetime("2020-01-01")
        assert df['date'].max() <= pd.to_datetime("2021-01-01")

        # Check predictions are probabilities
        assert (df['prediction'] >= 0.0).all()
        assert (df['prediction'] <= 1.0).all()

        # Check success is binary
        assert set(df['success'].unique()).issubset({0, 1})

    def test_run_backtest_basic(self):
        """Test basic backtest execution."""
        results = self.engine.run_expanding_window_backtest(
            start_date="2020-01-01",
            end_date="2021-12-31",
            min_train_days=180,
            step_days=90
        )

        assert 'num_windows' in results
        assert 'auc_pr' in results
        assert 'brier_score' in results
        assert 'spearman_ic' in results

        assert results['num_windows'] > 0
        assert 0.0 <= results['auc_pr'] <= 1.0
        assert results['brier_score'] >= 0.0

    def test_run_backtest_with_custom_data(self):
        """Test backtest with custom event data."""
        # Create custom data
        n = 200
        dates = pd.date_range(start="2020-01-01", periods=n, freq='D')
        predictions = np.random.uniform(0.3, 0.7, n)
        actual_moves = np.random.randn(n) * 0.15

        df = pd.DataFrame({
            'date': dates,
            'prediction': predictions,
            'actual_move': actual_moves
        })

        results = self.engine.run_expanding_window_backtest(
            events_df=df,
            start_date="2020-01-01",
            end_date="2020-12-31",
            min_train_days=90,
            step_days=30
        )

        assert results['num_windows'] > 0

    def test_evaluate_window(self):
        """Test single window evaluation."""
        # Create train/test data
        train_df = pd.DataFrame({
            'date': pd.date_range('2020-01-01', periods=100, freq='D'),
            'prediction': np.random.uniform(0.3, 0.7, 100),
            'actual_move': np.random.randn(100) * 0.15,
            'success': np.random.randint(0, 2, 100)
        })

        test_df = pd.DataFrame({
            'date': pd.date_range('2020-04-11', periods=30, freq='D'),
            'prediction': np.random.uniform(0.3, 0.7, 30),
            'actual_move': np.random.randn(30) * 0.15,
            'success': np.random.randint(0, 2, 30)
        })

        metrics = self.engine._evaluate_window(train_df, test_df, "2020-04-11")

        assert 'window_date' in metrics
        assert 'auc_pr' in metrics
        assert 'brier_score' in metrics
        assert 'spearman_ic' in metrics
        assert 'top_decile_hit_rate' in metrics
        assert 'long_short_ir' in metrics

        assert metrics['n_train'] == 100
        assert metrics['n_test'] == 30

    def test_aggregate_windows(self):
        """Test window aggregation."""
        # Run backtest to create windows
        self.engine.run_expanding_window_backtest(
            start_date="2020-01-01",
            end_date="2020-12-31",
            min_train_days=90,
            step_days=60
        )

        assert len(self.engine.windows) > 0

        # Aggregate
        results = self.engine._aggregate_windows()

        assert 'num_windows' in results
        assert 'auc_pr' in results
        assert 'auc_pr_std' in results
        assert results['num_windows'] == len(self.engine.windows)

    def test_get_summary_report(self):
        """Test summary report generation."""
        # Run backtest first
        self.engine.run_expanding_window_backtest(
            start_date="2020-01-01",
            end_date="2020-12-31",
            min_train_days=90,
            step_days=60
        )

        report = self.engine.get_summary_report()

        assert isinstance(report, str)
        assert 'BACKTEST SUMMARY' in report
        assert 'AUC-PR' in report
        assert 'Brier Score' in report

    def test_summary_report_before_backtest(self):
        """Test that summary returns message before backtest."""
        report = self.engine.get_summary_report()

        assert 'No backtest results' in report

    def test_different_thresholds(self):
        """Test with different move thresholds."""
        engine_low = BacktestEngine(move_threshold=0.05)
        engine_high = BacktestEngine(move_threshold=0.20)

        results_low = engine_low.run_expanding_window_backtest(
            start_date="2020-01-01",
            end_date="2020-12-31",
            min_train_days=90,
            step_days=60
        )

        results_high = engine_high.run_expanding_window_backtest(
            start_date="2020-01-01",
            end_date="2020-12-31",
            min_train_days=90,
            step_days=60
        )

        # Both should complete
        assert results_low['num_windows'] > 0
        assert results_high['num_windows'] > 0

    def test_expanding_window_progression(self):
        """Test that windows expand correctly."""
        results = self.engine.run_expanding_window_backtest(
            start_date="2020-01-01",
            end_date="2020-12-31",
            min_train_days=90,
            step_days=60
        )

        # Check that training set grows
        train_sizes = [w['n_train'] for w in self.engine.windows]

        # Training set should generally increase (expanding window)
        assert len(train_sizes) > 1
        # Allow for some variation but trend should be increasing
        assert train_sizes[-1] >= train_sizes[0]

    def test_metrics_bounds(self):
        """Test that metrics are within expected bounds."""
        results = self.engine.run_expanding_window_backtest(
            start_date="2020-01-01",
            end_date="2020-12-31",
            min_train_days=90,
            step_days=60
        )

        # AUC-PR should be in [0, 1]
        assert 0.0 <= results['auc_pr'] <= 1.0

        # Brier score should be >= 0
        assert results['brier_score'] >= 0.0

        # Spearman IC should be in [-1, 1]
        assert -1.0 <= results['spearman_ic'] <= 1.0

        # Hit rate should be in [0, 1]
        assert 0.0 <= results['top_decile_hit_rate'] <= 1.0

    def test_insufficient_data(self):
        """Test behavior with insufficient data."""
        # Very short time period with small windows
        df = self.engine._generate_synthetic_data(
            start_date="2020-01-01",
            end_date="2020-01-31",
            n_events=20
        )

        results = self.engine.run_expanding_window_backtest(
            events_df=df,
            start_date="2020-01-01",
            end_date="2020-01-31",
            min_train_days=10,
            step_days=5
        )

        # Should complete even with limited data (may have 0 windows)
        assert isinstance(results, dict)
        assert results.get('num_windows', 0) >= 0

    def test_perfect_predictions(self):
        """Test with perfect predictions."""
        n = 100
        dates = pd.date_range(start="2020-01-01", periods=n, freq='D')

        # Perfect predictions
        actual_moves = np.random.randn(n) * 0.15
        success = (np.abs(actual_moves) >= 0.10).astype(int)
        predictions = success.astype(float)  # Perfect prediction

        df = pd.DataFrame({
            'date': dates,
            'prediction': predictions,
            'actual_move': actual_moves,
            'success': success
        })

        results = self.engine.run_expanding_window_backtest(
            events_df=df,
            start_date="2020-01-01",
            end_date="2020-04-30",
            min_train_days=30,
            step_days=20
        )

        # Should have high performance with perfect predictions
        assert results['auc_pr'] > 0.8
        assert results['brier_score'] < 0.3

    def test_random_predictions(self):
        """Test with random predictions."""
        n = 100
        dates = pd.date_range(start="2020-01-01", periods=n, freq='D')

        # Random predictions (no signal)
        predictions = np.random.uniform(0, 1, n)
        actual_moves = np.random.randn(n) * 0.15
        success = (np.abs(actual_moves) >= 0.10).astype(int)

        df = pd.DataFrame({
            'date': dates,
            'prediction': predictions,
            'actual_move': actual_moves,
            'success': success
        })

        results = self.engine.run_expanding_window_backtest(
            events_df=df,
            start_date="2020-01-01",
            end_date="2020-04-30",
            min_train_days=30,
            step_days=20
        )

        # Performance should be around random (AUC-PR ~ base rate)
        # Just check that it completes and returns valid metrics
        assert 0.0 <= results['auc_pr'] <= 1.0


class TestBacktestInputValidation:
    """Test input validation for BacktestEngine."""

    def test_missing_required_columns(self):
        """Test error when required columns are missing."""
        engine = BacktestEngine()

        # Missing 'prediction' column
        df = pd.DataFrame({
            'date': pd.date_range('2020-01-01', periods=10, freq='D'),
            'actual_move': np.random.randn(10) * 0.15
        })

        with pytest.raises(ValueError, match="Missing required columns"):
            engine.run_expanding_window_backtest(
                events_df=df,
                start_date="2020-01-01",
                end_date="2020-01-31"
            )

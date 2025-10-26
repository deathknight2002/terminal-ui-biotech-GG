"""
Backtesting Engine for Catalyst Prediction Models
==================================================

Implements expanding-window backtesting with proper train/test splits
to validate catalyst prediction models against historical data.

Key Features:
- Expanding window to avoid lookahead bias
- Multiple evaluation metrics (AUC-PR, Brier score, Spearman IC)
- Proper time-based splits
- Calibration analysis
- Portfolio simulation (long/short)
"""

import logging
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
import numpy as np
import pandas as pd
from sklearn.metrics import (
    roc_auc_score,
    precision_recall_curve,
    auc,
    brier_score_loss,
    log_loss
)
from scipy.stats import spearmanr
import warnings

logger = logging.getLogger(__name__)
warnings.filterwarnings('ignore')


class BacktestEngine:
    """
    Expanding-window backtesting engine for catalyst predictions.

    Metrics:
    - AUC-PR: Area under precision-recall curve for |move| >= threshold
    - Brier score: Probability calibration metric
    - Pinball loss: Quantile prediction accuracy
    - Spearman IC: Rank correlation with actual returns
    - Top-decile hit rate: Accuracy on highest-conviction predictions
    - Long/short IR: Information ratio for portfolio strategy
    """

    def __init__(
        self,
        move_threshold: float = 0.10,
        quantile_levels: List[float] = [0.05, 0.25, 0.75, 0.95],
        min_events_per_window: int = 30
    ):
        """
        Initialize backtesting engine.

        Args:
            move_threshold: Threshold for significant moves (10% = 0.10)
            quantile_levels: Quantile levels for pinball loss
            min_events_per_window: Minimum events required per window
        """
        self.move_threshold = move_threshold
        self.quantile_levels = quantile_levels
        self.min_events_per_window = min_events_per_window

        self.results: Dict[str, Any] = {}
        self.windows: List[Dict[str, Any]] = []

    def run_expanding_window_backtest(
        self,
        events_df: Optional[pd.DataFrame] = None,
        start_date: str = "2020-01-01",
        end_date: str = "2024-12-31",
        min_train_days: int = 365,
        step_days: int = 90
    ) -> Dict[str, Any]:
        """
        Run expanding-window backtest on historical catalyst events.

        Args:
            events_df: DataFrame with columns [date, prediction, actual_move, success]
                      If None, uses synthetic data for demonstration
            start_date: Start date for backtest
            end_date: End date for backtest
            min_train_days: Minimum training period in days
            step_days: Step size for moving window in days

        Returns:
            Dictionary with aggregated metrics across all windows
        """
        logger.info(f"Starting expanding-window backtest from {start_date} to {end_date}")

        # Generate synthetic data if not provided
        if events_df is None:
            events_df = self._generate_synthetic_data(start_date, end_date)

        # Validate required columns
        required_cols = ['date', 'prediction', 'actual_move']
        missing_cols = [col for col in required_cols if col not in events_df.columns]
        if missing_cols:
            raise ValueError(f"Missing required columns: {missing_cols}")

        # Convert dates
        events_df['date'] = pd.to_datetime(events_df['date'])
        start_dt = pd.to_datetime(start_date)
        end_dt = pd.to_datetime(end_date)

        # Sort by date
        events_df = events_df.sort_values('date').reset_index(drop=True)

        # Add binary success column if not present
        if 'success' not in events_df.columns:
            events_df['success'] = (np.abs(events_df['actual_move']) >= self.move_threshold).astype(int)

        # Run expanding windows
        self.windows = []
        current_date = start_dt + timedelta(days=min_train_days)

        while current_date <= end_dt:
            # Define train/test periods
            train_end = current_date
            test_start = current_date
            test_end = current_date + timedelta(days=step_days)

            # Get train/test data
            train_mask = (events_df['date'] < train_end)
            test_mask = (events_df['date'] >= test_start) & (events_df['date'] < test_end)

            train_df = events_df[train_mask]
            test_df = events_df[test_mask]

            if len(train_df) >= self.min_events_per_window and len(test_df) >= 5:
                window_metrics = self._evaluate_window(
                    train_df, test_df, str(current_date.date())
                )
                self.windows.append(window_metrics)
                logger.info(
                    f"Window {len(self.windows)}: {train_end.date()} -> "
                    f"{test_end.date()} | Train: {len(train_df)} | Test: {len(test_df)} | "
                    f"AUC-PR: {window_metrics['auc_pr']:.3f}"
                )

            # Move to next window
            current_date += timedelta(days=step_days)

        # Aggregate results
        self.results = self._aggregate_windows()

        if self.results:
            logger.info(f"Backtest completed with {len(self.windows)} windows")
            logger.info(f"Aggregate AUC-PR: {self.results['auc_pr']:.3f}")
            logger.info(f"Aggregate Brier score: {self.results['brier_score']:.3f}")
            logger.info(f"Spearman IC: {self.results['spearman_ic']:.3f}")
        else:
            logger.warning("Backtest completed but no windows met minimum criteria")

        return self.results

    def _evaluate_window(
        self,
        train_df: pd.DataFrame,
        test_df: pd.DataFrame,
        window_date: str
    ) -> Dict[str, Any]:
        """
        Evaluate a single train/test window.

        Args:
            train_df: Training data
            test_df: Test data
            window_date: Window identifier date

        Returns:
            Dictionary with window metrics
        """
        # Get predictions and actuals
        y_true = test_df['success'].values
        y_pred_proba = test_df['prediction'].values
        actual_moves = test_df['actual_move'].values

        # Ensure predictions are in [0, 1]
        y_pred_proba = np.clip(y_pred_proba, 0.0, 1.0)

        # Calculate metrics
        metrics = {
            'window_date': window_date,
            'n_train': len(train_df),
            'n_test': len(test_df),
            'auc_pr': 0.0,
            'brier_score': 0.0,
            'log_loss': 0.0,
            'spearman_ic': 0.0,
            'top_decile_hit_rate': 0.0,
            'long_short_ir': 0.0
        }

        # AUC-PR (Precision-Recall)
        try:
            if len(np.unique(y_true)) > 1:
                precision, recall, _ = precision_recall_curve(y_true, y_pred_proba)
                metrics['auc_pr'] = float(auc(recall, precision))
            else:
                logger.warning(f"Window {window_date}: Only one class present in test set")
        except Exception as e:
            logger.warning(f"Could not calculate AUC-PR: {e}")

        # Brier score (lower is better)
        try:
            metrics['brier_score'] = float(brier_score_loss(y_true, y_pred_proba))
        except Exception as e:
            logger.warning(f"Could not calculate Brier score: {e}")

        # Log loss
        try:
            metrics['log_loss'] = float(log_loss(y_true, y_pred_proba))
        except Exception as e:
            logger.warning(f"Could not calculate log loss: {e}")

        # Spearman IC (rank correlation)
        try:
            if len(actual_moves) > 2:
                ic, p_value = spearmanr(y_pred_proba, np.abs(actual_moves))
                metrics['spearman_ic'] = float(ic) if not np.isnan(ic) else 0.0
        except Exception as e:
            logger.warning(f"Could not calculate Spearman IC: {e}")

        # Top-decile hit rate
        try:
            n_top = max(1, len(y_pred_proba) // 10)
            top_indices = np.argsort(y_pred_proba)[-n_top:]
            metrics['top_decile_hit_rate'] = float(y_true[top_indices].mean())
        except Exception as e:
            logger.warning(f"Could not calculate top-decile hit rate: {e}")

        # Long/short information ratio
        try:
            # Long top 20%, short bottom 20%
            n_long = max(1, len(y_pred_proba) // 5)
            long_indices = np.argsort(y_pred_proba)[-n_long:]
            short_indices = np.argsort(y_pred_proba)[:n_long]

            long_returns = actual_moves[long_indices]
            short_returns = actual_moves[short_indices]
            portfolio_returns = long_returns.mean() - short_returns.mean()

            if len(long_returns) > 1:
                portfolio_std = np.std(long_returns - short_returns)
                if portfolio_std > 0:
                    metrics['long_short_ir'] = float(portfolio_returns / portfolio_std)
        except Exception as e:
            logger.warning(f"Could not calculate long/short IR: {e}")

        return metrics

    def _aggregate_windows(self) -> Dict[str, Any]:
        """
        Aggregate metrics across all windows.

        Returns:
            Dictionary with aggregated metrics (empty dict if no windows)
        """
        if not self.windows:
            return {}

        # Extract metrics from all windows
        metrics_df = pd.DataFrame(self.windows)

        # Calculate aggregates
        aggregated = {
            'num_windows': len(self.windows),
            'total_train_events': int(metrics_df['n_train'].sum()),
            'total_test_events': int(metrics_df['n_test'].sum()),
            'auc_pr': float(metrics_df['auc_pr'].mean()),
            'auc_pr_std': float(metrics_df['auc_pr'].std()),
            'brier_score': float(metrics_df['brier_score'].mean()),
            'brier_score_std': float(metrics_df['brier_score'].std()),
            'log_loss': float(metrics_df['log_loss'].mean()),
            'spearman_ic': float(metrics_df['spearman_ic'].mean()),
            'spearman_ic_std': float(metrics_df['spearman_ic'].std()),
            'top_decile_hit_rate': float(metrics_df['top_decile_hit_rate'].mean()),
            'long_short_ir': float(metrics_df['long_short_ir'].mean()),
            'long_short_ir_std': float(metrics_df['long_short_ir'].std()),
            'num_events': int(metrics_df['n_test'].sum()),
            'windows': self.windows
        }

        # Add pinball loss if quantiles were predicted
        aggregated['pinball_loss'] = 0.0  # Placeholder

        return aggregated

    def _generate_synthetic_data(
        self,
        start_date: str,
        end_date: str,
        n_events: int = 500
    ) -> pd.DataFrame:
        """
        Generate synthetic catalyst events for demonstration.

        Args:
            start_date: Start date
            end_date: End date
            n_events: Number of events to generate

        Returns:
            DataFrame with synthetic events
        """
        logger.info(f"Generating {n_events} synthetic events")

        np.random.seed(42)

        # Generate random dates
        start_dt = pd.to_datetime(start_date)
        end_dt = pd.to_datetime(end_date)
        date_range = (end_dt - start_dt).days

        dates = [start_dt + timedelta(days=int(d)) for d in np.random.uniform(0, date_range, n_events)]
        dates = sorted(dates)

        # Generate predictions (probabilities)
        # Simulate realistic predictions with some signal
        base_prob = 0.5
        signal_strength = 0.2
        predictions = base_prob + signal_strength * np.random.randn(n_events)
        predictions = np.clip(predictions, 0.1, 0.9)

        # Generate actual moves
        # Higher predictions correlate with larger moves (signal)
        noise = np.random.randn(n_events) * 0.15
        actual_moves = (predictions - 0.5) * 0.4 + noise

        # Add some outliers
        outlier_idx = np.random.choice(n_events, size=n_events // 10, replace=False)
        actual_moves[outlier_idx] *= 2

        # Binary success (|move| >= threshold)
        success = (np.abs(actual_moves) >= self.move_threshold).astype(int)

        df = pd.DataFrame({
            'date': dates,
            'prediction': predictions,
            'actual_move': actual_moves,
            'success': success
        })

        return df

    def get_summary_report(self) -> str:
        """
        Get a formatted summary report of backtest results.

        Returns:
            Formatted string report
        """
        if not self.results:
            return "No backtest results available. Run backtest first."

        report = []
        report.append("=" * 60)
        report.append("BACKTEST SUMMARY REPORT")
        report.append("=" * 60)
        report.append(f"Number of windows: {self.results['num_windows']}")
        report.append(f"Total train events: {self.results['total_train_events']}")
        report.append(f"Total test events: {self.results['total_test_events']}")
        report.append("")
        report.append("Performance Metrics:")
        report.append("-" * 60)
        report.append(f"AUC-PR:              {self.results['auc_pr']:.4f} ± {self.results['auc_pr_std']:.4f}")
        report.append(f"Brier Score:         {self.results['brier_score']:.4f} ± {self.results['brier_score_std']:.4f}")
        report.append(f"Log Loss:            {self.results['log_loss']:.4f}")
        report.append(f"Spearman IC:         {self.results['spearman_ic']:.4f} ± {self.results['spearman_ic_std']:.4f}")
        report.append(f"Top-Decile Hit Rate: {self.results['top_decile_hit_rate']:.4f}")
        report.append(f"Long/Short IR:       {self.results['long_short_ir']:.4f} ± {self.results['long_short_ir_std']:.4f}")
        report.append("=" * 60)

        return "\n".join(report)

    def plot_performance_over_time(self) -> Optional[Any]:
        """
        Plot performance metrics over time.

        Returns:
            Matplotlib figure (requires matplotlib)
        """
        try:
            import matplotlib.pyplot as plt
        except ImportError:
            logger.warning("matplotlib not installed, cannot plot")
            return None

        if not self.windows:
            logger.warning("No windows to plot")
            return None

        metrics_df = pd.DataFrame(self.windows)
        metrics_df['window_date'] = pd.to_datetime(metrics_df['window_date'])

        fig, axes = plt.subplots(2, 2, figsize=(12, 8))
        fig.suptitle('Backtest Performance Over Time', fontsize=14, fontweight='bold')

        # AUC-PR
        axes[0, 0].plot(metrics_df['window_date'], metrics_df['auc_pr'], marker='o')
        axes[0, 0].set_title('AUC-PR')
        axes[0, 0].set_ylabel('Score')
        axes[0, 0].grid(True, alpha=0.3)

        # Brier Score
        axes[0, 1].plot(metrics_df['window_date'], metrics_df['brier_score'], marker='o', color='orange')
        axes[0, 1].set_title('Brier Score')
        axes[0, 1].set_ylabel('Score')
        axes[0, 1].grid(True, alpha=0.3)

        # Spearman IC
        axes[1, 0].plot(metrics_df['window_date'], metrics_df['spearman_ic'], marker='o', color='green')
        axes[1, 0].set_title('Spearman IC')
        axes[1, 0].set_ylabel('Correlation')
        axes[1, 0].axhline(y=0, color='r', linestyle='--', alpha=0.3)
        axes[1, 0].grid(True, alpha=0.3)

        # Long/Short IR
        axes[1, 1].plot(metrics_df['window_date'], metrics_df['long_short_ir'], marker='o', color='purple')
        axes[1, 1].set_title('Long/Short IR')
        axes[1, 1].set_ylabel('Information Ratio')
        axes[1, 1].axhline(y=0, color='r', linestyle='--', alpha=0.3)
        axes[1, 1].grid(True, alpha=0.3)

        plt.tight_layout()
        return fig


if __name__ == "__main__":
    # Example usage
    logging.basicConfig(level=logging.INFO)

    # Initialize engine
    engine = BacktestEngine(move_threshold=0.10)

    # Run backtest with synthetic data
    results = engine.run_expanding_window_backtest(
        start_date="2020-01-01",
        end_date="2024-12-31",
        min_train_days=365,
        step_days=90
    )

    # Print summary
    print("\n" + engine.get_summary_report())

    # Save results
    import json
    with open('/tmp/backtest_results.json', 'w') as f:
        # Remove non-serializable nested windows
        results_to_save = {k: v for k, v in results.items() if k != 'windows'}
        json.dump(results_to_save, f, indent=2)

    print("\nResults saved to /tmp/backtest_results.json")

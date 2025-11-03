"""
Cross-validation with purging and embargo for time-series event data.

Implements López de Prado's purged k-fold cross-validation with embargo periods
to prevent lookahead bias in event-driven backtesting.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any

import numpy as np
import pandas as pd


@dataclass
class EventWindow:
    """Event window with start and end timestamps."""

    event_id: str | int
    t0: datetime  # Event timestamp
    t_start: datetime  # Window start (e.g., t0 - 1 day)
    t_end: datetime  # Window end (e.g., t0 + 20 days)


class PurgedEmbargoCV:
    """
    Purged K-Fold Cross-Validation with Embargo.

    Implements walk-forward cross-validation with:
    - Purging: Remove training samples that overlap with test periods
    - Embargo: Additional buffer after test period to prevent leakage
    - Expanding window: Train on all data up to test period

    Args:
        n_splits: Number of CV splits
        embargo_days: Embargo period in days (default: max event window * 1.5)
        test_size: Fraction of data for testing in each split
        expanding_window: If True, use expanding window; else rolling window

    Example:
        >>> cv = PurgedEmbargoCV(n_splits=5, embargo_days=30)
        >>> for train_idx, test_idx in cv.split(events, event_windows):
        ...     # train_idx and test_idx are non-overlapping
        ...     train_events = events[train_idx]
        ...     test_events = events[test_idx]
    """

    def __init__(
        self,
        n_splits: int = 5,
        embargo_days: int | None = None,
        test_size: float = 0.2,
        expanding_window: bool = True,
    ):
        self.n_splits = n_splits
        self.embargo_days = embargo_days
        self.test_size = test_size
        self.expanding_window = expanding_window

    def _calculate_embargo(self, event_windows: list[EventWindow]) -> int:
        """Calculate embargo period from event windows."""
        if self.embargo_days is not None:
            return self.embargo_days

        # Calculate max event window duration
        max_window = max(
            (ew.t_end - ew.t_start).days for ew in event_windows if ew.t_end > ew.t_start
        )
        # Embargo = max window * 1.5
        return int(max_window * 1.5)

    def split(
        self,
        events: pd.DataFrame | list[dict[str, Any]],
        event_windows: list[EventWindow] | None = None,
    ) -> list[tuple[np.ndarray, np.ndarray]]:
        """
        Generate train/test splits with purging and embargo.

        Args:
            events: DataFrame or list of event dictionaries with 'date' field
            event_windows: Optional list of EventWindow objects; if None, inferred

        Returns:
            List of (train_indices, test_indices) tuples

        Raises:
            ValueError: If events don't have required date field
        """
        # Convert to DataFrame if needed
        if isinstance(events, list):
            events_df = pd.DataFrame(events)
        else:
            events_df = events.copy()

        # Ensure we have date column
        if "date" not in events_df.columns:
            raise ValueError("Events must have 'date' column")

        # Convert dates to datetime
        events_df["date"] = pd.to_datetime(events_df["date"])
        events_df = events_df.sort_values("date").reset_index(drop=True)

        # If no event windows provided, create default ones
        if event_windows is None:
            event_windows = self._create_default_windows(events_df)

        # Calculate embargo period
        embargo_days = self._calculate_embargo(event_windows)

        # Create mapping from event index to window
        idx_to_window = {i: ew for i, ew in enumerate(event_windows)}

        # Split into temporal folds
        n_events = len(events_df)
        test_fold_size = int(n_events * self.test_size)

        splits = []
        for fold_idx in range(self.n_splits):
            # Define test period
            test_start_idx = fold_idx * test_fold_size
            test_end_idx = min(test_start_idx + test_fold_size, n_events)

            if test_start_idx >= n_events:
                break

            # Get test indices
            test_indices = np.arange(test_start_idx, test_end_idx)

            # Get test period start and end dates
            test_start_date = events_df.iloc[test_start_idx]["date"]
            test_end_date = events_df.iloc[test_end_idx - 1]["date"]

            # Apply embargo
            embargo_end_date = test_end_date + timedelta(days=embargo_days)

            # Determine train indices with purging
            train_indices = []
            for idx in range(n_events):
                if idx in test_indices:
                    continue

                # Get event window
                ew = idx_to_window[idx]

                # Purge if overlaps with test period
                if self._overlaps_with_test(ew, test_start_date, embargo_end_date):
                    continue

                # For expanding window, only use data before test
                if self.expanding_window and ew.t0 >= test_start_date:
                    continue

                train_indices.append(idx)

            train_indices = np.array(train_indices, dtype=int)

            if len(train_indices) > 0 and len(test_indices) > 0:
                splits.append((train_indices, test_indices))

        return splits

    def _create_default_windows(self, events_df: pd.DataFrame) -> list[EventWindow]:
        """Create default event windows: [t0-1day, t0+20days]."""
        windows = []
        for idx, row in events_df.iterrows():
            t0 = pd.to_datetime(row["date"])
            windows.append(
                EventWindow(
                    event_id=idx,
                    t0=t0,
                    t_start=t0 - timedelta(days=1),
                    t_end=t0 + timedelta(days=20),
                )
            )
        return windows

    def _overlaps_with_test(
        self, event_window: EventWindow, test_start: datetime, embargo_end: datetime
    ) -> bool:
        """Check if event window overlaps with test period + embargo."""
        # Event window overlaps if its end is after test start and before embargo end
        return event_window.t_end >= test_start and event_window.t_start <= embargo_end

    def get_n_splits(self) -> int:
        """Return the number of splits."""
        return self.n_splits

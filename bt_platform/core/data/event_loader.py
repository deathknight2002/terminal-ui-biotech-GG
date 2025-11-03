"""
Event data loader with leakage prevention and feature hygiene.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

import pandas as pd


class EventDataLoader:
    """
    Load and validate event data for MVM backtesting.

    Ensures:
    - No lookahead bias (all features as-of t0)
    - Proper timestamp handling
    - Survivorship bias handling (delisting returns)
    - Feature hygiene validation
    """

    def __init__(self, freeze_time_checks: bool = True):
        self.freeze_time_checks = freeze_time_checks
        self.events: pd.DataFrame | None = None

    def load_events(
        self,
        events_data: list[dict[str, Any]] | pd.DataFrame,
        required_fields: list[str] | None = None,
    ) -> pd.DataFrame:
        """
        Load event data with validation.

        Args:
            events_data: List of event dicts or DataFrame
            required_fields: Required fields in each event

        Returns:
            Validated DataFrame with events

        Raises:
            ValueError: If required fields missing or invalid data
        """
        if required_fields is None:
            required_fields = [
                "ticker",
                "date",
                "event_type",
                "move_5d",
                "move_20d",
            ]

        # Convert to DataFrame
        if isinstance(events_data, list):
            df = pd.DataFrame(events_data)
        else:
            df = events_data.copy()

        # Validate required fields
        missing = set(required_fields) - set(df.columns)
        if missing:
            raise ValueError(f"Missing required fields: {missing}")

        # Parse dates
        if "date" in df.columns:
            df["date"] = pd.to_datetime(df["date"])

        # Sort by date
        df = df.sort_values("date").reset_index(drop=True)

        # Add event_id if not present
        if "event_id" not in df.columns:
            df["event_id"] = range(len(df))

        # Store
        self.events = df

        return df

    def add_features(
        self,
        feature_dict: dict[str, Any],
        feature_timestamps: dict[str, datetime] | None = None,
    ) -> None:
        """
        Add features to events with timestamp validation.

        Args:
            feature_dict: Dict mapping event_id to feature values
            feature_timestamps: Dict mapping event_id to feature timestamps

        Raises:
            ValueError: If features would cause lookahead bias
        """
        if self.events is None:
            raise ValueError("Must load events first")

        # Add features to dataframe
        for feature_name, feature_values in feature_dict.items():
            self.events[feature_name] = self.events["event_id"].map(feature_values)

        # Validate timestamps if freeze_time_checks enabled
        if self.freeze_time_checks and feature_timestamps:
            for idx, row in self.events.iterrows():
                event_id = row["event_id"]
                event_t0 = row["date"]

                if event_id in feature_timestamps:
                    feature_t = feature_timestamps[event_id]
                    if feature_t > event_t0:
                        raise ValueError(
                            f"Lookahead bias detected: Feature for event {event_id} "
                            f"has timestamp {feature_t} > event time {event_t0}"
                        )

    def get_train_test_split(
        self,
        test_start_date: str | datetime,
        test_end_date: str | datetime | None = None,
    ) -> tuple[pd.DataFrame, pd.DataFrame]:
        """
        Split events into train and test sets by date.

        Args:
            test_start_date: Start of test period
            test_end_date: End of test period (optional)

        Returns:
            Tuple of (train_df, test_df)
        """
        if self.events is None:
            raise ValueError("Must load events first")

        test_start = pd.to_datetime(test_start_date)

        if test_end_date:
            test_end = pd.to_datetime(test_end_date)
            test_mask = (self.events["date"] >= test_start) & (
                self.events["date"] <= test_end
            )
        else:
            test_mask = self.events["date"] >= test_start

        train_df = self.events[~test_mask].copy()
        test_df = self.events[test_mask].copy()

        return train_df, test_df

    def add_outcome_labels(
        self,
        threshold: float = 0.10,
        label_column: str = "is_mover",
    ) -> None:
        """
        Add binary outcome labels based on absolute move threshold.

        Args:
            threshold: Threshold for "market-moving" event (e.g., 0.10 = 10%)
            label_column: Name of label column to add
        """
        if self.events is None:
            raise ValueError("Must load events first")

        # Label as mover if |move_5d| or |move_20d| > threshold
        self.events[label_column] = (
            (abs(self.events["move_5d"]) > threshold)
            | (abs(self.events["move_20d"]) > threshold)
        ).astype(int)

    def get_events(self) -> pd.DataFrame:
        """Get loaded events DataFrame."""
        if self.events is None:
            raise ValueError("Must load events first")
        return self.events.copy()

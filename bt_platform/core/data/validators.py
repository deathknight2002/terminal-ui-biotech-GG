"""
Feature hygiene validators and leakage detection.
"""

from __future__ import annotations

from datetime import datetime

import pandas as pd


class FeatureHygieneValidator:
    """
    Validate feature hygiene to prevent lookahead bias.

    Checks:
    - All feature timestamps <= event timestamp
    - No NaN/Inf in critical features
    - PSI within acceptable bounds for train/test
    """

    @staticmethod
    def check_leakage(
        events: pd.DataFrame,
        feature_timestamps: dict[int, datetime] | None = None,
    ) -> dict[str, bool | list[int]]:
        """
        Check for lookahead bias in features.

        Args:
            events: DataFrame with events and features
            feature_timestamps: Dict mapping event_id to feature timestamp

        Returns:
            Dict with has_leakage flag and list of violating event_ids
        """
        violations = []

        if feature_timestamps:
            for idx, row in events.iterrows():
                event_id = row.get("event_id", idx)
                event_t0 = pd.to_datetime(row["date"])

                if event_id in feature_timestamps:
                    feature_t = feature_timestamps[event_id]
                    if pd.to_datetime(feature_t) > event_t0:
                        violations.append(int(event_id))

        return {
            "has_leakage": len(violations) > 0,
            "violating_events": violations,
            "n_violations": len(violations),
        }

    @staticmethod
    def check_missing_values(
        events: pd.DataFrame,
        critical_features: list[str],
        max_missing_pct: float = 0.05,
    ) -> dict[str, Any]:
        """
        Check for missing values in critical features.

        Args:
            events: DataFrame with events
            critical_features: List of critical feature names
            max_missing_pct: Max acceptable missing %

        Returns:
            Dict with validation results
        """
        results = {}
        violations = []

        for feature in critical_features:
            if feature not in events.columns:
                violations.append(f"{feature}: column not found")
                continue

            missing_pct = events[feature].isna().sum() / len(events)
            results[feature] = {
                "missing_count": int(events[feature].isna().sum()),
                "missing_pct": float(missing_pct),
                "passes": missing_pct <= max_missing_pct,
            }

            if missing_pct > max_missing_pct:
                violations.append(
                    f"{feature}: {missing_pct:.1%} missing > {max_missing_pct:.1%}"
                )

        return {
            "passes": len(violations) == 0,
            "violations": violations,
            "feature_results": results,
        }

    @staticmethod
    def check_psi_stability(
        train: pd.DataFrame,
        test: pd.DataFrame,
        features: list[str],
        psi_threshold: float = 0.2,
    ) -> dict[str, Any]:
        """
        Check PSI between train and test for feature stability.

        Args:
            train: Training DataFrame
            test: Test DataFrame
            features: Features to check
            psi_threshold: PSI threshold for stability

        Returns:
            Dict with PSI results per feature
        """
        from ..monitoring.drift import psi

        results = {}
        violations = []

        for feature in features:
            if feature not in train.columns or feature not in test.columns:
                continue

            # Remove NaN
            train_vals = train[feature].dropna().values
            test_vals = test[feature].dropna().values

            if len(train_vals) == 0 or len(test_vals) == 0:
                continue

            psi_result = psi(train_vals, test_vals)
            results[feature] = psi_result

            if psi_result["alert"]:
                violations.append(
                    f"{feature}: PSI {psi_result['psi']:.3f} > {psi_threshold}"
                )

        return {
            "passes": len(violations) == 0,
            "violations": violations,
            "psi_results": results,
        }


def check_leakage(
    events: pd.DataFrame,
    feature_timestamps: dict[int, datetime] | None = None,
) -> bool:
    """
    Convenience function to check for leakage.

    Args:
        events: DataFrame with events
        feature_timestamps: Optional timestamp mapping

    Returns:
        True if no leakage detected

    Raises:
        ValueError: If leakage detected
    """
    result = FeatureHygieneValidator.check_leakage(events, feature_timestamps)

    if result["has_leakage"]:
        raise ValueError(
            f"Lookahead bias detected in {result['n_violations']} events: "
            f"{result['violating_events'][:10]}"
        )

    return True


from typing import Any

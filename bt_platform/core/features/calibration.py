"""
Probability calibration for MVM scores.

Implements Platt scaling and isotonic regression for score-to-probability conversion.
"""

from __future__ import annotations

from typing import Literal

import numpy as np
from sklearn.isotonic import IsotonicRegression
from sklearn.linear_model import LogisticRegression


class ProbCalibrator:
    """
    Calibrate raw scores to probabilities using Platt scaling or isotonic regression.

    Example:
        >>> calibrator = ProbCalibrator()
        >>> calibrator.fit(scores, outcomes, method='auto')
        >>> probs = calibrator.predict_proba(new_scores)
    """

    def __init__(self) -> None:
        self.method: str | None = None
        self.platt_model: LogisticRegression | None = None
        self.iso_model: IsotonicRegression | None = None
        self.score_min: float = 0.0
        self.score_max: float = 100.0

    def fit(
        self,
        scores: np.ndarray,
        y: np.ndarray,
        method: Literal["platt", "isotonic", "auto"] = "auto",
    ) -> ProbCalibrator:
        """
        Fit calibration model.

        Args:
            scores: Raw MVM scores (0-100)
            y: Binary outcomes (0 or 1)
            method: Calibration method ('platt', 'isotonic', or 'auto')

        Returns:
            Self for chaining
        """
        scores = np.asarray(scores).reshape(-1, 1)
        y = np.asarray(y)

        # Store score range
        self.score_min = float(np.min(scores))
        self.score_max = float(np.max(scores))

        # Fit Platt scaling (logistic regression)
        self.platt_model = LogisticRegression(random_state=42, max_iter=1000)
        self.platt_model.fit(scores, y)

        # Fit isotonic regression
        self.iso_model = IsotonicRegression(out_of_bounds="clip")
        self.iso_model.fit(scores.ravel(), y)

        # Choose best method based on log loss if 'auto'
        if method == "auto":
            from ..validation.metrics import log_loss

            platt_probs = self.platt_model.predict_proba(scores)[:, 1]
            iso_probs = self.iso_model.predict(scores.ravel())

            platt_loss = log_loss(y, platt_probs)
            iso_loss = log_loss(y, iso_probs)

            self.method = "platt" if platt_loss <= iso_loss else "isotonic"
        else:
            self.method = method

        return self

    def predict_proba(self, scores: np.ndarray) -> np.ndarray:
        """
        Convert scores to calibrated probabilities.

        Args:
            scores: Raw MVM scores (0-100)

        Returns:
            Calibrated probabilities [0, 1]
        """
        if self.method is None:
            raise ValueError("Calibrator not fitted. Call fit() first.")

        scores = np.asarray(scores).reshape(-1, 1)

        if self.method == "platt":
            probs = self.platt_model.predict_proba(scores)[:, 1]
        elif self.method == "isotonic":
            probs = self.iso_model.predict(scores.ravel())
        else:
            raise ValueError(f"Unknown method: {self.method}")

        # Ensure valid probabilities
        return np.clip(probs, 0.0, 1.0)

    def calibration_report(
        self, scores: np.ndarray, y: np.ndarray, n_bins: int = 10
    ) -> dict:
        """
        Generate calibration report with metrics and reliability diagram data.

        Args:
            scores: Raw scores
            y: Binary outcomes
            n_bins: Number of bins for reliability diagram

        Returns:
            Dict with calibration metrics and bin data
        """
        from ..validation.metrics import brier_score, expected_calibration_error, log_loss

        probs = self.predict_proba(scores)

        # Calculate metrics
        metrics = {
            "brier_score": brier_score(y, probs),
            "log_loss": log_loss(y, probs),
            "ece": expected_calibration_error(y, probs, n_bins=n_bins),
            "method": self.method,
        }

        # Reliability diagram data
        bins = np.linspace(0, 1, n_bins + 1)
        bin_indices = np.digitize(probs, bins) - 1
        bin_indices = np.clip(bin_indices, 0, n_bins - 1)

        bin_data = []
        for bin_idx in range(n_bins):
            mask = bin_indices == bin_idx
            if not np.any(mask):
                continue

            bin_probs = probs[mask]
            bin_true = y[mask]

            bin_data.append(
                {
                    "bin_idx": bin_idx,
                    "bin_start": bins[bin_idx],
                    "bin_end": bins[bin_idx + 1],
                    "mean_predicted": float(np.mean(bin_probs)),
                    "empirical_frequency": float(np.mean(bin_true)),
                    "count": int(np.sum(mask)),
                }
            )

        metrics["reliability_diagram"] = bin_data

        return metrics

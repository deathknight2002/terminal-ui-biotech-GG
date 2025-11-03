"""
Validation module for MVM Alpha Scoring.

Provides cross-validation, backtesting, and statistical validation tools.
"""

from .cv import PurgedEmbargoCV
from .metrics import (
    brier_score,
    calculate_deflated_sharpe,
    calculate_information_coefficient,
    expected_calibration_error,
    log_loss,
)

__all__ = [
    "PurgedEmbargoCV",
    "brier_score",
    "log_loss",
    "expected_calibration_error",
    "calculate_deflated_sharpe",
    "calculate_information_coefficient",
]

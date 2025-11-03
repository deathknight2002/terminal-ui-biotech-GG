"""
Drift detection metrics for model monitoring.

Implements PSI, KS test, and calibration monitoring (ECE).
"""

from __future__ import annotations

import numpy as np
from scipy import stats


def compute_ece(probs: np.ndarray, y: np.ndarray, n_bins: int = 10) -> float:
    """
    Calculate Expected Calibration Error.

    Args:
        probs: Predicted probabilities
        y: Binary outcomes
        n_bins: Number of bins

    Returns:
        ECE score
    """
    bins = np.linspace(0, 1, n_bins + 1)
    bin_indices = np.digitize(probs, bins) - 1
    bin_indices = np.clip(bin_indices, 0, n_bins - 1)

    ece = 0.0
    total = len(y)

    for bin_idx in range(n_bins):
        mask = bin_indices == bin_idx
        if not np.any(mask):
            continue

        bin_probs = probs[mask]
        bin_true = y[mask]

        avg_pred = np.mean(bin_probs)
        empirical = np.mean(bin_true)
        weight = len(bin_true) / total

        ece += weight * abs(avg_pred - empirical)

    return float(ece)


def ks_drift(x_ref: np.ndarray, x_live: np.ndarray) -> dict[str, float]:
    """
    Kolmogorov-Smirnov test for distribution drift.

    Args:
        x_ref: Reference distribution
        x_live: Live distribution

    Returns:
        Dict with ks_statistic and p_value
    """
    ks_stat, p_value = stats.ks_2samp(x_ref, x_live)

    return {
        "ks_statistic": float(ks_stat),
        "p_value": float(p_value),
        "drift_detected": p_value < 0.05,
    }


def psi(ref: np.ndarray, live: np.ndarray, bins: int = 10) -> dict[str, float]:
    """
    Population Stability Index (PSI) for feature drift.

    PSI < 0.1: No significant change
    PSI 0.1-0.2: Small change
    PSI > 0.2: Significant change (alert)

    Args:
        ref: Reference distribution
        live: Live distribution
        bins: Number of bins

    Returns:
        Dict with psi value and interpretation
    """
    # Create bins based on reference distribution
    bin_edges = np.percentile(ref, np.linspace(0, 100, bins + 1))
    bin_edges[-1] += 1e-6  # Ensure last edge includes max value

    # Calculate frequencies
    ref_freq, _ = np.histogram(ref, bins=bin_edges)
    live_freq, _ = np.histogram(live, bins=bin_edges)

    # Convert to proportions (add small epsilon to avoid log(0))
    eps = 1e-6
    ref_prop = (ref_freq + eps) / (len(ref) + eps * bins)
    live_prop = (live_freq + eps) / (len(live) + eps * bins)

    # Calculate PSI
    psi_value = np.sum((live_prop - ref_prop) * np.log(live_prop / ref_prop))

    # Interpretation
    if psi_value < 0.1:
        interpretation = "stable"
    elif psi_value < 0.2:
        interpretation = "small_change"
    else:
        interpretation = "significant_drift"

    return {
        "psi": float(psi_value),
        "interpretation": interpretation,
        "alert": psi_value >= 0.2,
    }


def check_kill_switch(
    current_dd: float,
    ece: float,
    dd_threshold: float = 0.15,
    ece_threshold: float = 0.08,
) -> dict[str, bool | str]:
    """
    Check if kill switches should be triggered.

    Kill switches:
    - Drawdown > 15%: Reduce exposure by 50%
    - Drawdown > 20%: Flatline to 0%
    - ECE > 0.08: Reduce exposure by 50%

    Args:
        current_dd: Current drawdown as fraction
        ece: Current ECE
        dd_threshold: Drawdown threshold for 50% reduction
        ece_threshold: ECE threshold for trigger

    Returns:
        Dict with trigger status and recommended action
    """
    dd = abs(current_dd)

    if dd > 0.20:
        return {
            "triggered": True,
            "reason": "drawdown_critical",
            "action": "flatline",
            "message": f"Drawdown {dd:.1%} > 20% - FLATLINE TO 0%",
        }
    elif dd > dd_threshold:
        return {
            "triggered": True,
            "reason": "drawdown_elevated",
            "action": "reduce_50",
            "message": f"Drawdown {dd:.1%} > {dd_threshold:.0%} - REDUCE EXPOSURE 50%",
        }
    elif ece > ece_threshold:
        return {
            "triggered": True,
            "reason": "calibration_drift",
            "action": "reduce_50",
            "message": f"ECE {ece:.3f} > {ece_threshold:.2f} - REDUCE EXPOSURE 50%",
        }
    else:
        return {
            "triggered": False,
            "reason": None,
            "action": "none",
            "message": "All systems nominal",
        }

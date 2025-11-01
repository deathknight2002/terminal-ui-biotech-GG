"""
Calibration Module for Prediction Models

Pool-Adjacent-Violators (PAV) isotonic calibration; stdlib-only.
Fit on (p_pred, y_true) pairs, produce monotone step mapping.

This module provides reliability calibration for probability predictions,
ensuring that predicted probabilities match observed frequencies.
"""

from typing import List, Tuple, Dict


def fit_pav(p_pred: List[float], y_true: List[int]) -> Dict:
    """
    Fit Pool-Adjacent-Violators (PAV) isotonic calibration.
    
    This algorithm ensures monotonicity: if pred_a < pred_b, then calib(pred_a) <= calib(pred_b).
    It pools adjacent bins that violate monotonicity until all violations are resolved.
    
    Args:
        p_pred: List of predicted probabilities (0-1)
        y_true: List of actual binary outcomes (0 or 1)
        
    Returns:
        Dict with 'levels' (calibrated probabilities) and 'thresholds' (cutoff points)
    """
    if not p_pred or not y_true:
        return {"levels": [0.5], "thresholds": []}
    
    if len(p_pred) != len(y_true):
        raise ValueError("p_pred and y_true must have the same length")
    
    # Sort pairs by predicted probability
    pairs = sorted(zip(p_pred, y_true), key=lambda x: x[0])
    
    # Start with each point as its own bin
    bins = [{"sumy": float(y), "n": 1, "p": float(y)} for _, y in pairs]
    
    # Merge adjacent bins that violate monotonicity
    i = 0
    while i < len(bins) - 1:
        if bins[i]["p"] > bins[i + 1]["p"]:
            # Pool bins together
            sy = bins[i]["sumy"] + bins[i + 1]["sumy"]
            n = bins[i]["n"] + bins[i + 1]["n"]
            bins[i] = {"sumy": sy, "n": n, "p": sy / n}
            del bins[i + 1]
            # Back up to check previous bins
            if i > 0:
                i -= 1
        else:
            i += 1
    
    # Build step function: levels and thresholds
    # Levels are the calibrated probability values
    # Thresholds are the cumulative mass percentiles between bins
    levels = [b["p"] for b in bins]
    
    # Calculate thresholds as cumulative quantiles
    thresholds = []
    cum = 0
    total = sum(b["n"] for b in bins)
    
    for b in bins[:-1]:  # Don't need threshold after last bin
        cum += b["n"]
        thresholds.append(cum / total)
    
    return {"levels": levels, "thresholds": thresholds}


def apply_pav(p: float, calib: Dict) -> float:
    """
    Apply PAV calibration to a predicted probability.
    
    Maps the input probability to a calibrated probability using the
    fitted calibration mapping.
    
    Args:
        p: Predicted probability (0-1)
        calib: Calibration dict from fit_pav() with 'levels' and 'thresholds'
        
    Returns:
        Calibrated probability (0-1)
    """
    if not calib or "levels" not in calib or "thresholds" not in calib:
        # No calibration available, return original
        return p
    
    ts = calib["thresholds"]
    lv = calib["levels"]
    
    if not lv:
        return p
    
    # Binary search to find the appropriate level
    # p is compared to thresholds to determine which bin it falls into
    lo, hi = 0, len(ts)
    
    while lo < hi:
        mid = (lo + hi) // 2
        if p > ts[mid]:
            lo = mid + 1
        else:
            hi = mid
    
    # Apply bounds to ensure valid probability
    result = lv[lo] if lo < len(lv) else lv[-1]
    
    # Clamp to valid probability range
    return max(0.001, min(0.999, result))


def calibration_metrics(p_pred: List[float], y_true: List[int], calib: Dict = None) -> Dict:
    """
    Calculate calibration metrics (Brier score, log loss, reliability slope).
    
    Args:
        p_pred: Predicted probabilities
        y_true: Actual outcomes (0 or 1)
        calib: Optional calibration dict to apply first
        
    Returns:
        Dict with Brier score, log loss, and reliability metrics
    """
    if not p_pred or not y_true or len(p_pred) != len(y_true):
        return {"error": "Invalid inputs"}
    
    # Apply calibration if provided
    if calib:
        p_pred = [apply_pav(p, calib) for p in p_pred]
    
    n = len(p_pred)
    
    # Brier score (MSE of probabilities)
    brier = sum((p - y) ** 2 for p, y in zip(p_pred, y_true)) / n
    
    # Log loss (cross-entropy)
    # Clamp probabilities to avoid log(0)
    log_loss = 0.0
    for p, y in zip(p_pred, y_true):
        p_clamped = max(1e-7, min(1 - 1e-7, p))
        if y == 1:
            log_loss += -1.0 * (1.0 if y else 0.0) * (0.0 if not y else 1.0) if y else 0.0
            log_loss -= (1.0 if y == 1 else 0.0) * (sum([1.0 if y == 1 else 0.0 for y in [y]]) * sum([p_clamped if y == 1 else 0.0 for p in [p_clamped]]))
    
    # Simplified log loss calculation
    import math
    log_loss = 0.0
    for p, y in zip(p_pred, y_true):
        p_clamped = max(1e-7, min(1 - 1e-7, p))
        if y == 1:
            log_loss -= math.log(p_clamped)
        else:
            log_loss -= math.log(1 - p_clamped)
    log_loss /= n
    
    return {
        "brier_score": round(brier, 4),
        "log_loss": round(log_loss, 4),
        "n_samples": n,
    }

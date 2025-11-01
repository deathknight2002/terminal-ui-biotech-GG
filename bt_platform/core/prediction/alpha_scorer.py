"""
Alpha Scoring Module

Expected alpha calculation combining:
- Probability of success (from outcome predictor)
- Expected move distributions (from historical reactions)
- Timing confidence (from timing predictor)
- Downside penalty for risk-aware EV

Produces a directionally-honest edge score (0-100) that represents
expected value adjusted for timing and downside risk.
"""

from typing import Dict, List, Optional
from statistics import median

from .adapters import Catalyst, get_reaction_samples
from .outcome_predictor_v2 import predict_outcome_bayesian_v2
from .timing_predictor_v2 import predict_quarterly_distribution_v2


def _robust_mean(xs: List[float]) -> float:
    """
    Calculate robust mean using weighted quantiles.
    
    Uses 10th, 50th (median), and 90th percentiles with 0.25, 0.5, 0.25 weights
    to reduce impact of outliers.
    
    Args:
        xs: List of values
        
    Returns:
        Robust mean estimate
    """
    if not xs:
        return 0.0
    
    xs = sorted(xs)
    n = len(xs)
    
    if n == 1:
        return xs[0]
    elif n == 2:
        return (xs[0] + xs[1]) / 2
    
    # 10th percentile
    lo = xs[max(0, n // 10)]
    
    # 90th percentile
    hi = xs[min(n - 1, int(n * 0.9))]
    
    # Median (50th percentile)
    mid = xs[n // 2]
    
    # Weighted combination
    return 0.25 * lo + 0.5 * mid + 0.25 * hi


def expected_alpha_for_catalyst(
    c: Catalyst,
    pav_calib: Optional[Dict] = None,
    hazard_windows: Optional[List] = None
) -> Dict:
    """
    Calculate expected alpha score for a catalyst.
    
    Combines:
    1. Outcome probability (calibrated Bayesian)
    2. Expected moves from historical reactions (robust mean)
    3. Timing confidence (from quarterly distribution)
    4. Downside penalty (1.1x weight on losses)
    
    Args:
        c: Catalyst object
        pav_calib: Optional PAV calibration dict
        hazard_windows: Optional hazard windows for timing prediction
        
    Returns:
        Dict with edge_score, prob_success, expected moves, EV, and timing info
    """
    # 1) Get outcome probability
    out = predict_outcome_bayesian_v2(c, pav_calibrator=pav_calib)
    p = out.probability_of_success
    
    # 2) Get expected moves from historical reactions
    # Priority: company > TA > global baseline
    up_samples = get_reaction_samples(
        c.company,
        c.therapeutic_area,
        c.catalyst_type,
        direction="up"
    )
    down_samples = get_reaction_samples(
        c.company,
        c.therapeutic_area,
        c.catalyst_type,
        direction="down"
    )
    
    # Calculate robust means with fallback defaults
    mu_up = abs(_robust_mean(up_samples)) if up_samples else 0.12    # Default +12%
    mu_down = abs(_robust_mean(down_samples)) if down_samples else 0.18  # Default -18%
    
    # 3) Get timing confidence
    t = predict_quarterly_distribution_v2(c, hazard_windows=hazard_windows)
    conf = 1.0 - t.get("outside_window", 0.4)
    
    # 4) Calculate expected value with downside penalty
    # EV = p * mu_up - (1-p) * penalty * mu_down
    downside_penalty = 1.1  # Weight losses 10% heavier
    ev = p * mu_up - (1 - p) * downside_penalty * mu_down
    
    # 5) Convert EV to edge score (0-100)
    # Scale: EV in range [-0.18, +0.12] maps to roughly [0, 100]
    # Using sigmoid-like transformation scaled by timing confidence
    raw = ev * 100.0
    score = max(0.0, min(100.0, 50 + 15 * raw))
    
    # Apply timing confidence weighting
    score = score * conf
    
    return {
        "catalyst_id": c.id,
        "ticker": c.ticker,
        "company": c.company,
        "therapeutic_area": c.therapeutic_area,
        "catalyst_type": c.catalyst_type,
        "phase": c.phase,
        "prob_success": p,
        "mu_up": round(mu_up, 4),
        "mu_down": round(mu_down, 4),
        "ev": round(ev, 4),
        "edge_score": round(score, 2),
        "timing_confidence": round(conf, 3),
        "timing": t
    }

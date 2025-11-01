"""
Enhanced Timing Prediction v2

Weibull-based timing model with:
- Calendar-aware hazard spikes (FDA dates, major congresses)
- Therapeutic area scaling factors
- Optional 2-component mixtures for bimodal trial timelines
- Quarterly probability distributions

All math uses stdlib only - no scipy required at runtime.
"""

import math
import datetime as dt
from typing import Dict, List, Tuple, Optional

from .adapters import Catalyst

# Default Weibull parameters by phase (shape k, scale λ in days)
# Can be replaced with calibrated values from JSON
DEFAULT_WEIBULL = {
    "P1": (1.2, 180.0),
    "P2": (1.4, 360.0),
    "P3": (1.6, 540.0),
    "FDA": (2.0, 300.0),
}

# Therapeutic area scale factors (multiply baseline λ)
# Oncology faster due to accelerated pathways, rare disease slower
TA_SCALE = {
    "Oncology": 0.90,
    "Cardiovascular": 1.00,
    "Neurology": 1.05,
    "Rare Disease": 1.10,
}


def weibull_cdf(t: float, k: float, lam: float) -> float:
    """
    Weibull cumulative distribution function.
    
    F(t) = 1 - exp(-(t/λ)^k)
    
    Args:
        t: Time value (days)
        k: Shape parameter
        lam: Scale parameter (lambda)
        
    Returns:
        Cumulative probability at time t
    """
    if t <= 0:
        return 0.0
    return 1.0 - math.exp(-((t / lam) ** k))


def days(a: dt.date, b: dt.date) -> int:
    """Calculate days between two dates."""
    return (b - a).days


def quarterly_bins(start: dt.date, n: int = 4) -> List[Tuple[dt.date, dt.date]]:
    """
    Generate quarterly date bins starting from a given date.
    
    Args:
        start: Starting date
        n: Number of quarters to generate
        
    Returns:
        List of (quarter_start, quarter_end) tuples
    """
    out = []
    # Start at beginning of current quarter
    s = dt.date(start.year, ((start.month - 1) // 3) * 3 + 1, 1)
    
    for _ in range(n):
        # Calculate quarter boundaries
        q = (s.month - 1) // 3 + 1
        end_month = q * 3
        
        # Last day of the quarter
        if end_month == 12:
            end_date = dt.date(s.year, 12, 31)
            next_year = s.year + 1
            next_month = 1
        else:
            # Last day of end_month
            next_month_start = dt.date(s.year, end_month + 1, 1)
            end_date = next_month_start - dt.timedelta(days=1)
            next_year = s.year
            next_month = end_month + 1
        
        out.append((s, end_date))
        
        # Advance to next quarter
        s = dt.date(next_year, next_month, 1)
    
    return out


def _daily_mass(
    anchor: dt.date,
    k: float,
    lam: float,
    d0: dt.date,
    d1: dt.date
) -> List[Tuple[dt.date, float]]:
    """
    Calculate per-day probability mass between [d0, d1).
    
    Args:
        anchor: Anchor date (e.g., trial start)
        k: Weibull shape parameter
        lam: Weibull scale parameter
        d0: Start date (inclusive)
        d1: End date (exclusive)
        
    Returns:
        List of (date, probability) tuples for each day
    """
    masses = []
    cur = d0
    
    while cur < d1:
        t0 = max(0, days(anchor, cur))
        t1 = t0 + 1
        
        # Probability mass on this day
        p = max(0.0, weibull_cdf(t1, k, lam) - weibull_cdf(t0, k, lam))
        masses.append((cur, p))
        
        cur += dt.timedelta(days=1)
    
    return masses


def predict_quarterly_distribution_v2(
    c: Catalyst,
    hazard_windows: Optional[List[Tuple[dt.date, dt.date, float]]] = None,
    mixture: Optional[Tuple[float, Tuple[float, float], Tuple[float, float]]] = None,
    confidence_default: float = 0.60
) -> Dict:
    """
    Enhanced timing prediction with hazard spikes and mixtures.
    
    Args:
        c: Catalyst object with type, phase, dates, and therapeutic area
        hazard_windows: List of (start_date, end_date, boost_factor) for special periods
                       e.g., [(dt.date(2025, 6, 1), dt.date(2025, 6, 15), 1.3)] for ASCO
        mixture: Optional (weight, (k1, lam1), (k2, lam2)) for bimodal distributions
        confidence_default: Default confidence for timing prediction
        
    Returns:
        Dict with quarterly_probabilities, bins, type, and metadata
    """
    today = dt.date.today()
    
    # PDUFA: Point mass with 90% confidence on known quarter
    if c.catalyst_type == "PDUFA" and c.pdufa_date:
        bins = quarterly_bins(today, 4)
        probs = [0.0] * 4
        
        # Find which quarter contains the PDUFA date
        idx = next((i for i, (b0, b1) in enumerate(bins) if b0 <= c.pdufa_date <= b1), None)
        
        if idx is not None:
            probs[idx] = 0.90
            # Smear remaining 10% to neighboring quarters
            neighbors = [j for j in [idx - 1, idx + 1] if 0 <= j < 4]
            if neighbors:
                share = 0.10 / len(neighbors)
                for j in neighbors:
                    probs[j] += share
        else:
            # PDUFA date outside 4Q window
            probs[0] = 0.10
        
        return {
            "catalyst_id": c.id,
            "type": c.catalyst_type,
            "reference": "PDUFA-fixed(90%)",
            "quarterly_probabilities": [round(p, 4) for p in probs],
            "bins": [(str(b0), str(b1)) for (b0, b1) in bins],
            "outside_window": 0.10
        }
    
    # TRIAL READOUT / FDA timing via Weibull
    phase = c.phase or "P3"
    k, lam = DEFAULT_WEIBULL.get(phase, (1.6, 540.0))
    
    # Apply therapeutic area scaling
    lam *= TA_SCALE.get(c.therapeutic_area, 1.0)
    
    # Handle mixture models (for bimodal timelines)
    if mixture:
        w, (k1, lam1), (k2, lam2) = mixture
    else:
        # Degenerate mixture (single component)
        w, (k1, lam1), (k2, lam2) = 1.0, (k, lam), (k, lam)
    
    # Determine anchor date
    if c.anchor_date:
        anchor = c.anchor_date
    else:
        # Default: assume trial started λ days ago
        anchor = today - dt.timedelta(days=int(lam))
    
    # Generate quarterly bins
    bins = quarterly_bins(today, 4)
    q_mass = [0.0, 0.0, 0.0, 0.0]
    
    # Calculate probability mass per quarter
    for i, (b0, b1) in enumerate(bins):
        # Get daily mass from both mixture components
        daily1 = _daily_mass(anchor, k1, lam1, b0, b1)
        daily2 = _daily_mass(anchor, k2, lam2, b0, b1)
        
        # Combine with mixture weight and apply hazard boosts
        for (d, p1), (_, p2) in zip(daily1, daily2):
            p = w * p1 + (1.0 - w) * p2
            
            # Apply hazard window boosts
            if hazard_windows:
                for (h0, h1, boost) in hazard_windows:
                    if h0 <= d < h1:
                        p *= boost
            
            q_mass[i] += p
    
    # Normalize probabilities
    total = sum(q_mass)
    if total <= 0:
        q = [1.0, 0.0, 0.0, 0.0]
    else:
        q = [m / total for m in q_mass]
    
    # Apply confidence scaling
    # Phase 3 readouts have ~60% confidence within 4Q window
    if c.catalyst_type == "TRIAL_READOUT" and phase == "P3":
        conf = confidence_default
    else:
        conf = 0.50
    
    # Scale probabilities by confidence
    q = [round(p * conf, 4) for p in q]
    outside_window = round(1.0 - conf, 4)
    
    return {
        "catalyst_id": c.id,
        "type": c.catalyst_type,
        "reference": f"Weibull_v2(TA_scale={TA_SCALE.get(c.therapeutic_area, 1.0)})",
        "quarterly_probabilities": q,
        "bins": [(str(b0), str(b1)) for (b0, b1) in bins],
        "outside_window": outside_window
    }

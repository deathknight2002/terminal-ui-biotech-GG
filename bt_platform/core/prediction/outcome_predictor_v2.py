"""
Enhanced Outcome Prediction v2

Bayesian outcome prediction with:
- Evidence stacking in odds space for proper composition
- PAV isotonic calibration for reliability
- Phase-based priors from BIO industry data
- Therapeutic area adjustments

All computations use stdlib only.
"""

import math
from typing import Dict, List, Optional
from dataclasses import dataclass

from .adapters import Catalyst
from .calibration import apply_pav

# Base priors from BIO 2016-2020 industry success rates
PHASE_PRIOR = {
    "P1": 0.63,
    "P2": 0.30,
    "P3": 0.48,
    "FDA": 0.85,
}

# Therapeutic area absolute uplift (additive in probability space)
TA_ABS_UP = {
    "Rare Disease": 0.14,  # Rare diseases have ~14% higher success rate
}

# Default log-odds increments for evidence factors
# These correspond to multiplicative factors in odds space
# ln(1.15) ≈ 0.1398 means +15% odds
# ln(1.10) ≈ 0.0953 means +10% odds
LOG_ODDS = {
    "prior_phase_success": 0.1398,      # ~ +15% odds
    "biomarker_enrichment": 0.0953,     # ~ +10% odds
    "hard_endpoints": 0.0488,           # ~ +5% odds
    "large_trial": 0.0296,              # ~ +3% odds
}


@dataclass
class OutcomeV2:
    """Enhanced outcome prediction result."""
    probability_of_success: float
    prior_probability: float
    evidence_factors: List[Dict[str, str]]
    calibrated: bool


def _p2o(p: float) -> float:
    """Convert probability to odds."""
    p = max(1e-6, min(1 - 1e-6, p))
    return p / (1 - p)


def _o2p(o: float) -> float:
    """Convert odds to probability."""
    return o / (1 + o)


def predict_outcome_bayesian_v2(
    c: Catalyst,
    pav_calibrator: Optional[Dict] = None,
    log_odds: Optional[Dict] = None
) -> OutcomeV2:
    """
    Enhanced Bayesian outcome prediction with calibration.
    
    Process:
    1. Start with phase-based prior probability
    2. Apply therapeutic area adjustment (additive)
    3. Convert to odds space
    4. Apply evidence factors multiplicatively in odds space
    5. Convert back to probability
    6. Apply PAV calibration if available
    
    Args:
        c: Catalyst object with phase, TA, and evidence flags
        pav_calibrator: Optional calibration dict from fit_pav()
        log_odds: Optional custom log-odds multipliers (defaults to LOG_ODDS)
        
    Returns:
        OutcomeV2 with probability, prior, evidence factors, and calibration status
    """
    lo = log_odds or LOG_ODDS
    
    # 1) Start with phase-based prior
    prior = PHASE_PRIOR.get(c.phase or "P3", 0.48)
    
    # 2) Apply therapeutic area absolute uplift
    if c.therapeutic_area in TA_ABS_UP:
        prior = max(0.001, min(0.999, prior + TA_ABS_UP[c.therapeutic_area]))
    
    # 3) Convert to odds space for evidence stacking
    odds = _p2o(prior)
    
    # 4) Apply evidence factors multiplicatively in odds space
    evidence = []
    
    def add(flag: bool, key: str, label: str):
        nonlocal odds
        if flag:
            # Multiply odds by e^(log_odds[key])
            mult = math.exp(lo[key])
            odds *= mult
            
            # Record impact as percentage increase in odds
            pct = int(round((mult - 1) * 100))
            evidence.append({
                "factor": label,
                "impact": f"+{pct}%"
            })
    
    add(c.prior_phase_success, "prior_phase_success", "prior_phase_success")
    add(c.biomarker_enrichment, "biomarker_enrichment", "biomarker_enrichment")
    add(c.hard_endpoints, "hard_endpoints", "hard_endpoints")
    add(c.large_trial, "large_trial", "large_trial")
    
    # 5) Convert back to probability
    raw_p = _o2p(odds)
    
    # Clamp to reasonable bounds before calibration
    raw_p = max(0.01, min(0.97, raw_p))
    
    # 6) Apply PAV calibration if available
    if pav_calibrator:
        p = apply_pav(raw_p, pav_calibrator)
    else:
        p = raw_p
    
    return OutcomeV2(
        probability_of_success=round(p, 4),
        prior_probability=round(prior, 4),
        evidence_factors=evidence,
        calibrated=bool(pav_calibrator)
    )

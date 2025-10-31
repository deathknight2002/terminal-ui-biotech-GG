"""
Catalyst Prediction Engine

Minimal implementation of key prediction capabilities for biotech catalysts.
Integrates with existing catalyst infrastructure.

Enhanced with Weibull timing, Bayesian outcome prediction, and advanced momentum scoring.
"""

from .momentum_scorer import (
    calculate_momentum_score,
    calculate_therapeutic_area_momentum,
    score_company_advanced,
    raw_momentum,
    streak_boost,
    ta_zscore,
)
from .outcome_predictor import (
    predict_catalyst_outcome,
    predict_outcome_bayesian,
    p_to_odds,
    odds_to_p,
)
from .timing_predictor import (
    predict_catalyst_timing,
    predict_quarterly_distribution,
    weibull_cdf,
    quarterly_bins,
)

__all__ = [
    # Legacy functions (maintain backward compatibility)
    "predict_catalyst_timing",
    "predict_catalyst_outcome",
    "calculate_momentum_score",
    "calculate_therapeutic_area_momentum",
    # Enhanced functions (new from issue spec)
    "predict_quarterly_distribution",
    "predict_outcome_bayesian",
    "score_company_advanced",
    # Utility functions
    "weibull_cdf",
    "quarterly_bins",
    "p_to_odds",
    "odds_to_p",
    "raw_momentum",
    "streak_boost",
    "ta_zscore",
]

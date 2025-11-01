"""
Catalyst Prediction Engine

Minimal implementation of key prediction capabilities for biotech catalysts.
Integrates with existing catalyst infrastructure.

Enhanced with Weibull timing, Bayesian outcome prediction, and advanced momentum scoring.

v2 additions:
- calibration: PAV isotonic calibration for reliability
- timing_predictor_v2: Hazard spikes, TA scaling, mixtures
- outcome_predictor_v2: Calibrated Bayesian in odds space
- momentum_scorer_v2: Peer-neutral with decay and streaks
- alpha_scorer: Expected value with timing confidence
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

# v2 modules (new)
from .calibration import (
    fit_pav,
    apply_pav,
    calibration_metrics,
)
from .timing_predictor_v2 import (
    predict_quarterly_distribution_v2,
)
from .outcome_predictor_v2 import (
    predict_outcome_bayesian_v2,
    OutcomeV2,
)
from .momentum_scorer_v2 import (
    score_company_advanced as score_company_advanced_v2,
)
from .alpha_scorer import (
    expected_alpha_for_catalyst,
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
    # v2 functions (new)
    "fit_pav",
    "apply_pav",
    "calibration_metrics",
    "predict_quarterly_distribution_v2",
    "predict_outcome_bayesian_v2",
    "OutcomeV2",
    "score_company_advanced_v2",
    "expected_alpha_for_catalyst",
]

"""
Catalyst Expectation Delta Service

Computes expectation vs outcome deltas for catalyst events,
following the framework outlined in the problem statement.
"""

from typing import Dict, Optional, Any, Tuple
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)


class ExpectationDeltaResult:
    """Result of expectation delta calculation"""
    
    def __init__(
        self,
        delta_class: str,
        delta_score: float,
        magnitude: Optional[float] = None,
        explanation: Optional[str] = None
    ):
        self.delta_class = delta_class  # beat, inline, miss
        self.delta_score = delta_score  # 0-1 magnitude
        self.magnitude = magnitude  # absolute delta
        self.explanation = explanation
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "class": self.delta_class,
            "score": self.delta_score,
            "magnitude": self.magnitude,
            "explanation": self.explanation
        }


def compute_expectation_delta(
    outcome: Dict[str, Any],
    expectation_band: Dict[str, Any]
) -> ExpectationDeltaResult:
    """
    Computes expectation delta following the problem statement spec.
    
    Returns +1 (beat), 0 (in-line), -1 (miss) with magnitude score 0..1
    
    Args:
        outcome: Dict with 'value' key
        expectation_band: Dict with 'band_low', 'band_high', 'expected' keys
    
    Returns:
        ExpectationDeltaResult with delta_class and delta_score
    
    Examples:
        >>> outcome = {"value": 1.8}
        >>> band = {"band_low": 1.3, "band_high": 1.6, "expected": 1.5}
        >>> result = compute_expectation_delta(outcome, band)
        >>> result.delta_class
        'beat'
        >>> result.delta_score
        0.2
    """
    val = float(outcome.get("value", 0))
    lo = float(expectation_band.get("band_low", 0))
    hi = float(expectation_band.get("band_high", 0))
    expected = float(expectation_band.get("expected", (lo + hi) / 2 if lo and hi else 0))
    
    # Handle edge cases
    if lo == 0 and hi == 0:
        return ExpectationDeltaResult(
            delta_class="unknown",
            delta_score=0.0,
            explanation="No expectation band provided"
        )
    
    # Compute delta
    magnitude = val - expected
    
    # Classify
    if val > hi:
        # Beat high end of band
        denominator = hi if hi > 0 else 1.0
        score = min((val - hi) / denominator, 1.0)
        return ExpectationDeltaResult(
            delta_class="beat",
            delta_score=score,
            magnitude=magnitude,
            explanation=f"Value {val} exceeds band high {hi} by {val-hi:.2f}"
        )
    elif val < lo:
        # Miss low end of band
        denominator = lo if lo > 0 else 1.0
        score = min((lo - val) / denominator, 1.0)
        return ExpectationDeltaResult(
            delta_class="miss",
            delta_score=score,
            magnitude=magnitude,
            explanation=f"Value {val} below band low {lo} by {lo-val:.2f}"
        )
    else:
        # In-line with expectations (within band)
        # Score based on distance from expected within band
        if expected > 0:
            deviation = abs(val - expected) / expected
            score = 0.2 + deviation * 0.3  # 0.2 base + up to 0.3 for deviation
        else:
            score = 0.2
        
        return ExpectationDeltaResult(
            delta_class="inline",
            delta_score=min(score, 1.0),
            magnitude=magnitude,
            explanation=f"Value {val} within band [{lo}, {hi}]"
        )


def compute_multi_metric_delta(
    outcomes: Dict[str, Dict[str, Any]],
    expectations: Dict[str, Dict[str, Any]]
) -> Dict[str, ExpectationDeltaResult]:
    """
    Compute deltas for multiple metrics.
    
    Args:
        outcomes: Dict mapping metric_name -> outcome dict
        expectations: Dict mapping metric_name -> expectation_band dict
    
    Returns:
        Dict mapping metric_name -> ExpectationDeltaResult
    
    Example:
        >>> outcomes = {
        ...     "α-DG": {"value": 1.8},
        ...     "CK": {"value": -82}
        ... }
        >>> expectations = {
        ...     "α-DG": {"band_low": 1.3, "band_high": 1.6, "expected": 1.5},
        ...     "CK": {"band_low": -70, "band_high": -50, "expected": -60}
        ... }
        >>> results = compute_multi_metric_delta(outcomes, expectations)
        >>> results["α-DG"].delta_class
        'beat'
    """
    results = {}
    
    for metric_name, outcome in outcomes.items():
        if metric_name in expectations:
            expectation = expectations[metric_name]
            results[metric_name] = compute_expectation_delta(outcome, expectation)
        else:
            logger.warning(f"No expectation found for metric: {metric_name}")
            results[metric_name] = ExpectationDeltaResult(
                delta_class="unknown",
                delta_score=0.0,
                explanation=f"No expectation band for {metric_name}"
            )
    
    return results


def compute_aggregate_delta_score(
    metric_deltas: Dict[str, ExpectationDeltaResult],
    weights: Optional[Dict[str, float]] = None
) -> Tuple[float, str]:
    """
    Compute aggregate delta score across multiple metrics.
    
    Args:
        metric_deltas: Dict of metric name to ExpectationDeltaResult
        weights: Optional dict of metric name to weight (default: equal weights)
    
    Returns:
        Tuple of (aggregate_score, aggregate_class)
        - aggregate_score: 0-1, weighted average
        - aggregate_class: "beat", "inline", "miss", or "mixed"
    
    Example:
        >>> deltas = {
        ...     "metric1": ExpectationDeltaResult("beat", 0.8),
        ...     "metric2": ExpectationDeltaResult("beat", 0.6)
        ... }
        >>> score, cls = compute_aggregate_delta_score(deltas)
        >>> cls
        'beat'
    """
    if not metric_deltas:
        return 0.0, "unknown"
    
    # Default to equal weights
    if weights is None:
        weights = {name: 1.0 for name in metric_deltas.keys()}
    
    # Normalize weights
    total_weight = sum(weights.values())
    if total_weight == 0:
        return 0.0, "unknown"
    
    normalized_weights = {k: v / total_weight for k, v in weights.items()}
    
    # Compute weighted score
    weighted_sum = 0.0
    class_counts = {"beat": 0, "inline": 0, "miss": 0, "unknown": 0}
    
    for metric_name, delta in metric_deltas.items():
        weight = normalized_weights.get(metric_name, 0.0)
        
        # Assign signed score: positive for beat, negative for miss, near-zero for inline
        if delta.delta_class == "beat":
            signed_score = delta.delta_score
            class_counts["beat"] += weight
        elif delta.delta_class == "miss":
            signed_score = -delta.delta_score
            class_counts["miss"] += weight
        else:
            signed_score = 0.0
            class_counts["inline"] += weight
        
        weighted_sum += signed_score * weight
    
    # Determine aggregate class
    if class_counts["beat"] > 0.6:
        aggregate_class = "beat"
    elif class_counts["miss"] > 0.6:
        aggregate_class = "miss"
    elif class_counts["inline"] > 0.6:
        aggregate_class = "inline"
    else:
        aggregate_class = "mixed"
    
    # Normalize score to 0-1
    aggregate_score = abs(weighted_sum)
    
    return aggregate_score, aggregate_class


# ============================================================================
# BridgeBio FORTIFY Example Configuration
# ============================================================================

FORTIFY_EXPECTATIONS = {
    "α-DG glycosylation": {
        "expected": 1.5,
        "band_low": 1.3,
        "band_high": 1.6,
        "unit": "×",
        "what_matters": "Biomarker restoration shows mechanism of action"
    },
    "CK reduction": {
        "expected": -60,
        "band_low": -70,
        "band_high": -50,
        "unit": "%",
        "what_matters": "Muscle damage biomarker improvement"
    },
    "Velocity Δ vs PBO": {
        "expected": 0.20,
        "band_low": 0.10,
        "band_high": 0.25,
        "unit": "m/s",
        "what_matters": "Functional endpoint - clinically meaningful"
    },
    "FVC Δ vs PBO": {
        "expected": 4.0,
        "band_low": 2.0,
        "band_high": 5.0,
        "unit": "pp",
        "what_matters": "Respiratory function - key for payers"
    }
}

FORTIFY_OUTCOMES = {
    "α-DG glycosylation": {
        "value": 1.8,
        "window": "@3m"
    },
    "CK reduction": {
        "value": -82,
        "window": "@12m"
    },
    "Velocity Δ vs PBO": {
        "value": 0.27,
        "pvalue": 0.03,
        "n": 38
    },
    "FVC Δ vs PBO": {
        "value": 5.0,
        "pvalue": 0.02,
        "n": 38
    }
}


def analyze_fortify_catalyst() -> Dict[str, Any]:
    """
    Analyze BridgeBio FORTIFY catalyst as example.
    
    Returns:
        Dict with metric deltas and aggregate assessment
    """
    metric_deltas = compute_multi_metric_delta(FORTIFY_OUTCOMES, FORTIFY_EXPECTATIONS)
    
    # Weight velocity and FVC higher as functional endpoints
    weights = {
        "α-DG glycosylation": 0.2,
        "CK reduction": 0.2,
        "Velocity Δ vs PBO": 0.3,
        "FVC Δ vs PBO": 0.3
    }
    
    aggregate_score, aggregate_class = compute_aggregate_delta_score(metric_deltas, weights)
    
    return {
        "metric_deltas": {k: v.to_dict() for k, v in metric_deltas.items()},
        "aggregate_score": aggregate_score,
        "aggregate_class": aggregate_class,
        "interpretation": f"FORTIFY {aggregate_class.upper()} with score {aggregate_score:.2f}"
    }


if __name__ == "__main__":
    # Example usage
    result = analyze_fortify_catalyst()
    print("BridgeBio FORTIFY Analysis:")
    print(f"Aggregate: {result['aggregate_class']} (score: {result['aggregate_score']:.2f})")
    print("\nMetric-by-metric:")
    for metric, delta in result["metric_deltas"].items():
        print(f"  {metric}: {delta['class']} (score: {delta['score']:.2f})")

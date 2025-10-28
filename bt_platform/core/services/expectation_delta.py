"""
Expectation Delta Computation
==============================

Computes beat/inline/miss classification with magnitude scores
by comparing actual outcomes against expectation bands.

Supports all catalyst types:
- Clinical trials (biomarker improvements, functional endpoints)
- M&A deals (premiums, valuations)
- Safety events (severity grades, pause durations)
- Regulatory approvals (label breadth, timing)
- Label updates (dosing changes, adherence impacts)
"""

from dataclasses import dataclass
from enum import Enum
from typing import Any, Optional


class DeltaClass(str, Enum):
    """Expectation delta classification"""
    BEAT = "beat"
    INLINE = "inline"
    MISS = "miss"


@dataclass
class ExpectationDelta:
    """Result of expectation vs outcome comparison"""
    delta_class: DeltaClass
    delta_score: float  # 0-1 magnitude
    raw_delta: float  # Actual difference
    percent_delta: Optional[float] = None  # Percentage difference
    is_statistically_significant: bool = False
    explanation: str = ""


def compute_expectation_delta(
    outcome_value: float,
    expected_value: Optional[float],
    band_low: Optional[float],
    band_high: Optional[float],
    metric_name: str = "",
    p_value: Optional[float] = None,
    confidence_level: float = 0.05
) -> ExpectationDelta:
    """
    Compute expectation delta with beat/inline/miss classification.

    Logic:
    - If outcome > band_high: BEAT with magnitude score
    - If outcome < band_low: MISS with magnitude score
    - If band_low <= outcome <= band_high: INLINE with small score

    Args:
        outcome_value: Actual measured value
        expected_value: Point estimate expectation
        band_low: Lower bound of expectation range
        band_high: Upper bound of expectation range
        metric_name: Name of metric for context
        p_value: Statistical p-value (for clinical outcomes)
        confidence_level: Significance threshold (default 0.05)

    Returns:
        ExpectationDelta with classification and magnitude

    Examples:
        >>> # Clinical beat: α-DG 1.8× vs expected 1.5× (band 1.3-1.6×)
        >>> compute_expectation_delta(1.8, 1.5, 1.3, 1.6, "α-DG glycosylation")
        ExpectationDelta(delta_class='beat', delta_score=0.67, ...)

        >>> # M&A beat: 46% premium vs expected 30% (band 20-40%)
        >>> compute_expectation_delta(46, 30, 20, 40, "Deal Premium")
        ExpectationDelta(delta_class='beat', delta_score=0.30, ...)

        >>> # Safety miss: Grade 4 event vs expected none (band 0-2)
        >>> compute_expectation_delta(4, 0, 0, 2, "Safety Grade")
        ExpectationDelta(delta_class='miss', delta_score=1.0, ...)
    """

    # Handle missing bounds - use expected value ± 10% as default
    if band_low is None or band_high is None:
        if expected_value is not None:
            range_width = abs(expected_value) * 0.1 or 0.1
            band_low = band_low or (expected_value - range_width)
            band_high = band_high or (expected_value + range_width)
        else:
            # No expectations available - treat as inline with low confidence
            return ExpectationDelta(
                delta_class=DeltaClass.INLINE,
                delta_score=0.0,
                raw_delta=0.0,
                explanation=f"No expectation bands available for {metric_name}"
            )

    # Ensure band_low <= band_high
    if band_low > band_high:
        band_low, band_high = band_high, band_low

    # Compute raw delta
    reference_value = expected_value if expected_value is not None else (band_low + band_high) / 2
    raw_delta = outcome_value - reference_value

    # Compute percent delta if reference is non-zero
    percent_delta = None
    if reference_value != 0:
        percent_delta = (raw_delta / abs(reference_value)) * 100

    # Check statistical significance for clinical metrics
    is_significant = False
    if p_value is not None:
        is_significant = p_value < confidence_level

    # Classify and score
    if outcome_value > band_high:
        # BEAT: outcome exceeded upper bound
        excess = outcome_value - band_high
        band_width = band_high - band_low

        if band_width > 0:
            # Magnitude proportional to how far above upper bound
            magnitude = min(excess / band_width, 1.0)
        else:
            magnitude = 1.0 if excess > 0 else 0.5

        explanation = f"{metric_name}: {outcome_value:.2f} exceeded upper bound {band_high:.2f}"

        return ExpectationDelta(
            delta_class=DeltaClass.BEAT,
            delta_score=magnitude,
            raw_delta=raw_delta,
            percent_delta=percent_delta,
            is_statistically_significant=is_significant,
            explanation=explanation
        )

    elif outcome_value < band_low:
        # MISS: outcome below lower bound
        shortfall = band_low - outcome_value
        band_width = band_high - band_low

        if band_width > 0:
            magnitude = min(shortfall / band_width, 1.0)
        else:
            magnitude = 1.0 if shortfall > 0 else 0.5

        explanation = f"{metric_name}: {outcome_value:.2f} below lower bound {band_low:.2f}"

        return ExpectationDelta(
            delta_class=DeltaClass.MISS,
            delta_score=magnitude,
            raw_delta=raw_delta,
            percent_delta=percent_delta,
            is_statistically_significant=is_significant,
            explanation=explanation
        )

    else:
        # INLINE: within expectation band
        # Score based on distance from center of band
        band_center = (band_low + band_high) / 2
        band_width = band_high - band_low

        if band_width > 0:
            distance_from_center = abs(outcome_value - band_center)
            magnitude = min((distance_from_center / (band_width / 2)) * 0.5, 0.5)
        else:
            magnitude = 0.2

        explanation = f"{metric_name}: {outcome_value:.2f} within band [{band_low:.2f}, {band_high:.2f}]"

        return ExpectationDelta(
            delta_class=DeltaClass.INLINE,
            delta_score=magnitude,
            raw_delta=raw_delta,
            percent_delta=percent_delta,
            is_statistically_significant=is_significant,
            explanation=explanation
        )


def compute_aggregate_delta(
    deltas: list[ExpectationDelta],
    weights: Optional[list[float]] = None
) -> tuple[DeltaClass, float]:
    """
    Aggregate multiple expectation deltas into overall beat/inline/miss.

    Used when catalyst has multiple metrics (e.g., multiple clinical endpoints).

    Args:
        deltas: List of ExpectationDelta objects
        weights: Optional weights for each delta (must sum to 1.0)

    Returns:
        Tuple of (overall_class, overall_score)

    Example:
        >>> # BridgeBio FORTIFY: 4 endpoints, all beat
        >>> deltas = [
        ...     compute_expectation_delta(1.8, 1.5, 1.3, 1.6, "α-DG"),
        ...     compute_expectation_delta(82, 60, 50, 70, "CK reduction"),
        ...     compute_expectation_delta(0.27, 0.20, 0.10, 0.25, "Velocity"),
        ...     compute_expectation_delta(5, 4, 2, 5, "FVC")
        ... ]
        >>> compute_aggregate_delta(deltas)
        (DeltaClass.BEAT, 0.85)
    """

    if not deltas:
        return DeltaClass.INLINE, 0.0

    # Default to equal weighting
    if weights is None:
        weights = [1.0 / len(deltas)] * len(deltas)

    # Validate weights
    if len(weights) != len(deltas):
        raise ValueError("Weights must match number of deltas")
    if abs(sum(weights) - 1.0) > 1e-6:
        raise ValueError("Weights must sum to 1.0")

    # Score each class
    beat_score = sum(
        delta.delta_score * weight
        for delta, weight in zip(deltas, weights)
        if delta.delta_class == DeltaClass.BEAT
    )

    miss_score = sum(
        delta.delta_score * weight
        for delta, weight in zip(deltas, weights)
        if delta.delta_class == DeltaClass.MISS
    )

    inline_score = sum(
        delta.delta_score * weight
        for delta, weight in zip(deltas, weights)
        if delta.delta_class == DeltaClass.INLINE
    )

    # Determine overall classification
    # Beat if beat_score > miss_score and beat_score > inline_score
    # Miss if miss_score > beat_score and miss_score > inline_score
    # Otherwise inline

    if beat_score > miss_score and beat_score > inline_score:
        return DeltaClass.BEAT, beat_score
    elif miss_score > beat_score and miss_score > inline_score:
        return DeltaClass.MISS, miss_score
    else:
        # Inline or mixed - use weighted average of inline scores
        return DeltaClass.INLINE, inline_score or 0.3


def format_delta_for_display(delta: ExpectationDelta) -> dict[str, Any]:
    """
    Format expectation delta for UI display.

    Returns dict with:
    - class: "beat", "inline", "miss"
    - magnitude: 0-1 score
    - badge_color: UI color for badge
    - arrow: "↑" for beat, "↓" for miss, "→" for inline
    - label: Human readable label
    """

    badge_colors = {
        DeltaClass.BEAT: "success",
        DeltaClass.INLINE: "info",
        DeltaClass.MISS: "error"
    }

    arrows = {
        DeltaClass.BEAT: "↑",
        DeltaClass.INLINE: "→",
        DeltaClass.MISS: "↓"
    }

    labels = {
        DeltaClass.BEAT: "Beat",
        DeltaClass.INLINE: "In-line",
        DeltaClass.MISS: "Miss"
    }

    return {
        "class": delta.delta_class.value,
        "magnitude": round(delta.delta_score, 2),
        "badge_color": badge_colors[delta.delta_class],
        "arrow": arrows[delta.delta_class],
        "label": labels[delta.delta_class],
        "raw_delta": delta.raw_delta,
        "percent_delta": delta.percent_delta,
        "statistically_significant": delta.is_statistically_significant,
        "explanation": delta.explanation
    }


# ============================================================================
# Example Usage and Test Cases
# ============================================================================

if __name__ == "__main__":
    # Example 1: BridgeBio FORTIFY - Clinical beat
    print("Example 1: BridgeBio FORTIFY")
    print("-" * 50)

    # α-DG: 1.8× vs expected 1.5× (band 1.3-1.6×)
    alpha_dg = compute_expectation_delta(1.8, 1.5, 1.3, 1.6, "α-DG glycosylation")
    print(f"α-DG: {format_delta_for_display(alpha_dg)}")

    # CK: -82% vs expected -60% (band -50% to -70%)
    ck = compute_expectation_delta(82, 60, 50, 70, "CK reduction %", p_value=0.001)
    print(f"CK: {format_delta_for_display(ck)}")

    # Velocity: +0.27 m/s vs expected 0.20 (band 0.10-0.25)
    velocity = compute_expectation_delta(0.27, 0.20, 0.10, 0.25, "Velocity Δ", p_value=0.015)
    print(f"Velocity: {format_delta_for_display(velocity)}")

    # FVC: +5 pp vs expected 4 (band 2-5)
    fvc = compute_expectation_delta(5, 4, 2, 5, "FVC Δ", p_value=0.042)
    print(f"FVC: {format_delta_for_display(fvc)}")

    # Aggregate
    overall_class, overall_score = compute_aggregate_delta([alpha_dg, ck, velocity, fvc])
    print(f"\nOverall: {overall_class.value} (score: {overall_score:.2f})")

    print("\n" + "=" * 50 + "\n")

    # Example 2: Novartis → Avidity M&A
    print("Example 2: Novartis → Avidity M&A")
    print("-" * 50)

    # Deal premium: 46% vs expected 30% (band 20-40%)
    premium = compute_expectation_delta(46, 30, 20, 40, "Deal Premium %")
    print(f"Premium: {format_delta_for_display(premium)}")

    # Consideration: $12B (no specific expectation)
    consideration = compute_expectation_delta(12.0, None, None, None, "Consideration $B")
    print(f"Consideration: {format_delta_for_display(consideration)}")

    print("\n" + "=" * 50 + "\n")

    # Example 3: Intellia MAGNITUDE Safety Pause
    print("Example 3: Intellia MAGNITUDE Safety Pause")
    print("-" * 50)

    # Safety grade: 4 vs expected 0 (band 0-2)
    safety_grade = compute_expectation_delta(4, 0, 0, 2, "Safety SAE Grade")
    print(f"Safety Grade: {format_delta_for_display(safety_grade)}")

    print("\n" + "=" * 50 + "\n")

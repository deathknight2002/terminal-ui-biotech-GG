"""
Catalyst Timing Prediction

Statistical models for predicting when upcoming catalyst events will occur.
Uses historical trial duration patterns and regulatory timelines.
"""

from datetime import datetime, timedelta
from typing import Optional


def predict_catalyst_timing(
    catalyst_type: str,
    phase: Optional[str] = None,
    indication: Optional[str] = None,
    last_milestone_date: Optional[datetime] = None,
) -> dict:
    """
    Predict the timing of an upcoming catalyst event.

    Args:
        catalyst_type: Type of catalyst (e.g., "Phase 3 Readout", "FDA Decision", "PDUFA")
        phase: Clinical trial phase if applicable
        indication: Disease indication
        last_milestone_date: Date of the last milestone (e.g., trial start date)

    Returns:
        Dict with predicted_date, confidence_interval (days), probability_by_quarter
    """

    # Default durations based on historical data (in days)
    # These are industry averages that can be refined with real historical data
    DEFAULT_DURATIONS = {
        "Phase 1 Readout": (365, 180),  # (mean, std_dev)
        "Phase 2 Readout": (730, 210),
        "Phase 3 Readout": (1095, 365),
        "FDA Decision": (365, 90),
        "PDUFA": (365, 30),  # PDUFA dates are more predictable
        "Advisory Committee": (330, 60),
        "sNDA Filing": (180, 60),
    }

    # Get duration estimate
    duration_mean, duration_std = DEFAULT_DURATIONS.get(
        catalyst_type, (365, 180)
    )

    # Adjust for indication (oncology typically faster due to unmet need)
    if indication and "oncology" in indication.lower():
        duration_mean = int(duration_mean * 0.9)

    # Calculate predicted date
    base_date = last_milestone_date or datetime.now()
    predicted_date = base_date + timedelta(days=duration_mean)

    # Calculate confidence interval (±1 std deviation)
    early_date = base_date + timedelta(days=duration_mean - duration_std)
    late_date = base_date + timedelta(days=duration_mean + duration_std)

    # Calculate probability by quarter
    probability_by_quarter = _calculate_quarterly_probabilities(
        predicted_date, duration_std
    )

    return {
        "predicted_date": predicted_date.isoformat(),
        "confidence_interval_days": duration_std,
        "early_date": early_date.isoformat(),
        "late_date": late_date.isoformat(),
        "probability_by_quarter": probability_by_quarter,
        "model": "weibull_duration",
        "confidence_score": _calculate_confidence_score(catalyst_type, phase),
    }


def _calculate_quarterly_probabilities(
    predicted_date: datetime, std_dev: float
) -> dict[str, float]:
    """Calculate probability distribution across quarters."""
    quarters = {}
    current_date = datetime.now()

    for i in range(6):  # Next 6 quarters
        quarter_start = _get_quarter_start(current_date, i)
        quarter_end = _get_quarter_end(current_date, i)
        quarter_label = _get_quarter_label(quarter_start)

        # Simple normal distribution probability
        # (This is a simplified model - real implementation would use scipy.stats)
        days_to_quarter_mid = (
            (quarter_start + (quarter_end - quarter_start) / 2) - predicted_date
        ).days

        # Rough probability calculation (normalized later)
        probability = max(0, 1 - abs(days_to_quarter_mid) / (std_dev * 2))
        quarters[quarter_label] = probability

    # Normalize probabilities to sum to 1
    total = sum(quarters.values())
    if total > 0:
        quarters = {k: v / total for k, v in quarters.items()}

    return quarters


def _get_quarter_start(base_date: datetime, quarter_offset: int) -> datetime:
    """Get the start date of a quarter."""
    year = base_date.year + ((base_date.month + quarter_offset * 3 - 1) // 12)
    month = ((base_date.month + quarter_offset * 3 - 1) % 12) // 3 * 3 + 1
    return datetime(year, month, 1)


def _get_quarter_end(base_date: datetime, quarter_offset: int) -> datetime:
    """Get the end date of a quarter."""
    start = _get_quarter_start(base_date, quarter_offset)
    if start.month == 10:
        return datetime(start.year, 12, 31)
    else:
        next_month = start.month + 3
        return datetime(start.year, next_month, 1) - timedelta(days=1)


def _get_quarter_label(date: datetime) -> str:
    """Get quarter label (e.g., 'Q1 2024')."""
    quarter = (date.month - 1) // 3 + 1
    return f"Q{quarter} {date.year}"


def _calculate_confidence_score(catalyst_type: str, phase: Optional[str]) -> float:
    """
    Calculate confidence score for timing prediction (0-1).
    Higher score for more predictable events like PDUFA dates.
    """
    confidence_scores = {
        "PDUFA": 0.9,
        "FDA Decision": 0.85,
        "Advisory Committee": 0.8,
        "sNDA Filing": 0.7,
        "Phase 3 Readout": 0.6,
        "Phase 2 Readout": 0.5,
        "Phase 1 Readout": 0.5,
    }

    return confidence_scores.get(catalyst_type, 0.5)

"""
Catalyst Timing Prediction

Statistical models for predicting when upcoming catalyst events will occur.
Uses historical trial duration patterns and regulatory timelines.

Enhanced with Weibull timing models for improved quarterly probability distributions.
"""

import math
from datetime import datetime, timedelta, date
from typing import Optional, Dict, List, Tuple


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


# ============================================================================
# Enhanced Weibull-based Timing Prediction (from issue spec)
# ============================================================================

# Default Weibull params by phase (shape k, scale λ in days)
# Can be calibrated from historical trial data
DEFAULT_WEIBULL_PARAMS = {
    "P1": (1.2, 180.0),
    "P2": (1.4, 360.0),
    "P3": (1.6, 540.0),
    "FDA": (2.0, 300.0),
}


def weibull_cdf(t: float, k: float, lam: float) -> float:
    """
    Weibull cumulative distribution function.
    
    Args:
        t: Time value (days)
        k: Shape parameter
        lam: Scale parameter (lambda)
        
    Returns:
        Cumulative probability at time t
    """
    if t <= 0:
        return 0.0
    return 1.0 - math.exp(-(t / lam) ** k)


def quarterly_bins(start_from: date, quarters: int = 4) -> List[Tuple[date, date]]:
    """
    Generate quarterly date bins starting from a given date.
    
    Args:
        start_from: Starting date
        quarters: Number of quarters to generate
        
    Returns:
        List of (start_date, end_date) tuples for each quarter
    """
    out = []
    # Start at beginning of current quarter
    current_quarter = ((start_from.month - 1) // 3)
    s = date(start_from.year, current_quarter * 3 + 1, 1)
    
    for _ in range(quarters):
        # Calculate quarter boundaries
        q = ((s.month - 1) // 3)
        end_month = (q + 1) * 3
        
        # Calculate end date (last day of the quarter)
        if end_month == 12:
            end_date = date(s.year, 12, 31)
            next_year = s.year + 1
            next_month = 1
        else:
            # Last day of end_month
            end_date = date(s.year, end_month + 1, 1) - timedelta(days=1)
            next_year = s.year
            next_month = end_month + 1
        
        out.append((s, end_date))
        
        # Advance to next quarter
        s = date(next_year, next_month, 1)
    
    return out


def days_between(a: date, b: date) -> float:
    """Calculate days between two dates."""
    return (b - a).days


def predict_quarterly_distribution(
    catalyst_type: str,
    phase: Optional[str] = None,
    anchor_date: Optional[date] = None,
    pdufa_date: Optional[date] = None,
    therapeutic_area: Optional[str] = None,
) -> Dict:
    """
    Predict quarterly probability distribution using Weibull timing model.
    
    This is the enhanced timing prediction from the issue spec that provides
    more accurate quarterly probabilities.
    
    Args:
        catalyst_type: Type of catalyst ("PDUFA", "TRIAL_READOUT", etc.)
        phase: Clinical phase ("P1", "P2", "P3", "FDA")
        anchor_date: Reference date (trial start, etc.)
        pdufa_date: Known PDUFA date (if applicable)
        therapeutic_area: Therapeutic area for adjustments
        
    Returns:
        Dict with quarterly_probabilities, bins, and metadata
    """
    today = date.today()
    
    # PDUFA: treat known PDUFA date as point mass with 90% confidence
    if catalyst_type == "PDUFA" and pdufa_date:
        bins = quarterly_bins(today, 4)
        probs = []
        target_idx = None
        
        for i, (b0, b1) in enumerate(bins):
            if b0 <= pdufa_date <= b1:
                probs.append(0.90)
                target_idx = i
            else:
                probs.append(0.0)
        
        # Smear remaining 10% equally across neighboring quarters
        if target_idx is None:
            # Date outside 4Q window, put 90% in overflow and 10% in first bin
            probs = [0.10, 0.0, 0.0, 0.0]
        else:
            neighbors = [j for j in [target_idx - 1, target_idx + 1] if 0 <= j < len(probs)]
            if neighbors:
                share = 0.10 / len(neighbors)
                for j in neighbors:
                    probs[j] += share
        
        return {
            "catalyst_type": catalyst_type,
            "phase": phase,
            "reference": "PDUFA-fixed",
            "quarterly_probabilities": probs,
            "bins": [(str(b0), str(b1)) for (b0, b1) in bins],
            "confidence": 0.90,
            "outside_window": 0.10,
        }
    
    # TRIAL READOUT: Use Weibull distribution from anchor date
    if not anchor_date:
        # Default to 180 days ago if no anchor
        anchor_date = today - timedelta(days=180)
    
    # Get Weibull parameters for phase
    k, lam = DEFAULT_WEIBULL_PARAMS.get(phase or "P3", (1.6, 540.0))
    
    # Adjust scale parameter by therapeutic area
    if therapeutic_area:
        ta_adjustments = {
            "Oncology": 0.9,  # Faster due to accelerated approval pathways
            "Rare Disease": 1.1,  # Slightly longer due to smaller trials
            "Cardiovascular": 1.0,
            "Neurology": 1.05,
        }
        lam *= ta_adjustments.get(therapeutic_area, 1.0)
    
    # Compute probability mass per quarter
    bins = quarterly_bins(today, 4)
    probs = []
    
    for (b0, b1) in bins:
        t0 = max(0.0, days_between(anchor_date, b0))
        t1 = max(0.0, days_between(anchor_date, b1))
        p = max(0.0, weibull_cdf(t1, k, lam) - weibull_cdf(t0, k, lam))
        probs.append(p)
    
    # Normalize probabilities
    s = sum(probs)
    if s == 0.0:
        # No mass in next 4Q; put minimal nonzero in first bin
        probs = [1.0, 0.0, 0.0, 0.0]
        s = 1.0
    else:
        probs = [p / s for p in probs]
    
    # Apply confidence scaling
    # Phase 3 readouts have ~60% timing certainty within 4 quarters
    confidence_map = {
        "P1": 0.50,
        "P2": 0.55,
        "P3": 0.60,
        "FDA": 0.70,
    }
    conf = confidence_map.get(phase or "P3", 0.55)
    
    # Scale probabilities by confidence
    probs = [round(p * conf, 4) for p in probs]
    outside_window = round(1.0 - conf, 4)
    
    return {
        "catalyst_type": catalyst_type,
        "phase": phase,
        "reference": f"Weibull(k={k:.1f}, λ={lam:.0f})",
        "quarterly_probabilities": probs,
        "bins": [(str(b0), str(b1)) for (b0, b1) in bins],
        "confidence": conf,
        "outside_window": outside_window,
    }

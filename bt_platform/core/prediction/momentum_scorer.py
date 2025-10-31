"""
Momentum Scoring

Calculate catalyst momentum scores for companies and therapeutic areas.
Tracks the cadence and outcomes of recent catalysts to gauge momentum.
"""

from datetime import datetime, timedelta
from typing import Optional


def calculate_momentum_score(
    recent_catalysts: list[dict],
    lookback_months: int = 6,
    weight_recent: bool = True,
) -> dict:
    """
    Calculate momentum score based on recent catalyst outcomes.

    Args:
        recent_catalysts: List of catalyst dicts with 'date', 'outcome', 'type'
        lookback_months: Number of months to look back
        weight_recent: Whether to weight recent catalysts more heavily

    Returns:
        Dict with overall_score (0-100), trend, key_metrics
    """

    if not recent_catalysts:
        return {
            "overall_score": 50,  # Neutral when no data
            "trend": "neutral",
            "catalyst_count": 0,
            "success_rate": None,
            "key_metrics": {},
        }

    # Filter to lookback period
    cutoff_date = datetime.now() - timedelta(days=lookback_months * 30)
    recent = [
        c for c in recent_catalysts
        if _parse_date(c.get("date")) >= cutoff_date
    ]

    if not recent:
        return {
            "overall_score": 50,
            "trend": "neutral",
            "catalyst_count": 0,
            "success_rate": None,
            "key_metrics": {},
        }

    # Calculate success rate
    outcomes = [c.get("outcome", "").lower() for c in recent]
    successes = sum(1 for o in outcomes if o in ["success", "positive", "approved"])
    failures = sum(1 for o in outcomes if o in ["failure", "negative", "rejected"])
    total = len([o for o in outcomes if o])

    success_rate = successes / total if total > 0 else 0.5

    # Calculate base score from success rate (0-100 scale)
    base_score = success_rate * 100

    # Adjust for cadence (frequency of catalysts)
    # More catalysts = more momentum
    cadence_boost = min(20, len(recent) * 2)

    # Adjust for recency if weighted
    if weight_recent:
        # Give more weight to recent catalysts
        recency_scores = []
        for catalyst in recent:
            days_ago = (datetime.now() - _parse_date(catalyst.get("date"))).days
            decay = max(0, 1 - (days_ago / (lookback_months * 30)))
            outcome_score = 1 if catalyst.get("outcome", "").lower() in ["success", "positive", "approved"] else 0
            recency_scores.append(outcome_score * decay)

        if recency_scores:
            recency_adjustment = (sum(recency_scores) / len(recency_scores) - 0.5) * 20
            base_score += recency_adjustment

    # Adjust for consecutive wins/losses (streak momentum)
    streak = _calculate_streak(recent)
    if abs(streak) >= 2:
        streak_boost = min(15, abs(streak) * 5) * (1 if streak > 0 else -1)
        base_score += streak_boost

    # Add cadence boost
    base_score += cadence_boost

    # Clamp to 0-100
    overall_score = max(0, min(100, base_score))

    # Determine trend
    trend = _determine_trend(overall_score, success_rate, streak)

    # Calculate key metrics
    key_metrics = {
        "catalyst_count": len(recent),
        "success_count": successes,
        "failure_count": failures,
        "success_rate": round(success_rate, 3),
        "streak": streak,
        "cadence": round(len(recent) / lookback_months, 2),  # Catalysts per month
    }

    return {
        "overall_score": round(overall_score, 1),
        "trend": trend,
        "catalyst_count": len(recent),
        "success_rate": round(success_rate, 3),
        "key_metrics": key_metrics,
    }


def calculate_therapeutic_area_momentum(
    catalysts_by_area: dict[str, list[dict]],
    lookback_months: int = 6,
) -> dict[str, dict]:
    """
    Calculate momentum scores for multiple therapeutic areas.

    Args:
        catalysts_by_area: Dict mapping area name to list of catalysts
        lookback_months: Number of months to look back

    Returns:
        Dict mapping area name to momentum score dict
    """
    results = {}

    for area, catalysts in catalysts_by_area.items():
        results[area] = calculate_momentum_score(
            catalysts,
            lookback_months=lookback_months,
            weight_recent=True,
        )

    # Add comparative ranking
    sorted_areas = sorted(
        results.items(),
        key=lambda x: x[1]["overall_score"],
        reverse=True
    )

    for rank, (area, _score_dict) in enumerate(sorted_areas, 1):
        results[area]["rank"] = rank
        results[area]["percentile"] = round((1 - (rank - 1) / len(sorted_areas)) * 100, 1)

    return results


def _parse_date(date_str: Optional[str]) -> datetime:
    """Parse date string to datetime."""
    if not date_str:
        return datetime.min

    try:
        if isinstance(date_str, datetime):
            return date_str
        return datetime.fromisoformat(date_str.replace("Z", "+00:00"))
    except (ValueError, AttributeError, TypeError):
        return datetime.min


def _calculate_streak(catalysts: list[dict]) -> int:
    """
    Calculate current streak of wins or losses.
    Positive = winning streak, negative = losing streak.
    """
    if not catalysts:
        return 0

    # Sort by date (most recent first)
    sorted_catalysts = sorted(
        catalysts,
        key=lambda c: _parse_date(c.get("date")),
        reverse=True
    )

    streak = 0
    last_outcome = None

    for catalyst in sorted_catalysts:
        outcome = catalyst.get("outcome", "").lower()
        if not outcome:
            continue

        is_success = outcome in ["success", "positive", "approved"]
        is_failure = outcome in ["failure", "negative", "rejected"]

        if not is_success and not is_failure:
            continue

        if last_outcome is None:
            last_outcome = is_success
            streak = 1 if is_success else -1
        elif last_outcome == is_success:
            streak += 1 if is_success else -1
        else:
            break

    return streak


def _determine_trend(overall_score: float, success_rate: float, streak: int) -> str:
    """Determine trend label based on metrics."""
    if overall_score >= 75 or (success_rate >= 0.7 and streak >= 2):
        return "strong_positive"
    elif overall_score >= 60 or success_rate >= 0.6:
        return "positive"
    elif overall_score <= 25 or (success_rate <= 0.3 and streak <= -2):
        return "strong_negative"
    elif overall_score <= 40 or success_rate <= 0.4:
        return "negative"
    else:
        return "neutral"

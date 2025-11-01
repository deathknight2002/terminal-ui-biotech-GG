"""
Enhanced Momentum Scoring v2

Advanced momentum scoring with:
- Exponential recency decay (30-day half-life)
- Streak detection and boosting (capped at 5)
- Therapeutic area z-score comparison (peer-neutral)
- 0-100 scaling via tanh for bounded output

All computations use stdlib only.
"""

import math
import datetime as dt
from typing import Dict, List, Tuple
from statistics import mean, pstdev

# Configuration constants
HALF_LIFE = 30.0      # Recency decay half-life in days
STREAK_UNIT = 6.0     # Points per streak step
TA_WEIGHT = 0.35      # Therapeutic area z-score contribution weight


def _decay(days_ago: float) -> float:
    """
    Exponential decay weight based on half-life.
    
    Weight = 0.5^(days_ago / HALF_LIFE)
    
    Args:
        days_ago: Number of days since event
        
    Returns:
        Decay weight (0-1)
    """
    return 0.5 ** (days_ago / HALF_LIFE)


def _raw(events: List[Tuple[dt.date, int, float]]) -> float:
    """
    Calculate raw momentum from event history with recency decay.
    
    Args:
        events: List of (date, polarity:+1/-1, importance_weight) tuples
        
    Returns:
        Raw momentum score (can be negative)
    """
    if not events:
        return 0.0
    
    today = dt.date.today()
    s = 0.0
    
    for (d, pol, w) in events:
        # Handle both date and datetime objects
        if isinstance(d, dt.datetime):
            d = d.date()
        
        # Calculate days since event
        age = (today - d).days
        
        # Apply exponential decay weighting
        s += pol * w * _decay(max(0, age))
    
    return s


def _streak(events: List[Tuple[dt.date, int, float]]) -> float:
    """
    Calculate streak momentum boost.
    
    Detects consecutive positive or negative outcomes and boosts/penalizes
    the score accordingly. Capped at 5 consecutive events to prevent domination.
    
    Args:
        events: List of (date, polarity:+1/-1, importance_weight) tuples
        
    Returns:
        Streak boost (positive for winning streak, negative for losing)
    """
    if not events:
        return 0.0
    
    # Sort by date ascending to detect streaks chronologically
    arr = sorted(events, key=lambda x: x[0])
    
    last = 0
    st = 0
    
    for (_, pol, _) in arr:
        if pol == last and pol != 0:
            # Continue streak
            st += 1
        else:
            # New streak starts
            st = 1
            last = pol
    
    # Cap streak contribution to prevent one hot period from dominating
    st = min(5, st)
    
    # Apply streak direction (positive or negative)
    return STREAK_UNIT * st * (1 if last > 0 else -1)


def score_company_advanced(
    company: str,
    company_events: List[Tuple[dt.date, int, float]] = None,
    ta_events_map: Dict[str, List[Tuple[dt.date, int, float]]] = None
) -> Dict:
    """
    Advanced momentum scoring with decay, streaks, and TA comparison.
    
    This is the enhanced momentum scorer with:
    - Exponential recency decay (30-day half-life)
    - Streak detection and boosting
    - Therapeutic area z-score comparison (peer-neutral)
    - 0-100 scaling via tanh
    
    Args:
        company: Company name
        company_events: List of (date, polarity, weight) for company
        ta_events_map: Dict of therapeutic_area -> list of events for comparison
        
    Returns:
        Dict with momentum_score (0-100) and component breakdown
    """
    # Use empty list if no events provided
    if company_events is None:
        company_events = []
    
    # Calculate base momentum with recency decay
    base = _raw(company_events)
    
    # Calculate streak boost
    streak = _streak(company_events)
    
    # Calculate TA comparison z-score
    z = 0.0
    if ta_events_map:
        # Calculate raw scores for all TAs
        ta_scores = [_raw(v) for v in ta_events_map.values() if v]
        
        if ta_scores:
            # Z-score: (company - mean) / stdev
            m = mean(ta_scores)
            s = pstdev(ta_scores) or 1.0
            z = (base - m) / s
    
    # Combine components
    combined = base + streak + TA_WEIGHT * z
    
    # Scale to 0-100 using tanh for bounded output
    # tanh maps (-inf, inf) to (-1, 1)
    # So 50 + 50*tanh(x) maps to (0, 100)
    scaled = 50 + 50 * math.tanh(0.25 * combined)
    
    return {
        "company": company,
        "momentum_score": round(scaled, 1),
        "components": {
            "base": round(base, 3),
            "streak": round(streak, 3),
            "ta_z": round(z, 3)
        },
        "event_count": len(company_events)
    }

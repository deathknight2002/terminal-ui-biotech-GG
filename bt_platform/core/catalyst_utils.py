"""
Catalyst Event Utilities

Functions for expectation delta calculation, peer comparison, and market reaction analysis.
"""

from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


# ============================================================================
# EXPECTATION DELTA CALCULATION
# ============================================================================

def compute_expectation_delta(
    outcome: Dict[str, Any],
    expectation_band: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Returns +1 (beat), 0 (in-line), -1 (miss) with magnitude score 0..1
    
    Args:
        outcome: Dictionary with 'value' key containing actual outcome
        expectation_band: Dictionary with 'band_low' and 'band_high' keys
        
    Returns:
        Dictionary with 'class' (beat/inline/miss) and 'score' (0-1 magnitude)
    """
    val = outcome.get("value")
    lo = expectation_band.get("band_low")
    hi = expectation_band.get("band_high")
    
    # Handle missing data
    if val is None:
        return {"class": "unknown", "score": 0.0}
    
    # Handle boolean outcomes
    if isinstance(val, bool):
        expected = expectation_band.get("expected", False)
        if val == expected:
            return {"class": "inline", "score": 0.2}
        return {"class": "miss" if not val else "beat", "score": 1.0}
    
    # Convert to float for numeric comparison
    try:
        val = float(val)
        if lo is not None:
            lo = float(lo)
        if hi is not None:
            hi = float(hi)
    except (ValueError, TypeError):
        return {"class": "unknown", "score": 0.0}
    
    # Handle missing band
    if lo is None or hi is None:
        expected = expectation_band.get("expected")
        if expected is None:
            return {"class": "unknown", "score": 0.0}
        expected = float(expected)
        # Use expected +/- 10% as rough band
        lo = expected * 0.9
        hi = expected * 1.1
    
    # Calculate delta
    if val > hi:
        # Beat expectations
        magnitude = min((val - hi) / (hi if hi != 0 else 1), 1.0)
        return {"class": "beat", "score": magnitude}
    elif val < lo:
        # Miss expectations
        magnitude = min((lo - val) / (lo if lo != 0 else 1), 1.0)
        return {"class": "miss", "score": magnitude}
    else:
        # In-line with expectations
        return {"class": "inline", "score": 0.2}


def batch_compute_deltas(
    outcomes: List[Dict[str, Any]],
    expectations: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Compute expectation deltas for multiple metrics
    
    Args:
        outcomes: List of outcome dictionaries with 'name' and 'value'
        expectations: List of expectation dictionaries with 'name', 'band_low', 'band_high'
        
    Returns:
        List of dictionaries with metric name and delta result
    """
    results = []
    
    # Create lookup for expectations by metric name
    exp_lookup = {exp["name"]: exp for exp in expectations}
    
    for outcome in outcomes:
        metric_name = outcome.get("name")
        if metric_name in exp_lookup:
            delta = compute_expectation_delta(outcome, exp_lookup[metric_name])
            results.append({
                "metric": metric_name,
                "outcome_value": outcome.get("value"),
                "expected_band": [
                    exp_lookup[metric_name].get("band_low"),
                    exp_lookup[metric_name].get("band_high")
                ],
                "delta": delta
            })
    
    return results


# ============================================================================
# PEER COMPARISON & ANALYSIS
# ============================================================================

def get_peers_by_moat(
    ticker: str,
    indication: Optional[str] = None,
    moa: Optional[str] = None,
    stage: Optional[str] = None,
    db_session = None
) -> List[Dict[str, Any]]:
    """
    Get peer companies based on moat axes (MoA, Stage, Indication, Delivery, Target)
    
    Returns weighted list with reason tags for explainability
    """
    # This is a placeholder - would query database in real implementation
    # For now, return empty list (to be implemented with actual DB queries)
    peers = []
    
    logger.info(f"Getting peers for {ticker} (indication={indication}, moa={moa}, stage={stage})")
    
    # TODO: Implement actual peer lookup logic
    # - Query database for similar companies
    # - Weight by indication match > stage proximity > MoA similarity
    # - Add reason tags for explainability
    
    return peers


def calculate_peer_metrics(
    ticker: str,
    metric: str,
    value: float,
    peers: List[Dict[str, Any]],
    db_session = None
) -> Dict[str, Any]:
    """
    Calculate comparative metrics (median, p75, delta) for a given metric
    
    Args:
        ticker: Company ticker
        metric: Metric name (e.g., "1D move post-print")
        value: Value for the target company
        peers: List of peer companies
        db_session: Database session for querying peer data
        
    Returns:
        Dictionary with value, peer_median, peer_p75, delta_to_median
    """
    # Placeholder implementation
    # TODO: Query actual peer data from database
    
    return {
        "metric": metric,
        "value": value,
        "peer_median": None,  # To be calculated from peer data
        "peer_p75": None,     # To be calculated from peer data
        "delta_to_median": None  # value - peer_median
    }


# ============================================================================
# MARKET REACTION TRACKING
# ============================================================================

def get_price_reaction(
    ticker: str,
    event_date: datetime,
    windows: List[str] = ["D-5", "D-1", "D0", "D+1", "D+5", "D+10"],
    db_session = None
) -> List[Dict[str, Any]]:
    """
    Get price reactions for specified windows around event date
    
    Args:
        ticker: Company ticker
        event_date: Event date/time
        windows: List of relative windows (D-5, D0, D+1, etc.)
        db_session: Database session
        
    Returns:
        List of price reaction dictionaries with window, abs, rel_vs_XBI
    """
    reactions = []
    
    for window in windows:
        # Parse window (D-5 means 5 days before, D+1 means 1 day after)
        if window.startswith("D"):
            offset_str = window[1:]  # Remove 'D'
            if offset_str.startswith("+"):
                offset = int(offset_str[1:])
            elif offset_str.startswith("-"):
                offset = -int(offset_str[1:])
            else:
                offset = int(offset_str)
            
            target_date = event_date + timedelta(days=offset)
            
            # TODO: Query actual price data from database
            # For now, return placeholder
            reactions.append({
                "window": window,
                "abs": None,  # % change
                "rel_vs_XBI": None,  # relative to XBI
                "target_date": target_date.isoformat()
            })
    
    return reactions


def get_iv_reaction(
    ticker: str,
    event_date: datetime,
    tenors: List[str] = ["1w", "1m", "3m"],
    windows: List[str] = ["D0", "D+1"],
    db_session = None
) -> List[Dict[str, Any]]:
    """
    Get implied volatility reactions for specified tenors and windows
    
    Args:
        ticker: Company ticker
        event_date: Event date/time
        tenors: List of option tenors (1w, 1m, 3m)
        windows: List of relative windows (D0, D+1)
        db_session: Database session
        
    Returns:
        List of IV reaction dictionaries with tenor, window, iv, zscore_vs_1y
    """
    reactions = []
    
    for tenor in tenors:
        for window in windows:
            # TODO: Query actual IV data from database or options API
            reactions.append({
                "tenor": tenor,
                "window": window,
                "iv": None,
                "zscore_vs_1y": None
            })
    
    return reactions


# ============================================================================
# QUADRANT SLIDE GENERATION
# ============================================================================

def generate_quadrant_slide(
    event_id: str,
    headline: str,
    tldr: str,
    expectations: List[Dict[str, Any]],
    outcomes: List[Dict[str, Any]],
    market_reaction: Dict[str, Any],
    peers: List[Dict[str, Any]],
    competitive_narrative: str,
    sources: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Generate structured data for quadrant slide visualization
    
    Returns complete quadrant slide data structure
    """
    # Calculate expectation deltas
    deltas = batch_compute_deltas(outcomes, expectations)
    
    # Build quadrant structure
    quadrant_slide = {
        "event_id": event_id,
        "quadrants": {
            "q1": {
                "headline": headline,
                "tldr": tldr,
            },
            "q2": {
                "key_metrics": outcomes,
                "charts": []  # To be populated with chart specs
            },
            "q3": {
                "expectation_deltas": deltas,
                "stock_reaction": {
                    "price_panels": market_reaction.get("price", []),
                    "iv_changes": market_reaction.get("iv", [])
                }
            },
            "q4": {
                "landscape": competitive_narrative,
                "peers": peers,
                "what_matters": "",  # To be filled with key insights
                "next_steps": []
            }
        },
        "footer": {
            "sources": sources,
            "generated_at": datetime.utcnow().isoformat()
        }
    }
    
    return quadrant_slide


# ============================================================================
# ALERTING LOGIC
# ============================================================================

def should_alert(
    expectation_deltas: List[Dict[str, Any]],
    market_reaction: Dict[str, Any],
    volume_multiple: float = 1.5,
    microcap_threshold: float = 500  # $500M market cap
) -> Tuple[bool, str]:
    """
    Determine if catalyst event should trigger alert
    
    Rules:
    - Alert if expectation_delta.score >= 0.5
    - OR |CAR_D0| >= 5%
    - Kill-switch: if microcap && volume_multiple < 1.5x then suppress
    
    Returns:
        (should_alert: bool, reason: str)
    """
    # Check expectation delta scores
    high_delta = any(d.get("delta", {}).get("score", 0) >= 0.5 for d in expectation_deltas)
    
    # Check price reaction
    price_reactions = market_reaction.get("price", [])
    d0_reaction = next((p for p in price_reactions if p.get("window") == "D0"), {})
    large_move = abs(d0_reaction.get("abs", 0)) >= 5.0
    
    if high_delta:
        return True, "High expectation delta (score >= 0.5)"
    
    if large_move:
        return True, f"Large price move (|CAR_D0| = {d0_reaction.get('abs', 0):.1f}%)"
    
    return False, "No significant catalyst impact"


# ============================================================================
# DATA VALIDATION
# ============================================================================

def validate_catalyst_event(event_data: Dict[str, Any]) -> Tuple[bool, List[str]]:
    """
    Validate catalyst event data structure
    
    Returns:
        (is_valid: bool, errors: List[str])
    """
    errors = []
    
    # Required fields
    required_fields = ["event_id", "as_of", "company", "catalyst"]
    for field in required_fields:
        if field not in event_data:
            errors.append(f"Missing required field: {field}")
    
    # Validate company structure
    if "company" in event_data:
        company = event_data["company"]
        if not isinstance(company, dict):
            errors.append("Company must be a dictionary")
        elif "name" not in company or "ticker" not in company:
            errors.append("Company must have 'name' and 'ticker' fields")
    
    # Validate catalyst structure
    if "catalyst" in event_data:
        catalyst = event_data["catalyst"]
        if not isinstance(catalyst, dict):
            errors.append("Catalyst must be a dictionary")
        elif "type" not in catalyst:
            errors.append("Catalyst must have 'type' field")
    
    # Validate expectation bands if present
    if "expectations" in event_data:
        exp = event_data["expectations"]
        if "metrics" in exp:
            for i, metric in enumerate(exp["metrics"]):
                if "name" not in metric or "unit" not in metric:
                    errors.append(f"Expectation metric {i} missing 'name' or 'unit'")
                
                # Validate band consistency
                if "band_low" in metric and "band_high" in metric:
                    if metric["band_low"] > metric["band_high"]:
                        errors.append(f"Expectation metric {i}: band_low > band_high")
    
    return len(errors) == 0, errors

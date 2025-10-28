"""
Catalyst Event Service

Provides services for catalyst event tracking with expectation bands,
peer analysis, and market reactions.
"""

from typing import Dict, List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import select
from datetime import datetime, timedelta
import logging

from ..database import (
    Catalyst,
    CatalystExpectationBand,
    CatalystOutcomeMetric,
    CatalystMarketReaction,
    CatalystPeer,
    CatalystPeerMetric,
    CatalystSource,
)

logger = logging.getLogger(__name__)


def compute_expectation_delta(
    outcome: Dict, 
    expectation_band: Dict
) -> Dict[str, float]:
    """
    Calculate expectation delta for a metric.
    
    Returns:
        {
            "class": "beat" | "inline" | "miss",
            "score": 0.0 to 1.0 (magnitude)
        }
    
    Logic:
        - If outcome > band_high: beat
        - If outcome < band_low: miss
        - Otherwise: inline
    """
    try:
        val = outcome.get("value")
        if val is None:
            return {"class": "inline", "score": 0.0}
        
        lo = expectation_band.get("band_low")
        hi = expectation_band.get("band_high")
        
        if lo is None or hi is None:
            return {"class": "inline", "score": 0.2}
        
        # Beat: above high band
        if val > hi:
            magnitude = min((val - hi) / (hi if hi != 0 else 1), 1.0)
            return {"class": "beat", "score": magnitude}
        
        # Miss: below low band
        if val < lo:
            magnitude = min((lo - val) / (lo if lo != 0 else 1), 1.0)
            return {"class": "miss", "score": magnitude}
        
        # Inline: within band
        return {"class": "inline", "score": 0.2}
    
    except (TypeError, ValueError) as e:
        logger.warning(f"Error computing expectation delta: {e}")
        return {"class": "inline", "score": 0.0}


def get_catalyst_event(
    db: Session,
    catalyst_id: int
) -> Optional[Dict]:
    """
    Retrieve full catalyst event with all related data.
    
    Returns enriched event JSON with:
        - Basic catalyst info
        - Expectation bands
        - Outcome metrics
        - Market reactions
        - Peer analysis
        - Sources
    """
    # Get catalyst
    catalyst = db.query(Catalyst).filter(Catalyst.id == catalyst_id).first()
    if not catalyst:
        return None
    
    # Get expectation bands
    expectations = db.query(CatalystExpectationBand).filter(
        CatalystExpectationBand.catalyst_id == catalyst_id
    ).all()
    
    # Get outcome metrics
    outcomes = db.query(CatalystOutcomeMetric).filter(
        CatalystOutcomeMetric.catalyst_id == catalyst_id
    ).all()
    
    # Get market reactions
    reactions = db.query(CatalystMarketReaction).filter(
        CatalystMarketReaction.catalyst_id == catalyst_id
    ).all()
    
    # Get peers
    peers = db.query(CatalystPeer).filter(
        CatalystPeer.catalyst_id == catalyst_id
    ).all()
    
    # Get peer metrics
    peer_metrics = db.query(CatalystPeerMetric).filter(
        CatalystPeerMetric.catalyst_id == catalyst_id
    ).all()
    
    # Get sources
    sources = db.query(CatalystSource).filter(
        CatalystSource.catalyst_id == catalyst_id
    ).all()
    
    # Build event JSON
    event = {
        "event_id": f"catalyst_{catalyst.id}",
        "as_of": catalyst.event_date.isoformat() if catalyst.event_date else None,
        "company": {
            "name": catalyst.company,
            "ticker": catalyst.company,  # TODO: Extract ticker properly
        },
        "catalyst": {
            "type": catalyst.event_type or "Unknown",
            "subtype": catalyst.kind,
            "program": catalyst.drug or catalyst.name,
            "indication": catalyst.description or "",
        },
        "expectations": {
            "source": expectations[0].source if expectations else "unknown",
            "metrics": [
                {
                    "name": exp.metric,
                    "unit": exp.unit,
                    "expected": exp.expected,
                    "band_low": exp.band_low,
                    "band_high": exp.band_high,
                    "what_matters": exp.what_matters,
                }
                for exp in expectations
            ],
        },
        "outcome": {
            "metrics": [
                {
                    "name": out.metric,
                    "unit": out.unit,
                    "value": out.value,
                    "value_str": out.value_str,
                    "pvalue": out.p_value,
                    "n": out.n,
                    "window": out.window,
                }
                for out in outcomes
            ],
        },
        "market_reaction": {
            "price": [
                {
                    "window": react.window,
                    "abs": react.abs_return,
                    "rel_vs_XBI": react.rel_vs_xbi,
                    "intraday_high_low": react.intraday_high_low,
                }
                for react in reactions
            ],
            "iv": [
                {
                    "tenor": react.iv_tenor,
                    "window": react.window,
                    "iv": react.iv,
                    "zscore_vs_1y": react.iv_zscore_vs_1y,
                }
                for react in reactions
                if react.iv is not None
            ],
            "vol": [
                {
                    "window": react.window,
                    "volume_multiple_vs_30d": react.volume_multiple_vs_30d,
                }
                for react in reactions
                if react.volume_multiple_vs_30d is not None
            ],
        } if reactions else None,
        "peers": {
            "moat_axes": ["MoA", "Stage", "Indication", "Delivery", "Target"],
            "list": [
                {
                    "ticker": peer.peer_ticker,
                    "name": peer.peer_name,
                    "reason_tag": peer.reason_tag,
                    "weight": peer.weight,
                }
                for peer in peers
            ],
            "comp_metrics": [
                {
                    "metric": pm.metric,
                    "value": pm.value,
                    "peer_median": pm.peer_median,
                    "peer_p75": pm.peer_p75,
                    "delta_to_median": pm.delta_to_median,
                }
                for pm in peer_metrics
            ],
        } if peers or peer_metrics else None,
        "sources": [
            {
                "title": src.title,
                "url": src.url,
                "ts": src.timestamp.isoformat(),
                "type": src.source_type,
            }
            for src in sources
        ],
    }
    
    return event


def calculate_all_expectation_deltas(
    db: Session,
    catalyst_id: int
) -> List[Dict]:
    """
    Calculate expectation deltas for all metrics of a catalyst.
    
    Returns list of:
        {
            "metric": str,
            "expected": float,
            "actual": float,
            "delta": {"class": str, "score": float}
        }
    """
    expectations = db.query(CatalystExpectationBand).filter(
        CatalystExpectationBand.catalyst_id == catalyst_id
    ).all()
    
    outcomes = db.query(CatalystOutcomeMetric).filter(
        CatalystOutcomeMetric.catalyst_id == catalyst_id
    ).all()
    
    # Create outcome lookup
    outcome_map = {out.metric: out for out in outcomes}
    
    results = []
    for exp in expectations:
        outcome = outcome_map.get(exp.metric)
        if outcome:
            delta = compute_expectation_delta(
                {"value": outcome.value},
                {
                    "band_low": exp.band_low,
                    "band_high": exp.band_high,
                }
            )
            results.append({
                "metric": exp.metric,
                "expected": exp.expected,
                "actual": outcome.value,
                "delta": delta,
            })
    
    return results


def get_peer_comparisons(
    db: Session,
    catalyst_id: int,
    indication: Optional[str] = None,
    moa: Optional[str] = None
) -> List[Dict]:
    """
    Get peer comparisons for a catalyst.
    
    Can filter by indication and mechanism of action.
    Returns weighted list with explainability.
    """
    query = db.query(CatalystPeer).filter(
        CatalystPeer.catalyst_id == catalyst_id
    )
    
    peers = query.all()
    
    # Sort by weight (descending) and return structured data
    peer_list = []
    for peer in sorted(peers, key=lambda p: p.weight or 0, reverse=True):
        moat_axes = []
        if peer.moat_moa:
            moat_axes.append("MoA")
        if peer.moat_stage:
            moat_axes.append("Stage")
        if peer.moat_indication:
            moat_axes.append("Indication")
        if peer.moat_delivery:
            moat_axes.append("Delivery")
        if peer.moat_target:
            moat_axes.append("Target")
        
        peer_list.append({
            "ticker": peer.peer_ticker,
            "name": peer.peer_name,
            "reason_tag": peer.reason_tag,
            "weight": peer.weight,
            "moat_axes": moat_axes,
        })
    
    return peer_list

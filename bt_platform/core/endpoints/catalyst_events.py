"""
Catalyst Events API Endpoints

RESTful API for managing and querying catalyst events with expectations,
outcomes, and market reactions.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_, or_
from datetime import datetime, timedelta
import logging

from ..database import get_db, CatalystEvent, ExpectationBand, PriceReaction, IVReaction, PeerComparison
from ..catalyst_utils import (
    compute_expectation_delta,
    batch_compute_deltas,
    generate_quadrant_slide,
    validate_catalyst_event,
    should_alert
)

logger = logging.getLogger(__name__)

router = APIRouter()


# ============================================================================
# CATALYST EVENT ENDPOINTS
# ============================================================================

@router.get("/events", summary="List catalyst events")
def list_catalyst_events(
    catalyst_type: Optional[str] = Query(None, description="Filter by catalyst type (M&A, PH3_READOUT, etc.)"),
    company_ticker: Optional[str] = Query(None, description="Filter by company ticker"),
    program: Optional[str] = Query(None, description="Filter by program name"),
    start_date: Optional[str] = Query(None, description="Filter events after this date (ISO format)"),
    end_date: Optional[str] = Query(None, description="Filter events before this date (ISO format)"),
    limit: int = Query(100, ge=1, le=500, description="Number of events to return"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    db: Session = Depends(get_db)
):
    """
    List catalyst events with optional filters
    
    Returns list of catalyst events with full tracking data
    """
    query = db.query(CatalystEvent)
    
    # Apply filters
    if catalyst_type:
        query = query.filter(CatalystEvent.catalyst_type == catalyst_type)
    
    if company_ticker:
        query = query.filter(CatalystEvent.company_ticker == company_ticker)
    
    if program:
        query = query.filter(CatalystEvent.program.ilike(f"%{program}%"))
    
    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            query = query.filter(CatalystEvent.as_of >= start_dt)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start_date format")
    
    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            query = query.filter(CatalystEvent.as_of <= end_dt)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid end_date format")
    
    # Order by date descending
    query = query.order_by(desc(CatalystEvent.as_of))
    
    # Pagination
    total = query.count()
    events = query.offset(offset).limit(limit).all()
    
    # Convert to dict
    results = []
    for event in events:
        results.append({
            "event_id": event.event_id,
            "as_of": event.as_of.isoformat(),
            "company": {
                "name": event.company_name,
                "ticker": event.company_ticker,
                "exchange": event.company_exchange,
                "logo_url": event.company_logo_url
            },
            "catalyst": {
                "type": event.catalyst_type,
                "subtype": event.catalyst_subtype,
                "program": event.program,
                "indication": event.indication,
                "geography": event.geography
            },
            "expectations": {
                "source": event.expectation_source,
                "metrics": event.expectation_metrics
            },
            "outcome": {
                "metrics": event.outcome_metrics
            } if event.outcome_metrics else None,
            "market_reaction": event.market_reaction_data,
            "peers": event.peer_analysis_data,
            "sources": event.sources
        })
    
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "events": results
    }


@router.get("/events/{event_id}", summary="Get catalyst event by ID")
def get_catalyst_event(
    event_id: str,
    db: Session = Depends(get_db)
):
    """
    Get detailed information for a specific catalyst event
    
    Includes expectations, outcomes, market reactions, and peer comparisons
    """
    event = db.query(CatalystEvent).filter(CatalystEvent.event_id == event_id).first()
    
    if not event:
        raise HTTPException(status_code=404, detail="Catalyst event not found")
    
    # Get related data
    expectation_bands = db.query(ExpectationBand).filter(
        ExpectationBand.event_id == event_id
    ).all()
    
    price_reactions = db.query(PriceReaction).filter(
        PriceReaction.event_id == event_id
    ).all()
    
    iv_reactions = db.query(IVReaction).filter(
        IVReaction.event_id == event_id
    ).all()
    
    peer_comparisons = db.query(PeerComparison).filter(
        PeerComparison.event_id == event_id
    ).all()
    
    return {
        "event_id": event.event_id,
        "as_of": event.as_of.isoformat(),
        "company": {
            "name": event.company_name,
            "ticker": event.company_ticker,
            "exchange": event.company_exchange,
            "logo_url": event.company_logo_url
        },
        "catalyst": {
            "type": event.catalyst_type,
            "subtype": event.catalyst_subtype,
            "program": event.program,
            "indication": event.indication,
            "geography": event.geography
        },
        "expectations": {
            "source": event.expectation_source,
            "metrics": event.expectation_metrics,
            "bands": [
                {
                    "metric": band.metric,
                    "unit": band.unit,
                    "expected": band.expected,
                    "band_low": band.band_low,
                    "band_high": band.band_high,
                    "what_matters": band.what_matters,
                    "source": band.source
                }
                for band in expectation_bands
            ]
        },
        "outcome": {
            "metrics": event.outcome_metrics
        } if event.outcome_metrics else None,
        "market_reaction": {
            "data": event.market_reaction_data,
            "price_reactions": [
                {
                    "window": pr.window,
                    "abs_change": pr.abs_change,
                    "rel_vs_xbi": pr.rel_vs_xbi,
                    "intraday_high": pr.intraday_high,
                    "intraday_low": pr.intraday_low,
                    "timestamp": pr.timestamp.isoformat()
                }
                for pr in price_reactions
            ],
            "iv_reactions": [
                {
                    "tenor": iv.tenor,
                    "window": iv.window,
                    "iv": iv.iv,
                    "zscore_vs_1y": iv.zscore_vs_1y,
                    "timestamp": iv.timestamp.isoformat()
                }
                for iv in iv_reactions
            ]
        },
        "peers": {
            "data": event.peer_analysis_data,
            "comparisons": [
                {
                    "peer_ticker": pc.peer_ticker,
                    "reason_tag": pc.reason_tag,
                    "weight": pc.weight,
                    "metric": pc.metric,
                    "value": pc.value,
                    "peer_median": pc.peer_median,
                    "peer_p75": pc.peer_p75,
                    "delta_to_median": pc.delta_to_median
                }
                for pc in peer_comparisons
            ]
        },
        "sources": event.sources,
        "created_at": event.created_at.isoformat(),
        "updated_at": event.updated_at.isoformat() if event.updated_at else None
    }


@router.get("/events/{event_id}/deltas", summary="Get expectation deltas")
def get_expectation_deltas(
    event_id: str,
    db: Session = Depends(get_db)
):
    """
    Calculate expectation deltas (beat/inline/miss) for a catalyst event
    
    Compares actual outcomes against expectation bands
    """
    event = db.query(CatalystEvent).filter(CatalystEvent.event_id == event_id).first()
    
    if not event:
        raise HTTPException(status_code=404, detail="Catalyst event not found")
    
    if not event.outcome_metrics:
        raise HTTPException(
            status_code=400,
            detail="No outcome metrics available for this event"
        )
    
    # Calculate deltas
    deltas = batch_compute_deltas(
        event.outcome_metrics,
        event.expectation_metrics
    )
    
    return {
        "event_id": event.event_id,
        "company_ticker": event.company_ticker,
        "catalyst_type": event.catalyst_type,
        "deltas": deltas
    }


@router.get("/events/{event_id}/quadrant", summary="Get quadrant slide data")
def get_quadrant_slide(
    event_id: str,
    db: Session = Depends(get_db)
):
    """
    Generate structured quadrant slide data for visualization
    
    Returns complete quadrant structure with headline, metrics, reactions, and competitive analysis
    """
    event = db.query(CatalystEvent).filter(CatalystEvent.event_id == event_id).first()
    
    if not event:
        raise HTTPException(status_code=404, detail="Catalyst event not found")
    
    # Generate headline and TL;DR
    headline = f"{event.company_name} {event.catalyst_type}: {event.program}"
    
    # Build TL;DR based on catalyst type
    if event.catalyst_type == "M&A":
        tldr = f"${event.outcome_metrics[1]['value']}B acquisition with {event.outcome_metrics[0]['value']}% premium"
    elif event.catalyst_type == "PH3_READOUT":
        tldr = "Phase 3 interim results show strong efficacy across endpoints"
    elif event.catalyst_type == "SAFETY_PAUSE":
        tldr = f"Trial paused due to Grade {event.outcome_metrics[0]['value']} SAE"
    elif event.catalyst_type == "APPROVAL":
        tldr = f"FDA approval for {event.indication}"
    elif event.catalyst_type == "LABEL_UPDATE":
        tldr = "Label update improves dosing convenience"
    else:
        tldr = f"{event.catalyst_type} event for {event.program}"
    
    # Get competitive narrative from peer analysis
    competitive_narrative = ""
    if event.peer_analysis_data and "list" in event.peer_analysis_data:
        peers = event.peer_analysis_data["list"]
        peer_names = ", ".join([p["ticker"] for p in peers])
        competitive_narrative = f"Peer comparison includes {peer_names}"
    
    # Generate quadrant slide
    quadrant = generate_quadrant_slide(
        event_id=event.event_id,
        headline=headline,
        tldr=tldr,
        expectations=event.expectation_metrics,
        outcomes=event.outcome_metrics or [],
        market_reaction=event.market_reaction_data or {},
        peers=event.peer_analysis_data.get("list", []) if event.peer_analysis_data else [],
        competitive_narrative=competitive_narrative,
        sources=event.sources
    )
    
    return quadrant


@router.get("/events/{event_id}/alert-check", summary="Check if event should trigger alert")
def check_alert(
    event_id: str,
    db: Session = Depends(get_db)
):
    """
    Check if catalyst event meets alerting criteria
    
    Returns whether alert should be triggered and reason
    """
    event = db.query(CatalystEvent).filter(CatalystEvent.event_id == event_id).first()
    
    if not event:
        raise HTTPException(status_code=404, detail="Catalyst event not found")
    
    # Calculate deltas
    if event.outcome_metrics:
        deltas = batch_compute_deltas(
            event.outcome_metrics,
            event.expectation_metrics
        )
    else:
        deltas = []
    
    # Check alerting criteria
    alert, reason = should_alert(
        expectation_deltas=deltas,
        market_reaction=event.market_reaction_data or {},
        volume_multiple=1.5,
        microcap_threshold=500
    )
    
    return {
        "event_id": event.event_id,
        "company_ticker": event.company_ticker,
        "should_alert": alert,
        "reason": reason,
        "deltas": deltas
    }


@router.get("/summary", summary="Get catalyst events summary")
def get_catalyst_summary(
    days: int = Query(30, ge=1, le=365, description="Number of days to look back"),
    db: Session = Depends(get_db)
):
    """
    Get summary statistics for catalyst events over a time period
    
    Returns counts by type, outcomes distribution, and alerting metrics
    """
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    # Query events in time period
    events = db.query(CatalystEvent).filter(
        CatalystEvent.as_of >= cutoff_date
    ).all()
    
    # Count by type
    type_counts = {}
    for event in events:
        event_type = event.catalyst_type
        type_counts[event_type] = type_counts.get(event_type, 0) + 1
    
    # Calculate delta statistics
    beats = 0
    misses = 0
    inlines = 0
    
    for event in events:
        if event.outcome_metrics and event.expectation_metrics:
            deltas = batch_compute_deltas(
                event.outcome_metrics,
                event.expectation_metrics
            )
            for delta in deltas:
                delta_class = delta.get("delta", {}).get("class")
                if delta_class == "beat":
                    beats += 1
                elif delta_class == "miss":
                    misses += 1
                elif delta_class == "inline":
                    inlines += 1
    
    return {
        "period_days": days,
        "total_events": len(events),
        "by_type": type_counts,
        "outcomes": {
            "beats": beats,
            "misses": misses,
            "inlines": inlines
        },
        "companies": list(set(e.company_ticker for e in events if e.company_ticker))
    }


@router.get("/types", summary="Get available catalyst types")
def get_catalyst_types(db: Session = Depends(get_db)):
    """
    Get list of all catalyst types in the database
    """
    # Query distinct catalyst types
    result = db.query(CatalystEvent.catalyst_type).distinct().all()
    types = [r[0] for r in result if r[0]]
    
    return {
        "catalyst_types": sorted(types),
        "count": len(types)
    }

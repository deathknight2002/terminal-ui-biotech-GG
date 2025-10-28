"""
Catalyst Calendar API Endpoints

Calendar and timeline views of market catalysts.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import Optional
from datetime import datetime
import logging

from ..database import (
    get_db, 
    Catalyst,
    CatalystExpectationBand,
    CatalystOutcomeMetric,
    CatalystMarketReaction,
    CatalystPeer,
    CatalystPeerMetric,
    CatalystSource,
)
from ..services.catalyst_event_service import (
    get_catalyst_event,
    calculate_all_expectation_deltas,
    get_peer_comparisons,
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/calendar")
async def get_catalyst_calendar(
    from_date: Optional[str] = Query(None, description="Start date (ISO format)"),
    to_date: Optional[str] = Query(None, description="End date (ISO format)"),
    company: Optional[str] = Query(None, description="Filter by company"),
    kind: Optional[str] = Query(None, description="Filter by catalyst kind/type"),
    status: Optional[str] = Query("Upcoming", description="Filter by status"),
    db: Session = Depends(get_db)
):
    """
    Get catalyst calendar/agenda feeds with optional filters.
    """
    try:
        query = db.query(Catalyst)

        # Parse dates
        if from_date:
            from_dt = datetime.fromisoformat(from_date.replace('Z', '+00:00'))
            query = query.filter(
                (Catalyst.date >= from_dt) | (Catalyst.event_date >= from_dt)
            )

        if to_date:
            to_dt = datetime.fromisoformat(to_date.replace('Z', '+00:00'))
            query = query.filter(
                (Catalyst.date <= to_dt) | (Catalyst.event_date <= to_dt)
            )

        if company:
            query = query.filter(Catalyst.company.ilike(f"%{company}%"))

        if kind:
            query = query.filter(
                (Catalyst.kind.ilike(f"%{kind}%")) | (Catalyst.event_type.ilike(f"%{kind}%"))
            )

        if status:
            query = query.filter(Catalyst.status == status)

        # Order by date
        catalysts = query.order_by(
            Catalyst.date.asc().nullslast(),
            Catalyst.event_date.asc().nullslast()
        ).all()

        # Format results for calendar view
        calendar_events = []
        for catalyst in catalysts:
            event_date = catalyst.date or catalyst.event_date

            calendar_events.append({
                "id": catalyst.id,
                "name": catalyst.name or catalyst.title,
                "title": catalyst.title,
                "company": catalyst.company,
                "drug": catalyst.drug,
                "kind": catalyst.kind or catalyst.event_type,
                "date": event_date.isoformat() if event_date else None,
                "probability": catalyst.probability,
                "impact": catalyst.impact,
                "description": catalyst.description,
                "status": catalyst.status,
                "source_url": catalyst.source_url
            })

        # Group by month for calendar view
        months = {}
        for event in calendar_events:
            if event["date"]:
                event_dt = datetime.fromisoformat(event["date"])
                month_key = event_dt.strftime("%Y-%m")
                if month_key not in months:
                    months[month_key] = []
                months[month_key].append(event)

        return {
            "events": calendar_events,
            "count": len(calendar_events),
            "months": months,
            "filters": {
                "from": from_date,
                "to": to_date,
                "company": company,
                "kind": kind,
                "status": status
            }
        }

    except Exception as e:
        logger.error(f"Error fetching catalyst calendar: {e}")
        return {
            "error": str(e),
            "events": [],
            "count": 0,
            "months": {}
        }


@router.get("/past")
async def get_past_catalysts(
    limit: int = Query(50, ge=1, le=200),
    company: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Get past catalysts log.
    """
    try:
        query = db.query(Catalyst).filter(
            (Catalyst.date < datetime.utcnow()) | (Catalyst.event_date < datetime.utcnow())
        )

        if company:
            query = query.filter(Catalyst.company.ilike(f"%{company}%"))

        catalysts = query.order_by(
            Catalyst.date.desc().nullslast(),
            Catalyst.event_date.desc().nullslast()
        ).limit(limit).all()

        result = []
        for catalyst in catalysts:
            event_date = catalyst.date or catalyst.event_date
            result.append({
                "id": catalyst.id,
                "name": catalyst.name or catalyst.title,
                "company": catalyst.company,
                "drug": catalyst.drug,
                "kind": catalyst.kind or catalyst.event_type,
                "date": event_date.isoformat() if event_date else None,
                "impact": catalyst.impact,
                "description": catalyst.description,
                "status": catalyst.status
            })

        return {
            "catalysts": result,
            "count": len(result)
        }

    except Exception as e:
        logger.error(f"Error fetching past catalysts: {e}")
        return {"error": str(e), "catalysts": [], "count": 0}


@router.get("/events/{catalyst_id}")
async def get_detailed_catalyst_event(
    catalyst_id: int,
    db: Session = Depends(get_db)
):
    """
    Get detailed catalyst event with expectations, outcomes, reactions, and peers.
    
    Returns full event structure following the global conventions:
    - event_id, as_of, company, catalyst, expectations, outcome
    - market_reaction, peers, sources
    """
    try:
        event = get_catalyst_event(db, catalyst_id)
        if not event:
            return {"error": "Catalyst not found", "event": None}
        
        return {"event": event}
    
    except Exception as e:
        logger.error(f"Error fetching catalyst event {catalyst_id}: {e}")
        return {"error": str(e), "event": None}


@router.get("/events/{catalyst_id}/expectations")
async def get_catalyst_expectations(
    catalyst_id: int,
    db: Session = Depends(get_db)
):
    """
    Get expectation bands for a catalyst event.
    """
    try:
        expectations = db.query(CatalystExpectationBand).filter(
            CatalystExpectationBand.catalyst_id == catalyst_id
        ).all()
        
        result = []
        for exp in expectations:
            result.append({
                "metric": exp.metric,
                "unit": exp.unit,
                "expected": exp.expected,
                "band_low": exp.band_low,
                "band_high": exp.band_high,
                "source": exp.source,
                "what_matters": exp.what_matters,
                "collected_at": exp.collected_at.isoformat() if exp.collected_at else None,
            })
        
        return {
            "catalyst_id": catalyst_id,
            "expectations": result,
            "count": len(result)
        }
    
    except Exception as e:
        logger.error(f"Error fetching expectations for catalyst {catalyst_id}: {e}")
        return {"error": str(e), "expectations": [], "count": 0}


@router.get("/events/{catalyst_id}/deltas")
async def get_expectation_deltas(
    catalyst_id: int,
    db: Session = Depends(get_db)
):
    """
    Calculate expectation deltas (beat/inline/miss) for all metrics.
    
    Returns:
        - metric name
        - expected value
        - actual value
        - delta class (beat/inline/miss)
        - delta score (0-1)
    """
    try:
        deltas = calculate_all_expectation_deltas(db, catalyst_id)
        
        return {
            "catalyst_id": catalyst_id,
            "deltas": deltas,
            "count": len(deltas)
        }
    
    except Exception as e:
        logger.error(f"Error calculating deltas for catalyst {catalyst_id}: {e}")
        return {"error": str(e), "deltas": [], "count": 0}


@router.get("/events/{catalyst_id}/reactions")
async def get_market_reactions(
    catalyst_id: int,
    db: Session = Depends(get_db)
):
    """
    Get market price and IV reactions for a catalyst event.
    """
    try:
        reactions = db.query(CatalystMarketReaction).filter(
            CatalystMarketReaction.catalyst_id == catalyst_id
        ).all()
        
        price_reactions = []
        iv_reactions = []
        vol_reactions = []
        
        for react in reactions:
            price_reactions.append({
                "ticker": react.ticker,
                "window": react.window,
                "abs_return": react.abs_return,
                "rel_vs_xbi": react.rel_vs_xbi,
                "intraday_high_low": react.intraday_high_low,
            })
            
            if react.iv is not None:
                iv_reactions.append({
                    "ticker": react.ticker,
                    "tenor": react.iv_tenor,
                    "window": react.window,
                    "iv": react.iv,
                    "zscore_vs_1y": react.iv_zscore_vs_1y,
                })
            
            if react.volume_multiple_vs_30d is not None:
                vol_reactions.append({
                    "ticker": react.ticker,
                    "window": react.window,
                    "volume_multiple_vs_30d": react.volume_multiple_vs_30d,
                })
        
        return {
            "catalyst_id": catalyst_id,
            "price": price_reactions,
            "iv": iv_reactions,
            "volume": vol_reactions,
        }
    
    except Exception as e:
        logger.error(f"Error fetching reactions for catalyst {catalyst_id}: {e}")
        return {"error": str(e), "price": [], "iv": [], "volume": []}


@router.get("/events/{catalyst_id}/peers")
async def get_catalyst_peers(
    catalyst_id: int,
    indication: Optional[str] = Query(None),
    moa: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Get peer analysis for a catalyst event.
    
    Returns:
        - Weighted peer list with moat axes
        - Comparative metrics vs peers
    """
    try:
        # Get peers
        peers = get_peer_comparisons(db, catalyst_id, indication, moa)
        
        # Get peer metrics
        peer_metrics = db.query(CatalystPeerMetric).filter(
            CatalystPeerMetric.catalyst_id == catalyst_id
        ).all()
        
        metrics = []
        for pm in peer_metrics:
            metrics.append({
                "metric": pm.metric,
                "value": pm.value,
                "peer_median": pm.peer_median,
                "peer_p75": pm.peer_p75,
                "delta_to_median": pm.delta_to_median,
            })
        
        return {
            "catalyst_id": catalyst_id,
            "peers": peers,
            "peer_metrics": metrics,
            "moat_axes": ["MoA", "Stage", "Indication", "Delivery", "Target"],
        }
    
    except Exception as e:
        logger.error(f"Error fetching peers for catalyst {catalyst_id}: {e}")
        return {"error": str(e), "peers": [], "peer_metrics": []}


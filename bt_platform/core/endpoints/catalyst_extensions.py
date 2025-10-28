"""
Catalyst Event Extensions API Endpoints
=======================================

REST API endpoints for catalyst event tracking with expectations, outcomes,
market reactions, and peer comparisons.

Endpoints:
- POST /api/v1/catalyst-events - Create catalyst event with full metadata
- GET /api/v1/catalyst-events/{event_id} - Get event with all related data
- POST /api/v1/catalyst-events/{event_id}/expectations - Add expectations
- POST /api/v1/catalyst-events/{event_id}/outcomes - Add outcomes
- POST /api/v1/catalyst-events/{event_id}/market-reactions - Add market reactions
- GET /api/v1/catalyst-events/{event_id}/peers - Get peer analysis
"""

import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from datetime import datetime, date

from ..database import get_db
from ..schema_catalyst_extensions import (
    ExpectationBand,
    CatalystOutcome,
    MarketReaction,
    PeerComparison,
    PeerMetricComparison,
    EventSource,
    SafetyEventDetail,
    MandADealDetail
)
from ..contracts_catalyst_extensions import (
    CatalystEventFullContract,
    ExpectationBandContract,
    ExpectationBandResponse,
    CatalystOutcomeContract,
    CatalystOutcomeResponse,
    MarketReactionContract,
    MarketReactionResponse,
    PeerComparisonContract,
    PeerComparisonResponse,
    EventSourceContract,
    EventSourceResponse,
    SafetyEventDetailContract,
    SafetyEventDetailResponse,
    MandADealDetailContract,
    MandADealDetailResponse
)

from ...etl.expectations import load_expectations
from ...market.reaction import get_reaction, save_reactions
from ...comparator.peers import get_peers, save_peer_comparisons

logger = logging.getLogger(__name__)

router = APIRouter()


# ============================================================================
# Expectation Band Endpoints
# ============================================================================

@router.post("/catalyst-events/{event_id}/expectations", response_model=List[ExpectationBandResponse])
def add_expectations(
    event_id: str,
    expectations: List[ExpectationBandContract],
    db: Session = Depends(get_db)
):
    """
    Add expectation bands for a catalyst event.
    
    Args:
        event_id: Event identifier (ULID)
        expectations: List of expectation band contracts
        db: Database session
        
    Returns:
        List of created expectation band responses
    """
    try:
        # Set event_id for all expectations
        for exp in expectations:
            exp.event_id = event_id
        
        # Load to database
        inserted = load_expectations(db, expectations)
        
        # Fetch and return created records
        records = db.query(ExpectationBand).filter(
            ExpectationBand.event_id == event_id
        ).all()
        
        return [ExpectationBandResponse.from_orm(r) for r in records]
        
    except Exception as e:
        logger.error(f"Failed to add expectations: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add expectations: {str(e)}"
        )


@router.get("/catalyst-events/{event_id}/expectations", response_model=List[ExpectationBandResponse])
def get_expectations(
    event_id: str,
    source: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get expectation bands for a catalyst event.
    
    Args:
        event_id: Event identifier
        source: Optional filter by source (sell_side, mgmt_guide, etc.)
        db: Database session
        
    Returns:
        List of expectation bands
    """
    query = db.query(ExpectationBand).filter(ExpectationBand.event_id == event_id)
    
    if source:
        query = query.filter(ExpectationBand.source == source)
    
    records = query.all()
    return [ExpectationBandResponse.from_orm(r) for r in records]


# ============================================================================
# Outcome Endpoints
# ============================================================================

@router.post("/catalyst-events/{event_id}/outcomes", response_model=List[CatalystOutcomeResponse])
def add_outcomes(
    event_id: str,
    outcomes: List[CatalystOutcomeContract],
    db: Session = Depends(get_db)
):
    """
    Add outcome metrics for a catalyst event.
    
    Automatically computes expectation delta (beat/inline/miss).
    
    Args:
        event_id: Event identifier
        outcomes: List of outcome contracts
        db: Database session
        
    Returns:
        List of created outcome responses
    """
    try:
        from ...market.reaction import compute_expectation_delta
        
        saved = 0
        for outcome in outcomes:
            outcome.event_id = event_id
            
            # Get expectation band for this metric
            expectation = db.query(ExpectationBand).filter(
                ExpectationBand.event_id == event_id,
                ExpectationBand.metric == outcome.metric
            ).first()
            
            # Compute expectation delta
            exp_delta = {"class": "unknown", "score": 0.0}
            if expectation:
                exp_delta = compute_expectation_delta(
                    {"value": outcome.value},
                    {
                        "band_low": expectation.band_low,
                        "band_high": expectation.band_high
                    }
                )
            
            # Check for existing
            existing = db.query(CatalystOutcome).filter(
                CatalystOutcome.event_id == event_id,
                CatalystOutcome.metric == outcome.metric
            ).first()
            
            if existing:
                # Update
                existing.value = outcome.value
                existing.pvalue = outcome.pvalue
                existing.n = outcome.n
                existing.confidence_interval_low = outcome.confidence_interval_low
                existing.confidence_interval_high = outcome.confidence_interval_high
                existing.window = outcome.window
                existing.cohort = outcome.cohort
                existing.expectation_class = exp_delta["class"]
                existing.expectation_score = exp_delta["score"]
                existing.updated_at = datetime.utcnow()
            else:
                # Create
                record = CatalystOutcome(
                    event_id=event_id,
                    metric=outcome.metric,
                    unit=outcome.unit,
                    value=outcome.value,
                    pvalue=outcome.pvalue,
                    n=outcome.n,
                    confidence_interval_low=outcome.confidence_interval_low,
                    confidence_interval_high=outcome.confidence_interval_high,
                    window=outcome.window,
                    cohort=outcome.cohort,
                    expectation_class=exp_delta["class"],
                    expectation_score=exp_delta["score"]
                )
                db.add(record)
                saved += 1
        
        db.commit()
        
        # Fetch and return
        records = db.query(CatalystOutcome).filter(
            CatalystOutcome.event_id == event_id
        ).all()
        
        return [CatalystOutcomeResponse.from_orm(r) for r in records]
        
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to add outcomes: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add outcomes: {str(e)}"
        )


@router.get("/catalyst-events/{event_id}/outcomes", response_model=List[CatalystOutcomeResponse])
def get_outcomes(
    event_id: str,
    db: Session = Depends(get_db)
):
    """Get outcomes for a catalyst event."""
    records = db.query(CatalystOutcome).filter(
        CatalystOutcome.event_id == event_id
    ).all()
    return [CatalystOutcomeResponse.from_orm(r) for r in records]


# ============================================================================
# Market Reaction Endpoints
# ============================================================================

@router.post("/catalyst-events/{event_id}/market-reactions", status_code=status.HTTP_201_CREATED)
def calculate_market_reactions(
    event_id: str,
    ticker: str,
    event_date: date,
    db: Session = Depends(get_db)
):
    """
    Calculate and save market reactions for a catalyst event.
    
    Computes reactions for all standard windows (D-5, D-1, D0, D+1, D+5, D+10).
    
    Args:
        event_id: Event identifier
        ticker: Stock ticker
        event_date: Date of the event
        db: Database session
        
    Returns:
        Number of reactions calculated
    """
    try:
        # Calculate reactions
        reactions = get_reaction(ticker, event_date)
        
        # Save to database
        saved = save_reactions(db, event_id, reactions)
        
        return {"event_id": event_id, "reactions_saved": saved}
        
    except Exception as e:
        logger.error(f"Failed to calculate market reactions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate market reactions: {str(e)}"
        )


@router.get("/catalyst-events/{event_id}/market-reactions", response_model=List[MarketReactionResponse])
def get_market_reactions(
    event_id: str,
    window: Optional[str] = Query(None, description="Filter by window (D0, D+1, etc.)"),
    db: Session = Depends(get_db)
):
    """Get market reactions for a catalyst event."""
    query = db.query(MarketReaction).filter(MarketReaction.event_id == event_id)
    
    if window:
        query = query.filter(MarketReaction.window == window)
    
    records = query.all()
    return [MarketReactionResponse.from_orm(r) for r in records]


# ============================================================================
# Peer Comparison Endpoints
# ============================================================================

@router.post("/catalyst-events/{event_id}/peers", status_code=status.HTTP_201_CREATED)
def calculate_peer_comparisons(
    event_id: str,
    ticker: str,
    indication: Optional[str] = None,
    moa: Optional[str] = None,
    phase: Optional[str] = None,
    max_peers: int = Query(10, le=50),
    db: Session = Depends(get_db)
):
    """
    Calculate and save peer comparisons for a catalyst event.
    
    Uses moat axes (MoA, Stage, Indication, Delivery, Target) to identify peers.
    
    Args:
        event_id: Event identifier
        ticker: Subject company ticker
        indication: Optional indication filter
        moa: Optional mechanism of action filter
        phase: Optional development phase filter
        max_peers: Maximum number of peers (default 10, max 50)
        db: Database session
        
    Returns:
        Number of peers identified
    """
    try:
        # Get peers
        peers = get_peers(db, ticker, indication, moa, phase, max_peers)
        
        # Save to database
        saved = save_peer_comparisons(db, event_id, peers)
        
        return {
            "event_id": event_id,
            "ticker": ticker,
            "peers_identified": saved
        }
        
    except Exception as e:
        logger.error(f"Failed to calculate peer comparisons: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate peer comparisons: {str(e)}"
        )


@router.get("/catalyst-events/{event_id}/peers", response_model=List[PeerComparisonResponse])
def get_peer_comparisons(
    event_id: str,
    db: Session = Depends(get_db)
):
    """Get peer comparisons for a catalyst event."""
    records = db.query(PeerComparison).filter(
        PeerComparison.event_id == event_id
    ).order_by(PeerComparison.weight.desc()).all()
    
    return [PeerComparisonResponse.from_orm(r) for r in records]


# ============================================================================
# Event Source Endpoints
# ============================================================================

@router.post("/catalyst-events/{event_id}/sources", response_model=List[EventSourceResponse])
def add_sources(
    event_id: str,
    sources: List[EventSourceContract],
    db: Session = Depends(get_db)
):
    """Add sources for a catalyst event."""
    try:
        saved = 0
        for source in sources:
            source.event_id = event_id
            
            # Check for duplicate
            existing = db.query(EventSource).filter(
                EventSource.event_id == event_id,
                EventSource.url == source.url
            ).first()
            
            if not existing:
                record = EventSource(
                    event_id=event_id,
                    title=source.title,
                    url=source.url,
                    source_type=source.source_type,
                    ts=source.ts
                )
                db.add(record)
                saved += 1
        
        db.commit()
        
        # Fetch and return
        records = db.query(EventSource).filter(
            EventSource.event_id == event_id
        ).all()
        
        return [EventSourceResponse.from_orm(r) for r in records]
        
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to add sources: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add sources: {str(e)}"
        )


@router.get("/catalyst-events/{event_id}/sources", response_model=List[EventSourceResponse])
def get_sources(
    event_id: str,
    db: Session = Depends(get_db)
):
    """Get sources for a catalyst event."""
    records = db.query(EventSource).filter(
        EventSource.event_id == event_id
    ).all()
    return [EventSourceResponse.from_orm(r) for r in records]


# ============================================================================
# Safety Event Detail Endpoints
# ============================================================================

@router.post("/catalyst-events/{event_id}/safety-details", response_model=SafetyEventDetailResponse)
def add_safety_details(
    event_id: str,
    details: SafetyEventDetailContract,
    db: Session = Depends(get_db)
):
    """Add safety event details for clinical hold/pause events."""
    try:
        details.event_id = event_id
        
        # Check for existing
        existing = db.query(SafetyEventDetail).filter(
            SafetyEventDetail.event_id == event_id
        ).first()
        
        if existing:
            # Update
            existing.sae_grade = details.sae_grade
            existing.signal_type = details.signal_type
            existing.enrollment_status = details.enrollment_status
            existing.expected_pause_duration_weeks = details.expected_pause_duration_weeks
            existing.resumption_probability = details.resumption_probability
            existing.class_risk_baseline = details.class_risk_baseline
            existing.class_read_through = details.class_read_through
            existing.pause_date = details.pause_date
            existing.resume_date = details.resume_date
            existing.updated_at = datetime.utcnow()
            db.commit()
            return SafetyEventDetailResponse.from_orm(existing)
        else:
            # Create
            record = SafetyEventDetail(**details.dict())
            db.add(record)
            db.commit()
            db.refresh(record)
            return SafetyEventDetailResponse.from_orm(record)
            
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to add safety details: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add safety details: {str(e)}"
        )


# ============================================================================
# M&A Deal Detail Endpoints
# ============================================================================

@router.post("/catalyst-events/{event_id}/manda-details", response_model=MandADealDetailResponse)
def add_manda_details(
    event_id: str,
    details: MandADealDetailContract,
    db: Session = Depends(get_db)
):
    """Add M&A deal details for acquisition events."""
    try:
        details.event_id = event_id
        
        # Check for existing
        existing = db.query(MandADealDetail).filter(
            MandADealDetail.event_id == event_id
        ).first()
        
        if existing:
            # Update
            for key, value in details.dict(exclude={"event_id"}).items():
                setattr(existing, key, value)
            existing.updated_at = datetime.utcnow()
            db.commit()
            return MandADealDetailResponse.from_orm(existing)
        else:
            # Create
            record = MandADealDetail(**details.dict())
            db.add(record)
            db.commit()
            db.refresh(record)
            return MandADealDetailResponse.from_orm(record)
            
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to add M&A details: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add M&A details: {str(e)}"
        )

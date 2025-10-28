"""
Enhanced Catalyst Event API Endpoints

Provides REST API for managing catalyst events with expectations,
outcomes, market reactions, and peer analysis.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional, Dict, Any
from datetime import datetime, date
import logging

from ..database import get_db
from ..schema import (
    CatalystEvent,
    ExpectationBand,
    CatalystOutcome,
    MarketReaction,
    ImpliedVolatilitySnapshot,
    CatalystPeer,
    CatalystPeerMetric,
    CatalystSource
)
from ..contracts import (
    ExpectationBandContract,
    ExpectationBandResponse,
    CatalystOutcomeContract,
    CatalystOutcomeResponse,
    MarketReactionContract,
    MarketReactionResponse,
    ImpliedVolatilitySnapshotContract,
    ImpliedVolatilitySnapshotResponse,
    CatalystPeerContract,
    CatalystPeerResponse,
    CatalystPeerMetricContract,
    CatalystPeerMetricResponse,
    CatalystSourceContract,
    CatalystSourceResponse,
    EnhancedCatalystEventContract
)
from ..services.catalyst_delta_service import (
    compute_expectation_delta,
    compute_multi_metric_delta
)

logger = logging.getLogger(__name__)
router = APIRouter()


# ============================================================================
# Expectation Band Endpoints
# ============================================================================

@router.post("/catalyst-events/{catalyst_event_id}/expectations", response_model=ExpectationBandResponse)
async def create_expectation_band(
    catalyst_event_id: int,
    expectation: ExpectationBandContract,
    db: Session = Depends(get_db)
):
    """Create expectation band for a catalyst event"""
    try:
        # Verify catalyst event exists
        catalyst = db.query(CatalystEvent).filter(CatalystEvent.id == catalyst_event_id).first()
        if not catalyst:
            raise HTTPException(status_code=404, detail="Catalyst event not found")
        
        # Create expectation band
        db_expectation = ExpectationBand(
            catalyst_event_id=catalyst_event_id,
            **expectation.model_dump()
        )
        db.add(db_expectation)
        db.commit()
        db.refresh(db_expectation)
        
        return db_expectation
    except Exception as e:
        logger.error(f"Error creating expectation band: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/catalyst-events/{catalyst_event_id}/expectations", response_model=List[ExpectationBandResponse])
async def get_expectation_bands(
    catalyst_event_id: int,
    db: Session = Depends(get_db)
):
    """Get all expectation bands for a catalyst event"""
    expectations = db.query(ExpectationBand).filter(
        ExpectationBand.catalyst_event_id == catalyst_event_id
    ).all()
    return expectations


@router.post("/catalyst-events/{catalyst_event_id}/expectations/batch", response_model=List[ExpectationBandResponse])
async def create_expectation_bands_batch(
    catalyst_event_id: int,
    expectations: List[ExpectationBandContract],
    db: Session = Depends(get_db)
):
    """Create multiple expectation bands at once"""
    try:
        # Verify catalyst event exists
        catalyst = db.query(CatalystEvent).filter(CatalystEvent.id == catalyst_event_id).first()
        if not catalyst:
            raise HTTPException(status_code=404, detail="Catalyst event not found")
        
        # Create all expectation bands
        db_expectations = []
        for expectation in expectations:
            db_expectation = ExpectationBand(
                catalyst_event_id=catalyst_event_id,
                **expectation.model_dump()
            )
            db.add(db_expectation)
            db_expectations.append(db_expectation)
        
        db.commit()
        for exp in db_expectations:
            db.refresh(exp)
        
        return db_expectations
    except Exception as e:
        logger.error(f"Error creating expectation bands: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Catalyst Outcome Endpoints
# ============================================================================

@router.post("/catalyst-events/{catalyst_event_id}/outcomes", response_model=CatalystOutcomeResponse)
async def create_catalyst_outcome(
    catalyst_event_id: int,
    outcome: CatalystOutcomeContract,
    db: Session = Depends(get_db)
):
    """Create outcome for a catalyst event with automatic delta calculation"""
    try:
        # Verify catalyst event exists
        catalyst = db.query(CatalystEvent).filter(CatalystEvent.id == catalyst_event_id).first()
        if not catalyst:
            raise HTTPException(status_code=404, detail="Catalyst event not found")
        
        # Get expectation band for this metric
        expectation = db.query(ExpectationBand).filter(
            and_(
                ExpectationBand.catalyst_event_id == catalyst_event_id,
                ExpectationBand.metric == outcome.metric
            )
        ).first()
        
        # Create outcome
        db_outcome = CatalystOutcome(
            catalyst_event_id=catalyst_event_id,
            **outcome.model_dump()
        )
        
        # Compute delta if expectation exists
        if expectation:
            outcome_dict = {"value": float(outcome.value)}
            expectation_dict = {
                "expected": float(expectation.expected) if expectation.expected else 0,
                "band_low": float(expectation.band_low) if expectation.band_low else 0,
                "band_high": float(expectation.band_high) if expectation.band_high else 0
            }
            
            delta_result = compute_expectation_delta(outcome_dict, expectation_dict)
            db_outcome.delta_class = delta_result.delta_class
            db_outcome.delta_score = delta_result.delta_score
        
        db.add(db_outcome)
        db.commit()
        db.refresh(db_outcome)
        
        return db_outcome
    except Exception as e:
        logger.error(f"Error creating outcome: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/catalyst-events/{catalyst_event_id}/outcomes", response_model=List[CatalystOutcomeResponse])
async def get_catalyst_outcomes(
    catalyst_event_id: int,
    db: Session = Depends(get_db)
):
    """Get all outcomes for a catalyst event"""
    outcomes = db.query(CatalystOutcome).filter(
        CatalystOutcome.catalyst_event_id == catalyst_event_id
    ).all()
    return outcomes


@router.post("/catalyst-events/{catalyst_event_id}/outcomes/batch", response_model=List[CatalystOutcomeResponse])
async def create_catalyst_outcomes_batch(
    catalyst_event_id: int,
    outcomes: List[CatalystOutcomeContract],
    db: Session = Depends(get_db)
):
    """Create multiple outcomes with automatic delta calculations"""
    try:
        # Verify catalyst event exists
        catalyst = db.query(CatalystEvent).filter(CatalystEvent.id == catalyst_event_id).first()
        if not catalyst:
            raise HTTPException(status_code=404, detail="Catalyst event not found")
        
        # Get all expectations for this catalyst
        expectations = db.query(ExpectationBand).filter(
            ExpectationBand.catalyst_event_id == catalyst_event_id
        ).all()
        expectation_map = {exp.metric: exp for exp in expectations}
        
        # Create all outcomes with delta calculations
        db_outcomes = []
        for outcome in outcomes:
            db_outcome = CatalystOutcome(
                catalyst_event_id=catalyst_event_id,
                **outcome.model_dump()
            )
            
            # Compute delta if expectation exists
            if outcome.metric in expectation_map:
                expectation = expectation_map[outcome.metric]
                outcome_dict = {"value": float(outcome.value)}
                expectation_dict = {
                    "expected": float(expectation.expected) if expectation.expected else 0,
                    "band_low": float(expectation.band_low) if expectation.band_low else 0,
                    "band_high": float(expectation.band_high) if expectation.band_high else 0
                }
                
                delta_result = compute_expectation_delta(outcome_dict, expectation_dict)
                db_outcome.delta_class = delta_result.delta_class
                db_outcome.delta_score = delta_result.delta_score
            
            db.add(db_outcome)
            db_outcomes.append(db_outcome)
        
        db.commit()
        for out in db_outcomes:
            db.refresh(out)
        
        return db_outcomes
    except Exception as e:
        logger.error(f"Error creating outcomes: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Market Reaction Endpoints
# ============================================================================

@router.post("/catalyst-events/{catalyst_event_id}/market-reactions", response_model=MarketReactionResponse)
async def create_market_reaction(
    catalyst_event_id: int,
    reaction: MarketReactionContract,
    db: Session = Depends(get_db)
):
    """Record market reaction for a catalyst event"""
    try:
        db_reaction = MarketReaction(
            catalyst_event_id=catalyst_event_id,
            **reaction.model_dump()
        )
        db.add(db_reaction)
        db.commit()
        db.refresh(db_reaction)
        return db_reaction
    except Exception as e:
        logger.error(f"Error creating market reaction: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/catalyst-events/{catalyst_event_id}/market-reactions", response_model=List[MarketReactionResponse])
async def get_market_reactions(
    catalyst_event_id: int,
    rel_window: Optional[str] = Query(None, description="Filter by relative window (e.g., D0, D+1)"),
    db: Session = Depends(get_db)
):
    """Get market reactions for a catalyst event"""
    query = db.query(MarketReaction).filter(
        MarketReaction.catalyst_event_id == catalyst_event_id
    )
    
    if rel_window:
        query = query.filter(MarketReaction.rel_window == rel_window)
    
    return query.all()


@router.post("/catalyst-events/{catalyst_event_id}/market-reactions/batch", response_model=List[MarketReactionResponse])
async def create_market_reactions_batch(
    catalyst_event_id: int,
    reactions: List[MarketReactionContract],
    db: Session = Depends(get_db)
):
    """Create multiple market reactions at once"""
    try:
        db_reactions = []
        for reaction in reactions:
            db_reaction = MarketReaction(
                catalyst_event_id=catalyst_event_id,
                **reaction.model_dump()
            )
            db.add(db_reaction)
            db_reactions.append(db_reaction)
        
        db.commit()
        for rxn in db_reactions:
            db.refresh(rxn)
        
        return db_reactions
    except Exception as e:
        logger.error(f"Error creating market reactions: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# IV Snapshot Endpoints
# ============================================================================

@router.post("/catalyst-events/{catalyst_event_id}/iv-snapshots", response_model=ImpliedVolatilitySnapshotResponse)
async def create_iv_snapshot(
    catalyst_event_id: int,
    snapshot: ImpliedVolatilitySnapshotContract,
    db: Session = Depends(get_db)
):
    """Record IV snapshot for a catalyst event"""
    try:
        db_snapshot = ImpliedVolatilitySnapshot(
            catalyst_event_id=catalyst_event_id,
            **snapshot.model_dump()
        )
        db.add(db_snapshot)
        db.commit()
        db.refresh(db_snapshot)
        return db_snapshot
    except Exception as e:
        logger.error(f"Error creating IV snapshot: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/catalyst-events/{catalyst_event_id}/iv-snapshots", response_model=List[ImpliedVolatilitySnapshotResponse])
async def get_iv_snapshots(
    catalyst_event_id: int,
    tenor: Optional[str] = Query(None, description="Filter by tenor (e.g., 1w, 1m)"),
    rel_window: Optional[str] = Query(None, description="Filter by relative window"),
    db: Session = Depends(get_db)
):
    """Get IV snapshots for a catalyst event"""
    query = db.query(ImpliedVolatilitySnapshot).filter(
        ImpliedVolatilitySnapshot.catalyst_event_id == catalyst_event_id
    )
    
    if tenor:
        query = query.filter(ImpliedVolatilitySnapshot.tenor == tenor)
    if rel_window:
        query = query.filter(ImpliedVolatilitySnapshot.rel_window == rel_window)
    
    return query.all()


# ============================================================================
# Peer Analysis Endpoints
# ============================================================================

@router.post("/catalyst-events/{catalyst_event_id}/peers", response_model=CatalystPeerResponse)
async def create_catalyst_peer(
    catalyst_event_id: int,
    peer: CatalystPeerContract,
    db: Session = Depends(get_db)
):
    """Add peer company for comparative analysis"""
    try:
        db_peer = CatalystPeer(
            catalyst_event_id=catalyst_event_id,
            **peer.model_dump()
        )
        db.add(db_peer)
        db.commit()
        db.refresh(db_peer)
        return db_peer
    except Exception as e:
        logger.error(f"Error creating peer: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/catalyst-events/{catalyst_event_id}/peers", response_model=List[CatalystPeerResponse])
async def get_catalyst_peers(
    catalyst_event_id: int,
    moat_axis: Optional[str] = Query(None, description="Filter by moat axis"),
    db: Session = Depends(get_db)
):
    """Get peer companies for a catalyst event"""
    query = db.query(CatalystPeer).filter(
        CatalystPeer.catalyst_event_id == catalyst_event_id
    )
    
    if moat_axis:
        query = query.filter(CatalystPeer.moat_axis == moat_axis)
    
    return query.order_by(CatalystPeer.weight.desc()).all()


@router.post("/catalyst-events/{catalyst_event_id}/peer-metrics", response_model=CatalystPeerMetricResponse)
async def create_peer_metric(
    catalyst_event_id: int,
    metric: CatalystPeerMetricContract,
    db: Session = Depends(get_db)
):
    """Add peer comparative metric"""
    try:
        db_metric = CatalystPeerMetric(
            catalyst_event_id=catalyst_event_id,
            **metric.model_dump()
        )
        db.add(db_metric)
        db.commit()
        db.refresh(db_metric)
        return db_metric
    except Exception as e:
        logger.error(f"Error creating peer metric: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/catalyst-events/{catalyst_event_id}/peer-metrics", response_model=List[CatalystPeerMetricResponse])
async def get_peer_metrics(
    catalyst_event_id: int,
    db: Session = Depends(get_db)
):
    """Get peer comparative metrics for a catalyst event"""
    return db.query(CatalystPeerMetric).filter(
        CatalystPeerMetric.catalyst_event_id == catalyst_event_id
    ).all()


# ============================================================================
# Source Attribution Endpoints
# ============================================================================

@router.post("/catalyst-events/{catalyst_event_id}/sources", response_model=CatalystSourceResponse)
async def create_catalyst_source(
    catalyst_event_id: int,
    source: CatalystSourceContract,
    db: Session = Depends(get_db)
):
    """Add source for catalyst event"""
    try:
        db_source = CatalystSource(
            catalyst_event_id=catalyst_event_id,
            **source.model_dump()
        )
        db.add(db_source)
        db.commit()
        db.refresh(db_source)
        return db_source
    except Exception as e:
        logger.error(f"Error creating source: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/catalyst-events/{catalyst_event_id}/sources", response_model=List[CatalystSourceResponse])
async def get_catalyst_sources(
    catalyst_event_id: int,
    db: Session = Depends(get_db)
):
    """Get sources for a catalyst event"""
    return db.query(CatalystSource).filter(
        CatalystSource.catalyst_event_id == catalyst_event_id
    ).order_by(CatalystSource.published_at.desc()).all()


# ============================================================================
# Complete Catalyst Event Endpoint
# ============================================================================

@router.get("/catalyst-events/{catalyst_event_id}/complete", response_model=Dict[str, Any])
async def get_complete_catalyst_event(
    catalyst_event_id: int,
    db: Session = Depends(get_db)
):
    """
    Get complete catalyst event with all related data:
    - Expectations
    - Outcomes (with deltas)
    - Market reactions
    - IV snapshots
    - Peers
    - Peer metrics
    - Sources
    """
    try:
        # Get base catalyst event
        catalyst = db.query(CatalystEvent).filter(CatalystEvent.id == catalyst_event_id).first()
        if not catalyst:
            raise HTTPException(status_code=404, detail="Catalyst event not found")
        
        # Get all related data
        expectations = db.query(ExpectationBand).filter(
            ExpectationBand.catalyst_event_id == catalyst_event_id
        ).all()
        
        outcomes = db.query(CatalystOutcome).filter(
            CatalystOutcome.catalyst_event_id == catalyst_event_id
        ).all()
        
        market_reactions = db.query(MarketReaction).filter(
            MarketReaction.catalyst_event_id == catalyst_event_id
        ).all()
        
        iv_snapshots = db.query(ImpliedVolatilitySnapshot).filter(
            ImpliedVolatilitySnapshot.catalyst_event_id == catalyst_event_id
        ).all()
        
        peers = db.query(CatalystPeer).filter(
            CatalystPeer.catalyst_event_id == catalyst_event_id
        ).all()
        
        peer_metrics = db.query(CatalystPeerMetric).filter(
            CatalystPeerMetric.catalyst_event_id == catalyst_event_id
        ).all()
        
        sources = db.query(CatalystSource).filter(
            CatalystSource.catalyst_event_id == catalyst_event_id
        ).all()
        
        # Build response
        return {
            "catalyst_event": {
                "id": catalyst.id,
                "event_type": catalyst.event_type,
                "title": catalyst.title,
                "description": catalyst.description,
                "expected_date": catalyst.expected_date.isoformat() if catalyst.expected_date else None,
                "actual_date": catalyst.actual_date.isoformat() if catalyst.actual_date else None,
                "status": catalyst.status
            },
            "expectations": [
                {
                    "metric": exp.metric,
                    "unit": exp.unit,
                    "expected": float(exp.expected) if exp.expected else None,
                    "band_low": float(exp.band_low) if exp.band_low else None,
                    "band_high": float(exp.band_high) if exp.band_high else None,
                    "what_matters": exp.what_matters,
                    "source": exp.source
                }
                for exp in expectations
            ],
            "outcomes": [
                {
                    "metric": out.metric,
                    "unit": out.unit,
                    "value": float(out.value),
                    "delta_class": out.delta_class,
                    "delta_score": out.delta_score,
                    "pvalue": out.pvalue,
                    "n": out.n,
                    "window": out.window
                }
                for out in outcomes
            ],
            "market_reactions": [
                {
                    "ticker": rxn.ticker,
                    "rel_window": rxn.rel_window,
                    "abs_return": rxn.abs_return,
                    "rel_vs_xbi": rxn.rel_vs_xbi,
                    "volume_multiple_vs_30d": rxn.volume_multiple_vs_30d
                }
                for rxn in market_reactions
            ],
            "iv_snapshots": [
                {
                    "ticker": iv.ticker,
                    "tenor": iv.tenor,
                    "rel_window": iv.rel_window,
                    "iv": iv.iv,
                    "zscore_vs_1y": iv.zscore_vs_1y
                }
                for iv in iv_snapshots
            ],
            "peers": [
                {
                    "peer_ticker": peer.peer_ticker,
                    "peer_name": peer.peer_name,
                    "reason_tag": peer.reason_tag,
                    "moat_axis": peer.moat_axis,
                    "weight": peer.weight
                }
                for peer in peers
            ],
            "peer_metrics": [
                {
                    "metric": pm.metric,
                    "value": float(pm.value) if pm.value else None,
                    "peer_median": float(pm.peer_median) if pm.peer_median else None,
                    "delta_to_median": float(pm.delta_to_median) if pm.delta_to_median else None
                }
                for pm in peer_metrics
            ],
            "sources": [
                {
                    "title": src.title,
                    "url": src.url,
                    "source_type": src.source_type,
                    "published_at": src.published_at.isoformat() if src.published_at else None
                }
                for src in sources
            ]
        }
    except Exception as e:
        logger.error(f"Error fetching complete catalyst event: {e}")
        raise HTTPException(status_code=500, detail=str(e))

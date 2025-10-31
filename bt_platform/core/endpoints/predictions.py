"""
Catalyst Prediction API Endpoints

Exposes prediction models for catalyst timing, outcomes, and momentum.
"""

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
from typing import Optional, List
from datetime import datetime, timedelta
import logging

from ..database import get_db, Catalyst, Company
from ..prediction import (
    predict_catalyst_timing,
    predict_catalyst_outcome,
    calculate_momentum_score,
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/predict/timing/{catalyst_id}")
async def predict_timing(
    catalyst_id: int,
    db: Session = Depends(get_db)
):
    """
    Predict the timing of a catalyst event using statistical models.
    
    Returns predicted date with confidence intervals and quarterly probabilities.
    """
    try:
        # Get catalyst from database
        catalyst = db.query(Catalyst).filter(Catalyst.id == catalyst_id).first()
        
        if not catalyst:
            raise HTTPException(status_code=404, detail="Catalyst not found")
        
        # Extract relevant fields
        catalyst_type = catalyst.kind or catalyst.catalyst_type or "Unknown"
        phase = getattr(catalyst, "phase", None)
        indication = getattr(catalyst, "indication", None)
        
        # Get last milestone date (if available)
        last_milestone_date = None
        if hasattr(catalyst, "trial_start_date") and catalyst.trial_start_date:
            last_milestone_date = catalyst.trial_start_date
        elif catalyst.created_at:
            last_milestone_date = catalyst.created_at
        
        # Run prediction
        prediction = predict_catalyst_timing(
            catalyst_type=catalyst_type,
            phase=phase,
            indication=indication,
            last_milestone_date=last_milestone_date,
        )
        
        # Add catalyst context
        prediction["catalyst"] = {
            "id": catalyst.id,
            "company": catalyst.company,
            "drug_name": getattr(catalyst, "drug_name", None),
            "description": catalyst.description,
        }
        
        return prediction
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error predicting catalyst timing: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Prediction failed")


@router.get("/predict/outcome/{catalyst_id}")
async def predict_outcome(
    catalyst_id: int,
    db: Session = Depends(get_db)
):
    """
    Predict the probability of a positive outcome for a catalyst event.
    
    Uses Bayesian models with industry base rates and drug-specific evidence.
    """
    try:
        # Get catalyst from database
        catalyst = db.query(Catalyst).filter(Catalyst.id == catalyst_id).first()
        
        if not catalyst:
            raise HTTPException(status_code=404, detail="Catalyst not found")
        
        # Extract relevant fields
        catalyst_type = catalyst.kind or catalyst.catalyst_type or "Unknown"
        phase = getattr(catalyst, "phase", None)
        indication = getattr(catalyst, "indication", None)
        
        # Get prior phase outcomes (if available)
        prior_outcomes = None
        if hasattr(catalyst, "drug_id") and catalyst.drug_id:
            # Query previous catalysts for this drug
            prior_catalysts = (
                db.query(Catalyst)
                .filter(
                    and_(
                        Catalyst.drug_id == catalyst.drug_id,
                        Catalyst.id < catalyst.id,
                        Catalyst.outcome.isnot(None)
                    )
                )
                .order_by(Catalyst.date)
                .all()
            )
            
            if prior_catalysts:
                prior_outcomes = [c.outcome for c in prior_catalysts]
        
        # Get trial design factors (if available)
        trial_design_factors = {}
        if hasattr(catalyst, "biomarker_enrichment"):
            trial_design_factors["biomarker_enrichment"] = catalyst.biomarker_enrichment
        if hasattr(catalyst, "endpoint_type"):
            trial_design_factors["hard_endpoint"] = (
                catalyst.endpoint_type in ["MACE", "Mortality", "Disease Progression"]
            )
        if hasattr(catalyst, "trial_size"):
            trial_design_factors["trial_size"] = catalyst.trial_size
        
        # Run prediction
        prediction = predict_catalyst_outcome(
            catalyst_type=catalyst_type,
            phase=phase,
            indication=indication,
            prior_phase_outcomes=prior_outcomes,
            trial_design_factors=trial_design_factors if trial_design_factors else None,
        )
        
        # Add catalyst context
        prediction["catalyst"] = {
            "id": catalyst.id,
            "company": catalyst.company,
            "drug_name": getattr(catalyst, "drug_name", None),
            "description": catalyst.description,
        }
        
        return prediction
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error predicting catalyst outcome: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Prediction failed")


@router.get("/momentum/company/{company_name}")
async def get_company_momentum(
    company_name: str,
    lookback_months: int = Query(6, ge=1, le=24),
    db: Session = Depends(get_db)
):
    """
    Calculate momentum score for a company based on recent catalyst outcomes.
    
    Returns overall score (0-100), trend, and key metrics.
    """
    try:
        # Get recent catalysts for this company
        cutoff_date = datetime.now() - timedelta(days=lookback_months * 30)
        
        catalysts = (
            db.query(Catalyst)
            .filter(
                and_(
                    Catalyst.company == company_name,
                    Catalyst.date >= cutoff_date,
                    Catalyst.outcome.isnot(None)
                )
            )
            .order_by(desc(Catalyst.date))
            .all()
        )
        
        if not catalysts:
            return {
                "company": company_name,
                "overall_score": 50,
                "trend": "neutral",
                "catalyst_count": 0,
                "message": "No recent catalysts found"
            }
        
        # Convert to dict format for momentum calculation
        catalyst_dicts = [
            {
                "date": c.date.isoformat() if c.date else None,
                "outcome": c.outcome,
                "type": c.kind or c.catalyst_type,
            }
            for c in catalysts
        ]
        
        # Calculate momentum
        momentum = calculate_momentum_score(
            catalyst_dicts,
            lookback_months=lookback_months,
            weight_recent=True,
        )
        
        momentum["company"] = company_name
        
        return momentum
        
    except Exception as e:
        logger.error(f"Error calculating company momentum: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Momentum calculation failed")


@router.get("/momentum/therapeutic-areas")
async def get_therapeutic_area_momentum(
    lookback_months: int = Query(6, ge=1, le=24),
    db: Session = Depends(get_db)
):
    """
    Calculate momentum scores for all therapeutic areas.
    
    Returns comparative momentum scores and rankings.
    """
    try:
        cutoff_date = datetime.now() - timedelta(days=lookback_months * 30)
        
        # Get all recent catalysts with therapeutic area
        catalysts = (
            db.query(Catalyst)
            .filter(
                and_(
                    Catalyst.date >= cutoff_date,
                    Catalyst.outcome.isnot(None)
                )
            )
            .all()
        )
        
        if not catalysts:
            return {
                "message": "No recent catalysts found",
                "areas": {}
            }
        
        # Group by therapeutic area
        from collections import defaultdict
        catalysts_by_area = defaultdict(list)
        
        for catalyst in catalysts:
            # Try to extract therapeutic area
            area = "Unknown"
            if hasattr(catalyst, "therapeutic_area") and catalyst.therapeutic_area:
                area = catalyst.therapeutic_area
            elif hasattr(catalyst, "indication") and catalyst.indication:
                # Map indication to therapeutic area
                indication_lower = catalyst.indication.lower()
                if any(term in indication_lower for term in ["cancer", "oncology", "tumor"]):
                    area = "Oncology"
                elif any(term in indication_lower for term in ["cardio", "heart", "cv"]):
                    area = "Cardiology"
                elif any(term in indication_lower for term in ["neuro", "alzheimer", "parkinson"]):
                    area = "Neurology"
                elif any(term in indication_lower for term in ["rare", "orphan"]):
                    area = "Rare Disease"
                else:
                    area = "Other"
            
            catalysts_by_area[area].append({
                "date": catalyst.date.isoformat() if catalyst.date else None,
                "outcome": catalyst.outcome,
                "type": catalyst.kind or catalyst.catalyst_type,
            })
        
        # Calculate momentum for each area
        from ..prediction.momentum_scorer import calculate_therapeutic_area_momentum
        
        momentum_scores = calculate_therapeutic_area_momentum(
            dict(catalysts_by_area),
            lookback_months=lookback_months,
        )
        
        return {
            "lookback_months": lookback_months,
            "total_catalysts": len(catalysts),
            "areas": momentum_scores,
        }
        
    except Exception as e:
        logger.error(f"Error calculating therapeutic area momentum: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Momentum calculation failed")


@router.get("/predictions/upcoming")
async def get_upcoming_predictions(
    limit: int = Query(20, ge=1, le=100),
    min_confidence: float = Query(0.0, ge=0.0, le=1.0),
    db: Session = Depends(get_db)
):
    """
    Get predictions for all upcoming catalysts.
    
    Returns timing and outcome predictions for future events.
    """
    try:
        # Get upcoming catalysts (those without outcomes yet)
        upcoming = (
            db.query(Catalyst)
            .filter(
                and_(
                    Catalyst.outcome.is_(None),
                    Catalyst.date >= datetime.now()
                )
            )
            .order_by(Catalyst.date)
            .limit(limit)
            .all()
        )
        
        if not upcoming:
            return {
                "message": "No upcoming catalysts found",
                "predictions": []
            }
        
        predictions = []
        
        for catalyst in upcoming:
            try:
                # Generate both timing and outcome predictions
                catalyst_type = catalyst.kind or catalyst.catalyst_type or "Unknown"
                phase = getattr(catalyst, "phase", None)
                indication = getattr(catalyst, "indication", None)
                
                timing = predict_catalyst_timing(
                    catalyst_type=catalyst_type,
                    phase=phase,
                    indication=indication,
                    last_milestone_date=catalyst.created_at,
                )
                
                outcome = predict_catalyst_outcome(
                    catalyst_type=catalyst_type,
                    phase=phase,
                    indication=indication,
                )
                
                # Filter by confidence if requested
                if timing["confidence_score"] < min_confidence:
                    continue
                
                predictions.append({
                    "catalyst_id": catalyst.id,
                    "company": catalyst.company,
                    "drug_name": getattr(catalyst, "drug_name", None),
                    "description": catalyst.description,
                    "scheduled_date": catalyst.date.isoformat() if catalyst.date else None,
                    "timing_prediction": timing,
                    "outcome_prediction": outcome,
                })
                
            except Exception as e:
                logger.warning(f"Failed to predict catalyst {catalyst.id}: {e}")
                continue
        
        return {
            "count": len(predictions),
            "predictions": predictions,
        }
        
    except Exception as e:
        logger.error(f"Error getting upcoming predictions: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get predictions")


# ============================================================================
# Enhanced Prediction Endpoints (using adapter layer from issue spec)
# ============================================================================

@router.get("/v2/predict/timing/{catalyst_id}")
async def predict_timing_v2(
    catalyst_id: str,
    db: Session = Depends(get_db)
):
    """
    Enhanced timing prediction using Weibull model with quarterly distributions.
    
    This version uses the adapter layer and returns quarterly probabilities
    as specified in the issue requirements.
    """
    try:
        from ..prediction.adapters import get_catalyst_by_id
        from ..prediction.timing_predictor import predict_quarterly_distribution
        
        # Get catalyst via adapter
        catalyst = get_catalyst_by_id(db, catalyst_id)
        
        # Run enhanced prediction
        result = predict_quarterly_distribution(
            catalyst_type=catalyst.catalyst_type,
            phase=catalyst.phase,
            anchor_date=catalyst.anchor_date,
            pdufa_date=catalyst.pdufa_date,
            therapeutic_area=catalyst.therapeutic_area,
        )
        
        # Add catalyst context
        result["catalyst"] = {
            "id": catalyst.id,
            "ticker": catalyst.ticker,
            "company": catalyst.company,
            "therapeutic_area": catalyst.therapeutic_area,
        }
        
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error in v2 timing prediction: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Prediction failed")


@router.get("/v2/predict/outcome/{catalyst_id}")
async def predict_outcome_v2(
    catalyst_id: str,
    db: Session = Depends(get_db)
):
    """
    Enhanced outcome prediction using Bayesian model with odds-space stacking.
    
    This version uses the adapter layer and applies evidence multiplicatively
    in odds space as specified in the issue requirements.
    """
    try:
        from ..prediction.adapters import get_catalyst_by_id
        from ..prediction.outcome_predictor import predict_outcome_bayesian
        
        # Get catalyst via adapter
        catalyst = get_catalyst_by_id(db, catalyst_id)
        
        # Run enhanced prediction
        result = predict_outcome_bayesian(
            phase=catalyst.phase,
            therapeutic_area=catalyst.therapeutic_area,
            prior_phase_success=catalyst.prior_phase_success,
            biomarker_enrichment=catalyst.biomarker_enrichment,
            hard_endpoints=catalyst.hard_endpoints,
            large_trial=catalyst.large_trial,
        )
        
        # Add catalyst context
        result["catalyst"] = {
            "id": catalyst.id,
            "ticker": catalyst.ticker,
            "company": catalyst.company,
            "therapeutic_area": catalyst.therapeutic_area,
            "phase": catalyst.phase,
        }
        
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error in v2 outcome prediction: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Prediction failed")


@router.get("/v2/momentum/company/{company_name}")
async def get_company_momentum_v2(
    company_name: str,
    lookback_days: int = Query(730, ge=1, le=1460),
    db: Session = Depends(get_db)
):
    """
    Enhanced company momentum with decay, streaks, and TA comparison.
    
    This version uses the advanced momentum scorer with exponential decay,
    streak detection, and therapeutic area z-score comparison.
    """
    try:
        from ..prediction.adapters import get_company_outcomes, get_ta_outcomes
        from ..prediction.momentum_scorer import score_company_advanced
        
        # Get company outcomes via adapter
        company_events = get_company_outcomes(db, company_name, lookback_days)
        
        if not company_events:
            return {
                "company": company_name,
                "momentum_score": 50.0,
                "message": "No recent outcomes found",
                "components": {"base": 0.0, "streak": 0.0, "ta_z": 0.0},
            }
        
        # Get TA outcomes for comparison
        ta_events_map = get_ta_outcomes(db, lookback_days)
        
        # Calculate advanced momentum
        result = score_company_advanced(company_events, ta_events_map)
        result["company"] = company_name
        result["lookback_days"] = lookback_days
        
        return result
        
    except Exception as e:
        logger.error(f"Error in v2 momentum calculation: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Momentum calculation failed")


@router.get("/v2/momentum/therapeutic-areas")
async def get_ta_momentum_v2(
    lookback_days: int = Query(730, ge=1, le=1460),
    db: Session = Depends(get_db)
):
    """
    Enhanced therapeutic area momentum scores.
    
    Returns momentum scores for all therapeutic areas with advanced scoring.
    """
    try:
        from ..prediction.adapters import get_ta_outcomes
        from ..prediction.momentum_scorer import score_company_advanced, raw_momentum
        
        # Get TA outcomes
        ta_events_map = get_ta_outcomes(db, lookback_days)
        
        # Calculate momentum for each TA
        results = {}
        ta_raw_scores = {}
        
        for ta, events in ta_events_map.items():
            if events:
                result = score_company_advanced(events, ta_events_map)
                results[ta] = result
                ta_raw_scores[ta] = raw_momentum(events)
            else:
                results[ta] = {
                    "momentum_score": 50.0,
                    "components": {"base": 0.0, "streak": 0.0, "ta_z": 0.0},
                    "event_count": 0,
                }
        
        # Add rankings
        sorted_tas = sorted(
            results.items(),
            key=lambda x: x[1]["momentum_score"],
            reverse=True
        )
        
        for rank, (ta, score_dict) in enumerate(sorted_tas, 1):
            results[ta]["rank"] = rank
            results[ta]["percentile"] = round((1 - (rank - 1) / len(sorted_tas)) * 100, 1)
        
        return {
            "lookback_days": lookback_days,
            "therapeutic_areas": results,
        }
        
    except Exception as e:
        logger.error(f"Error in v2 TA momentum: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="TA momentum calculation failed")


@router.get("/v2/upcoming")
async def get_upcoming_v2(
    limit: int = Query(20, ge=1, le=100),
    min_confidence: float = Query(0.6, ge=0.0, le=1.0),
    db: Session = Depends(get_db)
):
    """
    Enhanced upcoming catalyst predictions with adapter-based data access.
    
    Returns timing and outcome predictions for upcoming catalysts using
    the enhanced prediction models.
    """
    try:
        from ..prediction.adapters import list_upcoming_catalysts
        from ..prediction.timing_predictor import predict_quarterly_distribution
        from ..prediction.outcome_predictor import predict_outcome_bayesian
        
        # Get upcoming catalysts via adapter
        catalysts = list_upcoming_catalysts(db, limit)
        
        predictions = []
        
        for catalyst in catalysts:
            try:
                # Timing prediction
                timing = predict_quarterly_distribution(
                    catalyst_type=catalyst.catalyst_type,
                    phase=catalyst.phase,
                    anchor_date=catalyst.anchor_date,
                    pdufa_date=catalyst.pdufa_date,
                    therapeutic_area=catalyst.therapeutic_area,
                )
                
                # Filter by confidence
                if timing.get("confidence", 0.0) < min_confidence:
                    continue
                
                # Outcome prediction
                outcome = predict_outcome_bayesian(
                    phase=catalyst.phase,
                    therapeutic_area=catalyst.therapeutic_area,
                    prior_phase_success=catalyst.prior_phase_success,
                    biomarker_enrichment=catalyst.biomarker_enrichment,
                    hard_endpoints=catalyst.hard_endpoints,
                    large_trial=catalyst.large_trial,
                )
                
                predictions.append({
                    "catalyst_id": catalyst.id,
                    "ticker": catalyst.ticker,
                    "company": catalyst.company,
                    "therapeutic_area": catalyst.therapeutic_area,
                    "catalyst_type": catalyst.catalyst_type,
                    "phase": catalyst.phase,
                    "timing": timing,
                    "outcome": outcome,
                })
                
            except Exception as e:
                logger.warning(f"Failed to predict catalyst {catalyst.id}: {e}")
                continue
        
        return {
            "count": len(predictions),
            "min_confidence": min_confidence,
            "upcoming": predictions,
        }
        
    except Exception as e:
        logger.error(f"Error in v2 upcoming predictions: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get predictions")

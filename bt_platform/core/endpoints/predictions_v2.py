"""
Prediction API v2 Endpoints

Enhanced prediction endpoints with:
- Timing v2: Weibull with hazard spikes and TA scaling
- Outcome v2: Calibrated Bayesian in odds space
- Momentum v2: Peer-neutral with decay and streaks
- Alpha scoring: Expected value with timing confidence
- Upcoming v2: Enhanced catalyst list
- Top alpha: Ranked opportunities by edge score

All endpoints maintain backward compatibility with v1.
"""

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
import logging
import datetime as dt

from ..database import get_db
from ..prediction.adapters import (
    get_catalyst_by_id,
    list_upcoming_catalysts,
    get_company_outcomes,
    get_ta_outcomes,
)
from ..prediction.timing_predictor_v2 import predict_quarterly_distribution_v2
from ..prediction.outcome_predictor_v2 import predict_outcome_bayesian_v2
from ..prediction.momentum_scorer_v2 import score_company_advanced, _raw
from ..prediction.alpha_scorer import expected_alpha_for_catalyst

logger = logging.getLogger(__name__)

router = APIRouter()

# Load optional runtime calibrator + hazard windows
# In production, these would be loaded from JSON files or environment
PAV_CALIBRATOR = None  # TODO: Load from JSON file with calibration parameters
HAZARD_WINDOWS = []    # TODO: Load conference dates, e.g., [(dt.date(2025,6,1), dt.date(2025,6,15), 1.3)]


@router.get("/v2/predict/timing/{catalyst_id}")
async def predict_timing_v2(
    catalyst_id: str,
    db: Session = Depends(get_db)
):
    """
    Enhanced timing prediction using Weibull model v2.
    
    Features:
    - Quarterly probability distributions
    - Hazard spike windows for major events (ASCO, AHA, etc.)
    - Therapeutic area scaling factors
    - Optional 2-component mixtures for bimodal trials
    
    Returns:
        Dict with quarterly_probabilities, bins, reference, and confidence
    """
    try:
        # Get catalyst via adapter
        catalyst = get_catalyst_by_id(db, catalyst_id)
        
        # Run v2 timing prediction
        result = predict_quarterly_distribution_v2(
            c=catalyst,
            hazard_windows=HAZARD_WINDOWS,
            mixture=None,  # TODO: Add mixture support for bimodal trials
        )
        
        # Add catalyst context
        result["catalyst"] = {
            "id": catalyst.id,
            "ticker": catalyst.ticker,
            "company": catalyst.company,
            "therapeutic_area": catalyst.therapeutic_area,
            "catalyst_type": catalyst.catalyst_type,
            "phase": catalyst.phase,
        }
        
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error in v2 timing prediction: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Timing prediction failed")


@router.get("/v2/predict/outcome/{catalyst_id}")
async def predict_outcome_v2(
    catalyst_id: str,
    db: Session = Depends(get_db)
):
    """
    Enhanced outcome prediction using calibrated Bayesian model v2.
    
    Features:
    - Evidence stacking in odds space
    - PAV isotonic calibration for reliability
    - Phase-based priors from BIO data
    - Therapeutic area adjustments
    
    Returns:
        Dict with probability_of_success, prior_probability, evidence_factors, calibrated flag
    """
    try:
        # Get catalyst via adapter
        catalyst = get_catalyst_by_id(db, catalyst_id)
        
        # Run v2 outcome prediction
        result = predict_outcome_bayesian_v2(
            c=catalyst,
            pav_calibrator=PAV_CALIBRATOR,
        )
        
        # Convert dataclass to dict and add catalyst context
        response = {
            "probability_of_success": result.probability_of_success,
            "prior_probability": result.prior_probability,
            "evidence_factors": result.evidence_factors,
            "calibrated": result.calibrated,
            "catalyst": {
                "id": catalyst.id,
                "ticker": catalyst.ticker,
                "company": catalyst.company,
                "therapeutic_area": catalyst.therapeutic_area,
                "phase": catalyst.phase,
            }
        }
        
        return response
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error in v2 outcome prediction: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Outcome prediction failed")


@router.get("/v2/momentum/company/{company_name}")
async def get_company_momentum_v2(
    company_name: str,
    lookback_days: int = Query(730, ge=1, le=1460),
    db: Session = Depends(get_db)
):
    """
    Enhanced company momentum with v2 scoring.
    
    Features:
    - Exponential recency decay (30-day half-life)
    - Streak detection and boosting (capped at 5)
    - Therapeutic area z-score comparison (peer-neutral)
    - 0-100 scaling via tanh
    
    Returns:
        Dict with momentum_score, components (base, streak, ta_z), event_count
    """
    try:
        # Get company outcomes via adapter
        company_events = get_company_outcomes(db, company_name, lookback_days)
        
        if not company_events:
            return {
                "company": company_name,
                "momentum_score": 50.0,
                "message": "No recent outcomes found",
                "components": {"base": 0.0, "streak": 0.0, "ta_z": 0.0},
                "event_count": 0,
            }
        
        # Get TA outcomes for comparison
        ta_events_map = get_ta_outcomes(db, lookback_days)
        
        # Calculate advanced momentum
        result = score_company_advanced(
            company=company_name,
            company_events=company_events,
            ta_events_map=ta_events_map
        )
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
    Enhanced therapeutic area momentum scores v2.
    
    Returns momentum scores for all therapeutic areas with:
    - Raw momentum scores
    - Rankings and percentiles
    - Component breakdowns
    
    Returns:
        Dict with lookback_days and therapeutic_areas dict
    """
    try:
        # Get TA outcomes
        ta_events_map = get_ta_outcomes(db, lookback_days)
        
        # Calculate momentum for each TA
        results = {}
        
        for ta, events in ta_events_map.items():
            if events:
                result = score_company_advanced(
                    company=ta,  # Use TA name as "company" for scoring
                    company_events=events,
                    ta_events_map=ta_events_map
                )
                # Replace company key with therapeutic_area
                result["therapeutic_area"] = result.pop("company")
                results[ta] = result
            else:
                results[ta] = {
                    "therapeutic_area": ta,
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
            if len(sorted_tas) > 0:
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
    Enhanced upcoming catalyst predictions v2.
    
    Returns timing and outcome predictions for upcoming catalysts using
    the enhanced v2 prediction models.
    
    Args:
        limit: Maximum number of catalysts to return
        min_confidence: Minimum timing confidence threshold (0-1)
        
    Returns:
        Dict with count, min_confidence, and upcoming list
    """
    try:
        # Get upcoming catalysts via adapter
        catalysts = list_upcoming_catalysts(db, limit)
        
        predictions = []
        
        for catalyst in catalysts:
            try:
                # Timing prediction v2
                timing = predict_quarterly_distribution_v2(
                    c=catalyst,
                    hazard_windows=HAZARD_WINDOWS,
                )
                
                # Filter by confidence
                conf = 1.0 - timing.get("outside_window", 0.4)
                if conf < min_confidence:
                    continue
                
                # Outcome prediction v2
                outcome = predict_outcome_bayesian_v2(
                    c=catalyst,
                    pav_calibrator=PAV_CALIBRATOR,
                )
                
                predictions.append({
                    "catalyst_id": catalyst.id,
                    "ticker": catalyst.ticker,
                    "company": catalyst.company,
                    "therapeutic_area": catalyst.therapeutic_area,
                    "catalyst_type": catalyst.catalyst_type,
                    "phase": catalyst.phase,
                    "timing": timing,
                    "outcome": {
                        "probability_of_success": outcome.probability_of_success,
                        "prior_probability": outcome.prior_probability,
                        "evidence_factors": outcome.evidence_factors,
                        "calibrated": outcome.calibrated,
                    }
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


@router.get("/v2/alpha/top")
async def get_top_alpha_v2(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Get top alpha opportunities ranked by expected value.
    
    Combines:
    - Outcome probabilities (calibrated)
    - Expected move distributions (historical reactions)
    - Timing confidence (quarterly)
    - Downside penalty (risk-aware EV)
    
    Returns catalysts ranked by edge_score (0-100).
    
    Args:
        limit: Maximum number of top opportunities to return
        
    Returns:
        Dict with top list ranked by edge_score
    """
    try:
        # Get upcoming catalysts (oversample for ranking)
        candidates = list_upcoming_catalysts(db, limit * 3)
        
        if not candidates:
            return {
                "count": 0,
                "top": [],
                "message": "No upcoming catalysts found"
            }
        
        # Score each catalyst
        scored = []
        for c in candidates:
            try:
                alpha_result = expected_alpha_for_catalyst(
                    c=c,
                    pav_calib=PAV_CALIBRATOR,
                    hazard_windows=HAZARD_WINDOWS
                )
                scored.append(alpha_result)
            except Exception as e:
                logger.warning(f"Failed to score catalyst {c.id}: {e}")
                continue
        
        # Sort by edge_score (descending)
        scored.sort(key=lambda r: r["edge_score"], reverse=True)
        
        # Return top N
        top = scored[:limit]
        
        return {
            "count": len(top),
            "top": top
        }
        
    except Exception as e:
        logger.error(f"Error in v2 alpha/top: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Alpha scoring failed")

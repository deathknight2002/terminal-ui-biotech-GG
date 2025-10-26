"""
Clinical Trials Intelligence API Endpoints

Endpoints for clinical trial data from ClinicalTrials.gov, including
trial search, details, recruitment status, and competitive analysis.
"""

from fastapi import APIRouter, Query, HTTPException, Path
from typing import Optional, List
from datetime import datetime

from ...providers.clinicaltrials_provider import ClinicalTrialsProvider

router = APIRouter()
ct_provider = ClinicalTrialsProvider()


@router.get("/search")
async def search_trials(
    query: Optional[str] = Query(None, description="General search query"),
    condition: Optional[str] = Query(None, description="Condition/disease (e.g., 'Cancer')"),
    intervention: Optional[str] = Query(None, description="Intervention/treatment (e.g., 'Pembrolizumab')"),
    sponsor: Optional[str] = Query(None, description="Sponsor organization"),
    phase: Optional[str] = Query(None, description="EARLY_PHASE1, PHASE1, PHASE2, PHASE3, PHASE4"),
    status: Optional[str] = Query(None, description="RECRUITING, ACTIVE_NOT_RECRUITING, COMPLETED, etc."),
    country: Optional[str] = Query("US", description="Country code (e.g., 'US', 'GB')"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of results"),
    page: int = Query(1, ge=1, description="Page number")
):
    """
    Search clinical trials with advanced filters

    **Examples:**
    - `/trials/search?condition=Breast Cancer&phase=PHASE3` - Phase 3 breast cancer trials
    - `/trials/search?intervention=CAR-T&status=RECRUITING` - Recruiting CAR-T trials
    - `/trials/search?sponsor=Pfizer&phase=PHASE2` - Pfizer Phase 2 trials
    """
    try:
        result = await ct_provider.search_studies(
            query=query,
            condition=condition,
            intervention=intervention,
            sponsor=sponsor,
            phase=phase,
            status=status,
            country=country,
            limit=limit,
            page=page
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recruiting")
async def get_recruiting_trials(
    condition: Optional[str] = Query(None, description="Condition/disease"),
    phase: Optional[str] = Query(None, description="Study phase"),
    country: str = Query("US", description="Country code"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of results")
):
    """
    Get currently recruiting clinical trials

    Useful for identifying enrollment opportunities and competitive landscape.

    **Examples:**
    - `/trials/recruiting?condition=Lung Cancer&phase=PHASE3` - Recruiting lung cancer Phase 3 trials
    - `/trials/recruiting?condition=Rare Disease` - Recruiting rare disease trials
    """
    try:
        result = await ct_provider.get_recruiting_trials(
            condition=condition,
            phase=phase,
            country=country,
            limit=limit
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/completed")
async def get_completed_trials(
    condition: Optional[str] = Query(None, description="Condition/disease"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of results")
):
    """
    Get completed trials with posted results

    Useful for competitive intelligence and clinical evidence analysis.
    """
    try:
        result = await ct_provider.get_completed_trials_with_results(
            condition=condition,
            limit=limit
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/details/{nct_id}")
async def get_trial_details(
    nct_id: str = Path(..., description="NCT identifier (e.g., 'NCT04280705')")
):
    """
    Get detailed information for a specific clinical trial

    Returns comprehensive trial information including arms, outcomes,
    eligibility criteria, locations, and references.

    **Example:**
    - `/trials/details/NCT04280705` - Get full details for NCT04280705
    """
    try:
        result = await ct_provider.get_study_details(nct_id=nct_id)

        if result.get("error"):
            raise HTTPException(status_code=404, detail=result["error"])

        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/statistics")
async def get_trial_statistics(
    group_by: str = Query("phase", description="Group by: phase, status, sponsor"),
    condition: Optional[str] = Query(None, description="Filter by condition"),
    sponsor: Optional[str] = Query(None, description="Filter by sponsor")
):
    """
    Get aggregated statistics about clinical trials

    **Examples:**
    - `/trials/statistics?group_by=phase&condition=Cancer` - Cancer trials by phase
    - `/trials/statistics?group_by=status&sponsor=Pfizer` - Pfizer trials by status
    """
    try:
        result = await ct_provider.get_statistics(
            group_by=group_by,
            condition=condition,
            sponsor=sponsor
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/dashboard")
async def get_trials_dashboard(
    condition: Optional[str] = Query(None, description="Focus on specific condition")
):
    """
    Get comprehensive clinical trials dashboard data

    Returns recruiting trials, phase distribution, and completion statistics.
    Optimized for dashboard visualization.
    """
    try:
        # Get recruiting trials
        recruiting = await ct_provider.get_recruiting_trials(
            condition=condition,
            limit=50
        )

        # Get phase statistics
        phase_stats = await ct_provider.get_statistics(
            group_by="phase",
            condition=condition
        )

        # Get status statistics
        status_stats = await ct_provider.get_statistics(
            group_by="status",
            condition=condition
        )

        return {
            "recruiting_trials": recruiting.get("data", []),
            "recruiting_count": recruiting.get("count", 0),
            "phase_distribution": phase_stats.get("data", []),
            "status_distribution": status_stats.get("data", []),
            "total_trials": phase_stats.get("total_studies", 0),
            "condition_filter": condition,
            "timestamp": datetime.now().isoformat(),
            "source": "clinicaltrials.gov"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/competitive-landscape")
async def get_competitive_landscape(
    condition: str = Query(..., description="Condition/disease to analyze"),
    phase: Optional[str] = Query(None, description="Filter by phase"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of trials")
):
    """
    Get competitive landscape analysis for a specific condition

    Returns trial distribution by sponsor, phase, and recruitment status
    to understand the competitive dynamics in a therapeutic area.

    **Example:**
    - `/trials/competitive-landscape?condition=Multiple Myeloma&phase=PHASE3`
    """
    try:
        # Get all trials for condition
        trials = await ct_provider.search_studies(
            condition=condition,
            phase=phase,
            limit=limit
        )

        # Get sponsor distribution
        sponsor_stats = await ct_provider.get_statistics(
            group_by="sponsor",
            condition=condition
        )

        # Get phase distribution
        phase_stats = await ct_provider.get_statistics(
            group_by="phase",
            condition=condition
        )

        return {
            "condition": condition,
            "total_trials": trials.get("total", 0),
            "active_trials": trials.get("count", 0),
            "sponsor_distribution": sponsor_stats.get("data", [])[:20],  # Top 20 sponsors
            "phase_distribution": phase_stats.get("data", []),
            "sample_trials": trials.get("data", [])[:10],  # First 10 trials as examples
            "timestamp": datetime.now().isoformat(),
            "source": "clinicaltrials.gov"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/enrollment-tracker")
async def track_enrollment(
    sponsor: Optional[str] = Query(None, description="Filter by sponsor"),
    condition: Optional[str] = Query(None, description="Filter by condition"),
    limit: int = Query(50, ge=1, le=200, description="Maximum number of trials")
):
    """
    Track trial enrollment status and projections

    Returns recruiting trials with enrollment information for monitoring
    recruitment progress and competitive enrollment dynamics.
    """
    try:
        recruiting = await ct_provider.search_studies(
            sponsor=sponsor,
            condition=condition,
            status="RECRUITING",
            limit=limit
        )

        trials = recruiting.get("data", [])

        # Enrich with enrollment metrics
        for trial in trials:
            enrollment = trial.get("enrollment", 0)
            start_date = trial.get("start_date")
            completion_date = trial.get("primary_completion_date")

            # Calculate enrollment progress indicators
            trial["enrollment_size"] = enrollment
            trial["has_enrollment_target"] = enrollment is not None and enrollment > 0

            # Categorize by size
            if enrollment:
                if enrollment < 50:
                    trial["enrollment_category"] = "small"
                elif enrollment < 300:
                    trial["enrollment_category"] = "medium"
                else:
                    trial["enrollment_category"] = "large"

        return {
            "trials": trials,
            "count": len(trials),
            "total": recruiting.get("total", 0),
            "filters": {
                "sponsor": sponsor,
                "condition": condition
            },
            "timestamp": datetime.now().isoformat(),
            "source": "clinicaltrials.gov"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

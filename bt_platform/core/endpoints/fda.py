"""
FDA Intelligence API Endpoints

Endpoints for FDA drug approvals, adverse events, recalls, and enforcement data
using the OpenFDA provider.
"""

from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List
from datetime import datetime, timedelta

from ...providers.openfda_provider import OpenFDAProvider

router = APIRouter()
fda_provider = OpenFDAProvider()


@router.get("/approvals")
async def get_fda_approvals(
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of results"),
    search: Optional[str] = Query(None, description="Search query (e.g., 'openfda.brand_name:Keytruda')"),
    date_from: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="End date (YYYY-MM-DD)")
):
    """
    Get FDA drug approval data
    
    **Examples:**
    - `/fda/approvals?limit=50` - Get recent approvals
    - `/fda/approvals?search=openfda.brand_name:Keytruda` - Search for Keytruda
    - `/fda/approvals?date_from=2023-01-01&date_to=2023-12-31` - Get 2023 approvals
    """
    try:
        result = await fda_provider.fetch_drug_approvals(
            limit=limit,
            search=search,
            date_from=date_from,
            date_to=date_to
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/adverse-events")
async def get_adverse_events(
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of results"),
    drug_name: Optional[str] = Query(None, description="Drug brand name"),
    reaction: Optional[str] = Query(None, description="Adverse reaction/symptom"),
    serious: Optional[bool] = Query(None, description="Filter for serious events only"),
    date_from: Optional[str] = Query(None, description="Start date (YYYYMMDD)"),
    date_to: Optional[str] = Query(None, description="End date (YYYYMMDD)")
):
    """
    Get FDA adverse event reports (FAERS data)
    
    **Examples:**
    - `/fda/adverse-events?drug_name=Keytruda&limit=50` - Keytruda adverse events
    - `/fda/adverse-events?serious=true&limit=100` - Serious adverse events
    - `/fda/adverse-events?reaction=Pneumonia` - Events with pneumonia as reaction
    """
    try:
        result = await fda_provider.fetch_adverse_events(
            limit=limit,
            drug_name=drug_name,
            reaction=reaction,
            serious=serious,
            date_from=date_from,
            date_to=date_to
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/adverse-events/counts")
async def get_adverse_event_counts(
    limit: int = Query(20, ge=1, le=100, description="Maximum number of drugs to return"),
    date_from: Optional[str] = Query(None, description="Start date (YYYYMMDD)"),
    date_to: Optional[str] = Query(None, description="End date (YYYYMMDD)")
):
    """
    Get aggregated adverse event counts by drug
    
    Returns the drugs with the most adverse event reports, useful for
    safety signal detection and trend analysis.
    
    **Example:**
    - `/fda/adverse-events/counts?limit=20` - Top 20 drugs by adverse event count
    """
    try:
        result = await fda_provider.count_adverse_events_by_drug(
            limit=limit,
            date_from=date_from,
            date_to=date_to
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recalls")
async def get_drug_recalls(
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of results"),
    classification: Optional[str] = Query(None, description="Class I, Class II, or Class III"),
    status: Optional[str] = Query(None, description="Ongoing, Completed, or Terminated"),
    date_from: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="End date (YYYY-MM-DD)")
):
    """
    Get FDA drug recall data
    
    **Classification:**
    - Class I: Dangerous or defective products that could cause serious health problems or death
    - Class II: Products that might cause temporary or medically reversible health problem
    - Class III: Products unlikely to cause adverse health reaction but violate FDA labeling or manufacturing regulations
    
    **Examples:**
    - `/fda/recalls?classification=Class I&limit=50` - Class I recalls
    - `/fda/recalls?status=Ongoing` - Ongoing recalls
    """
    try:
        result = await fda_provider.fetch_drug_recalls(
            limit=limit,
            classification=classification,
            status=status,
            date_from=date_from,
            date_to=date_to
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/enforcement")
async def get_enforcement_reports(
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of results"),
    state: Optional[str] = Query(None, description="US state code (e.g., CA, NY)"),
    date_from: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="End date (YYYY-MM-DD)")
):
    """
    Get FDA enforcement reports
    
    Includes recalls, market withdrawals, and safety alerts.
    """
    try:
        result = await fda_provider.fetch_enforcement_reports(
            limit=limit,
            state=state,
            date_from=date_from,
            date_to=date_to
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/labels")
async def get_drug_labels(
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of results"),
    brand_name: Optional[str] = Query(None, description="Drug brand name"),
    generic_name: Optional[str] = Query(None, description="Drug generic name")
):
    """
    Get FDA drug label data (package inserts, prescribing information)
    
    **Examples:**
    - `/fda/labels?brand_name=Keytruda` - Get Keytruda label
    - `/fda/labels?generic_name=pembrolizumab` - Get by generic name
    """
    try:
        result = await fda_provider.fetch_drug_labels(
            limit=limit,
            brand_name=brand_name,
            generic_name=generic_name
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/dashboard")
async def get_fda_dashboard():
    """
    Get comprehensive FDA intelligence dashboard data
    
    Returns recent approvals, top adverse events, and active recalls in one call.
    Optimized for dashboard visualization.
    """
    try:
        # Get recent approvals (last 90 days)
        ninety_days_ago = (datetime.now() - timedelta(days=90)).strftime("%Y-%m-%d")
        approvals = await fda_provider.fetch_drug_approvals(
            limit=20,
            date_from=ninety_days_ago
        )
        
        # Get top drugs by adverse events (last 30 days)
        thirty_days_ago = (datetime.now() - timedelta(days=30)).strftime("%Y%m%d")
        adverse_counts = await fda_provider.count_adverse_events_by_drug(
            limit=10,
            date_from=thirty_days_ago
        )
        
        # Get active recalls
        recalls = await fda_provider.fetch_drug_recalls(
            limit=20,
            status="Ongoing"
        )
        
        return {
            "recent_approvals": approvals.get("data", []),
            "approvals_count": approvals.get("count", 0),
            "top_adverse_events": adverse_counts.get("data", []),
            "active_recalls": recalls.get("data", []),
            "recalls_count": recalls.get("count", 0),
            "timestamp": datetime.now().isoformat(),
            "source": "openfda"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/safety-signals")
async def detect_safety_signals(
    limit: int = Query(10, ge=1, le=50, description="Number of drugs to analyze"),
    days: int = Query(30, ge=7, le=365, description="Days to look back")
):
    """
    Detect potential safety signals based on adverse event trends
    
    Identifies drugs with unusually high adverse event reporting rates
    that may warrant further investigation.
    """
    try:
        date_from = (datetime.now() - timedelta(days=days)).strftime("%Y%m%d")
        
        # Get adverse event counts
        counts_result = await fda_provider.count_adverse_events_by_drug(
            limit=limit,
            date_from=date_from
        )
        
        drugs = counts_result.get("data", [])
        
        # Calculate basic statistics
        if drugs:
            event_counts = [d["event_count"] for d in drugs]
            avg_count = sum(event_counts) / len(event_counts)
            
            # Flag drugs with above-average reporting
            for drug in drugs:
                drug["above_average"] = drug["event_count"] > avg_count
                drug["signal_strength"] = "high" if drug["event_count"] > avg_count * 2 else "moderate"
        
        return {
            "data": drugs,
            "period_days": days,
            "analysis_date": datetime.now().isoformat(),
            "source": "openfda_analysis"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

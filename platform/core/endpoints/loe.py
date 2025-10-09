"""
Loss of Exclusivity (LoE) endpoints

Track patent expiries and erosion timelines.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, List, Any, Optional
from datetime import datetime

from ..database import get_db, PatentExpiry, RevenueLine

router = APIRouter()


@router.get("/timeline")
async def get_loe_timeline(
    ticker: Optional[str] = None,
    company: Optional[str] = None,
    db: Session = Depends(get_db)
) -> dict:
    """
    Get LoE cliff timeline with stacked revenue-at-risk by year.
    
    Returns Gantt-style timeline of patent expiries and erosion curves.
    """
    query = db.query(PatentExpiry)
    
    # Filter logic would go here based on ticker/company
    expiries = query.order_by(PatentExpiry.expiry_date).all()
    
    # Group by year for stacked visualization
    timeline_data = {}
    
    for expiry in expiries:
        year = expiry.expiry_date.year
        if year not in timeline_data:
            timeline_data[year] = {
                "year": year,
                "events": [],
                "total_revenue_at_risk": 0
            }
        
        timeline_data[year]["events"].append({
            "asset_id": expiry.asset_id,
            "asset_name": expiry.asset_name,
            "region": expiry.region,
            "expiry_date": expiry.expiry_date.isoformat(),
            "exclusivity_type": expiry.exclusivity_type,
            "peak_revenue": expiry.peak_revenue_before_loe or 0,
            "erosion_curve_id": expiry.erosion_curve_id
        })
        
        timeline_data[year]["total_revenue_at_risk"] += expiry.peak_revenue_before_loe or 0
    
    return {
        "timeline": list(timeline_data.values()),
        "total_events": len(expiries),
        "filters": {
            "ticker": ticker,
            "company": company
        }
    }


@router.get("/events/{asset_id}")
async def get_loe_events_by_asset(
    asset_id: str,
    db: Session = Depends(get_db)
) -> dict:
    """Get all LoE events for a specific asset."""
    events = db.query(PatentExpiry).filter(
        PatentExpiry.asset_id == asset_id
    ).all()
    
    return {
        "asset_id": asset_id,
        "count": len(events),
        "events": [
            {
                "id": e.id,
                "region": e.region,
                "expiry_date": e.expiry_date.isoformat(),
                "exclusivity_type": e.exclusivity_type,
                "peak_revenue": e.peak_revenue_before_loe,
                "erosion_rates": {
                    "year_1": e.year_1_erosion_rate,
                    "year_2": e.year_2_erosion_rate,
                    "steady_state": e.steady_state_share
                }
            }
            for e in events
        ]
    }


@router.post("/events")
async def create_loe_event(
    data: Dict[str, Any],
    db: Session = Depends(get_db)
) -> dict:
    """Create new LoE event."""
    event = PatentExpiry(
        asset_id=data["asset_id"],
        asset_name=data["asset_name"],
        region=data["region"],
        expiry_date=datetime.fromisoformat(data["expiry_date"]),
        exclusivity_type=data["exclusivity_type"],
        erosion_curve_id=data.get("erosion_curve_id", "default"),
        peak_revenue_before_loe=data.get("peak_revenue"),
        year_1_erosion_rate=data.get("year_1_erosion_rate", 0.60),
        year_2_erosion_rate=data.get("year_2_erosion_rate", 0.20),
        steady_state_share=data.get("steady_state_share", 0.85)
    )
    
    db.add(event)
    db.commit()
    db.refresh(event)
    
    return {"id": event.id, "status": "created"}

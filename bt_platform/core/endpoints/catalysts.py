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

from ..database import get_db, Catalyst

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

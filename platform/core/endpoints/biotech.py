"""
Biotech Data Endpoints

API endpoints for drug pipeline, clinical trials, and pharmaceutical intelligence.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ..database import get_db, Drug, ClinicalTrial, Company, Catalyst
from ...providers.biotech_provider import BiotechProvider

router = APIRouter()
biotech_provider = BiotechProvider()


@router.get("/drugs")
async def get_drugs(
    therapeutic_area: Optional[str] = Query(None, description="Filter by therapeutic area"),
    phase: Optional[str] = Query(None, description="Filter by development phase"),
    company: Optional[str] = Query(None, description="Filter by company"),
    limit: int = Query(100, le=1000),
    db: Session = Depends(get_db)
):
    """Get drug pipeline data"""
    query = db.query(Drug)
    
    if therapeutic_area:
        query = query.filter(Drug.therapeutic_area.ilike(f"%{therapeutic_area}%"))
    if phase:
        query = query.filter(Drug.phase.ilike(f"%{phase}%"))
    if company:
        query = query.filter(Drug.company.ilike(f"%{company}%"))
    
    drugs = query.limit(limit).all()
    
    return {
        "data": [
            {
                "id": drug.id,
                "name": drug.name,
                "generic_name": drug.generic_name,
                "company": drug.company,
                "therapeutic_area": drug.therapeutic_area,
                "indication": drug.indication,
                "phase": drug.phase,
                "mechanism": drug.mechanism,
                "target": drug.target,
                "status": drug.status
            }
            for drug in drugs
        ],
        "count": len(drugs)
    }


@router.get("/clinical-trials")
async def get_clinical_trials(
    phase: Optional[str] = Query(None, description="Filter by trial phase"),
    status: Optional[str] = Query(None, description="Filter by trial status"),
    condition: Optional[str] = Query(None, description="Filter by medical condition"),
    sponsor: Optional[str] = Query(None, description="Filter by sponsor"),
    limit: int = Query(100, le=1000),
    db: Session = Depends(get_db)
):
    """Get clinical trial data"""
    query = db.query(ClinicalTrial)
    
    if phase:
        query = query.filter(ClinicalTrial.phase.ilike(f"%{phase}%"))
    if status:
        query = query.filter(ClinicalTrial.status.ilike(f"%{status}%"))
    if condition:
        query = query.filter(ClinicalTrial.condition.ilike(f"%{condition}%"))
    if sponsor:
        query = query.filter(ClinicalTrial.sponsor.ilike(f"%{sponsor}%"))
    
    trials = query.limit(limit).all()
    
    return {
        "data": [
            {
                "id": trial.id,
                "nct_id": trial.nct_id,
                "title": trial.title,
                "phase": trial.phase,
                "status": trial.status,
                "condition": trial.condition,
                "intervention": trial.intervention,
                "sponsor": trial.sponsor,
                "start_date": trial.start_date.isoformat() if trial.start_date else None,
                "completion_date": trial.completion_date.isoformat() if trial.completion_date else None,
                "enrollment": trial.enrollment
            }
            for trial in trials
        ],
        "count": len(trials)
    }


@router.get("/companies")
async def get_companies(
    company_type: Optional[str] = Query(None, description="Filter by company type"),
    min_market_cap: Optional[float] = Query(None, description="Minimum market cap"),
    limit: int = Query(100, le=1000),
    db: Session = Depends(get_db)
):
    """Get biotech/pharma company data"""
    query = db.query(Company)
    
    if company_type:
        query = query.filter(Company.company_type.ilike(f"%{company_type}%"))
    if min_market_cap:
        query = query.filter(Company.market_cap >= min_market_cap)
    
    companies = query.limit(limit).all()
    
    return {
        "data": [
            {
                "id": company.id,
                "name": company.name,
                "ticker": company.ticker,
                "company_type": company.company_type,
                "market_cap": company.market_cap,
                "headquarters": company.headquarters,
                "founded": company.founded,
                "employees": company.employees,
                "pipeline_count": company.pipeline_count
            }
            for company in companies
        ],
        "count": len(companies)
    }


@router.get("/catalysts")
async def get_catalysts(
    upcoming_days: int = Query(90, description="Number of days to look ahead"),
    company: Optional[str] = Query(None, description="Filter by company"),
    event_type: Optional[str] = Query(None, description="Filter by event type"),
    min_probability: Optional[float] = Query(None, description="Minimum probability threshold"),
    db: Session = Depends(get_db)
):
    """Get upcoming market catalysts"""
    query = db.query(Catalyst)
    
    # Filter for upcoming events
    future_date = datetime.now() + datetime.timedelta(days=upcoming_days)
    query = query.filter(Catalyst.event_date <= future_date)
    query = query.filter(Catalyst.event_date >= datetime.now())
    
    if company:
        query = query.filter(Catalyst.company.ilike(f"%{company}%"))
    if event_type:
        query = query.filter(Catalyst.event_type.ilike(f"%{event_type}%"))
    if min_probability:
        query = query.filter(Catalyst.probability >= min_probability)
    
    catalysts = query.order_by(Catalyst.event_date).all()
    
    return {
        "data": [
            {
                "id": catalyst.id,
                "title": catalyst.title,
                "company": catalyst.company,
                "drug": catalyst.drug,
                "event_type": catalyst.event_type,
                "event_date": catalyst.event_date.isoformat(),
                "probability": catalyst.probability,
                "impact": catalyst.impact,
                "description": catalyst.description,
                "status": catalyst.status,
                "days_until": (catalyst.event_date - datetime.now()).days
            }
            for catalyst in catalysts
        ],
        "count": len(catalysts)
    }


@router.get("/pipeline-overview")
async def get_pipeline_overview(db: Session = Depends(get_db)):
    """Get pipeline overview statistics"""
    
    # Phase distribution
    phase_counts = db.query(Drug.phase, db.func.count(Drug.id)).group_by(Drug.phase).all()
    
    # Therapeutic area distribution  
    area_counts = db.query(Drug.therapeutic_area, db.func.count(Drug.id)).group_by(Drug.therapeutic_area).all()
    
    # Company pipeline sizes
    company_counts = db.query(Drug.company, db.func.count(Drug.id)).group_by(Drug.company).all()
    
    return {
        "phase_distribution": [{"phase": phase, "count": count} for phase, count in phase_counts],
        "therapeutic_areas": [{"area": area, "count": count} for area, count in area_counts],
        "company_pipelines": [{"company": company, "count": count} for company, count in company_counts],
        "total_drugs": db.query(Drug).count(),
        "total_trials": db.query(ClinicalTrial).count(),
        "total_companies": db.query(Company).count()
    }


@router.get("/search")
async def search_biotech_data(
    q: str = Query(..., description="Search query"),
    category: str = Query("all", description="Search category: drugs, trials, companies, all"),
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db)
):
    """Search across biotech data"""
    results = {"drugs": [], "trials": [], "companies": []}
    
    if category in ["drugs", "all"]:
        drugs = db.query(Drug).filter(
            Drug.name.ilike(f"%{q}%") |
            Drug.company.ilike(f"%{q}%") |
            Drug.indication.ilike(f"%{q}%") |
            Drug.mechanism.ilike(f"%{q}%")
        ).limit(limit).all()
        
        results["drugs"] = [
            {
                "id": drug.id,
                "name": drug.name,
                "company": drug.company,
                "phase": drug.phase,
                "indication": drug.indication
            }
            for drug in drugs
        ]
    
    if category in ["trials", "all"]:
        trials = db.query(ClinicalTrial).filter(
            ClinicalTrial.title.ilike(f"%{q}%") |
            ClinicalTrial.condition.ilike(f"%{q}%") |
            ClinicalTrial.sponsor.ilike(f"%{q}%")
        ).limit(limit).all()
        
        results["trials"] = [
            {
                "id": trial.id,
                "nct_id": trial.nct_id,
                "title": trial.title,
                "sponsor": trial.sponsor,
                "phase": trial.phase
            }
            for trial in trials
        ]
    
    if category in ["companies", "all"]:
        companies = db.query(Company).filter(
            Company.name.ilike(f"%{q}%") |
            Company.ticker.ilike(f"%{q}%")
        ).limit(limit).all()
        
        results["companies"] = [
            {
                "id": company.id,
                "name": company.name,
                "ticker": company.ticker,
                "company_type": company.company_type
            }
            for company in companies
        ]
    
    return results
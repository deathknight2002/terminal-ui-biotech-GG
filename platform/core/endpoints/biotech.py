"""
Biotech Data Endpoints

API endpoints for drug pipeline, clinical trials, and pharmaceutical intelligence.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import datetime, timedelta
from statistics import mean

from ..database import get_db, Drug, ClinicalTrial, Company, Catalyst

router = APIRouter()


def _risk_from_probability(probability: Optional[float]) -> str:
    """Convert numerical probability into qualitative risk buckets."""
    if probability is None:
        return "Medium"
    if probability >= 0.75:
        return "Low"
    if probability >= 0.5:
        return "Medium"
    return "High"


def _category_from_event(event_type: Optional[str]) -> str:
    """Map catalyst event types to dashboard categories."""
    if not event_type:
        return "Corporate"

    event_type = event_type.lower()
    if "fda" in event_type or "regulatory" in event_type or "approval" in event_type:
        return "Regulatory"
    if "data" in event_type or "readout" in event_type:
        return "Clinical"
    if "commercial" in event_type or "sales" in event_type:
        return "Commercial"
    return "Corporate"


def _guess_region(headquarters: Optional[str]) -> str:
    """Infer a broad region from headquarters metadata."""
    if not headquarters:
        return "Global"

    location = headquarters.lower()
    if any(keyword in location for keyword in ["germany", "uk", "europe", "switzerland"]):
        return "EU"
    if any(keyword in location for keyword in ["china", "japan", "singapore", "asia"]):
        return "APAC"
    return "US"


def _phase_progress(count: int, max_count: int) -> float:
    """Normalize pipeline stage counts for progress view."""
    if max_count <= 0:
        return 0.0
    return round(min(1.0, count / max_count), 2)


def _phase_cost_estimate(phase: str) -> int:
    """Provide indicative cost allocations per phase (in USD)."""
    estimates = {
        "Preclinical": 60_000_000,
        "Phase I": 90_000_000,
        "Phase II": 150_000_000,
        "Phase III": 300_000_000,
        "Filed": 40_000_000,
        "Approved": 25_000_000,
    }
    return estimates.get(phase, 50_000_000)


@router.get("/dashboard")
async def get_dashboard(db: Session = Depends(get_db)):
    """Aggregate biotech dashboard data for the Aurora terminal."""
    now = datetime.utcnow()

    total_drugs = db.query(func.count(Drug.id)).scalar() or 0
    pipeline_rows = db.query(Drug.phase, func.count(Drug.id)).group_by(Drug.phase).all()
    pipeline_counts = {phase or "Unknown": count for phase, count in pipeline_rows}
    max_phase_count = max(pipeline_counts.values()) if pipeline_counts else 1
    late_stage_programs = sum(pipeline_counts.get(phase, 0) for phase in ["Phase III", "Filed", "Approved"])

    active_trials = (
        db.query(func.count(ClinicalTrial.id))
        .filter(
            ClinicalTrial.status.in_(
                ["Active", "Active, not recruiting", "Recruiting"]
            )
        )
        .scalar()
        or 0
    )

    upcoming_catalysts = (
        db.query(Catalyst)
        .filter(Catalyst.event_date.isnot(None))
        .filter(Catalyst.event_date >= now)
        .order_by(Catalyst.event_date.asc())
        .limit(8)
        .all()
    )
    probabilities = [c.probability for c in upcoming_catalysts if c.probability is not None]
    avg_probability = mean(probabilities) if probabilities else 0.55

    companies = (
        db.query(Company)
        .filter(Company.market_cap.isnot(None))
        .order_by(Company.market_cap.desc())
        .limit(4)
        .all()
    )
    total_market_cap = sum(company.market_cap or 0 for company in companies) or 1

    nav_base = 100 + (total_market_cap / 1_000_000_000) * 0.03
    nav_change_percent = round((avg_probability - 0.5) * 8, 2)
    nav_change = round(nav_base * nav_change_percent / 100, 2)

    catalysts_payload = [
        {
            "id": f"cat-{catalyst.id}",
            "label": catalyst.title,
            "date": catalyst.event_date.isoformat() if catalyst.event_date else None,
            "risk": _risk_from_probability(catalyst.probability),
            "description": catalyst.description,
            "expectedImpact": catalyst.impact.title() if catalyst.impact else None,
            "category": _category_from_event(catalyst.event_type),
            "url": None,
        }
        for catalyst in upcoming_catalysts
    ]

    risk_map = {
        "Big Pharma": "Low",
        "Biotech": "Medium",
        "SMid": "Medium",
        "China Pharma": "Medium",
        "Academic": "High",
    }
    positions = []
    for company in companies:
        market_cap = company.market_cap or 0
        weight = round((market_cap / total_market_cap) * 100, 2) if total_market_cap else 0
        pnl = round(((market_cap / total_market_cap) - 0.25) * 12, 2) if total_market_cap else 0.0
        matching_catalyst = next((c for c in upcoming_catalysts if c.company == company.name), None)

        positions.append(
            {
                "id": company.ticker,
                "ticker": company.ticker,
                "company": company.name,
                "weight": weight,
                "pnl": pnl,
                "risk": risk_map.get(company.company_type, "Medium"),
                "region": _guess_region(company.headquarters),
                "thesis": f"{company.name} late-stage assets driving NAV acceleration.",
                "catalystDate": (
                    matching_catalyst.event_date.isoformat()
                    if matching_catalyst and matching_catalyst.event_date
                    else None
                ),
            }
        )

    type_counts = db.query(Company.company_type, func.count(Company.id)).group_by(Company.company_type).all()
    total_companies = sum(count for _, count in type_counts) or 1
    exposures = [
        {
            "id": f"exp-{company_type.lower().replace(' ', '-')}",
            "label": company_type.upper(),
            "weight": round((count / total_companies) * 100, 2),
            "performance": round(((count / total_companies) - 0.25) * 6, 2),
        }
        for company_type, count in type_counts
    ]

    phase_order = ["Preclinical", "Phase I", "Phase II", "Phase III", "Filed", "Approved"]
    pipeline_stages = [
        {
            "name": phase,
            "progress": _phase_progress(pipeline_counts.get(phase, 0), max_phase_count),
            "startDate": (now - timedelta(days=90 * (len(phase_order) - index))).date().isoformat(),
            "endDate": (now + timedelta(days=45 * (index + 1))).date().isoformat(),
            "estimatedCost": _phase_cost_estimate(phase) * max(1, pipeline_counts.get(phase, 0)),
        }
        for index, phase in enumerate(phase_order)
    ]

    documents = [
        {
            "id": "doc-clinical-strategy",
            "title": "2025 Clinical Strategy Outlook",
            "date": now.date().isoformat(),
            "category": "Clinical",
            "relevanceScore": 0.94,
            "highlights": [
                "Phase III melanoma readout expected within 6 weeks.",
                "Regulatory engagement accelerating for mRNA oncology portfolio.",
            ],
        },
        {
            "id": "doc-market-dynamics",
            "title": "Oncology Market Dynamics Update",
            "date": (now - timedelta(days=12)).date().isoformat(),
            "category": "Financial",
            "relevanceScore": 0.89,
            "highlights": [
                "Late-stage oncology names outperform XBI by 320 bps YTD.",
                "Capital rotation into cell & gene therapy leaders continues.",
            ],
        },
        {
            "id": "doc-regulatory-tracker",
            "title": "Regulatory Catalysts Radar",
            "date": (now - timedelta(days=5)).date().isoformat(),
            "category": "Regulatory",
            "relevanceScore": 0.87,
            "highlights": [
                "Three PDUFA dates clustered in Q1 with high probability outcomes.",
                "FDA oncology division prioritizing expedited cell therapy reviews.",
            ],
        },
    ]

    analytics = {
        "pageViews": 1500 + total_drugs * 12,
        "uniqueUsers": 320 + late_stage_programs * 2,
        "searchQueries": [
            "late stage oncology pipeline",
            "mrna commercial performance",
            "biotech catalyst calendar",
        ],
        "popularContent": [company.name for company in companies] or ["Moderna Inc", "Pfizer Inc"],
        "userEngagement": {
            "avgSessionDuration": 480,
            "bounceRate": 0.18,
            "returnUsers": 72 + len(upcoming_catalysts),
        },
    }

    metrics = [
        {
            "id": "pipeline-depth",
            "label": "PIPELINE PROGRAMS",
            "value": total_drugs,
            "change": round(total_drugs * 0.12, 2) if total_drugs else 0.0,
            "trend": "up" if total_drugs else "neutral",
            "variant": "primary",
            "supportText": f"{late_stage_programs} late-stage assets",
        },
        {
            "id": "upcoming-catalysts",
            "label": "UPCOMING CATALYSTS",
            "value": len(upcoming_catalysts),
            "change": len(upcoming_catalysts),
            "trend": "up" if upcoming_catalysts else "neutral",
            "variant": "accent",
            "supportText": "Next 90 days",
        },
        {
            "id": "active-trials",
            "label": "ACTIVE TRIALS",
            "value": active_trials,
            "change": 1.2 if active_trials else 0.0,
            "trend": "up" if active_trials else "neutral",
            "variant": "secondary",
            "supportText": "Clinical execution",
        },
        {
            "id": "success-probability",
            "label": "AVG SUCCESS PROB.",
            "value": f"{round(avg_probability * 100, 1)}%",
            "trend": "up" if avg_probability >= 0.5 else "down",
            "variant": "primary",
            "supportText": "Weighted catalyst odds",
        },
    ]

    headline = {
        "fundName": "Aurora Biotech Opportunities",
        "strategy": "Late-Stage Clinical & Commercial Leaders",
        "status": "success",
        "lastUpdated": now.isoformat(),
        "nav": round(nav_base, 2),
        "navChange": nav_change,
        "navChangePercent": nav_change_percent,
    }

    return {
        "headline": headline,
        "metrics": metrics,
        "catalysts": catalysts_payload,
        "positions": positions,
        "exposures": exposures,
        "pipeline": pipeline_stages,
        "documents": documents,
        "analytics": analytics,
    }


@router.get("/pipeline")
async def get_pipeline(db: Session = Depends(get_db)):
    """Return portfolio pipeline metrics and catalysts."""
    total_programs = db.query(func.count(Drug.id)).scalar() or 0
    phase_counts = dict(db.query(Drug.phase, func.count(Drug.id)).group_by(Drug.phase).all())

    upcoming_catalysts = (
        db.query(Catalyst)
        .filter(Catalyst.event_date.isnot(None))
        .order_by(Catalyst.event_date.asc())
        .limit(6)
        .all()
    )
    expected_approvals = sum(
        1
        for catalyst in upcoming_catalysts
        if catalyst.event_type and "fda" in catalyst.event_type.lower()
    )

    total_investment = sum(
        _phase_cost_estimate(phase or "")
        for phase, count in phase_counts.items()
        for _ in range(count)
    )

    metrics = [
        {
            "id": "total-programs",
            "label": "TOTAL PROGRAMS",
            "value": str(total_programs),
            "change": round(total_programs * 0.08, 1) if total_programs else 0,
            "trend": "up" if total_programs else "neutral",
            "variant": "primary",
            "subtitle": "Active Development",
        },
        {
            "id": "phase-3",
            "label": "PHASE III",
            "value": str(phase_counts.get("Phase III", 0)),
            "change": 3.1 if phase_counts.get("Phase III") else 0,
            "trend": "up" if phase_counts.get("Phase III") else "neutral",
            "variant": "accent",
            "subtitle": "Late Stage",
        },
        {
            "id": "phase-2",
            "label": "PHASE II",
            "value": str(phase_counts.get("Phase II", 0)),
            "change": -1.6 if phase_counts.get("Phase II") else 0,
            "trend": "down" if phase_counts.get("Phase II") else "neutral",
            "variant": "secondary",
            "subtitle": "Mid Stage",
        },
        {
            "id": "phase-1",
            "label": "PHASE I",
            "value": str(phase_counts.get("Phase I", 0)),
            "change": 4.2 if phase_counts.get("Phase I") else 0,
            "trend": "up" if phase_counts.get("Phase I") else "neutral",
            "variant": "primary",
            "subtitle": "Early Stage",
        },
        {
            "id": "expected-approvals",
            "label": "EXPECTED APPROVALS",
            "value": str(expected_approvals),
            "change": expected_approvals * 1.4 if expected_approvals else 0,
            "trend": "up" if expected_approvals else "neutral",
            "variant": "accent",
            "subtitle": "Next 12 Months",
        },
        {
            "id": "total-investment",
            "label": "TOTAL INVESTMENT",
            "value": f"${round(total_investment / 1_000_000_000, 2)}B",
            "change": 6.7,
            "trend": "up",
            "variant": "secondary",
            "subtitle": "R&D Capital",
        },
    ]

    catalysts_payload = [
        {
            "id": f"pipe-{catalyst.id}",
            "label": catalyst.title,
            "date": catalyst.event_date.isoformat() if catalyst.event_date else None,
            "risk": _risk_from_probability(catalyst.probability),
            "expectedImpact": catalyst.impact.title() if catalyst.impact else None,
            "category": _category_from_event(catalyst.event_type),
            "description": catalyst.description,
        }
        for catalyst in upcoming_catalysts
    ]

    phase_distribution = [
        {"phase": phase or "Unknown", "count": count}
        for phase, count in sorted(phase_counts.items(), key=lambda item: item[0] or "")
    ]

    return {
        "metrics": metrics,
        "catalysts": catalysts_payload,
        "phaseDistribution": phase_distribution,
    }


@router.get("/financial-models")
async def get_financial_models(db: Session = Depends(get_db)):
    """Return sample financial modeling data derived from seeded entities."""
    drug = (
        db.query(Drug)
        .order_by(Drug.phase.desc())
        .first()
    )

    if not drug:
        raise HTTPException(status_code=404, detail="No drug data available")

    company = db.query(Company).filter(Company.name == drug.company).first()

    phase_progress_map = {
        "Preclinical": 0.2,
        "Phase I": 0.35,
        "Phase II": 0.55,
        "Phase III": 0.75,
        "Filed": 0.9,
        "Approved": 1.0,
    }

    stage_progress = phase_progress_map.get(drug.phase, 0.5)
    now = datetime.utcnow()

    stage = {
        "name": drug.phase or "Phase II",
        "progress": stage_progress,
        "startDate": (now - timedelta(days=210)).date().isoformat(),
        "endDate": (now + timedelta(days=180)).date().isoformat(),
        "estimatedCost": _phase_cost_estimate(drug.phase or ""),
    }

    market_cap = company.market_cap if company and company.market_cap else 5_000_000_000
    ticker = company.ticker if company and company.ticker else (drug.name[:4].upper() if drug.name else "PRIV")
    pricing_base = 2_750_000

    asset = {
        "id": drug.name or f"asset-{drug.id}",
        "name": drug.generic_name or drug.name,
        "symbol": ticker,
        "type": "biotech",
        "stage": stage,
        "indication": drug.indication or "Undisclosed indication",
        "modality": "mRNA" if "mRNA" in (drug.mechanism or "").lower() else "Biologic",
        "mechanism": drug.mechanism or "Not disclosed",
        "sponsor": drug.company or "Undisclosed",
        "targetMarket": drug.therapeutic_area or "Global",
        "riskProfile": "medium" if stage_progress < 0.9 else "low",
        "marketCap": market_cap,
        "lastUpdated": now.isoformat(),
        "pricing_us": pricing_base,
        "pricing_eur": round(pricing_base * 0.92),
        "pricing_row": round(pricing_base * 1.05),
    }

    catalysts = (
        db.query(Catalyst)
        .filter(Catalyst.company == drug.company)
        .order_by(Catalyst.event_date.asc())
        .limit(3)
        .all()
    )

    projection = {
        "assetId": asset["id"],
        "npv": round(market_cap * 0.18, 2),
        "irr": 0.27 if stage_progress < 1 else 0.18,
        "peakSales": round(market_cap * 0.06, 2),
        "timeToMarket": 2.5 if stage_progress < 1 else 0.5,
        "probability": 0.65 if stage_progress < 0.9 else 0.82,
        "scenario": "Base Case",
        "assumptions": {
            "discountRate": 0.12,
            "patentLife": 12,
            "marketPenetration": 0.32,
            "pricingPower": 0.8,
        },
        "milestones": [
            {
                "id": f"ms-{index}",
                "name": catalyst.title if catalyst.title else "Key Milestone",
                "date": catalyst.event_date.isoformat() if catalyst.event_date else (now + timedelta(days=120 * (index + 1))).date().isoformat(),
                "probability": catalyst.probability if catalyst.probability else 0.6,
                "value": round(_phase_cost_estimate(drug.phase or "") * 0.2),
                "type": catalyst.event_type or "development",
            }
            for index, catalyst in enumerate(catalysts)
        ] or [
            {
                "id": "ms-phase-complete",
                "name": f"{asset['stage']['name']} Completion",
                "date": (now + timedelta(days=240)).date().isoformat(),
                "probability": 0.7,
                "value": round(_phase_cost_estimate(drug.phase or "") * 0.25),
                "type": "development",
            }
        ],
        "royaltyTiers": [
            {"min": 0, "max": 750_000_000, "rate": 0.08},
            {"min": 750_000_000, "max": 1_500_000_000, "rate": 0.12},
            {"min": 1_500_000_000, "max": 5_000_000_000, "rate": 0.16},
        ],
        "patientProjections": [
            {"year": now.year + offset, "patients": int(450 + offset * 350), "revenue": int((450 + offset * 350) * pricing_base)}
            for offset in range(0, 6)
        ],
    }

    return {"asset": asset, "projection": projection}


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
    db: Session = Depends(get_db),
):
    """Get clinical trial data aligned with terminal UI expectations."""
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

    status_map = {
        "Active": "Active, not recruiting",
        "Active, not recruiting": "Active, not recruiting",
        "Recruiting": "Recruiting",
        "Completed": "Completed",
        "Suspended": "Suspended",
        "Terminated": "Terminated",
    }

    phase_map = {
        "Phase I": "Phase I",
        "Phase II": "Phase II",
        "Phase III": "Phase III",
        "Phase IV": "Phase IV",
        "Preclinical": "Preclinical",
        "Approved": "Phase IV",
    }

    trials_payload = []
    now = datetime.utcnow()

    for trial in trials:
        normalized_status = status_map.get(trial.status, "Recruiting")
        normalized_phase = phase_map.get(trial.phase, trial.phase or "Phase II")
        completion_date = trial.completion_date.isoformat() if trial.completion_date else (now + timedelta(days=365)).date().isoformat()
        updated_at = trial.start_date.isoformat() if trial.start_date else now.isoformat()

        trials_payload.append(
            {
                "id": trial.nct_id or f"trial-{trial.id}",
                "title": trial.title,
                "phase": normalized_phase,
                "status": normalized_status,
                "indication": trial.condition or "Undisclosed",
                "primaryCompletion": completion_date,
                "estimatedEnrollment": trial.enrollment or 0,
                "sponsors": [trial.sponsor] if trial.sponsor else ["Multiple Sponsors"],
                "locations": ["Global"],
                "lastUpdated": updated_at,
            }
        )

    return {
        "trials": trials_payload,
        "data": trials_payload,
        "count": len(trials_payload),
    }


@router.get("/trials")
async def get_trials(
    phase: Optional[str] = Query(None, description="Filter by trial phase"),
    status: Optional[str] = Query(None, description="Filter by trial status"),
    condition: Optional[str] = Query(None, description="Filter by medical condition"),
    sponsor: Optional[str] = Query(None, description="Filter by sponsor"),
    limit: int = Query(100, le=1000),
    db: Session = Depends(get_db),
):
    """Legacy alias for clinical trials endpoint."""
    return await get_clinical_trials(
        phase=phase,
        status=status,
        condition=condition,
        sponsor=sponsor,
        limit=limit,
        db=db,
    )


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
    now = datetime.utcnow()
    future_date = now + timedelta(days=upcoming_days)
    query = query.filter(Catalyst.event_date <= future_date)
    query = query.filter(Catalyst.event_date >= now)
    
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
                "days_until": (catalyst.event_date - now).days if catalyst.event_date else None
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

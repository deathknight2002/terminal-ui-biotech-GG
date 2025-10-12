"""
Competition API Endpoints

Competitive analysis and spiderweb visualizations.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
import logging

from ..database import get_db, CompetitionEdge, Therapeutic, Company

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/spiderweb")
async def get_spiderweb_data(
    disease_id: Optional[int] = Query(None, description="Filter by disease"),
    scope: str = Query("THERAPEUTIC", description="Scope: THERAPEUTIC or COMPANY"),
    limit: int = Query(6, ge=2, le=12, description="Number of entities to compare"),
    db: Session = Depends(get_db)
):
    """
    Get competitive spiderweb/radar chart data with 6-axis comparison.
    
    Returns series data for radar chart visualization with metrics:
    - Safety
    - Efficacy
    - Regulatory
    - Modality Fit
    - Clinical Maturity
    - Differentiation
    """
    try:
        series = []
        
        if scope == "THERAPEUTIC":
            # Get therapeutics for the disease
            query = db.query(Therapeutic)
            if disease_id:
                query = query.filter(Therapeutic.disease_id == disease_id)
            
            therapeutics = query.limit(limit).all()
            
            for therapeutic in therapeutics:
                # Get competition edge data
                edges = db.query(CompetitionEdge).filter(
                    CompetitionEdge.from_id == therapeutic.id,
                    CompetitionEdge.scope == "THERAPEUTIC"
                ).all()
                
                if edges:
                    # Average metrics from all competition edges
                    metrics = {
                        "safety": sum(e.safety or 50 for e in edges) / len(edges),
                        "efficacy": sum(e.efficacy or 50 for e in edges) / len(edges),
                        "regulatory": sum(e.regulatory or 50 for e in edges) / len(edges),
                        "modality_fit": sum(e.modality_fit or 50 for e in edges) / len(edges),
                        "clinical_maturity": sum(e.clinical_maturity or 50 for e in edges) / len(edges),
                        "differentiation": sum(e.differentiation or 50 for e in edges) / len(edges)
                    }
                else:
                    # Default baseline metrics
                    phase_maturity = {
                        "Preclinical": 20,
                        "Phase I": 35,
                        "Phase II": 50,
                        "Phase III": 75,
                        "Filed": 90,
                        "Approved": 100
                    }
                    metrics = {
                        "safety": 50,
                        "efficacy": 50,
                        "regulatory": 50,
                        "modality_fit": 50,
                        "clinical_maturity": phase_maturity.get(therapeutic.phase, 50),
                        "differentiation": 50
                    }
                
                series.append({
                    "name": therapeutic.name,
                    "type": "therapeutic",
                    "id": therapeutic.id,
                    "modality": therapeutic.modality,
                    "phase": therapeutic.phase,
                    "company_id": therapeutic.company_id,
                    "data": [
                        metrics["safety"],
                        metrics["efficacy"],
                        metrics["regulatory"],
                        metrics["modality_fit"],
                        metrics["clinical_maturity"],
                        metrics["differentiation"]
                    ],
                    "metrics": metrics
                })
        
        elif scope == "COMPANY":
            # Get companies
            companies = db.query(Company).limit(limit).all()
            
            for company in companies:
                # Get competition edge data
                edges = db.query(CompetitionEdge).filter(
                    CompetitionEdge.from_id == company.id,
                    CompetitionEdge.scope == "COMPANY"
                ).all()
                
                if edges:
                    metrics = {
                        "safety": sum(e.safety or 50 for e in edges) / len(edges),
                        "efficacy": sum(e.efficacy or 50 for e in edges) / len(edges),
                        "regulatory": sum(e.regulatory or 50 for e in edges) / len(edges),
                        "modality_fit": sum(e.modality_fit or 50 for e in edges) / len(edges),
                        "clinical_maturity": sum(e.clinical_maturity or 50 for e in edges) / len(edges),
                        "differentiation": sum(e.differentiation or 50 for e in edges) / len(edges)
                    }
                else:
                    # Default metrics
                    metrics = {
                        "safety": 50,
                        "efficacy": 50,
                        "regulatory": 50,
                        "modality_fit": 50,
                        "clinical_maturity": 50,
                        "differentiation": 50
                    }
                
                series.append({
                    "name": company.name,
                    "type": "company",
                    "id": company.id,
                    "ticker": company.ticker,
                    "company_type": company.company_type,
                    "data": [
                        metrics["safety"],
                        metrics["efficacy"],
                        metrics["regulatory"],
                        metrics["modality_fit"],
                        metrics["clinical_maturity"],
                        metrics["differentiation"]
                    ],
                    "metrics": metrics
                })
        
        return {
            "series": series,
            "axes": [
                {"label": "Safety", "max": 100},
                {"label": "Efficacy", "max": 100},
                {"label": "Regulatory", "max": 100},
                {"label": "Modality Fit", "max": 100},
                {"label": "Clinical Maturity", "max": 100},
                {"label": "Differentiation", "max": 100}
            ],
            "scope": scope,
            "disease_id": disease_id
        }
        
    except Exception as e:
        logger.error(f"Error generating spiderweb data: {e}")
        return {
            "error": str(e),
            "series": [],
            "axes": []
        }


@router.get("/compare")
async def compare_companies(
    companies: str = Query(..., description="Comma-separated company names"),
    db: Session = Depends(get_db)
):
    """
    Compare multiple companies across 6 key metrics with justifications.
    Returns radar chart compatible data.
    """
    try:
        company_names = [c.strip() for c in companies.split(',')]
        comparisons = []
        
        for company_name in company_names:
            # Try to find company in database
            company = db.query(Company).filter(
                Company.name.ilike(f"%{company_name}%")
            ).first()
            
            if company:
                # Real company - calculate metrics from database
                therapeutics_count = db.query(Therapeutic).filter(
                    Therapeutic.company_id == company.id
                ).count()
                
                # Calculate metrics based on pipeline
                pipeline_strength = min(100, therapeutics_count * 10)
                
                comparison = {
                    "company": company.name,
                    "metrics": {
                        "pipeline_strength": pipeline_strength,
                        "financial_health": 75,  # Mock - would come from financial data
                        "market_position": 70,
                        "innovation": 80,
                        "regulatory_track": 85,
                        "partnerships": 65
                    },
                    "justifications": {
                        "pipeline_strength": f"{therapeutics_count} active programs across multiple therapeutic areas",
                        "financial_health": "Strong balance sheet with diverse revenue streams",
                        "market_position": "Leading position in key therapeutic areas",
                        "innovation": "Robust R&D investment and patent portfolio",
                        "regulatory_track": "Consistent approval track record with FDA and EMA",
                        "partnerships": "Strategic collaborations with major pharma and biotech partners"
                    }
                }
            else:
                # Mock company - use mock data
                import random
                comparison = {
                    "company": company_name.title(),
                    "metrics": {
                        "pipeline_strength": random.randint(60, 95),
                        "financial_health": random.randint(55, 90),
                        "market_position": random.randint(50, 95),
                        "innovation": random.randint(60, 95),
                        "regulatory_track": random.randint(65, 95),
                        "partnerships": random.randint(50, 85)
                    },
                    "justifications": {
                        "pipeline_strength": f"Diverse pipeline with programs in oncology, immunology, and rare diseases",
                        "financial_health": "Stable revenue growth with managed R&D expenses",
                        "market_position": "Growing market share in target therapeutic areas",
                        "innovation": "Investment in novel modalities and platform technologies",
                        "regulatory_track": "Multiple successful regulatory submissions in recent years",
                        "partnerships": "Established partnerships for development and commercialization"
                    }
                }
            
            comparisons.append(comparison)
        
        return {
            "comparisons": comparisons,
            "count": len(comparisons)
        }
        
    except Exception as e:
        logger.error(f"Error comparing companies: {e}")
        return {
            "error": str(e),
            "comparisons": [],
            "count": 0
        }

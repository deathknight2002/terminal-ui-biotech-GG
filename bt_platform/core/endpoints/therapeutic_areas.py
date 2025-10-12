"""
Therapeutic Area Intelligence Endpoints

API endpoints for therapeutic area comparisons, science attributes,
and spider web/radar chart visualizations.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict, List, Optional
from datetime import datetime

from ..database import get_db, Company, Drug

router = APIRouter()


# Attribute labels for radar chart
ATTRS = [
    "Unmet Need",
    "Market Size",
    "Regulatory Support",
    "Scientific Validation",
    "Competitive Intensity",
    "Reimbursement Potential",
    "Patient Advocacy",
]


class AreaScores(BaseModel):
    """Therapeutic area scores model"""
    area: str
    scores: Dict[str, float]
    rationale: Optional[str] = None
    sources: List[str] = []


# Therapeutic area attribute definitions database
DB: Dict[str, AreaScores] = {
    "DMD": AreaScores(
        area="DMD",
        scores={
            "Unmet Need": 9.5,
            "Market Size": 7.8,
            "Regulatory Support": 8.5,
            "Scientific Validation": 8.2,
            "Competitive Intensity": 7.5,
            "Reimbursement Potential": 8.0,
            "Patient Advocacy": 9.0,
        },
        rationale="Ultra-rare, progressive; strong advocacy and accelerating gene/modulator modalities.",
        sources=["FDA/EMA labels, CT.gov, patient orgs"]
    ),
    "Cardiology": AreaScores(
        area="Cardiology",
        scores={
            "Unmet Need": 8.5,
            "Market Size": 9.5,
            "Regulatory Support": 7.5,
            "Scientific Validation": 9.0,
            "Competitive Intensity": 9.0,
            "Reimbursement Potential": 8.5,
            "Patient Advocacy": 7.0,
        },
        rationale="Gigantic market with entrenched SOC; heavy competition; very mature evidence base.",
        sources=["Guidelines (ACC/AHA/ESC), outcomes trials, payer policies"]
    ),
    "IBD": AreaScores(
        area="IBD",
        scores={
            "Unmet Need": 8.8,
            "Market Size": 8.7,
            "Regulatory Support": 7.8,
            "Scientific Validation": 8.6,
            "Competitive Intensity": 8.9,
            "Reimbursement Potential": 8.2,
            "Patient Advocacy": 7.5
        }
    ),
    "Oncology": AreaScores(
        area="Oncology",
        scores={
            "Unmet Need": 9.2,
            "Market Size": 9.3,
            "Regulatory Support": 8.6,
            "Scientific Validation": 8.9,
            "Competitive Intensity": 9.5,
            "Reimbursement Potential": 8.7,
            "Patient Advocacy": 8.0
        }
    ),
    "Rare Disease": AreaScores(
        area="Rare Disease",
        scores={
            "Unmet Need": 9.4,
            "Market Size": 7.2,
            "Regulatory Support": 9.0,
            "Scientific Validation": 7.8,
            "Competitive Intensity": 6.8,
            "Reimbursement Potential": 8.6,
            "Patient Advocacy": 8.8
        }
    ),
}


@router.get("/areas", response_model=List[AreaScores])
def list_areas():
    """List all therapeutic areas with their science attributes."""
    return list(DB.values())


@router.get("/areas/{area}", response_model=AreaScores)
def get_area(area: str):
    """Get detailed information about a specific therapeutic area."""
    key = area.strip()
    if key not in DB:
        raise HTTPException(status_code=404, detail="Unknown therapeutic area")
    return DB[key]


@router.get("/areas/compare/radar")
def compare_radar(areas: List[str] = Query(..., alias="areas")):
    """
    Get therapeutic area comparison data formatted for radar/spider chart.
    
    Example: /areas/compare/radar?areas=DMD&areas=Cardiology
    
    Returns radar chart data with Aurora color mapping.
    """
    missing = [a for a in areas if a not in DB]
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown areas: {', '.join(missing)}"
        )
    
    return {
        "attributes": ATTRS,
        "series": [
            {
                "id": a,
                "name": a,
                "values": [DB[a].scores[k] for k in ATTRS]
            }
            for a in areas
        ],
        "palette": "aurora"
    }


# Legacy endpoint for backward compatibility
@router.get("/areas/{area_id}/companies")
async def get_area_companies(
    area_id: str,
    db: Session = Depends(get_db)
) -> dict:
    """
    Get all companies operating in a therapeutic area with their market metrics.
    
    Note: This endpoint is kept for backward compatibility.
    New implementations should use data/companies.yaml for company data.
    """
    area_id_upper = area_id.upper()
    
    if area_id_upper not in DB:
        raise HTTPException(
            status_code=404,
            detail=f"Therapeutic area '{area_id}' not found"
        )
    
    # Return empty list as this is now handled by YAML files
    return {
        "therapeutic_area": area_id_upper,
        "company_count": 0,
        "companies": [],
        "note": "Company data is now managed via data/companies.yaml"
    }

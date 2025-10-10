"""
Therapeutic Area Intelligence Endpoints

API endpoints for therapeutic area comparisons, science attributes,
and spider web/radar chart visualizations.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ..database import get_db, Company, Drug

router = APIRouter()


# Therapeutic area attribute definitions for spider web visualization
THERAPEUTIC_AREA_ATTRIBUTES = {
    "DMD": {
        "name": "Duchenne Muscular Dystrophy",
        "unmet_need": 9.5,  # 1-10 scale
        "market_size": 7.8,
        "regulatory_support": 8.5,
        "scientific_validation": 8.2,
        "competitive_intensity": 7.5,
        "reimbursement_potential": 8.0,
        "patient_advocacy": 9.0,
        "description": "Ultra-rare X-linked disorder with high mortality; FDA has shown regulatory flexibility with accelerated pathways",
        "companies": ["SRPT", "BMRN", "EWTX", "INSM", "JAZZ", "KROS", "PEPG", "PFE", "QURE", "RGNX", "RNA", "SLDB", "WVE"],
        "key_mechanisms": ["Exon skipping", "Gene therapy", "Myosin inhibition", "Anti-inflammatory"],
        "prevalence": "1 in 3,500-5,000 male births",
        "peak_sales_potential": "5-8B globally"
    },
    "Cardiology": {
        "name": "Cardiovascular Disease",
        "unmet_need": 8.5,
        "market_size": 9.5,
        "regulatory_support": 7.5,
        "scientific_validation": 9.0,
        "competitive_intensity": 9.0,
        "reimbursement_potential": 8.5,
        "patient_advocacy": 7.0,
        "description": "Large market with significant unmet need in heart failure, cardiomyopathy, and lipid disorders; strong scientific validation",
        "companies": ["AMGN", "ARWR", "AZN", "BMY", "CYTK", "EWTX", "IONS", "LLY", "LXRX", "MRK", "NAMS", "TENX", "TRMX"],
        "key_mechanisms": ["Myosin inhibition", "RNAi therapeutics", "GLP-1 agonists", "Gene therapy", "Antisense oligos"],
        "prevalence": "47% of US adults have some form of CVD",
        "peak_sales_potential": "20B+ for blockbuster therapies"
    },
    "IBD": {
        "name": "Inflammatory Bowel Disease",
        "unmet_need": 8.0,
        "market_size": 8.5,
        "regulatory_support": 7.8,
        "scientific_validation": 8.5,
        "competitive_intensity": 8.5,
        "reimbursement_potential": 7.5,
        "patient_advocacy": 8.0,
        "description": "Chronic inflammatory conditions (Crohn's, UC) with significant unmet need despite multiple therapies; IL-23 pathway validated",
        "companies": ["ABBV", "JNJ", "GILD", "BMY", "AMGN", "PFE"],
        "key_mechanisms": ["IL-23 inhibition", "S1P modulators", "JAK inhibitors", "Anti-integrin"],
        "prevalence": "3.1M US adults (1.3% of US population)",
        "peak_sales_potential": "10-15B for best-in-class therapy"
    },
    "Oncology": {
        "name": "Oncology",
        "unmet_need": 9.0,
        "market_size": 10.0,
        "regulatory_support": 8.5,
        "scientific_validation": 9.5,
        "competitive_intensity": 9.5,
        "reimbursement_potential": 9.0,
        "patient_advocacy": 9.5,
        "description": "Largest therapeutic area by revenue; immuno-oncology revolution ongoing; high willingness to pay",
        "companies": ["MRK", "BMY", "ROCHE", "PFE", "AZN", "NOVN", "GILD", "AMGN"],
        "key_mechanisms": ["Immune checkpoint inhibitors", "ADCs", "CAR-T", "Bispecific antibodies", "Targeted kinase inhibitors"],
        "prevalence": "1.9M new cancer diagnoses annually in US",
        "peak_sales_potential": "50B+ for pan-tumor therapies"
    },
    "Rare_Disease": {
        "name": "Rare Disease (General)",
        "unmet_need": 9.2,
        "market_size": 6.5,
        "regulatory_support": 9.0,
        "scientific_validation": 7.8,
        "competitive_intensity": 6.0,
        "reimbursement_potential": 8.5,
        "patient_advocacy": 9.0,
        "description": "Orphan drug incentives; smaller markets but high pricing power; regulatory tailwinds",
        "companies": ["SRPT", "BMRN", "ALNY", "IONS", "QURE", "RGNX", "JAZZ"],
        "key_mechanisms": ["Gene therapy", "Enzyme replacement", "RNAi", "Antisense", "Small molecules"],
        "prevalence": "400M people worldwide with rare diseases",
        "peak_sales_potential": "1-5B per indication"
    }
}


@router.get("/areas")
async def list_therapeutic_areas() -> dict:
    """
    List all therapeutic areas with their science attributes.
    
    Returns data suitable for spider/radar chart visualization.
    """
    areas = []
    
    for area_key, area_data in THERAPEUTIC_AREA_ATTRIBUTES.items():
        areas.append({
            "id": area_key,
            "name": area_data["name"],
            "attributes": {
                "unmet_need": area_data["unmet_need"],
                "market_size": area_data["market_size"],
                "regulatory_support": area_data["regulatory_support"],
                "scientific_validation": area_data["scientific_validation"],
                "competitive_intensity": area_data["competitive_intensity"],
                "reimbursement_potential": area_data["reimbursement_potential"],
                "patient_advocacy": area_data["patient_advocacy"]
            },
            "metadata": {
                "description": area_data["description"],
                "prevalence": area_data["prevalence"],
                "peak_sales_potential": area_data["peak_sales_potential"],
                "key_mechanisms": area_data["key_mechanisms"]
            },
            "companies": area_data["companies"]
        })
    
    return {
        "areas": areas,
        "attribute_labels": [
            "Unmet Need",
            "Market Size",
            "Regulatory Support",
            "Scientific Validation",
            "Competitive Intensity",
            "Reimbursement Potential",
            "Patient Advocacy"
        ],
        "scale": {
            "min": 0,
            "max": 10,
            "description": "All attributes scored 0-10 where 10 is most favorable"
        }
    }


@router.get("/areas/{area_id}")
async def get_therapeutic_area(
    area_id: str,
    db: Session = Depends(get_db)
) -> dict:
    """
    Get detailed information about a specific therapeutic area.
    
    Includes:
    - Science attributes
    - Companies operating in the space
    - Pipeline assets
    - Recent catalysts
    """
    area_id_upper = area_id.upper()
    
    if area_id_upper not in THERAPEUTIC_AREA_ATTRIBUTES:
        raise HTTPException(status_code=404, detail=f"Therapeutic area '{area_id}' not found")
    
    area_data = THERAPEUTIC_AREA_ATTRIBUTES[area_id_upper]
    
    # Get companies in this therapeutic area
    company_tickers = area_data["companies"]
    companies = db.query(Company).filter(Company.ticker.in_(company_tickers)).all()
    
    # Get drugs in this therapeutic area
    # For DMD and Cardiology, match by indication or therapeutic_area field
    if area_id_upper == "DMD":
        drugs = db.query(Drug).filter(
            Drug.indication.ilike("%duchenne%") | 
            Drug.indication.ilike("%DMD%")
        ).all()
    elif area_id_upper == "CARDIOLOGY":
        drugs = db.query(Drug).filter(
            Drug.therapeutic_area.ilike("%cardio%") |
            Drug.indication.ilike("%heart%") |
            Drug.indication.ilike("%cardio%")
        ).all()
    else:
        # Generic search by therapeutic area
        drugs = db.query(Drug).filter(
            Drug.therapeutic_area.ilike(f"%{area_data['name']}%")
        ).all()
    
    return {
        "id": area_id_upper,
        "name": area_data["name"],
        "attributes": {
            "unmet_need": area_data["unmet_need"],
            "market_size": area_data["market_size"],
            "regulatory_support": area_data["regulatory_support"],
            "scientific_validation": area_data["scientific_validation"],
            "competitive_intensity": area_data["competitive_intensity"],
            "reimbursement_potential": area_data["reimbursement_potential"],
            "patient_advocacy": area_data["patient_advocacy"]
        },
        "metadata": {
            "description": area_data["description"],
            "prevalence": area_data["prevalence"],
            "peak_sales_potential": area_data["peak_sales_potential"],
            "key_mechanisms": area_data["key_mechanisms"]
        },
        "companies": [
            {
                "ticker": c.ticker,
                "name": c.name,
                "company_type": c.company_type,
                "market_cap": c.market_cap,
                "pipeline_count": c.pipeline_count
            }
            for c in companies
        ],
        "pipeline": [
            {
                "name": d.name,
                "generic_name": d.generic_name,
                "company": d.company,
                "indication": d.indication,
                "phase": d.phase,
                "mechanism": d.mechanism
            }
            for d in drugs
        ],
        "pipeline_count": len(drugs),
        "company_count": len(companies)
    }


@router.get("/areas/compare/radar")
async def get_radar_comparison(
    areas: Optional[str] = Query(None, description="Comma-separated area IDs to compare (default: all)")
) -> dict:
    """
    Get therapeutic area comparison data formatted for radar/spider chart.
    
    Example: /areas/compare/radar?areas=DMD,Cardiology,IBD
    
    Returns:
    - Radar chart configuration
    - Data series for each therapeutic area
    - Aurora gradient color mapping
    """
    # Parse area filter
    if areas:
        area_ids = [a.strip().upper() for a in areas.split(",")]
        area_ids = [a for a in area_ids if a in THERAPEUTIC_AREA_ATTRIBUTES]
    else:
        area_ids = list(THERAPEUTIC_AREA_ATTRIBUTES.keys())
    
    if not area_ids:
        raise HTTPException(status_code=400, detail="No valid therapeutic areas specified")
    
    # Build radar chart data
    attribute_keys = [
        "unmet_need",
        "market_size", 
        "regulatory_support",
        "scientific_validation",
        "competitive_intensity",
        "reimbursement_potential",
        "patient_advocacy"
    ]
    
    attribute_labels = [
        "Unmet Need",
        "Market Size",
        "Regulatory Support",
        "Scientific Validation",
        "Competitive Intensity",
        "Reimbursement Potential",
        "Patient Advocacy"
    ]
    
    # Aurora color palette (cyan, amber, green, purple, blue)
    colors = {
        "DMD": "#00d4ff",  # cyan
        "CARDIOLOGY": "#fbbf24",  # amber
        "IBD": "#10b981",  # green
        "ONCOLOGY": "#a855f7",  # purple
        "RARE_DISEASE": "#3b82f6"  # blue
    }
    
    series = []
    for area_id in area_ids:
        area_data = THERAPEUTIC_AREA_ATTRIBUTES[area_id]
        
        values = [area_data[attr] for attr in attribute_keys]
        
        series.append({
            "id": area_id,
            "name": area_data["name"],
            "values": values,
            "color": colors.get(area_id, "#94a3b8"),  # fallback to slate
            "description": area_data["description"]
        })
    
    return {
        "chart_type": "radar",
        "attributes": attribute_labels,
        "series": series,
        "scale": {
            "min": 0,
            "max": 10
        },
        "theme": "aurora",
        "interactivity": {
            "hover": True,
            "toggle_series": True,
            "color_by_value": True
        }
    }


@router.get("/areas/{area_id}/companies")
async def get_area_companies(
    area_id: str,
    db: Session = Depends(get_db)
) -> dict:
    """
    Get all companies operating in a therapeutic area with their market metrics.
    """
    area_id_upper = area_id.upper()
    
    if area_id_upper not in THERAPEUTIC_AREA_ATTRIBUTES:
        raise HTTPException(status_code=404, detail=f"Therapeutic area '{area_id}' not found")
    
    area_data = THERAPEUTIC_AREA_ATTRIBUTES[area_id_upper]
    company_tickers = area_data["companies"]
    
    companies = db.query(Company).filter(Company.ticker.in_(company_tickers)).all()
    
    return {
        "therapeutic_area": area_data["name"],
        "company_count": len(companies),
        "companies": [
            {
                "ticker": c.ticker,
                "name": c.name,
                "company_type": c.company_type,
                "market_cap": c.market_cap,
                "headquarters": c.headquarters,
                "pipeline_count": c.pipeline_count,
                "therapeutic_areas": c.therapeutic_areas
            }
            for c in companies
        ]
    }

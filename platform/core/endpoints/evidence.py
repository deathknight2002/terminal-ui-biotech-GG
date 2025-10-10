"""
Evidence Journal Endpoints

API endpoints for science-first biotech intelligence:
- Today's evidence updates
- Catalyst timeline
- MoA (Mechanism of Action) explorer
- Company scorecard
- Journal entries
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional, List
from ..database import get_db

router = APIRouter()


@router.get("/today")
async def get_todays_evidence(db: Session = Depends(get_db)):
    """
    Get today's evidence updates: trial events, label changes, AdComm updates, 8-K filings.
    
    Returns diff view of new developments since last refresh.
    """
    # Mock data for demonstration
    # In production, this would query:
    # - ClinicalTrials.gov API v2 for trial status changes
    # - FDA openFDA for label updates
    # - FDA AdComm calendar for meeting changes
    # - SEC EDGAR for 8-K filings mentioning clinical endpoints
    
    return {
        "last_refresh": datetime.utcnow().isoformat(),
        "new_trial_events": [
            {
                "nct_id": "NCT12345678",
                "event": "Status changed to Recruiting",
                "date": datetime.utcnow().isoformat(),
                "drug": "Drug A",
                "indication": "DMD",
                "source": "ClinicalTrials.gov",
                "source_url": "https://clinicaltrials.gov/study/NCT12345678"
            },
            {
                "nct_id": "NCT87654321",
                "event": "Primary completion date set: Q2 2026",
                "date": datetime.utcnow().isoformat(),
                "drug": "Drug B",
                "indication": "IBD",
                "source": "ClinicalTrials.gov",
                "source_url": "https://clinicaltrials.gov/study/NCT87654321"
            }
        ],
        "label_guidance_changes": [
            {
                "drug": "Heart Failure Guidance",
                "change": "FDA 2019 HF draft guidance: Functional capacity now approvable endpoint",
                "source_url": "https://www.fda.gov/regulatory-information/search-fda-guidance-documents",
                "date": datetime.utcnow().isoformat(),
                "impact": "High"
            }
        ],
        "adcomm_docket_changes": [
            {
                "drug": "Drug C",
                "meeting_date": "2026-04-15",
                "source_url": "https://www.fda.gov/advisory-committees",
                "change": "AdComm date confirmed",
                "committee": "CDER Advisory Committee"
            }
        ],
        "new_8k_filings": [
            {
                "company": "Company X",
                "ticker": "XYZ",
                "filing_type": "8-K",
                "mentions_endpoints": True,
                "filing_url": "https://www.sec.gov/cgi-bin/browse-edgar",
                "date": datetime.utcnow().isoformat(),
                "summary": "Phase III readout mentioned"
            }
        ]
    }


@router.get("/catalysts")
async def get_catalyst_timeline(
    days: int = Query(90, ge=30, le=180, description="Number of days to look ahead"),
    db: Session = Depends(get_db)
):
    """
    Get catalyst timeline for next 90-180 days.
    
    Events include: PDUFA dates, AdComm meetings, trial readouts, CHMP opinions.
    Color-coded by confidence level.
    """
    # Mock data for demonstration
    # In production, this would aggregate:
    # - FDA PDUFA dates from Drugs@FDA
    # - AdComm meetings from FDA calendar
    # - Trial readout windows from ClinicalTrials.gov + company 8-Ks
    # - EMA CHMP opinions from EMA website
    
    end_date = datetime.utcnow() + timedelta(days=days)
    
    return {
        "timeline_start": datetime.utcnow().isoformat(),
        "timeline_end": end_date.isoformat(),
        "catalysts": [
            {
                "id": "cat-001",
                "type": "AdComm",
                "date": "2026-04-15",
                "drug_name": "Drug A",
                "company": "Company X",
                "indication": "DMD",
                "confidence": "High",
                "source_urls": ["https://www.fda.gov/advisory-committees"],
                "status": "Upcoming",
                "impact_score": 85,
                "description": "FDA Advisory Committee meeting for orphan drug designation"
            },
            {
                "id": "cat-002",
                "type": "PDUFA",
                "date": "2026-05-20",
                "drug_name": "Drug B",
                "company": "Company Y",
                "indication": "IBD",
                "confidence": "High",
                "source_urls": ["https://www.accessdata.fda.gov/scripts/cder/daf/"],
                "status": "Upcoming",
                "impact_score": 92,
                "description": "PDUFA action date for IL-23 inhibitor"
            },
            {
                "id": "cat-003",
                "type": "Readout",
                "date": "2026-06-15",
                "readout_window": {"start": "2026-06-15", "end": "2026-07-15"},
                "drug_name": "Drug C",
                "company": "Company Z",
                "indication": "Cardiology (HFpEF)",
                "confidence": "Medium",
                "source_urls": [
                    "https://clinicaltrials.gov/study/NCT11223344",
                    "https://www.sec.gov/cgi-bin/browse-edgar"
                ],
                "status": "Upcoming",
                "impact_score": 78,
                "description": "Phase III readout for Factor XI inhibitor"
            }
        ]
    }


@router.get("/moa/{target}")
async def get_moa_data(
    target: str,
    db: Session = Depends(get_db)
):
    """
    Get MoA (Mechanism of Action) differentiation data for a specific target.
    
    Returns:
    - Genetic evidence (Open Targets score)
    - Bench potency (ChEMBL IC50 data)
    - Biomarker linkage
    - Competitor heatmap
    - Differentiation score
    """
    # Mock data for demonstration
    # In production, this would query:
    # - Open Targets GraphQL API for genetic associations
    # - ChEMBL API for IC50/Ki data
    # - Internal database for competitor mapping
    
    # Pre-defined targets from problem statement
    target_data = {
        "IL-23": {
            "target": "IL-23",
            "genetic_evidence": {
                "source": "Open Targets",
                "score": 0.85,
                "associations": [
                    {"disease": "Crohn's Disease", "score": 0.87},
                    {"disease": "Ulcerative Colitis", "score": 0.83}
                ]
            },
            "bench_potency": {
                "source": "ChEMBL",
                "ic50": "8 nM",
                "selectivity": "High (>100x vs IL-12)"
            },
            "biomarker_linkage": "Fecal calprotectin reduction correlates with endoscopic healing",
            "competitor_heatmap": [
                {"drug": "Drug A", "company": "Company X", "phase": "Phase III", "target": "IL-23"},
                {"drug": "Drug B", "company": "Company Y", "phase": "Phase II", "target": "IL-23"},
                {"drug": "Drug C", "company": "Company Z", "phase": "Filed", "target": "IL-23"}
            ],
            "differentiation_score": 78
        },
        "TL1A": {
            "target": "TL1A/DR3",
            "genetic_evidence": {
                "source": "Open Targets",
                "score": 0.72,
                "associations": [
                    {"disease": "IBD (combined)", "score": 0.74}
                ]
            },
            "bench_potency": {
                "source": "ChEMBL",
                "ic50": "15 nM",
                "selectivity": "Moderate"
            },
            "biomarker_linkage": "Novel pathway, limited clinical biomarker data",
            "competitor_heatmap": [
                {"drug": "Drug D", "company": "Company A", "phase": "Phase II", "target": "TL1A/DR3"},
                {"drug": "Drug E", "company": "Company B", "phase": "Preclinical", "target": "TL1A/DR3"}
            ],
            "differentiation_score": 82
        },
        "Factor XI": {
            "target": "Factor XI",
            "genetic_evidence": {
                "source": "Open Targets",
                "score": 0.91,
                "associations": [
                    {"disease": "Thrombosis", "score": 0.93},
                    {"disease": "Cardiovascular Disease", "score": 0.89}
                ]
            },
            "bench_potency": {
                "source": "ChEMBL",
                "ic50": "< 5 nM (Ki)",
                "selectivity": "Very high"
            },
            "biomarker_linkage": "FXI activity levels, D-dimer reduction",
            "competitor_heatmap": [
                {"drug": "Drug F", "company": "Company C", "phase": "Phase III", "target": "Factor XI"},
                {"drug": "Drug G", "company": "Company D", "phase": "Phase II", "target": "Factor XI"}
            ],
            "differentiation_score": 88
        }
    }
    
    target_key = target.upper().replace("/", "")
    if "TL1A" in target_key:
        target_key = "TL1A"
    elif "FACTOR" in target_key or "FXI" in target_key:
        target_key = "Factor XI"
    elif "IL-23" in target_key or "IL23" in target_key:
        target_key = "IL-23"
    
    if target_key in target_data:
        return target_data[target_key]
    
    # Default response for unknown targets
    return {
        "target": target,
        "genetic_evidence": {
            "source": "Open Targets",
            "score": 0.5,
            "associations": []
        },
        "bench_potency": {
            "source": "ChEMBL",
            "ic50": "Data not available",
            "selectivity": "Unknown"
        },
        "biomarker_linkage": "No data available",
        "competitor_heatmap": [],
        "differentiation_score": 50
    }


@router.get("/scorecard/{company}")
async def get_company_scorecard(
    company: str,
    db: Session = Depends(get_db)
):
    """
    Get company evidence scorecard.
    
    Returns:
    - Evidence stack pyramid (genetic > translational > clinical)
    - Cash runway estimation
    - Near-term catalysts (next 90 days)
    """
    # Mock data for demonstration
    # In production, this would:
    # - Aggregate evidence from multiple sources
    # - Pull latest 10-K/10-Q from SEC for cash runway
    # - Link to catalyst timeline
    
    return {
        "company": {
            "name": company,
            "ticker": "XYZ",
            "company_type": "Biotech",
            "market_cap": 5200000000,  # $5.2B
            "headquarters": "Cambridge, MA"
        },
        "evidence_stack": {
            "genetic": [
                {
                    "id": "gen-001",
                    "class": "genetic",
                    "strength_score": 85,
                    "summary": "IL-23 → Crohn's disease association score: 0.85 (top decile for IBD genetics)",
                    "citations": ["Open Targets", "PMID:12345678"],
                    "source": "Open Targets",
                    "linkage_verified": True
                }
            ],
            "translational": [
                {
                    "id": "trans-001",
                    "class": "translational",
                    "strength_score": 72,
                    "summary": "Biomarker alignment confirmed in Phase I (fecal calprotectin reduction)",
                    "citations": ["Company press release", "PMID:87654321"],
                    "source": "Clinical trial data",
                    "linkage_verified": True
                }
            ],
            "clinical": [
                {
                    "id": "clin-001",
                    "class": "clinical",
                    "strength_score": 78,
                    "summary": "Phase II data: 45% remission (Mayo score), p<0.001, N=250, pre-specified primary endpoint",
                    "citations": ["NCT12345678", "PMID:11223344"],
                    "source": "ClinicalTrials.gov",
                    "linkage_verified": True
                }
            ]
        },
        "cash_runway_months": 18,
        "cash_runway_source": "Q4 2025 10-K filing",
        "near_catalysts": [
            {
                "id": "cat-001",
                "type": "Readout",
                "date": "Q2 2026",
                "description": "Phase III readout in IBD",
                "confidence": "High"
            },
            {
                "id": "cat-002",
                "type": "AdComm",
                "date": "2026-04-15",
                "description": "FDA Advisory Committee meeting",
                "confidence": "High"
            }
        ]
    }


@router.get("/journal")
async def get_journal_entries(
    user_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get user's journal entries.
    
    Returns pinned notes and evidence stream with timestamps.
    """
    # Mock data for demonstration
    # In production, this would query user's saved journal entries from database
    
    return {
        "entries": [
            {
                "id": "journal-001",
                "user_id": user_id or "demo-user",
                "title": "IL-23 vs TL1A in IBD",
                "content": "Comparing mechanisms for next-gen IBD treatments",
                "evidence_snippets": [
                    {
                        "evidence_id": "gen-001",
                        "snippet": "IL-23 has broader genetic support (OT score 0.85)",
                        "citation": "Open Targets",
                        "permalink": "https://platform.opentargets.org/",
                        "so_what": "IL-23 has broader genetic support but TL1A may offer better endoscopic remission rates"
                    }
                ],
                "created_at": (datetime.utcnow() - timedelta(days=5)).isoformat(),
                "updated_at": (datetime.utcnow() - timedelta(days=2)).isoformat(),
                "refresh_timestamp": datetime.utcnow().isoformat(),
                "tags": ["IBD", "IL-23", "TL1A"],
                "pinned": True,
                "catalysts": ["cat-001"]
            }
        ]
    }


@router.post("/journal")
async def create_journal_entry(
    title: str,
    content: str,
    evidence_snippets: List[dict],
    tags: Optional[List[str]] = None,
    user_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Create a new journal entry.
    
    Requires: title, content, and evidence_snippets array.
    """
    # Mock implementation
    # In production, this would insert into database with user authentication
    
    entry_id = f"journal-{datetime.utcnow().timestamp()}"
    
    return {
        "id": entry_id,
        "user_id": user_id or "demo-user",
        "title": title,
        "content": content,
        "evidence_snippets": evidence_snippets,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
        "refresh_timestamp": datetime.utcnow().isoformat(),
        "tags": tags or [],
        "pinned": False,
        "catalysts": []
    }

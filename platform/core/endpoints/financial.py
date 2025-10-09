"""
Financial endpoints

Comprehensive financial modeling endpoints for valuation, consensus estimates,
price targets, LoE tracking, and report generation.
"""

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from sqlalchemy.orm import Session
from typing import Dict, List, Any, Optional
from datetime import datetime
import json

from ..database import (
    get_db, PriceTarget, ConsensusEstimate, RevenueLine,
    PatentExpiry, ValuationRun, ReportArtifact
)
from ...logic.valuation import ValuationEngine

router = APIRouter()
valuation_engine = ValuationEngine()


@router.get("/overview")
async def get_financial_overview(ticker: Optional[str] = None, db: Session = Depends(get_db)) -> dict:
    """
    Financial overview with key KPIs and last valuation run.
    
    Returns House vs Street comparison and recent activity.
    """
    # Get last valuation run
    last_run = db.query(ValuationRun).filter(
        ValuationRun.ticker == ticker if ticker else True
    ).order_by(ValuationRun.run_timestamp.desc()).first()
    
    # Get price targets
    price_targets = db.query(PriceTarget).filter(
        PriceTarget.ticker == ticker if ticker else True
    ).order_by(PriceTarget.date.desc()).limit(10).all()
    
    pt_values = [pt.price_target for pt in price_targets]
    
    return {
        "ticker": ticker,
        "last_refresh": datetime.utcnow().isoformat(),
        "house_valuation": {
            "per_share": last_run.outputs.get("summary", {}).get("dcf_per_share", 0) if last_run else 0,
            "method": "DCF (70%) + Multiples (30%)",
            "last_updated": last_run.run_timestamp.isoformat() if last_run else None
        },
        "street_consensus": {
            "avg_price_target": sum(pt_values) / len(pt_values) if pt_values else 0,
            "min_price_target": min(pt_values) if pt_values else 0,
            "max_price_target": max(pt_values) if pt_values else 0,
            "num_analysts": len(price_targets)
        },
        "diff": {
            "absolute": 0,  # Calculate from house vs street
            "percentage": 0,
            "since_last_refresh": "N/A"
        }
    }


@router.get("/price-targets")
async def get_price_targets(
    ticker: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
) -> dict:
    """Get price targets from various sources."""
    query = db.query(PriceTarget)
    if ticker:
        query = query.filter(PriceTarget.ticker == ticker)
    
    targets = query.order_by(PriceTarget.date.desc()).limit(limit).all()
    
    return {
        "ticker": ticker,
        "count": len(targets),
        "targets": [
            {
                "id": t.id,
                "source": t.source,
                "date": t.date.isoformat(),
                "price_target": t.price_target,
                "rationale": t.rationale,
                "currency": t.currency
            }
            for t in targets
        ]
    }


@router.post("/price-targets")
async def create_price_target(
    data: Dict[str, Any],
    db: Session = Depends(get_db)
) -> dict:
    """Create new price target entry."""
    target = PriceTarget(
        ticker=data["ticker"],
        source=data["source"],
        date=datetime.fromisoformat(data["date"]),
        price_target=data["price_target"],
        rationale=data.get("rationale"),
        currency=data.get("currency", "USD")
    )
    
    db.add(target)
    db.commit()
    db.refresh(target)
    
    return {"id": target.id, "status": "created"}


@router.get("/consensus")
async def get_consensus_estimates(
    ticker: Optional[str] = None,
    metric: Optional[str] = None,
    db: Session = Depends(get_db)
) -> dict:
    """Get Street consensus estimates."""
    query = db.query(ConsensusEstimate)
    if ticker:
        query = query.filter(ConsensusEstimate.ticker == ticker)
    if metric:
        query = query.filter(ConsensusEstimate.metric == metric)
    
    estimates = query.all()
    
    return {
        "ticker": ticker,
        "metric": metric,
        "count": len(estimates),
        "estimates": [
            {
                "id": e.id,
                "ticker": e.ticker,
                "metric": e.metric,
                "period": e.period,
                "value": e.value,
                "source": e.source,
                "unit": e.unit
            }
            for e in estimates
        ]
    }


@router.post("/consensus/upload")
async def upload_consensus_data(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
) -> dict:
    """Upload consensus estimates from CSV/XLSX file."""
    # This would parse the file and insert records
    # For now, return success
    return {
        "status": "success",
        "message": f"Uploaded {file.filename}",
        "records_processed": 0
    }


@router.get("/metrics")
async def get_financial_metrics() -> dict:
    """Return sample financial KPIs used on the dashboard."""
    return {
        "dcf": {"symbol": "BIOX", "npv": 1.42e9, "upside": 0.27},
        "revenue_growth": {"ttm": 0.18, "yoy": 0.22},
        "cash_runway": {"months": 24, "status": "stable"},
    }


@router.get("/valuation")
async def get_sample_valuation() -> dict:
    """Mock valuation multiples so the UI has live data to render."""
    return {
        "ev_to_ebitda": 14.2,
        "price_to_sales": 9.7,
        "sector_percentile": 0.84,
    }


@router.post("/valuation/run")
async def run_valuation(
    data: Dict[str, Any],
    db: Session = Depends(get_db)
) -> dict:
    """
    Run valuation model with given parameters.
    
    Expects:
        - ticker: Company ticker
        - scenario_id: Scenario identifier
        - epi_params: Epidemiology parameters
        - financial_assumptions: WACC, TGR, margins, etc.
        - loe_events: Optional LoE events
    """
    try:
        results = valuation_engine.run_valuation(
            ticker=data["ticker"],
            scenario_id=data.get("scenario_id", "base"),
            epi_params=data["epi_params"],
            financial_assumptions=data["financial_assumptions"],
            loe_events=data.get("loe_events")
        )
        
        # Save to database
        run = ValuationRun(
            ticker=data["ticker"],
            inputs=data,
            inputs_hash=results["inputs_hash"],
            outputs=results,
            scenario=data.get("scenario_id", "base"),
            version=results["version"],
            user=data.get("user", "system")
        )
        
        db.add(run)
        db.commit()
        db.refresh(run)
        
        return {
            "status": "success",
            "run_id": run.id,
            "results": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/audit")
async def get_valuation_audit(
    ticker: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
) -> dict:
    """List valuation runs with inputs hash for reproducibility."""
    query = db.query(ValuationRun)
    if ticker:
        query = query.filter(ValuationRun.ticker == ticker)
    
    runs = query.order_by(ValuationRun.run_timestamp.desc()).limit(limit).all()
    
    return {
        "ticker": ticker,
        "count": len(runs),
        "runs": [
            {
                "id": r.id,
                "ticker": r.ticker,
                "timestamp": r.run_timestamp.isoformat(),
                "scenario": r.scenario,
                "inputs_hash": r.inputs_hash,
                "version": r.version,
                "user": r.user,
                "per_share_value": r.outputs.get("summary", {}).get("dcf_per_share", 0)
            }
            for r in runs
        ]
    }


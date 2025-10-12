"""
Reports and export endpoints

Generate XLSX, PPTX, and PDF reports.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
import hashlib
import json

from ..database import get_db, ReportArtifact, ValuationRun

router = APIRouter()


@router.post("/export")
async def export_report(
    data: Dict[str, Any],
    db: Session = Depends(get_db)
) -> dict:
    """
    Generate report artifacts (XLSX, PPTX, PDF).
    
    Expects:
        - ticker: Company ticker
        - template_id: Template identifier (dcf_model, banker_deck, etc.)
        - file_type: xlsx, pptx, or pdf
        - params: Generation parameters
    """
    ticker = data.get("ticker")
    template_id = data.get("template_id")
    file_type = data.get("file_type", "xlsx")
    params = data.get("params", {})
    
    # Get latest valuation run for this ticker
    run = db.query(ValuationRun).filter(
        ValuationRun.ticker == ticker
    ).order_by(ValuationRun.run_timestamp.desc()).first()
    
    if not run:
        raise HTTPException(status_code=404, detail="No valuation run found for ticker")
    
    # Generate file (mock implementation)
    # In production, this would call actual report generators
    file_name = f"{ticker}_{template_id}_{datetime.now().strftime('%Y%m%d')}.{file_type}"
    file_path = f"/reports/{file_name}"
    
    # Calculate file hash
    content = json.dumps({"run_id": run.id, "params": params})
    file_hash = hashlib.sha256(content.encode()).hexdigest()
    
    # Create artifact record
    artifact = ReportArtifact(
        file_type=file_type,
        template_id=template_id,
        ticker=ticker,
        params=params,
        file_path=file_path,
        file_size=len(content),
        file_hash=file_hash,
        download_url=f"/api/v1/reports/download/{file_hash}",
        expiry_date=datetime.utcnow() + timedelta(days=7),
        generated_by=data.get("user", "system")
    )
    
    db.add(artifact)
    db.commit()
    db.refresh(artifact)
    
    return {
        "status": "success",
        "artifact_id": artifact.id,
        "file_type": file_type,
        "file_name": file_name,
        "download_url": artifact.download_url,
        "expiry_date": artifact.expiry_date.isoformat()
    }


@router.get("/download/{file_hash}")
async def download_report(
    file_hash: str,
    db: Session = Depends(get_db)
) -> dict:
    """Download report by file hash."""
    artifact = db.query(ReportArtifact).filter(
        ReportArtifact.file_hash == file_hash
    ).first()
    
    if not artifact:
        raise HTTPException(status_code=404, detail="Report not found")
    
    if artifact.expiry_date and artifact.expiry_date < datetime.utcnow():
        raise HTTPException(status_code=410, detail="Download link expired")
    
    return {
        "file_path": artifact.file_path,
        "file_type": artifact.file_type,
        "file_size": artifact.file_size,
        "download_url": artifact.download_url
    }


@router.get("/list")
async def list_reports(
    ticker: Optional[str] = None,
    template_id: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
) -> dict:
    """List generated reports."""
    query = db.query(ReportArtifact)
    
    if ticker:
        query = query.filter(ReportArtifact.ticker == ticker)
    if template_id:
        query = query.filter(ReportArtifact.template_id == template_id)
    
    artifacts = query.order_by(
        ReportArtifact.generated_at.desc()
    ).limit(limit).all()
    
    return {
        "count": len(artifacts),
        "reports": [
            {
                "id": a.id,
                "ticker": a.ticker,
                "file_type": a.file_type,
                "template_id": a.template_id,
                "generated_at": a.generated_at.isoformat(),
                "generated_by": a.generated_by,
                "file_size": a.file_size,
                "download_url": a.download_url,
                "expired": a.expiry_date < datetime.utcnow() if a.expiry_date else False
            }
            for a in artifacts
        ]
    }

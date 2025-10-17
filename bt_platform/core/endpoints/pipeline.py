"""
Pipeline API Endpoints

Endpoints for scraping and accessing company pipeline data.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import logging

from ..database import get_db, PipelineAsset, Company

# Import pipeline scraper
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from bt_platform.scrapers.pipeline_manager import get_pipeline_manager

logger = logging.getLogger(__name__)

router = APIRouter()


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class PipelineScrapeRequest(BaseModel):
    """Request to scrape pipeline data."""
    companies: Optional[List[str]] = Field(
        None,
        description="List of company names to scrape. If None, scrapes all available companies."
    )
    limit: Optional[int] = Field(
        100,
        description="Maximum number of assets to process per company"
    )


class PipelineAssetResponse(BaseModel):
    """Response model for a single pipeline asset."""
    id: int
    asset_name: str
    company_name: str
    phase: Optional[str]
    indication: Optional[str]
    therapeutic_area: Optional[str]
    mechanism_of_action: Optional[str]
    modality: Optional[str]
    development_status: Optional[str]
    logo_url: Optional[str]
    source_url: Optional[str]
    scraped_at: datetime
    last_verified: Optional[datetime]
    
    class Config:
        from_attributes = True


class PipelineStatsResponse(BaseModel):
    """Response model for pipeline statistics."""
    total_assets: int
    assets_by_company: dict
    assets_by_phase: dict
    last_scrape: Optional[str]
    available_companies: List[str]


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.post("/scrape")
async def scrape_pipelines(
    request: PipelineScrapeRequest,
    db: Session = Depends(get_db)
):
    """
    Scrape pipeline data from company websites.
    
    This endpoint initiates scraping of drug pipeline data from specified companies.
    The data includes asset names, development phases, indications, and other relevant information.
    
    **Example Request:**
    ```json
    {
        "companies": ["Biogen", "Amgen"],
        "limit": 100
    }
    ```
    
    **Response:**
    - started_at: ISO timestamp of when scraping started
    - completed_at: ISO timestamp of when scraping completed
    - duration_seconds: Total duration in seconds
    - companies_scraped: Number of companies scraped
    - companies_successful: Number of companies successfully scraped
    - companies_failed: Number of companies that failed
    - total_assets_found: Total number of assets discovered
    - total_assets_inserted: Number of new assets added to database
    - total_assets_updated: Number of existing assets updated
    - results: Detailed results for each company
    - errors: List of errors encountered
    """
    try:
        manager = get_pipeline_manager()
        result = await manager.scrape_all_companies(
            db=db,
            companies=request.companies,
            limit=request.limit
        )
        
        logger.info(f"Pipeline scraping completed: {result.get('companies_successful', 0)}/{result.get('companies_scraped', 0)} successful")
        
        return result
    
    except Exception as e:
        logger.error(f"Pipeline scraping failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/assets", response_model=List[PipelineAssetResponse])
async def get_pipeline_assets(
    company: Optional[str] = Query(None, description="Filter by company name"),
    phase: Optional[str] = Query(None, description="Filter by development phase"),
    therapeutic_area: Optional[str] = Query(None, description="Filter by therapeutic area"),
    limit: int = Query(100, ge=1, le=500, description="Maximum number of results"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    db: Session = Depends(get_db)
):
    """
    Get pipeline assets from database.
    
    Retrieve scraped pipeline data with optional filtering by company, phase, or therapeutic area.
    
    **Query Parameters:**
    - company: Filter by company name (e.g., "Biogen")
    - phase: Filter by development phase (e.g., "Phase II")
    - therapeutic_area: Filter by therapeutic area (e.g., "Oncology")
    - limit: Maximum number of results (1-500, default: 100)
    - offset: Offset for pagination (default: 0)
    
    **Example:**
    ```
    GET /api/v1/pipeline/assets?company=Biogen&phase=Phase%20II&limit=50
    ```
    """
    try:
        query = db.query(PipelineAsset)
        
        # Apply filters
        if company:
            query = query.filter(PipelineAsset.company_name.ilike(f"%{company}%"))
        
        if phase:
            query = query.filter(PipelineAsset.phase == phase)
        
        if therapeutic_area:
            query = query.filter(PipelineAsset.therapeutic_area.ilike(f"%{therapeutic_area}%"))
        
        # Order by most recently scraped
        query = query.order_by(PipelineAsset.scraped_at.desc())
        
        # Apply pagination
        assets = query.offset(offset).limit(limit).all()
        
        return assets
    
    except Exception as e:
        logger.error(f"Failed to retrieve pipeline assets: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/assets/{asset_id}", response_model=PipelineAssetResponse)
async def get_pipeline_asset(
    asset_id: int,
    db: Session = Depends(get_db)
):
    """
    Get a specific pipeline asset by ID.
    
    **Parameters:**
    - asset_id: The unique identifier of the pipeline asset
    
    **Example:**
    ```
    GET /api/v1/pipeline/assets/123
    ```
    """
    try:
        asset = db.query(PipelineAsset).filter(PipelineAsset.id == asset_id).first()
        
        if not asset:
            raise HTTPException(status_code=404, detail=f"Pipeline asset {asset_id} not found")
        
        return asset
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to retrieve pipeline asset {asset_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats", response_model=PipelineStatsResponse)
async def get_pipeline_stats(
    db: Session = Depends(get_db)
):
    """
    Get pipeline statistics.
    
    Returns aggregate statistics about scraped pipeline data including:
    - Total number of assets
    - Assets grouped by company
    - Assets grouped by development phase
    - Timestamp of most recent scrape
    - List of available companies for scraping
    
    **Example:**
    ```
    GET /api/v1/pipeline/stats
    ```
    """
    try:
        manager = get_pipeline_manager()
        stats = manager.get_pipeline_stats(db)
        
        return stats
    
    except Exception as e:
        logger.error(f"Failed to retrieve pipeline stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/companies")
async def get_available_companies():
    """
    Get list of companies with available pipeline scrapers.
    
    Returns a list of company names for which pipeline scrapers are implemented
    and ready to use.
    
    **Example Response:**
    ```json
    {
        "companies": [
            "Biogen",
            "Amgen",
            "Gilead Sciences"
        ],
        "count": 3
    }
    ```
    """
    try:
        manager = get_pipeline_manager()
        companies = manager.get_available_companies()
        
        return {
            "companies": companies,
            "count": len(companies)
        }
    
    except Exception as e:
        logger.error(f"Failed to retrieve available companies: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/company/{company_name}")
async def get_company_pipeline(
    company_name: str,
    db: Session = Depends(get_db)
):
    """
    Get complete pipeline for a specific company.
    
    Returns all pipeline assets for the specified company along with metadata.
    
    **Parameters:**
    - company_name: Name of the company (case-insensitive)
    
    **Example:**
    ```
    GET /api/v1/pipeline/company/Biogen
    ```
    """
    try:
        # Get all assets for this company
        assets = db.query(PipelineAsset).filter(
            PipelineAsset.company_name.ilike(f"%{company_name}%")
        ).order_by(
            PipelineAsset.phase,
            PipelineAsset.asset_name
        ).all()
        
        if not assets:
            raise HTTPException(
                status_code=404,
                detail=f"No pipeline data found for {company_name}"
            )
        
        # Group assets by phase
        assets_by_phase = {}
        for asset in assets:
            phase = asset.phase or "Unknown"
            if phase not in assets_by_phase:
                assets_by_phase[phase] = []
            assets_by_phase[phase].append({
                "id": asset.id,
                "asset_name": asset.asset_name,
                "indication": asset.indication,
                "therapeutic_area": asset.therapeutic_area,
                "mechanism_of_action": asset.mechanism_of_action,
                "modality": asset.modality,
                "development_status": asset.development_status,
                "logo_url": asset.logo_url,
                "scraped_at": asset.scraped_at.isoformat() if asset.scraped_at else None
            })
        
        # Get most recent scrape time
        latest_asset = max(assets, key=lambda a: a.scraped_at)
        
        return {
            "company_name": company_name,
            "total_assets": len(assets),
            "last_updated": latest_asset.scraped_at.isoformat() if latest_asset.scraped_at else None,
            "source_url": latest_asset.source_url if assets else None,
            "assets_by_phase": assets_by_phase
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to retrieve pipeline for {company_name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/assets/{asset_id}")
async def delete_pipeline_asset(
    asset_id: int,
    db: Session = Depends(get_db)
):
    """
    Delete a pipeline asset.
    
    **Parameters:**
    - asset_id: The unique identifier of the pipeline asset to delete
    
    **Example:**
    ```
    DELETE /api/v1/pipeline/assets/123
    ```
    """
    try:
        asset = db.query(PipelineAsset).filter(PipelineAsset.id == asset_id).first()
        
        if not asset:
            raise HTTPException(status_code=404, detail=f"Pipeline asset {asset_id} not found")
        
        db.delete(asset)
        db.commit()
        
        logger.info(f"Deleted pipeline asset {asset_id}: {asset.asset_name}")
        
        return {
            "status": "success",
            "message": f"Pipeline asset {asset_id} deleted successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete pipeline asset {asset_id}: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def pipeline_health():
    """
    Health check endpoint for pipeline scraper service.
    
    Returns the operational status of the pipeline scraping system.
    """
    try:
        manager = get_pipeline_manager()
        companies = manager.get_available_companies()
        
        return {
            "status": "healthy",
            "service": "pipeline_scraper",
            "available_companies": len(companies),
            "companies": companies,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Pipeline health check failed: {e}")
        return {
            "status": "unhealthy",
            "service": "pipeline_scraper",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }

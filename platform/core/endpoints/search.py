"""
Search API Endpoints

Unified search across multiple entity types with FTS5 support.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import List, Dict, Any, Optional
import logging

from ..database import (
    get_db,
    EpidemiologyDisease,
    Company,
    Therapeutic,
    Catalyst,
    Article,
    ClinicalTrial
)
from ..fts import search_fts

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/global")
async def global_search(
    q: str = Query(..., description="Search query"),
    type: Optional[str] = Query(None, description="Entity type filter"),
    limit: int = Query(50, ge=1, le=100, description="Max results"),
    use_fts: bool = Query(True, description="Use full-text search"),
    db: Session = Depends(get_db)
):
    """
    Global full-text search across all entities.
    
    Uses FTS5 for efficient searching when available.
    Falls back to LIKE queries if FTS is not available.
    """
    try:
        if use_fts:
            # Use FTS5 for fast full-text search
            results = search_fts(db, q, entity_type=type, limit=limit)
            
            return {
                "query": q,
                "count": len(results),
                "results": results,
                "method": "fts5"
            }
        else:
            # Fallback to LIKE queries
            return await unified_search(q=q, limit=limit, db=db)
            
    except Exception as e:
        logger.error(f"Global search error: {e}")
        # Fallback to LIKE queries on error
        try:
            return await unified_search(q=q, limit=limit, db=db)
        except Exception as e2:
            logger.error(f"Fallback search error: {e2}")
            return {
                "error": str(e2),
                "query": q,
                "count": 0,
                "results": []
            }


@router.get("/multi")
async def unified_search(
    q: str = Query(..., description="Search query"),
    limit: int = Query(10, ge=1, le=100, description="Max results per category"),
    db: Session = Depends(get_db)
):
    """
    Unified search across all entity types.
    Returns grouped results by entity type.
    """
    try:
        search_pattern = f"%{q}%"
        results = {
            "query": q,
            "diseases": [],
            "companies": [],
            "therapeutics": [],
            "catalysts": [],
            "articles": [],
            "trials": [],
            "method": "like"
        }
        
        # Search diseases
        diseases = db.query(EpidemiologyDisease).filter(
            or_(
                EpidemiologyDisease.name.ilike(search_pattern),
                EpidemiologyDisease.description.ilike(search_pattern),
                EpidemiologyDisease.icd10_code.ilike(search_pattern)
            )
        ).filter(EpidemiologyDisease.is_active == True).limit(limit).all()
        
        results["diseases"] = [
            {
                "id": d.id,
                "name": d.name,
                "category": d.category,
                "icd10_code": d.icd10_code,
                "prevalence": d.prevalence
            }
            for d in diseases
        ]
        
        # Search companies
        companies = db.query(Company).filter(
            or_(
                Company.name.ilike(search_pattern),
                Company.ticker.ilike(search_pattern)
            )
        ).limit(limit).all()
        
        results["companies"] = [
            {
                "id": c.id,
                "name": c.name,
                "ticker": c.ticker,
                "company_type": c.company_type,
                "market_cap": c.market_cap
            }
            for c in companies
        ]
        
        # Search therapeutics
        therapeutics = db.query(Therapeutic).filter(
            or_(
                Therapeutic.name.ilike(search_pattern),
                Therapeutic.indication.ilike(search_pattern),
                Therapeutic.target.ilike(search_pattern)
            )
        ).limit(limit).all()
        
        results["therapeutics"] = [
            {
                "id": t.id,
                "name": t.name,
                "modality": t.modality,
                "phase": t.phase,
                "company_id": t.company_id,
                "disease_id": t.disease_id
            }
            for t in therapeutics
        ]
        
        # Search catalysts
        catalysts = db.query(Catalyst).filter(
            or_(
                Catalyst.name.ilike(search_pattern),
                Catalyst.title.ilike(search_pattern),
                Catalyst.description.ilike(search_pattern),
                Catalyst.company.ilike(search_pattern)
            )
        ).limit(limit).all()
        
        results["catalysts"] = [
            {
                "id": c.id,
                "name": c.name or c.title,
                "kind": c.kind or c.event_type,
                "date": c.date or c.event_date,
                "company": c.company,
                "status": c.status
            }
            for c in catalysts
        ]
        
        # Search articles
        articles = db.query(Article).filter(
            or_(
                Article.title.ilike(search_pattern),
                Article.summary.ilike(search_pattern)
            )
        ).filter(Article.link_valid == True).limit(limit).all()
        
        results["articles"] = [
            {
                "id": a.id,
                "title": a.title,
                "url": a.url,
                "source": a.source,
                "published_at": a.published_at.isoformat() if a.published_at else None
            }
            for a in articles
        ]
        
        # Search clinical trials
        trials = db.query(ClinicalTrial).filter(
            or_(
                ClinicalTrial.title.ilike(search_pattern),
                ClinicalTrial.condition.ilike(search_pattern),
                ClinicalTrial.sponsor.ilike(search_pattern)
            )
        ).limit(limit).all()
        
        results["trials"] = [
            {
                "id": t.id,
                "nct_id": t.nct_id,
                "title": t.title,
                "phase": t.phase,
                "status": t.status,
                "condition": t.condition
            }
            for t in trials
        ]
        
        return results
        
    except Exception as e:
        logger.error(f"Search error: {e}")
        return {
            "error": str(e),
            "query": q,
            "diseases": [],
            "companies": [],
            "therapeutics": [],
            "catalysts": [],
            "articles": [],
            "trials": []
        }

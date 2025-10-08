"""
Insights API Endpoints

Disease-centric insights combining epidemiology, news, catalysts, and competition.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional
from datetime import datetime, timedelta
import logging

from ..database import (
    get_db,
    EpidemiologyDisease,
    Article,
    ArticleDisease,
    Catalyst,
    Therapeutic,
    CompetitionEdge
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/disease/{disease_id}")
async def get_disease_insights(
    disease_id: int,
    db: Session = Depends(get_db)
):
    """
    Get comprehensive insights for a disease including epidemiology,
    recent news, upcoming catalysts, and competitive landscape.
    """
    try:
        # Get disease
        disease = db.query(EpidemiologyDisease).filter(
            EpidemiologyDisease.id == disease_id
        ).first()
        
        if not disease:
            raise HTTPException(status_code=404, detail="Disease not found")
        
        # Get epidemiology summary
        epi_summary = {
            "id": disease.id,
            "name": disease.name,
            "category": disease.category,
            "icd10_code": disease.icd10_code,
            "prevalence": disease.prevalence,
            "incidence": disease.incidence,
            "mortality_rate": disease.mortality_rate,
            "target_population": disease.target_population,
            "dalys": disease.dalys
        }
        
        # Get recent articles
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        article_links = db.query(ArticleDisease).filter(
            ArticleDisease.disease_id == disease_id
        ).all()
        
        article_ids = [link.article_id for link in article_links]
        
        recent_articles = []
        if article_ids:
            articles = db.query(Article).filter(
                Article.id.in_(article_ids),
                Article.published_at >= thirty_days_ago,
                Article.link_valid == True
            ).order_by(desc(Article.published_at)).limit(10).all()
            
            for article in articles:
                sentiments = {}
                for sentiment in article.sentiments:
                    sentiments[sentiment.domain] = sentiment.score
                
                recent_articles.append({
                    "id": article.id,
                    "title": article.title,
                    "url": article.url,
                    "source": article.source,
                    "published_at": article.published_at.isoformat() if article.published_at else None,
                    "sentiments": sentiments
                })
        
        # Get upcoming catalysts (next 90 days)
        ninety_days_ahead = datetime.utcnow() + timedelta(days=90)
        
        # Find therapeutics for this disease
        therapeutics = db.query(Therapeutic).filter(
            Therapeutic.disease_id == disease_id
        ).all()
        
        therapeutic_ids = [t.id for t in therapeutics]
        
        upcoming_catalysts = []
        # For now, get all catalysts (we'd need to link them properly)
        catalysts = db.query(Catalyst).filter(
            Catalyst.date >= datetime.utcnow(),
            Catalyst.date <= ninety_days_ahead
        ).order_by(Catalyst.date).limit(10).all()
        
        for catalyst in catalysts:
            upcoming_catalysts.append({
                "id": catalyst.id,
                "name": catalyst.name or catalyst.title,
                "kind": catalyst.kind or catalyst.event_type,
                "date": (catalyst.date or catalyst.event_date).isoformat() if (catalyst.date or catalyst.event_date) else None,
                "company": catalyst.company,
                "status": catalyst.status
            })
        
        # Get competitive spiderweb data
        spiderweb_data = []
        if therapeutics:
            # Get competition edges for therapeutics in this disease
            for therapeutic in therapeutics[:5]:  # Limit to top 5
                edges = db.query(CompetitionEdge).filter(
                    CompetitionEdge.from_id == therapeutic.id,
                    CompetitionEdge.scope == "THERAPEUTIC"
                ).all()
                
                if edges:
                    # Average the metrics
                    metrics = {
                        "safety": sum(e.safety or 0 for e in edges) / len(edges),
                        "efficacy": sum(e.efficacy or 0 for e in edges) / len(edges),
                        "regulatory": sum(e.regulatory or 0 for e in edges) / len(edges),
                        "modality_fit": sum(e.modality_fit or 0 for e in edges) / len(edges),
                        "clinical_maturity": sum(e.clinical_maturity or 0 for e in edges) / len(edges),
                        "differentiation": sum(e.differentiation or 0 for e in edges) / len(edges)
                    }
                else:
                    # Default values if no competition data
                    metrics = {
                        "safety": 50,
                        "efficacy": 50,
                        "regulatory": 50,
                        "modality_fit": 50,
                        "clinical_maturity": 50,
                        "differentiation": 50
                    }
                
                spiderweb_data.append({
                    "name": therapeutic.name,
                    "modality": therapeutic.modality,
                    "phase": therapeutic.phase,
                    "metrics": metrics
                })
        
        return {
            "disease": epi_summary,
            "recent_articles": recent_articles,
            "upcoming_catalysts": upcoming_catalysts,
            "competitive_landscape": spiderweb_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching insights for disease {disease_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

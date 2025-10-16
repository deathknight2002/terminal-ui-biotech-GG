"""
News API Endpoints

News articles with sentiment analysis and verification.
"""

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from datetime import datetime, timedelta
import logging

from ..database import get_db, Article, Sentiment, ArticleDisease, ArticleCompany, ArticleCatalyst, Entity, ArticleEntity, ArticleReaction
from ..services.news_refresh_service import NewsRefreshService
from ..services.entity_extraction_service import EntityExtractionService
from ..services.price_reaction_service import PriceReactionService

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/latest")
async def get_latest_news(
    limit: int = Query(50, ge=1, le=200, description="Number of articles to return"),
    source: Optional[str] = Query(None, description="Filter by source"),
    valid_only: bool = Query(True, description="Only return articles with valid links"),
    db: Session = Depends(get_db)
):
    """
    Get latest news articles with sentiment data.
    """
    try:
        query = db.query(Article)
        
        if valid_only:
            query = query.filter(Article.link_valid == True)
        
        if source:
            query = query.filter(Article.source == source)
        
        articles = query.order_by(desc(Article.published_at)).limit(limit).all()
        
        result = []
        for article in articles:
            # Get sentiments
            sentiments_data = {}
            for sentiment in article.sentiments:
                sentiments_data[sentiment.domain] = {
                    "score": sentiment.score,
                    "rationale": sentiment.rationale
                }
            
            result.append({
                "id": article.id,
                "title": article.title,
                "url": article.url,
                "summary": article.summary,
                "source": article.source,
                "published_at": article.published_at.isoformat() if article.published_at else None,
                "tags": article.tags,
                "link_valid": article.link_valid,
                "sentiments": sentiments_data,
                "ingested_at": article.ingested_at.isoformat() if article.ingested_at else None
            })
        
        return {
            "articles": result,
            "count": len(result),
            "filters": {
                "source": source,
                "valid_only": valid_only
            }
        }
        
    except Exception as e:
        logger.error(f"Error fetching latest news: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{article_id}")
async def get_article(
    article_id: int,
    db: Session = Depends(get_db)
):
    """
    Get a specific article with full details including sentiment and related entities.
    """
    try:
        article = db.query(Article).filter(Article.id == article_id).first()
        
        if not article:
            raise HTTPException(status_code=404, detail="Article not found")
        
        # Get sentiments
        sentiments_data = {}
        for sentiment in article.sentiments:
            sentiments_data[sentiment.domain] = {
                "score": sentiment.score,
                "rationale": sentiment.rationale
            }
        
        # Get related diseases
        disease_links = db.query(ArticleDisease).filter(
            ArticleDisease.article_id == article_id
        ).all()
        
        related_diseases = [
            {
                "disease_id": link.disease_id,
                "relevance": link.relevance
            }
            for link in disease_links
        ]
        
        # Get related companies
        company_links = db.query(ArticleCompany).filter(
            ArticleCompany.article_id == article_id
        ).all()
        
        related_companies = [
            {
                "company_id": link.company_id,
                "relevance": link.relevance
            }
            for link in company_links
        ]
        
        # Get related catalysts
        catalyst_links = db.query(ArticleCatalyst).filter(
            ArticleCatalyst.article_id == article_id
        ).all()
        
        related_catalysts = [
            {
                "catalyst_id": link.catalyst_id,
                "relevance": link.relevance
            }
            for link in catalyst_links
        ]
        
        return {
            "id": article.id,
            "title": article.title,
            "url": article.url,
            "summary": article.summary,
            "source": article.source,
            "published_at": article.published_at.isoformat() if article.published_at else None,
            "tags": article.tags,
            "link_valid": article.link_valid,
            "hash": article.hash,
            "sentiments": sentiments_data,
            "related_diseases": related_diseases,
            "related_companies": related_companies,
            "related_catalysts": related_catalysts,
            "ingested_at": article.ingested_at.isoformat() if article.ingested_at else None,
            "created_at": article.created_at.isoformat() if article.created_at else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching article {article_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sources")
async def get_news_sources(db: Session = Depends(get_db)):
    """
    Get available news sources with article counts.
    """
    try:
        from sqlalchemy import func
        
        sources = db.query(
            Article.source,
            func.count(Article.id).label('count')
        ).filter(
            Article.link_valid == True
        ).group_by(Article.source).all()
        
        return {
            "sources": [
                {
                    "name": source,
                    "count": count
                }
                for source, count in sources
            ]
        }
        
    except Exception as e:
        logger.error(f"Error fetching news sources: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/diff")
async def get_news_diff(
    since: Optional[str] = Query(None, description="ISO timestamp or relative time (e.g., '1h', '1d')"),
    db: Session = Depends(get_db)
):
    """
    Get news articles diff since last refresh with highlights.
    Shows new, updated articles since the specified time.
    """
    try:
        # Parse since parameter
        if since:
            if since.endswith('h'):
                hours = int(since[:-1])
                since_dt = datetime.utcnow() - timedelta(hours=hours)
            elif since.endswith('d'):
                days = int(since[:-1])
                since_dt = datetime.utcnow() - timedelta(days=days)
            elif since.endswith('w'):
                weeks = int(since[:-1])
                since_dt = datetime.utcnow() - timedelta(weeks=weeks)
            else:
                # Try to parse as ISO timestamp
                try:
                    since_dt = datetime.fromisoformat(since.replace('Z', '+00:00'))
                except ValueError:
                    raise HTTPException(status_code=400, detail=f"Invalid since format: {since}")
        else:
            # Default to last hour
            since_dt = datetime.utcnow() - timedelta(hours=1)
        
        # Get new articles
        new_articles = db.query(Article).filter(
            Article.created_at >= since_dt,
            Article.link_valid == True
        ).order_by(desc(Article.created_at)).all()
        
        # Get updated articles (ingested_at > created_at means it was re-ingested/updated)
        updated_articles = db.query(Article).filter(
            Article.ingested_at >= since_dt,
            Article.created_at < since_dt,
            Article.link_valid == True
        ).order_by(desc(Article.ingested_at)).all()
        
        highlights = []
        
        # Add new articles to highlights
        for article in new_articles[:10]:  # Limit to 10 highlights
            highlights.append({
                "type": "new",
                "entity": article.title,
                "summary": f"New article from {article.source}",
                "timestamp": article.created_at.isoformat() if article.created_at else None,
                "article_id": article.id,
                "url": article.url
            })
        
        # Add updated articles to highlights
        for article in updated_articles[:5]:  # Limit to 5 highlights
            highlights.append({
                "type": "updated",
                "entity": article.title,
                "summary": f"Article refreshed from {article.source}",
                "timestamp": article.ingested_at.isoformat() if article.ingested_at else None,
                "article_id": article.id,
                "url": article.url
            })
        
        return {
            "since": since_dt.isoformat(),
            "changes": {
                "added": len(new_articles),
                "updated": len(updated_articles),
                "deleted": 0  # Not tracking deletions currently
            },
            "highlights": highlights,
            "last_check": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching news diff: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/refresh-now")
async def refresh_news_now(
    max_articles: int = Query(50, ge=1, le=200, description="Max articles to process"),
    db: Session = Depends(get_db)
):
    """
    Manual news refresh pipeline - NO BACKGROUND DAEMONS
    
    Fetches from configured sources, dedupes, tags entities, and saves snapshots.
    Returns statistics about the refresh operation.
    """
    try:
        logger.info(f"Starting manual news refresh (max_articles={max_articles})")
        
        refresh_service = NewsRefreshService(db)
        
        # For now, we don't have actual scrapers configured
        # This would normally fetch from real sources
        sources = []  # Would be actual scraper instances
        
        stats = refresh_service.refresh_from_sources(sources, max_articles)
        
        return {
            "success": True,
            "message": "News refresh completed",
            "stats": stats
        }
        
    except Exception as e:
        logger.error(f"Error during news refresh: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{article_id}/exposures")
async def get_article_exposures(
    article_id: int,
    db: Session = Depends(get_db)
):
    """
    Get ticker exposures for an article (direct, competitor, ETF)
    with weights and point-in-time ETF snapshots
    """
    try:
        # Get article
        article = db.query(Article).filter(Article.id == article_id).first()
        if not article:
            raise HTTPException(status_code=404, detail="Article not found")
        
        # Get all entity links
        entity_links = db.query(ArticleEntity).filter(
            ArticleEntity.article_id == article_id
        ).all()
        
        exposures = {
            "direct": [],
            "competitor": [],
            "etf": []
        }
        
        entity_service = EntityExtractionService(db)
        
        for link in entity_links:
            entity = db.query(Entity).filter(Entity.id == link.entity_id).first()
            if not entity:
                continue
            
            exposure_data = {
                "entity_id": entity.id,
                "name": entity.name,
                "ticker": entity.ticker,
                "kind": entity.kind,
                "role": link.role,
                "weight": link.weight,
                "confidence": link.confidence
            }
            
            if link.role == "primary":
                exposures["direct"].append(exposure_data)
                
                # Get competitors for primary entities
                if entity.kind == "company":
                    competitors = entity_service.get_competitors(entity.id, limit=5)
                    exposures["competitor"].extend([
                        {
                            **comp,
                            "role": "competitor",
                            "confidence": 0.8
                        }
                        for comp in competitors
                    ])
                    
            elif link.role == "etf":
                exposures["etf"].append(exposure_data)
            elif link.role == "competitor":
                exposures["competitor"].append(exposure_data)
        
        return {
            "article_id": article_id,
            "article_title": article.title,
            "published_at": article.published_at.isoformat() if article.published_at else None,
            "exposures": exposures,
            "total_exposures": {
                "direct": len(exposures["direct"]),
                "competitor": len(exposures["competitor"]),
                "etf": len(exposures["etf"])
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching exposures for article {article_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{article_id}/reactions")
async def get_article_reactions(
    article_id: int,
    db: Session = Depends(get_db)
):
    """
    Get price reactions for an article
    Shows intraday and daily window reactions vs XBI
    """
    try:
        # Get article
        article = db.query(Article).filter(Article.id == article_id).first()
        if not article:
            raise HTTPException(status_code=404, detail="Article not found")
        
        reaction_service = PriceReactionService(db)
        reactions = reaction_service.get_reactions(article_id)
        
        return {
            "article_id": article_id,
            "article_title": article.title,
            "published_at": article.published_at.isoformat() if article.published_at else None,
            "reactions": reactions,
            "count": len(reactions)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching reactions for article {article_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{article_id}/recompute-reaction")
async def recompute_article_reaction(
    article_id: int,
    entity_id: int = Query(..., description="Entity ID to compute reaction for"),
    window: str = Query("[-1d,+1d]", description="Time window, e.g., '[-1d,+1d]', '[0,+60m]'"),
    benchmark_ticker: Optional[str] = Query("XBI", description="Benchmark ticker"),
    db: Session = Depends(get_db)
):
    """
    Recompute price reaction for an article with different windows/benchmark
    """
    try:
        reaction_service = PriceReactionService(db)
        
        result = reaction_service.recompute_reaction(
            article_id,
            entity_id,
            window,
            benchmark_ticker
        )
        
        if not result:
            raise HTTPException(status_code=404, detail="Could not compute reaction")
        
        return {
            "success": True,
            "reaction": result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error recomputing reaction for article {article_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/etf/{ticker}/constituents")
async def get_etf_constituents(
    ticker: str,
    asof: Optional[str] = Query(None, description="Point-in-time date (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """
    Get point-in-time ETF constituents
    Returns XBI members as of the specified date
    """
    try:
        from ..database import ETFConstituent
        from sqlalchemy import and_
        
        # Get ETF entity
        etf = db.query(Entity).filter(
            Entity.ticker == ticker.upper(),
            Entity.kind == "etf"
        ).first()
        
        if not etf:
            raise HTTPException(status_code=404, detail=f"ETF {ticker} not found")
        
        # Parse asof date
        if asof:
            try:
                asof_date = datetime.fromisoformat(asof)
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid date format: {asof}")
        else:
            asof_date = datetime.utcnow()
        
        # Get constituents for the closest date on or before asof_date
        constituents = db.query(ETFConstituent).filter(
            and_(
                ETFConstituent.etf_entity_id == etf.id,
                ETFConstituent.asof_date <= asof_date
            )
        ).order_by(desc(ETFConstituent.asof_date)).limit(100).all()
        
        # Group by member to get latest snapshot per member
        member_map = {}
        for constituent in constituents:
            if constituent.member_entity_id not in member_map:
                member_map[constituent.member_entity_id] = constituent
        
        # Build result
        result = []
        for member_id, constituent in member_map.items():
            member = db.query(Entity).filter(Entity.id == member_id).first()
            if member:
                result.append({
                    "entity_id": member.id,
                    "name": member.name,
                    "ticker": member.ticker,
                    "weight": constituent.weight,
                    "asof_date": constituent.asof_date.isoformat() if constituent.asof_date else None
                })
        
        return {
            "etf_ticker": ticker,
            "etf_name": etf.name,
            "asof_date": asof_date.isoformat(),
            "constituents": result,
            "count": len(result)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching ETF constituents for {ticker}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

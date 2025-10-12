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

from ..database import get_db, Article, Sentiment, ArticleDisease, ArticleCompany, ArticleCatalyst

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

"""
Admin API Endpoints

Manual data ingestion and administrative operations.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta
import logging
import hashlib
import random
import asyncio

from ..database import (
    get_db,
    Article,
    Sentiment,
    Catalyst,
    Therapeutic,
    Company,
    EpidemiologyDisease,
    DataIngestionLog
)

# Import scraper framework
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from platform.scrapers.base.registry import ScraperRegistry
from platform.scrapers.sites import (
    FierceScraper,
    BusinessWireScraper,
    GlobeNewswireScraper,
    PRNewswireScraper,
    FDAScraper,
    EMAScraper,
    MHRAScraper,
    ClinicalTrialsScraper,
    EDGARScraper,
)

logger = logging.getLogger(__name__)

router = APIRouter()

# Scraper mapping
SCRAPER_MAP = {
    'fierce': FierceScraper,
    'fiercebiotech': FierceScraper,
    'fiercepharma': FierceScraper,
    'businesswire': BusinessWireScraper,
    'globenewswire': GlobeNewswireScraper,
    'prnewswire': PRNewswireScraper,
    'fda': FDAScraper,
    'ema': EMAScraper,
    'mhra': MHRAScraper,
    'clinicaltrials': ClinicalTrialsScraper,
    'edgar': EDGARScraper,
}


class IngestRequest(BaseModel):
    sources: List[str]  # List of source keys
    since: Optional[str] = "7d"  # Time window: "7d", "2024-01-01", etc.
    limit: Optional[int] = 50  # Max items per source
    

class ScraperPreviewRequest(BaseModel):
    source: str
    url: str


@router.post("/ingest")
async def manual_ingest(
    request: IngestRequest,
    db: Session = Depends(get_db)
):
    """
    Manual data ingestion endpoint using the new scraper framework.
    Performs on-demand data pulls only. No background jobs or cron schedulers.
    """
    start_time = datetime.utcnow()
    
    # Parse since parameter
    since_date = None
    if request.since:
        if request.since.endswith('d'):
            days = int(request.since[:-1])
            since_date = datetime.utcnow() - timedelta(days=days)
        elif request.since.endswith('w'):
            weeks = int(request.since[:-1])
            since_date = datetime.utcnow() - timedelta(weeks=weeks)
        else:
            try:
                since_date = datetime.fromisoformat(request.since)
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid since format: {request.since}")
    
    # Create ingestion log
    log = DataIngestionLog(
        pipeline_name="scraper_ingest",
        data_source=",".join(request.sources),
        start_time=start_time,
        status="running"
    )
    db.add(log)
    db.commit()
    
    try:
        results = {
            "sources": request.sources,
            "started_at": start_time.isoformat(),
            "records_processed": 0,
            "records_inserted": 0,
            "records_updated": 0,
            "by_source": {},
            "errors": []
        }
        
        # Load registry
        registry = ScraperRegistry()
        
        # Run scrapers for each source
        for source_key in request.sources:
            source_result = {
                "processed": 0,
                "inserted": 0,
                "updated": 0,
                "errors": []
            }
            
            try:
                # Get scraper class
                scraper_class = SCRAPER_MAP.get(source_key.lower())
                if not scraper_class:
                    source_result["errors"].append(f"Unknown source: {source_key}")
                    results["by_source"][source_key] = source_result
                    continue
                
                # Get config
                config = registry.get_scraper(source_key.lower())
                if not config:
                    config_dict = {'source_key': source_key.lower()}
                else:
                    config_dict = {
                        'source_key': config.source_key,
                        'name': config.name,
                        'base_url': config.base_url,
                        'max_rps': config.max_requests_per_second,
                        'max_concurrent': config.max_concurrent,
                        'user_agent': config.user_agent,
                    }
                
                # Create and run scraper
                scraper = scraper_class(config_dict)
                scraper_results = await scraper.run(
                    since=since_date,
                    limit=request.limit,
                    dry_run=False,
                )
                
                # Process results and insert into database
                for scraper_result in scraper_results:
                    try:
                        # Check if article already exists
                        existing = db.query(Article).filter(
                            Article.hash == scraper_result.hash
                        ).first()
                        
                        if existing:
                            # Update existing article
                            existing.ingested_at = datetime.utcnow()
                            source_result["updated"] += 1
                        else:
                            # Create new article
                            article = Article(
                                title=scraper_result.data.get('title', ''),
                                url=scraper_result.data.get('url', ''),
                                summary=scraper_result.data.get('summary', ''),
                                source=scraper_result.data.get('source', source_key),
                                published_at=scraper_result.published_at,
                                tags=scraper_result.data.get('tags', []),
                                hash=scraper_result.hash,
                                link_valid=scraper_result.link_valid,
                            )
                            db.add(article)
                            db.flush()
                            
                            source_result["inserted"] += 1
                        
                        source_result["processed"] += 1
                        
                    except Exception as e:
                        logger.error(f"Error processing result: {e}")
                        source_result["errors"].append(str(e))
                
                db.commit()
                
            except Exception as e:
                logger.error(f"Error scraping {source_key}: {e}")
                source_result["errors"].append(str(e))
            
            results["by_source"][source_key] = source_result
            results["records_processed"] += source_result["processed"]
            results["records_inserted"] += source_result["inserted"]
            results["records_updated"] += source_result["updated"]
            if source_result["errors"]:
                results["errors"].extend([f"{source_key}: {e}" for e in source_result["errors"]])
        
        # Update log
        end_time = datetime.utcnow()
        log.end_time = end_time
        log.status = "success" if not results["errors"] else "partial_success"
        log.records_processed = results["records_processed"]
        log.records_inserted = results["records_inserted"]
        log.records_updated = results["records_updated"]
        log.execution_metadata = results
        
        db.commit()
        
        results["completed_at"] = end_time.isoformat()
        results["duration_seconds"] = (end_time - start_time).total_seconds()
        
        return results
        
    except Exception as e:
        logger.error(f"Ingestion error: {e}")
        log.status = "failed"
        log.end_time = datetime.utcnow()
        log.error_message = str(e)
        db.commit()
        
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")


@router.get("/scrape/preview")
async def scrape_preview(
    source: str,
    url: str,
    db: Session = Depends(get_db)
):
    """
    Preview scraper output for a specific URL without saving to database.
    """
    try:
        # Get scraper class
        scraper_class = SCRAPER_MAP.get(source.lower())
        if not scraper_class:
            raise HTTPException(status_code=404, detail=f"Unknown source: {source}")
        
        # Get config
        registry = ScraperRegistry()
        config = registry.get_scraper(source.lower())
        if not config:
            config_dict = {'source_key': source.lower()}
        else:
            config_dict = {
                'source_key': config.source_key,
                'name': config.name,
                'base_url': config.base_url,
                'max_rps': config.max_requests_per_second,
                'user_agent': config.user_agent,
            }
        
        # Create scraper and run
        scraper = scraper_class(config_dict)
        results = await scraper.run(
            method='url',
            urls=[url],
            dry_run=True,
            save_fixture=True,
        )
        
        if not results:
            return {
                "error": "No results returned from scraper"
            }
        
        result = results[0]
        
        return {
            "normalized": {
                "content_type": result.content_type.value,
                "data": result.data,
                "metadata": result.metadata,
                "companies": result.companies,
                "diseases": result.diseases,
                "catalysts": result.catalysts,
                "confidence": result.confidence,
                "link_valid": result.link_valid,
            },
            "fixture_path": result.fixture_path,
            "url": result.url,
            "hash": result.hash,
            "fingerprint": result.fingerprint,
        }
        
    except Exception as e:
        logger.error(f"Preview error: {e}")
        raise HTTPException(status_code=500, detail=f"Preview failed: {str(e)}")


@router.get("/scrape/stats")
async def scrape_stats(db: Session = Depends(get_db)):
    """
    Get scraper statistics and metrics.
    """
    try:
        # Get last refresh times per source
        last_refresh = {}
        for source_key in SCRAPER_MAP.keys():
            latest_article = db.query(Article).filter(
                Article.source == source_key
            ).order_by(Article.ingested_at.desc()).first()
            
            if latest_article:
                last_refresh[source_key] = latest_article.ingested_at.isoformat()
        
        # Get article counts per source
        source_counts = {}
        for source_key in SCRAPER_MAP.keys():
            count = db.query(Article).filter(Article.source == source_key).count()
            source_counts[source_key] = count
        
        # Get recent ingestion logs
        recent_logs = db.query(DataIngestionLog).filter(
            DataIngestionLog.pipeline_name == 'scraper_ingest'
        ).order_by(DataIngestionLog.start_time.desc()).limit(10).all()
        
        # Calculate throughput (items/minute) from recent logs
        throughput = {}
        for source_key in SCRAPER_MAP.keys():
            source_logs = [log for log in recent_logs if source_key in log.data_source]
            if source_logs:
                avg_items = sum(log.records_processed or 0 for log in source_logs) / len(source_logs)
                avg_duration = sum(
                    (log.end_time - log.start_time).total_seconds() / 60
                    for log in source_logs if log.end_time
                ) / len(source_logs)
                if avg_duration > 0:
                    throughput[source_key] = round(avg_items / avg_duration, 2)
        
        # Calculate dedupe rate (percentage of duplicates)
        dedupe_rate = {}
        for source_key in SCRAPER_MAP.keys():
            source_logs = [log for log in recent_logs if source_key in log.data_source]
            if source_logs:
                total_processed = sum(log.records_processed or 0 for log in source_logs)
                total_inserted = sum(log.records_inserted or 0 for log in source_logs)
                if total_processed > 0:
                    dedupe_rate[source_key] = round(
                        (total_processed - total_inserted) / total_processed, 2
                    )
        
        return {
            "last_refresh": last_refresh,
            "source_counts": source_counts,
            "throughput": throughput,  # items/minute
            "dedupe_rate": dedupe_rate,  # 0-1, where 0.12 = 12% duplicates
            "total_articles": db.query(Article).count(),
            "available_sources": list(SCRAPER_MAP.keys()),
        }
        
    except Exception as e:
        logger.error(f"Stats error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")


# Legacy helper functions (kept for backward compatibility)
async def _ingest_news(db: Session):
    """
    Legacy mock news ingestion. Use new scraper framework instead.
    """
    processed = 0
    inserted = 0
    errors = []
    
    try:
        # Mock: Generate a few sample articles
        sources = ["FierceBiotech", "ScienceDaily", "BioSpace", "Endpoints News"]
        
        for i in range(3):
            # Create article hash
            title = f"Breaking: New Development in Oncology Research {random.randint(1000, 9999)}"
            url = f"https://example.com/article/{random.randint(10000, 99999)}"
            content_hash = hashlib.md5(f"{title}{url}".encode()).hexdigest()
            
            # Check if already exists
            existing = db.query(Article).filter(Article.hash == content_hash).first()
            if existing:
                continue
            
            article = Article(
                title=title,
                url=url,
                summary="Sample article summary for testing purposes.",
                source=random.choice(sources),
                published_at=datetime.utcnow(),
                tags=["oncology", "research"],
                hash=content_hash,
                link_valid=True
            )
            db.add(article)
            db.flush()
            
            # Add sentiments
            for domain in ["regulatory", "clinical", "mna"]:
                sentiment = Sentiment(
                    article_id=article.id,
                    domain=domain,
                    score=random.uniform(-0.5, 0.8),
                    rationale=f"Sample {domain} sentiment analysis"
                )
                db.add(sentiment)
            
            inserted += 1
            processed += 1
        
        db.commit()
        
    except Exception as e:
        logger.error(f"News ingestion error: {e}")
        errors.append(str(e))
    
    return {
        "processed": processed,
        "inserted": inserted,
        "errors": errors
    }


async def _ingest_trials(db: Session):
    """
    Legacy mock trials ingestion.
    """
    return {
        "processed": 0,
        "inserted": 0,
        "errors": []
    }


async def _ingest_catalysts(db: Session):
    """
    Legacy mock catalysts ingestion.
    """
    processed = 0
    inserted = 0
    errors = []
    
    try:
        # Mock: Generate sample catalysts
        companies = db.query(Company).limit(3).all()
        
        for company in companies:
            catalyst = Catalyst(
                name=f"Phase II Data Readout - {company.name}",
                title=f"Phase II Data Readout",
                company=company.name,
                drug=f"Drug-{random.randint(100, 999)}",
                kind="Clinical Data",
                event_type="Data Readout",
                date=datetime.utcnow(),
                probability=0.75,
                impact="High",
                description="Upcoming phase II trial data readout",
                status="Upcoming",
                source_url="https://example.com"
            )
            db.add(catalyst)
            inserted += 1
            processed += 1
        
        db.commit()
        
    except Exception as e:
        logger.error(f"Catalysts ingestion error: {e}")
        errors.append(str(e))
    
    return {
        "processed": processed,
        "inserted": inserted,
        "errors": errors
    }


async def _ingest_news(db: Session):
    """
    Mock news ingestion. Replace with real scraping logic.
    """
    processed = 0
    inserted = 0
    errors = []
    
    try:
        # Mock: Generate a few sample articles
        sources = ["FierceBiotech", "ScienceDaily", "BioSpace", "Endpoints News"]
        
        for i in range(3):
            # Create article hash
            title = f"Breaking: New Development in Oncology Research {random.randint(1000, 9999)}"
            url = f"https://example.com/article/{random.randint(10000, 99999)}"
            content_hash = hashlib.md5(f"{title}{url}".encode()).hexdigest()
            
            # Check if already exists
            existing = db.query(Article).filter(Article.hash == content_hash).first()
            if existing:
                continue
            
            article = Article(
                title=title,
                url=url,
                summary="Sample article summary for testing purposes.",
                source=random.choice(sources),
                published_at=datetime.utcnow(),
                tags=["oncology", "research"],
                hash=content_hash,
                link_valid=True
            )
            db.add(article)
            db.flush()
            
            # Add sentiments
            for domain in ["regulatory", "clinical", "mna"]:
                sentiment = Sentiment(
                    article_id=article.id,
                    domain=domain,
                    score=random.uniform(-0.5, 0.8),
                    rationale=f"Sample {domain} sentiment analysis"
                )
                db.add(sentiment)
            
            inserted += 1
            processed += 1
        
        db.commit()
        
    except Exception as e:
        logger.error(f"News ingestion error: {e}")
        errors.append(str(e))
    
    return {
        "processed": processed,
        "inserted": inserted,
        "errors": errors
    }


async def _ingest_trials(db: Session):
    """
    Mock trials ingestion. Replace with real ClinicalTrials.gov API.
    """
    return {
        "processed": 0,
        "inserted": 0,
        "errors": []
    }


async def _ingest_catalysts(db: Session):
    """
    Mock catalysts ingestion. Replace with real data sources.
    """
    processed = 0
    inserted = 0
    errors = []
    
    try:
        # Mock: Generate sample catalysts
        companies = db.query(Company).limit(3).all()
        
        for company in companies:
            catalyst = Catalyst(
                name=f"Phase II Data Readout - {company.name}",
                title=f"Phase II Data Readout",
                company=company.name,
                drug=f"Drug-{random.randint(100, 999)}",
                kind="Clinical Data",
                event_type="Data Readout",
                date=datetime.utcnow(),
                probability=0.75,
                impact="High",
                description="Upcoming phase II trial data readout",
                status="Upcoming",
                source_url="https://example.com"
            )
            db.add(catalyst)
            inserted += 1
            processed += 1
        
        db.commit()
        
    except Exception as e:
        logger.error(f"Catalysts ingestion error: {e}")
        errors.append(str(e))
    
    return {
        "processed": processed,
        "inserted": inserted,
        "errors": errors
    }


@router.get("/ingestion-history")
async def get_ingestion_history(
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """
    Get ingestion history logs.
    """
    try:
        logs = db.query(DataIngestionLog).order_by(
            DataIngestionLog.start_time.desc()
        ).limit(limit).all()
        
        return {
            "logs": [
                {
                    "id": log.id,
                    "pipeline_name": log.pipeline_name,
                    "data_source": log.data_source,
                    "start_time": log.start_time.isoformat() if log.start_time else None,
                    "end_time": log.end_time.isoformat() if log.end_time else None,
                    "status": log.status,
                    "records_processed": log.records_processed,
                    "records_inserted": log.records_inserted,
                    "records_updated": log.records_updated,
                    "error_message": log.error_message
                }
                for log in logs
            ]
        }
        
    except Exception as e:
        logger.error(f"Error fetching ingestion history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

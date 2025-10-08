"""
Admin API Endpoints

Manual data ingestion and administrative operations.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import logging
import hashlib
import random

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

logger = logging.getLogger(__name__)

router = APIRouter()


class IngestRequest(BaseModel):
    source: str  # news, trials, catalysts, all
    

@router.post("/ingest")
async def manual_ingest(
    request: IngestRequest,
    db: Session = Depends(get_db)
):
    """
    Manual data ingestion endpoint. Performs on-demand data pulls only.
    No background jobs or cron schedulers.
    """
    start_time = datetime.utcnow()
    
    # Create ingestion log
    log = DataIngestionLog(
        pipeline_name="manual_ingest",
        data_source=request.source,
        start_time=start_time,
        status="running"
    )
    db.add(log)
    db.commit()
    
    try:
        results = {
            "source": request.source,
            "started_at": start_time.isoformat(),
            "records_processed": 0,
            "records_inserted": 0,
            "records_updated": 0,
            "errors": []
        }
        
        if request.source in ["news", "all"]:
            # Ingest news articles (mock implementation - replace with real scraping)
            news_result = await _ingest_news(db)
            results["records_processed"] += news_result["processed"]
            results["records_inserted"] += news_result["inserted"]
            if news_result.get("errors"):
                results["errors"].extend(news_result["errors"])
        
        if request.source in ["trials", "all"]:
            # Ingest clinical trials (mock implementation)
            trials_result = await _ingest_trials(db)
            results["records_processed"] += trials_result["processed"]
            results["records_inserted"] += trials_result["inserted"]
            if trials_result.get("errors"):
                results["errors"].extend(trials_result["errors"])
        
        if request.source in ["catalysts", "all"]:
            # Ingest catalysts (mock implementation)
            catalysts_result = await _ingest_catalysts(db)
            results["records_processed"] += catalysts_result["processed"]
            results["records_inserted"] += catalysts_result["inserted"]
            if catalysts_result.get("errors"):
                results["errors"].extend(catalysts_result["errors"])
        
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

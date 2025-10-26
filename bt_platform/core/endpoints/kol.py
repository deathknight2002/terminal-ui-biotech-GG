"""
KOL (Key Opinion Leader) Tracking API Endpoints
Provides endpoints for KOL signal ingestion, retrieval, and scoring
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import List, Optional
from datetime import datetime, timedelta
import subprocess
import json
import os
from pathlib import Path

from ..database import get_db, KOLSource, KOLProfile, KOLSignal, KOLScore, KOLAlgorithmRun
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/v1/kol", tags=["kol"])


# ============================================================================
# Pydantic Models
# ============================================================================

class KOLSourceResponse(BaseModel):
    id: int
    source_name: str
    source_type: str
    platform: Optional[str]
    is_active: bool
    reliability_score: float
    total_signals_collected: int

    class Config:
        from_attributes = True


class KOLProfileResponse(BaseModel):
    id: int
    name: str
    kol_type: str
    specialty: Optional[str]
    credibility_score: float
    influence_score: float
    accuracy_score: float
    total_signals: int

    class Config:
        from_attributes = True


class KOLSignalResponse(BaseModel):
    id: int
    source_id: int
    signal_type: str
    signal_text: str
    signal_sentiment: Optional[float]
    company_ticker: Optional[str]
    drug_name: Optional[str]
    signal_date: datetime
    quality_score: Optional[float]
    impact_score: Optional[float]

    class Config:
        from_attributes = True


class KOLScoreResponse(BaseModel):
    id: int
    entity_type: str
    entity_id: str
    entity_name: Optional[str]
    aggregate_sentiment: Optional[float]
    weighted_sentiment: Optional[float]
    confidence_score: Optional[float]
    signal_count: int
    score_date: datetime

    class Config:
        from_attributes = True


class KOLScraperTriggerRequest(BaseModel):
    scraper_names: Optional[List[str]] = Field(None, description="Specific scrapers to run, or all if None")
    output_file: Optional[str] = Field("kol_signals.json", description="Output file path")


# ============================================================================
# API Endpoints
# ============================================================================

@router.get("/sources", response_model=List[KOLSourceResponse])
async def list_kol_sources(
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    source_type: Optional[str] = Query(None, description="Filter by source type"),
    db: Session = Depends(get_db)
):
    """
    List all KOL data sources with health metrics
    """
    query = db.query(KOLSource)

    if is_active is not None:
        query = query.filter(KOLSource.is_active == is_active)

    if source_type:
        query = query.filter(KOLSource.source_type == source_type)

    sources = query.all()
    return sources


@router.get("/profiles", response_model=List[KOLProfileResponse])
async def list_kol_profiles(
    kol_type: Optional[str] = Query(None, description="Filter by KOL type"),
    specialty: Optional[str] = Query(None, description="Filter by specialty"),
    min_credibility: Optional[float] = Query(0.5, description="Minimum credibility score"),
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db)
):
    """
    List KOL profiles with credibility metrics
    """
    query = db.query(KOLProfile).filter(KOLProfile.is_active == True)

    if kol_type:
        query = query.filter(KOLProfile.kol_type == kol_type)

    if specialty:
        query = query.filter(KOLProfile.specialty == specialty)

    if min_credibility:
        query = query.filter(KOLProfile.credibility_score >= min_credibility)

    profiles = query.order_by(desc(KOLProfile.credibility_score)).limit(limit).all()
    return profiles


@router.get("/signals", response_model=List[KOLSignalResponse])
async def list_kol_signals(
    ticker: Optional[str] = Query(None, description="Filter by company ticker"),
    signal_type: Optional[str] = Query(None, description="Filter by signal type"),
    days_back: int = Query(30, description="Days to look back"),
    min_quality: Optional[float] = Query(0.5, description="Minimum quality score"),
    limit: int = Query(100, le=1000),
    db: Session = Depends(get_db)
):
    """
    Retrieve KOL signals with filters
    """
    cutoff_date = datetime.utcnow() - timedelta(days=days_back)

    query = db.query(KOLSignal).filter(KOLSignal.signal_date >= cutoff_date)

    if ticker:
        query = query.filter(KOLSignal.company_ticker == ticker.upper())

    if signal_type:
        query = query.filter(KOLSignal.signal_type == signal_type)

    if min_quality:
        query = query.filter(KOLSignal.quality_score >= min_quality)

    signals = query.order_by(desc(KOLSignal.signal_date)).limit(limit).all()
    return signals


@router.get("/scores", response_model=List[KOLScoreResponse])
async def list_kol_scores(
    entity_type: str = Query("company", description="Entity type: company, drug, or catalyst"),
    lookback_days: int = Query(30, description="Days of signals to consider"),
    min_signal_count: int = Query(3, description="Minimum number of signals"),
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db)
):
    """
    Get ranked entities by KOL scores
    """
    cutoff_date = datetime.utcnow() - timedelta(days=lookback_days)

    query = db.query(KOLScore).filter(
        KOLScore.entity_type == entity_type,
        KOLScore.score_date >= cutoff_date,
        KOLScore.signal_count >= min_signal_count
    )

    # Order by weighted sentiment (most bullish first)
    scores = query.order_by(desc(KOLScore.weighted_sentiment)).limit(limit).all()
    return scores


@router.post("/scrape", status_code=status.HTTP_202_ACCEPTED)
async def trigger_kol_scraping(
    request: KOLScraperTriggerRequest,
    db: Session = Depends(get_db)
):
    """
    Trigger Java scrapers to collect fresh KOL signals
    Returns immediately - scraping happens asynchronously
    """
    try:
        # Path to Java scraper JAR
        java_scrapers_dir = Path(__file__).parent.parent.parent.parent / "backend" / "java-scrapers"
        jar_path = java_scrapers_dir / "target" / "kol-scrapers-1.0.0.jar"
        output_path = java_scrapers_dir / request.output_file

        # Check if JAR exists
        if not jar_path.exists():
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Java scraper JAR not found at {jar_path}. Run 'mvn package' first."
            )

        # Run Java scrapers in background
        # In production, use a task queue like Celery or RQ
        subprocess.Popen(
            ["java", "-jar", str(jar_path), str(output_path)],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )

        return {
            "status": "scraping_started",
            "message": "KOL scraping job started in background",
            "output_file": str(output_path),
            "estimated_time_seconds": 120
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start scraping: {str(e)}"
        )


@router.post("/ingest", status_code=status.HTTP_201_CREATED)
async def ingest_kol_signals(
    file_path: str = Query(..., description="Path to JSON file with scraped signals"),
    db: Session = Depends(get_db)
):
    """
    Ingest KOL signals from Java scraper output file
    """
    try:
        # Read JSON file
        with open(file_path, 'r') as f:
            data = json.load(f)

        signals_data = data.get('signals', [])
        ingested_count = 0
        skipped_count = 0

        for signal_data in signals_data:
            try:
                # Check if signal already exists (by URL or unique identifier)
                existing = db.query(KOLSignal).filter(
                    KOLSignal.post_url == signal_data.get('post_url')
                ).first()

                if existing:
                    skipped_count += 1
                    continue

                # Get or create source
                source = db.query(KOLSource).filter(
                    KOLSource.source_name == signal_data.get('source_name')
                ).first()

                if not source:
                    source = KOLSource(
                        source_name=signal_data.get('source_name', 'Unknown'),
                        source_type='news',
                        is_active=True,
                        reliability_score=0.8
                    )
                    db.add(source)
                    db.flush()

                # Create signal
                signal = KOLSignal(
                    source_id=source.id,
                    signal_type=signal_data.get('signal_type', 'neutral'),
                    signal_text=signal_data.get('signal_text', ''),
                    signal_sentiment=signal_data.get('signal_sentiment'),
                    company_ticker=signal_data.get('company_ticker'),
                    drug_name=signal_data.get('drug_name'),
                    signal_date=datetime.fromisoformat(signal_data.get('signal_date')) if signal_data.get('signal_date') else datetime.utcnow(),
                    platform=signal_data.get('platform'),
                    post_url=signal_data.get('post_url'),
                    quality_score=signal_data.get('quality_score'),
                    impact_score=signal_data.get('impact_score'),
                    confidence_level=signal_data.get('confidence_level'),
                    raw_data=signal_data.get('raw_data')
                )

                db.add(signal)
                ingested_count += 1

            except Exception as e:
                print(f"Failed to ingest signal: {e}")
                continue

        db.commit()

        return {
            "status": "success",
            "signals_ingested": ingested_count,
            "signals_skipped": skipped_count,
            "total_processed": len(signals_data)
        }

    except FileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"File not found: {file_path}"
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to ingest signals: {str(e)}"
        )


@router.get("/health")
async def kol_system_health(db: Session = Depends(get_db)):
    """
    Get overall health status of KOL tracking system
    """
    try:
        total_sources = db.query(func.count(KOLSource.id)).scalar()
        active_sources = db.query(func.count(KOLSource.id)).filter(KOLSource.is_active == True).scalar()

        total_signals = db.query(func.count(KOLSignal.id)).scalar()
        recent_signals = db.query(func.count(KOLSignal.id)).filter(
            KOLSignal.signal_date >= datetime.utcnow() - timedelta(days=7)
        ).scalar()

        avg_quality = db.query(func.avg(KOLSignal.quality_score)).filter(
            KOLSignal.signal_date >= datetime.utcnow() - timedelta(days=30)
        ).scalar()

        return {
            "status": "healthy",
            "total_sources": total_sources,
            "active_sources": active_sources,
            "total_signals": total_signals,
            "signals_last_7_days": recent_signals,
            "avg_signal_quality_30d": float(avg_quality) if avg_quality else 0.0,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }

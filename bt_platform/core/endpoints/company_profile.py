"""
Company Profile API Endpoints

Comprehensive company profile endpoints for XBI constituents and biotech companies.
Provides FactSet/CapIQ-level detail including sources, articles, ownership, pipeline, and financials.
"""

import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import desc, func, or_
from sqlalchemy.orm import Session

from ..database import (
    Catalyst,
    Company,
    CompanyArticle,
    CompanyOwnership,
    CompanySource,
    Drug,
    MarketData,
    get_db,
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/companies/{ticker}/profile")
async def get_company_profile(
    ticker: str,
    db: Session = Depends(get_db)
):
    """
    Get comprehensive company profile for a given ticker.
    
    Returns:
    - Company basic info (name, type, headquarters, etc.)
    - Financial metrics (market cap, enterprise value, cash position)
    - XBI membership status
    - Latest stock price
    - Company description and links
    """
    # Get company
    company = db.query(Company).filter(Company.ticker == ticker.upper()).first()

    if not company:
        raise HTTPException(status_code=404, detail=f"Company with ticker {ticker} not found")

    # Get latest market data
    latest_market_data = (
        db.query(MarketData)
        .filter(MarketData.ticker == ticker.upper())
        .order_by(desc(MarketData.timestamp))
        .first()
    )

    # Count pipeline programs
    pipeline_count = db.query(func.count(Drug.id)).filter(Drug.company == company.name).scalar() or 0

    # Count active catalysts
    active_catalysts_count = (
        db.query(func.count(Catalyst.id))
        .filter(
            Catalyst.company == company.name,
            Catalyst.date >= datetime.utcnow()
        )
        .scalar() or 0
    )

    return {
        "ticker": company.ticker,
        "name": company.name,
        "company_type": company.company_type,
        "description": company.description,
        "website": company.website,
        "investor_relations_url": company.investor_relations_url,
        "headquarters": company.headquarters,
        "founded_year": company.founded,
        "employees": company.employees,
        "financials": {
            "market_cap": company.market_cap,
            "enterprise_value": None,  # TODO: Calculate from latest data
            "cash_position": None,  # TODO: Get from latest filings
            "latest_price": latest_market_data.close_price if latest_market_data else None,
            "price_change": None,  # TODO: Calculate day change
            "volume": latest_market_data.volume if latest_market_data else None,
        },
        "xbi_membership": {
            "is_constituent": company.is_xbi_constituent,
            "added_date": company.xbi_added_date.isoformat() if company.xbi_added_date else None,
            "removed_date": company.xbi_removed_date.isoformat() if company.xbi_removed_date else None,
        },
        "pipeline": {
            "program_count": pipeline_count,
            "therapeutic_areas": company.therapeutic_areas.split(",") if company.therapeutic_areas else [],
        },
        "catalysts": {
            "upcoming_count": active_catalysts_count,
        },
        "updated_at": company.created_at.isoformat() if company.created_at else None,
    }


@router.get("/companies/{ticker}/sources")
async def get_company_sources(
    ticker: str,
    source_type: Optional[str] = Query(None, description="Filter by source type"),
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db)
):
    """
    Get company sources (investor presentations, press releases, filings).
    
    Source types: PRESENTATION, PRESS_RELEASE, IR_MATERIAL, FILING
    """
    # Get company
    company = db.query(Company).filter(Company.ticker == ticker.upper()).first()

    if not company:
        raise HTTPException(status_code=404, detail=f"Company with ticker {ticker} not found")

    # Build query
    query = db.query(CompanySource).filter(CompanySource.company_id == company.id)

    if source_type:
        query = query.filter(CompanySource.source_type == source_type.upper())

    sources = query.order_by(desc(CompanySource.published_date)).limit(limit).all()

    return {
        "ticker": ticker,
        "sources": [
            {
                "id": source.id,
                "type": source.source_type,
                "title": source.title,
                "url": source.url,
                "published_date": source.published_date.isoformat() if source.published_date else None,
                "description": source.description,
                "filing_type": source.filing_type,
                "accession_number": source.accession_number,
            }
            for source in sources
        ],
        "count": len(sources),
    }


@router.get("/companies/{ticker}/articles")
async def get_company_articles(
    ticker: str,
    days: int = Query(90, description="Number of days to look back"),
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db)
):
    """
    Get recent news articles about the company.
    """
    # Get company
    company = db.query(Company).filter(Company.ticker == ticker.upper()).first()

    if not company:
        raise HTTPException(status_code=404, detail=f"Company with ticker {ticker} not found")

    # Calculate date threshold
    since_date = datetime.utcnow() - timedelta(days=days)

    # Get articles
    articles = (
        db.query(CompanyArticle)
        .filter(
            CompanyArticle.company_id == company.id,
            CompanyArticle.published_date >= since_date
        )
        .order_by(desc(CompanyArticle.published_date))
        .limit(limit)
        .all()
    )

    return {
        "ticker": ticker,
        "articles": [
            {
                "id": article.id,
                "title": article.title,
                "source": article.source,
                "url": article.url,
                "published_date": article.published_date.isoformat() if article.published_date else None,
                "summary": article.summary,
                "relevance_score": article.relevance_score,
                "sentiment_score": article.sentiment_score,
            }
            for article in articles
        ],
        "count": len(articles),
        "days": days,
    }


@router.get("/companies/{ticker}/ownership")
async def get_company_ownership(
    ticker: str,
    top_n: int = Query(20, description="Number of top holders to return"),
    db: Session = Depends(get_db)
):
    """
    Get institutional ownership snapshot for the company.
    """
    # Get company
    company = db.query(Company).filter(Company.ticker == ticker.upper()).first()

    if not company:
        raise HTTPException(status_code=404, detail=f"Company with ticker {ticker} not found")

    # Get latest reporting date
    latest_date = (
        db.query(func.max(CompanyOwnership.reporting_date))
        .filter(CompanyOwnership.company_id == company.id)
        .scalar()
    )

    if not latest_date:
        return {
            "ticker": ticker,
            "ownership": [],
            "count": 0,
            "reporting_date": None,
            "total_institutional_ownership": 0.0,
        }

    # Get ownership records for latest date
    ownership_records = (
        db.query(CompanyOwnership)
        .filter(
            CompanyOwnership.company_id == company.id,
            CompanyOwnership.reporting_date == latest_date
        )
        .order_by(desc(CompanyOwnership.shares_held))
        .limit(top_n)
        .all()
    )

    # Calculate total institutional ownership
    total_percent = sum(record.percent_owned or 0 for record in ownership_records)

    return {
        "ticker": ticker,
        "ownership": [
            {
                "institution_name": record.institution_name,
                "shares_held": record.shares_held,
                "percent_owned": record.percent_owned,
                "value_usd": record.value_usd,
                "shares_change": record.shares_change,
                "percent_change": record.percent_change,
                "form_type": record.form_type,
            }
            for record in ownership_records
        ],
        "count": len(ownership_records),
        "reporting_date": latest_date.isoformat() if latest_date else None,
        "total_institutional_ownership": round(total_percent, 2),
    }


@router.get("/companies/{ticker}/pipeline")
async def get_company_pipeline(
    ticker: str,
    db: Session = Depends(get_db)
):
    """
    Get drug pipeline for the company, grouped by therapeutic area.
    """
    # Get company
    company = db.query(Company).filter(Company.ticker == ticker.upper()).first()

    if not company:
        raise HTTPException(status_code=404, detail=f"Company with ticker {ticker} not found")

    # Get all drugs for this company
    drugs = db.query(Drug).filter(Drug.company == company.name).all()

    # Group by therapeutic area
    pipeline_by_ta: Dict[str, List[Dict[str, Any]]] = {}

    for drug in drugs:
        ta = drug.therapeutic_area or "Unknown"

        if ta not in pipeline_by_ta:
            pipeline_by_ta[ta] = []

        pipeline_by_ta[ta].append({
            "id": drug.id,
            "name": drug.name,
            "generic_name": drug.generic_name,
            "indication": drug.indication,
            "phase": drug.phase,
            "mechanism": drug.mechanism,
            "target": drug.target,
            "status": drug.status,
        })

    # Convert to list format with counts
    pipeline_data = [
        {
            "therapeutic_area": ta,
            "programs": programs,
            "count": len(programs),
        }
        for ta, programs in pipeline_by_ta.items()
    ]

    return {
        "ticker": ticker,
        "company": company.name,
        "pipeline": pipeline_data,
        "total_programs": len(drugs),
    }


@router.get("/companies/{ticker}/catalysts")
async def get_company_catalysts(
    ticker: str,
    upcoming_days: int = Query(90, description="Number of days to look ahead"),
    db: Session = Depends(get_db)
):
    """
    Get upcoming catalysts for the company.
    """
    # Get company
    company = db.query(Company).filter(Company.ticker == ticker.upper()).first()

    if not company:
        raise HTTPException(status_code=404, detail=f"Company with ticker {ticker} not found")

    # Calculate date range
    start_date = datetime.utcnow()
    end_date = start_date + timedelta(days=upcoming_days)

    # Get catalysts
    catalysts = (
        db.query(Catalyst)
        .filter(
            Catalyst.company == company.name,
            Catalyst.date >= start_date,
            Catalyst.date <= end_date
        )
        .order_by(Catalyst.date)
        .all()
    )

    return {
        "ticker": ticker,
        "company": company.name,
        "catalysts": [
            {
                "id": catalyst.id,
                "title": catalyst.title or catalyst.name,
                "event_type": catalyst.event_type,
                "date": catalyst.date.isoformat() if catalyst.date else None,
                "drug": catalyst.drug,
                "description": catalyst.description,
                "probability": catalyst.probability,
                "impact": catalyst.impact,
                "source_url": catalyst.source_url,
            }
            for catalyst in catalysts
        ],
        "count": len(catalysts),
        "date_range": {
            "start": start_date.isoformat(),
            "end": end_date.isoformat(),
        },
    }


@router.get("/companies/{ticker}/stock-chart")
async def get_company_stock_chart(
    ticker: str,
    days: int = Query(90, description="Number of days of price history"),
    db: Session = Depends(get_db)
):
    """
    Get stock price history for charting.
    """
    # Calculate date threshold
    since_date = datetime.utcnow() - timedelta(days=days)

    # Get price data
    price_data = (
        db.query(MarketData)
        .filter(
            MarketData.ticker == ticker.upper(),
            MarketData.timestamp >= since_date
        )
        .order_by(MarketData.timestamp)
        .all()
    )

    if not price_data:
        return {
            "ticker": ticker,
            "prices": [],
            "count": 0,
            "days": days,
        }

    return {
        "ticker": ticker,
        "prices": [
            {
                "date": data.timestamp.isoformat() if data.timestamp else None,
                "open": data.open_price,
                "high": data.high_price,
                "low": data.low_price,
                "close": data.close_price,
                "volume": data.volume,
            }
            for data in price_data
        ],
        "count": len(price_data),
        "days": days,
    }


@router.get("/companies/xbi/constituents")
async def get_xbi_constituents(
    active_only: bool = Query(True, description="Only return current constituents"),
    search: Optional[str] = Query(None, description="Search by company name or ticker"),
    company_type: Optional[str] = Query(None, description="Filter by company type"),
    min_market_cap: Optional[float] = Query(None, description="Minimum market cap in USD"),
    max_market_cap: Optional[float] = Query(None, description="Maximum market cap in USD"),
    limit: int = Query(200, description="Maximum results to return"),
    offset: int = Query(0, description="Results offset for pagination"),
    db: Session = Depends(get_db)
):
    """
    Get list of XBI (SPDR S&P Biotech ETF) constituents with search and filter options.
    """
    query = db.query(Company)

    if active_only:
        query = query.filter(
            Company.is_xbi_constituent == True,
            or_(
                Company.xbi_removed_date == None,
                Company.xbi_removed_date > datetime.utcnow()
            )
        )
    else:
        query = query.filter(Company.is_xbi_constituent == True)

    # Apply search filter
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Company.name.ilike(search_term),
                Company.ticker.ilike(search_term)
            )
        )

    # Apply company type filter
    if company_type:
        query = query.filter(Company.company_type == company_type)

    # Apply market cap filters
    if min_market_cap is not None:
        query = query.filter(Company.market_cap >= min_market_cap)
    if max_market_cap is not None:
        query = query.filter(Company.market_cap <= max_market_cap)

    # Get total count before pagination
    total_count = query.count()

    # Apply ordering and pagination
    companies = query.order_by(Company.market_cap.desc()).limit(limit).offset(offset).all()

    return {
        "constituents": [
            {
                "ticker": company.ticker,
                "name": company.name,
                "company_type": company.company_type,
                "market_cap": company.market_cap,
                "headquarters": company.headquarters,
                "therapeutic_areas": company.therapeutic_areas.split(",") if company.therapeutic_areas else [],
                "is_current": company.xbi_removed_date is None or company.xbi_removed_date > datetime.utcnow(),
                "added_date": company.xbi_added_date.isoformat() if company.xbi_added_date else None,
                "removed_date": company.xbi_removed_date.isoformat() if company.xbi_removed_date else None,
            }
            for company in companies
        ],
        "count": len(companies),
        "total": total_count,
        "limit": limit,
        "offset": offset,
        "active_only": active_only,
        "filters": {
            "search": search,
            "company_type": company_type,
            "min_market_cap": min_market_cap,
            "max_market_cap": max_market_cap,
        }
    }

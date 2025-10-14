# Sprint 1: Portfolio Foundation - Proof of Concept
## 13F Scraper + Portfolio API Implementation Guide

> **Duration:** 2 weeks  
> **Team:** 2 Backend Engineers + 1 Full-Stack Engineer + Technical Lead  
> **Goal:** Demonstrate automated Redmile holdings tracking via SEC 13F filings

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Implementation Steps](#implementation-steps)
4. [Testing Strategy](#testing-strategy)
5. [Demo Preparation](#demo-preparation)
6. [Success Criteria](#success-criteria)

---

## Overview

Sprint 1 delivers the foundational capability for portfolio-centric catalyst intelligence: **automated tracking of Redmile Group's public holdings through SEC 13F-HR filings**.

### What We're Building

1. **SEC 13F Scraper**: Discovers and parses quarterly institutional holdings filings
2. **Portfolio Database Model**: Stores holdings with historical tracking
3. **Portfolio API**: RESTful endpoints for holdings, history, and sync
4. **Testing Infrastructure**: Unit, integration, and E2E tests
5. **Documentation**: API docs and usage examples

### Business Value

- **Automates** quarterly holdings analysis (currently manual)
- **Surfaces** position changes (new, adds, trims, exits)
- **Enables** portfolio-filtered catalyst view (only what matters)
- **Provides** conviction signals (is Redmile adding before catalyst?)

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     SEC EDGAR API                           │
│          https://www.sec.gov/cgi-bin/browse-edgar          │
└─────────────────────────────────────────────────────────────┘
                            ↓ (HTTP GET with rate limiting)
┌─────────────────────────────────────────────────────────────┐
│                  SEC13FScraper Class                        │
│  ┌─────────────┬──────────────┬──────────────────────┐     │
│  │ discover()  │  fetch()     │  parse()             │     │
│  │ Find 13F    │  Download    │  Extract holdings    │     │
│  │ filings     │  XML files   │  from XML            │     │
│  └─────────────┴──────────────┴──────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ↓ (Structured data)
┌─────────────────────────────────────────────────────────────┐
│              PortfolioHolding Database Model                │
│  Fields: ticker, company, shares, value, date, change       │
└─────────────────────────────────────────────────────────────┘
                            ↓ (SQLAlchemy ORM)
┌─────────────────────────────────────────────────────────────┐
│                   Portfolio API Endpoints                   │
│  GET  /api/v1/portfolio/redmile/holdings                    │
│  GET  /api/v1/portfolio/redmile/holdings/history            │
│  POST /api/v1/portfolio/redmile/sync                        │
└─────────────────────────────────────────────────────────────┘
                            ↓ (JSON responses)
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Consumers                       │
│  Terminal App, Mobile App, CLI Tools                        │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Python 3.9+**: Core language
- **FastAPI**: Web framework for API endpoints
- **SQLAlchemy**: ORM for database operations
- **PostgreSQL**: Primary database (SQLite for dev/test)
- **aiohttp**: Async HTTP client for scraping
- **BeautifulSoup4**: XML/HTML parsing
- **pytest**: Testing framework
- **Pydantic**: Data validation

### Database Schema

```sql
CREATE TABLE portfolio_holdings (
    id SERIAL PRIMARY KEY,
    
    -- Fund Information
    fund_cik VARCHAR(20) NOT NULL,
    fund_name VARCHAR(200) NOT NULL,
    
    -- Filing Information
    filing_date DATE NOT NULL,
    period_of_report DATE NOT NULL,
    
    -- Security Information
    cusip VARCHAR(9) NOT NULL,
    ticker VARCHAR(10),
    company_name VARCHAR(200) NOT NULL,
    
    -- Position Details
    shares BIGINT NOT NULL,
    market_value BIGINT NOT NULL,  -- in USD
    weight_pct DECIMAL(5,2),       -- portfolio weight
    
    -- Change Tracking
    shares_change BIGINT,          -- vs previous quarter
    value_change BIGINT,           -- vs previous quarter
    change_type VARCHAR(20),       -- 'NEW', 'ADD', 'TRIM', 'EXIT'
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_fund_ticker (fund_cik, ticker),
    INDEX idx_filing_date (filing_date),
    INDEX idx_ticker (ticker),
    UNIQUE KEY unique_holding (fund_cik, period_of_report, cusip)
);
```

---

## Implementation Steps

### Phase 1: Database Model (Days 1-2)

#### Step 1.1: Create PortfolioHolding Model

Create `bt_platform/core/database.py` (or extend existing file):

```python
"""
Database models for portfolio tracking
"""

from sqlalchemy import Column, String, Integer, BigInteger, Date, DateTime, Numeric, Text
from sqlalchemy.sql import func
from .database import Base


class PortfolioHolding(Base):
    """Model for institutional portfolio holdings from 13F filings"""
    
    __tablename__ = "portfolio_holdings"
    
    # Primary Key
    id = Column(Integer, primary_key=True, index=True)
    
    # Fund Information
    fund_cik = Column(String(20), nullable=False, index=True)
    fund_name = Column(String(200), nullable=False)
    
    # Filing Information
    filing_date = Column(Date, nullable=False, index=True)
    period_of_report = Column(Date, nullable=False, index=True)
    
    # Security Information
    cusip = Column(String(9), nullable=False)
    ticker = Column(String(10), index=True)
    company_name = Column(String(200), nullable=False)
    
    # Position Details
    shares = Column(BigInteger, nullable=False)
    market_value = Column(BigInteger, nullable=False)  # USD
    weight_pct = Column(Numeric(5, 2))
    
    # Change Tracking
    shares_change = Column(BigInteger)
    value_change = Column(BigInteger)
    change_type = Column(String(20))  # NEW, ADD, TRIM, EXIT
    
    # Metadata
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<PortfolioHolding(ticker={self.ticker}, shares={self.shares}, date={self.period_of_report})>"
```

#### Step 1.2: Create Migration

Create `bt_platform/migrations/versions/001_add_portfolio_holdings.py`:

```python
"""Add portfolio holdings table

Revision ID: 001
Create Date: 2025-10-14

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '001'
down_revision = None


def upgrade():
    op.create_table(
        'portfolio_holdings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('fund_cik', sa.String(20), nullable=False),
        sa.Column('fund_name', sa.String(200), nullable=False),
        sa.Column('filing_date', sa.Date(), nullable=False),
        sa.Column('period_of_report', sa.Date(), nullable=False),
        sa.Column('cusip', sa.String(9), nullable=False),
        sa.Column('ticker', sa.String(10), nullable=True),
        sa.Column('company_name', sa.String(200), nullable=False),
        sa.Column('shares', sa.BigInteger(), nullable=False),
        sa.Column('market_value', sa.BigInteger(), nullable=False),
        sa.Column('weight_pct', sa.Numeric(5, 2), nullable=True),
        sa.Column('shares_change', sa.BigInteger(), nullable=True),
        sa.Column('value_change', sa.BigInteger(), nullable=True),
        sa.Column('change_type', sa.String(20), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Indexes
    op.create_index('idx_fund_ticker', 'portfolio_holdings', ['fund_cik', 'ticker'])
    op.create_index('idx_filing_date', 'portfolio_holdings', ['filing_date'])
    op.create_index('idx_ticker', 'portfolio_holdings', ['ticker'])
    
    # Unique constraint
    op.create_index(
        'unique_holding',
        'portfolio_holdings',
        ['fund_cik', 'period_of_report', 'cusip'],
        unique=True
    )


def downgrade():
    op.drop_table('portfolio_holdings')
```

### Phase 2: SEC 13F Scraper (Days 3-5)

#### Step 2.1: Create Scraper Interface

Create `bt_platform/scrapers/sites/sec_13f_scraper.py`:

```python
"""
SEC 13F Holdings Scraper

Extracts institutional holdings from quarterly 13F-HR filings.
Focuses on biotech/pharma positions for Redmile Group.
"""

from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import re
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup
import aiohttp
import asyncio
from dataclasses import dataclass

from bt_platform.scrapers.base.interface import ScraperInterface, ScraperResult, ContentType


@dataclass
class Filing13F:
    """Represents a 13F-HR filing"""
    accession_number: str
    filing_date: datetime
    period_of_report: datetime
    manager_name: str
    manager_cik: str
    xml_url: str


@dataclass
class Holding:
    """Represents a single holding"""
    name: str
    cusip: str
    ticker: Optional[str]
    shares: int
    value: int  # USD thousands
    


class SEC13FScraper(ScraperInterface):
    """Scraper for SEC 13F filings"""
    
    REDMILE_CIK = "0001454691"
    BASE_URL = "https://www.sec.gov"
    MAX_REQUESTS_PER_SECOND = 10  # SEC rate limit
    USER_AGENT = "Biotech Terminal Platform research@bioterminal.com"
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        super().__init__(config)
        self.cik = config.get('cik', self.REDMILE_CIK) if config else self.REDMILE_CIK
        self.include_sectors = config.get('sectors', ['Biotechnology', 'Pharmaceuticals', 'Life Sciences']) if config else ['Biotechnology', 'Pharmaceuticals', 'Life Sciences']
        self.session: Optional[aiohttp.ClientSession] = None
        
    async def _get_session(self) -> aiohttp.ClientSession:
        """Get or create aiohttp session"""
        if self.session is None or self.session.closed:
            self.session = aiohttp.ClientSession(
                headers={
                    'User-Agent': self.USER_AGENT,
                    'Accept': 'application/xml, text/html, */*',
                    'Accept-Encoding': 'gzip, deflate',
                }
            )
        return self.session
    
    async def discover(self, method: str = "rss", **kwargs) -> List[str]:
        """
        Discover 13F filing URLs for a CIK
        
        Returns list of 13F-HR filing URLs
        """
        session = await self._get_session()
        
        # Build EDGAR search URL
        search_url = (
            f"{self.BASE_URL}/cgi-bin/browse-edgar?"
            f"action=getcompany&CIK={self.cik}&type=13F&"
            f"dateb=&owner=exclude&count=10&output=atom"
        )
        
        filings = []
        
        try:
            async with session.get(search_url) as response:
                if response.status != 200:
                    raise Exception(f"SEC EDGAR returned status {response.status}")
                
                xml_content = await response.text()
                
                # Parse Atom feed
                soup = BeautifulSoup(xml_content, 'xml')
                entries = soup.find_all('entry')
                
                for entry in entries:
                    title = entry.find('title').text if entry.find('title') else ''
                    
                    # Only process 13F-HR filings
                    if '13F-HR' not in title:
                        continue
                    
                    link = entry.find('link', {'rel': 'alternate'})
                    if link and 'href' in link.attrs:
                        filing_url = link['href']
                        
                        # Extract accession number
                        accession_match = re.search(r'/(\d{10}-\d{2}-\d{6})/', filing_url)
                        if accession_match:
                            filings.append(filing_url)
                
        except Exception as e:
            print(f"Error discovering filings: {e}")
            raise
        
        return filings
    
    async def fetch(self, urls: List[str], batch_size: int = 5) -> List[Dict[str, Any]]:
        """
        Fetch 13F-HR XML files
        
        Respects SEC rate limits (10 requests per second max)
        """
        session = await self._get_session()
        results = []
        
        for i in range(0, len(urls), batch_size):
            batch = urls[i:i + batch_size]
            
            tasks = []
            for url in batch:
                tasks.append(self._fetch_filing(session, url))
            
            batch_results = await asyncio.gather(*tasks, return_exceptions=True)
            
            for result in batch_results:
                if isinstance(result, Exception):
                    print(f"Error fetching filing: {result}")
                else:
                    results.append(result)
            
            # Rate limiting: wait 0.1 seconds per request (10 req/sec)
            await asyncio.sleep(0.1 * len(batch))
        
        return results
    
    async def _fetch_filing(self, session: aiohttp.ClientSession, filing_url: str) -> Dict[str, Any]:
        """Fetch a single 13F filing"""
        
        # Get filing index page
        async with session.get(filing_url) as response:
            if response.status != 200:
                raise Exception(f"Failed to fetch filing: {response.status}")
            
            html_content = await response.text()
        
        # Parse to find XML link
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Find information table link
        info_table_link = None
        for link in soup.find_all('a'):
            href = link.get('href', '')
            if 'informationtable.xml' in href.lower() or 'infotable.xml' in href.lower():
                info_table_link = href
                break
        
        if not info_table_link:
            raise Exception("Could not find information table XML")
        
        # Make URL absolute
        if not info_table_link.startswith('http'):
            info_table_link = self.BASE_URL + info_table_link
        
        # Fetch XML
        async with session.get(info_table_link) as xml_response:
            if xml_response.status != 200:
                raise Exception(f"Failed to fetch XML: {xml_response.status}")
            
            xml_content = await xml_response.text()
        
        return {
            'filing_url': filing_url,
            'xml_url': info_table_link,
            'xml_content': xml_content,
        }
    
    async def parse(self, raw_content: Dict[str, Any]) -> Dict[str, Any]:
        """
        Parse 13F-HR XML to extract holdings
        
        Returns:
        {
            'filing_date': '2024-11-15',
            'period_of_report': '2024-09-30',
            'manager_name': 'Redmile Group, LLC',
            'holdings': [
                {
                    'name': 'Vertex Pharmaceuticals Inc',
                    'ticker': 'VRTX',
                    'cusip': '92532F100',
                    'shares': 1234567,
                    'value': 123456,  # USD thousands
                },
                ...
            ]
        }
        """
        xml_content = raw_content['xml_content']
        
        # Parse XML
        try:
            root = ET.fromstring(xml_content)
        except ET.ParseError as e:
            raise Exception(f"Failed to parse XML: {e}")
        
        # Extract filing metadata
        filing_date = None
        period_of_report = None
        manager_name = None
        
        # Try to find header information
        for elem in root.iter():
            if 'filingDate' in elem.tag or 'FILING-DATE' in elem.tag:
                filing_date = elem.text
            if 'period' in elem.tag.lower() or 'PERIOD-OF-REPORT' in elem.tag:
                period_of_report = elem.text
            if 'name' in elem.tag.lower() and manager_name is None:
                manager_name = elem.text
        
        # Extract holdings
        holdings = []
        
        for info_table in root.iter():
            if 'infoTable' in info_table.tag or 'INFOTABLE' in info_table.tag:
                holding = self._parse_holding(info_table)
                if holding:
                    holdings.append(holding)
        
        return {
            'filing_date': filing_date,
            'period_of_report': period_of_report,
            'manager_name': manager_name or 'Unknown',
            'manager_cik': self.cik,
            'holdings': holdings,
        }
    
    def _parse_holding(self, info_table: ET.Element) -> Optional[Dict[str, Any]]:
        """Parse a single holding from XML"""
        holding = {
            'name': None,
            'cusip': None,
            'ticker': None,
            'shares': 0,
            'value': 0,
        }
        
        for elem in info_table:
            tag = elem.tag.split('}')[-1]  # Remove namespace
            
            if 'nameOfIssuer' in tag or 'NAME-OF-ISSUER' in tag:
                holding['name'] = elem.text
            elif 'cusip' in tag.lower():
                holding['cusip'] = elem.text
            elif 'titleOfClass' in tag or 'TITLE-OF-CLASS' in tag:
                # Try to extract ticker from title
                text = elem.text or ''
                ticker_match = re.search(r'\b([A-Z]{1,5})\b', text)
                if ticker_match:
                    holding['ticker'] = ticker_match.group(1)
            elif 'shrsOrPrnAmt' in tag or 'SHARES-OR-PRN-AMT' in tag:
                for sub in elem:
                    if 'sshPrnamt' in sub.tag or 'SSH-PRNAMT' in sub.tag:
                        try:
                            holding['shares'] = int(sub.text or 0)
                        except ValueError:
                            pass
            elif 'value' in tag.lower() and 'VALUE' in tag:
                try:
                    holding['value'] = int(elem.text or 0)
                except ValueError:
                    pass
        
        # Validate holding
        if holding['name'] and holding['cusip'] and holding['shares'] > 0:
            return holding
        
        return None
    
    async def close(self):
        """Close aiohttp session"""
        if self.session and not self.session.closed:
            await self.session.close()
```

#### Step 2.2: Add Ticker Lookup

Create `bt_platform/utils/ticker_lookup.py`:

```python
"""
Ticker lookup utilities using CUSIP
"""

from typing import Optional
import aiohttp
from functools import lru_cache


class TickerLookup:
    """Lookup ticker symbols from CUSIP"""
    
    # Simple in-memory cache for development
    # In production, use Redis or database
    _cache = {}
    
    @classmethod
    @lru_cache(maxsize=10000)
    def cusip_to_ticker(cls, cusip: str) -> Optional[str]:
        """
        Convert CUSIP to ticker symbol
        
        For Sprint 1, we'll use a simple mapping for known biotechs.
        In Sprint 2, integrate with proper ticker API.
        """
        # Known biotech CUSIPs (partial list for demo)
        known_cusips = {
            '92532F100': 'VRTX',  # Vertex Pharmaceuticals
            '46107B109': 'IONS',  # Ionis Pharmaceuticals
            '09061G101': 'BGNE',  # BeiGene
            '22052L104': 'CRSP',  # CRISPR Therapeutics
            '14448C104': 'CMPS',  # Compass Pathways
            # Add more as needed
        }
        
        return known_cusips.get(cusip)
```

### Phase 3: Portfolio API (Days 6-8)

#### Step 3.1: Create Portfolio Endpoints

Create `bt_platform/core/endpoints/portfolio.py`:

```python
"""
Portfolio API Endpoints

RESTful API for institutional portfolio holdings
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import List, Optional
from datetime import datetime, timedelta

from ..database import get_db, PortfolioHolding
from bt_platform.scrapers.sites.sec_13f_scraper import SEC13FScraper


router = APIRouter()


@router.get("/redmile/holdings")
async def get_redmile_holdings(
    date: Optional[str] = Query(None, description="Specific filing date (YYYY-MM-DD)"),
    ticker: Optional[str] = Query(None, description="Filter by ticker"),
    min_value: Optional[int] = Query(None, description="Minimum position value (USD thousands)"),
    db: Session = Depends(get_db)
):
    """
    Get Redmile Group's current or historical holdings
    
    Returns the most recent 13F filing unless a specific date is provided.
    """
    query = db.query(PortfolioHolding).filter(
        PortfolioHolding.fund_cik == SEC13FScraper.REDMILE_CIK
    )
    
    if date:
        # Specific date
        query = query.filter(PortfolioHolding.filing_date == date)
    else:
        # Most recent filing
        latest_date = db.query(func.max(PortfolioHolding.filing_date)).filter(
            PortfolioHolding.fund_cik == SEC13FScraper.REDMILE_CIK
        ).scalar()
        
        if not latest_date:
            return {
                'total_positions': 0,
                'total_value': 0,
                'filing_date': None,
                'period_of_report': None,
                'holdings': []
            }
        
        query = query.filter(PortfolioHolding.filing_date == latest_date)
    
    if ticker:
        query = query.filter(PortfolioHolding.ticker == ticker.upper())
    
    if min_value:
        query = query.filter(PortfolioHolding.market_value >= min_value)
    
    # Order by value descending
    holdings = query.order_by(desc(PortfolioHolding.market_value)).all()
    
    if not holdings:
        raise HTTPException(status_code=404, detail="No holdings found")
    
    # Calculate total value
    total_value = sum(h.market_value for h in holdings)
    
    # Calculate weights
    holdings_data = []
    for holding in holdings:
        weight = (holding.market_value / total_value * 100) if total_value > 0 else 0
        
        holdings_data.append({
            'ticker': holding.ticker,
            'company': holding.company_name,
            'cusip': holding.cusip,
            'shares': holding.shares,
            'value': holding.market_value,
            'weight': round(weight, 2),
            'change_type': holding.change_type,
            'shares_change': holding.shares_change,
            'value_change': holding.value_change,
        })
    
    return {
        'total_positions': len(holdings),
        'total_value': total_value,
        'filing_date': holdings[0].filing_date.isoformat() if holdings else None,
        'period_of_report': holdings[0].period_of_report.isoformat() if holdings else None,
        'fund_name': holdings[0].fund_name if holdings else None,
        'holdings': holdings_data,
    }


@router.get("/redmile/holdings/history")
async def get_holdings_history(
    ticker: str = Query(..., description="Ticker symbol"),
    quarters: int = Query(4, description="Number of quarters to retrieve", ge=1, le=20),
    db: Session = Depends(get_db)
):
    """
    Get historical position sizing for a ticker
    
    Shows how Redmile's position has changed over time.
    """
    holdings = db.query(PortfolioHolding).filter(
        PortfolioHolding.fund_cik == SEC13FScraper.REDMILE_CIK,
        PortfolioHolding.ticker == ticker.upper()
    ).order_by(desc(PortfolioHolding.period_of_report)).limit(quarters).all()
    
    if not holdings:
        raise HTTPException(status_code=404, detail=f"No holdings found for {ticker}")
    
    history = []
    for holding in holdings:
        history.append({
            'period_of_report': holding.period_of_report.isoformat(),
            'filing_date': holding.filing_date.isoformat(),
            'shares': holding.shares,
            'value': holding.market_value,
            'weight': float(holding.weight_pct) if holding.weight_pct else None,
            'change_type': holding.change_type,
            'shares_change': holding.shares_change,
            'value_change': holding.value_change,
        })
    
    return {
        'ticker': ticker.upper(),
        'company': holdings[0].company_name,
        'quarters': len(history),
        'history': history,
    }


@router.post("/redmile/sync")
async def sync_redmile_holdings(
    force: bool = Query(False, description="Force re-sync even if already synced"),
    db: Session = Depends(get_db)
):
    """
    Manually trigger sync of latest Redmile 13F filing
    
    This endpoint:
    1. Discovers latest 13F filing from SEC
    2. Downloads and parses XML
    3. Saves holdings to database
    4. Calculates quarter-over-quarter changes
    """
    scraper = SEC13FScraper()
    
    try:
        # Discover latest filings
        filing_urls = await scraper.discover()
        
        if not filing_urls:
            raise HTTPException(status_code=404, detail="No 13F filings found")
        
        # Get the most recent filing
        latest_url = filing_urls[0]
        
        # Fetch and parse
        filings = await scraper.fetch([latest_url])
        
        if not filings:
            raise HTTPException(status_code=500, detail="Failed to fetch filing")
        
        parsed = await scraper.parse(filings[0])
        
        # Check if already synced
        filing_date = datetime.fromisoformat(parsed['filing_date']) if parsed['filing_date'] else datetime.now()
        period_date = datetime.fromisoformat(parsed['period_of_report']) if parsed['period_of_report'] else filing_date
        
        existing = db.query(PortfolioHolding).filter(
            PortfolioHolding.fund_cik == SEC13FScraper.REDMILE_CIK,
            PortfolioHolding.period_of_report == period_date.date()
        ).first()
        
        if existing and not force:
            return {
                'status': 'already_synced',
                'period_of_report': period_date.date().isoformat(),
                'holdings_count': len(parsed['holdings']),
            }
        
        # Delete existing if force
        if existing and force:
            db.query(PortfolioHolding).filter(
                PortfolioHolding.fund_cik == SEC13FScraper.REDMILE_CIK,
                PortfolioHolding.period_of_report == period_date.date()
            ).delete()
        
        # Calculate total value for weights
        total_value = sum(h['value'] * 1000 for h in parsed['holdings'])
        
        # Get previous quarter for change calculation
        previous_holdings = {}
        if period_date.month >= 3:
            prev_date = period_date - timedelta(days=90)
            prev_holdings = db.query(PortfolioHolding).filter(
                PortfolioHolding.fund_cik == SEC13FScraper.REDMILE_CIK,
                PortfolioHolding.period_of_report >= prev_date.date()
            ).all()
            
            for h in prev_holdings:
                previous_holdings[h.cusip] = h
        
        # Save holdings
        for holding_data in parsed['holdings']:
            # Lookup ticker if not provided
            ticker = holding_data.get('ticker')
            if not ticker:
                from bt_platform.utils.ticker_lookup import TickerLookup
                ticker = TickerLookup.cusip_to_ticker(holding_data['cusip'])
            
            # Calculate changes
            prev_holding = previous_holdings.get(holding_data['cusip'])
            shares_change = None
            value_change = None
            change_type = 'NEW'
            
            if prev_holding:
                shares_change = holding_data['shares'] - prev_holding.shares
                value_change = (holding_data['value'] * 1000) - prev_holding.market_value
                
                if shares_change > 0:
                    change_type = 'ADD'
                elif shares_change < 0:
                    change_type = 'TRIM'
                else:
                    change_type = 'HOLD'
            
            # Calculate weight
            weight_pct = (holding_data['value'] * 1000 / total_value * 100) if total_value > 0 else 0
            
            holding = PortfolioHolding(
                fund_cik=parsed['manager_cik'],
                fund_name=parsed['manager_name'],
                filing_date=filing_date.date(),
                period_of_report=period_date.date(),
                cusip=holding_data['cusip'],
                ticker=ticker,
                company_name=holding_data['name'],
                shares=holding_data['shares'],
                market_value=holding_data['value'] * 1000,  # Convert to USD
                weight_pct=round(weight_pct, 2),
                shares_change=shares_change,
                value_change=value_change,
                change_type=change_type,
            )
            
            db.add(holding)
        
        # Commit
        db.commit()
        
        return {
            'status': 'synced',
            'period_of_report': period_date.date().isoformat(),
            'filing_date': filing_date.date().isoformat(),
            'holdings_count': len(parsed['holdings']),
            'total_value': total_value,
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Sync failed: {str(e)}")
    finally:
        await scraper.close()
```

#### Step 3.2: Register Routes

Update `bt_platform/core/app.py`:

```python
from fastapi import FastAPI
from .endpoints import biotech, portfolio

app = FastAPI(
    title="Biotech Terminal Platform API",
    version="1.0.0"
)

# Include routers
app.include_router(biotech.router, prefix="/api/v1/biotech", tags=["biotech"])
app.include_router(portfolio.router, prefix="/api/v1/portfolio", tags=["portfolio"])


@app.get("/")
def read_root():
    return {"message": "Biotech Terminal Platform API"}
```

---

## Testing Strategy

### Unit Tests

Create `tests/test_sec_13f_scraper.py`:

```python
"""
Unit tests for SEC 13F scraper
"""

import pytest
from bt_platform.scrapers.sites.sec_13f_scraper import SEC13FScraper


@pytest.mark.asyncio
async def test_scraper_initialization():
    """Test scraper initializes with correct defaults"""
    scraper = SEC13FScraper()
    assert scraper.cik == SEC13FScraper.REDMILE_CIK
    assert len(scraper.include_sectors) > 0


@pytest.mark.asyncio
async def test_discover_filings():
    """Test filing discovery"""
    scraper = SEC13FScraper()
    
    try:
        filings = await scraper.discover()
        assert len(filings) > 0
        assert all('13F' in f or '13f' in f for f in filings)
    finally:
        await scraper.close()


@pytest.mark.asyncio
async def test_parse_holding():
    """Test holding parsing from XML element"""
    import xml.etree.ElementTree as ET
    
    xml_str = """
    <infoTable>
        <nameOfIssuer>Vertex Pharmaceuticals Inc</nameOfIssuer>
        <cusip>92532F100</cusip>
        <titleOfClass>COM</titleOfClass>
        <shrsOrPrnAmt>
            <sshPrnamt>1234567</sshPrnamt>
        </shrsOrPrnAmt>
        <value>123456</value>
    </infoTable>
    """
    
    scraper = SEC13FScraper()
    elem = ET.fromstring(xml_str)
    
    holding = scraper._parse_holding(elem)
    
    assert holding is not None
    assert holding['name'] == 'Vertex Pharmaceuticals Inc'
    assert holding['cusip'] == '92532F100'
    assert holding['shares'] == 1234567
    assert holding['value'] == 123456
```

### Integration Tests

Create `tests/test_portfolio_api.py`:

```python
"""
Integration tests for Portfolio API
"""

import pytest
from fastapi.testclient import TestClient
from bt_platform.core.app import app
from bt_platform.core.database import Base, engine, get_db


client = TestClient(app)


@pytest.fixture(scope="function")
def test_db():
    """Create test database"""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


def test_get_holdings_empty(test_db):
    """Test getting holdings when none exist"""
    response = client.get("/api/v1/portfolio/redmile/holdings")
    assert response.status_code == 200
    data = response.json()
    assert data['total_positions'] == 0


def test_sync_holdings(test_db):
    """Test syncing holdings from SEC"""
    response = client.post("/api/v1/portfolio/redmile/sync")
    
    # May fail if SEC is down or rate limited, so allow 503
    assert response.status_code in [200, 503, 404]
    
    if response.status_code == 200:
        data = response.json()
        assert 'status' in data
        assert data['holdings_count'] > 0
```

---

## Demo Preparation

### Demo Script

**Duration:** 10 minutes

**Audience:** Stakeholders, Product Team

**Demo Flow:**

1. **Introduction (1 min)**
   - Show problem statement: Manual tracking of Redmile holdings
   - Explain value proposition: Automated portfolio-centric catalyst intelligence

2. **Live Demo: API Sync (3 min)**
   ```bash
   # Sync latest Redmile 13F filing
   curl -X POST http://localhost:8000/api/v1/portfolio/redmile/sync
   ```
   - Show JSON response with holdings count
   - Highlight filing date and period of report

3. **Live Demo: Current Holdings (3 min)**
   ```bash
   # Get current holdings
   curl http://localhost:8000/api/v1/portfolio/redmile/holdings
   ```
   - Show top positions by value
   - Highlight portfolio weights
   - Point out change tracking (NEW, ADD, TRIM)

4. **Live Demo: Historical Analysis (2 min)**
   ```bash
   # Get historical position for VRTX
   curl http://localhost:8000/api/v1/portfolio/redmile/holdings/history?ticker=VRTX
   ```
   - Show quarter-over-quarter changes
   - Discuss conviction signals

5. **Q&A (1 min)**

### Demo Data Preparation

1. **Run sync at least 24 hours before demo**
   ```bash
   poetry run python -c "
   import asyncio
   from bt_platform.scrapers.sites.sec_13f_scraper import SEC13FScraper
   from bt_platform.core.database import SessionLocal
   
   async def sync():
       scraper = SEC13FScraper()
       # ... sync logic
   
   asyncio.run(sync())
   "
   ```

2. **Verify data quality**
   - Check that holdings match SEC website
   - Validate ticker mappings
   - Verify change calculations

3. **Prepare fallback**
   - Have screenshots ready if API fails
   - Prepare test fixture data as backup

---

## Success Criteria

### Must Have (MVP)

- [ ] ✅ 13F scraper successfully parses latest Redmile filing
- [ ] ✅ Portfolio API returns holdings with >95% accuracy
- [ ] ✅ API response time <500ms for holdings endpoint
- [ ] ✅ Ticker symbols correctly mapped for >80% of holdings
- [ ] ✅ Change tracking (NEW, ADD, TRIM, EXIT) working correctly
- [ ] ✅ Unit tests pass with >80% coverage
- [ ] ✅ Integration tests pass
- [ ] ✅ Stakeholder demo approval

### Should Have (Nice to Have)

- [ ] Portfolio weights calculated accurately
- [ ] Historical position tracking (4+ quarters)
- [ ] Documentation complete (API docs, usage examples)
- [ ] Error handling for edge cases

### Could Have (Future Enhancements)

- [ ] Ticker lookup via external API (vs hardcoded mapping)
- [ ] Support for other funds (Baker Bros, Perceptive)
- [ ] Email alerts on new filings
- [ ] Webhook notifications

---

## Rollout Plan

### Week 1: Development
- Days 1-2: Database model and migrations
- Days 3-5: 13F scraper implementation and testing

### Week 2: API & Testing
- Days 6-8: Portfolio API endpoints
- Days 9-10: Testing and demo preparation

### Demo Day (End of Week 2)
- 10-minute stakeholder demo
- Collect feedback
- Plan Sprint 2 enhancements

---

## Appendix

### A. SEC EDGAR API Documentation

- **Base URL:** https://www.sec.gov
- **Rate Limit:** 10 requests per second
- **User-Agent:** Required (identify your application)
- **Documentation:** https://www.sec.gov/developer

### B. 13F Filing Structure

13F-HR filings contain:
- **Cover Page:** Manager information, filing date
- **Information Table:** List of holdings (usually XML)
- **Summary Page:** Total value and security count

### C. CUSIP Format

- **Length:** 9 characters
- **Structure:** 
  - 6 characters: Issuer identifier
  - 2 characters: Issue identifier
  - 1 character: Check digit

### D. Common Issues

**Problem:** SEC rate limiting  
**Solution:** Reduce batch size, increase delays

**Problem:** XML parsing errors  
**Solution:** Add fallback parsing logic, handle malformed XML

**Problem:** Missing tickers  
**Solution:** Expand ticker mapping, integrate external API

---

*Sprint 1 Proof of Concept Guide*  
*Last Updated: 2025-10-14*  
*Version: 1.0*

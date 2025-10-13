# Redmile-Focused Biotech Catalyst Intelligence System

> **Institutional-Grade Catalyst Tracking Tailored for Portfolio Manager Workflows**

A comprehensive blueprint for building an intelligent, PM-focused catalyst tracking system that provides asymmetric trade opportunities through superior data aggregation, scoring algorithms, and visual analytics.

---

## Executive Summary

This system transforms raw biotech catalyst data into actionable intelligence by:

1. **Portfolio Integration**: Automatically filtering catalysts by Redmile Group's public holdings
2. **Multi-Source Aggregation**: Combining FDA, ClinicalTrials.gov, SEC, conference calendars, and insider transactions
3. **Intelligent Scoring**: Quantifying tradeability through an enhanced multi-dimensional algorithm
4. **Visual Intelligence**: PM-style calendar with therapeutic area encoding, market size bubbles, and conviction indicators
5. **Surprise Detection**: Identifying mispriced catalysts where Street expectations diverge from reality

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Phase 1: Portfolio Intelligence](#phase-1-portfolio-intelligence)
3. [Phase 2: Enhanced Catalyst Scoring](#phase-2-enhanced-catalyst-scoring)
4. [Phase 3: Multi-Source Data Aggregation](#phase-3-multi-source-data-aggregation)
5. [Phase 4: PM Homepage Calendar](#phase-4-pm-homepage-calendar)
6. [Phase 5: Intelligence Features](#phase-5-intelligence-features)
7. [Implementation Roadmap](#implementation-roadmap)
8. [Technical Specifications](#technical-specifications)

---

## Architecture Overview

### System Design Principles

1. **Modular Spiderweb**: Each data source is an independent connector with standardized output contracts
2. **Event-Driven**: CloudEvents bus for real-time catalyst detection and propagation
3. **Scoring Engine**: Pluggable algorithm that combines multiple factors into tradeability score
4. **Visual First**: Bloomberg Terminal-inspired UI with high information density
5. **Portfolio-Centric**: All features filtered through Redmile holdings lens

### Technology Stack

- **Backend**: Python FastAPI, SQLAlchemy, DuckDB for analytics
- **Frontend**: React/TypeScript, Recharts, D3.js for visualizations
- **Data Sources**: SEC EDGAR API, FDA RSS, ClinicalTrials.gov API v2, custom scrapers
- **Storage**: PostgreSQL for structured data, Redis for caching, DuckDB for OLAP queries

### Data Flow Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Data Source Layer                          │
├──────────────────────────────────────────────────────────────┤
│  SEC EDGAR  │  FDA APIs  │  CT.gov  │  Conferences  │ Insiders│
│   (13F)     │  (PDUFA)   │ (Trials) │  (Calendar)  │  (Form 4)│
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│               Scraper/Connector Layer                         │
├──────────────────────────────────────────────────────────────┤
│  • Rate-limited HTTP clients with retry logic                │
│  • Structured data extraction and normalization               │
│  • Change detection and incremental updates                   │
│  • CloudEvents publishing for each discovered catalyst        │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│            Catalyst Intelligence Engine                       │
├──────────────────────────────────────────────────────────────┤
│  1. Portfolio Filter: Match against Redmile holdings          │
│  2. Enrichment: Add company data, therapeutic area, market cap│
│  3. Scoring: Multi-factor tradeability algorithm              │
│  4. Street Comp: Compare vs analyst consensus expectations    │
│  5. Historical: Pattern match against past outcomes           │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│                Database & Cache Layer                         │
├──────────────────────────────────────────────────────────────┤
│  PostgreSQL: Catalysts, Companies, Portfolios, Analysts       │
│  Redis: Catalyst scores, Street consensus cache               │
│  DuckDB: Historical analysis, backtesting queries             │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│                   API Layer (FastAPI)                         │
├──────────────────────────────────────────────────────────────┤
│  GET  /api/v1/portfolio/redmile/holdings                      │
│  GET  /api/v1/catalysts/calendar?portfolio=redmile&days=90    │
│  GET  /api/v1/catalysts/{id}/score                            │
│  POST /api/v1/catalysts/score                                 │
│  GET  /api/v1/catalysts/high-conviction                       │
│  GET  /api/v1/street/consensus/{ticker}                       │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│              Frontend UI Components                           │
├──────────────────────────────────────────────────────────────┤
│  • PM Catalyst Calendar (30/60/90 day views)                  │
│  • Catalyst Scoring Radar (enhanced with Street comp)         │
│  • Portfolio Heat Map (catalyst density by position)          │
│  • Surprise Factor Dashboard (mispricing opportunities)       │
│  • Endpoint Differentiation Analyzer                          │
└──────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Portfolio Intelligence

### 1.1 Redmile Holdings Integration

**Objective**: Automatically track and filter catalysts by Redmile Group's public biotech/pharma positions.

#### Data Source: SEC EDGAR 13F Filings

Redmile Group LLC files quarterly 13F reports disclosing equity holdings. Latest filing can be found at:
- CIK: 0001454691
- URL: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001454691&type=13F&dateb=&owner=exclude&count=10`

#### Implementation Steps

**Step 1.1: Build 13F Scraper**

Create `bt_platform/scrapers/sites/sec_13f_scraper.py`:

```python
"""
SEC 13F Holdings Scraper

Extracts institutional holdings from quarterly 13F-HR filings.
Focuses on biotech/pharma positions for Redmile Group.
"""

from typing import Dict, List, Optional, Any
from datetime import datetime
import re
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup

from bt_platform.scrapers.base.interface import ScraperInterface, ScraperResult, ContentType


class SEC13FScraper(ScraperInterface):
    """Scraper for SEC 13F filings"""
    
    REDMILE_CIK = "0001454691"
    BASE_URL = "https://www.sec.gov"
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        super().__init__(config)
        self.cik = config.get('cik', self.REDMILE_CIK)
        self.include_sectors = config.get('sectors', ['Biotechnology', 'Pharmaceuticals', 'Life Sciences'])
        
    async def discover(self, method: str = "rss", **kwargs) -> List[str]:
        """
        Discover 13F filing URLs for a CIK
        
        Returns list of 13F-HR filing URLs
        """
        filing_list_url = f"{self.BASE_URL}/cgi-bin/browse-edgar?action=getcompany&CIK={self.cik}&type=13F&dateb=&owner=exclude&count=10&output=atom"
        
        # Parse RSS feed to get filing URLs
        # Implementation details...
        pass
    
    async def fetch(self, urls: List[str], batch_size: int = 5) -> List[Dict[str, Any]]:
        """
        Fetch 13F-HR XML files
        
        Respects SEC rate limits (10 requests per second max)
        """
        # Implementation with rate limiting...
        pass
    
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
                    'market_value': 567890000,
                    'weight': 0.045  # % of portfolio
                },
                ...
            ]
        }
        """
        # Parse XML, extract <infoTable> entries
        # Filter by sector if configured
        pass
    
    async def normalize(self, parsed_data: Dict[str, Any]) -> ScraperResult:
        """
        Normalize to PortfolioHoldingContract
        """
        holdings = []
        for holding in parsed_data['holdings']:
            holdings.append({
                'ticker': holding['ticker'],
                'cusip': holding['cusip'],
                'company_name': holding['name'],
                'shares': holding['shares'],
                'market_value': holding['market_value'],
                'portfolio_weight': holding['weight'],
                'filing_date': parsed_data['filing_date'],
                'report_date': parsed_data['period_of_report']
            })
        
        return ScraperResult(
            content_type=ContentType.FINANCIAL,
            data={
                'fund_name': parsed_data['manager_name'],
                'cik': self.cik,
                'filing_date': parsed_data['filing_date'],
                'report_date': parsed_data['period_of_report'],
                'holdings': holdings,
                'total_holdings': len(holdings),
                'biotech_pharma_only': True
            },
            metadata={
                'source': 'SEC EDGAR 13F',
                'scraper': self.name,
                'url': raw_content.get('url'),
                'scraped_at': datetime.utcnow().isoformat()
            }
        )
```

**Step 1.2: Database Schema for Portfolio Holdings**

Add to `bt_platform/core/database.py`:

```python
class PortfolioHolding(Base):
    """Institutional portfolio holdings from 13F filings"""
    __tablename__ = "portfolio_holdings"
    
    id = Column(Integer, primary_key=True, index=True)
    fund_name = Column(String, index=True)  # e.g., "Redmile Group, LLC"
    fund_cik = Column(String, index=True)
    ticker = Column(String, index=True)
    cusip = Column(String, index=True)
    company_name = Column(String, index=True)
    
    # Position details
    shares = Column(Integer)
    market_value = Column(Float)
    portfolio_weight = Column(Float)  # % of total portfolio
    
    # Dates
    filing_date = Column(DateTime, index=True)
    report_date = Column(DateTime, index=True)  # Quarter-end date
    
    # Change tracking
    prev_shares = Column(Integer)
    shares_change = Column(Integer)  # Delta from previous quarter
    change_pct = Column(Float)
    is_new_position = Column(Boolean, default=False)
    is_closed_position = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Index for efficient queries
    __table_args__ = (
        Index('idx_fund_ticker_report', 'fund_cik', 'ticker', 'report_date'),
    )
```

**Step 1.3: API Endpoint for Holdings**

Add to `bt_platform/core/endpoints/portfolio.py`:

```python
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List

router = APIRouter()

@router.get("/redmile/holdings")
async def get_redmile_holdings(
    as_of_date: Optional[str] = Query(None, description="Get holdings as of date (defaults to latest)"),
    min_weight: Optional[float] = Query(0.01, description="Minimum portfolio weight to include"),
    db: Session = Depends(get_db)
):
    """
    Get Redmile Group's biotech/pharma holdings
    
    Returns current positions with metadata for catalyst filtering
    """
    query = db.query(PortfolioHolding).filter(
        PortfolioHolding.fund_name == "Redmile Group, LLC"
    )
    
    if as_of_date:
        target_date = datetime.fromisoformat(as_of_date)
        query = query.filter(PortfolioHolding.report_date == target_date)
    else:
        # Get latest quarter
        latest = db.query(func.max(PortfolioHolding.report_date)).filter(
            PortfolioHolding.fund_name == "Redmile Group, LLC"
        ).scalar()
        query = query.filter(PortfolioHolding.report_date == latest)
    
    if min_weight:
        query = query.filter(PortfolioHolding.portfolio_weight >= min_weight)
    
    holdings = query.order_by(PortfolioHolding.portfolio_weight.desc()).all()
    
    return {
        "fund_name": "Redmile Group, LLC",
        "report_date": holdings[0].report_date.isoformat() if holdings else None,
        "filing_date": holdings[0].filing_date.isoformat() if holdings else None,
        "holdings": [
            {
                "ticker": h.ticker,
                "company": h.company_name,
                "shares": h.shares,
                "market_value": h.market_value,
                "weight": h.portfolio_weight,
                "change_pct": h.change_pct,
                "is_new": h.is_new_position
            }
            for h in holdings
        ],
        "total_positions": len(holdings)
    }

@router.get("/redmile/holdings/history")
async def get_holdings_history(
    ticker: str = Query(..., description="Ticker symbol"),
    quarters: int = Query(4, description="Number of quarters to look back"),
    db: Session = Depends(get_db)
):
    """
    Get historical position sizing for a specific ticker
    
    Useful for understanding conviction changes over time
    """
    holdings = db.query(PortfolioHolding).filter(
        PortfolioHolding.fund_name == "Redmile Group, LLC",
        PortfolioHolding.ticker == ticker
    ).order_by(PortfolioHolding.report_date.desc()).limit(quarters).all()
    
    return {
        "ticker": ticker,
        "history": [
            {
                "report_date": h.report_date.isoformat(),
                "shares": h.shares,
                "market_value": h.market_value,
                "weight": h.portfolio_weight,
                "change_pct": h.change_pct
            }
            for h in holdings
        ]
    }
```

**Step 1.4: Portfolio-Filtered Catalyst Endpoint**

Enhance existing `/api/v1/biotech/catalysts` endpoint:

```python
@router.get("/catalysts")
async def get_catalysts(
    portfolio: Optional[str] = Query(None, description="Filter by portfolio: 'redmile', 'baker_bros', etc."),
    upcoming_days: int = Query(90, description="Look ahead N days"),
    min_score: Optional[int] = Query(None, description="Minimum tradeability score"),
    db: Session = Depends(get_db)
):
    """
    Get catalysts with optional portfolio filtering
    """
    query = db.query(Catalyst).filter(
        Catalyst.status == "Upcoming",
        Catalyst.event_date >= datetime.utcnow(),
        Catalyst.event_date <= datetime.utcnow() + timedelta(days=upcoming_days)
    )
    
    # Portfolio filtering
    if portfolio == "redmile":
        # Get Redmile tickers
        latest_report = db.query(func.max(PortfolioHolding.report_date)).filter(
            PortfolioHolding.fund_name == "Redmile Group, LLC"
        ).scalar()
        
        holdings = db.query(PortfolioHolding.ticker).filter(
            PortfolioHolding.fund_name == "Redmile Group, LLC",
            PortfolioHolding.report_date == latest_report
        ).all()
        
        tickers = [h.ticker for h in holdings]
        
        # Join with companies table to filter catalysts
        query = query.join(Company, Catalyst.company == Company.name).filter(
            Company.ticker.in_(tickers)
        )
    
    if min_score:
        # Filter by computed score
        catalysts = query.all()
        catalysts = [c for c in catalysts if compute_catalyst_score(c).total >= min_score]
    else:
        catalysts = query.all()
    
    return format_catalyst_response(catalysts, include_portfolio_context=bool(portfolio))
```

### 1.2 Therapeutic Area Mapping

**Objective**: Classify portfolio holdings and catalysts by therapeutic area for visual encoding.

**Therapeutic Areas** (matching Redmile's focus):
- Oncology (Hematology, Solid Tumors)
- Rare Diseases (Genetic, Metabolic)
- Immunology (Autoimmune, Inflammatory)
- Neurology (CNS, Neurodegenerative)
- Cardiometabolic (CV, Diabetes, NASH)
- Ophthalmology
- Respiratory

**Implementation**: Add `therapeutic_area` classification to Company model and seed with domain knowledge.

---

## Phase 2: Enhanced Catalyst Scoring

### 2.1 Expanded Scoring Algorithm

**Current System**: 5 dimensions, 0-16 total
- Event Leverage (0-4)
- Timing Clarity (0-3)
- Surprise Factor (0-3)
- Downside Contained (0-3)
- Market Depth (0-3)

**Enhanced System**: 8 dimensions, 0-24 total

#### New Dimensions

**6. Street Consensus Differential (0-3)**
- 3: Street models materially underweight key endpoints or commercial potential
- 2: Modest disconnect between Street and reality
- 1: Street fairly priced
- 0: Catalyst fully reflected in consensus

**How to Score**:
- Scrape analyst reports from FactSet RSS, Visible Alpha, or company IR pages
- Extract target prices, revenue forecasts, probability of success (PoS)
- Compare against internal models or historical precedents
- Flag where Street is anchored on wrong metric (e.g., surrogate vs hard endpoint)

**7. Volatility Potential (0-2)**
- 2: Binary event with >30% expected move in either direction
- 1: Moderate volatility expected (15-30% move)
- 0: Low volatility event (<15% move)

**How to Score**:
- Use options implied volatility as baseline
- Historical volatility for similar catalysts in same therapeutic area
- Market cap relative to peak sales potential

**8. Execution Risk (0-2, inverted)**
- 2: Low execution risk (regulatory-only, no operational complexity)
- 1: Moderate risk (manufacturing, enrollment challenges)
- 0: High risk (novel tech, untested platform)

### 2.2 Scoring Implementation

Update `src/utils/catalystScoring.ts`:

```typescript
export interface EnhancedCatalystScore extends CatalystScore {
  // Existing
  eventLeverage: number;      // 0-4
  timingClarity: number;       // 0-3
  surpriseFactor: number;      // 0-3
  downsideContained: number;   // 0-3
  marketDepth: number;         // 0-3
  
  // New
  streetDifferential: number;  // 0-3
  volatilityPotential: number; // 0-2
  executionRisk: number;       // 0-2 (inverted)
  
  total: number;               // 0-24
  tier: 'Ultra-High' | 'High-Torque' | 'Tradable' | 'Watch';
}

export function computeEnhancedCatalystScore(
  catalyst: Catalyst,
  streetConsensus?: StreetConsensusData
): EnhancedCatalystScore {
  // Existing scores
  const eventLeverage = catalyst.eventLeverage ?? 0;
  const timingClarity = catalyst.timingClarity ?? 0;
  const surpriseFactor = catalyst.surpriseFactor ?? 0;
  const downsideContained = catalyst.downsideContained ?? 0;
  const marketDepth = catalyst.marketDepth ?? 0;
  
  // New: Street Differential
  const streetDifferential = computeStreetDifferential(catalyst, streetConsensus);
  
  // New: Volatility Potential
  const volatilityPotential = computeVolatilityPotential(catalyst);
  
  // New: Execution Risk (inverted - higher is better)
  const executionRisk = computeExecutionRisk(catalyst);
  
  const total = eventLeverage + timingClarity + surpriseFactor + 
                downsideContained + marketDepth + streetDifferential + 
                volatilityPotential + executionRisk;
  
  // New tier system
  let tier: EnhancedCatalystScore['tier'];
  if (total >= 16) {
    tier = 'Ultra-High';
  } else if (total >= 12) {
    tier = 'High-Torque';
  } else if (total >= 8) {
    tier = 'Tradable';
  } else {
    tier = 'Watch';
  }
  
  return {
    eventLeverage,
    timingClarity,
    surpriseFactor,
    downsideContained,
    marketDepth,
    streetDifferential,
    volatilityPotential,
    executionRisk,
    total,
    tier,
    rationale: generateEnhancedRationale({
      eventLeverage, timingClarity, surpriseFactor, downsideContained,
      marketDepth, streetDifferential, volatilityPotential, executionRisk,
      catalyst
    })
  };
}

function computeStreetDifferential(
  catalyst: Catalyst,
  streetConsensus?: StreetConsensusData
): number {
  if (!streetConsensus) return 0;
  
  // Compare Street POS vs internal assessment
  const streetPoS = streetConsensus.probability_of_success;
  const internalPoS = catalyst.probability ?? 0.5;
  
  const differential = internalPoS - streetPoS;
  
  if (differential > 0.25) return 3;  // Street materially underweight
  if (differential > 0.15) return 2;  // Modest upside vs Street
  if (differential > 0.05) return 1;  // Slight edge
  return 0;  // No edge or Street ahead
}

function computeVolatilityPotential(catalyst: Catalyst): number {
  // Factors: market cap, peak sales potential, binary nature
  const marketCap = catalyst.companyMarketCap ?? 1000;  // $M
  const peakSales = catalyst.peakSalesPotential ?? 500;  // $M
  
  const salesToMcap = peakSales / marketCap;
  
  // Binary events (FDA approval, Phase 3 readout) have higher vol
  const isBinary = ['FDA Approval', 'Phase 3 Readout', 'PDUFA Action'].includes(catalyst.eventType ?? '');
  
  if (isBinary && salesToMcap > 0.5) return 2;  // >30% move likely
  if (salesToMcap > 0.3 || isBinary) return 1;  // 15-30% move
  return 0;
}

function computeExecutionRisk(catalyst: Catalyst): number {
  const eventType = catalyst.eventType ?? '';
  
  // Low risk: regulatory decisions, label expansions
  if (['FDA Approval', 'PDUFA Action', 'Label Expansion'].includes(eventType)) {
    return 2;
  }
  
  // Moderate risk: Phase 3 readouts (known endpoints)
  if (eventType === 'Phase 3 Readout') {
    return 1;
  }
  
  // High risk: novel tech, Phase 1/2, manufacturing scale-up
  return 0;
}
```

### 2.3 Database Schema Updates

Add new columns to `Catalyst` table:

```python
# In bt_platform/core/database.py
class Catalyst(Base):
    # ... existing columns ...
    
    # Enhanced scoring fields
    street_differential = Column(Integer)  # 0-3
    volatility_potential = Column(Integer)  # 0-2
    execution_risk = Column(Integer)  # 0-2
    
    # Street consensus data
    street_pos = Column(Float)  # Street probability of success
    street_pt_mean = Column(Float)  # Mean analyst price target
    analyst_count = Column(Integer)  # Number of covering analysts
    
    # Company context for scoring
    company_market_cap = Column(Float)
    peak_sales_potential = Column(Float)
```

---

## Phase 3: Multi-Source Data Aggregation

### 3.1 FDA Catalyst Sources

#### 3.1.1 PDUFA Date Tracker

**Source**: FDA's PDUFA Calendar
**URL**: `https://www.fda.gov/drugs/nda-and-bla-approvals/drug-trial-snapshots`

**Implementation**:

Create `bt_platform/scrapers/sites/fda_pdufa_scraper.py`:

```python
"""
FDA PDUFA Date Scraper

Tracks Prescription Drug User Fee Act (PDUFA) action dates for NDA/BLA applications.
These are fixed regulatory deadlines - high timing clarity catalysts.
"""

class FDAPDUFAScraper(ScraperInterface):
    """Scraper for FDA PDUFA action dates"""
    
    PDUFA_CALENDAR_URL = "https://www.fda.gov/industry/user-fee-performance-reports"
    
    async def discover(self, **kwargs) -> List[str]:
        """Discover upcoming PDUFA dates from FDA calendar"""
        # Scrape FDA's PDUFA calendar page
        # Return list of application URLs
        pass
    
    async def parse(self, raw_content: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract PDUFA data:
        - Application number (NDA/BLA)
        - Drug name
        - Sponsor company
        - PDUFA date
        - Indication
        - Priority Review designation
        - Breakthrough Therapy designation
        """
        pass
    
    async def normalize(self, parsed_data: Dict[str, Any]) -> ScraperResult:
        """
        Convert to Catalyst format with:
        - event_type = "PDUFA Action"
        - timing_clarity = 3 (fixed date)
        - event_leverage = depends on indication/unmet need
        """
        pass
```

#### 3.1.2 AdComm Calendar

**Source**: FDA Advisory Committee Meetings
**URL**: `https://www.fda.gov/advisory-committees/advisory-committee-calendar`

AdComm meetings often precede PDUFA dates and can provide early signals on approval likelihood.

**Scoring Impact**:
- AdComm scheduled = increase timing clarity
- Positive AdComm vote (post-meeting) = increase downside contained
- Split vote = increase volatility potential

#### 3.1.3 CRL Resolution Tracker

**Source**: Company press releases, SEC 8-K filings
**Keywords**: "Complete Response Letter", "CRL", "Additional information requested"

**Scoring Impact**:
- CRL resubmission = high downside contained (3 points)
- Clear path to approval = high event leverage

### 3.2 ClinicalTrials.gov Advanced Scraper

**Objective**: Track Phase 3 trial readouts and interim analyses.

**Current Status**: Basic CTGov scraper exists
**Enhancement Needed**: 
1. Filter for Phase 3 trials only
2. Parse "Primary Completion Date" as catalyst date
3. Identify trials with hard endpoints (MACE, mortality, event-driven)
4. Link to company tickers via sponsor name matching

**Implementation**:

```python
# Enhance existing bt_platform/scrapers/sites/clinical_trials_scraper.py

class ClinicalTrialsScraper(ScraperInterface):
    
    async def discover_phase3_readouts(self, **kwargs) -> List[str]:
        """
        Query CTGov API v2 for Phase 3 trials with upcoming completion dates
        
        API: https://clinicaltrials.gov/api/v2/studies
        Filters:
        - query.term: Phase 3
        - filter.advanced: RECRUITING | ACTIVE_NOT_RECRUITING
        - fields: NCTId, BriefTitle, PrimaryCompletionDate, Sponsor
        """
        base_url = "https://clinicaltrials.gov/api/v2/studies"
        params = {
            "query.term": "Phase 3",
            "filter.advanced": "PHASE:3 AND STATUS:(RECRUITING,ACTIVE_NOT_RECRUITING)",
            "fields": "NCTId,BriefTitle,StartDate,PrimaryCompletionDate,CompletionDate,LeadSponsor,Condition,InterventionName",
            "sort": "PrimaryCompletionDate:asc",
            "pageSize": 100
        }
        
        # Fetch trials with completion dates in next 365 days
        # Return NCT IDs
        pass
    
    def classify_endpoint_type(self, trial_data: Dict) -> str:
        """
        Classify trial endpoints as hard vs surrogate
        
        Hard endpoints (high event leverage):
        - MACE, CV death, all-cause mortality
        - Hospitalization events
        - Fracture, amputation
        - Pancreatitis events
        
        Surrogate endpoints (lower event leverage):
        - Biomarkers (LDL-C, HbA1c, etc.)
        - Imaging endpoints
        - PRO (patient-reported outcomes)
        """
        title = trial_data.get('BriefTitle', '').lower()
        
        hard_keywords = ['mace', 'mortality', 'death', 'hospitalization', 
                         'fracture', 'amputation', 'event', 'pancreatitis']
        
        if any(kw in title for kw in hard_keywords):
            return 'hard'
        return 'surrogate'
    
    async def normalize(self, parsed_data: Dict[str, Any]) -> ScraperResult:
        """
        Convert trial to Catalyst:
        - event_type = "Phase 3 Readout" or "Interim Analysis"
        - event_date = PrimaryCompletionDate
        - event_leverage = 4 if hard endpoint, 2 if surrogate
        - timing_clarity = 2 (event-driven but guided timeline)
        """
        endpoint_type = self.classify_endpoint_type(parsed_data)
        
        return ScraperResult(
            content_type=ContentType.CLINICAL,
            data={
                'nct_id': parsed_data['NCTId'],
                'title': parsed_data['BriefTitle'],
                'sponsor': parsed_data['LeadSponsor'],
                'indication': parsed_data['Condition'],
                'drug': parsed_data.get('InterventionName'),
                'event_date': parsed_data['PrimaryCompletionDate'],
                'endpoint_type': endpoint_type,
                'scoring': {
                    'event_leverage': 4 if endpoint_type == 'hard' else 2,
                    'timing_clarity': 2
                }
            },
            metadata={
                'source': 'ClinicalTrials.gov',
                'url': f"https://clinicaltrials.gov/study/{parsed_data['NCTId']}"
            }
        )
```

### 3.3 SEC 8-K Catalyst Detection

**Objective**: Detect material events disclosed in SEC 8-K filings.

**Key 8-K Items for Catalysts**:
- Item 8.01: Other Events (trial results, regulatory updates)
- Item 1.01: Entry into Material Definitive Agreement (partnerships, M&A)
- Item 2.02: Results of Operations (trial top-line data in earnings)

**Implementation**:

```python
# Enhance bt_platform/scrapers/sites/edgar_scraper.py

class EDGAR8KScraper(EDGARScraper):
    """Scraper for SEC 8-K filings with catalyst detection"""
    
    CATALYST_KEYWORDS = [
        # Clinical
        'topline', 'interim analysis', 'primary endpoint', 'trial results',
        'statistically significant', 'p-value', 'met primary endpoint',
        
        # Regulatory
        'fda approval', 'complete response letter', 'crl', 'breakthrough designation',
        'orphan drug', 'priority review', 'accelerated approval',
        
        # Commercial
        'partnership', 'collaboration agreement', 'licensing agreement',
        'acquisition', 'merger', 'divestiture',
        
        # Financial
        'milestone payment', 'upfront payment', 'royalty'
    ]
    
    async def discover(self, **kwargs) -> List[str]:
        """
        Discover 8-K filings for biotech/pharma companies
        
        Filter to companies in Redmile portfolio for relevance
        """
        # Query EDGAR for recent 8-K filings
        # Limit to tickers in portfolio_holdings table
        pass
    
    async def parse(self, raw_content: Dict[str, Any]) -> Dict[str, Any]:
        """
        Parse 8-K filing:
        1. Extract filing date, company, CIK
        2. Parse Item numbers (8.01, 1.01, etc.)
        3. Extract full text of disclosure
        4. Search for catalyst keywords
        5. Classify catalyst type
        """
        pass
    
    def detect_catalyst(self, filing_text: str) -> Optional[Dict]:
        """
        NLP-based catalyst detection
        
        Returns:
        {
            'type': 'clinical_result' | 'regulatory' | 'partnership',
            'sentiment': 'positive' | 'negative' | 'neutral',
            'key_phrases': ['met primary endpoint', 'p<0.001'],
            'confidence': 0.85
        }
        """
        # Keyword matching + simple sentiment analysis
        # Could be enhanced with LLM-based extraction later
        pass
```

### 3.4 Conference Calendar Integration

**Objective**: Track major biotech conferences where companies present data.

**Key Conferences**:
- **JPM Healthcare Conference** (January) - Business development
- **ASCO** (June) - Oncology data
- **ASH** (December) - Hematology data
- **AHA** (November) - Cardiology data
- **EASL** (April) - Liver disease
- **AAN** (April/May) - Neurology

**Implementation**:

```python
# Create bt_platform/scrapers/sites/conference_scraper.py

class ConferenceCalendarScraper(ScraperInterface):
    """Scraper for biotech conference abstract databases"""
    
    CONFERENCES = {
        'ASCO': {
            'url': 'https://meetings.asco.org/abstracts-presentations/search',
            'therapeutic_areas': ['Oncology'],
            'months': [6]  # June
        },
        'ASH': {
            'url': 'https://ash.confex.com/ash/2024/webprogram/start.html',
            'therapeutic_areas': ['Oncology', 'Hematology'],
            'months': [12]  # December
        },
        'AHA': {
            'url': 'https://professional.heart.org/en/meetings',
            'therapeutic_areas': ['Cardiometabolic'],
            'months': [11]  # November
        }
    }
    
    async def discover_presentations(self, conference: str, year: int) -> List[str]:
        """
        Search conference abstract database for portfolio companies
        
        Returns list of abstract IDs/URLs
        """
        # Query abstract database
        # Filter by company/drug names from Redmile holdings
        pass
    
    async def parse(self, raw_content: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract from abstract:
        - Presentation date/time
        - Company/sponsor
        - Drug name
        - Trial ID (NCT number if available)
        - Presentation type (oral vs poster)
        - Abstract text (for endpoint assessment)
        """
        pass
    
    async def normalize(self, parsed_data: Dict[str, Any]) -> ScraperResult:
        """
        Convert to Catalyst:
        - event_type = "Conference Presentation"
        - event_date = presentation datetime
        - timing_clarity = 3 (scheduled event)
        - event_leverage = varies (assess from abstract)
        
        Note: Oral presentations > Posters for materiality
        """
        pass
```

### 3.5 Insider Transaction Tracking

**Objective**: Track Form 4 filings (insider buys/sells) as signals.

**Signal Logic**:
- **Cluster of insider buys** before catalyst = bullish signal (increase surprise factor)
- **Heavy insider selling** = potential negative signal (decrease surprise factor)
- **C-suite buys** > **Board buys** for signaling value

**Implementation**:

```python
# Create bt_platform/scrapers/sites/insider_scraper.py

class InsiderTransactionScraper(ScraperInterface):
    """Scraper for SEC Form 4 insider transactions"""
    
    async def discover(self, tickers: List[str], days_back: int = 90) -> List[str]:
        """
        Find Form 4 filings for portfolio companies
        
        Args:
            tickers: List of ticker symbols to monitor
            days_back: How far back to search
        """
        # Query EDGAR for Form 4 filings
        # Filter by CIK for portfolio companies
        pass
    
    async def parse(self, raw_content: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract from Form 4:
        - Transaction date
        - Insider name and title (CEO, CFO, Director, etc.)
        - Transaction type (Buy/Sell)
        - Shares traded
        - Price per share
        - Total ownership after transaction
        """
        pass
    
    def compute_signal_strength(self, transactions: List[Dict]) -> float:
        """
        Aggregate insider activity into signal strength
        
        Logic:
        - Weight by insider seniority (CEO=3x, CFO/CSO=2x, Director=1x)
        - Weight by transaction size relative to salary
        - Decay over time (recent transactions weighted higher)
        - Cluster detection (multiple insiders buying in same week)
        
        Returns signal strength: -1.0 (very bearish) to +1.0 (very bullish)
        """
        pass
    
    async def normalize(self, parsed_data: Dict[str, Any]) -> ScraperResult:
        """
        Store insider transactions for signal computation
        
        Not directly a catalyst, but affects scoring of upcoming catalysts
        """
        return ScraperResult(
            content_type=ContentType.FINANCIAL,
            data={
                'ticker': parsed_data['ticker'],
                'insider': parsed_data['insider_name'],
                'title': parsed_data['title'],
                'transaction_type': parsed_data['type'],
                'shares': parsed_data['shares'],
                'price': parsed_data['price'],
                'date': parsed_data['date'],
                'signal_strength': parsed_data['signal']
            },
            metadata={'source': 'SEC Form 4'}
        )
```

### 3.6 Data Orchestration Pipeline

**Objective**: Coordinate all scrapers to run on schedule and detect new catalysts.

Create `bt_platform/ingestion/catalyst_pipeline.py`:

```python
"""
Catalyst Data Pipeline

Orchestrates multi-source scraping, deduplication, enrichment, and scoring.
"""

import asyncio
from datetime import datetime, timedelta
from typing import List
import logging

from bt_platform.scrapers.sites import (
    FDAPDUFAScraper,
    EDGAR8KScraper,
    ClinicalTrialsScraper,
    ConferenceCalendarScraper,
    InsiderTransactionScraper
)
from bt_platform.core.database import SessionLocal, Catalyst, PortfolioHolding

logger = logging.getLogger(__name__)


class CatalystPipeline:
    """
    Pipeline for catalyst data ingestion
    
    Runs daily to discover new catalysts and update existing ones.
    """
    
    def __init__(self):
        self.scrapers = {
            'pdufa': FDAPDUFAScraper(),
            '8k': EDGAR8KScraper(),
            'ctgov': ClinicalTrialsScraper(),
            'conferences': ConferenceCalendarScraper(),
            'insiders': InsiderTransactionScraper()
        }
        
    async def run_full_ingestion(self):
        """
        Run all scrapers and ingest catalysts
        
        Order:
        1. Get Redmile portfolio holdings (for filtering)
        2. Run scrapers in parallel
        3. Deduplicate catalysts
        4. Enrich with company data
        5. Compute scores
        6. Upsert to database
        """
        db = SessionLocal()
        
        try:
            # Step 1: Get portfolio tickers
            portfolio_tickers = self.get_portfolio_tickers(db)
            logger.info(f"Found {len(portfolio_tickers)} tickers in Redmile portfolio")
            
            # Step 2: Run scrapers
            all_catalysts = await self.run_scrapers(portfolio_tickers)
            logger.info(f"Discovered {len(all_catalysts)} potential catalysts")
            
            # Step 3: Deduplicate
            unique_catalysts = self.deduplicate_catalysts(all_catalysts)
            logger.info(f"After dedup: {len(unique_catalysts)} unique catalysts")
            
            # Step 4: Enrich
            enriched = await self.enrich_catalysts(unique_catalysts, db)
            
            # Step 5: Score
            scored = self.score_catalysts(enriched, db)
            
            # Step 6: Upsert
            self.upsert_catalysts(scored, db)
            db.commit()
            
            logger.info(f"Pipeline complete. Ingested {len(scored)} catalysts.")
            
        except Exception as e:
            logger.error(f"Pipeline failed: {e}")
            db.rollback()
            raise
        finally:
            db.close()
    
    def get_portfolio_tickers(self, db: Session) -> List[str]:
        """Get list of tickers in Redmile portfolio"""
        latest_date = db.query(func.max(PortfolioHolding.report_date)).filter(
            PortfolioHolding.fund_name == "Redmile Group, LLC"
        ).scalar()
        
        holdings = db.query(PortfolioHolding.ticker).filter(
            PortfolioHolding.fund_name == "Redmile Group, LLC",
            PortfolioHolding.report_date == latest_date
        ).all()
        
        return [h.ticker for h in holdings]
    
    async def run_scrapers(self, tickers: List[str]) -> List[ScraperResult]:
        """Run all scrapers in parallel"""
        tasks = [
            self.scrapers['pdufa'].run(),
            self.scrapers['8k'].run(tickers=tickers),
            self.scrapers['ctgov'].run(),
            self.scrapers['conferences'].run(companies=tickers),
            self.scrapers['insiders'].run(tickers=tickers)
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Flatten results
        all_catalysts = []
        for result in results:
            if isinstance(result, Exception):
                logger.error(f"Scraper failed: {result}")
                continue
            all_catalysts.extend(result)
        
        return all_catalysts
    
    def deduplicate_catalysts(self, catalysts: List[ScraperResult]) -> List[ScraperResult]:
        """
        Remove duplicate catalysts from different sources
        
        Dedup logic:
        - Same company + drug + event_date (within 7 days) = duplicate
        - Prefer higher-quality source (FDA > CTGov > 8-K > Conference)
        """
        # Implementation...
        pass
    
    async def enrich_catalysts(self, catalysts: List[ScraperResult], db: Session) -> List[Dict]:
        """
        Enrich catalysts with company data
        
        Add:
        - Company ticker (if not present)
        - Market cap
        - Therapeutic area
        - Pipeline context
        """
        # Implementation...
        pass
    
    def score_catalysts(self, catalysts: List[Dict], db: Session) -> List[Dict]:
        """
        Compute tradeability scores for all catalysts
        
        Uses enhanced 8-dimension scoring algorithm
        """
        # Implementation...
        pass
    
    def upsert_catalysts(self, catalysts: List[Dict], db: Session):
        """
        Insert new catalysts or update existing
        
        Update logic:
        - If catalyst exists (same company + drug + date), update scores
        - If new, insert
        - Mark historical catalysts as status='Historical'
        """
        # Implementation...
        pass


async def main():
    """Entry point for catalyst pipeline"""
    pipeline = CatalystPipeline()
    await pipeline.run_full_ingestion()


if __name__ == "__main__":
    asyncio.run(main())
```

**Schedule**: Run daily via cron or Airflow DAG:
```bash
# Run at 6 AM ET every day
0 6 * * * cd /app && poetry run python -m bt_platform.ingestion.catalyst_pipeline
```

---

## Phase 4: PM Homepage Calendar

### 4.1 Calendar UI Design

**Objective**: Create a PM-style homepage that displays upcoming catalysts in a visually intuitive calendar format.

**Design Inspiration**: Bloomberg EVTS function, Goldman Sachs catalyst calendars

**Key Features**:
1. **Time Horizon Selector**: 30/60/90 day tabs
2. **Visual Encoding**:
   - **Color**: Therapeutic area (Oncology=red, Rare=purple, Cardio=blue, etc.)
   - **Size**: Market cap or peak sales potential (larger bubble = bigger opportunity)
   - **Border**: Tradeability score (thick border = Ultra-High, thin = Watch)
   - **Icon**: Event type (💊=FDA, 🔬=Clinical, 📋=8-K, 🎤=Conference)
3. **Interactivity**:
   - Click catalyst → drill-down panel with scoring breakdown
   - Hover → tooltip with key details
   - Filter by portfolio/therapeutic area/score tier
4. **Portfolio Overlay**: Highlight catalysts for current holdings

### 4.2 Calendar Component Implementation

Create `frontend-components/src/biotech/organisms/CatalystCalendarPM/CatalystCalendarPM.tsx`:

```typescript
import React, { useState, useMemo } from 'react';
import { Panel } from '@biotech-terminal/frontend-components/terminal';
import { EnhancedCatalystScore, Catalyst } from '../../../types/biotech';
import styles from './CatalystCalendarPM.module.css';

interface CatalystCalendarPMProps {
  catalysts: Catalyst[];
  portfolio?: 'redmile' | 'all';
  defaultHorizon?: 30 | 60 | 90;
}

const THERAPEUTIC_AREA_COLORS = {
  'Oncology': '#FF4444',
  'Rare Diseases': '#9C27B0',
  'Cardiometabolic': '#2196F3',
  'Immunology': '#FF9800',
  'Neurology': '#4CAF50',
  'Ophthalmology': '#00BCD4',
  'Respiratory': '#FFC107'
};

const EVENT_TYPE_ICONS = {
  'FDA Approval': '💊',
  'PDUFA Action': '📅',
  'Phase 3 Readout': '🔬',
  'Conference Presentation': '🎤',
  '8-K Filing': '📋',
  'AdComm Meeting': '👥'
};

export const CatalystCalendarPM: React.FC<CatalystCalendarPMProps> = ({
  catalysts,
  portfolio = 'redmile',
  defaultHorizon = 90
}) => {
  const [horizon, setHorizon] = useState<30 | 60 | 90>(defaultHorizon);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [selectedTherapeuticArea, setSelectedTherapeuticArea] = useState<string | null>(null);

  // Filter catalysts by time horizon
  const filteredCatalysts = useMemo(() => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + horizon);

    return catalysts.filter(catalyst => {
      const eventDate = new Date(catalyst.date);
      if (eventDate > cutoffDate) return false;

      if (selectedTier && catalyst.tier !== selectedTier) return false;
      if (selectedTherapeuticArea && catalyst.therapeuticArea !== selectedTherapeuticArea) return false;

      return true;
    });
  }, [catalysts, horizon, selectedTier, selectedTherapeuticArea]);

  // Group catalysts by week
  const catalystsByWeek = useMemo(() => {
    const weeks: Record<string, Catalyst[]> = {};

    filteredCatalysts.forEach(catalyst => {
      const date = new Date(catalyst.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weeks[weekKey]) {
        weeks[weekKey] = [];
      }
      weeks[weekKey].push(catalyst);
    });

    return weeks;
  }, [filteredCatalysts]);

  const renderCatalystBubble = (catalyst: Catalyst) => {
    const therapeuticArea = catalyst.therapeuticArea || 'Other';
    const color = THERAPEUTIC_AREA_COLORS[therapeuticArea] || '#999';
    const icon = EVENT_TYPE_ICONS[catalyst.eventType] || '📌';
    
    // Size based on market cap (normalized)
    const size = Math.min(Math.max(catalyst.marketCapImpact / 500, 40), 100); // 40-100px
    
    // Border thickness based on tradeability score
    const borderWidth = catalyst.tier === 'Ultra-High' ? 4 :
                        catalyst.tier === 'High-Torque' ? 3 :
                        catalyst.tier === 'Tradable' ? 2 : 1;

    return (
      <div
        key={catalyst.id}
        className={styles.catalystBubble}
        style={{
          backgroundColor: color,
          width: `${size}px`,
          height: `${size}px`,
          borderWidth: `${borderWidth}px`,
          borderColor: '#fff'
        }}
        title={`${catalyst.company} - ${catalyst.drug}\n${catalyst.description}`}
      >
        <span className={styles.icon}>{icon}</span>
        <div className={styles.bubbleLabel}>
          <div className={styles.ticker}>{catalyst.ticker}</div>
          <div className={styles.score}>{catalyst.totalScore}/24</div>
        </div>
      </div>
    );
  };

  return (
    <Panel title="CATALYST CALENDAR - PM VIEW" cornerBrackets>
      {/* Horizon Selector */}
      <div className={styles.controls}>
        <div className={styles.horizonSelector}>
          <button
            className={horizon === 30 ? styles.active : ''}
            onClick={() => setHorizon(30)}
          >
            30 DAYS
          </button>
          <button
            className={horizon === 60 ? styles.active : ''}
            onClick={() => setHorizon(60)}
          >
            60 DAYS
          </button>
          <button
            className={horizon === 90 ? styles.active : ''}
            onClick={() => setHorizon(90)}
          >
            90 DAYS
          </button>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <select
            value={selectedTier || ''}
            onChange={(e) => setSelectedTier(e.target.value || null)}
          >
            <option value="">All Tiers</option>
            <option value="Ultra-High">Ultra-High</option>
            <option value="High-Torque">High-Torque</option>
            <option value="Tradable">Tradable</option>
            <option value="Watch">Watch</option>
          </select>

          <select
            value={selectedTherapeuticArea || ''}
            onChange={(e) => setSelectedTherapeuticArea(e.target.value || null)}
          >
            <option value="">All Therapeutic Areas</option>
            {Object.keys(THERAPEUTIC_AREA_COLORS).map(area => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className={styles.calendarGrid}>
        {Object.entries(catalystsByWeek).map(([weekStart, weekCatalysts]) => (
          <div key={weekStart} className={styles.weekColumn}>
            <div className={styles.weekHeader}>
              {new Date(weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
            <div className={styles.catalysts}>
              {weekCatalysts.map(catalyst => renderCatalystBubble(catalyst))}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        <div className={styles.legendSection}>
          <h4>Therapeutic Areas</h4>
          {Object.entries(THERAPEUTIC_AREA_COLORS).map(([area, color]) => (
            <div key={area} className={styles.legendItem}>
              <div className={styles.colorBox} style={{ backgroundColor: color }} />
              <span>{area}</span>
            </div>
          ))}
        </div>

        <div className={styles.legendSection}>
          <h4>Event Types</h4>
          {Object.entries(EVENT_TYPE_ICONS).map(([type, icon]) => (
            <div key={type} className={styles.legendItem}>
              <span className={styles.icon}>{icon}</span>
              <span>{type}</span>
            </div>
          ))}
        </div>

        <div className={styles.legendSection}>
          <h4>Tradeability Score</h4>
          <div className={styles.legendItem}>
            <div className={styles.borderExample} style={{ borderWidth: '4px' }} />
            <span>Ultra-High (16-24)</span>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.borderExample} style={{ borderWidth: '3px' }} />
            <span>High-Torque (12-15)</span>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.borderExample} style={{ borderWidth: '2px' }} />
            <span>Tradable (8-11)</span>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.borderExample} style={{ borderWidth: '1px' }} />
            <span>Watch (&lt;8)</span>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className={styles.summary}>
        <div className={styles.stat}>
          <div className={styles.statLabel}>TOTAL CATALYSTS</div>
          <div className={styles.statValue}>{filteredCatalysts.length}</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}>ULTRA-HIGH</div>
          <div className={styles.statValue}>
            {filteredCatalysts.filter(c => c.tier === 'Ultra-High').length}
          </div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}>HIGH-TORQUE</div>
          <div className={styles.statValue}>
            {filteredCatalysts.filter(c => c.tier === 'High-Torque').length}
          </div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}>PORTFOLIO EXPOSURE</div>
          <div className={styles.statValue}>
            {filteredCatalysts.filter(c => c.inPortfolio).length}
          </div>
        </div>
      </div>
    </Panel>
  );
};
```

### 4.3 Calendar Styles

Create `frontend-components/src/biotech/organisms/CatalystCalendarPM/CatalystCalendarPM.module.css`:

```css
.container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.horizonSelector {
  display: flex;
  gap: 8px;
}

.horizonSelector button {
  padding: 8px 16px;
  background: rgba(255, 149, 0, 0.1);
  border: 1px solid var(--accent-primary);
  color: var(--accent-primary);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.horizonSelector button.active,
.horizonSelector button:hover {
  background: var(--accent-primary);
  color: #000;
}

.filters {
  display: flex;
  gap: 12px;
}

.filters select {
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 149, 0, 0.3);
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: 11px;
  border-radius: 2px;
}

.calendarGrid {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding: 16px;
  min-height: 400px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}

.weekColumn {
  flex: 0 0 150px;
  display: flex;
  flex-direction: column;
}

.weekHeader {
  padding: 8px;
  background: var(--accent-primary);
  color: #000;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  text-align: center;
  border-radius: 2px;
  margin-bottom: 12px;
}

.catalysts {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.catalystBubble {
  position: relative;
  border-radius: 50%;
  border-style: solid;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  margin: 0 auto;
}

.catalystBubble:hover {
  transform: scale(1.1);
  box-shadow: 0 0 20px rgba(255, 149, 0, 0.5);
}

.icon {
  font-size: 20px;
}

.bubbleLabel {
  position: absolute;
  bottom: -20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.ticker {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  color: var(--text-primary);
}

.score {
  font-family: var(--font-mono);
  font-size: 9px;
  color: var(--accent-primary);
}

.legend {
  display: flex;
  gap: 32px;
  margin-top: 24px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.legendSection h4 {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  color: var(--accent-primary);
  margin-bottom: 12px;
  text-transform: uppercase;
}

.legendItem {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-secondary);
}

.colorBox {
  width: 16px;
  height: 16px;
  border-radius: 2px;
}

.borderExample {
  width: 20px;
  height: 20px;
  border-style: solid;
  border-color: var(--accent-primary);
  border-radius: 50%;
}

.summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-top: 24px;
}

.stat {
  padding: 16px;
  background: rgba(255, 149, 0, 0.05);
  border: 1px solid rgba(255, 149, 0, 0.2);
  border-radius: 4px;
  text-align: center;
}

.statLabel {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 8px;
  text-transform: uppercase;
}

.statValue {
  font-family: var(--font-mono);
  font-size: 24px;
  font-weight: 700;
  color: var(--accent-primary);
}
```

---

## Phase 5: Intelligence Features

### 5.1 Surprise Factor Detector

**Objective**: Identify catalysts where Street expectations diverge from reality, creating asymmetric opportunities.

**Data Sources**:
1. **Sell-side analyst reports**: Extract price targets, revenue forecasts, PoS estimates
2. **Options market**: Implied volatility as proxy for expected move size
3. **Historical analogues**: Past catalyst outcomes for similar drug classes

**Implementation**:

```python
# Create bt_platform/logic/surprise_detector.py

class SurpriseDetector:
    """
    Analyzes catalyst setups for Street mispricing opportunities
    """
    
    def analyze_catalyst(
        self,
        catalyst: Catalyst,
        street_consensus: Dict,
        historical_analogues: List[Dict]
    ) -> Dict:
        """
        Compare Street expectations vs internal assessment
        
        Returns:
        {
            'street_pos': 0.45,  # Street probability of success
            'internal_pos': 0.70,  # Our assessment
            'differential': 0.25,  # Upside surprise potential
            'street_pt_upside': 0.15,  # % to Street PT
            'implied_success_pt_upside': 0.45,  # % upside if successful
            'risk_reward': 3.0,  # Asymmetry ratio
            'conviction': 'High'  # Our conviction level
        }
        """
        # Extract Street PoS from analyst reports
        street_pos = street_consensus.get('probability_of_success', 0.5)
        
        # Internal PoS based on data quality, precedents
        internal_pos = self.compute_internal_pos(catalyst, historical_analogues)
        
        # Differential = opportunity
        differential = internal_pos - street_pos
        
        # Calculate upside scenarios
        current_price = catalyst.company.last_price
        street_pt = street_consensus.get('price_target_mean', current_price)
        
        # Model success scenario PT
        success_pt = self.model_success_price_target(catalyst)
        
        upside_if_success = (success_pt - current_price) / current_price
        downside_if_fail = self.model_failure_downside(catalyst)
        
        risk_reward = abs(upside_if_success / downside_if_fail) if downside_if_fail != 0 else float('inf')
        
        # Conviction based on data quality
        conviction = 'High' if differential > 0.20 and risk_reward > 2.0 else \
                     'Medium' if differential > 0.10 else 'Low'
        
        return {
            'street_pos': street_pos,
            'internal_pos': internal_pos,
            'differential': differential,
            'street_pt_upside': (street_pt - current_price) / current_price,
            'implied_success_pt_upside': upside_if_success,
            'downside_if_fail': downside_if_fail,
            'risk_reward': risk_reward,
            'conviction': conviction
        }
    
    def compute_internal_pos(self, catalyst: Catalyst, analogues: List[Dict]) -> float:
        """
        Internal probability of success assessment
        
        Factors:
        - Endpoint type (hard vs surrogate)
        - Trial design quality (randomized, blinded, powered)
        - Historical precedents for drug class
        - FDA feedback (breakthrough, fast track)
        - Safety profile to date
        """
        # Base PoS by phase/event type
        base_pos = {
            'Phase 1': 0.65,
            'Phase 2': 0.35,
            'Phase 3': 0.60,
            'FDA Approval': 0.85,
            'Label Expansion': 0.75
        }.get(catalyst.event_type, 0.50)
        
        # Adjust for endpoint quality
        if catalyst.endpoint_type == 'hard':
            base_pos += 0.10  # Hard endpoints more convincing
        
        # Adjust for regulatory momentum
        if catalyst.breakthrough_designation:
            base_pos += 0.15
        
        # Adjust based on analogues
        if analogues:
            analogue_success_rate = sum(a['success'] for a in analogues) / len(analogues)
            base_pos = (base_pos + analogue_success_rate) / 2
        
        return min(base_pos, 0.95)  # Cap at 95%
    
    def model_success_price_target(self, catalyst: Catalyst) -> float:
        """
        Model stock price if catalyst succeeds
        
        Uses peak sales potential and comparable valuations
        """
        peak_sales = catalyst.peak_sales_potential
        if not peak_sales:
            # Estimate from indication prevalence
            peak_sales = self.estimate_peak_sales(catalyst)
        
        # Biotech rule of thumb: EV/Peak Sales multiples
        # Rare disease: 5-7x, Oncology: 3-5x, Chronic: 2-4x
        multiple = {
            'Rare Diseases': 6.0,
            'Oncology': 4.0,
            'Cardiometabolic': 3.0,
            'Immunology': 3.5
        }.get(catalyst.therapeutic_area, 3.0)
        
        implied_ev = peak_sales * multiple
        current_ev = catalyst.company.market_cap + catalyst.company.net_debt
        
        upside_ev = implied_ev - current_ev
        upside_per_share = upside_ev / catalyst.company.shares_outstanding
        
        success_pt = catalyst.company.last_price + upside_per_share
        
        return success_pt
    
    def model_failure_downside(self, catalyst: Catalyst) -> float:
        """
        Model downside if catalyst fails
        
        Depends on:
        - Pipeline depth (other shots on goal?)
        - Cash runway (time to next catalyst)
        - Asset specificity (can be pivoted?)
        """
        # Base downside: -30% for single-asset companies
        downside = -0.30
        
        # Adjust for pipeline depth
        if catalyst.company.pipeline_count > 3:
            downside = -0.20  # Less concentrated risk
        
        # Adjust for cash runway
        if catalyst.company.cash_runway_months > 24:
            downside = downside * 0.8  # More time to recover
        
        return downside
```

### 5.2 Historical Catalyst Database

**Objective**: Build a database of past catalyst outcomes for pattern recognition and analogue analysis.

**Data Collection**:
1. Scrape historical FDA approvals (Drugs@FDA archive)
2. Parse clinical trial results from press releases/8-Ks
3. Link to stock price movements post-event
4. Classify outcomes as "success", "partial success", "failure"

**Schema**:

```python
class HistoricalCatalyst(Base):
    """Historical catalyst outcomes for pattern recognition"""
    __tablename__ = "historical_catalysts"
    
    id = Column(Integer, primary_key=True)
    company = Column(String, index=True)
    ticker = Column(String, index=True)
    drug = Column(String, index=True)
    indication = Column(String, index=True)
    therapeutic_area = Column(String, index=True)
    
    # Event details
    event_type = Column(String, index=True)
    event_date = Column(DateTime, index=True)
    endpoint_type = Column(String)  # hard vs surrogate
    
    # Outcome
    outcome = Column(String, index=True)  # success, partial, failure
    outcome_details = Column(Text)
    met_primary_endpoint = Column(Boolean)
    met_secondary_endpoints = Column(Boolean)
    
    # Market reaction
    price_before = Column(Float)
    price_after_1d = Column(Float)
    price_after_1w = Column(Float)
    price_change_1d_pct = Column(Float)
    price_change_1w_pct = Column(Float)
    volume_spike = Column(Float)  # Multiple of avg volume
    
    # Street context
    street_pos_before = Column(Float)  # Consensus PoS before event
    street_surprise = Column(Boolean)  # Did it surprise Street?
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
```

**Usage**:

```python
def find_analogues(catalyst: Catalyst, db: Session) -> List[HistoricalCatalyst]:
    """
    Find historical analogues for pattern matching
    
    Match on:
    - Therapeutic area
    - Event type
    - Endpoint type
    - Market cap range
    """
    analogues = db.query(HistoricalCatalyst).filter(
        HistoricalCatalyst.therapeutic_area == catalyst.therapeutic_area,
        HistoricalCatalyst.event_type == catalyst.event_type,
        HistoricalCatalyst.endpoint_type == catalyst.endpoint_type
    ).order_by(HistoricalCatalyst.event_date.desc()).limit(20).all()
    
    return analogues

def compute_success_rate_for_analogues(analogues: List[HistoricalCatalyst]) -> float:
    """Compute historical success rate for similar catalysts"""
    if not analogues:
        return 0.5  # Default
    
    successes = sum(1 for a in analogues if a.outcome == 'success')
    return successes / len(analogues)
```

### 5.3 Competitive Landscape Analysis

**Objective**: For each catalyst, identify competing assets and comparative positioning.

**Implementation**:

```python
class CompetitiveLandscapeAnalyzer:
    """
    Analyzes competitive dynamics for a catalyst
    """
    
    def analyze_landscape(self, catalyst: Catalyst, db: Session) -> Dict:
        """
        Map competitive landscape
        
        Returns:
        {
            'competitors': [
                {
                    'company': 'Amgen',
                    'drug': 'AMG 890',
                    'phase': 'Phase 3',
                    'moa': 'PCSK9 inhibitor',
                    'differentiation': 'Monthly dosing vs quarterly',
                    'timeline': '2025 Q2 readout'
                },
                ...
            ],
            'market_position': 'First-in-class' | 'Best-in-class' | 'Fast-follower',
            'differentiation_score': 0.75,  # 0-1, how differentiated
            'competitive_threat': 'Low' | 'Medium' | 'High'
        }
        """
        # Find competing assets
        competitors = self.find_competitors(catalyst, db)
        
        # Assess differentiation
        diff_score = self.score_differentiation(catalyst, competitors)
        
        # Determine market position
        position = self.determine_market_position(catalyst, competitors)
        
        return {
            'competitors': [self.format_competitor(c) for c in competitors],
            'market_position': position,
            'differentiation_score': diff_score,
            'competitive_threat': 'Low' if diff_score > 0.7 else 'Medium' if diff_score > 0.4 else 'High'
        }
    
    def find_competitors(self, catalyst: Catalyst, db: Session) -> List[Drug]:
        """
        Find competing drugs in same indication
        
        Search by:
        - Same indication
        - Similar mechanism of action
        - Active Phase 2/3 development or approved
        """
        indication = catalyst.indication
        
        competitors = db.query(Drug).filter(
            Drug.indication.ilike(f"%{indication}%"),
            Drug.id != catalyst.drug_id,
            Drug.phase.in_(['Phase 2', 'Phase 3', 'Filed', 'Approved'])
        ).all()
        
        return competitors
    
    def score_differentiation(self, catalyst: Catalyst, competitors: List[Drug]) -> float:
        """
        Score how differentiated the asset is
        
        Factors:
        - Novel mechanism of action
        - Improved efficacy
        - Better safety profile
        - Dosing convenience
        - Route of administration
        """
        if not competitors:
            return 1.0  # First-in-class
        
        # Check for novel MOA
        novel_moa = catalyst.mechanism not in [c.mechanism for c in competitors]
        
        # Check timeline advantage
        first_to_market = all(
            catalyst.expected_approval_date < c.expected_approval_date
            for c in competitors if c.expected_approval_date
        )
        
        score = 0.5  # Base
        if novel_moa:
            score += 0.3
        if first_to_market:
            score += 0.2
        
        return min(score, 1.0)
    
    def determine_market_position(self, catalyst: Catalyst, competitors: List[Drug]) -> str:
        """Classify market position"""
        if not competitors:
            return "First-in-class"
        
        # Check if any approved drugs in indication
        approved = [c for c in competitors if c.status == 'Approved']
        
        if not approved:
            return "First-in-class"
        
        # Check differentiation
        if catalyst.mechanism not in [c.mechanism for c in approved]:
            return "Best-in-class (novel MOA)"
        
        return "Fast-follower"
```

---

## Implementation Roadmap

### Sprint 1: Portfolio & Data Foundation (2 weeks)

**Week 1:**
- [ ] Build SEC 13F scraper for Redmile holdings
- [ ] Create PortfolioHolding database model
- [ ] Implement portfolio API endpoints
- [ ] Ingest latest Redmile 13F filing

**Week 2:**
- [ ] Map portfolio companies to therapeutic areas
- [ ] Build portfolio-filtered catalyst endpoint
- [ ] Create holdings history view
- [ ] Test end-to-end portfolio integration

### Sprint 2: Enhanced Scoring (2 weeks)

**Week 1:**
- [ ] Design 8-dimension scoring algorithm
- [ ] Implement Street Differential computation
- [ ] Add Volatility Potential scoring
- [ ] Add Execution Risk scoring

**Week 2:**
- [ ] Update database schema with new scoring fields
- [ ] Build Street consensus data scraper (analyst reports)
- [ ] Implement enhanced scoring API
- [ ] Seed 50 catalysts with enhanced scores

### Sprint 3: Multi-Source Aggregation (3 weeks)

**Week 1:**
- [ ] Build FDA PDUFA scraper
- [ ] Build AdComm calendar scraper
- [ ] Enhance CTGov scraper for Phase 3 trials
- [ ] Implement endpoint type classifier (hard vs surrogate)

**Week 2:**
- [ ] Build SEC 8-K catalyst detector
- [ ] Build conference calendar scraper (ASCO, ASH, AHA)
- [ ] Build insider transaction scraper (Form 4)
- [ ] Implement deduplication logic

**Week 3:**
- [ ] Build orchestration pipeline (CatalystPipeline)
- [ ] Set up daily cron job for pipeline
- [ ] Implement change detection and alerting
- [ ] Test full pipeline end-to-end

### Sprint 4: PM Calendar UI (2 weeks)

**Week 1:**
- [ ] Design calendar component mockups
- [ ] Implement CatalystCalendarPM React component
- [ ] Build therapeutic area color encoding
- [ ] Implement time horizon selector (30/60/90 days)

**Week 2:**
- [ ] Add visual encoding (size, border, icons)
- [ ] Implement filters (tier, therapeutic area)
- [ ] Build drill-down panels for catalyst details
- [ ] Add portfolio overlay highlighting

### Sprint 5: Intelligence Features (3 weeks)

**Week 1:**
- [ ] Build SurpriseDetector module
- [ ] Implement internal PoS computation
- [ ] Build success/failure price target models
- [ ] Create surprise factor dashboard UI

**Week 2:**
- [ ] Build historical catalyst database
- [ ] Scrape historical FDA approvals and outcomes
- [ ] Link to stock price movements
- [ ] Implement analogue finder

**Week 3:**
- [ ] Build CompetitiveLandscapeAnalyzer
- [ ] Implement competitor finder
- [ ] Build differentiation scoring
- [ ] Create competitive landscape UI component

### Sprint 6: Documentation & Polish (1 week)

- [ ] Write user documentation for PM workflows
- [ ] Create onboarding tutorial video
- [ ] Build admin dashboard for pipeline monitoring
- [ ] Performance optimization and caching
- [ ] Security audit and API rate limiting

---

## Technical Specifications

### API Endpoints

#### Portfolio
```
GET  /api/v1/portfolio/redmile/holdings
GET  /api/v1/portfolio/redmile/holdings/history?ticker={TICKER}
POST /api/v1/portfolio/redmile/sync
```

#### Catalysts
```
GET  /api/v1/catalysts/calendar?portfolio=redmile&days=90&min_score=12
GET  /api/v1/catalysts/{id}
GET  /api/v1/catalysts/{id}/score
POST /api/v1/catalysts/{id}/score (manual override)
GET  /api/v1/catalysts/high-conviction
GET  /api/v1/catalysts/surprise-opportunities
```

#### Street Consensus
```
GET  /api/v1/street/consensus/{ticker}
GET  /api/v1/street/differential/{catalyst_id}
```

#### Intelligence
```
GET  /api/v1/intelligence/competitive-landscape/{catalyst_id}
GET  /api/v1/intelligence/analogues/{catalyst_id}
GET  /api/v1/intelligence/surprise-analysis/{catalyst_id}
```

### Database Schema Summary

**New Tables:**
1. `portfolio_holdings` - 13F institutional holdings
2. `historical_catalysts` - Past catalyst outcomes
3. `insider_transactions` - Form 4 filings
4. `street_consensus` - Analyst forecasts
5. `competitive_assets` - Competing drugs in same indication

**Enhanced Tables:**
1. `catalysts` - Add 3 new scoring dimensions + Street data
2. `companies` - Add `therapeutic_area`, `cash_runway_months`
3. `drugs` - Add `expected_approval_date`, `peak_sales_potential`

### Performance Considerations

1. **Caching**: Redis cache for catalyst scores (30min TTL), street consensus (24hr TTL)
2. **Indexing**: Compound indexes on `(fund_cik, ticker, report_date)`, `(event_date, status)`
3. **Pagination**: All list endpoints paginated (default 50, max 100)
4. **Rate Limiting**: SEC EDGAR (10 req/s), FDA (240 req/min), CTGov (10 req/s)
5. **Async Processing**: Scraping pipeline runs async, does not block API

---

## Success Metrics

### Quantitative
1. **Coverage**: >90% of Redmile portfolio companies have catalyst coverage
2. **Freshness**: Catalysts updated within 24 hours of source publication
3. **Accuracy**: >80% of catalyst dates within ±7 days of actual event
4. **Surprise Detection**: Identify 10+ high-conviction surprise setups per quarter

### Qualitative
1. **PM Feedback**: Positive feedback from PM on calendar usability
2. **Signal Quality**: Catalysts flagged as "Ultra-High" tier show >2x risk/reward
3. **Competitive Advantage**: System surfaces catalysts 1-2 weeks before Street reports

---

## Appendix A: Redmile Group Holdings Research

### Data Source
Redmile Group LLC (CIK: 0001454691) files quarterly 13F-HR reports with SEC.

### Latest Filing Analysis (Q3 2024 - Example)

**Top 10 Biotech Holdings** (to be populated with actual data):

1. **Vertex Pharmaceuticals (VRTX)** - 5.2% of portfolio
   - Therapeutic Areas: Rare Diseases (CF, SCD), Pain
   - Upcoming Catalysts: VX-548 acute pain Phase 3, VX-147 APOL1 kidney disease

2. **Argenx SE (ARGX)** - 4.8% of portfolio
   - Therapeutic Areas: Immunology (MG, CIDP, ITP)
   - Upcoming Catalysts: Vyvgart label expansions, pipeline readouts

3. **Neurocrine Biosciences (NBIX)** - 3.9% of portfolio
   - Therapeutic Areas: Neurology (TD, Parkinson's, MDD)
   - Upcoming Catalysts: Crinecerfont CAH approval, pipeline updates

4. **[Continue for all holdings...]**

### Therapeutic Area Breakdown
- Oncology: 32%
- Rare Diseases: 28%
- Immunology: 18%
- Neurology: 12%
- Cardiometabolic: 10%

---

## Appendix B: Glossary

**13F**: Quarterly report filed by institutional investment managers holding >$100M in equities
**AdComm**: FDA Advisory Committee meeting where external experts review drug applications
**PDUFA**: Prescription Drug User Fee Act - sets target dates for FDA review completion
**PoS**: Probability of Success - likelihood that a drug development program succeeds
**Hard Endpoint**: Clinical outcome directly measuring patient benefit (death, hospitalization, disease events)
**Surrogate Endpoint**: Biomarker or indirect measure (LDL-C, HbA1c) used as proxy for clinical benefit
**CRL**: Complete Response Letter - FDA's request for additional information before approval
**MACE**: Major Adverse Cardiovascular Events - composite endpoint of CV death, MI, stroke
**8-K**: SEC form for material corporate events disclosed within 4 days

---

## Appendix C: References

1. SEC EDGAR API: https://www.sec.gov/edgar/sec-api-documentation
2. FDA PDUFA Dates: https://www.fda.gov/drugs/nda-and-bla-approvals
3. ClinicalTrials.gov API: https://clinicaltrials.gov/api/gui
4. OpenFDA: https://open.fda.gov/apis/
5. Redmile Group 13F Filings: https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001454691

---

**Document Version**: 1.0
**Last Updated**: 2024-10-13
**Authors**: Biotech Terminal Development Team
**Status**: Implementation Blueprint - Ready for Development

---

For questions or clarifications, please contact the development team or open an issue in the GitHub repository.

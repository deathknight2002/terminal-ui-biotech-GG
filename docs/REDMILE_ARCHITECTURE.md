# Redmile Catalyst System - Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        EXTERNAL DATA SOURCES                             │
├─────────────────────────────────────────────────────────────────────────┤
│  SEC EDGAR    │    FDA.gov    │  CTGov API  │ Conferences │  Form 4     │
│  (13F, 8-K)   │ (PDUFA, AdComm)│ (Phase 3)   │ (ASCO, ASH) │ (Insiders)  │
└─────────────────────────────────────────────────────────────────────────┘
         │              │              │              │             │
         ▼              ▼              ▼              ▼             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          SCRAPER LAYER                                   │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │ 13F Scraper │  │ PDUFA Scraper│  │  8-K Detector│  │  CTGov v2   │  │
│  │  (Quarterly)│  │   (Daily)    │  │   (Real-time)│  │  Enhanced   │  │
│  └─────────────┘  └──────────────┘  └──────────────┘  └─────────────┘  │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐                   │
│  │  AdComm     │  │  Conference  │  │   Insider    │                   │
│  │  Calendar   │  │   Abstracts  │  │  Transactions│                   │
│  └─────────────┘  └──────────────┘  └──────────────┘                   │
│                                                                          │
│  Features:                                                               │
│  • Rate limiting (SEC: 10 req/s, FDA: 240 req/min)                      │
│  • Retry logic with exponential backoff                                 │
│  • User-agent rotation                                                  │
│  • CloudEvents publishing for discovered catalysts                      │
└──────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    CATALYST PIPELINE ORCHESTRATOR                        │
├─────────────────────────────────────────────────────────────────────────┤
│  1. Portfolio Filter    → Match against Redmile holdings                │
│  2. Deduplication       → Same company+drug+date = 1 catalyst            │
│  3. Enrichment          → Add market cap, therapeutic area, tickers     │
│  4. Scoring             → Apply 8-dimension algorithm                    │
│  5. Street Comparison   → Compare vs analyst consensus                  │
│  6. Historical Match    → Find analogues for pattern recognition        │
│                                                                          │
│  Schedule: Daily at 6 AM ET via cron                                    │
│  Runtime: ~15-30 minutes for full refresh                               │
└──────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      INTELLIGENCE ENGINES                                │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────────┐   │
│  │ Surprise Detector│  │  Competitive     │  │  Historical         │   │
│  │                  │  │  Landscape       │  │  Analogue Matcher   │   │
│  │ • Street PoS     │  │  Analyzer        │  │                     │   │
│  │ • Internal PoS   │  │                  │  │ • Success rate      │   │
│  │ • Differential   │  │ • Find competitors│  │ • Price reactions   │   │
│  │ • Risk/Reward    │  │ • Differentiation│  │ • Pattern matching  │   │
│  └──────────────────┘  └──────────────────┘  └─────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │              Enhanced Scoring Algorithm (8 Dimensions)           │   │
│  │                                                                  │   │
│  │  1. Event Leverage (0-4)        ─┐                              │   │
│  │  2. Timing Clarity (0-3)         │                              │   │
│  │  3. Surprise Factor (0-3)        │  Core Dimensions             │   │
│  │  4. Downside Contained (0-3)     │  (Existing)                  │   │
│  │  5. Market Depth (0-3)          ─┘                              │   │
│  │                                                                  │   │
│  │  6. Street Differential (0-3)   ─┐                              │   │
│  │  7. Volatility Potential (0-2)   │  New Dimensions              │   │
│  │  8. Execution Risk (0-2)        ─┘  (Enhanced)                  │   │
│  │                                                                  │   │
│  │  Total: 0-24 scale                                              │   │
│  │  Tiers: Ultra-High (16-24), High-Torque (12-15),               │   │
│  │         Tradable (8-11), Watch (<8)                             │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      DATABASE & CACHE LAYER                              │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  PostgreSQL (Primary Storage)                                   │    │
│  │  ┌──────────────────┐  ┌───────────────────┐  ┌──────────────┐ │    │
│  │  │ portfolio_holdings│  │    catalysts      │  │  companies   │ │    │
│  │  │                   │  │                   │  │              │ │    │
│  │  │ • fund_name       │  │ • event_type      │  │ • ticker     │ │    │
│  │  │ • ticker          │  │ • event_date      │  │ • market_cap │ │    │
│  │  │ • shares          │  │ • scoring fields  │  │ • therapeutic│ │    │
│  │  │ • market_value    │  │ • street_pos      │  │   _area      │ │    │
│  │  │ • report_date     │  │ • company_id      │  │              │ │    │
│  │  └──────────────────┘  └───────────────────┘  └──────────────┘ │    │
│  │                                                                  │    │
│  │  ┌──────────────────┐  ┌───────────────────┐  ┌──────────────┐ │    │
│  │  │ historical_      │  │ insider_          │  │ street_      │ │    │
│  │  │ catalysts        │  │ transactions      │  │ consensus    │ │    │
│  │  │                  │  │                   │  │              │ │    │
│  │  │ • outcome        │  │ • insider_name    │  │ • ticker     │ │    │
│  │  │ • price_reaction │  │ • transaction_type│  │ • price_target│   │
│  │  │ • met_endpoint   │  │ • signal_strength │  │ • pos_estimate│  │
│  │  └──────────────────┘  └───────────────────┘  └──────────────┘ │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  Redis (Cache Layer)                                            │    │
│  │  • Catalyst scores (TTL: 30 min)                                │    │
│  │  • Street consensus (TTL: 24 hours)                             │    │
│  │  • Portfolio holdings (TTL: 24 hours)                           │    │
│  │  • Hot catalysts (next 30 days, TTL: 1 hour)                   │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  DuckDB (Analytics Engine)                                      │    │
│  │  • Historical analysis queries                                  │    │
│  │  • Backtest scoring algorithm performance                       │    │
│  │  • Portfolio attribution analysis                               │    │
│  │  • Trend analysis (catalyst density over time)                  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         API LAYER (FastAPI)                              │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌───────────────────┐  ┌────────────────────┐   │
│  │  Portfolio APIs  │  │   Catalyst APIs   │  │  Intelligence APIs │   │
│  │                  │  │                   │  │                    │   │
│  │ GET /portfolio/  │  │ GET /catalysts/   │  │ GET /intelligence/ │   │
│  │   redmile/       │  │   calendar        │  │   surprise-        │   │
│  │   holdings       │  │                   │  │   analysis/{id}    │   │
│  │                  │  │ GET /catalysts/   │  │                    │   │
│  │ GET /portfolio/  │  │   high-conviction │  │ GET /intelligence/ │   │
│  │   redmile/       │  │                   │  │   competitive-     │   │
│  │   holdings/      │  │ GET /catalysts/   │  │   landscape/{id}   │   │
│  │   history        │  │   {id}/score      │  │                    │   │
│  │                  │  │                   │  │ GET /intelligence/ │   │
│  │ POST /portfolio/ │  │ POST /catalysts/  │  │   analogues/{id}   │   │
│  │   redmile/sync   │  │   score           │  │                    │   │
│  └──────────────────┘  └───────────────────┘  └────────────────────┘   │
│                                                                          │
│  Features:                                                               │
│  • OpenAPI/Swagger documentation at /docs                               │
│  • JWT authentication for admin endpoints                               │
│  • Rate limiting: 100 req/min per IP                                    │
│  • CORS configured for frontend domain                                  │
│  • Response caching with ETags                                          │
└──────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      FRONTEND UI LAYER (React)                           │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  PM Catalyst Calendar                                           │    │
│  │  ┌──────────────────────────────────────────────────────────┐   │    │
│  │  │  Time Horizon: [30 days] [60 days] [90 days]            │   │    │
│  │  │  Filters: Tier ▼  Therapeutic Area ▼                     │   │    │
│  │  └──────────────────────────────────────────────────────────┘   │    │
│  │  ┌──────────────────────────────────────────────────────────┐   │    │
│  │  │  Week 1      Week 2      Week 3      Week 4              │   │    │
│  │  │  ┌─────┐    ┌─────┐    ┌─────┐    ┌─────┐               │   │    │
│  │  │  │ 💊  │    │ 🔬  │    │ 🎤  │    │ 💊  │               │   │    │
│  │  │  │VRTX │    │ARGX │    │NBIX │    │IONS │  [Color-coded]│   │    │
│  │  │  │18/24│    │15/24│    │12/24│    │19/24│  [by TA]      │   │    │
│  │  │  └─────┘    └─────┘    └─────┘    └─────┘               │   │    │
│  │  │           [Size = Market Opportunity]                     │   │    │
│  │  │           [Border = Tradeability Score]                   │   │    │
│  │  └──────────────────────────────────────────────────────────┘   │    │
│  │  ┌──────────────────────────────────────────────────────────┐   │    │
│  │  │  Legend: Colors, Icons, Borders                          │   │    │
│  │  │  Stats: 42 Total | 8 Ultra-High | 12 High-Torque        │   │    │
│  │  └──────────────────────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  Catalyst Drill-Down Panel                                      │    │
│  │  ┌──────────────────────────────────────────────────────────┐   │    │
│  │  │  Vertex Pharmaceuticals (VRTX) - VX-548                  │   │    │
│  │  │  Event: Phase 3 Acute Pain Readout | Feb 15, 2025        │   │    │
│  │  │                                                           │   │    │
│  │  │  Scoring Radar: [8-dimension visualization]              │   │    │
│  │  │  Total: 18/24 (Ultra-High)                               │   │    │
│  │  │                                                           │   │    │
│  │  │  Surprise Analysis:                                       │   │    │
│  │  │  • Street PoS: 45%  |  Internal PoS: 70%                 │   │    │
│  │  │  • Differential: +25% (HIGH CONVICTION)                  │   │    │
│  │  │  • Risk/Reward: 3.2x                                     │   │    │
│  │  │                                                           │   │    │
│  │  │  Competitive Landscape: First-in-class, novel MOA        │   │    │
│  │  │  Historical Analogues: 3 similar (67% success rate)      │   │    │
│  │  └──────────────────────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  Portfolio Exposure Heat Map                                    │    │
│  │  Shows which holdings have catalyst exposure in next 90 days    │    │
│  │  [Visual grid: Ticker x Catalyst Count, colored by conviction]  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  Surprise Factor Dashboard                                       │    │
│  │  Top 10 mispricing opportunities where Street is wrong          │    │
│  │  [Table: Ticker | Differential | Risk/Reward | Conviction]      │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  Tech Stack:                                                             │
│  • React 19 with TypeScript                                             │
│  • TanStack Query for data fetching/caching                             │
│  • Recharts + D3.js for visualizations                                  │
│  • Framer Motion for animations                                         │
│  • Glass-morphic Aurora design system                                   │
└──────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Example: From 13F Filing to PM Calendar

```
1. SEC publishes Redmile Q3 2024 13F filing
         ↓
2. 13F Scraper (cron job) discovers new filing
         ↓
3. Scraper parses XML, extracts 45 biotech holdings
         ↓
4. Holdings inserted into portfolio_holdings table
         ↓
5. Catalyst Pipeline queries portfolio tickers
         ↓
6. Pipeline filters all catalysts to 45 tickers only
         ↓
7. 18 upcoming catalysts match portfolio (next 90 days)
         ↓
8. Each catalyst scored with 8-dimension algorithm
         ↓
9. Street consensus scraped from analyst reports
         ↓
10. Surprise Detector identifies 3 high-differential setups
         ↓
11. Competitive Analyzer maps landscape for each
         ↓
12. Historical Matcher finds analogues for pattern recognition
         ↓
13. All data cached in Redis (30min TTL)
         ↓
14. API serves enriched data to frontend
         ↓
15. PM Calendar renders visual timeline
         ↓
16. PM clicks on catalyst → Drill-down panel shows full analysis
         ↓
17. PM exports high-conviction list for team review
```

## Scoring Algorithm Flow

```
Raw Catalyst Data
    ↓
┌───────────────────────────────┐
│  Base Scoring (0-16)          │
│  • Event Leverage (0-4)       │
│  • Timing Clarity (0-3)       │
│  • Surprise Factor (0-3)      │
│  • Downside Contained (0-3)   │
│  • Market Depth (0-3)         │
└───────────────────────────────┘
    ↓
┌───────────────────────────────┐
│  Enhanced Scoring (+8)        │
│  • Street Differential        │
│    - Fetch analyst consensus  │
│    - Compare vs internal PoS  │
│    - Score differential       │
│                               │
│  • Volatility Potential       │
│    - Check options IV         │
│    - Assess binary nature     │
│    - Model price impact       │
│                               │
│  • Execution Risk             │
│    - Evaluate complexity      │
│    - Check manufacturing risk │
│    - Assess regulatory path   │
└───────────────────────────────┘
    ↓
┌───────────────────────────────┐
│  Total Score (0-24)           │
│  + Tier Classification        │
│  + Rationale Generation       │
│  + Confidence Metrics         │
└───────────────────────────────┘
    ↓
Enriched Catalyst Ready for Display
```

## Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Scraping** | aiohttp, BeautifulSoup, asyncio | Async web scraping with rate limiting |
| **Pipeline** | Python asyncio, APScheduler | Orchestration and scheduling |
| **Intelligence** | NumPy, pandas, scikit-learn | Analytics and pattern matching |
| **Storage** | PostgreSQL, Redis, DuckDB | Relational, cache, analytics |
| **API** | FastAPI, SQLAlchemy, Pydantic | REST API with validation |
| **Frontend** | React, TypeScript, TanStack Query | UI with smart caching |
| **Visualization** | Recharts, D3.js, Framer Motion | Charts and animations |
| **Testing** | pytest, vitest, React Testing Library | Comprehensive test coverage |
| **Deployment** | Docker, docker-compose, nginx | Containerized deployment |
| **Monitoring** | Prometheus, Grafana, Sentry | Observability and error tracking |

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Production Environment (AWS/GCP/Azure)                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Load        │  │   Frontend   │  │   Backend    │          │
│  │  Balancer    │→ │   (Nginx)    │→ │   (FastAPI)  │          │
│  │  (ALB)       │  │   (React)    │  │   (Gunicorn) │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                            ↓                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  PostgreSQL  │  │    Redis     │  │   DuckDB     │          │
│  │  (RDS)       │  │  (ElastiCache)│  │  (S3-backed) │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Scraper     │  │   Pipeline   │  │  Monitoring  │          │
│  │  Workers     │  │   Scheduler  │  │  (Prometheus)│          │
│  │  (ECS Tasks) │  │   (Airflow)  │  │  (Grafana)   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└──────────────────────────────────────────────────────────────────┘
```

## Security Considerations

1. **API Authentication**: JWT tokens with 1-hour expiry, refresh tokens
2. **Rate Limiting**: 100 requests/minute per IP, 1000/hour per user
3. **Data Encryption**: TLS 1.3 for transport, AES-256 for data at rest
4. **Secret Management**: AWS Secrets Manager / HashiCorp Vault
5. **Input Validation**: Pydantic models for all API inputs
6. **SQL Injection**: SQLAlchemy ORM, no raw SQL queries
7. **XSS Prevention**: React automatic escaping, Content Security Policy
8. **CORS**: Whitelist frontend domain only
9. **Audit Logging**: All API calls logged with user, timestamp, IP

---

**Version**: 1.0  
**Last Updated**: 2024-10-13  
**Status**: Reference Architecture

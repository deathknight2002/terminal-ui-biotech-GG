# Sprints 2-6 Implementation Guide
## Redmile Catalyst Intelligence System

> **Duration:** Sprints 2-6 (11 weeks)
> **Prerequisites:** Sprint 1 (Portfolio Foundation) complete
> **Goal:** Complete the Redmile Catalyst Intelligence System

---

## Table of Contents

1. [Sprint 2: Enhanced Scoring](#sprint-2-enhanced-scoring)
2. [Sprint 3: Multi-Source Aggregation](#sprint-3-multi-source-aggregation)
3. [Sprint 4: PM Calendar UI](#sprint-4-pm-calendar-ui)
4. [Sprint 5: Intelligence Features](#sprint-5-intelligence-features)
5. [Sprint 6: Documentation & Polish](#sprint-6-documentation--polish)

---

## Sprint 2: Enhanced Scoring (2 weeks)

### Overview

Build an 8-dimension scoring algorithm (0-24 scale) that quantifies catalyst tradeability.

### Goals

- Implement enhanced scoring algorithm
- Integrate Street consensus data
- Rescore existing catalyst watchlist
- Create scoring API endpoints

### Deliverables

#### 1. Scoring Algorithm Implementation

Create `bt_platform/logic/catalyst_scoring.py`:

```python
"""
Enhanced Catalyst Scoring Algorithm

8 dimensions (0-24 scale):
1. Event Leverage (0-4)
2. Timing Clarity (0-3)
3. Surprise Factor (0-3)
4. Downside Contained (0-3)
5. Market Depth (0-3)
6. Street Differential (0-3)
7. Volatility Potential (0-2)
8. Execution Risk (0-2)
"""

from typing import Dict, Optional
from dataclasses import dataclass


@dataclass
class CatalystScore:
    """Enhanced catalyst score"""
    total: int  # 0-24
    tier: str   # Ultra-High, High-Torque, Tradable, Watch

    # Individual dimensions
    event_leverage: int        # 0-4
    timing_clarity: int        # 0-3
    surprise_factor: int       # 0-3
    downside_contained: int    # 0-3
    market_depth: int          # 0-3
    street_differential: int   # 0-3
    volatility_potential: int  # 0-2
    execution_risk: int        # 0-2

    # Metadata
    confidence: float  # 0-1
    rationale: str


class CatalystScorer:
    """Enhanced scoring algorithm"""

    def score_catalyst(
        self,
        catalyst: Dict,
        street_consensus: Optional[Dict] = None,
        historical_outcomes: Optional[Dict] = None
    ) -> CatalystScore:
        """
        Score a catalyst across 8 dimensions

        Args:
            catalyst: Catalyst data (event_type, endpoint, company, etc.)
            street_consensus: Street PoS and expectations
            historical_outcomes: Historical analogue data

        Returns:
            CatalystScore with breakdown
        """
        # Dimension 1: Event Leverage (0-4)
        event_leverage = self._score_event_leverage(catalyst)

        # Dimension 2: Timing Clarity (0-3)
        timing_clarity = self._score_timing_clarity(catalyst)

        # Dimension 3: Surprise Factor (0-3)
        surprise_factor = self._score_surprise_factor(catalyst, historical_outcomes)

        # Dimension 4: Downside Contained (0-3)
        downside_contained = self._score_downside_contained(catalyst)

        # Dimension 5: Market Depth (0-3)
        market_depth = self._score_market_depth(catalyst)

        # Dimension 6: Street Differential (0-3)
        street_differential = self._score_street_differential(catalyst, street_consensus)

        # Dimension 7: Volatility Potential (0-2)
        volatility_potential = self._score_volatility_potential(catalyst)

        # Dimension 8: Execution Risk (0-2) - inverted
        execution_risk = self._score_execution_risk(catalyst)

        # Calculate total
        total = (
            event_leverage +
            timing_clarity +
            surprise_factor +
            downside_contained +
            market_depth +
            street_differential +
            volatility_potential +
            execution_risk
        )

        # Determine tier
        tier = self._determine_tier(total)

        # Generate rationale
        rationale = self._generate_rationale(catalyst, total, tier)

        # Confidence (based on data completeness)
        confidence = self._calculate_confidence(catalyst, street_consensus)

        return CatalystScore(
            total=total,
            tier=tier,
            event_leverage=event_leverage,
            timing_clarity=timing_clarity,
            surprise_factor=surprise_factor,
            downside_contained=downside_contained,
            market_depth=market_depth,
            street_differential=street_differential,
            volatility_potential=volatility_potential,
            execution_risk=execution_risk,
            confidence=confidence,
            rationale=rationale
        )

    def _score_event_leverage(self, catalyst: Dict) -> int:
        """
        Score event leverage (0-4)

        Hard endpoints (MACE, mortality) > soft endpoints (biomarkers)
        """
        endpoint_type = catalyst.get('endpoint_type', '').lower()

        if any(hard in endpoint_type for hard in ['mace', 'mortality', 'survival', 'hospitalization']):
            return 4  # Hard clinical endpoint
        elif 'phase 3' in catalyst.get('event_type', '').lower():
            return 3  # Phase 3 readout
        elif 'approval' in catalyst.get('event_type', '').lower():
            return 3  # FDA approval
        elif 'phase 2' in catalyst.get('event_type', '').lower():
            return 2  # Phase 2 readout
        else:
            return 1  # Other events

    def _score_timing_clarity(self, catalyst: Dict) -> int:
        """
        Score timing clarity (0-3)

        Fixed PDUFA date > expected completion date > TBD
        """
        event_type = catalyst.get('event_type', '').lower()
        has_date = catalyst.get('event_date') is not None

        if 'pdufa' in event_type and has_date:
            return 3  # Fixed PDUFA date
        elif has_date and 'primary completion' in event_type:
            return 2  # Expected completion date
        elif has_date:
            return 1  # Date provided but uncertain
        else:
            return 0  # No date

    def _score_surprise_factor(self, catalyst: Dict, historical_outcomes: Optional[Dict]) -> int:
        """
        Score surprise potential (0-3)

        Based on historical analogues and Street underweighting
        """
        if not historical_outcomes:
            return 1  # Default

        # Check if Street historically underweighted similar catalysts
        analogue_surprise_rate = historical_outcomes.get('surprise_rate', 0)

        if analogue_surprise_rate > 0.6:
            return 3  # High surprise potential
        elif analogue_surprise_rate > 0.4:
            return 2  # Moderate surprise
        elif analogue_surprise_rate > 0.2:
            return 1  # Low surprise
        else:
            return 0  # No surprise expected

    def _score_downside_contained(self, catalyst: Dict) -> int:
        """
        Score downside containment (0-3)

        CRL resolution, class read-through, prior failed trials
        """
        catalyst_history = catalyst.get('history', [])

        if 'crl_resolved' in catalyst_history:
            return 3  # CRL resolved, clear path
        elif 'class_positive' in catalyst_history:
            return 2  # Class validation
        elif len(catalyst_history) == 0:
            return 1  # No negative history
        else:
            return 0  # Prior failures

    def _score_market_depth(self, catalyst: Dict) -> int:
        """
        Score market depth (0-3)

        Peak sales potential + payer appetite
        """
        peak_sales = catalyst.get('peak_sales_estimate', 0)  # USD millions

        if peak_sales > 5000:
            return 3  # Blockbuster ($5B+)
        elif peak_sales > 1000:
            return 2  # Large market ($1B+)
        elif peak_sales > 500:
            return 1  # Moderate market
        else:
            return 0  # Small market

    def _score_street_differential(self, catalyst: Dict, street_consensus: Optional[Dict]) -> int:
        """
        Score Street differential (0-3)

        YOUR PoS vs Street consensus PoS
        """
        if not street_consensus:
            return 0  # No Street data

        house_pos = catalyst.get('house_pos', 0.5)  # Your PoS
        street_pos = street_consensus.get('consensus_pos', 0.5)

        differential = abs(house_pos - street_pos)

        if differential > 0.3:
            return 3  # Large differential (>30%)
        elif differential > 0.2:
            return 2  # Moderate differential
        elif differential > 0.1:
            return 1  # Small differential
        else:
            return 0  # Aligned with Street

    def _score_volatility_potential(self, catalyst: Dict) -> int:
        """
        Score volatility potential (0-2)

        Expected move magnitude based on options IV and binary nature
        """
        is_binary = catalyst.get('is_binary', False)  # FDA approval, Phase 3
        market_cap = catalyst.get('market_cap', 0)
        peak_sales = catalyst.get('peak_sales_estimate', 0)

        # If peak sales >> market cap, high volatility potential
        if is_binary and peak_sales > market_cap * 2:
            return 2  # High volatility
        elif is_binary or peak_sales > market_cap:
            return 1  # Moderate volatility
        else:
            return 0  # Low volatility

    def _score_execution_risk(self, catalyst: Dict) -> int:
        """
        Score execution risk (0-2) - INVERTED

        Clear regulatory path = higher score
        """
        has_breakthrough = catalyst.get('breakthrough_designation', False)
        has_fast_track = catalyst.get('fast_track', False)
        manufacturing_ready = catalyst.get('manufacturing_ready', False)

        if has_breakthrough and manufacturing_ready:
            return 2  # Low execution risk
        elif has_fast_track or manufacturing_ready:
            return 1  # Moderate risk
        else:
            return 0  # High execution risk

    def _determine_tier(self, total_score: int) -> str:
        """Determine tier from total score"""
        if total_score >= 16:
            return "Ultra-High"  # 🚀
        elif total_score >= 12:
            return "High-Torque"  # ⚡
        elif total_score >= 8:
            return "Tradable"  # 📊
        else:
            return "Watch"  # 👁️

    def _generate_rationale(self, catalyst: Dict, total: int, tier: str) -> str:
        """Generate human-readable rationale"""
        company = catalyst.get('company', 'Unknown')
        drug = catalyst.get('drug', 'Unknown')
        event_type = catalyst.get('event_type', 'Unknown')

        return f"{company} {drug} {event_type} - Score: {total}/24 ({tier})"

    def _calculate_confidence(self, catalyst: Dict, street_consensus: Optional[Dict]) -> float:
        """Calculate confidence based on data completeness"""
        fields = [
            catalyst.get('event_date'),
            catalyst.get('endpoint_type'),
            catalyst.get('peak_sales_estimate'),
            catalyst.get('market_cap'),
            street_consensus,
        ]

        completeness = sum(1 for f in fields if f is not None) / len(fields)
        return completeness
```

#### 2. Street Consensus Scraper

Create `bt_platform/scrapers/sites/street_consensus_scraper.py`:

```python
"""
Street Consensus Scraper

Extracts analyst PoS (Probability of Success) from reports
"""

from typing import Dict, List, Optional
import re
from bs4 import BeautifulSoup


class StreetConsensusScraper:
    """Scraper for Street consensus data"""

    def scrape_analyst_reports(self, ticker: str) -> Dict:
        """
        Scrape analyst reports for consensus PoS

        In production, integrate with:
        - Bloomberg Terminal API
        - FactSet API
        - Analyst report databases

        For Sprint 2, use mock data
        """
        # Mock data for demonstration
        # Replace with actual API integration
        mock_data = {
            'VRTX': {'consensus_pos': 0.75, 'analysts': 25, 'target_price': 450},
            'IONS': {'consensus_pos': 0.60, 'analysts': 15, 'target_price': 55},
        }

        return mock_data.get(ticker, {'consensus_pos': 0.5, 'analysts': 0})
```

#### 3. Scoring API Endpoints

Add to `bt_platform/core/endpoints/catalysts.py`:

```python
from bt_platform.logic.catalyst_scoring import CatalystScorer

scorer = CatalystScorer()


@router.get("/catalysts/{id}/score")
async def get_catalyst_score(
    id: int,
    include_breakdown: bool = Query(True, description="Include dimension breakdown"),
    db: Session = Depends(get_db)
):
    """Get enhanced score for a catalyst"""
    catalyst = db.query(Catalyst).filter(Catalyst.id == id).first()

    if not catalyst:
        raise HTTPException(status_code=404, detail="Catalyst not found")

    # Get Street consensus
    from bt_platform.scrapers.sites.street_consensus_scraper import StreetConsensusScraper
    street_scraper = StreetConsensusScraper()
    street_consensus = street_scraper.scrape_analyst_reports(catalyst.ticker)

    # Score catalyst
    score = scorer.score_catalyst(
        catalyst={
            'event_type': catalyst.event_type,
            'endpoint_type': catalyst.endpoint_type,
            'event_date': catalyst.event_date,
            'company': catalyst.company,
            'drug': catalyst.drug,
            'peak_sales_estimate': catalyst.peak_sales_estimate,
            'market_cap': catalyst.market_cap,
        },
        street_consensus=street_consensus
    )

    result = {
        'catalyst_id': id,
        'total_score': score.total,
        'tier': score.tier,
        'confidence': score.confidence,
        'rationale': score.rationale,
    }

    if include_breakdown:
        result['breakdown'] = {
            'event_leverage': score.event_leverage,
            'timing_clarity': score.timing_clarity,
            'surprise_factor': score.surprise_factor,
            'downside_contained': score.downside_contained,
            'market_depth': score.market_depth,
            'street_differential': score.street_differential,
            'volatility_potential': score.volatility_potential,
            'execution_risk': score.execution_risk,
        }

    return result


@router.post("/catalysts/score")
async def batch_score_catalysts(
    catalyst_ids: List[int],
    db: Session = Depends(get_db)
):
    """Batch score multiple catalysts"""
    results = []

    for catalyst_id in catalyst_ids:
        try:
            score = await get_catalyst_score(catalyst_id, include_breakdown=False, db=db)
            results.append(score)
        except HTTPException:
            results.append({'catalyst_id': catalyst_id, 'error': 'Not found'})

    return results
```

### Testing

```python
# tests/test_catalyst_scoring.py

def test_score_ultra_high_catalyst():
    """Test scoring of ultra-high tier catalyst"""
    scorer = CatalystScorer()

    catalyst = {
        'event_type': 'FDA PDUFA Approval',
        'endpoint_type': 'MACE reduction',
        'event_date': '2025-12-15',
        'company': 'Vertex',
        'drug': 'VX-548',
        'peak_sales_estimate': 6000,  # $6B
        'market_cap': 100000,
        'breakthrough_designation': True,
        'manufacturing_ready': True,
        'house_pos': 0.85,
    }

    street_consensus = {
        'consensus_pos': 0.50,  # Street at 50%, House at 85%
        'analysts': 20
    }

    score = scorer.score_catalyst(catalyst, street_consensus)

    assert score.total >= 16  # Ultra-High tier
    assert score.tier == "Ultra-High"
    assert score.street_differential >= 2  # Large differential
```

### Sprint 2 Success Criteria

- [ ] Scoring algorithm implemented and tested
- [ ] 50 existing catalysts rescored
- [ ] Scoring API endpoints functional
- [ ] Street consensus integration working
- [ ] Stakeholder demo and approval

---

## Sprint 3: Multi-Source Aggregation (3 weeks)

### Overview

Build 6 independent data connectors that aggregate catalysts from multiple sources.

### Goals

- Implement FDA PDUFA scraper
- Build enhanced ClinicalTrials.gov scraper
- Create SEC 8-K catalyst detector
- Develop conference calendar scraper
- Build insider transaction tracker
- Orchestrate daily pipeline with deduplication

### Deliverables

#### 1. FDA PDUFA Scraper

Create `bt_platform/scrapers/sites/fda_pdufa_scraper.py`:

```python
"""
FDA PDUFA Date Scraper

Extracts PDUFA dates from FDA website
"""

import aiohttp
from bs4 import BeautifulSoup
from datetime import datetime
from typing import List, Dict


class FDAPDUFAScraper:
    """Scraper for FDA PDUFA dates"""

    BASE_URL = "https://www.fda.gov/drugs/nda-and-bla-approvals"

    async def scrape_pdufa_dates(self) -> List[Dict]:
        """
        Scrape PDUFA dates from FDA

        Returns list of upcoming PDUFA actions
        """
        async with aiohttp.ClientSession() as session:
            async with session.get(self.BASE_URL) as response:
                html = await response.text()

        soup = BeautifulSoup(html, 'html.parser')

        # Parse FDA table for PDUFA dates
        # Implementation details...

        return []
```

#### 2. Enhanced ClinicalTrials.gov Scraper

```python
"""
Enhanced ClinicalTrials.gov Scraper

Focuses on Phase 3 trials with primary completion dates
"""

import aiohttp
from typing import List, Dict


class EnhancedCTGovScraper:
    """Scraper for ClinicalTrials.gov"""

    API_URL = "https://clinicaltrials.gov/api/v2/studies"

    async def scrape_phase3_trials(self, therapeutic_area: str = None) -> List[Dict]:
        """
        Scrape Phase 3 trials

        Filters by:
        - Phase 3
        - Active, not recruiting
        - Primary completion date within 180 days
        """
        params = {
            'query.cond': therapeutic_area or '',
            'query.term': 'PHASE3',
            'filter.overallStatus': 'ACTIVE_NOT_RECRUITING',
            'pageSize': 100
        }

        async with aiohttp.ClientSession() as session:
            async with session.get(self.API_URL, params=params) as response:
                data = await response.json()

        # Parse and return trials
        return []
```

#### 3. SEC 8-K Catalyst Detector

```python
"""
SEC 8-K Catalyst Detector

Detects material events from 8-K filings using NLP
"""

import aiohttp
from bs4 import BeautifulSoup
from typing import List, Dict


class SEC8KScraper:
    """Scraper for SEC 8-K filings"""

    BASE_URL = "https://www.sec.gov"

    async def scrape_recent_8k_filings(self, cik: str = None) -> List[Dict]:
        """
        Scrape recent 8-K filings

        Detects catalyst events:
        - Item 8.01: Other Events (trial results, data presentations)
        - Item 1.01: Material Agreements (partnerships)
        - Item 2.02: Results of Operations (earnings)
        """
        # Implementation details...
        return []
```

#### 4. Conference Calendar Scraper

```python
"""
Conference Calendar Scraper

Scrapes ASCO, ASH, AHA, etc. presentation schedules
"""

from typing import List, Dict


class ConferenceScraper:
    """Scraper for medical conference schedules"""

    CONFERENCES = {
        'ASCO': 'https://meetings.asco.org',
        'ASH': 'https://www.hematology.org/meetings',
        'AHA': 'https://professional.heart.org/en/meetings',
    }

    async def scrape_conference_schedule(self, conference: str) -> List[Dict]:
        """Scrape conference presentation schedule"""
        # Implementation details...
        return []
```

#### 5. Insider Transaction Tracker

```python
"""
Insider Transaction Tracker

Tracks Form 4 insider buys/sells
"""

from typing import List, Dict


class InsiderTracker:
    """Scraper for SEC Form 4 filings"""

    async def scrape_insider_transactions(self, ticker: str) -> List[Dict]:
        """
        Scrape insider transactions

        Focuses on:
        - Director/officer buys (bullish signal)
        - Large purchases (>$100k)
        - Cluster buying (multiple insiders)
        """
        # Implementation details...
        return []
```

#### 6. Orchestration Pipeline

Create `bt_platform/ingestion/catalyst_pipeline.py`:

```python
"""
Catalyst Aggregation Pipeline

Orchestrates all scrapers with deduplication
"""

from typing import List, Dict
from datetime import datetime
import asyncio


class CatalystPipeline:
    """Orchestrates catalyst aggregation"""

    def __init__(self):
        self.scrapers = []

    async def run_daily_refresh(self):
        """
        Daily refresh of all sources

        Steps:
        1. Run all scrapers in parallel
        2. Deduplicate catalysts
        3. Enrich with company data
        4. Score catalysts
        5. Save to database
        """
        # Run scrapers
        results = await asyncio.gather(
            self._scrape_13f(),
            self._scrape_pdufa(),
            self._scrape_ctgov(),
            self._scrape_8k(),
            self._scrape_conferences(),
            self._scrape_insiders(),
        )

        # Flatten results
        catalysts = []
        for result in results:
            catalysts.extend(result)

        # Deduplicate
        unique_catalysts = self._deduplicate(catalysts)

        # Enrich and score
        scored_catalysts = []
        for catalyst in unique_catalysts:
            enriched = self._enrich_catalyst(catalyst)
            scored = self._score_catalyst(enriched)
            scored_catalysts.append(scored)

        # Save to database
        self._save_catalysts(scored_catalysts)

        return scored_catalysts

    def _deduplicate(self, catalysts: List[Dict]) -> List[Dict]:
        """
        Deduplicate catalysts

        Logic:
        - Same company + drug + event date = duplicate
        - Keep the one with most complete data
        """
        seen = {}
        unique = []

        for catalyst in catalysts:
            key = f"{catalyst['company']}_{catalyst['drug']}_{catalyst['event_date']}"

            if key not in seen:
                seen[key] = catalyst
                unique.append(catalyst)
            else:
                # Keep the more complete one
                existing = seen[key]
                if self._completeness(catalyst) > self._completeness(existing):
                    unique.remove(existing)
                    unique.append(catalyst)
                    seen[key] = catalyst

        return unique

    def _completeness(self, catalyst: Dict) -> float:
        """Calculate data completeness"""
        fields = ['company', 'drug', 'event_type', 'event_date', 'endpoint_type']
        return sum(1 for f in fields if catalyst.get(f)) / len(fields)
```

### Cron Job Setup

```bash
# crontab -e

# Run daily at 6 AM ET
0 6 * * * cd /app && poetry run python -m bt_platform.ingestion.catalyst_pipeline
```

### Sprint 3 Success Criteria

- [ ] All 6 scrapers operational
- [ ] <5% duplicate rate after deduplication
- [ ] >50 catalysts discovered in next 90 days
- [ ] Daily pipeline runs successfully
- [ ] <24 hour lag from source to system

---

## Sprint 4: PM Calendar UI (2 weeks)

### Overview

Build a Bloomberg Terminal-inspired calendar UI with visual encoding.

### Goals

- Create interactive PM calendar component
- Implement therapeutic area color encoding
- Add time horizon selector
- Build drill-down panels

### Deliverables

See full implementation in `docs/REDMILE_CATALYST_SYSTEM.md` Phase 4.

Key features:
- React component with D3.js visualization
- Time horizon selector (30/60/90/180 days)
- Therapeutic area color encoding
- Market size bubble sizing
- Conviction tier indicators (🚀⚡📊👁️)
- Portfolio overlay toggle
- Drill-down panels

### Sprint 4 Success Criteria

- [ ] Calendar renders >100 catalysts smoothly
- [ ] Visual encoding clear and intuitive
- [ ] Responsive design (desktop/tablet/mobile)
- [ ] WCAG AA accessibility compliance
- [ ] Positive user feedback

---

## Sprint 5: Intelligence Features (3 weeks)

### Overview

Build advanced intelligence features for competitive analysis and surprise detection.

### Goals

- Implement surprise factor detector
- Build historical catalyst database
- Create competitive landscape analyzer
- Add cash runway calculator

### Deliverables

See full implementation in `docs/REDMILE_CATALYST_SYSTEM.md` Phase 5.

Key features:
- Surprise detector algorithm
- Historical analogue finder
- Competitive MOA analyzer
- Cash runway projections
- Intelligence dashboard UI

### Sprint 5 Success Criteria

- [ ] Surprise detector identifies >10 opportunities/quarter
- [ ] Historical database contains >500 past catalysts
- [ ] Competitive analyzer covers >80% of portfolio
- [ ] Intelligence features deliver actionable insights

---

## Sprint 6: Documentation & Polish (1 week)

### Overview

Final polish, documentation, and production deployment.

### Goals

- Complete user documentation
- Performance optimization
- Security audit
- Production deployment
- Monitoring setup

### Deliverables

1. **Documentation**
   - User guides and tutorials
   - API documentation (OpenAPI)
   - Operations runbooks
   - Architecture diagrams

2. **Performance Optimization**
   - Database query optimization
   - Caching strategies
   - API response time tuning

3. **Security Audit**
   - SQL injection testing
   - XSS testing
   - CSRF protection
   - Secrets management audit

4. **Production Deployment**
   - Docker containerization
   - CI/CD pipeline
   - Monitoring setup (Prometheus, Grafana)
   - Alerting configuration

5. **Final Testing**
   - Load testing
   - User acceptance testing
   - Smoke testing

### Sprint 6 Success Criteria

- [ ] Complete documentation published
- [ ] API response time <300ms (p95)
- [ ] Security audit passes
- [ ] Production deployment successful
- [ ] Monitoring operational
- [ ] Final stakeholder approval

---

## Integration Testing

### End-to-End Test Flow

```python
# tests/test_e2e_catalyst_flow.py

async def test_complete_catalyst_flow():
    """Test complete catalyst flow from scraping to scoring"""

    # 1. Sync Redmile holdings
    response = await client.post("/api/v1/portfolio/redmile/sync")
    assert response.status_code == 200

    # 2. Run catalyst pipeline
    from bt_platform.ingestion.catalyst_pipeline import CatalystPipeline
    pipeline = CatalystPipeline()
    catalysts = await pipeline.run_daily_refresh()
    assert len(catalysts) > 0

    # 3. Get catalyst calendar
    response = await client.get("/api/v1/catalysts/calendar?portfolio=redmile&days=90")
    assert response.status_code == 200
    data = response.json()
    assert len(data['catalysts']) > 0

    # 4. Score catalyst
    catalyst_id = data['catalysts'][0]['id']
    response = await client.get(f"/api/v1/catalysts/{catalyst_id}/score")
    assert response.status_code == 200
    score_data = response.json()
    assert 'total_score' in score_data
    assert 'tier' in score_data
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] All sprint deliverables complete
- [ ] Code review completed
- [ ] All tests passing (>80% coverage)
- [ ] Security audit completed
- [ ] Performance testing passed
- [ ] Documentation complete
- [ ] Stakeholder approval obtained

### Deployment

- [ ] Database migrations tested
- [ ] Environment variables configured
- [ ] Secrets stored securely
- [ ] Docker images built and pushed
- [ ] Load balancer configured
- [ ] SSL/TLS certificates installed
- [ ] Monitoring and alerting set up
- [ ] Backup procedures tested

### Post-Deployment

- [ ] Smoke tests passed
- [ ] Monitor metrics for 72 hours
- [ ] Collect user feedback
- [ ] Document lessons learned
- [ ] Plan next iteration

---

## Conclusion

This guide provides detailed implementation steps for Sprints 2-6, building on the foundation established in Sprint 1. Each sprint delivers incremental value and can be demonstrated independently to stakeholders.

**Total Timeline:** 13 weeks to production-grade Redmile Catalyst Intelligence System

**Key Success Factors:**
- Clear acceptance criteria for each sprint
- Regular stakeholder demos and feedback
- Incremental testing and validation
- Documentation throughout (not just at the end)
- Risk management and mitigation

**For detailed implementations, see:**
- `docs/REDMILE_CATALYST_SYSTEM.md` - Complete technical specifications
- `docs/REDMILE_QUICK_START.md` - Quick reference guide
- `docs/REDMILE_ARCHITECTURE.md` - System architecture
- `docs/SPRINT_PLANNING_RESOURCE_ALLOCATION.md` - Resource planning
- `docs/PRODUCTION_DEPLOYMENT_MONITORING.md` - Deployment guide

---

*Last Updated: 2025-10-14*
*Version: 1.0*
*Status: Implementation Ready*

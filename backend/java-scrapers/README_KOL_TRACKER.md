# KOL Tracker Enhancement - Complete Implementation

## Overview

This enhancement massively upgrades the KOL (Key Opinion Leader) tracking and module capabilities with bespoke Java scrapers to scrape the top 20 most important publicly available KOL sources predictive in biotech, merged into a proprietary algorithm to rank various assets, programs, and companies for biotech hedge fund trading.

## Architecture

### Components

1. **Database Models** (Python/SQLAlchemy)
   - `KOLSource`: Tracks data sources with health monitoring
   - `KOLProfile`: Individual KOL profiles with credibility metrics
   - `KOLSignal`: Individual signals/opinions from KOLs
   - `KOLScore`: Aggregated scoring for entities
   - `KOLAlgorithmRun`: Algorithm execution tracking

2. **Java Scrapers** (backend/java-scrapers/)
   - Maven-based Java 11 project
   - Base scraper interfaces and abstract classes
   - Concrete implementations for top KOL sources
   - Parallel scraping with thread pools
   - JSON output for Python ingestion

3. **Python API** (bt_platform/core/endpoints/kol.py)
   - RESTful endpoints for KOL data
   - Signal ingestion from Java scrapers
   - Query and filtering capabilities
   - Health monitoring

4. **Ranking Algorithm** (bt_platform/core/utils/kol_algorithm.py)
   - Proprietary scoring algorithm
   - Multi-factor weighting system
   - Catalyst correlation analysis
   - Confidence scoring

## Top 20 KOL Sources

The system is designed to scrape these key biotech intelligence sources:

### Implemented Scrapers (2/20)
1. ✅ **BioPharmCatalyst** - FDA calendar and catalyst events
2. ✅ **Seeking Alpha** - Biotech contributors and articles

### Planned Scrapers (18/20)
3. **Twitter/X Biotech KOLs** - Top biotech analysts and investors
4. **LinkedIn Thought Leaders** - Biotech executives and researchers
5. **StockTwits** - Real-time biotech sentiment
6. **FDA Advisory Committee Members** - Expert opinions and voting records
7. **Clinical Trial Investigators** - Top investigators and institutions
8. **PubMed Authors** - Academic researcher publication tracking
9. **Conference Speakers** - ASH, ASCO, AACR speaker tracking
10. **Patent Inventors** - Innovation and R&D tracking
11. **BioSpace** - Job postings and company growth signals
12. **FierceBiotech** - Breaking biotech news
13. **Endpoints News** - In-depth biotech journalism
14. **BioPharma Dive** - Industry analysis
15. **GenomeWeb** - Genomics and diagnostics news
16. **STAT News** - Healthcare and pharma reporting
17. **SEC 8-K Filings** - Material events and partnerships
18. **ClinicalTrials.gov** - Trial status changes and results
19. **Investor Call Transcripts** - Management commentary analysis
20. **Glassdoor Reviews** - Company culture and sentiment

## Installation & Setup

### Prerequisites
- Java 11 or higher
- Maven 3.6+
- Python 3.9+
- Poetry (Python package manager)

### Build Java Scrapers

```bash
cd backend/java-scrapers
mvn clean package

# This creates: target/kol-scrapers-1.0.0.jar
```

### Initialize Database

The database models will be automatically created when you start the FastAPI backend:

```bash
poetry run uvicorn bt_platform.core.app:app --reload
```

## Usage

### 1. Run Java Scrapers

**Command line:**
```bash
cd backend/java-scrapers
java -jar target/kol-scrapers-1.0.0.jar output/kol_signals.json
```

**Programmatic (Python API):**
```bash
curl -X POST "http://localhost:8000/api/v1/kol/scrape" \
  -H "Content-Type: application/json" \
  -d '{"output_file": "kol_signals.json"}'
```

### 2. Ingest Signals

```bash
curl -X POST "http://localhost:8000/api/v1/kol/ingest?file_path=backend/java-scrapers/kol_signals.json"
```

### 3. Query KOL Data

**Get KOL sources:**
```bash
curl "http://localhost:8000/api/v1/kol/sources"
```

**Get recent signals for a ticker:**
```bash
curl "http://localhost:8000/api/v1/kol/signals?ticker=MRNA&days_back=30"
```

**Get ranked companies by KOL sentiment:**
```bash
curl "http://localhost:8000/api/v1/kol/scores?entity_type=company&lookback_days=30"
```

### 4. Run Ranking Algorithm

```python
from bt_platform.core.utils.kol_algorithm import KOLRankingAlgorithm
from bt_platform.core.database import SessionLocal

db = SessionLocal()
algorithm = KOLRankingAlgorithm(db)

# Calculate scores for all companies
scores = algorithm.calculate_entity_scores(
    entity_type="company",
    lookback_days=30
)

# Persist to database
algorithm.persist_scores(scores)

# Print top 10 bullish companies
for i, score in enumerate(scores[:10], 1):
    print(f"{i}. {score['entity_name']} ({score['entity_id']})")
    print(f"   Sentiment: {score['weighted_sentiment']:.2f}")
    print(f"   Signals: {score['signal_count']}, Confidence: {score['confidence_score']:.2f}")
```

## API Endpoints

### Sources
- `GET /api/v1/kol/sources` - List all KOL data sources
- Query params: `is_active`, `source_type`

### Profiles
- `GET /api/v1/kol/profiles` - List KOL profiles
- Query params: `kol_type`, `specialty`, `min_credibility`, `limit`

### Signals
- `GET /api/v1/kol/signals` - Retrieve KOL signals
- Query params: `ticker`, `signal_type`, `days_back`, `min_quality`, `limit`

### Scores
- `GET /api/v1/kol/scores` - Get ranked entities
- Query params: `entity_type`, `lookback_days`, `min_signal_count`, `limit`

### Operations
- `POST /api/v1/kol/scrape` - Trigger scraping job
- `POST /api/v1/kol/ingest` - Ingest signals from file
- `GET /api/v1/kol/health` - System health status

## Ranking Algorithm

### Input Factors

1. **Signal Sentiment** (-1.0 to +1.0)
   - Extracted from text using keyword analysis
   - Bullish/bearish classification

2. **KOL Credibility** (0.0 to 1.0)
   - Historical accuracy
   - Follower count / citations
   - Domain expertise

3. **Signal Quality** (0.0 to 1.0)
   - Source reliability
   - Information specificity
   - Data freshness

4. **Recency Decay**
   - Exponential decay with 30-day half-life
   - Recent signals weighted higher

5. **Catalyst Correlation**
   - 1.5x boost for entities with upcoming catalysts
   - Links KOL signals to calendar events

### Output Scores

- **Weighted Sentiment**: Credibility-weighted average sentiment
- **Confidence Score**: Based on signal count, KOL quality, diversity
- **Signal Composition**: Bullish/bearish/neutral breakdown
- **Impact Prediction**: Expected price movement

### Trading Applications

**For Hedge Fund Traders:**

1. **Long Ideas**: Entities with high positive weighted sentiment + high confidence
2. **Short Ideas**: Entities with high negative weighted sentiment + high confidence
3. **Event-Driven**: High sentiment + catalyst correlation = high conviction trades
4. **Sentiment Shifts**: Track sentiment changes week-over-week for trend reversals

**Example Strategy:**
```python
# Find high-conviction long candidates
long_candidates = [
    score for score in scores
    if score['weighted_sentiment'] > 0.5
    and score['confidence_score'] > 0.7
    and score['signal_count'] >= 5
]

# Find catalyst-linked opportunities
catalyst_plays = [
    score for score in scores
    if score['has_catalyst_correlation']
    and abs(score['weighted_sentiment']) > 0.4
]
```

## Database Schema

### KOL Sources
```sql
CREATE TABLE kol_sources (
    id INTEGER PRIMARY KEY,
    source_name VARCHAR UNIQUE,
    source_type VARCHAR,  -- social_media, news, academic, regulatory
    platform VARCHAR,
    reliability_score FLOAT,
    is_active BOOLEAN,
    last_successful_scrape TIMESTAMP,
    total_signals_collected INTEGER
);
```

### KOL Profiles
```sql
CREATE TABLE kol_profiles (
    id INTEGER PRIMARY KEY,
    name VARCHAR,
    kol_type VARCHAR,  -- analyst, researcher, clinician, investor
    specialty VARCHAR,
    credibility_score FLOAT,
    influence_score FLOAT,
    accuracy_score FLOAT,
    total_signals INTEGER
);
```

### KOL Signals
```sql
CREATE TABLE kol_signals (
    id INTEGER PRIMARY KEY,
    source_id INTEGER REFERENCES kol_sources(id),
    kol_profile_id INTEGER REFERENCES kol_profiles(id),
    signal_type VARCHAR,  -- bullish, bearish, upgrade, downgrade
    signal_text TEXT,
    signal_sentiment FLOAT,
    company_ticker VARCHAR,
    drug_name VARCHAR,
    signal_date TIMESTAMP,
    quality_score FLOAT,
    impact_score FLOAT,
    confidence_level FLOAT
);
```

### KOL Scores
```sql
CREATE TABLE kol_scores (
    id INTEGER PRIMARY KEY,
    entity_type VARCHAR,  -- company, drug, catalyst
    entity_id VARCHAR,
    weighted_sentiment FLOAT,
    confidence_score FLOAT,
    signal_count INTEGER,
    bullish_signal_count INTEGER,
    bearish_signal_count INTEGER,
    score_date TIMESTAMP
);
```

## Extending the System

### Adding New Scrapers

1. Create new Java class extending `BaseKOLScraper`:
```java
public class NewSourceScraper extends BaseKOLScraper {
    @Override
    public String getName() { return "New Source"; }

    @Override
    protected List<KOLSignal> doScrape(Map<String, Object> config) {
        // Implement scraping logic
    }
}
```

2. Register in `Main.java`:
```java
this.scrapers = Arrays.asList(
    new BioPharmCatalystScraper(),
    new SeekingAlphaBiotechScraper(),
    new NewSourceScraper()  // Add here
);
```

3. Rebuild and deploy:
```bash
mvn clean package
```

### Tuning Algorithm Parameters

Edit `bt_platform/core/utils/kol_algorithm.py`:

```python
class KOLRankingAlgorithm:
    def __init__(self, db: Session):
        self.RECENCY_DECAY_DAYS = 30  # Adjust half-life
        self.MIN_SIGNAL_COUNT = 3  # Minimum signals
        self.TOP_KOL_CREDIBILITY_THRESHOLD = 0.7  # Quality threshold
        self.CATALYST_BOOST_FACTOR = 1.5  # Catalyst weight
```

## Testing

### Test Java Scrapers
```bash
cd backend/java-scrapers
mvn test
```

### Test Python API
```bash
poetry run pytest bt_platform/core/endpoints/test_kol.py
```

### Manual Testing
```bash
# Start backend
poetry run uvicorn bt_platform.core.app:app --reload

# In another terminal, run scrapers
cd backend/java-scrapers
java -jar target/kol-scrapers-1.0.0.jar test_output.json

# Ingest signals
curl -X POST "http://localhost:8000/api/v1/kol/ingest?file_path=backend/java-scrapers/test_output.json"

# Query results
curl "http://localhost:8000/api/v1/kol/signals?limit=10"
```

## Production Deployment

### Automated Scraping

Use cron or scheduler to run scrapers periodically:

```bash
# crontab entry - run every 2 hours
0 */2 * * * cd /path/to/backend/java-scrapers && java -jar target/kol-scrapers-1.0.0.jar /tmp/kol_signals.json && curl -X POST "http://localhost:8000/api/v1/kol/ingest?file_path=/tmp/kol_signals.json"
```

### Monitoring

- Check `/api/v1/kol/health` endpoint regularly
- Monitor signal ingestion rates
- Track scraper success/failure rates
- Alert on source downtime

### Performance

- Java scrapers run in parallel (thread pool)
- Database indexes on key query fields
- Signal deduplication by URL
- Batch inserts for ingestion

## Future Enhancements

1. **Machine Learning Integration**
   - Train models on historical KOL signals vs. actual outcomes
   - Improve sentiment classification accuracy
   - Predict signal impact more precisely

2. **Real-time Streaming**
   - WebSocket connections for live signals
   - Twitter/X streaming API integration
   - Real-time alert system

3. **Advanced NLP**
   - Entity extraction (drugs, companies, executives)
   - Relationship mapping
   - Causality detection

4. **Visualization Dashboard**
   - React components for KOL tracker
   - Signal feed with filtering
   - Sentiment trend charts
   - Ranked entity tables

5. **Backtesting Framework**
   - Validate algorithm against historical data
   - Measure prediction accuracy
   - Optimize parameters

## Support

For issues or questions:
- Check the main [README.md](../../README.md)
- Review API documentation at http://localhost:8000/docs
- Examine scraper logs in `backend/java-scrapers/logs/`

---

**Note**: This system is designed for informational purposes only. KOL signals should be one input among many for trading decisions. Always conduct thorough due diligence and risk management.

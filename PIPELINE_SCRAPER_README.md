# Pipeline Scraper - Company Drug Development Pipeline Aggregator

A comprehensive, modular pipeline scraping system for extracting and aggregating drug development pipeline data from pharmaceutical and biotech company websites.

## 🎯 Overview

The Pipeline Scraper is designed to build a master database of drug development pipelines across the industry. It collects critical information including:

- **Asset Names** - Drug candidates and their identifiers
- **Development Phase** - Preclinical, Phase I, II, III, Filed, Approved
- **Indications** - Diseases and conditions being treated
- **Therapeutic Areas** - Oncology, Immunology, Neurology, etc.
- **Mechanism of Action** - How the drug works (MOA/target)
- **Modality** - Small molecule, antibody, gene therapy, etc.
- **Company Logos** - Visual branding assets
- **Source URLs** - Original pipeline page links

## 🚀 Features

### Core Capabilities

✅ **Modular Architecture** - Easy to add new company scrapers
✅ **Automated Deduplication** - Hash-based duplicate detection
✅ **Phase Normalization** - Standardized phase terminology
✅ **Rate Limiting** - Respectful crawling (0.5 req/s default)
✅ **Database Integration** - SQLAlchemy ORM with PostgreSQL/SQLite
✅ **REST API** - FastAPI endpoints for data access
✅ **CLI Interface** - Rich terminal interface for manual scraping
✅ **Scheduled Updates** - Automated daily/weekly refresh
✅ **Extensible** - Template-based approach for new scrapers

### Built-in Company Scrapers

Currently implemented:
- **Biogen** - Neuroscience and rare disease focus
- **Amgen** - Oncology and inflammation pipelines
- **Gilead Sciences** - Virology and oncology programs

Additional companies can be easily added using the template pattern.

## 📦 Installation

### Prerequisites

```bash
# Python 3.9+
python --version

# Poetry (recommended)
curl -sSL https://install.python-poetry.org | python3 -
```

### Install Dependencies

```bash
# Using Poetry
poetry install

# Or using pip
pip install -r requirements.txt
```

### Database Setup

```bash
# Initialize database (creates tables)
poetry run python -c "from bt_platform.core.database import init_db; import asyncio; asyncio.run(init_db())"
```

## 🔧 Usage

### CLI Interface

#### Scrape All Companies

```bash
# Scrape all available company pipelines
python -m bt_platform.cli.scrape_pipeline --all

# Limit number of assets per company
python -m bt_platform.cli.scrape_pipeline --all --limit 50
```

#### Scrape Specific Companies

```bash
# Single company
python -m bt_platform.cli.scrape_pipeline --company Biogen

# Multiple companies
python -m bt_platform.cli.scrape_pipeline --company Biogen --company Amgen --company Gilead
```

#### View Statistics

```bash
# Show pipeline statistics
python -m bt_platform.cli.scrape_pipeline --stats

# List available companies
python -m bt_platform.cli.scrape_pipeline --list
```

### REST API

Start the FastAPI server:

```bash
# Development mode
poetry run uvicorn bt_platform.core.app:app --reload --port 8000

# Production mode
poetry run uvicorn bt_platform.core.app:app --host 0.0.0.0 --port 8000
```

#### API Endpoints

**Scrape Pipelines**
```http
POST /api/v1/pipeline/scrape
Content-Type: application/json

{
  "companies": ["Biogen", "Amgen"],
  "limit": 100
}
```

**Get Pipeline Assets**
```http
GET /api/v1/pipeline/assets?company=Biogen&phase=Phase%20II&limit=50

# Query parameters:
# - company: Filter by company name
# - phase: Filter by development phase
# - therapeutic_area: Filter by therapeutic area
# - limit: Max results (1-500, default: 100)
# - offset: Pagination offset
```

**Get Specific Asset**
```http
GET /api/v1/pipeline/assets/{asset_id}
```

**Get Pipeline Statistics**
```http
GET /api/v1/pipeline/stats
```

**Get Available Companies**
```http
GET /api/v1/pipeline/companies
```

**Get Company Pipeline**
```http
GET /api/v1/pipeline/company/Biogen
```

**Health Check**
```http
GET /api/v1/pipeline/health
```

### Python API

```python
from bt_platform.scrapers.pipeline_manager import get_pipeline_manager
from bt_platform.core.database import SessionLocal

# Get manager
manager = get_pipeline_manager()

# Create database session
db = SessionLocal()

# Scrape all companies
result = await manager.scrape_all_companies(db=db, limit=100)

# Scrape specific companies
result = await manager.scrape_all_companies(
    db=db,
    companies=['Biogen', 'Amgen'],
    limit=100
)

# Get statistics
stats = manager.get_pipeline_stats(db)

# Get available companies
companies = manager.get_available_companies()

# Close connections
await manager.close_all()
db.close()
```

## 🤖 Automated Scheduling

### Setup Automated Refresh

```python
from bt_platform.scrapers.pipeline_scheduler import get_pipeline_scheduler

scheduler = get_pipeline_scheduler()

# Daily refresh at 2 AM
scheduler.schedule_daily(hour=2, minute=0)

# Weekly refresh (Monday at 2 AM)
scheduler.schedule_weekly(day_of_week='mon', hour=2, minute=0)

# Interval-based (every 24 hours)
scheduler.schedule_interval(hours=24)

# Start scheduler
scheduler.start()

# Manual trigger
await scheduler.run_now()

# Get status
status = scheduler.get_status()
```

### Default Schedule

The default configuration runs a daily refresh at 2:00 AM:

```python
from bt_platform.scrapers.pipeline_scheduler import setup_default_schedule

# Setup and start default schedule
setup_default_schedule()
```

## 🏗️ Architecture

### Database Schema

```sql
CREATE TABLE pipeline_assets (
    id INTEGER PRIMARY KEY,
    asset_name VARCHAR NOT NULL,
    company_name VARCHAR NOT NULL,
    company_id INTEGER REFERENCES companies(id),

    -- Pipeline details
    phase VARCHAR,
    indication TEXT,
    therapeutic_area VARCHAR,

    -- Asset metadata
    mechanism_of_action VARCHAR,
    modality VARCHAR,
    development_status VARCHAR,

    -- Source tracking
    source_url VARCHAR,
    source_company VARCHAR,
    logo_url VARCHAR,

    -- Data provenance
    scraped_at TIMESTAMP DEFAULT NOW(),
    last_verified TIMESTAMP,
    data_hash VARCHAR,
    metadata JSON,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_pipeline_asset_company_phase ON pipeline_assets(company_id, phase);
CREATE INDEX idx_pipeline_asset_name_company ON pipeline_assets(asset_name, company_name);
CREATE INDEX idx_pipeline_asset_source ON pipeline_assets(source_company, scraped_at);
CREATE INDEX idx_pipeline_asset_hash ON pipeline_assets(data_hash);
```

### Scraping Pipeline

```
1. Discover  → Find pipeline page URL
2. Fetch     → Retrieve HTML with rate limiting
3. Parse     → Extract asset data (company-specific)
4. Normalize → Standardize phases and fields
5. Link      → Connect to company records
6. Upsert    → Insert new or update existing assets
```

### Components

```
bt_platform/
├── scrapers/
│   ├── sites/
│   │   └── pipeline_scraper.py          # Base + company scrapers
│   ├── pipeline_manager.py              # Orchestration layer
│   ├── pipeline_scheduler.py            # Automated scheduling
│   └── tests/
│       └── test_pipeline_scraper.py     # Unit tests
├── core/
│   ├── database.py                      # PipelineAsset model
│   ├── endpoints/
│   │   └── pipeline.py                  # FastAPI routes
│   └── routers.py                       # Router registration
└── cli/
    └── scrape_pipeline.py               # CLI interface
```

## 📝 Adding New Companies

To add a new company scraper:

### 1. Create Scraper Class

```python
from bt_platform.scrapers.sites.pipeline_scraper import PipelineScraperBase

class NewCompanyPipelineScraper(PipelineScraperBase):
    """Scraper for NewCompany's pipeline page."""

    def __init__(self):
        super().__init__(
            company_name="NewCompany",
            pipeline_url="https://www.newcompany.com/pipeline"
        )

    async def parse(self, html: str, url: str) -> List[Dict[str, Any]]:
        """Parse NewCompany pipeline page."""
        from bs4 import BeautifulSoup

        soup = BeautifulSoup(html, 'html.parser')
        assets = []

        # Add company-specific parsing logic
        pipeline_rows = soup.find_all('tr', class_='pipeline-row')

        for row in pipeline_rows:
            asset = {
                'asset_name': row.find('td', class_='asset-name').get_text(strip=True),
                'phase': row.find('td', class_='phase').get_text(strip=True),
                'indication': row.find('td', class_='indication').get_text(strip=True),
                'therapeutic_area': '',
                'mechanism_of_action': '',
                'modality': '',
                'logo_url': '',
                'metadata': {}
            }

            if asset['asset_name']:
                assets.append(asset)

        return assets
```

### 2. Register in Factory

Add to `get_pipeline_scraper()` function and `AVAILABLE_SCRAPERS` list:

```python
# In pipeline_scraper.py

AVAILABLE_SCRAPERS = [
    'Biogen',
    'Amgen',
    'Gilead Sciences',
    'NewCompany',  # Add here
]

def get_pipeline_scraper(company_name: str) -> Optional[PipelineScraperBase]:
    scrapers = {
        'biogen': BiogenPipelineScraper,
        'amgen': AmgenPipelineScraper,
        'gilead': GileadPipelineScraper,
        'newcompany': NewCompanyPipelineScraper,  # Add here
    }
    # ...
```

### 3. Test Scraper

```bash
# Test new scraper
python -m bt_platform.cli.scrape_pipeline --company NewCompany

# Check results
python -m bt_platform.cli.scrape_pipeline --stats
```

## 🧪 Testing

```bash
# Run all tests
poetry run pytest bt_platform/scrapers/tests/test_pipeline_scraper.py

# Run with coverage
poetry run pytest --cov=bt_platform.scrapers bt_platform/scrapers/tests/

# Run specific test
poetry run pytest bt_platform/scrapers/tests/test_pipeline_scraper.py::TestPipelineScraperBase
```

## 📊 Data Quality

### Deduplication

Assets are deduplicated using SHA-256 hashes of:
- Asset name
- Company name
- Phase
- Indication

### Phase Normalization

Input phases are normalized to standard values:
- `Preclinical` / `Pre-clinical` / `Discovery` → `Preclinical`
- `Phase 1` / `Phase I` → `Phase I`
- `Phase 2` / `Phase II` → `Phase II`
- `Phase 3` / `Phase III` → `Phase III`
- `NDA` / `BLA` / `MAA` / `Filed` → `Filed`
- `Approved` / `Marketed` / `Commercial` → `Approved`

### Data Verification

- `scraped_at`: Timestamp when data was collected
- `last_verified`: Timestamp of last update check
- `data_hash`: SHA-256 hash for change detection

## 🔒 Compliance

### Rate Limiting

Default rate limit: **0.5 requests per second** (1 request every 2 seconds)

### User Agent

```
BiotechTerminal/1.0 Pipeline Aggregator (research@bioterminal.dev)
```

### robots.txt

All scrapers check and respect `robots.txt` directives.

### Legal Considerations

- Scrapes publicly available pipeline pages only
- Extracts factual data (not copyrighted content)
- Respects rate limits and server capacity
- Links back to original source
- Personal research use only

## 📈 Performance

- **Scraping Speed**: ~10-15 seconds per company
- **Rate Limiting**: 0.5 req/s per company (configurable)
- **Memory Usage**: ~50-100 MB during scraping
- **Database Size**: ~1-2 KB per asset

## 🐛 Troubleshooting

### Common Issues

**"No scraper available for X"**
- Company scraper not implemented yet
- Check available companies: `python -m bt_platform.cli.scrape_pipeline --list`

**"Failed to parse pipeline"**
- Company website structure changed
- Update parsing selectors in scraper class
- Enable verbose logging: `--verbose`

**"Database error"**
- Ensure database is initialized: `init_db()`
- Check DATABASE_URL in environment

**"Rate limit exceeded"**
- Reduce scraping frequency
- Increase rate limit delay in scraper init

## 🔮 Future Enhancements

- [ ] Add 10+ more company scrapers (Pfizer, Merck, BMS, etc.)
- [ ] PDF pipeline extraction (for companies with PDF-only data)
- [ ] Historical tracking (phase transitions over time)
- [ ] Email alerts for pipeline changes
- [ ] Export to CSV/Excel
- [ ] Data visualization dashboard
- [ ] Machine learning for field extraction
- [ ] Multi-language support
- [ ] API rate limit auto-adjustment

## 📚 Documentation

- [API Documentation](http://localhost:8000/docs) - Swagger UI
- [ReDoc](http://localhost:8000/redoc) - Alternative API docs
- [Database Schema](./bt_platform/core/database.py) - SQLAlchemy models

## 🤝 Contributing

To contribute a new company scraper:

1. Fork the repository
2. Create a new scraper class following the template
3. Add tests
4. Submit a pull request

## 📄 License

MIT License - See LICENSE file for details

## 🆘 Support

- **Issues**: https://github.com/your-repo/issues
- **Email**: research@bioterminal.dev
- **Documentation**: See inline code comments

---

**Built with ❤️ for the biotech intelligence community**

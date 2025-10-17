# 🔬 Proprietary Data Collection Architecture

## Overview

The Biotech Terminal now uses **100% free, unlimited data sources** with proprietary scrapers. No paid APIs, no rate limits, no account sign-ups required.

## 📊 Data Sources

### 1. Yahoo Finance (Market Data)
- **What**: Real-time stock prices, volumes, analyst ratings, institutional ownership
- **Coverage**: 40+ biotech stocks, 4 major biotech ETFs (XBI, IBB, ARKG, PBE)
- **Update Frequency**: On-demand via manual refresh
- **Cost**: Free, unlimited
- **API/Scraper**: `yfinance` Python library

**Data Collected**:
- Current price, change, volume
- Market cap, beta, P/E ratios
- 52-week high/low
- Analyst ratings and price targets
- Institutional/insider ownership percentages
- Short interest and short ratio
- Revenue/earnings growth rates
- Cash per share, debt ratios

### 2. ClinicalTrials.gov (Clinical Trials)
- **What**: Active clinical trials database
- **Coverage**: All publicly registered trials
- **Update Frequency**: Daily
- **Cost**: Free public API
- **Endpoint**: `https://clinicaltrials.gov/api/v2/studies`

**Data Collected**:
- NCT ID, trial title, phase
- Enrollment numbers, status
- Primary completion dates
- Sponsor information
- Trial locations

### 3. FDA.gov (Regulatory Events)
- **What**: Drug approvals, PDUFA dates
- **Coverage**: All FDA-regulated drugs
- **Update Frequency**: As announced
- **Cost**: Free public data
- **Method**: Web scraping + known PDUFA calendar

**Data Collected**:
- Recent FDA approvals
- Upcoming PDUFA dates
- Advisory committee meetings
- sNDA filings

### 4. SEC EDGAR (Insider Trading)
- **What**: Form 4 insider trading filings
- **Coverage**: All public companies
- **Update Frequency**: Real-time filings
- **Cost**: Free public API
- **Endpoint**: `https://data.sec.gov/submissions/`

**Data Collected**:
- Form 4 filings (insider buys/sells)
- Filing dates and accession numbers
- Direct links to SEC filings

## 🏗️ Architecture

### Data Flow

```
┌─────────────────────────────────────────────────────────┐
│ 1. Python Scrapers (backend/python-scrapers/)          │
│    ├── biotech_scraper.py (main orchestrator)          │
│    ├── financial_scraper.py (institutional data)       │
│    └── data_orchestrator.py (multi-source aggregation) │
└────────────────┬────────────────────────────────────────┘
                 │
                 │ Writes to
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 2. JSON Data Files (root directory)                    │
│    └── live_biotech_data.json (generated)              │
└────────────────┬────────────────────────────────────────┘
                 │
                 │ Loaded by
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 3. Node.js Backend Services (backend/src/)             │
│    ├── services/real-data-service.ts (data transformer)│
│    └── routes/market-data.ts (REST API endpoints)      │
└────────────────┬────────────────────────────────────────┘
                 │
                 │ HTTP API
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 4. Terminal Frontend (terminal/src/)                   │
│    ├── Manual Refresh Button (user-initiated)          │
│    └── No auto-polling (zero background network)       │
└─────────────────────────────────────────────────────────┘
```

### Refresh Model

**Manual Refresh Only** - No background updates:
1. User clicks "Refresh" button in terminal
2. Frontend calls backend API (e.g., `/api/biotech/dashboard`)
3. Backend checks if live_biotech_data.json exists and is fresh (<30 min)
4. If stale, backend can trigger Python scraper or use cached data
5. Backend transforms and returns data
6. Frontend displays updated data

## 🚀 Usage

### One-Time Setup
```bash
# Install Python dependencies
cd backend/python-scrapers
pip install -r requirements.txt
```

### Fetch Live Data (Manual)
```bash
# Option 1: Run scraper script
./scripts/fetch-live-data.sh

# Option 2: Run Python scraper directly
cd backend/python-scrapers
python biotech_scraper.py
```

This generates `live_biotech_data.json` with:
- Market data for 30+ biotech stocks
- 42+ clinical trials
- FDA calendar events
- Insider trading filings
- Aggregated analytics

### Start Backend Server
```bash
# From root directory
cd backend
npm run dev

# Or using npm workspaces
npm run dev:backend
```

Backend APIs will serve data from `live_biotech_data.json`:
- `GET /api/biotech/dashboard` - Dashboard overview
- `GET /api/market/quote/:symbol` - Individual stock data
- `GET /api/biotech/screener` - Multi-stock screener
- `GET /api/biotech/trials` - Clinical trials data

## 📈 Data Quality

### Advantages
✅ **No API Keys** - All sources are public  
✅ **No Rate Limits** - Respectful scraping with delays  
✅ **No Costs** - 100% free data  
✅ **Real-Time** - Yahoo Finance data is live  
✅ **Comprehensive** - 40+ stocks, trials, FDA events  
✅ **Reliable** - Government and established sources  

### Limitations
⚠️ **Manual Updates** - Requires running scraper script  
⚠️ **No Intraday** - Prices update when scraper runs  
⚠️ **Network Required** - Scraper needs internet access  
⚠️ **Parsing Risk** - Web scraping can break if sites change  

### Mitigations
- **Fallback to Mock Data**: If scraper fails, backend serves sample data
- **Error Handling**: Extensive try/catch with logging
- **Rate Limiting**: Built-in delays to respect source servers
- **Caching**: 30-minute TTL to reduce scraper runs

## 🔧 Development

### Adding New Data Sources

1. **Add Scraper Function** in `biotech_scraper.py`:
```python
def scrape_new_source(self) -> List[Dict[str, Any]]:
    """Scrape from new free source"""
    try:
        response = self.session.get('https://free-source.com/api')
        data = response.json()
        return self._transform_data(data)
    except Exception as e:
        logger.error(f"Error: {e}")
        return []
```

2. **Call in collect_all_data()**:
```python
new_data = self.scrape_new_source()
complete_data['new_field'] = new_data
```

3. **Transform in Backend**:
Update `backend/src/services/real-data-service.ts` to map new data to dashboard format.

4. **Expose via API**:
Add route in `backend/src/routes/biotech-data.ts` or create new route file.

### Testing Scrapers

```bash
# Test clinical trials scraper
python -c "from biotech_scraper import BiotechDataScraper; s = BiotechDataScraper(); print(s.scrape_clinical_trials())"

# Test market data
python -c "from biotech_scraper import BiotechDataScraper; s = BiotechDataScraper(); print(s.get_market_data())"

# Full integration test
python biotech_scraper.py && cat live_biotech_data.json | jq '.summary'
```

## 📚 Data Schema

### live_biotech_data.json Structure
```json
{
  "summary": {
    "total_trials": <number>,
    "total_companies": <number>,
    "total_market_cap": <number>,
    "avg_price_change": <number>,
    "data_sources": ["Yahoo Finance", "ClinicalTrials.gov", ...],
    "last_updated": "<ISO timestamp>"
  },
  "market_data": {
    "positions": [{
      "symbol": "SRPT",
      "price": 117.45,
      "change": 2.85,
      "market_cap": 11800000000,
      "analyst_target": 145.00,
      "institutional_ownership": 85.4,
      ...
    }],
    "indices": {
      "XBI": {
        "price": 89.45,
        "change": 1.23,
        ...
      }
    }
  },
  "clinical_trials": [...],
  "fda_calendar": [...],
  "catalysts": [...],
  "insider_trading": [...]
}
```

## 🔒 Compliance & Ethics

### Legal Considerations
- ✅ **Terms of Service**: All sources allow automated access
- ✅ **Attribution**: Data sources are clearly credited
- ✅ **Rate Limiting**: Respectful scraping with delays
- ✅ **Public Data**: Only publicly available information
- ❌ **No Bypassing**: No paywall circumvention
- ❌ **No Authentication**: No account credentials used

### Best Practices
1. **Identify Ourselves**: User-Agent includes project name
2. **Cache Aggressively**: 30-min TTL to reduce load
3. **Handle Failures Gracefully**: Fallback to sample data
4. **Monitor for Changes**: Log errors when parsing fails
5. **Respect robots.txt**: Check before scraping new sources

## 📖 References

- [Yahoo Finance Terms](https://legal.yahoo.com/us/en/yahoo/terms/otos/index.html)
- [ClinicalTrials.gov API](https://clinicaltrials.gov/data-api)
- [FDA Data Policy](https://www.fda.gov/about-fda/website-policies)
- [SEC EDGAR Access](https://www.sec.gov/os/accessing-edgar-data)

## 🎯 Roadmap

### Planned Enhancements
- [ ] Add patent data from USPTO
- [ ] Scrape conference abstracts (ASCO, ASH, etc.)
- [ ] Add news sentiment from free biotech news sites
- [ ] Implement 8-K event scraping
- [ ] Add analyst report summaries from public filings
- [ ] Create historical data database
- [ ] Add automated scheduling (cron jobs)

### Future Data Sources (All Free)
- PubMed API (research publications)
- USPTO PatFT (patent filings)
- EMA public data (European drug approvals)
- WHO trial registry
- NIH RePORTER (research grants)

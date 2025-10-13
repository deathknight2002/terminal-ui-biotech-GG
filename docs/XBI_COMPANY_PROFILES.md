# XBI Company Profiles Feature

## Overview

The XBI Company Profiles feature provides comprehensive company information for all constituents of the XBI ETF (SPDR S&P Biotech ETF), using free data sources from Yahoo Finance. This feature enables users to:

- Browse all XBI constituents with key metrics
- View detailed company profiles including business summaries
- Search and filter companies by sector, industry, and other criteria
- Track XBI membership changes over time
- Access market data and financial metrics

## Data Source

**Primary Source**: Yahoo Finance via `yfinance` Python library

### What We Fetch

For each XBI constituent, we fetch:
- **Company Information**: Name, ticker, sector, industry
- **Business Summary**: Detailed company description
- **Location**: Headquarters city, state, country
- **Metrics**: Employees, market cap, enterprise value
- **Financials**: Revenue, EBITDA, cash, debt
- **Market Data**: Current price, 52-week high/low, volume
- **Valuation**: P/E ratio, beta, analyst targets

### Rate Limiting & Caching

To comply with Yahoo Finance's usage guidelines:
- **Rate limit**: Maximum 1 request per second
- **Profile cache**: 24-hour cache for company profiles
- **Quote cache**: 15-minute cache for market quotes
- **Holdings cache**: 6-hour cache for XBI constituent list

## API Endpoints

### Get Company Profile

```http
GET /api/v1/companies/{ticker}/profile
```

Returns comprehensive profile for a specific company.

**Example Response**:
```json
{
  "ticker": "VRTX",
  "name": "Vertex Pharmaceuticals",
  "company_type": "Big Pharma",
  "description": "Vertex Pharmaceuticals is a global biotechnology company...",
  "website": "https://www.vrtx.com",
  "investor_relations_url": "https://investors.vrtx.com",
  "headquarters": "Boston, MA",
  "founded_year": 1989,
  "employees": 4500,
  "financials": {
    "market_cap": 125000000000,
    "enterprise_value": 120000000000,
    "cash_position": 12000000000,
    "latest_price": 450.25,
    "volume": 1250000
  },
  "xbi_membership": {
    "is_constituent": true,
    "added_date": "2020-01-15T00:00:00",
    "removed_date": null
  },
  "pipeline": {
    "program_count": 12,
    "therapeutic_areas": ["Cystic Fibrosis", "Pain", "Sickle Cell Disease"]
  }
}
```

### List XBI Constituents

```http
GET /api/v1/companies/xbi/constituents?active_only=true
```

Returns list of all XBI constituents.

**Parameters**:
- `active_only` (boolean): If true, only returns current constituents

**Example Response**:
```json
{
  "constituents": [
    {
      "ticker": "VRTX",
      "name": "Vertex Pharmaceuticals",
      "company_type": "Big Pharma",
      "market_cap": 125000000000,
      "is_current": true,
      "added_date": "2020-01-15T00:00:00",
      "removed_date": null
    }
  ],
  "count": 56,
  "active_only": true
}
```

### Sync XBI Constituents

```http
POST /api/v1/companies/xbi/sync?force_refresh=false
```

Syncs XBI constituents from Yahoo Finance. This is a long-running operation that may take several minutes.

**Parameters**:
- `force_refresh` (boolean): If true, bypasses cache and fetches fresh data

**Example Response**:
```json
{
  "status": "success",
  "message": "XBI constituents synced successfully",
  "statistics": {
    "total_constituents": 56,
    "new_companies": 3,
    "updated_companies": 53,
    "failed_companies": 0,
    "errors": []
  }
}
```

### Get Sync Status

```http
GET /api/v1/companies/xbi/sync-status
```

Returns current sync status.

**Example Response**:
```json
{
  "status": "success",
  "data": {
    "xbi_constituents_count": 56,
    "last_updated": "2025-10-13T05:00:00"
  }
}
```

### Search Companies

```http
GET /api/v1/companies/search?q=vertex&xbi_only=true
```

Search companies by name, ticker, or other criteria.

**Parameters**:
- `q` (string): Search query (name or ticker)
- `sector` (string): Filter by sector
- `company_type` (string): Filter by company type
- `xbi_only` (boolean): Only return XBI constituents
- `limit` (integer): Maximum results (default 50, max 200)

**Example Response**:
```json
{
  "results": [
    {
      "ticker": "VRTX",
      "name": "Vertex Pharmaceuticals",
      "company_type": "Big Pharma",
      "market_cap": 125000000000,
      "headquarters": "Boston, MA",
      "is_xbi_constituent": true,
      "therapeutic_areas": ["Healthcare", "Biotechnology"]
    }
  ],
  "count": 1,
  "query": {
    "q": "vertex",
    "sector": null,
    "company_type": null,
    "xbi_only": true
  }
}
```

## CLI Usage

### Sync XBI Data

Run from command line to sync XBI constituents:

```bash
# Basic sync (uses cache)
python -m bt_platform.cli.sync_xbi

# Force refresh (bypasses cache)
python -m bt_platform.cli.sync_xbi --force
```

**Output Example**:
```
2025-10-13 05:00:00 - Starting XBI sync...
2025-10-13 05:00:00 - Force refresh: False
2025-10-13 05:00:01 - Found 56 XBI constituents
2025-10-13 05:00:01 - Fetching profile 1/56: VRTX
...
2025-10-13 05:01:30 - Sync completed
============================================================
XBI Sync Complete!
============================================================
Total constituents: 56
New companies: 3
Updated companies: 53
Failed companies: 0
============================================================
```

## Python Usage

### Direct Provider Usage

```python
from bt_platform.providers.yfinance_provider import get_yfinance_provider

# Get provider instance
provider = get_yfinance_provider()

# Fetch company profile
profile = provider.get_company_profile('VRTX')
print(f"Company: {profile['name']}")
print(f"Sector: {profile['sector']}")
print(f"Market Cap: ${profile['market_cap']:,.0f}")

# Get XBI holdings
holdings = provider.get_xbi_holdings()
print(f"XBI has {len(holdings)} constituents")

# Get multiple profiles with rate limiting
tickers = ['VRTX', 'BMRN', 'REGN']
profiles = provider.get_multiple_profiles(tickers)
for ticker, profile in profiles.items():
    print(f"{ticker}: {profile['name']}")
```

### Service Layer Usage

```python
from bt_platform.core.database import SessionLocal
from bt_platform.core.services import XBISyncService

# Create database session
db = SessionLocal()

try:
    # Initialize service
    service = XBISyncService(db)
    
    # Sync all XBI constituents
    stats = service.sync_xbi_constituents(force_refresh=False)
    print(f"Synced {stats['total_constituents']} companies")
    
    # Sync single company
    profile = service.sync_single_company('VRTX')
    print(f"Synced: {profile['name']}")
    
    # Get sync status
    status = service.get_sync_status()
    print(f"XBI constituents in DB: {status['xbi_constituents_count']}")
    
finally:
    db.close()
```

## Terminal UI Integration

### Company Profile Page

The terminal app displays company profiles at:
```
/companies/{ticker}/profile
```

Features include:
- Company overview with key metrics
- Business summary and description
- Pipeline and therapeutic areas
- Upcoming catalysts
- Market data and stock chart
- Recent news articles
- Institutional ownership

### XBI Browser Page

Browse all XBI constituents at:
```
/companies/xbi
```

Features include:
- Grid view of all constituents
- Sort by market cap, name, or sector
- Filter by company type or therapeutic area
- Search by name or ticker
- Quick navigation to company profiles

### Search Functionality

Global search bar supports:
- Company name search (e.g., "Vertex")
- Ticker symbol search (e.g., "VRTX")
- Sector/industry filtering
- XBI-only filter toggle

## Database Schema

The Company model includes these XBI-specific fields:

```python
class Company(Base):
    __tablename__ = "companies"
    
    id = Column(Integer, primary_key=True)
    ticker = Column(String, unique=True, index=True)
    name = Column(String, unique=True, index=True)
    company_type = Column(String, index=True)  # Big Pharma, Biotech, etc.
    
    # Profile data from Yahoo Finance
    description = Column(Text)  # Business summary
    website = Column(String)
    headquarters = Column(String)
    employees = Column(Integer)
    market_cap = Column(Float)
    
    # XBI membership tracking
    is_xbi_constituent = Column(Boolean, default=False, index=True)
    xbi_added_date = Column(DateTime)
    xbi_removed_date = Column(DateTime)
    
    # Sector/industry (stored in therapeutic_areas)
    therapeutic_areas = Column(String)  # Comma-separated
```

## Automation & Scheduling

### Recommended Sync Schedule

For production deployments:

1. **Daily sync** (non-forced): Updates market data and catches new constituents
   ```bash
   # Cron job: Run at 6 AM daily
   0 6 * * * cd /path/to/project && python -m bt_platform.cli.sync_xbi
   ```

2. **Weekly force refresh**: Ensures data consistency
   ```bash
   # Cron job: Run Sunday at 2 AM
   0 2 * * 0 cd /path/to/project && python -m bt_platform.cli.sync_xbi --force
   ```

3. **On-demand via API**: Manual refresh through UI
   ```typescript
   // Frontend button to trigger sync
   const syncXBI = async () => {
     const response = await fetch('/api/v1/companies/xbi/sync', {
       method: 'POST'
     });
     const result = await response.json();
     console.log(`Synced ${result.statistics.total_constituents} companies`);
   };
   ```

## Testing

Run tests:
```bash
# Run all XBI-related tests
pytest tests/test_xbi_sync.py -v

# Run specific test
pytest tests/test_xbi_sync.py::TestYFinanceProvider::test_get_company_profile -v
```

## Limitations & Considerations

### Yahoo Finance Limitations

1. **Rate Limits**: Unofficial API, aggressive scraping may result in IP blocks
2. **Data Accuracy**: Not guaranteed, use for informational purposes only
3. **Availability**: Service can be intermittent or change without notice
4. **Legal**: Gray area for commercial use

### Recommended for Production

For commercial/production use, consider switching to:
- **Polygon.io** ($399/month): Official stock data API
- **Alpha Vantage** ($49.99/month): Stock fundamentals API
- **IEX Cloud** (pay-as-you-go): ~$0.0004 per request
- **FinancialModelingPrep** (free tier available): Company profiles API

### Static XBI List

The provider includes a static list of major XBI constituents as a fallback. This list should be periodically updated by:
1. Checking the official SPDR XBI holdings page
2. Running the sync with force refresh
3. Manually updating the list in `yfinance_provider.py` if needed

Current static list includes 56 major biotech companies.

## Data Attribution

When displaying data from Yahoo Finance, include attribution:

```
Market data provided by Yahoo Finance
For informational purposes only. Not investment advice.
```

## Troubleshooting

### Sync Fails with Connection Error

**Problem**: `ConnectionError` or timeout when syncing

**Solution**:
- Check internet connection
- Verify Yahoo Finance is accessible
- Try with `--force` to bypass cache
- Wait a few minutes and retry (temporary service issue)

### No Data for Certain Tickers

**Problem**: Some tickers return `None` profile

**Solution**:
- Verify ticker symbol is correct (Yahoo Finance format)
- Check if company is public and traded
- Try accessing ticker directly on finance.yahoo.com
- Some tickers may not have full data available

### Rate Limit Exceeded

**Problem**: Getting blocked or slow responses

**Solution**:
- Reduce concurrent sync operations
- Increase rate limit interval in provider config
- Use caching (avoid force refresh)
- Spread syncs across multiple hours

### Cache Not Working

**Problem**: Every request hits API despite caching

**Solution**:
- Check cache TTL settings in `yfinance_provider.py`
- Verify provider singleton is working correctly
- Clear cache manually: `provider.clear_cache()`

## Future Enhancements

Planned improvements:

1. **Webhook support**: Notify on XBI rebalancing
2. **Historical tracking**: Track XBI membership changes over time
3. **Comparison tools**: Compare companies side-by-side
4. **Export functionality**: Export XBI list to CSV/Excel
5. **Advanced filters**: Multi-select sectors, market cap ranges
6. **Peer analysis**: Automatic peer group identification
7. **Alternative data sources**: Integration with Finnhub, FMP APIs
8. **Background sync**: Celery/Redis for async syncing

## License & Compliance

- Yahoo Finance data is for **personal, non-commercial use**
- Platform implements rate limiting and caching for responsible usage
- For commercial deployment, obtain proper data licenses
- See [DATA_SOURCES.md](DATA_SOURCES.md) for complete compliance information

## Support

For issues or questions:
- File an issue on GitHub
- Check existing documentation in `/docs`
- Review API logs for detailed error messages
- Contact platform maintainers

---

**Last Updated**: 2025-10-13  
**Feature Status**: ✅ Production Ready  
**Maintainer**: Biotech Terminal Platform Team

# XBI Company Profiles Feature

## Overview

The XBI Company Profiles feature provides comprehensive company information for all constituents of the SPDR S&P Biotech ETF (XBI). This feature enables users to browse, search, and filter biotech companies with detailed profiles including financial data, pipeline information, and market intelligence.

## Features

### 1. **Comprehensive Company Database**
- 120+ XBI constituent companies
- Automatic classification by market cap (Big Pharma, Large/Mid/Small Cap Biotech)
- Real-time financial metrics from Yahoo Finance (via yfinance)
- Cached data for improved performance (24-hour TTL)

### 2. **Advanced Search & Filtering**
- **Search**: Find companies by name or ticker symbol
- **Company Type**: Filter by Big Pharma, Large Cap, Mid Cap, or Small Cap
- **Market Cap Range**: Set minimum and maximum market capitalization
- **Pagination**: Navigate through results with customizable page size

### 3. **Data Sources**

#### Free Financial Data
The system uses **yfinance** (Yahoo Finance Python library) to fetch:
- Company profiles (name, description, sector, industry)
- Business summaries
- Financial metrics (market cap, revenue, margins, etc.)
- Stock prices and trading data
- Analyst recommendations and target prices

#### Manual Data Collection
For enhanced profiles, you can optionally integrate:
- **Finnhub API**: Free tier provides company profiles and financials
- **Financial Modeling Prep**: Free tier includes company info and statements
- **SEC EDGAR**: Public filings (10-K, 10-Q, 8-K) for official data

### 4. **Caching Strategy**

The company profile provider implements intelligent caching:
- **Location**: `/tmp/company_profile_cache/` (configurable)
- **TTL**: 24 hours (configurable)
- **Cache Bypass**: Use `force_refresh=True` to fetch fresh data
- **Benefits**: 
  - Avoids API rate limits
  - Improves response time
  - Reduces bandwidth usage

## Usage

### API Endpoints

#### Get XBI Constituents (with filters)
```http
GET /api/v1/companies/xbi/constituents

Query Parameters:
  - active_only: boolean (default: true) - Only current constituents
  - search: string - Search by company name or ticker
  - company_type: string - Filter by type (Big Pharma, Large Cap Biotech, etc.)
  - min_market_cap: number - Minimum market cap in USD
  - max_market_cap: number - Maximum market cap in USD
  - limit: number (default: 200) - Results per page
  - offset: number (default: 0) - Pagination offset
```

**Example Request:**
```bash
curl "http://localhost:8000/api/v1/companies/xbi/constituents?search=vertex&min_market_cap=10000000000"
```

**Example Response:**
```json
{
  "constituents": [
    {
      "ticker": "VRTX",
      "name": "Vertex Pharmaceuticals",
      "company_type": "Large Cap Biotech",
      "market_cap": 125000000000,
      "headquarters": "Boston, MA",
      "therapeutic_areas": ["Cystic Fibrosis", "Pain", "Sickle Cell Disease"],
      "is_current": true,
      "added_date": "2020-01-15",
      "removed_date": null
    }
  ],
  "count": 1,
  "total": 1,
  "limit": 200,
  "offset": 0,
  "filters": {
    "search": "vertex",
    "company_type": null,
    "min_market_cap": 10000000000,
    "max_market_cap": null
  }
}
```

#### Get Company Profile
```http
GET /api/v1/companies/{ticker}/profile
```

See [COMPANY_PROFILE_API.md](./COMPANY_PROFILE_API.md) for full API documentation.

### Python Provider

#### Basic Usage
```python
from bt_platform.providers.company_profile_provider import get_company_profile

# Fetch a single company profile
profile = get_company_profile('VRTX')

if profile:
    print(f"Name: {profile['name']}")
    print(f"Market Cap: ${profile['market_cap']:,.0f}")
    print(f"Description: {profile['description']}")
```

#### Advanced Usage
```python
from bt_platform.providers.company_profile_provider import CompanyProfileProvider

# Initialize with custom settings
provider = CompanyProfileProvider(
    cache_dir="/custom/cache/path",
    cache_ttl_hours=48  # 2 days
)

# Fetch with cache bypass
profile = provider.get_company_profile('REGN', force_refresh=True)

# Batch fetch
tickers = ['VRTX', 'REGN', 'BIIB', 'ALNY']
profiles = provider.get_batch_profiles(tickers)

for ticker, profile in profiles.items():
    if profile:
        print(f"{ticker}: {profile['name']}")
```

### Data Ingestion

#### Populate Database with XBI Companies
```bash
# Ingest all XBI companies
python -m bt_platform.core.ingest_xbi_companies

# Force refresh (bypass cache)
python -m bt_platform.core.ingest_xbi_companies --force-refresh

# Ingest specific ticker
python -m bt_platform.core.ingest_xbi_companies --ticker VRTX

# With custom batch size
python -m bt_platform.core.ingest_xbi_companies --batch-size 20
```

The ingestion script:
1. Reads XBI constituents from `data/xbi_constituents.yaml`
2. Fetches company profiles using the provider
3. Creates or updates records in the database
4. Logs progress and generates a summary report

### Terminal UI

#### XBI Companies Page

Navigate to `/xbi-companies` in the terminal to access:

**Features:**
- Grid view of all XBI constituent companies
- Real-time search across company names and tickers
- Filter by company type (Big Pharma, Large/Mid/Small Cap)
- Filter by market cap range
- Pagination with 20 results per page
- Click any company card to view full profile

**Search Examples:**
- "vertex" - finds Vertex Pharmaceuticals
- "REGN" - finds Regeneron by ticker
- Filter by "Large Cap Biotech" + min market cap $50B

## Configuration

### XBI Constituents List

The list of XBI constituents is maintained in `data/xbi_constituents.yaml`:

```yaml
constituents:
  - ticker: VRTX
    name: Vertex Pharmaceuticals
  - ticker: REGN
    name: Regeneron Pharmaceuticals
  # ... 120+ companies
```

To update the list:
1. Edit `data/xbi_constituents.yaml`
2. Run the ingestion script: `python -m bt_platform.core.ingest_xbi_companies --force-refresh`

### Cache Configuration

Modify cache settings in your application:

```python
# In bt_platform/core/config.py or similar
COMPANY_PROFILE_CACHE_DIR = "/path/to/cache"
COMPANY_PROFILE_CACHE_TTL_HOURS = 24
```

## Best Practices

### 1. **Respect Rate Limits**
- Yahoo Finance (yfinance) has informal rate limits
- Use caching to minimize API calls
- Consider adding delays between batch requests
- Monitor for 429 (Too Many Requests) errors

### 2. **Data Refresh Strategy**
```python
# Daily refresh of all companies (cron job)
0 2 * * * cd /app && python -m bt_platform.core.ingest_xbi_companies

# Weekly full refresh with cache bypass
0 3 * * 0 cd /app && python -m bt_platform.core.ingest_xbi_companies --force-refresh
```

### 3. **Error Handling**
The provider handles common errors gracefully:
- Network failures → Returns None, logs error
- Invalid tickers → Returns None, logs warning
- Rate limiting → Uses exponential backoff (implement if needed)

### 4. **Performance Optimization**
- Enable caching in production (24-hour TTL recommended)
- Use batch fetching for multiple companies
- Consider async fetching for large batches (future enhancement)
- Implement CDN caching for API responses

## Testing

### Unit Tests
```bash
# Test company profile API endpoints
poetry run pytest tests/test_company_profile_api.py -v

# Test specific features
poetry run pytest tests/test_company_profile_api.py::test_get_xbi_constituents_with_search -v
```

### Manual Testing
```bash
# Test provider
python3 -c "
from bt_platform.providers.company_profile_provider import get_company_profile
profile = get_company_profile('VRTX')
print(profile['name'] if profile else 'Failed')
"

# Test API endpoint
curl "http://localhost:8000/api/v1/companies/xbi/constituents?search=vertex"

# Test ingestion
python -m bt_platform.core.ingest_xbi_companies --ticker VRTX
```

## Troubleshooting

### Issue: "No data found for ticker"
**Cause**: Invalid ticker or Yahoo Finance doesn't have data  
**Solution**: 
- Verify ticker symbol is correct
- Check if company is publicly traded
- Try alternate tickers (e.g., ADR vs primary listing)

### Issue: "Could not resolve host"
**Cause**: Network connectivity issues or firewall blocking  
**Solution**:
- Check internet connection
- Verify firewall allows HTTPS to finance.yahoo.com
- Consider proxy configuration if behind corporate firewall

### Issue: "Cache is stale"
**Cause**: Cached data older than TTL  
**Solution**:
- Run with `force_refresh=True`
- Clear cache: `rm -rf /tmp/company_profile_cache/*`
- Adjust cache TTL in configuration

### Issue: "Rate limit exceeded"
**Cause**: Too many requests to Yahoo Finance  
**Solution**:
- Enable caching to reduce API calls
- Add delays between requests (e.g., time.sleep(0.5))
- Implement exponential backoff
- Consider paid financial data API for higher limits

## Future Enhancements

1. **Async Data Fetching**: Use asyncio for parallel profile fetching
2. **Additional Data Sources**: Integrate Finnhub, Alpha Vantage, or Financial Modeling Prep
3. **Historical Tracking**: Store XBI rebalance history (additions/removals)
4. **Portfolio Integration**: Track XBI as a portfolio with constituent weights
5. **Insider Trading Data**: Add insider transaction tracking
6. **Institutional Holdings**: Track 13F filings for top holders
7. **Price Alerts**: Set up notifications for price movements
8. **Export Functionality**: CSV/Excel export of filtered results

## References

- **yfinance Documentation**: https://pypi.org/project/yfinance/
- **XBI ETF Official Site**: https://www.ssga.com/us/en/individual/etfs/funds/spdr-sp-biotech-etf-xbi
- **SEC EDGAR**: https://www.sec.gov/edgar
- **Finnhub API**: https://finnhub.io/
- **Financial Modeling Prep**: https://financialmodelingprep.com/

## Support

For issues or questions:
- Create an issue: https://github.com/deathknight2002/terminal-ui-biotech-GG/issues
- Review existing documentation in `docs/`
- Check API documentation at `/docs` endpoint when running the server

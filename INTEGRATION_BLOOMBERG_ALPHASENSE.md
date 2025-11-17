# 🔗 Bloomberg & AlphaSense Integration Guide

Quick guide to integrate Biotech Terminal with Bloomberg Terminal and AlphaSense.

## Bloomberg Terminal Integration

### Prerequisites

- Bloomberg Terminal installed and running
- Bloomberg API license (Server API or Desktop API)
- Network connectivity to Bloomberg API server

### Configuration

1. **Enable Bloomberg Integration**

Edit `.env` file:

```env
# Bloomberg Integration
BLOOMBERG_ENABLED=true
BLOOMBERG_API_HOST=localhost
BLOOMBERG_API_PORT=8194
BLOOMBERG_API_KEY=your-bloomberg-api-key
```

2. **Common Bloomberg API Hosts**

```env
# Local Bloomberg Terminal (Desktop API)
BLOOMBERG_API_HOST=localhost
BLOOMBERG_API_PORT=8194

# Bloomberg Server API (Enterprise)
BLOOMBERG_API_HOST=bloomberg-api.yourcompany.com
BLOOMBERG_API_PORT=8194

# Bloomberg Cloud
BLOOMBERG_API_HOST=api.bloomberg.com
BLOOMBERG_API_PORT=443
```

### Available Data Points

Once integrated, the platform can fetch:

- **Market Data**: Real-time and historical prices
- **Corporate Actions**: Dividends, splits, M&A
- **News**: Bloomberg news feed
- **Analyst Estimates**: Consensus estimates, ratings
- **Fundamentals**: Financial statements, ratios
- **Options**: Chain data, Greeks, implied volatility

### Example API Calls

The platform automatically enriches biotech data with Bloomberg information:

```python
# Example: Get Bloomberg data for a biotech stock
# Platform code (already implemented)
from bt_platform.integrations.bloomberg import BloombergClient

client = BloombergClient()

# Get stock data
stock_data = await client.get_stock_data("CELG US Equity")
# Returns: price, volume, market cap, etc.

# Get analyst estimates
estimates = await client.get_analyst_estimates("CELG US Equity")
# Returns: consensus EPS, revenue, ratings

# Get corporate actions
actions = await client.get_corporate_actions("CELG US Equity")
# Returns: dividends, splits, M&A events
```

### Terminal Display

Bloomberg data appears automatically in the UI:

- **Drug Pipeline**: Enhanced with Bloomberg stock data
- **Company Profiles**: Financial metrics from Bloomberg
- **Market Dashboard**: Real-time prices for biotech stocks
- **News Feed**: Bloomberg news integrated with FDA/clinical trial news

### Rate Limiting

Bloomberg APIs have rate limits:

```env
# Adjust rate limit in .env
BLOOMBERG_RATE_LIMIT=10  # requests per second
BLOOMBERG_CACHE_TTL=300  # cache for 5 minutes
```

### Troubleshooting Bloomberg Integration

**Issue**: Cannot connect to Bloomberg API

```bash
# Test Bloomberg API connectivity
telnet localhost 8194

# Check Bloomberg Terminal is running
# Windows: Check Task Manager for "bbcomm.exe"
# Look for Bloomberg Terminal window
```

**Issue**: Authentication failed

```bash
# Verify API key
curl -H "Authorization: Bearer $BLOOMBERG_API_KEY" \
  http://localhost:8194/api/v1/health

# Check .env file
grep BLOOMBERG_ .env
```

**Issue**: Rate limit exceeded

```env
# Reduce request rate
BLOOMBERG_RATE_LIMIT=5

# Increase cache TTL
BLOOMBERG_CACHE_TTL=600
```

---

## AlphaSense Integration

### Prerequisites

- AlphaSense subscription (Professional or Enterprise)
- AlphaSense API access (contact your account manager)
- API key from AlphaSense dashboard

### Configuration

1. **Enable AlphaSense Integration**

Edit `.env` file:

```env
# AlphaSense Integration
ALPHASENSE_ENABLED=true
ALPHASENSE_API_KEY=your-alphasense-api-key
ALPHASENSE_API_URL=https://api.alpha-sense.com
```

2. **Get API Key**

- Log in to AlphaSense web app
- Go to Settings → API Access
- Generate new API key
- Copy to `.env` file

### Available Features

- **Document Search**: Earnings calls, SEC filings, expert transcripts
- **Expert Insights**: KOL commentary and analysis
- **Sentiment Analysis**: Document-level sentiment scores
- **Transcript Analysis**: Automated Q&A extraction
- **Competitive Intelligence**: Multi-company comparisons

### Example API Calls

```python
# Example: Search AlphaSense documents
# Platform code (already implemented)
from bt_platform.integrations.alphasense import AlphaSenseClient

client = AlphaSenseClient()

# Search for documents
results = await client.search_documents(
    query="PARP inhibitor clinical trial",
    doc_types=["transcript", "filing"],
    companies=["CELG", "BMY"],
    start_date="2024-01-01"
)

# Get document sentiment
sentiment = await client.get_document_sentiment(document_id)

# Extract key topics
topics = await client.extract_topics(document_id)
```

### Terminal Display

AlphaSense data appears in:

- **Intelligence Feed**: Expert insights and transcripts
- **Company Profiles**: Earnings call highlights
- **Catalyst Tracker**: Document-based event detection
- **News Intelligence**: Enhanced with expert commentary

### Search Syntax

```python
# Boolean search
query = "PARP AND (inhibitor OR resistance)"

# Company-specific
query = "Celgene AND (trial OR FDA)"

# Date range
query = "Phase III AND published:[2024-01-01 TO 2024-12-31]"

# Document type
query = "earnings transcript AND ticker:CELG"
```

### Rate Limiting

```env
# AlphaSense rate limits
ALPHASENSE_RATE_LIMIT=5     # requests per second
ALPHASENSE_CACHE_TTL=1800   # cache for 30 minutes
ALPHASENSE_MAX_RESULTS=100  # max results per query
```

### Troubleshooting AlphaSense Integration

**Issue**: 401 Unauthorized

```bash
# Test API key
curl -H "X-API-Key: $ALPHASENSE_API_KEY" \
  https://api.alpha-sense.com/v1/health

# Verify key in .env
grep ALPHASENSE_API_KEY .env

# Check key hasn't expired
# Keys typically valid for 1 year
```

**Issue**: Rate limit exceeded (429)

```env
# Reduce request rate
ALPHASENSE_RATE_LIMIT=3

# Increase cache TTL
ALPHASENSE_CACHE_TTL=3600
```

**Issue**: Empty search results

```python
# Check search syntax
# Try simpler query first
query = "Celgene"  # Simple company name

# Then add filters
query = "Celgene AND Phase III"

# Check date range
start_date = "2024-01-01"  # Not too far in past
```

---

## Combined Bloomberg + AlphaSense Workflow

### Example: Complete Company Analysis

When you view a biotech company in the terminal:

1. **Bloomberg provides**:
   - Current stock price and trend
   - Analyst consensus estimates
   - Corporate actions calendar
   - Financial fundamentals

2. **AlphaSense provides**:
   - Recent earnings call transcripts
   - Expert commentary on pipeline
   - Competitive intelligence
   - Sentiment analysis

3. **Biotech Terminal adds**:
   - Clinical trial data (ClinicalTrials.gov)
   - FDA calendar events
   - Pipeline status
   - Predicted catalyst timing

### Example: Event-Driven Analysis

For a Phase 3 data readout:

```
Bloomberg → Stock price movement before/after
AlphaSense → Expert opinions from transcripts
Terminal → Trial details, predicted outcome
```

All displayed together in unified dashboard.

---

## Cost Considerations

### Bloomberg Terminal

- **Desktop API**: Included with terminal subscription (~$24k/year)
- **Server API**: Additional license required ($$$)
- **Data fees**: May apply for historical data

### AlphaSense

- **Professional**: ~$30k/year (limited API access)
- **Enterprise**: Custom pricing (full API access)
- **API costs**: Usually included in subscription

### Alternative: Free Data Mode

Platform works 100% free without Bloomberg/AlphaSense:

```env
BLOOMBERG_ENABLED=false
ALPHASENSE_ENABLED=false
```

Uses only free data sources:
- Yahoo Finance (market data)
- ClinicalTrials.gov (trials)
- FDA.gov (regulatory)
- SEC EDGAR (filings)

---

## Testing Integration

### Test Bloomberg Connection

```bash
# Check Bloomberg Terminal running
# Windows
tasklist | findstr bloomberg

# Test API connectivity
docker compose exec biotech-terminal python -c "
from bt_platform.integrations.bloomberg import BloombergClient
import asyncio

async def test():
    client = BloombergClient()
    try:
        data = await client.get_stock_data('IBM US Equity')
        print('✓ Bloomberg connected:', data)
    except Exception as e:
        print('✗ Bloomberg error:', e)

asyncio.run(test())
"
```

### Test AlphaSense Connection

```bash
# Test AlphaSense API
docker compose exec biotech-terminal python -c "
from bt_platform.integrations.alphasense import AlphaSenseClient
import asyncio

async def test():
    client = AlphaSenseClient()
    try:
        results = await client.search_documents('biotech')
        print(f'✓ AlphaSense connected: {len(results)} results')
    except Exception as e:
        print('✗ AlphaSense error:', e)

asyncio.run(test())
"
```

---

## Security Best Practices

### Protecting API Keys

```bash
# Never commit API keys to git
echo ".env" >> .gitignore

# Use environment variables in production
export BLOOMBERG_API_KEY="your-key"
export ALPHASENSE_API_KEY="your-key"

# Or use secrets management
# AWS Secrets Manager
# Azure Key Vault
# HashiCorp Vault
```

### Network Security

```env
# Use HTTPS for API calls
ALPHASENSE_API_URL=https://api.alpha-sense.com

# Enable SSL verification
SSL_VERIFY=true

# Corporate SSL certificate
SSL_CERT_FILE=/path/to/company-ca.crt
```

---

## Support Contacts

### Bloomberg Support

- **Terminal support**: Press <HELP> <HELP> in Bloomberg Terminal
- **API support**: api-support@bloomberg.net
- **Documentation**: Bloomberg Terminal → DOCS

### AlphaSense Support

- **Email**: support@alpha-sense.com
- **Phone**: Check your account dashboard
- **Documentation**: https://docs.alpha-sense.com

### Biotech Terminal

- **GitHub**: https://github.com/deathknight2002/terminal-ui-biotech-GG/issues
- **Documentation**: See `docs/` directory

---

## Next Steps

1. ✅ Configure API keys in `.env`
2. ✅ Test connectivity
3. ✅ Review data in terminal UI
4. ✅ Set up rate limiting
5. ✅ Configure caching
6. ✅ Monitor API usage

For complete deployment guide, see [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

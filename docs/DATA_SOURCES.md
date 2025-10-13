# Data Sources and Licensing

## Overview

This document details all external data sources used by the Biotech Terminal Catalyst Prediction Platform, including Terms of Service compliance, rate limiting, attribution requirements, and licensing information.

---

## Clinical Trial Data

### ClinicalTrials.gov

**Provider**: U.S. National Library of Medicine  
**API**: https://clinicaltrials.gov/api/v2/  
**License**: Public Domain (U.S. Government work)

**Terms of Service**:
- No API key required for basic access
- Rate limit: 20 requests/second recommended
- Attribution: Cite as "ClinicalTrials.gov Identifier: NCT[number]"

**Compliance**:
- ✅ Rate limiting enforced: 10 req/s (conservative)
- ✅ Attribution in API responses via `X-Data-Sources` header
- ✅ Data cached to minimize requests
- ✅ robots.txt: Not applicable (API access)

**Data Retention**:
- Raw JSON stored in S3/Iceberg indefinitely
- Normalized data in Postgres updated daily

**Example Attribution**:
```
Data source: ClinicalTrials.gov (NCT01234567)
Last updated: 2024-01-15
```

---

## Regulatory Data

### FDA.gov

**Provider**: U.S. Food and Drug Administration  
**API**: https://api.fda.gov/  
**License**: Public Domain (U.S. Government work)

**Terms of Service**:
- API key required for > 1000 requests/day (free registration)
- Rate limit: 40 requests/minute with API key, 240/minute burst
- No commercial restrictions

**Compliance**:
- ✅ API key registered and stored in AWS Secrets Manager
- ✅ Rate limiting: 5 req/s (well under limit)
- ✅ Attribution in data provenance
- ✅ Respect for API versioning (v1, v2)

**Data Endpoints Used**:
- `/drug/drugsfda`: Drug approvals and labels
- `/drug/event`: FAERS adverse event reports
- `/food/enforcement`: Enforcement actions

**Attribution**:
```
Source: FDA Drugs@FDA database (Application Number: 123456)
Via openFDA API: https://open.fda.gov/
```

### EMA (European Medicines Agency)

**Provider**: European Medicines Agency  
**Website**: https://www.ema.europa.eu/  
**API**: SPOR (Substances, Products, Organisations and Referentials)

**License**: EMA policy on access to documents (Policy/0043)  
**Terms of Service**:
- Data for public interest purposes
- Attribution required
- No commercial use restrictions for public data

**Compliance**:
- ✅ Attribution via source headers
- ✅ Rate limiting based on server response times
- ✅ robots.txt compliance for web scraping

**Attribution**:
```
Source: European Medicines Agency
Data accessed via SPOR portal
```

---

## Financial Data

### SEC EDGAR

**Provider**: U.S. Securities and Exchange Commission  
**Website**: https://www.sec.gov/edgar  
**API**: EDGAR Data API

**License**: Public Domain (U.S. Government work)

**Terms of Service** (Updated 2021):
- Declare identity via User-Agent header
- Rate limit: 10 requests/second per IP
- Automated crawling permitted with proper identification

**User-Agent Format**:
```
User-Agent: Biotech-Terminal/1.0 (contact@biotech-terminal.com)
```

**Compliance**:
- ✅ User-Agent header with contact email
- ✅ Rate limiting: 9 req/s (conservative)
- ✅ Respect for robots.txt
- ✅ Attribution in filing references

**Data Accessed**:
- 10-K, 10-Q (annual/quarterly reports)
- 8-K (material events)
- DEF 14A (proxy statements)

**Attribution**:
```
Source: SEC EDGAR (Accession Number: 0001234567-24-000123)
```

### Yahoo Finance

**Provider**: Yahoo Finance (Verizon Media)  
**Library**: yfinance (Python wrapper)  
**License**: Data for personal, non-commercial use

**Usage in Platform**:
- **XBI ETF Holdings**: Fetching XBI constituent list
- **Company Profiles**: Sector, industry, business summaries
- **Market Data**: Stock prices, market cap, trading volume
- **Financials**: Revenue, EBITDA, cash, debt metrics

**Terms of Service**:
- Yahoo Finance API is not officially supported
- yfinance library uses scraping (gray area)
- Rate limiting recommended (1 request/second implemented)
- Data cached for 24 hours to minimize requests

**Compliance**:
- ⚠️ Gray area: yfinance scrapes Yahoo Finance
- ✅ Rate limiting: Max 1 request/second enforced
- ✅ Caching: 24-hour cache for profiles, 15-min for quotes
- ✅ Backup: Can switch to paid data provider (Polygon.io, Alpha Vantage)

**Features Powered by Yahoo Finance**:
- `/api/v1/companies/{ticker}/profile` - Company profiles with business summaries
- `/api/v1/companies/xbi/constituents` - XBI ETF holdings list
- `/api/v1/companies/xbi/sync` - Automated XBI data refresh
- `/api/v1/companies/search` - Search companies by sector, industry

**Recommended Alternative** (for production):\
- **Polygon.io**: $399/month for real-time stocks + options
- **Alpha Vantage**: $49.99/month for stocks
- **IEX Cloud**: Pay-as-you-go, ~$0.0004/request

**Attribution**:
```
Market data provided by Yahoo Finance
For informational purposes only
```

### Options Data

**Provider**: TBD (Polygon.io recommended for production)  
**Current**: Derived from Yahoo Finance options chain

**License**: Depends on provider

**Recommended Provider**:
- **Polygon.io Options**: Real-time options data
- **CBOE DataShop**: Official options data, higher cost

**Compliance**:
- ⚠️ Placeholder: Switch to licensed provider before production
- ✅ Data delayed 15 minutes for free tier

---

## Conference and Publication Data

### ASCO (American Society of Clinical Oncology)

**Provider**: ASCO  
**Website**: https://meetings.asco.org/

**License**: Abstracts publicly available, full papers subscription

**Terms of Service**:
- Abstracts: Public access via meeting library
- robots.txt: Allows crawling with rate limiting

**Compliance**:
- ✅ robots.txt compliance
- ✅ Rate limiting: 1 request every 2 seconds
- ✅ Attribution via citation

**Attribution**:
```
Presented at ASCO Annual Meeting 2024
Abstract #LBA1
```

### ESMO, ASH, AHA, etc.

Similar policies apply:
- ✅ Public abstracts crawlable with attribution
- ✅ Rate limiting enforced
- ✅ Full papers require subscription (not scraped)

---

## Aggregators and Indexes

### PubMed

**Provider**: U.S. National Library of Medicine  
**API**: E-utilities (Entrez Programming Utilities)  
**License**: Public Domain

**Terms of Service**:
- No API key for <3 requests/second
- API key required for >3 requests/second
- No automated large-scale downloads

**Compliance**:
- ✅ API key registered
- ✅ Rate limiting: 2 req/s
- ✅ Respect for Entrez User Requirements

**Attribution**:
```
Source: PubMed (PMID: 12345678)
```

---

## Data Licensing Summary

| Source | License | Attribution | Rate Limit | Cost |
|--------|---------|-------------|------------|------|
| ClinicalTrials.gov | Public Domain | Required | 10 req/s | Free |
| FDA.gov | Public Domain | Required | 5 req/s | Free |
| EMA | Public Interest | Required | Variable | Free |
| SEC EDGAR | Public Domain | Required | 9 req/s | Free |
| Yahoo Finance | Personal Use ⚠️ | Required | 1 req/s | Free |
| Polygon.io | Commercial | Required | Varies | $399/mo |
| ASCO/ESMO | Public Abstracts | Required | 0.5 req/s | Free |
| PubMed | Public Domain | Required | 2 req/s | Free |

**Legend**:
- ⚠️ = Gray area or unclear licensing, use with caution in production

---

## Attribution Requirements

### API Responses

All API endpoints include provenance headers:
```http
X-Data-Sources: ClinicalTrials.gov, FDA.gov, SEC
X-Last-Updated: 2024-01-15T12:00:00Z
X-Data-Freshness: 24h
```

### Frontend Display

Citations displayed in UI:
```
Data sources: ClinicalTrials.gov (NCT01234567), FDA Drugs@FDA
Last updated: January 15, 2024
```

### Exports

CSV/JSON exports include metadata:
```json
{
  "metadata": {
    "sources": [
      {"provider": "ClinicalTrials.gov", "nct_id": "NCT01234567"},
      {"provider": "FDA.gov", "application_number": "123456"}
    ],
    "attribution": "Data provided by U.S. Government sources (ClinicalTrials.gov, FDA.gov)",
    "last_updated": "2024-01-15T12:00:00Z"
  },
  "data": [...]
}
```

---

## robots.txt Compliance

### Scraping Policy

**Web Scraping** (when API not available):
- ✅ Check robots.txt before scraping any site
- ✅ Respect `User-agent: *` and `Crawl-delay` directives
- ✅ Implement exponential backoff on errors
- ✅ Set descriptive User-Agent with contact email

**Example Implementation**:
```python
from urllib.robotparser import RobotFileParser
import time

def check_robots_txt(url):
    rp = RobotFileParser()
    rp.set_url(f"{url}/robots.txt")
    rp.read()
    
    user_agent = "Biotech-Terminal/1.0"
    if not rp.can_fetch(user_agent, url):
        raise PermissionError(f"Scraping not allowed: {url}")
    
    crawl_delay = rp.crawl_delay(user_agent) or 1
    return crawl_delay

# Usage
delay = check_robots_txt("https://example.com")
time.sleep(delay)
```

---

## Provider-Specific Throttles

### Implementation

**Dagster Assets**: Rate limiting via `@rate_limit` decorator
```python
from ingest.utils import rate_limit

@asset
@rate_limit(calls=10, period=1)  # 10 calls per second
def fetch_trials():
    # Connector automatically throttles
    pass
```

**Provider Configurations** (in `ingest/providers/config.yaml`):
```yaml
providers:
  clinicaltrials_gov:
    rate_limit:
      calls_per_second: 10
      burst: 20
    retry:
      max_attempts: 3
      backoff_multiplier: 2
  
  fda_gov:
    rate_limit:
      calls_per_second: 5
      burst: 10
    retry:
      max_attempts: 5
      backoff_multiplier: 1.5
  
  sec_edgar:
    rate_limit:
      calls_per_second: 9  # Conservative (SEC allows 10)
      burst: 10
    user_agent: "Biotech-Terminal/1.0 (contact@biotech-terminal.com)"
```

---

## Privacy and PII

### No PII Policy

**Commitment**: We do NOT collect, store, or process personally identifiable information (PII).

**Data Handling**:
- ✅ Clinical trial data: Aggregated only, no patient identifiers
- ✅ FAERS data: De-identified adverse events only
- ✅ Filings: Public company information only
- ✅ No tracking of individual users beyond aggregate analytics

**Compliance**:
- ✅ GDPR: No PII collected
- ✅ CCPA: No personal data sold or shared
- ✅ HIPAA: No PHI (Protected Health Information) in system

---

## License Changes and Updates

### Monitoring

**Quarterly Review**:
- Check for TOS updates on all provider websites
- Review API changelog for breaking changes
- Update rate limits if provider policy changes

**Notification Channels**:
- Subscribe to provider mailing lists (FDA, SEC, etc.)
- Monitor GitHub issues for yfinance and other libraries
- Set up Google Alerts for "SEC EDGAR API change", "FDA API update", etc.

**Documentation Updates**:
- Update this file when licenses change
- Notify engineering team via Slack #data-sources
- Update attribution in codebase if required

---

## Legal Contact

For questions about data licensing or compliance:
- **Legal Team**: legal@biotech-terminal.com
- **Data Platform Lead**: data-platform@biotech-terminal.com

For data provider inquiries:
- **FDA Open Data**: openfda@fda.hhs.gov
- **ClinicalTrials.gov**: ClinicalTrials.gov_registration@nlm.nih.gov
- **SEC EDGAR Support**: Via SEC.gov contact form

---

## Disclaimer

**Data Accuracy**: Data is provided "as-is" without warranty. We make reasonable efforts to ensure accuracy but cannot guarantee completeness.

**Investment Use**: Data is for informational purposes only. Not investment advice. Consult a licensed financial advisor.

**Medical Use**: Data is for research purposes only. Not medical advice. Consult a licensed healthcare provider.

---

**Last Updated**: 2024-01-15  
**Maintained By**: Data Platform Team  
**Review Frequency**: Quarterly

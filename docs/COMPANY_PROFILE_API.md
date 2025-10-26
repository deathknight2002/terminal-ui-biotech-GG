# Company Profile Feature - API Documentation

## Overview

The Company Profile feature provides comprehensive, FactSet/CapIQ-level detail for biotech companies, with special focus on XBI (SPDR S&P Biotech ETF) constituents.

## API Endpoints

All endpoints are under `/api/v1/companies`

### Get Company Profile

**GET** `/api/v1/companies/{ticker}/profile`

Returns comprehensive company information including financials, XBI membership, and basic stats.

**Parameters:**
- `ticker` (path, required): Company ticker symbol

**Response:**
```json
{
  "ticker": "VRTX",
  "name": "Vertex Pharmaceuticals",
  "company_type": "Biotech",
  "description": "Company description...",
  "website": "https://www.vrtx.com",
  "investor_relations_url": "https://investors.vrtx.com",
  "headquarters": "Boston, MA",
  "founded_year": 1989,
  "employees": 4500,
  "financials": {
    "market_cap": 125000000000,
    "enterprise_value": null,
    "cash_position": null,
    "latest_price": 450.50,
    "price_change": 5.25,
    "volume": 1234567
  },
  "xbi_membership": {
    "is_constituent": true,
    "added_date": "2020-01-15",
    "removed_date": null
  },
  "pipeline": {
    "program_count": 12,
    "therapeutic_areas": ["Cystic Fibrosis", "Pain", "Sickle Cell Disease"]
  },
  "catalysts": {
    "upcoming_count": 3
  }
}
```

### Get Company Sources

**GET** `/api/v1/companies/{ticker}/sources`

Returns investor presentations, press releases, and SEC filings.

**Parameters:**
- `ticker` (path, required): Company ticker symbol
- `source_type` (query, optional): Filter by type (PRESENTATION, PRESS_RELEASE, IR_MATERIAL, FILING)
- `limit` (query, optional): Max results (default: 50, max: 200)

**Response:**
```json
{
  "ticker": "VRTX",
  "sources": [
    {
      "id": 1,
      "type": "PRESENTATION",
      "title": "Q4 2024 Investor Presentation",
      "url": "https://...",
      "published_date": "2024-02-15",
      "description": "Fourth quarter results...",
      "filing_type": null,
      "accession_number": null
    }
  ],
  "count": 1
}
```

### Get Company Articles

**GET** `/api/v1/companies/{ticker}/articles`

Returns recent news articles about the company.

**Parameters:**
- `ticker` (path, required): Company ticker symbol
- `days` (query, optional): Days to look back (default: 90)
- `limit` (query, optional): Max results (default: 50, max: 200)

**Response:**
```json
{
  "ticker": "VRTX",
  "articles": [
    {
      "id": 1,
      "title": "Vertex Stock Rises on Strong Pipeline Data",
      "source": "BioPharma Dive",
      "url": "https://...",
      "published_date": "2024-10-09",
      "summary": "Shares jumped following...",
      "relevance_score": 0.95,
      "sentiment_score": 0.7
    }
  ],
  "count": 1,
  "days": 90
}
```

### Get Company Ownership

**GET** `/api/v1/companies/{ticker}/ownership`

Returns institutional ownership snapshot.

**Parameters:**
- `ticker` (path, required): Company ticker symbol
- `top_n` (query, optional): Number of top holders (default: 20)

**Response:**
```json
{
  "ticker": "VRTX",
  "ownership": [
    {
      "institution_name": "Vanguard Group Inc",
      "shares_held": 8500000,
      "percent_owned": 8.5,
      "value_usd": 3825000000,
      "shares_change": 425000,
      "percent_change": 5.0,
      "form_type": "13F"
    }
  ],
  "count": 10,
  "reporting_date": "2024-03-31",
  "total_institutional_ownership": 42.5
}
```

### Get Company Pipeline

**GET** `/api/v1/companies/{ticker}/pipeline`

Returns drug development pipeline grouped by therapeutic area.

**Parameters:**
- `ticker` (path, required): Company ticker symbol

**Response:**
```json
{
  "ticker": "VRTX",
  "company": "Vertex Pharmaceuticals",
  "pipeline": [
    {
      "therapeutic_area": "Cystic Fibrosis",
      "programs": [
        {
          "id": 1,
          "name": "Trikafta",
          "generic_name": "elexacaftor/tezacaftor/ivacaftor",
          "indication": "Cystic fibrosis in patients 6 years and older",
          "phase": "Approved",
          "mechanism": "CFTR modulator",
          "target": "CFTR protein",
          "status": "Active"
        }
      ],
      "count": 3
    }
  ],
  "total_programs": 12
}
```

### Get Company Catalysts

**GET** `/api/v1/companies/{ticker}/catalysts`

Returns upcoming market catalysts.

**Parameters:**
- `ticker` (path, required): Company ticker symbol
- `upcoming_days` (query, optional): Days to look ahead (default: 90)

**Response:**
```json
{
  "ticker": "VRTX",
  "company": "Vertex Pharmaceuticals",
  "catalysts": [
    {
      "id": 1,
      "title": "VX-880 Phase 2 Data Readout",
      "event_type": "Clinical Data",
      "date": "2024-11-25",
      "drug": "VX-880",
      "description": "Phase 2 efficacy and safety data...",
      "probability": 0.75,
      "impact": "High",
      "source_url": null
    }
  ],
  "count": 3,
  "date_range": {
    "start": "2024-10-12",
    "end": "2025-01-10"
  }
}
```

### Get Stock Chart Data

**GET** `/api/v1/companies/{ticker}/stock-chart`

Returns historical stock price data for charting.

**Parameters:**
- `ticker` (path, required): Company ticker symbol
- `days` (query, optional): Days of history (default: 90)

**Response:**
```json
{
  "ticker": "VRTX",
  "prices": [
    {
      "date": "2024-10-12",
      "open": 448.50,
      "high": 452.75,
      "low": 445.20,
      "close": 450.50,
      "volume": 1234567
    }
  ],
  "count": 90,
  "days": 90
}
```

### Get XBI Constituents

**GET** `/api/v1/companies/xbi/constituents`

Returns list of companies in the SPDR S&P Biotech ETF.

**Parameters:**
- `active_only` (query, optional): Only current constituents (default: true)

**Response:**
```json
{
  "constituents": [
    {
      "ticker": "VRTX",
      "name": "Vertex Pharmaceuticals",
      "company_type": "Biotech",
      "market_cap": 125000000000,
      "is_current": true,
      "added_date": "2020-01-15",
      "removed_date": null
    }
  ],
  "count": 150,
  "active_only": true
}
```

## Frontend Usage

### Navigation

Companies can be accessed via:
- Direct URL: `/companies/{ticker}`
- Search: Use GlobalSearch component, results navigate to company profile
- Links: Any component can link to `/companies/{ticker}`

### Component

The `CompanyProfilePage` component handles all profile rendering with tabs:
- **Overview**: Company info, recent articles, therapeutic areas
- **Pipeline**: Drug programs grouped by therapeutic area
- **Catalysts**: Upcoming events timeline
- **Sources**: Investor presentations, filings, press releases
- **Ownership**: Institutional holders

### Example Usage

```tsx
import { useNavigate } from 'react-router-dom';

function CompanyLink({ ticker }: { ticker: string }) {
  const navigate = useNavigate();

  return (
    <button onClick={() => navigate(`/companies/${ticker}`)}>
      View {ticker} Profile
    </button>
  );
}
```

## Data Refresh

Company profile data should be refreshed regularly:

1. **Manual Refresh**: Run seed script for test data
   ```bash
   python bt_platform/core/seed_company_profile.py
   ```

2. **Production Refresh**: Implement scrapers for:
   - SEC EDGAR filings (10-K, 10-Q, 8-K)
   - Company investor relations pages
   - News aggregators (BioPharma Dive, FiercePharma)
   - XBI constituent tracking

3. **Recommended Schedule**:
   - XBI constituents: Weekly
   - SEC filings: Daily
   - News articles: Daily
   - Stock prices: Real-time or 15-minute delay
   - Ownership data: Quarterly (after 13F filings)

## Mobile Support

The Company Profile page is fully responsive and PWA-compatible:
- Mobile-first grid layouts
- Touch-friendly tabs and buttons
- Safe area support for iOS notch
- Offline-capable with cached data
- Installable to home screen

## Future Enhancements

- [ ] Competitors comparison view
- [ ] Financial modeling integration
- [ ] Trial enrollment visualization
- [ ] Conference presentation calendar
- [ ] Executive team profiles
- [ ] Patent cliff analysis
- [ ] M&A probability scoring

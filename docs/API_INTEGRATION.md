# API Integration Guide

## Overview

The Biotech Terminal provides comprehensive REST APIs for financial modeling, data ingestion, report generation, and intelligence queries. This guide covers all API endpoints, authentication, and integration patterns.

## Base Configuration

### API Endpoints

- **Python FastAPI**: `http://localhost:8000/api/v1/`
- **Node.js Express**: `http://localhost:3001/api/`
- **Production**: `https://api.bioterminal.com/api/v1/`

### Authentication

```bash
# Get access token
POST /api/v1/auth/token
Content-Type: application/json

{
  "username": "analyst@biotech.com",
  "password": "secure_password"
}

# Response
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600
}

# Use token in requests
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Financial Endpoints

### GET /api/v1/financials/overview

Get financial overview for a ticker.

**Query Parameters:**
- `ticker` (optional): Filter by ticker

**Response:**
```json
{
  "ticker": "NUVL",
  "market_cap": 4200000000,
  "enterprise_value": 3800000000,
  "cash": 450000000,
  "debt": 50000000,
  "revenue_ttm": 125000000,
  "revenue_growth": 0.45
}
```

### GET /api/v1/financials/price-targets

Get analyst price targets.

**Query Parameters:**
- `ticker` (optional): Filter by ticker
- `limit` (optional): Max results (default: 50)

**Response:**
```json
{
  "count": 12,
  "price_targets": [
    {
      "id": 1,
      "ticker": "NUVL",
      "source": "Goldman Sachs",
      "date": "2025-01-15",
      "price_target": 52.0,
      "currency": "USD",
      "rationale": "Strong pipeline momentum"
    }
  ]
}
```

### POST /api/v1/financials/price-targets

Create new price target entry.

**Request Body:**
```json
{
  "ticker": "NUVL",
  "source": "Goldman Sachs",
  "date": "2025-01-15",
  "price_target": 52.0,
  "rationale": "Strong pipeline momentum",
  "currency": "USD"
}
```

**Response:**
```json
{
  "status": "success",
  "id": 15,
  "ticker": "NUVL"
}
```

### GET /api/v1/financials/consensus

Get Street consensus estimates.

**Query Parameters:**
- `ticker` (optional): Filter by ticker
- `metric` (optional): Filter by metric type

**Response:**
```json
{
  "count": 45,
  "consensus_estimates": [
    {
      "ticker": "NUVL",
      "metric": "revenue",
      "period": "2025",
      "value": 250000000,
      "source": "FactSet",
      "currency": "USD"
    }
  ]
}
```

### POST /api/v1/financials/consensus/upload

Upload consensus data from CSV/XLSX file.

**Request:**
```bash
POST /api/v1/financials/consensus/upload
Content-Type: multipart/form-data

{
  "file": <file>,
  "ticker": "NUVL",
  "source": "analyst_upload"
}
```

**Response:**
```json
{
  "status": "success",
  "imported": {
    "consensus_estimates": 45,
    "price_targets": 12
  },
  "warnings": [],
  "errors": []
}
```

### POST /api/v1/financials/valuation/run

Run valuation model with parameters.

**Request Body:**
```json
{
  "ticker": "NUVL",
  "scenario_id": "base",
  "epi_params": {
    "US_addressable": 50000,
    "EU_addressable": 40000,
    "US_eligible_rate": 0.7,
    "EU_eligible_rate": 0.65
  },
  "financial_assumptions": {
    "wacc": 0.12,
    "tgr": 0.025,
    "pricing": {
      "US": 150000,
      "EU": 120000,
      "ROW": 80000
    },
    "uptake_curve": {
      "2025": 0.05,
      "2026": 0.15,
      "2027": 0.30
    },
    "pos_by_phase": 0.65
  },
  "loe_events": [
    {
      "asset_id": "NUVL-001",
      "expiry_year": 2032,
      "erosion_rates": {
        "year_1": 0.60,
        "year_2": 0.80,
        "year_3": 0.90
      }
    }
  ],
  "user": "analyst@biotech.com"
}
```

**Response:**
```json
{
  "status": "success",
  "run_id": 456,
  "results": {
    "inputs_hash": "abc123...",
    "version": "1.0",
    "dcf": {
      "enterprise_value": 2500000000,
      "equity_value": 2900000000,
      "price_per_share": 48.50
    },
    "multiples": {
      "ev_to_revenue": 12.5,
      "implied_value": 2800000000
    },
    "revenue_projections": {...},
    "sensitivity": {...}
  }
}
```

### GET /api/v1/financials/audit

Get valuation run history.

**Query Parameters:**
- `ticker` (optional): Filter by ticker
- `limit` (optional): Max results (default: 50)

**Response:**
```json
{
  "count": 25,
  "runs": [
    {
      "id": 456,
      "ticker": "NUVL",
      "scenario": "base",
      "run_timestamp": "2025-01-15T10:30:00Z",
      "user": "analyst@biotech.com",
      "inputs_hash": "abc123...",
      "version": "1.0"
    }
  ]
}
```

## Report Endpoints

### POST /api/v1/reports/export

Generate report artifacts (XLSX, PPTX, PDF).

**Request Body:**
```json
{
  "ticker": "NUVL",
  "template_id": "banker_deck",
  "file_type": "pptx",
  "params": {
    "include_sensitivity": true,
    "include_comparables": true,
    "analyst_name": "John Smith",
    "date": "2025-01-15"
  },
  "user": "analyst@biotech.com"
}
```

**Response:**
```json
{
  "status": "success",
  "artifact_id": 789,
  "file_type": "pptx",
  "file_name": "NUVL_banker_deck_20250115.pptx",
  "download_url": "/api/v1/reports/download/xyz789...",
  "expiry_date": "2025-01-22T10:30:00Z"
}
```

### GET /api/v1/reports/download/{file_hash}

Download report by file hash.

**Response:**
```json
{
  "file_path": "/reports/NUVL_banker_deck_20250115.pptx",
  "file_type": "pptx",
  "file_size": 2458624,
  "download_url": "/api/v1/reports/download/xyz789..."
}
```

### GET /api/v1/reports/list

List generated reports.

**Query Parameters:**
- `ticker` (optional): Filter by ticker
- `template_id` (optional): Filter by template
- `limit` (optional): Max results (default: 50)

**Response:**
```json
{
  "count": 15,
  "reports": [
    {
      "id": 789,
      "ticker": "NUVL",
      "file_type": "pptx",
      "template_id": "banker_deck",
      "generated_at": "2025-01-15T10:30:00Z",
      "generated_by": "analyst@biotech.com",
      "file_size": 2458624,
      "download_url": "/api/v1/reports/download/xyz789...",
      "expired": false
    }
  ]
}
```

## LoE Endpoints

### GET /api/v1/loe/timeline

Get LoE cliff timeline visualization data.

**Query Parameters:**
- `ticker` (optional): Filter by ticker

**Response:**
```json
{
  "events": [
    {
      "asset_id": "NUVL-001",
      "asset_name": "Nucleoside Analog",
      "region": "US",
      "expiry_date": "2032-06-15",
      "exclusivity_type": "Composition of Matter",
      "peak_revenue": 850000000,
      "year_1_erosion": 0.60,
      "year_2_erosion": 0.80
    }
  ]
}
```

## Biotech Intelligence Endpoints

### GET /api/v1/biotech/companies

Search and list biotech companies.

**Query Parameters:**
- `search` (optional): Search query
- `company_type` (optional): Filter by type
- `limit` (optional): Max results (default: 50)

**Response:**
```json
{
  "count": 100,
  "companies": [
    {
      "ticker": "NUVL",
      "name": "Nuvelo Therapeutics",
      "company_type": "Biotech",
      "market_cap": 4200000000,
      "therapeutic_areas": ["Oncology", "Rare Disease"]
    }
  ]
}
```

### GET /api/v1/biotech/trials

Search clinical trials.

**Query Parameters:**
- `search` (optional): Search query
- `phase` (optional): Filter by phase
- `status` (optional): Filter by status

**Response:**
```json
{
  "count": 250,
  "trials": [
    {
      "nct_id": "NCT12345678",
      "title": "Phase 3 Study of...",
      "phase": "Phase III",
      "status": "Recruiting",
      "sponsor": "Nuvelo Therapeutics",
      "indication": "DMD"
    }
  ]
}
```

### GET /api/v1/biotech/pipeline

Get drug pipeline data.

**Query Parameters:**
- `ticker` (optional): Filter by company
- `phase` (optional): Filter by phase

**Response:**
```json
{
  "assets": [
    {
      "asset_id": "NUVL-001",
      "asset_name": "Nucleoside Analog",
      "phase": "Phase III",
      "indication": "DMD",
      "mechanism": "Exon Skipping",
      "next_catalyst": "2025-Q3 Readout"
    }
  ]
}
```

## Search Endpoints

### GET /api/v1/search/global

Global full-text search across all entities.

**Query Parameters:**
- `q`: Search query (required)
- `type` (optional): Entity type filter
- `limit` (optional): Max results (default: 50)

**Response:**
```json
{
  "count": 45,
  "results": [
    {
      "type": "company",
      "id": "NUVL",
      "title": "Nuvelo Therapeutics",
      "snippet": "...developing treatments for rare diseases...",
      "score": 0.95
    },
    {
      "type": "trial",
      "id": "NCT12345678",
      "title": "Phase 3 Study of NUVL-001",
      "snippet": "...patients with Duchenne muscular dystrophy...",
      "score": 0.88
    }
  ]
}
```

## Admin Endpoints

### POST /api/v1/admin/ingest

Trigger manual data refresh.

**Request Body:**
```json
{
  "sources": ["news", "trials", "catalysts"],
  "force": false
}
```

**Response:**
```json
{
  "status": "started",
  "job_id": "ingest_20250115_103000",
  "sources": ["news", "trials", "catalysts"]
}
```

### GET /api/v1/admin/ingest/status/{job_id}

Check ingestion job status.

**Response:**
```json
{
  "job_id": "ingest_20250115_103000",
  "status": "completed",
  "started_at": "2025-01-15T10:30:00Z",
  "completed_at": "2025-01-15T10:35:00Z",
  "results": {
    "news": 125,
    "trials": 45,
    "catalysts": 12
  }
}
```

## Error Handling

### Standard Error Response

```json
{
  "detail": "Error message",
  "status_code": 400,
  "error_type": "ValidationError"
}
```

### HTTP Status Codes

- `200 OK`: Request successful
- `201 Created`: Resource created
- `400 Bad Request`: Invalid parameters
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `422 Unprocessable Entity`: Validation failed
- `500 Internal Server Error`: Server error

## Rate Limiting

- **Rate Limit**: 100 requests per minute per IP
- **Headers**:
  - `X-RateLimit-Limit`: 100
  - `X-RateLimit-Remaining`: 95
  - `X-RateLimit-Reset`: 1642261200

## WebSocket Endpoints

### Real-Time Data Streaming

```javascript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:3001/ws');

// Subscribe to market data
ws.send(JSON.stringify({
  action: 'subscribe',
  channel: 'market_data',
  tickers: ['NUVL', 'ARYAZ']
}));

// Receive updates
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data);
};
```

## SDK Examples

### Python SDK

```python
from biotech_terminal import BiotechClient

client = BiotechClient(
    api_url='http://localhost:8000',
    api_key='your_api_key'
)

# Get financials
financials = client.financials.overview(ticker='NUVL')

# Run valuation
results = client.financials.run_valuation(
    ticker='NUVL',
    scenario='base',
    epi_params={...},
    financial_assumptions={...}
)

# Export report
report = client.reports.export(
    ticker='NUVL',
    template_id='banker_deck',
    file_type='pptx'
)
```

### TypeScript/JavaScript SDK

```typescript
import { BiotechClient } from '@biotech-terminal/client';

const client = new BiotechClient({
  apiUrl: 'http://localhost:8000',
  apiKey: 'your_api_key'
});

// Get financials
const financials = await client.financials.getOverview({ ticker: 'NUVL' });

// Run valuation
const results = await client.financials.runValuation({
  ticker: 'NUVL',
  scenario: 'base',
  epiParams: {...},
  financialAssumptions: {...}
});

// Export report
const report = await client.reports.export({
  ticker: 'NUVL',
  templateId: 'banker_deck',
  fileType: 'pptx'
});
```

## Therapeutic Area Intelligence Endpoints

### GET /api/v1/therapeutic-areas/areas

List all therapeutic areas with their science attributes for spider/radar chart visualization.

**Response:**
```json
{
  "areas": [
    {
      "id": "DMD",
      "name": "Duchenne Muscular Dystrophy",
      "attributes": {
        "unmet_need": 9.5,
        "market_size": 7.8,
        "regulatory_support": 8.5,
        "scientific_validation": 8.2,
        "competitive_intensity": 7.5,
        "reimbursement_potential": 8.0,
        "patient_advocacy": 9.0
      },
      "metadata": {
        "description": "Ultra-rare X-linked disorder...",
        "prevalence": "1 in 3,500-5,000 male births",
        "peak_sales_potential": "5-8B globally",
        "key_mechanisms": ["Exon skipping", "Gene therapy", "Myosin inhibition"]
      },
      "companies": ["SRPT", "BMRN", "EWTX", "INSM", "JAZZ", "KROS", "PEPG", "PFE", "QURE", "RGNX", "RNA", "SLDB", "WVE"]
    }
  ],
  "attribute_labels": [
    "Unmet Need",
    "Market Size",
    "Regulatory Support",
    "Scientific Validation",
    "Competitive Intensity",
    "Reimbursement Potential",
    "Patient Advocacy"
  ],
  "scale": {
    "min": 0,
    "max": 10,
    "description": "All attributes scored 0-10 where 10 is most favorable"
  }
}
```

### GET /api/v1/therapeutic-areas/areas/{area_id}

Get detailed information about a specific therapeutic area including companies, pipeline assets, and recent catalysts.

**Parameters:**
- `area_id`: Therapeutic area identifier (e.g., "DMD", "Cardiology", "IBD")

**Response:**
```json
{
  "id": "DMD",
  "name": "Duchenne Muscular Dystrophy",
  "attributes": {...},
  "metadata": {...},
  "companies": [
    {
      "ticker": "SRPT",
      "name": "Sarepta Therapeutics",
      "company_type": "Biotech",
      "market_cap": 7800000000,
      "pipeline_count": 15
    }
  ],
  "pipeline": [
    {
      "name": "SRP-5051",
      "generic_name": "Vesleteplirsen",
      "company": "Sarepta Therapeutics",
      "indication": "Duchenne Muscular Dystrophy (Exon 51 Skip)",
      "phase": "Phase III",
      "mechanism": "Exon-skipping PMO"
    }
  ],
  "pipeline_count": 6,
  "company_count": 13
}
```

### GET /api/v1/therapeutic-areas/areas/compare/radar

Get therapeutic area comparison data formatted for radar/spider chart visualization with Aurora-themed gradients.

**Query Parameters:**
- `areas` (optional): Comma-separated area IDs to compare (default: all areas)

**Example:** `/api/v1/therapeutic-areas/areas/compare/radar?areas=DMD,Cardiology,IBD`

**Response:**
```json
{
  "chart_type": "radar",
  "attributes": [
    "Unmet Need",
    "Market Size",
    "Regulatory Support",
    "Scientific Validation",
    "Competitive Intensity",
    "Reimbursement Potential",
    "Patient Advocacy"
  ],
  "series": [
    {
      "id": "DMD",
      "name": "Duchenne Muscular Dystrophy",
      "values": [9.5, 7.8, 8.5, 8.2, 7.5, 8.0, 9.0],
      "color": "#00d4ff",
      "description": "Ultra-rare X-linked disorder with high mortality..."
    },
    {
      "id": "CARDIOLOGY",
      "name": "Cardiovascular Disease",
      "values": [8.5, 9.5, 7.5, 9.0, 9.0, 8.5, 7.0],
      "color": "#fbbf24",
      "description": "Large market with significant unmet need..."
    }
  ],
  "scale": {
    "min": 0,
    "max": 10
  },
  "theme": "aurora",
  "interactivity": {
    "hover": true,
    "toggle_series": true,
    "color_by_value": true
  }
}
```

### GET /api/v1/therapeutic-areas/areas/{area_id}/companies

Get all companies operating in a therapeutic area with their market metrics.

**Parameters:**
- `area_id`: Therapeutic area identifier

**Response:**
```json
{
  "therapeutic_area": "Duchenne Muscular Dystrophy",
  "company_count": 13,
  "companies": [
    {
      "ticker": "SRPT",
      "name": "Sarepta Therapeutics",
      "company_type": "Biotech",
      "market_cap": 7800000000,
      "headquarters": "Cambridge, MA",
      "pipeline_count": 15,
      "therapeutic_areas": "Rare Disease,Neurology"
    }
  ]
}
```

## Best Practices

1. **Use Authentication**: Always include Bearer token
2. **Handle Rate Limits**: Implement exponential backoff
3. **Validate Input**: Check parameters before sending
4. **Handle Errors**: Gracefully handle 4xx/5xx responses
5. **Use Pagination**: Implement pagination for large datasets
6. **Cache Responses**: Cache static data locally (especially therapeutic area data)
7. **Monitor Usage**: Track API calls and quotas
8. **Yahoo Finance Integration**: Use the built-in rate limiter (max 2000 req/hour)

### Yahoo Finance Rate Limiting

When integrating with Yahoo Finance data (for market data, quotes, etc.), use the built-in rate limiter:

```python
from platform.core.utils import yahoo_rate_limited, get_yahoo_rate_limiter

# Option 1: Use decorator
@yahoo_rate_limited(use_cache=True)
def fetch_stock_quote(ticker: str):
    # Your Yahoo Finance API call
    response = requests.get(f"https://query1.finance.yahoo.com/v7/finance/quote?symbols={ticker}")
    return response.json()

# Option 2: Manual usage
limiter = get_yahoo_rate_limiter()

def fetch_historical_data(ticker: str, period: str):
    def _fetch():
        # Your API call here
        return requests.get(f"https://query1.finance.yahoo.com/v7/finance/download/{ticker}?period1=...")
    
    return limiter.get_cached_or_fetch(
        endpoint=f"historical_{ticker}",
        fetch_func=_fetch,
        use_cache=True
    )

# Check rate limiter stats
stats = limiter.get_stats()
print(f"API calls this hour: {stats['requests_last_hour']}/{stats['max_requests_per_hour']}")
print(f"Cache size: {stats['cache_size']}")
print(f"Throttle events: {stats['throttle_events']}")
```

**Rate Limiting Features:**
- Token bucket algorithm with 2000 req/hour limit
- Minimum 200ms delay between requests
- Automatic caching with 10-minute TTL
- Exponential backoff on 403/999 errors
- Request tracking and statistics

## See Also

- [Financials Module](./FINANCIALS_MODULE.md)
- [Import/Export Workflows](./IMPORT_EXPORT.md)
- [Report Templates](./REPORT_TEMPLATES.md)
- [Authentication Guide](./AUTHENTICATION.md)

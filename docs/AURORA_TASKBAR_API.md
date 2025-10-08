# Aurora Taskbar API Documentation

## Overview

This document describes the API endpoints implemented for the Aurora Terminal's top taskbar navigation system.

## Base URL

```
http://localhost:8000/api/v1
```

## Authentication

Currently, no authentication is required. In production, implement proper authentication and authorization.

---

## Search API

### `GET /search/multi`

Unified search across all entity types.

**Query Parameters:**
- `q` (required): Search query string
- `limit` (optional, default: 10): Maximum results per category (1-100)

**Response:**
```json
{
  "query": "oncology",
  "diseases": [
    {
      "id": 1,
      "name": "Breast Cancer",
      "category": "Cancer",
      "icd10_code": "C50",
      "prevalence": 234.5
    }
  ],
  "companies": [...],
  "therapeutics": [...],
  "catalysts": [...],
  "articles": [...],
  "trials": [...]
}
```

---

## News API

### `GET /news/latest`

Get latest news articles with sentiment analysis.

**Query Parameters:**
- `limit` (optional, default: 50): Number of articles (1-200)
- `source` (optional): Filter by news source
- `valid_only` (optional, default: true): Only return articles with validated links

**Response:**
```json
{
  "articles": [
    {
      "id": 1,
      "title": "FDA Approves New Cancer Treatment",
      "url": "https://example.com/article",
      "summary": "Article summary...",
      "source": "FierceBiotech",
      "published_at": "2025-01-15T10:00:00Z",
      "tags": ["oncology", "fda"],
      "link_valid": true,
      "sentiments": {
        "regulatory": {
          "score": 0.8,
          "rationale": "Positive regulatory developments"
        },
        "clinical": {
          "score": 0.6,
          "rationale": "Strong clinical data"
        },
        "mna": {
          "score": 0.2,
          "rationale": "No M&A activity mentioned"
        }
      },
      "ingested_at": "2025-01-15T11:00:00Z"
    }
  ],
  "count": 50,
  "filters": {
    "source": null,
    "valid_only": true
  }
}
```

### `GET /news/{article_id}`

Get detailed information for a specific article.

**Response:**
```json
{
  "id": 1,
  "title": "...",
  "url": "...",
  "summary": "...",
  "source": "...",
  "published_at": "...",
  "tags": [...],
  "link_valid": true,
  "hash": "...",
  "sentiments": {...},
  "related_diseases": [
    {
      "disease_id": 1,
      "relevance": 0.9
    }
  ],
  "related_companies": [...],
  "related_catalysts": [...]
}
```

### `GET /news/sources`

Get list of available news sources.

**Response:**
```json
{
  "sources": [
    {
      "name": "FierceBiotech",
      "count": 145
    },
    {
      "name": "ScienceDaily",
      "count": 89
    }
  ]
}
```

---

## Insights API

### `GET /insights/disease/{disease_id}`

Get comprehensive insights for a disease.

**Response:**
```json
{
  "disease": {
    "id": 1,
    "name": "Breast Cancer",
    "category": "Cancer",
    "icd10_code": "C50",
    "prevalence": 234.5,
    "incidence": 45.2,
    "mortality_rate": 12.3,
    "target_population": 2850000,
    "dalys": 1250000
  },
  "recent_articles": [
    {
      "id": 1,
      "title": "...",
      "url": "...",
      "source": "...",
      "published_at": "...",
      "sentiments": {
        "regulatory": 0.8,
        "clinical": 0.6,
        "mna": 0.2
      }
    }
  ],
  "upcoming_catalysts": [
    {
      "id": 1,
      "name": "Phase III Data Readout",
      "kind": "Clinical Data",
      "date": "2025-03-15T00:00:00Z",
      "company": "BioPharma Inc",
      "status": "Upcoming"
    }
  ],
  "competitive_landscape": [
    {
      "name": "Drug A",
      "modality": "Small Molecule",
      "phase": "Phase III",
      "metrics": {
        "safety": 85,
        "efficacy": 90,
        "regulatory": 75,
        "modality_fit": 80,
        "clinical_maturity": 75,
        "differentiation": 70
      }
    }
  ]
}
```

---

## Catalysts API

### `GET /catalysts/calendar`

Get catalyst calendar/agenda feeds.

**Query Parameters:**
- `from_date` (optional): Start date (ISO format)
- `to_date` (optional): End date (ISO format)
- `company` (optional): Filter by company name
- `kind` (optional): Filter by catalyst kind/type
- `status` (optional, default: "Upcoming"): Filter by status

**Response:**
```json
{
  "events": [
    {
      "id": 1,
      "name": "Phase II Data Readout",
      "title": "Phase II Data Readout",
      "company": "BioPharma Inc",
      "drug": "BPH-101",
      "kind": "Clinical Data",
      "date": "2025-02-15T00:00:00Z",
      "probability": 0.75,
      "impact": "High",
      "description": "...",
      "status": "Upcoming",
      "source_url": "https://example.com"
    }
  ],
  "count": 15,
  "months": {
    "2025-02": [/* events for Feb 2025 */],
    "2025-03": [/* events for Mar 2025 */]
  },
  "filters": {
    "from": "2025-01-01",
    "to": "2025-12-31",
    "company": null,
    "kind": null,
    "status": "Upcoming"
  }
}
```

### `GET /catalysts/past`

Get historical catalysts.

**Query Parameters:**
- `limit` (optional, default: 50): Number of catalysts (1-200)
- `company` (optional): Filter by company

**Response:**
```json
{
  "catalysts": [
    {
      "id": 1,
      "name": "FDA Approval",
      "company": "BioPharma Inc",
      "drug": "BPH-100",
      "kind": "FDA",
      "date": "2024-12-15T00:00:00Z",
      "impact": "High",
      "description": "...",
      "status": "Completed"
    }
  ],
  "count": 50
}
```

---

## Competition API

### `GET /competition/spiderweb`

Get competitive landscape spiderweb/radar chart data.

**Query Parameters:**
- `disease_id` (optional): Filter by disease
- `scope` (optional, default: "THERAPEUTIC"): "THERAPEUTIC" or "COMPANY"
- `limit` (optional, default: 6): Number of entities to compare (2-12)

**Response:**
```json
{
  "series": [
    {
      "name": "Drug A",
      "type": "therapeutic",
      "id": 1,
      "modality": "Small Molecule",
      "phase": "Phase III",
      "company_id": 1,
      "data": [85, 90, 75, 80, 75, 70],
      "metrics": {
        "safety": 85,
        "efficacy": 90,
        "regulatory": 75,
        "modality_fit": 80,
        "clinical_maturity": 75,
        "differentiation": 70
      }
    }
  ],
  "axes": [
    { "label": "Safety", "max": 100 },
    { "label": "Efficacy", "max": 100 },
    { "label": "Regulatory", "max": 100 },
    { "label": "Modality Fit", "max": 100 },
    { "label": "Clinical Maturity", "max": 100 },
    { "label": "Differentiation", "max": 100 }
  ],
  "scope": "THERAPEUTIC",
  "disease_id": 1
}
```

---

## Admin API

### `POST /admin/ingest`

Manual data ingestion endpoint. Performs on-demand data pulls.

**Request Body:**
```json
{
  "source": "news"
}
```

**Valid sources:** `news`, `trials`, `catalysts`, `all`

**Response:**
```json
{
  "source": "news",
  "started_at": "2025-01-15T12:00:00Z",
  "completed_at": "2025-01-15T12:05:30Z",
  "duration_seconds": 330,
  "records_processed": 150,
  "records_inserted": 142,
  "records_updated": 8,
  "errors": []
}
```

### `GET /admin/ingestion-history`

Get ingestion history logs.

**Query Parameters:**
- `limit` (optional, default: 20): Number of logs to return

**Response:**
```json
{
  "logs": [
    {
      "id": 1,
      "pipeline_name": "manual_ingest",
      "data_source": "news",
      "start_time": "2025-01-15T12:00:00Z",
      "end_time": "2025-01-15T12:05:30Z",
      "status": "success",
      "records_processed": 150,
      "records_inserted": 142,
      "records_updated": 8,
      "error_message": null
    }
  ]
}
```

---

## Sentiment Domains

All sentiment scores are in the range [-1.0, 1.0]:
- **1.0**: Highly positive
- **0.5**: Moderately positive
- **0.0**: Neutral
- **-0.5**: Moderately negative
- **-1.0**: Highly negative

**Domains:**
- `regulatory`: FDA approvals, regulatory actions, policy changes
- `clinical`: Clinical trial results, efficacy, safety data
- `mna`: Mergers, acquisitions, partnerships, collaborations

---

## Error Responses

All endpoints follow a standard error response format:

```json
{
  "detail": "Error message describing what went wrong",
  "status_code": 400
}
```

**Common Status Codes:**
- `400`: Bad Request - Invalid parameters
- `404`: Not Found - Resource doesn't exist
- `500`: Internal Server Error - Server-side error

---

## Rate Limiting

Currently no rate limiting is implemented. In production, implement appropriate rate limits per endpoint and user.

---

## Caching

- Read endpoints should implement ETags for client-side caching
- Short TTLs (5-15 minutes) recommended for frequently updated data
- News and catalysts should be cached aggressively

---

## Future Enhancements

1. WebSocket support for real-time updates
2. Pagination using cursor-based pagination
3. GraphQL API for flexible data fetching
4. Bulk operations for admin endpoints
5. Export endpoints (CSV, JSON, Excel)
6. Webhook notifications for new data

# Advanced Biotech API Integration Guide

## Overview

This document describes the integration of three powerful public biotech/pharmaceutical APIs into the terminal platform:

1. **OpenFDA API** - FDA drug data, approvals, adverse events, recalls
2. **ClinicalTrials.gov API** - Clinical trial registry and results database
3. **PubMed/NCBI E-utilities** - Scientific literature and research trends

These integrations provide institutional-grade pharmaceutical intelligence capabilities rivaling Bloomberg Terminal.

---

## Table of Contents

- [FDA Intelligence API](#fda-intelligence-api)
- [Clinical Trials Intelligence API](#clinical-trials-intelligence-api)
- [Research Intelligence API](#research-intelligence-api)
- [Rate Limiting & Best Practices](#rate-limiting--best-practices)
- [Example Use Cases](#example-use-cases)
- [Frontend Integration](#frontend-integration)

---

## FDA Intelligence API

Base URL: `http://localhost:8000/api/v1/fda`

### Endpoints

#### GET /fda/approvals

Get FDA drug approval data from the Drugs@FDA database.

**Query Parameters:**
- `limit` (integer, 1-1000): Maximum number of results (default: 100)
- `search` (string): Search query (e.g., "openfda.brand_name:Keytruda")
- `date_from` (string): Start date (YYYY-MM-DD format)
- `date_to` (string): End date (YYYY-MM-DD format)

**Example Request:**
```bash
curl "http://localhost:8000/api/v1/fda/approvals?limit=10&date_from=2023-01-01"
```

**Example Response:**
```json
{
  "data": [
    {
      "application_number": "BLA761034",
      "sponsor_name": "Pfizer Inc",
      "brand_name": "BRAFTOVI",
      "generic_name": "encorafenib",
      "dosage_form": "CAPSULE",
      "route": "ORAL",
      "approval_date": "2023-04-28",
      "indications": "Treatment of BRAF V600E mutant metastatic colorectal cancer",
      "manufacturer": "Pierre Fabre Medicament"
    }
  ],
  "count": 10,
  "total": 245,
  "source": "openfda",
  "timestamp": "2025-10-14T19:00:00Z"
}
```

---

#### GET /fda/adverse-events

Get FDA adverse event reports (FAERS - FDA Adverse Event Reporting System).

**Query Parameters:**
- `limit` (integer, 1-1000): Maximum number of results
- `drug_name` (string): Filter by drug brand name
- `reaction` (string): Filter by adverse reaction/symptom
- `serious` (boolean): Filter for serious events only
- `date_from` (string): Start date (YYYYMMDD format)
- `date_to` (string): End date (YYYYMMDD format)

**Example Request:**
```bash
curl "http://localhost:8000/api/v1/fda/adverse-events?drug_name=Keytruda&serious=true&limit=5"
```

**Example Response:**
```json
{
  "data": [
    {
      "safety_report_id": "17234567",
      "receive_date": "20231015",
      "serious": true,
      "serious_reasons": {
        "death": false,
        "life_threatening": true,
        "hospitalization": true,
        "disability": false
      },
      "patient_age": "65",
      "patient_sex": "2",
      "reactions": ["Pneumonitis", "Dyspnoea"],
      "drugs": [
        {
          "name": "PEMBROLIZUMAB",
          "role": "1",
          "brand_names": ["KEYTRUDA"],
          "generic_names": ["PEMBROLIZUMAB"]
        }
      ]
    }
  ],
  "count": 5,
  "total": 12847,
  "source": "openfda"
}
```

---

#### GET /fda/adverse-events/counts

Get aggregated adverse event counts by drug (useful for safety signal detection).

**Example Request:**
```bash
curl "http://localhost:8000/api/v1/fda/adverse-events/counts?limit=20"
```

**Example Response:**
```json
{
  "data": [
    {"drug_name": "KEYTRUDA", "event_count": 12847},
    {"drug_name": "OPDIVO", "event_count": 9234},
    {"drug_name": "HUMIRA", "event_count": 8756}
  ],
  "count": 20,
  "source": "openfda"
}
```

---

#### GET /fda/recalls

Get FDA drug recall data with classification.

**Classifications:**
- **Class I**: Dangerous products that could cause serious health problems or death
- **Class II**: Products that might cause temporary or medically reversible health problems
- **Class III**: Products unlikely to cause adverse health reactions

**Query Parameters:**
- `limit` (integer): Maximum results
- `classification` (string): "Class I", "Class II", or "Class III"
- `status` (string): "Ongoing", "Completed", or "Terminated"
- `date_from`, `date_to` (string): Date range (YYYY-MM-DD)

**Example Request:**
```bash
curl "http://localhost:8000/api/v1/fda/recalls?classification=Class%20I&status=Ongoing"
```

---

#### GET /fda/labels

Get FDA drug label data (package inserts, prescribing information).

**Query Parameters:**
- `brand_name` (string): Drug brand name
- `generic_name` (string): Drug generic name
- `limit` (integer): Maximum results

**Example Request:**
```bash
curl "http://localhost:8000/api/v1/fda/labels?brand_name=Keytruda"
```

---

#### GET /fda/dashboard

Get comprehensive FDA intelligence dashboard data (optimized for visualization).

Returns recent approvals, top adverse events, and active recalls in one call.

**Example Response:**
```json
{
  "recent_approvals": [...],
  "approvals_count": 15,
  "top_adverse_events": [...],
  "active_recalls": [...],
  "recalls_count": 8,
  "timestamp": "2025-10-14T19:00:00Z"
}
```

---

#### GET /fda/safety-signals

Detect potential safety signals based on adverse event trends.

**Query Parameters:**
- `limit` (integer, 1-50): Number of drugs to analyze
- `days` (integer, 7-365): Days to look back

**Example Response:**
```json
{
  "data": [
    {
      "drug_name": "DRUG_X",
      "event_count": 1523,
      "above_average": true,
      "signal_strength": "high"
    }
  ],
  "period_days": 30,
  "analysis_date": "2025-10-14T19:00:00Z"
}
```

---

## Clinical Trials Intelligence API

Base URL: `http://localhost:8000/api/v1/trials`

### Endpoints

#### GET /trials/search

Search clinical trials with advanced filters.

**Query Parameters:**
- `query` (string): General search query
- `condition` (string): Condition/disease (e.g., "Breast Cancer")
- `intervention` (string): Intervention/treatment (e.g., "Pembrolizumab")
- `sponsor` (string): Sponsor organization
- `phase` (string): EARLY_PHASE1, PHASE1, PHASE2, PHASE3, PHASE4
- `status` (string): RECRUITING, ACTIVE_NOT_RECRUITING, COMPLETED, etc.
- `country` (string): Country code (default: "US")
- `limit` (integer, 1-1000): Maximum results
- `page` (integer): Page number

**Example Request:**
```bash
curl "http://localhost:8000/api/v1/trials/search?condition=Breast%20Cancer&phase=PHASE3&status=RECRUITING"
```

**Example Response:**
```json
{
  "data": [
    {
      "nct_id": "NCT05014152",
      "title": "Study of Drug X in HER2+ Metastatic Breast Cancer",
      "overall_status": "RECRUITING",
      "start_date": "2023-06-15",
      "completion_date": "2026-12-31",
      "phases": ["PHASE3"],
      "enrollment": 450,
      "lead_sponsor": "Big Pharma Inc",
      "conditions": ["Breast Cancer", "HER2-Positive"],
      "interventions": [
        {
          "type": "DRUG",
          "name": "Drug X",
          "description": "Novel HER2-targeted therapy"
        }
      ]
    }
  ],
  "count": 1,
  "total": 87,
  "page": 1,
  "source": "clinicaltrials.gov"
}
```

---

#### GET /trials/recruiting

Get currently recruiting clinical trials (useful for enrollment opportunities).

**Example Request:**
```bash
curl "http://localhost:8000/api/v1/trials/recruiting?condition=Lung%20Cancer&phase=PHASE3"
```

---

#### GET /trials/details/{nct_id}

Get comprehensive details for a specific clinical trial.

**Example Request:**
```bash
curl "http://localhost:8000/api/v1/trials/details/NCT04280705"
```

**Returns:**
- Full trial description and rationale
- Study arms and interventions
- Primary and secondary outcomes
- Eligibility criteria
- Study locations
- Published references
- Results (if available)

---

#### GET /trials/statistics

Get aggregated statistics about clinical trials.

**Query Parameters:**
- `group_by` (string): "phase", "status", "sponsor"
- `condition` (string): Filter by condition
- `sponsor` (string): Filter by sponsor

**Example Request:**
```bash
curl "http://localhost:8000/api/v1/trials/statistics?group_by=phase&condition=Cancer"
```

---

#### GET /trials/dashboard

Comprehensive clinical trials dashboard (optimized for visualization).

**Example Response:**
```json
{
  "recruiting_trials": [...],
  "recruiting_count": 152,
  "phase_distribution": [
    {"category": "PHASE1", "count": 45},
    {"category": "PHASE2", "count": 78},
    {"category": "PHASE3", "count": 29}
  ],
  "status_distribution": [...],
  "total_trials": 245,
  "source": "clinicaltrials.gov"
}
```

---

#### GET /trials/competitive-landscape

Analyze competitive clinical trial activity for a specific condition.

**Example Request:**
```bash
curl "http://localhost:8000/api/v1/trials/competitive-landscape?condition=Multiple%20Myeloma&phase=PHASE3"
```

**Returns:**
- Trial distribution by sponsor
- Phase distribution
- Sample trials
- Competitive dynamics

---

#### GET /trials/enrollment-tracker

Track trial enrollment status and projections.

**Example Request:**
```bash
curl "http://localhost:8000/api/v1/trials/enrollment-tracker?sponsor=Pfizer"
```

---

## Research Intelligence API

Base URL: `http://localhost:8000/api/v1/research`

### Endpoints

#### GET /research/search

Search PubMed scientific publications.

**Query Parameters:**
- `query` (string, required): Search query (supports PubMed syntax)
- `limit` (integer, 1-500): Maximum results
- `sort` (string): "relevance", "pub_date", "author", "journal"
- `date_from` (string): Start date (YYYY/MM/DD)
- `date_to` (string): End date (YYYY/MM/DD)

**Query Syntax Examples:**
- Boolean: `CAR-T therapy AND cancer`
- Exact phrase: `"immune checkpoint inhibitor"`
- Field-specific: `pembrolizumab[Title]`

**Example Request:**
```bash
curl "http://localhost:8000/api/v1/research/search?query=CAR-T%20therapy&limit=10&sort=pub_date"
```

**Example Response:**
```json
{
  "data": [
    {
      "pmid": "36543321",
      "title": "CAR-T cell therapy in multiple myeloma: current status and future directions",
      "abstract": "Chimeric antigen receptor T-cell (CAR-T) therapy...",
      "authors": ["John Smith", "Jane Doe"],
      "journal": "Nature Reviews Clinical Oncology",
      "publication_date": "2023-11-15",
      "mesh_terms": ["CAR-T Cells", "Multiple Myeloma", "Immunotherapy"],
      "doi": "10.1038/s41571-023-00825-3",
      "pubmed_url": "https://pubmed.ncbi.nlm.nih.gov/36543321/"
    }
  ],
  "count": 10,
  "total": 2847,
  "query": "CAR-T therapy",
  "source": "pubmed"
}
```

---

#### GET /research/publication/{pmid}

Get detailed information for a specific publication.

**Example Request:**
```bash
curl "http://localhost:8000/api/v1/research/publication/36543321"
```

---

#### GET /research/trends

Analyze publication trends over time.

**Query Parameters:**
- `query` (string, required): Search query to analyze
- `years` (integer, 1-30): Number of years to analyze

**Example Request:**
```bash
curl "http://localhost:8000/api/v1/research/trends?query=mRNA%20vaccine&years=10"
```

**Example Response:**
```json
{
  "data": [
    {"year": 2015, "count": 123},
    {"year": 2016, "count": 145},
    {"year": 2017, "count": 178},
    {"year": 2018, "count": 234},
    {"year": 2019, "count": 298},
    {"year": 2020, "count": 1456},
    {"year": 2021, "count": 2847},
    {"year": 2022, "count": 3124},
    {"year": 2023, "count": 2956},
    {"year": 2024, "count": 2678}
  ],
  "query": "mRNA vaccine",
  "years_analyzed": 10,
  "source": "pubmed"
}
```

---

#### GET /research/drug/{drug_name}

Search publications about a specific drug.

**Example Request:**
```bash
curl "http://localhost:8000/api/v1/research/drug/Keytruda"
```

---

#### GET /research/disease/{disease}

Search publications about a specific disease.

**Example Request:**
```bash
curl "http://localhost:8000/api/v1/research/disease/Multiple%20Myeloma"
```

---

#### GET /research/dashboard

Comprehensive research intelligence dashboard.

**Returns:**
- Publication trends for key research areas
- Recent publications
- Research velocity metrics

---

#### GET /research/hot-topics

Identify hot research topics with accelerating publication velocity.

**Query Parameters:**
- `therapeutic_area` (string, required): Therapeutic area to analyze
- `years` (integer, 2-10): Years to analyze

**Example Request:**
```bash
curl "http://localhost:8000/api/v1/research/hot-topics?therapeutic_area=Oncology&years=5"
```

**Example Response:**
```json
{
  "hot_topics": [
    {
      "topic": "Oncology AND biomarker",
      "growth_rate": 145.2,
      "recent_publications": 3456,
      "total_publications": 12847,
      "is_accelerating": true,
      "trends": [...]
    }
  ],
  "therapeutic_area": "Oncology",
  "analysis_period_years": 5
}
```

---

#### GET /research/competitive-research

Compare research publication activity across companies.

**Query Parameters:**
- `company` (string, required): Company name
- `competitors` (string, required): Comma-separated competitor names
- `years` (integer, 1-10): Years to analyze

**Example Request:**
```bash
curl "http://localhost:8000/api/v1/research/competitive-research?company=Pfizer&competitors=Moderna,BioNTech&years=5"
```

---

## Rate Limiting & Best Practices

### OpenFDA API
- **Rate Limit**: 240 requests per minute (4 per second), 120,000 per day
- **Implementation**: 250ms delay between requests
- **Best Practice**: Use specific searches to reduce result size
- **Cache**: Results cached for 1 hour

### ClinicalTrials.gov API
- **Rate Limit**: No official limit, but be respectful
- **Implementation**: 100ms delay between requests
- **Best Practice**: Use pagination for large result sets
- **Cache**: Results cached for 1 hour

### PubMed/NCBI E-utilities
- **Rate Limit**:
  - With API key: 10 requests per second
  - Without API key: 3 requests per second
- **Implementation**: Configurable delay based on API key
- **Best Practice**: Provide email in requests, use API key for production
- **Cache**: Results cached for 1 hour

### General Recommendations

1. **Use Caching**: All providers implement caching to reduce API calls
2. **Batch Requests**: Use dashboard endpoints for multiple data points
3. **Filter Aggressively**: Use date ranges and filters to reduce result sizes
4. **Monitor Usage**: Track API call patterns in production
5. **Error Handling**: All endpoints handle rate limit errors gracefully

---

## Example Use Cases

### Use Case 1: Drug Safety Monitoring

Monitor adverse events for a portfolio of drugs:

```bash
# Get adverse event counts for recent period
curl "http://localhost:8000/api/v1/fda/adverse-events/counts?limit=50&date_from=20240101"

# Detect safety signals
curl "http://localhost:8000/api/v1/fda/safety-signals?limit=20&days=30"

# Get detailed events for specific drug
curl "http://localhost:8000/api/v1/fda/adverse-events?drug_name=Keytruda&serious=true&limit=100"
```

### Use Case 2: Competitive Landscape Analysis

Analyze competitive position in a therapeutic area:

```bash
# Get competitive trial landscape
curl "http://localhost:8000/api/v1/trials/competitive-landscape?condition=Multiple%20Myeloma"

# Track recruitment competition
curl "http://localhost:8000/api/v1/trials/enrollment-tracker?condition=Multiple%20Myeloma"

# Analyze research activity
curl "http://localhost:8000/api/v1/research/hot-topics?therapeutic_area=Multiple%20Myeloma&years=5"
```

### Use Case 3: Drug Development Intelligence

Track a specific drug through development:

```bash
# Get clinical trials for drug
curl "http://localhost:8000/api/v1/trials/search?intervention=Drug%20X"

# Get published research
curl "http://localhost:8000/api/v1/research/drug/Drug%20X"

# Monitor adverse events
curl "http://localhost:8000/api/v1/fda/adverse-events?drug_name=Drug%20X"

# Check for recalls
curl "http://localhost:8000/api/v1/fda/recalls" | jq '.data[] | select(.product_description | contains("Drug X"))'
```

---

## Frontend Integration

### API Client Configuration

The terminal's API client is configured in `terminal/src/config/api.ts`:

```typescript
export const API_ENDPOINTS = {
  // FDA Intelligence
  FDA: {
    APPROVALS: `${API_BASE_URL}/fda/approvals`,
    ADVERSE_EVENTS: `${API_BASE_URL}/fda/adverse-events`,
    ADVERSE_COUNTS: `${API_BASE_URL}/fda/adverse-events/counts`,
    RECALLS: `${API_BASE_URL}/fda/recalls`,
    LABELS: `${API_BASE_URL}/fda/labels`,
    DASHBOARD: `${API_BASE_URL}/fda/dashboard`,
    SAFETY_SIGNALS: `${API_BASE_URL}/fda/safety-signals`,
  },

  // Clinical Trials
  TRIALS: {
    SEARCH: `${API_BASE_URL}/trials/search`,
    RECRUITING: `${API_BASE_URL}/trials/recruiting`,
    DETAILS: (nctId: string) => `${API_BASE_URL}/trials/details/${nctId}`,
    STATISTICS: `${API_BASE_URL}/trials/statistics`,
    DASHBOARD: `${API_BASE_URL}/trials/dashboard`,
    COMPETITIVE: `${API_BASE_URL}/trials/competitive-landscape`,
    ENROLLMENT: `${API_BASE_URL}/trials/enrollment-tracker`,
  },

  // Research Intelligence
  RESEARCH: {
    SEARCH: `${API_BASE_URL}/research/search`,
    PUBLICATION: (pmid: string) => `${API_BASE_URL}/research/publication/${pmid}`,
    TRENDS: `${API_BASE_URL}/research/trends`,
    DRUG: (drugName: string) => `${API_BASE_URL}/research/drug/${drugName}`,
    DISEASE: (disease: string) => `${API_BASE_URL}/research/disease/${disease}`,
    DASHBOARD: `${API_BASE_URL}/research/dashboard`,
    HOT_TOPICS: `${API_BASE_URL}/research/hot-topics`,
    COMPETITIVE: `${API_BASE_URL}/research/competitive-research`,
  },
};
```

### Usage Example with React Query

```typescript
import { useQuery } from '@tanstack/react-query';
import { API_ENDPOINTS, apiFetch } from '@/config/api';

// Fetch FDA dashboard data
const { data, isLoading } = useQuery({
  queryKey: ['fda-dashboard'],
  queryFn: () => apiFetch(API_ENDPOINTS.FDA.DASHBOARD),
  staleTime: 5 * 60 * 1000, // 5 minutes
});

// Search clinical trials
const { data: trials } = useQuery({
  queryKey: ['trials', { condition: 'Cancer', phase: 'PHASE3' }],
  queryFn: () => apiFetch(
    `${API_ENDPOINTS.TRIALS.SEARCH}?condition=Cancer&phase=PHASE3`
  ),
});

// Analyze publication trends
const { data: trends } = useQuery({
  queryKey: ['research-trends', 'CAR-T therapy'],
  queryFn: () => apiFetch(
    `${API_ENDPOINTS.RESEARCH.TRENDS}?query=CAR-T%20therapy&years=10`
  ),
});
```

---

## Terminal App Modules

The following app modules are available in the terminal launchpad:

### FDA/Regulatory Intelligence
- **FDA Intelligence** (`/fda`) - Main FDA dashboard
- **FDA Approvals** (`/fda/approvals`) - Approval tracking
- **Drug Safety Monitor** (`/fda/safety`) - Adverse events
- **Recalls Tracker** (`/fda/recalls`) - Drug recalls
- **Regulatory Timeline** (`/fda/timeline`) - PDUFA dates

### Clinical Trials
- **Trials Monitor** (`/trials/monitor`) - Real-time trial intelligence
- **Competitive Landscape** (`/trials/competitive`) - Competitive analysis
- **Enrollment Tracker** (`/trials/enrollment`) - Recruitment tracking

### Research Intelligence
- **Research Intelligence** (`/research`) - Main research dashboard
- **Research Trends** (`/research/trends`) - Publication velocity

---

## Future Enhancements

Potential additions to enhance these integrations:

1. **DrugBank API**: Comprehensive drug database integration
2. **ChEMBL API**: Bioactivity data from EBI
3. **Patents**: USPTO/EPO patent data integration
4. **SEC Filings**: Public company financial disclosures
5. **Conference Abstracts**: ASCO, ASH, ESMO abstracts
6. **KOL Tracking**: Thought leader publication monitoring
7. **Real-time Alerts**: WebSocket-based event notifications
8. **Advanced Analytics**: ML-based signal detection

---

## Support & Troubleshooting

### Common Issues

**Rate Limit Errors:**
- Reduce request frequency
- Use dashboard endpoints instead of individual calls
- Implement client-side caching

**Empty Results:**
- Check query syntax (especially for PubMed)
- Verify date formats
- Try broader search terms

**Timeout Errors:**
- Reduce result limits
- Use more specific filters
- Check network connectivity

### Getting Help

- Check API documentation:
  - [OpenFDA](https://open.fda.gov/apis/)
  - [ClinicalTrials.gov](https://clinicaltrials.gov/api/v2)
  - [PubMed E-utilities](https://www.ncbi.nlm.nih.gov/books/NBK25501/)

---

**Last Updated**: October 14, 2025
**Version**: 1.0.0

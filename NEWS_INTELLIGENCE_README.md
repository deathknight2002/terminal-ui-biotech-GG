# News Intelligence & Predictive Analytics System

## Overview

The News Intelligence & Predictive Analytics System provides comprehensive memory, trend analysis, and prediction capabilities for biotech news events. It automatically archives news from multiple sources, tracks patterns over time, and predicts upcoming market-moving events.

## Features

### 1. Historical Event Memory
- Maintains archive of up to 10,000 news events
- Captures detailed clinical trial data (endpoints, safety metrics)
- Stores M&A deal structures (upfront, earnouts, synergies)
- Tracks market impact and analyst reactions

### 2. Trend Analysis
- Analyzes event patterns by category and therapeutic area
- Calculates momentum (increasing/stable/decreasing trends)
- Identifies top companies in each category
- Provides average importance scoring

### 3. Predictive Analytics
- Pattern recognition based on historical data
- Probability scoring with confidence intervals
- Expected timeframes for predicted events
- Reasoning explanations based on historical patterns
- Similar event identification

## API Endpoints

### Get Archived Events
```bash
GET /api/news-intelligence/archive

# Query parameters:
# - limit: number (optional) - max events to return
# - category: string (optional) - filter by category
# - company: string (optional) - filter by company name/ticker
# - therapeuticArea: string (optional) - filter by therapeutic area
# - startDate: ISO date (optional) - start of date range
# - endDate: ISO date (optional) - end of date range

# Example:
curl http://localhost:3001/api/news-intelligence/archive?company=Tectonic&limit=10
```

Response:
```json
{
  "success": true,
  "count": 1,
  "events": [
    {
      "id": "tecx-tx45-phase1b-2025-10-29",
      "title": "Tectonic Therapeutic Announces Positive Phase 1b Part B Data...",
      "category": "Trial Results",
      "importance": "High",
      "clinicalData": {
        "phase": "Phase 1b Part B",
        "endpoints": [
          {
            "name": "PCWP",
            "percentChange": -29.2,
            "unit": "mmHg"
          }
        ]
      }
    }
  ]
}
```

### Get Archive Statistics
```bash
GET /api/news-intelligence/stats

curl http://localhost:3001/api/news-intelligence/stats
```

Response:
```json
{
  "success": true,
  "stats": {
    "totalEvents": 6,
    "eventsByCategory": {
      "Trial Results": 3,
      "M&A": 2,
      "FDA Approval": 1
    },
    "eventsByImportance": {
      "Critical": 2,
      "High": 3,
      "Medium": 1
    },
    "dateRange": {
      "oldest": "2025-08-20T09:00:00Z",
      "newest": "2025-10-29T16:01:00Z"
    }
  }
}
```

### Analyze Trends
```bash
GET /api/news-intelligence/trends/:category

# Query parameters:
# - therapeuticArea: string (optional)
# - timeframe: 'week' | 'month' | 'quarter' | 'year' (default: 'month')

# Example:
curl http://localhost:3001/api/news-intelligence/trends/Trial%20Results?therapeuticArea=Cardiovascular&timeframe=month
```

Response:
```json
{
  "success": true,
  "trend": {
    "category": "Trial Results",
    "therapeuticArea": "Cardiovascular",
    "timeframe": "month",
    "eventCount": 3,
    "averageImportance": 2.67,
    "topCompanies": [
      { "name": "Tectonic Therapeutic Inc", "count": 1 },
      { "name": "Historical Company C", "count": 1 }
    ],
    "momentum": "increasing"
  }
}
```

### Get Predictions
```bash
GET /api/news-intelligence/predictions

# Query parameters:
# - lookbackDays: number (default: 90) - days of history to analyze
# - predictionHorizon: string (default: '30 days')

# Example:
curl http://localhost:3001/api/news-intelligence/predictions?lookbackDays=90
```

Response:
```json
{
  "success": true,
  "count": 5,
  "predictions": [
    {
      "id": "pred-1730312400000-abc123",
      "predicted_event_type": "Trial Results",
      "predicted_therapeutic_area": "Cardiovascular",
      "probability": 75.5,
      "confidence_interval": [60.5, 90.5],
      "expected_timeframe": "7-30 days",
      "reasoning": [
        "Strong recent momentum in Trial Results events (3 events in last 90 days)",
        "Historical average of 15 days between events",
        "Primary therapeutic area: Cardiovascular",
        "Last Trial Results event was 2 days ago"
      ],
      "similar_historical_events": [
        "tecx-tx45-phase1b-2025-10-29",
        "historical-cardio-trial-2"
      ],
      "generated_at": "2025-10-30T17:00:00Z"
    }
  ],
  "generated_at": "2025-10-30T17:00:00Z"
}
```

### Get Company Events
```bash
GET /api/news-intelligence/company/:company

# Query parameters:
# - startDate: ISO date (optional)
# - endDate: ISO date (optional)

# Example:
curl http://localhost:3001/api/news-intelligence/company/TECX
```

### Archive New Event
```bash
POST /api/news-intelligence/archive
Content-Type: application/json

{
  "title": "New Clinical Trial Results",
  "summary": "Positive Phase II data...",
  "category": "Trial Results",
  "importance": "High",
  "therapeuticAreas": ["Oncology"],
  "companies": ["Example Pharma"],
  "tickers": ["EXPL"],
  "clinicalData": {
    "phase": "Phase II",
    "endpoints": [
      {
        "name": "ORR",
        "percentChange": 45.2,
        "unit": "%"
      }
    ]
  }
}
```

### Seed Archive
```bash
POST /api/news-intelligence/seed

curl -X POST http://localhost:3001/api/news-intelligence/seed
```

This seeds the archive with:
- Tectonic Therapeutic (TECX) TX45 Phase 1b results
- Thermo Fisher (TMO) Clario acquisition
- Historical context events

## Seeded News Events

### 1. Tectonic Therapeutic (NASDAQ: TECX) - TX45 Phase 1b Results
- **Date:** October 29, 2025
- **Category:** Trial Results
- **Importance:** High
- **Details:**
  - Phase 1b Part B trial in Group 2 PH with HFrEF
  - 14 patients, single IV dose
  - Key endpoints:
    - PCWP: -29.2%
    - TPR: -29.2%
    - mPAP: -19.3%
    - CO: +17.3%
    - LVEF: +19.4% (day 29)
    - RVFAC: +20.3%
    - TAPSE/SPAP: +36.3%
  - Safety: Well-tolerated, no serious AEs
  - Market impact: Stock +18%

### 2. Thermo Fisher Scientific (NASDAQ: TMO) - Clario Acquisition
- **Date:** October 29, 2025
- **Category:** M&A
- **Importance:** Critical
- **Details:**
  - Acquires Clario Holdings for up to $9.4B
  - Structure:
    - $8.88B upfront (cash)
    - $125M payable January 2027
    - Up to $400M earnouts (2026-27 performance)
  - Synergies: $175M operating income by year 5
  - Accretion: $0.45/share year 1
  - Closing: Mid-2026
  - Strategic: Strengthens clinical trial data/endpoints space

## Data Models

### ArchivedNewsEvent
```typescript
interface ArchivedNewsEvent {
  id: string;
  title: string;
  summary: string;
  publishedDate: string;
  source: string;
  category: NewsCategory;
  importance: NewsImportance;
  therapeuticAreas: TherapeuticArea[];
  companies: string[];
  tickers: string[];
  keywords: string[];
  relevanceScore: number;
  
  // Clinical trial data
  clinicalData?: {
    phase?: string;
    indication?: string;
    endpoints?: {
      name: string;
      percentChange?: number;
      unit?: string;
    }[];
    safetyData?: {
      adverseEvents?: string[];
      seriousAdverseEvents?: string[];
      discontinuations?: number;
    };
    patientCount?: number;
  };
  
  // M&A deal data
  dealData?: {
    type: 'acquisition' | 'merger' | 'partnership' | 'licensing';
    acquirer?: string;
    target?: string;
    upfrontValue?: number;
    totalValue?: number;
    earnoutValue?: number;
    synergies?: number;
    closingDate?: string;
  };
  
  // Market impact
  marketImpact?: {
    priceChange?: number;
    volumeChange?: number;
    analystReactions?: string[];
  };
  
  archived_at: string;
}
```

### TrendAnalysis
```typescript
interface TrendAnalysis {
  category: NewsCategory;
  therapeuticArea?: TherapeuticArea;
  timeframe: 'week' | 'month' | 'quarter' | 'year';
  eventCount: number;
  averageImportance: number;
  topCompanies: { name: string; count: number }[];
  momentum: 'increasing' | 'stable' | 'decreasing';
}
```

### EventPrediction
```typescript
interface EventPrediction {
  id: string;
  predicted_event_type: NewsCategory;
  predicted_company?: string;
  predicted_therapeutic_area?: TherapeuticArea;
  probability: number;
  confidence_interval: [number, number];
  expected_timeframe: string;
  reasoning: string[];
  similar_historical_events: string[];
  generated_at: string;
}
```

## Integration with Existing Services

The News Archive integrates automatically with the existing news monitoring service:

1. **News Monitor** (`backend/src/services/news-monitor.ts`)
   - Scrapes news from Fierce Biotech, BioSpace, Endpoints, Science Daily
   - Every new article is automatically archived
   - Enriched with intelligence scoring

2. **News Intelligence** (`backend/src/services/news-intelligence.ts`)
   - Scores and categorizes articles
   - Detects keywords and therapeutic areas
   - Assigns importance levels

3. **News Archive** (`backend/src/services/news-archive.ts`)
   - Stores historical events
   - Provides trend analysis
   - Generates predictions

## Usage Examples

### Get Recent Trial Results in Cardiovascular
```javascript
const response = await fetch(
  'http://localhost:3001/api/news-intelligence/archive?category=Trial%20Results&therapeuticArea=Cardiovascular'
);
const data = await response.json();
console.log(`Found ${data.count} trial results in cardiovascular`);
```

### Analyze M&A Trends
```javascript
const response = await fetch(
  'http://localhost:3001/api/news-intelligence/trends/M%26A?timeframe=quarter'
);
const data = await response.json();
console.log(`M&A momentum: ${data.trend.momentum}`);
console.log(`${data.trend.eventCount} M&A events in last quarter`);
```

### Get Predictions for Next 30 Days
```javascript
const response = await fetch(
  'http://localhost:3001/api/news-intelligence/predictions'
);
const data = await response.json();

data.predictions.forEach(pred => {
  console.log(`Predicted: ${pred.predicted_event_type}`);
  console.log(`Probability: ${pred.probability}%`);
  console.log(`Reasoning: ${pred.reasoning.join(', ')}`);
});
```

### Track Company Over Time
```javascript
const startDate = new Date('2025-09-01').toISOString();
const endDate = new Date('2025-10-31').toISOString();

const response = await fetch(
  `http://localhost:3001/api/news-intelligence/company/Tectonic?startDate=${startDate}&endDate=${endDate}`
);
const data = await response.json();

console.log(`${data.count} events for ${data.company}`);
data.events.forEach(event => {
  console.log(`- ${event.title} (${event.category})`);
});
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   News Scrapers                         │
│  (Fierce Biotech, BioSpace, Endpoints, Science Daily)  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              News Monitoring Service                    │
│          (news-monitor.ts)                              │
│  - Schedules scraping                                   │
│  - Detects keyword matches                              │
│  - Emits alerts                                         │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│           News Intelligence Service                     │
│         (news-intelligence.ts)                          │
│  - Scores relevance                                     │
│  - Categorizes events                                   │
│  - Detects therapeutic areas                            │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              News Archive Service                       │
│            (news-archive.ts)                            │
│  - Stores historical events                             │
│  - Trend analysis                                       │
│  - Predictive analytics                                 │
│  - Pattern recognition                                  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                REST API Endpoints                       │
│          (routes/news-intelligence.ts)                  │
│  - Archive queries                                      │
│  - Trend analysis                                       │
│  - Predictions                                          │
└─────────────────────────────────────────────────────────┘
```

## Performance

- Archive size limit: 10,000 events (configurable)
- LRU cache for seen articles: 5,000 entries (7 day TTL)
- Alert buffer: 500 most recent alerts
- Trend calculation: O(n) where n = events in timeframe
- Prediction generation: O(n*m) where n = events, m = categories

## Future Enhancements

1. **Semantic Search**: Add embedding support for similarity search
2. **Real-time WebSocket**: Push predictions to connected clients
3. **Advanced ML Models**: Integrate with Python ML pipeline
4. **Company Graph**: Build relationship networks
5. **Sentiment Analysis**: Track market sentiment over time
6. **Alert Tuning**: ML-based alert threshold optimization
7. **Visualization**: Frontend dashboard for trends and predictions
8. **Export**: CSV/PDF report generation
9. **Persistence**: Database backend for long-term storage
10. **API Keys**: Rate limiting and authentication

## Testing

Run the test suite:
```bash
cd backend
npm test src/services/__tests__/news-archive.test.ts
```

Tests cover:
- Event archival
- Category/therapeutic area/company queries
- Trend analysis
- Predictions
- Clinical trial data handling
- M&A deal data handling
- Statistics

## Troubleshooting

### Archive not seeding on startup
Check logs for seed errors. Manually trigger:
```bash
curl -X POST http://localhost:3001/api/news-intelligence/seed
```

### No predictions generated
Ensure sufficient historical data (at least 5-10 events in each category). Check:
```bash
curl http://localhost:3001/api/news-intelligence/stats
```

### Events not being archived automatically
Verify news monitoring is running. Check backend logs for:
```
📰 News monitoring started
📥 Archived event: [event-id]
```

## Contact & Support

For questions or issues, please refer to the main project documentation or open an issue on GitHub.

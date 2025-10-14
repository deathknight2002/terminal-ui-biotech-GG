# API Configuration Guide

This guide explains how the frontend terminal app connects to the Python FastAPI backend.

## Architecture Overview

The biotech terminal platform uses a **Python FastAPI backend** (`bt_platform`) running on port 8000 by default. All frontend pages should use the centralized API configuration to maintain consistency.

## Configuration

### Environment Variables

Create a `.env` file in the `terminal/` directory (copy from `.env.example`):

```bash
# Python FastAPI backend URL
VITE_API_URL=http://localhost:8000
```

### Centralized API Configuration

All API endpoints are defined in `terminal/src/config/api.ts`. This provides:

1. **Single source of truth** for API URLs
2. **Type-safe endpoint definitions**
3. **Easy environment switching** (dev/staging/prod)
4. **Consistent error handling**

## Usage in Components

### Basic Usage

```typescript
import { API_ENDPOINTS, apiFetch } from '../config/api';

// Fetch data from an endpoint
const data = await apiFetch(API_ENDPOINTS.BIOTECH.DASHBOARD);
```

### With Query Parameters

```typescript
// Using template strings for parameters
const url = `${API_ENDPOINTS.NEWS.LATEST}?limit=20`;
const data = await apiFetch(url);

// Or build with URLSearchParams
const params = new URLSearchParams({
  limit: '20',
  days: '90'
});
const url = `${API_ENDPOINTS.COMPANIES.ARTICLES(ticker)}?${params}`;
```

### Error Handling

```typescript
try {
  const data = await apiFetch(API_ENDPOINTS.BIOTECH.PIPELINE);
  setData(data);
} catch (error) {
  console.error('Failed to fetch pipeline:', error);
  setError('Backend connection failed');
}
```

### With React Query

```typescript
import { useQuery } from '@tanstack/react-query';
import { API_ENDPOINTS, apiFetch } from '../config/api';

export function MyComponent() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['my-data'],
    queryFn: () => apiFetch(API_ENDPOINTS.BIOTECH.DASHBOARD),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>{/* Render data */}</div>;
}
```

## Available Endpoints

### Biotech Intelligence

- `API_ENDPOINTS.BIOTECH.DASHBOARD` - Main biotech dashboard data
- `API_ENDPOINTS.BIOTECH.PIPELINE` - Drug pipeline data
- `API_ENDPOINTS.BIOTECH.TRIALS` - Clinical trials data
- `API_ENDPOINTS.BIOTECH.FINANCIAL_MODELS` - Financial modeling data

### Catalysts

- `API_ENDPOINTS.CATALYSTS.CALENDAR` - Catalyst calendar events
- `API_ENDPOINTS.CATALYSTS.LIST` - All catalysts with filtering
- `API_ENDPOINTS.CATALYSTS.DETAIL(id)` - Single catalyst details

### Companies

- `API_ENDPOINTS.COMPANIES.PROFILE(ticker)` - Company profile
- `API_ENDPOINTS.COMPANIES.SOURCES(ticker)` - Company sources (SEC filings, etc.)
- `API_ENDPOINTS.COMPANIES.ARTICLES(ticker)` - News articles
- `API_ENDPOINTS.COMPANIES.OWNERSHIP(ticker)` - Institutional ownership
- `API_ENDPOINTS.COMPANIES.PIPELINE(ticker)` - Company pipeline programs
- `API_ENDPOINTS.COMPANIES.CATALYSTS(ticker)` - Company-specific catalysts
- `API_ENDPOINTS.COMPANIES.XBI_LIST` - XBI constituent companies

### Competition & Intelligence

- `API_ENDPOINTS.COMPETITION.COMPARE` - Company comparisons
- `API_ENDPOINTS.COMPETITION.SPIDERWEB` - Competitive landscape
- `API_ENDPOINTS.THERAPEUTIC_AREAS.LIST` - All therapeutic areas
- `API_ENDPOINTS.THERAPEUTIC_AREAS.COMPARE_RADAR` - Radar chart comparison

### Evidence Journal

- `API_ENDPOINTS.EVIDENCE.JOURNAL` - Evidence journal aggregator
- `API_ENDPOINTS.EVIDENCE.TODAY` - Today's evidence updates
- `API_ENDPOINTS.EVIDENCE.CATALYSTS` - Catalyst board (90-180 days)
- `API_ENDPOINTS.EVIDENCE.MOA` - Mechanism of action explorer

### Science Events

- `API_ENDPOINTS.SCIENCE.EVENTS` - Science event store
- `API_ENDPOINTS.SCIENCE.EVENT_DETAIL(id)` - Event details

### News & Insights

- `API_ENDPOINTS.NEWS.LATEST` - Latest news articles
- `API_ENDPOINTS.NEWS.DIFF` - What's changed since last check
- `API_ENDPOINTS.INSIGHTS.SUMMARY` - Insights summary
- `API_ENDPOINTS.INSIGHTS.OPPORTUNITIES` - Investment opportunities

### Financial Modeling

- `API_ENDPOINTS.FINANCIALS.OVERVIEW` - Financials overview
- `API_ENDPOINTS.FINANCIALS.PRICE_TARGETS` - Analyst price targets
- `API_ENDPOINTS.FINANCIALS.CONSENSUS` - Street consensus
- `API_ENDPOINTS.FINANCIALS.DCF` - DCF valuation
- `API_ENDPOINTS.FINANCIALS.LOE` - Loss of exclusivity timeline
- `API_ENDPOINTS.FINANCIALS.REPORTS` - Financial reports

### Analytics & Search

- `API_ENDPOINTS.ANALYTICS.METRICS` - Analytics metrics
- `API_ENDPOINTS.SEARCH.QUERY` - Search endpoint
- `API_ENDPOINTS.MARKET.CHART` - Market data charts

## Backend Setup

To run the Python FastAPI backend:

```bash
# Install dependencies (from project root)
poetry install

# Run the backend server
poetry run uvicorn bt_platform.core.app:app --reload --port 8000
```

The API will be available at `http://localhost:8000` with:
- Interactive docs at `/docs`
- ReDoc at `/redoc`
- Health check at `/health`

## Migration from Old Code

If you're updating existing code that uses hardcoded URLs:

### Before (❌ Don't do this)
```typescript
const response = await fetch('http://localhost:3001/api/biotech/dashboard');
const data = await response.json();
```

### After (✅ Do this)
```typescript
import { API_ENDPOINTS, apiFetch } from '../config/api';

const data = await apiFetch(API_ENDPOINTS.BIOTECH.DASHBOARD);
```

## Benefits

1. **Consistency** - All pages use the same API configuration
2. **Maintainability** - Change backend URL in one place
3. **Type Safety** - TypeScript autocompletion for endpoints
4. **Error Handling** - Centralized error handling logic
5. **Environment Flexibility** - Easy to switch between dev/staging/prod
6. **Documentation** - Clear endpoint structure

## Troubleshooting

### Backend Not Running

If you see "Backend connection failed" errors:

1. Check if the Python backend is running on port 8000
2. Verify the `.env` file has the correct `VITE_API_URL`
3. Check the browser console for CORS errors

### Port Conflicts

If port 8000 is already in use:

1. Change the backend port: `uvicorn bt_platform.core.app:app --port 8001`
2. Update `.env`: `VITE_API_URL=http://localhost:8001`
3. Restart the terminal app

### CORS Errors

The Python backend has CORS configured in `bt_platform/core/app.py`. By default it allows:
- `http://localhost:3000` (terminal app)
- `http://localhost:5173` (component dev server)

If you need to add more origins, update the `CORS_ORIGINS` setting in `bt_platform/core/config.py`.

## See Also

- [Backend API Documentation](/docs/API_INTEGRATION.md)
- [Sprint 1 Implementation Guide](/docs/SPRINT_1_PROOF_OF_CONCEPT.md)
- [Architecture Overview](/docs/ARCHITECTURE_OVERVIEW.md)

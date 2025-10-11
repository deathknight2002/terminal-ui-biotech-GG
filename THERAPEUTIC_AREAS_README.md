# Therapeutic Areas API Implementation

## Overview

This implementation adds structured therapeutic area intelligence data and a simplified API for accessing comparative science attributes. The system is designed to support scrapers that will populate dynamic fields (market cap, phase, etc.) while maintaining clean, auditable data structures.

## Components Added

### 1. Data Files (Seed Data for Scrapers)

#### `data/companies.yaml`
28 companies across therapeutic areas:
- **13 DMD/Neuromuscular companies**: SRPT, PTCT, DYN, TRDA, PEPG, EWTX, SLDB, SANN.SW, CPRX, 4516.T, NS Pharma, Italfarmaco, RHHBY
- **13 Cardiology companies**: AMGN, LLY, MRK, AZN, BMY, IONS, CYTK, NVO, REGN, AMRN, ESPR, BBIO, ARWR  
- **2 MedTech companies**: Moon Surgical, Distalmotion

**Structure:**
```yaml
- name: Company Name
  ticker: TICK         # or null for private companies
  is_private: false
  areas: [DMD]         # Therapeutic areas
  hq: null             # To be filled by scrapers
  pipeline_count: null # To be filled by scrapers
```

**Key Design Decisions:**
- `null` values for fields that will be populated by scrapers
- String tickers preserved as-is (e.g., "SANN.SW", "4516.T") for international exchanges
- Private companies have `ticker: null`
- Fields ready for scraper enrichment: `hq`, `pipeline_count`

#### `data/programs.yaml`
16 drug programs with real-world data:
- **6 DMD programs**: ELEVIDYS, SRP-5051, Viltolarsen, Givinostat, Vamorolone, Ataluren
- **10 Cardiology programs**: Camzyos, Aficamten, Plozasiran, Pelacarsen, Inclisiran, Zilebesiran, Bempedoic acid, Tirzepatide, Olezarsen, Evinacumab

**Structure:**
```yaml
- company: Company Name
  name: Drug Name (Generic Name)
  mechanism: MOA description
  indication: Indication
  phase: Approved     # Dynamic - to be updated by scrapers
  registry_ids: []    # ClinicalTrials.gov IDs - to be filled by scrapers
```

**Key Design Decisions:**
- Phase field is dynamic and should be updated by scrapers
- `registry_ids` array ready for ClinicalTrials.gov integration
- No hardcoded URLs - scrapers will handle data fetching

### 2. Updated API Endpoints

#### `platform/core/endpoints/therapeutic_areas.py`

**Simplified Structure (Per Problem Statement):**

```python
# Pydantic model for type safety
class AreaScores(BaseModel):
    area: str
    scores: Dict[str, float]
    rationale: Optional[str] = None
    sources: List[str] = []

# In-memory database (5 therapeutic areas)
DB: Dict[str, AreaScores] = {
    "DMD": AreaScores(...),
    "Cardiology": AreaScores(...),
    "IBD": AreaScores(...),
    "Oncology": AreaScores(...),
    "Rare Disease": AreaScores(...),
}
```

**Endpoints:**

1. **GET `/api/v1/therapeutic-areas/areas`**
   - Returns: `List[AreaScores]`
   - Lists all therapeutic areas with scores

2. **GET `/api/v1/therapeutic-areas/areas/{area}`**
   - Returns: `AreaScores`
   - Get specific therapeutic area details
   - Raises 404 if area not found

3. **GET `/api/v1/therapeutic-areas/areas/compare/radar`**
   - Query params: `areas=DMD&areas=Cardiology` (list of area IDs)
   - Returns radar chart data structure:
     ```json
     {
       "attributes": ["Unmet Need", "Market Size", ...],
       "series": [
         {"id": "DMD", "name": "DMD", "values": [9.5, 7.8, ...]},
         {"id": "Cardiology", "name": "Cardiology", "values": [8.5, 9.5, ...]}
       ],
       "palette": "aurora"
     }
     ```

**7 Science Attributes:**
1. Unmet Need
2. Market Size
3. Regulatory Support
4. Scientific Validation
5. Competitive Intensity
6. Reimbursement Potential
7. Patient Advocacy

### 3. Rate Limiter Utility

#### `platform/core/utils/ratelimit.py`

Generic rate limiter with token bucket algorithm and response caching.

**Features:**
- Per-domain rate limiting
- Token bucket algorithm (configurable burst and RPS)
- Automatic response caching with TTL
- Cache key generation from URL + params
- Retry logic on failure

**Usage Example:**
```python
import requests
from platform.core.utils.ratelimit import rate_limited

@rate_limited(domain="query1.finance.yahoo.com", rps=2.0, burst=5, ttl=600)
def fetch_stock_quote(url, **kwargs):
    return requests.get(url, **kwargs).json()

# Automatically rate limited and cached
data = fetch_stock_quote("https://query1.finance.yahoo.com/v8/finance/chart/SRPT")
```

**Key Functions:**
- `rate_limited()`: Decorator for rate-limited requests
- `clear_cache()`: Clear cache entries
- `reset_rate_limiter()`: Reset rate limiter state
- `get_cache_stats()`: Get cache statistics
- `get_rate_limiter_stats()`: Get rate limiter statistics

## Testing

### Automated Smoke Test

Run the comprehensive smoke test:
```bash
python3 scripts/smoke-test-therapeutic-areas.py
```

This tests:
- YAML file structure and validation
- API endpoint functionality
- Rate limiter utility

### Manual API Testing

Start the FastAPI backend:
```bash
cd platform
poetry run uvicorn platform.core.app:app --reload
```

Test endpoints:
```bash
# List all therapeutic areas
curl http://localhost:8000/api/v1/therapeutic-areas/areas

# Get specific area
curl http://localhost:8000/api/v1/therapeutic-areas/areas/DMD

# Compare areas (radar chart data)
curl "http://localhost:8000/api/v1/therapeutic-areas/areas/compare/radar?areas=DMD&areas=Cardiology"
```

### YAML Validation

Validate YAML files:
```bash
# Check companies.yaml
python3 -c "import yaml; d=yaml.safe_load(open('data/companies.yaml')); print(len(d),'companies OK')"

# Check programs.yaml  
python3 -c "import yaml; d=yaml.safe_load(open('data/programs.yaml')); print(len(d),'programs OK')"
```

## Integration with Frontend

### Example Client Code

```typescript
// client/src/api/therapeuticAreas.ts
export async function getRadar(areas: string[]) {
  const params = areas.map(a => `areas=${encodeURIComponent(a)}`).join('&');
  const res = await fetch(
    `/api/v1/therapeutic-areas/areas/compare/radar?${params}`
  );
  if (!res.ok) throw new Error("Radar fetch failed");
  return res.json();
}

// Usage in component
import { useEffect, useState } from 'react';
import TherapeuticAreaRadarChart from '@/components/visualizations/TherapeuticAreaRadarChart';
import { getRadar } from '@/api/therapeuticAreas';

export default function AreasCompare() {
  const [data, setData] = useState(null);
  useEffect(() => {
    getRadar(["DMD", "Cardiology"]).then(setData);
  }, []);
  
  if (!data) return <div>Loading...</div>;
  
  return (
    <TherapeuticAreaRadarChart
      series={data.series}
      attributes={data.attributes}
      auroraGradient
      showLegend
    />
  );
}
```

## Design Philosophy

### Why YAML Files?

1. **Scraper-Ready**: Fields marked `null` are placeholders for scraper enrichment
2. **Version Control**: Easy to track changes and review
3. **Human-Readable**: Non-technical stakeholders can review and validate
4. **Separation of Concerns**: Static seed data separate from dynamic scraped data

### Why Simplified API?

1. **Performance**: In-memory DB for fast reads
2. **Type Safety**: Pydantic models for validation
3. **Clean Interface**: REST-ful design matching problem statement
4. **Extensibility**: Easy to add new therapeutic areas

### Rate Limiting Strategy

1. **Per-Domain**: Each external service gets its own rate limit
2. **Token Bucket**: Allows bursts while maintaining average rate
3. **Caching**: Reduces duplicate requests
4. **Graceful Degradation**: Automatic retry on failure

## Next Steps

### Scraper Development

The data structure is ready for scrapers to populate:

1. **Company Enrichment**:
   - Fetch HQ location from company websites
   - Get pipeline counts from company "Pipeline" pages
   - Update market caps from Yahoo Finance (using `ratelimit.py`)

2. **Program Enrichment**:
   - Update phases from ClinicalTrials.gov
   - Populate `registry_ids` from CT.gov search
   - Track FDA label updates

3. **Scraper Manifest** (Future):
   ```yaml
   # platform/scrapers/registry.yaml
   - source_key: yahoo_finance
     base_url: https://query1.finance.yahoo.com
     rate_limit:
       max_rps: 2.0
       max_concurrent: 4
   
   - source_key: clinical_trials_gov
     base_url: https://clinicaltrials.gov/api/v2
     rate_limit:
       max_rps: 1.0
       max_concurrent: 2
   ```

### Frontend Integration

1. Create `TherapeuticAreaRadarChart` component (if not exists)
2. Add routes for therapeutic area comparison pages
3. Implement interactive filtering by area
4. Add tooltips showing rationale and sources

## Files Changed

- ✅ `data/companies.yaml` - NEW
- ✅ `data/programs.yaml` - NEW
- ✅ `platform/core/endpoints/therapeutic_areas.py` - UPDATED
- ✅ `platform/core/utils/ratelimit.py` - NEW
- ✅ `scripts/smoke-test-therapeutic-areas.py` - NEW
- ✅ `THERAPEUTIC_AREAS_README.md` - NEW (this file)

## Notes

- All endpoints are synchronous (not `async`) per problem statement
- Query parameter format: `?areas=DMD&areas=Cardiology` (FastAPI list syntax)
- Legacy `/areas/{area_id}/companies` endpoint kept for backward compatibility
- Rate limiter is domain-agnostic and can be used for any HTTP client
- YAML files validated with `pyyaml` library

## Validation Checklist

- [x] 28 companies in `data/companies.yaml` (13 DMD + 13 Cardio + 2 MedTech)
- [x] 16 programs in `data/programs.yaml`
- [x] API endpoints match problem statement structure
- [x] Rate limiter utility created with cache and token bucket
- [x] Smoke test script passes all tests
- [x] Python syntax validated
- [x] YAML structure validated
- [x] No hardcoded API keys or secrets
- [x] Documentation complete

# Advanced Biotech API Integration - Quick Start

## Overview

This integration brings institutional-grade pharmaceutical intelligence to the terminal by connecting to three powerful public APIs:

- **OpenFDA** - FDA approvals, adverse events, recalls
- **ClinicalTrials.gov** - Clinical trial registry and results  
- **PubMed** - Scientific literature and research trends

## Features

### 🏛️ FDA Intelligence
- Real-time drug approval tracking
- Adverse event signal detection
- Drug recall monitoring with severity classification
- Drug label database (package inserts)
- Safety signal algorithms

### 🔬 Clinical Trials Intelligence
- Advanced trial search with filters
- Recruitment status tracking
- Competitive landscape analysis
- Enrollment metrics and projections
- Phase distribution statistics

### 📚 Research Intelligence
- Publication search with advanced syntax
- Publication velocity tracking
- Hot topics identification
- Competitive R&D analysis
- Emerging research areas

## Quick Start

### 1. Start the Backend

```bash
# From project root
cd bt_platform
poetry run uvicorn core.app:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

### 2. View API Documentation

Open your browser to:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### 3. Test the APIs

```bash
# Test FDA endpoints
curl "http://localhost:8000/api/v1/fda/dashboard"
curl "http://localhost:8000/api/v1/fda/approvals?limit=5"

# Test Clinical Trials endpoints
curl "http://localhost:8000/api/v1/trials/dashboard"
curl "http://localhost:8000/api/v1/trials/search?condition=Cancer&phase=PHASE3"

# Test Research endpoints
curl "http://localhost:8000/api/v1/research/dashboard"
curl "http://localhost:8000/api/v1/research/trends?query=CAR-T%20therapy&years=10"
```

### 4. Use in Terminal App

The terminal app automatically connects to these APIs. Just navigate to:
- `/fda` - FDA Intelligence Dashboard
- `/trials/monitor` - Clinical Trials Monitor
- `/research` - Research Intelligence

Or use the launchpad (press `Cmd+K` or `Ctrl+K`) and search for:
- "FDA"
- "Trials"
- "Research"

## Example Components

Three example components demonstrate the integration:

### FDADashboard
```typescript
import { FDADashboard } from '@/components/FDADashboard';

// In your page component
<FDADashboard />
```

Shows recent FDA approvals, top adverse events, and active recalls.

### ClinicalTrialsMonitor
```typescript
import { ClinicalTrialsMonitor } from '@/components/ClinicalTrialsMonitor';

<ClinicalTrialsMonitor />
```

Displays recruiting trials, phase distribution, and search functionality.

### ResearchTrends
```typescript
import { ResearchTrends } from '@/components/ResearchTrends';

<ResearchTrends />
```

Visualizes publication trends and identifies hot research topics.

## API Endpoints Reference

### FDA Intelligence (`/api/v1/fda`)
- `GET /approvals` - Drug approvals
- `GET /adverse-events` - Adverse event reports
- `GET /adverse-events/counts` - Aggregated event counts
- `GET /recalls` - Drug recalls
- `GET /labels` - Drug labels
- `GET /dashboard` - Complete dashboard data
- `GET /safety-signals` - Safety signal detection

### Clinical Trials (`/api/v1/trials`)
- `GET /search` - Search trials with filters
- `GET /recruiting` - Currently recruiting trials
- `GET /details/{nct_id}` - Trial details
- `GET /statistics` - Aggregated statistics
- `GET /dashboard` - Complete dashboard data
- `GET /competitive-landscape` - Competitive analysis
- `GET /enrollment-tracker` - Enrollment tracking

### Research Intelligence (`/api/v1/research`)
- `GET /search` - Search publications
- `GET /publication/{pmid}` - Publication details
- `GET /trends` - Publication trends
- `GET /drug/{drug_name}` - Drug-specific publications
- `GET /disease/{disease}` - Disease-specific publications
- `GET /dashboard` - Complete dashboard data
- `GET /hot-topics` - Hot topics analysis
- `GET /competitive-research` - Competitive R&D

## Rate Limiting

All providers implement rate limiting to respect API quotas:

| API | Rate Limit | Implementation |
|-----|-----------|----------------|
| OpenFDA | 240/min, 120k/day | 250ms delay between requests |
| ClinicalTrials.gov | No official limit | 100ms delay (be respectful) |
| PubMed | 3/sec (10/sec with API key) | Configurable delay |

Results are cached for 1 hour to reduce API calls.

## Environment Variables

Add to your `.env` file (optional):

```bash
# PubMed API key (optional, increases rate limit to 10 req/sec)
PUBMED_API_KEY=your_api_key_here

# Email for NCBI E-utilities (recommended)
PUBMED_EMAIL=your_email@example.com
```

## Use Cases

### 1. Monitor Drug Safety
Track adverse events and safety signals for your portfolio:

```bash
curl "http://localhost:8000/api/v1/fda/safety-signals?days=30"
curl "http://localhost:8000/api/v1/fda/adverse-events?drug_name=Keytruda&serious=true"
```

### 2. Competitive Intelligence
Analyze competitive trial activity:

```bash
curl "http://localhost:8000/api/v1/trials/competitive-landscape?condition=Multiple%20Myeloma"
curl "http://localhost:8000/api/v1/research/competitive-research?company=Pfizer&competitors=Moderna,BioNTech"
```

### 3. Research Trends
Identify emerging research areas:

```bash
curl "http://localhost:8000/api/v1/research/hot-topics?therapeutic_area=Oncology&years=5"
curl "http://localhost:8000/api/v1/research/trends?query=mRNA%20vaccine&years=10"
```

### 4. Trial Recruitment
Track enrollment opportunities:

```bash
curl "http://localhost:8000/api/v1/trials/enrollment-tracker?condition=Lung%20Cancer"
curl "http://localhost:8000/api/v1/trials/recruiting?phase=PHASE3"
```

## Architecture

### Provider Pattern
All data sources follow a consistent provider pattern:

```python
from bt_platform.providers.base import Provider

class MyProvider(Provider):
    async def fetch_data(self, **kwargs):
        # Implement rate limiting
        await self._rate_limit()
        
        # Make API request
        result = await self._make_request(...)
        
        # Transform and return
        return transformed_data
```

### Endpoint Pattern
FastAPI endpoints use the providers:

```python
from bt_platform.providers.openfda_provider import OpenFDAProvider

router = APIRouter()
provider = OpenFDAProvider()

@router.get("/approvals")
async def get_approvals(limit: int = 100):
    return await provider.fetch_drug_approvals(limit=limit)
```

### Frontend Pattern
React components use React Query:

```typescript
const { data } = useQuery({
  queryKey: ['fda-dashboard'],
  queryFn: () => apiFetch(API_ENDPOINTS.FDA.DASHBOARD),
  staleTime: 5 * 60 * 1000,
});
```

## Testing

Run the provider tests:

```bash
# From project root
poetry run pytest tests/test_openfda_provider.py
poetry run pytest tests/test_clinicaltrials_provider.py
poetry run pytest tests/test_pubmed_provider.py
```

Note: Integration tests that hit actual APIs are skipped by default to avoid rate limiting.

## Troubleshooting

### Rate Limit Errors
If you encounter rate limit errors:
1. Reduce request frequency
2. Use dashboard endpoints (they batch multiple calls)
3. Increase cache TTL
4. For PubMed, add an API key

### Empty Results
If searches return no results:
1. Check query syntax (especially for PubMed)
2. Verify date formats
3. Try broader search terms
4. Check API documentation for query examples

### Timeout Errors
If requests timeout:
1. Reduce result limits
2. Use more specific filters
3. Check network connectivity
4. Verify API endpoints are accessible

## Next Steps

Now that you have the APIs integrated:

1. **Create Custom Dashboards** - Combine data from multiple sources
2. **Add Alerts** - Set up notifications for important events
3. **Build Reports** - Generate PDF reports from API data
4. **Add Visualizations** - Create charts and graphs
5. **Extend Coverage** - Add more data sources (DrugBank, ChEMBL, etc.)

## Resources

- [OpenFDA Documentation](https://open.fda.gov/apis/)
- [ClinicalTrials.gov API Guide](https://clinicaltrials.gov/api/v2)
- [PubMed E-utilities](https://www.ncbi.nlm.nih.gov/books/NBK25501/)
- [Full API Documentation](./docs/ADVANCED_API_INTEGRATION.md)

## Support

For issues or questions:
1. Check the [full documentation](./docs/ADVANCED_API_INTEGRATION.md)
2. Review API provider source code in `bt_platform/providers/`
3. Check endpoint implementations in `bt_platform/core/endpoints/`
4. Review example components in `terminal/src/components/`

---

**Built with ❤️ for pharmaceutical intelligence**

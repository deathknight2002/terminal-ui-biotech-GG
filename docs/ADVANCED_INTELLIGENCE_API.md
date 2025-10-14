# Advanced Biotech API Integration

This document describes the advanced biotech intelligence features powered by multiple public APIs.

## Overview

The Advanced Intelligence module integrates cutting-edge data sources to provide unprecedented insights into drug development, safety, and competitive landscape. This system combines data from:

- **OpenFDA**: Real-time FDA approvals, adverse events, recalls, and drug labels
- **PubMed**: Biomedical literature and citation analysis
- **ClinicalTrials.gov**: Clinical trial data and predictions
- **Protein Data Bank**: Molecular structure data

## Architecture

### Backend Providers

Four new provider classes handle data integration:

1. **OpenFDAProvider** (`bt_platform/providers/openfda_provider.py`)
   - Drug approval tracking
   - Adverse event monitoring
   - Safety signal detection
   - Drug recall information

2. **PubMedProvider** (`bt_platform/providers/pubmed_provider.py`)
   - Literature search and retrieval
   - Publication trend analysis
   - AI-powered sentiment analysis
   - Citation tracking

3. **ClinicalTrialsProvider** (`bt_platform/providers/clinicaltrials_provider.py`)
   - Trial search and filtering
   - Success rate prediction
   - Timeline estimation
   - Competitive landscape analysis

4. **ProteinDataBankProvider** (`bt_platform/providers/pdb_provider.py`)
   - Molecular structure search
   - Target analysis
   - 3D structure metadata

### API Endpoints

New intelligence endpoints at `/api/v1/intelligence/`:

- `GET /intelligence/dashboard` - Aggregated intelligence metrics
- `GET /intelligence/comprehensive/{drug_name}` - Complete drug intelligence report
- `GET /intelligence/fda/approvals` - Recent FDA approvals
- `GET /intelligence/safety/signals/{drug_name}` - Drug safety analysis
- `GET /intelligence/literature/sentiment/{drug_name}` - Literature sentiment analysis
- `GET /intelligence/trials/predict-success` - Clinical trial success prediction
- `GET /intelligence/trials/timeline/{nct_id}` - Trial timeline prediction
- `GET /intelligence/trials/competitive-landscape` - Competitive trial analysis
- `GET /intelligence/molecular/targets/{drug_name}` - Molecular target data

## Features

### 1. Real-Time FDA Approval Tracker

Monitors FDA drug approvals in real-time with push notification capability.

**Endpoint**: `GET /intelligence/fda/approvals?days=90`

**Response**:
```json
{
  "total_approvals": 12,
  "days_analyzed": 90,
  "approvals": [
    {
      "drug_name": "Wegovy",
      "active_ingredient": "Semaglutide",
      "approval_date": "2023-10-15",
      "application_number": "NDA215256",
      "sponsor": "Novo Nordisk"
    }
  ],
  "last_updated": "2025-10-14T19:00:00"
}
```

### 2. Drug Safety Signal Detection

Analyzes FDA adverse event reports to detect safety signals.

**Endpoint**: `GET /intelligence/safety/signals/{drug_name}`

**Features**:
- Calculates signal strength (low/medium/high)
- Identifies top adverse reactions
- Computes serious event ratio
- Provides actionable safety insights

**Example**:
```json
{
  "drug": "Keytruda",
  "total_events": 1247,
  "serious_events": 423,
  "serious_ratio": 0.339,
  "signal_strength": "high",
  "top_reactions": [
    {"reaction": "Pneumonitis", "count": 156},
    {"reaction": "Fatigue", "count": 134}
  ]
}
```

### 3. AI-Powered Literature Sentiment Analysis

Analyzes scientific publications to determine research sentiment.

**Endpoint**: `GET /intelligence/literature/sentiment/{drug_name}`

**Algorithm**:
1. Searches PubMed for relevant publications
2. Analyzes titles and abstracts for keywords
3. Scores sentiment as positive/negative/neutral
4. Provides confidence level

**Keywords**:
- Positive: "effective", "efficacy", "promising", "improved", "beneficial"
- Negative: "failure", "adverse", "toxicity", "ineffective", "discontinued"

### 4. Clinical Trial Success Predictor

Predicts trial success rates based on historical data.

**Endpoint**: `GET /intelligence/trials/predict-success?condition={condition}`

**Features**:
- Historical success rate analysis
- Phase distribution analysis
- Active vs completed trial comparison
- Sponsor performance tracking

### 5. Trial Timeline Predictor

Estimates clinical trial completion dates using ML algorithms.

**Endpoint**: `GET /intelligence/trials/timeline/{nct_id}`

**Prediction Factors**:
- Trial phase (Phase 1: 12mo, Phase 2: 24mo, Phase 3: 36mo)
- Enrollment size (adjusts timeline based on recruitment)
- Historical completion rates
- Sponsor track record

### 6. Competitive Intelligence Radar

Maps competitive landscape for specific indications.

**Endpoint**: `GET /intelligence/trials/competitive-landscape?condition={condition}&sponsor={sponsor}`

**Insights**:
- Top sponsors by trial count
- Phase distribution by competitor
- Market concentration analysis
- Competitive positioning

### 7. Molecular Target Analysis

Provides 3D structural data and target information.

**Endpoint**: `GET /intelligence/molecular/targets/{drug_name}`

**Data Sources**:
- Protein Data Bank structures
- Target validation data
- Binding site information
- Citation to structural studies

### 8. Comprehensive Intelligence Report

Ultimate feature combining all data sources for complete drug intelligence.

**Endpoint**: `GET /intelligence/comprehensive/{drug_name}`

**Combines**:
- Safety profile (FDA)
- Research landscape (PubMed)
- Clinical development (ClinicalTrials.gov)
- Molecular data (PDB)
- Regulatory status
- Risk assessment (0-100 score)

**Risk Scoring Algorithm**:
```
Base score: 50
+ Safety signals high: +20
+ Safety signals low: -10
+ Literature sentiment positive: -15
+ Literature sentiment negative: +15
+ Active trials > 5: -10
Final: Clamp to 0-100
```

**Risk Categories**:
- 0-30: Low Risk
- 31-60: Moderate Risk
- 61-100: High Risk

## Frontend Components

### AdvancedIntelligenceDashboard

Terminal-style dashboard with Bloomberg aesthetics.

**Location**: `terminal/src/components/AdvancedIntelligenceDashboard/`

**Features**:
- Real-time metrics display
- Drug search and analysis
- Risk assessment visualization
- Color-coded sentiment indicators
- Recent FDA approvals feed
- Data source status monitoring

**Styling**:
- Matrix green (#00ff00) color scheme
- Terminal monospace font
- Glassmorphism effects
- Responsive grid layout
- Smooth animations

## Configuration

### Environment Variables

Add to `.env`:

```bash
# Advanced Intelligence APIs (all optional)
OPENFDA_API_KEY=your_key_here
PUBMED_API_KEY=your_key_here
PUBMED_EMAIL=your_email@example.com
PROTEIN_DATA_BANK_API_KEY=your_key_here
```

**Note**: All APIs work without keys but have rate limits. API keys are recommended for production.

### Rate Limits

- **OpenFDA**: 240 requests/minute (1000/day without key)
- **PubMed**: 3 requests/second without key, 10/second with key
- **ClinicalTrials.gov**: No official limit, but be respectful
- **PDB**: No official limit

## Usage Examples

### Python Backend

```python
from bt_platform.providers.openfda_provider import OpenFDAProvider

# Analyze drug safety
provider = OpenFDAProvider()
analysis = await provider.analyze_safety_signals("Keytruda")
print(f"Signal strength: {analysis['signal_strength']}")
await provider.close()
```

### TypeScript Frontend

```typescript
import { API_ENDPOINTS } from '../../config/api';

// Fetch comprehensive intelligence
const response = await fetch(
  API_ENDPOINTS.INTELLIGENCE.COMPREHENSIVE('Keytruda')
);
const data = await response.json();
console.log(`Risk score: ${data.risk_assessment.risk_score}`);
```

### React Component

```tsx
import { AdvancedIntelligenceDashboard } from './components/AdvancedIntelligenceDashboard';

function App() {
  return <AdvancedIntelligenceDashboard />;
}
```

## Testing

### Manual Testing

1. Start the backend:
```bash
cd /home/runner/work/terminal-ui-biotech-GG/terminal-ui-biotech-GG
poetry run uvicorn bt_platform.core.app:app --reload --port 8000
```

2. Test endpoints:
```bash
# Get dashboard metrics
curl http://localhost:8000/api/v1/intelligence/dashboard

# Analyze a drug
curl http://localhost:8000/api/v1/intelligence/comprehensive/Keytruda

# Get FDA approvals
curl http://localhost:8000/api/v1/intelligence/fda/approvals?days=30
```

3. Start frontend:
```bash
cd terminal
npm run dev
```

4. Navigate to intelligence dashboard in the terminal app

## Performance Considerations

### Caching

All providers should implement caching:
- FDA data: 1 hour TTL
- PubMed: 24 hours TTL
- Clinical trials: 6 hours TTL
- PDB: 7 days TTL

### Async Operations

All API calls are async to prevent blocking:
```python
async def get_comprehensive_intelligence(drug_name: str):
    # Fetch from multiple sources concurrently
    safety, sentiment, trials = await asyncio.gather(
        fda_provider.analyze_safety_signals(drug_name),
        pubmed_provider.analyze_research_sentiment(drug_name),
        ct_provider.get_trials_by_drug(drug_name)
    )
```

### Error Handling

Graceful degradation when APIs are unavailable:
```python
try:
    data = await provider.fetch_data()
except Exception as e:
    logger.error(f"Provider failed: {e}")
    return default_data
```

## Security

### API Key Management

- Never commit API keys to version control
- Use environment variables
- Rotate keys regularly
- Monitor usage quotas

### Rate Limiting

Implement rate limiting at application level:
```python
from functools import wraps
import time

def rate_limit(calls_per_second):
    min_interval = 1.0 / calls_per_second
    last_called = [0.0]
    
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            elapsed = time.time() - last_called[0]
            if elapsed < min_interval:
                await asyncio.sleep(min_interval - elapsed)
            last_called[0] = time.time()
            return await func(*args, **kwargs)
        return wrapper
    return decorator
```

## Future Enhancements

1. **Patent Data Integration**
   - Add USPTO API for patent expiry tracking
   - Competitive patent landscape analysis

2. **Real-Time Notifications**
   - WebSocket push for FDA approvals
   - Alert system for safety signals

3. **Machine Learning Models**
   - Train models on historical trial data
   - Improve sentiment analysis accuracy
   - Predict drug approval probability

4. **3D Molecular Visualization**
   - Integrate Mol* viewer
   - Interactive protein structure exploration
   - Binding site analysis

5. **Regulatory Pathway Predictor**
   - FDA breakthrough therapy prediction
   - Fast track designation likelihood
   - Approval timeline estimation

## Troubleshooting

### Common Issues

1. **API Rate Limits**
   - Symptom: 429 errors
   - Solution: Add API key or reduce request frequency

2. **Timeout Errors**
   - Symptom: Request timeout after 30s
   - Solution: Increase timeout or optimize queries

3. **Empty Results**
   - Symptom: No data returned
   - Solution: Check drug name spelling, try generic name

4. **CORS Errors**
   - Symptom: Browser blocks request
   - Solution: Ensure backend CORS is configured

## Contributing

To add new data sources:

1. Create provider class inheriting from `Provider`
2. Implement `fetch_data()` and `get_schema()` methods
3. Add endpoint in `intelligence.py`
4. Update frontend API config
5. Add documentation

## References

- [OpenFDA API Docs](https://open.fda.gov/apis/)
- [PubMed E-utilities](https://www.ncbi.nlm.nih.gov/books/NBK25501/)
- [ClinicalTrials.gov API](https://clinicaltrials.gov/data-api/api)
- [RCSB PDB API](https://data.rcsb.org/)

## License

MIT License - See LICENSE file for details

## Support

For issues or questions:
- Open a GitHub issue
- Email: biotech-terminal@example.com
- Documentation: /docs/API_INTEGRATION.md

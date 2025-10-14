# Biotech API Providers

This directory contains provider classes for integrating external biotech data sources.

## Available Providers

### OpenFDAProvider
**Source**: FDA's OpenFDA API  
**File**: `openfda_provider.py`  
**Data**: Drug approvals, adverse events, recalls, labels

**Methods**:
- `get_drug_approvals(days)` - Recent FDA approvals
- `get_adverse_events(drug_name, limit)` - Adverse event reports
- `get_drug_recalls(classification)` - Drug recall information
- `get_drug_labels(drug_name)` - Drug labeling data
- `analyze_safety_signals(drug_name)` - Safety signal detection

### PubMedProvider
**Source**: NCBI PubMed E-utilities  
**File**: `pubmed_provider.py`  
**Data**: Biomedical literature, publications, citations

**Methods**:
- `search_articles(query, max_results, date_from)` - Search PubMed
- `fetch_article_details(pmids)` - Get article metadata
- `search_drug_publications(drug_name, years_back)` - Drug-specific search
- `analyze_research_sentiment(drug_name)` - AI sentiment analysis

### ClinicalTrialsProvider
**Source**: ClinicalTrials.gov API v2  
**File**: `clinicaltrials_provider.py`  
**Data**: Clinical trial information, status, results

**Methods**:
- `search_trials(query)` - Search trials with filters
- `get_trial_by_nct(nct_id)` - Detailed trial info
- `get_trials_by_drug(drug_name, limit)` - Drug-specific trials
- `analyze_trial_success_rate(condition)` - Success rate analysis
- `predict_trial_timeline(nct_id)` - Timeline prediction
- `get_competitive_trials(condition, sponsor)` - Competitive landscape

### ProteinDataBankProvider
**Source**: RCSB Protein Data Bank  
**File**: `pdb_provider.py`  
**Data**: Molecular structures, protein data

**Methods**:
- `search_structures(query, limit)` - Search PDB structures
- `get_structure_details(pdb_id)` - Structure metadata
- `analyze_drug_targets(drug_name)` - Target analysis

## Usage

### Basic Usage

```python
from bt_platform.providers.openfda_provider import OpenFDAProvider

# Initialize provider
provider = OpenFDAProvider(api_key="optional_key")

# Fetch data
approvals = await provider.get_drug_approvals(days=30)

# Always close when done
await provider.close()
```

### With Context Manager

```python
from bt_platform.providers.pubmed_provider import PubMedProvider

async with PubMedProvider(api_key="key", email="you@example.com") as provider:
    articles = await provider.search_articles("cancer immunotherapy", max_results=50)
```

## Base Provider Class

All providers inherit from `Provider` base class:

```python
class Provider(ABC):
    @abstractmethod
    async def fetch_data(self, **kwargs) -> Dict[str, Any]:
        """Fetch data from the provider"""
        pass
    
    @abstractmethod
    def get_schema(self) -> Dict[str, Any]:
        """Get the data schema for this provider"""
        pass
```

## Adding New Providers

1. Create new file: `your_provider.py`
2. Inherit from `Provider`
3. Implement required methods
4. Add to `__init__.py`
5. Create endpoint in `endpoints/intelligence.py`
6. Update documentation

## Configuration

Set API keys in environment variables:

```bash
OPENFDA_API_KEY=your_key
PUBMED_API_KEY=your_key
PUBMED_EMAIL=your_email@example.com
PROTEIN_DATA_BANK_API_KEY=your_key
```

Or in code:

```python
from bt_platform.core.config import settings

provider = OpenFDAProvider(api_key=settings.OPENFDA_API_KEY)
```

## Rate Limiting

Each provider implements rate limiting:

- OpenFDA: 240 req/min without key, unlimited with key
- PubMed: 3 req/sec without key, 10 req/sec with key
- ClinicalTrials: No official limit (be respectful)
- PDB: No official limit

## Error Handling

All providers handle errors gracefully:

```python
try:
    data = await provider.fetch_data()
except httpx.HTTPError as e:
    logger.error(f"HTTP error: {e}")
    return {"error": str(e), "results": []}
except Exception as e:
    logger.error(f"Unexpected error: {e}")
    return {"error": "Internal error"}
```

## Testing

```python
import pytest
from bt_platform.providers.openfda_provider import OpenFDAProvider

@pytest.mark.asyncio
async def test_get_approvals():
    provider = OpenFDAProvider()
    approvals = await provider.get_drug_approvals(days=90)
    assert isinstance(approvals, list)
    await provider.close()
```

## Performance

### Async/Await

All providers use async/await for non-blocking I/O:

```python
async def get_comprehensive_data():
    fda = OpenFDAProvider()
    pubmed = PubMedProvider()
    
    # Fetch in parallel
    results = await asyncio.gather(
        fda.get_drug_approvals(30),
        pubmed.search_articles("cancer", 100)
    )
    
    await fda.close()
    await pubmed.close()
    
    return results
```

### Caching

Implement caching for expensive operations:

```python
from functools import lru_cache

@lru_cache(maxsize=100)
async def get_cached_trial(nct_id: str):
    provider = ClinicalTrialsProvider()
    data = await provider.get_trial_by_nct(nct_id)
    await provider.close()
    return data
```

## Security

### API Key Management

- Store in environment variables
- Never commit to version control
- Use separate keys for dev/prod
- Rotate regularly

### Input Validation

```python
def validate_drug_name(name: str) -> str:
    # Remove special characters
    clean_name = re.sub(r'[^\w\s-]', '', name)
    # Limit length
    return clean_name[:100]
```

## Troubleshooting

### Common Issues

**Issue**: Provider times out  
**Solution**: Increase httpx timeout or reduce data fetch size

**Issue**: Rate limit exceeded  
**Solution**: Add API key or implement exponential backoff

**Issue**: Empty results  
**Solution**: Check query syntax and data availability

## Resources

- [OpenFDA Docs](https://open.fda.gov/apis/)
- [PubMed E-utilities](https://www.ncbi.nlm.nih.gov/books/NBK25501/)
- [ClinicalTrials API](https://clinicaltrials.gov/data-api/api)
- [RCSB PDB API](https://data.rcsb.org/)

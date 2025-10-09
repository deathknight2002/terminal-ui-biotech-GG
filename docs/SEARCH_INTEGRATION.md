# Full-Text Search Integration

## Overview

The Biotech Terminal implements full-text search (FTS) using SQLite FTS5 for fast, efficient searching across all entities. FTS provides ranked results with relevance scoring and supports advanced query syntax.

## Architecture

### FTS5 Virtual Tables

FTS5 virtual tables are created for each searchable entity:
- **companies_fts**: Company names, tickers, descriptions
- **trials_fts**: Clinical trial titles, conditions, sponsors
- **articles_fts**: News article titles and summaries
- **diseases_fts**: Disease names, descriptions, ICD-10 codes
- **catalysts_fts**: Catalyst events and descriptions
- **therapeutics_fts**: Drug names, indications, targets

### Synchronization

Triggers keep FTS indexes in sync with source tables:
- **INSERT triggers**: Add new records to FTS indexes
- **UPDATE triggers**: Update FTS records when source changes
- **DELETE triggers**: Remove FTS records when source deleted

## Setup

### Initialize FTS Indexes

```python
from platform.core.fts import initialize_fts
from platform.core.database import get_db

# Initialize all FTS indexes and triggers
db = next(get_db())
initialize_fts(db)
```

### Rebuild Indexes

```python
from platform.core.fts import FTSIndex

fts = FTSIndex(db)

# Rebuild specific index
fts.rebuild_index('companies_fts')

# Rebuild all indexes
fts.rebuild_all_indexes()

# Optimize for better performance
fts.optimize_indexes()
```

## Usage

### Python API

```python
from platform.core.fts import search_fts

# Search all entity types
results = search_fts(
    db=db,
    query="oncology",
    limit=50
)

# Search specific entity type
results = search_fts(
    db=db,
    query="DMD",
    entity_type="diseases",
    limit=20
)

# Results include scores
for result in results:
    print(f"{result['type']}: {result['title']} (score: {result['score']})")
```

### REST API

#### Global Search (FTS5)

```bash
GET /api/v1/search/global?q=oncology&limit=50

# With type filter
GET /api/v1/search/global?q=DMD&type=diseases&limit=20

# Disable FTS (use LIKE fallback)
GET /api/v1/search/global?q=oncology&use_fts=false
```

**Response:**
```json
{
  "query": "oncology",
  "count": 45,
  "method": "fts5",
  "results": [
    {
      "type": "company",
      "id": "NUVL",
      "title": "Nuvelo Therapeutics",
      "ticker": "NUVL",
      "company_type": "Biotech",
      "score": 0.85
    },
    {
      "type": "trial",
      "id": "NCT12345678",
      "title": "Phase 3 Study in Oncology",
      "nct_id": "NCT12345678",
      "phase": "Phase III",
      "score": 0.92
    }
  ]
}
```

#### Multi-Category Search (Grouped)

```bash
GET /api/v1/search/multi?q=DMD&limit=10
```

**Response:**
```json
{
  "query": "DMD",
  "method": "like",
  "diseases": [...],
  "companies": [...],
  "therapeutics": [...],
  "trials": [...],
  "articles": [...],
  "catalysts": [...]
}
```

## Query Syntax

### Basic Search

```bash
# Single term
oncology

# Multiple terms (AND by default)
oncology therapy

# Phrase search
"duchenne muscular dystrophy"
```

### Boolean Operators

```bash
# OR operator
oncology OR immunology

# NOT operator
oncology NOT "breast cancer"

# Grouping
(oncology OR immunology) AND therapy
```

### Proximity Search

```bash
# Terms within 5 words of each other
NEAR(DMD therapy, 5)
```

### Column-Specific Search

```bash
# Search in specific columns
ticker:NUVL

# Multiple columns
title:"Phase 3" AND sponsor:Nuvelo
```

## Relevance Ranking

FTS5 ranks results by relevance using BM25 algorithm:
- **Lower scores are better** (negative values in SQLite)
- Results sorted by relevance automatically
- Factors: term frequency, document length, field weights

### Customize Ranking

```python
# Boost specific columns
db.execute(text("""
    CREATE VIRTUAL TABLE companies_fts_custom USING fts5(
        id UNINDEXED,
        ticker,
        name,
        description,
        rank = 'bm25(10.0, 5.0, 1.0)'  -- Boost ticker, then name
    );
"""))
```

## Performance Optimization

### Index Optimization

Run periodically to maintain performance:

```python
fts = FTSIndex(db)
fts.optimize_indexes()
```

### Batch Updates

For bulk data imports, disable triggers temporarily:

```python
# Disable triggers
db.execute(text("DROP TRIGGER companies_ai"))
db.execute(text("DROP TRIGGER companies_au"))
db.execute(text("DROP TRIGGER companies_ad"))

# Import data
# ... bulk insert operations ...

# Recreate triggers
fts.create_triggers()

# Rebuild index
fts.rebuild_index('companies_fts')
```

### Query Performance

Best practices for fast queries:
- Use specific entity type filters when possible
- Limit results appropriately (50-100 max)
- Use phrase searches for exact matches
- Avoid wildcard-only queries

## Integration with Command Palette

### Function Code Search

Function codes integrate with FTS:

```typescript
// Type "CO NUVL" to search companies for NUVL
// Type "TR oncology" to search trials for oncology

if (input.startsWith('CO ')) {
  const query = input.substring(3);
  searchResults = await searchFTS(query, 'companies');
}
```

### Global Search Component

```typescript
import { useSearch } from './hooks/useSearch';

function GlobalSearch() {
  const { search, results, loading } = useSearch();
  
  const handleSearch = async (query: string) => {
    const data = await search(query, { useFTS: true, limit: 50 });
    // Display results
  };
}
```

## Maintenance

### Regular Tasks

**Daily:**
- No maintenance required (triggers keep indexes current)

**Weekly:**
```python
# Optimize indexes
fts.optimize_indexes()
```

**Monthly:**
```python
# Rebuild indexes for best performance
fts.rebuild_all_indexes()
fts.optimize_indexes()
```

### Monitoring

Check index sizes and performance:

```sql
-- Check FTS index size
SELECT 
    name,
    pgsize / 1024.0 / 1024.0 as size_mb
FROM dbstat
WHERE name LIKE '%_fts%';

-- Check index statistics
SELECT * FROM companies_fts WHERE companies_fts = 'integrity-check';
```

## Troubleshooting

### Common Issues

**Issue**: Search returns no results
- **Solution**: Check if FTS indexes are initialized
- **Command**: `fts.rebuild_all_indexes()`

**Issue**: Outdated search results
- **Solution**: Verify triggers are active
- **Command**: `fts.create_triggers()`

**Issue**: Slow search performance
- **Solution**: Optimize indexes
- **Command**: `fts.optimize_indexes()`

**Issue**: FTS5 syntax errors
- **Solution**: Sanitize query input, escape special characters
- **Example**: Replace `"` with `""`

### Debug Mode

Enable debug logging:

```python
import logging

logging.getLogger('platform.core.fts').setLevel(logging.DEBUG)
```

## Migration from LIKE Queries

### Gradual Migration

The system supports both FTS and LIKE queries:

```python
# Try FTS first, fallback to LIKE
try:
    results = search_fts(db, query)
except Exception:
    results = search_like(db, query)  # Fallback
```

### A/B Testing

Compare performance and relevance:

```python
# FTS results
fts_results = search_fts(db, query, limit=50)
fts_time = measure_time()

# LIKE results
like_results = search_like(db, query, limit=50)
like_time = measure_time()

# Log metrics
log_search_metrics(query, fts_time, like_time)
```

## Advanced Features

### Custom Stop Words

```sql
CREATE VIRTUAL TABLE companies_fts USING fts5(
    ...,
    tokenize = 'porter unicode61 remove_diacritics 2'
);
```

### Phrase Matching

```python
# Exact phrase
results = search_fts(db, '"phase 3 trial"')

# Proximity
results = search_fts(db, 'NEAR(oncology therapy, 5)')
```

### Field Weighting

```sql
-- Boost ticker matches over description
CREATE VIRTUAL TABLE companies_fts USING fts5(
    ticker,
    name,
    description,
    rank = 'bm25(10.0, 5.0, 1.0)'
);
```

## See Also

- [Command Palette](./COMMAND_PALETTE.md)
- [API Integration](./API_INTEGRATION.md)
- [Database Schema](./ARCHITECTURE_OVERVIEW.md)
- [SQLite FTS5 Documentation](https://www.sqlite.org/fts5.html)

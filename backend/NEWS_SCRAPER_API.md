# News Scraper API Documentation

## Overview
The biotech terminal backend now includes 5 comprehensive news scrapers for real-time biotech and pharmaceutical industry news. All scrapers implement robust rate limiting, circuit breakers, retry logic, and caching to ensure reliability and respect for source sites.

## Scrapers

### 1. Fierce Biotech
**Description**: Biotech industry news, FDA approvals, clinical trials, and company updates.

**Rate Limit**: 0.5 req/sec (1 request every 2 seconds)  
**Cache TTL**: 1 hour  
**Features**:
- HTML parsing for article extraction
- Company mention detection
- Category and tag extraction
- Full article content scraping

**Endpoints**:
```
GET  /api/scraping/news/fierce-biotech/latest?limit=20
POST /api/scraping/news/fierce-biotech/search
```

**Example Request**:
```bash
# Get latest news
curl http://localhost:3001/api/scraping/news/fierce-biotech/latest?limit=10

# Search articles
curl -X POST http://localhost:3001/api/scraping/news/fierce-biotech/search \
  -H "Content-Type: application/json" \
  -d '{"query": "CAR-T therapy", "limit": 20}'
```

**Response Format**:
```json
{
  "status": "ok",
  "source": "Fierce Biotech",
  "data": [
    {
      "id": "article-slug",
      "title": "Article Title",
      "url": "https://www.fiercebiotech.com/...",
      "summary": "Brief summary...",
      "content": "Full article content...",
      "publishDate": "2024-01-15T10:30:00.000Z",
      "category": ["FDA", "Oncology"],
      "tags": ["CAR-T", "Cell Therapy"],
      "imageUrl": "https://...",
      "companies": ["Bristol Myers Squibb", "Gilead Sciences"]
    }
  ],
  "count": 10,
  "timestamp": "2024-01-15T12:00:00.000Z"
}
```

---

### 2. Science Daily
**Description**: Scientific research news focusing on biotechnology, health, medicine, and biology.

**Rate Limit**: 1 req/sec  
**Cache TTL**: 4 hours  
**Features**:
- RSS feed parsing (primary)
- HTML fallback for full articles
- Multiple category support
- Research source attribution

**Categories**: `biotechnology`, `health-medicine`, `biology`, `all`

**Endpoints**:
```
GET /api/scraping/news/science-daily/latest?limit=20
GET /api/scraping/news/science-daily/category/:category?limit=20
POST /api/scraping/news/science-daily/search
```

**Example Request**:
```bash
# Get latest biotech news
curl http://localhost:3001/api/scraping/news/science-daily/latest?limit=10

# Get by category
curl http://localhost:3001/api/scraping/news/science-daily/category/biotechnology?limit=15
```

**Response Format**:
```json
{
  "status": "ok",
  "source": "Science Daily",
  "category": "biotechnology",
  "data": [
    {
      "id": "article-id",
      "title": "New CRISPR technique...",
      "url": "https://www.sciencedaily.com/...",
      "summary": "Researchers have developed...",
      "publishDate": "2024-01-15T08:00:00.000Z",
      "category": ["Biotechnology", "Genetics"],
      "topics": ["CRISPR", "Gene Editing"],
      "source": "Stanford University",
      "imageUrl": "https://..."
    }
  ],
  "count": 10,
  "timestamp": "2024-01-15T12:00:00.000Z"
}
```

---

### 3. BioSpace
**Description**: Pharmaceutical industry news, job postings, company profiles, and press releases.

**Rate Limit**: 0.5 req/sec  
**Cache TTL**: 1 hour  
**Features**:
- News articles and press releases
- Job posting detection
- Company mention extraction
- Author attribution

**Endpoints**:
```
GET  /api/scraping/news/biospace/latest?limit=20
POST /api/scraping/news/biospace/search
```

**Example Request**:
```bash
# Get latest news
curl http://localhost:3001/api/scraping/news/biospace/latest?limit=10

# Search with type filter
curl -X POST http://localhost:3001/api/scraping/news/biospace/search \
  -H "Content-Type: application/json" \
  -d '{"query": "Pfizer", "type": "news", "limit": 15}'
```

**Types**: `news`, `press-release`, `jobs`, `companies`

**Response Format**:
```json
{
  "status": "ok",
  "source": "BioSpace",
  "data": [
    {
      "id": "article-id",
      "title": "Company announces...",
      "url": "https://www.biospace.com/...",
      "summary": "Brief description...",
      "publishDate": "2024-01-15T09:00:00.000Z",
      "category": ["Industry News"],
      "author": "John Smith",
      "companies": ["Pfizer Inc"],
      "type": "news"
    }
  ],
  "count": 10,
  "timestamp": "2024-01-15T12:00:00.000Z"
}
```

---

### 4. Endpoints News
**Description**: Biotech industry news with focus on FDA approvals, clinical trials, and M&A activity.

**Rate Limit**: 0.5 req/sec  
**Cache TTL**: 1 hour  
**Features**:
- Industry-focused news coverage
- Premium content detection
- FDA approval tracking
- Clinical trial updates
- M&A activity monitoring

**Endpoints**:
```
GET /api/scraping/news/endpoints/latest?limit=20
GET /api/scraping/news/endpoints/fda?limit=20
GET /api/scraping/news/endpoints/clinical-trials?limit=20
POST /api/scraping/news/endpoints/search
```

**Example Request**:
```bash
# Get latest news
curl http://localhost:3001/api/scraping/news/endpoints/latest?limit=10

# Get FDA-specific news
curl http://localhost:3001/api/scraping/news/endpoints/fda?limit=15

# Get clinical trial news
curl http://localhost:3001/api/scraping/news/endpoints/clinical-trials?limit=15
```

**Response Format**:
```json
{
  "status": "ok",
  "source": "Endpoints News",
  "category": "FDA",
  "data": [
    {
      "id": "article-id",
      "title": "FDA approves...",
      "url": "https://endpts.com/...",
      "summary": "The FDA has granted...",
      "publishDate": "2024-01-15T11:00:00.000Z",
      "category": ["FDA", "Approvals"],
      "tags": ["Oncology", "Breakthrough Therapy"],
      "author": "Jane Doe",
      "isPremium": false
    }
  ],
  "count": 10,
  "timestamp": "2024-01-15T12:00:00.000Z"
}
```

---

### 5. BioPharma Dive
**Description**: Pharmaceutical industry news, pipeline updates, and manufacturing insights.

**Rate Limit**: 0.5 req/sec  
**Cache TTL**: 1 hour  
**Features**:
- RSS feed parsing (primary)
- Pipeline update tracking
- M&A activity coverage
- Regulatory news
- Manufacturing insights

**Endpoints**:
```
GET /api/scraping/news/biopharma-dive/latest?limit=20
GET /api/scraping/news/biopharma-dive/pipeline?limit=20
GET /api/scraping/news/biopharma-dive/ma?limit=20
POST /api/scraping/news/biopharma-dive/search
```

**Example Request**:
```bash
# Get latest news
curl http://localhost:3001/api/scraping/news/biopharma-dive/latest?limit=10

# Get pipeline updates
curl http://localhost:3001/api/scraping/news/biopharma-dive/pipeline?limit=15

# Get M&A news
curl http://localhost:3001/api/scraping/news/biopharma-dive/ma?limit=15
```

**Response Format**:
```json
{
  "status": "ok",
  "source": "BioPharma Dive",
  "category": "Pipeline",
  "data": [
    {
      "id": "article-id",
      "title": "Pipeline update...",
      "url": "https://www.biopharmadive.com/...",
      "summary": "Company advances drug...",
      "publishDate": "2024-01-15T10:00:00.000Z",
      "category": ["Pipeline", "Clinical Trials"],
      "tags": ["Phase 3", "Oncology"]
    }
  ],
  "count": 10,
  "timestamp": "2024-01-15T12:00:00.000Z"
}
```

---

## Aggregated News Feed

**Endpoint**: `GET /api/scraping/news/all?limit=10`

**Description**: Fetches news from all 5 sources in parallel and returns an aggregated response.

**Example Request**:
```bash
curl http://localhost:3001/api/scraping/news/all?limit=10
```

**Response Format**:
```json
{
  "status": "ok",
  "data": {
    "fierceBiotech": [...],
    "scienceDaily": [...],
    "bioSpace": [...],
    "endpoints": [...],
    "bioPharmDive": [...]
  },
  "totalCount": 50,
  "sources": 5,
  "timestamp": "2024-01-15T12:00:00.000Z"
}
```

---

## Health Monitoring

**Endpoint**: `GET /api/scraping/health`

**Description**: Returns health status for all scrapers including rate limiter stats and circuit breaker states.

**Example Request**:
```bash
curl http://localhost:3001/api/scraping/health
```

**Response Format**:
```json
{
  "status": "ok",
  "scrapers": {
    "fierceBiotech": {
      "status": "healthy",
      "lastCheck": 1705320000000,
      "stats": {
        "cache": { "size": 45, "hits": 120, "misses": 45 },
        "rateLimiter": { "currentRate": 0.5, "errorRate": 0.0 }
      }
    },
    "scienceDaily": { ... },
    "bioSpace": { ... },
    "endpointsNews": { ... },
    "bioPharmDive": { ... }
  },
  "timestamp": "2024-01-15T12:00:00.000Z"
}
```

---

## Statistics

**Endpoint**: `GET /api/scraping/stats`

**Description**: Detailed statistics for all scrapers including cache performance, rate limiting, and circuit breaker metrics.

**Example Request**:
```bash
curl http://localhost:3001/api/scraping/stats
```

---

## Cache Management

**Clear All Caches**: `POST /api/scraping/cache/clear`

**Example**:
```bash
curl -X POST http://localhost:3001/api/scraping/cache/clear
```

---

## Rate Limiting Strategy

All scrapers implement adaptive rate limiting to ensure:
1. **Respect for source sites**: Conservative default rates
2. **Automatic backoff**: Rate decreases on errors
3. **Recovery**: Rate increases after successful requests
4. **Circuit breakers**: Automatic failover on repeated failures

### Default Rate Limits
| Scraper | Rate | Reason |
|---------|------|--------|
| Fierce Biotech | 0.5 req/s | Site protection |
| Science Daily | 1 req/s | RSS feed friendly |
| BioSpace | 0.5 req/s | Site protection |
| Endpoints News | 0.5 req/s | Site protection |
| BioPharma Dive | 0.5 req/s | Site protection |

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error description",
  "message": "Detailed error message",
  "timestamp": "2024-01-15T12:00:00.000Z"
}
```

**HTTP Status Codes**:
- `200`: Success
- `400`: Invalid request parameters
- `404`: Resource not found
- `500`: Server error (scraping failure, rate limit exceeded, etc.)

---

## Best Practices

1. **Use caching**: Most requests are cached for 1-4 hours
2. **Implement client-side rate limiting**: Don't hammer the endpoints
3. **Handle errors gracefully**: Scrapers may be temporarily down
4. **Use the aggregated endpoint** for dashboard views
5. **Monitor health endpoint** for system status
6. **Respect the rate limits** in your application

---

## Development & Testing

### Initialize Scraping Manager
```typescript
import { initializeScrapingManager } from './scraping';

const manager = await initializeScrapingManager({
  pubmedApiKey: process.env.PUBMED_API_KEY,
  fdaApiKey: process.env.FDA_API_KEY,
});
```

### Access Individual Scrapers
```typescript
const fierceBiotech = manager.getFierceBiotechScraper();
const articles = await fierceBiotech.getLatestNews(20);
```

### Test Endpoints Locally
```bash
# Start backend
cd backend
npm run dev

# Test endpoint
curl http://localhost:3001/api/scraping/news/all?limit=5
```

---

## Production Deployment

### Environment Variables
```bash
# Optional API keys for enhanced rate limits
PUBMED_API_KEY=your_key_here
FDA_API_KEY=your_key_here
```

### Monitoring
- Use `/api/scraping/health` for health checks
- Use `/api/scraping/metrics` for Prometheus metrics
- Monitor circuit breaker states
- Track rate limiter performance

---

## License & Compliance

All scrapers are designed to:
- Respect `robots.txt` policies
- Implement conservative rate limiting
- Cache aggressively to minimize requests
- Be fully open-source and deployable

**License**: MIT (same as parent project)

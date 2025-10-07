# News Scraping Infrastructure

Comprehensive biotech and pharmaceutical news aggregation from multiple premium sources.

## 🚀 Available Scrapers

### 1. Fierce Biotech
**Source**: https://www.fiercebiotech.com  
**Rate Limit**: 1 request per 2 seconds (0.5 req/s)  
**Cache TTL**: 30 minutes

Premium biotech industry news covering drug development, clinical trials, and company announcements.

#### Features
- Latest news articles
- Category-based filtering (drug discovery, clinical, regulatory, manufacturing)
- Full-text search
- Tag extraction
- Author attribution

#### API Endpoints
```bash
# Get latest articles
GET /api/scraping/news/fierce-biotech/latest?maxResults=20

# Search articles
POST /api/scraping/news/fierce-biotech/search
{
  "query": "CAR-T therapy",
  "maxResults": 20,
  "sortBy": "date"
}

# Get by category
GET /api/scraping/news/fierce-biotech/category/drug-discovery?maxResults=20
```

---

### 2. Science Daily
**Source**: https://www.sciencedaily.com  
**Rate Limit**: 1 request per 2 seconds (0.5 req/s)  
**Cache TTL**: 30 minutes

Scientific breakthroughs, research discoveries, and health news.

#### Features
- Top stories
- Health & medicine news
- Biotechnology news
- Category-based filtering
- Source attribution
- Date filtering

#### API Endpoints
```bash
# Get top stories
GET /api/scraping/news/science-daily/top?maxResults=10

# Get health news
GET /api/scraping/news/science-daily/health?maxResults=20

# Get biotech news
GET /api/scraping/news/science-daily/biotech?maxResults=20

# Search articles
POST /api/scraping/news/science-daily/search
{
  "query": "immunotherapy",
  "category": "health",
  "maxResults": 20,
  "dateFrom": "2024-01-01"
}
```

---

### 3. BioSpace
**Source**: https://www.biospace.com  
**Rate Limit**: 1 request per 2 seconds (0.5 req/s)  
**Cache TTL**: 30 minutes

Biotech and pharmaceutical industry news with company tracking.

#### Features
- Latest industry news
- Company-specific news tracking
- Category filtering (industry, careers, clinical trials, drug development)
- Search functionality
- Tag extraction

#### API Endpoints
```bash
# Get latest news
GET /api/scraping/news/biospace/latest?maxResults=20

# Get company news
GET /api/scraping/news/biospace/company/Moderna?maxResults=20

# Search articles
POST /api/scraping/news/biospace/search
{
  "query": "mRNA vaccine",
  "category": "drug-development",
  "maxResults": 20
}
```

---

### 4. Endpoints News
**Source**: https://endpts.com  
**Rate Limit**: 1 request per 2 seconds (0.5 req/s)  
**Cache TTL**: 30 minutes

Premium biotech journalism covering dealmaking, R&D, and regulation.

#### Features
- Latest news
- Dealmaking coverage
- R&D news
- Regulatory updates
- Premium content flagging
- Search functionality

#### API Endpoints
```bash
# Get latest articles
GET /api/scraping/news/endpoints/latest?maxResults=20

# Get dealmaking news
GET /api/scraping/news/endpoints/dealmaking?maxResults=20

# Get R&D news
GET /api/scraping/news/endpoints/r-d?maxResults=20

# Get regulatory news
GET /api/scraping/news/endpoints/regulation?maxResults=20

# Search articles
POST /api/scraping/news/endpoints/search
{
  "query": "FDA approval",
  "maxResults": 20
}
```

---

## 🔄 Aggregated Endpoints

### Get All News
Fetch news from all sources in parallel:

```bash
GET /api/scraping/news/all?maxResults=10
```

**Response:**
```json
{
  "success": true,
  "count": 40,
  "sources": {
    "fierceBiotech": {
      "count": 10,
      "articles": [...]
    },
    "scienceDaily": {
      "count": 10,
      "articles": [...]
    },
    "bioSpace": {
      "count": 10,
      "articles": [...]
    },
    "endpoints": {
      "count": 10,
      "articles": [...]
    }
  },
  "timestamp": "2024-01-15T12:00:00.000Z"
}
```

### Health Check
Monitor scraper status:

```bash
GET /api/scraping/news/health
```

**Response:**
```json
{
  "success": true,
  "health": {
    "fierceBiotech": {
      "status": "healthy",
      "circuitBreaker": { "state": "CLOSED", "stats": {...} },
      "rateLimiter": { "currentRate": 0.5, "errorRate": 0 },
      "cache": { "size": 15, "hitRate": 0.85 }
    },
    "scienceDaily": { "status": "healthy", ... },
    "bioSpace": { "status": "healthy", ... },
    "endpoints": { "status": "healthy", ... }
  }
}
```

---

## 📊 Data Models

### Article Structure

All scrapers return articles with a consistent structure:

```typescript
interface Article {
  id: string;                    // Unique identifier
  title: string;                 // Article title
  url: string;                   // Full URL
  author: string;                // Author name
  publishedDate: string;         // ISO 8601 date
  summary: string;               // Article excerpt/summary
  category: string;              // Article category
  tags: string[];                // Topic tags
  imageUrl?: string;             // Featured image URL
  
  // Source-specific fields
  company?: string;              // BioSpace only
  isPremium?: boolean;           // Endpoints News only
  source?: string;               // Science Daily only
  content?: string;              // Full content (if available)
}
```

---

## 🛡️ Rate Limiting & Resilience

### Rate Limiting Strategy

All scrapers implement **adaptive rate limiting**:

- **Default Rate**: 0.5 requests/second (1 request per 2 seconds)
- **Min Rate**: 0.25 requests/second (fallback if errors occur)
- **Max Rate**: 1 request/second (maximum allowed)
- **Automatic Adjustment**: Rate decreases on errors, increases on success

### Circuit Breaker Pattern

Each scraper has a circuit breaker to prevent cascading failures:

- **Failure Threshold**: 5 consecutive failures
- **Reset Timeout**: 2 minutes
- **States**: CLOSED (healthy), OPEN (failing), HALF_OPEN (testing recovery)

### Retry Mechanism

Failed requests are retried with exponential backoff:

- **Max Attempts**: 3
- **Initial Delay**: 1 second
- **Max Delay**: 5 seconds
- **Factor**: 2x
- **Jitter**: Yes (prevents thundering herd)

### Caching

All scrapers implement LRU caching:

- **Default TTL**: 30 minutes
- **Max Size**: 200 entries per scraper
- **Cache Keys**: Based on query parameters

---

## 🔧 Usage Examples

### TypeScript/JavaScript

```typescript
import { getScrapingManager } from './scraping/scraping-manager';

// Initialize the scraping manager
const manager = getScrapingManager();

// Get Fierce Biotech scraper
const fierceBiotech = manager.getFierceBiotechScraper();

// Fetch latest articles
const articles = await fierceBiotech.getLatestNews(20);

// Search for specific topics
const searchResults = await fierceBiotech.searchArticles({
  query: 'gene therapy',
  maxResults: 20,
});

// Get health status
const health = fierceBiotech.getHealth();
console.log('Scraper status:', health.status);
console.log('Circuit breaker state:', health.circuitBreaker.state);
```

### Python Integration

```python
# Use the Python orchestrator to call TypeScript scrapers
from backend.python_scrapers.data_orchestrator import DataOrchestrator

orchestrator = DataOrchestrator()

# This will call the Node.js backend which runs the TypeScript scrapers
result = orchestrator.run_scraper('fierce_biotech')
```

### cURL Examples

```bash
# Get latest Fierce Biotech news
curl -X GET "http://localhost:3001/api/scraping/news/fierce-biotech/latest?maxResults=10"

# Search Science Daily
curl -X POST "http://localhost:3001/api/scraping/news/science-daily/search" \
  -H "Content-Type: application/json" \
  -d '{"query": "cancer research", "maxResults": 20}'

# Get aggregated news from all sources
curl -X GET "http://localhost:3001/api/scraping/news/all?maxResults=5"

# Check scraper health
curl -X GET "http://localhost:3001/api/scraping/news/health"
```

---

## 🔐 Best Practices

### 1. Respect Rate Limits
All scrapers are configured with conservative rate limits to respect source servers. Do not attempt to bypass these limits.

### 2. Use Caching
Leverage the built-in caching to reduce load on source servers:

```typescript
// Cache is automatically used, but you can clear it if needed
scraper.clearCache();
```

### 3. Handle Errors Gracefully
Always implement error handling:

```typescript
try {
  const articles = await scraper.getLatestNews(20);
} catch (error) {
  console.error('Scraping failed:', error);
  // Fall back to cached data or show error to user
}
```

### 4. Monitor Health
Regularly check scraper health:

```typescript
const health = await manager.getHealth();

if (health.fierceBiotech.status !== 'healthy') {
  console.warn('Fierce Biotech scraper is degraded');
  // Consider using alternative sources
}
```

### 5. Batch Requests
For multiple sources, use parallel requests:

```typescript
const [fierce, science, bio, endpoints] = await Promise.allSettled([
  fierceBiotech.getLatestNews(10),
  scienceDaily.getTopStories(10),
  bioSpace.getLatestNews(10),
  endpointsNews.getLatestNews(10),
]);
```

---

## 🚦 Performance Metrics

Expected performance characteristics:

- **Response Time**: 200-500ms (cached), 2-5s (fresh)
- **Throughput**: 0.5-1 req/s per scraper
- **Cache Hit Rate**: 70-90% (typical)
- **Uptime**: 99%+ (with circuit breaker protection)

---

## 📝 Contributing

### Adding New Scrapers

To add a new biotech news scraper:

1. Create scraper file: `backend/src/scraping/my-scraper.ts`
2. Implement the scraper class following the pattern:
   - Use `CircuitBreaker`, `AdaptiveRateLimiter`, `LRUCache`
   - Implement `getHealth()` method
   - Add retry logic with exponential backoff
3. Add to `ScrapingManager` in `scraping-manager.ts`
4. Export from `index.ts`
5. Add routes to `routes/news-scraping.ts`
6. Update this documentation

### Testing Scrapers

```bash
# Run TypeScript type checking
npm run typecheck

# Run tests (when available)
npm test

# Manual testing
npm run dev
curl http://localhost:3001/api/scraping/news/health
```

---

## 📚 Related Documentation

- [Scraping Infrastructure Overview](./SCRAPING_INFRASTRUCTURE.md)
- [Rate Limiting Details](./backend/src/scraping/rate-limiter.ts)
- [Circuit Breaker Pattern](./backend/src/scraping/circuit-breaker.ts)
- [Retry Mechanisms](./backend/src/scraping/retry.ts)

---

## ⚠️ Legal & Ethical Considerations

**Important**: This scraping infrastructure is designed for:
- ✅ Personal research and development
- ✅ Educational purposes
- ✅ Fair use under copyright law
- ✅ Respectful, rate-limited crawling

**Do not use for:**
- ❌ Commercial republication of content
- ❌ Circumventing paywalls
- ❌ High-frequency scraping that impacts source servers
- ❌ Violating terms of service

Always review and comply with each source's terms of service and robots.txt policies.

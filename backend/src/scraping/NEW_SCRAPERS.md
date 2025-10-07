# New Biotech News Scrapers Documentation (v2.0)

## Overview

Five new scrapers have been added to comprehensively cover biotech industry news, research, jobs, and market intelligence.

## New Scrapers

### 1. Fierce Biotech Scraper

**File**: `fierce-biotech-scraper.ts`

**Purpose**: Biotech industry news and analysis from Fierce Biotech

**Rate Limit**: 0.5 req/s (1 request per 2 seconds) - Very conservative to respect site

**Key Features**:
- HTML parsing with Cheerio
- Article metadata extraction (title, summary, author, tags)
- Category filtering
- Search functionality
- 4-hour cache TTL

**API Endpoints**:
```
GET /api/scraping/fierce-biotech/latest?maxResults=20
GET /api/scraping/fierce-biotech/search?q=query&maxResults=20
```

**Example**:
```bash
curl http://localhost:3001/api/scraping/fierce-biotech/latest?maxResults=10
```

---

### 2. Science Daily Scraper

**File**: `science-daily-scraper.ts`

**Purpose**: Scientific research news with RSS feed parsing

**Rate Limit**: 1 req/s

**Key Features**:
- RSS feed parsing with xml2js
- HTML fallback for full article content
- Category filtering (biotechnology, genetics, biochemistry, medical)
- Date-based filtering
- Image extraction

**API Endpoints**:
```
GET /api/scraping/science-daily/latest?category=biotechnology&maxResults=20
GET /api/scraping/science-daily/biotech?maxResults=50
```

**Categories**:
- `biotechnology`
- `genetics`
- `biochemistry`
- `medical`

**Example**:
```bash
curl http://localhost:3001/api/scraping/science-daily/latest?category=genetics
```

---

### 3. BioSpace Scraper

**File**: `biospace-scraper.ts`

**Purpose**: Pharma news, job postings, and company information

**Rate Limit**: 1 req/s

**Key Features**:
- News articles and press releases
- Job posting extraction with location/query filters
- Company information lookup
- Multiple content types (news, press-release, job, company)

**API Endpoints**:
```
GET /api/scraping/biospace/news?maxResults=20
GET /api/scraping/biospace/jobs?q=scientist&location=boston&maxResults=20
GET /api/scraping/biospace/press-releases?maxResults=20
```

**Example**:
```bash
# Get job postings
curl "http://localhost:3001/api/scraping/biospace/jobs?q=bioinformatics&location=california"

# Get press releases
curl http://localhost:3001/api/scraping/biospace/press-releases
```

---

### 4. BioPharm Dive Scraper

**File**: `biopharmdive-scraper.ts`

**Purpose**: Industry news, pipeline updates, and M&A tracking

**Rate Limit**: 1 req/s

**Key Features**:
- Industry news and analysis
- Pipeline updates with drug/company/phase extraction
- M&A activity tracking with deal value extraction
- Regulatory news
- Intelligent entity extraction (drug names, companies, phases)

**API Endpoints**:
```
GET /api/scraping/biopharmdive/news?type=analysis&maxResults=20
GET /api/scraping/biopharmdive/pipeline?maxResults=20
GET /api/scraping/biopharmdive/ma?maxResults=20
```

**Article Types**:
- `news` - General industry news
- `analysis` - In-depth analysis
- `pipeline` - Drug pipeline updates
- `ma` - M&A activity
- `regulatory` - Regulatory news

**Example**:
```bash
# Get pipeline updates
curl http://localhost:3001/api/scraping/biopharmdive/pipeline?maxResults=15

# Get M&A activity
curl http://localhost:3001/api/scraping/biopharmdive/ma
```

---

### 5. Endpoints News Scraper

**File**: `endpoints-news-scraper.ts`

**Purpose**: Biotech news, FDA approvals, and clinical trials

**Rate Limit**: 1 req/s

**Key Features**:
- Biotech industry news
- FDA approval tracking with approval type classification
- Clinical trial updates
- Financing and pipeline news
- Company tagging

**API Endpoints**:
```
GET /api/scraping/endpoints-news/latest?type=fda&maxResults=20
GET /api/scraping/endpoints-news/fda-approvals?maxResults=20
GET /api/scraping/endpoints-news/clinical-trials?maxResults=20
```

**Article Types**:
- `news` - General biotech news
- `fda-approval` - FDA approval announcements
- `clinical-trial` - Clinical trial updates
- `financing` - Funding and financing news
- `pipeline` - Pipeline updates

**Approval Types Detected**:
- Accelerated Approval
- Breakthrough Designation
- Orphan Drug
- Priority Review
- Standard Approval

**Example**:
```bash
# Get FDA approvals
curl http://localhost:3001/api/scraping/endpoints-news/fda-approvals?maxResults=10

# Get clinical trial news
curl http://localhost:3001/api/scraping/endpoints-news/clinical-trials
```

---

## Aggregated News Feed

**Endpoint**: `GET /api/scraping/news/aggregated`

Fetches news from all 5 new scrapers in parallel and combines them, sorted by published date.

**Parameters**:
- `maxResults` - Max results per source (default: 10)

**Example**:
```bash
curl http://localhost:3001/api/scraping/news/aggregated?maxResults=5
```

**Response**:
```json
{
  "status": "ok",
  "data": [
    {
      "id": "abc123",
      "title": "Company X Announces Phase 3 Results",
      "summary": "...",
      "url": "...",
      "publishedDate": "2024-01-15T14:00:00Z",
      "source": "Fierce Biotech",
      "tags": ["phase-3", "oncology"]
    }
  ],
  "count": 25,
  "sources": {
    "fierceBiotech": 5,
    "scienceDaily": 5,
    "bioSpace": 5,
    "bioPharmDive": 5,
    "endpointsNews": 5
  }
}
```

---

## Common Patterns

All new scrapers follow the same architecture:

### Constructor Pattern
```typescript
constructor() {
  this.client = axios.create({ /* ... */ });
  this.circuitBreaker = new CircuitBreaker(name, config);
  this.rateLimiter = new AdaptiveRateLimiter(config);
  this.cache = new LRUCache(config);
}
```

### Main Query Method
```typescript
async getLatestNews(params: SearchParams): Promise<Article[]> {
  // 1. Check cache
  const cached = this.cache.get(cacheKey);
  if (cached) return cached;

  // 2. Wait for rate limit
  await this.rateLimiter.waitForLimit();

  // 3. Execute with circuit breaker
  const articles = await this.circuitBreaker.execute(async () => {
    return this.fetchArticles(params);
  });

  // 4. Cache and return
  this.cache.set(cacheKey, articles);
  this.rateLimiter.recordSuccess();
  return articles;
}
```

### HTML Parsing
All scrapers use Cheerio for HTML parsing:
```typescript
private parseArticlesHTML(html: string, maxResults: number): Article[] {
  const $ = cheerio.load(html);
  const articles: Article[] = [];

  $('article, .article-item').slice(0, maxResults).each((_, element) => {
    // Extract data
  });

  return articles;
}
```

### RSS Parsing (Science Daily)
```typescript
private async parseRSS(xml: string): Promise<Article[]> {
  const parsed = await parseStringPromise(xml);
  const items = parsed.rss?.channel?.item || [];
  // Process items
}
```

---

## Configuration

Set rate limits via environment variables in `.env`:

```bash
FIERCE_BIOTECH_RATE_LIMIT=0.5
SCIENCE_DAILY_RATE_LIMIT=1
BIOSPACE_RATE_LIMIT=1
BIOPHARMDIVE_RATE_LIMIT=1
ENDPOINTS_NEWS_RATE_LIMIT=1

SCRAPER_CACHE_TTL=14400000  # 4 hours
```

---

## Health Monitoring

Check scraper health:
```bash
curl http://localhost:3001/api/scraping/health
```

All new scrapers are included in health monitoring with:
- Circuit breaker state
- Rate limiter statistics
- Cache performance metrics
- Error rates

---

## Integration with ScrapingManager

The ScrapingManager orchestrates all scrapers:

```typescript
const manager = getScrapingManager();

// Access individual scrapers
const fierceBiotech = manager.getFierceBiotechScraper();
const scienceDaily = manager.getScienceDailyScraper();
const bioSpace = manager.getBioSpaceScraper();
const bioPharmDive = manager.getBioPharmDiveScraper();
const endpointsNews = manager.getEndpointsNewsScraper();

// Get aggregated health
const health = await manager.getHealth();

// Get statistics
const stats = manager.getStats();

// Clear all caches
manager.clearAllCaches();
```

---

## Rate Limiting Philosophy

**Conservative Defaults**: All scrapers use conservative rate limits by default to ensure:
- Respect for site policies
- Open-source viability
- Reliable long-term operation
- No risk of IP bans

**Adaptive Behavior**: Rate limiters automatically:
- Reduce rate on errors (backoff factor: 0.5)
- Increase rate on success (recovery factor: 1.2)
- Stay within configured min/max bounds

**Recommended Approach**:
1. Start with defaults
2. Monitor health endpoint for degraded status
3. Adjust only if necessary
4. Always respect robots.txt

---

## Error Handling

All scrapers implement:

1. **Retry with Exponential Backoff**: Network errors automatically retry
2. **Circuit Breaker**: Prevents cascading failures
3. **Graceful Degradation**: Returns cached data when possible
4. **Comprehensive Logging**: All errors logged with context
5. **Health Monitoring**: Automatic health status updates

---

## Testing

Quick test all new scrapers:

```bash
# Fierce Biotech
curl http://localhost:3001/api/scraping/fierce-biotech/latest?maxResults=5

# Science Daily
curl http://localhost:3001/api/scraping/science-daily/biotech?maxResults=5

# BioSpace
curl http://localhost:3001/api/scraping/biospace/news?maxResults=5
curl http://localhost:3001/api/scraping/biospace/jobs?q=scientist&maxResults=5

# BioPharm Dive
curl http://localhost:3001/api/scraping/biopharmdive/pipeline?maxResults=5
curl http://localhost:3001/api/scraping/biopharmdive/ma?maxResults=5

# Endpoints News
curl http://localhost:3001/api/scraping/endpoints-news/fda-approvals?maxResults=5

# Aggregated
curl http://localhost:3001/api/scraping/news/aggregated?maxResults=3
```

---

## Performance

**Cache Hit Ratios**: Monitor via stats endpoint
- Target: >80% hit ratio for repeated queries
- 4-hour TTL balances freshness vs load

**Parallel Fetching**: Aggregated endpoint uses `Promise.all()` for parallel requests

**Rate Limiting**: Adaptive rate limiting prevents overload while maximizing throughput

---

## Future Enhancements

Potential future additions:
- [ ] WebSocket real-time updates
- [ ] Automatic robots.txt checking
- [ ] Enhanced NLP for entity extraction
- [ ] Sentiment analysis
- [ ] Alert system for critical news
- [ ] GraphQL API
- [ ] Pagination support for large result sets

---

## License

MIT License - All scraper code is open-source and deployment-ready.

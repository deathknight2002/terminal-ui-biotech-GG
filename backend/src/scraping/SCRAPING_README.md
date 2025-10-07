# Biotech Terminal - Scraping Infrastructure

## Overview

The Biotech Terminal backend features a robust, production-ready scraping infrastructure designed for reliability, scalability, and compliance with rate limits. The system aggregates real-time data from multiple biotech and pharmaceutical sources while respecting site policies and maintaining high availability.

## Architecture

### Core Components

1. **Scraping Manager** (`scraping-manager.ts`)
   - Orchestrates all scraping operations
   - Health monitoring and metrics
   - Centralized cache and circuit breaker management
   - Event-driven architecture

2. **Rate Limiting** (`rate-limiter.ts`)
   - Adaptive rate limiting with automatic backoff
   - Token bucket algorithm
   - Per-scraper configuration
   - Error-based rate adjustment

3. **Circuit Breakers** (`circuit-breaker.ts`)
   - Automatic failover on repeated failures
   - Configurable thresholds and reset timeouts
   - State tracking (CLOSED, OPEN, HALF_OPEN)
   - Health status reporting

4. **Retry Logic** (`retry.ts`)
   - Exponential backoff with jitter
   - Configurable retry patterns
   - Timeout handling
   - Batch retry support

5. **LRU Cache** (`lru-cache.ts`)
   - Memory-efficient caching
   - TTL-based expiration
   - Multi-tier cache support
   - Hit/miss statistics

6. **Worker Pool** (`worker-pool.ts`)
   - Parallel scraping execution
   - CPU-aware worker management
   - Task queuing and prioritization

7. **Performance Monitor** (`performance-monitor.ts`)
   - Real-time metrics collection
   - Prometheus export format
   - Endpoint health tracking
   - Performance snapshots

## Data Sources

### Medical & Research Data
- **PubMed** - Medical literature and research articles
- **FDA** - Drug approvals, adverse events, recalls
- **ClinicalTrials.gov** - Clinical trial information

### Industry News
- **Fierce Biotech** - Biotech industry news and updates
- **Science Daily** - Scientific research news
- **BioSpace** - Pharmaceutical news and job postings
- **Endpoints News** - FDA approvals, clinical trials, M&A
- **BioPharma Dive** - Pipeline updates and industry insights

## Features

### Robustness
✅ Circuit breakers prevent cascade failures  
✅ Automatic retry with exponential backoff  
✅ Graceful degradation on partial failures  
✅ Health checks and self-healing  
✅ Request timeout handling  

### Performance
✅ Aggressive caching (1-4 hour TTL)  
✅ Parallel request execution  
✅ Worker pool for CPU-intensive tasks  
✅ Connection pooling (HTTP/2 support)  
✅ Streaming data processing  

### Compliance
✅ Conservative rate limiting (0.25-1 req/s)  
✅ Respects robots.txt policies  
✅ User-Agent identification  
✅ No credential requirements (open-source ready)  
✅ Ethical scraping practices  

### Monitoring
✅ Real-time health status  
✅ Prometheus metrics export  
✅ Cache hit/miss statistics  
✅ Rate limiter performance tracking  
✅ Circuit breaker state monitoring  

## Rate Limits

All scrapers implement adaptive rate limiting to ensure reliability and respect for source sites:

| Source | Default Rate | Window | Adaptive |
|--------|-------------|--------|----------|
| PubMed | 3 req/s (10 with API key) | - | ✅ |
| FDA | 40 req/min (240 with API key) | 60s | ✅ |
| ClinicalTrials.gov | 10 req/s | - | ✅ |
| Fierce Biotech | 0.5 req/s | - | ✅ |
| Science Daily | 1 req/s | - | ✅ |
| BioSpace | 0.5 req/s | - | ✅ |
| Endpoints News | 0.5 req/s | - | ✅ |
| BioPharma Dive | 0.5 req/s | - | ✅ |

**Adaptive Rate Limiting**: Rates automatically decrease on errors and increase after successful requests.

## Cache Strategy

Different cache TTLs based on data volatility:

| Data Type | TTL | Reason |
|-----------|-----|--------|
| News articles | 1-4 hours | Frequent updates |
| PubMed articles | 1 hour | Static content |
| FDA approvals | 1 hour | Infrequent changes |
| Clinical trials | 2 hours | Daily updates |

## Circuit Breaker Configuration

| Parameter | Value | Description |
|-----------|-------|-------------|
| Failure Threshold | 5 | Failures before opening |
| Success Threshold | 2 | Successes to close |
| Reset Timeout | 60s | Time before retry |
| Half-Open Timeout | 30s | Test request timeout |

## API Integration

### Initialize Scraping Manager

```typescript
import { initializeScrapingManager } from './scraping';

const manager = await initializeScrapingManager({
  pubmedApiKey: process.env.PUBMED_API_KEY,  // Optional
  fdaApiKey: process.env.FDA_API_KEY,        // Optional
});

await manager.initialize();
```

### Access Individual Scrapers

```typescript
// Medical data scrapers
const pubmed = manager.getPubMedScraper();
const fda = manager.getFDAScraper();
const clinicalTrials = manager.getClinicalTrialsScraper();

// News scrapers
const fierceBiotech = manager.getFierceBiotechScraper();
const scienceDaily = manager.getScienceDailyScraper();
const bioSpace = manager.getBioSpaceScraper();
const endpoints = manager.getEndpointsNewsScraper();
const bioPharmDive = manager.getBioPharmDiveScraper();
```

### Fetch Data

```typescript
// Get latest biotech news
const news = await fierceBiotech.getLatestNews(20);

// Search PubMed
const articles = await pubmed.search({
  query: 'CRISPR gene therapy',
  maxResults: 50,
  sortBy: 'date'
});

// Get clinical trials
const trials = await clinicalTrials.searchByDrug('pembrolizumab', 100);
```

### Monitor Health

```typescript
// Get health status
const health = await manager.getHealth();
console.log('PubMed status:', health.pubmed.status);

// Get statistics
const stats = manager.getStats();
console.log('Cache hits:', stats.pubmed.cache.hits);

// Listen for events
manager.on('health:change', (event) => {
  console.log(`${event.service} circuit breaker: ${event.newState}`);
});
```

### Cache Management

```typescript
// Clear all caches
manager.clearAllCaches();

// Clear specific scraper cache
pubmed.clearCache();

// Reset circuit breakers
manager.resetCircuitBreakers();
```

## Deployment

### Development

```bash
cd backend
npm install
npm run dev
```

### Production

```bash
# Build
npm run build

# Start
NODE_ENV=production npm start
```

### Environment Variables

```bash
# Optional API keys (increases rate limits)
PUBMED_API_KEY=your_ncbi_api_key
FDA_API_KEY=your_fda_api_key

# Server configuration
API_PORT=3001
NODE_ENV=production

# Cache configuration
CACHE_TTL=3600
CACHE_MAX_SIZE=1000
```

### Docker Deployment

```dockerfile
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --production

COPY . .
RUN npm run build

EXPOSE 3001
CMD ["npm", "start"]
```

## Monitoring & Observability

### Health Check Endpoint
```bash
curl http://localhost:3001/api/scraping/health
```

### Prometheus Metrics
```bash
curl http://localhost:3001/api/scraping/metrics
```

### Statistics Dashboard
```bash
curl http://localhost:3001/api/scraping/stats
```

### Key Metrics to Monitor

1. **Scraper Health**
   - Circuit breaker states
   - Error rates
   - Response times

2. **Cache Performance**
   - Hit ratio
   - Memory usage
   - Eviction rate

3. **Rate Limiting**
   - Current rates
   - Throttle events
   - Backoff occurrences

4. **Worker Pool**
   - Active workers
   - Queue depth
   - Task completion rate

## Error Handling

The scraping infrastructure implements comprehensive error handling:

### Automatic Recovery
- Circuit breakers open on failures
- Exponential backoff on retries
- Graceful degradation
- Cache fallback

### Error Types
1. **Network Errors** - Retry with backoff
2. **Rate Limit Errors** - Automatic throttling
3. **Parse Errors** - Logged and skipped
4. **Timeout Errors** - Circuit breaker activation

### Logging
All scrapers log to Winston with structured logging:
```typescript
logger.info('🔥 Fierce Biotech: 20 articles fetched');
logger.error('❌ PubMed search error:', error);
logger.warn('⚠️ Circuit breaker opened: pubmed');
```

## Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

### Manual Testing
```bash
# Test individual scraper
curl http://localhost:3001/api/scraping/news/fierce-biotech/latest?limit=5

# Test aggregated endpoint
curl http://localhost:3001/api/scraping/news/all?limit=10

# Test health
curl http://localhost:3001/api/scraping/health
```

## Performance Optimization

### Caching Strategy
- Aggressive caching with appropriate TTLs
- Cache warming on startup
- Stale-while-revalidate pattern

### Connection Management
- HTTP/2 connection pooling
- Keep-alive connections
- Request pipelining

### Parallel Execution
- Worker pool for CPU-intensive tasks
- Parallel scraper execution
- Batch processing support

### Memory Management
- LRU cache with size limits
- Garbage collection optimization
- Stream processing for large data

## Security Considerations

### Data Privacy
✅ No user data collection  
✅ No authentication required  
✅ Public data sources only  

### Rate Limiting
✅ Prevents abuse  
✅ Protects source sites  
✅ Automatic backoff  

### Error Handling
✅ No sensitive data in logs  
✅ Sanitized error messages  
✅ Secure defaults  

## Roadmap

### Planned Enhancements
- [ ] WebSocket streaming for real-time updates
- [ ] Database caching layer (Redis/PostgreSQL)
- [ ] Machine learning for article classification
- [ ] Sentiment analysis on news articles
- [ ] Entity extraction (companies, drugs, indications)
- [ ] GraphQL API
- [ ] Elasticsearch integration for full-text search

### Additional Data Sources
- [ ] STAT News
- [ ] GEN (Genetic Engineering & Biotechnology News)
- [ ] Nature Biotechnology
- [ ] BioCentury
- [ ] Scrip Intelligence

## Contributing

Contributions are welcome! Please follow these guidelines:

1. **Scraper Pattern**: Use the existing scraper pattern (CircuitBreaker + RateLimiter + Cache)
2. **Rate Limits**: Implement conservative rate limits
3. **Testing**: Add unit tests for new scrapers
4. **Documentation**: Update API documentation
5. **Logging**: Use structured logging with emojis

## License

MIT License - See LICENSE file for details

## Support

For issues, questions, or contributions:
- GitHub Issues: [terminal-ui-biotech-GG/issues](https://github.com/deathknight2002/terminal-ui-biotech-GG/issues)
- Documentation: [NEWS_SCRAPER_API.md](./NEWS_SCRAPER_API.md)
- API Reference: [SCRAPING_INFRASTRUCTURE.md](../SCRAPING_INFRASTRUCTURE.md)

---

**Built with ❤️ for the biotech community**

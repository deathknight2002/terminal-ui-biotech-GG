# Biotech Terminal Backend - Expanded Scraper System

## 🎉 What's New

The backend has been **massively upgraded** with 5 new biotech news scrapers, bringing the total to **8 comprehensive data sources** for real-time biotech and pharmaceutical intelligence.

## 📊 Data Sources

### Medical & Research (Existing)
- ✅ **PubMed** - Medical literature and research articles
- ✅ **FDA** - Drug approvals, adverse events, recalls
- ✅ **ClinicalTrials.gov** - Clinical trial information

### Industry News (NEW! 🆕)
- 🔥 **Fierce Biotech** - Biotech industry news and updates
- 🔬 **Science Daily** - Scientific research news (RSS)
- 🧬 **BioSpace** - Pharmaceutical news and job postings
- 📰 **Endpoints News** - FDA approvals, clinical trials, M&A
- 💊 **BioPharma Dive** - Pipeline updates and industry insights (RSS)

## 🚀 Quick Start

### Installation
```bash
cd backend
npm install
```

### Start Development Server
```bash
npm run dev
```

### Test the New Scrapers
```bash
# Run example test script
npm run tsx examples/test-news-scrapers.ts

# Or test via API
curl http://localhost:3001/api/scraping/news/all?limit=5
```

## 📚 Documentation

- **[NEWS_SCRAPER_API.md](./NEWS_SCRAPER_API.md)** - Complete API reference with examples
- **[SCRAPING_README.md](./src/scraping/SCRAPING_README.md)** - Architecture and deployment guide
- **[SCRAPING_INFRASTRUCTURE.md](../SCRAPING_INFRASTRUCTURE.md)** - System design overview

## 🔗 API Endpoints

### Aggregated News
```bash
GET /api/scraping/news/all?limit=10
```
Returns news from all 5 sources in a single request.

### Individual Sources
```bash
# Fierce Biotech
GET /api/scraping/news/fierce-biotech/latest?limit=20
POST /api/scraping/news/fierce-biotech/search

# Science Daily
GET /api/scraping/news/science-daily/latest?limit=20
GET /api/scraping/news/science-daily/category/biotechnology

# BioSpace
GET /api/scraping/news/biospace/latest?limit=20
POST /api/scraping/news/biospace/search

# Endpoints News
GET /api/scraping/news/endpoints/latest?limit=20
GET /api/scraping/news/endpoints/fda
GET /api/scraping/news/endpoints/clinical-trials

# BioPharma Dive
GET /api/scraping/news/biopharma-dive/latest?limit=20
GET /api/scraping/news/biopharma-dive/pipeline
GET /api/scraping/news/biopharma-dive/ma
```

### System Health & Monitoring
```bash
GET /api/scraping/health       # Health status of all scrapers
GET /api/scraping/stats         # Detailed statistics
GET /api/scraping/metrics       # Prometheus metrics
POST /api/scraping/cache/clear  # Clear all caches
```

## ⚡ Features

### Robustness
- ✅ Circuit breakers prevent cascade failures
- ✅ Automatic retry with exponential backoff
- ✅ Graceful degradation on partial failures
- ✅ Health checks and self-healing
- ✅ Request timeout handling

### Performance
- ✅ Aggressive caching (1-4 hour TTL)
- ✅ Parallel request execution
- ✅ Worker pool for CPU-intensive tasks
- ✅ Connection pooling
- ✅ Streaming data processing

### Compliance
- ✅ Conservative rate limiting (0.25-1 req/s)
- ✅ Respects robots.txt policies
- ✅ User-Agent identification
- ✅ No credential requirements
- ✅ Ethical scraping practices

### Monitoring
- ✅ Real-time health status
- ✅ Prometheus metrics export
- ✅ Cache hit/miss statistics
- ✅ Rate limiter performance tracking
- ✅ Circuit breaker state monitoring

## 🛠️ Usage Example

```typescript
import { initializeScrapingManager } from './src/scraping';

// Initialize
const manager = await initializeScrapingManager();

// Get latest biotech news from Fierce Biotech
const fierceBiotech = manager.getFierceBiotechScraper();
const news = await fierceBiotech.getLatestNews(20);

// Get science research from Science Daily
const scienceDaily = manager.getScienceDailyScraper();
const research = await scienceDaily.getLatestBiotechNews(20);

// Aggregate news from all sources
const [fierce, science, bio, end, pharma] = await Promise.all([
  fierceBiotech.getLatestNews(10),
  scienceDaily.getLatestBiotechNews(10),
  manager.getBioSpaceScraper().getLatestNews(10),
  manager.getEndpointsNewsScraper().getLatestNews(10),
  manager.getBioPharmDiveScraper().getLatestNews(10),
]);
```

## 📈 Rate Limits

All scrapers implement adaptive rate limiting:

| Source | Rate | Adaptive |
|--------|------|----------|
| Fierce Biotech | 0.5 req/s | ✅ |
| Science Daily | 1 req/s | ✅ |
| BioSpace | 0.5 req/s | ✅ |
| Endpoints News | 0.5 req/s | ✅ |
| BioPharma Dive | 0.5 req/s | ✅ |
| PubMed | 3-10 req/s | ✅ |
| FDA | 40-240 req/min | ✅ |
| ClinicalTrials | 10 req/s | ✅ |

## 🧪 Testing

Run the example test script:
```bash
npm run tsx examples/test-news-scrapers.ts
```

Expected output:
```
🚀 Starting scraper tests...
✅ Scraping Manager initialized

📰 Testing Fierce Biotech scraper...
   ✓ Fetched 5 articles
   Sample: "Pfizer advances CAR-T therapy..."

🔬 Testing Science Daily scraper...
   ✓ Fetched 5 articles
   Sample: "New CRISPR technique..."

[... more tests ...]

✅ All tests completed!
```

## 🔧 Configuration

### Environment Variables
```bash
# Optional API keys (enhances rate limits)
PUBMED_API_KEY=your_ncbi_api_key
FDA_API_KEY=your_fda_api_key

# Server
API_PORT=3001
NODE_ENV=development

# Cache
CACHE_TTL=3600
CACHE_MAX_SIZE=1000
```

## 📦 Production Deployment

### Build
```bash
npm run build
```

### Start
```bash
NODE_ENV=production npm start
```

### Docker
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

## 🎯 Architecture

```
backend/
├── src/
│   ├── scraping/
│   │   ├── fierce-biotech-scraper.ts     [NEW]
│   │   ├── science-daily-scraper.ts      [NEW]
│   │   ├── biospace-scraper.ts           [NEW]
│   │   ├── endpoints-scraper.ts          [NEW]
│   │   ├── biopharma-dive-scraper.ts     [NEW]
│   │   ├── scraping-manager.ts           [UPDATED]
│   │   ├── pubmed-scraper.ts
│   │   ├── fda-scraper.ts
│   │   ├── clinical-trials-scraper.ts
│   │   ├── circuit-breaker.ts
│   │   ├── rate-limiter.ts
│   │   ├── lru-cache.ts
│   │   ├── retry.ts
│   │   └── index.ts                      [UPDATED]
│   └── routes/
│       └── scraping.ts                   [UPDATED +20 routes]
├── examples/
│   └── test-news-scrapers.ts             [NEW]
├── NEWS_SCRAPER_API.md                   [NEW]
└── src/scraping/SCRAPING_README.md       [NEW]
```

## 🚦 Health Check

Monitor scraper health in real-time:
```bash
curl http://localhost:3001/api/scraping/health
```

Response includes:
- Circuit breaker states
- Rate limiter status
- Cache statistics
- Error rates
- Last check timestamps

## 💡 Best Practices

1. **Use caching**: Most requests are cached for 1-4 hours
2. **Implement client-side rate limiting**: Don't hammer the endpoints
3. **Handle errors gracefully**: Scrapers may be temporarily down
4. **Use the aggregated endpoint** for dashboard views
5. **Monitor health endpoint** for system status

## 📝 License

MIT - Same as parent project

## 🤝 Contributing

See [SCRAPING_README.md](./src/scraping/SCRAPING_README.md) for contribution guidelines.

---

**Built with ❤️ for the biotech community**

# Quick Test Commands for New Scrapers

## Start Backend
```bash
cd backend
npm run dev
```

The backend will start on `http://localhost:3001`

## Test Individual Scrapers

### 1. Fierce Biotech
```bash
# Get latest news
curl http://localhost:3001/api/scraping/fierce-biotech/latest?maxResults=5

# Search for specific topic
curl "http://localhost:3001/api/scraping/fierce-biotech/search?q=cancer&maxResults=5"
```

### 2. Science Daily
```bash
# Get latest biotech news
curl http://localhost:3001/api/scraping/science-daily/biotech?maxResults=5

# Get news by category
curl "http://localhost:3001/api/scraping/science-daily/latest?category=genetics&maxResults=5"
```

### 3. BioSpace
```bash
# Get latest news
curl http://localhost:3001/api/scraping/biospace/news?maxResults=5

# Search job postings
curl "http://localhost:3001/api/scraping/biospace/jobs?q=scientist&location=boston&maxResults=5"

# Get press releases
curl http://localhost:3001/api/scraping/biospace/press-releases?maxResults=5
```

### 4. BioPharm Dive
```bash
# Get latest news
curl http://localhost:3001/api/scraping/biopharmdive/news?maxResults=5

# Get pipeline updates
curl http://localhost:3001/api/scraping/biopharmdive/pipeline?maxResults=5

# Get M&A activity
curl http://localhost:3001/api/scraping/biopharmdive/ma?maxResults=5

# Get regulatory news
curl "http://localhost:3001/api/scraping/biopharmdive/news?type=regulatory&maxResults=5"
```

### 5. Endpoints News
```bash
# Get latest news
curl http://localhost:3001/api/scraping/endpoints-news/latest?maxResults=5

# Get FDA approvals
curl http://localhost:3001/api/scraping/endpoints-news/fda-approvals?maxResults=5

# Get clinical trial news
curl http://localhost:3001/api/scraping/endpoints-news/clinical-trials?maxResults=5
```

## Test Aggregated Feed

```bash
# Get news from all 5 sources
curl http://localhost:3001/api/scraping/news/aggregated?maxResults=5
```

This will fetch and combine news from all sources, sorted by published date.

## Monitor Health and Stats

### Check Scraper Health
```bash
curl http://localhost:3001/api/scraping/health
```

This shows:
- Circuit breaker states
- Rate limiter metrics
- Cache statistics
- Error rates

### View Statistics
```bash
curl http://localhost:3001/api/scraping/stats
```

This shows detailed metrics for all scrapers including:
- Request counts
- Success/error rates
- Cache hit ratios
- Rate limiter performance

## Pretty Print JSON Output

Add `| jq` to any command for formatted output:

```bash
curl http://localhost:3001/api/scraping/news/aggregated?maxResults=5 | jq
```

Or save to file:

```bash
curl http://localhost:3001/api/scraping/fierce-biotech/latest?maxResults=10 > news.json
```

## Integration Testing

### Test All Scrapers Sequentially
```bash
#!/bin/bash

echo "Testing Fierce Biotech..."
curl -s http://localhost:3001/api/scraping/fierce-biotech/latest?maxResults=2 | jq '.count'

echo "Testing Science Daily..."
curl -s http://localhost:3001/api/scraping/science-daily/biotech?maxResults=2 | jq '.count'

echo "Testing BioSpace..."
curl -s http://localhost:3001/api/scraping/biospace/news?maxResults=2 | jq '.count'

echo "Testing BioPharm Dive..."
curl -s http://localhost:3001/api/scraping/biopharmdive/pipeline?maxResults=2 | jq '.count'

echo "Testing Endpoints News..."
curl -s http://localhost:3001/api/scraping/endpoints-news/fda-approvals?maxResults=2 | jq '.count'

echo "Testing Aggregated Feed..."
curl -s http://localhost:3001/api/scraping/news/aggregated?maxResults=2 | jq '.count'

echo "All tests completed!"
```

### Check Health Status
```bash
curl -s http://localhost:3001/api/scraping/health | jq '.scrapers | to_entries[] | {scraper: .key, status: .value.status}'
```

## Expected Response Format

All endpoints return consistent JSON format:

```json
{
  "status": "ok",
  "data": [
    {
      "id": "...",
      "title": "...",
      "summary": "...",
      "url": "...",
      "publishedDate": "2024-01-15T10:00:00Z",
      "tags": ["..."]
    }
  ],
  "count": 10,
  "timestamp": "2024-01-15T15:30:00Z"
}
```

## Troubleshooting

### Backend Not Starting
```bash
# Check if port 3001 is in use
lsof -i :3001

# Check dependencies installed
cd backend && npm list xml2js cheerio
```

### No Data Returned
1. Check backend logs for errors
2. Verify network connectivity
3. Check health endpoint for circuit breaker status
4. Try clearing cache via stats endpoint

### Slow Response Times
1. First request will be slower (cache miss)
2. Subsequent requests should be <100ms (cache hit)
3. Check rate limiter isn't throttling
4. Monitor stats for error rates

## Production Deployment

For production use:

1. Set appropriate rate limits in `.env`
2. Configure cache TTL based on needs
3. Monitor health endpoint regularly
4. Set up alerts for degraded status
5. Consider using Redis for distributed caching

## Documentation References

- **Complete Guide**: See `backend/src/scraping/NEW_SCRAPERS.md`
- **Configuration**: See `backend/.env.example`
- **Architecture**: See `SCRAPER_EXPANSION.md`

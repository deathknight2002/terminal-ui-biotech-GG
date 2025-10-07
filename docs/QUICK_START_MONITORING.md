# Quick Start: Live Monitoring

This guide will help you get started with the live monitoring features in 5 minutes.

## Prerequisites

- Backend server running on port 3001
- Node.js dependencies installed (`npm install` in `/backend`)

## Step 1: Start the Backend (with Monitoring)

The monitoring services start automatically when you launch the backend:

```bash
cd backend
npm run dev
```

You should see:
```
Scraping infrastructure initialized
News monitoring started
🚀 Biotech Terminal API running on port 3001
```

## Step 2: Load Default Portfolio

```bash
# Load 5 major biotech companies (MRNA, BNTX, VRTX, REGN, GILD)
curl -X POST http://localhost:3001/api/monitoring/portfolio/load-default

# Enable global monitoring (FDA, Fierce Biotech, BioSpace)
curl -X POST http://localhost:3001/api/monitoring/portfolio/setup-global
```

## Step 3: Verify Monitoring is Active

```bash
# Check monitoring stats
curl http://localhost:3001/api/monitoring/stats

# Check portfolio companies
curl http://localhost:3001/api/monitoring/portfolio/companies

# Check active monitors
curl http://localhost:3001/api/monitoring/monitors
```

## Step 4: View Real-Time Updates

### Option A: WebSocket (Real-time)

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

// Subscribe to all monitoring channels
socket.emit('monitoring:subscribe', { 
  channels: ['changes', 'alerts', 'news', 'portfolio'] 
});

// Listen for portfolio alerts
socket.on('alert:created', (event) => {
  console.log('📊 Portfolio Alert:', event.data);
});

// Listen for news alerts
socket.on('news:alert', (event) => {
  console.log('📰 News Alert:', event.data);
});

// Listen for change detections
socket.on('change:detected', (event) => {
  console.log('🔔 Change Detected:', event.data);
});
```

### Option B: REST API (Polling)

```bash
# Get recent portfolio alerts
curl http://localhost:3001/api/monitoring/portfolio/alerts?limit=10

# Get recent news alerts
curl http://localhost:3001/api/monitoring/news/alerts?limit=10

# Get recent changes
curl http://localhost:3001/api/monitoring/changes?limit=10
```

## Step 5: Customize Monitoring

### Add a Custom Company

```bash
curl -X POST http://localhost:3001/api/monitoring/portfolio/companies \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "ABBV",
    "name": "AbbVie",
    "therapeuticArea": "Immunology",
    "websites": {
      "company": "https://www.abbvie.com",
      "investors": "https://investors.abbvie.com"
    },
    "monitoringEnabled": true
  }'
```

### Add Custom URL Monitor

```bash
curl -X POST http://localhost:3001/api/monitoring/monitors \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.fda.gov/drugs/development-approval-process-drugs",
    "name": "FDA Drug Development",
    "category": "fda",
    "checkInterval": 3600000,
    "metadata": {
      "priority": "high"
    }
  }'
```

### Customize News Keywords

```bash
# Add keywords to Fierce Biotech monitoring
curl -X POST http://localhost:3001/api/monitoring/news/keywords/fierceBiotech \
  -H "Content-Type: application/json" \
  -d '{
    "keywords": ["CRISPR", "mRNA vaccine", "antibody drug conjugate"]
  }'
```

## Common Use Cases

### 1. Monitor FDA Approvals

The system automatically monitors FDA drug approvals. View recent alerts:

```bash
curl http://localhost:3001/api/monitoring/portfolio/alerts | jq '.alerts[] | select(.type == "fda")'
```

### 2. Track Clinical Trial Updates

Clinical trials are monitored per company. View trial-related alerts:

```bash
curl http://localhost:3001/api/monitoring/portfolio/alerts | jq '.alerts[] | select(.type == "clinical-trial")'
```

### 3. Monitor Fierce Biotech News

News is automatically scraped and filtered by keywords. View biotech news alerts:

```bash
curl http://localhost:3001/api/monitoring/news/alerts/fierce-biotech?limit=20
```

### 4. Get Company-Specific Updates

```bash
# Get all alerts for Moderna
curl http://localhost:3001/api/monitoring/portfolio/alerts/MRNA?limit=20
```

### 5. View Top Keywords Triggering Alerts

```bash
curl http://localhost:3001/api/monitoring/news/stats | jq '.stats.topKeywords'
```

## Monitoring Configuration

### Check Intervals

Default intervals (can be customized):
- Company websites: 5 minutes
- Press releases: 10 minutes  
- Clinical trials: 1 hour
- FDA updates: 1 hour
- Fierce Biotech: 10 minutes
- BioSpace: 15 minutes
- Science Daily: 30 minutes

### Alert Severity Levels

- **High**: FDA approvals, Phase III results, M&A activity
- **Medium**: Clinical trial updates, partnerships, press releases
- **Low**: General website updates

## Troubleshooting

### No alerts appearing?

1. Check monitoring is running:
```bash
curl http://localhost:3001/api/monitoring/health
```

2. Verify monitors are enabled:
```bash
curl http://localhost:3001/api/monitoring/monitors | jq '.monitors[] | select(.enabled == true)'
```

3. Check news monitoring status:
```bash
curl http://localhost:3001/api/monitoring/news/stats
```

### Too many false positives?

1. Adjust keywords for news monitoring:
```bash
# View current config
curl http://localhost:3001/api/monitoring/news/config

# Remove noisy keywords
curl -X DELETE http://localhost:3001/api/monitoring/news/keywords/fierceBiotech \
  -H "Content-Type: application/json" \
  -d '{"keywords": ["keyword1", "keyword2"]}'
```

2. Increase check intervals for less critical monitors:
```bash
curl -X PATCH http://localhost:3001/api/monitoring/monitors/{id} \
  -H "Content-Type: application/json" \
  -d '{"checkInterval": 3600000}'
```

### High memory usage?

Clear old data periodically:
```bash
# Clear old changes
curl -X DELETE http://localhost:3001/api/monitoring/changes

# Clear old alerts
curl -X DELETE http://localhost:3001/api/monitoring/portfolio/alerts
curl -X DELETE http://localhost:3001/api/monitoring/news/alerts
```

## Next Steps

1. **Integrate with Frontend**: See `docs/LIVE_MONITORING.md` for WebSocket integration examples
2. **Add Custom Monitors**: Monitor specific pages or APIs relevant to your portfolio
3. **Configure Notifications**: Set up email/Slack notifications (coming soon)
4. **Review Analytics**: Track which keywords trigger the most alerts

## Additional Resources

- Full API Documentation: `docs/LIVE_MONITORING.md`
- WebSocket Events: See "WebSocket Integration" section in API docs
- Scraping Infrastructure: `backend/src/scraping/README.md`

## Support

For issues or questions:
1. Check logs: Backend console shows real-time monitoring activity
2. Health endpoint: `GET /api/monitoring/health`
3. Stats endpoint: `GET /api/monitoring/stats`

# Live Monitoring Integration with changedetection.io Patterns

## Overview

This integration brings changedetection.io-inspired live monitoring capabilities to the Biotech Terminal Platform, enabling real-time tracking of:

- **Portfolio Companies**: Monitor investor relations, press releases, and company websites
- **FDA Updates**: Track drug approvals and regulatory announcements
- **Clinical Trials**: Monitor trial status changes on ClinicalTrials.gov
- **Biotech News**: Real-time updates from Fierce Biotech, BioSpace, Science Daily, and Endpoints News

## Key Features

### ✅ Implemented

1. **Change Detection Service** (`backend/src/services/change-detection-service.ts`)
   - Content hashing (SHA-256) for change detection
   - Configurable check intervals (5min - 1hr+)
   - LRU cache for efficient content storage
   - Event-driven architecture
   - Change history tracking

2. **Portfolio Monitoring** (`backend/src/services/portfolio-monitor.ts`)
   - Track 5 default biotech companies (MRNA, BNTX, VRTX, REGN, GILD)
   - Company-specific URL monitoring
   - Global monitoring (FDA, news sources)
   - Alert categorization by severity
   - Company monitoring toggle

3. **News Monitoring** (`backend/src/services/news-monitor.ts`)
   - Integration with existing news scrapers
   - Keyword-based filtering
   - Scheduled monitoring (10-30 min intervals)
   - Multi-source aggregation
   - Importance classification (high/medium/low)

4. **REST API** (`backend/src/routes/monitoring.ts`)
   - 34 endpoints for monitoring management
   - Change detection APIs
   - Portfolio management APIs
   - News monitoring APIs

5. **WebSocket Integration** (`backend/src/websocket/monitoring-websocket.ts`)
   - Real-time updates for all monitoring events
   - 8+ event types
   - Channel-based subscriptions
   - Bidirectional communication

6. **Documentation**
   - Complete API reference (`docs/LIVE_MONITORING.md`)
   - Quick start guide (`docs/QUICK_START_MONITORING.md`)
   - Usage examples and troubleshooting

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Application                      │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ WebSocket + REST API
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                   Backend Services                           │
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │ Change Detection │  │ Portfolio Monitor│                │
│  │    Service       │  │     Service      │                │
│  └────────┬─────────┘  └────────┬─────────┘                │
│           │                     │                           │
│           │  ┌──────────────────▼─────────┐                │
│           └──┤  News Monitor Service       │                │
│              └──────────────┬──────────────┘                │
│                             │                               │
│              ┌──────────────▼──────────────┐                │
│              │  Scraping Infrastructure     │                │
│              │  (Fierce Biotech, BioSpace, │                │
│              │   Science Daily, Endpoints) │                │
│              └─────────────────────────────┘                │
└──────────────────────────────────────────────────────────────┘
                      │
                      │ HTTP Requests
                      │
┌─────────────────────▼───────────────────────────────────────┐
│              External Data Sources                           │
│  • FDA.gov                                                   │
│  • ClinicalTrials.gov                                        │
│  • Fierce Biotech                                            │
│  • BioSpace                                                  │
│  • Science Daily                                             │
│  • Company websites                                          │
└──────────────────────────────────────────────────────────────┘
```

## Quick Start

See [QUICK_START_MONITORING.md](./QUICK_START_MONITORING.md) for a 5-minute setup guide.

### Minimal Setup

```bash
# 1. Start backend
cd backend && npm run dev

# 2. Load default portfolio
curl -X POST http://localhost:3001/api/monitoring/portfolio/load-default

# 3. Enable global monitoring
curl -X POST http://localhost:3001/api/monitoring/portfolio/setup-global

# 4. View alerts
curl http://localhost:3001/api/monitoring/portfolio/alerts
curl http://localhost:3001/api/monitoring/news/alerts
```

## API Endpoints

### Change Detection
- `GET /api/monitoring/monitors` - List all monitors
- `POST /api/monitoring/monitors` - Add new monitor
- `GET /api/monitoring/changes` - Get recent changes
- `GET /api/monitoring/stats` - Get statistics
- `GET /api/monitoring/health` - Health check

### Portfolio Management
- `GET /api/monitoring/portfolio/companies` - List companies
- `POST /api/monitoring/portfolio/companies` - Add company
- `GET /api/monitoring/portfolio/alerts` - Get portfolio alerts
- `POST /api/monitoring/portfolio/load-default` - Load defaults
- `POST /api/monitoring/portfolio/setup-global` - Enable global monitoring

### News Monitoring
- `GET /api/monitoring/news/alerts` - Get news alerts
- `GET /api/monitoring/news/config` - Get configuration
- `POST /api/monitoring/news/keywords/:source` - Add keywords
- `GET /api/monitoring/news/stats` - Get statistics
- `POST /api/monitoring/news/start` - Start monitoring
- `POST /api/monitoring/news/stop` - Stop monitoring

Full API documentation: [LIVE_MONITORING.md](./LIVE_MONITORING.md)

## WebSocket Events

### Subscribe to Updates

```typescript
socket.emit('monitoring:subscribe', { 
  channels: ['changes', 'alerts', 'news', 'portfolio'] 
});
```

### Receive Real-Time Updates

```typescript
// Portfolio alerts
socket.on('alert:created', (event) => {
  console.log('Portfolio Alert:', event.data);
});

// News alerts
socket.on('news:alert', (event) => {
  console.log('News Alert:', event.data);
});

// Change detections
socket.on('change:detected', (event) => {
  console.log('Change Detected:', event.data);
});
```

## Configuration

### Default Check Intervals

- Company websites: 5 minutes (300,000ms)
- Press releases: 10 minutes (600,000ms)
- Clinical trials: 1 hour (3,600,000ms)
- FDA updates: 1 hour (3,600,000ms)
- Fierce Biotech: 10 minutes (600,000ms)
- BioSpace: 15 minutes (900,000ms)
- Science Daily: 30 minutes (1,800,000ms)

### Default Portfolio

1. Moderna (MRNA) - Vaccines & Oncology
2. BioNTech (BNTX) - Vaccines & Immunotherapy
3. Vertex (VRTX) - Cystic Fibrosis & Rare Diseases
4. Regeneron (REGN) - Immunology & Oncology
5. Gilead (GILD) - Virology & Oncology

### Default Keywords

FDA approval, clinical trial, breakthrough therapy, Phase III, PDUFA, orphan drug, fast track, priority review, accelerated approval, drug development, merger, acquisition, partnership, licensing deal, IPO, funding round, clinical data, pivotal trial, biologics, gene therapy, cell therapy, CAR-T, immunotherapy, oncology, rare disease

## Integration with Existing Infrastructure

The monitoring system seamlessly integrates with:

1. **Scraping Infrastructure**: Leverages existing news scrapers (Fierce Biotech, BioSpace, Science Daily, Endpoints)
2. **WebSocket System**: Extends existing WebSocket setup with monitoring channels
3. **Caching**: Uses LRU cache from scraping infrastructure
4. **Logging**: Consistent logging with existing logger
5. **API Routes**: Follows existing route patterns and conventions

## File Structure

```
backend/src/
├── services/
│   ├── change-detection-service.ts  # Core URL monitoring
│   ├── portfolio-monitor.ts         # Portfolio tracking
│   └── news-monitor.ts              # News aggregation
├── routes/
│   └── monitoring.ts                # REST API endpoints
├── websocket/
│   └── monitoring-websocket.ts      # WebSocket integration
└── index.ts                         # Integration point

docs/
├── LIVE_MONITORING.md               # Complete API reference
├── QUICK_START_MONITORING.md        # Quick start guide
└── MONITORING_INTEGRATION.md        # This file
```

## Data Models

### MonitoredUrl
```typescript
{
  id: string;
  url: string;
  name: string;
  category: 'portfolio' | 'news' | 'fda' | 'clinical-trial' | 'company';
  checkInterval: number;
  enabled: boolean;
  lastCheck?: Date;
  lastChange?: Date;
  changeCount: number;
}
```

### PortfolioAlert
```typescript
{
  id: string;
  company: string;
  symbol: string;
  type: 'fda' | 'clinical-trial' | 'press-release' | 'sec-filing';
  title: string;
  url: string;
  timestamp: Date;
  severity: 'high' | 'medium' | 'low';
}
```

### NewsAlert
```typescript
{
  id: string;
  article: NewsArticle;
  keywords: string[];
  timestamp: Date;
  matched: boolean;
}
```

## Performance Considerations

- **LRU Cache**: 24-hour TTL, max 5000 articles for news, max 500 for content
- **Alert History**: Last 500 alerts kept in memory
- **Change History**: Last 1000 changes kept in memory
- **Check Intervals**: Respectful of source servers (5+ minutes minimum)
- **Concurrent Checks**: Limited by existing scraping infrastructure rate limits

## Future Enhancements

1. **Notification Integrations**: Email, Slack, Discord, Telegram
2. **Diff Visualization**: Show exact content differences
3. **ML-based Filtering**: Reduce false positives with machine learning
4. **Custom Schedules**: Market hours only, specific days/times
5. **Historical Analysis**: Trend tracking over time
6. **Browser Automation**: Playwright integration for dynamic content
7. **Content Extraction**: Better parsing of PDFs, tables, structured data
8. **Alert Rules Engine**: Complex filtering and routing logic
9. **Dashboard Widget**: Frontend component for monitoring status
10. **Alerting Thresholds**: Configure alert frequency and batching

## Testing

Currently manual testing via REST API and WebSocket. Future additions:

- Unit tests for services
- Integration tests for APIs
- WebSocket connection tests
- Load testing for concurrent monitoring

## Troubleshooting

### No Alerts Appearing

1. Check monitoring is running: `GET /api/monitoring/health`
2. Verify monitors are enabled: `GET /api/monitoring/monitors`
3. Check keywords match content: `GET /api/monitoring/news/config`
4. Review logs for errors

### Too Many False Positives

1. Adjust keywords: `DELETE /api/monitoring/news/keywords/:source`
2. Increase check intervals: `PATCH /api/monitoring/monitors/:id`
3. Use CSS selectors for targeted monitoring

### High Memory Usage

1. Clear old data: `DELETE /api/monitoring/changes`, `DELETE /api/monitoring/news/alerts`
2. Reduce active monitors
3. Decrease cache sizes in service constructors

## changedetection.io Comparison

| Feature | changedetection.io | This Integration |
|---------|-------------------|------------------|
| Change Detection | ✅ Visual diff | ✅ Hash-based |
| Scheduling | ✅ Cron expressions | ✅ Intervals |
| Notifications | ✅ Many integrations | ⏳ Coming soon |
| Browser Steps | ✅ Playwright | ⏳ Future |
| CSS Selectors | ✅ Full support | ✅ Basic support |
| Diff Viewing | ✅ Full diff UI | ⏳ Future |
| API Access | ✅ REST API | ✅ REST + WebSocket |
| Self-hosted | ✅ Docker | ✅ Node.js |
| Domain-specific | ❌ Generic | ✅ Biotech-focused |
| News Aggregation | ❌ Not built-in | ✅ 4 sources |
| Portfolio Tracking | ❌ Not built-in | ✅ Company-specific |

## Credits

Inspired by [changedetection.io](https://github.com/dgtlmoon/changedetection.io) - an excellent open-source change detection tool.

## License

MIT License - Same as parent project

## Support

For questions or issues:
- Check documentation: `docs/LIVE_MONITORING.md`
- Review quick start: `docs/QUICK_START_MONITORING.md`
- Check logs: Backend console shows monitoring activity
- API health: `GET /api/monitoring/health`

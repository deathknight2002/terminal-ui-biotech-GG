# Live Monitoring Integration

This document describes the live monitoring capabilities integrated into the Biotech Terminal Platform, inspired by changedetection.io.

## Overview

The live monitoring system enables real-time tracking of:
- **Portfolio Companies**: Monitor company websites, investor relations pages, and press releases
- **FDA Updates**: Track FDA drug approvals and regulatory changes
- **Clinical Trials**: Monitor clinical trial status changes on ClinicalTrials.gov
- **Biotech News**: Real-time updates from Fierce Biotech, BioSpace, and other sources

## Architecture

### Core Services

#### 1. Change Detection Service (`backend/src/services/change-detection-service.ts`)
- Monitors URLs for content changes
- Performs periodic checks with configurable intervals
- Detects and tracks changes using content hashing
- Caches content for efficient comparison
- Emits events when changes are detected

**Key Features:**
- LRU cache for efficient content storage
- Configurable check intervals per monitor
- CSS selector support for targeted content monitoring
- Change history tracking
- Health status monitoring

#### 2. Portfolio Monitor Service (`backend/src/services/portfolio-monitor.ts`)
- Manages portfolio of biotech companies
- Coordinates monitoring of company-specific URLs
- Aggregates alerts from multiple sources
- Categorizes alerts by severity (high/medium/low)

**Key Features:**
- Default portfolio with major biotech companies (MRNA, BNTX, VRTX, REGN, GILD)
- Global biotech monitoring (FDA, Fierce Biotech, BioSpace)
- Company-specific monitoring toggle
- Alert categorization and filtering

### API Endpoints

All endpoints are prefixed with `/api/monitoring`

#### Change Detection Endpoints

**GET /monitors**
- Get all monitored URLs
- Response: `{ success: boolean, count: number, monitors: MonitoredUrl[] }`

**GET /monitors/:id**
- Get specific monitor by ID
- Response: `{ success: boolean, monitor: MonitoredUrl }`

**POST /monitors**
- Add new URL to monitor
- Body: `{ url: string, name: string, category: string, checkInterval?: number, selector?: string, metadata?: object }`
- Response: `{ success: boolean, message: string, id: string }`

**PATCH /monitors/:id**
- Update monitor configuration
- Body: Partial monitor object
- Response: `{ success: boolean, message: string }`

**DELETE /monitors/:id**
- Remove monitor
- Response: `{ success: boolean, message: string }`

**POST /monitors/:id/toggle**
- Enable/disable monitor
- Body: `{ enabled: boolean }`
- Response: `{ success: boolean, message: string }`

**POST /monitors/:id/check**
- Force immediate check of monitor
- Response: `{ success: boolean, message: string }`

**GET /changes**
- Get recent changes across all monitors
- Query: `?limit=50`
- Response: `{ success: boolean, count: number, changes: ChangeDetection[] }`

**GET /changes/:urlId**
- Get changes for specific URL
- Query: `?limit=20`
- Response: `{ success: boolean, count: number, changes: ChangeDetection[] }`

**GET /stats**
- Get monitoring statistics
- Response: `{ success: boolean, stats: MonitoringStats }`

**GET /health**
- Get health status of monitoring system
- Response: `{ success: boolean, status: string, details: object }`

**DELETE /changes**
- Clear change history
- Response: `{ success: boolean, message: string }`

#### Portfolio Monitoring Endpoints

**GET /portfolio/companies**
- Get all portfolio companies
- Response: `{ success: boolean, count: number, companies: PortfolioCompany[] }`

**GET /portfolio/companies/:symbol**
- Get company by symbol
- Response: `{ success: boolean, company: PortfolioCompany }`

**POST /portfolio/companies**
- Add company to portfolio
- Body: `{ symbol: string, name: string, therapeuticArea: string, websites: object, monitoringEnabled: boolean }`
- Response: `{ success: boolean, message: string }`

**DELETE /portfolio/companies/:symbol**
- Remove company from portfolio
- Response: `{ success: boolean, message: string }`

**POST /portfolio/companies/:symbol/toggle**
- Enable/disable company monitoring
- Body: `{ enabled: boolean }`
- Response: `{ success: boolean, message: string }`

**GET /portfolio/alerts**
- Get recent portfolio alerts
- Query: `?limit=50`
- Response: `{ success: boolean, count: number, alerts: PortfolioAlert[] }`

**GET /portfolio/alerts/:symbol**
- Get alerts for specific company
- Query: `?limit=20`
- Response: `{ success: boolean, count: number, alerts: PortfolioAlert[] }`

**GET /portfolio/stats**
- Get portfolio statistics
- Response: `{ success: boolean, stats: PortfolioStats }`

**POST /portfolio/load-default**
- Load default portfolio (5 major biotech companies)
- Response: `{ success: boolean, message: string }`

**POST /portfolio/setup-global**
- Enable global biotech monitoring (FDA, news sources)
- Response: `{ success: boolean, message: string }`

**DELETE /portfolio/alerts**
- Clear all alerts
- Response: `{ success: boolean, message: string }`

### WebSocket Integration

WebSocket events are available for real-time updates via `/api/monitoring` namespace.

#### Client-Side Connection

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

// Subscribe to monitoring updates
socket.emit('monitoring:subscribe', { 
  channels: ['changes', 'alerts', 'monitors', 'portfolio'] 
});

// Listen for changes
socket.on('change:detected', (event) => {
  console.log('Change detected:', event.data);
});

// Listen for alerts
socket.on('alert:created', (event) => {
  console.log('Alert created:', event.data);
});
```

#### WebSocket Events

**Outbound (Client → Server):**
- `monitoring:subscribe` - Subscribe to channels
- `monitoring:unsubscribe` - Unsubscribe from channels
- `monitoring:get-stats` - Request current statistics
- `monitoring:get-monitors` - Request all monitors
- `monitoring:get-changes` - Request recent changes
- `monitoring:get-companies` - Request portfolio companies
- `monitoring:get-alerts` - Request portfolio alerts
- `monitoring:force-check` - Force check a monitor
- `monitoring:add-monitor` - Add new monitor
- `monitoring:remove-monitor` - Remove monitor
- `monitoring:toggle-monitor` - Enable/disable monitor
- `monitoring:add-company` - Add company to portfolio
- `monitoring:remove-company` - Remove company from portfolio
- `monitoring:toggle-company` - Enable/disable company monitoring

**Inbound (Server → Client):**
- `change:detected` - Change detected on monitored URL
- `alert:created` - New portfolio alert created
- `monitor:added` - Monitor added
- `monitor:removed` - Monitor removed
- `monitor:updated` - Monitor updated
- `monitor:toggled` - Monitor enabled/disabled
- `monitor:error` - Monitor error occurred
- `company:added` - Company added to portfolio
- `company:removed` - Company removed from portfolio
- `company:monitoring-toggled` - Company monitoring toggled

#### WebSocket Channels

- `monitoring:changes` - Change detection events
- `monitoring:alerts` - Portfolio alert events
- `monitoring:monitors` - Monitor management events
- `monitoring:portfolio` - Portfolio management events
- `monitoring:errors` - Error events

## Usage Examples

### 1. Load Default Portfolio and Enable Monitoring

```bash
# Load default portfolio with 5 major biotech companies
curl -X POST http://localhost:3001/api/monitoring/portfolio/load-default

# Enable global biotech monitoring
curl -X POST http://localhost:3001/api/monitoring/portfolio/setup-global
```

### 2. Add Custom Monitor

```bash
curl -X POST http://localhost:3001/api/monitoring/monitors \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.fda.gov/drugs/news-events-human-drugs",
    "name": "FDA Drug News",
    "category": "fda",
    "checkInterval": 3600000,
    "metadata": {
      "source": "FDA",
      "priority": "high"
    }
  }'
```

### 3. Add Company to Portfolio

```bash
curl -X POST http://localhost:3001/api/monitoring/portfolio/companies \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "ABBV",
    "name": "AbbVie",
    "therapeuticArea": "Immunology",
    "websites": {
      "company": "https://www.abbvie.com",
      "investors": "https://investors.abbvie.com",
      "pressReleases": "https://news.abbvie.com"
    },
    "monitoringEnabled": true
  }'
```

### 4. Get Recent Changes

```bash
# Get last 20 changes
curl http://localhost:3001/api/monitoring/changes?limit=20

# Get changes for specific URL
curl http://localhost:3001/api/monitoring/changes/{urlId}?limit=10
```

### 5. Get Portfolio Alerts

```bash
# Get all recent alerts
curl http://localhost:3001/api/monitoring/portfolio/alerts?limit=50

# Get alerts for specific company
curl http://localhost:3001/api/monitoring/portfolio/alerts/MRNA?limit=20
```

### 6. Monitor Statistics

```bash
# Get change detection stats
curl http://localhost:3001/api/monitoring/stats

# Get portfolio stats
curl http://localhost:3001/api/monitoring/portfolio/stats

# Get health status
curl http://localhost:3001/api/monitoring/health
```

## Data Models

### MonitoredUrl
```typescript
{
  id: string;              // Unique monitor ID
  url: string;             // URL to monitor
  name: string;            // Human-readable name
  category: string;        // 'portfolio' | 'news' | 'fda' | 'clinical-trial' | 'company'
  checkInterval: number;   // Interval in milliseconds
  selector?: string;       // CSS selector for targeted content
  lastCheck?: Date;        // Last check timestamp
  lastChange?: Date;       // Last change detected timestamp
  changeCount: number;     // Total changes detected
  enabled: boolean;        // Monitor active status
  metadata?: object;       // Additional metadata
}
```

### ChangeDetection
```typescript
{
  id: string;              // Unique change ID
  urlId: string;           // Monitor ID
  url: string;             // URL that changed
  name: string;            // Monitor name
  timestamp: Date;         // Change detection time
  changeType: string;      // 'new' | 'modified' | 'deleted'
  previousHash?: string;   // Previous content hash
  currentHash: string;     // Current content hash
  previousContent?: string;// Previous content (truncated)
  currentContent: string;  // Current content (truncated)
  diff?: string;           // Difference summary
  metadata?: object;       // Additional metadata
}
```

### PortfolioCompany
```typescript
{
  symbol: string;          // Stock ticker symbol
  name: string;            // Company name
  therapeuticArea: string; // Primary therapeutic focus
  websites: {
    company?: string;      // Company website
    investors?: string;    // Investor relations page
    pressReleases?: string;// Press release page
  };
  monitoringEnabled: boolean; // Monitoring status
}
```

### PortfolioAlert
```typescript
{
  id: string;              // Unique alert ID
  company: string;         // Company name
  symbol: string;          // Stock symbol
  type: string;            // 'fda' | 'clinical-trial' | 'press-release' | 'sec-filing' | 'price-change'
  title: string;           // Alert title
  description: string;     // Alert description
  url: string;             // Source URL
  timestamp: Date;         // Alert creation time
  severity: string;        // 'high' | 'medium' | 'low'
  metadata?: object;       // Additional metadata
}
```

## Configuration

### Check Intervals
- Company websites: 5 minutes (300,000ms)
- Press releases: 10 minutes (600,000ms)
- Clinical trials: 1 hour (3,600,000ms)
- FDA updates: 1 hour (3,600,000ms)
- News sources: 10-15 minutes (600,000-900,000ms)

### Default Portfolio Companies
1. **Moderna (MRNA)** - Vaccines & Oncology
2. **BioNTech (BNTX)** - Vaccines & Immunotherapy
3. **Vertex (VRTX)** - Cystic Fibrosis & Rare Diseases
4. **Regeneron (REGN)** - Immunology & Oncology
5. **Gilead (GILD)** - Virology & Oncology

### Global Monitoring Sources
- FDA Drug Approvals
- Fierce Biotech News
- BioSpace News

## Integration with Existing Infrastructure

The monitoring system integrates with existing components:

1. **Scraping Infrastructure**: Leverages existing scrapers for Fierce Biotech, BioSpace, and other sources
2. **WebSocket System**: Extends the existing WebSocket setup with monitoring channels
3. **Caching**: Uses LRU cache from scraping infrastructure for efficient content storage
4. **Logging**: Integrates with existing logger for consistent logging

## Best Practices

1. **Set Appropriate Check Intervals**: Balance freshness vs server load
   - Critical sources (FDA): 1 hour
   - High-priority (company press): 10 minutes
   - Standard (news): 15 minutes

2. **Use CSS Selectors**: Target specific content sections to reduce false positives
   ```javascript
   {
     url: "https://example.com/news",
     selector: ".news-content",  // Only monitor news content div
     ...
   }
   ```

3. **Monitor Responsibly**: Respect rate limits and robots.txt
   - Minimum 5-minute intervals for dynamic content
   - Longer intervals (1+ hour) for relatively static content

4. **Handle Alerts Appropriately**: Filter by severity
   ```javascript
   // High severity: FDA approvals, clinical trial results
   // Medium severity: Company press releases, news articles
   // Low severity: Website updates, minor changes
   ```

5. **Clean Up Old Data**: Periodically clear old changes and alerts
   ```bash
   # Clear old changes
   curl -X DELETE http://localhost:3001/api/monitoring/changes
   
   # Clear old alerts
   curl -X DELETE http://localhost:3001/api/monitoring/portfolio/alerts
   ```

## Troubleshooting

### Monitor Not Detecting Changes
- Check monitor is enabled: `GET /api/monitoring/monitors/:id`
- Verify URL is accessible
- Check logs for errors
- Force manual check: `POST /api/monitoring/monitors/:id/check`

### Too Many False Positives
- Use CSS selectors to target specific content
- Increase check interval for dynamic content (ads, timestamps)
- Review change history to identify patterns

### High Memory Usage
- Reduce cache TTL in change-detection-service
- Clear old changes periodically
- Reduce number of active monitors

### WebSocket Connection Issues
- Verify WebSocket port (3001)
- Check CORS configuration
- Ensure proper authentication

## Future Enhancements

1. **Diff Visualization**: Show actual differences between content versions
2. **Smart Filtering**: ML-based filtering to reduce false positives
3. **Custom Notifications**: Email, Slack, Discord integrations
4. **Scheduling**: Custom check schedules (e.g., only during market hours)
5. **Historical Analysis**: Track trends over time
6. **Browser Automation**: Use Playwright for dynamic content
7. **Content Extraction**: Better parsing of specific content types (PDFs, tables)

## References

- changedetection.io: https://github.com/dgtlmoon/changedetection.io
- Scraping Infrastructure: `/backend/src/scraping/README.md`
- WebSocket Documentation: `/docs/WEBSOCKET.md`
- API Documentation: `/docs/API.md`

# Frontend Integration Examples

## React Hook Usage

### Basic WebSocket Monitoring

```typescript
import { useMonitoring } from './hooks/useMonitoring';

function MonitoringDashboard() {
  const { alerts, stats, isConnected, error } = useMonitoring({
    url: 'http://localhost:3001',
    autoConnect: true,
    channels: ['changes', 'alerts', 'news', 'portfolio'],
  });

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!isConnected) {
    return <div>Connecting to monitoring service...</div>;
  }

  return (
    <div>
      <h2>Live Monitoring Dashboard</h2>
      
      {/* Stats Display */}
      {stats && (
        <div className="stats-grid">
          <StatCard 
            title="Active Monitors"
            value={stats.changeDetection?.activeMonitors || 0}
          />
          <StatCard 
            title="Total Changes"
            value={stats.changeDetection?.totalChanges || 0}
          />
          <StatCard 
            title="Portfolio Alerts"
            value={stats.portfolio?.totalAlerts || 0}
          />
          <StatCard 
            title="News Alerts"
            value={stats.news?.totalAlerts || 0}
          />
        </div>
      )}

      {/* Alerts Feed */}
      <div className="alerts-feed">
        <h3>Recent Alerts</h3>
        {alerts.map(alert => (
          <AlertCard key={alert.id} alert={alert} />
        ))}
      </div>
    </div>
  );
}
```

### REST API Monitoring (Without WebSocket)

```typescript
import { useMonitoringRest } from './hooks/useMonitoring';

function MonitoringDashboardRest() {
  const { alerts, stats, loading, refetch } = useMonitoringRest(
    'http://localhost:3001/api/monitoring'
  );

  if (loading && alerts.length === 0) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <button onClick={refetch}>Refresh</button>
      
      <div className="alerts-list">
        {alerts.map(alert => (
          <AlertItem key={alert.id} alert={alert} />
        ))}
      </div>
    </div>
  );
}
```

### Alert Card Component

```typescript
import { MonitoringAlert } from './hooks/useMonitoring';

interface AlertCardProps {
  alert: MonitoringAlert;
}

function AlertCard({ alert }: AlertCardProps) {
  const severityColor = {
    high: 'bg-red-500',
    medium: 'bg-yellow-500',
    low: 'bg-blue-500',
  };

  const typeIcon = {
    fda: '💊',
    'clinical-trial': '🧬',
    'press-release': '📰',
    news: '📡',
    change: '🔔',
  };

  return (
    <div className={`alert-card ${severityColor[alert.severity]}`}>
      <div className="alert-header">
        <span className="alert-icon">{typeIcon[alert.type]}</span>
        <span className="alert-severity">{alert.severity.toUpperCase()}</span>
        {alert.symbol && <span className="alert-symbol">{alert.symbol}</span>}
      </div>
      
      <h3 className="alert-title">{alert.title}</h3>
      <p className="alert-description">{alert.description}</p>
      
      <div className="alert-footer">
        <span className="alert-time">
          {new Date(alert.timestamp).toLocaleString()}
        </span>
        <a 
          href={alert.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="alert-link"
        >
          View Source →
        </a>
      </div>
    </div>
  );
}
```

### Filtering Alerts

```typescript
function FilteredAlerts() {
  const { alerts } = useMonitoring();
  const [filter, setFilter] = useState<'all' | 'high' | 'fda' | 'news'>('all');

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true;
    if (filter === 'high') return alert.severity === 'high';
    return alert.type === filter;
  });

  return (
    <div>
      <div className="filter-buttons">
        <button onClick={() => setFilter('all')}>All</button>
        <button onClick={() => setFilter('high')}>High Priority</button>
        <button onClick={() => setFilter('fda')}>FDA</button>
        <button onClick={() => setFilter('news')}>News</button>
      </div>

      <div className="alerts-list">
        {filteredAlerts.map(alert => (
          <AlertCard key={alert.id} alert={alert} />
        ))}
      </div>
    </div>
  );
}
```

### Real-time Notifications

```typescript
import { useEffect } from 'react';
import { useMonitoring } from './hooks/useMonitoring';

function MonitoringWithNotifications() {
  const { alerts, isConnected } = useMonitoring();

  useEffect(() => {
    if (alerts.length === 0) return;

    const latestAlert = alerts[0];

    // Show browser notification for high severity alerts
    if (latestAlert.severity === 'high' && 'Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(latestAlert.title, {
            body: latestAlert.description,
            icon: '/favicon.ico',
            tag: latestAlert.id,
          });
        }
      });
    }
  }, [alerts]);

  return (
    <div>
      <div className="connection-status">
        {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
      </div>
      {/* ... rest of component */}
    </div>
  );
}
```

### Company-Specific Monitoring

```typescript
function CompanyMonitoring({ symbol }: { symbol: string }) {
  const { alerts } = useMonitoring();

  const companyAlerts = alerts.filter(
    alert => alert.symbol === symbol
  );

  return (
    <div className="company-monitoring">
      <h2>{symbol} Monitoring</h2>
      <div className="alert-count">
        {companyAlerts.length} alert{companyAlerts.length !== 1 ? 's' : ''}
      </div>
      
      {companyAlerts.map(alert => (
        <AlertCard key={alert.id} alert={alert} />
      ))}
    </div>
  );
}
```

### Live Stats Dashboard

```typescript
function LiveStats() {
  const { stats, refreshStats } = useMonitoring();

  useEffect(() => {
    // Refresh stats every minute
    const interval = setInterval(refreshStats, 60000);
    return () => clearInterval(interval);
  }, [refreshStats]);

  if (!stats) return <div>Loading stats...</div>;

  return (
    <div className="stats-dashboard">
      {/* Change Detection Stats */}
      <section>
        <h3>Change Detection</h3>
        <ul>
          <li>Active Monitors: {stats.changeDetection?.activeMonitors}</li>
          <li>Total Checks: {stats.changeDetection?.totalChecks}</li>
          <li>Changes Detected: {stats.changeDetection?.totalChanges}</li>
        </ul>
      </section>

      {/* Portfolio Stats */}
      <section>
        <h3>Portfolio</h3>
        <ul>
          <li>Companies: {stats.portfolio?.totalCompanies}</li>
          <li>Monitored: {stats.portfolio?.monitoredCompanies}</li>
          <li>Total Alerts: {stats.portfolio?.totalAlerts}</li>
          <li>High Priority: {stats.portfolio?.highSeverityAlerts}</li>
        </ul>
      </section>

      {/* News Stats */}
      <section>
        <h3>News</h3>
        <ul>
          <li>Total Alerts: {stats.news?.totalAlerts}</li>
          {stats.news?.alertsBySource && (
            <li>
              Sources:
              <ul>
                {Object.entries(stats.news.alertsBySource).map(([source, count]) => (
                  <li key={source}>{source}: {count}</li>
                ))}
              </ul>
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
```

### Alert History with Pagination

```typescript
function AlertHistory() {
  const [page, setPage] = useState(1);
  const alertsPerPage = 20;
  const { alerts } = useMonitoring();

  const paginatedAlerts = alerts.slice(
    (page - 1) * alertsPerPage,
    page * alertsPerPage
  );

  const totalPages = Math.ceil(alerts.length / alertsPerPage);

  return (
    <div>
      <div className="alerts-list">
        {paginatedAlerts.map(alert => (
          <AlertCard key={alert.id} alert={alert} />
        ))}
      </div>

      <div className="pagination">
        <button 
          disabled={page === 1}
          onClick={() => setPage(p => p - 1)}
        >
          Previous
        </button>
        <span>Page {page} of {totalPages}</span>
        <button 
          disabled={page === totalPages}
          onClick={() => setPage(p => p + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
```

## API Usage Examples

### Initialize Default Portfolio

```typescript
async function setupMonitoring() {
  const baseUrl = 'http://localhost:3001/api/monitoring';
  
  // Load default portfolio
  await fetch(`${baseUrl}/portfolio/load-default`, {
    method: 'POST',
  });

  // Enable global monitoring
  await fetch(`${baseUrl}/portfolio/setup-global`, {
    method: 'POST',
  });

  console.log('✅ Monitoring initialized');
}
```

### Add Custom Monitor

```typescript
async function addCustomMonitor(url: string, name: string) {
  const response = await fetch('http://localhost:3001/api/monitoring/monitors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url,
      name,
      category: 'company',
      checkInterval: 600000, // 10 minutes
      metadata: {
        addedBy: 'user',
        timestamp: new Date().toISOString(),
      },
    }),
  });

  const data = await response.json();
  console.log('Monitor added:', data.id);
  return data.id;
}
```

### Fetch Recent Alerts

```typescript
async function getRecentAlerts() {
  const baseUrl = 'http://localhost:3001/api/monitoring';
  
  const [portfolioRes, newsRes] = await Promise.all([
    fetch(`${baseUrl}/portfolio/alerts?limit=20`),
    fetch(`${baseUrl}/news/alerts?limit=20`),
  ]);

  const portfolio = await portfolioRes.json();
  const news = await newsRes.json();

  return {
    portfolio: portfolio.alerts,
    news: news.alerts,
  };
}
```

## TypeScript Types

```typescript
// Import types from the hook
import type { 
  MonitoringAlert,
  MonitoringStats,
  UseMonitoringOptions,
  UseMonitoringReturn,
} from './hooks/useMonitoring';

// Use in your components
interface MyComponentProps {
  alerts: MonitoringAlert[];
  onAlertClick: (alert: MonitoringAlert) => void;
}
```

## Best Practices

1. **Limit Alert History**: Keep only last 100-200 alerts in memory
2. **Debounce Notifications**: Don't spam users with notifications
3. **Severity Filtering**: Default to showing high/medium alerts only
4. **Reconnection Handling**: Show connection status to users
5. **Error Boundaries**: Wrap monitoring components in error boundaries
6. **Performance**: Use virtualization for long alert lists
7. **Accessibility**: Ensure alerts are screen reader friendly
8. **Testing**: Mock WebSocket connections for testing

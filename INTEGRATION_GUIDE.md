# Integration Guide - Neural Architecture

## Quick Start

### 1. Install Core Architecture

The neural architecture is located in `src/core/`. Import what you need:

```typescript
import {
  initializeCore,
  EventBus,
  EventTypes,
  ServiceRegistry,
  IntelligentRouter,
  AdaptiveCache,
  CircuitBreaker,
  DiagnosticSystem,
} from '@/core';
```

### 2. Initialize System

```typescript
// Initialize with default config
await initializeCore();

// Or with custom config
await initializeCore({
  cache: {
    maxSize: 1000,
    defaultTTL: 300000, // 5 minutes
  },
  diagnostics: {
    enableMonitoring: true,
  },
});
```

### 3. Create Your First Module

```typescript
import { BaseModule, DataProviderModule } from '@/core';

export class MyDataModule extends BaseModule implements DataProviderModule {
  readonly name = 'my-data';
  readonly version = '1.0.0';
  readonly description = 'My data provider';

  protected async onInitialize(): Promise<void> {
    // Initialize resources
    this.subscribe(EventTypes.DATA_REQUESTED, this.handleRequest);
  }

  protected async onShutdown(): Promise<void> {
    // Clean up resources
  }

  protected async onHealthCheck() {
    return { status: 'healthy' as const };
  }

  protected onGetCapabilities() {
    return [
      {
        name: 'query-data',
        description: 'Query data',
        inputTypes: ['query'],
        outputTypes: ['data'],
      },
    ];
  }

  protected getDependencies() {
    return [];
  }

  protected getProvides() {
    return ['data-service'];
  }

  protected getDefaultConfig() {
    return { timeout: 5000 };
  }

  protected getRequiredConfig() {
    return [];
  }

  protected getOptionalConfig() {
    return ['timeout'];
  }

  protected getExamples() {
    return [
      {
        description: 'Query data',
        code: 'await module.query({ type: "data-query" })',
      },
    ];
  }

  async query(query: QueryContract) {
    this.trackRequest();
    // Implement query logic
    return result;
  }
}
```

### 4. Register and Use Module

```typescript
const myModule = new MyDataModule();
await myModule.initialize({ timeout: 10000 });

// Module is now registered and discoverable
const service = ServiceRegistry.get('my-data');
```

## Integrating with Existing Code

### Frontend Components

Update your React components to use the event bus:

```typescript
// components/DrugPipeline.tsx
import { useEffect, useState } from 'react';
import { EventBus, EventTypes } from '@/core';

export function DrugPipeline() {
  const [drugs, setDrugs] = useState([]);

  useEffect(() => {
    // Subscribe to drug updates
    const sub = EventBus.subscribe(EventTypes.DRUG_UPDATED, (event) => {
      setDrugs(current => {
        // Update drugs list
        return updatedDrugs;
      });
    });

    return () => sub.unsubscribe();
  }, []);

  const loadDrugs = async () => {
    // Use intelligent router
    const result = await IntelligentRouter.route({
      id: 'load-drugs',
      type: 'drug-query',
      filters: { phase: 'Phase III' },
    });

    setDrugs(result.data.data);
  };

  return (
    // Your UI
  );
}
```

### Backend Integration (Python)

Create a bridge module to connect Python backend:

```typescript
// modules/python-backend-bridge.ts
import { BaseModule, DataProviderModule } from '@/core';

export class PythonBackendBridge extends BaseModule implements DataProviderModule {
  readonly name = 'python-backend';
  readonly version = '1.0.0';
  readonly description = 'Bridge to Python FastAPI backend';

  private baseUrl: string;

  protected async onInitialize() {
    this.baseUrl = this.config.apiUrl || 'http://localhost:8000';
    
    // Subscribe to events that need backend sync
    this.subscribe(EventTypes.DATA_UPDATED, this.syncToBackend);
  }

  async query(query: QueryContract) {
    const response = await fetch(`${this.baseUrl}/api/v1/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(query),
    });

    return await response.json();
  }

  private async syncToBackend(event: BusEvent) {
    await fetch(`${this.baseUrl}/api/v1/sync`, {
      method: 'POST',
      body: JSON.stringify(event.payload),
    });
  }
}
```

### Node.js Backend Integration

Connect to existing Express/WebSocket backend:

```typescript
// modules/websocket-bridge.ts
import { BaseModule } from '@/core';
import { io, Socket } from 'socket.io-client';

export class WebSocketBridge extends BaseModule {
  readonly name = 'websocket-bridge';
  readonly version = '1.0.0';
  readonly description = 'Real-time WebSocket bridge';

  private socket?: Socket;

  protected async onInitialize() {
    const wsUrl = this.config.wsUrl || 'ws://localhost:3001';
    
    this.socket = io(wsUrl);

    // Forward WebSocket events to event bus
    this.socket.on('market_data', (data) => {
      this.publish(EventTypes.MARKET_DATA_RECEIVED, data, 'high');
    });

    this.socket.on('trial_update', (data) => {
      this.publish(EventTypes.TRIAL_STATUS_CHANGED, data, 'normal');
    });

    // Subscribe to events that need WebSocket broadcast
    this.subscribe(EventTypes.DATA_UPDATED, (event) => {
      this.socket?.emit('data_updated', event.payload);
    });
  }

  protected async onShutdown() {
    this.socket?.disconnect();
  }
}
```

## Migration Path

### Step 1: Add Core Infrastructure

```bash
# Core already exists in src/core/
# Just import and initialize
```

```typescript
// main.ts or App.tsx
import { initializeCore } from '@/core';

async function main() {
  await initializeCore();
  // Rest of your app initialization
}
```

### Step 2: Migrate Services Incrementally

Start with one service at a time:

```typescript
// Before: Direct function calls
import { fetchDrugs } from './api/drugs';
const drugs = await fetchDrugs();

// After: Through intelligent router
import { IntelligentRouter } from '@/core';
const result = await IntelligentRouter.route({
  type: 'drug-query',
  filters: {},
});
const drugs = result.data.data;
```

### Step 3: Add Event-Based Communication

Replace direct calls with events:

```typescript
// Before: Direct updates
updateComponent(newData);

// After: Event-driven
await EventBus.publish(EventTypes.DATA_UPDATED, newData);
```

### Step 4: Integrate Monitoring

Add health checks to existing services:

```typescript
// In your service
async getHealth() {
  return {
    status: this.isConnected ? 'healthy' : 'unhealthy',
    metrics: {
      connectionTime: this.connectionTime,
      requestCount: this.requestCount,
    },
  };
}
```

### Step 5: Add Circuit Breakers

Protect external calls:

```typescript
// Before: Direct API call
const data = await fetch(url);

// After: Protected with circuit breaker
CircuitBreaker.create('external-api', {
  failureThreshold: 5,
  timeout: 60000,
});

const data = await CircuitBreaker.execute('external-api', async () => {
  return await fetch(url);
});
```

## Configuration Migration

### Environment Variables

Map existing env vars to new config system:

```typescript
// Register schema
ConfigurationManager.registerSchema('my-service', {
  apiKey: {
    type: 'string',
    required: true,
    env: 'EXISTING_API_KEY', // Maps to existing env var
    secret: true,
  },
  timeout: {
    type: 'number',
    default: 5000,
    env: 'REQUEST_TIMEOUT',
  },
});

// Load config - will automatically use env vars
const config = ConfigurationManager.loadConfig('my-service');
```

### Configuration Files

Support existing config files:

```typescript
import existingConfig from './config.json';

// Load with overrides from existing config
const config = ConfigurationManager.loadConfig('my-service', existingConfig);
```

## Testing Integration

### Unit Tests

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { MyModule } from './my-module';

describe('MyModule', () => {
  let module: MyModule;

  beforeEach(async () => {
    module = new MyModule();
    await module.initialize();
  });

  afterEach(async () => {
    await module.shutdown();
  });

  it('should handle queries', async () => {
    const result = await module.query({
      id: 'test',
      type: 'test-query',
      filters: {},
    });

    expect(result).toBeDefined();
  });
});
```

### Integration Tests

```typescript
import { initializeCore, IntelligentRouter } from '@/core';

describe('System Integration', () => {
  beforeAll(async () => {
    await initializeCore();
    // Initialize modules
  });

  it('should route queries correctly', async () => {
    const result = await IntelligentRouter.route({
      type: 'drug-query',
      filters: { phase: 'Phase III' },
    });

    expect(result.data).toBeDefined();
  });
});
```

## Performance Considerations

### Caching Strategy

```typescript
// Set appropriate TTLs based on data volatility
AdaptiveCache.set('static-data', data, 3600000); // 1 hour
AdaptiveCache.set('real-time-data', data, 5000); // 5 seconds

// Let adaptive cache optimize TTL based on access patterns
const adaptedTTL = AdaptiveCache.adaptTTL('frequently-accessed');
```

### Event Bus Optimization

```typescript
// Use filtering to reduce unnecessary processing
EventBus.subscribe(
  EventTypes.DATA_UPDATED,
  handler,
  { priority: 'high', source: 'critical-service' }
);

// Batch events when possible
const events = [...];
for (const event of events) {
  await EventBus.publish(event.type, event.payload);
}
```

### Circuit Breaker Tuning

```typescript
// Tune thresholds based on service characteristics
CircuitBreaker.create('fast-service', {
  failureThreshold: 10, // Can tolerate more failures
  timeout: 30000, // Fast recovery
});

CircuitBreaker.create('slow-service', {
  failureThreshold: 3, // Less tolerance
  timeout: 120000, // Longer recovery
});
```

## Monitoring Integration

### Export Metrics

```typescript
// Export diagnostics for external monitoring
const diagnostics = DiagnosticSystem.exportDiagnostics();

// Send to monitoring service
await fetch('http://monitoring.example.com/metrics', {
  method: 'POST',
  body: diagnostics,
});
```

### Custom Health Checks

```typescript
// Add custom health indicators
protected async onHealthCheck() {
  const dbConnected = await this.checkDatabase();
  const apiResponsive = await this.checkAPI();

  if (!dbConnected || !apiResponsive) {
    return {
      status: 'unhealthy',
      message: 'Critical dependencies unavailable',
      metrics: {
        dbConnected,
        apiResponsive,
      },
    };
  }

  return { status: 'healthy' };
}
```

## Troubleshooting

### Debug Event Flow

```typescript
// Subscribe to all events for debugging
EventBus.subscribe('*', (event) => {
  console.log(`[Event] ${event.type}`, event.payload);
});

// View event history
const history = EventBus.getHistory(undefined, 100);
console.table(history);
```

### Check Service Health

```typescript
// Get system health
const health = await DiagnosticSystem.getHealth();

if (health.overall !== 'healthy') {
  console.error('System unhealthy:', health);
  health.recommendations.forEach(rec => console.log('- ', rec));
}
```

### Monitor Circuit Breakers

```typescript
// Check all circuit breakers
const breakers = CircuitBreaker.listBreakers();

breakers.forEach((stats, name) => {
  if (stats.state === 'open') {
    console.warn(`Circuit breaker ${name} is OPEN`);
  }
});
```

## Best Practices

1. **Always Use Contracts**: Define explicit data contracts for all inter-module communication
2. **Implement Health Checks**: Every module should report its health status
3. **Use Event Bus**: Avoid direct module dependencies, use events
4. **Add Circuit Breakers**: Protect external API calls
5. **Monitor Performance**: Track metrics and set up alerting
6. **Document Modules**: Use self-describing methods for auto-documentation
7. **Test Incrementally**: Migrate and test one module at a time
8. **Cache Intelligently**: Use adaptive cache for frequently accessed data

## Support

For issues or questions:
- Check `ARCHITECTURE.md` for detailed component documentation
- Review `src/example-app.ts` for complete working example
- Run diagnostic report: `await DiagnosticSystem.generateReport()`
- Generate docs: `await DocumentationGenerator.generateSystemDocs()`

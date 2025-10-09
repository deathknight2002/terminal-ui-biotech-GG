# 🧬 Neural Architecture - Quick Reference Card

## 🚀 Getting Started (5 Minutes)

### 1. Initialize System
```typescript
import { initializeCore } from '@/core';

await initializeCore({
  cache: { maxSize: 1000, defaultTTL: 300000 },
  diagnostics: { enableMonitoring: true }
});
```

### 2. Create a Module
```typescript
import { BaseModule } from '@/core';

export class MyModule extends BaseModule {
  readonly name = 'my-module';
  readonly version = '1.0.0';
  readonly description = 'My module description';
  
  protected async onInitialize() { /* setup */ }
  protected async onShutdown() { /* cleanup */ }
  protected async onHealthCheck() { 
    return { status: 'healthy' as const };
  }
  // ... implement other abstract methods
}
```

### 3. Use Event Bus
```typescript
import { EventBus, EventTypes } from '@/core';

// Subscribe
const sub = EventBus.subscribe(EventTypes.DATA_LOADED, (event) => {
  console.log('Data loaded:', event.payload);
});

// Publish
await EventBus.publish(EventTypes.DATA_UPDATED, { data: 'value' }, {
  source: 'my-module',
  priority: 'high'
});

// Unsubscribe
sub.unsubscribe();
```

---

## 📦 Core Components

### Event Bus
```typescript
EventBus.subscribe(type, handler, filter?)
EventBus.publish(type, payload, options?)
EventBus.getStats() // Performance metrics
EventBus.getHistory(filter?, limit?) // Event history
```

### Service Registry
```typescript
ServiceRegistry.register(name, service, descriptor)
ServiceRegistry.get<T>(name) // Get service
ServiceRegistry.listServices() // All services
ServiceRegistry.visualizeDependencies() // Dependency graph
```

### Adaptive Cache
```typescript
AdaptiveCache.set(key, value, ttl?)
AdaptiveCache.get<T>(key)
AdaptiveCache.has(key)
AdaptiveCache.getPredictions(limit?) // Predicted accesses
AdaptiveCache.getStats() // Cache metrics
```

### Circuit Breaker
```typescript
CircuitBreaker.create(name, config?)
CircuitBreaker.execute(name, fn)
CircuitBreaker.getState(name) // open/closed/half-open
CircuitBreaker.getStats(name)
CircuitBreaker.reset(name)
```

### Diagnostic System
```typescript
DiagnosticSystem.startMonitoring()
DiagnosticSystem.getHealth() // System health
DiagnosticSystem.generateReport() // Full diagnostic report
DiagnosticSystem.getHealthTrends() // Trend analysis
DiagnosticSystem.exportDiagnostics() // JSON export
```

### Intelligent Router
```typescript
IntelligentRouter.route<T>(query, config?)
IntelligentRouter.getStats() // Router metrics
IntelligentRouter.getModuleRecommendations(queryType)
```

### Configuration Manager
```typescript
ConfigurationManager.registerSchema(name, schema)
ConfigurationManager.loadConfig(name, provided?)
ConfigurationManager.validateConfig(name, config)
ConfigurationManager.generateDocs(name)
```

### Documentation Generator
```typescript
DocumentationGenerator.generateSystemDocs()
DocumentationGenerator.exportToFile(filepath)
```

---

## 🎯 Common Patterns

### Pattern 1: Create and Register Module
```typescript
const myModule = new MyModule();
await myModule.initialize({ config: 'value' });
// Automatically registered in ServiceRegistry
```

### Pattern 2: Query with Caching
```typescript
const result = await IntelligentRouter.route({
  id: 'query-1',
  type: 'drug-query',
  filters: { phase: 'Phase III' }
}, {
  cacheable: true, // Enable caching
  timeout: 5000,
  priority: 'high'
});
```

### Pattern 3: Protected API Call
```typescript
CircuitBreaker.create('external-api', {
  failureThreshold: 5,
  timeout: 60000
});

const data = await CircuitBreaker.execute('external-api', async () => {
  return await fetch('https://api.example.com/data');
});
```

### Pattern 4: Health Monitoring
```typescript
const health = await DiagnosticSystem.getHealth();

if (health.overall !== 'healthy') {
  console.warn('System degraded:', health.recommendations);
}
```

### Pattern 5: Event-Driven Updates
```typescript
// Publisher
await EventBus.publish(EventTypes.DATA_UPDATED, {
  id: 'DRUG-001',
  updates: { phase: 'Phase III' }
}, { source: 'drug-service', priority: 'high' });

// Subscriber (in another module)
EventBus.subscribe(EventTypes.DATA_UPDATED, async (event) => {
  await this.handleUpdate(event.payload);
});
```

### Pattern 6: Declarative Configuration
```typescript
ConfigurationManager.registerSchema('my-service', {
  apiKey: {
    type: 'string',
    required: true,
    env: 'MY_API_KEY',
    secret: true
  },
  timeout: {
    type: 'number',
    default: 5000,
    validate: (v) => v > 0 || 'Must be positive'
  }
});

const config = ConfigurationManager.loadConfig('my-service');
```

---

## 🔧 Configuration Options

### Event Bus
- `maxHistorySize`: Number of events to keep in history (default: 1000)

### Adaptive Cache
- `maxSize`: Maximum cache entries (default: 1000)
- `defaultTTL`: Default TTL in ms (default: 300000)
- `enablePredictive`: Enable predictions (default: true)
- `evictionPolicy`: 'lru' | 'lfu' | 'ttl' (default: 'lru')

### Circuit Breaker
- `failureThreshold`: Failures to open circuit (default: 5)
- `successThreshold`: Successes to close (default: 2)
- `timeout`: Open state duration in ms (default: 60000)
- `resetTimeout`: Half-open attempt delay in ms (default: 30000)

### Diagnostic System
- `healthCheckInterval`: Check frequency in ms (default: 30000)

---

## 📊 Event Types

```typescript
EventTypes.DATA_LOADED        // Data successfully loaded
EventTypes.DATA_UPDATED       // Data updated
EventTypes.DATA_ERROR         // Data operation error
EventTypes.DATA_CACHED        // Data cached

EventTypes.SYSTEM_READY       // System initialized
EventTypes.SYSTEM_ERROR       // System error
EventTypes.SYSTEM_DEGRADED    // System degraded
EventTypes.SYSTEM_RECOVERED   // System recovered

EventTypes.MODULE_REGISTERED  // Module registered
EventTypes.MODULE_INITIALIZED // Module initialized
EventTypes.MODULE_ERROR       // Module error

EventTypes.DRUG_UPDATED       // Drug data updated
EventTypes.CATALYST_TRIGGERED // Catalyst event
EventTypes.TRIAL_STATUS_CHANGED // Clinical trial status changed
EventTypes.MARKET_DATA_RECEIVED // Market data received
```

---

## 🧪 Testing

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
    const result = await module.query({ type: 'test', filters: {} });
    expect(result).toBeDefined();
  });
});
```

---

## 🐛 Debugging

### View Event History
```typescript
const history = EventBus.getHistory(undefined, 100);
console.table(history);
```

### Check System Health
```typescript
const health = await DiagnosticSystem.getHealth();
console.log('Status:', health.overall);
console.log('Components:', health.components);
console.log('Recommendations:', health.recommendations);
```

### Monitor Circuit Breakers
```typescript
const breakers = CircuitBreaker.listBreakers();
breakers.forEach((stats, name) => {
  console.log(`${name}: ${stats.state} (${stats.failures} failures)`);
});
```

### Cache Analysis
```typescript
const stats = AdaptiveCache.getStats();
console.log(`Hit rate: ${(stats.hitRate * 100).toFixed(1)}%`);
console.log(`Size: ${stats.currentSize}/${stats.maxSize}`);

const predictions = AdaptiveCache.getPredictions(5);
console.log('Predicted next accesses:', predictions);
```

### Export Diagnostics
```typescript
const diagnostics = DiagnosticSystem.exportDiagnostics();
console.log(diagnostics); // Full system state as JSON
```

---

## 📚 Documentation

- **ARCHITECTURE.md** - Full architecture guide
- **INTEGRATION_GUIDE.md** - Step-by-step integration
- **TRANSFORMATION_SUMMARY.md** - Visual before/after
- **src/example-app.ts** - Complete working example
- **src/modules/drug-data-module.ts** - Reference implementation

---

## 🎯 Best Practices

✅ **Always use contracts** for inter-module communication
✅ **Implement health checks** in every module
✅ **Use event bus** instead of direct calls
✅ **Add circuit breakers** for external APIs
✅ **Monitor performance** with diagnostics
✅ **Document modules** using describe()
✅ **Test incrementally** with Vitest
✅ **Cache intelligently** with adaptive cache

---

## 🚨 Common Mistakes to Avoid

❌ **Don't** call modules directly - use IntelligentRouter
❌ **Don't** skip health checks - system relies on them
❌ **Don't** ignore circuit breaker states
❌ **Don't** cache without TTL consideration
❌ **Don't** forget to unsubscribe from events
❌ **Don't** bypass configuration validation
❌ **Don't** ignore diagnostic recommendations

---

## 📞 Need Help?

1. Check example app: `src/example-app.ts`
2. Generate system docs: `DocumentationGenerator.generateSystemDocs()`
3. Run diagnostics: `DiagnosticSystem.generateReport()`
4. Review health: `DiagnosticSystem.getHealth()`

---

**Status**: ✅ Production Ready
**Version**: 1.0.0
**Architecture**: Neural Network Pattern

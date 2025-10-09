# P0/P1 Biotech Infrastructure Implementation

This document describes the production-grade infrastructure and biotech data integrations added to make the platform FactSet-grade.

## Overview

This implementation adds:
- **P0 Foundation**: CloudEvents integration, Dependency Injection, 12-Factor configuration
- **P1 Biotech Integrations**: FAERS connector, Drugs@FDA connector, Catalyst Timeline Engine
- **P2 Testing**: Comprehensive test coverage for all new components

## P0: Foundation - Production-Serious Platform

### 1. Dependency Injection Container

**Location**: `src/core/di-container.ts`

A lightweight IoC container for managing service dependencies and lifecycle.

**Features**:
- Singleton and transient service lifetimes
- Type-safe service registration with symbols
- Scope creation for child containers
- Dependency resolution with automatic injection

**Usage**:
```typescript
import { container, ServiceTokens } from '@/core/di-container';

// Register singleton service
container.registerSingleton(ServiceTokens.EventBus, (c) => {
  return new EventBusImpl();
});

// Register transient service
container.registerTransient('logger', () => new Logger());

// Resolve service
const eventBus = container.resolve(ServiceTokens.EventBus);
```

**Service Tokens**:
- `ServiceTokens.EventBus` - Core event bus
- `ServiceTokens.Telemetry` - Distributed tracing
- `ServiceTokens.Metrics` - Prometheus metrics
- `ServiceTokens.Health` - Health check system
- `ServiceTokens.CTGovV2Connector` - ClinicalTrials.gov connector
- `ServiceTokens.FAERSConnector` - FAERS connector
- `ServiceTokens.DrugsAtFDAConnector` - Drugs@FDA connector
- `ServiceTokens.CatalystEngine` - Catalyst timeline engine

### 2. CloudEvents EventBus Integration

**Location**: `src/core/cloudevent-bus.ts`

Wraps the EventBus with CloudEvents v1.0 envelope for standardized event handling.

**Features**:
- CloudEvents v1.0 spec compliance
- Durable backend support (in-memory and extensible)
- Contract validation for type-safe events
- Query events by type, source, time range
- CloudEvents-native pub/sub

**Usage**:
```typescript
import { createCloudEventBus } from '@/core/cloudevent-bus';

// Create CloudEventBus with durable backend
const cloudEventBus = createCloudEventBus({
  source: 'biotech-terminal',
  validateContracts: true,
});

// Publish CloudEvent
await cloudEventBus.publishCloudEvent('biotech.trial.updated', {
  nctId: 'NCT12345678',
  status: 'Completed',
});

// Subscribe to CloudEvents
cloudEventBus.subscribeCloudEvent('biotech.trial.updated', async (event) => {
  console.log('Trial updated:', event.data);
});

// Query historical events
const events = await cloudEventBus.queryEvents({
  type: 'biotech.trial.updated',
  startTime: '2023-01-01T00:00:00Z',
  endTime: '2023-12-31T23:59:59Z',
});
```

**Durable Backend**:
```typescript
import { InMemoryDurableBackend } from '@/core/cloudevent-bus';

// In-memory backend (for development)
const backend = new InMemoryDurableBackend();

// Custom backend (implement DurableEventBackend interface)
class PostgresDurableBackend implements DurableEventBackend {
  async store(event: CloudEvent): Promise<void> { /* ... */ }
  async retrieve(id: string): Promise<CloudEvent | undefined> { /* ... */ }
  async query(criteria: any): Promise<CloudEvent[]> { /* ... */ }
}
```

### 3. 12-Factor Configuration with Secrets Management

**Location**: `src/core/configuration-manager.ts` (already implemented)

Declarative configuration system with environment variable support and secrets masking.

**Features**:
- Environment variable mapping
- Type validation (string, number, boolean, object, array)
- Custom validators
- Secret field masking
- Configuration documentation generation
- Runtime overrides

**Usage**:
```typescript
import { ConfigurationManager } from '@/core/configuration-manager';

// Register schema
ConfigurationManager.registerSchema('faers-connector', {
  apiKey: {
    type: 'string',
    description: 'OpenFDA API key for higher rate limits',
    env: 'OPENFDA_API_KEY',
    secret: true,
    required: false,
  },
  rateLimit: {
    type: 'number',
    description: 'Max requests per minute',
    env: 'FAERS_RATE_LIMIT',
    default: 60,
  },
});

// Load config
const config = ConfigurationManager.loadConfig('faers-connector');

// Export configs (secrets masked)
const allConfigs = ConfigurationManager.exportConfigs(true);
```

## P1: Biotech Data Brain - Scientific Integrations

### 1. openFDA FAERS Connector

**Location**: `src/connectors/faers.ts`

Connects to FDA Adverse Event Reporting System (FAERS) via openFDA API.

**Features**:
- Search by drug name, reaction, country, date range
- Normalize to FAERSContract@1.0
- Automatic query escaping
- Seriousness classification
- API key support for higher rate limits

**Usage**:
```typescript
import { FAERSConnector } from '@/connectors/faers';

const connector = new FAERSConnector('your-api-key');

// Search by drug name
const events = await connector.getByDrug('aspirin', 100);

// Search by reaction
const headaches = await connector.getByReaction('headache', 50);

// Search by date range
const recentEvents = await connector.getByDateRange(
  '20230101',
  '20231231',
  'aspirin'
);

// Advanced search
const results = await connector.search({
  drugName: 'aspirin',
  reaction: 'headache',
  country: 'US',
  startDate: '20230101',
  endDate: '20231231',
  limit: 100,
});
```

**Contract Output**:
```typescript
{
  version: '1.0',
  schema: 'faers-adverse-event',
  data: {
    safetyReportId: '12345678',
    drugName: 'ASPIRIN',
    reactionMeddrapt: 'Headache',
    seriousnessCode: 'Not Serious',
    occurCountry: 'US',
    reportDate: '20230115',
  },
  metadata: {
    source: 'openFDA',
    timestamp: 1234567890,
  },
}
```

### 2. Drugs@FDA Connector

**Location**: `src/connectors/drugsfda.ts`

Connects to Drugs@FDA API for drug approvals, labels, and regulatory data.

**Features**:
- Search by brand name, generic name, sponsor, application number
- Normalize to DrugApprovalContract@1.0
- Handle multiple products per application
- Classify approval types (Priority Review, Breakthrough Therapy, etc.)
- Extract dosage form and route information

**Usage**:
```typescript
import { DrugsAtFDAConnector } from '@/connectors/drugsfda';

const connector = new DrugsAtFDAConnector('your-api-key');

// Search by brand name
const approvals = await connector.getByBrandName('Lipitor', 10);

// Search by generic name
const statins = await connector.getByGenericName('atorvastatin', 10);

// Search by sponsor
const pfizerDrugs = await connector.getBySponsor('Pfizer', 50);

// Get specific application
const app = await connector.getByApplicationNumber('NDA020702');

// Advanced search
const results = await connector.search({
  brandName: 'Lipitor',
  sponsorName: 'Pfizer',
  limit: 10,
});
```

**Contract Output**:
```typescript
{
  version: '1.0',
  schema: 'drug-approval',
  data: {
    applicationNumber: 'NDA020702',
    sponsorName: 'Pfizer Inc',
    productNumber: '001',
    brandName: 'LIPITOR',
    genericName: 'atorvastatin calcium',
    approvalDate: '1996-12-17',
    approvalType: 'New Drug Application',
    activeIngredient: 'atorvastatin calcium',
    dosageForm: 'TABLET',
    route: 'ORAL',
  },
  metadata: {
    source: 'Drugs@FDA',
    timestamp: 1234567890,
  },
}
```

### 3. Catalyst Timeline Engine

**Location**: `src/connectors/catalyst-engine.ts`

Aggregates and analyzes pharmaceutical catalysts from multiple sources.

**Features**:
- Add/remove/filter catalysts
- Timeline visualization with date ranges
- Summary statistics (by type, impact, drug, company)
- Auto-sync from CT.gov, Drugs@FDA, FAERS
- Upcoming and recent catalyst queries

**Usage**:
```typescript
import { CatalystEngine } from '@/connectors/catalyst-engine';
import { CTGovV2Connector } from '@/connectors/ctgov-v2';
import { DrugsAtFDAConnector } from '@/connectors/drugsfda';
import { FAERSConnector } from '@/connectors/faers';

// Create engine with connectors
const engine = new CatalystEngine({
  ctgovConnector: new CTGovV2Connector(),
  drugsAtFDAConnector: new DrugsAtFDAConnector(),
  faersConnector: new FAERSConnector(),
});

// Sync from external sources
await engine.syncFromFDAApprovals('Keytruda');
await engine.syncFromClinicalTrials('lung cancer');
await engine.syncFromAdverseEvents('Keytruda');

// Add manual catalyst
engine.addCatalyst({
  version: '1.0',
  schema: 'catalyst',
  data: {
    id: 'cat-partnership-001',
    type: 'partnership',
    title: 'Merck Partners with BioNTech',
    description: 'Collaboration on mRNA cancer vaccines',
    eventDate: '2023-06-15',
    impact: 'positive',
    confidence: 0.9,
  },
  metadata: {
    source: 'manual',
    timestamp: Date.now(),
    detectedAt: Date.now(),
  },
});

// Get timeline
const timeline = engine.getTimeline('2023-01-01', '2023-12-31');
console.log('Total catalysts:', timeline.summary.total);
console.log('By type:', timeline.summary.byType);
console.log('By impact:', timeline.summary.byImpact);

// Filter catalysts
const positiveCatalysts = engine.getCatalysts({
  impact: 'positive',
  type: 'approval',
});

// Get upcoming events (next 90 days)
const upcoming = engine.getUpcoming(90);

// Get recent events (last 30 days)
const recent = engine.getRecent(30);
```

**Timeline Summary**:
```typescript
{
  startDate: '2023-01-01',
  endDate: '2023-12-31',
  catalysts: [...],
  summary: {
    total: 42,
    byType: {
      approval: 10,
      trial_result: 15,
      label_update: 5,
      fda_action: 8,
      partnership: 4,
    },
    byImpact: {
      positive: 25,
      negative: 8,
      neutral: 9,
    },
    topDrugs: [
      { drugId: 'drug-001', count: 12 },
      { drugId: 'drug-002', count: 8 },
    ],
    topCompanies: [
      { companyId: 'merck', count: 15 },
      { companyId: 'pfizer', count: 10 },
    ],
  },
}
```

## P2: Analytics & Testing

### Test Coverage

All new components have comprehensive test coverage:

- **FAERS Connector**: `src/__tests__/faers.test.ts` (280+ lines, 30+ tests)
- **Drugs@FDA Connector**: `src/__tests__/drugsfda.test.ts` (270+ lines, 28+ tests)
- **Catalyst Engine**: `src/__tests__/catalyst-engine.test.ts` (480+ lines, 40+ tests)
- **CloudEventBus**: `src/__tests__/cloudevent-bus.test.ts` (340+ lines, 32+ tests)
- **DI Container**: `src/__tests__/di-container.test.ts` (320+ lines, 35+ tests)

**Run tests**:
```bash
# Root level tests (src/__tests__)
npx vitest run src/__tests__

# All workspace tests
npm run test

# With coverage
npx vitest run --coverage
```

### Integration Testing

The CloudEventBus integrates all components:

```typescript
import { createCloudEventBus } from '@/core/cloudevent-bus';
import { container, ServiceTokens } from '@/core/di-container';
import { FAERSConnector } from '@/connectors/faers';
import { DrugsAtFDAConnector } from '@/connectors/drugsfda';
import { CatalystEngine } from '@/connectors/catalyst-engine';

// Register connectors in DI container
container.registerSingleton(ServiceTokens.FAERSConnector, () => 
  new FAERSConnector(process.env.OPENFDA_API_KEY)
);

container.registerSingleton(ServiceTokens.DrugsAtFDAConnector, () => 
  new DrugsAtFDAConnector(process.env.OPENFDA_API_KEY)
);

container.registerSingleton(ServiceTokens.CatalystEngine, (c) => 
  new CatalystEngine({
    faersConnector: c.resolve(ServiceTokens.FAERSConnector),
    drugsAtFDAConnector: c.resolve(ServiceTokens.DrugsAtFDAConnector),
  })
);

// Create CloudEventBus
const cloudEventBus = createCloudEventBus({
  source: 'biotech-terminal',
  validateContracts: true,
});

// Subscribe to contract-validated events
cloudEventBus.subscribeCloudEvent('biotech.faers.v1', async (event) => {
  const faersData = event.data;
  console.log('FAERS event:', faersData);
});

// Publish FAERS data as CloudEvent with contract validation
const faersConnector = container.resolve(ServiceTokens.FAERSConnector);
const events = await faersConnector.getByDrug('aspirin', 10);

for (const event of events) {
  await cloudEventBus.publishContract('faers', event);
}
```

## Architecture Diagrams

### Data Flow
```
External APIs → Connectors → Contracts → CloudEventBus → UI Components
     ↓              ↓            ↓            ↓
  CT.gov v2    Normalize    Validate    Durable     React Components
  openFDA         to          with       Storage     (Terminal App)
  Drugs@FDA    Contract      Zod
```

### Dependency Injection
```
DIContainer
    ├── Telemetry (Singleton)
    ├── Metrics (Singleton)
    ├── Health (Singleton)
    ├── EventBus (Singleton)
    ├── CTGovV2Connector (Singleton)
    ├── FAERSConnector (Singleton)
    ├── DrugsAtFDAConnector (Singleton)
    └── CatalystEngine (Singleton)
         ├── depends on: CTGovV2Connector
         ├── depends on: FAERSConnector
         └── depends on: DrugsAtFDAConnector
```

### CloudEvents Flow
```
Publisher → makeEvent() → CloudEvent → Validate → Durable Backend → EventBus
                                          ↓
                                     Contract Schema
                                          ↓
                                    Zod Validation
```

## Environment Configuration

Create `.env` file:
```bash
# OpenFDA API Key (optional, for higher rate limits)
OPENFDA_API_KEY=your_api_key_here

# CloudEvents Configuration
CLOUDEVENTS_SOURCE=biotech-terminal
CLOUDEVENTS_VALIDATE_CONTRACTS=true

# FAERS Connector
FAERS_RATE_LIMIT=60

# Drugs@FDA Connector
DRUGSFDA_RATE_LIMIT=60

# Catalyst Engine
CATALYST_AUTO_SYNC=true
CATALYST_SYNC_INTERVAL=3600000
```

## Integration with UI

The new infrastructure integrates seamlessly with the terminal app:

1. **DI Container Setup** (`terminal/src/main.tsx`):
```typescript
import { container, ServiceTokens } from '@biotech-terminal/frontend-components/core';
import { FAERSConnector, DrugsAtFDAConnector, CatalystEngine } from '@biotech-terminal/frontend-components/connectors';

// Initialize DI container
container.registerSingleton(ServiceTokens.FAERSConnector, () => 
  new FAERSConnector(import.meta.env.VITE_OPENFDA_API_KEY)
);

container.registerSingleton(ServiceTokens.DrugsAtFDAConnector, () => 
  new DrugsAtFDAConnector(import.meta.env.VITE_OPENFDA_API_KEY)
);

container.registerSingleton(ServiceTokens.CatalystEngine, (c) => 
  new CatalystEngine({
    faersConnector: c.resolve(ServiceTokens.FAERSConnector),
    drugsAtFDAConnector: c.resolve(ServiceTokens.DrugsAtFDAConnector),
  })
);
```

2. **Use in React Components**:
```typescript
import { useEffect, useState } from 'react';
import { container, ServiceTokens } from '@biotech-terminal/frontend-components/core';
import { FAERSContract } from '@biotech-terminal/frontend-components/contracts';

export function AdverseEventsWidget({ drugName }: { drugName: string }) {
  const [events, setEvents] = useState<FAERSContract[]>([]);

  useEffect(() => {
    const connector = container.resolve(ServiceTokens.FAERSConnector);
    connector.getByDrug(drugName, 50).then(setEvents);
  }, [drugName]);

  return (
    <div>
      {events.map(event => (
        <div key={event.data.safetyReportId}>
          <strong>{event.data.reactionMeddrapt}</strong>
          <span>{event.data.seriousnessCode}</span>
        </div>
      ))}
    </div>
  );
}
```

3. **Catalyst Timeline Component**:
```typescript
import { useEffect, useState } from 'react';
import { container, ServiceTokens } from '@biotech-terminal/frontend-components/core';
import { CatalystTimeline } from '@biotech-terminal/frontend-components/connectors';

export function CatalystTimelineWidget() {
  const [timeline, setTimeline] = useState<CatalystTimeline | null>(null);

  useEffect(() => {
    const engine = container.resolve(ServiceTokens.CatalystEngine);
    const data = engine.getTimeline('2023-01-01', '2023-12-31');
    setTimeline(data);
  }, []);

  if (!timeline) return <div>Loading...</div>;

  return (
    <div>
      <h2>Catalyst Timeline</h2>
      <p>Total Events: {timeline.summary.total}</p>
      <div>
        {timeline.catalysts.map(catalyst => (
          <div key={catalyst.data.id}>
            <strong>{catalyst.data.title}</strong>
            <span>{catalyst.data.eventDate}</span>
            <span>{catalyst.data.impact}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Next Steps

1. **UI Integration**: Add components to terminal app pages
2. **Real-time Updates**: Connect CloudEventBus to WebSocket for live data
3. **Caching**: Add Redis cache layer for FAERS/FDA queries
4. **Rate Limiting**: Implement rate limiter for API calls
5. **Monitoring**: Connect Telemetry and Metrics to Prometheus/Grafana

## API Documentation

See individual connector files for detailed API documentation:
- FAERS: `src/connectors/faers.ts`
- Drugs@FDA: `src/connectors/drugsfda.ts`
- Catalyst Engine: `src/connectors/catalyst-engine.ts`
- CloudEventBus: `src/core/cloudevent-bus.ts`
- DI Container: `src/core/di-container.ts`

## License

MIT

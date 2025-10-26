# Platform Upgrades - Implementation Roadmap

## Completed PRs

### ✅ PR 1 - Feature Flags / Remote Config (Unleash)
**Status**: Complete
**Files Added**:
- `mobile/src/services/featureFlagService.ts` - Core flag service with safe defaults
- `mobile/src/hooks/useFeatureFlag.ts` - React hooks for components
- `mobile/src/components/FeatureFlagProvider.tsx` - Context provider
- `backend/src/services/feature-flag-service.ts` - Backend flag management
- `backend/src/routes/feature-flags.ts` - API endpoints

**Key Features**:
- 9 feature flags defined (search, storage, ux, security, observability, sw, background)
- Safe fallback to defaults when proxy unreachable
- Unleash-compatible proxy endpoint
- Environment variable configuration
- 12/12 tests passing

---

### ✅ PR 2 - Local-first Storage Migration (RxDB)
**Status**: Complete
**Files Added**:
- `mobile/src/services/rxdb/schemas.ts` - Type-safe schemas for 5 collections
- `mobile/src/services/rxdb/database.ts` - RxDB initialization with encryption
- `mobile/src/services/rxdb/migration.ts` - Migration from offlineStorage
- `mobile/src/hooks/useRxDB.ts` - Reactive data access hooks
- `backend/src/routes/rxdb.ts` - Replication endpoints (pull/push)

**Key Features**:
- 5 collections: companies, pipelines, news, portfolio, notes
- Field-level encryption for PII (notes, portfolio notes)
- HTTP replication with exponential backoff
- Automatic sync when online
- Guarded by `storage.rxdb` feature flag
- Zero-config offline-first

---

## Remaining PRs - Implementation Guide

### PR 3 - Global Search (Meilisearch)

**Estimated Effort**: 3-4 hours
**Feature Flag**: `search.meilisearch`

#### Backend Setup

```bash
# Add to docker-compose.yml
services:
  meilisearch:
    image: getmeili/meilisearch:v1.5
    ports:
      - "7700:7700"
    environment:
      - MEILI_MASTER_KEY=your-master-key
      - MEILI_ENV=development
    volumes:
      - ./data/meilisearch:/meili_data
```

#### Files to Create

1. **backend/src/services/meilisearch-indexer.ts**
```typescript
import { MeiliSearch } from 'meilisearch';

export class MeilisearchIndexer {
  private client: MeiliSearch;

  constructor() {
    this.client = new MeiliSearch({
      host: process.env.MEILI_HOST || 'http://localhost:7700',
      apiKey: process.env.MEILI_API_KEY || 'your-master-key',
    });
  }

  async indexCompanies(companies: any[]) {
    const index = this.client.index('companies');
    await index.addDocuments(companies);
  }

  // Similar for news, notes
}
```

2. **mobile/src/services/searchService.ts**
```typescript
import { MeiliSearch } from 'meilisearch';
import { useFeatureFlag } from '../hooks/useFeatureFlag';

export class SearchService {
  private client: MeiliSearch;

  constructor() {
    this.client = new MeiliSearch({
      host: 'http://localhost:7700',
      apiKey: 'your-search-key',
    });
  }

  async search(query: string, filters?: any) {
    const results = await this.client.index('companies').search(query, {
      filter: filters,
      limit: 20,
      attributesToHighlight: ['name', 'description'],
    });
    return results;
  }
}
```

3. **mobile/src/components/SearchBar.tsx**
- Debounced input with instant results
- Faceted filtering by sector, phase
- Keyboard navigation

**Acceptance Criteria**:
- Sub-200ms search response time
- Offline fallback to local keyword filter
- MCP tool for AI chat integration

---

### PR 4 - Observability (Sentry + PostHog + OpenTelemetry)

**Estimated Effort**: 4-5 hours
**Feature Flags**: `observability.sentry`, `observability.posthog`, `observability.opentelemetry`

#### Dependencies

```bash
cd mobile && npm install @sentry/react posthog-js @opentelemetry/api @opentelemetry/sdk-trace-web
cd backend && npm install @sentry/node @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node
```

#### Files to Create

1. **mobile/src/services/observability/sentry.ts**
```typescript
import * as Sentry from '@sentry/react';
import { useFeatureFlag } from '../../hooks/useFeatureFlag';

export function initializeSentry() {
  const isEnabled = useFeatureFlag('observability.sentry');
  if (!isEnabled) return;

  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [
      new Sentry.BrowserTracing(),
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event) {
      // Scrub PII
      if (event.request) {
        delete event.request.cookies;
      }
      return event;
    },
  });
}
```

2. **mobile/src/services/observability/posthog.ts**
```typescript
import posthog from 'posthog-js';

export function initializePostHog() {
  const isEnabled = useFeatureFlag('observability.posthog');
  if (!isEnabled) return;

  posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
    api_host: import.meta.env.VITE_POSTHOG_HOST,
    autocapture: false,
    capture_pageview: true,
    capture_pageleave: true,
  });
}

export function trackEvent(name: string, properties?: Record<string, any>) {
  posthog.capture(name, properties);
}

// Track specific events
export const events = {
  voiceStarted: () => trackEvent('voice_input_started'),
  wsReconnected: () => trackEvent('websocket_reconnected'),
  searchUsed: (query: string) => trackEvent('search_used', { query }),
};
```

3. **backend/src/services/observability/otel.ts**
```typescript
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

export function initializeOpenTelemetry() {
  const sdk = new NodeSDK({
    traceExporter: new OTLPTraceExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
    }),
    instrumentations: [getNodeAutoInstrumentations()],
  });

  sdk.start();

  process.on('SIGTERM', () => {
    sdk.shutdown().then(
      () => console.log('SDK shut down successfully'),
      (err) => console.error('Error shutting down SDK', err),
    );
  });
}
```

**Acceptance Criteria**:
- Error triage shows stack traces + breadcrumbs
- Session replay for debugging (PII scrubbed)
- Latency waterfall from mobile → backend

---

### PR 5 - Service Worker Hardened via Workbox

**Estimated Effort**: 3-4 hours
**Feature Flag**: `sw.workbox`

#### Dependencies

```bash
cd mobile && npm install -D workbox-build workbox-window
```

#### Files to Create

1. **mobile/vite.config.ts** (update)
```typescript
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      injectRegister: false,
      manifest: {
        name: 'Biotech Terminal',
        short_name: 'BioTerminal',
        theme_color: '#00ff41',
      },
      workbox: {
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
      },
    }),
  ],
});
```

2. **mobile/src/sw.ts**
```typescript
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { BackgroundSyncPlugin } from 'workbox-background-sync';

declare const self: ServiceWorkerGlobalScope;

// Precache build assets
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// NetworkFirst for API calls
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      {
        cacheWillUpdate: async ({ response }) => {
          if (response && response.status === 200) {
            return response;
          }
          return null;
        },
      },
    ],
  })
);

// StaleWhileRevalidate for charts and news
registerRoute(
  ({ url }) => url.pathname.includes('/charts/') || url.pathname.includes('/news/'),
  new StaleWhileRevalidate({
    cacheName: 'data-cache',
  })
);

// BackgroundSync for mutations
const bgSyncPlugin = new BackgroundSyncPlugin('mutations-queue', {
  maxRetentionTime: 24 * 60, // Retry for up to 24 hours
});

registerRoute(
  ({ url, request }) =>
    url.pathname.startsWith('/api/') && ['POST', 'PUT', 'DELETE'].includes(request.method),
  new NetworkOnly({
    plugins: [bgSyncPlugin],
  })
);
```

**Acceptance Criteria**:
- Offline navigation works seamlessly
- Queued writes sync when connection restored
- Safe upgrade path (no cache poisoning)

---

### PR 6 - Native UX: iOS Live Activities + Deep Links

**Estimated Effort**: 6-8 hours (requires Swift)
**Feature Flag**: `ux.liveActivities`

#### Swift Widget Extension

1. **ios/App/WidgetExtension/LiveActivityWidget.swift**
```swift
import ActivityKit
import WidgetKit
import SwiftUI

struct BiotechAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var title: String
        var subtitle: String
        var progress: Double
    }

    var type: String
    var id: String
}

@main
struct LiveActivityWidget: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: BiotechAttributes.self) { context in
            // Lock screen UI
            HStack {
                VStack(alignment: .leading) {
                    Text(context.state.title)
                        .font(.headline)
                    Text(context.state.subtitle)
                        .font(.caption)
                }
                Spacer()
                ProgressView(value: context.state.progress)
            }
            .padding()
        } dynamicIsland: { context in
            // Dynamic Island UI
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Text(context.state.title)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text("\(Int(context.state.progress * 100))%")
                }
            } compactLeading: {
                Image(systemName: "pill.fill")
            } compactTrailing: {
                Text("\(Int(context.state.progress * 100))%")
            } minimal: {
                Image(systemName: "pill.fill")
            }
        }
    }
}
```

2. **mobile/src/services/liveActivities.ts**
```typescript
import { Plugins } from '@capacitor/core';

export interface LiveActivityData {
  type: 'fda_advisory' | 'price_move';
  id: string;
  title: string;
  subtitle: string;
  progress: number;
}

export async function startActivity(data: LiveActivityData): Promise<string> {
  const { LiveActivity } = Plugins;
  const activityId = await LiveActivity.start(data);
  return activityId;
}

export async function updateActivity(activityId: string, data: Partial<LiveActivityData>): Promise<void> {
  const { LiveActivity } = Plugins;
  await LiveActivity.update({ activityId, ...data });
}

export async function endActivity(activityId: string): Promise<void> {
  const { LiveActivity } = Plugins;
  await LiveActivity.end({ activityId });
}
```

3. **mobile/src/services/deepLinks.ts**
```typescript
import { App } from '@capacitor/app';
import { useNavigate } from 'react-router-dom';

export function setupDeepLinks() {
  App.addListener('appUrlOpen', (data) => {
    const url = new URL(data.url);
    const path = url.pathname;

    // Route deep links
    if (path.startsWith('/ticker/')) {
      const symbol = path.split('/')[2];
      navigate(`/company/${symbol}`);
    } else if (path.startsWith('/catalyst/')) {
      const id = path.split('/')[2];
      navigate(`/catalyst/${id}`);
    }
  });
}
```

**Acceptance Criteria**:
- Live Activity appears on Lock Screen
- Updates via push or local
- Deep links navigate correctly

---

### PR 7 - Background Refresh

**Estimated Effort**: 2-3 hours
**Feature Flag**: `background.fetch`

```bash
npm install @transistorsoft/capacitor-background-fetch
```

```typescript
import BackgroundFetch from '@transistorsoft/capacitor-background-fetch';

export async function setupBackgroundFetch() {
  const isEnabled = featureFlagService.isEnabled('background.fetch');
  if (!isEnabled) return;

  const status = await BackgroundFetch.configure({
    minimumFetchInterval: 15, // minutes
  }, async (taskId) => {
    console.log('[BackgroundFetch] Event:', taskId);

    // Refresh RxDB indexes
    await rxdbService.getDatabase();

    // Update widget data
    await updateWidgetData();

    BackgroundFetch.finish(taskId);
  });

  console.log('[BackgroundFetch] Status:', status);
}
```

---

### PR 8 - Passkeys (WebAuthn)

**Estimated Effort**: 5-6 hours
**Feature Flag**: `security.passkeys`

```bash
npm install @simplewebauthn/browser @simplewebauthn/server
```

Backend routes + frontend flows for passkey registration/authentication.

---

### PR 9 - DevX & Tests

**Estimated Effort**: 4-5 hours

```bash
npm install -D msw @playwright/test comlink
```

MSW handlers, Playwright e2e tests, Web Worker for TA computations.

---

## Next Steps

1. **Review & Merge PRs 1-2**: Feature flags and RxDB are production-ready
2. **Prioritize PR 3 (Search)**: High user value, moderate complexity
3. **PR 4 (Observability)**: Critical for production monitoring
4. **PRs 5-9**: Can be implemented in parallel by different team members

## Documentation

- ✅ `docs/UPGRADES.md` - Setup guide for completed features
- ⏳ Update with search, observability, and native UX guides as PRs complete

## Testing Strategy

- Unit tests: All services and hooks
- Integration tests: MSW for API mocking
- E2E tests: Playwright for critical user flows
- Manual testing: Each feature behind flag

# Platform Upgrades Guide

This guide documents the platform upgrades implemented for the Biotech Terminal mobile app. All features are behind feature flags and fully testable offline.

## Table of Contents

1. [Feature Flags / Remote Config](#feature-flags--remote-config)
2. [Local-first Storage (RxDB)](#local-first-storage-rxdb)
3. [Global Search (Meilisearch)](#global-search-meilisearch)
4. [Observability](#observability)
5. [Service Worker (Workbox)](#service-worker-workbox)
6. [Native UX (iOS Live Activities)](#native-ux-ios-live-activities)
7. [Background Refresh](#background-refresh)
8. [Passkeys (WebAuthn)](#passkeys-webauthn)
9. [DevX & Tests](#devx--tests)

---

## Feature Flags / Remote Config

### Overview

Feature flags enable progressive rollout and kill-switch capabilities for new features. The implementation uses a simplified Unleash-compatible proxy.

### Architecture

```
Mobile App (unleash-proxy-client)
    ↓
Backend Feature Flag API (/api/feature-flags)
    ↓
In-Memory Feature Flag Store
```

### Quick Start

#### 1. Mobile App Setup

```typescript
// In your main App.tsx
import { FeatureFlagProvider } from './components/FeatureFlagProvider';

function App() {
  return (
    <FeatureFlagProvider
      url="http://localhost:3001/api/feature-flags/client"
      clientKey="dev-key"
      appName="biotech-terminal-mobile"
      environment="development"
    >
      <YourApp />
    </FeatureFlagProvider>
  );
}
```

#### 2. Using Feature Flags in Components

```typescript
import { useFeatureFlag } from './hooks/useFeatureFlag';

function SearchComponent() {
  const isMeilisearchEnabled = useFeatureFlag('search.meilisearch');

  if (isMeilisearchEnabled) {
    return <MeilisearchComponent />;
  }
  return <LegacySearchComponent />;
}
```

#### 3. Backend Setup

The backend automatically loads feature flags from environment variables:

```bash
# .env
FEATURE_FLAG_SEARCH_MEILISEARCH=true
FEATURE_FLAG_STORAGE_RXDB=false
FEATURE_FLAG_UX_LIVEACTIVITIES=false
FEATURE_FLAG_SECURITY_PASSKEYS=false
```

### API Endpoints

#### Get All Feature Flags
```bash
GET /api/feature-flags
```

Response:
```json
{
  "flags": [
    {
      "name": "search.meilisearch",
      "enabled": false,
      "description": "Enable Meilisearch-powered global search"
    }
  ],
  "lastUpdate": "2025-10-16T03:00:00.000Z",
  "count": 9
}
```

#### Check Flag Status
```bash
GET /api/feature-flags/search.meilisearch/enabled
```

Response:
```json
{
  "name": "search.meilisearch",
  "enabled": false
}
```

#### Update Flag (Development Only)
```bash
PUT /api/feature-flags/search.meilisearch
Content-Type: application/json

{
  "enabled": true,
  "variant": "v2"
}
```

#### Client Proxy Endpoint (Unleash-compatible)
```bash
POST /api/feature-flags/client
```

Response:
```json
{
  "toggles": [
    {
      "name": "search.meilisearch",
      "enabled": false,
      "variant": {
        "name": "disabled",
        "enabled": false
      }
    }
  ]
}
```

### Available Flags

| Flag Key | Default | Description |
|----------|---------|-------------|
| `search.meilisearch` | `false` | Enable Meilisearch-powered global search |
| `storage.rxdb` | `false` | Enable RxDB local-first storage with replication |
| `ux.liveActivities` | `false` | Enable iOS Live Activities for real-time updates |
| `security.passkeys` | `false` | Enable WebAuthn/Passkey authentication |
| `observability.sentry` | `false` | Enable Sentry error tracking and session replay |
| `observability.posthog` | `false` | Enable PostHog analytics and event tracking |
| `observability.opentelemetry` | `false` | Enable OpenTelemetry tracing |
| `sw.workbox` | `false` | Enable Workbox-powered service worker strategies |
| `background.fetch` | `false` | Enable background data refresh for widgets |

### Safe Defaults

All flags default to `false` and fall back to defaults when:
- The backend is unreachable
- Network errors occur
- The service is not initialized

```typescript
// Safe fallback behavior
const isEnabled = useFeatureFlag('search.meilisearch');
// Returns false if backend is down, no error thrown
```

### Testing

#### Unit Tests

```bash
cd mobile
npm test -- featureFlagService.test.ts
npm test -- useFeatureFlag.test.ts
```

#### Integration Testing

```typescript
// Test with flags enabled
import { featureFlagService } from './services/featureFlagService';

beforeEach(() => {
  // Mock flag as enabled
  featureFlagService.updateFlag('search.meilisearch', true);
});

test('renders search when flag is enabled', () => {
  render(<SearchComponent />);
  expect(screen.getByTestId('meilisearch')).toBeInTheDocument();
});
```

### Rollout Strategy

1. **Development**: Enable flags locally via environment variables
2. **Staging**: Test with flags enabled for internal users
3. **Production**: Gradual rollout using percentage-based toggles
4. **Kill Switch**: Immediately disable problematic features

### Production Considerations

For production deployment:

1. **Use Unleash Server**: Replace in-memory store with [Unleash Server](https://www.getunleash.io/)
2. **Add Authentication**: Protect flag update endpoints
3. **Add Persistence**: Store flags in database instead of memory
4. **Add Metrics**: Track flag evaluation and errors
5. **Add Caching**: Implement Redis caching for flag states

### Troubleshooting

#### Flags Not Updating

```bash
# Check backend is running
curl http://localhost:3001/api/feature-flags

# Check mobile app connection
# Open browser console and check for [FeatureFlags] logs
```

#### Using Default Values

If you see "using default for: X" in logs, the backend is unreachable. This is expected behavior and the app continues with safe defaults.

---

## Local-first Storage (RxDB)

> 🚧 **Coming in PR 2** - Local-first database with offline replication

### Preview

```typescript
import { useFeatureFlag } from './hooks/useFeatureFlag';
import { useRxDB } from './hooks/useRxDB';

function CompanyList() {
  const isRxDBEnabled = useFeatureFlag('storage.rxdb');
  const companies = useRxDB('companies');

  // Automatically syncs when online, works offline
  return <CompanyGrid data={companies} />;
}
```

---

## Global Search (Meilisearch)

> 🚧 **Coming in PR 3** - Fast, typo-tolerant search

---

## Observability

> 🚧 **Coming in PR 4** - Sentry, PostHog, and OpenTelemetry

---

## Service Worker (Workbox)

> 🚧 **Coming in PR 5** - Advanced caching strategies

---

## Native UX (iOS Live Activities)

> 🚧 **Coming in PR 6** - Lock screen widgets and deep links

---

## Background Refresh

> 🚧 **Coming in PR 7** - Headless data updates

---

## Passkeys (WebAuthn)

> 🚧 **Coming in PR 8** - Passwordless authentication

---

## DevX & Tests

> 🚧 **Coming in PR 9** - MSW, Playwright, and Web Workers

---

## Support

For questions or issues:
1. Check the [GitHub Issues](https://github.com/deathknight2002/terminal-ui-biotech-GG/issues)
2. Review the [Architecture Documentation](../ARCHITECTURE.md)
3. Contact the platform team

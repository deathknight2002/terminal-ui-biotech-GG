# Biotech Terminal E2E Tests

End-to-end tests for the Biotech Terminal Platform using Playwright.

## Manual Refresh Only Contract ⭐

The Evidence Graph implements a **"manual refresh only"** model - critical tests validate:

✅ **No background polling** - Data refreshes only on explicit user action
✅ **No WebSocket connections** - No real-time push updates
✅ **No automatic intervals** - No setTimeout/setInterval for data fetching
✅ **Explicit refresh button** - User must click to update data
✅ **Timestamp updates** - Last-updated stamp changes only after manual refresh

See `evidence-graph-manual-refresh.spec.ts` for the contract test.

## Installation

```bash
# Install Playwright test dependencies (already in package.json)
npm install

# Install Playwright browsers
npx playwright install
```

## Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run tests in UI mode (recommended for development)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Run specific test file
npx playwright test tests/e2e/authentication.spec.ts

# Run tests in specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## Test Suites

### 1. Health Check Tests (`health-check.spec.ts`)
Basic smoke tests to ensure platform is running:
- Home page loads correctly
- Navigation elements present
- API health check responds
- Evidence graph API accessible
- CORS headers present

### 2. Evidence Graph Tests (`evidence-graph.spec.ts`)
Tests manual refresh model and caching:
- No background API calls after page load
- No WebSocket connections
- No polling intervals active
- Refresh button behavior
- Keyboard shortcuts (R key)
- ETag caching
- Error handling

### 3. Authentication Tests (`authentication.spec.ts`)
Tests API token authentication middleware:
- GET requests allowed without authentication
- HEAD/OPTIONS requests allowed without authentication
- POST/PUT/DELETE/PATCH require authentication when enabled
- Bearer token authentication
- X-API-Key header authentication
- Invalid token rejection
- Public paths always accessible

### 4. Observability Tests (`observability.spec.ts`)
Tests metrics and monitoring:
- Prometheus metrics endpoint (`/metrics`)
- HTTP request metrics
- HTTP duration metrics
- Error tracking metrics
- Cache hit/miss metrics
- Evidence graph metrics
- Health check endpoint
- Error response handling
- Caching behavior (Cache-Control, ETag)

### 5. CRUD Operations Tests (`crud-operations.spec.ts`)
Tests evidence graph API operations:
- Create, read, update, delete nodes
- Filter nodes by type and company
- Pagination support
- Create and query edges
- Data persistence across requests
- Concurrent request handling
- ETag and caching behavior
- SQLite/JSON storage compatibility

## Test Configuration

Configuration is in `playwright.config.ts`:
- **Test directory**: `./tests/e2e`
- **Timeout**: 30 seconds per test
- **Base URL**: `http://localhost:3000` (frontend) or `http://localhost:8000` (API)
- **Browsers**: Chromium, Firefox, WebKit
- **CI**: Retries on failure, single worker
- **Dev Server**: Automatically starts terminal app before tests

## Writing New Tests

Follow the existing patterns:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    // Navigate to page
    await page.goto('/feature');

    // Make assertions
    await expect(page.locator('.element')).toBeVisible();

    // Test API
    const response = await page.request.get('http://localhost:8000/api/v1/endpoint');
    expect(response.ok()).toBeTruthy();
  });
});
```

## Environment Setup

Tests assume the following services are running:
- **Frontend**: `http://localhost:3000` (terminal app)
- **Backend API**: `http://localhost:8000` (FastAPI)

The `webServer` configuration in `playwright.config.ts` automatically starts the terminal app.

For API tests, ensure the backend is running:
```bash
# Start backend API
npm run dev:backend
# or
poetry run uvicorn bt_platform.core.app:app --reload
```

## Authentication Testing

To test authentication features:

1. Set environment variables:
   ```bash
   export API_TOKEN_ENABLED=true
   export API_TOKEN=test-token-12345
   ```

2. Run tests:
   ```bash
   npm run test:e2e
   ```

Tests are designed to work with or without authentication enabled.

## Observability Testing

Metrics endpoint testing verifies:
- Prometheus format compliance
- HTTP request tracking
- Duration histograms
- Error counters
- Cache metrics
- Application-specific metrics

## Storage Backend Testing

Tests verify that both JSON and SQLite storage backends work correctly:
- Same API interface
- Data persistence
- Concurrent access
- ETag generation
- Cache invalidation

## CI/CD Integration

Tests are configured for GitHub Actions:
- Retry failed tests 2 times
- Single worker (no parallel execution)
- HTML and list reporters
- Screenshots on failure
- Traces on retry

## Troubleshooting

**Tests timeout:**
- Increase timeout in `playwright.config.ts`
- Check if backend services are running
- Check network connectivity

**Browser installation fails:**
```bash
npx playwright install --with-deps
```

**Port conflicts:**
- Ensure no other services on ports 3000, 8000
- Update `BASE_URL` in config if needed

**Authentication tests fail:**
- Check API_TOKEN_ENABLED and API_TOKEN env vars
- Verify middleware configuration in `bt_platform/core/app.py`

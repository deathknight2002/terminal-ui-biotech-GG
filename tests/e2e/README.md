# E2E Tests for Biotech Terminal Platform

Comprehensive Playwright end-to-end tests for the platform.

## Test Coverage

### Implemented Test Suites

1. **health-check.spec.ts** - Platform health and API availability
   - Home page loading
   - Navigation functionality
   - API health check endpoint
   - CORS headers

2. **evidence-graph.spec.ts** - Evidence Graph functionality
   - Manual refresh model (no background polling)
   - WebSocket connection testing
   - Refresh button behavior
   - Keyboard shortcuts (R key)
   - ETag caching (304 responses)
   - Error handling and retry
   - Graph visualization

3. **observability.spec.ts** - Metrics and monitoring
   - Prometheus metrics endpoint
   - HTTP request tracking
   - Database query metrics
   - Cache hit/miss metrics
   - Health check performance

4. **api-authentication.spec.ts** - API security
   - Public endpoint access (GET, HEAD, OPTIONS)
   - Protected endpoint authentication (POST, PUT, DELETE, PATCH)
   - Bearer token authentication
   - X-API-Key header authentication
   - Invalid token handling
   - CORS preflight requests

5. **database-storage.spec.ts** - Data persistence
   - Evidence graph node persistence
   - ETag-based caching
   - HEAD request support
   - Node filtering by type
   - Pagination (limit/offset)
   - Edge retrieval and filtering
   - Database operations (drugs, trials, companies, catalysts)
   - Storage backend switching (JSON/SQLite)

## Installation

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium firefox webkit

# Or install with system dependencies
npx playwright install --with-deps
```

## Running Tests

```bash
# Run all tests
npm run test:e2e

# Run tests in UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Run specific test file
npx playwright test tests/e2e/health-check.spec.ts

# Run tests in specific browser
npx playwright test --project=chromium

# Run with debug mode
npx playwright test --debug
```

## Configuration

Tests are configured in `playwright.config.ts`:

- **Base URL**: `http://localhost:3000` (configurable via `BASE_URL` env var)
- **Timeout**: 30 seconds per test
- **Retries**: 2 on CI, 0 locally
- **Browsers**: Chromium, Firefox, WebKit
- **Web Server**: Auto-starts terminal app before tests

## Environment Variables

Create `.env` file in the root directory:

```bash
# API Configuration
API_TOKEN_ENABLED=false
API_TOKEN=your-secret-token

# Observability
METRICS_ENABLED=true
SENTRY_DSN=your-sentry-dsn
SENTRY_ENVIRONMENT=development
LOG_LEVEL=INFO
LOG_FORMAT=json

# Storage
EVIDENCE_GRAPH_STORAGE=sqlite  # or "json"
DATABASE_URL=sqlite:///./biotech_terminal.db
```

## Test Scenarios

### Manual Refresh Model
Tests verify that the Evidence Graph follows a manual refresh pattern:
- No background API calls after page load
- No WebSocket connections
- No polling intervals
- User-initiated refresh only (button or keyboard shortcut)

### ETag Caching
Tests verify proper HTTP caching:
- First request returns full data with ETag
- Subsequent requests with `If-None-Match` header return 304
- HEAD requests return metadata only
- Cache validation works correctly

### API Authentication
Tests verify security model:
- Read operations (GET, HEAD, OPTIONS) are public
- Write operations (POST, PUT, DELETE, PATCH) require authentication
- Bearer token and X-API-Key authentication both work
- Invalid tokens are rejected with proper error codes

### Database Operations
Tests verify data persistence:
- SQLite database stores drugs, trials, companies, catalysts
- Evidence graph can use JSON or SQLite storage
- Pagination and filtering work correctly
- Data consistency across multiple requests

## CI/CD Integration

Tests run automatically in GitHub Actions:

```yaml
- name: Install Playwright
  run: npx playwright install --with-deps

- name: Run E2E tests
  run: npm run test:e2e
  env:
    CI: true
    BASE_URL: http://localhost:3000
```

## Debugging Failed Tests

```bash
# Show test trace
npx playwright show-trace trace.zip

# Run with screenshots and videos
npx playwright test --screenshot=on --video=on

# Run with browser visible
npx playwright test --headed --workers=1

# Pause on failure
npx playwright test --debug
```

## Writing New Tests

Follow the existing patterns:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    const response = await page.request.get('http://localhost:8000/api/endpoint');
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toBeDefined();
  });
});
```

## Best Practices

1. **Use `page.request` for API testing** - More reliable than browser fetch
2. **Check response status explicitly** - Don't assume success
3. **Use descriptive test names** - "should do X when Y"
4. **Test both success and error cases** - Happy path and edge cases
5. **Skip tests conditionally** - Use `test.skip()` for environment-dependent tests
6. **Clean up test data** - Reset state between tests if needed
7. **Use proper timeouts** - Balance between flakiness and speed

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
BASE_URL=http://localhost:3001 npm run test:e2e
```

### Browser Installation Failed
```bash
# Install system dependencies
npx playwright install-deps

# Or manually install browsers
npx playwright install chromium --force
```

### Tests Timing Out
```bash
# Increase timeout in playwright.config.ts
timeout: 60 * 1000,  // 60 seconds

# Or for specific test
test('slow test', async ({ page }) => {
  test.setTimeout(60000);
  // ...
});
```

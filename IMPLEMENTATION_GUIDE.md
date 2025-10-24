# Implementation Guide: E2E Tests, Pre-commit Hooks, Observability, Auth, and SQLite Migration

This document describes the new features added to the Biotech Terminal Platform.

## 🎯 Features Implemented

### 1. ✅ E2E Tests with Playwright

**Location:** `tests/e2e/`, `playwright.config.ts`

Comprehensive end-to-end tests for the Evidence Graph and platform health checks.

#### Installation & Setup

```bash
# Install Playwright
npm install -D @playwright/test

# Install browsers
npx playwright install
```

#### Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Run specific test file
npx playwright test tests/e2e/evidence-graph.spec.ts
```

#### Test Coverage

- **Manual Refresh Model**: Verifies no background API calls or WebSocket connections
- **Refresh Button**: Tests loading states and timestamp updates
- **Keyboard Shortcuts**: Tests 'R' key refresh functionality
- **ETag Caching**: Tests cache headers and 304 responses
- **Error Handling**: Tests API failures and retry mechanisms
- **Graph Visualization**: Tests node/edge rendering and interactions

### 2. ✅ Pre-commit Hooks

**Location:** `.pre-commit-config.yaml`

Automated code quality checks before each commit.

#### Installation

```bash
# Install pre-commit (already in pyproject.toml)
poetry install

# Install git hooks
poetry run pre-commit install
```

#### Tools Configured

- **Black**: Python code formatting
- **isort**: Python import sorting
- **Flake8**: Python linting
- **Ruff**: Fast Python linter with auto-fix
- **Prettier**: JavaScript/TypeScript formatting
- **Bandit**: Python security checks
- **ESLint**: JavaScript/TypeScript linting

#### Manual Execution

```bash
# Run on all files
poetry run pre-commit run --all-files

# Run specific hook
poetry run pre-commit run black --all-files
poetry run pre-commit run prettier --all-files
```

#### Configuration Files

- `.prettierrc.json`: Prettier configuration
- `.prettierignore`: Files to exclude from Prettier
- `pyproject.toml`: Black, isort, Ruff, Flake8 configuration

### 3. ✅ Observability Features

**Location:** `bt_platform/core/utils/`

#### 3.1 Structured Logging

**File:** `bt_platform/core/utils/logging.py`

JSON-formatted structured logging for better observability.

```python
from bt_platform.core.utils.logging import get_logger, log_request, log_error

logger = get_logger(__name__)

# Log with structured data
logger.info("User action", extra={
    "user_id": "123",
    "action": "search",
    "query": "oncology"
})

# Helper functions
log_request(logger, "GET", "/api/v1/nodes")
log_error(logger, exception, context="processing data")
```

**Configuration:**

```env
# .env file
LOG_LEVEL=INFO
LOG_FORMAT=json  # or "text"
```

#### 3.2 Prometheus Metrics

**File:** `bt_platform/core/utils/metrics.py`

Exposes application metrics in Prometheus format at `/metrics` endpoint.

**Metrics Available:**

- `http_requests_total`: Total HTTP requests by method, endpoint, status
- `http_request_duration_seconds`: Request duration histogram
- `active_connections`: Current active connections
- `evidence_graph_nodes_total`: Number of nodes in evidence graph
- `evidence_graph_edges_total`: Number of edges in evidence graph
- `database_queries_total`: Total database queries
- `database_query_duration_seconds`: Query duration histogram
- `cache_hits_total`: Cache hits counter
- `cache_misses_total`: Cache misses counter
- `errors_total`: Errors by type

**Usage:**

```bash
# Access metrics endpoint
curl http://localhost:8000/metrics

# Integrate with Prometheus
# Add to prometheus.yml:
scrape_configs:
  - job_name: 'biotech-terminal'
    static_configs:
      - targets: ['localhost:8000']
```

**Configuration:**

```env
METRICS_ENABLED=true  # Enable metrics endpoint
```

#### 3.3 Sentry Integration

**File:** `bt_platform/core/utils/sentry.py`

Error tracking and performance monitoring with Sentry.

**Configuration:**

```env
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1  # 10% of transactions
```

**Manual Usage:**

```python
from bt_platform.core.utils.sentry import capture_exception, set_user

try:
    # Your code
    pass
except Exception as e:
    capture_exception(e, context={"user_id": "123"})

# Set user context
set_user(user_id="123", email="user@example.com")
```

### 4. ✅ API Token Authentication

**Location:** `bt_platform/core/middleware/auth.py`

Optional authentication for write endpoints (POST, PUT, DELETE, PATCH).

#### Configuration

```env
# Enable authentication
API_TOKEN_ENABLED=true
API_TOKEN=your-secret-token-here
```

#### Behavior

- **Protected Methods**: POST, PUT, DELETE, PATCH require authentication
- **Public Methods**: GET, HEAD, OPTIONS are always public
- **Public Paths**: `/health`, `/docs`, `/redoc`, `/metrics` are always public

#### Usage

```bash
# Without authentication (fails)
curl -X POST http://localhost:8000/api/v1/evidence-graph/nodes \
  -H "Content-Type: application/json" \
  -d '{"id": "test", "type": "thesis"}'

# With Bearer token
curl -X POST http://localhost:8000/api/v1/evidence-graph/nodes \
  -H "Authorization: Bearer your-secret-token-here" \
  -H "Content-Type: application/json" \
  -d '{"id": "test", "type": "thesis"}'

# With X-API-Key header
curl -X POST http://localhost:8000/api/v1/evidence-graph/nodes \
  -H "X-API-Key: your-secret-token-here" \
  -H "Content-Type: application/json" \
  -d '{"id": "test", "type": "thesis"}'
```

### 5. ✅ SQLite Migration for Evidence Graph

**Location:** `bt_platform/core/evidence_graph/storage_sqlite.py`

Replaces JSON file storage with SQLite database while maintaining the same API interface.

#### Benefits

- **Better Performance**: Indexed queries, concurrent access
- **ACID Compliance**: Transactional integrity
- **Scalability**: Handles larger datasets efficiently
- **Query Capabilities**: SQL-based filtering and aggregation

#### Configuration

```env
# Use SQLite storage (default is "json")
EVIDENCE_GRAPH_STORAGE=sqlite
EVIDENCE_GRAPH_DB_URL=sqlite:///./data/evidence_graph.db
```

#### Migration Script

```bash
# Create data directory
mkdir -p data

# Run migration from JSON to SQLite
poetry run python -m bt_platform.core.evidence_graph.migrate_to_sqlite \
  --verify

# With custom paths
poetry run python -m bt_platform.core.evidence_graph.migrate_to_sqlite \
  --json-dir ./custom/path \
  --sqlite-db sqlite:///./custom/evidence.db \
  --verify
```

#### Switching Between Backends

The storage backend is determined by the `EVIDENCE_GRAPH_STORAGE` environment variable:

```env
# Use JSON (legacy)
EVIDENCE_GRAPH_STORAGE=json

# Use SQLite (recommended)
EVIDENCE_GRAPH_STORAGE=sqlite
```

Both backends implement the same interface, so the API remains unchanged.

## 📦 Dependencies Added

### Python (pyproject.toml)

```toml
[tool.poetry.dependencies]
sentry-sdk = {extras = ["fastapi"], version = "^2.0.0"}
prometheus-client = "^0.20.0"
python-json-logger = "^2.0.7"

[tool.poetry.group.dev.dependencies]
flake8 = "^7.0.0"
isort = "^5.13.2"
bandit = "^1.7.8"
```

### JavaScript (package.json)

```json
{
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "prettier": "^4.0.0"
  }
}
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Install Python dependencies
poetry install

# Install Node.js dependencies
npm install
```

### 2. Setup Pre-commit Hooks

```bash
poetry run pre-commit install
```

### 3. Configure Environment

```bash
# Copy example .env
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### 4. Run the Platform

```bash
# Start backend with observability
poetry run uvicorn bt_platform.core.app:app --reload

# Access Prometheus metrics
curl http://localhost:8000/metrics

# View structured logs (JSON format)
# Logs will be output to stdout
```

### 5. Run Tests

```bash
# Run E2E tests
npm run test:e2e

# Run unit tests
poetry run pytest

# Run all tests
npm test
```

## 🔧 Configuration Reference

### Environment Variables

```env
# Logging
LOG_LEVEL=INFO
LOG_FORMAT=json  # or "text"

# Observability
SENTRY_DSN=
SENTRY_ENVIRONMENT=development
SENTRY_TRACES_SAMPLE_RATE=0.1
METRICS_ENABLED=true

# Authentication
API_TOKEN_ENABLED=false
API_TOKEN=

# Evidence Graph Storage
EVIDENCE_GRAPH_STORAGE=json  # or "sqlite"
EVIDENCE_GRAPH_DB_URL=sqlite:///./data/evidence_graph.db
```

## 📊 Monitoring Dashboard

### Prometheus + Grafana Setup

```yaml
# docker-compose.yml (example)
version: '3'
services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
```

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'biotech-terminal'
    scrape_interval: 15s
    static_configs:
      - targets: ['host.docker.internal:8000']
```

## 🧪 Testing Guide

### E2E Test Development

```typescript
// tests/e2e/my-feature.spec.ts
import { test, expect } from '@playwright/test';

test('my feature works', async ({ page }) => {
  await page.goto('/my-feature');
  await expect(page.locator('[data-testid="my-element"]')).toBeVisible();
});
```

### Running Specific Tests

```bash
# Run specific test file
npx playwright test evidence-graph.spec.ts

# Run tests matching pattern
npx playwright test --grep "refresh"

# Debug mode
npx playwright test --debug
```

## 🔒 Security Best Practices

1. **Never commit secrets**: Use environment variables
2. **Rotate API tokens**: Change `API_TOKEN` regularly
3. **Enable authentication**: Set `API_TOKEN_ENABLED=true` in production
4. **Use HTTPS**: Configure reverse proxy with SSL
5. **Monitor Sentry**: Review errors regularly
6. **Review logs**: Use structured logging for audit trails

## 📝 Contributing

When contributing code:

1. Pre-commit hooks will run automatically
2. Ensure all tests pass (`npm test`)
3. Write E2E tests for new features
4. Update this documentation

## 🐛 Troubleshooting

### Pre-commit hooks failing

```bash
# Update hooks
poetry run pre-commit autoupdate

# Clean and reinstall
poetry run pre-commit clean
poetry run pre-commit install
```

### Playwright tests failing

```bash
# Reinstall browsers
npx playwright install --with-deps

# Check if backend is running
curl http://localhost:8000/health
```

### Metrics not appearing

```bash
# Check if metrics are enabled
echo $METRICS_ENABLED

# Access metrics endpoint
curl http://localhost:8000/metrics
```

## 📚 Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [Pre-commit Documentation](https://pre-commit.com/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Sentry Documentation](https://docs.sentry.io/)
- [Structured Logging Best Practices](https://www.structlog.org/)

# New Features Quick Reference

## 🧪 E2E Tests with Playwright

```bash
# Run all E2E tests
npm run test:e2e

# Interactive UI mode (recommended for development)
npm run test:e2e:ui

# Run with visible browser
npm run test:e2e:headed

# Run specific test
npx playwright test evidence-graph.spec.ts

# Debug mode
npx playwright test --debug
```

**Test Files:**
- `tests/e2e/evidence-graph.spec.ts` - Evidence Graph tests
- `tests/e2e/health-check.spec.ts` - Health check tests

## 🎨 Pre-commit Hooks

```bash
# Install hooks (one-time setup)
poetry run pre-commit install

# Run on all files
poetry run pre-commit run --all-files

# Run specific hook
poetry run pre-commit run black        # Python formatter
poetry run pre-commit run prettier     # JS/TS formatter
poetry run pre-commit run flake8       # Python linter
poetry run pre-commit run ruff         # Fast Python linter
```

**Configured Tools:**
- Black, isort, Flake8, Ruff for Python
- Prettier, ESLint for JavaScript/TypeScript
- Bandit for security checks
- General file checks (trailing whitespace, merge conflicts, etc.)

## 📊 Observability

### Structured Logging

```python
from bt_platform.core.utils.logging import get_logger, log_request, log_error

logger = get_logger(__name__)

# Structured logging with context
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
LOG_LEVEL=INFO
LOG_FORMAT=json  # or "text" for development
```

### Prometheus Metrics

```bash
# View metrics
curl http://localhost:8000/metrics

# Key metrics:
# - http_requests_total
# - http_request_duration_seconds
# - evidence_graph_nodes_total
# - database_queries_total
# - cache_hits_total
```

**Track custom metrics:**
```python
from bt_platform.core.utils.metrics import track_metric, update_evidence_graph_metrics

track_http_request("POST", "/api/v1/nodes", 201)
update_evidence_graph_metrics(nodes_count=100, edges_count=200)
```

### Sentry Error Tracking

```env
SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1
```

```python
from bt_platform.core.utils.sentry import capture_exception, set_user

try:
    # Your code
    pass
except Exception as e:
    capture_exception(e, context={"user_id": "123"})

set_user(user_id="123", email="user@example.com")
```

## 🔐 API Token Authentication

```env
# Enable authentication
API_TOKEN_ENABLED=true
API_TOKEN=your-secure-random-token
```

**Usage:**

```bash
# GET requests (public, no auth needed)
curl http://localhost:8000/api/v1/evidence-graph/nodes

# POST request (requires auth)
curl -X POST http://localhost:8000/api/v1/evidence-graph/nodes \
  -H "Authorization: Bearer your-secure-random-token" \
  -H "Content-Type: application/json" \
  -d '{"id": "test", "type": "thesis"}'

# Alternative: X-API-Key header
curl -X POST http://localhost:8000/api/v1/evidence-graph/nodes \
  -H "X-API-Key: your-secure-random-token" \
  -H "Content-Type: application/json" \
  -d '{"id": "test", "type": "thesis"}'
```

**Protected Methods:** POST, PUT, DELETE, PATCH  
**Public Methods:** GET, HEAD, OPTIONS  
**Always Public:** `/health`, `/docs`, `/metrics`

## 💾 SQLite Migration

### Switch Storage Backend

```env
# Use SQLite (recommended)
EVIDENCE_GRAPH_STORAGE=sqlite
EVIDENCE_GRAPH_DB_URL=sqlite:///./data/evidence_graph.db

# Or use JSON (legacy)
EVIDENCE_GRAPH_STORAGE=json
```

### Migrate from JSON to SQLite

```bash
# Create data directory
mkdir -p data

# Run migration with verification
poetry run python -m bt_platform.core.evidence_graph.migrate_to_sqlite --verify

# With custom paths
poetry run python -m bt_platform.core.evidence_graph.migrate_to_sqlite \
  --json-dir ./custom/path \
  --sqlite-db sqlite:///./custom/evidence.db \
  --verify
```

**Benefits:**
- Better performance with indexes
- ACID transactions
- Concurrent access support
- Same API interface (drop-in replacement)

## 📝 Configuration Reference

All settings are configured via `.env` file:

```env
# Logging
LOG_LEVEL=INFO                # DEBUG, INFO, WARNING, ERROR, CRITICAL
LOG_FORMAT=json               # json or text

# Metrics
METRICS_ENABLED=true          # Enable /metrics endpoint

# Sentry
SENTRY_DSN=                   # Your Sentry DSN
SENTRY_ENVIRONMENT=development
SENTRY_TRACES_SAMPLE_RATE=0.1

# Authentication
API_TOKEN_ENABLED=false       # Enable auth for write ops
API_TOKEN=                    # Your secure token

# Evidence Graph Storage
EVIDENCE_GRAPH_STORAGE=json   # json or sqlite
EVIDENCE_GRAPH_DB_URL=sqlite:///./data/evidence_graph.db
```

See `.env.example` for complete configuration template.

## 🐛 Troubleshooting

### Pre-commit hooks failing

```bash
# Update hooks to latest versions
poetry run pre-commit autoupdate

# Clean and reinstall
poetry run pre-commit clean
poetry run pre-commit install
```

### Playwright tests not running

```bash
# Install/update browsers
npx playwright install --with-deps

# Check backend is running
curl http://localhost:8000/health
```

### Metrics endpoint not working

```bash
# Check configuration
echo $METRICS_ENABLED  # Should be "true"

# Test endpoint
curl http://localhost:8000/metrics
```

### SQLite migration issues

```bash
# Check data directory exists
mkdir -p data

# Verify JSON data exists
ls -la bt_platform/core/evidence_graph/data/

# Run migration with verbose output
poetry run python -m bt_platform.core.evidence_graph.migrate_to_sqlite --verify
```

## 📚 Additional Resources

- **Full Guide:** `IMPLEMENTATION_GUIDE.md`
- **Config Template:** `.env.example`
- **Test Config:** `playwright.config.ts`
- **Pre-commit Config:** `.pre-commit-config.yaml`

## 🎯 Common Workflows

### Local Development Setup

```bash
# 1. Install dependencies
npm install
poetry install

# 2. Setup pre-commit hooks
poetry run pre-commit install

# 3. Configure environment
cp .env.example .env
# Edit .env as needed

# 4. Start backend
poetry run uvicorn bt_platform.core.app:app --reload

# 5. Run tests
npm run test:e2e
```

### Production Deployment

```bash
# 1. Set production environment variables
export API_TOKEN_ENABLED=true
export API_TOKEN=your-secure-token
export SENTRY_DSN=https://your-dsn@sentry.io/project
export SENTRY_ENVIRONMENT=production
export EVIDENCE_GRAPH_STORAGE=sqlite
export LOG_FORMAT=json

# 2. Migrate to SQLite if needed
poetry run python -m bt_platform.core.evidence_graph.migrate_to_sqlite --verify

# 3. Start application
poetry run uvicorn bt_platform.core.app:app --host 0.0.0.0 --port 8000

# 4. Monitor metrics
curl http://localhost:8000/metrics

# 5. Check health
curl http://localhost:8000/health
```

### CI/CD Integration

```yaml
# GitHub Actions example
- name: Run E2E Tests
  run: |
    npm install
    npx playwright install --with-deps
    npm run test:e2e

- name: Run Pre-commit Checks
  run: |
    poetry install
    poetry run pre-commit run --all-files

- name: Run Python Tests
  run: |
    poetry install
    poetry run pytest
```

---

For detailed documentation, see [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)

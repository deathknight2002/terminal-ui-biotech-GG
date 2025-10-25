# Quick Reference: Platform Features

## E2E Tests

```bash
# Run all tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui

# Run specific test
npx playwright test tests/e2e/authentication.spec.ts
```

## Pre-commit Hooks

```bash
# Install
./scripts/setup_precommit.sh install

# Run on all files
poetry run pre-commit run --all-files

# Check status
./scripts/setup_precommit.sh status
```

## Observability

```bash
# Check metrics
curl http://localhost:8000/metrics

# Check health
curl http://localhost:8000/health
```

**Environment Variables:**
```bash
export LOG_LEVEL=INFO           # DEBUG, INFO, WARNING, ERROR
export LOG_FORMAT=json          # json or text
export SENTRY_DSN=https://...   # Your Sentry DSN
export METRICS_ENABLED=true     # Enable metrics
```

## API Token Authentication

**Enable Authentication:**
```bash
export API_TOKEN_ENABLED=true
export API_TOKEN=your-secret-token
```

**Use Token:**
```bash
# Bearer token
curl -X POST http://localhost:8000/api/v1/evidence-graph/node \
  -H "Authorization: Bearer your-secret-token" \
  -H "Content-Type: application/json" \
  -d '{"id": "node-1", "type": "thesis"}'

# API Key header
curl -X POST http://localhost:8000/api/v1/evidence-graph/node \
  -H "X-API-Key: your-secret-token" \
  -H "Content-Type: application/json" \
  -d '{"id": "node-1", "type": "thesis"}'
```

## SQLite Storage

**Switch to SQLite:**
```bash
export EVIDENCE_GRAPH_STORAGE=sqlite
export EVIDENCE_GRAPH_DB_URL=sqlite:///./data/evidence_graph.db
```

**Migrate Data:**
```bash
# Run migration
python -m bt_platform.core.evidence_graph.migrate_to_sqlite

# With verification
python -m bt_platform.core.evidence_graph.migrate_to_sqlite --verify
```

## Test Everything

```bash
# Verify all features
/tmp/verify_implementation.sh

# Run E2E tests
npm run test:e2e

# Test pre-commit hooks
poetry run pre-commit run --all-files

# Start backend with all features
export LOG_LEVEL=INFO
export LOG_FORMAT=json
export METRICS_ENABLED=true
export API_TOKEN_ENABLED=false
export EVIDENCE_GRAPH_STORAGE=sqlite
npm run dev:backend
```

## Endpoints

- **Health**: `GET http://localhost:8000/health`
- **Metrics**: `GET http://localhost:8000/metrics`
- **API Docs**: `http://localhost:8000/docs`
- **Evidence Graph**: `GET http://localhost:8000/api/v1/evidence-graph/nodes`

## Documentation

- Full Guide: `FEATURES_IMPLEMENTATION_GUIDE.md`
- E2E Tests: `tests/e2e/README.md`
- Main README: `README.md`

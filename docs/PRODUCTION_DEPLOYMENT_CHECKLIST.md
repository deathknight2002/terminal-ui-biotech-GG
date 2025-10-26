# Production Deployment Checklist

Complete this checklist before deploying Evidence Graph to production.

## ✅ Pre-Deployment Verification

### 1. Run Comprehensive Checks

```bash
# Run production readiness verification
python scripts/verify_production_readiness.py
```

**Expected Result**: ✅ ALL CHECKS PASSED

If any check fails, fix the issues before proceeding.

### 2. Test Suite

Run all tests to ensure nothing is broken:

```bash
# Python backend tests
poetry run pytest tests/ -v

# Frontend component tests
npm run test:components

# Terminal app tests
npm run test:terminal

# E2E tests
npm run test:e2e

# Auth tests specifically
pytest tests/test_auth.py -v

# Observability tests
python scripts/test_observability.py
```

**All tests should pass.**

### 3. Code Quality

```bash
# Run pre-commit hooks
pre-commit run --all-files

# Python linting
poetry run ruff check bt_platform/

# TypeScript type checking
cd terminal && npm run typecheck
cd ../frontend-components && npm run typecheck
```

**No errors should be reported.**

## 🔒 Security Configuration

### 1. API Token

```bash
# Generate a strong API token
# Use a password manager or:
openssl rand -hex 32

# Set in production environment
export API_TOKEN="your-strong-token-here"
export API_TOKEN_ENABLED=true
```

⚠️ **Never commit the API token to version control!**

### 2. Secrets Management

Production secrets to configure:

- [ ] `API_TOKEN` - Strong random token for write operations
- [ ] `SENTRY_DSN` - Sentry error tracking (optional but recommended)
- [ ] `SECRET_KEY` - Change from default
- [ ] `DATABASE_URL` - Production database connection string

### 3. CORS Configuration

Review and update CORS origins for production:

```python
# In bt_platform/core/config.py or .env
CORS_ORIGINS=[
    "https://your-production-domain.com",
    "https://app.your-domain.com"
]
```

## 🔧 Environment Configuration

### Required Variables

```bash
# Authentication
API_TOKEN=your-production-token
API_TOKEN_ENABLED=true

# Storage
EVIDENCE_GRAPH_STORAGE=sqlite
EVIDENCE_GRAPH_DB_URL=sqlite:///./data/evidence_graph.db

# Logging
LOG_LEVEL=INFO
LOG_FORMAT=json

# Metrics
METRICS_ENABLED=true
```

### Recommended Variables

```bash
# Error Tracking (Sentry)
SENTRY_DSN=https://...@sentry.io/...
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1

# Server
HOST=0.0.0.0
PORT=8000
DEBUG=false
```

### Optional Variables

```bash
# Database (if using PostgreSQL)
DATABASE_URL=postgresql://user:password@localhost:5432/biotech_terminal

# Redis (for caching)
REDIS_URL=redis://localhost:6379/0
```

## 📊 Monitoring Setup

### 1. Prometheus

Configure Prometheus to scrape metrics:

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'biotech-terminal'
    scrape_interval: 15s
    static_configs:
      - targets: ['your-api-host:8000']
    metrics_path: '/metrics'
```

**Test**: Visit `http://your-api-host:8000/metrics`

### 2. Grafana Dashboards

Create dashboards for:
- HTTP request rate and latency
- Evidence graph node/edge counts
- Error rates
- Cache hit rates
- Database query performance

### 3. Sentry

If using Sentry:
1. Create project in Sentry
2. Copy DSN to `SENTRY_DSN`
3. Set `SENTRY_ENVIRONMENT=production`
4. Configure alerts for critical errors

### 4. Log Aggregation

Configure log forwarding to your aggregation service:
- CloudWatch (AWS)
- Stackdriver (GCP)
- Azure Monitor (Azure)
- Datadog
- Splunk

**Format**: JSON logs are automatically output to stdout

## 🚀 Deployment Steps

### 1. Build Application

```bash
# Install dependencies
npm install
poetry install --no-dev

# Build frontend
npm run build:all
```

### 2. Database Migration

If using SQLite and migrating from JSON:

```bash
# Backup existing data
cp bt_platform/core/evidence_graph/data/seed_data.json backup/

# Run migration
python scripts/migrate_to_sqlite.py

# Verify migration
ls -lh data/evidence_graph.db
```

### 3. Deploy Backend

```bash
# Using systemd (example)
sudo systemctl start biotech-terminal
sudo systemctl enable biotech-terminal

# Or using Docker
docker-compose up -d

# Or direct
poetry run uvicorn bt_platform.core.app:app --host 0.0.0.0 --port 8000 --workers 4
```

### 4. Deploy Frontend

```bash
# Static hosting (Netlify, Vercel, S3, etc.)
cd terminal
npm run build
# Upload dist/ to your hosting provider

# Or serve via Nginx/Apache
# Copy dist/ to web server root
```

### 5. Health Check

Verify deployment is healthy:

```bash
# API health
curl https://your-api-host/health

# Metrics endpoint
curl https://your-api-host/metrics

# Evidence graph nodes (public)
curl https://your-api-host/api/v1/evidence-graph/nodes
```

## 🧪 Post-Deployment Verification

### 1. Smoke Tests

Run critical path tests:

```bash
# Health check
curl https://your-api-host/health
# Should return: {"status": "healthy"}

# Metrics
curl https://your-api-host/metrics
# Should return Prometheus metrics

# Public read (no auth)
curl https://your-api-host/api/v1/evidence-graph/nodes
# Should return nodes array

# Protected write (with auth)
curl -X POST https://your-api-host/api/v1/evidence-graph/node \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"id": "test", "label": "Test", "type": "thesis"}'
# Should succeed

# Protected write (without auth)
curl -X POST https://your-api-host/api/v1/evidence-graph/node \
  -H "Content-Type: application/json" \
  -d '{"id": "test2", "label": "Test2", "type": "thesis"}'
# Should return 401/403
```

### 2. Manual Refresh Test

1. Open Evidence Graph in production: `https://your-app-host/evidence-graph`
2. Open browser DevTools → Network tab
3. Clear network log
4. Wait 30 seconds
5. **Verify**: No API calls are made (manual refresh only!)
6. Click refresh button
7. **Verify**: Single API call to `/api/v1/evidence-graph/nodes`
8. Wait another 30 seconds
9. **Verify**: Still no API calls

### 3. E2E Tests Against Production

```bash
# Run E2E tests against production
BASE_URL=https://your-app-host npm run test:e2e
```

## 📈 Monitoring Checklist

After deployment, verify:

- [ ] `/metrics` endpoint is accessible from Prometheus
- [ ] Grafana dashboards show data
- [ ] Sentry is receiving events (test with a manual error)
- [ ] Logs are being collected in aggregation service
- [ ] Alerts are configured for:
  - [ ] High error rate
  - [ ] High response time
  - [ ] Service down
  - [ ] Database connection failures

## 🔄 Rollback Plan

If issues occur:

1. **Keep old version running**: Use blue-green deployment
2. **Database backup**: Have backup of SQLite database
3. **Quick rollback**: Switch traffic back to old version
4. **Investigate**: Check logs, Sentry, metrics

```bash
# Rollback commands (example)
git checkout previous-release-tag
npm run build:all
sudo systemctl restart biotech-terminal
```

## 📋 Post-Deployment Tasks

- [ ] Update internal documentation with production URLs
- [ ] Notify team of successful deployment
- [ ] Monitor for 24 hours for issues
- [ ] Schedule follow-up review in 1 week
- [ ] Update runbook with any deployment learnings

## 🆘 Emergency Contacts

| Role | Contact | Escalation |
|------|---------|------------|
| On-call Engineer | [Your contact] | [Escalation contact] |
| DevOps Lead | [Your contact] | [Escalation contact] |
| Product Owner | [Your contact] | [Escalation contact] |

## 📞 Support Resources

- **Documentation**: `docs/EVIDENCE_GRAPH_PRODUCTION_READY.md`
- **Troubleshooting**: Section in production docs
- **Runbook**: [Link to runbook]
- **Metrics Dashboard**: [Link to Grafana]
- **Error Tracking**: [Link to Sentry]
- **Logs**: [Link to log aggregation]

---

## ✅ Final Sign-Off

Before marking as complete:

- [ ] All tests passed
- [ ] Security configured
- [ ] Monitoring active
- [ ] Documentation updated
- [ ] Team notified
- [ ] Smoke tests passed
- [ ] Manual refresh verified
- [ ] Rollback plan documented

**Deployed by**: ___________________  
**Date**: ___________________  
**Version**: ___________________  
**Reviewed by**: ___________________  

---

**Congratulations! Your Evidence Graph is production-ready! 🚀**

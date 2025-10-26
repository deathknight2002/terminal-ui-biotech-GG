# Evidence Graph Production Checklist

This checklist ensures the Evidence Graph feature is production-ready before deployment.

## 🔒 Security

- [x] **CORS Origins:** Allowlist configured (not `["*"]` in production)
  - Set `CORS_ORIGINS` environment variable to specific domains
  - Example: `CORS_ORIGINS=https://app.biotech-terminal.com,https://terminal.example.com`

- [x] **Rate Limiting:** 60 requests/minute per IP enforced
  - Middleware: `SimpleRateLimiter` active
  - Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

- [x] **Security Headers:** All critical headers configured
  - ✓ `X-Content-Type-Options: nosniff`
  - ✓ `X-Frame-Options: DENY`
  - ✓ `X-XSS-Protection: 1; mode=block`
  - ✓ `Strict-Transport-Security: max-age=31536000; includeSubDomains`
  - ✓ `Content-Security-Policy: default-src 'self'; ...`

- [ ] **API Token Auth:** (Optional) Token required for write endpoints (seed/upsert)
  - Implement `X-API-Key` header validation for POST/PUT/DELETE
  - Store tokens in secure secret management (AWS Secrets Manager, HashiCorp Vault)

- [ ] **Input Sanitization:** Graph labels sanitized to prevent XSS
  - Use `bleach` or `html.escape()` for user-generated labels
  - Validate node/edge IDs against regex patterns

- [ ] **Dependency Scanning:** Automated vulnerability checks
  - Add `pip-audit` to CI pipeline
  - Add `npm audit` to CI pipeline
  - Configure Dependabot or Snyk

## 📊 Performance & Caching

- [x] **ETag Support:** GET endpoints return SHA-256 ETag
  - `/api/v1/evidence-graph/nodes` ✓
  - `/api/v1/evidence-graph/edges` ✓

- [x] **HEAD Method:** Lightweight cache validation
  - Returns headers only (no body)
  - Same ETag as GET

- [x] **304 Not Modified:** If-None-Match header processed correctly
  - Reduces bandwidth by ~90% for unchanged data

- [x] **Cache-Control:** `no-store` header set (manual-only refresh)
  - Prevents browser caching that would conflict with manual discipline

- [x] **Pagination:** Limit/offset supported for large datasets
  - `?limit=100&offset=0` working
  - `X-Total-Count` header present

- [x] **Filtering:** Query parameters reduce payload
  - `?type=thesis` ✓
  - `?company=Pfizer` ✓

## 💾 Data Integrity

- [x] **Atomic Writes:** Temp file + rename pattern
  - Prevents data corruption on crash
  - Uses `os.replace()` for atomic swap

- [x] **Backups:** Automatic versioning (3 versions kept)
  - `.backup.YYYYMMDD_HHMMSS.json` files
  - Rotates old backups automatically

- [x] **File Locking:** (Optional for high concurrency)
  - Consider adding `fcntl` or `portalocker` for write locks
  - Not critical for single-process deployments

- [ ] **Validation on Write:** Pydantic models enforce schema
  - Add `@validator` for business logic constraints
  - Reject invalid data early

- [ ] **SQLite Migration Path:** (Future) Plan to replace JSON with SQLite
  - Keep same API interface for compatibility
  - Better concurrency and query performance

## 🧪 Testing

- [x] **API Tests:** pytest suite with 20+ tests
  - ETag caching ✓
  - HEAD requests ✓
  - Filtering/pagination ✓
  - Rate limiting ✓
  - Security headers ✓

- [ ] **Contract Tests:** OpenAPI schema validation
  - Use Schemathesis to fuzz all endpoints
  - Ensure response schemas match OpenAPI spec

- [ ] **E2E Tests:** Playwright manual-refresh behavior
  - Verify no background polling
  - Test keyboard shortcut (R key)
  - Verify last-updated timestamp updates
  - Check loading states

- [ ] **Visual Regression:** Graph timeline rendering
  - Use Percy or Chromatic for screenshot comparison
  - Catch unintended UI changes

## 🚀 CI/CD

- [x] **GitHub Actions:** Basic workflow exists
  - Python tests run on push/PR
  - Node.js tests run on push/PR

- [ ] **Enhanced CI Checks:**
  - [ ] Lint: `ruff check bt_platform/`
  - [ ] Type check: `mypy bt_platform/`
  - [ ] ESLint + TypeScript: `npm run lint && npm run typecheck`
  - [ ] Security scan: `pip-audit`, `npm audit`
  - [ ] Container build: Docker images for API

- [ ] **Pre-commit Hooks:**
  - [ ] Black (Python formatting)
  - [ ] isort (import sorting)
  - [ ] Prettier (JS/TS formatting)
  - [ ] commitlint (conventional commits)

- [ ] **Preview Deploys:**
  - Deploy PR branches to temporary environments
  - Auto-delete on PR close

## 📈 Observability

- [ ] **Structured Logging:** JSON logs with request context
  - Include `request_id`, `user_agent`, `duration_ms`, `status_code`
  - Use `python-json-logger` or `structlog`

- [ ] **Metrics Endpoint:** `/metrics` in Prometheus format
  - Request count by endpoint and status code
  - Response time histograms (p50, p95, p99)
  - Active connections gauge

- [ ] **Error Tracking:** Sentry integration
  - Backend: `sentry-sdk` with FastAPI integration
  - Frontend: `@sentry/react` with error boundaries
  - Set DSN via `SENTRY_DSN` environment variable

- [ ] **Request Tracing:** `X-Request-ID` header
  - ✓ Already implemented
  - Ensure logged in all error messages

- [ ] **Health Check Dashboard:** Uptime monitoring
  - `/health` endpoint monitored by UptimeRobot or Datadog
  - Alert on 3+ consecutive failures

## 📚 Documentation

- [x] **ADR Document:** "Manual Refresh Only" decision
  - Location: `docs/ADR-001-manual-refresh-only.md`

- [ ] **API Reference:** OpenAPI documentation
  - Generate from FastAPI: `/docs` endpoint
  - Export as static HTML for offline access

- [ ] **Browser Support Matrix:** Tested browsers
  - Chrome 90+
  - Firefox 88+
  - Safari 14+
  - Edge 90+

- [ ] **Contribution Guide:** Developer onboarding
  - Setup instructions
  - Code style guidelines
  - Testing requirements
  - PR template

- [ ] **Deployment Guide:** Production runbook
  - Environment variables required
  - Database migration steps (when moving to SQLite)
  - Rollback procedures
  - Monitoring dashboards

## 🌍 Environment Configuration

### Required Environment Variables

```bash
# Production deployment
ENV=production
CORS_ORIGINS=https://app.biotech-terminal.com,https://terminal.example.com

# Optional: API authentication
API_KEY=your-secret-api-key-here

# Optional: Error tracking
SENTRY_DSN=https://your-sentry-dsn@sentry.io/12345

# Optional: Database (future SQLite migration)
DATABASE_URL=sqlite:///data/evidence_graph.db
```

### Development vs. Production

| Feature | Development | Production |
|---------|-------------|------------|
| CORS Origins | `["*"]` (allow all) | Specific domains only |
| Rate Limiting | 60 req/min | 60 req/min (tune as needed) |
| Debug Mode | `reload=True` | `reload=False` |
| Logging Level | `DEBUG` | `INFO` or `WARNING` |
| Backups | 3 versions | 7+ versions (longer retention) |

## 🔄 Deployment Steps

1. **Pre-deployment Validation**
   ```bash
   # Run all tests
   pytest tests/ -v
   npm run test

   # Type check
   mypy bt_platform/
   npm run typecheck

   # Lint
   ruff check bt_platform/
   npm run lint

   # Security audit
   pip-audit
   npm audit
   ```

2. **Build Artifacts**
   ```bash
   # Backend (Docker)
   docker build -t evidence-graph-api:latest -f Dockerfile.api .

   # Frontend
   cd terminal && npm run build
   ```

3. **Deploy to Staging**
   - Smoke test all endpoints
   - Run E2E test suite
   - Verify metrics dashboard
   - Check error tracking (Sentry)

4. **Deploy to Production**
   - Blue-green deployment (zero downtime)
   - Monitor error rates for 30 minutes
   - Rollback if error rate > 1%

5. **Post-deployment**
   - Run smoke tests against production
   - Verify `/health` endpoint
   - Check monitoring dashboards
   - Update status page

## 📞 Support & Escalation

- **On-call Engineer:** PagerDuty rotation
- **Incident Response:** Follow runbook in `docs/incident-response.md`
- **Known Issues:** See `KNOWN_ISSUES.md`

---

## ✅ Final Sign-off

Before going to production, ensure all items are checked:

- [ ] Security checklist 100% complete
- [ ] Performance metrics meet SLA (p95 < 500ms)
- [ ] Test coverage > 80%
- [ ] CI/CD pipeline green
- [ ] Documentation complete and reviewed
- [ ] Stakeholder approval obtained
- [ ] Rollback plan documented and tested

**Approved by:** ___________________
**Date:** ___________________

# Production Deployment & Monitoring Guide
## Redmile Catalyst Intelligence System

> **Target:** Production-grade deployment with 99.5% uptime
> **Monitoring:** Prometheus + Grafana + Alerting
> **Infrastructure:** Docker + Kubernetes (or Docker Compose for simpler setup)

---

## Table of Contents

1. [Deployment Architecture](#deployment-architecture)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Docker Containerization](#docker-containerization)
4. [CI/CD Pipeline](#cicd-pipeline)
5. [Monitoring Setup](#monitoring-setup)
6. [Alerting Configuration](#alerting-configuration)
7. [Operational Runbooks](#operational-runbooks)
8. [Security Hardening](#security-hardening)
9. [Backup & Disaster Recovery](#backup--disaster-recovery)
10. [Performance Tuning](#performance-tuning)

---

## Deployment Architecture

### Production Environment

```
┌─────────────────────────────────────────────────────────────┐
│                      Load Balancer (NGINX)                  │
│                      SSL/TLS Termination                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐    ┌──────────────────┐              │
│  │  FastAPI App     │    │  FastAPI App     │  (2+ replicas)│
│  │  (Python 3.9)    │    │  (Python 3.9)    │              │
│  │  Port: 8000      │    │  Port: 8000      │              │
│  └──────────────────┘    └──────────────────┘              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                              │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐    ┌──────────────────┐              │
│  │  PostgreSQL      │    │  Redis Cache     │              │
│  │  (Primary)       │    │  (6.2)           │              │
│  └──────────────────┘    └──────────────────┘              │
│  ┌──────────────────┐                                       │
│  │  PostgreSQL      │                                       │
│  │  (Read Replica)  │                                       │
│  └──────────────────┘                                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Monitoring & Logging                        │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐    ┌──────────────────┐              │
│  │  Prometheus      │    │  Grafana         │              │
│  │  (Metrics)       │    │  (Dashboards)    │              │
│  └──────────────────┘    └──────────────────┘              │
│  ┌──────────────────┐    ┌──────────────────┐              │
│  │  Loki/ELK        │    │  Alertmanager    │              │
│  │  (Logs)          │    │  (Alerts)        │              │
│  └──────────────────┘    └──────────────────┘              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Background Jobs                             │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐    ┌──────────────────┐              │
│  │  Celery Worker   │    │  Celery Beat     │              │
│  │  (Scraper Jobs)  │    │  (Scheduler)     │              │
│  └──────────────────┘    └──────────────────┘              │
└─────────────────────────────────────────────────────────────┘
```

### Network Architecture

- **Public Subnet:** Load balancer, NGINX
- **Private Subnet:** Application servers, databases
- **Isolated Subnet:** Background workers, scrapers
- **Firewall Rules:** Only necessary ports exposed

### Scalability Design

- **Horizontal Scaling:** Multiple FastAPI instances behind load balancer
- **Vertical Scaling:** Increase CPU/RAM for database
- **Caching:** Redis for hot data (holdings, scores)
- **CDN:** Static assets served via CDN
- **Database Read Replicas:** Distribute read load

---

## Pre-Deployment Checklist

### Environment Preparation

- [ ] Provision infrastructure (VMs, databases, networking)
- [ ] Set up DNS records (api.biotech-terminal.com)
- [ ] Obtain SSL/TLS certificates (Let's Encrypt or commercial)
- [ ] Configure firewall rules
- [ ] Set up monitoring infrastructure
- [ ] Create backup procedures

### Application Readiness

- [ ] All Sprint 6 items complete
- [ ] Code review completed
- [ ] Security audit passed
- [ ] Performance testing passed (load test, stress test)
- [ ] Database migrations tested
- [ ] Rollback plan prepared

### Configuration Management

- [ ] Production environment variables configured
- [ ] Secrets stored in vault (AWS Secrets Manager, HashiCorp Vault)
- [ ] Database connection strings secured
- [ ] API keys for external services configured
- [ ] Logging levels set to INFO (not DEBUG)

### Documentation

- [ ] Deployment runbook completed
- [ ] Operational runbooks for common scenarios
- [ ] Rollback procedures documented
- [ ] Contact list for on-call engineers
- [ ] Architecture diagrams updated

---

## Docker Containerization

### Dockerfile for FastAPI Application

Create `Dockerfile`:

```dockerfile
# Multi-stage build for FastAPI application

# Stage 1: Build stage
FROM python:3.9-slim as builder

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Poetry
RUN curl -sSL https://install.python-poetry.org | python3 -
ENV PATH="/root/.local/bin:$PATH"

# Copy dependency files
COPY pyproject.toml poetry.lock ./

# Install dependencies
RUN poetry config virtualenvs.create false \
    && poetry install --no-dev --no-interaction --no-ansi

# Stage 2: Runtime stage
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy Python packages from builder
COPY --from=builder /usr/local/lib/python3.9/site-packages /usr/local/lib/python3.9/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application code
COPY bt_platform/ ./bt_platform/

# Create non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Expose port
EXPOSE 8000

# Run application
CMD ["uvicorn", "bt_platform.core.app:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

### docker-compose.yml for Local Testing

```yaml
version: '3.8'

services:
  # FastAPI Application
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://biotech:password@postgres:5432/biotech_terminal
      - REDIS_URL=redis://redis:6379/0
      - SECRET_KEY=${SECRET_KEY}
      - ENVIRONMENT=production
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    networks:
      - biotech-network

  # PostgreSQL Database
  postgres:
    image: postgres:14-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=biotech
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=biotech_terminal
    ports:
      - "5432:5432"
    restart: unless-stopped
    networks:
      - biotech-network

  # Redis Cache
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    restart: unless-stopped
    networks:
      - biotech-network

  # Prometheus
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
    restart: unless-stopped
    networks:
      - biotech-network

  # Grafana
  grafana:
    image: grafana/grafana:latest
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana-dashboards:/etc/grafana/provisioning/dashboards
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false
    ports:
      - "3000:3000"
    depends_on:
      - prometheus
    restart: unless-stopped
    networks:
      - biotech-network

  # NGINX Load Balancer
  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - api
    restart: unless-stopped
    networks:
      - biotech-network

volumes:
  postgres_data:
  redis_data:
  prometheus_data:
  grafana_data:

networks:
  biotech-network:
    driver: bridge
```

### NGINX Configuration

Create `nginx/nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream fastapi_backend {
        least_conn;
        server api:8000 max_fails=3 fail_timeout=30s;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_conn_zone $binary_remote_addr zone=conn_limit:10m;

    server {
        listen 80;
        server_name api.biotech-terminal.com;

        # Redirect to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name api.biotech-terminal.com;

        # SSL Configuration
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;

        # Security Headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;

        # Logging
        access_log /var/log/nginx/access.log;
        error_log /var/log/nginx/error.log;

        # Rate limiting
        limit_req zone=api_limit burst=20 nodelay;
        limit_conn conn_limit 10;

        location / {
            proxy_pass http://fastapi_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # Timeouts
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        location /health {
            access_log off;
            proxy_pass http://fastapi_backend/health;
        }

        location /metrics {
            # Restrict to monitoring servers only
            allow 10.0.0.0/8;
            deny all;
            proxy_pass http://fastapi_backend/metrics;
        }
    }
}
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main
  workflow_dispatch:

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.9'

      - name: Install Poetry
        run: |
          curl -sSL https://install.python-poetry.org | python3 -
          echo "$HOME/.local/bin" >> $GITHUB_PATH

      - name: Install dependencies
        run: |
          poetry install

      - name: Run linters
        run: |
          poetry run ruff check bt_platform/
          poetry run black --check bt_platform/

      - name: Run tests
        run: |
          poetry run pytest tests/ --cov=bt_platform --cov-report=xml

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage.xml

  build:
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v3

      - name: Log in to Container Registry
        uses: docker/login-action@v2
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v4
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=sha,prefix={{branch}}-
            type=semver,pattern={{version}}

      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: production

    steps:
      - uses: actions/checkout@v3

      - name: Deploy to production
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.PRODUCTION_HOST }}
          username: ${{ secrets.PRODUCTION_USER }}
          key: ${{ secrets.PRODUCTION_SSH_KEY }}
          script: |
            cd /opt/biotech-terminal
            docker-compose pull
            docker-compose up -d --no-deps api
            docker-compose exec -T api alembic upgrade head

      - name: Verify deployment
        run: |
          sleep 30
          curl -f https://api.biotech-terminal.com/health || exit 1

      - name: Rollback on failure
        if: failure()
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.PRODUCTION_HOST }}
          username: ${{ secrets.PRODUCTION_USER }}
          key: ${{ secrets.PRODUCTION_SSH_KEY }}
          script: |
            cd /opt/biotech-terminal
            docker-compose down
            docker-compose up -d --no-deps api
```

### Deployment Stages

1. **Test Stage**
   - Run unit tests
   - Run integration tests
   - Linting and code quality checks
   - Security scans

2. **Build Stage**
   - Build Docker image
   - Tag with commit SHA and version
   - Push to container registry

3. **Deploy Stage**
   - Pull latest image
   - Rolling update (zero downtime)
   - Run database migrations
   - Health check verification

4. **Smoke Test Stage**
   - Test critical endpoints
   - Verify database connectivity
   - Check external API integrations

5. **Rollback (if needed)**
   - Revert to previous image
   - Rollback database migrations
   - Alert team

---

## Monitoring Setup

### Prometheus Configuration

Create `monitoring/prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  # FastAPI Application
  - job_name: 'biotech-api'
    static_configs:
      - targets: ['api:8000']
    metrics_path: '/metrics'

  # PostgreSQL
  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  # Redis
  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']

  # Node Exporter (System Metrics)
  - job_name: 'node'
    static_configs:
      - targets: ['node-exporter:9100']

# Alerting rules
rule_files:
  - '/etc/prometheus/alerts.yml'

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']
```

### Application Metrics

Add to `bt_platform/core/app.py`:

```python
from prometheus_client import Counter, Histogram, Gauge, generate_latest
from fastapi import Response
import time

# Metrics
request_count = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

request_duration = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration',
    ['method', 'endpoint']
)

scraper_runs = Counter(
    'scraper_runs_total',
    'Total scraper runs',
    ['scraper', 'status']
)

holdings_count = Gauge(
    'portfolio_holdings_total',
    'Total number of holdings',
    ['fund']
)

catalysts_count = Gauge(
    'catalysts_total',
    'Total number of catalysts',
    ['tier']
)


@app.middleware("http")
async def add_metrics(request, call_next):
    """Add Prometheus metrics to all requests"""
    start_time = time.time()

    response = await call_next(request)

    duration = time.time() - start_time

    request_count.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()

    request_duration.labels(
        method=request.method,
        endpoint=request.url.path
    ).observe(duration)

    return response


@app.get("/metrics")
def metrics():
    """Expose Prometheus metrics"""
    return Response(
        content=generate_latest(),
        media_type="text/plain"
    )


@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    """Health check endpoint"""
    try:
        # Check database
        db.execute("SELECT 1")

        # Check Redis
        # redis_client.ping()

        return {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "version": "1.0.0"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }
```

### Grafana Dashboards

Create `monitoring/grafana-dashboards/biotech-terminal.json`:

```json
{
  "dashboard": {
    "title": "Biotech Terminal Platform",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])"
          }
        ]
      },
      {
        "title": "Response Time (p95)",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))"
          }
        ]
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m])"
          }
        ]
      },
      {
        "title": "Database Connections",
        "targets": [
          {
            "expr": "pg_stat_database_numbackends"
          }
        ]
      },
      {
        "title": "Holdings Count",
        "targets": [
          {
            "expr": "portfolio_holdings_total"
          }
        ]
      },
      {
        "title": "Catalysts by Tier",
        "targets": [
          {
            "expr": "catalysts_total"
          }
        ]
      }
    ]
  }
}
```

---

## Alerting Configuration

### Alert Rules

Create `monitoring/alerts.yml`:

```yaml
groups:
  - name: biotech_terminal_alerts
    interval: 30s
    rules:
      # High error rate
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} errors/sec"

      # Slow API responses
      - alert: SlowAPIResponse
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "API response time degraded"
          description: "P95 latency is {{ $value }}s"

      # Database down
      - alert: DatabaseDown
        expr: up{job="postgres"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "PostgreSQL database is down"

      # Redis down
      - alert: RedisDown
        expr: up{job="redis"} == 0
        for: 1m
        labels:
          severity: warning
        annotations:
          summary: "Redis cache is down"

      # Scraper failures
      - alert: ScraperFailures
        expr: rate(scraper_runs_total{status="failed"}[1h]) > 0.1
        for: 30m
        labels:
          severity: warning
        annotations:
          summary: "High scraper failure rate"
          description: "Scraper {{ $labels.scraper }} is failing"

      # Disk space low
      - alert: DiskSpaceLow
        expr: (node_filesystem_avail_bytes / node_filesystem_size_bytes) < 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Disk space below 10%"
```

### Alertmanager Configuration

Create `monitoring/alertmanager.yml`:

```yaml
global:
  resolve_timeout: 5m
  slack_api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'

route:
  group_by: ['alertname', 'severity']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h
  receiver: 'default'

  routes:
    - match:
        severity: critical
      receiver: 'pagerduty'
      continue: true

    - match:
        severity: warning
      receiver: 'slack'

receivers:
  - name: 'default'
    email_configs:
      - to: 'ops@biotech-terminal.com'
        from: 'alerts@biotech-terminal.com'
        smarthost: 'smtp.gmail.com:587'
        auth_username: 'alerts@biotech-terminal.com'
        auth_password: 'password'

  - name: 'slack'
    slack_configs:
      - channel: '#biotech-alerts'
        title: '{{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'

  - name: 'pagerduty'
    pagerduty_configs:
      - service_key: 'YOUR_PAGERDUTY_KEY'
```

---

## Operational Runbooks

### Runbook 1: High Error Rate

**Symptoms:**
- AlertManager fires "HighErrorRate" alert
- Users reporting 500 errors
- Grafana shows spike in error count

**Diagnosis:**
1. Check Grafana dashboard for error patterns
2. Review application logs: `docker-compose logs api | grep ERROR`
3. Check database connectivity: `docker-compose exec api python -c "from bt_platform.core.database import engine; engine.connect()"`
4. Verify external API status (SEC, FDA)

**Resolution:**
1. If database issue: Restart database or scale up
2. If external API issue: Enable circuit breaker or use cached data
3. If code bug: Rollback to previous version
4. If resource exhaustion: Scale horizontally (add more API replicas)

**Prevention:**
- Implement circuit breakers for external APIs
- Add request timeouts
- Increase test coverage

---

### Runbook 2: Database Connection Pool Exhausted

**Symptoms:**
- "Too many connections" errors
- Slow queries
- API timeouts

**Diagnosis:**
```bash
# Check current connections
docker-compose exec postgres psql -U biotech -c "SELECT count(*) FROM pg_stat_activity;"

# Check long-running queries
docker-compose exec postgres psql -U biotech -c "SELECT pid, now() - pg_stat_activity.query_start AS duration, query FROM pg_stat_activity WHERE state = 'active' ORDER BY duration DESC;"
```

**Resolution:**
1. Kill long-running queries: `docker-compose exec postgres psql -U biotech -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE pid = <PID>;"`
2. Increase connection pool size in application config
3. Scale database vertically (more CPU/RAM)
4. Add read replica for SELECT queries

**Prevention:**
- Optimize slow queries
- Add database indexes
- Implement connection pooling with PgBouncer

---

### Runbook 3: Scraper Failures

**Symptoms:**
- "ScraperFailures" alert
- No new holdings or catalysts
- Logs show parsing errors

**Diagnosis:**
```bash
# Check scraper logs
docker-compose logs api | grep "scraper"

# Test SEC access manually
curl -H "User-Agent: Biotech Terminal" "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001454691&type=13F&output=atom"
```

**Resolution:**
1. If rate limited: Increase delays between requests
2. If parsing error: Update scraper to handle new XML format
3. If SEC site down: Wait and retry
4. If blocked: Update User-Agent header

**Prevention:**
- Add robust error handling
- Implement exponential backoff
- Monitor SEC status page

---

## Security Hardening

### Security Checklist

- [ ] **SSL/TLS:** HTTPS with TLS 1.2+ only
- [ ] **Authentication:** JWT tokens for API access
- [ ] **Authorization:** Role-based access control (RBAC)
- [ ] **Input Validation:** Pydantic models for all inputs
- [ ] **SQL Injection:** Use SQLAlchemy ORM, no raw SQL
- [ ] **XSS:** React auto-escapes, sanitize user HTML
- [ ] **CSRF:** CSRF tokens for state-changing operations
- [ ] **Rate Limiting:** NGINX rate limiting (10 req/sec)
- [ ] **Secrets Management:** Secrets in vault, not code
- [ ] **Dependency Scanning:** Regular `poetry audit` and `npm audit`
- [ ] **Container Scanning:** Trivy or Snyk for Docker images
- [ ] **Logging:** Audit logs for security events
- [ ] **Backup Encryption:** Encrypted database backups

### Security Headers

```python
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://biotech-terminal.com"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Trusted Host
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["api.biotech-terminal.com", "localhost"]
)

# Security Headers
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response
```

---

## Backup & Disaster Recovery

### Backup Strategy

**Database Backups:**
```bash
# Daily full backup
docker-compose exec postgres pg_dump -U biotech biotech_terminal | gzip > backup_$(date +%Y%m%d).sql.gz

# Upload to S3
aws s3 cp backup_$(date +%Y%m%d).sql.gz s3://biotech-backups/daily/
```

**Retention Policy:**
- Daily backups: 30 days
- Weekly backups: 12 weeks
- Monthly backups: 12 months

**Restore Procedure:**
```bash
# Download backup
aws s3 cp s3://biotech-backups/daily/backup_20250101.sql.gz .

# Restore
gunzip < backup_20250101.sql.gz | docker-compose exec -T postgres psql -U biotech biotech_terminal
```

### Disaster Recovery Plan

**RTO (Recovery Time Objective):** 4 hours
**RPO (Recovery Point Objective):** 24 hours

**Steps:**
1. Spin up new infrastructure (30 min)
2. Restore database from backup (1 hour)
3. Deploy application (30 min)
4. Verify and test (1 hour)
5. Switch DNS (10 min)
6. Monitor (1 hour)

---

## Performance Tuning

### Database Optimization

```sql
-- Add indexes for common queries
CREATE INDEX idx_holdings_fund_date ON portfolio_holdings(fund_cik, period_of_report);
CREATE INDEX idx_catalysts_date ON catalysts(event_date);
CREATE INDEX idx_catalysts_score ON catalysts(score);

-- Analyze tables
ANALYZE portfolio_holdings;
ANALYZE catalysts;

-- Vacuum
VACUUM ANALYZE;
```

### Application Optimization

- **Connection Pooling:** Use SQLAlchemy pool_size=20, max_overflow=10
- **Caching:** Redis for holdings (TTL 1 hour), scores (TTL 30 min)
- **Async:** Use async/await for I/O operations
- **Pagination:** Limit API responses to 100 items
- **Compression:** Enable gzip compression in NGINX

### Load Testing

```bash
# Install k6
brew install k6

# Run load test
k6 run load-test.js
```

`load-test.js`:
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 100,  // 100 virtual users
  duration: '5m',
};

export default function() {
  let response = http.get('https://api.biotech-terminal.com/api/v1/portfolio/redmile/holdings');
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  sleep(1);
}
```

---

## Conclusion

This production deployment guide provides a comprehensive roadmap for deploying the Redmile Catalyst Intelligence System with:

- **High Availability:** 99.5% uptime through load balancing and redundancy
- **Monitoring:** Real-time metrics and alerting
- **Security:** Hardened infrastructure and application
- **Scalability:** Horizontal and vertical scaling strategies
- **Disaster Recovery:** Backup and restore procedures

**Production Checklist:**
- [ ] All code deployed and tested
- [ ] Monitoring and alerting operational
- [ ] Backups configured and tested
- [ ] Security hardening complete
- [ ] Runbooks documented
- [ ] On-call rotation established
- [ ] Stakeholder sign-off

**Post-Launch:**
- Monitor metrics for 72 hours
- Collect user feedback
- Iterate and improve

---

*Last Updated: 2025-10-14*
*Version: 1.0*
*Status: Production Ready*

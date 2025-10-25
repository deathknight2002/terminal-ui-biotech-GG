# Observability Guide

This guide covers the observability features in the Biotech Terminal Platform, including structured logging, metrics collection, and error tracking.

## Overview

The platform includes comprehensive observability features:
- **Structured JSON Logging**: Machine-readable logs with context
- **Prometheus Metrics**: Performance and business metrics
- **Sentry Integration**: Error tracking and performance monitoring
- **Health Checks**: Service status endpoints

## Structured Logging

### Configuration

Structured logging is configured via environment variables:

```bash
# Logging level: DEBUG, INFO, WARNING, ERROR, CRITICAL
LOG_LEVEL=INFO

# Log format: "json" (structured) or "text" (human-readable)
LOG_FORMAT=json
```

### Implementation

Logging is set up in `bt_platform/core/utils/logging.py`:

```python
from bt_platform.core.utils.logging import setup_structured_logging, get_logger

# Setup (done automatically in app.py)
setup_structured_logging(level="INFO", json_format=True)

# Get a logger
logger = get_logger(__name__)

# Log with structured context
logger.info("Processing request", extra={
    "user_id": "12345",
    "endpoint": "/api/v1/drugs",
    "duration_ms": 45.2
})
```

### JSON Output Format

```json
{
  "timestamp": "2025-10-25T10:30:00",
  "level": "INFO",
  "logger": "bt_platform.core.app",
  "message": "Processing request",
  "user_id": "12345",
  "endpoint": "/api/v1/drugs",
  "duration_ms": 45.2,
  "file": "/path/to/file.py",
  "line": 42,
  "function": "process_request",
  "process_id": 12345,
  "thread_id": 67890
}
```

### Helper Functions

```python
from bt_platform.core.utils.logging import log_request, log_response, log_error, log_metric

# Log HTTP request
log_request(logger, method="GET", path="/api/v1/drugs", user_id="12345")

# Log HTTP response
log_response(logger, method="GET", path="/api/v1/drugs", status_code=200, duration_ms=45.2)

# Log error with context
try:
    risky_operation()
except Exception as e:
    log_error(logger, e, user_id="12345", endpoint="/api/v1/drugs")

# Log custom metric
log_metric(logger, "evidence_graph_nodes", 150, source="database")
```

## Prometheus Metrics

### Accessing Metrics

Metrics are exposed at the `/metrics` endpoint in Prometheus format:

```bash
curl http://localhost:8000/metrics
```

### Available Metrics

#### HTTP Metrics
- `http_requests_total` - Total HTTP requests (labels: method, endpoint, status)
- `http_request_duration_seconds` - Request duration histogram (labels: method, endpoint)

#### Application Metrics
- `active_connections` - Number of active connections
- `evidence_graph_nodes_total` - Total nodes in evidence graph
- `evidence_graph_edges_total` - Total edges in evidence graph

#### Database Metrics
- `database_queries_total` - Total database queries (label: operation)
- `database_query_duration_seconds` - Query duration histogram (label: operation)

#### Cache Metrics
- `cache_hits_total` - Total cache hits (label: cache_type)
- `cache_misses_total` - Total cache misses (label: cache_type)

#### Error Metrics
- `errors_total` - Total errors (label: error_type)

### Metrics Middleware

HTTP metrics are automatically collected by the `MetricsMiddleware` in `bt_platform/core/utils/metrics.py`:

```python
from bt_platform.core.utils.metrics import MetricsMiddleware

# Added automatically in app.py
app.add_middleware(MetricsMiddleware)
```

### Manual Metric Tracking

```python
from bt_platform.core.utils.metrics import (
    track_http_request,
    track_http_duration,
    track_database_query,
    track_cache_hit,
    track_cache_miss,
    track_error,
    update_evidence_graph_metrics,
    update_active_connections
)

# Track HTTP request
track_http_request(method="GET", endpoint="/api/v1/drugs", status=200)

# Track HTTP duration
track_http_duration(method="GET", endpoint="/api/v1/drugs", duration=0.045)

# Track database query
track_database_query(operation="select", duration=0.012)

# Track cache operations
track_cache_hit(cache_type="evidence_graph")
track_cache_miss(cache_type="evidence_graph")

# Track error
track_error(error_type="ValidationError")

# Update application metrics
update_evidence_graph_metrics(nodes_count=150, edges_count=300)
update_active_connections(count=5)
```

### Configuration

Enable or disable metrics via environment variable:

```bash
# Enable metrics collection (default: true)
METRICS_ENABLED=true
```

## Sentry Integration

### Configuration

Configure Sentry via environment variables:

```bash
# Sentry DSN (leave empty to disable)
SENTRY_DSN=https://your-dsn@sentry.io/project-id

# Environment name
SENTRY_ENVIRONMENT=development

# Percentage of transactions to trace (0.0 to 1.0)
SENTRY_TRACES_SAMPLE_RATE=0.1
```

### Implementation

Sentry is initialized automatically in `bt_platform/core/app.py`:

```python
from bt_platform.core.utils.sentry import init_sentry

# Initialize (done automatically in app.py)
init_sentry(
    dsn=settings.SENTRY_DSN,
    environment=settings.SENTRY_ENVIRONMENT,
    traces_sample_rate=settings.SENTRY_TRACES_SAMPLE_RATE,
    enable=bool(settings.SENTRY_DSN)
)
```

### Manual Error Capture

```python
from bt_platform.core.utils.sentry import (
    capture_exception,
    capture_message,
    set_user,
    set_tag,
    set_context
)

# Capture exception with context
try:
    risky_operation()
except Exception as e:
    capture_exception(e, 
        user={"id": "12345", "email": "user@example.com"},
        request={"url": "/api/v1/drugs", "method": "GET"}
    )

# Capture message
capture_message("Important event occurred", level="info", 
    custom_data={"key": "value"}
)

# Set user context
set_user(user_id="12345", email="user@example.com", username="john_doe")

# Set tags for filtering
set_tag("environment", "production")
set_tag("feature", "evidence_graph")

# Set custom context
set_context("business_context", {
    "company": "Test Pharma",
    "asset": "DRUG-001",
    "phase": "Phase II"
})
```

### Automatic Error Capture

The global exception handler automatically captures unhandled exceptions:

```python
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Global exception: {exc}", exc_info=True)
    
    # Automatically capture in Sentry
    from bt_platform.core.utils.sentry import capture_exception
    capture_exception(exc, request={
        "url": str(request.url),
        "method": request.method,
        "headers": dict(request.headers)
    })
```

## Health Checks

### Endpoint

```bash
GET http://localhost:8000/health
```

### Response

```json
{
  "status": "healthy",
  "service": "biotech-terminal-platform",
  "version": "1.0.0",
  "environment": "development"
}
```

### Usage

- **Kubernetes**: Use for liveness/readiness probes
- **Load Balancers**: Use for health checking
- **Monitoring**: Use for uptime monitoring

### Custom Health Checks

Extend the health check endpoint to include additional checks:

```python
@app.get("/health")
async def health_check():
    # Check database connectivity
    try:
        async with AsyncSession(engine) as session:
            await session.execute(text("SELECT 1"))
        db_status = "healthy"
    except Exception:
        db_status = "unhealthy"
    
    return {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "service": "biotech-terminal-platform",
        "version": "1.0.0",
        "environment": settings.SENTRY_ENVIRONMENT,
        "checks": {
            "database": db_status
        }
    }
```

## Monitoring Dashboard Setup

### Prometheus + Grafana

1. **Scrape Configuration** (`prometheus.yml`):
```yaml
scrape_configs:
  - job_name: 'biotech-terminal'
    static_configs:
      - targets: ['localhost:8000']
    metrics_path: '/metrics'
    scrape_interval: 15s
```

2. **Grafana Dashboard**: Import pre-built dashboards or create custom ones using the metrics.

### ELK Stack (Elasticsearch, Logstash, Kibana)

1. **Logstash Configuration**: Parse JSON logs
```ruby
input {
  file {
    path => "/var/log/biotech-terminal/*.log"
    codec => "json"
  }
}

filter {
  # Add any additional filtering
}

output {
  elasticsearch {
    hosts => ["localhost:9200"]
    index => "biotech-terminal-%{+YYYY.MM.dd}"
  }
}
```

2. **Kibana**: Create dashboards and alerts based on log data.

## Best Practices

### Logging

1. **Use structured logging**: Always use JSON format in production
2. **Include context**: Add relevant context to log entries
3. **Log levels**: Use appropriate levels (DEBUG, INFO, WARNING, ERROR, CRITICAL)
4. **Avoid PII**: Don't log sensitive information (passwords, tokens)
5. **Be concise**: Log messages should be clear and actionable

### Metrics

1. **Use labels**: Add relevant labels to metrics for filtering
2. **Avoid high cardinality**: Don't use unbounded values as labels
3. **Track business metrics**: Not just technical metrics
4. **Set appropriate histogram buckets**: For duration metrics
5. **Document metrics**: Describe what each metric measures

### Sentry

1. **Set context**: Always set user, request, and custom context
2. **Use tags**: For filtering and alerting
3. **Sample appropriately**: Balance visibility vs. cost
4. **Set up alerts**: Get notified of critical errors
5. **Review regularly**: Triage and fix errors promptly

### Health Checks

1. **Keep it lightweight**: Health checks should be fast
2. **Check dependencies**: Include database, external APIs
3. **Return appropriate status**: Use HTTP status codes correctly
4. **Include version**: For deployment tracking
5. **Document**: Explain what "healthy" means

## Troubleshooting

### Logs Not Appearing

- Check `LOG_LEVEL` setting
- Verify logging is configured in `app.py`
- Check file permissions if logging to file
- Verify JSON format is valid

### Metrics Not Updating

- Check `METRICS_ENABLED=true`
- Verify middleware is added to app
- Check `/metrics` endpoint accessibility
- Verify Prometheus scraping configuration

### Sentry Not Capturing Errors

- Verify `SENTRY_DSN` is set correctly
- Check Sentry project configuration
- Verify error rate limits in Sentry
- Check network connectivity to Sentry

### High Memory Usage

- Reduce `SENTRY_TRACES_SAMPLE_RATE`
- Adjust metrics retention
- Check for log file rotation
- Monitor for metric cardinality issues

## Example: Production Setup

```bash
# .env file for production
LOG_LEVEL=INFO
LOG_FORMAT=json
SENTRY_DSN=https://your-production-dsn@sentry.io/123456
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.01
METRICS_ENABLED=true
```

```python
# Custom middleware for request tracking
from starlette.middleware.base import BaseHTTPMiddleware
import time

class RequestTrackingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        start_time = time.time()
        
        # Log request
        logger.info("Request started", extra={
            "method": request.method,
            "path": request.url.path,
            "client_ip": request.client.host
        })
        
        try:
            response = await call_next(request)
            duration = time.time() - start_time
            
            # Log response
            logger.info("Request completed", extra={
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
                "duration_ms": duration * 1000
            })
            
            return response
        except Exception as e:
            duration = time.time() - start_time
            
            # Log error
            logger.error("Request failed", extra={
                "method": request.method,
                "path": request.url.path,
                "duration_ms": duration * 1000,
                "error": str(e)
            }, exc_info=True)
            
            # Capture in Sentry
            capture_exception(e)
            raise
```

## Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Sentry Python SDK](https://docs.sentry.io/platforms/python/)
- [Python Logging Best Practices](https://docs.python.org/3/howto/logging.html)
- [FastAPI Middleware](https://fastapi.tiangolo.com/advanced/middleware/)

"""
Prometheus Metrics Endpoint

Exposes application metrics in Prometheus format.
"""

from fastapi import APIRouter, Response
from prometheus_client import (
    Counter,
    Histogram,
    Gauge,
    generate_latest,
    CONTENT_TYPE_LATEST,
    CollectorRegistry,
)
import time

router = APIRouter()

# Create a custom registry to avoid conflicts
registry = CollectorRegistry()

# HTTP request metrics
http_requests_total = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status'],
    registry=registry
)

http_request_duration_seconds = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration in seconds',
    ['method', 'endpoint'],
    registry=registry
)

# Application metrics
active_connections = Gauge(
    'active_connections',
    'Number of active connections',
    registry=registry
)

evidence_graph_nodes = Gauge(
    'evidence_graph_nodes_total',
    'Total number of nodes in evidence graph',
    registry=registry
)

evidence_graph_edges = Gauge(
    'evidence_graph_edges_total',
    'Total number of edges in evidence graph',
    registry=registry
)

# Database metrics
database_queries_total = Counter(
    'database_queries_total',
    'Total database queries',
    ['operation'],
    registry=registry
)

database_query_duration_seconds = Histogram(
    'database_query_duration_seconds',
    'Database query duration in seconds',
    ['operation'],
    registry=registry
)

# Cache metrics
cache_hits_total = Counter(
    'cache_hits_total',
    'Total cache hits',
    ['cache_type'],
    registry=registry
)

cache_misses_total = Counter(
    'cache_misses_total',
    'Total cache misses',
    ['cache_type'],
    registry=registry
)

# Error metrics
errors_total = Counter(
    'errors_total',
    'Total errors',
    ['error_type'],
    registry=registry
)


@router.get("/metrics")
async def metrics():
    """
    Prometheus metrics endpoint.
    
    Returns metrics in Prometheus exposition format.
    """
    return Response(
        content=generate_latest(registry),
        media_type=CONTENT_TYPE_LATEST
    )


# Metric tracking helpers
def track_http_request(method: str, endpoint: str, status: int):
    """Track an HTTP request"""
    http_requests_total.labels(method=method, endpoint=endpoint, status=status).inc()


def track_http_duration(method: str, endpoint: str, duration: float):
    """Track HTTP request duration"""
    http_request_duration_seconds.labels(method=method, endpoint=endpoint).observe(duration)


def track_database_query(operation: str, duration: float):
    """Track a database query"""
    database_queries_total.labels(operation=operation).inc()
    database_query_duration_seconds.labels(operation=operation).observe(duration)


def track_cache_hit(cache_type: str = "default"):
    """Track a cache hit"""
    cache_hits_total.labels(cache_type=cache_type).inc()


def track_cache_miss(cache_type: str = "default"):
    """Track a cache miss"""
    cache_misses_total.labels(cache_type=cache_type).inc()


def track_error(error_type: str):
    """Track an error"""
    errors_total.labels(error_type=error_type).inc()


def update_evidence_graph_metrics(nodes_count: int, edges_count: int):
    """Update evidence graph metrics"""
    evidence_graph_nodes.set(nodes_count)
    evidence_graph_edges.set(edges_count)


def update_active_connections(count: int):
    """Update active connections count"""
    active_connections.set(count)


class MetricsMiddleware:
    """Middleware to track HTTP metrics automatically"""
    
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        
        method = scope.get("method", "UNKNOWN")
        path = scope.get("path", "/")
        
        start_time = time.time()
        
        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                status = message.get("status", 500)
                duration = time.time() - start_time
                
                # Track metrics
                track_http_request(method, path, status)
                track_http_duration(method, path, duration)
            
            await send(message)
        
        await self.app(scope, receive, send_wrapper)

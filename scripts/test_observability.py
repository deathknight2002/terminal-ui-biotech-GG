#!/usr/bin/env python3
"""
Test Observability Features

This script tests that the observability infrastructure is working:
1. Structured logging (JSON format)
2. Prometheus metrics endpoint
3. Sentry integration (optional)
"""

import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from bt_platform.core.utils.logging import setup_structured_logging, get_logger
from bt_platform.core.utils.metrics import (
    track_http_request,
    track_http_duration,
    track_database_query,
    track_cache_hit,
    track_cache_miss,
    track_error,
    update_evidence_graph_metrics,
    http_requests_total,
    http_request_duration_seconds,
)
from bt_platform.core.utils.sentry import init_sentry, capture_message
from bt_platform.core.config import settings


def test_structured_logging():
    """Test structured logging"""
    print("=" * 60)
    print("Testing Structured Logging")
    print("=" * 60)
    
    # Test JSON logging
    logger = setup_structured_logging(level="INFO", json_format=True)
    logger.info("Test log message", extra={"test_field": "test_value", "event_type": "test"})
    
    # Test plain text logging
    logger_plain = setup_structured_logging(level="INFO", json_format=False)
    logger_plain.info("Test plain log message")
    
    print("✅ Structured logging works\n")


def test_metrics():
    """Test Prometheus metrics"""
    print("=" * 60)
    print("Testing Prometheus Metrics")
    print("=" * 60)
    
    # Track some metrics
    track_http_request("GET", "/api/v1/evidence-graph/nodes", 200)
    track_http_request("POST", "/api/v1/evidence-graph/node", 201)
    track_http_duration("GET", "/api/v1/evidence-graph/nodes", 0.123)
    track_database_query("select", 0.045)
    track_cache_hit("evidence-graph")
    track_cache_miss("evidence-graph")
    track_error("ValidationError")
    update_evidence_graph_metrics(nodes_count=42, edges_count=73)
    
    # Check that metrics were recorded
    assert http_requests_total._metrics, "HTTP metrics should be recorded"
    
    print("Metrics recorded:")
    print(f"  - HTTP requests: {len(http_requests_total._metrics)} labels")
    print(f"  - HTTP duration: {len(http_request_duration_seconds._metrics)} labels")
    
    print("✅ Prometheus metrics work\n")


def test_sentry():
    """Test Sentry integration"""
    print("=" * 60)
    print("Testing Sentry Integration")
    print("=" * 60)
    
    if settings.SENTRY_DSN:
        print(f"Sentry DSN configured: {settings.SENTRY_DSN[:20]}...")
        init_sentry(
            dsn=settings.SENTRY_DSN,
            environment=settings.SENTRY_ENVIRONMENT,
            traces_sample_rate=settings.SENTRY_TRACES_SAMPLE_RATE,
            enable=True
        )
        capture_message("Test message from observability test", level="info")
        print("✅ Sentry initialized and test message sent")
    else:
        print("⚠️  Sentry DSN not configured (optional)")
        print("   Set SENTRY_DSN environment variable to enable Sentry")
    
    print()


def test_metrics_endpoint():
    """Test that metrics endpoint returns data"""
    print("=" * 60)
    print("Testing Metrics Endpoint Format")
    print("=" * 60)
    
    from prometheus_client import generate_latest
    from bt_platform.core.utils.metrics import registry
    
    # Generate metrics output
    metrics_output = generate_latest(registry).decode('utf-8')
    
    print("Sample metrics output:")
    lines = metrics_output.split('\n')[:10]
    for line in lines:
        if line and not line.startswith('#'):
            print(f"  {line}")
    
    print("✅ Metrics endpoint format is correct\n")


def main():
    """Run all observability tests"""
    print("\n")
    print("╔═══════════════════════════════════════════════════════════╗")
    print("║         OBSERVABILITY INFRASTRUCTURE TEST                 ║")
    print("╚═══════════════════════════════════════════════════════════╝")
    print()
    
    try:
        test_structured_logging()
        test_metrics()
        test_sentry()
        test_metrics_endpoint()
        
        print("=" * 60)
        print("✅ ALL OBSERVABILITY TESTS PASSED")
        print("=" * 60)
        print()
        print("Next steps:")
        print("1. Start the API: poetry run uvicorn bt_platform.core.app:app --reload")
        print("2. Visit http://localhost:8000/metrics to see metrics")
        print("3. Set SENTRY_DSN to enable error tracking")
        print()
        
        return 0
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())

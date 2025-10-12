"""
Scraper Plugin Framework

A comprehensive scraper system with:
- Plugin architecture with strict interface
- Async HTTP/2 with connection pooling
- Rate limiting and circuit breakers
- Content fingerprinting and deduplication
- Fixture system for offline testing
"""

from .base.interface import ScraperInterface, ScraperResult
from .base.registry import ScraperRegistry
from .utils.http_client import AsyncHTTPClient
from .utils.rate_limiter import TokenBucketRateLimiter

__all__ = [
    "ScraperInterface",
    "ScraperResult",
    "ScraperRegistry",
    "AsyncHTTPClient",
    "TokenBucketRateLimiter",
]

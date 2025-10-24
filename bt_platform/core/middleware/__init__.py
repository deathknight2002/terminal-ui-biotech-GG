"""Middleware module for FastAPI application"""

from .rate_limiter import SimpleRateLimiter

__all__ = ["SimpleRateLimiter"]

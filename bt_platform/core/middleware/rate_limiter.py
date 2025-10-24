"""
Rate Limiting Middleware

Simple in-memory rate limiter for FastAPI.
Tracks requests per IP address using a sliding window.
"""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from time import time
from typing import Dict, List


class SimpleRateLimiter(BaseHTTPMiddleware):
    """
    Simple rate limiter middleware.
    
    Tracks requests per client IP using a sliding window.
    Default: 60 requests per 60 seconds per IP.
    """
    
    def __init__(self, app, calls: int = 60, period: int = 60):
        """
        Initialize rate limiter.
        
        Args:
            app: FastAPI application
            calls: Maximum number of calls allowed in the time period
            period: Time period in seconds (default: 60)
        """
        super().__init__(app)
        self.calls = calls
        self.period = period
        self.buckets: Dict[str, List[float]] = {}
    
    async def dispatch(self, request: Request, call_next):
        """Process request with rate limiting."""
        # Get client IP
        client_ip = request.client.host if request.client else "unknown"
        
        # Skip rate limiting for health check
        if request.url.path.endswith("/health"):
            return await call_next(request)
        
        # Current timestamp
        now = time()
        
        # Initialize bucket for this IP if needed
        if client_ip not in self.buckets:
            self.buckets[client_ip] = []
        
        # Remove old timestamps outside the sliding window
        self.buckets[client_ip] = [
            ts for ts in self.buckets[client_ip]
            if now - ts < self.period
        ]
        
        # Check if rate limit exceeded
        if len(self.buckets[client_ip]) >= self.calls:
            return Response(
                status_code=429,
                content="Rate limit exceeded. Please try again later.",
                headers={
                    "Retry-After": str(self.period),
                    "X-RateLimit-Limit": str(self.calls),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(int(now + self.period))
                }
            )
        
        # Record this request
        self.buckets[client_ip].append(now)
        
        # Process request
        response = await call_next(request)
        
        # Add rate limit headers to response
        remaining = self.calls - len(self.buckets[client_ip])
        response.headers["X-RateLimit-Limit"] = str(self.calls)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(int(now + self.period))
        
        return response

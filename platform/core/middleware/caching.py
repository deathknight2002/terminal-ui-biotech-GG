"""
HTTP Caching Middleware

Implements Cache-Control headers and conditional requests (ETag/Last-Modified)
for manual-refresh model. Supports 304 Not Modified responses.
"""

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.datastructures import Headers
import hashlib
import json
from datetime import datetime
from typing import Optional


class CachingMiddleware(BaseHTTPMiddleware):
    """
    Middleware to add Cache-Control headers and support conditional requests.
    
    For GET endpoints:
    - Adds Cache-Control: public, max-age=<ttl>
    - Adds Last-Modified header
    - Generates ETag from response body
    - Returns 304 Not Modified if ETag/Last-Modified matches
    """
    
    def __init__(self, app, default_ttl: int = 1800):
        """
        Initialize caching middleware.
        
        Args:
            app: FastAPI application
            default_ttl: Default TTL in seconds (default: 1800 = 30 minutes)
        """
        super().__init__(app)
        self.default_ttl = default_ttl
        self.last_modified = datetime.utcnow().strftime('%a, %d %b %Y %H:%M:%S GMT')
    
    def _should_cache(self, request: Request) -> bool:
        """Check if request should be cached."""
        # Only cache GET requests
        if request.method != "GET":
            return False
        
        # Don't cache health/metrics endpoints
        path = request.url.path
        if path in ["/health", "/metrics", "/health/ready"]:
            return False
        
        # Cache API endpoints
        if path.startswith("/api/"):
            return True
        
        return False
    
    def _get_ttl(self, path: str) -> int:
        """Get TTL for specific endpoint."""
        # Longer TTL for static/reference data
        if any(x in path for x in ["/companies", "/drugs", "/therapeutic-areas"]):
            return 3600  # 60 minutes
        
        # Medium TTL for dashboard/analytics
        if any(x in path for x in ["/dashboard", "/analytics", "/pipeline"]):
            return 1800  # 30 minutes
        
        # Shorter TTL for real-time data
        if any(x in path for x in ["/trials", "/news", "/catalysts"]):
            return 900  # 15 minutes
        
        return self.default_ttl
    
    def _generate_etag(self, content: bytes) -> str:
        """Generate ETag from response content."""
        return f'"{hashlib.md5(content).hexdigest()}"'
    
    def _check_conditional_request(
        self, 
        request: Request, 
        etag: str,
        last_modified: str
    ) -> bool:
        """
        Check if request is conditional and matches current version.
        
        Returns True if client has current version (should return 304).
        """
        # Check If-None-Match (ETag)
        if_none_match = request.headers.get("if-none-match")
        if if_none_match and if_none_match == etag:
            return True
        
        # Check If-Modified-Since
        if_modified_since = request.headers.get("if-modified-since")
        if if_modified_since and if_modified_since == last_modified:
            return True
        
        return False
    
    async def dispatch(self, request: Request, call_next):
        """Process request and add caching headers."""
        # Check if we should cache this request
        if not self._should_cache(request):
            return await call_next(request)
        
        # Get the response
        response = await call_next(request)
        
        # Only cache successful responses
        if response.status_code != 200:
            return response
        
        # Get TTL for this endpoint
        ttl = self._get_ttl(request.url.path)
        
        # Read response body to generate ETag
        body = b""
        async for chunk in response.body_iterator:
            body += chunk
        
        # Generate ETag
        etag = self._generate_etag(body)
        
        # Check if client has current version
        if self._check_conditional_request(request, etag, self.last_modified):
            # Client has current version, return 304
            return Response(
                status_code=304,
                headers={
                    "ETag": etag,
                    "Last-Modified": self.last_modified,
                    "Cache-Control": f"public, max-age={ttl}",
                }
            )
        
        # Return full response with caching headers
        return Response(
            content=body,
            status_code=200,
            headers={
                "Content-Type": response.headers.get("content-type", "application/json"),
                "ETag": etag,
                "Last-Modified": self.last_modified,
                "Cache-Control": f"public, max-age={ttl}",
            },
            media_type=response.media_type,
        )

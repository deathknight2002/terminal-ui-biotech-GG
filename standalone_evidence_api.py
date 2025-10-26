"""
Standalone Evidence Graph API Server

Simple FastAPI server for testing the evidence graph endpoints.
Enhanced with production-ready features:
- Rate limiting
- Security headers
- CORS configuration
- Request logging

Run with: uvicorn standalone_evidence_api:app --reload --port 8000
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
import time
import os

# Import the evidence graph router
from bt_platform.core.endpoints.evidence_graph import router as evidence_graph_router
from bt_platform.core.middleware.rate_limiter import SimpleRateLimiter

# Create FastAPI app
app = FastAPI(
    title="Evidence Graph API",
    description="Standalone API for evidence graph visualization with production features",
    version="1.0.0"
)

# Security headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Add security headers to all responses."""
    response = await call_next(request)

    # Security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data:; "
        "font-src 'self' data:; "
        "connect-src 'self'"
    )

    # Request ID for tracing
    request_id = request.headers.get("X-Request-ID", f"req-{int(time.time() * 1000)}")
    response.headers["X-Request-ID"] = request_id

    return response

# Add rate limiting (60 requests per minute per IP)
app.add_middleware(SimpleRateLimiter, calls=60, period=60)

# Add CORS middleware with production-ready configuration
# In production, replace ["*"] with specific allowed origins
allowed_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")
if os.getenv("ENV") == "development":
    allowed_origins = ["*"]  # Allow all origins in development only

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "HEAD", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["ETag", "X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset", "X-Total-Count"]
)

# Health check
@app.get("/health")
async def health_check():
    """
    Health check endpoint.

    Returns service status and version information.
    """
    return {
        "status": "ok",
        "service": "evidence-graph-standalone",
        "version": "1.0.0",
        "features": {
            "etag_caching": True,
            "rate_limiting": True,
            "filtering": True,
            "pagination": True
        }
    }

# Include evidence graph router
app.include_router(evidence_graph_router, prefix="/api/v1/evidence-graph", tags=["evidence-graph"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

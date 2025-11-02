"""
Core Platform Application

FastAPI-based biotech data platform with providers, extensions,
and real-time analytics.
"""

import logging
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse

from .config import settings
from .database import init_db
from .middleware.auth import APITokenAuthMiddleware
from .middleware.caching import CachingMiddleware
from .routers import api_router
from .utils.logging import setup_structured_logging
from .utils.metrics import MetricsMiddleware
from .utils.metrics import router as metrics_router
from .utils.sentry import init_sentry
from .websocket import websocket_router

# Configure structured logging
setup_structured_logging(
    level=settings.LOG_LEVEL,
    json_format=(settings.LOG_FORMAT == "json")
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler"""
    # Startup
    logger.info("🚀 Starting Biotech Terminal Platform", extra={
        "event_type": "startup",
        "environment": settings.SENTRY_ENVIRONMENT,
        "debug": settings.DEBUG
    })

    # Initialize Sentry if configured
    init_sentry(
        dsn=settings.SENTRY_DSN,
        environment=settings.SENTRY_ENVIRONMENT,
        traces_sample_rate=settings.SENTRY_TRACES_SAMPLE_RATE,
        enable=bool(settings.SENTRY_DSN)
    )

    # Initialize database
    await init_db()
    logger.info("📊 Database initialized", extra={"event_type": "database_init"})

    yield

    # Shutdown
    logger.info("🔄 Shutting down Biotech Terminal Platform", extra={"event_type": "shutdown"})


# Create FastAPI application
app = FastAPI(
    title="Biotech Terminal Platform",
    description="Open-source biotech intelligence platform with pharmaceutical data and financial modeling",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Add middleware (order matters!)
# 1. Metrics middleware (outermost - tracks all requests)
if settings.METRICS_ENABLED:
    app.add_middleware(MetricsMiddleware)

# 2. CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. GZip compression
app.add_middleware(GZipMiddleware, minimum_size=1000)

# 4. API token authentication (protects write operations)
app.add_middleware(
    APITokenAuthMiddleware,
    enabled=settings.API_TOKEN_ENABLED,
    api_token=settings.API_TOKEN
)

# 5. Caching middleware for manual-refresh model
# Implements Cache-Control headers and conditional requests (ETag/Last-Modified)
app.add_middleware(CachingMiddleware, default_ttl=1800)  # 30 minutes default


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "biotech-terminal-platform",
        "version": "1.0.0",
        "environment": settings.SENTRY_ENVIRONMENT
    }


# Include routers
# Expose versioned and legacy routes for compatibility
app.include_router(api_router, prefix="/api/v1")
app.include_router(api_router, prefix="/api")
app.include_router(websocket_router)

# Include metrics router if enabled
if settings.METRICS_ENABLED:
    app.include_router(metrics_router)


# Mount Dash app for Evidence Graph visualization
try:
    from starlette.middleware.wsgi import WSGIMiddleware

    # Try new Aurora Lava dashboard first
    try:
        from .dashapp import create_dash_app
        DASH_ROUTE = "/dash"
        logger.info("Using Aurora Lava dashboard")
    except ImportError:
        # Fallback to old dash integration
        from .dash_integration import DASH_ROUTE, create_dash_app
        logger.info("Using legacy dash integration")

    dash_app = create_dash_app(url_base_pathname=f"{DASH_ROUTE}/")
    app.mount(DASH_ROUTE, WSGIMiddleware(dash_app.server))

    logger.info(
        f"📊 Dash Evidence Graph mounted at {DASH_ROUTE}",
        extra={"event_type": "dash_mounted", "route": DASH_ROUTE}
    )
except Exception as e:
    logger.warning(
        f"⚠️ Failed to mount Dash app: {e}",
        extra={"event_type": "dash_mount_failed", "error": str(e)}
    )


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(
        f"Global exception: {exc}",
        extra={
            "event_type": "unhandled_exception",
            "path": request.url.path,
            "method": request.method,
            "error_type": type(exc).__name__
        },
        exc_info=True
    )

    # Capture in Sentry if configured
    try:
        from .utils.sentry import capture_exception
        capture_exception(exc, request={
            "url": str(request.url),
            "method": request.method,
            "headers": dict(request.headers)
        })
    except Exception:
        pass  # Don't fail if Sentry capture fails

    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )


if __name__ == "__main__":
    uvicorn.run(
        "platform.core.app:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

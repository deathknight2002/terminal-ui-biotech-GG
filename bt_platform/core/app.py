"""
Core Platform Application

FastAPI-based biotech data platform with providers, extensions,
and real-time analytics.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
from typing import Dict, Any
import uvicorn

from .config import settings
from .database import init_db
from .routers import api_router
from .websocket import websocket_router
from .middleware.caching import CachingMiddleware


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler"""
    # Startup
    logger.info("🚀 Starting Biotech Terminal Platform")
    await init_db()
    logger.info("📊 Database initialized")
    yield
    # Shutdown
    logger.info("🔄 Shutting down Biotech Terminal Platform")


# Create FastAPI application
app = FastAPI(
    title="Biotech Terminal Platform",
    description="Open-source biotech intelligence platform with pharmaceutical data and financial modeling",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Add caching middleware for manual-refresh model
# Implements Cache-Control headers and conditional requests (ETag/Last-Modified)
app.add_middleware(CachingMiddleware, default_ttl=1800)  # 30 minutes default


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "biotech-terminal-platform",
        "version": "1.0.0"
    }


# Include routers
# Expose versioned and legacy routes for compatibility
app.include_router(api_router, prefix="/api/v1")
app.include_router(api_router, prefix="/api")
app.include_router(websocket_router)


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Global exception: {exc}")
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

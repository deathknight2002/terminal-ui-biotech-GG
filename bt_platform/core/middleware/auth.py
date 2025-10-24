"""
API Token Authentication Middleware

Protects write endpoints (POST, PUT, DELETE, PATCH) with token authentication.
GET, HEAD, OPTIONS requests remain public for read-only access.
"""

from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import logging
from typing import Set

from ..config import settings

logger = logging.getLogger(__name__)


class APITokenAuthMiddleware(BaseHTTPMiddleware):
    """
    Middleware for API token authentication.
    
    Only enforces authentication on write operations (POST, PUT, DELETE, PATCH).
    Read operations (GET, HEAD, OPTIONS) are always allowed for public data access.
    """
    
    # HTTP methods that require authentication
    PROTECTED_METHODS: Set[str] = {"POST", "PUT", "DELETE", "PATCH"}
    
    # Paths that are always public (no auth required)
    PUBLIC_PATHS: Set[str] = {
        "/health",
        "/docs",
        "/redoc",
        "/openapi.json",
        "/metrics",
    }
    
    def __init__(self, app, enabled: bool = None, api_token: str = None):
        """
        Initialize the middleware.
        
        Args:
            app: FastAPI application
            enabled: Whether authentication is enabled (defaults to settings.API_TOKEN_ENABLED)
            api_token: Expected API token (defaults to settings.API_TOKEN)
        """
        super().__init__(app)
        self.enabled = enabled if enabled is not None else settings.API_TOKEN_ENABLED
        self.api_token = api_token if api_token is not None else settings.API_TOKEN
        
        if self.enabled and not self.api_token:
            logger.warning(
                "API token authentication is enabled but no token is configured. "
                "Write operations will be blocked until API_TOKEN is set."
            )
    
    async def dispatch(self, request: Request, call_next):
        """Process the request and check authentication if needed"""
        
        # Skip if authentication is disabled
        if not self.enabled:
            return await call_next(request)
        
        # Allow public paths
        if request.url.path in self.PUBLIC_PATHS:
            return await call_next(request)
        
        # Allow read-only methods
        if request.method not in self.PROTECTED_METHODS:
            return await call_next(request)
        
        # Check for API token in headers
        auth_header = request.headers.get("Authorization")
        api_key_header = request.headers.get("X-API-Key")
        
        # Extract token from headers
        token = None
        if auth_header:
            # Support "Bearer <token>" format
            if auth_header.startswith("Bearer "):
                token = auth_header[7:]
            else:
                token = auth_header
        elif api_key_header:
            token = api_key_header
        
        # Validate token
        if not token:
            logger.warning(
                f"Authentication required for {request.method} {request.url.path} - no token provided",
                extra={
                    "method": request.method,
                    "path": request.url.path,
                    "client_ip": request.client.host if request.client else None
                }
            )
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={
                    "detail": "Authentication required. Provide API token via Authorization or X-API-Key header.",
                    "error_code": "missing_token"
                },
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        if not self.api_token:
            logger.error("No API token configured but authentication is required")
            return JSONResponse(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                content={
                    "detail": "Server configuration error. Contact administrator.",
                    "error_code": "config_error"
                }
            )
        
        if token != self.api_token:
            logger.warning(
                f"Invalid token for {request.method} {request.url.path}",
                extra={
                    "method": request.method,
                    "path": request.url.path,
                    "client_ip": request.client.host if request.client else None
                }
            )
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={
                    "detail": "Invalid API token",
                    "error_code": "invalid_token"
                }
            )
        
        # Token is valid, proceed with request
        logger.info(
            f"Authenticated {request.method} {request.url.path}",
            extra={
                "method": request.method,
                "path": request.url.path,
                "client_ip": request.client.host if request.client else None
            }
        )
        
        return await call_next(request)


# Dependency for routes that need explicit auth check
async def require_api_token(request: Request):
    """
    Dependency to require API token authentication.
    
    Usage:
        @router.post("/data", dependencies=[Depends(require_api_token)])
        async def create_data():
            ...
    """
    if not settings.API_TOKEN_ENABLED:
        return  # Auth is disabled
    
    auth_header = request.headers.get("Authorization")
    api_key_header = request.headers.get("X-API-Key")
    
    token = None
    if auth_header:
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
        else:
            token = auth_header
    elif api_key_header:
        token = api_key_header
    
    if not token or token != settings.API_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or missing API token"
        )

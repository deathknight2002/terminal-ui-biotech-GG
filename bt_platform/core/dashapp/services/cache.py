"""
Cache Service

Flask-Caching wrapper for dashboard data caching.
"""

from typing import Any, Callable, Optional

from flask_caching import Cache


class CacheService:
    """Simple cache service wrapper"""

    def __init__(self, cache_type: str = "SimpleCache", default_timeout: int = 15):
        """
        Initialize cache service.
        
        Args:
            cache_type: Cache backend type (SimpleCache, RedisCache, etc.)
            default_timeout: Default cache timeout in seconds
        """
        self.cache_config = {
            "CACHE_TYPE": cache_type,
            "CACHE_DEFAULT_TIMEOUT": default_timeout,
        }
        self.cache: Optional[Cache] = None

    def init_app(self, app):
        """
        Initialize cache with Flask/Dash app.
        
        Args:
            app: Flask or Dash server instance
        """
        # Get Flask server from Dash app if needed
        server = getattr(app, "server", app)

        # Initialize cache
        self.cache = Cache(server, config=self.cache_config)

    def get(self, key: str) -> Optional[Any]:
        """
        Get value from cache.
        
        Args:
            key: Cache key
            
        Returns:
            Cached value or None
        """
        if self.cache:
            return self.cache.get(key)
        return None

    def set(self, key: str, value: Any, timeout: Optional[int] = None):
        """
        Set value in cache.
        
        Args:
            key: Cache key
            value: Value to cache
            timeout: Optional timeout override
        """
        if self.cache:
            self.cache.set(key, value, timeout=timeout)

    def delete(self, key: str):
        """
        Delete value from cache.
        
        Args:
            key: Cache key
        """
        if self.cache:
            self.cache.delete(key)

    def clear(self):
        """Clear all cached values"""
        if self.cache:
            self.cache.clear()

    def memoize(self, timeout: Optional[int] = None) -> Callable:
        """
        Decorator for memoizing function results.
        
        Args:
            timeout: Optional timeout override
            
        Returns:
            Decorator function
        """
        if self.cache:
            return self.cache.memoize(timeout=timeout)
        else:
            # Return no-op decorator if cache not initialized
            def decorator(f):
                return f
            return decorator


# Global cache service instance
cache_service = CacheService(default_timeout=15)

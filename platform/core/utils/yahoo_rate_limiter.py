"""
Yahoo Finance Rate Limiter

Implements rate limiting for Yahoo Finance API calls to avoid
403/999 throttling errors. Yahoo's unofficial limits are:
- ~2000-2500 requests per hour per IP
- Bursts can trigger throttling even sooner

This module provides:
- Token bucket rate limiting
- Request delay enforcement
- Exponential backoff on errors
- Request caching to reduce API calls
"""

import time
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, Optional, Any
from functools import lru_cache
import hashlib

logger = logging.getLogger(__name__)


class YahooFinanceRateLimiter:
    """
    Rate limiter specifically tuned for Yahoo Finance API.
    
    Configuration based on community observations:
    - Max 2000 requests per hour (conservative)
    - Minimum 200ms delay between requests
    - Exponential backoff on 403/999 errors
    """
    
    def __init__(
        self,
        max_requests_per_hour: int = 2000,
        min_delay_seconds: float = 0.2,
        max_retries: int = 3,
        backoff_factor: float = 2.0
    ):
        self.max_requests_per_hour = max_requests_per_hour
        self.min_delay_seconds = min_delay_seconds
        self.max_retries = max_retries
        self.backoff_factor = backoff_factor
        
        # Token bucket implementation
        self.tokens = max_requests_per_hour
        self.max_tokens = max_requests_per_hour
        self.refill_rate = max_requests_per_hour / 3600.0  # tokens per second
        self.last_refill = time.time()
        
        # Request tracking
        self.request_timestamps: list[float] = []
        self.last_request_time: Optional[float] = None
        self.total_requests = 0
        self.throttle_events = 0
        
        # Cache for recent requests (10 minute TTL)
        self._cache: Dict[str, tuple[Any, float]] = {}
        self.cache_ttl = 600  # 10 minutes
        
        logger.info(
            f"🔒 Yahoo Finance Rate Limiter initialized: "
            f"{max_requests_per_hour} req/hour, "
            f"{min_delay_seconds}s min delay"
        )
    
    def _refill_tokens(self):
        """Refill token bucket based on elapsed time."""
        now = time.time()
        elapsed = now - self.last_refill
        
        # Add tokens based on refill rate
        tokens_to_add = elapsed * self.refill_rate
        self.tokens = min(self.max_tokens, self.tokens + tokens_to_add)
        self.last_refill = now
    
    def _enforce_min_delay(self):
        """Ensure minimum delay between requests."""
        if self.last_request_time is not None:
            elapsed = time.time() - self.last_request_time
            if elapsed < self.min_delay_seconds:
                delay = self.min_delay_seconds - elapsed
                logger.debug(f"⏱️ Enforcing {delay:.2f}s delay between requests")
                time.sleep(delay)
    
    def _clean_old_timestamps(self):
        """Remove timestamps older than 1 hour."""
        cutoff = time.time() - 3600
        self.request_timestamps = [
            ts for ts in self.request_timestamps if ts > cutoff
        ]
    
    def _get_cache_key(self, endpoint: str, params: Optional[Dict] = None) -> str:
        """Generate cache key for request."""
        if params:
            param_str = str(sorted(params.items()))
            return hashlib.md5(f"{endpoint}:{param_str}".encode()).hexdigest()
        return hashlib.md5(endpoint.encode()).hexdigest()
    
    def _get_from_cache(self, cache_key: str) -> Optional[Any]:
        """Retrieve from cache if not expired."""
        if cache_key in self._cache:
            data, timestamp = self._cache[cache_key]
            if time.time() - timestamp < self.cache_ttl:
                logger.debug(f"✅ Cache hit for key {cache_key[:8]}...")
                return data
            else:
                # Expired, remove from cache
                del self._cache[cache_key]
        return None
    
    def _add_to_cache(self, cache_key: str, data: Any):
        """Add data to cache with timestamp."""
        self._cache[cache_key] = (data, time.time())
        logger.debug(f"💾 Cached data for key {cache_key[:8]}...")
    
    def can_make_request(self) -> bool:
        """
        Check if a request can be made without blocking.
        
        Returns:
            True if request can be made immediately, False otherwise
        """
        self._refill_tokens()
        return self.tokens >= 1
    
    def wait_for_token(self, timeout: float = 60.0) -> bool:
        """
        Wait for a token to become available.
        
        Args:
            timeout: Maximum time to wait in seconds
            
        Returns:
            True if token acquired, False if timeout
        """
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            self._refill_tokens()
            if self.tokens >= 1:
                return True
            time.sleep(0.1)  # Poll every 100ms
        
        logger.warning(f"⚠️ Rate limit wait timeout after {timeout}s")
        return False
    
    async def wait_for_token_async(self, timeout: float = 60.0) -> bool:
        """Async version of wait_for_token."""
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            self._refill_tokens()
            if self.tokens >= 1:
                return True
            await asyncio.sleep(0.1)
        
        logger.warning(f"⚠️ Rate limit wait timeout after {timeout}s")
        return False
    
    def acquire_token(self) -> bool:
        """
        Acquire a token for making a request.
        
        Returns:
            True if token acquired, False if rate limit exceeded
        """
        self._refill_tokens()
        self._clean_old_timestamps()
        
        # Check hourly limit
        if len(self.request_timestamps) >= self.max_requests_per_hour:
            logger.warning(
                f"⚠️ Hourly rate limit reached: "
                f"{len(self.request_timestamps)}/{self.max_requests_per_hour}"
            )
            return False
        
        # Check token bucket
        if self.tokens < 1:
            logger.warning(f"⚠️ No tokens available (bucket empty)")
            return False
        
        # Acquire token
        self.tokens -= 1
        self._enforce_min_delay()
        
        # Track request
        now = time.time()
        self.request_timestamps.append(now)
        self.last_request_time = now
        self.total_requests += 1
        
        return True
    
    def record_throttle_event(self):
        """Record that a throttle event (403/999) occurred."""
        self.throttle_events += 1
        logger.warning(
            f"🚫 Throttle event #{self.throttle_events} detected. "
            f"Reducing rate by 50% temporarily."
        )
        # Aggressive backoff - reduce tokens significantly
        self.tokens = max(0, self.tokens * 0.3)
    
    def get_cached_or_fetch(
        self,
        endpoint: str,
        fetch_func: callable,
        params: Optional[Dict] = None,
        use_cache: bool = True
    ) -> Any:
        """
        Get data from cache or fetch from API with rate limiting.
        
        Args:
            endpoint: API endpoint identifier
            fetch_func: Function to call to fetch data (should accept no args)
            params: Optional parameters for cache key generation
            use_cache: Whether to use caching
            
        Returns:
            Response data
            
        Raises:
            Exception if rate limit exceeded or fetch fails
        """
        # Check cache first
        if use_cache:
            cache_key = self._get_cache_key(endpoint, params)
            cached_data = self._get_from_cache(cache_key)
            if cached_data is not None:
                return cached_data
        
        # Acquire token with retry logic
        for attempt in range(self.max_retries):
            if self.acquire_token():
                try:
                    # Fetch data
                    data = fetch_func()
                    
                    # Cache the result
                    if use_cache:
                        self._add_to_cache(cache_key, data)
                    
                    return data
                    
                except Exception as e:
                    error_msg = str(e)
                    # Check for rate limit errors
                    if "403" in error_msg or "999" in error_msg:
                        self.record_throttle_event()
                        # Exponential backoff
                        backoff_time = self.min_delay_seconds * (self.backoff_factor ** attempt)
                        logger.warning(
                            f"⏸️ Rate limited. Backing off for {backoff_time:.2f}s "
                            f"(attempt {attempt + 1}/{self.max_retries})"
                        )
                        time.sleep(backoff_time)
                        continue
                    else:
                        # Other error, don't retry
                        raise
            else:
                # No token available, wait and retry
                if self.wait_for_token(timeout=30):
                    continue
                else:
                    raise Exception(
                        f"Rate limit exceeded. Too many requests to Yahoo Finance. "
                        f"Current: {len(self.request_timestamps)}/{self.max_requests_per_hour} per hour"
                    )
        
        raise Exception(
            f"Failed to fetch data after {self.max_retries} retries due to rate limiting"
        )
    
    def get_stats(self) -> Dict[str, Any]:
        """Get rate limiter statistics."""
        self._clean_old_timestamps()
        return {
            "total_requests": self.total_requests,
            "requests_last_hour": len(self.request_timestamps),
            "max_requests_per_hour": self.max_requests_per_hour,
            "current_tokens": int(self.tokens),
            "max_tokens": self.max_tokens,
            "throttle_events": self.throttle_events,
            "cache_size": len(self._cache),
            "min_delay_seconds": self.min_delay_seconds,
            "utilization": len(self.request_timestamps) / self.max_requests_per_hour
        }
    
    def reset(self):
        """Reset rate limiter state."""
        self.tokens = self.max_tokens
        self.request_timestamps = []
        self.last_request_time = None
        self.total_requests = 0
        self.throttle_events = 0
        self._cache = {}
        logger.info("🔄 Yahoo Finance Rate Limiter reset")


# Global rate limiter instance
_yahoo_rate_limiter: Optional[YahooFinanceRateLimiter] = None


def get_yahoo_rate_limiter() -> YahooFinanceRateLimiter:
    """Get or create global Yahoo Finance rate limiter instance."""
    global _yahoo_rate_limiter
    if _yahoo_rate_limiter is None:
        _yahoo_rate_limiter = YahooFinanceRateLimiter()
    return _yahoo_rate_limiter


# Convenience decorator for rate-limited functions
def yahoo_rate_limited(use_cache: bool = True):
    """
    Decorator to automatically apply Yahoo Finance rate limiting.
    
    Usage:
        @yahoo_rate_limited(use_cache=True)
        def fetch_stock_data(ticker: str) -> dict:
            # Your Yahoo Finance API call here
            return response
    """
    def decorator(func):
        def wrapper(*args, **kwargs):
            limiter = get_yahoo_rate_limiter()
            
            # Generate cache key from function name and args
            cache_key = f"{func.__name__}:{args}:{kwargs}"
            
            def fetch():
                return func(*args, **kwargs)
            
            return limiter.get_cached_or_fetch(
                endpoint=func.__name__,
                fetch_func=fetch,
                params={"args": args, "kwargs": kwargs},
                use_cache=use_cache
            )
        return wrapper
    return decorator

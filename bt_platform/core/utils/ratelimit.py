"""
Generic Rate Limiter and Cache Utility

Per-domain rate limiting with token bucket algorithm and response caching.
"""

import time
import hashlib
from collections import defaultdict
from functools import wraps
from typing import Callable, Dict, Any, Optional


# Token buckets per domain
_BUCKETS: Dict[str, Dict[str, float]] = defaultdict(
    lambda: {"tokens": 10, "last": 0.0, "rate": 5.0}
)

# Response cache
_CACHE: Dict[str, Dict[str, Any]] = {}


def _tick(bucket: Dict[str, float], burst: int, rps: float) -> None:
    """Update token bucket based on elapsed time."""
    now = time.time()
    elapsed = now - bucket["last"]
    bucket["last"] = now
    bucket["tokens"] = min(burst, bucket["tokens"] + elapsed * rps)


def rate_limited(
    domain: str,
    rps: float = 2.0,
    burst: int = 5,
    ttl: int = 600
) -> Callable:
    """
    Decorator for rate-limited HTTP requests with caching.
    
    Args:
        domain: Domain name for rate limiting (e.g., "query1.finance.yahoo.com")
        rps: Requests per second allowed (default: 2.0)
        burst: Maximum burst size (default: 5)
        ttl: Cache time-to-live in seconds (default: 600)
    
    Example:
        @rate_limited(domain="query1.finance.yahoo.com", rps=2.0, burst=5, ttl=600)
        def fetch_stock_quote(url, **kwargs):
            return requests.get(url, **kwargs).json()
    """
    def decorator(fn: Callable) -> Callable:
        @wraps(fn)
        def wrapper(url: str, **kwargs) -> Any:
            # Generate cache key from URL and params
            key_src = url + repr(sorted(kwargs.get("params", {}).items()))
            key = hashlib.sha256(key_src.encode()).hexdigest()
            
            # Check cache first
            if key in _CACHE:
                entry = _CACHE[key]
                if entry["exp"] > time.time():
                    return entry["data"]
            
            # Get or create bucket for this domain
            bucket = _BUCKETS[domain]
            
            # Wait for available token
            _tick(bucket, burst, rps)
            while bucket["tokens"] < 1:
                time.sleep(0.2)
                _tick(bucket, burst, rps)
            
            # Consume token
            bucket["tokens"] -= 1
            
            # Make request with retry on failure
            try:
                data = fn(url, **kwargs)
                _CACHE[key] = {"data": data, "exp": time.time() + ttl}
                return data
            except Exception:
                # Retry once after delay
                time.sleep(1.0)
                return fn(url, **kwargs)
        
        return wrapper
    return decorator


def clear_cache(domain: Optional[str] = None) -> None:
    """
    Clear cache entries.
    
    Args:
        domain: If provided, only clear entries for this domain.
                If None, clear all cache entries.
    """
    if domain is None:
        _CACHE.clear()
    else:
        # Clear cache entries matching domain
        keys_to_delete = [
            key for key in _CACHE.keys()
            if domain in key
        ]
        for key in keys_to_delete:
            del _CACHE[key]


def reset_rate_limiter(domain: Optional[str] = None) -> None:
    """
    Reset rate limiter state.
    
    Args:
        domain: If provided, only reset rate limiter for this domain.
                If None, reset all rate limiters.
    """
    if domain is None:
        _BUCKETS.clear()
    else:
        if domain in _BUCKETS:
            del _BUCKETS[domain]


def get_cache_stats() -> Dict[str, Any]:
    """
    Get cache statistics.
    
    Returns:
        Dictionary with cache size and valid entries count
    """
    now = time.time()
    valid_entries = sum(1 for entry in _CACHE.values() if entry["exp"] > now)
    
    return {
        "total_entries": len(_CACHE),
        "valid_entries": valid_entries,
        "expired_entries": len(_CACHE) - valid_entries
    }


def get_rate_limiter_stats(domain: Optional[str] = None) -> Dict[str, Any]:
    """
    Get rate limiter statistics.
    
    Args:
        domain: If provided, get stats for specific domain.
                If None, get stats for all domains.
    
    Returns:
        Dictionary with rate limiter stats
    """
    if domain:
        if domain in _BUCKETS:
            bucket = _BUCKETS[domain]
            return {
                "domain": domain,
                "available_tokens": bucket["tokens"],
                "last_request": bucket["last"],
                "rate": bucket["rate"]
            }
        else:
            return {"domain": domain, "status": "not_initialized"}
    else:
        return {
            "domains": list(_BUCKETS.keys()),
            "bucket_count": len(_BUCKETS)
        }

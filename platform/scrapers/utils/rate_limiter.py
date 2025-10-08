"""
Token Bucket Rate Limiter

Per-host rate limiting with token buckets and jitter.
"""

import asyncio
import random
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Dict, Optional
from urllib.parse import urlparse


class TokenBucketRateLimiter:
    """
    Token bucket rate limiter with per-host tracking.
    
    Features:
    - Per-host rate limiting
    - Token bucket algorithm
    - Jitter to avoid thundering herd
    - Configurable capacity and refill rate
    """
    
    def __init__(
        self,
        default_rate: float = 1.0,  # requests per second
        default_capacity: int = 10,  # burst capacity
        jitter_range: tuple[float, float] = (0.9, 1.1),  # 10% jitter
    ):
        self.default_rate = default_rate
        self.default_capacity = default_capacity
        self.jitter_range = jitter_range
        
        # Per-host buckets
        self.buckets: Dict[str, Dict] = defaultdict(
            lambda: {
                "tokens": default_capacity,
                "capacity": default_capacity,
                "rate": default_rate,
                "last_refill": datetime.utcnow(),
            }
        )
        
        # Per-host locks
        self.locks: Dict[str, asyncio.Lock] = defaultdict(asyncio.Lock)
    
    def _get_host(self, url: str) -> str:
        """Extract host from URL"""
        return urlparse(url).netloc
    
    def _refill_bucket(self, host: str):
        """Refill tokens based on elapsed time"""
        bucket = self.buckets[host]
        now = datetime.utcnow()
        elapsed = (now - bucket["last_refill"]).total_seconds()
        
        # Calculate tokens to add
        tokens_to_add = elapsed * bucket["rate"]
        bucket["tokens"] = min(
            bucket["capacity"],
            bucket["tokens"] + tokens_to_add
        )
        bucket["last_refill"] = now
    
    async def acquire(
        self,
        url: str,
        tokens: int = 1,
        max_wait: Optional[float] = None,
    ) -> bool:
        """
        Acquire tokens for a request.
        
        Args:
            url: URL to rate limit
            tokens: Number of tokens to acquire
            max_wait: Maximum time to wait (seconds), None = wait forever
            
        Returns:
            True if tokens acquired, False if timeout
        """
        host = self._get_host(url)
        
        async with self.locks[host]:
            start_time = datetime.utcnow()
            
            while True:
                # Refill bucket
                self._refill_bucket(host)
                
                # Check if enough tokens
                bucket = self.buckets[host]
                if bucket["tokens"] >= tokens:
                    bucket["tokens"] -= tokens
                    
                    # Add jitter
                    jitter = random.uniform(*self.jitter_range)
                    await asyncio.sleep(jitter * (1.0 / bucket["rate"]))
                    
                    return True
                
                # Check timeout
                if max_wait is not None:
                    elapsed = (datetime.utcnow() - start_time).total_seconds()
                    if elapsed >= max_wait:
                        return False
                
                # Wait for refill
                wait_time = tokens / bucket["rate"]
                await asyncio.sleep(wait_time)
    
    def set_rate(self, host: str, rate: float, capacity: Optional[int] = None):
        """
        Set custom rate for a specific host.
        
        Args:
            host: Host to configure
            rate: Requests per second
            capacity: Bucket capacity (uses rate * 10 if None)
        """
        if capacity is None:
            capacity = int(rate * 10)
        
        self.buckets[host].update({
            "rate": rate,
            "capacity": capacity,
            "tokens": capacity,
        })
    
    def reset(self, host: Optional[str] = None):
        """
        Reset rate limiter.
        
        Args:
            host: Specific host to reset, or None for all
        """
        if host:
            if host in self.buckets:
                self.buckets[host]["tokens"] = self.buckets[host]["capacity"]
                self.buckets[host]["last_refill"] = datetime.utcnow()
        else:
            for bucket in self.buckets.values():
                bucket["tokens"] = bucket["capacity"]
                bucket["last_refill"] = datetime.utcnow()
    
    def get_stats(self, host: Optional[str] = None) -> Dict:
        """
        Get rate limiter statistics.
        
        Args:
            host: Specific host, or None for all
            
        Returns:
            Statistics dict
        """
        if host:
            bucket = self.buckets.get(host)
            if bucket:
                return {
                    "host": host,
                    "tokens": bucket["tokens"],
                    "capacity": bucket["capacity"],
                    "rate": bucket["rate"],
                    "utilization": 1.0 - (bucket["tokens"] / bucket["capacity"]),
                }
            return {}
        
        return {
            host: {
                "tokens": bucket["tokens"],
                "capacity": bucket["capacity"],
                "rate": bucket["rate"],
                "utilization": 1.0 - (bucket["tokens"] / bucket["capacity"]),
            }
            for host, bucket in self.buckets.items()
        }

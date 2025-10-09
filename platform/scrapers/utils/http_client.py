"""
Async HTTP Client with HTTP/2, connection pooling, and compression
"""

import asyncio
import hashlib
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import httpx
from pathlib import Path


class AsyncHTTPClient:
    """
    High-performance async HTTP client.
    
    Features:
    - HTTP/2 support
    - Connection pooling
    - gzip/brotli compression
    - Keep-alive
    - Conditional requests (ETag, If-Modified-Since)
    - Response caching
    """
    
    def __init__(
        self,
        user_agent: str = "BiotechTerminal/1.0",
        timeout: float = 30.0,
        max_connections: int = 100,
        max_keepalive_connections: int = 20,
    ):
        self.user_agent = user_agent
        
        # Create httpx client with HTTP/2
        self.client = httpx.AsyncClient(
            http2=True,
            timeout=httpx.Timeout(timeout),
            limits=httpx.Limits(
                max_connections=max_connections,
                max_keepalive_connections=max_keepalive_connections,
            ),
            headers={
                "User-Agent": user_agent,
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
                "Accept-Encoding": "gzip, deflate, br",
                "DNT": "1",
                "Connection": "keep-alive",
            },
            follow_redirects=True,
        )
        
        # Cache for conditional requests
        self.etag_cache: Dict[str, str] = {}
        self.last_modified_cache: Dict[str, str] = {}
        
        # Link validation cache (7 days)
        self.link_cache: Dict[str, tuple[bool, datetime]] = {}
        self.link_cache_ttl = timedelta(days=7)
    
    async def get(
        self,
        url: str,
        use_cache: bool = True,
        headers: Optional[Dict[str, str]] = None,
    ) -> Dict[str, Any]:
        """
        GET request with conditional caching.
        
        Args:
            url: URL to fetch
            use_cache: Use conditional requests if True
            headers: Additional headers
            
        Returns:
            Response dict with html, status, headers, etc.
        """
        request_headers = {}
        
        # Add conditional request headers if cached
        if use_cache:
            if url in self.etag_cache:
                request_headers["If-None-Match"] = self.etag_cache[url]
            if url in self.last_modified_cache:
                request_headers["If-Modified-Since"] = self.last_modified_cache[url]
        
        # Add custom headers
        if headers:
            request_headers.update(headers)
        
        # Make request
        response = await self.client.get(url, headers=request_headers)
        
        # Cache ETag and Last-Modified
        if "etag" in response.headers:
            self.etag_cache[url] = response.headers["etag"]
        if "last-modified" in response.headers:
            self.last_modified_cache[url] = response.headers["last-modified"]
        
        return {
            "url": url,
            "status": response.status_code,
            "headers": dict(response.headers),
            "html": response.text,
            "content": response.content,
            "encoding": response.encoding,
        }
    
    async def head(self, url: str) -> Dict[str, Any]:
        """
        HEAD request for link validation.
        
        Args:
            url: URL to check
            
        Returns:
            Response metadata
        """
        response = await self.client.head(url)
        return {
            "url": url,
            "status": response.status_code,
            "headers": dict(response.headers),
            "valid": 200 <= response.status_code < 400,
        }
    
    async def validate_link(self, url: str, use_cache: bool = True) -> bool:
        """
        Validate a link using HEAD request with caching.
        
        Args:
            url: URL to validate
            use_cache: Use cached result if available
            
        Returns:
            True if link is valid
        """
        # Check cache
        if use_cache and url in self.link_cache:
            valid, cached_at = self.link_cache[url]
            if datetime.utcnow() - cached_at < self.link_cache_ttl:
                return valid
        
        # Validate link
        try:
            result = await self.head(url)
            valid = result["valid"]
        except Exception:
            valid = False
        
        # Cache result
        self.link_cache[url] = (valid, datetime.utcnow())
        
        return valid
    
    async def batch_get(
        self,
        urls: List[str],
        batch_size: int = 10,
        delay: float = 0.1,
    ) -> List[Dict[str, Any]]:
        """
        Fetch multiple URLs in batches.
        
        Args:
            urls: List of URLs to fetch
            batch_size: Number of concurrent requests
            delay: Delay between batches (seconds)
            
        Returns:
            List of responses
        """
        results = []
        
        for i in range(0, len(urls), batch_size):
            batch = urls[i:i + batch_size]
            
            # Fetch batch concurrently
            tasks = [self.get(url) for url in batch]
            batch_results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Filter out exceptions
            for result in batch_results:
                if isinstance(result, Exception):
                    continue
                results.append(result)
            
            # Delay between batches
            if i + batch_size < len(urls):
                await asyncio.sleep(delay)
        
        return results
    
    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close()


def url_to_filename(url: str) -> str:
    """Convert URL to safe filename"""
    url_hash = hashlib.md5(url.encode()).hexdigest()[:16]
    return url_hash

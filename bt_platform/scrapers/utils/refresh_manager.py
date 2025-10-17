"""
Dual Refresh Mode Manager

Quick Mode (≤10s): Priority sources only, cached when possible
Deep Mode (≤60s): Comprehensive, all sources with full discovery
"""

import asyncio
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Set
from enum import Enum

from .priority_queue import PriorityQueue, Priority
from .discovery import RenderlessDiscovery
from .http_client import AsyncHTTPClient


class RefreshMode(Enum):
    """Refresh mode types"""
    QUICK = "quick"      # ≤10s, high-priority sources only
    DEEP = "deep"        # ≤60s, comprehensive refresh


@dataclass
class RefreshConfig:
    """Configuration for refresh modes"""
    mode: RefreshMode
    timeout: float
    max_sources: Optional[int]
    use_cache: bool
    priority_threshold: int  # Only fetch sources with priority <= threshold


# Mode configurations
QUICK_CONFIG = RefreshConfig(
    mode=RefreshMode.QUICK,
    timeout=10.0,
    max_sources=20,
    use_cache=True,
    priority_threshold=Priority.NEWS_TIER1.value,
)

DEEP_CONFIG = RefreshConfig(
    mode=RefreshMode.DEEP,
    timeout=60.0,
    max_sources=None,  # No limit
    use_cache=False,
    priority_threshold=Priority.ARCHIVE.value,  # All priorities
)


class RefreshManager:
    """
    Manager for dual refresh modes.
    
    Quick Mode:
    - Only high-priority sources (FDA, IR pages, Tier 1 news)
    - Uses conditional requests (ETag/Last-Modified)
    - Stops after timeout or max sources
    - Target: ≤10 seconds
    
    Deep Mode:
    - All sources including archives
    - Full discovery (RSS, sitemap, HTML)
    - Complete metadata extraction
    - Target: ≤60 seconds
    """
    
    def __init__(
        self,
        http_client: Optional[AsyncHTTPClient] = None,
        queue: Optional[PriorityQueue] = None,
    ):
        """
        Initialize refresh manager.
        
        Args:
            http_client: HTTP client (creates new if None)
            queue: Priority queue (creates new if None)
        """
        self.http_client = http_client or AsyncHTTPClient()
        self.queue = queue or PriorityQueue()
        self.discovery = RenderlessDiscovery(self.http_client)
        
        # Statistics
        self.stats = {
            'quick_refreshes': 0,
            'deep_refreshes': 0,
            'quick_avg_time': 0.0,
            'deep_avg_time': 0.0,
            'cached_hits': 0,
            'cache_efficiency': 0.0,
        }
    
    async def refresh(
        self,
        sources: Dict[str, str],  # source_key -> base_url
        mode: RefreshMode = RefreshMode.QUICK,
        since: Optional[datetime] = None,
    ) -> Dict[str, List[Dict]]:
        """
        Perform refresh based on mode.
        
        Args:
            sources: Dict of source_key -> base_url
            mode: Refresh mode (QUICK or DEEP)
            since: Only fetch content after this date
            
        Returns:
            Dict of source_key -> list of discovered items
        """
        config = QUICK_CONFIG if mode == RefreshMode.QUICK else DEEP_CONFIG
        
        start_time = datetime.utcnow()
        results = {}
        
        # Filter sources by priority
        filtered_sources = self._filter_sources_by_priority(
            sources,
            config.priority_threshold
        )
        
        # Limit sources for quick mode
        if config.max_sources:
            filtered_sources = dict(
                list(filtered_sources.items())[:config.max_sources]
            )
        
        # Process each source
        tasks = []
        for source_key, base_url in filtered_sources.items():
            task = self._refresh_source(
                source_key,
                base_url,
                config,
                since,
            )
            tasks.append(task)
        
        # Execute with timeout
        try:
            source_results = await asyncio.wait_for(
                asyncio.gather(*tasks, return_exceptions=True),
                timeout=config.timeout
            )
            
            # Collect results
            for i, (source_key, _) in enumerate(filtered_sources.items()):
                result = source_results[i]
                if isinstance(result, Exception):
                    results[source_key] = []
                else:
                    results[source_key] = result
        
        except asyncio.TimeoutError:
            # Partial results on timeout
            pass
        
        # Update statistics
        elapsed = (datetime.utcnow() - start_time).total_seconds()
        if mode == RefreshMode.QUICK:
            self.stats['quick_refreshes'] += 1
            self.stats['quick_avg_time'] = (
                (self.stats['quick_avg_time'] * (self.stats['quick_refreshes'] - 1) + elapsed)
                / self.stats['quick_refreshes']
            )
        else:
            self.stats['deep_refreshes'] += 1
            self.stats['deep_avg_time'] = (
                (self.stats['deep_avg_time'] * (self.stats['deep_refreshes'] - 1) + elapsed)
                / self.stats['deep_refreshes']
            )
        
        return results
    
    async def _refresh_source(
        self,
        source_key: str,
        base_url: str,
        config: RefreshConfig,
        since: Optional[datetime],
    ) -> List[Dict]:
        """
        Refresh a single source.
        
        Args:
            source_key: Source identifier
            base_url: Source base URL
            config: Refresh configuration
            since: Only fetch content after this date
            
        Returns:
            List of discovered items
        """
        # Try renderless discovery first
        items, method = await self.discovery.discover_urls(
            base_url,
            since=since,
            limit=50 if config.mode == RefreshMode.QUICK else None,
        )
        
        if items:
            # Track discovery method
            for item in items:
                item['discovery_method'] = method
                item['source_key'] = source_key
            
            return items
        
        # Fallback to fetching the base URL
        # (For sources without RSS/sitemap)
        if not config.use_cache:
            try:
                response = await self.http_client.get(
                    base_url,
                    use_cache=False,
                )
                
                if response['status'] == 200:
                    return [{
                        'url': base_url,
                        'source_key': source_key,
                        'discovery_method': 'direct',
                        'html': response['html'],
                    }]
            except Exception:
                pass
        
        return []
    
    def _filter_sources_by_priority(
        self,
        sources: Dict[str, str],
        max_priority: int,
    ) -> Dict[str, str]:
        """
        Filter sources by priority threshold.
        
        Args:
            sources: Source dict
            max_priority: Maximum priority value (inclusive)
            
        Returns:
            Filtered source dict
        """
        filtered = {}
        
        for source_key, base_url in sources.items():
            # Get priority from queue's mapping
            priority = self.queue.source_priority_map.get(
                source_key,
                Priority.NEWS_TIER2
            )
            
            if priority.value <= max_priority:
                filtered[source_key] = base_url
        
        return filtered
    
    async def quick_refresh(
        self,
        sources: Dict[str, str],
        since: Optional[datetime] = None,
    ) -> Dict[str, List[Dict]]:
        """
        Perform quick refresh (≤10s).
        
        Args:
            sources: Dict of source_key -> base_url
            since: Only fetch content after this date
            
        Returns:
            Dict of source_key -> list of items
        """
        return await self.refresh(sources, RefreshMode.QUICK, since)
    
    async def deep_refresh(
        self,
        sources: Dict[str, str],
        since: Optional[datetime] = None,
    ) -> Dict[str, List[Dict]]:
        """
        Perform deep refresh (≤60s).
        
        Args:
            sources: Dict of source_key -> base_url
            since: Only fetch content after this date
            
        Returns:
            Dict of source_key -> list of items
        """
        return await self.refresh(sources, RefreshMode.DEEP, since)
    
    def get_stats(self) -> Dict:
        """Get refresh statistics"""
        total_refreshes = (
            self.stats['quick_refreshes'] + self.stats['deep_refreshes']
        )
        
        if total_refreshes > 0:
            self.stats['cache_efficiency'] = (
                self.stats['cached_hits'] / total_refreshes * 100
            )
        
        return {
            **self.stats,
            'queue_stats': self.queue.get_stats(),
        }
    
    async def close(self):
        """Close resources"""
        await self.http_client.close()

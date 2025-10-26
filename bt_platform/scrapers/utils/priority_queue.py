"""
Priority Queue for News Acquisition

Manages fetch priorities: IR pages > FDA > news sources
With per-domain rate limiting and intelligent scheduling.
"""

import asyncio
import heapq
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Set
from enum import IntEnum
from urllib.parse import urlparse


class Priority(IntEnum):
    """
    Priority levels for content sources.
    Lower values = higher priority.
    """
    CRITICAL = 0      # FDA approvals, regulatory updates
    IR_PAGE = 1       # Company investor relations pages
    REGULATOR = 2     # FDA, EMA, MHRA news
    PRESS_RELEASE = 3 # Business Wire, PR Newswire
    NEWS_TIER1 = 4    # FierceBiotech, Endpoints
    NEWS_TIER2 = 5    # BioSpace, Science Daily
    ARCHIVE = 6       # Historical backfill


@dataclass(order=True)
class QueueItem:
    """
    Item in the priority queue.
    """
    priority: int
    scheduled_at: datetime = field(compare=True)
    url: str = field(compare=False)
    source_key: str = field(compare=False)
    domain: str = field(compare=False)
    retry_count: int = field(default=0, compare=False)
    metadata: Dict = field(default_factory=dict, compare=False)

    def __post_init__(self):
        # Extract domain from URL if not provided
        if not self.domain:
            self.domain = urlparse(self.url).netloc


class PriorityQueue:
    """
    Priority queue with per-domain rate limiting.

    Features:
    - Priority-based scheduling
    - Per-domain rate limiting
    - Automatic retry with backoff
    - Domain-level pacing
    """

    def __init__(
        self,
        default_rate_limit: float = 1.0,  # requests per second
        max_retries: int = 3,
        retry_delay: float = 5.0,
    ):
        self.queue: List[QueueItem] = []
        self.default_rate_limit = default_rate_limit
        self.max_retries = max_retries
        self.retry_delay = retry_delay

        # Per-domain tracking
        self.domain_last_fetch: Dict[str, datetime] = {}
        self.domain_rate_limits: Dict[str, float] = {}

        # Statistics
        self.stats = {
            'queued': 0,
            'fetched': 0,
            'retried': 0,
            'failed': 0,
            'cached': 0,
        }

        # Priority source mapping
        self.source_priority_map = {
            'fda': Priority.REGULATOR,
            'ema': Priority.REGULATOR,
            'mhra': Priority.REGULATOR,
            'fierce': Priority.NEWS_TIER1,
            'endpoints': Priority.NEWS_TIER1,
            'biospace': Priority.NEWS_TIER2,
            'businesswire': Priority.PRESS_RELEASE,
            'globenewswire': Priority.PRESS_RELEASE,
            'prnewswire': Priority.PRESS_RELEASE,
            'clinicaltrials': Priority.REGULATOR,
        }

    def add(
        self,
        url: str,
        source_key: str,
        priority: Optional[Priority] = None,
        metadata: Optional[Dict] = None,
    ) -> None:
        """
        Add item to queue.

        Args:
            url: URL to fetch
            source_key: Source identifier
            priority: Priority level (auto-detected if None)
            metadata: Additional metadata
        """
        # Auto-detect priority from source
        if priority is None:
            priority = self.source_priority_map.get(
                source_key,
                Priority.NEWS_TIER2
            )

        # Parse domain
        domain = urlparse(url).netloc

        # Calculate scheduled time based on domain rate limit
        scheduled_at = self._next_available_time(domain)

        item = QueueItem(
            priority=priority.value,
            scheduled_at=scheduled_at,
            url=url,
            source_key=source_key,
            domain=domain,
            metadata=metadata or {},
        )

        heapq.heappush(self.queue, item)
        self.stats['queued'] += 1

    def add_batch(
        self,
        items: List[Dict],
        source_key: str,
        priority: Optional[Priority] = None,
    ) -> None:
        """
        Add multiple items to queue.

        Args:
            items: List of dicts with 'url' and optional 'metadata'
            source_key: Source identifier
            priority: Priority level
        """
        for item in items:
            self.add(
                url=item['url'],
                source_key=source_key,
                priority=priority,
                metadata=item.get('metadata'),
            )

    def set_domain_rate_limit(self, domain: str, rate_limit: float) -> None:
        """
        Set custom rate limit for domain.

        Args:
            domain: Domain name
            rate_limit: Requests per second
        """
        self.domain_rate_limits[domain] = rate_limit

    def _next_available_time(self, domain: str) -> datetime:
        """
        Calculate next available fetch time for domain.

        Args:
            domain: Domain name

        Returns:
            Next available fetch time
        """
        now = datetime.utcnow()

        # Get domain rate limit
        rate_limit = self.domain_rate_limits.get(
            domain,
            self.default_rate_limit
        )

        # Calculate minimum delay
        delay = 1.0 / rate_limit

        # Check last fetch time
        last_fetch = self.domain_last_fetch.get(domain)
        if last_fetch:
            next_available = last_fetch + timedelta(seconds=delay)
            if next_available > now:
                return next_available

        return now

    async def get_next(self, max_wait: float = 30.0) -> Optional[QueueItem]:
        """
        Get next item from queue, waiting if necessary.

        Args:
            max_wait: Maximum seconds to wait

        Returns:
            Next queue item or None if timeout
        """
        wait_start = datetime.utcnow()

        while self.queue:
            # Peek at highest priority item
            item = self.queue[0]

            # Check if scheduled time has arrived
            now = datetime.utcnow()
            wait_time = (item.scheduled_at - now).total_seconds()

            if wait_time <= 0:
                # Ready to fetch
                heapq.heappop(self.queue)
                self.domain_last_fetch[item.domain] = now
                return item

            # Check if we've waited too long
            elapsed = (now - wait_start).total_seconds()
            if elapsed >= max_wait:
                return None

            # Wait until scheduled time or max_wait
            await asyncio.sleep(min(wait_time, max_wait - elapsed))

        return None

    def retry(self, item: QueueItem, error: Optional[str] = None) -> bool:
        """
        Retry a failed item with exponential backoff.

        Args:
            item: Failed queue item
            error: Error message

        Returns:
            True if retried, False if max retries exceeded
        """
        if item.retry_count >= self.max_retries:
            self.stats['failed'] += 1
            return False

        # Exponential backoff
        delay = self.retry_delay * (2 ** item.retry_count)

        # Create new item with updated retry count
        retry_item = QueueItem(
            priority=item.priority,
            scheduled_at=datetime.utcnow() + timedelta(seconds=delay),
            url=item.url,
            source_key=item.source_key,
            domain=item.domain,
            retry_count=item.retry_count + 1,
            metadata={**item.metadata, 'last_error': error},
        )

        heapq.heappush(self.queue, retry_item)
        self.stats['retried'] += 1

        return True

    def size(self) -> int:
        """Return current queue size"""
        return len(self.queue)

    def is_empty(self) -> bool:
        """Check if queue is empty"""
        return len(self.queue) == 0

    def get_stats(self) -> Dict:
        """Get queue statistics"""
        return {
            **self.stats,
            'queue_size': len(self.queue),
            'domains_tracked': len(self.domain_last_fetch),
        }

    def clear(self) -> None:
        """Clear the queue"""
        self.queue.clear()
        self.stats['queued'] = 0

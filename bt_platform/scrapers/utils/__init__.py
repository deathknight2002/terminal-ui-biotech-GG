"""Scraper utilities"""

from .http_client import AsyncHTTPClient
from .rate_limiter import TokenBucketRateLimiter
from .deduplication import (
    canonical_url,
    content_hash,
    content_fingerprint,
    MinHashDeduplicator,
)
from .parsing import (
    extract_json_ld,
    extract_opengraph,
    extract_microdata,
    extract_article_metadata,
    extract_text_content,
)
from .priority_queue import PriorityQueue, Priority
from .discovery import (
    FeedDiscovery,
    FeedParser,
    SitemapParser,
    RenderlessDiscovery,
)
from .refresh_manager import RefreshManager, RefreshMode
from .pdf_intelligence import PDFIntelligence, PDFDownloader, TrialData
from .csv_dropzone import CSVDropZone, PriceRecord, PriceDataValidator
from .self_healing_parser import SelfHealingParser, ParserHealth, ReadabilityExtractor

__all__ = [
    "AsyncHTTPClient",
    "TokenBucketRateLimiter",
    "canonical_url",
    "content_hash",
    "content_fingerprint",
    "MinHashDeduplicator",
    "extract_json_ld",
    "extract_opengraph",
    "extract_microdata",
    "extract_article_metadata",
    "extract_text_content",
    # Next-gen ingestion
    "PriorityQueue",
    "Priority",
    "FeedDiscovery",
    "FeedParser",
    "SitemapParser",
    "RenderlessDiscovery",
    "RefreshManager",
    "RefreshMode",
    "PDFIntelligence",
    "PDFDownloader",
    "TrialData",
    "CSVDropZone",
    "PriceRecord",
    "PriceDataValidator",
    "SelfHealingParser",
    "ParserHealth",
    "ReadabilityExtractor",
]

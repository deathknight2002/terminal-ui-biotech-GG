"""Scraper utilities"""

from .deduplication import (
    MinHashDeduplicator,
    canonical_url,
    content_fingerprint,
    content_hash,
)
from .http_client import AsyncHTTPClient
from .parsing import (
    extract_article_metadata,
    extract_json_ld,
    extract_microdata,
    extract_opengraph,
    extract_text_content,
)
from .rate_limiter import TokenBucketRateLimiter

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
]

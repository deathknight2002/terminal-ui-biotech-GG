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

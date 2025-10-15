"""Base scraper framework"""

from .interface import ContentType, ScraperInterface, ScraperResult
from .registry import ScraperConfig, ScraperRegistry

__all__ = [
    "ScraperInterface",
    "ScraperResult",
    "ContentType",
    "ScraperRegistry",
    "ScraperConfig",
]

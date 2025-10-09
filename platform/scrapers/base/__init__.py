"""Base scraper framework"""

from .interface import ScraperInterface, ScraperResult, ContentType
from .registry import ScraperRegistry, ScraperConfig

__all__ = [
    "ScraperInterface",
    "ScraperResult",
    "ContentType",
    "ScraperRegistry",
    "ScraperConfig",
]

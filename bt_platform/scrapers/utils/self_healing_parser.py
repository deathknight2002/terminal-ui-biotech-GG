"""
Self-Healing Parser with Readability Fallback

Automatically adapts to parsing failures with multiple fallback strategies.
Tracks parser health per source.
"""

from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from selectolax.parser import HTMLParser
import re


@dataclass
class ParserHealth:
    """Health metrics for a parser"""
    source_key: str
    success_count: int = 0
    failure_count: int = 0
    last_success: Optional[datetime] = None
    last_failure: Optional[datetime] = None
    failure_reasons: List[str] = field(default_factory=list)

    @property
    def success_rate(self) -> float:
        """Calculate success rate"""
        total = self.success_count + self.failure_count
        if total == 0:
            return 0.0
        return (self.success_count / total) * 100

    @property
    def is_healthy(self) -> bool:
        """Check if parser is healthy (>80% success rate)"""
        return self.success_rate >= 80.0


class ReadabilityExtractor:
    """
    Readability-style content extraction.

    Uses heuristics to extract main content from HTML.
    """

    # Common content indicators
    POSITIVE_INDICATORS = [
        'article', 'content', 'main', 'post', 'story', 'text',
        'body', 'entry', 'news', 'blog',
    ]

    NEGATIVE_INDICATORS = [
        'comment', 'footer', 'header', 'menu', 'nav', 'sidebar',
        'ad', 'advertisement', 'promo', 'sponsor', 'related',
        'share', 'social', 'widget',
    ]

    @staticmethod
    def extract_content(html: str) -> Dict[str, Any]:
        """
        Extract main content using readability algorithm.

        Args:
            html: HTML content

        Returns:
            Dict with extracted content
        """
        tree = HTMLParser(html)

        # Find potential content containers
        candidates = []

        # Look for article tags first
        for tag in tree.css('article, [role="main"], main'):
            score = ReadabilityExtractor._score_element(tag)
            candidates.append((score, tag))

        # If no article tags, check divs and sections
        if not candidates:
            for tag in tree.css('div, section'):
                score = ReadabilityExtractor._score_element(tag)
                if score > 0:
                    candidates.append((score, tag))

        # Sort by score
        candidates.sort(key=lambda x: x[0], reverse=True)

        # Extract from best candidate
        if candidates:
            best_element = candidates[0][1]

            # Extract title
            title = ''
            title_tag = best_element.css_first('h1, h2')
            if title_tag:
                title = title_tag.text().strip()
            else:
                title_tag = tree.css_first('title')
                if title_tag:
                    title = title_tag.text().strip()

            # Extract text content
            content = ReadabilityExtractor._extract_text(best_element)

            return {
                'title': title,
                'content': content,
                'method': 'readability',
            }

        # Fallback: extract from body
        body = tree.body
        if body:
            return {
                'title': tree.css_first('title').text() if tree.css_first('title') else '',
                'content': ReadabilityExtractor._extract_text(body),
                'method': 'body_fallback',
            }

        return {
            'title': '',
            'content': '',
            'method': 'failed',
        }

    @staticmethod
    def _score_element(element) -> float:
        """
        Score an element as potential content container.

        Args:
            element: HTML element

        Returns:
            Score (higher = more likely to be content)
        """
        score = 0.0

        # Check class and id
        class_name = element.attributes.get('class', '').lower()
        id_name = element.attributes.get('id', '').lower()
        combined = f'{class_name} {id_name}'

        # Positive indicators
        for indicator in ReadabilityExtractor.POSITIVE_INDICATORS:
            if indicator in combined:
                score += 25.0

        # Negative indicators
        for indicator in ReadabilityExtractor.NEGATIVE_INDICATORS:
            if indicator in combined:
                score -= 25.0

        # Text density
        text = element.text()
        if text:
            # More text = higher score
            score += min(len(text) / 100, 50.0)

            # Paragraph count
            paragraphs = element.css('p')
            score += len(paragraphs) * 5.0

        return max(score, 0.0)

    @staticmethod
    def _extract_text(element) -> str:
        """
        Extract clean text from element.

        Args:
            element: HTML element

        Returns:
            Clean text
        """
        # Remove unwanted elements
        for tag in element.css('script, style, nav, header, footer'):
            tag.decompose()

        # Get text
        text = element.text()

        # Clean whitespace
        text = ' '.join(text.split())

        return text


class SelfHealingParser:
    """
    Self-healing parser with multiple fallback strategies.

    Strategies (in order):
    1. Structured data (JSON-LD, OpenGraph)
    2. CSS selectors (custom per source)
    3. Readability extraction
    4. Full-text fallback
    """

    def __init__(self):
        """Initialize parser"""
        self.health_dashboard: Dict[str, ParserHealth] = {}
        self.custom_selectors: Dict[str, Dict[str, str]] = {}
        self.readability = ReadabilityExtractor()

    def register_selectors(
        self,
        source_key: str,
        selectors: Dict[str, str],
    ) -> None:
        """
        Register custom CSS selectors for a source.

        Args:
            source_key: Source identifier
            selectors: Dict of field_name -> CSS selector
        """
        self.custom_selectors[source_key] = selectors

    async def parse(
        self,
        html: str,
        source_key: str,
        url: str = '',
    ) -> Optional[Dict[str, Any]]:
        """
        Parse HTML with self-healing fallbacks.

        Args:
            html: HTML content
            source_key: Source identifier
            url: Source URL

        Returns:
            Parsed data dict or None if all strategies failed
        """
        # Initialize health if needed
        if source_key not in self.health_dashboard:
            self.health_dashboard[source_key] = ParserHealth(source_key=source_key)

        health = self.health_dashboard[source_key]

        # Strategy 1: Structured data
        try:
            result = self._parse_structured_data(html)
            if result:
                health.success_count += 1
                health.last_success = datetime.utcnow()
                return {**result, 'parse_method': 'structured_data'}
        except Exception as e:
            health.failure_reasons.append(f'structured_data: {str(e)}')

        # Strategy 2: Custom selectors
        if source_key in self.custom_selectors:
            try:
                result = self._parse_with_selectors(
                    html,
                    self.custom_selectors[source_key]
                )
                if result:
                    health.success_count += 1
                    health.last_success = datetime.utcnow()
                    return {**result, 'parse_method': 'custom_selectors'}
            except Exception as e:
                health.failure_reasons.append(f'custom_selectors: {str(e)}')

        # Strategy 3: Readability extraction
        try:
            result = self.readability.extract_content(html)
            if result and result['content']:
                health.success_count += 1
                health.last_success = datetime.utcnow()
                return {**result, 'parse_method': 'readability'}
        except Exception as e:
            health.failure_reasons.append(f'readability: {str(e)}')

        # Strategy 4: Full-text fallback
        try:
            result = self._parse_full_text(html)
            if result:
                health.success_count += 1
                health.last_success = datetime.utcnow()
                return {**result, 'parse_method': 'full_text_fallback'}
        except Exception as e:
            health.failure_reasons.append(f'full_text: {str(e)}')

        # All strategies failed
        health.failure_count += 1
        health.last_failure = datetime.utcnow()

        return None

    def _parse_structured_data(self, html: str) -> Optional[Dict[str, Any]]:
        """
        Parse structured data (JSON-LD, OpenGraph).

        Args:
            html: HTML content

        Returns:
            Parsed data or None
        """
        from .parsing import extract_article_metadata

        metadata = extract_article_metadata(html)

        # Check if we got useful data
        if metadata.get('title') and metadata.get('description'):
            return metadata

        return None

    def _parse_with_selectors(
        self,
        html: str,
        selectors: Dict[str, str],
    ) -> Optional[Dict[str, Any]]:
        """
        Parse using custom CSS selectors.

        Args:
            html: HTML content
            selectors: Dict of field_name -> CSS selector

        Returns:
            Parsed data or None
        """
        tree = HTMLParser(html)
        result = {}

        for field_name, selector in selectors.items():
            element = tree.css_first(selector)
            if element:
                result[field_name] = element.text().strip()

        # Check if we got useful data
        if result.get('title') or result.get('content'):
            return result

        return None

    def _parse_full_text(self, html: str) -> Optional[Dict[str, Any]]:
        """
        Parse full text as fallback.

        Args:
            html: HTML content

        Returns:
            Parsed data or None
        """
        tree = HTMLParser(html)

        # Get title
        title = ''
        title_tag = tree.css_first('title')
        if title_tag:
            title = title_tag.text().strip()

        # Get body text
        body = tree.body
        if not body:
            return None

        # Remove unwanted elements
        for tag in body.css('script, style, nav, header, footer'):
            tag.decompose()

        text = body.text()
        text = ' '.join(text.split())

        if text:
            return {
                'title': title,
                'content': text[:1000],  # Limit to 1000 chars
            }

        return None

    def get_health_dashboard(self) -> Dict[str, Dict[str, Any]]:
        """
        Get health dashboard for all sources.

        Returns:
            Dict of source_key -> health metrics
        """
        dashboard = {}

        for source_key, health in self.health_dashboard.items():
            dashboard[source_key] = {
                'success_count': health.success_count,
                'failure_count': health.failure_count,
                'success_rate': health.success_rate,
                'is_healthy': health.is_healthy,
                'last_success': health.last_success.isoformat() if health.last_success else None,
                'last_failure': health.last_failure.isoformat() if health.last_failure else None,
                'recent_failures': health.failure_reasons[-5:],  # Last 5 failures
            }

        return dashboard

    def get_unhealthy_sources(self) -> List[str]:
        """
        Get list of unhealthy sources.

        Returns:
            List of source keys with <80% success rate
        """
        return [
            source_key
            for source_key, health in self.health_dashboard.items()
            if not health.is_healthy
        ]

"""
RSS/Atom and Sitemap Auto-Discovery

Renderless-first strategy: RSS/Atom → sitemap → HTML → headless (only when necessary)
"""

import asyncio
from typing import Dict, List, Optional, Set, Tuple
from datetime import datetime
from urllib.parse import urljoin, urlparse
import feedparser
from selectolax.parser import HTMLParser
import xml.etree.ElementTree as ET
from dateutil import parser as date_parser


class FeedDiscovery:
    """
    Auto-discover RSS/Atom feeds from a website.
    
    Strategies:
    1. Check common feed locations (/feed, /rss, /atom.xml)
    2. Parse HTML for feed link tags
    3. Check robots.txt for sitemap
    """
    
    COMMON_FEED_PATHS = [
        '/feed/',
        '/feed',
        '/rss/',
        '/rss',
        '/rss.xml',
        '/atom.xml',
        '/index.rss',
        '/index.atom',
        '/feeds/posts/default',  # Blogger
    ]
    
    COMMON_SITEMAP_PATHS = [
        '/sitemap.xml',
        '/sitemap_index.xml',
        '/sitemap',
        '/sitemap.txt',
        '/news-sitemap.xml',
    ]
    
    def __init__(self, http_client):
        """
        Initialize feed discovery.
        
        Args:
            http_client: AsyncHTTPClient instance
        """
        self.http_client = http_client
        self._feed_cache: Dict[str, List[str]] = {}
        self._sitemap_cache: Dict[str, List[str]] = {}
    
    async def discover_feeds(
        self,
        base_url: str,
        check_html: bool = True,
    ) -> List[str]:
        """
        Discover RSS/Atom feeds for a site.
        
        Args:
            base_url: Base URL of the site
            check_html: Also parse HTML for feed links
            
        Returns:
            List of discovered feed URLs
        """
        # Check cache
        if base_url in self._feed_cache:
            return self._feed_cache[base_url]
        
        feeds = []
        
        # Try common feed locations
        for path in self.COMMON_FEED_PATHS:
            feed_url = urljoin(base_url, path)
            try:
                response = await self.http_client.get(feed_url)
                if response['status'] == 200:
                    # Verify it's a valid feed
                    if self._is_valid_feed(response['html']):
                        feeds.append(feed_url)
            except Exception:
                continue
        
        # Parse HTML for feed links
        if check_html and not feeds:
            try:
                response = await self.http_client.get(base_url)
                if response['status'] == 200:
                    html_feeds = self._extract_feed_links(
                        response['html'],
                        base_url
                    )
                    feeds.extend(html_feeds)
            except Exception:
                pass
        
        # Cache results
        self._feed_cache[base_url] = feeds
        
        return feeds
    
    def _extract_feed_links(self, html: str, base_url: str) -> List[str]:
        """
        Extract feed links from HTML.
        
        Args:
            html: HTML content
            base_url: Base URL for resolving relative links
            
        Returns:
            List of feed URLs
        """
        tree = HTMLParser(html)
        feeds = []
        
        # Look for feed link tags
        for link in tree.css('link[type*="rss"], link[type*="atom"], link[rel="alternate"][type*="xml"]'):
            href = link.attributes.get('href', '')
            if href:
                feed_url = urljoin(base_url, href)
                feeds.append(feed_url)
        
        return feeds
    
    def _is_valid_feed(self, content: str) -> bool:
        """
        Check if content is a valid RSS/Atom feed.
        
        Args:
            content: Content to check
            
        Returns:
            True if valid feed
        """
        try:
            feed = feedparser.parse(content)
            return bool(feed.entries)
        except Exception:
            return False
    
    async def discover_sitemaps(self, base_url: str) -> List[str]:
        """
        Discover XML sitemaps for a site.
        
        Args:
            base_url: Base URL of the site
            
        Returns:
            List of sitemap URLs
        """
        # Check cache
        if base_url in self._sitemap_cache:
            return self._sitemap_cache[base_url]
        
        sitemaps = []
        
        # Check robots.txt first
        robots_url = urljoin(base_url, '/robots.txt')
        try:
            response = await self.http_client.get(robots_url)
            if response['status'] == 200:
                robots_sitemaps = self._extract_sitemaps_from_robots(
                    response['html'],
                    base_url
                )
                sitemaps.extend(robots_sitemaps)
        except Exception:
            pass
        
        # Try common sitemap locations if not found
        if not sitemaps:
            for path in self.COMMON_SITEMAP_PATHS:
                sitemap_url = urljoin(base_url, path)
                try:
                    response = await self.http_client.get(sitemap_url)
                    if response['status'] == 200:
                        sitemaps.append(sitemap_url)
                        break  # Found one, stop looking
                except Exception:
                    continue
        
        # Cache results
        self._sitemap_cache[base_url] = sitemaps
        
        return sitemaps
    
    def _extract_sitemaps_from_robots(
        self,
        robots_txt: str,
        base_url: str
    ) -> List[str]:
        """
        Extract sitemap URLs from robots.txt.
        
        Args:
            robots_txt: robots.txt content
            base_url: Base URL for resolving relative links
            
        Returns:
            List of sitemap URLs
        """
        sitemaps = []
        
        for line in robots_txt.split('\n'):
            line = line.strip()
            if line.lower().startswith('sitemap:'):
                sitemap_url = line.split(':', 1)[1].strip()
                sitemap_url = urljoin(base_url, sitemap_url)
                sitemaps.append(sitemap_url)
        
        return sitemaps


class FeedParser:
    """
    Parse RSS/Atom feeds to extract articles.
    """
    
    @staticmethod
    async def parse_feed(
        feed_content: str,
        source_key: str = '',
        since: Optional[datetime] = None,
        limit: Optional[int] = None,
    ) -> List[Dict]:
        """
        Parse RSS/Atom feed.
        
        Args:
            feed_content: Feed XML content
            source_key: Source identifier
            since: Only return entries after this date
            limit: Maximum number of entries
            
        Returns:
            List of parsed entries
        """
        feed = feedparser.parse(feed_content)
        
        entries = []
        for entry in feed.entries:
            # Extract publication date
            published = None
            for date_field in ('published', 'updated', 'created'):
                if hasattr(entry, date_field):
                    try:
                        published = date_parser.parse(
                            getattr(entry, date_field)
                        )
                        break
                    except Exception:
                        continue
            
            # Filter by date if specified
            if since and published and published < since:
                continue
            
            # Extract data
            item = {
                'url': entry.get('link', ''),
                'title': entry.get('title', ''),
                'description': entry.get('summary', ''),
                'published': published,
                'author': entry.get('author', ''),
                'source_key': source_key,
                'categories': [tag.term for tag in entry.get('tags', [])],
            }
            
            entries.append(item)
            
            # Check limit
            if limit and len(entries) >= limit:
                break
        
        return entries


class SitemapParser:
    """
    Parse XML sitemaps to extract URLs.
    """
    
    @staticmethod
    async def parse_sitemap(
        sitemap_content: str,
        http_client,
        since: Optional[datetime] = None,
        limit: Optional[int] = None,
    ) -> List[Dict]:
        """
        Parse XML sitemap.
        
        Args:
            sitemap_content: Sitemap XML content
            http_client: HTTP client for nested sitemaps
            since: Only return URLs modified after this date
            limit: Maximum number of URLs
            
        Returns:
            List of URLs with metadata
        """
        try:
            root = ET.fromstring(sitemap_content)
        except ET.ParseError:
            return []
        
        # Detect namespace
        namespace = ''
        if root.tag.startswith('{'):
            namespace = root.tag.split('}')[0] + '}'
        
        urls = []
        
        # Check if it's a sitemap index
        sitemap_tags = root.findall(f'.//{namespace}sitemap')
        if sitemap_tags:
            # It's a sitemap index, fetch child sitemaps
            for sitemap_tag in sitemap_tags:
                loc_tag = sitemap_tag.find(f'{namespace}loc')
                if loc_tag is not None and loc_tag.text:
                    # Recursively fetch child sitemap
                    try:
                        response = await http_client.get(loc_tag.text)
                        if response['status'] == 200:
                            child_urls = await SitemapParser.parse_sitemap(
                                response['html'],
                                http_client,
                                since,
                                limit - len(urls) if limit else None,
                            )
                            urls.extend(child_urls)
                            
                            if limit and len(urls) >= limit:
                                break
                    except Exception:
                        continue
        else:
            # It's a regular sitemap, extract URLs
            url_tags = root.findall(f'.//{namespace}url')
            
            for url_tag in url_tags:
                loc_tag = url_tag.find(f'{namespace}loc')
                if loc_tag is None or not loc_tag.text:
                    continue
                
                # Extract lastmod if present
                lastmod = None
                lastmod_tag = url_tag.find(f'{namespace}lastmod')
                if lastmod_tag is not None and lastmod_tag.text:
                    try:
                        lastmod = date_parser.parse(lastmod_tag.text)
                    except Exception:
                        pass
                
                # Filter by date if specified
                if since and lastmod and lastmod < since:
                    continue
                
                # Extract priority
                priority = 0.5
                priority_tag = url_tag.find(f'{namespace}priority')
                if priority_tag is not None and priority_tag.text:
                    try:
                        priority = float(priority_tag.text)
                    except Exception:
                        pass
                
                item = {
                    'url': loc_tag.text,
                    'lastmod': lastmod,
                    'priority': priority,
                }
                
                urls.append(item)
                
                # Check limit
                if limit and len(urls) >= limit:
                    break
        
        return urls


class RenderlessDiscovery:
    """
    Renderless-first URL discovery.
    
    Priority: RSS/Atom → Sitemap → HTML links → Headless (only when necessary)
    """
    
    def __init__(self, http_client):
        """
        Initialize renderless discovery.
        
        Args:
            http_client: AsyncHTTPClient instance
        """
        self.http_client = http_client
        self.feed_discovery = FeedDiscovery(http_client)
        self.feed_parser = FeedParser()
        self.sitemap_parser = SitemapParser()
    
    async def discover_urls(
        self,
        base_url: str,
        since: Optional[datetime] = None,
        limit: Optional[int] = None,
    ) -> Tuple[List[Dict], str]:
        """
        Discover URLs using renderless-first strategy.
        
        Args:
            base_url: Base URL to discover from
            since: Only discover content after this date
            limit: Maximum number of URLs
            
        Returns:
            Tuple of (URLs list, discovery method used)
        """
        # Try RSS/Atom first (most efficient)
        feeds = await self.feed_discovery.discover_feeds(base_url)
        if feeds:
            try:
                response = await self.http_client.get(feeds[0])
                if response['status'] == 200:
                    entries = await self.feed_parser.parse_feed(
                        response['html'],
                        since=since,
                        limit=limit,
                    )
                    if entries:
                        return entries, 'rss'
            except Exception:
                pass
        
        # Try sitemap (second most efficient)
        sitemaps = await self.feed_discovery.discover_sitemaps(base_url)
        if sitemaps:
            try:
                response = await self.http_client.get(sitemaps[0])
                if response['status'] == 200:
                    urls = await self.sitemap_parser.parse_sitemap(
                        response['html'],
                        self.http_client,
                        since=since,
                        limit=limit,
                    )
                    if urls:
                        return urls, 'sitemap'
            except Exception:
                pass
        
        # Fallback to HTML scraping
        # (Headless rendering should be implemented separately if needed)
        return [], 'none'

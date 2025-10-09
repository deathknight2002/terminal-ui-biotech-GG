"""
HTML Parsing Utilities

Fast HTML parsing with selectolax and structured data extraction.
"""

from typing import Dict, List, Optional, Any
from selectolax.parser import HTMLParser
from datetime import datetime
from dateutil import parser as date_parser
import json


def extract_json_ld(html: str) -> List[Dict[str, Any]]:
    """
    Extract JSON-LD structured data from HTML.
    
    Args:
        html: HTML content
        
    Returns:
        List of JSON-LD objects
    """
    tree = HTMLParser(html)
    scripts = tree.css('script[type="application/ld+json"]')
    
    results = []
    for script in scripts:
        try:
            data = json.loads(script.text())
            results.append(data)
        except (json.JSONDecodeError, AttributeError):
            continue
    
    return results


def extract_opengraph(html: str) -> Dict[str, str]:
    """
    Extract OpenGraph metadata from HTML.
    
    Args:
        html: HTML content
        
    Returns:
        Dict of OpenGraph properties
    """
    tree = HTMLParser(html)
    og_tags = tree.css('meta[property^="og:"]')
    
    og_data = {}
    for tag in og_tags:
        property_name = tag.attributes.get('property', '').replace('og:', '')
        content = tag.attributes.get('content', '')
        if property_name and content:
            og_data[property_name] = content
    
    return og_data


def extract_microdata(html: str) -> List[Dict[str, Any]]:
    """
    Extract Microdata structured data from HTML.
    
    Args:
        html: HTML content
        
    Returns:
        List of Microdata items
    """
    tree = HTMLParser(html)
    items = tree.css('[itemscope]')
    
    results = []
    for item in items:
        item_type = item.attributes.get('itemtype', '')
        
        data = {'@type': item_type.split('/')[-1]}
        
        # Extract properties
        props = item.css('[itemprop]')
        for prop in props:
            prop_name = prop.attributes.get('itemprop', '')
            
            # Get content
            if prop.tag == 'meta':
                content = prop.attributes.get('content', '')
            elif prop.tag in ('time', 'data'):
                content = prop.attributes.get('datetime', prop.text())
            else:
                content = prop.text()
            
            if prop_name and content:
                data[prop_name] = content
        
        if len(data) > 1:  # More than just @type
            results.append(data)
    
    return results


def extract_article_metadata(html: str) -> Dict[str, Any]:
    """
    Extract article metadata from HTML using multiple strategies.
    
    Priority: JSON-LD > OpenGraph > Microdata > HTML meta tags
    
    Args:
        html: HTML content
        
    Returns:
        Extracted metadata dict
    """
    metadata = {}
    
    # Try JSON-LD first
    json_ld_items = extract_json_ld(html)
    for item in json_ld_items:
        if item.get('@type') in ('Article', 'NewsArticle', 'BlogPosting'):
            metadata = {
                'title': item.get('headline', ''),
                'description': item.get('description', ''),
                'author': item.get('author', {}).get('name', ''),
                'published': item.get('datePublished', ''),
                'modified': item.get('dateModified', ''),
                'image': item.get('image', {}).get('url', '') if isinstance(item.get('image'), dict) else item.get('image', ''),
            }
            break
    
    # Fallback to OpenGraph
    if not metadata:
        og_data = extract_opengraph(html)
        if og_data:
            metadata = {
                'title': og_data.get('title', ''),
                'description': og_data.get('description', ''),
                'image': og_data.get('image', ''),
                'published': og_data.get('article:published_time', ''),
                'modified': og_data.get('article:modified_time', ''),
                'author': og_data.get('article:author', ''),
            }
    
    # Fallback to Microdata
    if not metadata:
        microdata_items = extract_microdata(html)
        for item in microdata_items:
            if item.get('@type') in ('Article', 'NewsArticle'):
                metadata = {
                    'title': item.get('headline', item.get('name', '')),
                    'description': item.get('description', ''),
                    'author': item.get('author', ''),
                    'published': item.get('datePublished', ''),
                    'image': item.get('image', ''),
                }
                break
    
    # Fallback to standard meta tags
    if not metadata:
        tree = HTMLParser(html)
        
        # Title
        title_tag = tree.css_first('title')
        title = title_tag.text() if title_tag else ''
        
        # Description
        desc_tag = tree.css_first('meta[name="description"]')
        description = desc_tag.attributes.get('content', '') if desc_tag else ''
        
        # Author
        author_tag = tree.css_first('meta[name="author"]')
        author = author_tag.attributes.get('content', '') if author_tag else ''
        
        metadata = {
            'title': title,
            'description': description,
            'author': author,
            'published': '',
            'image': '',
        }
    
    # Parse dates
    if metadata.get('published'):
        try:
            metadata['published'] = date_parser.parse(metadata['published'])
        except Exception:
            metadata['published'] = None
    
    if metadata.get('modified'):
        try:
            metadata['modified'] = date_parser.parse(metadata['modified'])
        except Exception:
            metadata['modified'] = None
    
    return metadata


def extract_text_content(html: str, selector: Optional[str] = None) -> str:
    """
    Extract clean text content from HTML.
    
    Args:
        html: HTML content
        selector: CSS selector for content area (optional)
        
    Returns:
        Clean text content
    """
    tree = HTMLParser(html)
    
    # Remove unwanted elements
    for tag in tree.css('script, style, nav, header, footer, aside, [role="complementary"]'):
        tag.decompose()
    
    # Extract from specific selector or body
    if selector:
        content = tree.css_first(selector)
        if content:
            text = content.text()
        else:
            text = tree.body.text() if tree.body else tree.text()
    else:
        text = tree.body.text() if tree.body else tree.text()
    
    # Clean whitespace
    text = ' '.join(text.split())
    
    return text


def compile_selector(selector: str):
    """
    Pre-compile CSS selector for faster repeated use.
    
    Args:
        selector: CSS selector string
        
    Returns:
        Compiled selector (same format, selectolax doesn't pre-compile)
    """
    # selectolax doesn't support pre-compilation like lxml
    # Return the selector as-is for interface compatibility
    return selector

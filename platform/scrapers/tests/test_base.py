"""
Tests for scraper base framework
"""

import pytest
from datetime import datetime, timedelta
from platform.scrapers.base.interface import ScraperInterface, ScraperResult, ContentType
from platform.scrapers.base.registry import ScraperRegistry


def test_scraper_registry_loads():
    """Test that registry loads successfully"""
    registry = ScraperRegistry()
    assert registry is not None
    sources = registry.list_sources()
    assert len(sources) > 0
    assert 'fierce_biotech' in sources


def test_scraper_registry_get_scraper():
    """Test getting a scraper config"""
    registry = ScraperRegistry()
    config = registry.get_scraper('fierce_biotech')
    assert config is not None
    assert config.source_key == 'fierce_biotech'
    assert config.base_url == 'https://www.fiercebiotech.com'


def test_scraper_registry_get_by_category():
    """Test getting scrapers by category"""
    registry = ScraperRegistry()
    news_scrapers = registry.get_by_category('news_press')
    assert len(news_scrapers) > 0
    assert any(s.source_key == 'fierce_biotech' for s in news_scrapers)


def test_scraper_result_creation():
    """Test creating a ScraperResult"""
    result = ScraperResult(
        content_type=ContentType.ARTICLE,
        data={
            'title': 'Test Article',
            'url': 'https://example.com/article',
            'summary': 'Test summary',
            'source': 'test',
        },
        url='https://example.com/article',
        hash='testhash123',
        fingerprint='testfingerprint',
    )
    
    assert result.content_type == ContentType.ARTICLE
    assert result.data['title'] == 'Test Article'
    assert result.url == 'https://example.com/article'
    assert result.confidence == 1.0
    assert result.link_valid is True


def test_scraper_result_timestamps():
    """Test that timestamps are set correctly"""
    result = ScraperResult(
        content_type=ContentType.ARTICLE,
        data={'title': 'Test'},
        url='https://example.com',
    )
    
    assert result.scraped_at is not None
    assert isinstance(result.scraped_at, datetime)
    assert result.scraped_at <= datetime.utcnow()


def test_scraper_result_with_published_date():
    """Test result with published date"""
    pub_date = datetime.utcnow() - timedelta(days=1)
    result = ScraperResult(
        content_type=ContentType.ARTICLE,
        data={'title': 'Test'},
        url='https://example.com',
        published_at=pub_date,
    )
    
    assert result.published_at == pub_date
    assert result.published_at < result.scraped_at

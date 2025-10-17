"""
Tests for Pipeline Scraper

Basic tests for pipeline scraping functionality.
"""

import pytest
from datetime import datetime
from unittest.mock import Mock, patch, AsyncMock

from bt_platform.scrapers.sites.pipeline_scraper import (
    PipelineScraperBase,
    BiogenPipelineScraper,
    get_pipeline_scraper,
    AVAILABLE_SCRAPERS
)
from bt_platform.scrapers.pipeline_manager import PipelineScraperManager


class TestPipelineScraperBase:
    """Test base pipeline scraper functionality."""
    
    def test_normalize_phase(self):
        """Test phase normalization."""
        scraper = BiogenPipelineScraper()
        
        assert scraper._normalize_phase("Phase 1") == "Phase I"
        assert scraper._normalize_phase("phase i") == "Phase I"
        assert scraper._normalize_phase("Phase 2") == "Phase II"
        assert scraper._normalize_phase("Phase 3") == "Phase III"
        assert scraper._normalize_phase("Preclinical") == "Preclinical"
        assert scraper._normalize_phase("pre-clinical") == "Preclinical"
        assert scraper._normalize_phase("Filed") == "Filed"
        assert scraper._normalize_phase("NDA") == "Filed"
        assert scraper._normalize_phase("Approved") == "Approved"
        assert scraper._normalize_phase("Unknown Phase") == "Unknown Phase"
    
    @pytest.mark.asyncio
    async def test_discover_returns_pipeline_url(self):
        """Test that discover returns the pipeline URL."""
        scraper = BiogenPipelineScraper()
        urls = await scraper.discover()
        
        assert len(urls) == 1
        assert urls[0] == scraper.pipeline_url
    
    @pytest.mark.asyncio
    async def test_normalize_creates_hash(self):
        """Test that normalize creates data hash."""
        scraper = BiogenPipelineScraper()
        
        parsed_data = [
            {
                'asset_name': 'Test Drug',
                'phase': 'Phase 2',
                'indication': 'Cancer',
            }
        ]
        
        normalized = await scraper.normalize(parsed_data)
        
        assert len(normalized) == 1
        assert normalized[0]['data_hash'] is not None
        assert len(normalized[0]['data_hash']) == 64  # SHA256 hex length
        assert normalized[0]['phase'] == 'Phase II'  # Normalized


class TestPipelineScraperFactory:
    """Test pipeline scraper factory function."""
    
    def test_get_biogen_scraper(self):
        """Test getting Biogen scraper."""
        scraper = get_pipeline_scraper('Biogen')
        assert scraper is not None
        assert isinstance(scraper, BiogenPipelineScraper)
        assert scraper.company_name == 'Biogen'
    
    def test_get_amgen_scraper(self):
        """Test getting Amgen scraper."""
        scraper = get_pipeline_scraper('Amgen')
        assert scraper is not None
        assert scraper.company_name == 'Amgen'
    
    def test_get_gilead_scraper(self):
        """Test getting Gilead scraper."""
        scraper = get_pipeline_scraper('Gilead')
        assert scraper is not None
        assert scraper.company_name == 'Gilead Sciences'
    
    def test_get_unknown_scraper(self):
        """Test getting unknown scraper returns None."""
        scraper = get_pipeline_scraper('UnknownCompany')
        assert scraper is None
    
    def test_available_scrapers_list(self):
        """Test that available scrapers list is populated."""
        assert len(AVAILABLE_SCRAPERS) > 0
        assert 'Biogen' in AVAILABLE_SCRAPERS
        assert 'Amgen' in AVAILABLE_SCRAPERS


class TestPipelineScraperManager:
    """Test pipeline scraper manager."""
    
    def test_manager_initialization(self):
        """Test manager initializes scrapers."""
        manager = PipelineScraperManager()
        
        assert len(manager.scrapers) > 0
        assert 'biogen' in manager.scrapers
        assert 'amgen' in manager.scrapers
    
    def test_get_available_companies(self):
        """Test getting available companies."""
        manager = PipelineScraperManager()
        companies = manager.get_available_companies()
        
        assert len(companies) > 0
        assert isinstance(companies, list)
    
    @pytest.mark.asyncio
    async def test_scrape_company_unknown(self):
        """Test scraping unknown company returns error."""
        manager = PipelineScraperManager()
        
        # Mock database session
        mock_db = Mock()
        
        result = await manager.scrape_company('UnknownCompany', mock_db)
        
        assert result['status'] == 'error'
        assert 'No scraper available' in result['error']


class TestPipelineDataModel:
    """Test pipeline data structures."""
    
    def test_asset_data_structure(self):
        """Test expected asset data structure."""
        asset = {
            'asset_name': 'Test Drug',
            'company_name': 'Test Company',
            'phase': 'Phase II',
            'indication': 'Cancer',
            'therapeutic_area': 'Oncology',
            'mechanism_of_action': 'EGFR Inhibitor',
            'modality': 'Small Molecule',
            'development_status': 'Active',
            'source_url': 'https://example.com',
            'logo_url': 'https://example.com/logo.png',
            'data_hash': 'abc123',
            'metadata': {}
        }
        
        # Verify all expected fields are present
        required_fields = [
            'asset_name', 'company_name', 'phase', 'indication',
            'therapeutic_area', 'mechanism_of_action', 'modality',
            'development_status', 'source_url', 'logo_url',
            'data_hash', 'metadata'
        ]
        
        for field in required_fields:
            assert field in asset


@pytest.mark.integration
class TestPipelineIntegration:
    """Integration tests for pipeline scraper (requires network)."""
    
    @pytest.mark.skip(reason="Integration test - requires network and real URLs")
    @pytest.mark.asyncio
    async def test_scrape_biogen_pipeline(self):
        """Test actual scraping of Biogen pipeline."""
        scraper = BiogenPipelineScraper()
        
        # This would actually hit the website
        urls = await scraper.discover()
        html = await scraper.fetch(urls[0])
        
        assert html is not None
        assert len(html) > 0
        
        await scraper.close()

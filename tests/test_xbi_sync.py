"""
Tests for YFinance Provider and XBI Sync Service
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime

from bt_platform.providers.yfinance_provider import YFinanceProvider, get_yfinance_provider
from bt_platform.core.services.xbi_sync_service import XBISyncService
from bt_platform.core.database import Company, SessionLocal


class TestYFinanceProvider:
    """Test YFinance Provider"""
    
    def test_singleton_instance(self):
        """Test that provider returns singleton instance"""
        provider1 = get_yfinance_provider()
        provider2 = get_yfinance_provider()
        assert provider1 is provider2
    
    def test_cache_key_generation(self):
        """Test cache key generation"""
        provider = YFinanceProvider()
        key = provider._get_cache_key('profile', 'VRTX')
        assert key == 'profile:VRTX'
    
    def test_rate_limiting(self):
        """Test rate limiting between requests"""
        provider = YFinanceProvider()
        provider._min_request_interval = 0.1
        
        start = datetime.utcnow()
        provider._rate_limit()
        provider._rate_limit()
        end = datetime.utcnow()
        
        elapsed = (end - start).total_seconds()
        assert elapsed >= 0.1
    
    @patch('bt_platform.providers.yfinance_provider.yf.Ticker')
    def test_get_company_profile(self, mock_ticker):
        """Test getting company profile"""
        # Mock yfinance response
        mock_info = {
            'symbol': 'VRTX',
            'longName': 'Vertex Pharmaceuticals',
            'sector': 'Healthcare',
            'industry': 'Biotechnology',
            'website': 'https://www.vrtx.com',
            'longBusinessSummary': 'Test summary',
            'city': 'Boston',
            'state': 'MA',
            'country': 'USA',
            'fullTimeEmployees': 4500,
            'marketCap': 125000000000,
            'currentPrice': 450.0,
        }
        
        mock_ticker_instance = Mock()
        mock_ticker_instance.info = mock_info
        mock_ticker.return_value = mock_ticker_instance
        
        provider = YFinanceProvider()
        profile = provider.get_company_profile('VRTX')
        
        assert profile is not None
        assert profile['ticker'] == 'VRTX'
        assert profile['name'] == 'Vertex Pharmaceuticals'
        assert profile['sector'] == 'Healthcare'
        assert profile['industry'] == 'Biotechnology'
        assert profile['market_cap'] == 125000000000
    
    @patch('bt_platform.providers.yfinance_provider.yf.Ticker')
    def test_caching(self, mock_ticker):
        """Test that caching works"""
        mock_info = {
            'symbol': 'VRTX',
            'longName': 'Vertex Pharmaceuticals',
        }
        
        mock_ticker_instance = Mock()
        mock_ticker_instance.info = mock_info
        mock_ticker.return_value = mock_ticker_instance
        
        provider = YFinanceProvider()
        
        # First call should hit API
        profile1 = provider.get_company_profile('VRTX')
        assert mock_ticker.call_count == 1
        
        # Second call should use cache
        profile2 = provider.get_company_profile('VRTX')
        assert mock_ticker.call_count == 1  # No additional call
        
        assert profile1 == profile2


class TestXBISyncService:
    """Test XBI Sync Service"""
    
    @pytest.fixture
    def mock_db(self):
        """Mock database session"""
        return Mock(spec=SessionLocal)
    
    @pytest.fixture
    def mock_provider(self):
        """Mock YFinance provider"""
        with patch('bt_platform.core.services.xbi_sync_service.get_yfinance_provider') as mock:
            provider = Mock()
            mock.return_value = provider
            yield provider
    
    def test_sync_service_init(self, mock_db, mock_provider):
        """Test service initialization"""
        service = XBISyncService(mock_db)
        assert service.db == mock_db
        assert service.provider is not None
    
    def test_determine_company_type(self, mock_db, mock_provider):
        """Test company type classification"""
        service = XBISyncService(mock_db)
        
        assert service._determine_company_type({'market_cap': 60_000_000_000}) == 'Big Pharma'
        assert service._determine_company_type({'market_cap': 15_000_000_000}) == 'Large Biotech'
        assert service._determine_company_type({'market_cap': 5_000_000_000}) == 'Mid Biotech'
        assert service._determine_company_type({'market_cap': 1_000_000_000}) == 'Small Biotech'
        assert service._determine_company_type({'market_cap': None}) == 'Biotech'
    
    def test_sync_xbi_constituents(self, mock_db, mock_provider):
        """Test syncing XBI constituents"""
        # Mock provider responses
        mock_provider.get_xbi_holdings.return_value = [
            {'ticker': 'VRTX', 'name': '', 'weight': 0.0},
            {'ticker': 'BMRN', 'name': '', 'weight': 0.0},
        ]
        
        mock_provider.get_multiple_profiles.return_value = {
            'VRTX': {
                'ticker': 'VRTX',
                'name': 'Vertex Pharmaceuticals',
                'sector': 'Healthcare',
                'industry': 'Biotechnology',
                'market_cap': 125000000000,
                'headquarters': 'Boston, MA',
                'business_summary': 'Test summary',
                'employees': 4500,
                'website': 'https://www.vrtx.com',
                'current_price': 450.0,
            },
            'BMRN': {
                'ticker': 'BMRN',
                'name': 'BioMarin Pharmaceutical',
                'sector': 'Healthcare',
                'industry': 'Biotechnology',
                'market_cap': 15000000000,
                'headquarters': 'San Rafael, CA',
                'business_summary': 'Test summary',
                'employees': 3200,
                'website': 'https://www.biomarin.com',
                'current_price': 85.0,
            },
        }
        
        # Mock database query
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        service = XBISyncService(mock_db)
        stats = service.sync_xbi_constituents()
        
        assert stats['total_constituents'] == 2
        assert stats['new_companies'] == 2
        assert stats['failed_companies'] == 0
        assert mock_db.commit.called


if __name__ == '__main__':
    pytest.main([__file__, '-v'])

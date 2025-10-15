"""
Tests for ClinicalTrials.gov Provider

Tests the ClinicalTrials.gov data provider integration.
"""

import pytest
from bt_platform.providers.clinicaltrials_provider import ClinicalTrialsProvider


@pytest.fixture
def ct_provider():
    """Create ClinicalTrials provider instance"""
    return ClinicalTrialsProvider()


class TestClinicalTrialsProvider:
    """Test ClinicalTrials.gov provider functionality"""
    
    def test_provider_initialization(self, ct_provider):
        """Test provider initializes correctly"""
        assert ct_provider.name == "clinicaltrials"
        assert ct_provider.BASE_URL == "https://clinicaltrials.gov/api/v2"
    
    def test_get_schema(self, ct_provider):
        """Test schema returns expected structure"""
        schema = ct_provider.get_schema()
        
        assert "studies" in schema
        assert "study_details" in schema
        
        # Check studies schema
        assert "required" in schema["studies"]
        assert "nct_id" in schema["studies"]["required"]
        assert "title" in schema["studies"]["required"]
    
    @pytest.mark.asyncio
    async def test_fetch_data_invalid_type(self, ct_provider):
        """Test fetch_data with invalid type raises error"""
        with pytest.raises(ValueError, match="Unknown data type"):
            await ct_provider.fetch_data(data_type="invalid_type")
    
    @pytest.mark.skip(reason="Requires external API access")
    @pytest.mark.asyncio
    async def test_search_studies_integration(self, ct_provider):
        """Integration test for searching studies"""
        result = await ct_provider.search_studies(
            condition="Cancer",
            phase="PHASE3",
            limit=5
        )
        
        assert "data" in result
        assert "count" in result
        assert "source" in result
        assert result["source"] == "clinicaltrials.gov"
        assert isinstance(result["data"], list)

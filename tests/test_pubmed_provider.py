"""
Tests for PubMed Provider

Tests the PubMed/NCBI E-utilities data provider integration.
"""

import pytest
from bt_platform.providers.pubmed_provider import PubMedProvider


@pytest.fixture
def pubmed_provider():
    """Create PubMed provider instance"""
    return PubMedProvider()


class TestPubMedProvider:
    """Test PubMed provider functionality"""

    def test_provider_initialization(self, pubmed_provider):
        """Test provider initializes correctly"""
        assert pubmed_provider.name == "pubmed"
        assert pubmed_provider.BASE_URL == "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
        assert pubmed_provider.email is not None

    def test_get_schema(self, pubmed_provider):
        """Test schema returns expected structure"""
        schema = pubmed_provider.get_schema()

        assert "publications" in schema
        assert "trends" in schema

        # Check publications schema
        assert "required" in schema["publications"]
        assert "pmid" in schema["publications"]["required"]
        assert "title" in schema["publications"]["required"]

    @pytest.mark.asyncio
    async def test_fetch_data_invalid_type(self, pubmed_provider):
        """Test fetch_data with invalid type raises error"""
        with pytest.raises(ValueError, match="Unknown data type"):
            await pubmed_provider.fetch_data(data_type="invalid_type")

    @pytest.mark.skip(reason="Requires external API access")
    @pytest.mark.asyncio
    async def test_search_publications_integration(self, pubmed_provider):
        """Integration test for searching publications"""
        result = await pubmed_provider.search_publications(
            query="cancer immunotherapy",
            limit=5
        )

        assert "data" in result
        assert "count" in result
        assert "source" in result
        assert result["source"] == "pubmed"
        assert isinstance(result["data"], list)

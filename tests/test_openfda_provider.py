"""
Tests for OpenFDA Provider

Tests the OpenFDA data provider integration.
"""

import pytest
from bt_platform.providers.openfda_provider import OpenFDAProvider


@pytest.fixture
def fda_provider():
    """Create OpenFDA provider instance"""
    return OpenFDAProvider()


class TestOpenFDAProvider:
    """Test OpenFDA provider functionality"""

    def test_provider_initialization(self, fda_provider):
        """Test provider initializes correctly"""
        assert fda_provider.name == "openfda"
        assert fda_provider.BASE_URL == "https://api.fda.gov"

    def test_get_schema(self, fda_provider):
        """Test schema returns expected structure"""
        schema = fda_provider.get_schema()

        assert "approvals" in schema
        assert "adverse_events" in schema
        assert "recalls" in schema
        assert "labels" in schema

        # Check approval schema
        assert "required" in schema["approvals"]
        assert "application_number" in schema["approvals"]["required"]
        assert "sponsor_name" in schema["approvals"]["required"]

    @pytest.mark.asyncio
    async def test_fetch_data_invalid_type(self, fda_provider):
        """Test fetch_data with invalid type raises error"""
        with pytest.raises(ValueError, match="Unknown data type"):
            await fda_provider.fetch_data(data_type="invalid_type")

    @pytest.mark.asyncio
    async def test_rate_limiting(self, fda_provider):
        """Test rate limiting is implemented"""
        import time
        start = time.time()

        # Make two sequential calls
        await fda_provider._rate_limit()
        await fda_provider._rate_limit()

        elapsed = time.time() - start

        # Should take at least the rate limit delay
        assert elapsed >= fda_provider._rate_limit_delay

    # Note: Integration tests that hit the actual API are skipped
    # to avoid rate limiting and external dependencies in CI/CD

    @pytest.mark.skip(reason="Requires external API access")
    @pytest.mark.asyncio
    async def test_fetch_drug_approvals_integration(self, fda_provider):
        """Integration test for fetching drug approvals"""
        result = await fda_provider.fetch_drug_approvals(limit=5)

        assert "data" in result
        assert "count" in result
        assert "source" in result
        assert result["source"] == "openfda"
        assert isinstance(result["data"], list)

    @pytest.mark.skip(reason="Requires external API access")
    @pytest.mark.asyncio
    async def test_fetch_adverse_events_integration(self, fda_provider):
        """Integration test for fetching adverse events"""
        result = await fda_provider.fetch_adverse_events(
            drug_name="Keytruda",
            limit=5
        )

        assert "data" in result
        assert "count" in result
        assert result["source"] == "openfda"

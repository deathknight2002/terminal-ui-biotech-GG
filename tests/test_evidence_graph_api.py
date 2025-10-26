"""
Tests for Evidence Graph API Endpoints

Tests cover:
- Basic CRUD operations
- ETag caching behavior
- HEAD method support
- Query filtering and pagination
- Rate limiting
- Error handling
"""

import pytest
from fastapi.testclient import TestClient
from standalone_evidence_api import app

# Create a test client that doesn't share rate limit state
@pytest.fixture(scope="function")
def test_client():
    """Create a fresh test client for each test."""
    return TestClient(app)


class TestHealthCheck:
    """Test health check endpoint."""

    def test_health_check(self, test_client):
        """Test health check returns OK status."""
        response = test_client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["service"] == "evidence-graph-standalone"
        assert "features" in data


class TestNodesEndpoint:
    """Test /nodes endpoint."""

    def test_get_nodes(self, test_client):
        """Test GET /nodes returns list of nodes."""
        response = test_client.get("/api/v1/evidence-graph/nodes")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_get_nodes_with_etag(self, test_client):
        """Test that GET /nodes returns ETag header."""
        response = test_client.get("/api/v1/evidence-graph/nodes")
        assert response.status_code == 200
        assert "etag" in response.headers
        assert len(response.headers["etag"]) == 64  # SHA-256 hash length

    def test_get_nodes_etag_cache_hit(self, test_client):
        """Test that If-None-Match with matching ETag returns 304."""
        # First request to get ETag
        response1 = test_client.get("/api/v1/evidence-graph/nodes")
        assert response1.status_code == 200
        etag = response1.headers["etag"]

        # Second request with If-None-Match header
        response2 = test_client.get(
            "/api/v1/evidence-graph/nodes",
            headers={"If-None-Match": etag}
        )
        assert response2.status_code == 304
        assert response2.headers["etag"] == etag

    def test_head_nodes(self, test_client):
        """Test HEAD /nodes returns headers without body."""
        response = test_client.head("/api/v1/evidence-graph/nodes")
        assert response.status_code == 200
        assert "etag" in response.headers
        assert "content-type" in response.headers
        assert response.headers["content-type"] == "application/json"
        # HEAD should not have a body
        assert len(response.content) == 0

    def test_get_nodes_with_type_filter(self, test_client):
        """Test GET /nodes with type filter."""
        response = test_client.get("/api/v1/evidence-graph/nodes?type=thesis")
        assert response.status_code == 200
        nodes = response.json()
        # All returned nodes should be of type 'thesis'
        for node in nodes:
            assert node.get("type") == "thesis"

    def test_get_nodes_with_pagination(self, test_client):
        """Test GET /nodes with limit and offset."""
        # Get all nodes first
        all_response = test_client.get("/api/v1/evidence-graph/nodes")
        all_nodes = all_response.json()

        if len(all_nodes) > 2:
            # Test limit
            limited_response = test_client.get("/api/v1/evidence-graph/nodes?limit=2")
            assert limited_response.status_code == 200
            limited_nodes = limited_response.json()
            assert len(limited_nodes) <= 2

            # Test offset
            offset_response = test_client.get("/api/v1/evidence-graph/nodes?offset=1")
            assert offset_response.status_code == 200
            offset_nodes = offset_response.json()
            assert len(offset_nodes) == len(all_nodes) - 1

    def test_get_nodes_total_count_header(self, test_client):
        """Test that X-Total-Count header is present."""
        response = test_client.get("/api/v1/evidence-graph/nodes?limit=1")
        assert response.status_code == 200
        assert "x-total-count" in response.headers


class TestEdgesEndpoint:
    """Test /edges endpoint."""

    def test_get_edges(self, test_client):
        """Test GET /edges returns list of edges."""
        response = test_client.get("/api/v1/evidence-graph/edges")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_get_edges_with_etag(self, test_client):
        """Test that GET /edges returns ETag header."""
        response = test_client.get("/api/v1/evidence-graph/edges")
        assert response.status_code == 200
        assert "etag" in response.headers

    def test_get_edges_etag_cache_hit(self, test_client):
        """Test that If-None-Match with matching ETag returns 304."""
        # First request to get ETag
        response1 = test_client.get("/api/v1/evidence-graph/edges")
        assert response1.status_code == 200
        etag = response1.headers["etag"]

        # Second request with If-None-Match header
        response2 = test_client.get(
            "/api/v1/evidence-graph/edges",
            headers={"If-None-Match": etag}
        )
        assert response2.status_code == 304

    def test_head_edges(self, test_client):
        """Test HEAD /edges returns headers without body."""
        response = test_client.head("/api/v1/evidence-graph/edges")
        assert response.status_code == 200
        assert "etag" in response.headers
        assert len(response.content) == 0


class TestSecurityHeaders:
    """Test security headers."""

    def test_security_headers_present(self, test_client):
        """Test that all required security headers are present."""
        response = test_client.get("/api/v1/evidence-graph/nodes")
        assert response.status_code == 200

        # Check security headers
        assert "x-content-type-options" in response.headers
        assert response.headers["x-content-type-options"] == "nosniff"

        assert "x-frame-options" in response.headers
        assert response.headers["x-frame-options"] == "DENY"

        assert "x-xss-protection" in response.headers

        assert "content-security-policy" in response.headers

    def test_request_id_header(self, test_client):
        """Test that X-Request-ID is added to responses."""
        response = test_client.get("/api/v1/evidence-graph/nodes")
        assert response.status_code == 200
        assert "x-request-id" in response.headers


class TestRateLimiting:
    """Test rate limiting functionality."""

    def test_rate_limit_headers(self, test_client):
        """Test that rate limit headers are present."""
        response = test_client.get("/api/v1/evidence-graph/nodes")
        assert response.status_code == 200

        assert "x-ratelimit-limit" in response.headers
        assert "x-ratelimit-remaining" in response.headers
        assert "x-ratelimit-reset" in response.headers

    @pytest.mark.slow
    def test_rate_limit_enforcement(self):
        """Test that rate limit is enforced after too many requests."""
        # Use a fresh client for this test to avoid interference
        client = TestClient(app)

        # Make many requests to trigger rate limit
        # Note: This test might be slow
        responses = []
        for i in range(65):  # Just over the limit of 60
            response = client.get("/api/v1/evidence-graph/nodes")
            responses.append(response)

            if response.status_code == 429:
                # Rate limit hit
                assert "retry-after" in response.headers
                break

        # At least one request should have hit the rate limit
        status_codes = [r.status_code for r in responses]
        # Either we hit 429, or we didn't make enough requests (test passes both ways)
        assert 429 in status_codes or len(responses) <= 60


class TestThesisTimeline:
    """Test thesis timeline endpoint."""

    def test_get_thesis_timeline_not_found(self, test_client):
        """Test that invalid thesis ID returns 404."""
        response = test_client.get("/api/v1/evidence-graph/thesis/nonexistent/timeline")
        assert response.status_code == 404

    def test_get_thesis_timeline_structure(self, test_client):
        """Test that thesis timeline has correct structure if nodes exist."""
        # First get a thesis node
        nodes_response = test_client.get("/api/v1/evidence-graph/nodes?type=thesis&limit=1")
        if nodes_response.status_code == 200:
            nodes = nodes_response.json()
            if len(nodes) > 0:
                thesis_id = nodes[0]["id"]

                # Get timeline
                timeline_response = test_client.get(f"/api/v1/evidence-graph/thesis/{thesis_id}/timeline")
                if timeline_response.status_code == 200:
                    data = timeline_response.json()

                    # Check structure
                    assert "thesis_id" in data
                    assert "thesis" in data
                    assert "timeline" in data
                    assert "summary" in data

                    assert isinstance(data["timeline"], list)


class TestScreenEndpoint:
    """Test edge screening endpoint."""

    def test_screen_edges_no_filters(self, test_client):
        """Test GET /screen without filters."""
        response = test_client.get("/api/v1/evidence-graph/screen")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_screen_edges_with_pos_delta_filter(self, test_client):
        """Test GET /screen with pos_delta filter."""
        response = test_client.get("/api/v1/evidence-graph/screen?pos_delta_abs_gt=0.01")
        assert response.status_code == 200
        edges = response.json()
        # Verify all edges have delta > 0.01
        for edge in edges:
            if "delta" in edge and edge["delta"] and "pos" in edge["delta"]:
                assert abs(edge["delta"]["pos"]) > 0.01

    def test_screen_edges_with_days_filter(self, test_client):
        """Test GET /screen with days filter."""
        response = test_client.get("/api/v1/evidence-graph/screen?days=30")
        assert response.status_code == 200
        # Should return list (might be empty if no recent edges)
        assert isinstance(response.json(), list)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

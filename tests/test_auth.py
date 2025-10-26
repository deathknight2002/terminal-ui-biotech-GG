"""
Test API Token Authentication

Tests that:
- GET, HEAD, OPTIONS requests are public (no token needed)
- POST, PUT, DELETE, PATCH require valid API token
- Invalid tokens return 401/403
- Valid tokens allow write operations
"""

import pytest
from fastapi.testclient import TestClient
from bt_platform.core.app import app
from bt_platform.core.config import settings

client = TestClient(app)

# Test data
TEST_NODE = {
    "id": "test-node-123",
    "label": "Test Node",
    "type": "thesis",
    "company": "Test Co",
    "pos_estimate": 0.5,
    "sentiment": 0.7
}

TEST_EDGE = {
    "source_id": "test-node-123",
    "target_id": "test-node-456",
    "label": "supports",
    "weight": 1.0
}


class TestPublicEndpoints:
    """Test that read endpoints are public"""

    def test_get_nodes_no_auth(self):
        """GET /nodes should work without authentication"""
        response = client.get("/api/v1/evidence-graph/nodes")
        # Should succeed (200) or return error unrelated to auth
        assert response.status_code in [200, 404, 500], \
            f"GET should not require auth, got {response.status_code}"

    def test_head_nodes_no_auth(self):
        """HEAD /nodes should work without authentication"""
        response = client.head("/api/v1/evidence-graph/nodes")
        assert response.status_code in [200, 404, 500], \
            f"HEAD should not require auth, got {response.status_code}"

    def test_get_edges_no_auth(self):
        """GET /edges should work without authentication"""
        response = client.get("/api/v1/evidence-graph/edges")
        assert response.status_code in [200, 404, 500], \
            f"GET should not require auth, got {response.status_code}"

    def test_health_check_no_auth(self):
        """Health check should always be public"""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"

    def test_metrics_no_auth(self):
        """Metrics endpoint should be public"""
        response = client.get("/metrics")
        # Should succeed if metrics enabled
        assert response.status_code in [200, 404]


class TestProtectedEndpoints:
    """Test that write endpoints require authentication when enabled"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup and teardown for each test"""
        # Store original settings
        self.original_enabled = settings.API_TOKEN_ENABLED
        self.original_token = settings.API_TOKEN

        # Enable auth for testing
        settings.API_TOKEN_ENABLED = True
        settings.API_TOKEN = "test-token-12345"

        yield

        # Restore original settings
        settings.API_TOKEN_ENABLED = self.original_enabled
        settings.API_TOKEN = self.original_token

    def test_post_node_no_auth(self):
        """POST /node should require authentication"""
        response = client.post("/api/v1/evidence-graph/node", json=TEST_NODE)
        assert response.status_code in [401, 403], \
            f"POST without auth should return 401/403, got {response.status_code}"

    def test_post_node_invalid_token(self):
        """POST /node with invalid token should fail"""
        headers = {"Authorization": "Bearer invalid-token"}
        response = client.post("/api/v1/evidence-graph/node", json=TEST_NODE, headers=headers)
        assert response.status_code in [401, 403], \
            f"POST with invalid token should return 401/403, got {response.status_code}"

    def test_post_node_valid_token(self):
        """POST /node with valid token should succeed"""
        headers = {"Authorization": "Bearer test-token-12345"}
        response = client.post("/api/v1/evidence-graph/node", json=TEST_NODE, headers=headers)
        # Should succeed (200/201) or fail for reasons other than auth
        assert response.status_code not in [401, 403], \
            f"POST with valid token should not return 401/403, got {response.status_code}"

    def test_post_node_api_key_header(self):
        """POST /node with X-API-Key header should succeed"""
        headers = {"X-API-Key": "test-token-12345"}
        response = client.post("/api/v1/evidence-graph/node", json=TEST_NODE, headers=headers)
        assert response.status_code not in [401, 403], \
            f"POST with valid X-API-Key should not return 401/403, got {response.status_code}"

    def test_post_edge_no_auth(self):
        """POST /edge should require authentication"""
        response = client.post("/api/v1/evidence-graph/edge", json=TEST_EDGE)
        assert response.status_code in [401, 403]

    def test_post_seed_no_auth(self):
        """POST /seed should require authentication"""
        response = client.post("/api/v1/evidence-graph/seed")
        assert response.status_code in [401, 403]


class TestAuthDisabled:
    """Test behavior when authentication is disabled"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup and teardown for each test"""
        self.original_enabled = settings.API_TOKEN_ENABLED

        # Disable auth
        settings.API_TOKEN_ENABLED = False

        yield

        # Restore
        settings.API_TOKEN_ENABLED = self.original_enabled

    def test_post_node_no_auth_when_disabled(self):
        """POST /node should work without auth when auth is disabled"""
        response = client.post("/api/v1/evidence-graph/node", json=TEST_NODE)
        # Should not return auth errors
        assert response.status_code not in [401, 403], \
            f"POST should work when auth disabled, got {response.status_code}"


class TestAuthHeaders:
    """Test various auth header formats"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup for each test"""
        self.original_enabled = settings.API_TOKEN_ENABLED
        self.original_token = settings.API_TOKEN

        settings.API_TOKEN_ENABLED = True
        settings.API_TOKEN = "test-token-12345"

        yield

        settings.API_TOKEN_ENABLED = self.original_enabled
        settings.API_TOKEN = self.original_token

    def test_bearer_token_format(self):
        """Test Bearer token format"""
        headers = {"Authorization": "Bearer test-token-12345"}
        response = client.post("/api/v1/evidence-graph/node", json=TEST_NODE, headers=headers)
        assert response.status_code not in [401, 403]

    def test_plain_authorization_header(self):
        """Test plain Authorization header (no Bearer prefix)"""
        headers = {"Authorization": "test-token-12345"}
        response = client.post("/api/v1/evidence-graph/node", json=TEST_NODE, headers=headers)
        assert response.status_code not in [401, 403]

    def test_x_api_key_header(self):
        """Test X-API-Key header"""
        headers = {"X-API-Key": "test-token-12345"}
        response = client.post("/api/v1/evidence-graph/node", json=TEST_NODE, headers=headers)
        assert response.status_code not in [401, 403]

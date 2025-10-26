"""
Unit Tests for Advanced ML Endpoints
====================================

Tests the new sentiment analyzer endpoints (FinBERT, BioBERT, Ensemble).
"""

import pytest
from unittest.mock import Mock, patch
from fastapi.testclient import TestClient


class TestAdvancedSentimentEndpoints:
    """Test cases for advanced sentiment endpoints."""

    @pytest.fixture
    def client(self):
        """Create test client for API."""
        from bt_platform.core.app import app
        return TestClient(app)

    @pytest.fixture
    def sample_request(self):
        """Sample sentiment request."""
        return {
            "texts": [
                "FDA approves breakthrough cancer therapy",
                "Clinical trial fails primary endpoint",
                "Company reports strong quarterly results"
            ]
        }

    def test_list_models_endpoint(self, client):
        """Test listing available models."""
        response = client.get("/api/v1/ml/sentiment/models")

        assert response.status_code == 200
        data = response.json()

        assert "models" in data
        assert "total_models" in data
        assert isinstance(data["models"], list)
        assert len(data["models"]) >= 4  # tfidf, finbert, biobert, ensemble

        # Check model structure
        for model in data["models"]:
            assert "name" in model
            assert "type" in model
            assert "endpoint" in model
            assert "available" in model

    @patch('bt_platform.core.endpoints.ml_endpoints.get_finbert_analyzer')
    def test_finbert_endpoint_success(self, mock_analyzer, client, sample_request):
        """Test FinBERT sentiment prediction endpoint."""
        # Mock analyzer
        mock_instance = Mock()
        mock_instance.predict.return_value = [1, -1, 1]
        mock_instance.predict_proba.return_value = [
            [0.1, 0.2, 0.7],  # Positive
            [0.8, 0.15, 0.05],  # Negative
            [0.05, 0.15, 0.8]  # Positive
        ]
        mock_analyzer.return_value = mock_instance

        response = client.post("/api/v1/ml/sentiment/finbert", json=sample_request)

        assert response.status_code == 200
        data = response.json()

        assert "results" in data
        assert len(data["results"]) == 3
        assert data["model_version"] == "finbert-1.0.0"

        # Check result structure
        for result in data["results"]:
            assert "text" in result
            assert "prediction" in result
            assert "confidence" in result
            assert "probabilities" in result
            assert result["prediction"] in [-1, 0, 1]
            assert 0.0 <= result["confidence"] <= 1.0

    @patch('bt_platform.core.endpoints.ml_endpoints.get_biobert_analyzer')
    def test_biobert_endpoint_success(self, mock_analyzer, client, sample_request):
        """Test BioBERT sentiment prediction endpoint."""
        # Mock analyzer
        mock_instance = Mock()
        mock_instance.predict.return_value = [1, -1, 0]
        mock_instance.predict_proba.return_value = [
            [0.1, 0.2, 0.7],
            [0.8, 0.15, 0.05],
            [0.2, 0.6, 0.2]
        ]
        mock_analyzer.return_value = mock_instance

        response = client.post("/api/v1/ml/sentiment/biobert", json=sample_request)

        assert response.status_code == 200
        data = response.json()

        assert "results" in data
        assert len(data["results"]) == 3
        assert data["model_version"] == "biobert-1.0.0"

    @patch('bt_platform.core.endpoints.ml_endpoints.get_ensemble_analyzer')
    def test_ensemble_endpoint_success(self, mock_analyzer, client, sample_request):
        """Test Ensemble sentiment prediction endpoint."""
        # Mock analyzer
        mock_instance = Mock()
        mock_instance.predict.return_value = [1, -1, 1]
        mock_instance.predict_proba.return_value = [
            [0.1, 0.2, 0.7],
            [0.8, 0.15, 0.05],
            [0.05, 0.15, 0.8]
        ]
        mock_analyzer.return_value = mock_instance

        response = client.post("/api/v1/ml/sentiment/ensemble", json=sample_request)

        assert response.status_code == 200
        data = response.json()

        assert "results" in data
        assert len(data["results"]) == 3
        assert data["model_version"] == "ensemble-1.0.0"

    def test_finbert_endpoint_empty_texts(self, client):
        """Test FinBERT endpoint with empty texts."""
        response = client.post("/api/v1/ml/sentiment/finbert", json={"texts": []})

        assert response.status_code == 422  # Validation error

    def test_finbert_endpoint_too_many_texts(self, client):
        """Test FinBERT endpoint with too many texts."""
        response = client.post("/api/v1/ml/sentiment/finbert", json={
            "texts": ["text"] * 101  # Over limit of 100
        })

        assert response.status_code == 422  # Validation error

    @patch('bt_platform.core.endpoints.ml_endpoints.get_finbert_analyzer')
    def test_finbert_endpoint_model_error(self, mock_analyzer, client, sample_request):
        """Test FinBERT endpoint when model raises error."""
        mock_analyzer.side_effect = Exception("Model loading failed")

        response = client.post("/api/v1/ml/sentiment/finbert", json=sample_request)

        assert response.status_code == 500
        assert "error" in response.json() or "detail" in response.json()

    @patch('bt_platform.core.endpoints.ml_endpoints.check_transformers_available')
    def test_list_models_without_transformers(self, mock_check, client):
        """Test model listing when transformers not available."""
        mock_check.return_value = False

        response = client.get("/api/v1/ml/sentiment/models")

        assert response.status_code == 200
        data = response.json()

        # TF-IDF and ensemble should still be available
        available_models = [m for m in data["models"] if m["available"]]
        model_names = [m["name"] for m in available_models]
        assert "tfidf" in model_names
        assert "ensemble" in model_names


class TestSentimentEndpointValidation:
    """Test input validation for sentiment endpoints."""

    @pytest.fixture
    def client(self):
        """Create test client for API."""
        from bt_platform.core.app import app
        return TestClient(app)

    def test_invalid_json(self, client):
        """Test endpoints with invalid JSON."""
        response = client.post(
            "/api/v1/ml/sentiment/finbert",
            data="not valid json",
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code in [400, 422]

    def test_missing_texts_field(self, client):
        """Test endpoints with missing texts field."""
        response = client.post("/api/v1/ml/sentiment/finbert", json={})
        assert response.status_code == 422

    def test_wrong_texts_type(self, client):
        """Test endpoints with wrong texts type."""
        response = client.post("/api/v1/ml/sentiment/finbert", json={
            "texts": "not a list"
        })
        assert response.status_code == 422


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

"""
Integration Tests for Financial API Endpoints

Tests API endpoints for price targets, consensus, valuation, and reports.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from platform.core.app import app
from platform.core.database import Base, get_db


# Create test database
TEST_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    """Override database dependency for testing."""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


@pytest.fixture(scope="module")
def setup_database():
    """Set up test database."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


class TestFinancialEndpoints:
    """Test financial API endpoints."""

    def test_get_financial_overview(self, setup_database):
        """Test GET /api/v1/financials/overview."""
        response = client.get("/api/v1/financials/overview?ticker=NUVL")
        assert response.status_code == 200

    def test_get_price_targets_empty(self, setup_database):
        """Test GET /api/v1/financials/price-targets with no data."""
        response = client.get("/api/v1/financials/price-targets")
        assert response.status_code == 200
        data = response.json()
        assert "count" in data
        assert "price_targets" in data

    def test_create_price_target(self, setup_database):
        """Test POST /api/v1/financials/price-targets."""
        payload = {
            "ticker": "NUVL",
            "source": "Goldman Sachs",
            "date": "2025-01-15",
            "price_target": 52.0,
            "rationale": "Strong pipeline momentum",
            "currency": "USD",
        }

        response = client.post("/api/v1/financials/price-targets", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "id" in data

    def test_get_price_targets_with_data(self, setup_database):
        """Test GET /api/v1/financials/price-targets after creating data."""
        # Create price target first
        payload = {
            "ticker": "TEST",
            "source": "Test Analyst",
            "date": "2025-01-15",
            "price_target": 45.0,
            "currency": "USD",
        }
        client.post("/api/v1/financials/price-targets", json=payload)

        # Get price targets
        response = client.get("/api/v1/financials/price-targets?ticker=TEST")
        assert response.status_code == 200
        data = response.json()
        assert data["count"] > 0

    def test_get_price_targets_with_filter(self, setup_database):
        """Test GET /api/v1/financials/price-targets with ticker filter."""
        response = client.get("/api/v1/financials/price-targets?ticker=NUVL&limit=10")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data["price_targets"], list)

    def test_get_consensus_estimates(self, setup_database):
        """Test GET /api/v1/financials/consensus."""
        response = client.get("/api/v1/financials/consensus")
        assert response.status_code == 200
        data = response.json()
        assert "count" in data
        assert "consensus_estimates" in data

    def test_get_consensus_estimates_with_filter(self, setup_database):
        """Test GET /api/v1/financials/consensus with filters."""
        response = client.get(
            "/api/v1/financials/consensus?ticker=NUVL&metric=revenue"
        )
        assert response.status_code == 200

    def test_run_valuation_missing_params(self, setup_database):
        """Test POST /api/v1/financials/valuation/run with missing params."""
        payload = {
            "ticker": "TEST",
            # Missing required fields
        }

        response = client.post("/api/v1/financials/valuation/run", json=payload)
        # Should return error or handle gracefully
        assert response.status_code in [400, 422, 500]

    def test_run_valuation_complete(self, setup_database):
        """Test POST /api/v1/financials/valuation/run with complete params."""
        payload = {
            "ticker": "TEST",
            "scenario_id": "base",
            "epi_params": {
                "US_addressable": 50000,
                "US_eligible_rate": 0.7,
            },
            "financial_assumptions": {
                "asset_id": "TEST-001",
                "wacc": 0.12,
                "tgr": 0.025,
                "ebitda_margin": 0.30,
                "tax_rate": 0.25,
                "pricing": {"US": 150000},
                "uptake_curve": {2025: 0.05, 2026: 0.15, 2027: 0.30},
                "pos_by_phase": 0.65,
                "sector_multiples": {"ev_to_revenue": 8.5},
            },
            "user": "test@biotech.com",
        }

        response = client.post("/api/v1/financials/valuation/run", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "run_id" in data
        assert "results" in data

        # Check results structure
        results = data["results"]
        assert "inputs_hash" in results
        assert "dcf" in results
        assert "multiples" in results

    def test_get_valuation_audit(self, setup_database):
        """Test GET /api/v1/financials/audit."""
        response = client.get("/api/v1/financials/audit")
        assert response.status_code == 200
        data = response.json()
        assert "count" in data
        assert "runs" in data

    def test_get_valuation_audit_with_filter(self, setup_database):
        """Test GET /api/v1/financials/audit with ticker filter."""
        response = client.get("/api/v1/financials/audit?ticker=TEST&limit=10")
        assert response.status_code == 200


class TestReportEndpoints:
    """Test report generation endpoints."""

    def test_export_report_missing_params(self, setup_database):
        """Test POST /api/v1/reports/export with missing params."""
        payload = {
            "ticker": "TEST",
            # Missing template_id and file_type
        }

        response = client.post("/api/v1/reports/export", json=payload)
        # Should handle missing params
        assert response.status_code in [400, 404, 422, 500]

    def test_export_report_xlsx(self, setup_database):
        """Test POST /api/v1/reports/export for Excel."""
        # First create a valuation run
        valuation_payload = {
            "ticker": "EXPORT_TEST",
            "scenario_id": "base",
            "epi_params": {"US_addressable": 50000},
            "financial_assumptions": {
                "wacc": 0.12,
                "pricing": {"US": 150000},
                "uptake_curve": {2025: 0.05},
            },
        }
        client.post("/api/v1/financials/valuation/run", json=valuation_payload)

        # Now export report
        export_payload = {
            "ticker": "EXPORT_TEST",
            "template_id": "dcf_model",
            "file_type": "xlsx",
            "params": {"include_sensitivity": True},
            "user": "test@biotech.com",
        }

        response = client.post("/api/v1/reports/export", json=export_payload)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["file_type"] == "xlsx"
        assert "download_url" in data

    def test_export_report_pptx(self, setup_database):
        """Test POST /api/v1/reports/export for PowerPoint."""
        # First create a valuation run
        valuation_payload = {
            "ticker": "PPTX_TEST",
            "scenario_id": "base",
            "epi_params": {"US_addressable": 50000},
            "financial_assumptions": {
                "wacc": 0.12,
                "pricing": {"US": 150000},
                "uptake_curve": {2025: 0.05},
            },
        }
        client.post("/api/v1/financials/valuation/run", json=valuation_payload)

        # Now export report
        export_payload = {
            "ticker": "PPTX_TEST",
            "template_id": "banker_deck",
            "file_type": "pptx",
            "params": {"include_comparables": True},
            "user": "test@biotech.com",
        }

        response = client.post("/api/v1/reports/export", json=export_payload)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["file_type"] == "pptx"

    def test_list_reports(self, setup_database):
        """Test GET /api/v1/reports/list."""
        response = client.get("/api/v1/reports/list")
        assert response.status_code == 200
        data = response.json()
        assert "count" in data
        assert "reports" in data

    def test_list_reports_with_filter(self, setup_database):
        """Test GET /api/v1/reports/list with filters."""
        response = client.get(
            "/api/v1/reports/list?ticker=TEST&template_id=dcf_model&limit=5"
        )
        assert response.status_code == 200

    def test_download_report_not_found(self, setup_database):
        """Test GET /api/v1/reports/download/{hash} with invalid hash."""
        response = client.get("/api/v1/reports/download/invalid_hash_123")
        assert response.status_code == 404

    def test_download_report_valid(self, setup_database):
        """Test GET /api/v1/reports/download/{hash} with valid hash."""
        # First create a report
        valuation_payload = {
            "ticker": "DL_TEST",
            "scenario_id": "base",
            "epi_params": {"US_addressable": 50000},
            "financial_assumptions": {
                "wacc": 0.12,
                "pricing": {"US": 150000},
                "uptake_curve": {2025: 0.05},
            },
        }
        client.post("/api/v1/financials/valuation/run", json=valuation_payload)

        export_payload = {
            "ticker": "DL_TEST",
            "template_id": "dcf_model",
            "file_type": "xlsx",
            "params": {},
            "user": "test@biotech.com",
        }

        export_response = client.post("/api/v1/reports/export", json=export_payload)
        export_data = export_response.json()

        # Extract file hash from download URL
        download_url = export_data["download_url"]
        file_hash = download_url.split("/")[-1]

        # Download report
        response = client.get(f"/api/v1/reports/download/{file_hash}")
        assert response.status_code == 200
        data = response.json()
        assert "file_path" in data
        assert "file_type" in data


class TestLoEEndpoints:
    """Test LoE timeline endpoints."""

    def test_get_loe_timeline(self, setup_database):
        """Test GET /api/v1/loe/timeline."""
        response = client.get("/api/v1/loe/timeline")
        assert response.status_code == 200
        data = response.json()
        assert "events" in data

    def test_get_loe_timeline_with_filter(self, setup_database):
        """Test GET /api/v1/loe/timeline with ticker filter."""
        response = client.get("/api/v1/loe/timeline?ticker=NUVL")
        assert response.status_code == 200


class TestDataUpload:
    """Test data upload endpoints."""

    def test_upload_consensus_no_file(self, setup_database):
        """Test POST /api/v1/financials/consensus/upload without file."""
        response = client.post("/api/v1/financials/consensus/upload")
        # Should return error for missing file
        assert response.status_code in [400, 422]

    def test_upload_consensus_invalid_format(self, setup_database):
        """Test POST /api/v1/financials/consensus/upload with invalid format."""
        # This would require actual file upload
        # Placeholder for now
        pass

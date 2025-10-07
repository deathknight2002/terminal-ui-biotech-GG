"""
Tests for Risk Metrics Helper
"""

import pytest
from platform.tui.helpers.risk_metrics import get_risk_metrics, RiskMetrics


class TestRiskMetrics:
    """Test cases for risk metrics helper."""

    def test_get_known_asset(self):
        """Test retrieving risk metrics for known asset."""
        metrics = get_risk_metrics("BCRX-001")

        assert metrics is not None
        assert metrics.asset_id == "BCRX-001"
        assert 0.0 <= metrics.success_probability <= 1.0
        assert metrics.monthly_burn_rate > 0
        assert metrics.runway_months > 0
        assert metrics.risk_category in ["Low", "Medium", "High"]

    def test_get_unknown_asset(self):
        """Test retrieving risk metrics for unknown asset gets defaults."""
        metrics = get_risk_metrics("UNKNOWN-999")

        assert metrics is not None
        assert metrics.asset_id == "UNKNOWN-999"
        assert metrics.success_probability == 0.50
        assert metrics.monthly_burn_rate == 4.0
        assert metrics.runway_months == 12
        assert metrics.risk_category == "Medium"

    def test_all_mock_assets_have_valid_data(self):
        """Test that all mock assets have valid risk data."""
        known_assets = ["BCRX-001", "SRPT-001", "BEAM-001", "NTLA-001", "REGN-001"]

        for asset_id in known_assets:
            metrics = get_risk_metrics(asset_id)

            assert metrics is not None
            assert metrics.asset_id == asset_id
            assert 0.0 <= metrics.success_probability <= 1.0
            assert metrics.monthly_burn_rate > 0
            assert metrics.runway_months > 0
            assert metrics.risk_category in ["Low", "Medium", "High"]

    def test_risk_metrics_dataclass(self):
        """Test RiskMetrics dataclass structure."""
        metrics = RiskMetrics(
            asset_id="TEST-001",
            success_probability=0.75,
            monthly_burn_rate=5.0,
            runway_months=20,
            risk_category="Low",
        )

        assert metrics.asset_id == "TEST-001"
        assert metrics.success_probability == 0.75
        assert metrics.monthly_burn_rate == 5.0
        assert metrics.runway_months == 20
        assert metrics.risk_category == "Low"

    def test_risk_category_consistency(self):
        """Test that risk categories are consistent with probabilities."""
        # Low risk should have higher success probability
        low_risk = get_risk_metrics("SRPT-001")  # Low risk in mock data
        high_risk = get_risk_metrics("BEAM-001")  # High risk in mock data

        if low_risk and high_risk:
            assert low_risk.success_probability > high_risk.success_probability

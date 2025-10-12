"""
Risk Metrics Helper Module

Provides risk assessment data for biotech assets.
"""

from dataclasses import dataclass
from typing import Optional


@dataclass
class RiskMetrics:
    """Risk metrics for a biotech asset."""

    asset_id: str
    success_probability: float  # 0.0 to 1.0
    monthly_burn_rate: float  # USD millions per month
    runway_months: int  # Months of cash remaining
    risk_category: str  # "Low", "Medium", "High"


# Mock data for demonstration
# In production, this would query from database or API
MOCK_RISK_DATA = {
    "BCRX-001": RiskMetrics(
        asset_id="BCRX-001",
        success_probability=0.65,
        monthly_burn_rate=4.8,
        runway_months=18,
        risk_category="Medium",
    ),
    "SRPT-001": RiskMetrics(
        asset_id="SRPT-001",
        success_probability=0.78,
        monthly_burn_rate=3.2,
        runway_months=24,
        risk_category="Low",
    ),
    "BEAM-001": RiskMetrics(
        asset_id="BEAM-001",
        success_probability=0.58,
        monthly_burn_rate=5.6,
        runway_months=14,
        risk_category="High",
    ),
    "NTLA-001": RiskMetrics(
        asset_id="NTLA-001",
        success_probability=0.62,
        monthly_burn_rate=4.2,
        runway_months=16,
        risk_category="Medium",
    ),
    "REGN-001": RiskMetrics(
        asset_id="REGN-001",
        success_probability=0.82,
        monthly_burn_rate=2.8,
        runway_months=30,
        risk_category="Low",
    ),
}


def get_risk_metrics(asset_id: str) -> Optional[RiskMetrics]:
    """
    Get risk metrics for an asset.

    Args:
        asset_id: Unique identifier for the asset

    Returns:
        RiskMetrics object or None if not found
    """
    if asset_id in MOCK_RISK_DATA:
        return MOCK_RISK_DATA[asset_id]

    # Generate default metrics for unknown assets
    return RiskMetrics(
        asset_id=asset_id,
        success_probability=0.50,
        monthly_burn_rate=4.0,
        runway_months=12,
        risk_category="Medium",
    )

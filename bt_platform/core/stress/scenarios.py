"""
Stress testing scenarios for biotech event-driven strategies.

Implements biotech-native scenarios like binary readout shocks, CRL cascades,
and sector drawdowns.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import numpy as np


@dataclass
class StressScenario:
    """Stress test scenario configuration."""

    name: str
    description: str
    shock_type: str  # "gap", "volatility", "liquidity", "correlation"
    shock_magnitude: float  # Impact size
    parameters: dict[str, Any]


class BiotechStressScenarios:
    """
    Biotech-native stress scenarios for event-driven strategies.

    Scenarios:
    1. Binary readout shock: +/- 40% overnight gap
    2. CRL cascade: Regulatory denial + follow-on selloff
    3. AdCom volatility: Intraday vote drift + spread widening
    4. Sector drawdown: XBI -25% in 3 weeks
    5. Market crash: General market crash with liquidity freeze
    """

    @staticmethod
    def binary_readout_shock() -> StressScenario:
        """
        Binary readout shock scenario.

        Positive or negative 40% overnight gap, thin liquidity, borrow unavailable.
        """
        return StressScenario(
            name="Binary Readout Shock",
            description="Phase 3 readout with 40% overnight gap, low liquidity, no borrow",
            shock_type="gap",
            shock_magnitude=0.40,
            parameters={
                "gap_direction": np.random.choice([1, -1]),  # Random up or down
                "liquidity_reduction": 0.70,  # 70% liquidity reduction
                "borrow_available": False,
                "spread_widening": 3.0,  # 3x spread
            },
        )

    @staticmethod
    def crl_cascade() -> StressScenario:
        """
        CRL (Complete Response Letter) cascade scenario.

        Regulatory denial followed by follow-on selloff and analyst downgrades.
        """
        return StressScenario(
            name="CRL Cascade",
            description="Regulatory denial + follow-on selloff + downgrade cluster",
            shock_type="cascade",
            shock_magnitude=-0.35,  # Initial -35%
            parameters={
                "initial_gap": -0.35,
                "follow_on_decline": -0.15,  # Additional -15% over next week
                "days_to_trough": 5,
                "volatility_spike": 2.5,  # 2.5x normal volatility
                "correlation_spike": 0.8,  # High correlation with similar assets
            },
        )

    @staticmethod
    def adcom_volatility() -> StressScenario:
        """
        AdCom (Advisory Committee) volatility scenario.

        Intraday vote drift with microstructure noise and spread widening.
        """
        return StressScenario(
            name="AdCom Vote Drift",
            description="Intraday vote uncertainty + microstructure noise + spread widening",
            shock_type="volatility",
            shock_magnitude=0.20,  # 20% intraday range
            parameters={
                "intraday_range": 0.20,
                "spread_widening": 3.0,
                "tick_frequency_reduction": 0.50,  # Fewer trades
                "close_direction": np.random.choice([1, -1]),  # Final direction uncertain
            },
        )

    @staticmethod
    def sector_drawdown() -> StressScenario:
        """
        Sector drawdown scenario.

        XBI -25% in 3 weeks, correlated small-cap liquidity crunch.
        """
        return StressScenario(
            name="Sector Drawdown",
            description="XBI -25% over 3 weeks + small-cap liquidity crunch",
            shock_type="sector",
            shock_magnitude=-0.25,
            parameters={
                "sector_decline": -0.25,
                "duration_days": 15,  # 3 trading weeks
                "correlation": 0.70,  # Individual stocks move with sector
                "liquidity_reduction": 0.40,  # 40% liquidity reduction
                "volatility_increase": 1.8,  # 1.8x normal vol
            },
        )

    @staticmethod
    def market_crash() -> StressScenario:
        """
        Market crash scenario.

        Broad market crash with flight to quality and liquidity freeze.
        """
        return StressScenario(
            name="Market Crash",
            description="SPY -15%, liquidity freeze, correlation -> 1",
            shock_type="market",
            shock_magnitude=-0.15,
            parameters={
                "market_decline": -0.15,
                "duration_days": 5,
                "correlation": 0.95,  # Everything moves together
                "liquidity_reduction": 0.80,  # 80% reduction
                "volatility_spike": 3.0,  # 3x normal vol
                "borrow_freeze": True,  # Can't borrow/short
            },
        )

    @classmethod
    def get_all_scenarios(cls) -> list[StressScenario]:
        """Get all predefined stress scenarios."""
        return [
            cls.binary_readout_shock(),
            cls.crl_cascade(),
            cls.adcom_volatility(),
            cls.sector_drawdown(),
            cls.market_crash(),
        ]


def run_stress_test(
    portfolio_value: float,
    positions: dict[str, float],  # ticker -> position size
    scenario: StressScenario,
) -> dict[str, Any]:
    """
    Run stress test on portfolio under scenario.

    Args:
        portfolio_value: Total portfolio value
        positions: Dict of ticker -> position size (as fraction of portfolio)
        scenario: Stress scenario to apply

    Returns:
        Dict with stress test results including P&L, drawdown, etc.
    """
    results = {
        "scenario_name": scenario.name,
        "initial_portfolio_value": portfolio_value,
    }

    # Calculate impact based on scenario type
    if scenario.shock_type == "gap":
        # Overnight gap scenario
        direction = scenario.parameters.get("gap_direction", -1)
        total_loss = 0.0

        for ticker, position_size in positions.items():
            position_value = portfolio_value * position_size
            loss = position_value * scenario.shock_magnitude * direction
            total_loss += loss

        results["total_pnl"] = total_loss
        results["drawdown"] = total_loss / portfolio_value

    elif scenario.shock_type == "cascade":
        # Multi-day cascade
        initial_gap = scenario.parameters["initial_gap"]
        follow_on = scenario.parameters["follow_on_decline"]

        total_loss = 0.0
        for ticker, position_size in positions.items():
            position_value = portfolio_value * position_size
            # Initial gap + follow-on decline
            total_decline = initial_gap + follow_on
            loss = position_value * total_decline
            total_loss += loss

        results["total_pnl"] = total_loss
        results["drawdown"] = total_loss / portfolio_value
        results["days_to_trough"] = scenario.parameters["days_to_trough"]

    elif scenario.shock_type in ["sector", "market"]:
        # Correlated sector/market move
        decline = scenario.parameters.get(
            "sector_decline", scenario.parameters.get("market_decline", -0.15)
        )
        correlation = scenario.parameters["correlation"]

        total_loss = 0.0
        for ticker, position_size in positions.items():
            position_value = portfolio_value * position_size
            # Position participates in sector move by correlation
            loss = position_value * decline * correlation
            total_loss += loss

        results["total_pnl"] = total_loss
        results["drawdown"] = total_loss / portfolio_value
        results["duration_days"] = scenario.parameters.get("duration_days", 1)

    else:  # volatility
        # Intraday volatility scenario - assume some slippage
        intraday_range = scenario.parameters["intraday_range"]

        total_loss = 0.0
        for ticker, position_size in positions.items():
            position_value = portfolio_value * position_size
            # Assume half the intraday range as slippage/adverse movement
            loss = position_value * intraday_range * 0.5
            total_loss += loss

        results["total_pnl"] = -total_loss  # Negative for cost
        results["drawdown"] = -total_loss / portfolio_value

    # Add scenario parameters
    results["scenario_parameters"] = scenario.parameters

    # Check solvency
    final_value = portfolio_value + results["total_pnl"]
    results["final_portfolio_value"] = final_value
    results["is_solvent"] = final_value > 0

    # Recovery time estimate (simplified)
    if results["drawdown"] < 0:
        # Assume 1% return per day recovery
        recovery_days = abs(results["drawdown"]) / 0.01
        results["estimated_recovery_days"] = min(recovery_days, 200)
    else:
        results["estimated_recovery_days"] = 0

    return results

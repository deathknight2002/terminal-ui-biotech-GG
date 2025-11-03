"""
MVM Feature Enhancer with risk-adjusted position sizing and regime awareness.

Converts MVM scores into actionable recommendations with position sizing,
risk management, and market regime adjustments.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

import numpy as np


@dataclass
class RiskAdjustedRecommendation:
    """Risk-adjusted trading recommendation."""

    tier: Literal["Strong Buy", "Buy", "Consider", "Pass"]
    win_probability: float  # Calibrated probability
    position_size_pct: float  # Portfolio allocation %
    expected_move_5d: float  # Expected 5-day move %
    expected_move_20d: float  # Expected 20-day move %
    confidence_band: tuple[float, float]  # (lower, upper) bounds
    risk_factors: dict[str, str]  # Risk warnings


class MVMFeatureEnhancer:
    """
    Enhance MVM scores with regime adjustment and risk-aware position sizing.

    Features:
    - VIX regime mapping to 5 volatility regimes
    - Quarter-Kelly position sizing with constraints
    - Liquidity and volatility caps
    - Drawdown-aware throttling
    """

    # VIX regime thresholds
    VIX_REGIMES = {
        "very_low": (0, 15),
        "normal": (15, 20),
        "elevated": (20, 30),
        "high": (30, 45),
        "extreme": (45, float("inf")),
    }

    @classmethod
    def _determine_regime(cls, vix: float) -> str:
        """Determine market regime from VIX level."""
        for regime, (low, high) in cls.VIX_REGIMES.items():
            if low <= vix < high:
                return regime
        return "normal"

    @classmethod
    def _regime_adjustment(cls, base_prob: float, regime: str) -> float:
        """
        Apply regime-specific adjustment to probability.

        Higher volatility regimes widen uncertainty.
        """
        adjustments = {
            "very_low": 1.0,  # No adjustment
            "normal": 1.0,
            "elevated": 0.95,  # Slight dampening
            "high": 0.90,  # More conservative
            "extreme": 0.80,  # Significantly more conservative
        }
        return base_prob * adjustments.get(regime, 1.0)

    @classmethod
    def _quarter_kelly(
        cls,
        p_win: float,
        payoff_ratio: float,
        volatility: float,
        liquidity: float,
        borrow_available: bool,
        portfolio_value: float = 1_000_000,
    ) -> float:
        """
        Calculate Quarter-Kelly position size with constraints.

        Args:
            p_win: Win probability [0, 1]
            payoff_ratio: Expected payoff ratio (gain/loss)
            volatility: Annualized volatility %
            liquidity: Daily average dollar volume
            borrow_available: Can we borrow/short?
            portfolio_value: Total portfolio value in USD

        Returns:
            Position size as % of portfolio
        """
        # Kelly fraction: f = (p * b - q) / b where b = payoff ratio, q = 1-p
        q = 1 - p_win
        if payoff_ratio <= 0:
            return 0.0

        kelly_fraction = (p_win * payoff_ratio - q) / payoff_ratio
        kelly_fraction = max(0.0, kelly_fraction)  # Never negative

        # Quarter-Kelly for safety
        position_fraction = kelly_fraction / 4.0

        # Cap at 8% of portfolio
        position_fraction = min(position_fraction, 0.08)

        # Liquidity constraint: max 10% of ADV
        max_liquidity_pct = (0.10 * liquidity) / portfolio_value
        position_fraction = min(position_fraction, max_liquidity_pct)

        # Volatility dampener: reduce if vol > 50%
        if volatility > 50:
            vol_dampener = 50 / volatility
            position_fraction *= vol_dampener

        # Borrow constraint
        if not borrow_available:
            # Can't go large if we can't borrow to hedge or short
            position_fraction = min(position_fraction, 0.03)

        return float(position_fraction * 100)  # Return as percentage

    @classmethod
    def _drawdown_throttle(cls, position_size: float, current_drawdown: float) -> float:
        """
        Throttle position size based on current drawdown.

        - DD < 10%: Full size
        - DD 10-20%: Linear reduction to 50%
        - DD > 20%: Flatline to 0%

        Args:
            position_size: Base position size %
            current_drawdown: Current drawdown as fraction (positive number)

        Returns:
            Adjusted position size %
        """
        dd = abs(current_drawdown)

        if dd < 0.10:
            return position_size
        elif dd < 0.20:
            # Linear reduction from 100% to 50%
            throttle = 1.0 - 0.5 * (dd - 0.10) / 0.10
            return position_size * throttle
        else:
            # Flatline
            return 0.0

    @classmethod
    def _calculate_tier(cls, win_prob: float, position_size: float) -> str:
        """
        Determine recommendation tier.

        Args:
            win_prob: Win probability
            position_size: Position size %

        Returns:
            Tier: "Strong Buy", "Buy", "Consider", or "Pass"
        """
        if win_prob >= 0.70 and position_size >= 3.0:
            return "Strong Buy"
        elif win_prob >= 0.60 and position_size >= 2.0:
            return "Buy"
        elif win_prob >= 0.55 and position_size >= 1.0:
            return "Consider"
        else:
            return "Pass"

    @classmethod
    def generate_risk_adjusted_recommendation(
        cls,
        score: float,
        volatility: float,
        liquidity: float,
        market_regime: str | None = None,
        beta: float = 1.0,
        borrow_available: bool = True,
        vix: float | None = None,
        current_drawdown: float = 0.0,
        calibrated_prob: float | None = None,
    ) -> dict:
        """
        Generate risk-adjusted recommendation from MVM score.

        Args:
            score: Raw MVM score (0-100)
            volatility: Annualized volatility %
            liquidity: Average daily volume in USD
            market_regime: Optional regime override
            beta: Beta to biotech benchmark
            borrow_available: Can borrow/short?
            vix: VIX level for regime determination
            current_drawdown: Current portfolio drawdown (0.0 = no DD)
            calibrated_prob: Optional pre-calibrated probability

        Returns:
            Dict with tier, win_probability, position_size_pct, expected moves, etc.
        """
        # Determine regime
        if market_regime is None and vix is not None:
            market_regime = cls._determine_regime(vix)
        elif market_regime is None:
            market_regime = "normal"

        # Convert score to probability (simple heuristic if not calibrated)
        if calibrated_prob is not None:
            base_prob = calibrated_prob
        else:
            # Simple sigmoid-like mapping
            base_prob = 1 / (1 + np.exp(-(score - 50) / 15))

        # Apply regime adjustment
        win_prob = cls._regime_adjustment(base_prob, market_regime)

        # Calculate expected moves (simplified model)
        # Higher score + higher vol = larger expected move
        base_move_5d = (score / 100) * volatility * np.sqrt(5 / 252)
        base_move_20d = (score / 100) * volatility * np.sqrt(20 / 252)

        # Payoff ratio (simplified: assume symmetric for now, can be enhanced)
        payoff_ratio = 1.5  # Typical for biotech events

        # Calculate Quarter-Kelly position size
        position_size = cls._quarter_kelly(
            p_win=win_prob,
            payoff_ratio=payoff_ratio,
            volatility=volatility,
            liquidity=liquidity,
            borrow_available=borrow_available,
        )

        # Apply drawdown throttle
        position_size = cls._drawdown_throttle(position_size, current_drawdown)

        # Determine tier
        tier = cls._calculate_tier(win_prob, position_size)

        # Confidence bands (simplified: ±1 std)
        std_5d = volatility * np.sqrt(5 / 252)
        std_20d = volatility * np.sqrt(20 / 252)
        confidence_band_5d = (base_move_5d - std_5d, base_move_5d + std_5d)
        confidence_band_20d = (base_move_20d - std_20d, base_move_20d + std_20d)

        # Risk factors
        risk_factors = {}
        if volatility > 60:
            risk_factors["volatility"] = "High volatility - increased uncertainty"
        if liquidity < 500_000:
            risk_factors["liquidity"] = "Low liquidity - execution risk"
        if not borrow_available:
            risk_factors["borrow"] = "Borrow unavailable - limited hedging"
        if current_drawdown > 0.10:
            risk_factors["drawdown"] = f"Portfolio in drawdown ({current_drawdown:.1%})"
        if market_regime in ["high", "extreme"]:
            risk_factors["regime"] = f"High volatility regime ({market_regime})"

        return {
            "tier": tier,
            "win_probability": float(win_prob),
            "position_size_pct": float(position_size),
            "expected_move_5d": float(base_move_5d),
            "expected_move_20d": float(base_move_20d),
            "confidence_band_5d": tuple(float(x) for x in confidence_band_5d),
            "confidence_band_20d": tuple(float(x) for x in confidence_band_20d),
            "risk_factors": risk_factors,
            "market_regime": market_regime,
            "beta": float(beta),
        }

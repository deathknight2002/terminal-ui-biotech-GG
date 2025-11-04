"""
Quarter-Kelly Position Sizing with Risk Management

Implements Kelly Criterion-based position sizing with biotech-specific
risk constraints including portfolio caps, ADV limits, volatility dampening,
and drawdown throttling.

Key Features:
- Quarter-Kelly position sizing (25% of full Kelly for safety)
- 8% maximum portfolio position cap
- 10% Average Daily Volume (ADV) limits
- Volatility dampening above 50% realized volatility
- Drawdown throttling (linear reduction 10-20%, kill switch at 20%)
- Real-time position adjustment based on market conditions

References:
- Kelly, J. L. (1956). "A New Interpretation of Information Rate"
- Thorp, E. O. (2006). "The Kelly Criterion in Blackjack Sports Betting"
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from dataclasses import dataclass
from typing import Optional, Dict
from datetime import datetime, timedelta
import warnings


@dataclass
class PositionSizingConfig:
    """Configuration for position sizing and risk management"""
    
    # Kelly parameters
    kelly_fraction: float = 0.25  # Quarter-Kelly for safety
    min_win_prob: float = 0.55  # Minimum win probability to take position
    max_loss_pct: float = 0.40  # Maximum loss on single position (40%)
    
    # Portfolio constraints
    max_position_pct: float = 0.08  # 8% maximum per position
    max_total_exposure: float = 1.00  # 100% maximum total exposure
    
    # Liquidity constraints
    max_adv_pct: float = 0.10  # 10% of average daily volume
    min_adv_dollars: float = 100_000  # Minimum daily liquidity
    
    # Volatility constraints
    volatility_threshold: float = 0.50  # 50% annualized volatility threshold
    volatility_dampening_factor: float = 0.5  # Reduce position by 50% above threshold
    
    # Drawdown constraints
    drawdown_alert_pct: float = 0.10  # 10% drawdown starts throttling
    drawdown_critical_pct: float = 0.20  # 20% drawdown triggers kill switch
    drawdown_throttle_slope: float = 5.0  # Throttle factor per % drawdown


@dataclass
class PositionRecommendation:
    """Position sizing recommendation with risk metrics"""
    
    ticker: str
    raw_kelly_pct: float  # Full Kelly recommendation
    adjusted_kelly_pct: float  # Quarter-Kelly
    final_position_pct: float  # After all constraints
    position_dollars: Optional[float] = None
    position_shares: Optional[int] = None
    
    # Constraint impacts
    constraints_applied: list = None
    portfolio_cap_hit: bool = False
    adv_cap_hit: bool = False
    volatility_dampened: bool = False
    drawdown_throttled: bool = False
    kill_switch_active: bool = False
    
    # Risk metrics
    expected_return: float = 0.0
    expected_loss: float = 0.0
    win_probability: float = 0.0
    kelly_edge: float = 0.0
    
    # Reasoning
    recommendation: str = ""
    warnings: list = None
    
    def __post_init__(self):
        if self.constraints_applied is None:
            self.constraints_applied = []
        if self.warnings is None:
            self.warnings = []


class KellyCriterion:
    """
    Kelly Criterion position sizing calculator
    
    The Kelly formula determines optimal position size based on:
    - Win probability (p)
    - Win/loss ratio (b = win_amount / loss_amount)
    
    Formula: f = (p*b - q) / b
    where:
        f = fraction of capital to bet
        p = probability of winning
        q = probability of losing (1 - p)
        b = ratio of win to loss
    """
    
    @staticmethod
    def calculate_kelly_fraction(
        win_prob: float,
        expected_gain_pct: float,
        expected_loss_pct: float
    ) -> float:
        """
        Calculate Kelly fraction for position sizing
        
        Args:
            win_prob: Probability of winning (0 to 1)
            expected_gain_pct: Expected gain if win (e.g., 0.30 for 30%)
            expected_loss_pct: Expected loss if lose (e.g., 0.15 for 15%)
            
        Returns:
            Kelly fraction (can be negative if edge is negative)
        """
        if win_prob <= 0 or win_prob >= 1:
            return 0.0
        
        if expected_loss_pct <= 0:
            return 0.0
        
        lose_prob = 1 - win_prob
        win_loss_ratio = expected_gain_pct / expected_loss_pct
        
        # Kelly formula: f = (p*b - q) / b
        kelly = (win_prob * win_loss_ratio - lose_prob) / win_loss_ratio
        
        return max(0.0, kelly)  # Don't allow negative positions
    
    @staticmethod
    def calculate_kelly_edge(
        win_prob: float,
        expected_gain_pct: float,
        expected_loss_pct: float
    ) -> float:
        """
        Calculate Kelly edge (expected value)
        
        Args:
            win_prob: Probability of winning
            expected_gain_pct: Expected gain if win
            expected_loss_pct: Expected loss if lose
            
        Returns:
            Expected value of the bet
        """
        lose_prob = 1 - win_prob
        return win_prob * expected_gain_pct - lose_prob * expected_loss_pct


class PositionSizer:
    """
    Complete position sizing system with all constraints
    """
    
    def __init__(self, config: Optional[PositionSizingConfig] = None):
        self.config = config or PositionSizingConfig()
        self.current_drawdown: float = 0.0  # Track portfolio drawdown
        self.portfolio_value: float = 1_000_000  # Default portfolio value
        self.current_positions: Dict[str, float] = {}  # ticker -> position_pct
    
    def set_portfolio_state(
        self,
        portfolio_value: float,
        current_drawdown: float,
        current_positions: Optional[Dict[str, float]] = None
    ) -> None:
        """
        Update portfolio state for position sizing
        
        Args:
            portfolio_value: Total portfolio value in dollars
            current_drawdown: Current drawdown as decimal (e.g., 0.15 for 15%)
            current_positions: Dict of ticker -> position_pct
        """
        self.portfolio_value = portfolio_value
        self.current_drawdown = abs(current_drawdown)
        self.current_positions = current_positions or {}
    
    def calculate_position(
        self,
        ticker: str,
        win_prob: float,
        expected_gain_pct: float,
        expected_loss_pct: float,
        current_price: float,
        avg_daily_volume: float,
        realized_volatility: Optional[float] = None
    ) -> PositionRecommendation:
        """
        Calculate position size with all constraints
        
        Args:
            ticker: Stock ticker
            win_prob: Probability of successful outcome (0-1)
            expected_gain_pct: Expected gain if successful (e.g., 0.35 for 35%)
            expected_loss_pct: Expected loss if unsuccessful (e.g., 0.15 for 15%)
            current_price: Current stock price
            avg_daily_volume: Average daily trading volume in shares
            realized_volatility: Annualized realized volatility (optional)
            
        Returns:
            PositionRecommendation object
        """
        # Initialize recommendation
        rec = PositionRecommendation(
            ticker=ticker,
            raw_kelly_pct=0.0,
            adjusted_kelly_pct=0.0,
            final_position_pct=0.0,
            win_probability=win_prob,
            expected_return=win_prob * expected_gain_pct - (1 - win_prob) * expected_loss_pct,
            expected_loss=expected_loss_pct
        )
        
        # Check minimum win probability
        if win_prob < self.config.min_win_prob:
            rec.recommendation = f"SKIP - Win probability {win_prob:.1%} below minimum {self.config.min_win_prob:.1%}"
            rec.warnings.append(f"Insufficient edge: {win_prob:.1%} win probability")
            return rec
        
        # Calculate raw Kelly fraction
        raw_kelly = KellyCriterion.calculate_kelly_fraction(
            win_prob, expected_gain_pct, expected_loss_pct
        )
        rec.raw_kelly_pct = raw_kelly
        rec.kelly_edge = KellyCriterion.calculate_kelly_edge(
            win_prob, expected_gain_pct, expected_loss_pct
        )
        
        if raw_kelly <= 0:
            rec.recommendation = "SKIP - No positive Kelly edge"
            rec.warnings.append("Negative or zero Kelly fraction")
            return rec
        
        # Apply Kelly fraction (quarter-Kelly for safety)
        adjusted_kelly = raw_kelly * self.config.kelly_fraction
        rec.adjusted_kelly_pct = adjusted_kelly
        rec.constraints_applied.append(f"Quarter-Kelly: {raw_kelly:.1%} → {adjusted_kelly:.1%}")
        
        # Start with adjusted Kelly
        position_pct = adjusted_kelly
        
        # Apply portfolio cap constraint
        if position_pct > self.config.max_position_pct:
            rec.portfolio_cap_hit = True
            rec.constraints_applied.append(
                f"Portfolio cap: {position_pct:.1%} → {self.config.max_position_pct:.1%}"
            )
            position_pct = self.config.max_position_pct
        
        # Apply ADV constraint
        adv_dollars = avg_daily_volume * current_price
        if adv_dollars < self.config.min_adv_dollars:
            rec.recommendation = f"SKIP - Insufficient liquidity (${adv_dollars:,.0f} ADV)"
            rec.warnings.append(f"ADV ${adv_dollars:,.0f} below minimum ${self.config.min_adv_dollars:,.0f}")
            rec.final_position_pct = 0.0
            return rec
        
        max_position_by_adv = (adv_dollars * self.config.max_adv_pct) / self.portfolio_value
        if position_pct > max_position_by_adv:
            rec.adv_cap_hit = True
            rec.constraints_applied.append(
                f"ADV limit: {position_pct:.1%} → {max_position_by_adv:.1%}"
            )
            position_pct = max_position_by_adv
        
        # Apply volatility dampening
        if realized_volatility is not None and realized_volatility > self.config.volatility_threshold:
            dampening = self.config.volatility_dampening_factor
            original_position = position_pct
            position_pct *= dampening
            rec.volatility_dampened = True
            rec.constraints_applied.append(
                f"Volatility dampening ({realized_volatility:.0%}): {original_position:.1%} → {position_pct:.1%}"
            )
            rec.warnings.append(f"High volatility: {realized_volatility:.0%}")
        
        # Apply drawdown throttling
        if self.current_drawdown >= self.config.drawdown_critical_pct:
            # Kill switch activated
            rec.kill_switch_active = True
            rec.final_position_pct = 0.0
            rec.recommendation = f"KILL SWITCH - Portfolio drawdown {self.current_drawdown:.1%} exceeds {self.config.drawdown_critical_pct:.1%}"
            rec.warnings.append("CRITICAL: Kill switch activated")
            return rec
        
        elif self.current_drawdown >= self.config.drawdown_alert_pct:
            # Linear throttling between alert and critical levels
            drawdown_excess = self.current_drawdown - self.config.drawdown_alert_pct
            throttle_range = self.config.drawdown_critical_pct - self.config.drawdown_alert_pct
            throttle_factor = 1.0 - (drawdown_excess / throttle_range) * (1.0 / self.config.drawdown_throttle_slope)
            throttle_factor = max(0.0, min(1.0, throttle_factor))
            
            original_position = position_pct
            position_pct *= throttle_factor
            rec.drawdown_throttled = True
            rec.constraints_applied.append(
                f"Drawdown throttling ({self.current_drawdown:.1%}): {original_position:.1%} → {position_pct:.1%}"
            )
            rec.warnings.append(f"Portfolio drawdown: {self.current_drawdown:.1%}")
        
        # Check total exposure constraint
        current_exposure = sum(self.current_positions.values())
        available_exposure = self.config.max_total_exposure - current_exposure
        if position_pct > available_exposure:
            rec.constraints_applied.append(
                f"Total exposure limit: {position_pct:.1%} → {available_exposure:.1%}"
            )
            position_pct = max(0.0, available_exposure)
            rec.warnings.append(f"Limited by total exposure: {current_exposure:.1%}")
        
        # Calculate position in dollars and shares
        rec.final_position_pct = position_pct
        rec.position_dollars = position_pct * self.portfolio_value
        rec.position_shares = int(rec.position_dollars / current_price) if current_price > 0 else 0
        
        # Generate recommendation
        if position_pct >= 0.05:
            rec.recommendation = f"BUY {position_pct:.1%} (${rec.position_dollars:,.0f} / ~{rec.position_shares:,} shares)"
        elif position_pct > 0:
            rec.recommendation = f"SMALL POSITION {position_pct:.1%} (${rec.position_dollars:,.0f})"
        else:
            rec.recommendation = "SKIP - Position size reduced to zero by constraints"
        
        return rec
    
    def batch_position_sizing(
        self,
        candidates: pd.DataFrame
    ) -> pd.DataFrame:
        """
        Calculate positions for multiple candidates
        
        Args:
            candidates: DataFrame with columns:
                - ticker
                - win_prob
                - expected_gain_pct
                - expected_loss_pct
                - current_price
                - avg_daily_volume
                - realized_volatility (optional)
        
        Returns:
            DataFrame with position recommendations
        """
        results = []
        
        for _, row in candidates.iterrows():
            rec = self.calculate_position(
                ticker=row['ticker'],
                win_prob=row['win_prob'],
                expected_gain_pct=row['expected_gain_pct'],
                expected_loss_pct=row['expected_loss_pct'],
                current_price=row['current_price'],
                avg_daily_volume=row['avg_daily_volume'],
                realized_volatility=row.get('realized_volatility')
            )
            
            results.append({
                'ticker': rec.ticker,
                'final_position_pct': rec.final_position_pct,
                'position_dollars': rec.position_dollars,
                'position_shares': rec.position_shares,
                'recommendation': rec.recommendation,
                'kelly_edge': rec.kelly_edge,
                'constraints': ', '.join(rec.constraints_applied),
                'warnings': ', '.join(rec.warnings) if rec.warnings else '',
            })
        
        return pd.DataFrame(results)


# Example usage and testing
if __name__ == "__main__":
    print("=" * 80)
    print("Quarter-Kelly Position Sizing Demo")
    print("=" * 80)
    
    # Initialize position sizer
    config = PositionSizingConfig(
        kelly_fraction=0.25,  # Quarter-Kelly
        max_position_pct=0.08,  # 8% cap
        max_adv_pct=0.10,  # 10% ADV
        volatility_threshold=0.50,  # 50% vol
        drawdown_alert_pct=0.10,  # 10% drawdown alert
        drawdown_critical_pct=0.20  # 20% kill switch
    )
    
    sizer = PositionSizer(config)
    sizer.set_portfolio_state(
        portfolio_value=1_000_000,
        current_drawdown=0.08,  # 8% current drawdown
        current_positions={'EXISTING': 0.15}  # 15% in existing positions
    )
    
    print(f"\n📊 Portfolio State")
    print(f"  Value: ${sizer.portfolio_value:,.0f}")
    print(f"  Drawdown: {sizer.current_drawdown:.1%}")
    print(f"  Current exposure: {sum(sizer.current_positions.values()):.1%}")
    print("\n" + "-" * 80)
    
    # Example candidates
    candidates = pd.DataFrame([
        {
            'ticker': 'CELC',
            'win_prob': 0.85,
            'expected_gain_pct': 0.35,
            'expected_loss_pct': 0.15,
            'current_price': 50.0,
            'avg_daily_volume': 500_000,
            'realized_volatility': 0.45
        },
        {
            'ticker': 'SPRB',
            'win_prob': 0.90,
            'expected_gain_pct': 0.60,
            'expected_loss_pct': 0.20,
            'current_price': 5.0,
            'avg_daily_volume': 100_000,
            'realized_volatility': 0.80  # High volatility
        },
        {
            'ticker': 'INBX',
            'win_prob': 0.75,
            'expected_gain_pct': 0.40,
            'expected_loss_pct': 0.18,
            'current_price': 30.0,
            'avg_daily_volume': 200_000,
            'realized_volatility': 0.35
        },
        {
            'ticker': 'ILLIQUID',
            'win_prob': 0.80,
            'expected_gain_pct': 0.50,
            'expected_loss_pct': 0.20,
            'current_price': 20.0,
            'avg_daily_volume': 2_000,  # Very low volume
            'realized_volatility': 0.40
        },
    ])
    
    print("\n🎯 Position Sizing Results")
    print("=" * 80)
    
    for _, candidate in candidates.iterrows():
        rec = sizer.calculate_position(
            ticker=candidate['ticker'],
            win_prob=candidate['win_prob'],
            expected_gain_pct=candidate['expected_gain_pct'],
            expected_loss_pct=candidate['expected_loss_pct'],
            current_price=candidate['current_price'],
            avg_daily_volume=candidate['avg_daily_volume'],
            realized_volatility=candidate['realized_volatility']
        )
        
        print(f"\n{rec.ticker}")
        print(f"  Win Prob: {rec.win_probability:.1%} | Kelly Edge: {rec.kelly_edge:.1%}")
        print(f"  Raw Kelly: {rec.raw_kelly_pct:.2%} → Quarter-Kelly: {rec.adjusted_kelly_pct:.2%}")
        if rec.position_dollars is not None:
            print(f"  Final Position: {rec.final_position_pct:.2%} (${rec.position_dollars:,.0f})")
        else:
            print(f"  Final Position: {rec.final_position_pct:.2%}")
        print(f"  {rec.recommendation}")
        
        if rec.constraints_applied:
            print(f"  Constraints:")
            for constraint in rec.constraints_applied:
                print(f"    - {constraint}")
        
        if rec.warnings:
            print(f"  ⚠️  Warnings:")
            for warning in rec.warnings:
                print(f"    - {warning}")
    
    # Test drawdown throttling
    print("\n" + "=" * 80)
    print("🔴 DRAWDOWN THROTTLING TEST")
    print("=" * 80)
    
    for dd in [0.05, 0.10, 0.15, 0.20, 0.25]:
        sizer.set_portfolio_state(
            portfolio_value=1_000_000,
            current_drawdown=dd,
            current_positions={}
        )
        
        rec = sizer.calculate_position(
            ticker='TEST',
            win_prob=0.80,
            expected_gain_pct=0.40,
            expected_loss_pct=0.20,
            current_price=50.0,
            avg_daily_volume=500_000,
            realized_volatility=0.40
        )
        
        status = "🔴 KILL SWITCH" if rec.kill_switch_active else "⚠️  THROTTLED" if rec.drawdown_throttled else "✅ NORMAL"
        print(f"{dd:.0%} drawdown: {rec.final_position_pct:.2%} position | {status}")
    
    print("\n" + "=" * 80)
    print("✅ Position sizing demo complete!")
    print("=" * 80)

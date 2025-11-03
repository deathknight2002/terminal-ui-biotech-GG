"""
Position sizing and risk management functions.

Implements Quarter-Kelly, drawdown throttling, and constraint-based sizing.
"""

from __future__ import annotations


def quarter_kelly(
    p_win: float,
    payoff_ratio: float,
    vol: float,
    adv_usd: float,
    borrow_ok: bool,
    caps: dict[str, float] | None = None,
) -> float:
    """
    Calculate Quarter-Kelly position size with constraints.

    Args:
        p_win: Win probability [0, 1]
        payoff_ratio: Expected gain/loss ratio
        vol: Annualized volatility as decimal (e.g., 0.35 = 35%)
        adv_usd: Average daily volume in USD
        borrow_ok: Whether borrowing/shorting is available
        caps: Optional dict with 'portfolio_pct' and 'adv_pct' caps

    Returns:
        Position size as fraction of portfolio [0, 1]
    """
    if caps is None:
        caps = {"portfolio_pct": 0.08, "adv_pct": 0.10}

    # Kelly fraction
    q = 1 - p_win
    if payoff_ratio <= 0:
        return 0.0

    kelly = (p_win * payoff_ratio - q) / payoff_ratio
    kelly = max(0.0, kelly)

    # Quarter-Kelly
    size = kelly / 4.0

    # Cap at portfolio %
    size = min(size, caps["portfolio_pct"])

    # Liquidity cap (assume $1M portfolio for scaling)
    portfolio_value = 1_000_000
    max_liquidity = (caps["adv_pct"] * adv_usd) / portfolio_value
    size = min(size, max_liquidity)

    # Volatility dampener
    if vol > 0.50:
        vol_dampener = 0.50 / vol
        size *= vol_dampener

    # Borrow constraint
    if not borrow_ok:
        size = min(size, 0.03)  # Max 3% if can't borrow

    return float(size)


def throttle_by_drawdown(position: float, current_dd: float) -> float:
    """
    Throttle position size based on current drawdown.

    - DD < 10%: Full size
    - DD 10-20%: Linear reduction to 50%
    - DD > 20%: Flatline to 0%

    Args:
        position: Base position size as fraction [0, 1]
        current_dd: Current drawdown as positive fraction

    Returns:
        Throttled position size as fraction
    """
    dd = abs(current_dd)

    if dd < 0.10:
        return position
    elif dd < 0.20:
        # Linear reduction
        throttle = 1.0 - 0.5 * (dd - 0.10) / 0.10
        return position * throttle
    else:
        # Flatline
        return 0.0


def calculate_position_size(
    p_win: float,
    expected_return: float,
    volatility: float,
    liquidity: float,
    borrow_available: bool = True,
    current_drawdown: float = 0.0,
    max_portfolio_pct: float = 0.08,
    max_adv_pct: float = 0.10,
) -> dict[str, float]:
    """
    Calculate risk-adjusted position size with full constraints.

    Args:
        p_win: Win probability
        expected_return: Expected return as fraction
        volatility: Annualized volatility as fraction
        liquidity: Average daily volume in USD
        borrow_available: Borrow/short availability
        current_drawdown: Current portfolio drawdown
        max_portfolio_pct: Max % of portfolio
        max_adv_pct: Max % of average daily volume

    Returns:
        Dict with position_size, constraints_applied, and risk_factors
    """
    # Calculate payoff ratio from expected return
    # Simplified: assume symmetric risk for now
    payoff_ratio = abs(expected_return / 0.20) if expected_return != 0 else 1.0

    # Base Quarter-Kelly
    caps = {"portfolio_pct": max_portfolio_pct, "adv_pct": max_adv_pct}
    base_size = quarter_kelly(p_win, payoff_ratio, volatility, liquidity, borrow_available, caps)

    # Apply drawdown throttle
    throttled_size = throttle_by_drawdown(base_size, current_drawdown)

    # Track constraints
    constraints_applied = []
    if throttled_size < base_size:
        constraints_applied.append("drawdown_throttle")
    if not borrow_available:
        constraints_applied.append("no_borrow")
    if volatility > 0.50:
        constraints_applied.append("high_volatility")

    risk_factors = {}
    if volatility > 0.60:
        risk_factors["volatility"] = "extreme"
    elif volatility > 0.50:
        risk_factors["volatility"] = "high"
    if liquidity < 500_000:
        risk_factors["liquidity"] = "low"
    if current_drawdown > 0.10:
        risk_factors["drawdown"] = f"{current_drawdown:.1%}"

    return {
        "position_size": float(throttled_size),
        "position_size_pct": float(throttled_size * 100),
        "base_size": float(base_size),
        "constraints_applied": constraints_applied,
        "risk_factors": risk_factors,
    }

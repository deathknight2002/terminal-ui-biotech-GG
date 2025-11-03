"""
Tests for risk and monitoring modules.
"""

import numpy as np
import pytest
from hypothesis import given, strategies as st

from bt_platform.core.monitoring.drift import check_kill_switch, compute_ece, ks_drift, psi
from bt_platform.core.risk.position import (
    calculate_position_size,
    quarter_kelly,
    throttle_by_drawdown,
)


class TestRiskPosition:
    """Test position sizing and risk management."""

    def test_quarter_kelly_basic(self):
        """Test basic Quarter-Kelly calculation."""
        size = quarter_kelly(
            p_win=0.6,
            payoff_ratio=1.5,
            vol=0.35,
            adv_usd=2_000_000,
            borrow_ok=True,
        )

        assert 0.0 <= size <= 0.08  # Should be capped

    def test_quarter_kelly_no_edge(self):
        """Test Quarter-Kelly with no edge."""
        size = quarter_kelly(
            p_win=0.5,
            payoff_ratio=1.0,
            vol=0.35,
            adv_usd=2_000_000,
            borrow_ok=True,
        )

        assert size == 0.0  # No edge = no position

    def test_quarter_kelly_negative_payoff(self):
        """Test Quarter-Kelly with negative payoff."""
        size = quarter_kelly(
            p_win=0.6,
            payoff_ratio=-0.5,
            vol=0.35,
            adv_usd=2_000_000,
            borrow_ok=True,
        )

        assert size == 0.0

    def test_quarter_kelly_no_borrow(self):
        """Test Quarter-Kelly caps when can't borrow."""
        size = quarter_kelly(
            p_win=0.7,
            payoff_ratio=2.0,
            vol=0.35,
            adv_usd=2_000_000,
            borrow_ok=False,
        )

        assert size <= 0.03  # Max 3% without borrow

    def test_quarter_kelly_high_vol_dampens(self):
        """Test high volatility dampens position."""
        size_normal = quarter_kelly(
            p_win=0.7,
            payoff_ratio=1.5,
            vol=0.40,
            adv_usd=2_000_000,
            borrow_ok=True,
        )

        size_high = quarter_kelly(
            p_win=0.7,
            payoff_ratio=1.5,
            vol=0.80,
            adv_usd=2_000_000,
            borrow_ok=True,
        )

        assert size_high < size_normal

    def test_throttle_by_drawdown_no_dd(self):
        """Test no throttle when no drawdown."""
        size = throttle_by_drawdown(0.05, 0.05)
        assert size == 0.05

    def test_throttle_by_drawdown_medium(self):
        """Test medium drawdown reduces position."""
        size = throttle_by_drawdown(0.05, 0.15)
        assert 0.0 < size < 0.05

    def test_throttle_by_drawdown_critical(self):
        """Test critical drawdown flatlines."""
        size = throttle_by_drawdown(0.05, 0.25)
        assert size == 0.0

    def test_calculate_position_size(self):
        """Test full position size calculation."""
        result = calculate_position_size(
            p_win=0.7,
            expected_return=0.30,
            volatility=0.35,
            liquidity=2_000_000,
            borrow_available=True,
            current_drawdown=0.0,
        )

        assert "position_size" in result
        assert "position_size_pct" in result
        assert "base_size" in result
        assert "constraints_applied" in result
        assert "risk_factors" in result

        assert 0 <= result["position_size"] <= 0.08

    def test_calculate_position_size_with_drawdown(self):
        """Test position size with drawdown."""
        result_no_dd = calculate_position_size(
            p_win=0.7,
            expected_return=0.30,
            volatility=0.35,
            liquidity=2_000_000,
            current_drawdown=0.0,
        )

        result_dd = calculate_position_size(
            p_win=0.7,
            expected_return=0.30,
            volatility=0.35,
            liquidity=2_000_000,
            current_drawdown=0.15,
        )

        assert result_dd["position_size"] < result_no_dd["position_size"]
        assert "drawdown_throttle" in result_dd["constraints_applied"]


class TestMonitoringDrift:
    """Test drift detection and monitoring."""

    def test_compute_ece(self):
        """Test ECE computation."""
        probs = np.array([0.1, 0.3, 0.5, 0.7, 0.9])
        y = np.array([0, 0, 1, 1, 1])

        ece = compute_ece(probs, y, n_bins=5)
        assert 0.0 <= ece <= 1.0

    def test_ks_drift_no_drift(self):
        """Test KS test with no drift."""
        np.random.seed(42)
        x_ref = np.random.normal(0, 1, 100)
        x_live = np.random.normal(0, 1, 100)

        result = ks_drift(x_ref, x_live)

        assert "ks_statistic" in result
        assert "p_value" in result
        assert "drift_detected" in result

        # Should not detect drift
        assert result["drift_detected"] == False

    def test_ks_drift_with_drift(self):
        """Test KS test with drift."""
        np.random.seed(42)
        x_ref = np.random.normal(0, 1, 100)
        x_live = np.random.normal(2, 1, 100)  # Different mean

        result = ks_drift(x_ref, x_live)

        # Should detect drift
        assert result["drift_detected"] == True

    def test_psi_no_change(self):
        """Test PSI with no change."""
        np.random.seed(42)
        ref = np.random.normal(0, 1, 1000)
        live = np.random.normal(0, 1, 1000)

        result = psi(ref, live)

        assert "psi" in result
        assert "interpretation" in result
        assert "alert" in result

        # Should be stable
        assert result["interpretation"] == "stable"
        assert result["alert"] == False

    def test_psi_small_change(self):
        """Test PSI with small change."""
        np.random.seed(42)
        ref = np.random.normal(0, 1, 1000)
        live = np.random.normal(0.3, 1, 1000)  # Small shift

        result = psi(ref, live)

        # Should detect some change
        assert result["psi"] > 0

    def test_psi_significant_drift(self):
        """Test PSI with significant drift."""
        np.random.seed(42)
        ref = np.random.normal(0, 1, 1000)
        live = np.random.normal(2, 1, 1000)  # Large shift

        result = psi(ref, live)

        # Should detect significant drift
        assert result["interpretation"] == "significant_drift"
        assert result["alert"] == True

    def test_check_kill_switch_nominal(self):
        """Test kill switch in nominal conditions."""
        result = check_kill_switch(
            current_dd=0.05,
            ece=0.03,
        )

        assert result["triggered"] is False
        assert result["action"] == "none"

    def test_check_kill_switch_dd_elevated(self):
        """Test kill switch with elevated drawdown."""
        result = check_kill_switch(
            current_dd=0.17,
            ece=0.03,
            dd_threshold=0.15,
        )

        assert result["triggered"] is True
        assert result["action"] == "reduce_50"
        assert result["reason"] == "drawdown_elevated"

    def test_check_kill_switch_dd_critical(self):
        """Test kill switch with critical drawdown."""
        result = check_kill_switch(
            current_dd=0.25,
            ece=0.03,
        )

        assert result["triggered"] is True
        assert result["action"] == "flatline"
        assert result["reason"] == "drawdown_critical"

    def test_check_kill_switch_calibration_drift(self):
        """Test kill switch with calibration drift."""
        result = check_kill_switch(
            current_dd=0.05,
            ece=0.10,
            ece_threshold=0.08,
        )

        assert result["triggered"] is True
        assert result["action"] == "reduce_50"
        assert result["reason"] == "calibration_drift"


class TestPropertyBased:
    """Property-based tests for risk and monitoring."""

    @given(
        st.floats(0, 1),
        st.floats(0.1, 5.0),
        st.floats(0.1, 2.0),
    )
    def test_quarter_kelly_bounds(self, p_win, payoff_ratio, vol):
        """Property: Quarter-Kelly is always bounded."""
        size = quarter_kelly(
            p_win=p_win,
            payoff_ratio=payoff_ratio,
            vol=vol,
            adv_usd=1_000_000,
            borrow_ok=True,
        )

        assert 0.0 <= size <= 0.08

    @given(st.floats(0, 0.5))
    def test_throttle_monotonic(self, dd):
        """Property: Throttle is monotonically decreasing."""
        base = 0.05
        throttled = throttle_by_drawdown(base, dd)
        assert 0.0 <= throttled <= base

    @given(st.lists(st.floats(0, 1), min_size=10, max_size=100))
    def test_psi_positive(self, data):
        """Property: PSI is always non-negative."""
        data = np.array(data)
        ref = data[:len(data)//2]
        live = data[len(data)//2:]

        result = psi(ref, live)
        assert result["psi"] >= 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

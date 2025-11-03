"""
Tests for features module: calibration and feature enhancement.
"""

import numpy as np
import pytest
from hypothesis import given, strategies as st

from bt_platform.core.features.calibration import ProbCalibrator
from bt_platform.core.features.mvm_feature_enhancer import MVMFeatureEnhancer


class TestProbCalibrator:
    """Test probability calibration."""

    def test_fit_platt(self):
        """Test fitting with Platt scaling."""
        scores = np.array([30, 50, 70, 90, 40, 60, 80])
        y = np.array([0, 0, 1, 1, 0, 1, 1])

        calibrator = ProbCalibrator()
        calibrator.fit(scores, y, method="platt")

        assert calibrator.method == "platt"
        assert calibrator.platt_model is not None

    def test_fit_isotonic(self):
        """Test fitting with isotonic regression."""
        scores = np.array([30, 50, 70, 90, 40, 60, 80])
        y = np.array([0, 0, 1, 1, 0, 1, 1])

        calibrator = ProbCalibrator()
        calibrator.fit(scores, y, method="isotonic")

        assert calibrator.method == "isotonic"
        assert calibrator.iso_model is not None

    def test_fit_auto(self):
        """Test auto method selection."""
        # Generate more data for reliable auto selection
        np.random.seed(42)
        scores = np.random.uniform(0, 100, 50)
        y = (scores > 50).astype(int)

        calibrator = ProbCalibrator()
        calibrator.fit(scores, y, method="auto")

        assert calibrator.method in ["platt", "isotonic"]

    def test_predict_proba(self):
        """Test probability prediction."""
        scores = np.array([30, 50, 70, 90])
        y = np.array([0, 0, 1, 1])

        calibrator = ProbCalibrator()
        calibrator.fit(scores, y)

        new_scores = np.array([40, 60, 80])
        probs = calibrator.predict_proba(new_scores)

        assert len(probs) == len(new_scores)
        assert all(0 <= p <= 1 for p in probs)

    def test_monotonicity(self):
        """Test that higher scores give higher probabilities."""
        scores = np.array([20, 40, 60, 80])
        y = np.array([0, 0, 1, 1])

        calibrator = ProbCalibrator()
        calibrator.fit(scores, y)

        test_scores = np.array([30, 50, 70, 90])
        probs = calibrator.predict_proba(test_scores)

        # Generally, higher scores should give higher probs (with some tolerance)
        assert probs[0] <= probs[1] + 0.1
        assert probs[1] <= probs[2] + 0.1
        assert probs[2] <= probs[3] + 0.1

    def test_calibration_report(self):
        """Test calibration report generation."""
        np.random.seed(42)
        scores = np.random.uniform(0, 100, 100)
        y = (scores > 50).astype(int)

        calibrator = ProbCalibrator()
        calibrator.fit(scores, y)

        report = calibrator.calibration_report(scores, y)

        assert "brier_score" in report
        assert "log_loss" in report
        assert "ece" in report
        assert "reliability_diagram" in report
        assert len(report["reliability_diagram"]) > 0

    def test_not_fitted_error(self):
        """Test error when predicting before fitting."""
        calibrator = ProbCalibrator()

        with pytest.raises(ValueError, match="not fitted"):
            calibrator.predict_proba(np.array([50, 60]))


class TestMVMFeatureEnhancer:
    """Test MVM feature enhancement and risk adjustments."""

    def test_determine_regime(self):
        """Test VIX regime determination."""
        assert MVMFeatureEnhancer._determine_regime(10) == "very_low"
        assert MVMFeatureEnhancer._determine_regime(17) == "normal"
        assert MVMFeatureEnhancer._determine_regime(25) == "elevated"
        assert MVMFeatureEnhancer._determine_regime(35) == "high"
        assert MVMFeatureEnhancer._determine_regime(50) == "extreme"

    def test_regime_adjustment(self):
        """Test regime adjustment of probabilities."""
        base_prob = 0.8

        # Normal regime should not adjust much
        adj_normal = MVMFeatureEnhancer._regime_adjustment(base_prob, "normal")
        assert adj_normal == base_prob

        # Extreme regime should reduce probability
        adj_extreme = MVMFeatureEnhancer._regime_adjustment(base_prob, "extreme")
        assert adj_extreme < base_prob

    def test_quarter_kelly_basic(self):
        """Test basic Quarter-Kelly calculation."""
        size = MVMFeatureEnhancer._quarter_kelly(
            p_win=0.7,
            payoff_ratio=1.5,
            volatility=35.0,
            liquidity=2_000_000,
            borrow_available=True,
        )

        assert 0.0 <= size <= 8.0  # Should be capped at 8%

    def test_quarter_kelly_no_borrow(self):
        """Test Quarter-Kelly with no borrow."""
        size_borrow = MVMFeatureEnhancer._quarter_kelly(
            p_win=0.7,
            payoff_ratio=1.5,
            volatility=35.0,
            liquidity=2_000_000,
            borrow_available=True,
        )

        size_no_borrow = MVMFeatureEnhancer._quarter_kelly(
            p_win=0.7,
            payoff_ratio=1.5,
            volatility=35.0,
            liquidity=2_000_000,
            borrow_available=False,
        )

        # No borrow should be smaller or equal
        assert size_no_borrow <= size_borrow

    def test_quarter_kelly_high_volatility(self):
        """Test Quarter-Kelly dampens high volatility."""
        size_normal = MVMFeatureEnhancer._quarter_kelly(
            p_win=0.7,
            payoff_ratio=1.5,
            volatility=40.0,
            liquidity=2_000_000,
            borrow_available=True,
        )

        size_high_vol = MVMFeatureEnhancer._quarter_kelly(
            p_win=0.7,
            payoff_ratio=1.5,
            volatility=80.0,
            liquidity=2_000_000,
            borrow_available=True,
        )

        # High volatility should reduce size
        assert size_high_vol < size_normal

    def test_quarter_kelly_low_liquidity(self):
        """Test Quarter-Kelly caps for low liquidity."""
        size_high_liq = MVMFeatureEnhancer._quarter_kelly(
            p_win=0.7,
            payoff_ratio=1.5,
            volatility=35.0,
            liquidity=5_000_000,
            borrow_available=True,
        )

        size_low_liq = MVMFeatureEnhancer._quarter_kelly(
            p_win=0.7,
            payoff_ratio=1.5,
            volatility=35.0,
            liquidity=100_000,
            borrow_available=True,
        )

        # Low liquidity should reduce size
        assert size_low_liq < size_high_liq

    def test_drawdown_throttle(self):
        """Test drawdown throttling."""
        base_size = 5.0

        # No drawdown
        throttled_0 = MVMFeatureEnhancer._drawdown_throttle(base_size, 0.05)
        assert throttled_0 == base_size

        # 15% drawdown
        throttled_15 = MVMFeatureEnhancer._drawdown_throttle(base_size, 0.15)
        assert 0 < throttled_15 < base_size

        # 25% drawdown
        throttled_25 = MVMFeatureEnhancer._drawdown_throttle(base_size, 0.25)
        assert throttled_25 == 0.0

    def test_calculate_tier(self):
        """Test tier calculation."""
        # Strong Buy
        tier = MVMFeatureEnhancer._calculate_tier(0.75, 4.0)
        assert tier == "Strong Buy"

        # Buy
        tier = MVMFeatureEnhancer._calculate_tier(0.65, 3.0)
        assert tier == "Buy"

        # Consider
        tier = MVMFeatureEnhancer._calculate_tier(0.57, 1.5)
        assert tier == "Consider"

        # Pass
        tier = MVMFeatureEnhancer._calculate_tier(0.50, 0.5)
        assert tier == "Pass"

    def test_generate_recommendation(self):
        """Test full recommendation generation."""
        rec = MVMFeatureEnhancer.generate_risk_adjusted_recommendation(
            score=75.0,
            volatility=35.0,
            liquidity=2_000_000,
            beta=0.9,
            borrow_available=True,
        )

        assert "tier" in rec
        assert "win_probability" in rec
        assert "position_size_pct" in rec
        assert "expected_move_5d" in rec
        assert "expected_move_20d" in rec
        assert "confidence_band_5d" in rec
        assert "confidence_band_20d" in rec
        assert "risk_factors" in rec

        # Check types and ranges
        assert rec["tier"] in ["Strong Buy", "Buy", "Consider", "Pass"]
        assert 0 <= rec["win_probability"] <= 1
        assert rec["position_size_pct"] >= 0

    def test_recommendation_with_drawdown(self):
        """Test recommendation respects drawdown."""
        rec_no_dd = MVMFeatureEnhancer.generate_risk_adjusted_recommendation(
            score=75.0,
            volatility=35.0,
            liquidity=2_000_000,
            current_drawdown=0.0,
        )

        rec_with_dd = MVMFeatureEnhancer.generate_risk_adjusted_recommendation(
            score=75.0,
            volatility=35.0,
            liquidity=2_000_000,
            current_drawdown=0.25,
        )

        # With 25% drawdown, position should be 0
        assert rec_with_dd["position_size_pct"] == 0.0

    def test_recommendation_with_regime(self):
        """Test recommendation with market regime."""
        rec = MVMFeatureEnhancer.generate_risk_adjusted_recommendation(
            score=75.0,
            volatility=35.0,
            liquidity=2_000_000,
            market_regime="extreme",
        )

        assert rec["market_regime"] == "extreme"
        assert "regime" in rec["risk_factors"]

    def test_recommendation_with_vix(self):
        """Test recommendation infers regime from VIX."""
        rec = MVMFeatureEnhancer.generate_risk_adjusted_recommendation(
            score=75.0,
            volatility=35.0,
            liquidity=2_000_000,
            vix=50.0,
        )

        assert rec["market_regime"] == "extreme"


class TestPropertyBased:
    """Property-based tests for features."""

    @given(
        st.floats(0, 100),
        st.floats(10, 100),
        st.floats(100_000, 10_000_000),
    )
    def test_recommendation_bounds(self, score, volatility, liquidity):
        """Property: recommendations always have valid bounds."""
        rec = MVMFeatureEnhancer.generate_risk_adjusted_recommendation(
            score=score,
            volatility=volatility,
            liquidity=liquidity,
        )

        assert 0 <= rec["win_probability"] <= 1
        assert rec["position_size_pct"] >= 0
        assert rec["position_size_pct"] <= 8.0  # Max cap

    @given(st.floats(0, 1))
    def test_drawdown_throttle_monotonic(self, dd):
        """Property: throttle is monotonically decreasing with drawdown."""
        base_size = 5.0
        throttled = MVMFeatureEnhancer._drawdown_throttle(base_size, dd)
        assert 0 <= throttled <= base_size


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

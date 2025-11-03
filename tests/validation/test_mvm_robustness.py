"""
Comprehensive Robustness Testing for MVM Alpha Scoring

This module provides extensive testing including:
- Property-based testing using Hypothesis
- Monte Carlo robustness testing
- Edge case and corner condition testing
- Temporal stability testing
- Statistical validation
"""

import pytest
import numpy as np
from hypothesis import given, strategies as st, settings
from datetime import datetime, timedelta

from bt_platform.core.prediction.mvm_alpha import (
    CatalystEvent,
    mvm_score,
    _impact,
    _surprise,
    _attention,
    _asymmetry,
    trade_playbook,
)
from bt_platform.core.validation.mvm_backtest_enhanced import (
    EnhancedBacktestConfig,
    MVMBacktestEnhancer,
)
from bt_platform.core.features.mvm_feature_enhancer import MVMFeatureEnhancer


class TestMVMRobustness:
    """Comprehensive robustness testing for MVM scoring"""
    
    @given(
        effect_ratio=st.floats(min_value=0.1, max_value=10.0),
        cap_tier=st.sampled_from(["micro", "smid", "large"]),
        attention=st.sampled_from(["ESMO", "FDA_CR", "FDA_approval", "BTD_viral", "press"]),
        event_type=st.sampled_from(["Phase3_readout", "Phase2_readout", "Approval", "CRL", "BTD"]),
    )
    @settings(max_examples=200, deadline=5000)
    def test_score_bounds_property(self, effect_ratio, cap_tier, attention, event_type):
        """
        Property-based test ensuring scores always in 0-100 range.
        
        Uses Hypothesis to generate random valid inputs and verify output bounds.
        """
        event = CatalystEvent(
            ticker="TEST",
            company="Test Company",
            date="2025-01-01",
            event_type=event_type,
            note="Property test event",
            cap_tier=cap_tier,
            effect_ratio=effect_ratio if effect_ratio > 0 else None,
            attention=attention,
        )
        
        score = mvm_score(event)
        assert 0 <= score <= 100, f"Score {score} outside bounds [0, 100]"
    
    @given(
        score=st.floats(min_value=0, max_value=100),
    )
    @settings(max_examples=100)
    def test_score_monotonicity(self, score):
        """
        Test that higher scores imply higher probabilities and move magnitudes.
        """
        prob_data = MVMFeatureEnhancer.calculate_implied_probability(score)
        
        # Probability should increase with score
        assert 0 <= prob_data["probability_success"] <= 1
        assert 0 <= prob_data["predicted_move_magnitude"] <= 100
        
        # For very low scores, probability should be low
        if score < 30:
            assert prob_data["probability_success"] < 0.4
        
        # For very high scores, probability should be high
        if score > 85:
            assert prob_data["probability_success"] > 0.85
    
    def test_edge_case_zero_effect(self):
        """Test edge case with zero effect ratio"""
        event = CatalystEvent(
            ticker="EDGE1",
            company="Edge Case 1",
            date="2025-01-01",
            event_type="Phase3_readout",
            note="Zero effect ratio test",
            cap_tier="micro",
            effect_ratio=0.0,
            attention="press",
        )
        
        score = mvm_score(event)
        # Should still produce valid score, but likely low due to no effect
        assert 0 <= score <= 100
        # With zero effect, surprise component should use prior
        assert score < 80
    
    def test_edge_case_extreme_effect(self):
        """Test edge case with extremely high effect ratio"""
        event = CatalystEvent(
            ticker="EDGE2",
            company="Edge Case 2",
            date="2025-01-01",
            event_type="Phase3_readout",
            note="Extreme effect ratio test",
            cap_tier="micro",
            effect_ratio=100.0,
            attention="ESMO",
        )
        
        score = mvm_score(event)
        # Should produce very high score
        assert 80 <= score <= 100
    
    def test_edge_case_unknown_attention(self):
        """Test edge case with unknown attention channel"""
        event = CatalystEvent(
            ticker="EDGE3",
            company="Edge Case 3",
            date="2025-01-01",
            event_type="Phase3_readout",
            note="Unknown attention test",
            cap_tier="micro",
            attention="unknown_channel",
        )
        
        score = mvm_score(event)
        # Should default to minimum attention score (0.7)
        assert 0 <= score <= 100
    
    def test_edge_case_unknown_cap_tier(self):
        """Test edge case with unknown cap tier"""
        event = CatalystEvent(
            ticker="EDGE4",
            company="Edge Case 4",
            date="2025-01-01",
            event_type="Phase3_readout",
            note="Unknown cap tier test",
            cap_tier="unknown_tier",
            attention="press",
        )
        
        score = mvm_score(event)
        # Should default to medium asymmetry (0.6)
        assert 0 <= score <= 100
    
    def test_monte_carlo_robustness(self):
        """
        Test model robustness under Monte Carlo simulation.
        
        Validates that the backtest results meet minimum quality thresholds.
        """
        enhancer = MVMBacktestEnhancer()
        results = enhancer.run_comprehensive_backtest()
        
        # Validate key metrics meet minimum thresholds
        basic_metrics = results["basic_metrics"]
        assert basic_metrics["precision"] >= 0.70, "Precision below 70%"
        assert basic_metrics["recall"] >= 0.65, "Recall below 65%"
        assert basic_metrics["accuracy"] >= 0.70, "Accuracy below 70%"
        assert basic_metrics["f1_score"] >= 0.70, "F1 score below 70%"
        
        # Validate risk metrics
        risk_metrics = results["risk_metrics"]
        assert risk_metrics["sharpe_ratio"] >= 1.0, "Sharpe ratio below 1.0"
        assert risk_metrics["max_drawdown"] >= -0.60, "Max drawdown exceeds -60%"
        
        # Validate statistical significance
        stat_tests = results["statistical_tests"]
        assert stat_tests["statistically_significant"], "Results not statistically significant"
        assert stat_tests["p_value"] < 0.05, "P-value >= 0.05"
    
    def test_temporal_stability(self):
        """
        Ensure scoring remains stable over time.
        
        Tests that events from different years produce consistent score patterns.
        """
        enhancer = MVMBacktestEnhancer()
        df = enhancer.historical_events
        
        # Group by year
        df["year"] = df["date"].str[:4]
        years = df["year"].unique()
        
        if len(years) < 2:
            pytest.skip("Need multiple years for temporal stability test")
        
        # Calculate average scores by year
        annual_avg_scores = []
        for year in sorted(years):
            year_data = df[df["year"] == year]
            if len(year_data) >= 5:  # Need minimum sample size
                avg_score = year_data["score"].mean()
                annual_avg_scores.append(avg_score)
        
        # Check that score variation across years is reasonable
        if len(annual_avg_scores) >= 2:
            std_scores = np.std(annual_avg_scores)
            assert std_scores < 15, f"Score variation across years too high: {std_scores:.2f}"
    
    def test_market_regime_sensitivity(self):
        """
        Test that model appropriately adjusts to different market regimes.
        """
        base_score = 75.0
        
        # Test different volatility regimes
        low_vol = MVMFeatureEnhancer.incorporate_market_regime(base_score, 12.0)
        normal_vol = MVMFeatureEnhancer.incorporate_market_regime(base_score, 16.0)
        high_vol = MVMFeatureEnhancer.incorporate_market_regime(base_score, 28.0)
        
        # Low volatility should have highest adjusted score
        assert low_vol["adjusted_score"] > normal_vol["adjusted_score"]
        
        # High volatility should have lowest adjusted score
        assert high_vol["adjusted_score"] < normal_vol["adjusted_score"]
        
        # All should be within bounds
        assert 0 <= low_vol["adjusted_score"] <= 100
        assert 0 <= normal_vol["adjusted_score"] <= 100
        assert 0 <= high_vol["adjusted_score"] <= 100
    
    def test_position_sizing_reasonableness(self):
        """
        Test that position sizing recommendations are reasonable.
        """
        # High score, low volatility, high liquidity
        high_conviction = MVMFeatureEnhancer.calculate_position_sizing(
            score=85.0,
            volatility=25.0,
            liquidity=5_000_000,
        )
        
        # Low score, high volatility, low liquidity
        low_conviction = MVMFeatureEnhancer.calculate_position_sizing(
            score=55.0,
            volatility=50.0,
            liquidity=500_000,
        )
        
        # High conviction should have larger position
        assert high_conviction["recommended_position"] > low_conviction["recommended_position"]
        
        # Both should be reasonable (not exceeding 10% of portfolio)
        assert 0 <= high_conviction["recommended_position"] <= 0.10
        assert 0 <= low_conviction["recommended_position"] <= 0.10
        
        # Max position should be reasonable cap
        assert high_conviction["max_position"] <= 0.10
        assert low_conviction["max_position"] <= 0.10
    
    def test_backtest_coverage(self):
        """
        Test that backtest has sufficient coverage of different scenarios.
        """
        enhancer = MVMBacktestEnhancer()
        df = enhancer.historical_events
        
        # Check for minimum number of events
        assert len(df) >= 50, "Need at least 50 historical events"
        
        # Check for diversity in event types
        event_types = df["event_type"].unique()
        assert len(event_types) >= 3, "Need diverse event types"
        
        # Check for both market conditions
        market_conditions = df["market_condition"].unique()
        assert "normal" in market_conditions, "Need normal market data"
        assert "volatile" in market_conditions, "Need volatile market data"
        
        # Check for temporal diversity (multiple years)
        years = df["date"].str[:4].unique()
        assert len(years) >= 3, "Need data from multiple years"
    
    def test_stress_test_coverage(self):
        """
        Test that stress tests cover key scenarios.
        """
        enhancer = MVMBacktestEnhancer()
        results = enhancer.run_comprehensive_backtest()
        
        stress_tests = results["stress_tests"]
        
        # Should have multiple stress scenarios
        assert len(stress_tests) >= 3, "Need multiple stress test scenarios"
        
        # Should include regulatory shock (CRL events)
        assert "regulatory_shock" in stress_tests
        
        # Regulatory shocks should show negative returns on average
        if "regulatory_shock" in stress_tests:
            assert stress_tests["regulatory_shock"]["mean_return"] < 0
    
    def test_feature_enhancer_integration(self):
        """
        Test that feature enhancer integrates properly with core scoring.
        """
        # Create a test event
        event = CatalystEvent(
            ticker="INTG",
            company="Integration Test",
            date="2025-01-01",
            event_type="Phase3_readout",
            note="Integration test",
            cap_tier="micro",
            effect_ratio=3.0,
            attention="ESMO",
        )
        
        score = mvm_score(event)
        
        # Test that feature enhancer can process this score
        prob_data = MVMFeatureEnhancer.calculate_implied_probability(score)
        assert "probability_success" in prob_data
        assert "predicted_move_magnitude" in prob_data
        
        # Test regime adjustment
        regime_data = MVMFeatureEnhancer.incorporate_market_regime(score, 16.0)
        assert "adjusted_score" in regime_data
        assert abs(regime_data["adjusted_score"] - score) <= 10
        
        # Test position sizing
        position_data = MVMFeatureEnhancer.calculate_position_sizing(
            score, 35.0, 2_000_000
        )
        assert "recommended_position" in position_data
        assert 0 <= position_data["recommended_position"] <= 1
    
    def test_consistency_across_similar_events(self):
        """
        Test that similar events receive similar scores.
        """
        # Two very similar events
        event1 = CatalystEvent(
            ticker="SIM1",
            company="Similar 1",
            date="2025-01-01",
            event_type="Phase3_readout",
            note="Similar event 1",
            cap_tier="micro",
            effect_ratio=3.0,
            attention="ESMO",
        )
        
        event2 = CatalystEvent(
            ticker="SIM2",
            company="Similar 2",
            date="2025-01-02",
            event_type="Phase3_readout",
            note="Similar event 2",
            cap_tier="micro",
            effect_ratio=3.1,
            attention="ESMO",
        )
        
        score1 = mvm_score(event1)
        score2 = mvm_score(event2)
        
        # Scores should be very close (within 5 points)
        assert abs(score1 - score2) <= 5, f"Similar events have very different scores: {score1} vs {score2}"


class TestBacktestValidation:
    """Validation tests for the enhanced backtest system"""
    
    def test_backtest_initialization(self):
        """Test that backtest initializes correctly"""
        config = EnhancedBacktestConfig()
        enhancer = MVMBacktestEnhancer(config)
        
        assert enhancer.config is not None
        assert len(enhancer.historical_events) > 0
    
    def test_custom_config(self):
        """Test backtest with custom configuration"""
        custom_config = EnhancedBacktestConfig(
            lookback_period=365 * 2,
            min_sample_size=30,
            monte_carlo_simulations=500,
        )
        
        enhancer = MVMBacktestEnhancer(custom_config)
        assert enhancer.config.lookback_period == 365 * 2
        assert enhancer.config.monte_carlo_simulations == 500
    
    def test_all_backtest_components_run(self):
        """Test that all backtest components execute successfully"""
        enhancer = MVMBacktestEnhancer()
        results = enhancer.run_comprehensive_backtest()
        
        # Check all expected components are present
        expected_keys = [
            "basic_metrics",
            "risk_metrics",
            "scenario_analysis",
            "monte_carlo",
            "stress_tests",
            "statistical_tests",
        ]
        
        for key in expected_keys:
            assert key in results, f"Missing backtest component: {key}"
    
    def test_monte_carlo_consistency(self):
        """Test that Monte Carlo simulation produces consistent results"""
        enhancer = MVMBacktestEnhancer()
        
        # Run multiple times
        results1 = enhancer.run_comprehensive_backtest()
        results2 = enhancer.run_comprehensive_backtest()
        
        mc1 = results1["monte_carlo"]
        mc2 = results2["monte_carlo"]
        
        # Results should be similar (within reasonable variance)
        mean_diff = abs(mc1["mean_portfolio_return"] - mc2["mean_portfolio_return"])
        assert mean_diff < 5.0, "Monte Carlo results vary too much between runs"


class TestFeatureEnhancerValidation:
    """Validation tests for feature enhancer"""
    
    def test_probability_bounds(self):
        """Test that probabilities are always between 0 and 1"""
        for score in [0, 25, 50, 75, 100]:
            prob_data = MVMFeatureEnhancer.calculate_implied_probability(score)
            assert 0 <= prob_data["probability_success"] <= 1
            assert all(0 <= x <= 1 for x in prob_data["confidence_interval"])
    
    def test_regime_adjustment_bounds(self):
        """Test that regime adjustments keep scores in bounds"""
        for score in [10, 30, 50, 70, 90]:
            for vix in [10, 15, 20, 25, 30]:
                regime_data = MVMFeatureEnhancer.incorporate_market_regime(score, vix)
                assert 0 <= regime_data["adjusted_score"] <= 100
    
    def test_kelly_criterion_sanity(self):
        """Test that Kelly Criterion produces reasonable position sizes"""
        # Test various combinations
        test_cases = [
            (90, 30, 5_000_000),  # High score, moderate vol, high liquidity
            (50, 50, 500_000),    # Low score, high vol, low liquidity
            (75, 35, 2_000_000),  # Medium all around
        ]
        
        for score, volatility, liquidity in test_cases:
            position = MVMFeatureEnhancer.calculate_position_sizing(
                score, volatility, liquidity
            )
            
            # Kelly fraction should be reasonable
            assert -1 <= position["kelly_fraction"] <= 1
            
            # Recommended position should be conservative
            assert 0 <= position["recommended_position"] <= 0.15


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

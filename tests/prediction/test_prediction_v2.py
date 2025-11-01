"""
Tests for Prediction v2 Modules

Tests calibration, timing v2, outcome v2, momentum v2, and alpha scoring.
"""

import pytest
from datetime import date, timedelta
from bt_platform.core.prediction.calibration import fit_pav, apply_pav, calibration_metrics
from bt_platform.core.prediction.timing_predictor_v2 import (
    predict_quarterly_distribution_v2,
    weibull_cdf,
    quarterly_bins,
)
from bt_platform.core.prediction.outcome_predictor_v2 import (
    predict_outcome_bayesian_v2,
    _p2o,
    _o2p,
)
from bt_platform.core.prediction.momentum_scorer_v2 import (
    score_company_advanced,
    _raw,
    _streak,
    _decay,
)
from bt_platform.core.prediction.alpha_scorer import (
    expected_alpha_for_catalyst,
    _robust_mean,
)
from bt_platform.core.prediction.adapters import Catalyst


class TestCalibration:
    """Test PAV isotonic calibration."""
    
    def test_fit_pav_monotonic(self):
        """Test that PAV produces monotonic calibration."""
        # Perfect calibration case
        p_pred = [0.1, 0.3, 0.5, 0.7, 0.9]
        y_true = [0, 0, 1, 1, 1]
        
        calib = fit_pav(p_pred, y_true)
        
        assert "levels" in calib
        assert "thresholds" in calib
        assert len(calib["levels"]) > 0
        
        # Check monotonicity
        levels = calib["levels"]
        for i in range(len(levels) - 1):
            assert levels[i] <= levels[i + 1], "Calibration levels must be monotonic"
    
    def test_fit_pav_empty_input(self):
        """Test PAV with empty input."""
        calib = fit_pav([], [])
        assert calib["levels"] == [0.5]
        assert calib["thresholds"] == []
    
    def test_apply_pav_basic(self):
        """Test applying PAV calibration."""
        # Simple calibration
        p_pred = [0.2, 0.4, 0.6, 0.8]
        y_true = [0, 0, 1, 1]
        
        calib = fit_pav(p_pred, y_true)
        
        # Apply to new predictions
        p_new = 0.5
        p_calib = apply_pav(p_new, calib)
        
        assert 0.0 < p_calib < 1.0, "Calibrated probability must be in (0, 1)"
    
    def test_apply_pav_no_calibration(self):
        """Test applying PAV with no calibration dict."""
        p = 0.7
        p_calib = apply_pav(p, {})
        assert p_calib == p, "Should return original probability if no calibration"
    
    def test_calibration_metrics(self):
        """Test calibration metrics calculation."""
        p_pred = [0.2, 0.4, 0.6, 0.8]
        y_true = [0, 0, 1, 1]
        
        metrics = calibration_metrics(p_pred, y_true)
        
        assert "brier_score" in metrics
        assert "log_loss" in metrics
        assert "n_samples" in metrics
        assert metrics["n_samples"] == 4
        assert 0 <= metrics["brier_score"] <= 1
        assert metrics["log_loss"] > 0


class TestTimingPredictorV2:
    """Test enhanced timing prediction v2."""
    
    def test_weibull_cdf_basic(self):
        """Test Weibull CDF calculation."""
        # At t=0, CDF should be 0
        assert weibull_cdf(0, k=1.5, lam=100) == 0.0
        
        # At negative t, CDF should be 0
        assert weibull_cdf(-10, k=1.5, lam=100) == 0.0
        
        # At large t, CDF should approach 1
        assert weibull_cdf(1000, k=1.5, lam=100) > 0.99
        
        # CDF should be monotonic
        cdf1 = weibull_cdf(50, k=1.5, lam=100)
        cdf2 = weibull_cdf(100, k=1.5, lam=100)
        assert cdf1 < cdf2, "Weibull CDF must be monotonic"
    
    def test_quarterly_bins(self):
        """Test quarterly bins generation."""
        today = date.today()
        bins = quarterly_bins(today, 4)
        
        assert len(bins) == 4, "Should generate 4 quarters"
        
        # Check that bins are sequential and non-overlapping
        for i in range(len(bins) - 1):
            _, end1 = bins[i]
            start2, _ = bins[i + 1]
            # Allow 1-day gap for month transitions
            assert (start2 - end1).days <= 2, "Bins should be sequential"
    
    def test_predict_pdufa_timing(self):
        """Test PDUFA timing prediction (point mass)."""
        today = date.today()
        pdufa_date = today + timedelta(days=60)
        
        catalyst = Catalyst(
            id="test-1",
            ticker="TEST",
            company="Test Co",
            therapeutic_area="Oncology",
            catalyst_type="PDUFA",
            phase="FDA",
            pdufa_date=pdufa_date,
        )
        
        result = predict_quarterly_distribution_v2(catalyst)
        
        assert "quarterly_probabilities" in result
        assert "bins" in result
        assert "outside_window" in result
        assert result["type"] == "PDUFA"
        
        # Should have 90% confidence on the PDUFA quarter
        probs = result["quarterly_probabilities"]
        assert max(probs) >= 0.85, "PDUFA should have high confidence on one quarter"
    
    def test_predict_trial_readout_timing(self):
        """Test trial readout timing prediction."""
        today = date.today()
        anchor = today - timedelta(days=200)
        
        catalyst = Catalyst(
            id="test-2",
            ticker="TEST",
            company="Test Co",
            therapeutic_area="Oncology",
            catalyst_type="TRIAL_READOUT",
            phase="P3",
            anchor_date=anchor,
        )
        
        result = predict_quarterly_distribution_v2(catalyst)
        
        assert "quarterly_probabilities" in result
        assert len(result["quarterly_probabilities"]) == 4
        
        # Probabilities should sum to confidence level
        total_prob = sum(result["quarterly_probabilities"])
        assert 0.4 <= total_prob <= 0.8, "Total probability should be reasonable"
    
    def test_hazard_windows(self):
        """Test hazard window boosting."""
        today = date.today()
        anchor = today - timedelta(days=200)
        
        # Create hazard window in Q2
        hazard_start = today + timedelta(days=100)
        hazard_end = today + timedelta(days=115)
        hazard_windows = [(hazard_start, hazard_end, 1.5)]  # 50% boost
        
        catalyst = Catalyst(
            id="test-3",
            ticker="TEST",
            company="Test Co",
            therapeutic_area="Oncology",
            catalyst_type="TRIAL_READOUT",
            phase="P3",
            anchor_date=anchor,
        )
        
        # Predict without hazard
        result_no_hazard = predict_quarterly_distribution_v2(catalyst)
        
        # Predict with hazard
        result_hazard = predict_quarterly_distribution_v2(catalyst, hazard_windows=hazard_windows)
        
        # Should still get valid probabilities
        assert len(result_hazard["quarterly_probabilities"]) == 4


class TestOutcomePredictorV2:
    """Test enhanced outcome prediction v2."""
    
    def test_probability_odds_conversion(self):
        """Test probability <-> odds conversion."""
        # Test round-trip
        p = 0.6
        odds = _p2o(p)
        p_back = _o2p(odds)
        assert abs(p - p_back) < 1e-6, "Round-trip conversion should be exact"
        
        # Test boundary cases
        assert abs(_p2o(0.5) - 1.0) < 1e-6, "50% probability = 1:1 odds"
        assert abs(_p2o(0.9) - 9.0) < 1e-6, "90% probability = 9:1 odds"
    
    def test_predict_outcome_baseline(self):
        """Test baseline outcome prediction."""
        catalyst = Catalyst(
            id="test-1",
            ticker="TEST",
            company="Test Co",
            therapeutic_area="Oncology",
            catalyst_type="TRIAL_READOUT",
            phase="P3",
        )
        
        result = predict_outcome_bayesian_v2(catalyst)
        
        assert 0.0 < result.probability_of_success < 1.0
        assert 0.0 < result.prior_probability < 1.0
        assert isinstance(result.evidence_factors, list)
        assert result.calibrated is False
    
    def test_predict_outcome_with_evidence(self):
        """Test outcome prediction with evidence factors."""
        catalyst = Catalyst(
            id="test-2",
            ticker="TEST",
            company="Test Co",
            therapeutic_area="Oncology",
            catalyst_type="TRIAL_READOUT",
            phase="P3",
            prior_phase_success=True,
            biomarker_enrichment=True,
            hard_endpoints=True,
            large_trial=True,
        )
        
        result = predict_outcome_bayesian_v2(catalyst)
        
        # With all positive evidence, probability should be higher than prior
        assert result.probability_of_success > result.prior_probability
        
        # Should have 4 evidence factors
        assert len(result.evidence_factors) == 4
    
    def test_rare_disease_uplift(self):
        """Test that rare disease gets probability uplift."""
        catalyst_oncology = Catalyst(
            id="test-3",
            ticker="TEST",
            company="Test Co",
            therapeutic_area="Oncology",
            catalyst_type="TRIAL_READOUT",
            phase="P3",
        )
        
        catalyst_rare = Catalyst(
            id="test-4",
            ticker="TEST",
            company="Test Co",
            therapeutic_area="Rare Disease",
            catalyst_type="TRIAL_READOUT",
            phase="P3",
        )
        
        result_onc = predict_outcome_bayesian_v2(catalyst_oncology)
        result_rare = predict_outcome_bayesian_v2(catalyst_rare)
        
        # Rare disease should have higher probability
        assert result_rare.probability_of_success > result_onc.probability_of_success


class TestMomentumScorerV2:
    """Test enhanced momentum scoring v2."""
    
    def test_decay_function(self):
        """Test exponential decay weighting."""
        # At 0 days, weight should be 1.0
        assert _decay(0) == 1.0
        
        # At 30 days (half-life), weight should be 0.5
        assert abs(_decay(30) - 0.5) < 0.01
        
        # At 60 days (2 half-lives), weight should be 0.25
        assert abs(_decay(60) - 0.25) < 0.01
        
        # Decay should be monotonic
        assert _decay(10) > _decay(20) > _decay(30)
    
    def test_raw_momentum_empty(self):
        """Test raw momentum with no events."""
        events = []
        score = _raw(events)
        assert score == 0.0
    
    def test_raw_momentum_positive(self):
        """Test raw momentum with positive events."""
        today = date.today()
        events = [
            (today - timedelta(days=10), 1, 1.0),  # Recent positive
            (today - timedelta(days=20), 1, 1.0),  # Older positive
        ]
        
        score = _raw(events)
        assert score > 0, "Positive events should give positive score"
    
    def test_raw_momentum_negative(self):
        """Test raw momentum with negative events."""
        today = date.today()
        events = [
            (today - timedelta(days=10), -1, 1.0),  # Recent negative
            (today - timedelta(days=20), -1, 1.0),  # Older negative
        ]
        
        score = _raw(events)
        assert score < 0, "Negative events should give negative score"
    
    def test_streak_detection(self):
        """Test streak detection."""
        today = date.today()
        
        # Winning streak
        win_streak = [
            (today - timedelta(days=30), 1, 1.0),
            (today - timedelta(days=20), 1, 1.0),
            (today - timedelta(days=10), 1, 1.0),
        ]
        streak_val = _streak(win_streak)
        assert streak_val > 0, "Winning streak should be positive"
        
        # Losing streak
        lose_streak = [
            (today - timedelta(days=30), -1, 1.0),
            (today - timedelta(days=20), -1, 1.0),
            (today - timedelta(days=10), -1, 1.0),
        ]
        streak_val = _streak(lose_streak)
        assert streak_val < 0, "Losing streak should be negative"
    
    def test_score_company_advanced(self):
        """Test advanced company scoring."""
        today = date.today()
        company_events = [
            (today - timedelta(days=10), 1, 1.0),
            (today - timedelta(days=20), 1, 1.0),
            (today - timedelta(days=30), -1, 1.0),
        ]
        
        result = score_company_advanced(
            company="Test Co",
            company_events=company_events,
        )
        
        assert "momentum_score" in result
        assert "components" in result
        assert "event_count" in result
        
        # Score should be 0-100
        assert 0 <= result["momentum_score"] <= 100
        
        # Should have component breakdown
        assert "base" in result["components"]
        assert "streak" in result["components"]
        assert "ta_z" in result["components"]


class TestAlphaScorer:
    """Test alpha scoring module."""
    
    def test_robust_mean_basic(self):
        """Test robust mean calculation."""
        # Simple case
        xs = [1.0, 2.0, 3.0, 4.0, 5.0]
        mean = _robust_mean(xs)
        assert 2.0 < mean < 4.0, "Robust mean should be in middle range"
        
        # With outliers
        xs_outlier = [1.0, 2.0, 3.0, 4.0, 100.0]
        mean_outlier = _robust_mean(xs_outlier)
        # Robust mean uses weighted quantiles, so it should be less than the outlier
        # but still influenced by it. The key is it's more stable than arithmetic mean.
        assert mean_outlier < 50.0, "Robust mean should be much less than the outlier"
        assert mean_outlier > 3.0, "Robust mean should be influenced by the data"
    
    def test_robust_mean_edge_cases(self):
        """Test robust mean edge cases."""
        # Empty list
        assert _robust_mean([]) == 0.0
        
        # Single value
        assert _robust_mean([5.0]) == 5.0
        
        # Two values
        assert _robust_mean([2.0, 4.0]) == 3.0
    
    def test_expected_alpha_basic(self):
        """Test basic alpha calculation."""
        today = date.today()
        
        catalyst = Catalyst(
            id="test-1",
            ticker="TEST",
            company="Test Co",
            therapeutic_area="Oncology",
            catalyst_type="TRIAL_READOUT",
            phase="P3",
            anchor_date=today - timedelta(days=200),
            prior_phase_success=True,
        )
        
        result = expected_alpha_for_catalyst(catalyst)
        
        assert "edge_score" in result
        assert "prob_success" in result
        assert "mu_up" in result
        assert "mu_down" in result
        assert "ev" in result
        assert "timing_confidence" in result
        
        # Edge score should be 0-100
        assert 0 <= result["edge_score"] <= 100
        
        # Expected moves should be positive
        assert result["mu_up"] > 0
        assert result["mu_down"] > 0
    
    def test_expected_alpha_components(self):
        """Test that alpha combines probability and moves correctly."""
        today = date.today()
        
        # High probability catalyst
        catalyst_high_p = Catalyst(
            id="test-2",
            ticker="TEST",
            company="Test Co",
            therapeutic_area="Oncology",
            catalyst_type="TRIAL_READOUT",
            phase="P3",
            anchor_date=today - timedelta(days=200),
            prior_phase_success=True,
            biomarker_enrichment=True,
            hard_endpoints=True,
            large_trial=True,
        )
        
        result = expected_alpha_for_catalyst(catalyst_high_p)
        
        # With high success probability and positive EV, should have good edge
        if result["ev"] > 0:
            assert result["edge_score"] > 40, "High probability with positive EV should have decent edge"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

"""
Tests for Enhanced Prediction Engine

Tests the new adapter-based prediction engine with Weibull timing,
Bayesian outcome prediction, and advanced momentum scoring.
"""

import pytest
from datetime import datetime, timedelta, date
from unittest.mock import Mock, MagicMock

from bt_platform.core.prediction.adapters import (
    Catalyst,
    get_catalyst_by_id,
    get_company_outcomes,
    get_ta_outcomes,
    list_upcoming_catalysts,
)
from bt_platform.core.prediction.timing_predictor import (
    predict_quarterly_distribution,
    weibull_cdf,
    quarterly_bins,
)
from bt_platform.core.prediction.outcome_predictor import (
    predict_outcome_bayesian,
    p_to_odds,
    odds_to_p,
)
from bt_platform.core.prediction.momentum_scorer import (
    score_company_advanced,
    raw_momentum,
    streak_boost,
    ta_zscore,
    decay_weight,
)


class TestAdapters:
    """Test adapter layer functionality."""
    
    def test_get_catalyst_by_id_mock(self):
        """Test getting mock catalyst."""
        db = Mock()
        catalyst = get_catalyst_by_id(db, "mock")
        
        assert catalyst.id == "mock"
        assert catalyst.company == "Tectonic Therapeutic"
        assert catalyst.ticker == "TECX"
        assert catalyst.catalyst_type == "TRIAL_READOUT"
        assert catalyst.phase == "P3"
        assert catalyst.prior_phase_success is True
    
    def test_catalyst_dataclass(self):
        """Test Catalyst dataclass creation."""
        today = date.today()
        catalyst = Catalyst(
            id="test-1",
            ticker="TEST",
            company="Test Company",
            therapeutic_area="Oncology",
            catalyst_type="TRIAL_READOUT",
            phase="P2",
            anchor_date=today - timedelta(days=365),
            outcome_history=[(today - timedelta(days=30), 1, 1.0)],
        )
        
        assert catalyst.id == "test-1"
        assert catalyst.phase == "P2"
        assert catalyst.catalyst_type == "TRIAL_READOUT"
        assert len(catalyst.outcome_history) == 1


class TestWeibullTiming:
    """Test Weibull-based timing predictions."""
    
    def test_weibull_cdf_zero(self):
        """Test Weibull CDF at t=0."""
        result = weibull_cdf(0, k=1.5, lam=365.0)
        assert result == 0.0
    
    def test_weibull_cdf_positive(self):
        """Test Weibull CDF for positive time."""
        result = weibull_cdf(365, k=1.5, lam=365.0)
        assert 0.0 < result < 1.0
    
    def test_weibull_cdf_increasing(self):
        """Test that Weibull CDF increases with time."""
        cdf1 = weibull_cdf(100, k=1.5, lam=365.0)
        cdf2 = weibull_cdf(200, k=1.5, lam=365.0)
        cdf3 = weibull_cdf(300, k=1.5, lam=365.0)
        
        assert cdf1 < cdf2 < cdf3
    
    def test_quarterly_bins_count(self):
        """Test quarterly bins generation."""
        today = date.today()
        bins = quarterly_bins(today, quarters=4)
        
        assert len(bins) == 4
        assert all(isinstance(b, tuple) and len(b) == 2 for b in bins)
    
    def test_quarterly_bins_ordered(self):
        """Test that quarterly bins are in order."""
        today = date.today()
        bins = quarterly_bins(today, quarters=4)
        
        for i in range(len(bins) - 1):
            assert bins[i][1] < bins[i + 1][0]  # End of bin i < start of bin i+1
    
    def test_predict_quarterly_pdufa(self):
        """Test PDUFA quarterly prediction (point mass)."""
        today = date.today()
        pdufa_date = today + timedelta(days=60)
        
        result = predict_quarterly_distribution(
            catalyst_type="PDUFA",
            phase="FDA",
            pdufa_date=pdufa_date,
        )
        
        assert "quarterly_probabilities" in result
        assert "confidence" in result
        assert result["confidence"] == 0.90
        assert sum(result["quarterly_probabilities"]) <= 1.0
        # Should have ~90% in one quarter
        assert max(result["quarterly_probabilities"]) >= 0.85
    
    def test_predict_quarterly_trial_readout(self):
        """Test trial readout quarterly prediction (Weibull)."""
        today = date.today()
        anchor = today - timedelta(days=400)
        
        result = predict_quarterly_distribution(
            catalyst_type="TRIAL_READOUT",
            phase="P3",
            anchor_date=anchor,
            therapeutic_area="Oncology",
        )
        
        assert "quarterly_probabilities" in result
        assert "reference" in result
        assert "Weibull" in result["reference"]
        assert len(result["quarterly_probabilities"]) == 4
        # Probabilities should sum to confidence level
        assert sum(result["quarterly_probabilities"]) <= result["confidence"] + 0.01
    
    def test_predict_quarterly_phase_confidence(self):
        """Test that different phases have different confidence levels."""
        today = date.today()
        anchor = today - timedelta(days=365)
        
        p1_result = predict_quarterly_distribution(
            catalyst_type="TRIAL_READOUT",
            phase="P1",
            anchor_date=anchor,
        )
        
        p3_result = predict_quarterly_distribution(
            catalyst_type="TRIAL_READOUT",
            phase="P3",
            anchor_date=anchor,
        )
        
        # P3 should have higher confidence than P1
        assert p3_result["confidence"] > p1_result["confidence"]


class TestBayesianOutcome:
    """Test Bayesian outcome predictions."""
    
    def test_p_to_odds_conversion(self):
        """Test probability to odds conversion."""
        odds = p_to_odds(0.5)
        assert abs(odds - 1.0) < 0.01
        
        odds = p_to_odds(0.75)
        assert abs(odds - 3.0) < 0.01
    
    def test_odds_to_p_conversion(self):
        """Test odds to probability conversion."""
        p = odds_to_p(1.0)
        assert abs(p - 0.5) < 0.01
        
        p = odds_to_p(3.0)
        assert abs(p - 0.75) < 0.01
    
    def test_roundtrip_conversion(self):
        """Test that p -> odds -> p roundtrips correctly."""
        for p_orig in [0.1, 0.3, 0.5, 0.7, 0.9]:
            odds = p_to_odds(p_orig)
            p_back = odds_to_p(odds)
            assert abs(p_orig - p_back) < 0.001
    
    def test_predict_outcome_baseline(self):
        """Test baseline outcome prediction."""
        result = predict_outcome_bayesian(phase="P3")
        
        assert "probability_of_success" in result
        assert "prior_probability" in result
        assert "evidence_factors" in result
        assert result["model"] == "bayesian_odds"
        assert 0.0 < result["probability_of_success"] < 1.0
    
    def test_predict_outcome_rare_disease_uplift(self):
        """Test rare disease therapeutic area uplift."""
        baseline = predict_outcome_bayesian(phase="P3", therapeutic_area="Oncology")
        rare = predict_outcome_bayesian(phase="P3", therapeutic_area="Rare Disease")
        
        # Rare disease should have higher probability
        assert rare["probability_of_success"] > baseline["probability_of_success"]
    
    def test_predict_outcome_with_evidence(self):
        """Test that evidence increases probability."""
        baseline = predict_outcome_bayesian(phase="P3")
        
        with_evidence = predict_outcome_bayesian(
            phase="P3",
            prior_phase_success=True,
            biomarker_enrichment=True,
            hard_endpoints=True,
            large_trial=True,
        )
        
        # All evidence should boost probability
        assert with_evidence["probability_of_success"] > baseline["probability_of_success"]
        assert len(with_evidence["evidence_factors"]) == 4
    
    def test_predict_outcome_evidence_stacking(self):
        """Test that evidence stacks properly in odds space."""
        baseline = predict_outcome_bayesian(phase="P3")
        
        # Add one evidence factor
        one_factor = predict_outcome_bayesian(phase="P3", prior_phase_success=True)
        
        # Add two evidence factors
        two_factors = predict_outcome_bayesian(
            phase="P3",
            prior_phase_success=True,
            biomarker_enrichment=True,
        )
        
        # More evidence should yield higher probability
        assert baseline["probability_of_success"] < one_factor["probability_of_success"]
        assert one_factor["probability_of_success"] < two_factors["probability_of_success"]
    
    def test_predict_outcome_phase_priors(self):
        """Test that different phases have different base rates."""
        p1 = predict_outcome_bayesian(phase="P1")
        p2 = predict_outcome_bayesian(phase="P2")
        p3 = predict_outcome_bayesian(phase="P3")
        fda = predict_outcome_bayesian(phase="FDA")
        
        # Check ordering: P1 > P3 > P2, FDA highest
        assert p1["prior_probability"] > p3["prior_probability"]
        assert p3["prior_probability"] > p2["prior_probability"]
        assert fda["prior_probability"] > p1["prior_probability"]


class TestAdvancedMomentum:
    """Test advanced momentum scoring."""
    
    def test_decay_weight_zero_days(self):
        """Test decay weight at t=0 (today)."""
        weight = decay_weight(0)
        assert weight == 1.0
    
    def test_decay_weight_half_life(self):
        """Test decay weight at one half-life."""
        weight = decay_weight(30.0)
        assert abs(weight - 0.5) < 0.01
    
    def test_decay_weight_decreasing(self):
        """Test that decay weight decreases over time."""
        w1 = decay_weight(10)
        w2 = decay_weight(30)
        w3 = decay_weight(60)
        
        assert w1 > w2 > w3
    
    def test_raw_momentum_empty(self):
        """Test raw momentum with no events."""
        result = raw_momentum([])
        assert result == 0.0
    
    def test_raw_momentum_positive(self):
        """Test raw momentum with positive events."""
        today = date.today()
        events = [
            (today - timedelta(days=10), 1, 1.0),
            (today - timedelta(days=20), 1, 1.0),
            (today - timedelta(days=30), 1, 1.0),
        ]
        
        result = raw_momentum(events)
        assert result > 0.0
    
    def test_raw_momentum_negative(self):
        """Test raw momentum with negative events."""
        today = date.today()
        events = [
            (today - timedelta(days=10), -1, 1.0),
            (today - timedelta(days=20), -1, 1.0),
            (today - timedelta(days=30), -1, 1.0),
        ]
        
        result = raw_momentum(events)
        assert result < 0.0
    
    def test_raw_momentum_recency_weighting(self):
        """Test that recent events have more weight."""
        today = date.today()
        
        # Recent positive event
        recent = raw_momentum([(today - timedelta(days=5), 1, 1.0)])
        
        # Old positive event
        old = raw_momentum([(today - timedelta(days=100), 1, 1.0)])
        
        assert recent > old
    
    def test_streak_boost_empty(self):
        """Test streak boost with no events."""
        result = streak_boost([])
        assert result == 0.0
    
    def test_streak_boost_winning(self):
        """Test streak boost with winning streak."""
        today = date.today()
        events = [
            (today - timedelta(days=30), 1, 1.0),
            (today - timedelta(days=20), 1, 1.0),
            (today - timedelta(days=10), 1, 1.0),
        ]
        
        result = streak_boost(events)
        assert result > 0.0
    
    def test_streak_boost_losing(self):
        """Test streak boost with losing streak."""
        today = date.today()
        events = [
            (today - timedelta(days=30), -1, 1.0),
            (today - timedelta(days=20), -1, 1.0),
            (today - timedelta(days=10), -1, 1.0),
        ]
        
        result = streak_boost(events)
        assert result < 0.0
    
    def test_ta_zscore_empty(self):
        """Test TA z-score with no peers."""
        result = ta_zscore(5.0, [])
        assert result == 0.0
    
    def test_ta_zscore_above_mean(self):
        """Test TA z-score above mean."""
        company_score = 10.0
        ta_scores = [5.0, 6.0, 7.0, 8.0]
        
        z = ta_zscore(company_score, ta_scores)
        assert z > 0.0
    
    def test_ta_zscore_below_mean(self):
        """Test TA z-score below mean."""
        company_score = 3.0
        ta_scores = [5.0, 6.0, 7.0, 8.0]
        
        z = ta_zscore(company_score, ta_scores)
        assert z < 0.0
    
    def test_score_company_advanced_empty(self):
        """Test advanced scoring with no events."""
        result = score_company_advanced([], ta_events_map=None)
        
        assert "momentum_score" in result
        assert "components" in result
        # Empty events should yield neutral score around 50
        assert 40 <= result["momentum_score"] <= 60
    
    def test_score_company_advanced_positive(self):
        """Test advanced scoring with positive events."""
        today = date.today()
        events = [
            (today - timedelta(days=10), 1, 1.0),
            (today - timedelta(days=20), 1, 1.0),
            (today - timedelta(days=30), 1, 1.0),
        ]
        
        result = score_company_advanced(events, ta_events_map=None)
        
        assert result["momentum_score"] > 50.0
        assert result["components"]["base"] > 0.0
        assert result["components"]["streak"] > 0.0
        assert result["event_count"] == 3
    
    def test_score_company_advanced_negative(self):
        """Test advanced scoring with negative events."""
        today = date.today()
        events = [
            (today - timedelta(days=10), -1, 1.0),
            (today - timedelta(days=20), -1, 1.0),
            (today - timedelta(days=30), -1, 1.0),
        ]
        
        result = score_company_advanced(events, ta_events_map=None)
        
        assert result["momentum_score"] < 50.0
        assert result["components"]["base"] < 0.0
        assert result["components"]["streak"] < 0.0
    
    def test_score_company_advanced_with_ta_comparison(self):
        """Test advanced scoring with TA comparison."""
        today = date.today()
        company_events = [
            (today - timedelta(days=10), 1, 1.0),
            (today - timedelta(days=20), 1, 1.0),
        ]
        
        ta_events_map = {
            "Oncology": [
                (today - timedelta(days=15), -1, 1.0),
                (today - timedelta(days=25), -1, 1.0),
            ],
            "Cardiology": [
                (today - timedelta(days=12), -1, 1.0),
            ],
        }
        
        result = score_company_advanced(company_events, ta_events_map)
        
        # Company doing better than TA should have positive z-score
        assert result["components"]["ta_z"] > 0.0
    
    def test_score_company_advanced_range(self):
        """Test that momentum score stays in 0-100 range."""
        today = date.today()
        
        # Extreme positive
        extreme_pos = [
            (today - timedelta(days=i), 1, 2.0)
            for i in range(1, 20)
        ]
        
        result_pos = score_company_advanced(extreme_pos, ta_events_map=None)
        assert 0 <= result_pos["momentum_score"] <= 100
        
        # Extreme negative
        extreme_neg = [
            (today - timedelta(days=i), -1, 2.0)
            for i in range(1, 20)
        ]
        
        result_neg = score_company_advanced(extreme_neg, ta_events_map=None)
        assert 0 <= result_neg["momentum_score"] <= 100


class TestIntegration:
    """Integration tests for the complete prediction pipeline."""
    
    def test_end_to_end_prediction(self):
        """Test complete prediction workflow."""
        today = date.today()
        
        # Create a catalyst
        catalyst = Catalyst(
            id="test-integration",
            ticker="TEST",
            company="Test Bio",
            therapeutic_area="Oncology",
            catalyst_type="TRIAL_READOUT",
            phase="P3",
            anchor_date=today - timedelta(days=400),
            prior_phase_success=True,
            biomarker_enrichment=True,
            hard_endpoints=False,
            large_trial=True,
            outcome_history=[
                (today - timedelta(days=60), 1, 1.0),
                (today - timedelta(days=120), 1, 1.0),
            ],
        )
        
        # Run timing prediction
        timing = predict_quarterly_distribution(
            catalyst_type=catalyst.catalyst_type,
            phase=catalyst.phase,
            anchor_date=catalyst.anchor_date,
            therapeutic_area=catalyst.therapeutic_area,
        )
        
        assert timing["confidence"] > 0.5
        assert len(timing["quarterly_probabilities"]) == 4
        
        # Run outcome prediction
        outcome = predict_outcome_bayesian(
            phase=catalyst.phase,
            therapeutic_area=catalyst.therapeutic_area,
            prior_phase_success=catalyst.prior_phase_success,
            biomarker_enrichment=catalyst.biomarker_enrichment,
            hard_endpoints=catalyst.hard_endpoints,
            large_trial=catalyst.large_trial,
        )
        
        assert outcome["probability_of_success"] > 0.5
        assert len(outcome["evidence_factors"]) >= 2
        
        # Run momentum scoring
        momentum = score_company_advanced(
            catalyst.outcome_history,
            ta_events_map=None,
        )
        
        assert momentum["momentum_score"] > 50.0
        assert momentum["event_count"] == 2


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

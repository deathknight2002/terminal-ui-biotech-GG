"""
Tests for Catalyst Prediction Module

Tests timing prediction, outcome prediction, and momentum scoring.
"""

import pytest
from datetime import datetime, timedelta

from bt_platform.core.prediction import (
    predict_catalyst_timing,
    predict_catalyst_outcome,
    calculate_momentum_score,
)


class TestTimingPrediction:
    """Test catalyst timing prediction."""
    
    def test_predict_phase3_readout_timing(self):
        """Test prediction for Phase 3 trial readout."""
        result = predict_catalyst_timing(
            catalyst_type="Phase 3 Readout",
            phase="Phase 3",
            indication="Oncology",
            last_milestone_date=datetime(2024, 1, 1),
        )
        
        assert "predicted_date" in result
        assert "confidence_interval_days" in result
        assert "probability_by_quarter" in result
        assert result["model"] == "weibull_duration"
        assert 0 <= result["confidence_score"] <= 1
        
        # Check that predicted date is in the future
        predicted = datetime.fromisoformat(result["predicted_date"])
        assert predicted > datetime(2024, 1, 1)
    
    def test_predict_pdufa_timing(self):
        """Test prediction for PDUFA date (more predictable)."""
        result = predict_catalyst_timing(
            catalyst_type="PDUFA",
            last_milestone_date=datetime.now(),
        )
        
        # PDUFA should have higher confidence than trial readouts
        assert result["confidence_score"] >= 0.85
        assert result["confidence_interval_days"] <= 90  # Tighter range
    
    def test_oncology_timing_adjustment(self):
        """Test that oncology trials get faster timeline."""
        oncology_result = predict_catalyst_timing(
            catalyst_type="Phase 2 Readout",
            indication="Oncology",
            last_milestone_date=datetime.now(),
        )
        
        other_result = predict_catalyst_timing(
            catalyst_type="Phase 2 Readout",
            indication="Cardiology",
            last_milestone_date=datetime.now(),
        )
        
        # Oncology should predict earlier date
        oncology_date = datetime.fromisoformat(oncology_result["predicted_date"])
        other_date = datetime.fromisoformat(other_result["predicted_date"])
        assert oncology_date < other_date


class TestOutcomePrediction:
    """Test catalyst outcome prediction."""
    
    def test_predict_phase3_outcome_baseline(self):
        """Test baseline outcome prediction for Phase 3."""
        result = predict_catalyst_outcome(
            catalyst_type="Phase 3 Readout",
            phase="Phase 3",
            indication="Oncology",
        )
        
        assert "probability_of_success" in result
        assert "confidence_interval" in result
        assert "prior_probability" in result
        assert "evidence_factors" in result
        assert result["model"] == "bayesian_update"
        
        # Probability should be reasonable (0-1)
        assert 0 <= result["probability_of_success"] <= 1
        assert result["probability_of_success"] > 0.3  # Phase 3 should be > 30%
    
    def test_rare_disease_higher_success_rate(self):
        """Test that rare disease has higher success probability."""
        rare_result = predict_catalyst_outcome(
            catalyst_type="Phase 3 Readout",
            phase="Phase 3",
            indication="Rare Disease",
        )
        
        oncology_result = predict_catalyst_outcome(
            catalyst_type="Phase 3 Readout",
            phase="Phase 3",
            indication="Oncology",
        )
        
        # Rare disease should have higher probability
        assert rare_result["probability_of_success"] > oncology_result["probability_of_success"]
    
    def test_outcome_with_prior_success(self):
        """Test that prior phase success boosts probability."""
        result = predict_catalyst_outcome(
            catalyst_type="Phase 3 Readout",
            phase="Phase 3",
            indication="Oncology",
            prior_phase_outcomes=["success", "success"],
        )
        
        # Should have evidence factor for prior success
        assert len(result["evidence_factors"]) > 0
        assert any("prior_phase" in f["factor"] for f in result["evidence_factors"])
        
        # Should boost probability above prior
        assert result["probability_of_success"] > result["prior_probability"]
    
    def test_biomarker_enrichment_boost(self):
        """Test that biomarker enrichment increases probability."""
        result = predict_catalyst_outcome(
            catalyst_type="Phase 3 Readout",
            phase="Phase 3",
            indication="Oncology",
            trial_design_factors={"biomarker_enrichment": True},
        )
        
        # Should have evidence factor for biomarker
        assert len(result["evidence_factors"]) > 0
        assert any("biomarker" in f["factor"] for f in result["evidence_factors"])
        
        # Should boost probability
        assert result["probability_of_success"] > result["prior_probability"]


class TestMomentumScoring:
    """Test momentum scoring."""
    
    def test_calculate_momentum_with_successes(self):
        """Test momentum calculation with recent successes."""
        catalysts = [
            {"date": (datetime.now() - timedelta(days=30)).isoformat(), "outcome": "success"},
            {"date": (datetime.now() - timedelta(days=60)).isoformat(), "outcome": "success"},
            {"date": (datetime.now() - timedelta(days=90)).isoformat(), "outcome": "success"},
        ]
        
        result = calculate_momentum_score(catalysts, lookback_months=6)
        
        assert "overall_score" in result
        assert "trend" in result
        assert "catalyst_count" in result
        assert "success_rate" in result
        
        # With all successes, score should be high
        assert result["overall_score"] > 70
        assert result["trend"] in ["positive", "strong_positive"]
        assert result["success_rate"] == 1.0
    
    def test_calculate_momentum_with_failures(self):
        """Test momentum calculation with recent failures."""
        catalysts = [
            {"date": (datetime.now() - timedelta(days=30)).isoformat(), "outcome": "failure"},
            {"date": (datetime.now() - timedelta(days=60)).isoformat(), "outcome": "failure"},
            {"date": (datetime.now() - timedelta(days=90)).isoformat(), "outcome": "failure"},
        ]
        
        result = calculate_momentum_score(catalysts, lookback_months=6)
        
        # With all failures, score should be low
        assert result["overall_score"] < 40
        assert result["trend"] in ["negative", "strong_negative"]
        assert result["success_rate"] == 0.0
    
    def test_calculate_momentum_with_no_catalysts(self):
        """Test momentum with no catalysts (neutral)."""
        result = calculate_momentum_score([], lookback_months=6)
        
        assert result["overall_score"] == 50  # Neutral
        assert result["trend"] == "neutral"
        assert result["catalyst_count"] == 0
    
    def test_momentum_streak_detection(self):
        """Test that winning streaks boost momentum."""
        catalysts = [
            {"date": (datetime.now() - timedelta(days=10)).isoformat(), "outcome": "success"},
            {"date": (datetime.now() - timedelta(days=20)).isoformat(), "outcome": "success"},
            {"date": (datetime.now() - timedelta(days=30)).isoformat(), "outcome": "success"},
            {"date": (datetime.now() - timedelta(days=150)).isoformat(), "outcome": "failure"},
        ]
        
        result = calculate_momentum_score(catalysts, lookback_months=6)
        
        # Recent winning streak should result in positive momentum
        assert result["overall_score"] > 60
        assert result["key_metrics"]["streak"] >= 3
    
    def test_momentum_recency_weighting(self):
        """Test that recent catalysts are weighted more heavily."""
        recent_success = [
            {"date": (datetime.now() - timedelta(days=10)).isoformat(), "outcome": "success"},
            {"date": (datetime.now() - timedelta(days=150)).isoformat(), "outcome": "failure"},
        ]
        
        old_success = [
            {"date": (datetime.now() - timedelta(days=10)).isoformat(), "outcome": "failure"},
            {"date": (datetime.now() - timedelta(days=150)).isoformat(), "outcome": "success"},
        ]
        
        recent_result = calculate_momentum_score(recent_success, lookback_months=6, weight_recent=True)
        old_result = calculate_momentum_score(old_success, lookback_months=6, weight_recent=True)
        
        # Recent success should score higher than old success
        assert recent_result["overall_score"] > old_result["overall_score"]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

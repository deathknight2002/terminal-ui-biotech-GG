"""
Tests for Catalyst Delta Service

Tests the expectation vs outcome delta calculations.
"""

import pytest
from bt_platform.core.services.catalyst_delta_service import (
    compute_expectation_delta,
    compute_multi_metric_delta,
    compute_aggregate_delta_score,
    ExpectationDeltaResult,
    analyze_fortify_catalyst
)


class TestComputeExpectationDelta:
    """Test single metric delta calculations"""
    
    def test_beat_scenario(self):
        """Test when outcome beats expectations"""
        outcome = {"value": 1.8}
        expectation = {"expected": 1.5, "band_low": 1.3, "band_high": 1.6}
        
        result = compute_expectation_delta(outcome, expectation)
        
        assert result.delta_class == "beat"
        assert result.delta_score > 0
        assert result.magnitude == pytest.approx(0.3, abs=0.01)
    
    def test_miss_scenario(self):
        """Test when outcome misses expectations"""
        outcome = {"value": 1.0}
        expectation = {"expected": 1.5, "band_low": 1.3, "band_high": 1.6}
        
        result = compute_expectation_delta(outcome, expectation)
        
        assert result.delta_class == "miss"
        assert result.delta_score > 0
        assert result.magnitude < 0
    
    def test_inline_scenario(self):
        """Test when outcome is within expectations"""
        outcome = {"value": 1.45}
        expectation = {"expected": 1.5, "band_low": 1.3, "band_high": 1.6}
        
        result = compute_expectation_delta(outcome, expectation)
        
        assert result.delta_class == "inline"
        assert 0.0 <= result.delta_score <= 1.0
    
    def test_edge_at_band_high(self):
        """Test when outcome is exactly at band high"""
        outcome = {"value": 1.6}
        expectation = {"expected": 1.5, "band_low": 1.3, "band_high": 1.6}
        
        result = compute_expectation_delta(outcome, expectation)
        
        assert result.delta_class == "inline"
    
    def test_edge_at_band_low(self):
        """Test when outcome is exactly at band low"""
        outcome = {"value": 1.3}
        expectation = {"expected": 1.5, "band_low": 1.3, "band_high": 1.6}
        
        result = compute_expectation_delta(outcome, expectation)
        
        assert result.delta_class == "inline"
    
    def test_no_expectation_band(self):
        """Test when no expectation band is provided"""
        outcome = {"value": 1.8}
        expectation = {"expected": 0, "band_low": 0, "band_high": 0}
        
        result = compute_expectation_delta(outcome, expectation)
        
        assert result.delta_class == "unknown"
        assert result.delta_score == 0.0
    
    def test_negative_values(self):
        """Test with negative values (e.g., CK reduction)"""
        outcome = {"value": -82}
        expectation = {"expected": -60, "band_low": -70, "band_high": -50}
        
        result = compute_expectation_delta(outcome, expectation)
        
        assert result.delta_class == "beat"
        assert result.delta_score > 0


class TestComputeMultiMetricDelta:
    """Test multi-metric delta calculations"""
    
    def test_multiple_metrics(self):
        """Test computing deltas for multiple metrics"""
        outcomes = {
            "metric1": {"value": 1.8},
            "metric2": {"value": -82}
        }
        expectations = {
            "metric1": {"expected": 1.5, "band_low": 1.3, "band_high": 1.6},
            "metric2": {"expected": -60, "band_low": -70, "band_high": -50}
        }
        
        results = compute_multi_metric_delta(outcomes, expectations)
        
        assert len(results) == 2
        assert "metric1" in results
        assert "metric2" in results
        assert results["metric1"].delta_class == "beat"
        assert results["metric2"].delta_class == "beat"
    
    def test_missing_expectation(self):
        """Test when expectation is missing for a metric"""
        outcomes = {
            "metric1": {"value": 1.8},
            "metric2": {"value": 2.0}
        }
        expectations = {
            "metric1": {"expected": 1.5, "band_low": 1.3, "band_high": 1.6}
        }
        
        results = compute_multi_metric_delta(outcomes, expectations)
        
        assert len(results) == 2
        assert results["metric1"].delta_class == "beat"
        assert results["metric2"].delta_class == "unknown"
    
    def test_mixed_results(self):
        """Test with mix of beat, inline, and miss"""
        outcomes = {
            "beat_metric": {"value": 2.0},
            "inline_metric": {"value": 1.45},
            "miss_metric": {"value": 0.8}
        }
        expectations = {
            "beat_metric": {"expected": 1.5, "band_low": 1.3, "band_high": 1.6},
            "inline_metric": {"expected": 1.5, "band_low": 1.3, "band_high": 1.6},
            "miss_metric": {"expected": 1.5, "band_low": 1.3, "band_high": 1.6}
        }
        
        results = compute_multi_metric_delta(outcomes, expectations)
        
        assert results["beat_metric"].delta_class == "beat"
        assert results["inline_metric"].delta_class == "inline"
        assert results["miss_metric"].delta_class == "miss"


class TestComputeAggregateDeltaScore:
    """Test aggregate delta score calculations"""
    
    def test_all_beats(self):
        """Test when all metrics beat expectations"""
        deltas = {
            "metric1": ExpectationDeltaResult("beat", 0.8),
            "metric2": ExpectationDeltaResult("beat", 0.6)
        }
        
        score, delta_class = compute_aggregate_delta_score(deltas)
        
        assert delta_class == "beat"
        assert score > 0
    
    def test_all_misses(self):
        """Test when all metrics miss expectations"""
        deltas = {
            "metric1": ExpectationDeltaResult("miss", 0.8),
            "metric2": ExpectationDeltaResult("miss", 0.6)
        }
        
        score, delta_class = compute_aggregate_delta_score(deltas)
        
        assert delta_class == "miss"
        assert score > 0
    
    def test_mixed_metrics(self):
        """Test with mixed beat/miss/inline"""
        deltas = {
            "metric1": ExpectationDeltaResult("beat", 0.8),
            "metric2": ExpectationDeltaResult("miss", 0.4),
            "metric3": ExpectationDeltaResult("inline", 0.2)
        }
        
        score, delta_class = compute_aggregate_delta_score(deltas)
        
        assert delta_class == "mixed"
        assert 0 <= score <= 1
    
    def test_weighted_aggregate(self):
        """Test with custom weights"""
        deltas = {
            "important": ExpectationDeltaResult("beat", 0.9),
            "less_important": ExpectationDeltaResult("miss", 0.3)
        }
        weights = {
            "important": 0.8,
            "less_important": 0.2
        }
        
        score, delta_class = compute_aggregate_delta_score(deltas, weights)
        
        # Important metric has higher weight, so should be "beat" or "mixed"
        assert delta_class in ["beat", "mixed"]
    
    def test_empty_deltas(self):
        """Test with no deltas"""
        deltas = {}
        
        score, delta_class = compute_aggregate_delta_score(deltas)
        
        assert score == 0.0
        assert delta_class == "unknown"


class TestFortifyAnalysis:
    """Test BridgeBio FORTIFY example analysis"""
    
    def test_fortify_catalyst(self):
        """Test complete FORTIFY analysis"""
        result = analyze_fortify_catalyst()
        
        assert "metric_deltas" in result
        assert "aggregate_score" in result
        assert "aggregate_class" in result
        assert "interpretation" in result
        
        # FORTIFY should beat on all metrics
        assert result["aggregate_class"] == "beat"
        assert result["aggregate_score"] > 0.5
        
        # Check individual metrics
        deltas = result["metric_deltas"]
        assert "α-DG glycosylation" in deltas
        assert deltas["α-DG glycosylation"]["class"] == "beat"
        assert "CK reduction" in deltas
        assert deltas["CK reduction"]["class"] == "beat"
    
    def test_fortify_functional_endpoints(self):
        """Test FORTIFY functional endpoints (velocity, FVC)"""
        result = analyze_fortify_catalyst()
        deltas = result["metric_deltas"]
        
        # Velocity and FVC should beat or be inline-high
        assert "Velocity Δ vs PBO" in deltas
        assert deltas["Velocity Δ vs PBO"]["class"] in ["beat", "inline"]
        
        assert "FVC Δ vs PBO" in deltas
        assert deltas["FVC Δ vs PBO"]["class"] in ["beat", "inline"]


class TestExpectationDeltaResult:
    """Test ExpectationDeltaResult class"""
    
    def test_to_dict(self):
        """Test conversion to dictionary"""
        result = ExpectationDeltaResult(
            delta_class="beat",
            delta_score=0.8,
            magnitude=0.3,
            explanation="Test explanation"
        )
        
        d = result.to_dict()
        
        assert d["class"] == "beat"
        assert d["score"] == 0.8
        assert d["magnitude"] == 0.3
        assert d["explanation"] == "Test explanation"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

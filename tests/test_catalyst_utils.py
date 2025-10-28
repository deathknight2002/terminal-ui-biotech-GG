"""
Tests for Catalyst Event Utilities

Tests expectation delta calculations, peer comparisons, and validation logic.
"""

import pytest
from bt_platform.core.catalyst_utils import (
    compute_expectation_delta,
    batch_compute_deltas,
    should_alert,
    validate_catalyst_event
)


class TestExpectationDelta:
    """Test expectation delta calculation"""
    
    def test_beat_expectations(self):
        """Test when outcome beats expectations"""
        outcome = {"value": 1.8}
        expectation = {"band_low": 1.3, "band_high": 1.6}
        
        result = compute_expectation_delta(outcome, expectation)
        
        assert result["class"] == "beat"
        assert result["score"] > 0
    
    def test_miss_expectations(self):
        """Test when outcome misses expectations"""
        outcome = {"value": 1.0}
        expectation = {"band_low": 1.3, "band_high": 1.6}
        
        result = compute_expectation_delta(outcome, expectation)
        
        assert result["class"] == "miss"
        assert result["score"] > 0
    
    def test_inline_expectations(self):
        """Test when outcome is in-line with expectations"""
        outcome = {"value": 1.5}
        expectation = {"band_low": 1.3, "band_high": 1.6}
        
        result = compute_expectation_delta(outcome, expectation)
        
        assert result["class"] == "inline"
        assert result["score"] == 0.2
    
    def test_boolean_outcome(self):
        """Test boolean outcomes"""
        # Expected True, got True
        outcome = {"value": True}
        expectation = {"expected": True}
        
        result = compute_expectation_delta(outcome, expectation)
        assert result["class"] == "inline"
        
        # Expected False, got True
        outcome = {"value": True}
        expectation = {"expected": False}
        
        result = compute_expectation_delta(outcome, expectation)
        assert result["class"] == "beat"
    
    def test_missing_value(self):
        """Test when outcome value is missing"""
        outcome = {}
        expectation = {"band_low": 1.3, "band_high": 1.6}
        
        result = compute_expectation_delta(outcome, expectation)
        
        assert result["class"] == "unknown"
        assert result["score"] == 0.0
    
    def test_missing_band(self):
        """Test when expectation band is missing"""
        outcome = {"value": 1.5}
        expectation = {"expected": 1.5}
        
        result = compute_expectation_delta(outcome, expectation)
        
        # Should use expected +/- 10% as band
        assert result["class"] in ["beat", "miss", "inline"]


class TestBatchDeltas:
    """Test batch delta calculation"""
    
    def test_multiple_metrics(self):
        """Test calculating deltas for multiple metrics"""
        outcomes = [
            {"name": "α-DG glycosylation", "value": 1.8},
            {"name": "CK reduction", "value": 82},
            {"name": "Velocity Δ vs PBO", "value": 0.27}
        ]
        
        expectations = [
            {"name": "α-DG glycosylation", "band_low": 1.3, "band_high": 1.6},
            {"name": "CK reduction", "band_low": 50, "band_high": 70},
            {"name": "Velocity Δ vs PBO", "band_low": 0.10, "band_high": 0.25}
        ]
        
        results = batch_compute_deltas(outcomes, expectations)
        
        assert len(results) == 3
        assert all("metric" in r for r in results)
        assert all("delta" in r for r in results)
        
        # Check that α-DG beat expectations
        alpha_dg = next(r for r in results if r["metric"] == "α-DG glycosylation")
        assert alpha_dg["delta"]["class"] == "beat"
    
    def test_mismatched_metrics(self):
        """Test when metrics don't have matching expectations"""
        outcomes = [
            {"name": "Metric A", "value": 100},
            {"name": "Metric B", "value": 200}
        ]
        
        expectations = [
            {"name": "Metric A", "band_low": 80, "band_high": 120}
            # Metric B has no expectation
        ]
        
        results = batch_compute_deltas(outcomes, expectations)
        
        # Only Metric A should be in results
        assert len(results) == 1
        assert results[0]["metric"] == "Metric A"


class TestAlerting:
    """Test alerting logic"""
    
    def test_alert_on_high_delta(self):
        """Test alerting when expectation delta is high"""
        deltas = [
            {
                "metric": "Test Metric",
                "delta": {"class": "beat", "score": 0.6}
            }
        ]
        
        market_reaction = {"price": []}
        
        should_trigger, reason = should_alert(deltas, market_reaction)
        
        assert should_trigger is True
        assert "expectation delta" in reason.lower()
    
    def test_alert_on_large_price_move(self):
        """Test alerting when price moves significantly"""
        deltas = []
        
        market_reaction = {
            "price": [
                {"window": "D0", "abs": 8.5}
            ]
        }
        
        should_trigger, reason = should_alert(deltas, market_reaction)
        
        assert should_trigger is True
        assert "price move" in reason.lower()
    
    def test_no_alert_on_small_changes(self):
        """Test no alert for small changes"""
        deltas = [
            {
                "metric": "Test Metric",
                "delta": {"class": "inline", "score": 0.2}
            }
        ]
        
        market_reaction = {
            "price": [
                {"window": "D0", "abs": 2.0}
            ]
        }
        
        should_trigger, reason = should_alert(deltas, market_reaction)
        
        assert should_trigger is False


class TestValidation:
    """Test catalyst event validation"""
    
    def test_valid_event(self):
        """Test validation of a valid event"""
        event = {
            "event_id": "01J9ABCD",
            "as_of": "2025-10-27T14:00:00Z",
            "company": {
                "name": "Test Company",
                "ticker": "TEST"
            },
            "catalyst": {
                "type": "M&A"
            },
            "expectations": {
                "metrics": [
                    {"name": "Deal Premium", "unit": "%"}
                ]
            }
        }
        
        is_valid, errors = validate_catalyst_event(event)
        
        assert is_valid is True
        assert len(errors) == 0
    
    def test_missing_required_fields(self):
        """Test validation when required fields are missing"""
        event = {
            "event_id": "01J9ABCD"
            # Missing as_of, company, catalyst
        }
        
        is_valid, errors = validate_catalyst_event(event)
        
        assert is_valid is False
        assert len(errors) > 0
        assert any("as_of" in e for e in errors)
    
    def test_invalid_expectation_band(self):
        """Test validation when expectation band is invalid"""
        event = {
            "event_id": "01J9ABCD",
            "as_of": "2025-10-27T14:00:00Z",
            "company": {
                "name": "Test Company",
                "ticker": "TEST"
            },
            "catalyst": {
                "type": "M&A"
            },
            "expectations": {
                "metrics": [
                    {
                        "name": "Deal Premium",
                        "unit": "%",
                        "band_low": 40,  # Invalid: low > high
                        "band_high": 20
                    }
                ]
            }
        }
        
        is_valid, errors = validate_catalyst_event(event)
        
        assert is_valid is False
        assert any("band_low > band_high" in e for e in errors)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

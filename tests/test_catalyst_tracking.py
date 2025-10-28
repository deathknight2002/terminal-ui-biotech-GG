"""
Tests for Catalyst Event Tracking System
========================================

Basic tests to validate the catalyst tracking components.
"""

import pytest
from decimal import Decimal
from datetime import datetime, date
from bt_platform.etl.expectations import (
    normalize_unit,
    parse_numeric_value,
    validate_expectation_band,
    detect_outliers
)
from bt_platform.market.reaction import (
    parse_window,
    get_window_date,
    compute_expectation_delta
)
from bt_platform.comparator.peers import (
    calculate_indication_similarity,
    calculate_stage_similarity,
    explain_peer_match
)


class TestExpectationsETL:
    """Test expectations ETL functions."""
    
    def test_normalize_unit(self):
        """Test unit normalization."""
        assert normalize_unit("percent") == "%"
        assert normalize_unit("fold") == "x"
        assert normalize_unit("billion") == "$B"
        assert normalize_unit("meters_per_second") == "m/s"
        assert normalize_unit("unknown") == "unknown"
    
    def test_parse_numeric_value(self):
        """Test numeric value parsing."""
        assert parse_numeric_value("1.5") == Decimal("1.5")
        assert parse_numeric_value("60%") == Decimal("60")
        assert parse_numeric_value("$12.0B") == Decimal("12.0")
        assert parse_numeric_value("0.27 m/s") == Decimal("0.27")
        assert parse_numeric_value("invalid") is None
    
    def test_validate_expectation_band(self):
        """Test expectation band validation."""
        # Valid band
        valid, error = validate_expectation_band(
            Decimal("1.5"),
            Decimal("1.3"),
            Decimal("1.6")
        )
        assert valid is True
        assert error is None
        
        # Invalid: band_low > band_high
        valid, error = validate_expectation_band(
            Decimal("1.5"),
            Decimal("1.6"),
            Decimal("1.3")
        )
        assert valid is False
        assert "band_low > band_high" in error
        
        # Invalid: expected outside band
        valid, error = validate_expectation_band(
            Decimal("2.0"),
            Decimal("1.3"),
            Decimal("1.6")
        )
        assert valid is False
        assert "expected > band_high" in error
    
    def test_detect_outliers(self):
        """Test outlier detection."""
        values = [Decimal(str(x)) for x in [1, 2, 2, 3, 3, 3, 4, 4, 100]]
        outliers = detect_outliers(values)
        assert outliers[-1] is True  # 100 is outlier
        assert outliers[0] is False  # 1 is not outlier


class TestMarketReaction:
    """Test market reaction functions."""
    
    def test_parse_window(self):
        """Test window string parsing."""
        assert parse_window("D0") == 0
        assert parse_window("D+1") == 1
        assert parse_window("D-5") == -5
        assert parse_window("D+10") == 10
    
    def test_get_window_date(self):
        """Test window date calculation."""
        event_date = date(2025, 10, 27)
        assert get_window_date(event_date, "D0") == date(2025, 10, 27)
        assert get_window_date(event_date, "D+1") == date(2025, 10, 28)
        assert get_window_date(event_date, "D-5") == date(2025, 10, 22)
    
    def test_compute_expectation_delta(self):
        """Test expectation delta computation."""
        # Beat
        result = compute_expectation_delta(
            {"value": 1.8},
            {"band_low": 1.3, "band_high": 1.6}
        )
        assert result["class"] == "beat"
        assert result["score"] > 0
        
        # Miss
        result = compute_expectation_delta(
            {"value": 1.0},
            {"band_low": 1.3, "band_high": 1.6}
        )
        assert result["class"] == "miss"
        assert result["score"] > 0
        
        # Inline
        result = compute_expectation_delta(
            {"value": 1.4},
            {"band_low": 1.3, "band_high": 1.6}
        )
        assert result["class"] == "inline"
        assert result["score"] == 0.2


class TestPeerComparator:
    """Test peer comparator functions."""
    
    def test_calculate_indication_similarity(self):
        """Test indication similarity."""
        # Exact match
        assert calculate_indication_similarity("Oncology", "Oncology") == 1.0
        
        # Substring match
        assert calculate_indication_similarity("LGMD2I/R9", "LGMD2I") == 0.8
        
        # Therapeutic area match
        assert calculate_indication_similarity(
            "Breast Cancer",
            "Lung Cancer"
        ) >= 0.6
        
        # No match
        assert calculate_indication_similarity("Oncology", "Neurology") == 0.0
    
    def test_calculate_stage_similarity(self):
        """Test development stage similarity."""
        # Exact match
        assert calculate_stage_similarity("Phase II", "Phase II") == 1.0
        
        # Adjacent phases
        assert calculate_stage_similarity("Phase II", "Phase III") == 0.7
        
        # Two phases apart
        assert calculate_stage_similarity("Phase I", "Phase III") == 0.4
        
        # Far apart
        assert calculate_stage_similarity("Preclinical", "Approved") == 0.0
    
    def test_explain_peer_match(self):
        """Test peer match explanation."""
        moat_flags = {
            "moat_moa": True,
            "moat_stage": True,
            "moat_indication": False,
            "moat_delivery": False,
            "moat_target": False
        }
        
        explanation = explain_peer_match("DYNE", moat_flags, 0.65)
        assert "DYNE" in explanation
        assert "MOA" in explanation
        assert "STAGE" in explanation
        assert "0.65" in explanation


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

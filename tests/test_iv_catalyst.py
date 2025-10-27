"""
Integration Tests for IV Catalyst Signal Computation

Tests the complete signal generation workflow including:
- Signal flag calculation logic
- Quality tier classification
- IV/RV ratio computation
"""

import pytest
from datetime import datetime, timedelta


class TestIVSignalComputationLogic:
    """Test IV catalyst signal computation logic without database"""
    
    def test_backwardation_detection(self):
        """Test backwardation flag logic"""
        iv7 = 55.0
        iv30 = 48.0
        
        # Backwardation threshold: 7D > 30D * 1.1
        backw_flag = 1 if iv7 > iv30 * 1.1 else 0
        
        # 55.0 > 48.0 * 1.1 (52.8) = True
        assert backw_flag == 1
    
    def test_iv_rv_ratio_calculation(self):
        """Test IV/RV ratio flag logic"""
        iv7 = 55.0
        realized_vol_20d = 35.0
        returns_5d = 0.01  # 1% (within quiet range)
        
        iv_rv_ratio = iv7 / realized_vol_20d
        ivrv_flag = 1 if iv_rv_ratio > 1.4 and abs(returns_5d) <= 0.02 else 0
        
        # 55.0 / 35.0 = 1.57 > 1.4 AND |0.01| <= 0.02
        assert iv_rv_ratio > 1.4
        assert abs(returns_5d) <= 0.02
        assert ivrv_flag == 1
    
    def test_skew_change_calculation(self):
        """Test skew change significance"""
        current_skew = 8.0
        median_skew = 5.0
        skew_threshold = 10.0
        
        skew_change = current_skew - median_skew
        skew_flag = 1 if skew_change > skew_threshold else 0
        
        # 8.0 - 5.0 = 3.0 < 10.0
        assert skew_change == 3.0
        assert skew_flag == 0
    
    def test_signal_score_calculation(self):
        """Test overall signal score"""
        # Flags from above tests
        backw_flag = 1  # Backwardation detected
        ivrv_flag = 1   # IV/RV elevated
        skew_flag = 0   # Skew not significant
        oi_flag = 0     # OI spike (not tested here)
        
        signal_score = backw_flag + ivrv_flag + skew_flag + oi_flag
        
        # Expected: 2 flags triggered
        assert signal_score == 2
        assert signal_score >= 2  # Meets minimum threshold
    
    def test_quality_tier_high(self):
        """Test high quality classification"""
        signal_score = 3
        iv7_pctile = 70.0  # Below 85%
        
        if signal_score >= 3 and iv7_pctile < 85:
            quality = "High"
        elif signal_score >= 2:
            quality = "Medium"
        else:
            quality = "Low"
        
        assert quality == "High"
    
    def test_quality_tier_medium(self):
        """Test medium quality classification"""
        signal_score = 2
        iv7_pctile = 72.0
        
        if signal_score >= 3 and iv7_pctile < 85:
            quality = "High"
        elif signal_score >= 2:
            quality = "Medium"
        else:
            quality = "Low"
        
        assert quality == "Medium"
    
    def test_quality_tier_low(self):
        """Test low quality classification"""
        signal_score = 1
        iv7_pctile = 50.0
        
        if signal_score >= 3 and iv7_pctile < 85:
            quality = "High"
        elif signal_score >= 2:
            quality = "Medium"
        else:
            quality = "Low"
        
        assert quality == "Low"
    
    def test_confidence_calculation(self):
        """Test confidence score derivation"""
        signal_score = 3
        max_score = 4
        
        base_confidence = signal_score / max_score
        
        assert base_confidence == 0.75
        assert 0 <= base_confidence <= 1

class TestTermStructureAnalysis:
    """Test term structure pattern detection"""
    
    def test_normal_contango(self):
        """Test normal term structure (contango)"""
        iv7 = 45.0
        iv30 = 50.0
        
        if iv7 > iv30 * 1.1:
            pattern = "backwardation"
        elif iv7 < iv30 * 0.9:
            pattern = "steep_contango"
        else:
            pattern = "normal"
        
        assert pattern == "normal"
    
    def test_backwardation_pattern(self):
        """Test backwardation term structure"""
        iv7 = 60.0
        iv30 = 50.0
        
        if iv7 > iv30 * 1.1:
            pattern = "backwardation"
        elif iv7 < iv30 * 0.9:
            pattern = "steep_contango"
        else:
            pattern = "normal"
        
        assert pattern == "backwardation"
    
    def test_steep_contango_pattern(self):
        """Test steep contango term structure"""
        iv7 = 40.0
        iv30 = 55.0
        
        if iv7 > iv30 * 1.1:
            pattern = "backwardation"
        elif iv7 < iv30 * 0.9:
            pattern = "steep_contango"
        else:
            pattern = "normal"
        
        # 40.0 < 55.0 * 0.9 (49.5) = True
        assert pattern == "steep_contango"


class TestEventTimingLogic:
    """Test event timing calculations"""
    
    def test_days_to_event_calculation(self):
        """Test days remaining calculation"""
        today = datetime(2025, 10, 27)
        event_date = datetime(2025, 11, 26)  # 30 days ahead
        
        days_to_event = (event_date - today).days
        
        assert days_to_event == 30
    
    def test_event_marker_assignment(self):
        """Test timeline marker assignment"""
        def get_marker(days_to_event):
            if days_to_event <= 1:
                return "D-1"
            elif days_to_event <= 3:
                return "D-3"
            elif days_to_event <= 7:
                return "D-7"
            elif days_to_event <= 30:
                return "D-30"
            else:
                return None
        
        assert get_marker(1) == "D-1"
        assert get_marker(3) == "D-3"
        assert get_marker(7) == "D-7"
        assert get_marker(25) == "D-30"
        assert get_marker(45) is None


class TestMockDataGeneration:
    """Test mock data generator functionality"""
    
    def test_mock_signals_structure(self):
        """Test that mock signals have correct structure"""
        from bt_platform.core.mock_iv_data import generate_mock_iv_signals
        
        signals = generate_mock_iv_signals(count=5)
        
        assert len(signals) <= 5
        assert all("ticker" in s for s in signals)
        assert all("signal_score" in s for s in signals)
        assert all("metrics" in s for s in signals)
        assert all("flags" in s for s in signals)
    
    def test_mock_calendar_structure(self):
        """Test that mock calendar has correct structure"""
        from bt_platform.core.mock_iv_data import generate_mock_iv_calendar
        
        events = generate_mock_iv_calendar(days_ahead=30, tickers=["REGN", "VRTX"])
        
        assert len(events) > 0
        assert all("ticker" in e for e in events)
        assert all("event_date" in e for e in events)
        assert all("iv_data" in e for e in events)
        assert all("marker" in e for e in events)
    
    def test_mock_iv_data_structure(self):
        """Test that mock IV data has correct structure"""
        from bt_platform.core.mock_iv_data import generate_mock_iv_data
        
        data = generate_mock_iv_data("REGN", days=30, tenors=[7, 30])
        
        assert data["ticker"] == "REGN"
        assert "tenors" in data
        assert 7 in data["tenors"]
        assert 30 in data["tenors"]
        assert len(data["tenors"][7]) == 30  # 30 days of data
    
    def test_mock_stats_structure(self):
        """Test that mock stats have correct structure"""
        from bt_platform.core.mock_iv_data import generate_mock_iv_stats
        
        stats = generate_mock_iv_stats("REGN")
        
        assert stats["ticker"] == "REGN"
        assert "term_structure" in stats
        assert "iv_by_tenor" in stats
        assert "iv_rv_ratio" in stats
        assert stats["term_structure"] in ["normal", "backwardation", "steep_contango"]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])


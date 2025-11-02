"""
Tests for MVM (Market-Moving) Alpha Scoring Module
"""

import pytest

from bt_platform.core.prediction.mvm_alpha import (
    CatalystEvent,
    _asymmetry,
    _attention,
    _impact,
    _surprise,
    mini_backtest,
    mvm_score,
    score_events,
    trade_playbook,
    upcoming_watchlist,
)


class TestMVMScoringFeatures:
    """Test individual scoring features"""

    def test_impact_phase3(self):
        """Test impact score for Phase 3 readout"""
        score = _impact("Phase3_readout")
        assert score == 1.0

    def test_impact_crl(self):
        """Test impact score for CRL"""
        score = _impact("CRL")
        assert score == 1.0

    def test_impact_approval(self):
        """Test impact score for Approval"""
        score = _impact("Approval")
        assert score == 0.9

    def test_impact_phase2(self):
        """Test impact score for Phase 2 readout"""
        score = _impact("Phase2_readout")
        assert score == 0.8

    def test_impact_default(self):
        """Test impact score for unknown event type"""
        score = _impact("Unknown")
        assert score == 0.5

    def test_surprise_with_effect_ratio(self):
        """Test surprise score with effect ratio"""
        event = CatalystEvent(
            ticker="TEST",
            company="Test Co",
            date="2025-01-01",
            event_type="Phase3_readout",
            note="Test",
            cap_tier="micro",
            effect_ratio=2.0,
        )
        score = _surprise(event)
        assert 0.5 < score < 0.7  # Should be around 0.55-0.65 for ratio=2

    def test_surprise_with_large_effect_ratio(self):
        """Test surprise score with large effect ratio"""
        event = CatalystEvent(
            ticker="TEST",
            company="Test Co",
            date="2025-01-01",
            event_type="Phase3_readout",
            note="Test",
            cap_tier="micro",
            effect_ratio=4.0,
        )
        score = _surprise(event)
        assert score > 0.8  # Should be around 0.86 for ratio=4

    def test_surprise_crl(self):
        """Test surprise score for CRL without effect ratio"""
        event = CatalystEvent(
            ticker="TEST",
            company="Test Co",
            date="2025-01-01",
            event_type="CRL",
            note="Test",
            cap_tier="micro",
        )
        score = _surprise(event)
        assert score == 0.65

    def test_attention_esmo(self):
        """Test attention score for ESMO"""
        score = _attention("ESMO")
        assert score == 1.0

    def test_attention_btd_viral(self):
        """Test attention score for BTD viral"""
        score = _attention("BTD_viral")
        assert score == 1.0

    def test_attention_fda_cr(self):
        """Test attention score for FDA CR"""
        score = _attention("FDA_CR")
        assert score == 0.9

    def test_attention_press(self):
        """Test attention score for press"""
        score = _attention("press")
        assert score == 0.7

    def test_asymmetry_micro(self):
        """Test asymmetry score for micro cap"""
        score = _asymmetry("micro")
        assert score == 0.9

    def test_asymmetry_smid(self):
        """Test asymmetry score for small/mid cap"""
        score = _asymmetry("smid")
        assert score == 0.7

    def test_asymmetry_large(self):
        """Test asymmetry score for large cap"""
        score = _asymmetry("large")
        assert score == 0.3


class TestMVMScore:
    """Test MVM score calculation"""

    def test_mvm_score_high(self):
        """Test MVM score for high-impact event"""
        event = CatalystEvent(
            ticker="CELC",
            company="Celcuity",
            date="2025-10-20",
            event_type="Phase3_readout",
            note="ESMO VIKTORIA-1",
            cap_tier="micro",
            effect_ratio=4.5,
            attention="ESMO",
        )
        score = mvm_score(event)
        assert score > 90  # High impact + high surprise + high attention + high asymmetry

    def test_mvm_score_medium(self):
        """Test MVM score for medium-impact event"""
        event = CatalystEvent(
            ticker="TEST",
            company="Test Co",
            date="2025-01-01",
            event_type="Phase2_readout",
            note="Test",
            cap_tier="smid",
            effect_ratio=2.0,
            attention="press",
        )
        score = mvm_score(event)
        assert 60 < score < 80

    def test_mvm_score_low(self):
        """Test MVM score for low-impact event"""
        event = CatalystEvent(
            ticker="IONS",
            company="Ionis",
            date="2025-08-21",
            event_type="Approval",
            note="Expected approval",
            cap_tier="large",
            attention="FDA_approval",
        )
        score = mvm_score(event)
        assert score < 65  # Expected approval, large cap, low asymmetry


class TestTradePlaybook:
    """Test trade playbook recommendations"""

    def test_playbook_high_score_up(self):
        """Test playbook for high score with up direction"""
        event = CatalystEvent(
            ticker="TEST",
            company="Test Co",
            date="2025-01-01",
            event_type="Phase3_readout",
            note="Test",
            cap_tier="micro",
        )
        score = 75.0
        result = trade_playbook(event, score)
        assert result["expected_direction"] == "Up"
        assert "Long gamma" in result["stance"]

    def test_playbook_high_score_down(self):
        """Test playbook for high score with down direction (CRL)"""
        event = CatalystEvent(
            ticker="TEST",
            company="Test Co",
            date="2025-01-01",
            event_type="CRL",
            note="Test",
            cap_tier="micro",
        )
        score = 85.0
        result = trade_playbook(event, score)
        assert result["expected_direction"] == "Down"
        assert "Long gamma" in result["stance"]

    def test_playbook_medium_score(self):
        """Test playbook for medium score"""
        event = CatalystEvent(
            ticker="TEST",
            company="Test Co",
            date="2025-01-01",
            event_type="Phase2_readout",
            note="Test",
            cap_tier="smid",
        )
        score = 65.0
        result = trade_playbook(event, score)
        assert result["expected_direction"] == "Up"
        assert "Directionally" in result["stance"]

    def test_playbook_low_score(self):
        """Test playbook for low score"""
        event = CatalystEvent(
            ticker="TEST",
            company="Test Co",
            date="2025-01-01",
            event_type="Approval",
            note="Test",
            cap_tier="large",
        )
        score = 50.0
        result = trade_playbook(event, score)
        assert result["expected_direction"] == "Up"
        assert "Sell premium" in result["stance"]


class TestScoreEvents:
    """Test batch event scoring"""

    def test_score_single_event(self):
        """Test scoring a single event"""
        events = [
            CatalystEvent(
                ticker="TEST",
                company="Test Co",
                date="2025-01-01",
                event_type="Phase3_readout",
                note="Test event",
                cap_tier="micro",
            )
        ]
        results = score_events(events)
        assert len(results) == 1
        assert results[0]["ticker"] == "TEST"
        assert "mvm_score" in results[0]
        assert "expected_direction" in results[0]
        assert "stance" in results[0]

    def test_score_multiple_events(self):
        """Test scoring multiple events"""
        events = [
            CatalystEvent(
                ticker="TEST1",
                company="Test Co 1",
                date="2025-01-01",
                event_type="Phase3_readout",
                note="Test 1",
                cap_tier="micro",
            ),
            CatalystEvent(
                ticker="TEST2",
                company="Test Co 2",
                date="2025-01-02",
                event_type="CRL",
                note="Test 2",
                cap_tier="smid",
            ),
        ]
        results = score_events(events)
        assert len(results) == 2
        assert results[0]["ticker"] == "TEST1"
        assert results[1]["ticker"] == "TEST2"


class TestBacktest:
    """Test backtest functionality"""

    def test_mini_backtest_structure(self):
        """Test backtest returns expected structure"""
        result = mini_backtest()
        assert "table" in result
        assert "metrics" in result
        assert isinstance(result["table"], list)
        assert isinstance(result["metrics"], dict)

    def test_mini_backtest_metrics(self):
        """Test backtest metrics are calculated correctly"""
        result = mini_backtest()
        metrics = result["metrics"]

        assert "n_events" in metrics
        assert "n_real_movers" in metrics
        assert "n_pred_movers" in metrics
        assert "precision" in metrics
        assert "recall" in metrics
        assert "accuracy" in metrics
        assert "direction_hit_rate" in metrics

        # Check metrics are in valid ranges
        assert 0 <= metrics["precision"] <= 1
        assert 0 <= metrics["recall"] <= 1
        assert 0 <= metrics["accuracy"] <= 1
        assert 0 <= metrics["direction_hit_rate"] <= 1

    def test_mini_backtest_five_events(self):
        """Test backtest includes 5 documented events"""
        result = mini_backtest()
        assert result["metrics"]["n_events"] == 5

    def test_mini_backtest_high_accuracy(self):
        """Test backtest achieves documented high accuracy"""
        result = mini_backtest()
        # Based on problem statement, should achieve perfect metrics
        assert result["metrics"]["accuracy"] >= 0.9
        assert result["metrics"]["precision"] >= 0.9
        assert result["metrics"]["recall"] >= 0.9


class TestUpcomingWatchlist:
    """Test upcoming watchlist functionality"""

    def test_upcoming_watchlist_returns_events(self):
        """Test upcoming watchlist returns events"""
        events = upcoming_watchlist()
        assert len(events) > 0
        assert all(isinstance(e, CatalystEvent) for e in events)

    def test_upcoming_watchlist_has_arwr(self):
        """Test watchlist includes ARWR"""
        events = upcoming_watchlist()
        tickers = [e.ticker for e in events]
        assert "ARWR" in tickers

    def test_upcoming_watchlist_scoreable(self):
        """Test watchlist events can be scored"""
        events = upcoming_watchlist()
        results = score_events(events)
        assert len(results) == len(events)
        assert all("mvm_score" in r for r in results)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

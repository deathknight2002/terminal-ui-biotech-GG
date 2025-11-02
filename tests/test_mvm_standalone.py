#!/usr/bin/env python3
"""
Standalone test for MVM Alpha module
Run without dependencies using: python3 test_mvm_standalone.py
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import directly from file to avoid package __init__.py
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


def test_impact_scores():
    """Test impact score calculations"""
    print("Testing impact scores...")
    assert _impact("Phase3_readout") == 1.0
    assert _impact("CRL") == 1.0
    assert _impact("Approval") == 0.9
    assert _impact("Phase2_readout") == 0.8
    assert _impact("Unknown") == 0.5
    print("✓ Impact scores work correctly")


def test_surprise_scores():
    """Test surprise score calculations"""
    print("\nTesting surprise scores...")

    # Test with effect ratio
    event1 = CatalystEvent(
        ticker="TEST",
        company="Test Co",
        date="2025-01-01",
        event_type="Phase3_readout",
        note="Test",
        cap_tier="micro",
        effect_ratio=2.0,
    )
    score1 = _surprise(event1)
    assert 0.5 < score1 < 0.7, f"Expected 0.5-0.7, got {score1}"

    # Test with large effect ratio
    event2 = CatalystEvent(
        ticker="TEST",
        company="Test Co",
        date="2025-01-01",
        event_type="Phase3_readout",
        note="Test",
        cap_tier="micro",
        effect_ratio=4.0,
    )
    score2 = _surprise(event2)
    assert score2 > 0.8, f"Expected >0.8, got {score2}"

    # Test CRL without effect ratio
    event3 = CatalystEvent(
        ticker="TEST",
        company="Test Co",
        date="2025-01-01",
        event_type="CRL",
        note="Test",
        cap_tier="micro",
    )
    assert _surprise(event3) == 0.65
    print("✓ Surprise scores work correctly")


def test_attention_scores():
    """Test attention score calculations"""
    print("\nTesting attention scores...")
    assert _attention("ESMO") == 1.0
    assert _attention("BTD_viral") == 1.0
    assert _attention("FDA_CR") == 0.9
    assert _attention("press") == 0.7
    print("✓ Attention scores work correctly")


def test_asymmetry_scores():
    """Test asymmetry score calculations"""
    print("\nTesting asymmetry scores...")
    assert _asymmetry("micro") == 0.9
    assert _asymmetry("smid") == 0.7
    assert _asymmetry("large") == 0.3
    print("✓ Asymmetry scores work correctly")


def test_mvm_score_calculation():
    """Test MVM score calculation"""
    print("\nTesting MVM score calculation...")

    # High impact event
    event1 = CatalystEvent(
        ticker="CELC",
        company="Celcuity",
        date="2025-10-20",
        event_type="Phase3_readout",
        note="ESMO VIKTORIA-1",
        cap_tier="micro",
        effect_ratio=4.5,
        attention="ESMO",
    )
    score1 = mvm_score(event1)
    assert score1 > 90, f"Expected >90, got {score1}"

    # Low impact event
    event2 = CatalystEvent(
        ticker="IONS",
        company="Ionis",
        date="2025-08-21",
        event_type="Approval",
        note="Expected approval",
        cap_tier="large",
        attention="FDA_approval",
    )
    score2 = mvm_score(event2)
    assert score2 < 65, f"Expected <65, got {score2}"
    print("✓ MVM score calculation works correctly")


def test_trade_playbook():
    """Test trade playbook recommendations"""
    print("\nTesting trade playbook...")

    event = CatalystEvent(
        ticker="TEST",
        company="Test Co",
        date="2025-01-01",
        event_type="Phase3_readout",
        note="Test",
        cap_tier="micro",
    )

    # High score
    result1 = trade_playbook(event, 75.0)
    assert result1["expected_direction"] == "Up"
    assert "Long gamma" in result1["stance"]

    # Medium score
    result2 = trade_playbook(event, 65.0)
    assert result2["expected_direction"] == "Up"
    assert "Directionally" in result2["stance"]

    # Low score
    result3 = trade_playbook(event, 50.0)
    assert result3["expected_direction"] == "Up"
    assert "Sell premium" in result3["stance"]

    # CRL (down direction)
    event_crl = CatalystEvent(
        ticker="TEST",
        company="Test Co",
        date="2025-01-01",
        event_type="CRL",
        note="Test",
        cap_tier="micro",
    )
    result4 = trade_playbook(event_crl, 85.0)
    assert result4["expected_direction"] == "Down"
    print("✓ Trade playbook works correctly")


def test_score_events():
    """Test batch event scoring"""
    print("\nTesting batch event scoring...")

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
    assert "mvm_score" in results[0]
    assert "expected_direction" in results[0]
    assert "stance" in results[0]
    print("✓ Batch event scoring works correctly")


def test_mini_backtest():
    """Test backtest functionality"""
    print("\nTesting mini backtest...")

    result = mini_backtest()
    assert "table" in result
    assert "metrics" in result
    assert isinstance(result["table"], list)
    assert isinstance(result["metrics"], dict)

    metrics = result["metrics"]
    assert "n_events" in metrics
    assert "precision" in metrics
    assert "recall" in metrics
    assert "accuracy" in metrics
    assert "direction_hit_rate" in metrics

    # Check metrics are in valid ranges
    assert 0 <= metrics["precision"] <= 1
    assert 0 <= metrics["recall"] <= 1
    assert 0 <= metrics["accuracy"] <= 1
    assert 0 <= metrics["direction_hit_rate"] <= 1

    # Should have 5 events
    assert metrics["n_events"] == 5

    # Should achieve high accuracy based on problem statement
    assert metrics["accuracy"] >= 0.9
    assert metrics["precision"] >= 0.9
    assert metrics["recall"] >= 0.9

    print(f"✓ Backtest works correctly")
    print(f"  - Precision: {metrics['precision']:.2f}")
    print(f"  - Recall: {metrics['recall']:.2f}")
    print(f"  - Accuracy: {metrics['accuracy']:.2f}")
    print(f"  - Direction Hit Rate: {metrics['direction_hit_rate']:.2f}")


def test_upcoming_watchlist():
    """Test upcoming watchlist"""
    print("\nTesting upcoming watchlist...")

    events = upcoming_watchlist()
    assert len(events) > 0
    assert all(isinstance(e, CatalystEvent) for e in events)

    # Check ARWR is in watchlist
    tickers = [e.ticker for e in events]
    assert "ARWR" in tickers

    # Check events can be scored
    results = score_events(events)
    assert len(results) == len(events)
    assert all("mvm_score" in r for r in results)
    print("✓ Upcoming watchlist works correctly")


def run_all_tests():
    """Run all tests"""
    print("=" * 60)
    print("MVM Alpha Module Standalone Tests")
    print("=" * 60)

    try:
        test_impact_scores()
        test_surprise_scores()
        test_attention_scores()
        test_asymmetry_scores()
        test_mvm_score_calculation()
        test_trade_playbook()
        test_score_events()
        test_mini_backtest()
        test_upcoming_watchlist()

        print("\n" + "=" * 60)
        print("✅ ALL TESTS PASSED")
        print("=" * 60)
        return 0
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
        return 1
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback

        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(run_all_tests())

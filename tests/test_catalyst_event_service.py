"""
Unit tests for Catalyst Event Service

Tests expectation delta calculation, event retrieval, and peer analysis.
"""

import pytest
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from bt_platform.core.database import (
    Base,
    Catalyst,
    CatalystExpectationBand,
    CatalystOutcomeMetric,
    CatalystPeer,
)
from bt_platform.core.services.catalyst_event_service import (
    compute_expectation_delta,
    get_catalyst_event,
    calculate_all_expectation_deltas,
    get_peer_comparisons,
)


# Test database setup
@pytest.fixture(scope="function")
def test_db():
    """Create in-memory test database"""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    yield db
    db.close()


class TestExpectationDelta:
    """Test expectation delta calculation logic"""
    
    def test_beat_high(self):
        """Test beat case when outcome exceeds high band"""
        outcome = {"value": 10.0}
        band = {"band_low": 5.0, "band_high": 8.0}
        
        result = compute_expectation_delta(outcome, band)
        
        assert result["class"] == "beat"
        assert result["score"] > 0
        assert result["score"] <= 1.0
    
    def test_miss_low(self):
        """Test miss case when outcome below low band"""
        outcome = {"value": 3.0}
        band = {"band_low": 5.0, "band_high": 8.0}
        
        result = compute_expectation_delta(outcome, band)
        
        assert result["class"] == "miss"
        assert result["score"] > 0
        assert result["score"] <= 1.0
    
    def test_inline(self):
        """Test inline case when outcome within band"""
        outcome = {"value": 6.5}
        band = {"band_low": 5.0, "band_high": 8.0}
        
        result = compute_expectation_delta(outcome, band)
        
        assert result["class"] == "inline"
        assert result["score"] == 0.2
    
    def test_beat_magnitude(self):
        """Test beat magnitude scales with distance from band"""
        band = {"band_low": 5.0, "band_high": 8.0}
        
        # Small beat
        outcome_small = {"value": 8.5}
        result_small = compute_expectation_delta(outcome_small, band)
        
        # Large beat
        outcome_large = {"value": 16.0}  # 2x the high band
        result_large = compute_expectation_delta(outcome_large, band)
        
        assert result_small["class"] == "beat"
        assert result_large["class"] == "beat"
        assert result_large["score"] >= result_small["score"]
    
    def test_missing_value(self):
        """Test handling of missing outcome value"""
        outcome = {}
        band = {"band_low": 5.0, "band_high": 8.0}
        
        result = compute_expectation_delta(outcome, band)
        
        assert result["class"] == "inline"
        assert result["score"] == 0.0
    
    def test_missing_bands(self):
        """Test handling of missing expectation bands"""
        outcome = {"value": 10.0}
        band = {}
        
        result = compute_expectation_delta(outcome, band)
        
        assert result["class"] == "inline"
        assert result["score"] == 0.2
    
    def test_zero_handling(self):
        """Test handling of zero values in bands"""
        outcome = {"value": 5.0}
        band = {"band_low": 0.0, "band_high": 3.0}
        
        result = compute_expectation_delta(outcome, band)
        
        assert result["class"] == "beat"
        assert result["score"] > 0


class TestCatalystEventRetrieval:
    """Test full catalyst event retrieval"""
    
    def test_get_catalyst_event(self, test_db):
        """Test retrieving full catalyst event with all related data"""
        # Create test catalyst
        catalyst = Catalyst(
            name="Test Catalyst",
            company="TestCo",
            drug="TestDrug",
            event_type="M&A",
            event_date=datetime(2025, 10, 27),
            description="Test M&A event",
        )
        test_db.add(catalyst)
        test_db.flush()
        
        # Add expectation
        expectation = CatalystExpectationBand(
            catalyst_id=catalyst.id,
            metric="Deal Premium",
            unit="%",
            expected=30.0,
            band_low=20.0,
            band_high=40.0,
            source="sell_side",
            what_matters="Signal on appetite",
        )
        test_db.add(expectation)
        
        # Add outcome
        outcome = CatalystOutcomeMetric(
            catalyst_id=catalyst.id,
            metric="Deal Premium",
            unit="%",
            value=46.0,
        )
        test_db.add(outcome)
        test_db.commit()
        
        # Retrieve event
        event = get_catalyst_event(test_db, catalyst.id)
        
        assert event is not None
        assert event["event_id"] == f"catalyst_{catalyst.id}"
        assert event["company"]["name"] == "TestCo"
        assert event["catalyst"]["type"] == "M&A"
        assert len(event["expectations"]["metrics"]) == 1
        assert len(event["outcome"]["metrics"]) == 1
        assert event["expectations"]["metrics"][0]["metric"] == "Deal Premium"
        assert event["outcome"]["metrics"][0]["value"] == 46.0
    
    def test_get_nonexistent_catalyst(self, test_db):
        """Test retrieving non-existent catalyst returns None"""
        event = get_catalyst_event(test_db, 9999)
        assert event is None


class TestExpectationDeltasCalculation:
    """Test calculating all expectation deltas for a catalyst"""
    
    def test_calculate_all_deltas(self, test_db):
        """Test calculating deltas for multiple metrics"""
        # Create catalyst
        catalyst = Catalyst(
            name="Multi-Metric Test",
            company="TestCo",
            drug="TestDrug",
            event_type="PH3_READOUT",
            event_date=datetime(2025, 10, 20),
        )
        test_db.add(catalyst)
        test_db.flush()
        
        # Add expectations
        expectations = [
            CatalystExpectationBand(
                catalyst_id=catalyst.id,
                metric="Efficacy",
                unit="%",
                expected=60.0,
                band_low=50.0,
                band_high=70.0,
                source="consensus",
                what_matters="Primary endpoint",
            ),
            CatalystExpectationBand(
                catalyst_id=catalyst.id,
                metric="Safety",
                unit="%",
                expected=90.0,
                band_low=85.0,
                band_high=95.0,
                source="consensus",
                what_matters="AE rate",
            ),
        ]
        test_db.add_all(expectations)
        
        # Add outcomes
        outcomes = [
            CatalystOutcomeMetric(
                catalyst_id=catalyst.id,
                metric="Efficacy",
                unit="%",
                value=75.0,  # Beat
            ),
            CatalystOutcomeMetric(
                catalyst_id=catalyst.id,
                metric="Safety",
                unit="%",
                value=88.0,  # Inline
            ),
        ]
        test_db.add_all(outcomes)
        test_db.commit()
        
        # Calculate deltas
        deltas = calculate_all_expectation_deltas(test_db, catalyst.id)
        
        assert len(deltas) == 2
        
        # Check efficacy delta (beat)
        efficacy_delta = next(d for d in deltas if d["metric"] == "Efficacy")
        assert efficacy_delta["expected"] == 60.0
        assert efficacy_delta["actual"] == 75.0
        assert efficacy_delta["delta"]["class"] == "beat"
        
        # Check safety delta (inline)
        safety_delta = next(d for d in deltas if d["metric"] == "Safety")
        assert safety_delta["expected"] == 90.0
        assert safety_delta["actual"] == 88.0
        assert safety_delta["delta"]["class"] == "inline"


class TestPeerComparison:
    """Test peer comparison functionality"""
    
    def test_get_peer_comparisons(self, test_db):
        """Test retrieving peer comparisons with moat axes"""
        # Create catalyst
        catalyst = Catalyst(
            name="Peer Test",
            company="TestCo",
            drug="TestDrug",
            event_type="M&A",
            event_date=datetime(2025, 10, 27),
        )
        test_db.add(catalyst)
        test_db.flush()
        
        # Add peers
        peers = [
            CatalystPeer(
                catalyst_id=catalyst.id,
                peer_ticker="PEER1",
                peer_name="Peer One",
                reason_tag="Similar MoA",
                weight=0.8,
                moat_moa=True,
                moat_indication=True,
            ),
            CatalystPeer(
                catalyst_id=catalyst.id,
                peer_ticker="PEER2",
                peer_name="Peer Two",
                reason_tag="Same stage",
                weight=0.5,
                moat_stage=True,
            ),
        ]
        test_db.add_all(peers)
        test_db.commit()
        
        # Get peer comparisons
        peer_list = get_peer_comparisons(test_db, catalyst.id)
        
        assert len(peer_list) == 2
        
        # Check ordering by weight (descending)
        assert peer_list[0]["ticker"] == "PEER1"
        assert peer_list[0]["weight"] == 0.8
        assert "MoA" in peer_list[0]["moat_axes"]
        assert "Indication" in peer_list[0]["moat_axes"]
        
        assert peer_list[1]["ticker"] == "PEER2"
        assert peer_list[1]["weight"] == 0.5
        assert "Stage" in peer_list[1]["moat_axes"]
        assert "MoA" not in peer_list[1]["moat_axes"]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

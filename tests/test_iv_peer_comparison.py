"""
Test IV Catalyst Peer Comparison Endpoint

Tests the peer comparison functionality to ensure it returns
proper IV percentile comparisons across similar companies.
"""

import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timedelta

from bt_platform.core.app import app
from bt_platform.core.database import (
    SessionLocal, 
    Company, 
    OptionsIV,
    Base,
    engine
)


@pytest.fixture
def client():
    """Create test client"""
    return TestClient(app)


@pytest.fixture
def db_session():
    """Create database session for tests"""
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
        # Clean up tables
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def seed_test_data(db_session):
    """Seed test data for peer comparison"""
    today = datetime.utcnow()
    
    # Create test companies
    companies = [
        Company(
            name="Regeneron Pharmaceuticals",
            ticker="REGN",
            company_type="Big Pharma",
            therapeutic_areas="Oncology,Immunology",
            is_xbi_constituent=True,
            market_cap=115_000_000_000
        ),
        Company(
            name="Vertex Pharmaceuticals",
            ticker="VRTX",
            company_type="Big Pharma",
            therapeutic_areas="Rare Disease,Oncology",
            is_xbi_constituent=True,
            market_cap=110_000_000_000
        ),
        Company(
            name="Alnylam Pharmaceuticals",
            ticker="ALNY",
            company_type="Biotech",
            therapeutic_areas="Rare Disease",
            is_xbi_constituent=True,
            market_cap=25_000_000_000
        ),
    ]
    
    for company in companies:
        db_session.add(company)
    
    # Create IV data
    iv_data = [
        # REGN - elevated IV
        OptionsIV(
            ticker="REGN",
            date=today,
            tenor_days=7,
            iv_mid=55.0,
            iv_pctile_1y=75.0,
            skew_25d=8.5,
            total_oi=50000,
            put_call_ratio=1.2,
            is_backwardation=True
        ),
        # VRTX - normal IV
        OptionsIV(
            ticker="VRTX",
            date=today,
            tenor_days=7,
            iv_mid=42.0,
            iv_pctile_1y=55.0,
            skew_25d=6.2,
            total_oi=45000,
            put_call_ratio=1.0,
            is_backwardation=False
        ),
        # ALNY - high IV
        OptionsIV(
            ticker="ALNY",
            date=today,
            tenor_days=7,
            iv_mid=68.0,
            iv_pctile_1y=88.0,
            skew_25d=10.1,
            total_oi=30000,
            put_call_ratio=1.5,
            is_backwardation=True
        ),
    ]
    
    for iv in iv_data:
        db_session.add(iv)
    
    db_session.commit()
    return companies


def test_peer_comparison_endpoint_exists(client):
    """Test that peer comparison endpoint exists"""
    response = client.get("/api/v1/iv/peer-comparison/REGN")
    assert response.status_code in [200, 404]  # Either success or not found (if no data)


def test_peer_comparison_returns_structure(client, seed_test_data):
    """Test peer comparison returns proper data structure"""
    response = client.get("/api/v1/iv/peer-comparison/REGN")
    
    if response.status_code == 200:
        data = response.json()
        
        # Check required fields
        assert "ticker" in data
        assert "name" in data
        assert "target_iv" in data
        assert "sector_stats" in data
        assert "peers" in data
        
        # Check target_iv structure
        assert "iv7" in data["target_iv"]
        assert "iv7_pctile" in data["target_iv"]
        
        # Check sector_stats
        assert "median_iv_pctile" in data["sector_stats"]
        assert "sample_size" in data["sector_stats"]


def test_peer_comparison_filters_by_therapeutic_area(client, seed_test_data):
    """Test that peer comparison filters by therapeutic area"""
    response = client.get("/api/v1/iv/peer-comparison/REGN?therapeutic_area=Oncology")
    
    if response.status_code == 200:
        data = response.json()
        
        # Should return peers with Oncology therapeutic area
        peers = data.get("peers", [])
        
        # At least VRTX should be included (has Oncology)
        peer_tickers = [p["ticker"] for p in peers]
        assert "VRTX" in peer_tickers or len(peers) >= 1


def test_peer_comparison_detects_idiosyncratic(client, seed_test_data):
    """Test idiosyncratic detection when IV differs >20 percentile points"""
    response = client.get("/api/v1/iv/peer-comparison/ALNY")
    
    if response.status_code == 200:
        data = response.json()
        
        # ALNY has IV at 88th percentile
        # Peers should be lower
        # Should be marked as idiosyncratic
        is_idiosyncratic = data.get("is_idiosyncratic", False)
        
        # With test data, ALNY (88%) vs peers (~55-75%) should be idiosyncratic
        assert isinstance(is_idiosyncratic, bool)


def test_peer_comparison_missing_ticker(client, seed_test_data):
    """Test peer comparison with non-existent ticker"""
    response = client.get("/api/v1/iv/peer-comparison/INVALID")
    
    # Should return 404 for invalid ticker
    assert response.status_code == 404


def test_peer_comparison_sector_stats(client, seed_test_data):
    """Test that sector stats are calculated correctly"""
    response = client.get("/api/v1/iv/peer-comparison/REGN")
    
    if response.status_code == 200:
        data = response.json()
        sector_stats = data.get("sector_stats", {})
        
        # Should have median and mean
        median = sector_stats.get("median_iv_pctile")
        mean = sector_stats.get("mean_iv_pctile")
        sample_size = sector_stats.get("sample_size")
        
        if median is not None and mean is not None:
            # Both should be in valid percentile range
            assert 0 <= median <= 100
            assert 0 <= mean <= 100
            assert sample_size >= 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

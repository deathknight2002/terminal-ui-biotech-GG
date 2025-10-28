"""
Seed Catalyst Events
====================

Seeds example catalyst events from the problem statement:
1. Novartis → Avidity M&A
2. BridgeBio FORTIFY readout
3. Intellia MAGNITUDE pause
4. Bayer Elinzanetant (Lynkuet) approval
5. Lilly Omvoh label update

Run with: poetry run python bt_platform/core/seed_catalyst_events.py
"""

import sys
import os
from datetime import datetime, date, timedelta
from decimal import Decimal

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from bt_platform.core.schema_catalyst_extensions import (
    ExpectationBand,
    CatalystOutcome,
    MarketReaction,
    PeerComparison,
    EventSource,
    MandADealDetail,
    SafetyEventDetail,
    Base
)
from bt_platform.core.database import Base as MainBase, engine


def seed_catalyst_events():
    """Seed example catalyst events."""
    
    # Create session
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        # Create tables if they don't exist
        Base.metadata.create_all(bind=engine)
        
        print("Seeding catalyst events...")
        
        # ================================================================
        # Event 1: Novartis → Avidity M&A
        # ================================================================
        event_id_1 = "01J9NOVARTIS_AVIDITY_MA"
        
        # Expectations
        expectations_1 = [
            ExpectationBand(
                event_id=event_id_1,
                metric="Deal Premium",
                unit="%",
                expected=Decimal("30"),
                band_low=Decimal("20"),
                band_high=Decimal("40"),
                source="sell_side",
                what_matters="Signal on RNA appetite",
                collected_at=datetime(2025, 10, 26, 12, 0),
                quality_flag="VERIFIED"
            ),
            ExpectationBand(
                event_id=event_id_1,
                metric="SpinCo Required",
                unit="bool",
                expected=Decimal("0"),
                band_low=Decimal("0"),
                band_high=Decimal("0"),
                source="sell_side",
                collected_at=datetime(2025, 10, 26, 12, 0),
                quality_flag="VERIFIED"
            )
        ]
        
        # Outcomes
        outcomes_1 = [
            CatalystOutcome(
                event_id=event_id_1,
                metric="Deal Premium",
                unit="%",
                value=Decimal("46"),
                expectation_class="beat",
                expectation_score=0.4
            ),
            CatalystOutcome(
                event_id=event_id_1,
                metric="Consideration",
                unit="$B",
                value=Decimal("12.0")
            ),
            CatalystOutcome(
                event_id=event_id_1,
                metric="SpinCo Required",
                unit="bool",
                value=Decimal("1"),
                expectation_class="miss",
                expectation_score=1.0
            )
        ]
        
        # Market reactions
        reactions_1 = [
            MarketReaction(
                event_id=event_id_1,
                ticker="AVDX",
                window="D0",
                window_date=date(2025, 10, 27),
                price_abs=3.0,
                price_rel_vs_xbi=2.1
            ),
            MarketReaction(
                event_id=event_id_1,
                ticker="AVDX",
                window="D+1",
                window_date=date(2025, 10, 28),
                price_abs=4.5,
                price_rel_vs_xbi=3.2
            )
        ]
        
        # Peers
        peers_1 = [
            PeerComparison(
                event_id=event_id_1,
                peer_ticker="DYNE",
                peer_name="Dyne Therapeutics",
                reason_tag="RNA muscle peer",
                weight=0.5,
                moat_indication=True,
                moat_moa=True
            ),
            PeerComparison(
                event_id=event_id_1,
                peer_ticker="PEPG",
                peer_name="PepGen",
                reason_tag="AOC-adjacent",
                weight=0.3,
                moat_delivery=True
            )
        ]
        
        # M&A details
        manda_detail_1 = MandADealDetail(
            event_id=event_id_1,
            acquirer="Novartis",
            target="Avidity Biosciences",
            deal_premium=46.0,
            consideration=Decimal("12.0"),
            spinco_required=True,
            platform_name="AOC platform",
            therapeutic_focus="Neuromuscular RNA",
            announced_date=date(2025, 10, 27)
        )
        
        # Sources
        sources_1 = [
            EventSource(
                event_id=event_id_1,
                title="Reuters: Novartis to acquire Avidity for $12B",
                url="https://reuters.com/...",
                source_type="press_wire",
                ts=datetime(2025, 10, 27, 8, 30)
            ),
            EventSource(
                event_id=event_id_1,
                title="Novartis Company PR",
                url="https://novartis.com/...",
                source_type="company_pr",
                ts=datetime(2025, 10, 27, 8, 0)
            )
        ]
        
        # Add all Event 1 data
        session.add_all(expectations_1)
        session.add_all(outcomes_1)
        session.add_all(reactions_1)
        session.add_all(peers_1)
        session.add(manda_detail_1)
        session.add_all(sources_1)
        
        # ================================================================
        # Event 2: BridgeBio FORTIFY Readout
        # ================================================================
        event_id_2 = "01J9BRIDGEBIO_FORTIFY"
        
        # Expectations
        expectations_2 = [
            ExpectationBand(
                event_id=event_id_2,
                metric="α-DG glycosylation",
                unit="x",
                expected=Decimal("1.5"),
                band_low=Decimal("1.3"),
                band_high=Decimal("1.6"),
                source="sell_side",
                what_matters="Biomarker response",
                collected_at=datetime(2025, 10, 25, 12, 0),
                quality_flag="VERIFIED"
            ),
            ExpectationBand(
                event_id=event_id_2,
                metric="CK reduction",
                unit="%",
                expected=Decimal("60"),
                band_low=Decimal("50"),
                band_high=Decimal("70"),
                source="sell_side",
                what_matters="Muscle damage marker",
                collected_at=datetime(2025, 10, 25, 12, 0),
                quality_flag="VERIFIED"
            ),
            ExpectationBand(
                event_id=event_id_2,
                metric="Velocity Δ vs PBO",
                unit="m/s",
                expected=Decimal("0.20"),
                band_low=Decimal("0.10"),
                band_high=Decimal("0.25"),
                source="sell_side",
                what_matters="Functional improvement",
                collected_at=datetime(2025, 10, 25, 12, 0),
                quality_flag="VERIFIED"
            ),
            ExpectationBand(
                event_id=event_id_2,
                metric="FVC Δ vs PBO",
                unit="pp",
                expected=Decimal("4"),
                band_low=Decimal("2"),
                band_high=Decimal("5"),
                source="sell_side",
                what_matters="Respiratory function",
                collected_at=datetime(2025, 10, 25, 12, 0),
                quality_flag="VERIFIED"
            )
        ]
        
        # Outcomes (all beats!)
        outcomes_2 = [
            CatalystOutcome(
                event_id=event_id_2,
                metric="α-DG glycosylation",
                unit="x",
                value=Decimal("1.8"),
                expectation_class="beat",
                expectation_score=0.125,
                window="3m"
            ),
            CatalystOutcome(
                event_id=event_id_2,
                metric="CK reduction",
                unit="%",
                value=Decimal("82"),
                expectation_class="beat",
                expectation_score=0.171,
                window="12m"
            ),
            CatalystOutcome(
                event_id=event_id_2,
                metric="Velocity Δ vs PBO",
                unit="m/s",
                value=Decimal("0.27"),
                expectation_class="beat",
                expectation_score=0.08,
                window="12m"
            ),
            CatalystOutcome(
                event_id=event_id_2,
                metric="FVC Δ vs PBO",
                unit="pp",
                value=Decimal("5"),
                expectation_class="inline",
                expectation_score=0.2,
                window="12m"
            )
        ]
        
        # Peers
        peers_2 = [
            PeerComparison(
                event_id=event_id_2,
                peer_ticker="SRPT",
                peer_name="Sarepta Therapeutics",
                reason_tag="Neuromuscular leader",
                weight=0.6,
                moat_indication=True,
                moat_stage=True
            ),
            PeerComparison(
                event_id=event_id_2,
                peer_ticker="DYNE",
                peer_name="Dyne Therapeutics",
                reason_tag="RNA muscle peer",
                weight=0.5,
                moat_indication=True,
                moat_moa=True
            )
        ]
        
        # Sources
        sources_2 = [
            EventSource(
                event_id=event_id_2,
                title="BridgeBio FORTIFY Interim Data",
                url="https://bridgebio.com/...",
                source_type="company_pr",
                ts=datetime(2025, 10, 26, 7, 0)
            )
        ]
        
        session.add_all(expectations_2)
        session.add_all(outcomes_2)
        session.add_all(peers_2)
        session.add_all(sources_2)
        
        # ================================================================
        # Event 3: Intellia MAGNITUDE Pause
        # ================================================================
        event_id_3 = "01J9INTELLIA_MAGNITUDE_PAUSE"
        
        # Safety details
        safety_detail_3 = SafetyEventDetail(
            event_id=event_id_3,
            sae_grade=4,
            signal_type="hepatotoxicity",
            enrollment_status="paused",
            expected_pause_duration_weeks=4,
            resumption_probability=0.7,
            class_risk_baseline=0.02,
            class_read_through="Elevated class risk for in vivo CRISPR; CRSP/BEAM monitoring",
            pause_date=date(2025, 10, 24)
        )
        
        # Market reactions (negative)
        reactions_3 = [
            MarketReaction(
                event_id=event_id_3,
                ticker="NTLA",
                window="D0",
                window_date=date(2025, 10, 24),
                price_abs=-12.5,
                price_rel_vs_xbi=-13.2,
                iv_1m_tenor=85.0,
                iv_1m_zscore=2.1
            ),
            MarketReaction(
                event_id=event_id_3,
                ticker="NTLA",
                window="D+1",
                window_date=date(2025, 10, 25),
                price_abs=-8.3,
                price_rel_vs_xbi=-9.0
            )
        ]
        
        # Peers (for read-through)
        peers_3 = [
            PeerComparison(
                event_id=event_id_3,
                peer_ticker="CRSP",
                peer_name="CRISPR Therapeutics",
                reason_tag="In vivo CRISPR peer",
                weight=0.8,
                moat_moa=True,
                moat_delivery=True
            ),
            PeerComparison(
                event_id=event_id_3,
                peer_ticker="BEAM",
                peer_name="Beam Therapeutics",
                reason_tag="Base editing alternative",
                weight=0.6,
                moat_moa=True
            )
        ]
        
        # Sources
        sources_3 = [
            EventSource(
                event_id=event_id_3,
                title="Intellia Clinical Hold Announcement",
                url="https://intelliatx.com/...",
                source_type="company_pr",
                ts=datetime(2025, 10, 24, 16, 30)
            )
        ]
        
        session.add(safety_detail_3)
        session.add_all(reactions_3)
        session.add_all(peers_3)
        session.add_all(sources_3)
        
        # ================================================================
        # Commit all data
        # ================================================================
        session.commit()
        
        print("✓ Seeded 3 catalyst events:")
        print("  1. Novartis → Avidity M&A")
        print("  2. BridgeBio FORTIFY readout")
        print("  3. Intellia MAGNITUDE pause")
        print("\nEvent IDs:")
        print(f"  - {event_id_1}")
        print(f"  - {event_id_2}")
        print(f"  - {event_id_3}")
        
    except Exception as e:
        session.rollback()
        print(f"✗ Error seeding catalyst events: {e}")
        raise
    finally:
        session.close()


if __name__ == "__main__":
    seed_catalyst_events()

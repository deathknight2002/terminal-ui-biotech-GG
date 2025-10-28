"""
Seed Catalyst Event Examples

Seeds the database with 5 detailed catalyst event examples:
1. Novartis → Avidity ($12B M&A)
2. BridgeBio FORTIFY (BBP-418 Phase 3 readout)
3. Intellia MAGNITUDE Pause (safety event)
4. Bayer Lynkuet Approval
5. Lilly Omvoh (single-injection label update)
"""

from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import logging

from .database import (
    Catalyst,
    CatalystExpectationBand,
    CatalystOutcomeMetric,
    CatalystMarketReaction,
    CatalystPeer,
    CatalystPeerMetric,
    CatalystSource,
)

logger = logging.getLogger(__name__)


def seed_catalyst_events(db: Session):
    """Seed all catalyst event examples"""
    try:
        # Check if already seeded
        existing = db.query(Catalyst).filter(
            Catalyst.name.like("%Avidity%")
        ).first()
        if existing:
            logger.info("Catalyst events already seeded")
            return
        
        logger.info("Seeding catalyst event examples...")
        
        # 1. Novartis → Avidity M&A
        catalyst_1 = seed_novartis_avidity(db)
        
        # 2. BridgeBio FORTIFY
        catalyst_2 = seed_bridgebio_fortify(db)
        
        # 3. Intellia MAGNITUDE Pause
        catalyst_3 = seed_intellia_magnitude(db)
        
        # 4. Bayer Lynkuet Approval
        catalyst_4 = seed_bayer_lynkuet(db)
        
        # 5. Lilly Omvoh Label Update
        catalyst_5 = seed_lilly_omvoh(db)
        
        db.commit()
        logger.info("✅ Seeded 5 catalyst event examples successfully")
        
    except Exception as e:
        logger.error(f"Error seeding catalyst events: {e}")
        db.rollback()
        raise


def seed_novartis_avidity(db: Session) -> Catalyst:
    """1. Novartis → Avidity ($12B M&A)"""
    # Create catalyst
    catalyst = Catalyst(
        name="Novartis Acquires Avidity",
        title="Novartis → Avidity $12B Acquisition",
        company="Novartis",
        drug="AOC platform",
        kind="M&A",
        event_type="M&A",
        event_date=datetime(2025, 10, 27),
        date=datetime(2025, 10, 27),
        probability=1.0,
        impact="High",
        description="$12B tender offer for Avidity's AOC platform (Neuromuscular RNA)",
        status="Completed",
        event_leverage=4,
        timing_clarity=3,
        surprise_factor=2,
        downside_contained=2,
        market_depth=3,
    )
    db.add(catalyst)
    db.flush()
    
    # Expectation bands
    expectations = [
        CatalystExpectationBand(
            catalyst_id=catalyst.id,
            metric="Deal Premium",
            unit="%",
            expected=30.0,
            band_low=20.0,
            band_high=40.0,
            source="sell_side",
            what_matters="Signal on RNA appetite",
        ),
        CatalystExpectationBand(
            catalyst_id=catalyst.id,
            metric="SpinCo Required",
            unit="bool",
            expected=0.0,  # false
            band_low=0.0,
            band_high=0.0,
            source="mgmt_guide",
            what_matters="Deal complexity and closing timeline",
        ),
    ]
    db.add_all(expectations)
    
    # Outcomes
    outcomes = [
        CatalystOutcomeMetric(
            catalyst_id=catalyst.id,
            metric="Deal Premium",
            unit="%",
            value=46.0,
        ),
        CatalystOutcomeMetric(
            catalyst_id=catalyst.id,
            metric="Consideration",
            unit="$B",
            value=12.0,
        ),
        CatalystOutcomeMetric(
            catalyst_id=catalyst.id,
            metric="SpinCo Required",
            unit="bool",
            value_str="true",
        ),
    ]
    db.add_all(outcomes)
    
    # Market reactions
    reactions = [
        CatalystMarketReaction(
            catalyst_id=catalyst.id,
            ticker="NVS",
            window="D0",
            abs_return=3.0,
            rel_vs_xbi=2.1,
        ),
        CatalystMarketReaction(
            catalyst_id=catalyst.id,
            ticker="NVS",
            window="D+1",
            abs_return=4.5,
            rel_vs_xbi=3.2,
            iv_tenor="1m",
            iv=28.1,
            iv_zscore_vs_1y=0.9,
        ),
    ]
    db.add_all(reactions)
    
    # Peers
    peers = [
        CatalystPeer(
            catalyst_id=catalyst.id,
            peer_ticker="DYNE",
            peer_name="Dyne Therapeutics",
            reason_tag="RNA muscle peer",
            weight=0.5,
            moat_moa=True,
            moat_indication=True,
        ),
        CatalystPeer(
            catalyst_id=catalyst.id,
            peer_ticker="PEPG",
            peer_name="PepGen",
            reason_tag="AOC-adjacent",
            weight=0.3,
            moat_moa=True,
        ),
    ]
    db.add_all(peers)
    
    # Peer metrics
    peer_metrics = [
        CatalystPeerMetric(
            catalyst_id=catalyst.id,
            metric="1D move post-print",
            value=2.8,
            peer_median=4.2,
            peer_p75=6.0,
            delta_to_median=-1.4,
        ),
    ]
    db.add_all(peer_metrics)
    
    # Sources
    sources = [
        CatalystSource(
            catalyst_id=catalyst.id,
            title="Reuters deal note",
            url="https://reuters.com/novartis-avidity",
            timestamp=datetime(2025, 10, 27, 8, 0),
            source_type="press",
        ),
        CatalystSource(
            catalyst_id=catalyst.id,
            title="Company PR",
            url="https://novartis.com/news/avidity-acquisition",
            timestamp=datetime(2025, 10, 27, 7, 30),
            source_type="company_pr",
        ),
    ]
    db.add_all(sources)
    
    return catalyst


def seed_bridgebio_fortify(db: Session) -> Catalyst:
    """2. BridgeBio FORTIFY (BBP-418)"""
    catalyst = Catalyst(
        name="BridgeBio FORTIFY Interim Data",
        title="BBIO FORTIFY interim beats on biomarker & function",
        company="BridgeBio",
        drug="BBP-418",
        kind="Clinical",
        event_type="PH3_READOUT",
        event_date=datetime(2025, 10, 20),
        date=datetime(2025, 10, 20),
        probability=0.75,
        impact="High",
        description="LGMD2I/R9 Phase 3 interim with α-DG, CK, function endpoints",
        status="Completed",
        event_leverage=4,
        timing_clarity=2,
        surprise_factor=3,
        downside_contained=2,
        market_depth=2,
    )
    db.add(catalyst)
    db.flush()
    
    # Expectations
    expectations = [
        CatalystExpectationBand(
            catalyst_id=catalyst.id,
            metric="α-DG glycosylation",
            unit="x fold",
            expected=1.5,
            band_low=1.3,
            band_high=1.6,
            source="consensus",
            what_matters="Mechanism proof for oral therapy",
        ),
        CatalystExpectationBand(
            catalyst_id=catalyst.id,
            metric="CK reduction",
            unit="%",
            expected=60.0,
            band_low=50.0,
            band_high=70.0,
            source="sell_side",
            what_matters="Muscle damage biomarker",
        ),
        CatalystExpectationBand(
            catalyst_id=catalyst.id,
            metric="Velocity Δ vs PBO",
            unit="m/s",
            expected=0.20,
            band_low=0.10,
            band_high=0.25,
            source="sell_side",
            what_matters="Functional improvement",
        ),
        CatalystExpectationBand(
            catalyst_id=catalyst.id,
            metric="FVC Δ vs PBO",
            unit="pp",
            expected=4.0,
            band_low=2.0,
            band_high=5.0,
            source="consensus",
            what_matters="Respiratory function",
        ),
    ]
    db.add_all(expectations)
    
    # Outcomes
    outcomes = [
        CatalystOutcomeMetric(
            catalyst_id=catalyst.id,
            metric="α-DG glycosylation",
            unit="x fold",
            value=1.8,
            window="@3m",
        ),
        CatalystOutcomeMetric(
            catalyst_id=catalyst.id,
            metric="CK reduction",
            unit="%",
            value=-82.0,
            window="@12m",
        ),
        CatalystOutcomeMetric(
            catalyst_id=catalyst.id,
            metric="Velocity Δ vs PBO",
            unit="m/s",
            value=0.27,
            p_value=0.01,
        ),
        CatalystOutcomeMetric(
            catalyst_id=catalyst.id,
            metric="FVC Δ vs PBO",
            unit="pp",
            value=5.0,
            p_value=0.03,
        ),
    ]
    db.add_all(outcomes)
    
    # Market reactions
    reactions = [
        CatalystMarketReaction(
            catalyst_id=catalyst.id,
            ticker="BBIO",
            window="D0",
            abs_return=18.5,
            rel_vs_xbi=15.2,
            volume_multiple_vs_30d=3.2,
        ),
        CatalystMarketReaction(
            catalyst_id=catalyst.id,
            ticker="BBIO",
            window="D+1",
            abs_return=22.3,
            rel_vs_xbi=18.1,
        ),
    ]
    db.add_all(reactions)
    
    # Peers
    peers = [
        CatalystPeer(
            catalyst_id=catalyst.id,
            peer_ticker="SRPT",
            peer_name="Sarepta",
            reason_tag="Neuromuscular leader",
            weight=0.6,
            moat_indication=True,
            moat_stage=False,
        ),
        CatalystPeer(
            catalyst_id=catalyst.id,
            peer_ticker="DYNE",
            peer_name="Dyne",
            reason_tag="Muscle disease peer",
            weight=0.4,
            moat_indication=True,
            moat_target=True,
        ),
    ]
    db.add_all(peers)
    
    # Sources
    sources = [
        CatalystSource(
            catalyst_id=catalyst.id,
            title="BridgeBio FORTIFY PR",
            url="https://bridgebio.com/fortify-interim",
            timestamp=datetime(2025, 10, 20, 7, 0),
            source_type="company_pr",
        ),
    ]
    db.add_all(sources)
    
    return catalyst


def seed_intellia_magnitude(db: Session) -> Catalyst:
    """3. Intellia MAGNITUDE Pause (Safety Event)"""
    catalyst = Catalyst(
        name="Intellia MAGNITUDE Pause",
        title="NTLA pauses MAGNITUDE after G4 LFT event",
        company="Intellia",
        drug="nex-z",
        kind="Safety",
        event_type="SAFETY_PAUSE",
        event_date=datetime(2025, 10, 15),
        date=datetime(2025, 10, 15),
        probability=1.0,
        impact="High",
        description="Grade 4 hepatotoxicity + bilirubin; enrollment paused",
        status="Ongoing",
        event_leverage=3,
        timing_clarity=1,
        surprise_factor=3,
        downside_contained=1,
        market_depth=2,
    )
    db.add(catalyst)
    db.flush()
    
    # Expectations
    expectations = [
        CatalystExpectationBand(
            catalyst_id=catalyst.id,
            metric="Safety SAE Grade",
            unit="CTCAE",
            expected=2.0,
            band_low=1.0,
            band_high=3.0,
            source="internal",
            what_matters="Class-wide hepatotoxicity risk",
        ),
    ]
    db.add_all(expectations)
    
    # Outcomes
    outcomes = [
        CatalystOutcomeMetric(
            catalyst_id=catalyst.id,
            metric="Safety SAE Grade",
            unit="CTCAE",
            value=4.0,
        ),
        CatalystOutcomeMetric(
            catalyst_id=catalyst.id,
            metric="Signal Type",
            unit="enum",
            value_str="hepatotoxicity",
        ),
        CatalystOutcomeMetric(
            catalyst_id=catalyst.id,
            metric="Enrollment Status",
            unit="enum",
            value_str="paused",
        ),
    ]
    db.add_all(outcomes)
    
    # Market reactions
    reactions = [
        CatalystMarketReaction(
            catalyst_id=catalyst.id,
            ticker="NTLA",
            window="D0",
            abs_return=-15.2,
            rel_vs_xbi=-18.5,
            volume_multiple_vs_30d=4.8,
            iv_tenor="1m",
            iv=68.3,
            iv_zscore_vs_1y=2.3,
        ),
        CatalystMarketReaction(
            catalyst_id=catalyst.id,
            ticker="NTLA",
            window="D+1",
            abs_return=-8.1,
            rel_vs_xbi=-10.2,
        ),
    ]
    db.add_all(reactions)
    
    # Peers (class read-through)
    peers = [
        CatalystPeer(
            catalyst_id=catalyst.id,
            peer_ticker="CRSP",
            peer_name="CRISPR Therapeutics",
            reason_tag="In vivo gene editing peer",
            weight=0.7,
            moat_moa=True,
            moat_delivery=True,
        ),
        CatalystPeer(
            catalyst_id=catalyst.id,
            peer_ticker="BEAM",
            peer_name="Beam Therapeutics",
            reason_tag="Base editing peer",
            weight=0.5,
            moat_moa=True,
        ),
        CatalystPeer(
            catalyst_id=catalyst.id,
            peer_ticker="VERV",
            peer_name="Verve Therapeutics",
            reason_tag="In vivo editing liver",
            weight=0.6,
            moat_moa=True,
            moat_target=True,
        ),
    ]
    db.add_all(peers)
    
    # Peer metrics (class impact)
    peer_metrics = [
        CatalystPeerMetric(
            catalyst_id=catalyst.id,
            metric="1D CAR",
            value=-15.2,
            peer_median=-8.5,
            peer_p75=-5.2,
            delta_to_median=-6.7,
        ),
    ]
    db.add_all(peer_metrics)
    
    # Sources
    sources = [
        CatalystSource(
            catalyst_id=catalyst.id,
            title="Intellia 8-K Filing",
            url="https://sec.gov/intellia-8k",
            timestamp=datetime(2025, 10, 15, 16, 30),
            source_type="sec_filing",
        ),
    ]
    db.add_all(sources)
    
    return catalyst


def seed_bayer_lynkuet(db: Session) -> Catalyst:
    """4. Bayer Lynkuet Approval"""
    catalyst = Catalyst(
        name="Bayer Lynkuet FDA Approval",
        title="Lynkuet (Elinzanetant) approved for menopause VMS",
        company="Bayer",
        drug="Elinzanetant (Lynkuet)",
        kind="Regulatory",
        event_type="APPROVAL",
        event_date=datetime(2025, 10, 10),
        date=datetime(2025, 10, 10),
        probability=0.85,
        impact="Medium",
        description="Dual NK1/NK3 antagonist for vasomotor symptoms",
        status="Completed",
        event_leverage=3,
        timing_clarity=3,
        surprise_factor=1,
        downside_contained=3,
        market_depth=3,
    )
    db.add(catalyst)
    db.flush()
    
    # Expectations
    expectations = [
        CatalystExpectationBand(
            catalyst_id=catalyst.id,
            metric="VMS frequency change @4wk",
            unit="count/day",
            expected=-5.0,
            band_low=-6.0,
            band_high=-4.0,
            source="consensus",
            what_matters="Speed of onset vs Veozah",
        ),
        CatalystExpectationBand(
            catalyst_id=catalyst.id,
            metric="VMS frequency change @12wk",
            unit="count/day",
            expected=-7.0,
            band_low=-8.0,
            band_high=-6.0,
            source="sell_side",
            what_matters="Durability and market positioning",
        ),
    ]
    db.add_all(expectations)
    
    # Outcomes
    outcomes = [
        CatalystOutcomeMetric(
            catalyst_id=catalyst.id,
            metric="VMS frequency change @4wk",
            unit="count/day",
            value=-5.2,
            p_value=0.001,
            n=250,
        ),
        CatalystOutcomeMetric(
            catalyst_id=catalyst.id,
            metric="VMS frequency change @12wk",
            unit="count/day",
            value=-7.3,
            p_value=0.0001,
            n=250,
        ),
    ]
    db.add_all(outcomes)
    
    # Market reactions
    reactions = [
        CatalystMarketReaction(
            catalyst_id=catalyst.id,
            ticker="BAYRY",
            window="D0",
            abs_return=2.8,
            rel_vs_xbi=1.5,
        ),
        CatalystMarketReaction(
            catalyst_id=catalyst.id,
            ticker="BAYRY",
            window="D+1",
            abs_return=3.2,
            rel_vs_xbi=1.8,
        ),
    ]
    db.add_all(reactions)
    
    # Peers
    peers = [
        CatalystPeer(
            catalyst_id=catalyst.id,
            peer_ticker="ALPMY",
            peer_name="Astellas (Veozah)",
            reason_tag="Non-hormonal VMS benchmark",
            weight=0.9,
            moat_indication=True,
            moat_stage=True,
        ),
    ]
    db.add_all(peers)
    
    # Peer metrics
    peer_metrics = [
        CatalystPeerMetric(
            catalyst_id=catalyst.id,
            metric="VMS reduction @12wk",
            value=-7.3,
            peer_median=-6.8,
            peer_p75=-7.1,
            delta_to_median=0.5,
        ),
    ]
    db.add_all(peer_metrics)
    
    # Sources
    sources = [
        CatalystSource(
            catalyst_id=catalyst.id,
            title="FDA Approval Letter",
            url="https://fda.gov/lynkuet-approval",
            timestamp=datetime(2025, 10, 10, 14, 0),
            source_type="company_pr",
        ),
    ]
    db.add_all(sources)
    
    return catalyst


def seed_lilly_omvoh(db: Session) -> Catalyst:
    """5. Lilly Omvoh (single-injection label update)"""
    catalyst = Catalyst(
        name="Lilly Omvoh Single-Injection Label",
        title="Omvoh (Mirikizumab) single-injection label approved",
        company="Eli Lilly",
        drug="Mirikizumab (Omvoh)",
        kind="Regulatory",
        event_type="LABEL_UPDATE",
        event_date=datetime(2025, 10, 5),
        date=datetime(2025, 10, 5),
        probability=0.90,
        impact="Medium",
        description="Dosing simplification from 2 injections to 1 for UC",
        status="Completed",
        event_leverage=2,
        timing_clarity=3,
        surprise_factor=1,
        downside_contained=3,
        market_depth=3,
    )
    db.add(catalyst)
    db.flush()
    
    # Expectations
    expectations = [
        CatalystExpectationBand(
            catalyst_id=catalyst.id,
            metric="Injections per month",
            unit="count",
            expected=1.0,
            band_low=1.0,
            band_high=1.0,
            source="mgmt_guide",
            what_matters="Patient convenience and adherence",
        ),
        CatalystExpectationBand(
            catalyst_id=catalyst.id,
            metric="Adherence uplift",
            unit="%",
            expected=15.0,
            band_low=10.0,
            band_high=20.0,
            source="internal",
            what_matters="PDC improvement vs 2-injection rivals",
        ),
    ]
    db.add_all(expectations)
    
    # Outcomes
    outcomes = [
        CatalystOutcomeMetric(
            catalyst_id=catalyst.id,
            metric="Injections per month",
            unit="count",
            value=1.0,
        ),
        CatalystOutcomeMetric(
            catalyst_id=catalyst.id,
            metric="Label achieved",
            unit="bool",
            value_str="true",
        ),
    ]
    db.add_all(outcomes)
    
    # Market reactions
    reactions = [
        CatalystMarketReaction(
            catalyst_id=catalyst.id,
            ticker="LLY",
            window="D0",
            abs_return=1.2,
            rel_vs_xbi=0.8,
        ),
        CatalystMarketReaction(
            catalyst_id=catalyst.id,
            ticker="LLY",
            window="D+1",
            abs_return=1.5,
            rel_vs_xbi=1.0,
        ),
    ]
    db.add_all(reactions)
    
    # Peers
    peers = [
        CatalystPeer(
            catalyst_id=catalyst.id,
            peer_ticker="ABBV",
            peer_name="AbbVie (Skyrizi)",
            reason_tag="IL-23 UC competitor",
            weight=0.8,
            moat_indication=True,
            moat_moa=True,
        ),
        CatalystPeer(
            catalyst_id=catalyst.id,
            peer_ticker="JNJ",
            peer_name="J&J (Tremfya)",
            reason_tag="IL-23 competitor",
            weight=0.6,
            moat_moa=True,
        ),
    ]
    db.add_all(peers)
    
    # Sources
    sources = [
        CatalystSource(
            catalyst_id=catalyst.id,
            title="Lilly Press Release",
            url="https://lilly.com/omvoh-label-update",
            timestamp=datetime(2025, 10, 5, 8, 0),
            source_type="company_pr",
        ),
    ]
    db.add_all(sources)
    
    return catalyst

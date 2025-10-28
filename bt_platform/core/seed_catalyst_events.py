"""
Seed Catalyst Events

Seeds the database with the 5 example catalyst events from the problem statement:
1. Novartis → Avidity M&A
2. BridgeBio FORTIFY trial
3. Intellia MAGNITUDE safety pause
4. Bayer Lynkuet approval
5. Lilly Omvoh label update
"""

from datetime import datetime
import logging
from sqlalchemy.orm import Session
from .database import CatalystEvent, ExpectationBand, PriceReaction, IVReaction, PeerComparison

logger = logging.getLogger(__name__)


def generate_ulid() -> str:
    """Generate a ULID-like identifier"""
    import time
    import random
    timestamp = int(time.time() * 1000)
    random_part = ''.join(random.choices('0123456789ABCDEFGHJKMNPQRSTVWXYZ', k=16))
    return f"{timestamp:010X}{random_part}"


def seed_catalyst_events(db: Session):
    """Seed the database with example catalyst events"""
    
    logger.info("🌱 Seeding catalyst events...")
    
    # Check if already seeded
    existing = db.query(CatalystEvent).filter(
        CatalystEvent.company_ticker == "NVS"
    ).first()
    
    if existing:
        logger.info("Catalyst events already seeded, skipping...")
        return
    
    # ========================================================================
    # 1. Novartis → Avidity M&A ($12B)
    # ========================================================================
    
    event1_id = generate_ulid()
    event1 = CatalystEvent(
        event_id=event1_id,
        as_of=datetime(2025, 10, 27, 14, 0, 0),
        company_name="Novartis",
        company_ticker="NVS",
        company_exchange="NYSE",
        catalyst_type="M&A",
        catalyst_subtype="TenderOffer",
        program="AOC platform",
        indication="Neuromuscular RNA",
        geography=["US", "Global"],
        expectation_source="sell_side",
        expectation_metrics=[
            {
                "name": "Deal Premium",
                "unit": "%",
                "expected": 30,
                "band_low": 20,
                "band_high": 40,
                "what_matters": "Signal on RNA appetite"
            },
            {
                "name": "SpinCo Required",
                "unit": "bool",
                "expected": False,
                "what_matters": "Deal complexity"
            }
        ],
        outcome_metrics=[
            {"name": "Deal Premium", "unit": "%", "value": 46},
            {"name": "Consideration", "unit": "$B", "value": 12.0},
            {"name": "SpinCo Required", "unit": "bool", "value": True}
        ],
        market_reaction_data={
            "rel_windows": ["D0", "D+1", "D+5"],
            "price": [
                {"window": "D0", "abs": 3.0, "rel_vs_XBI": 2.1},
                {"window": "D+1", "abs": 4.5, "rel_vs_XBI": 3.2}
            ],
            "iv": [
                {"tenor": "1m", "window": "D0", "iv": 28.1, "zscore_vs_1y": 0.9}
            ]
        },
        peer_analysis_data={
            "moat_axes": ["MoA", "Stage", "Indication"],
            "list": [
                {"ticker": "DYNE", "reason_tag": "RNA muscle peer", "weight": 0.5},
                {"ticker": "PEPG", "reason_tag": "AOC-adjacent", "weight": 0.3}
            ],
            "comp_metrics": [
                {
                    "metric": "1D move post-print",
                    "value": 2.8,
                    "peer_median": 4.2,
                    "peer_p75": 6.0,
                    "delta_to_median": -1.4
                }
            ]
        },
        sources=[
            {
                "title": "Reuters deal note",
                "url": "https://www.reuters.com/novartis-avidity",
                "ts": "2025-10-27T14:00:00Z",
                "type": "news"
            },
            {
                "title": "Novartis PR",
                "url": "https://www.novartis.com/news/avidity-acquisition",
                "ts": "2025-10-27T13:00:00Z",
                "type": "company_pr"
            }
        ]
    )
    
    db.add(event1)
    
    # Add expectation bands
    db.add(ExpectationBand(
        event_id=event1_id,
        metric="Deal Premium",
        unit="%",
        expected=30,
        band_low=20,
        band_high=40,
        what_matters="Signal on RNA appetite",
        source="sell_side"
    ))
    
    # Add price reactions
    db.add(PriceReaction(
        event_id=event1_id,
        window="D0",
        abs_change=3.0,
        rel_vs_xbi=2.1,
        timestamp=datetime(2025, 10, 27, 20, 0, 0)
    ))
    
    db.add(PriceReaction(
        event_id=event1_id,
        window="D+1",
        abs_change=4.5,
        rel_vs_xbi=3.2,
        timestamp=datetime(2025, 10, 28, 20, 0, 0)
    ))
    
    # Add peer comparisons
    db.add(PeerComparison(
        event_id=event1_id,
        peer_ticker="DYNE",
        reason_tag="RNA muscle peer",
        weight=0.5,
        metric="1D move post-print",
        value=2.8,
        peer_median=4.2,
        peer_p75=6.0,
        delta_to_median=-1.4
    ))
    
    # ========================================================================
    # 2. BridgeBio FORTIFY (BBP-418)
    # ========================================================================
    
    event2_id = generate_ulid()
    event2 = CatalystEvent(
        event_id=event2_id,
        as_of=datetime(2025, 10, 25, 16, 0, 0),
        company_name="BridgeBio Pharma",
        company_ticker="BBIO",
        company_exchange="NASDAQ",
        catalyst_type="PH3_READOUT",
        catalyst_subtype="Interim",
        program="BBP-418 FORTIFY",
        indication="LGMD2I/R9",
        geography=["US", "Global"],
        expectation_source="sell_side",
        expectation_metrics=[
            {
                "name": "α-DG glycosylation",
                "unit": "fold",
                "expected": 1.5,
                "band_low": 1.3,
                "band_high": 1.6,
                "what_matters": "Biomarker of mechanism"
            },
            {
                "name": "CK reduction",
                "unit": "%",
                "expected": 60,
                "band_low": 50,
                "band_high": 70,
                "what_matters": "Muscle damage marker"
            },
            {
                "name": "Velocity Δ vs PBO",
                "unit": "m/s",
                "expected": 0.20,
                "band_low": 0.10,
                "band_high": 0.25,
                "what_matters": "Functional endpoint"
            },
            {
                "name": "FVC Δ vs PBO",
                "unit": "pp",
                "expected": 4,
                "band_low": 2,
                "band_high": 5,
                "what_matters": "Respiratory function"
            }
        ],
        outcome_metrics=[
            {"name": "α-DG glycosylation", "unit": "fold", "value": 1.8},
            {"name": "CK reduction", "unit": "%", "value": 82},
            {"name": "Velocity Δ vs PBO", "unit": "m/s", "value": 0.27},
            {"name": "FVC Δ vs PBO", "unit": "pp", "value": 5}
        ],
        market_reaction_data={
            "rel_windows": ["D0", "D+1", "D+5"],
            "price": [
                {"window": "D0", "abs": 12.5, "rel_vs_XBI": 11.2},
                {"window": "D+1", "abs": 15.3, "rel_vs_XBI": 13.8}
            ]
        },
        peer_analysis_data={
            "moat_axes": ["MoA", "Stage", "Indication", "Delivery"],
            "list": [
                {"ticker": "SRPT", "reason_tag": "Sarepta gene therapy comp", "weight": 0.6},
                {"ticker": "DYNE", "reason_tag": "Muscle disease focus", "weight": 0.4}
            ]
        },
        sources=[
            {
                "title": "BridgeBio FORTIFY Interim Results",
                "url": "https://www.bridgebio.com/fortify-interim",
                "ts": "2025-10-25T16:00:00Z",
                "type": "company_pr"
            }
        ]
    )
    
    db.add(event2)
    
    # Add expectation bands for key metrics
    for metric_data in event2.expectation_metrics:
        db.add(ExpectationBand(
            event_id=event2_id,
            metric=metric_data["name"],
            unit=metric_data["unit"],
            expected=metric_data.get("expected"),
            band_low=metric_data.get("band_low"),
            band_high=metric_data.get("band_high"),
            what_matters=metric_data.get("what_matters"),
            source="sell_side"
        ))
    
    # ========================================================================
    # 3. Intellia MAGNITUDE Safety Pause
    # ========================================================================
    
    event3_id = generate_ulid()
    event3 = CatalystEvent(
        event_id=event3_id,
        as_of=datetime(2025, 10, 26, 10, 0, 0),
        company_name="Intellia Therapeutics",
        company_ticker="NTLA",
        company_exchange="NASDAQ",
        catalyst_type="SAFETY_PAUSE",
        catalyst_subtype="Hold/Partial",
        program="MAGNITUDE",
        indication="ATTR amyloidosis",
        geography=["US", "Global"],
        expectation_source="consensus",
        expectation_metrics=[
            {
                "name": "Safety SAE Grade",
                "unit": "CTCAE",
                "expected": 2,
                "band_low": 0,
                "band_high": 3,
                "what_matters": "Class-wide risk profile"
            },
            {
                "name": "Pause Duration",
                "unit": "weeks",
                "expected": 4,
                "band_low": 2,
                "band_high": 8,
                "what_matters": "Resumption timeline"
            }
        ],
        outcome_metrics=[
            {"name": "Safety SAE Grade", "unit": "CTCAE", "value": 4},
            {"name": "Signal Type", "unit": "enum", "value": "hepatotoxicity"},
            {"name": "Enrollment Status", "unit": "enum", "value": "paused"}
        ],
        market_reaction_data={
            "rel_windows": ["D0", "D+1", "D+5"],
            "price": [
                {"window": "D0", "abs": -18.2, "rel_vs_XBI": -17.5},
                {"window": "D+1", "abs": -22.1, "rel_vs_XBI": -20.8}
            ],
            "iv": [
                {"tenor": "1m", "window": "D0", "iv": 62.5, "zscore_vs_1y": 2.3}
            ]
        },
        peer_analysis_data={
            "moat_axes": ["MoA", "Stage", "Target"],
            "list": [
                {"ticker": "CRSP", "reason_tag": "CRISPR peer", "weight": 0.5},
                {"ticker": "BEAM", "reason_tag": "Base editing approach", "weight": 0.3},
                {"ticker": "VERV", "reason_tag": "In vivo gene editing", "weight": 0.2}
            ]
        },
        sources=[
            {
                "title": "Intellia Safety Update",
                "url": "https://www.intelliatx.com/magnitude-update",
                "ts": "2025-10-26T10:00:00Z",
                "type": "company_pr"
            }
        ]
    )
    
    db.add(event3)
    
    # ========================================================================
    # 4. Bayer Lynkuet Approval
    # ========================================================================
    
    event4_id = generate_ulid()
    event4 = CatalystEvent(
        event_id=event4_id,
        as_of=datetime(2025, 10, 24, 18, 0, 0),
        company_name="Bayer",
        company_ticker="BAYRY",
        company_exchange="OTC",
        catalyst_type="APPROVAL",
        catalyst_subtype="FDA",
        program="Elinzanetant (Lynkuet)",
        indication="Menopause VMS",
        geography=["US"],
        expectation_source="consensus",
        expectation_metrics=[
            {
                "name": "VMS reduction @4w",
                "unit": "frequency",
                "expected": -2.5,
                "band_low": -3.0,
                "band_high": -2.0,
                "what_matters": "Speed of onset"
            }
        ],
        outcome_metrics=[
            {"name": "VMS reduction @4w", "unit": "frequency", "value": -2.8},
            {"name": "Label Status", "unit": "enum", "value": "approved"},
            {"name": "Launch Timeline", "unit": "quarter", "value": "Q1'26"}
        ],
        market_reaction_data={
            "rel_windows": ["D0", "D+1"],
            "price": [
                {"window": "D0", "abs": 1.2, "rel_vs_XBI": 0.8}
            ]
        },
        peer_analysis_data={
            "moat_axes": ["MoA", "Indication"],
            "list": [
                {"ticker": "ALPMY", "reason_tag": "Veozah competitor", "weight": 0.8}
            ]
        },
        sources=[
            {
                "title": "FDA Approval Notice",
                "url": "https://www.fda.gov/lynkuet-approval",
                "ts": "2025-10-24T18:00:00Z",
                "type": "press_release"
            }
        ]
    )
    
    db.add(event4)
    
    # ========================================================================
    # 5. Lilly Omvoh (Mirikizumab) Single-Injection Label
    # ========================================================================
    
    event5_id = generate_ulid()
    event5 = CatalystEvent(
        event_id=event5_id,
        as_of=datetime(2025, 10, 23, 15, 0, 0),
        company_name="Eli Lilly",
        company_ticker="LLY",
        company_exchange="NYSE",
        catalyst_type="LABEL_UPDATE",
        catalyst_subtype="sNDA",
        program="Mirikizumab (Omvoh)",
        indication="Ulcerative Colitis",
        geography=["US"],
        expectation_source="mgmt_guide",
        expectation_metrics=[
            {
                "name": "Adherence Uplift",
                "unit": "%",
                "expected": 15,
                "band_low": 10,
                "band_high": 20,
                "what_matters": "Dosing convenience impact"
            }
        ],
        outcome_metrics=[
            {"name": "Injections per Month", "unit": "count", "value": 1},
            {"name": "Previous Injections", "unit": "count", "value": 2},
            {"name": "Label Update", "unit": "enum", "value": "approved"},
            {"name": "Distribution Date", "unit": "quarter", "value": "Q1'26"}
        ],
        market_reaction_data={
            "rel_windows": ["D0", "D+1"],
            "price": [
                {"window": "D0", "abs": 0.8, "rel_vs_XBI": 0.3}
            ]
        },
        peer_analysis_data={
            "moat_axes": ["Indication", "Delivery"],
            "list": [
                {"ticker": "ABBV", "reason_tag": "Skyrizi competitor", "weight": 0.6},
                {"ticker": "JNJ", "reason_tag": "Stelara comparison", "weight": 0.4}
            ]
        },
        sources=[
            {
                "title": "Lilly Omvoh Label Update",
                "url": "https://investor.lilly.com/omvoh-label",
                "ts": "2025-10-23T15:00:00Z",
                "type": "company_pr"
            }
        ]
    )
    
    db.add(event5)
    
    # Commit all events
    try:
        db.commit()
        logger.info("✅ Successfully seeded 5 catalyst events")
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Failed to seed catalyst events: {e}")
        raise


if __name__ == "__main__":
    # For testing
    from .database import SessionLocal
    db = SessionLocal()
    try:
        seed_catalyst_events(db)
    finally:
        db.close()

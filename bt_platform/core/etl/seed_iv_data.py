"""
Seed IV Catalyst Data

Creates sample catalyst events and populates IV/price data for demonstration.
"""

import logging
from datetime import datetime, timedelta

from ..database import SessionLocal, Catalyst
from .iv_data_etl import run_iv_etl, XBI_TICKERS

logger = logging.getLogger(__name__)


def seed_catalyst_events():
    """
    Seed sample catalyst events for IV demo.
    """
    session = SessionLocal()
    
    try:
        logger.info("Seeding catalyst events...")
        
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Sample catalyst events for demo
        catalysts = [
            {
                "name": "VRTX Phase III DMD Readout",
                "title": "Phase III Duchenne Muscular Dystrophy Data Readout",
                "company": "VRTX",
                "drug": "VX-548",
                "kind": "Clinical",
                "event_type": "Data Readout",
                "date": today + timedelta(days=15),
                "event_date": today + timedelta(days=15),
                "probability": 0.75,
                "impact": "High",
                "description": "Phase III data readout for VX-548 in Duchenne muscular dystrophy",
                "status": "Upcoming"
            },
            {
                "name": "ALNY PDUFA Decision",
                "title": "FDA PDUFA Action Date for Zilebesiran (HTN)",
                "company": "ALNY",
                "drug": "Zilebesiran",
                "kind": "FDA",
                "event_type": "PDUFA",
                "date": today + timedelta(days=28),
                "event_date": today + timedelta(days=28),
                "probability": 0.85,
                "impact": "High",
                "description": "FDA PDUFA date for zilebesiran hypertension indication",
                "status": "Upcoming"
            },
            {
                "name": "IONS Phase IIb Lp(a) Data",
                "title": "Phase IIb Lipoprotein(a) Trial Results",
                "company": "IONS",
                "drug": "AKCEA-APO(a)-LRx",
                "kind": "Clinical",
                "event_type": "Data Readout",
                "date": today + timedelta(days=45),
                "event_date": today + timedelta(days=45),
                "probability": 0.70,
                "impact": "High",
                "description": "Phase IIb data for Lp(a) reduction in cardiovascular disease",
                "status": "Upcoming"
            },
            {
                "name": "MRNA RSV Vaccine AdComm",
                "title": "FDA Advisory Committee Meeting for RSV Vaccine",
                "company": "MRNA",
                "drug": "mRNA-1345",
                "kind": "FDA",
                "event_type": "AdComm",
                "date": today + timedelta(days=35),
                "event_date": today + timedelta(days=35),
                "probability": 0.80,
                "impact": "Medium",
                "description": "FDA Advisory Committee meeting for RSV vaccine approval",
                "status": "Upcoming"
            },
            {
                "name": "CRSP CTX001 BLA Filing",
                "title": "BLA Submission for CTX001 in Sickle Cell Disease",
                "company": "CRSP",
                "drug": "CTX001",
                "kind": "FDA",
                "event_type": "BLA Filing",
                "date": today + timedelta(days=20),
                "event_date": today + timedelta(days=20),
                "probability": 0.90,
                "impact": "High",
                "description": "BLA filing for CTX001 gene-edited therapy in SCD",
                "status": "Upcoming"
            },
            {
                "name": "EDIT ASGCT Presentation",
                "title": "ASGCT Conference Presentation - Gene Editing Data",
                "company": "EDIT",
                "drug": "EDIT-101",
                "kind": "Conference",
                "event_type": "Conference Presentation",
                "date": today + timedelta(days=42),
                "event_date": today + timedelta(days=42),
                "probability": 0.65,
                "impact": "Medium",
                "description": "ASGCT presentation on EDIT-101 LCA10 gene editing therapy",
                "status": "Upcoming"
            },
            {
                "name": "BEAM Base Editor Update",
                "title": "Clinical Update for Base Editing Platform",
                "company": "BEAM",
                "drug": "BEAM-101",
                "kind": "Clinical",
                "event_type": "Update",
                "date": today + timedelta(days=50),
                "event_date": today + timedelta(days=50),
                "probability": 0.60,
                "impact": "Medium",
                "description": "Clinical update on base editing programs",
                "status": "Upcoming"
            },
            {
                "name": "BLUE Lovo-cel FDA Decision",
                "title": "FDA Decision on Lovo-cel for Sickle Cell Disease",
                "company": "BLUE",
                "drug": "Lovo-cel",
                "kind": "FDA",
                "event_type": "FDA Approval",
                "date": today + timedelta(days=8),
                "event_date": today + timedelta(days=8),
                "probability": 0.75,
                "impact": "High",
                "description": "FDA approval decision for lovo-cel in SCD",
                "status": "Upcoming"
            }
        ]
        
        for cat_data in catalysts:
            # Check if already exists
            existing = session.query(Catalyst).filter(
                Catalyst.name == cat_data["name"]
            ).first()
            
            if not existing:
                catalyst = Catalyst(**cat_data)
                session.add(catalyst)
        
        session.commit()
        logger.info(f"✅ Seeded {len(catalysts)} catalyst events")
        
    except Exception as e:
        logger.error(f"❌ Seed catalysts failed: {e}")
        session.rollback()
        raise
    
    finally:
        session.close()


def seed_iv_data(quick: bool = False):
    """
    Seed IV and price data.
    
    Args:
        quick: If True, seed only 5 tickers with 30 days of data
    """
    if quick:
        logger.info("Running quick IV seed (5 tickers, 30 days)")
        run_iv_etl(
            tickers=XBI_TICKERS[:5],
            lookback_days=30
        )
    else:
        logger.info("Running full IV seed (all tickers, 1 year)")
        run_iv_etl()


def seed_all(quick: bool = False):
    """
    Seed all IV catalyst demo data.
    
    Args:
        quick: If True, seed reduced dataset for faster testing
    """
    logger.info("Starting IV catalyst data seeding...")
    
    # 1. Seed catalyst events first
    seed_catalyst_events()
    
    # 2. Seed IV and price data
    seed_iv_data(quick=quick)
    
    logger.info("✅ IV catalyst data seeding completed")


if __name__ == "__main__":
    import sys
    
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Check for --quick flag
    quick = "--quick" in sys.argv
    
    seed_all(quick=quick)

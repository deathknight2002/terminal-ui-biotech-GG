"""
Seed IV Catalyst Test Data

Loads sample XBI companies and upcoming catalysts for IV tracking.
"""

import logging
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session

from .database import SessionLocal, Company, Catalyst, PriceData, OptionsIV

logger = logging.getLogger(__name__)


# Sample XBI biotech companies with upcoming catalysts
XBI_SAMPLE_COMPANIES = [
    {
        "name": "Regeneron Pharmaceuticals",
        "ticker": "REGN",
        "company_type": "Big Pharma",
        "market_cap": 115_000_000_000,  # ~$115B
        "is_xbi_constituent": True,
        "therapeutic_areas": "Oncology,Immunology,Ophthalmology"
    },
    {
        "name": "Vertex Pharmaceuticals",
        "ticker": "VRTX",
        "company_type": "Big Pharma",
        "market_cap": 110_000_000_000,  # ~$110B
        "is_xbi_constituent": True,
        "therapeutic_areas": "Rare Disease,Cystic Fibrosis"
    },
    {
        "name": "Moderna",
        "ticker": "MRNA",
        "company_type": "Biotech",
        "market_cap": 25_000_000_000,  # ~$25B
        "is_xbi_constituent": True,
        "therapeutic_areas": "Vaccines,Oncology"
    },
    {
        "name": "BioNTech",
        "ticker": "BNTX",
        "company_type": "Biotech",
        "market_cap": 22_000_000_000,  # ~$22B
        "is_xbi_constituent": True,
        "therapeutic_areas": "Vaccines,Oncology"
    },
    {
        "name": "Argenx",
        "ticker": "ARGX",
        "company_type": "Biotech",
        "market_cap": 32_000_000_000,  # ~$32B
        "is_xbi_constituent": True,
        "therapeutic_areas": "Immunology,Rare Disease"
    },
    {
        "name": "Sarepta Therapeutics",
        "ticker": "SRPT",
        "company_type": "Biotech",
        "market_cap": 13_000_000_000,  # ~$13B
        "is_xbi_constituent": True,
        "therapeutic_areas": "Rare Disease,Neurology"
    },
    {
        "name": "BridgeBio Pharma",
        "ticker": "BBIO",
        "company_type": "Biotech",
        "market_cap": 8_000_000_000,  # ~$8B
        "is_xbi_constituent": True,
        "therapeutic_areas": "Rare Disease,Cardiovascular"
    },
    {
        "name": "Intellia Therapeutics",
        "ticker": "NTLA",
        "company_type": "Biotech",
        "market_cap": 2_500_000_000,  # ~$2.5B
        "is_xbi_constituent": True,
        "therapeutic_areas": "Gene Editing,Rare Disease"
    },
    {
        "name": "Neurocrine Biosciences",
        "ticker": "NBIX",
        "company_type": "Biotech",
        "market_cap": 14_000_000_000,  # ~$14B
        "is_xbi_constituent": True,
        "therapeutic_areas": "Neurology,Rare Disease"
    },
    {
        "name": "Alnylam Pharmaceuticals",
        "ticker": "ALNY",
        "company_type": "Biotech",
        "market_cap": 28_000_000_000,  # ~$28B
        "is_xbi_constituent": True,
        "therapeutic_areas": "Rare Disease,Cardiovascular"
    }
]


# Sample upcoming catalysts with event dates
SAMPLE_CATALYSTS = [
    # Near-term events (D-7 to D-30)
    {
        "ticker": "REGN",
        "name": "Dupixent Phase 3 COPD Data Readout",
        "title": "Phase 3 COPD Trial Results",
        "kind": "Clinical",
        "event_type": "Data Readout",
        "days_ahead": 14,
        "impact": "Medium",
        "description": "Top-line results from Phase 3 trial of Dupixent in COPD patients"
    },
    {
        "ticker": "VRTX",
        "name": "VX-548 Pain NDA Filing",
        "title": "VX-548 NDA Submission",
        "kind": "Regulatory",
        "event_type": "NDA Filing",
        "days_ahead": 21,
        "impact": "Low",
        "description": "Filing of NDA for VX-548 non-opioid pain therapy"
    },
    {
        "ticker": "MRNA",
        "name": "Personalized Cancer Vaccine Phase 3 Interim",
        "title": "mRNA-4157 Interim Analysis",
        "kind": "Clinical",
        "event_type": "Interim Analysis",
        "days_ahead": 28,
        "impact": "High",
        "description": "Interim efficacy analysis for melanoma vaccine trial"
    },
    {
        "ticker": "BNTX",
        "name": "BNT116 Lung Cancer Phase 2 Data",
        "title": "BNT116 Phase 2 Results",
        "kind": "Clinical",
        "event_type": "Data Readout",
        "days_ahead": 35,
        "impact": "High",
        "description": "Phase 2 data for NSCLC vaccine candidate"
    },
    {
        "ticker": "ARGX",
        "name": "CIDP Regulatory Filing EU",
        "title": "Vyvgart CIDP EU MAA",
        "kind": "Regulatory",
        "event_type": "MAA Filing",
        "days_ahead": 18,
        "impact": "Low",
        "description": "European Marketing Authorization Application for CIDP indication"
    },
    {
        "ticker": "SRPT",
        "name": "Elevidys DMD Expanded Label FDA Decision",
        "title": "Elevidys Label Expansion PDUFA",
        "kind": "Regulatory",
        "event_type": "PDUFA Date",
        "days_ahead": 42,
        "impact": "Medium",
        "description": "FDA decision on expanded age range for Elevidys in DMD"
    },
    {
        "ticker": "BBIO",
        "name": "Acoramidis ATTR-CM FDA AdCom",
        "title": "Acoramidis Advisory Committee",
        "kind": "Regulatory",
        "event_type": "AdCom Meeting",
        "days_ahead": 25,
        "impact": "Medium",
        "description": "FDA Advisory Committee meeting for ATTR-CM therapy"
    },
    {
        "ticker": "NTLA",
        "name": "NTLA-2001 Phase 3 ATTR Enrollment Complete",
        "title": "NTLA-2001 Phase 3 Milestone",
        "kind": "Clinical",
        "event_type": "Enrollment Complete",
        "days_ahead": 50,
        "impact": "Low",
        "description": "Completion of Phase 3 enrollment for ATTR amyloidosis"
    },
    {
        "ticker": "NBIX",
        "name": "NBI-1070770 Major Depressive Disorder Phase 2b",
        "title": "NBI-1070770 Phase 2b Data",
        "kind": "Clinical",
        "event_type": "Data Readout",
        "days_ahead": 45,
        "impact": "High",
        "description": "Phase 2b top-line results for MDD treatment"
    },
    {
        "ticker": "ALNY",
        "name": "Zilebesiran Hypertension Phase 3 Results",
        "title": "Zilebesiran Phase 3 Data",
        "kind": "Clinical",
        "event_type": "Data Readout",
        "days_ahead": 38,
        "impact": "Medium",
        "description": "Phase 3 efficacy data for hypertension RNAi therapy"
    }
]


def seed_companies(db: Session) -> int:
    """Seed XBI constituent companies"""
    count = 0
    
    for company_data in XBI_SAMPLE_COMPANIES:
        # Check if already exists
        existing = db.query(Company).filter(
            Company.ticker == company_data["ticker"]
        ).first()
        
        if not existing:
            company = Company(**company_data)
            db.add(company)
            count += 1
            logger.info(f"Added company: {company_data['ticker']}")
    
    db.commit()
    logger.info(f"Seeded {count} companies")
    return count


def seed_catalysts(db: Session) -> int:
    """Seed upcoming catalysts for IV tracking"""
    count = 0
    today = datetime.utcnow()
    
    for catalyst_data in SAMPLE_CATALYSTS:
        ticker = catalyst_data.pop("ticker")
        days_ahead = catalyst_data.pop("days_ahead")
        
        # Calculate event date
        event_date = today + timedelta(days=days_ahead)
        
        # Get company
        company = db.query(Company).filter(Company.ticker == ticker).first()
        if not company:
            logger.warning(f"Company {ticker} not found, skipping catalyst")
            continue
        
        # Check if similar catalyst already exists
        existing = db.query(Catalyst).filter(
            Catalyst.company == ticker,
            Catalyst.title == catalyst_data["title"]
        ).first()
        
        if not existing:
            catalyst = Catalyst(
                company=ticker,
                event_date=event_date,
                status="Upcoming",
                **catalyst_data
            )
            db.add(catalyst)
            count += 1
            logger.info(f"Added catalyst for {ticker}: {catalyst_data['title']} on {event_date.date()}")
    
    db.commit()
    logger.info(f"Seeded {count} catalysts")
    return count


def seed_sample_price_data(db: Session, ticker: str) -> None:
    """Seed sample price and realized volatility data for a ticker"""
    today = datetime.utcnow()
    
    # Check if recent data exists
    existing = db.query(PriceData).filter(
        PriceData.ticker == ticker,
        PriceData.date >= today - timedelta(days=1)
    ).first()
    
    if existing:
        return
    
    import random
    
    # Generate sample price data
    price_data = PriceData(
        ticker=ticker,
        date=today,
        open=random.uniform(80, 120),
        high=random.uniform(85, 125),
        low=random.uniform(75, 115),
        close=random.uniform(80, 120),
        volume=random.randint(1_000_000, 10_000_000),
        returns_1d=random.gauss(0, 0.01),
        returns_5d=random.gauss(0, 0.015),
        returns_20d=random.gauss(0, 0.03),
        realized_vol_20d=random.uniform(30, 60),  # Typical biotech vol
        realized_vol_60d=random.uniform(35, 65),
        volume_20d_avg=random.randint(2_000_000, 8_000_000),
        relative_volume=random.uniform(0.8, 1.5)
    )
    
    db.add(price_data)
    logger.debug(f"Added price data for {ticker}")


def seed_all(db: Optional[Session] = None):
    """Seed all IV catalyst test data"""
    if db is None:
        db = SessionLocal()
    
    try:
        logger.info("Starting IV catalyst data seeding")
        
        # Seed companies
        companies_added = seed_companies(db)
        
        # Seed catalysts
        catalysts_added = seed_catalysts(db)
        
        # Seed sample price data for each ticker
        for company_data in XBI_SAMPLE_COMPANIES:
            seed_sample_price_data(db, company_data["ticker"])
        
        db.commit()
        
        logger.info(f"Seeding complete: {companies_added} companies, {catalysts_added} catalysts")
        
        return {
            "companies": companies_added,
            "catalysts": catalysts_added
        }
        
    except Exception as e:
        logger.error(f"Error seeding data: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    seed_all()

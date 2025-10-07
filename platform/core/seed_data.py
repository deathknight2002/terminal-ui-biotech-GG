"""
Sample Data Seeding

Populate database with realistic biotech sample data for development and testing.
"""

import asyncio
import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from typing import List

from .database import SessionLocal, Drug, ClinicalTrial, Company, Catalyst, MarketData

logger = logging.getLogger(__name__)


async def seed_database():
    """Seed database with sample biotech data"""
    db = SessionLocal()
    try:
        # Check if data already exists
        if db.query(Drug).first():
            logger.info("📊 Database already seeded, skipping...")
            return
            
        logger.info("🌱 Seeding database with sample data...")
        
        # Seed companies
        await seed_companies(db)
        
        # Seed drugs
        await seed_drugs(db)
        
        # Seed clinical trials
        await seed_clinical_trials(db)
        
        # Seed catalysts
        await seed_catalysts(db)
        
        # Seed market data
        await seed_market_data(db)
        
        db.commit()
        logger.info("✅ Database seeded successfully")
        
    except Exception as e:
        logger.error(f"❌ Database seeding failed: {e}")
        db.rollback()
        raise
    finally:
        db.close()


async def seed_companies(db: Session):
    """Seed biotech/pharma companies"""
    companies = [
        Company(
            name="Moderna Inc",
            ticker="MRNA",
            company_type="Biotech",
            market_cap=45_000_000_000,
            headquarters="Cambridge, MA",
            founded=2010,
            employees=3000,
            pipeline_count=48
        ),
        Company(
            name="Pfizer Inc",
            ticker="PFE",
            company_type="Big Pharma",
            market_cap=280_000_000_000,
            headquarters="New York, NY",
            founded=1849,
            employees=83000,
            pipeline_count=95
        ),
        Company(
            name="BioNTech SE",
            ticker="BNTX",
            company_type="Biotech",
            market_cap=25_000_000_000,
            headquarters="Mainz, Germany",
            founded=2008,
            employees=5000,
            pipeline_count=20
        ),
        Company(
            name="Gilead Sciences",
            ticker="GILD",
            company_type="Big Pharma",
            market_cap=95_000_000_000,
            headquarters="Foster City, CA",
            founded=1987,
            employees=17000,
            pipeline_count=42
        )
    ]
    
    for company in companies:
        db.add(company)
    
    logger.info(f"📊 Added {len(companies)} companies")


async def seed_drugs(db: Session):
    """Seed drug pipeline data"""
    drugs = [
        Drug(
            name="mRNA-1273",
            generic_name="COVID-19 Vaccine",
            company="Moderna Inc",
            therapeutic_area="Infectious Disease",
            indication="COVID-19 Prevention",
            phase="Approved",
            mechanism="mRNA vaccine",
            target="SARS-CoV-2 Spike Protein"
        ),
        Drug(
            name="BNT162b2",
            generic_name="COVID-19 Vaccine",
            company="BioNTech SE",
            therapeutic_area="Infectious Disease", 
            indication="COVID-19 Prevention",
            phase="Approved",
            mechanism="mRNA vaccine",
            target="SARS-CoV-2 Spike Protein"
        ),
        Drug(
            name="Remdesivir",
            generic_name="Veklury",
            company="Gilead Sciences",
            therapeutic_area="Infectious Disease",
            indication="COVID-19 Treatment",
            phase="Approved",
            mechanism="RNA polymerase inhibitor",
            target="Viral RNA polymerase"
        ),
        Drug(
            name="mRNA-4157",
            generic_name="Personalized Cancer Vaccine",
            company="Moderna Inc",
            therapeutic_area="Oncology",
            indication="Melanoma",
            phase="Phase II",
            mechanism="Personalized neoantigen vaccine",
            target="Tumor-specific neoantigens"
        )
    ]
    
    for drug in drugs:
        db.add(drug)
    
    logger.info(f"💊 Added {len(drugs)} drugs")


async def seed_clinical_trials(db: Session):
    """Seed clinical trial data"""
    trials = [
        ClinicalTrial(
            nct_id="NCT04470427",
            title="mRNA-1273 COVID-19 Vaccine Efficacy Study",
            phase="Phase III",
            status="Completed",
            condition="COVID-19",
            intervention="mRNA-1273 vaccine",
            sponsor="Moderna Inc",
            start_date=datetime(2020, 7, 27),
            completion_date=datetime(2022, 10, 27),
            enrollment=30000
        ),
        ClinicalTrial(
            nct_id="NCT04368728",
            title="BNT162b2 COVID-19 Vaccine Safety and Efficacy",
            phase="Phase III", 
            status="Completed",
            condition="COVID-19",
            intervention="BNT162b2 vaccine",
            sponsor="BioNTech SE",
            start_date=datetime(2020, 4, 29),
            completion_date=datetime(2023, 5, 2),
            enrollment=44000
        ),
        ClinicalTrial(
            nct_id="NCT04553418",
            title="Personalized Cancer Vaccine with Pembrolizumab",
            phase="Phase II",
            status="Active",
            condition="Melanoma",
            intervention="mRNA-4157 + Pembrolizumab",
            sponsor="Moderna Inc",
            start_date=datetime(2021, 9, 15),
            completion_date=datetime(2025, 12, 31),
            enrollment=157
        )
    ]
    
    for trial in trials:
        db.add(trial)
    
    logger.info(f"🔬 Added {len(trials)} clinical trials")


async def seed_catalysts(db: Session):
    """Seed upcoming market catalysts"""
    base_date = datetime.now()
    catalysts = [
        Catalyst(
            title="Phase III Data Readout",
            company="Moderna Inc",
            drug="mRNA-4157",
            event_type="Data Readout",
            event_date=base_date + timedelta(days=45),
            probability=0.65,
            impact="High",
            description="Phase III results for personalized cancer vaccine in melanoma"
        ),
        Catalyst(
            title="FDA PDUFA Date",
            company="Gilead Sciences",
            drug="GS-441524", 
            event_type="FDA Decision",
            event_date=base_date + timedelta(days=78),
            probability=0.80,
            impact="High",
            description="FDA decision on antiviral for emerging infectious diseases"
        ),
        Catalyst(
            title="Partnership Announcement",
            company="BioNTech SE",
            drug="BNT111",
            event_type="Business Development",
            event_date=base_date + timedelta(days=21),
            probability=0.45,
            impact="Medium",
            description="Potential partnership for melanoma vaccine development"
        )
    ]
    
    for catalyst in catalysts:
        db.add(catalyst)
    
    logger.info(f"📅 Added {len(catalysts)} catalysts")


async def seed_market_data(db: Session):
    """Seed sample market data"""
    tickers = ["MRNA", "PFE", "BNTX", "GILD"]
    base_date = datetime.now() - timedelta(days=30)
    
    market_data_points = []
    
    for ticker in tickers:
        # Generate 30 days of sample data
        base_price = {"MRNA": 95.0, "PFE": 35.0, "BNTX": 110.0, "GILD": 85.0}[ticker]
        
        for i in range(30):
            date = base_date + timedelta(days=i)
            # Simple random walk for demo
            price_change = (hash(f"{ticker}-{i}") % 100 - 50) / 1000 * base_price
            open_price = base_price + price_change
            close_price = open_price + (hash(f"{ticker}-close-{i}") % 100 - 50) / 1000 * base_price
            high_price = max(open_price, close_price) * 1.02
            low_price = min(open_price, close_price) * 0.98
            volume = (hash(f"{ticker}-vol-{i}") % 10000000) + 1000000
            
            market_data_points.append(MarketData(
                ticker=ticker,
                timestamp=date,
                open_price=round(open_price, 2),
                high_price=round(high_price, 2),
                low_price=round(low_price, 2), 
                close_price=round(close_price, 2),
                volume=volume,
                market_cap=round(close_price * 1_000_000_000, 0)
            ))
    
    for data_point in market_data_points:
        db.add(data_point)
    
    logger.info(f"📈 Added {len(market_data_points)} market data points")
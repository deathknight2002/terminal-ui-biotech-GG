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
    """Seed biotech/pharma companies from research primers (DMD, Cardiology, IBD)"""
    companies = [
        # DMD (Duchenne Muscular Dystrophy) Companies
        Company(
            name="Sarepta Therapeutics",
            ticker="SRPT",
            company_type="Biotech",
            market_cap=7_800_000_000,
            headquarters="Cambridge, MA",
            founded=1980,
            employees=1100,
            pipeline_count=15,
            therapeutic_areas="Rare Disease,Neurology"
        ),
        Company(
            name="BioMarin Pharmaceutical",
            ticker="BMRN",
            company_type="Biotech",
            market_cap=18_500_000_000,
            headquarters="San Rafael, CA",
            founded=1997,
            employees=3200,
            pipeline_count=25,
            therapeutic_areas="Rare Disease,Metabolic"
        ),
        Company(
            name="Edgewise Therapeutics",
            ticker="EWTX",
            company_type="Biotech",
            market_cap=2_100_000_000,
            headquarters="Boulder, CO",
            founded=2017,
            employees=180,
            pipeline_count=5,
            therapeutic_areas="Rare Disease,Cardiology,Neurology"
        ),
        Company(
            name="Insmed Inc",
            ticker="INSM",
            company_type="Biotech",
            market_cap=3_400_000_000,
            headquarters="Bridgewater, NJ",
            founded=1999,
            employees=650,
            pipeline_count=8,
            therapeutic_areas="Rare Disease,Infectious Disease"
        ),
        Company(
            name="Jazz Pharmaceuticals",
            ticker="JAZZ",
            company_type="SMid Pharma",
            market_cap=6_800_000_000,
            headquarters="Dublin, Ireland",
            founded=2003,
            employees=3100,
            pipeline_count=22,
            therapeutic_areas="Oncology,Sleep,Rare Disease"
        ),
        Company(
            name="Keros Therapeutics",
            ticker="KROS",
            company_type="Biotech",
            market_cap=1_200_000_000,
            headquarters="Lexington, MA",
            founded=2015,
            employees=120,
            pipeline_count=6,
            therapeutic_areas="Rare Disease,Hematology"
        ),
        Company(
            name="PepGen Inc",
            ticker="PEPG",
            company_type="Biotech",
            market_cap=450_000_000,
            headquarters="Cambridge, MA",
            founded=2017,
            employees=95,
            pipeline_count=4,
            therapeutic_areas="Rare Disease,Neurology"
        ),
        Company(
            name="Pfizer Inc",
            ticker="PFE",
            company_type="Big Pharma",
            market_cap=165_000_000_000,
            headquarters="New York, NY",
            founded=1849,
            employees=83000,
            pipeline_count=95,
            therapeutic_areas="Oncology,Immunology,Cardiology,Rare Disease"
        ),
        Company(
            name="uniQure NV",
            ticker="QURE",
            company_type="Biotech",
            market_cap=580_000_000,
            headquarters="Amsterdam, Netherlands",
            founded=1998,
            employees=340,
            pipeline_count=7,
            therapeutic_areas="Rare Disease,Gene Therapy"
        ),
        Company(
            name="Regenxbio Inc",
            ticker="RGNX",
            company_type="Biotech",
            market_cap=920_000_000,
            headquarters="Rockville, MD",
            founded=2008,
            employees=280,
            pipeline_count=12,
            therapeutic_areas="Rare Disease,Gene Therapy"
        ),
        Company(
            name="Avidity Biosciences",
            ticker="RNA",
            company_type="Biotech",
            market_cap=3_600_000_000,
            headquarters="San Diego, CA",
            founded=2012,
            employees=310,
            pipeline_count=9,
            therapeutic_areas="Rare Disease,Oligonucleotide"
        ),
        Company(
            name="Solid Biosciences",
            ticker="SLDB",
            company_type="Biotech",
            market_cap=180_000_000,
            headquarters="Cambridge, MA",
            founded=2013,
            employees=85,
            pipeline_count=3,
            therapeutic_areas="Rare Disease,Gene Therapy"
        ),
        Company(
            name="Wave Life Sciences",
            ticker="WVE",
            company_type="Biotech",
            market_cap=720_000_000,
            headquarters="Cambridge, MA",
            founded=2012,
            employees=290,
            pipeline_count=11,
            therapeutic_areas="Rare Disease,Neurology,Metabolic"
        ),
        
        # Cardiology Companies
        Company(
            name="Amgen Inc",
            ticker="AMGN",
            company_type="Big Pharma",
            market_cap=148_000_000_000,
            headquarters="Thousand Oaks, CA",
            founded=1980,
            employees=24500,
            pipeline_count=48,
            therapeutic_areas="Cardiology,Oncology,Inflammation"
        ),
        Company(
            name="Arrowhead Pharmaceuticals",
            ticker="ARWR",
            company_type="Biotech",
            market_cap=4_100_000_000,
            headquarters="Pasadena, CA",
            founded=1989,
            employees=410,
            pipeline_count=14,
            therapeutic_areas="Cardiology,Rare Disease,Metabolic"
        ),
        Company(
            name="AstraZeneca PLC",
            ticker="AZN",
            company_type="Big Pharma",
            market_cap=215_000_000_000,
            headquarters="Cambridge, UK",
            founded=1999,
            employees=89400,
            pipeline_count=132,
            therapeutic_areas="Oncology,Cardiology,Respiratory"
        ),
        Company(
            name="Bristol Myers Squibb",
            ticker="BMY",
            company_type="Big Pharma",
            market_cap=108_000_000_000,
            headquarters="New York, NY",
            founded=1887,
            employees=34300,
            pipeline_count=58,
            therapeutic_areas="Oncology,Immunology,Cardiology"
        ),
        Company(
            name="Cytokinetics Inc",
            ticker="CYTK",
            company_type="Biotech",
            market_cap=5_200_000_000,
            headquarters="South San Francisco, CA",
            founded=1997,
            employees=390,
            pipeline_count=8,
            therapeutic_areas="Cardiology,Rare Disease"
        ),
        Company(
            name="Ionis Pharmaceuticals",
            ticker="IONS",
            company_type="Biotech",
            market_cap=4_900_000_000,
            headquarters="Carlsbad, CA",
            founded=1989,
            employees=950,
            pipeline_count=42,
            therapeutic_areas="Cardiology,Neurology,Rare Disease"
        ),
        Company(
            name="Eli Lilly and Company",
            ticker="LLY",
            company_type="Big Pharma",
            market_cap=732_000_000_000,
            headquarters="Indianapolis, IN",
            founded=1876,
            employees=43000,
            pipeline_count=71,
            therapeutic_areas="Diabetes,Oncology,Neurology,Cardiology"
        ),
        Company(
            name="Lexeo Therapeutics",
            ticker="LXRX",
            company_type="Biotech",
            market_cap=120_000_000,
            headquarters="New York, NY",
            founded=2015,
            employees=65,
            pipeline_count=4,
            therapeutic_areas="Cardiology,Gene Therapy"
        ),
        Company(
            name="Merck & Co",
            ticker="MRK",
            company_type="Big Pharma",
            market_cap=252_000_000_000,
            headquarters="Rahway, NJ",
            founded=1891,
            employees=68000,
            pipeline_count=84,
            therapeutic_areas="Oncology,Vaccines,Cardiology,Infectious Disease"
        ),
        Company(
            name="Namnambio Inc",
            ticker="NAMS",
            company_type="Biotech",
            market_cap=85_000_000,
            headquarters="San Diego, CA",
            founded=2018,
            employees=42,
            pipeline_count=2,
            therapeutic_areas="Cardiology"
        ),
        Company(
            name="Tenax Therapeutics",
            ticker="TENX",
            company_type="Biotech",
            market_cap=25_000_000,
            headquarters="Morrisville, NC",
            founded=2011,
            employees=15,
            pipeline_count=2,
            therapeutic_areas="Cardiology,Pulmonary"
        ),
        Company(
            name="Tremeau Pharmaceuticals",
            ticker="TRMX",
            company_type="Biotech",
            market_cap=95_000_000,
            headquarters="Boston, MA",
            founded=2019,
            employees=38,
            pipeline_count=3,
            therapeutic_areas="Cardiology"
        )
    ]
    
    for company in companies:
        db.add(company)
    
    logger.info(f"📊 Added {len(companies)} companies")


async def seed_drugs(db: Session):
    """Seed drug pipeline data for DMD, Cardiology, and other therapeutic areas"""
    drugs = [
        # DMD (Duchenne Muscular Dystrophy) Pipeline
        Drug(
            name="SRP-5051",
            generic_name="Vesleteplirsen",
            company="Sarepta Therapeutics",
            therapeutic_area="Rare Disease",
            indication="Duchenne Muscular Dystrophy (Exon 51 Skip)",
            phase="Phase III",
            mechanism="Exon-skipping PMO",
            target="Dystrophin restoration"
        ),
        Drug(
            name="SRP-9001",
            generic_name="Delandistrogene Moxeparvovec",
            company="Sarepta Therapeutics",
            therapeutic_area="Rare Disease",
            indication="Duchenne Muscular Dystrophy",
            phase="Approved",
            mechanism="AAV-mediated gene therapy",
            target="Micro-dystrophin gene delivery"
        ),
        Drug(
            name="Vamorolone",
            generic_name="Agamree",
            company="Santhera Pharmaceuticals",
            therapeutic_area="Rare Disease",
            indication="Duchenne Muscular Dystrophy",
            phase="Approved",
            mechanism="Dissociative steroid",
            target="Anti-inflammatory without growth suppression"
        ),
        Drug(
            name="EDG-5506",
            generic_name="Edgewise DMD Candidate",
            company="Edgewise Therapeutics",
            therapeutic_area="Rare Disease",
            indication="Duchenne Muscular Dystrophy",
            phase="Phase II",
            mechanism="Myosin inhibitor",
            target="Fast skeletal muscle myosin"
        ),
        Drug(
            name="BMN-307",
            generic_name="BioMarin DMD Gene Therapy",
            company="BioMarin Pharmaceutical",
            therapeutic_area="Rare Disease",
            indication="Duchenne Muscular Dystrophy",
            phase="Phase I/II",
            mechanism="AAV gene therapy",
            target="Dystrophin restoration"
        ),
        Drug(
            name="AOC-1044",
            generic_name="Avidity DMD Candidate",
            company="Avidity Biosciences",
            therapeutic_area="Rare Disease",
            indication="Duchenne Muscular Dystrophy (Exon 44 Skip)",
            phase="Phase I/II",
            mechanism="AOC platform (antibody-conjugated oligonucleotide)",
            target="Exon 44 skipping"
        ),
        
        # Cardiology Pipeline
        Drug(
            name="Aficamten",
            generic_name="CK-274",
            company="Cytokinetics Inc",
            therapeutic_area="Cardiology",
            indication="Hypertrophic Cardiomyopathy",
            phase="Phase III",
            mechanism="Cardiac myosin inhibitor",
            target="Cardiac myosin ATPase"
        ),
        Drug(
            name="Omecamtiv Mecarbil",
            generic_name="CK-1827452",
            company="Cytokinetics Inc",
            therapeutic_area="Cardiology",
            indication="Heart Failure",
            phase="Phase III",
            mechanism="Cardiac myosin activator",
            target="Cardiac sarcomere"
        ),
        Drug(
            name="Plozasiran",
            generic_name="ARO-APOC3",
            company="Arrowhead Pharmaceuticals",
            therapeutic_area="Cardiology",
            indication="Hypertriglyceridemia",
            phase="Phase III",
            mechanism="RNAi therapeutic",
            target="APOC3 mRNA silencing"
        ),
        Drug(
            name="Zodasiran",
            generic_name="ARO-ANG3",
            company="Arrowhead Pharmaceuticals",
            therapeutic_area="Cardiology",
            indication="Mixed Dyslipidemia",
            phase="Phase III",
            mechanism="RNAi therapeutic",
            target="ANGPTL3 mRNA silencing"
        ),
        Drug(
            name="Olpasiran",
            generic_name="AMG-890",
            company="Amgen Inc",
            therapeutic_area="Cardiology",
            indication="Atherosclerotic Cardiovascular Disease",
            phase="Phase III",
            mechanism="siRNA",
            target="Lipoprotein(a) reduction"
        ),
        Drug(
            name="Pelacarsen",
            generic_name="AKCEA-APO(a)-LRx",
            company="Ionis Pharmaceuticals",
            therapeutic_area="Cardiology",
            indication="Elevated Lipoprotein(a)",
            phase="Phase III",
            mechanism="Antisense oligonucleotide",
            target="Apolipoprotein(a) mRNA"
        ),
        Drug(
            name="Tirzepatide",
            generic_name="Mounjaro/Zepbound",
            company="Eli Lilly and Company",
            therapeutic_area="Cardiology",
            indication="Type 2 Diabetes, Obesity, Heart Failure",
            phase="Approved",
            mechanism="Dual GIP/GLP-1 receptor agonist",
            target="Incretin receptors"
        ),
        Drug(
            name="LX-2020",
            generic_name="Lexeo Cardiac Gene Therapy",
            company="Lexeo Therapeutics",
            therapeutic_area="Cardiology",
            indication="Heart Failure",
            phase="Phase I",
            mechanism="AAV-mediated gene therapy",
            target="SERCA2a gene delivery"
        ),
        
        # Additional pipeline assets
        Drug(
            name="Vutrisiran",
            generic_name="Amvuttra",
            company="Alnylam Pharmaceuticals",
            therapeutic_area="Rare Disease",
            indication="ATTR Amyloidosis",
            phase="Approved",
            mechanism="RNAi therapeutic",
            target="TTR mRNA silencing"
        ),
        Drug(
            name="Keytruda",
            generic_name="Pembrolizumab",
            company="Merck & Co",
            therapeutic_area="Oncology",
            indication="Multiple Cancer Types",
            phase="Approved",
            mechanism="Anti-PD-1 antibody",
            target="PD-1 immune checkpoint"
        )
    ]
    
    for drug in drugs:
        db.add(drug)
    
    logger.info(f"💊 Added {len(drugs)} drugs")


async def seed_clinical_trials(db: Session):
    """Seed clinical trial data for real biotech programs"""
    trials = [
        ClinicalTrial(
            nct_id="NCT05096221",
            title="SRP-5051 in Duchenne Muscular Dystrophy (MOMENTUM)",
            phase="Phase III",
            status="Active",
            condition="Duchenne Muscular Dystrophy",
            intervention="SRP-5051 (Vesleteplirsen)",
            sponsor="Sarepta Therapeutics",
            start_date=datetime(2022, 1, 15),
            completion_date=datetime(2025, 11, 30),
            enrollment=72
        ),
        ClinicalTrial(
            nct_id="NCT05291091",
            title="Aficamten in Obstructive Hypertrophic Cardiomyopathy (SEQUOIA-HCM)",
            phase="Phase III", 
            status="Active",
            condition="Hypertrophic Cardiomyopathy",
            intervention="Aficamten",
            sponsor="Cytokinetics Inc",
            start_date=datetime(2022, 4, 20),
            completion_date=datetime(2025, 8, 15),
            enrollment=282
        ),
        ClinicalTrial(
            nct_id="NCT04136171",
            title="Plozasiran in Severe Hypertriglyceridemia (PALISADE)",
            phase="Phase III",
            status="Active",
            condition="Hypertriglyceridemia",
            intervention="Plozasiran (ARO-APOC3)",
            sponsor="Arrowhead Pharmaceuticals",
            start_date=datetime(2021, 9, 10),
            completion_date=datetime(2025, 12, 31),
            enrollment=75
        ),
        ClinicalTrial(
            nct_id="NCT05399992",
            title="AOC-1044 in Duchenne Muscular Dystrophy",
            phase="Phase I/II",
            status="Recruiting",
            condition="Duchenne Muscular Dystrophy",
            intervention="AOC-1044",
            sponsor="Avidity Biosciences",
            start_date=datetime(2023, 6, 1),
            completion_date=datetime(2026, 3, 31),
            enrollment=48
        )
    ]
    
    for trial in trials:
        db.add(trial)
    
    logger.info(f"🔬 Added {len(trials)} clinical trials")


async def seed_catalysts(db: Session):
    """Seed upcoming market catalysts for real biotech companies"""
    base_date = datetime.now()
    catalysts = [
        Catalyst(
            title="SRP-5051 DMD Phase III Data Readout",
            company="Sarepta Therapeutics",
            drug="SRP-5051",
            event_type="Data Readout",
            event_date=base_date + timedelta(days=45),
            probability=0.68,
            impact="High",
            description="MOMENTUM study pivotal dystrophin expression readout; street looking for >6% baseline delta in exon 51-skip amenable DMD patients"
        ),
        Catalyst(
            title="Aficamten FDA PDUFA Date",
            company="Cytokinetics Inc",
            drug="Aficamten", 
            event_type="FDA Decision",
            event_date=base_date + timedelta(days=78),
            probability=0.82,
            impact="High",
            description="FDA decision on first-in-class cardiac myosin inhibitor for obstructive hypertrophic cardiomyopathy; SEQUOIA-HCM data positive"
        ),
        Catalyst(
            title="Plozasiran FDA Advisory Committee",
            company="Arrowhead Pharmaceuticals",
            drug="Plozasiran",
            event_type="FDA AdComm",
            event_date=base_date + timedelta(days=62),
            probability=0.75,
            impact="High",
            description="AdComm meeting for RNAi therapy targeting APOC3 in severe hypertriglyceridemia; PALISADE study met primary endpoint"
        ),
        Catalyst(
            title="AOC-1044 Phase I/II Interim Data",
            company="Avidity Biosciences",
            drug="AOC-1044",
            event_type="Data Readout",
            event_date=base_date + timedelta(days=92),
            probability=0.60,
            impact="Medium",
            description="First interim safety and dystrophin expression data for AOC platform in DMD; exon 44-skip cohort"
        ),
        Catalyst(
            title="LX-2020 Gene Therapy IND Clearance",
            company="Lexeo Therapeutics",
            drug="LX-2020",
            event_type="Regulatory",
            event_date=base_date + timedelta(days=35),
            probability=0.70,
            impact="Medium",
            description="IND clearance for AAV-mediated SERCA2a gene therapy in heart failure with reduced ejection fraction"
        ),
        Catalyst(
            title="Tirzepatide Heart Failure Trial Enrollment Complete",
            company="Eli Lilly and Company",
            drug="Tirzepatide",
            event_type="Clinical Milestone",
            event_date=base_date + timedelta(days=21),
            probability=0.85,
            impact="Medium",
            description="SUMMIT trial enrollment complete for dual GIP/GLP-1 agonist in HFpEF and obesity"
        )
    ]
    
    for catalyst in catalysts:
        db.add(catalyst)
    
    logger.info(f"📅 Added {len(catalysts)} catalysts")


async def seed_market_data(db: Session):
    """Seed sample market data for real biotech companies"""
    # Use real biotech tickers from DMD and Cardiology primers
    tickers = ["SRPT", "BMRN", "ARWR", "CYTK", "AMGN", "LLY", "PFE", "MRK"]
    base_date = datetime.now() - timedelta(days=30)
    
    market_data_points = []
    
    for ticker in tickers:
        # Approximate base prices for demo (in production, fetch from real API)
        base_price = {
            "SRPT": 115.0, "BMRN": 78.0, "ARWR": 28.0, "CYTK": 52.0,
            "AMGN": 295.0, "LLY": 825.0, "PFE": 28.0, "MRK": 98.0
        }[ticker]
        
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
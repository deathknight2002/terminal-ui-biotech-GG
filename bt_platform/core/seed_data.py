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
    """Seed 50 'Ionis-style' stealth catalyst watchlist with scoring"""
    base_date = datetime.now()
    
    # Cardiometabolic & CV outcomes (13)
    catalysts = [
        # 1. Ionis - olezarsen (apoC-III) in SHTG & FCS
        Catalyst(
            title="Olezarsen SHTG Pancreatitis Event Data",
            company="Ionis Pharmaceuticals",
            drug="Olezarsen (apoC-III)",
            event_type="Data Readout",
            event_date=base_date + timedelta(days=120),
            probability=0.75,
            impact="High",
            description="FCS already approved as Tryngolza; two SHTG Phase 3's hit TG endpoints; AP-event deltas are the equity unlock",
            event_leverage=4,  # Hard pancreatitis endpoint
            timing_clarity=2,  # Event-driven but expected Q1 2026
            surprise_factor=3,  # Market focused on TG, not AP events
            downside_contained=2,  # FCS approval de-risks
            market_depth=2     # SHTG + FCS niche but high-value
        ),
        # 2. Arrowhead - plozasiran (apoC-III) in FCS/SHTG
        Catalyst(
            title="Plozasiran FCS Zero Pancreatitis Events",
            company="Arrowhead Pharmaceuticals",
            drug="Plozasiran (apoC-III)",
            event_type="Data Readout",
            event_date=base_date + timedelta(days=180),
            probability=0.72,
            impact="High",
            description="Zero pancreatitis events in continuous-dosing FCS cohort; SHTG programs set up 2026 filings. If AP events replicate, re-rating is violent",
            event_leverage=4,  # Zero events is a hard endpoint
            timing_clarity=2,  # H2 2026 readout expected
            surprise_factor=3,  # AP event suppression undermodeled
            downside_contained=3,  # Safety already validated
            market_depth=2
        ),
        # 3. Alnylam/Roche - zilebesiran (siRNA, renin) in hypertension
        Catalyst(
            title="Zilebesiran KARDIA-3 Durability + ZENITH CV Outcomes",
            company="Alnylam Pharmaceuticals",
            drug="Zilebesiran (siRNA renin)",
            event_type="Clinical Milestone",
            event_date=base_date + timedelta(days=240),
            probability=0.68,
            impact="High",
            description="KARDIA-3 combo durability + ZENITH CV-outcomes trial initiation signal infrequent dosing can own high-risk HTN",
            event_leverage=3,  # Durability data + CV outcomes signal
            timing_clarity=2,  # 2026 milestones
            surprise_factor=2,  # Bar under-modeled vs GLP-1 halo
            downside_contained=2,
            market_depth=3     # Massive HTN market
        ),
        # 4. Novartis/Ionis - pelacarsen (Lp(a))
        Catalyst(
            title="Pelacarsen Lp(a)HORIZON Outcomes First Mover",
            company="Novartis",
            drug="Pelacarsen (Lp(a))",
            event_type="Data Readout",
            event_date=base_date + timedelta(days=365),
            probability=0.60,
            impact="High",
            description="Lp(a)HORIZON outcomes (first mover). Any positive MACE signal reframes the class and drags peers",
            event_leverage=4,  # MACE endpoint
            timing_clarity=1,  # Event-driven, ~2027
            surprise_factor=2,  # First Lp(a) outcomes data
            downside_contained=2,
            market_depth=3
        ),
        # 5. Amgen - olpasiran (Lp(a))
        Catalyst(
            title="Olpasiran OCEAN(a)-Outcomes Readout",
            company="Amgen",
            drug="Olpasiran (Lp(a))",
            event_type="Data Readout",
            event_date=base_date + timedelta(days=420),
            probability=0.65,
            impact="High",
            description="OCEAN(a)-Outcomes readout (2026) with deep Lp(a) knockdown; outcome win turbocharges market sizing",
            event_leverage=4,  # CV outcomes
            timing_clarity=2,  # 2026 expected
            surprise_factor=2,
            downside_contained=2,
            market_depth=3
        ),
        # 6. Lilly - lepodisiran (Lp(a))
        Catalyst(
            title="Lepodisiran ACCLAIM-Lp(a) Phase 3",
            company="Eli Lilly",
            drug="Lepodisiran (Lp(a))",
            event_type="Clinical Milestone",
            event_date=base_date + timedelta(days=300),
            probability=0.70,
            impact="High",
            description="Huge and durable Lp(a) knockdown; Phase 3 ACCLAIM-Lp(a) underway; oral muvalaplin keeps pressure on competitors",
            event_leverage=3,
            timing_clarity=2,
            surprise_factor=2,
            downside_contained=3,  # Lilly execution track record
            market_depth=3
        ),
        # 7. Verve - VERVE-102 (PCSK9 base editing)
        Catalyst(
            title="VERVE-102 Gene Editing Safety/Durability",
            company="Verve Therapeutics",
            drug="VERVE-102 (PCSK9 base editing)",
            event_type="Data Readout",
            event_date=base_date + timedelta(days=150),
            probability=0.55,
            impact="High",
            description="Cleaner safety/LDL durability in expanded cohorts → first gene-editing program with practical CV use case",
            event_leverage=3,  # Safety + durability in gene editing
            timing_clarity=2,
            surprise_factor=3,  # First practical gene-editing CV use
            downside_contained=1,  # Gene editing safety risk
            market_depth=2
        ),
        # 8. Arrowhead - zodasiran (ANGPTL3 siRNA)
        Catalyst(
            title="Zodasiran ANGPTL3 Precision Subpopulation",
            company="Arrowhead Pharmaceuticals",
            drug="Zodasiran (ANGPTL3 siRNA)",
            event_type="Data Readout",
            event_date=base_date + timedelta(days=200),
            probability=0.62,
            impact="Medium",
            description="Strong Phase 2 lipid lowering across atherogenic fractions; if program re-accelerates in precision subpopulation",
            event_leverage=2,  # Phase 2 data
            timing_clarity=2,
            surprise_factor=2,
            downside_contained=2,
            market_depth=2
        ),
        # 9. Silence - zerlasiran (SLN360; Lp(a))
        Catalyst(
            title="Zerlasiran >80% Lp(a) Reduction Phase 3",
            company="Silence Therapeutics",
            drug="Zerlasiran (SLN360; Lp(a))",
            event_type="Clinical Milestone",
            event_date=base_date + timedelta(days=270),
            probability=0.68,
            impact="Medium",
            description="Phase 2 reductions >80% and Phase 3 planning; any outcomes pathway clarity is a catalyst",
            event_leverage=3,  # >80% reduction impressive
            timing_clarity=2,
            surprise_factor=2,
            downside_contained=2,
            market_depth=2
        ),
        # 10. Madrigal - resmetirom (MASH)
        Catalyst(
            title="Resmetirom MAESTRO-NASH-OUTCOMES Cirrhosis",
            company="Madrigal Pharmaceuticals",
            drug="Resmetirom (MASH)",
            event_type="Data Readout",
            event_date=base_date + timedelta(days=400),
            probability=0.70,
            impact="High",
            description="MAESTRO-NASH-OUTCOMES in compensated cirrhosis + durable fibrosis/LSM data; broader label momentum for MASH",
            event_leverage=3,  # Fibrosis endpoint
            timing_clarity=2,
            surprise_factor=2,
            downside_contained=2,
            market_depth=3
        ),
        # 11. 89bio - pegozafermin (FGF21)
        Catalyst(
            title="Pegozafermin Roche Deal Close + Combo Strategy",
            company="89bio",
            drug="Pegozafermin (FGF21)",
            event_type="Corporate",
            event_date=base_date + timedelta(days=90),
            probability=0.80,
            impact="Medium",
            description="Roche deal closing + combo strategy with incretins reframes revenue trajectory; deal CVR milestones swing sentiment",
            event_leverage=2,  # Deal close + combo data
            timing_clarity=3,  # Deal timing clear
            surprise_factor=2,
            downside_contained=3,  # Deal de-risks
            market_depth=2
        ),
        # 12. Regeneron - evinacumab (ANGPTL3 mAb) expansions
        Catalyst(
            title="Evinacumab Pediatric/sHTG Label Expansion",
            company="Regeneron",
            drug="Evinacumab (ANGPTL3 mAb)",
            event_type="Regulatory",
            event_date=base_date + timedelta(days=210),
            probability=0.72,
            impact="Medium",
            description="Pediatrics/rare hyperlipidemia & sHTG positioning; payer-friendly hard outcomes could broaden use",
            event_leverage=3,
            timing_clarity=2,
            surprise_factor=1,
            downside_contained=3,  # Approved drug expansion
            market_depth=2
        ),
        # 13. Travere - sparsentan (FSGS) PDUFA
        Catalyst(
            title="Sparsentan FSGS sNDA PDUFA Jan 13 2026",
            company="Travere Therapeutics",
            drug="Sparsentan (FSGS)",
            event_type="FDA Decision",
            event_date=base_date + timedelta(days=95),  # ~Jan 13, 2026
            probability=0.75,
            impact="High",
            description="FDA accepted sNDA; if agency tolerates non-eGFR primary and leans into proteinuria as surrogate, coiled spring",
            event_leverage=3,  # Surrogate endpoint acceptance
            timing_clarity=3,  # Fixed PDUFA
            surprise_factor=3,  # Proteinuria surrogate acceptance
            downside_contained=2,
            market_depth=2
        ),
    ]
    
    # Rare disease, neuro & respiratory (12)
    catalysts.extend([
        # 14. Scholar Rock - apitegromab (SMA) resubmission
        Catalyst(
            title="Apitegromab SMA CRL Resolution/Approval",
            company="Scholar Rock",
            drug="Apitegromab (SMA)",
            event_type="FDA Decision",
            event_date=base_date + timedelta(days=180),
            probability=0.70,
            impact="High",
            description="CRL was CMC-ish; resolution plus clean label flips script for real disease-modifying add-on in SMA",
            event_leverage=3,
            timing_clarity=2,
            surprise_factor=3,  # CRL resolution often 30%+ pop
            downside_contained=3,  # CMC not efficacy
            market_depth=2
        ),
        # 15. Sarepta - ELEVIDYS label/age/functional expansions (DMD)
        Catalyst(
            title="ELEVIDYS Label Expansion Ambulatory/Non-Ambulatory",
            company="Sarepta Therapeutics",
            drug="ELEVIDYS (DMD)",
            event_type="Regulatory",
            event_date=base_date + timedelta(days=150),
            probability=0.75,
            impact="High",
            description="Broader ambulatory/non-ambulatory contours translate to bigger TAM/longer duration narratives",
            event_leverage=3,
            timing_clarity=2,
            surprise_factor=2,
            downside_contained=3,
            market_depth=2
        ),
        # 16. Solid Biosciences - SGT-003 (next-gen micro-dystrophin)
        Catalyst(
            title="SGT-003 Vector Transduction Data Quality",
            company="Solid Biosciences",
            drug="SGT-003 (micro-dystrophin)",
            event_type="Data Readout",
            event_date=base_date + timedelta(days=220),
            probability=0.58,
            impact="Medium",
            description="Vector transduction/data quality > first-gen peers; biomarker-to-function linkage would move the cap",
            event_leverage=2,
            timing_clarity=2,
            surprise_factor=2,
            downside_contained=2,
            market_depth=2
        ),
        # 17. Ultragenyx - GTX-102 (Angelman) Phase 3
        Catalyst(
            title="GTX-102 Angelman Phase 3 Cognition Signal",
            company="Ultragenyx",
            drug="GTX-102 (Angelman)",
            event_type="Data Readout",
            event_date=base_date + timedelta(days=300),
            probability=0.65,
            impact="High",
            description="Fully enrolled Phase 3; any unequivocal cognition/communication signal ripples across neuro-ASO comps",
            event_leverage=4,  # Cognition endpoint
            timing_clarity=2,
            surprise_factor=2,
            downside_contained=2,
            market_depth=2
        ),
        # 18. Ionis - ION582 (Angelman) Phase 3
        Catalyst(
            title="ION582 Angelman REVEAL Phase 3 Safety + Function",
            company="Ionis Pharmaceuticals",
            drug="ION582 (Angelman)",
            event_type="Data Readout",
            event_date=base_date + timedelta(days=330),
            probability=0.68,
            impact="High",
            description="FDA Breakthrough and pivotal REVEAL underway; clean safety + function wins = platform credit",
            event_leverage=3,
            timing_clarity=2,
            surprise_factor=2,
            downside_contained=2,
            market_depth=2
        ),
        # 19. Krystal - VYJUVEK (B-VEC) at-home + age expansion (DEB)
        Catalyst(
            title="VYJUVEK At-Home + From Birth Label",
            company="Krystal Biotech",
            drug="VYJUVEK (B-VEC; DEB)",
            event_type="Regulatory",
            event_date=base_date + timedelta(days=120),
            probability=0.78,
            impact="Medium",
            description="Home administration + from birth label = frictionless uptake & margin tailwind",
            event_leverage=2,  # Label expansion
            timing_clarity=2,
            surprise_factor=2,  # Friction remover
            downside_contained=3,
            market_depth=1     # Rare disease
        ),
        # 20. Krystal - KB707 (inhaled IL-2/IL-12) in NSCLC
        Catalyst(
            title="KB707 Inhaled IL-2/IL-12 NSCLC ORR",
            company="Krystal Biotech",
            drug="KB707 (inhaled IL-2/IL-12)",
            event_type="Data Readout",
            event_date=base_date + timedelta(days=180),
            probability=0.55,
            impact="High",
            description="Surprising ORR in heavily pretreated NSCLC; if FDA path clarified post-Replimune noise, sentiment re-rates",
            event_leverage=3,  # ORR in tough indication
            timing_clarity=1,
            surprise_factor=3,  # Unexpected efficacy
            downside_contained=2,
            market_depth=3     # Large NSCLC market
        ),
        # 21. Invivyd - VYD2311 (broad coronavirus mAb)
        Catalyst(
            title="VYD2311 Prophylaxis Immunocompromised Policy",
            company="Invivyd",
            drug="VYD2311 (coronavirus mAb)",
            event_type="Clinical Milestone",
            event_date=base_date + timedelta(days=140),
            probability=0.60,
            impact="Medium",
            description="Prophylaxis/early-treat utility in immunocompromised with variant resilience—policy tailwinds matter",
            event_leverage=2,
            timing_clarity=2,
            surprise_factor=2,
            downside_contained=2,
            market_depth=2
        ),
        # 22. Regenxbio - RGX-121 (Hunter syndrome) PDUFA
        Catalyst(
            title="RGX-121 Hunter Syndrome PDUFA Feb 8 2026",
            company="Regenxbio",
            drug="RGX-121 (Hunter syndrome)",
            event_type="FDA Decision",
            event_date=base_date + timedelta(days=125),  # ~Feb 8, 2026
            probability=0.72,
            impact="High",
            description="First systemic neurodegenerative gene therapy approval in this space resets platform risk",
            event_leverage=3,
            timing_clarity=3,  # Fixed PDUFA
            surprise_factor=2,  # Platform validation
            downside_contained=2,
            market_depth=1
        ),
        # 23. Vertex - zimslecel (VX-880 line) in T1D
        Catalyst(
            title="Zimslecel T1D Insulin-Independence Consistency",
            company="Vertex Pharmaceuticals",
            drug="Zimslecel (VX-880; T1D)",
            event_type="Data Readout",
            event_date=base_date + timedelta(days=250),
            probability=0.65,
            impact="High",
            description="Clearer immunosuppression strategy and consistency of insulin-independence = optionality on mega-market",
            event_leverage=3,
            timing_clarity=2,
            surprise_factor=2,
            downside_contained=2,
            market_depth=3
        ),
        # 24. Stoke - zorevunersen (STK-001; Dravet) Phase 3
        Catalyst(
            title="Zorevunersen Dravet Phase 3 Seizure + Cognition",
            company="Stoke Therapeutics",
            drug="Zorevunersen (STK-001; Dravet)",
            event_type="Data Readout",
            event_date=base_date + timedelta(days=280),
            probability=0.62,
            impact="High",
            description="First disease-modifying SCN1A up-regulation with seizure + cognition wins; read-through across epilepsies",
            event_leverage=3,
            timing_clarity=2,
            surprise_factor=2,
            downside_contained=2,
            market_depth=2
        ),
        # 25. Sanofi/INBRX - SAR447537 (INBRX-101; AATD)
        Catalyst(
            title="SAR447537 AATD Long-Interval Normal Levels",
            company="Sanofi",
            drug="SAR447537 (INBRX-101; AATD)",
            event_type="Data Readout",
            event_date=base_date + timedelta(days=190),
            probability=0.70,
            impact="Medium",
            description="Long-interval recombinant AAT hitting normal levels → commercial displacement story vs plasma-derived AAT",
            event_leverage=3,
            timing_clarity=2,
            surprise_factor=2,
            downside_contained=2,
            market_depth=2
        ),
    ])
    
    # Ophthalmology (1)
    catalysts.extend([
        # 26. Annexon - ANX007 (GA) Phase 3
        Catalyst(
            title="ANX007 GA Phase 3 Functional/Vision Endpoints",
            company="Annexon",
            drug="ANX007 (GA)",
            event_type="Data Readout",
            event_date=base_date + timedelta(days=310),
            probability=0.58,
            impact="High",
            description="Functional/vision endpoints and dosing cadence vs complement incumbents; clean efficacy on growth slows gaps tape",
            event_leverage=3,
            timing_clarity=2,
            surprise_factor=2,
            downside_contained=2,
            market_depth=3
        ),
    ])
    
    # Oncology - ADCs, degraders, radioligands, synthetic lethality (17)
    catalysts.extend([
        # 27. ADC Therapeutics - ZYNLONTA + glofitamab (LOTIS-7)
        Catalyst(
            title="ZYNLONTA+Glofitamab LOTIS-7 r/r LBCL ORR/CR",
            company="ADC Therapeutics",
            drug="ZYNLONTA + glofitamab",
            event_type="Data Readout",
            event_date=base_date + timedelta(days=160),
            probability=0.65,
            impact="High",
            description="Sky-high ORR/CR in r/r LBCL with tolerability; if expansion cohort confirms and registrational path firms, torque",
            event_leverage=3,
            timing_clarity=2,
            surprise_factor=3,
            downside_contained=2,
            market_depth=2
        ),
        # 28. Zymeworks/Jazz - zanidatamab (HER2) label/build-outs
        Catalyst(
            title="Zanidatamab 1L GEA Readouts + HER2 Basket",
            company="Zymeworks/Jazz",
            drug="Zanidatamab (HER2)",
            event_type="Data Readout",
            event_date=base_date + timedelta(days=200),
            probability=0.70,
            impact="Medium",
            description="FDA & EU approvals in BTC are in; 1L GEA readouts and broader HER2 basket create stacked optionality",
            event_leverage=2,
            timing_clarity=2,
            surprise_factor=2,
            downside_contained=3,
            market_depth=2
        ),
        # 29. Nurix - NX-5948 (BTK degrader)
        Catalyst(
            title="NX-5948 BTK Degrader Multi-Resistant CLL",
            company="Nurix",
            drug="NX-5948 (BTK degrader)",
            event_type="Data Readout",
            event_date=base_date + timedelta(days=170),
            probability=0.62,
            impact="High",
            description="Deep responses in multi-resistant CLL; dose expansion clarity + safety forces Street to model BTK-resistant niches",
            event_leverage=3,
            timing_clarity=2,
            surprise_factor=3,  # Platform proof
            downside_contained=2,
            market_depth=2
        ),
        # 30. Nurix - NX-2127 (BTK + IKZF1/3 degrader)
        Catalyst(
            title="NX-2127 Dual BTK+IMiD Degrader Biology",
            company="Nurix",
            drug="NX-2127 (BTK + IKZF1/3)",
            event_type="Data Readout",
            event_date=base_date + timedelta(days=210),
            probability=0.58,
            impact="Medium",
            description="Dual-degrade biology (BTK + IMiD neosubstrates) unlocks settings where any single MoA stalls",
            event_leverage=2,
            timing_clarity=2,
            surprise_factor=3,
            downside_contained=2,
            market_depth=2
        ),
        # 31. Repare - camonsertib (ATRi) ATM-mutated NSCLC
        Catalyst(
            title="Camonsertib ATRi ATM-Mutated NSCLC PFS",
            company="Repare Therapeutics",
            drug="Camonsertib (ATRi)",
            event_type="Data Readout",
            event_date=base_date + timedelta(days=190),
            probability=0.60,
            impact="High",
            description="Phase 2 signal in TRESR with PFS durability; clean monotherapy in genomically-defined niche often underpriced",
            event_leverage=3,
            timing_clarity=2,
            surprise_factor=2,
            downside_contained=2,
            market_depth=2
        ),
        # 32. Repare - lunresertib (PKMYT1) combos
        Catalyst(
            title="Lunresertib MYTHIC PKMYT1 CCNE1-Amplified",
            company="Repare Therapeutics",
            drug="Lunresertib (PKMYT1)",
            event_type="Data Readout",
            event_date=base_date + timedelta(days=230),
            probability=0.58,
            impact="Medium",
            description="MYTHIC module readouts + combo synergies (e.g., with WEE1) in CCNE1-amplified tumors—first-in-class leverage",
            event_leverage=2,
            timing_clarity=2,
            surprise_factor=3,
            downside_contained=2,
            market_depth=2
        ),
        # 33. ALX Oncology - evorpacept (CD47) gastric
        Catalyst(
            title="Evorpacept CD47 HER2+ Gastric ASPEN-06 Phase 2→3",
            company="ALX Oncology",
            drug="Evorpacept (CD47)",
            event_type="Data Readout",
            event_date=base_date + timedelta(days=240),
            probability=0.55,
            impact="Medium",
            description="Head & neck miss already in price; Phase 2→3 in HER2+ gastric (ASPEN-06) with antibody-synergy remains live binary",
            event_leverage=2,
            timing_clarity=2,
            surprise_factor=2,
            downside_contained=2,
            market_depth=2
        ),
        # 34. Replimune - RP1 regulatory path reset
        Catalyst(
            title="RP1 Post-CRL Type A Meeting Path Clarity",
            company="Replimune",
            drug="RP1 (oncolytic virus)",
            event_type="Regulatory",
            event_date=base_date + timedelta(days=110),
            probability=0.68,
            impact="High",
            description="Post-CRL clarity (Type A and next steps) can catalyze sharp re-rating if FDA signals viable plan",
            event_leverage=2,
            timing_clarity=2,
            surprise_factor=3,  # CRL resolution
            downside_contained=3,
            market_depth=2
        ),
        # 35. Krystal - KB707 oncology pivot (see #20 above, not duplicating)
        
        # 36. Keros - elritercept (KER-050) LR-MDS Phase 3
        Catalyst(
            title="Elritercept LR-MDS Phase 3 Erythroid Response",
            company="Keros Therapeutics",
            drug="Elritercept (KER-050; LR-MDS)",
            event_type="Clinical Milestone",
            event_date=base_date + timedelta(days=180),
            probability=0.70,
            impact="Medium",
            description="Erythroid response + TI rates in lower-risk MDS; Phase 3 launched Q3'25; life quality outcomes move prescribing fast",
            event_leverage=3,
            timing_clarity=2,
            surprise_factor=2,
            downside_contained=2,
            market_depth=2
        ),
        # 37. ALX Oncology - pipeline pivot (ALX2004 ADC)
        Catalyst(
            title="ALX2004 EGFR-ADC Early Hints",
            company="ALX Oncology",
            drug="ALX2004 (EGFR-ADC)",
            event_type="Data Readout",
            event_date=base_date + timedelta(days=270),
            probability=0.50,
            impact="Medium",
            description="If early EGFR-ADC hints land, credibility shifts from CD47 headwinds to ADC optionality; layoffs extend runway",
            event_leverage=2,
            timing_clarity=1,
            surprise_factor=2,
            downside_contained=2,
            market_depth=2
        ),
        # 38. Immunome - pipeline updates & partnerships
        Catalyst(
            title="Immunome Antibody Discovery Partnership Deal",
            company="Immunome",
            drug="Platform (antibody discovery)",
            event_type="Corporate",
            event_date=base_date + timedelta(days=200),
            probability=0.60,
            impact="Medium",
            description="Antibody discovery collaborations crystallize value faster than single-asset trials; watch R&D day & first-in-human",
            event_leverage=1,
            timing_clarity=2,
            surprise_factor=2,
            downside_contained=2,
            market_depth=2
        ),
        # 39. Annexon - broader complement oncology angles (not duplicating with #26)
        
        # 40. Repare - early PLK4/Polθ (RP-1664 / RP-3467) 1st data
        Catalyst(
            title="Repare PLK4/Polθ LIONS/POLAR First Patient Responses",
            company="Repare Therapeutics",
            drug="RP-1664/RP-3467 (PLK4/Polθ)",
            event_type="Data Readout",
            event_date=base_date + timedelta(days=320),
            probability=0.52,
            impact="High",
            description="2025–26 initial topline from LIONS/POLAR; first real responses in synthetic-lethal space can re-multiple quickly",
            event_leverage=3,
            timing_clarity=1,
            surprise_factor=3,  # Platform proof
            downside_contained=2,
            market_depth=2
        ),
    ])
    
    # Immunology / Derm / Inflammation (6)
    catalysts.extend([
        # 41. Kymera - KT-621 (STAT6 degrader) in atopic dermatitis
        Catalyst(
            title="KT-621 STAT6 Degrader AD P1b EASI + Safety",
            company="Kymera Therapeutics",
            drug="KT-621 (STAT6 degrader)",
            event_type="Data Readout",
            event_date=base_date + timedelta(days=160),
            probability=0.62,
            impact="High",
            description="If P1b shows fast EASI cut with clean safety/tolerability, oral biologicals race reopens",
            event_leverage=3,
            timing_clarity=2,
            surprise_factor=3,  # Oral degrader
            downside_contained=2,
            market_depth=3
        ),
        # 42. RAPT - FLX475 (CCR4) immuno-oncology combos
        Catalyst(
            title="FLX475 CCR4 Biomarker-Aided EBV+ Subsets",
            company="RAPT Therapeutics",
            drug="FLX475 (CCR4)",
            event_type="Data Readout",
            event_date=base_date + timedelta(days=210),
            probability=0.58,
            impact="Medium",
            description="Biomarker-aided subsets (EBV+, PD-L1+, HPV+) show signals; controlled win post-hold drama surprises crowd",
            event_leverage=2,
            timing_clarity=2,
            surprise_factor=2,
            downside_contained=2,
            market_depth=2
        ),
        # 43. Nektar - rezpegaldesleukin (T-reg) in AD
        Catalyst(
            title="Rezpegaldesleukin T-Reg AD Phase 2b Durability",
            company="Nektar Therapeutics",
            drug="Rezpegaldesleukin (T-reg)",
            event_type="Data Readout",
            event_date=base_date + timedelta(days=190),
            probability=0.60,
            impact="Medium",
            description="Phase 2b strength revived T-reg thesis; confirmatory or durability outputs keep re-rating going",
            event_leverage=2,
            timing_clarity=2,
            surprise_factor=2,
            downside_contained=2,
            market_depth=2
        ),
        # 44. Sanofi class risk - amlitelimab overhang (read-through)
        Catalyst(
            title="Amlitelimab AD Phase 3 Disappointing (Read-Through)",
            company="Sanofi",
            drug="Amlitelimab (OX40L)",
            event_type="Data Readout",
            event_date=base_date + timedelta(days=140),
            probability=0.55,
            impact="Medium",
            description="Disappointing AD Phase 3 sets up share shifts among emerging derm plays that beat profile on efficacy/interval",
            event_leverage=2,
            timing_clarity=2,
            surprise_factor=1,
            downside_contained=2,
            market_depth=2
        ),
        # 45. Ionis - cardio/inflammation partner disclosures
        Catalyst(
            title="Ionis >$5B Peak Sales Partner Data Drop",
            company="Ionis Pharmaceuticals",
            drug="Platform (multiple programs)",
            event_type="Corporate",
            event_date=base_date + timedelta(days=180),
            probability=0.72,
            impact="Medium",
            description="Company guided >$5B peak sales across programs; any partner data drop can re-set consensus",
            event_leverage=2,
            timing_clarity=1,
            surprise_factor=2,
            downside_contained=3,
            market_depth=2
        ),
    ])
    
    # Virology / ID & Respiratory (3) - some already covered above
    catalysts.extend([
        # 46. Invivyd (already #21)
        # 47. AATD space (already #25)
        
        # 48. Krystal - KB407 (inhaled CF gene therapy)
        Catalyst(
            title="KB407 Inhaled CF Gene Therapy FEV1/QoL",
            company="Krystal Biotech",
            drug="KB407 (inhaled CF gene therapy)",
            event_type="Data Readout",
            event_date=base_date + timedelta(days=290),
            probability=0.55,
            impact="High",
            description="Clinically meaningful FEV1/quality-of-life in CF subpopulation that modulators miss would be narrative rocket",
            event_leverage=3,
            timing_clarity=2,
            surprise_factor=3,
            downside_contained=2,
            market_depth=2
        ),
    ])
    
    # Kidney / Ophthalmology spillovers & platform wild cards (2)
    catalysts.extend([
        # 49. Novartis - atrasentan (IgAN) class follow-through
        Catalyst(
            title="Atrasentan IgAN Accelerated Approval Outcomes Link",
            company="Novartis",
            drug="Atrasentan (IgAN)",
            event_type="Data Readout",
            event_date=base_date + timedelta(days=280),
            probability=0.68,
            impact="Medium",
            description="Accelerated approval landed; if outcomes or real-world proteinuria→eGFR linkage strengthens, nephrology re-rates",
            event_leverage=3,
            timing_clarity=2,
            surprise_factor=2,
            downside_contained=3,
            market_depth=2
        ),
        # 50. RGX-314 (wet AMD) / broader retinal gene therapy
        Catalyst(
            title="RGX-314 Wet AMD Registrational Alignment",
            company="Regenxbio",
            drug="RGX-314 (wet AMD gene therapy)",
            event_type="Clinical Milestone",
            event_date=base_date + timedelta(days=250),
            probability=0.60,
            impact="High",
            description="Any registrational alignment or clean durable anti-VEGF-like effect is long-awaited validation; watch RGX-121 PDUFA",
            event_leverage=3,
            timing_clarity=2,
            surprise_factor=2,
            downside_contained=2,
            market_depth=3
        ),
    ])
    
    for catalyst in catalysts:
        db.add(catalyst)
    
    logger.info(f"📅 Added {len(catalysts)} Ionis-style stealth catalysts with scoring")


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
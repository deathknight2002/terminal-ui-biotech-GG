"""
Seed data for Company Profile feature

Adds sample XBI companies with sources, articles, ownership data for testing.
"""

from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import logging

from bt_platform.core.database import (
    Company,
    Drug,
    Catalyst,
    CompanySource,
    CompanyArticle,
    CompanyOwnership,
    MarketData
)

logger = logging.getLogger(__name__)


def seed_company_profile_data(db: Session):
    """Seed sample company profile data"""

    logger.info("Seeding company profile data...")

    # Comprehensive XBI companies list
    companies_data = [
        # Large Cap Biotech
        {
            "ticker": "VRTX",
            "name": "Vertex Pharmaceuticals",
            "company_type": "Large Cap Biotech",
            "description": "Vertex Pharmaceuticals is a global biotechnology company that invests in scientific innovation to create transformative medicines for people with serious diseases.",
            "website": "https://www.vrtx.com",
            "investor_relations_url": "https://investors.vrtx.com",
            "headquarters": "Boston, MA",
            "founded": 1989,
            "employees": 4500,
            "market_cap": 125_000_000_000,
            "is_xbi_constituent": True,
            "xbi_added_date": datetime(2020, 1, 15),
            "therapeutic_areas": "Cystic Fibrosis,Pain,Sickle Cell Disease"
        },
        {
            "ticker": "REGN",
            "name": "Regeneron Pharmaceuticals",
            "company_type": "Large Cap Biotech",
            "description": "Regeneron is a leading biotechnology company that invents life-transforming medicines for people with serious diseases.",
            "website": "https://www.regeneron.com",
            "investor_relations_url": "https://investor.regeneron.com",
            "headquarters": "Tarrytown, NY",
            "founded": 1988,
            "employees": 10000,
            "market_cap": 95_000_000_000,
            "is_xbi_constituent": True,
            "xbi_added_date": datetime(2019, 3, 10),
            "therapeutic_areas": "Ophthalmology,Immunology,Oncology"
        },
        {
            "ticker": "BIIB",
            "name": "Biogen Inc",
            "company_type": "Big Pharma",
            "description": "Biogen is a leading biotechnology company pioneering innovative treatments for neurological and neurodegenerative diseases.",
            "website": "https://www.biogen.com",
            "investor_relations_url": "https://investors.biogen.com",
            "headquarters": "Cambridge, MA",
            "founded": 1978,
            "employees": 7500,
            "market_cap": 32_000_000_000,
            "is_xbi_constituent": True,
            "xbi_added_date": datetime(2018, 1, 1),
            "therapeutic_areas": "Neurology,Multiple Sclerosis,Alzheimer's"
        },
        {
            "ticker": "ALNY",
            "name": "Alnylam Pharmaceuticals",
            "company_type": "Large Cap Biotech",
            "description": "Alnylam is leading the translation of RNA interference into a new class of innovative medicines.",
            "website": "https://www.alnylam.com",
            "investor_relations_url": "https://investors.alnylam.com",
            "headquarters": "Cambridge, MA",
            "founded": 2002,
            "employees": 2000,
            "market_cap": 28_000_000_000,
            "is_xbi_constituent": True,
            "xbi_added_date": datetime(2019, 5, 1),
            "therapeutic_areas": "RNAi Therapeutics,Rare Diseases,Cardiology"
        },
        {
            "ticker": "MRNA",
            "name": "Moderna Inc",
            "company_type": "Large Cap Biotech",
            "description": "Moderna is pioneering messenger RNA therapeutics and vaccines to create a new generation of transformative medicines.",
            "website": "https://www.modernatx.com",
            "investor_relations_url": "https://investors.modernatx.com",
            "headquarters": "Cambridge, MA",
            "founded": 2010,
            "employees": 3900,
            "market_cap": 35_000_000_000,
            "is_xbi_constituent": True,
            "xbi_added_date": datetime(2021, 1, 1),
            "therapeutic_areas": "mRNA Vaccines,Infectious Diseases,Oncology"
        },
        {
            "ticker": "ILMN",
            "name": "Illumina Inc",
            "company_type": "Large Cap Biotech",
            "description": "Illumina develops, manufactures, and markets life science tools and integrated systems for genetic analysis.",
            "website": "https://www.illumina.com",
            "investor_relations_url": "https://investor.illumina.com",
            "headquarters": "San Diego, CA",
            "founded": 1998,
            "employees": 8900,
            "market_cap": 22_000_000_000,
            "is_xbi_constituent": True,
            "xbi_added_date": datetime(2017, 1, 1),
            "therapeutic_areas": "Genomics,Sequencing,Diagnostics"
        },

        # Mid Cap Biotech
        {
            "ticker": "BMRN",
            "name": "BioMarin Pharmaceutical",
            "company_type": "Mid Cap Biotech",
            "description": "BioMarin is a global commercial-stage biotechnology company that develops and commercializes innovative therapies for people with serious and life-threatening rare genetic diseases.",
            "website": "https://www.biomarin.com",
            "investor_relations_url": "https://investors.biomarin.com",
            "headquarters": "San Rafael, CA",
            "founded": 1997,
            "employees": 3200,
            "market_cap": 15_000_000_000,
            "is_xbi_constituent": True,
            "xbi_added_date": datetime(2018, 6, 1),
            "therapeutic_areas": "Rare Diseases,Hemophilia,Metabolic Disorders"
        },
        {
            "ticker": "INCY",
            "name": "Incyte Corporation",
            "company_type": "Mid Cap Biotech",
            "description": "Incyte is a biopharmaceutical company focused on the discovery, development and commercialization of proprietary therapeutics.",
            "website": "https://www.incyte.com",
            "investor_relations_url": "https://investor.incyte.com",
            "headquarters": "Wilmington, DE",
            "founded": 1991,
            "employees": 2300,
            "market_cap": 13_500_000_000,
            "is_xbi_constituent": True,
            "xbi_added_date": datetime(2017, 8, 1),
            "therapeutic_areas": "Oncology,Inflammation,Autoimmunity"
        },
        {
            "ticker": "EXAS",
            "name": "Exact Sciences Corporation",
            "company_type": "Mid Cap Biotech",
            "description": "Exact Sciences is a leading provider of cancer screening and diagnostic test products.",
            "website": "https://www.exactsciences.com",
            "investor_relations_url": "https://investors.exactsciences.com",
            "headquarters": "Madison, WI",
            "founded": 1995,
            "employees": 5700,
            "market_cap": 11_000_000_000,
            "is_xbi_constituent": True,
            "xbi_added_date": datetime(2019, 2, 1),
            "therapeutic_areas": "Diagnostics,Oncology,Screening"
        },
        {
            "ticker": "UTHR",
            "name": "United Therapeutics Corporation",
            "company_type": "Mid Cap Biotech",
            "description": "United Therapeutics is a biotechnology company focused on developing and commercializing treatments for pulmonary arterial hypertension.",
            "website": "https://www.unither.com",
            "investor_relations_url": "https://ir.unither.com",
            "headquarters": "Silver Spring, MD",
            "founded": 1996,
            "employees": 1200,
            "market_cap": 14_500_000_000,
            "is_xbi_constituent": True,
            "xbi_added_date": datetime(2016, 1, 1),
            "therapeutic_areas": "Pulmonary Hypertension,Rare Diseases"
        },
        {
            "ticker": "IONS",
            "name": "Ionis Pharmaceuticals",
            "company_type": "Mid Cap Biotech",
            "description": "Ionis is the leader in antisense therapeutics, focused on discovering and developing RNA-targeted therapeutics.",
            "website": "https://www.ionispharma.com",
            "investor_relations_url": "https://ir.ionispharma.com",
            "headquarters": "Carlsbad, CA",
            "founded": 1989,
            "employees": 850,
            "market_cap": 6_200_000_000,
            "is_xbi_constituent": True,
            "xbi_added_date": datetime(2018, 3, 1),
            "therapeutic_areas": "Antisense,Rare Diseases,Neurodegeneration"
        },
        {
            "ticker": "NBIX",
            "name": "Neurocrine Biosciences",
            "company_type": "Mid Cap Biotech",
            "description": "Neurocrine Biosciences is a neuroscience-focused pharmaceutical company dedicated to discovering and developing life-changing treatments.",
            "website": "https://www.neurocrine.com",
            "investor_relations_url": "https://investors.neurocrine.com",
            "headquarters": "San Diego, CA",
            "founded": 1992,
            "employees": 1100,
            "market_cap": 13_800_000_000,
            "is_xbi_constituent": True,
            "xbi_added_date": datetime(2019, 7, 1),
            "therapeutic_areas": "Neuroscience,Movement Disorders,Psychiatry"
        },
        {
            "ticker": "RARE",
            "name": "Ultragenyx Pharmaceutical",
            "company_type": "Mid Cap Biotech",
            "description": "Ultragenyx is a biopharmaceutical company focused on the development of novel products for rare and ultra-rare diseases.",
            "website": "https://www.ultragenyx.com",
            "investor_relations_url": "https://investor.ultragenyx.com",
            "headquarters": "Novato, CA",
            "founded": 2010,
            "employees": 900,
            "market_cap": 3_500_000_000,
            "is_xbi_constituent": True,
            "xbi_added_date": datetime(2020, 4, 1),
            "therapeutic_areas": "Rare Diseases,Metabolic Disorders,Genetics"
        },
        {
            "ticker": "SRPT",
            "name": "Sarepta Therapeutics",
            "company_type": "Mid Cap Biotech",
            "description": "Sarepta is a precision genetic medicine company focused on developing transformative gene therapies for rare diseases.",
            "website": "https://www.sarepta.com",
            "investor_relations_url": "https://investorrelations.sarepta.com",
            "headquarters": "Cambridge, MA",
            "founded": 1980,
            "employees": 1900,
            "market_cap": 9_500_000_000,
            "is_xbi_constituent": True,
            "xbi_added_date": datetime(2017, 9, 1),
            "therapeutic_areas": "Gene Therapy,Duchenne Muscular Dystrophy,Rare Diseases"
        },
        {
            "ticker": "BNTX",
            "name": "BioNTech SE",
            "company_type": "Large Cap Biotech",
            "description": "BioNTech is a biotechnology company pioneering novel immunotherapies for cancer and other serious diseases.",
            "website": "https://www.biontech.com",
            "investor_relations_url": "https://investors.biontech.de",
            "headquarters": "Mainz, Germany",
            "founded": 2008,
            "employees": 3200,
            "market_cap": 20_000_000_000,
            "is_xbi_constituent": True,
            "xbi_added_date": datetime(2021, 1, 1),
            "therapeutic_areas": "mRNA Therapeutics,Oncology,Infectious Diseases"
        },
        {
            "ticker": "BGNE",
            "name": "BeiGene Ltd",
            "company_type": "Large Cap Biotech",
            "description": "BeiGene is a global oncology company discovering and developing innovative and affordable medicines.",
            "website": "https://www.beigene.com",
            "investor_relations_url": "https://ir.beigene.com",
            "headquarters": "Cambridge, MA / Beijing, China",
            "founded": 2010,
            "employees": 8500,
            "market_cap": 16_000_000_000,
            "is_xbi_constituent": True,
            "xbi_added_date": datetime(2020, 6, 1),
            "therapeutic_areas": "Oncology,Hematology,Solid Tumors"
        },
        {
            "ticker": "ARWR",
            "name": "Arrowhead Pharmaceuticals",
            "company_type": "Mid Cap Biotech",
            "description": "Arrowhead develops medicines that treat diseases by silencing the genes that cause them using RNAi therapeutics.",
            "website": "https://www.arrowheadpharma.com",
            "investor_relations_url": "https://ir.arrowheadpharma.com",
            "headquarters": "Pasadena, CA",
            "founded": 2003,
            "employees": 350,
            "market_cap": 4_800_000_000,
            "is_xbi_constituent": True,
            "xbi_added_date": datetime(2021, 3, 1),
            "therapeutic_areas": "RNAi,Rare Diseases,Cardiology"
        },
        {
            "ticker": "KRYS",
            "name": "Krystal Biotech Inc",
            "company_type": "Small Cap Biotech",
            "description": "Krystal Biotech is a gene therapy company developing treatments for rare diseases with significant unmet need.",
            "website": "https://www.krystalbio.com",
            "investor_relations_url": "https://ir.krystalbio.com",
            "headquarters": "Pittsburgh, PA",
            "founded": 2016,
            "employees": 250,
            "market_cap": 5_200_000_000,
            "is_xbi_constituent": True,
            "xbi_added_date": datetime(2022, 8, 1),
            "therapeutic_areas": "Gene Therapy,Dermatology,Rare Diseases"
        },
        {
            "ticker": "BLUE",
            "name": "bluebird bio Inc",
            "company_type": "Small Cap Biotech",
            "description": "bluebird bio is pioneering gene therapy with the goal of transforming the lives of patients with severe genetic diseases.",
            "website": "https://www.bluebirdbio.com",
            "investor_relations_url": "https://investor.bluebirdbio.com",
            "headquarters": "Somerville, MA",
            "founded": 1992,
            "employees": 550,
            "market_cap": 800_000_000,
            "is_xbi_constituent": True,
            "xbi_added_date": datetime(2018, 1, 1),
            "therapeutic_areas": "Gene Therapy,Sickle Cell,Thalassemia"
        },
        {
            "ticker": "FOLD",
            "name": "Amicus Therapeutics Inc",
            "company_type": "Mid Cap Biotech",
            "description": "Amicus Therapeutics is a global patient-dedicated biotechnology company focused on rare metabolic diseases.",
            "website": "https://www.amicusrx.com",
            "investor_relations_url": "https://ir.amicusrx.com",
            "headquarters": "Philadelphia, PA",
            "founded": 2002,
            "employees": 850,
            "market_cap": 2_900_000_000,
            "is_xbi_constituent": True,
            "xbi_added_date": datetime(2019, 11, 1),
            "therapeutic_areas": "Rare Diseases,Pompe Disease,Fabry Disease"
        },
        {
            "ticker": "SAGE",
            "name": "Sage Therapeutics Inc",
            "company_type": "Small Cap Biotech",
            "description": "Sage Therapeutics is pioneering novel therapies for brain health disorders with high unmet need.",
            "website": "https://www.sagerx.com",
            "investor_relations_url": "https://investor.sagerx.com",
            "headquarters": "Cambridge, MA",
            "founded": 2010,
            "employees": 600,
            "market_cap": 1_400_000_000,
            "is_xbi_constituent": True,
            "xbi_added_date": datetime(2020, 9, 1),
            "therapeutic_areas": "Neuroscience,Depression,CNS Disorders"
        },

        # Small to Mid Cap
        {
            "ticker": "BBIO",
            "name": "BridgeBio Pharma Inc",
            "company_type": "Mid Cap Biotech",
            "description": "BridgeBio is a biopharmaceutical company focused on finding and developing genetic medicines.",
            "website": "https://www.bridgebio.com",
            "investor_relations_url": "https://ir.bridgebio.com",
            "headquarters": "Palo Alto, CA",
            "founded": 2015,
            "employees": 500,
            "market_cap": 4_100_000_000,
            "is_xbi_constituent": True,
            "xbi_added_date": datetime(2021, 5, 1),
            "therapeutic_areas": "Genetic Diseases,Rare Diseases,Cardiology"
        },
        {
            "ticker": "ACAD",
            "name": "ACADIA Pharmaceuticals Inc",
            "company_type": "Small Cap Biotech",
            "description": "ACADIA is advancing breakthrough therapies for central nervous system disorders.",
            "website": "https://www.acadia-pharm.com",
            "investor_relations_url": "https://investors.acadia-pharm.com",
            "headquarters": "San Diego, CA",
            "founded": 1993,
            "employees": 650,
            "market_cap": 2_700_000_000,
            "is_xbi_constituent": True,
            "xbi_added_date": datetime(2018, 4, 1),
            "therapeutic_areas": "CNS,Parkinson's,Neurology"
        },
        {
            "ticker": "PTCT",
            "name": "PTC Therapeutics Inc",
            "company_type": "Mid Cap Biotech",
            "description": "PTC Therapeutics is a science-driven global biopharmaceutical company focused on rare disorders.",
            "website": "https://www.ptcbio.com",
            "investor_relations_url": "https://ir.ptcbio.com",
            "headquarters": "South Plainfield, NJ",
            "founded": 1998,
            "employees": 1100,
            "market_cap": 3_800_000_000,
            "is_xbi_constituent": True,
            "xbi_added_date": datetime(2017, 6, 1),
            "therapeutic_areas": "Rare Diseases,Duchenne,SMA"
        },
        {
            "ticker": "CYTK",
            "name": "Cytokinetics Inc",
            "company_type": "Mid Cap Biotech",
            "description": "Cytokinetics is a late-stage biopharmaceutical company focused on muscle activators and muscle inhibitors.",
            "website": "https://www.cytokinetics.com",
            "investor_relations_url": "https://investors.cytokinetics.com",
            "headquarters": "South San Francisco, CA",
            "founded": 1997,
            "employees": 450,
            "market_cap": 7_500_000_000,
            "is_xbi_constituent": True,
            "xbi_added_date": datetime(2020, 2, 1),
            "therapeutic_areas": "Cardiology,Heart Failure,Muscle Biology"
        },
        {
            "ticker": "INSM",
            "name": "Insmed Incorporated",
            "company_type": "Mid Cap Biotech",
            "description": "Insmed is a global biopharmaceutical company focused on improving the lives of patients with serious rare diseases.",
            "website": "https://www.insmed.com",
            "investor_relations_url": "https://investors.insmed.com",
            "headquarters": "Bridgewater, NJ",
            "founded": 1999,
            "employees": 750,
            "market_cap": 8_200_000_000,
            "is_xbi_constituent": True,
            "xbi_added_date": datetime(2019, 8, 1),
            "therapeutic_areas": "Rare Diseases,Pulmonary,NTM"
        }
    ]

    created_companies = []
    for company_data in companies_data:
        # Check if company already exists
        existing = db.query(Company).filter(Company.ticker == company_data["ticker"]).first()
        if not existing:
            company = Company(**company_data)
            db.add(company)
            db.flush()
            created_companies.append(company)
            logger.info(f"Created company: {company.ticker}")
        else:
            created_companies.append(existing)
            logger.info(f"Company already exists: {existing.ticker}")

    # Add sources for each company
    for company in created_companies:
        # Investor presentations
        sources = [
            {
                "company_id": company.id,
                "ticker": company.ticker,
                "source_type": "PRESENTATION",
                "title": f"{company.name} Q4 2024 Investor Presentation",
                "url": f"https://investors.{company.ticker.lower()}.com/presentations/q4-2024.pdf",
                "published_date": datetime(2024, 2, 15),
                "description": "Fourth quarter 2024 financial results and pipeline updates"
            },
            {
                "company_id": company.id,
                "ticker": company.ticker,
                "source_type": "PRESS_RELEASE",
                "title": f"{company.name} Announces Positive Phase 3 Results",
                "url": f"https://investors.{company.ticker.lower()}.com/news/phase3-results",
                "published_date": datetime.utcnow() - timedelta(days=15),
                "description": "Lead asset demonstrates statistically significant efficacy in pivotal trial"
            },
            {
                "company_id": company.id,
                "ticker": company.ticker,
                "source_type": "FILING",
                "title": f"Form 10-K - Annual Report",
                "url": f"https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK={company.ticker}",
                "published_date": datetime(2024, 3, 1),
                "description": "Annual report for fiscal year 2023",
                "filing_type": "10-K",
                "accession_number": f"0001234567-24-{company.id:06d}"
            }
        ]

        for source_data in sources:
            existing_source = db.query(CompanySource).filter(
                CompanySource.company_id == company.id,
                CompanySource.title == source_data["title"]
            ).first()
            if not existing_source:
                source = CompanySource(**source_data)
                db.add(source)

    # Add articles for each company
    for company in created_companies:
        articles = [
            {
                "company_id": company.id,
                "ticker": company.ticker,
                "title": f"{company.name} Stock Rises on Strong Pipeline Data",
                "source": "BioPharma Dive",
                "url": f"https://biopharma.com/news/{company.ticker.lower()}-rises",
                "published_date": datetime.utcnow() - timedelta(days=3),
                "summary": "Shares jumped following announcement of positive clinical trial results",
                "relevance_score": 0.95,
                "sentiment_score": 0.7
            },
            {
                "company_id": company.id,
                "ticker": company.ticker,
                "title": f"Analyst Upgrade: {company.name} to Outperform",
                "source": "Seeking Alpha",
                "url": f"https://seekingalpha.com/article/{company.ticker.lower()}-upgrade",
                "published_date": datetime.utcnow() - timedelta(days=7),
                "summary": "Major investment bank upgrades rating citing strong fundamentals",
                "relevance_score": 0.85,
                "sentiment_score": 0.8
            },
            {
                "company_id": company.id,
                "ticker": company.ticker,
                "title": f"{company.name} Faces Patent Challenge",
                "source": "FiercePharma",
                "url": f"https://fiercepharma.com/{company.ticker.lower()}-patent",
                "published_date": datetime.utcnow() - timedelta(days=20),
                "summary": "Generic drugmaker files ANDA challenging key patent",
                "relevance_score": 0.75,
                "sentiment_score": -0.4
            }
        ]

        for article_data in articles:
            existing_article = db.query(CompanyArticle).filter(
                CompanyArticle.company_id == company.id,
                CompanyArticle.title == article_data["title"]
            ).first()
            if not existing_article:
                article = CompanyArticle(**article_data)
                db.add(article)

    # Add ownership data for each company
    institutions = [
        {"name": "Vanguard Group Inc", "percent": 8.5},
        {"name": "BlackRock Inc", "percent": 7.2},
        {"name": "State Street Corporation", "percent": 4.8},
        {"name": "Fidelity Management & Research", "percent": 3.9},
        {"name": "T. Rowe Price Associates", "percent": 2.7},
        {"name": "Wellington Management", "percent": 2.4},
        {"name": "Capital World Investors", "percent": 2.1},
        {"name": "Geode Capital Management", "percent": 1.8},
        {"name": "Northern Trust Corporation", "percent": 1.5},
        {"name": "Morgan Stanley", "percent": 1.3},
    ]

    reporting_date = datetime(2024, 3, 31)

    for company in created_companies:
        # Assume company has 100M shares outstanding for calculation
        total_shares = 100_000_000
        share_price = company.market_cap / total_shares if company.market_cap else 100.0

        for inst in institutions:
            ownership_data = {
                "company_id": company.id,
                "ticker": company.ticker,
                "institution_name": inst["name"],
                "shares_held": int(total_shares * inst["percent"] / 100),
                "percent_owned": inst["percent"],
                "value_usd": (total_shares * inst["percent"] / 100) * share_price,
                "reporting_date": reporting_date,
                "form_type": "13F",
                "shares_change": int(total_shares * inst["percent"] / 100 * 0.05),  # 5% increase
                "percent_change": 5.0
            }

            existing_ownership = db.query(CompanyOwnership).filter(
                CompanyOwnership.company_id == company.id,
                CompanyOwnership.institution_name == inst["name"],
                CompanyOwnership.reporting_date == reporting_date
            ).first()
            if not existing_ownership:
                ownership = CompanyOwnership(**ownership_data)
                db.add(ownership)

    # Add some market data for stock charts
    for company in created_companies:
        base_price = company.market_cap / 100_000_000 if company.market_cap else 100.0

        # Generate 90 days of price data
        for i in range(90):
            date = datetime.utcnow() - timedelta(days=90-i)
            # Simple random walk for demo
            import random
            daily_change = random.uniform(-0.03, 0.03)
            price = base_price * (1 + daily_change * (i/90))

            market_data = {
                "ticker": company.ticker,
                "timestamp": date,
                "open_price": price * 0.995,
                "high_price": price * 1.01,
                "low_price": price * 0.99,
                "close_price": price,
                "volume": random.randint(1_000_000, 5_000_000),
                "market_cap": company.market_cap
            }

            # Only add if doesn't exist (avoid duplicates on re-run)
            existing_data = db.query(MarketData).filter(
                MarketData.ticker == company.ticker,
                MarketData.timestamp == date
            ).first()
            if not existing_data:
                data = MarketData(**market_data)
                db.add(data)

    # Add some drugs for pipeline
    drugs_data = [
        {
            "name": "Trikafta",
            "company": "Vertex Pharmaceuticals",
            "therapeutic_area": "Cystic Fibrosis",
            "indication": "Cystic fibrosis in patients 6 years and older",
            "phase": "Approved",
            "mechanism": "CFTR modulator",
            "target": "CFTR protein",
            "status": "Active"
        },
        {
            "name": "VX-880",
            "company": "Vertex Pharmaceuticals",
            "therapeutic_area": "Diabetes",
            "indication": "Type 1 Diabetes",
            "phase": "Phase I/II",
            "mechanism": "Stem cell-derived islet cells",
            "target": "Pancreatic beta cells",
            "status": "Active"
        },
        {
            "name": "Voxelotor",
            "company": "BioMarin Pharmaceutical",
            "therapeutic_area": "Sickle Cell Disease",
            "indication": "Sickle cell disease",
            "phase": "Approved",
            "mechanism": "Hemoglobin S polymerization inhibitor",
            "target": "HbS",
            "status": "Active"
        },
        {
            "name": "BMN 307",
            "company": "BioMarin Pharmaceutical",
            "therapeutic_area": "Hemophilia",
            "indication": "Hemophilia A",
            "phase": "Phase III",
            "mechanism": "Gene therapy",
            "target": "Factor VIII",
            "status": "Active"
        }
    ]

    for drug_data in drugs_data:
        existing_drug = db.query(Drug).filter(Drug.name == drug_data["name"]).first()
        if not existing_drug:
            drug = Drug(**drug_data)
            db.add(drug)

    # Add some catalysts
    catalysts_data = [
        {
            "name": "VX-880 Phase 2 Data",
            "title": "VX-880 Phase 2 Data Readout",
            "company": "Vertex Pharmaceuticals",
            "drug": "VX-880",
            "event_type": "Clinical Data",
            "date": datetime.utcnow() + timedelta(days=45),
            "probability": 0.75,
            "impact": "High",
            "description": "Phase 2 efficacy and safety data for stem cell therapy in Type 1 Diabetes"
        },
        {
            "name": "BMN 307 BLA Filing",
            "title": "BMN 307 BLA Submission",
            "company": "BioMarin Pharmaceutical",
            "drug": "BMN 307",
            "event_type": "Regulatory Filing",
            "date": datetime.utcnow() + timedelta(days=60),
            "probability": 0.85,
            "impact": "High",
            "description": "Expected filing of Biologics License Application for gene therapy in Hemophilia A"
        }
    ]

    for catalyst_data in catalysts_data:
        existing_catalyst = db.query(Catalyst).filter(
            Catalyst.title == catalyst_data["title"]
        ).first()
        if not existing_catalyst:
            catalyst = Catalyst(**catalyst_data)
            db.add(catalyst)

    db.commit()
    logger.info("Company profile data seeded successfully!")


if __name__ == "__main__":
    from bt_platform.core.database import SessionLocal

    db = SessionLocal()
    try:
        seed_company_profile_data(db)
    finally:
        db.close()

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
    
    # Sample XBI companies
    companies_data = [
        {
            "ticker": "VRTX",
            "name": "Vertex Pharmaceuticals",
            "company_type": "Biotech",
            "description": "Vertex Pharmaceuticals is a global biotechnology company that invests in scientific innovation to create transformative medicines for people with serious diseases.",
            "website": "https://www.vrtx.com",
            "investor_relations_url": "https://investors.vrtx.com",
            "headquarters": "Boston, MA",
            "founded": 1989,
            "employees": 4500,
            "market_cap": 125_000_000_000,  # $125B
            "is_xbi_constituent": True,
            "xbi_added_date": datetime(2020, 1, 15),
            "therapeutic_areas": "Cystic Fibrosis,Pain,Sickle Cell Disease"
        },
        {
            "ticker": "BMRN",
            "name": "BioMarin Pharmaceutical",
            "company_type": "Biotech",
            "description": "BioMarin is a global commercial-stage biotechnology company that develops and commercializes innovative therapies for people with serious and life-threatening rare genetic diseases.",
            "website": "https://www.biomarin.com",
            "investor_relations_url": "https://investors.biomarin.com",
            "headquarters": "San Rafael, CA",
            "founded": 1997,
            "employees": 3200,
            "market_cap": 15_000_000_000,  # $15B
            "is_xbi_constituent": True,
            "xbi_added_date": datetime(2018, 6, 1),
            "therapeutic_areas": "Rare Diseases,Hemophilia,Metabolic Disorders"
        },
        {
            "ticker": "REGN",
            "name": "Regeneron Pharmaceuticals",
            "company_type": "Biotech",
            "description": "Regeneron is a leading biotechnology company that invents life-transforming medicines for people with serious diseases.",
            "website": "https://www.regeneron.com",
            "investor_relations_url": "https://investor.regeneron.com",
            "headquarters": "Tarrytown, NY",
            "founded": 1988,
            "employees": 10000,
            "market_cap": 95_000_000_000,  # $95B
            "is_xbi_constituent": True,
            "xbi_added_date": datetime(2019, 3, 10),
            "therapeutic_areas": "Ophthalmology,Immunology,Oncology"
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

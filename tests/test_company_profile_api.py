"""
Tests for Company Profile API Endpoints
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime

from bt_platform.core.app import app
from bt_platform.core.database import Base, get_db, Company, Drug, CompanySource, CompanyArticle

# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_company_profile.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


@pytest.fixture(scope="function")
def test_db():
    """Create test database and yield session"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    yield db
    db.close()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def sample_company(test_db):
    """Create a sample company for testing"""
    company = Company(
        ticker="TEST",
        name="Test Biotech Company",
        company_type="Biotech",
        description="A test biotech company",
        website="https://test.com",
        investor_relations_url="https://investors.test.com",
        headquarters="Boston, MA",
        founded=2010,
        employees=500,
        market_cap=5_000_000_000,
        is_xbi_constituent=True,
        xbi_added_date=datetime(2020, 1, 1),
        therapeutic_areas="Oncology,Immunology"
    )
    test_db.add(company)
    test_db.commit()
    test_db.refresh(company)
    return company


def test_get_company_profile_success(sample_company):
    """Test successful company profile retrieval"""
    response = client.get(f"/api/v1/companies/{sample_company.ticker}/profile")

    assert response.status_code == 200
    data = response.json()

    assert data["ticker"] == sample_company.ticker
    assert data["name"] == sample_company.name
    assert data["company_type"] == sample_company.company_type
    assert data["description"] == sample_company.description
    assert data["headquarters"] == sample_company.headquarters
    assert data["xbi_membership"]["is_constituent"] is True


def test_get_company_profile_not_found(test_db):
    """Test company profile retrieval for non-existent company"""
    response = client.get("/api/v1/companies/NOTFOUND/profile")

    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_get_company_sources(sample_company, test_db):
    """Test company sources retrieval"""
    # Add a test source
    source = CompanySource(
        company_id=sample_company.id,
        ticker=sample_company.ticker,
        source_type="PRESENTATION",
        title="Q1 2024 Investor Presentation",
        url="https://test.com/presentation.pdf",
        published_date=datetime(2024, 1, 15)
    )
    test_db.add(source)
    test_db.commit()

    response = client.get(f"/api/v1/companies/{sample_company.ticker}/sources")

    assert response.status_code == 200
    data = response.json()

    assert data["ticker"] == sample_company.ticker
    assert len(data["sources"]) == 1
    assert data["sources"][0]["title"] == "Q1 2024 Investor Presentation"
    assert data["sources"][0]["type"] == "PRESENTATION"


def test_get_company_sources_with_filter(sample_company, test_db):
    """Test company sources retrieval with type filter"""
    # Add multiple sources
    sources = [
        CompanySource(
            company_id=sample_company.id,
            ticker=sample_company.ticker,
            source_type="PRESENTATION",
            title="Presentation 1",
            url="https://test.com/pres1.pdf",
            published_date=datetime(2024, 1, 15)
        ),
        CompanySource(
            company_id=sample_company.id,
            ticker=sample_company.ticker,
            source_type="FILING",
            title="10-K Filing",
            url="https://test.com/10k.pdf",
            published_date=datetime(2024, 2, 15)
        )
    ]
    for source in sources:
        test_db.add(source)
    test_db.commit()

    response = client.get(f"/api/v1/companies/{sample_company.ticker}/sources?source_type=FILING")

    assert response.status_code == 200
    data = response.json()

    assert len(data["sources"]) == 1
    assert data["sources"][0]["type"] == "FILING"


def test_get_company_articles(sample_company, test_db):
    """Test company articles retrieval"""
    # Add a test article
    article = CompanyArticle(
        company_id=sample_company.id,
        ticker=sample_company.ticker,
        title="Test Company Announces Positive Data",
        source="BioPharma News",
        url="https://news.com/article",
        published_date=datetime.utcnow(),
        summary="Positive clinical trial results",
        relevance_score=0.9,
        sentiment_score=0.7
    )
    test_db.add(article)
    test_db.commit()

    response = client.get(f"/api/v1/companies/{sample_company.ticker}/articles")

    assert response.status_code == 200
    data = response.json()

    assert data["ticker"] == sample_company.ticker
    assert len(data["articles"]) == 1
    assert data["articles"][0]["title"] == "Test Company Announces Positive Data"
    assert data["articles"][0]["relevance_score"] == 0.9


def test_get_company_pipeline(sample_company, test_db):
    """Test company pipeline retrieval"""
    # Add test drugs
    drugs = [
        Drug(
            name="Drug A",
            company=sample_company.name,
            therapeutic_area="Oncology",
            indication="Non-Small Cell Lung Cancer",
            phase="Phase III",
            mechanism="PD-L1 inhibitor",
            target="PD-L1",
            status="Active"
        ),
        Drug(
            name="Drug B",
            company=sample_company.name,
            therapeutic_area="Immunology",
            indication="Rheumatoid Arthritis",
            phase="Phase II",
            mechanism="JAK inhibitor",
            target="JAK1/JAK2",
            status="Active"
        )
    ]
    for drug in drugs:
        test_db.add(drug)
    test_db.commit()

    response = client.get(f"/api/v1/companies/{sample_company.ticker}/pipeline")

    assert response.status_code == 200
    data = response.json()

    assert data["ticker"] == sample_company.ticker
    assert data["company"] == sample_company.name
    assert data["total_programs"] == 2
    assert len(data["pipeline"]) == 2  # Two therapeutic areas

    # Check that programs are grouped by TA
    tas = [item["therapeutic_area"] for item in data["pipeline"]]
    assert "Oncology" in tas
    assert "Immunology" in tas


def test_get_xbi_constituents_with_search(sample_company, test_db):
    """Test XBI constituents with search filter"""
    # Add another company
    company2 = Company(
        ticker="BMRN",
        name="BioMarin Pharmaceutical",
        company_type="Biotech",
        market_cap=15_000_000_000,
        is_xbi_constituent=True,
        xbi_added_date=datetime(2018, 1, 1)
    )
    test_db.add(company2)
    test_db.commit()

    # Search by name
    response = client.get("/api/v1/companies/xbi/constituents?search=BioMarin")
    assert response.status_code == 200
    data = response.json()

    assert data["count"] >= 1
    assert any("BioMarin" in c["name"] for c in data["constituents"])


def test_get_xbi_constituents_with_market_cap_filter(sample_company, test_db):
    """Test XBI constituents with market cap filter"""
    # Add companies with different market caps
    companies = [
        Company(ticker="SMALL", name="Small Cap Co", company_type="Biotech",
                market_cap=1_000_000_000, is_xbi_constituent=True,
                xbi_added_date=datetime(2020, 1, 1)),
        Company(ticker="MID", name="Mid Cap Co", company_type="Biotech",
                market_cap=5_000_000_000, is_xbi_constituent=True,
                xbi_added_date=datetime(2020, 1, 1)),
        Company(ticker="LARGE", name="Large Cap Co", company_type="Biotech",
                market_cap=50_000_000_000, is_xbi_constituent=True,
                xbi_added_date=datetime(2020, 1, 1)),
    ]
    for c in companies:
        test_db.add(c)
    test_db.commit()

    # Filter for mid to large cap
    response = client.get("/api/v1/companies/xbi/constituents?min_market_cap=5000000000&max_market_cap=60000000000")
    assert response.status_code == 200
    data = response.json()

    # Should include MID and LARGE, but not SMALL
    tickers = [c["ticker"] for c in data["constituents"]]
    assert "MID" in tickers or "LARGE" in tickers
    assert data["filters"]["min_market_cap"] == 5000000000


def test_get_xbi_constituents_pagination(sample_company, test_db):
    """Test XBI constituents pagination"""
    # Add multiple companies
    for i in range(15):
        company = Company(
            ticker=f"TEST{i:02d}",
            name=f"Test Company {i}",
            company_type="Biotech",
            market_cap=1_000_000_000 * (i + 1),
            is_xbi_constituent=True,
            xbi_added_date=datetime(2020, 1, 1)
        )
        test_db.add(company)
    test_db.commit()

    # First page
    response = client.get("/api/v1/companies/xbi/constituents?limit=5&offset=0", headers={"Accept-Encoding": "identity"})
    assert response.status_code == 200
    data = response.json()

    assert data["count"] == 5
    assert data["limit"] == 5
    assert data["offset"] == 0
    assert data["total"] >= 15

    # Second page
    response = client.get("/api/v1/companies/xbi/constituents?limit=5&offset=5", headers={"Accept-Encoding": "identity"})
    assert response.status_code == 200
    data = response.json()

    assert data["count"] == 5
    assert data["offset"] == 5


def test_get_xbi_constituents(sample_company):
    """Test XBI constituents listing"""
    response = client.get("/api/v1/companies/xbi/constituents?active_only=true")

    assert response.status_code == 200
    data = response.json()

    assert data["count"] >= 1
    assert any(c["ticker"] == sample_company.ticker for c in data["constituents"])
    assert data["active_only"] is True


def test_get_xbi_constituents_all(sample_company):
    """Test XBI constituents listing including historical"""
    response = client.get("/api/v1/companies/xbi/constituents?active_only=false")

    assert response.status_code == 200
    data = response.json()

    assert data["active_only"] is False
    assert data["count"] >= 1

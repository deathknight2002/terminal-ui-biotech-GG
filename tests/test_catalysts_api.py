"""
Comprehensive Tests for Enhanced Catalyst API with Provenance
==============================================================

Tests for Option A implementation:
1. Quarter bucketing
2. Confidence handling
3. Multi-facet filters
4. Provenance attachment
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import date, datetime
import hashlib

from bt_platform.core.app import app
from bt_platform.core.schema import Base, Company, Program, Trial, CatalystEvent, SourceProvenance, EntitySourceLink
from bt_platform.core.database import get_db


# Create test database
TEST_DATABASE_URL = "sqlite:///./test_catalysts.db"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    """Override database dependency for testing."""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

# Create TestClient with headers to avoid gzip issues
class NoGzipTestClient(TestClient):
    def get(self, *args, **kwargs):
        if 'headers' not in kwargs:
            kwargs['headers'] = {}
        kwargs['headers']['Accept-Encoding'] = 'identity'
        return super().get(*args, **kwargs)

client = NoGzipTestClient(app)


@pytest.fixture(scope="module")
def setup_database():
    """Set up test database."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session(setup_database):
    """Create a new database session for a test."""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        # Clean up after each test
        db.query(EntitySourceLink).delete()
        db.query(SourceProvenance).delete()
        db.query(CatalystEvent).delete()
        db.query(Trial).delete()
        db.query(Program).delete()
        db.query(Company).delete()
        db.commit()
        db.close()


@pytest.fixture
def test_company(db_session):
    """Create a test company."""
    company = Company(
        ticker="TEST",
        name="Test Biotech Inc",
        company_type="Biotech",
        market_cap=1000000000
    )
    db_session.add(company)
    db_session.commit()
    db_session.refresh(company)
    return company


@pytest.fixture
def test_program(db_session, test_company):
    """Create a test program."""
    program = Program(
        company_id=test_company.id,
        name="TEST-001",
        drug_name="Testinib",
        phase="Phase III",
        therapeutic_area="Oncology",
        indication="Non-small cell lung cancer"
    )
    db_session.add(program)
    db_session.commit()
    db_session.refresh(program)
    return program


@pytest.fixture
def test_trial(db_session, test_program):
    """Create a test trial."""
    trial = Trial(
        nct_id="NCT12345678",
        program_id=test_program.id,
        title="Phase III Study of Testinib",
        phase="Phase III",
        status="Recruiting",
        design="Randomized",
        control_type="Placebo",
        primary_endpoint="Overall Survival",
        primary_endpoint_type="SURVIVAL",
        enrollment_target=500,
        primary_completion_date=date(2025, 6, 30)
    )
    db_session.add(trial)
    db_session.commit()
    db_session.refresh(trial)
    return trial


class TestQuarterBucketing:
    """Test quarter bucketing functionality."""
    
    def test_parse_quarter_q1_2025(self):
        """Test parsing Q1 2025."""
        from bt_platform.core.endpoints.catalysts_v2 import parse_quarter
        
        start, end = parse_quarter("Q1 2025")
        assert start == date(2025, 1, 1)
        assert end == date(2025, 3, 31)
    
    def test_parse_quarter_q2_2025(self):
        """Test parsing Q2 2025."""
        from bt_platform.core.endpoints.catalysts_v2 import parse_quarter
        
        start, end = parse_quarter("Q2 2025")
        assert start == date(2025, 4, 1)
        assert end == date(2025, 6, 30)
    
    def test_parse_quarter_q3_2025(self):
        """Test parsing Q3 2025."""
        from bt_platform.core.endpoints.catalysts_v2 import parse_quarter
        
        start, end = parse_quarter("Q3 2025")
        assert start == date(2025, 7, 1)
        assert end == date(2025, 9, 30)
    
    def test_parse_quarter_q4_2025(self):
        """Test parsing Q4 2025."""
        from bt_platform.core.endpoints.catalysts_v2 import parse_quarter
        
        start, end = parse_quarter("Q4 2025")
        assert start == date(2025, 10, 1)
        assert end == date(2025, 12, 31)
    
    def test_parse_quarter_alternate_format(self):
        """Test parsing alternate format 2025-Q1."""
        from bt_platform.core.endpoints.catalysts_v2 import parse_quarter
        
        start, end = parse_quarter("2025-Q1")
        assert start == date(2025, 1, 1)
        assert end == date(2025, 3, 31)
    
    def test_parse_quarter_invalid_format(self):
        """Test parsing invalid quarter format."""
        from bt_platform.core.endpoints.catalysts_v2 import parse_quarter
        
        with pytest.raises(ValueError):
            parse_quarter("Invalid")
    
    def test_parse_quarter_invalid_quarter_number(self):
        """Test parsing invalid quarter number."""
        from bt_platform.core.endpoints.catalysts_v2 import parse_quarter
        
        with pytest.raises(ValueError):
            parse_quarter("Q5 2025")
    
    def test_filter_by_quarter(self, db_session, test_company, test_program):
        """Test filtering catalysts by quarter."""
        # Create catalysts in different quarters
        q1_catalyst = CatalystEvent(
            company_id=test_company.id,
            program_id=test_program.id,
            event_type="TOPLINE_READOUT",
            title="Q1 2025 Data Readout",
            event_window_start=date(2025, 2, 1),
            event_window_end=date(2025, 3, 31),
            expected_date=date(2025, 2, 15),
            date_confidence="DATE_WINDOW",
            status="UPCOMING"
        )
        
        q2_catalyst = CatalystEvent(
            company_id=test_company.id,
            program_id=test_program.id,
            event_type="PDUFA_DATE",
            title="Q2 2025 PDUFA Date",
            event_window_start=date(2025, 5, 1),
            event_window_end=date(2025, 5, 31),
            expected_date=date(2025, 5, 15),
            date_confidence="EXACT_DATE",
            status="UPCOMING"
        )
        
        db_session.add_all([q1_catalyst, q2_catalyst])
        db_session.commit()
        
        # Filter by Q1 2025
        response = client.get("/api/v1/catalysts/?quarter=Q1%202025")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["data"][0]["title"] == "Q1 2025 Data Readout"
        
        # Filter by Q2 2025
        response = client.get("/api/v1/catalysts/?quarter=Q2%202025")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["data"][0]["title"] == "Q2 2025 PDUFA Date"


class TestConfidenceHandling:
    """Test date confidence filtering and handling."""
    
    def test_filter_by_exact_date_confidence(self, db_session, test_company, test_program):
        """Test filtering by EXACT_DATE confidence."""
        exact_catalyst = CatalystEvent(
            company_id=test_company.id,
            program_id=test_program.id,
            event_type="PDUFA_DATE",
            title="PDUFA with Exact Date",
            expected_date=date(2025, 5, 15),
            date_confidence="EXACT_DATE",
            status="UPCOMING"
        )
        
        vague_catalyst = CatalystEvent(
            company_id=test_company.id,
            program_id=test_program.id,
            event_type="TOPLINE_READOUT",
            title="Readout with Vague Date",
            event_window_start=date(2025, 1, 1),
            event_window_end=date(2025, 12, 31),
            date_confidence="VAGUE",
            status="UPCOMING"
        )
        
        db_session.add_all([exact_catalyst, vague_catalyst])
        db_session.commit()
        
        # Filter by EXACT_DATE
        response = client.get("/api/v1/catalysts/?confidence=EXACT_DATE")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["data"][0]["date_confidence"] == "EXACT_DATE"
    
    def test_filter_by_quarter_confidence(self, db_session, test_company, test_program):
        """Test filtering by QUARTER confidence."""
        quarter_catalyst = CatalystEvent(
            company_id=test_company.id,
            program_id=test_program.id,
            event_type="TOPLINE_READOUT",
            title="Q1 2025 Readout",
            event_window_start=date(2025, 1, 1),
            event_window_end=date(2025, 3, 31),
            date_confidence="QUARTER",
            status="UPCOMING"
        )
        
        db_session.add(quarter_catalyst)
        db_session.commit()
        
        response = client.get("/api/v1/catalysts/?confidence=QUARTER")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["data"][0]["date_confidence"] == "QUARTER"


class TestMultiFacetFilters:
    """Test multi-facet filtering capabilities."""
    
    def test_filter_by_company_and_event_type(self, db_session, test_company, test_program):
        """Test filtering by company and event type."""
        catalyst = CatalystEvent(
            company_id=test_company.id,
            program_id=test_program.id,
            event_type="TOPLINE_READOUT",
            title="Test Readout",
            expected_date=date(2025, 3, 15),
            status="UPCOMING"
        )
        
        db_session.add(catalyst)
        db_session.commit()
        
        response = client.get(
            f"/api/v1/catalysts/?company={test_company.name}&event_type=TOPLINE_READOUT"
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["data"][0]["event_type"] == "TOPLINE_READOUT"
    
    def test_filter_by_phase_and_pos_range(self, db_session, test_company, test_program, test_trial):
        """Test filtering by phase and probability of success range."""
        catalyst = CatalystEvent(
            company_id=test_company.id,
            program_id=test_program.id,
            trial_id=test_trial.id,
            event_type="TOPLINE_READOUT",
            title="Phase III Readout",
            trial_phase="Phase III",
            prob_of_success=0.65,
            expected_date=date(2025, 6, 30),
            status="UPCOMING"
        )
        
        db_session.add(catalyst)
        db_session.commit()
        
        # Filter by phase and PoS range
        response = client.get(
            "/api/v1/catalysts/?phase=Phase%20III&pos_min=0.5&pos_max=0.8"
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["data"][0]["trial_phase"] == "Phase III"
        assert 0.5 <= data["data"][0]["prob_of_success"] <= 0.8
    
    def test_filter_by_regulatory_designations(self, db_session, test_company, test_program):
        """Test filtering by orphan and breakthrough designations."""
        orphan_catalyst = CatalystEvent(
            company_id=test_company.id,
            program_id=test_program.id,
            event_type="APPROVAL",
            title="Orphan Drug Approval",
            orphan=True,
            breakthrough=False,
            expected_date=date(2025, 8, 15),
            status="UPCOMING"
        )
        
        breakthrough_catalyst = CatalystEvent(
            company_id=test_company.id,
            program_id=test_program.id,
            event_type="APPROVAL",
            title="Breakthrough Therapy Approval",
            orphan=False,
            breakthrough=True,
            expected_date=date(2025, 9, 15),
            status="UPCOMING"
        )
        
        db_session.add_all([orphan_catalyst, breakthrough_catalyst])
        db_session.commit()
        
        # Filter by orphan
        response = client.get("/api/v1/catalysts/?orphan=true")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["data"][0]["orphan"] is True
        
        # Filter by breakthrough
        response = client.get("/api/v1/catalysts/?breakthrough=true")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["data"][0]["breakthrough"] is True
    
    def test_filter_by_target_gene_and_indication(self, db_session, test_company, test_program):
        """Test filtering by target gene and indication."""
        catalyst = CatalystEvent(
            company_id=test_company.id,
            program_id=test_program.id,
            event_type="TOPLINE_READOUT",
            title="EGFR Inhibitor Readout",
            target_gene="EGFR",
            indication="Non-small cell lung cancer",
            expected_date=date(2025, 4, 15),
            status="UPCOMING"
        )
        
        db_session.add(catalyst)
        db_session.commit()
        
        # Filter by target gene
        response = client.get("/api/v1/catalysts/?target_gene=EGFR")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["data"][0]["target_gene"] == "EGFR"
        
        # Filter by indication
        response = client.get("/api/v1/catalysts/?indication=lung%20cancer")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert "lung cancer" in data["data"][0]["indication"].lower()
    
    def test_combined_multi_facet_filter(self, db_session, test_company, test_program, test_trial):
        """Test complex multi-facet filter combination."""
        catalyst = CatalystEvent(
            company_id=test_company.id,
            program_id=test_program.id,
            trial_id=test_trial.id,
            event_type="TOPLINE_READOUT",
            title="Phase III EGFR Inhibitor Readout",
            trial_phase="Phase III",
            target_gene="EGFR",
            indication="Non-small cell lung cancer",
            orphan=False,
            breakthrough=True,
            prob_of_success=0.70,
            event_window_start=date(2025, 4, 1),
            event_window_end=date(2025, 6, 30),
            expected_date=date(2025, 5, 15),
            date_confidence="DATE_WINDOW",
            status="UPCOMING"
        )
        
        db_session.add(catalyst)
        db_session.commit()
        
        # Complex filter
        response = client.get(
            "/api/v1/catalysts/?"
            "phase=Phase%20III&"
            "target_gene=EGFR&"
            "breakthrough=true&"
            "pos_min=0.6&"
            "quarter=Q2%202025&"
            "confidence=DATE_WINDOW"
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["data"][0]["trial_phase"] == "Phase III"
        assert data["data"][0]["target_gene"] == "EGFR"
        assert data["data"][0]["breakthrough"] is True
        assert data["data"][0]["prob_of_success"] >= 0.6
        assert data["data"][0]["date_confidence"] == "DATE_WINDOW"


class TestProvenanceAttachment:
    """Test provenance attachment and tracking."""
    
    def test_create_catalyst_with_provenance(self, db_session, test_company):
        """Test creating catalyst with source provenance."""
        payload = {
            "company_id": test_company.id,
            "event_type": "PDUFA_DATE",
            "title": "PDUFA Date Announcement",
            "description": "PDUFA date announced in 8-K filing",
            "expected_date": "2025-05-15",
            "date_confidence": "EXACT_DATE",
            "status": "UPCOMING",
            "source_provenance": [
                {
                    "source_url": "https://sec.gov/Archives/edgar/data/12345/000001234524000001/test-8k.htm",
                    "source_type": "SEC_EDGAR",
                    "accessed_at": datetime.utcnow().isoformat(),
                    "content_hash": hashlib.sha256(b"test content").hexdigest(),
                    "parser_version": "edgar_8k_v1.0.0",
                    "selector": "div.pdufa-section",
                    "verbatim_excerpt": "The FDA has set a PDUFA target action date of May 15, 2025.",
                    "source_metadata": {"document_type": "8-K", "filing_date": "2024-12-15"}
                }
            ]
        }
        
        response = client.post("/api/v1/catalysts/", json=payload)
        assert response.status_code == 201
        data = response.json()
        
        # Check catalyst was created
        assert data["title"] == "PDUFA Date Announcement"
        assert data["event_type"] == "PDUFA_DATE"
        
        # Check provenance was attached
        assert len(data["evidence"]) == 1
        evidence = data["evidence"][0]
        assert evidence["source_type"] == "SEC_EDGAR"
        assert evidence["parser_version"] == "edgar_8k_v1.0.0"
        assert "FDA has set a PDUFA target action date" in evidence["verbatim_excerpt"]
    
    def test_create_catalyst_without_provenance_fails(self, db_session, test_company):
        """Test that creating catalyst without provenance fails."""
        payload = {
            "company_id": test_company.id,
            "event_type": "PDUFA_DATE",
            "title": "PDUFA Date Without Source",
            "expected_date": "2025-05-15",
            "status": "UPCOMING",
            "source_provenance": []  # Empty provenance
        }
        
        response = client.post("/api/v1/catalysts/", json=payload)
        assert response.status_code == 422  # Validation error
    
    def test_get_catalyst_with_provenance(self, db_session, test_company, test_program):
        """Test retrieving catalyst with all provenance."""
        # Create catalyst
        catalyst = CatalystEvent(
            company_id=test_company.id,
            program_id=test_program.id,
            event_type="TOPLINE_READOUT",
            title="Phase III Readout",
            expected_date=date(2025, 6, 30),
            status="UPCOMING"
        )
        db_session.add(catalyst)
        db_session.commit()
        db_session.refresh(catalyst)
        
        # Add source provenance
        prov = SourceProvenance(
            source_url="https://clinicaltrials.gov/study/NCT12345678",
            source_type="CT.GOV",
            accessed_at=datetime.utcnow(),
            content_hash=hashlib.sha256(b"trial data").hexdigest(),
            parser_version="ctgov_v2.0.0",
            selector="PrimaryCompletionDate",
            verbatim_excerpt="Primary Completion Date: June 2025"
        )
        db_session.add(prov)
        db_session.commit()
        
        # Link provenance to catalyst
        link = EntitySourceLink(
            entity_type="CATALYST_EVENT",
            entity_id=catalyst.id,
            source_provenance_id=prov.id,
            is_primary=True
        )
        db_session.add(link)
        db_session.commit()
        
        # Retrieve catalyst
        response = client.get(f"/api/v1/catalysts/{catalyst.id}")
        assert response.status_code == 200
        data = response.json()
        
        # Check provenance
        assert len(data["evidence"]) == 1
        evidence = data["evidence"][0]
        assert evidence["source_type"] == "CT.GOV"
        assert evidence["source_url"] == "https://clinicaltrials.gov/study/NCT12345678"
        assert "June 2025" in evidence["verbatim_excerpt"]
    
    def test_update_catalyst_add_provenance(self, db_session, test_company, test_program):
        """Test updating catalyst to add new provenance."""
        # Create catalyst
        catalyst = CatalystEvent(
            company_id=test_company.id,
            program_id=test_program.id,
            event_type="TOPLINE_READOUT",
            title="Phase III Readout",
            expected_date=date(2025, 6, 30),
            date_confidence="QUARTER",
            status="UPCOMING"
        )
        db_session.add(catalyst)
        db_session.commit()
        db_session.refresh(catalyst)
        
        # Update with new provenance
        update_payload = {
            "date_confidence": "DATE_WINDOW",
            "event_window_start": "2025-06-01",
            "event_window_end": "2025-06-30",
            "source_provenance": [
                {
                    "source_url": "https://company.com/press-release/2024-12-15",
                    "source_type": "PRESS_RELEASE",
                    "accessed_at": datetime.utcnow().isoformat(),
                    "content_hash": hashlib.sha256(b"press release").hexdigest(),
                    "parser_version": "pr_v1.0.0",
                    "verbatim_excerpt": "Data readout expected in June 2025"
                }
            ]
        }
        
        response = client.patch(f"/api/v1/catalysts/{catalyst.id}", json=update_payload)
        assert response.status_code == 200
        data = response.json()
        
        # Check updates
        assert data["date_confidence"] == "DATE_WINDOW"
        assert len(data["evidence"]) == 1
        assert data["evidence"][0]["source_type"] == "PRESS_RELEASE"
    
    def test_multiple_provenance_sources(self, db_session, test_company):
        """Test catalyst with multiple provenance sources."""
        payload = {
            "company_id": test_company.id,
            "event_type": "APPROVAL",
            "title": "FDA Approval Expected",
            "expected_date": "2025-08-15",
            "date_confidence": "EXACT_DATE",
            "status": "UPCOMING",
            "source_provenance": [
                {
                    "source_url": "https://sec.gov/filing/8k-2024-12-15",
                    "source_type": "SEC_EDGAR",
                    "accessed_at": datetime.utcnow().isoformat(),
                    "content_hash": hashlib.sha256(b"8k filing").hexdigest(),
                    "parser_version": "edgar_v1.0.0",
                    "verbatim_excerpt": "PDUFA date of August 15, 2025"
                },
                {
                    "source_url": "https://company.com/ir/calendar",
                    "source_type": "IR_CALENDAR",
                    "accessed_at": datetime.utcnow().isoformat(),
                    "content_hash": hashlib.sha256(b"ir calendar").hexdigest(),
                    "parser_version": "ir_v1.0.0",
                    "verbatim_excerpt": "FDA decision expected: Aug 15, 2025"
                },
                {
                    "source_url": "https://fda.gov/calendar/pdufa-dates",
                    "source_type": "FDA",
                    "accessed_at": datetime.utcnow().isoformat(),
                    "content_hash": hashlib.sha256(b"fda calendar").hexdigest(),
                    "parser_version": "fda_v1.0.0",
                    "verbatim_excerpt": "PDUFA Action Date: 08/15/2025"
                }
            ]
        }
        
        response = client.post("/api/v1/catalysts/", json=payload)
        assert response.status_code == 201
        data = response.json()
        
        # Check all three provenance sources
        assert len(data["evidence"]) == 3
        source_types = {e["source_type"] for e in data["evidence"]}
        assert source_types == {"SEC_EDGAR", "IR_CALENDAR", "FDA"}


class TestQualityScoreComputation:
    """Test quality score computation."""
    
    def test_quality_score_computation(self):
        """Test transparent quality score formula."""
        from bt_platform.core.endpoints.catalysts_v2 import compute_quality_score
        
        # Create mock catalyst
        class MockCatalyst:
            def __init__(self):
                self.phase_weight = 1.0  # Phase III
                self.endpoint_rigor = 0.9
                self.n = 500
                self.breakthrough = True
                self.orphan = True
                self.market_depth = 0.8
                self.complexity_penalty = 0.1
        
        catalyst = MockCatalyst()
        score = compute_quality_score(catalyst)
        
        # Expected: 30 + 18 + ~13 + 10 + 8 + 8 - 0.5 ≈ 86.5
        assert 80 <= score <= 95
        assert 0 <= score <= 100
    
    def test_quality_score_with_minimal_data(self):
        """Test quality score with minimal data."""
        from bt_platform.core.endpoints.catalysts_v2 import compute_quality_score
        
        class MockCatalyst:
            def __init__(self):
                self.phase_weight = None
                self.endpoint_rigor = None
                self.n = None
                self.breakthrough = False
                self.orphan = False
                self.market_depth = None
                self.complexity_penalty = None
        
        catalyst = MockCatalyst()
        score = compute_quality_score(catalyst)
        
        # Should be 0 with no data
        assert score == 0


class TestPaginationAndOrdering:
    """Test pagination and result ordering."""
    
    def test_pagination(self, db_session, test_company, test_program):
        """Test pagination of results."""
        # Create multiple catalysts
        for i in range(15):
            catalyst = CatalystEvent(
                company_id=test_company.id,
                program_id=test_program.id,
                event_type="TOPLINE_READOUT",
                title=f"Catalyst {i+1}",
                expected_date=date(2025, 1, i+1),
                status="UPCOMING"
            )
            db_session.add(catalyst)
        db_session.commit()
        
        # Get first page
        response = client.get("/api/v1/catalysts/?limit=10&offset=0")
        assert response.status_code == 200
        data = response.json()
        assert len(data["data"]) == 10
        assert data["total"] == 15
        assert data["page"] == 1
        
        # Get second page
        response = client.get("/api/v1/catalysts/?limit=10&offset=10")
        assert response.status_code == 200
        data = response.json()
        assert len(data["data"]) == 5
        assert data["total"] == 15
        assert data["page"] == 2
    
    def test_ordering_by_date(self, db_session, test_company, test_program):
        """Test results are ordered by date."""
        # Create catalysts with different dates
        early = CatalystEvent(
            company_id=test_company.id,
            program_id=test_program.id,
            event_type="TOPLINE_READOUT",
            title="Early Catalyst",
            expected_date=date(2025, 1, 15),
            status="UPCOMING"
        )
        
        late = CatalystEvent(
            company_id=test_company.id,
            program_id=test_program.id,
            event_type="APPROVAL",
            title="Late Catalyst",
            expected_date=date(2025, 12, 15),
            status="UPCOMING"
        )
        
        db_session.add_all([late, early])  # Add in reverse order
        db_session.commit()
        
        # Query should return in date order
        response = client.get("/api/v1/catalysts/")
        assert response.status_code == 200
        data = response.json()
        
        assert data["data"][0]["title"] == "Early Catalyst"
        assert data["data"][1]["title"] == "Late Catalyst"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

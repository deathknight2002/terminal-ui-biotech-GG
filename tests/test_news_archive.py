"""
Tests for News Refresh Service and Point-in-Time Archive
"""

import pytest
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from bt_platform.core.database import Base, Article, Entity, ArticleEntity, ArticleReaction
from bt_platform.core.services.news_refresh_service import NewsRefreshService
from bt_platform.core.services.entity_extraction_service import EntityExtractionService
from bt_platform.core.services.price_reaction_service import PriceReactionService


# Create test database
TEST_DATABASE_URL = "sqlite:///./test_news_archive.db"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database for each test"""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    yield session
    session.close()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def news_service(db_session):
    """Create news refresh service"""
    return NewsRefreshService(db_session)


@pytest.fixture
def entity_service(db_session):
    """Create entity extraction service"""
    return EntityExtractionService(db_session)


@pytest.fixture
def reaction_service(db_session):
    """Create price reaction service"""
    return PriceReactionService(db_session)


class TestCanonicalKey:
    """Test canonical key generation for deduplication"""
    
    def test_canonical_key_normalization(self, news_service):
        """Test that titles are normalized correctly"""
        title1 = "FDA Approves New Drug for SMA Treatment!"
        url1 = "https://www.example.com/article1"
        
        title2 = "FDA approves new drug for SMA treatment."
        url2 = "https://example.com/article2"
        
        key1 = news_service.canonical_key(title1, url1)
        key2 = news_service.canonical_key(title2, url2)
        
        # Same domain (with and without www)
        # Same normalized title (different punctuation/case)
        assert key1 == key2
        assert "example.com" in key1
        assert "fda approves new drug for sma treatment" in key1
    
    def test_canonical_key_different_domains(self, news_service):
        """Test that different domains produce different keys"""
        title = "FDA Approves New Drug"
        url1 = "https://source1.com/article"
        url2 = "https://source2.com/article"
        
        key1 = news_service.canonical_key(title, url1)
        key2 = news_service.canonical_key(title, url2)
        
        assert key1 != key2
        assert "source1.com" in key1
        assert "source2.com" in key2


class TestTherapeuticAreaDetection:
    """Test therapeutic area tagging"""
    
    def test_detect_sma(self, news_service):
        """Test SMA detection"""
        text = "Scholar Rock announces positive results for spinal muscular atrophy treatment"
        tas = news_service.detect_therapeutic_areas(text)
        assert "SMA" in tas
    
    def test_detect_glp1(self, news_service):
        """Test GLP-1 detection"""
        text = "New GLP-1 agonist shows promise in obesity treatment"
        tas = news_service.detect_therapeutic_areas(text)
        assert "GLP-1" in tas
    
    def test_detect_oncology(self, news_service):
        """Test oncology detection"""
        text = "Breakthrough cancer treatment receives FDA approval"
        tas = news_service.detect_therapeutic_areas(text)
        assert "Oncology" in tas
    
    def test_detect_multiple_tas(self, news_service):
        """Test multiple TA detection"""
        text = "Company announces cancer immunology partnership"
        tas = news_service.detect_therapeutic_areas(text)
        assert "Oncology" in tas
        assert "Immunology" in tas


class TestImportanceScoring:
    """Test importance scoring based on catalyst keywords"""
    
    def test_critical_importance(self, news_service):
        """Test critical importance detection"""
        text = "FDA approval expected for breakthrough therapy"
        importance = news_service.score_importance(text)
        assert importance == "Critical"
    
    def test_high_importance(self, news_service):
        """Test high importance detection"""
        text = "Phase 3 clinical trial data to be presented"
        importance = news_service.score_importance(text)
        assert importance == "High"
    
    def test_medium_importance(self, news_service):
        """Test medium importance detection"""
        text = "Company announces Phase 1 partnership"
        importance = news_service.score_importance(text)
        assert importance == "Medium"
    
    def test_low_importance(self, news_service):
        """Test low importance detection"""
        text = "Company opens new research facility"
        importance = news_service.score_importance(text)
        assert importance == "Low"


class TestDeduplication:
    """Test article deduplication"""
    
    def test_deduplicate_identical_titles(self, news_service):
        """Test deduplication of identical titles from same domain"""
        articles = [
            {"title": "FDA Approves Drug", "url": "https://source1.com/article1"},
            {"title": "FDA approves drug!", "url": "https://source1.com/article2"},
            {"title": "FDA APPROVES DRUG.", "url": "https://source1.com/article3"},
        ]
        
        deduped = news_service.deduplicate_articles(articles)
        
        # Should dedupe to 1 article (same domain, same normalized title)
        assert len(deduped) == 1
        assert deduped[0]["cross_source_count"] == 3
    
    def test_deduplicate_different_titles(self, news_service):
        """Test that different titles are not deduped"""
        articles = [
            {"title": "FDA Approves Drug A", "url": "https://source1.com/1"},
            {"title": "FDA Approves Drug B", "url": "https://source1.com/2"},
        ]
        
        deduped = news_service.deduplicate_articles(articles)
        
        assert len(deduped) == 2
        assert all(a["cross_source_count"] == 1 for a in deduped)


class TestEntityExtraction:
    """Test entity extraction from text"""
    
    def test_extract_ticker(self, entity_service):
        """Test ticker extraction"""
        text = "Scholar Rock ($SRRK) announces positive results"
        tickers = entity_service.extract_tickers(text)
        assert "SRRK" in tickers
    
    def test_extract_nasdaq_ticker(self, entity_service):
        """Test NASDAQ ticker extraction"""
        text = "Ionis Pharmaceuticals (NASDAQ:IONS) releases data"
        tickers = entity_service.extract_tickers(text)
        assert "IONS" in tickers
    
    def test_extract_companies(self, entity_service, db_session):
        """Test company entity extraction"""
        # Create test company
        company = Entity(
            kind="company",
            name="Scholar Rock",
            ticker="SRRK"
        )
        db_session.add(company)
        db_session.commit()
        
        # Reload cache
        entity_service._load_entity_cache()
        
        text = "Scholar Rock ($SRRK) announces breakthrough"
        companies = entity_service.extract_companies(text)
        
        assert len(companies) > 0
        assert any(c["ticker"] == "SRRK" for c in companies)


class TestPriceReactions:
    """Test price reaction calculations"""
    
    def test_parse_window_daily(self, reaction_service):
        """Test parsing daily window"""
        event_time = datetime(2024, 1, 15, 9, 30)
        window = "[-1d,+1d]"
        
        start, end = reaction_service._parse_window(event_time, window)
        
        assert (end - start).days == 2
        assert start < event_time < end
    
    def test_parse_window_intraday(self, reaction_service):
        """Test parsing intraday window"""
        event_time = datetime(2024, 1, 15, 9, 30)
        window = "[0,+60m]"
        
        start, end = reaction_service._parse_window(event_time, window)
        
        assert (end - start).total_seconds() == 3600  # 60 minutes
        assert start == event_time
    
    def test_calculate_reaction(self, reaction_service, db_session):
        """Test reaction calculation"""
        # Create test article
        article = Article(
            title="Test Article",
            url="https://test.com/1",
            source="test",
            published_at=datetime.utcnow(),
            canonical_key="test.com::test article"
        )
        db_session.add(article)
        db_session.commit()
        
        # Create test entity
        entity = Entity(
            kind="company",
            name="Test Company",
            ticker="TEST"
        )
        db_session.add(entity)
        db_session.commit()
        
        # Calculate reaction
        result = reaction_service.calculate_reaction(
            article.id,
            entity.id,
            article.published_at,
            "[-1d,+1d]"
        )
        
        assert result is not None
        assert "raw_return" in result
        assert "abnormal_return" in result
        assert "benchmark_return" in result
    
    def test_get_reactions(self, reaction_service, db_session):
        """Test getting reactions for an article"""
        # Create test article
        article = Article(
            title="Test Article",
            url="https://test.com/1",
            source="test",
            published_at=datetime.utcnow(),
            canonical_key="test.com::test article"
        )
        db_session.add(article)
        db_session.commit()
        
        # Create test entity
        entity = Entity(
            kind="company",
            name="Test Company",
            ticker="TEST"
        )
        db_session.add(entity)
        db_session.commit()
        
        # Add reaction manually
        reaction = ArticleReaction(
            article_id=article.id,
            entity_id=entity.id,
            event_time=article.published_at,
            window="[-1d,+1d]",
            raw_return=0.05,
            abnormal_return=0.03
        )
        db_session.add(reaction)
        db_session.commit()
        
        # Get reactions
        reactions = reaction_service.get_reactions(article.id)
        
        assert len(reactions) == 1
        assert reactions[0]["raw_return"] == 0.05
        assert reactions[0]["abnormal_return"] == 0.03


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

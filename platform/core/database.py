"""
Database Configuration and Models

SQLAlchemy-based database setup with biotech-specific models.
"""

from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, Boolean, JSON, ForeignKey, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.sql import func
from datetime import datetime
from typing import Optional
import logging

from .config import settings

logger = logging.getLogger(__name__)

# Database engine
engine = create_engine(settings.DATABASE_URL, echo=settings.DEBUG)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# Database Models
class Drug(Base):
    """Drug information model"""
    __tablename__ = "drugs"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    generic_name = Column(String)
    company = Column(String, index=True)
    therapeutic_area = Column(String, index=True)
    indication = Column(Text)
    phase = Column(String, index=True)
    mechanism = Column(String)
    target = Column(String)
    status = Column(String, default="Active")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class ClinicalTrial(Base):
    """Clinical trial model"""
    __tablename__ = "clinical_trials"
    
    id = Column(Integer, primary_key=True, index=True)
    nct_id = Column(String, unique=True, index=True)
    title = Column(Text)
    phase = Column(String, index=True)
    status = Column(String, index=True)
    condition = Column(String, index=True)
    intervention = Column(String)
    sponsor = Column(String, index=True)
    start_date = Column(DateTime)
    completion_date = Column(DateTime)
    enrollment = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Company(Base):
    """Biotech/pharma company model"""
    __tablename__ = "companies"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    ticker = Column(String, unique=True, index=True)
    company_type = Column(String, index=True)  # Big Pharma, Biotech, etc.
    market_cap = Column(Float)
    headquarters = Column(String)
    founded = Column(Integer)
    employees = Column(Integer)
    pipeline_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Catalyst(Base):
    """Market catalyst model"""
    __tablename__ = "catalysts"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)  # Name of the catalyst
    title = Column(String, index=True)
    company = Column(String, index=True)
    drug = Column(String, index=True)
    kind = Column(String, index=True)  # Type: FDA, Clinical, M&A, etc.
    event_type = Column(String, index=True)  # FDA Approval, Data Readout, etc.
    date = Column(DateTime, index=True)  # Event date
    event_date = Column(DateTime, index=True)
    probability = Column(Float)  # 0.0 - 1.0
    impact = Column(String)  # High, Medium, Low
    description = Column(Text)
    status = Column(String, default="Upcoming")
    source_url = Column(String)  # Source URL for the catalyst
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class MarketData(Base):
    """Market data model for biotech stocks"""
    __tablename__ = "market_data"
    
    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String, index=True)
    timestamp = Column(DateTime, index=True)
    open_price = Column(Float)
    high_price = Column(Float)
    low_price = Column(Float)
    close_price = Column(Float)
    volume = Column(Integer)
    market_cap = Column(Float)


# ============================================================================
# NEWS AND ARTICLES MODELS
# ============================================================================

class Article(Base):
    """News article model with sentiment and verification"""
    __tablename__ = "articles"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    url = Column(String, nullable=False, unique=True, index=True)
    summary = Column(Text)
    source = Column(String, index=True)  # FierceBiotech, ScienceDaily, etc.
    published_at = Column(DateTime, index=True)
    tags = Column(JSON)  # List of tags
    hash = Column(String, unique=True, index=True)  # Content hash for deduplication
    link_valid = Column(Boolean, default=True)  # Validated link status
    ingested_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    sentiments = relationship("Sentiment", back_populates="article", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_article_source_date', 'source', 'published_at'),
        Index('idx_article_hash', 'hash'),
    )


class Sentiment(Base):
    """Sentiment analysis for articles by domain"""
    __tablename__ = "sentiments"
    
    id = Column(Integer, primary_key=True, index=True)
    article_id = Column(Integer, ForeignKey('articles.id'), nullable=False, index=True)
    domain = Column(String, nullable=False, index=True)  # regulatory, clinical, mna
    score = Column(Float, nullable=False)  # -1.0 to 1.0
    rationale = Column(Text)  # Explanation of sentiment
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationship
    article = relationship("Article", back_populates="sentiments")
    
    __table_args__ = (
        Index('idx_sentiment_article_domain', 'article_id', 'domain'),
    )


class Therapeutic(Base):
    """Therapeutic/drug asset model"""
    __tablename__ = "therapeutics"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    modality = Column(String, index=True)  # Small molecule, antibody, gene therapy, etc.
    phase = Column(String, index=True)  # Preclinical, Phase I, II, III, Filed, Approved
    company_id = Column(Integer, ForeignKey('companies.id'), index=True)
    disease_id = Column(Integer, ForeignKey('epidemiology_diseases.id'), index=True)
    indication = Column(Text)
    mechanism = Column(String)
    target = Column(String)
    status = Column(String, default="Active")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    __table_args__ = (
        Index('idx_therapeutic_company_phase', 'company_id', 'phase'),
        Index('idx_therapeutic_disease', 'disease_id'),
    )


class CompetitionEdge(Base):
    """Competitive edge analysis between therapeutics or companies"""
    __tablename__ = "competition_edges"
    
    id = Column(Integer, primary_key=True, index=True)
    from_id = Column(Integer, nullable=False, index=True)
    to_id = Column(Integer, nullable=False, index=True)
    scope = Column(String, nullable=False, index=True)  # THERAPEUTIC or COMPANY
    
    # Six-axis competitive metrics (0-100 scale)
    safety = Column(Float)
    efficacy = Column(Float)
    regulatory = Column(Float)
    modality_fit = Column(Float)
    clinical_maturity = Column(Float)
    differentiation = Column(Float)
    
    justification = Column(Text)  # Explanation of scores
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    __table_args__ = (
        Index('idx_competition_from_to', 'from_id', 'to_id', 'scope'),
    )


# ============================================================================
# MANY-TO-MANY LINK TABLES
# ============================================================================

class ArticleDisease(Base):
    """Link table between articles and diseases"""
    __tablename__ = "article_diseases"
    
    id = Column(Integer, primary_key=True, index=True)
    article_id = Column(Integer, ForeignKey('articles.id'), nullable=False, index=True)
    disease_id = Column(Integer, ForeignKey('epidemiology_diseases.id'), nullable=False, index=True)
    relevance = Column(Float)  # 0-1 relevance score
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        Index('idx_article_disease', 'article_id', 'disease_id'),
    )


class ArticleCompany(Base):
    """Link table between articles and companies"""
    __tablename__ = "article_companies"
    
    id = Column(Integer, primary_key=True, index=True)
    article_id = Column(Integer, ForeignKey('articles.id'), nullable=False, index=True)
    company_id = Column(Integer, ForeignKey('companies.id'), nullable=False, index=True)
    relevance = Column(Float)  # 0-1 relevance score
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        Index('idx_article_company', 'article_id', 'company_id'),
    )


class ArticleCatalyst(Base):
    """Link table between articles and catalysts"""
    __tablename__ = "article_catalysts"
    
    id = Column(Integer, primary_key=True, index=True)
    article_id = Column(Integer, ForeignKey('articles.id'), nullable=False, index=True)
    catalyst_id = Column(Integer, ForeignKey('catalysts.id'), nullable=False, index=True)
    relevance = Column(Float)  # 0-1 relevance score
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        Index('idx_article_catalyst', 'article_id', 'catalyst_id'),
    )


# ============================================================================
# EPIDEMIOLOGY INTELLIGENCE PLATFORM MODELS
# ============================================================================

class EpidemiologyDisease(Base):
    """Comprehensive epidemiology disease model with multi-source integration"""
    __tablename__ = "epidemiology_diseases"
    
    id = Column(Integer, primary_key=True, index=True)
    disease_id = Column(String, unique=True, index=True, nullable=False)  # Internal ID
    name = Column(String, nullable=False, index=True)
    
    # Disease Classification
    icd10_code = Column(String, index=True)
    icd11_code = Column(String, index=True)
    snomed_ct_code = Column(String, index=True)
    category = Column(String, index=True)  # Cancer, Infectious, Chronic, etc.
    
    # Basic Information
    description = Column(Text)
    alternate_names = Column(JSON)  # List of synonyms
    
    # Epidemiological Metrics (per 100,000 population unless specified)
    prevalence = Column(Float)  # Current cases per 100,000
    incidence = Column(Float)  # New cases per 100,000 per year
    mortality_rate = Column(Float)  # Deaths per 100,000 per year
    case_fatality_rate = Column(Float)  # Proportion who die (0-1)
    
    # Population Metrics
    target_population = Column(Integer)  # Global affected population
    average_age = Column(Float)
    gender_ratio = Column(Float)  # Male to female ratio
    
    # GBD (Global Burden of Disease) Metrics
    dalys = Column(Float)  # Disability-Adjusted Life Years
    ylls = Column(Float)  # Years of Life Lost
    ylds = Column(Float)  # Years Lived with Disability
    
    # Geographic & Demographic
    geographic_distribution = Column(JSON)  # Region -> prevalence mapping
    age_distribution = Column(JSON)  # Age group -> cases mapping
    demographic_data = Column(JSON)  # Additional stratification
    
    # Risk Factors & Comorbidities
    risk_factors = Column(JSON)  # List of risk factors
    comorbidities = Column(JSON)  # Associated conditions
    
    # Outcomes & Prognosis
    survival_rate_1yr = Column(Float)
    survival_rate_5yr = Column(Float)
    survival_rate_10yr = Column(Float)
    median_survival_months = Column(Float)
    remission_rate = Column(Float)
    
    # Data Provenance & Quality
    data_sources = Column(JSON)  # List of source identifiers
    last_sync = Column(DateTime, index=True)
    source_hash = Column(String)  # Data integrity hash
    reliability_score = Column(Float)  # 0-1, data quality indicator
    completeness_score = Column(Float)  # 0-1, how much data is populated
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    is_active = Column(Boolean, default=True)
    
    # Relationships
    time_series_data = relationship("DiseaseTimeSeries", back_populates="disease")
    source_data = relationship("DiseaseDataSource", back_populates="disease")
    
    # Indexes for performance
    __table_args__ = (
        Index('idx_disease_category_active', 'category', 'is_active'),
        Index('idx_disease_icd10_icd11', 'icd10_code', 'icd11_code'),
        Index('idx_disease_name_search', 'name'),
    )


class DiseaseDataSource(Base):
    """Track data sources and provenance for each disease"""
    __tablename__ = "disease_data_sources"
    
    id = Column(Integer, primary_key=True, index=True)
    disease_id = Column(Integer, ForeignKey('epidemiology_diseases.id'), nullable=False, index=True)
    
    # Source Information
    source_name = Column(String, nullable=False)  # SEER, WHO, CDC, etc.
    source_type = Column(String)  # API, Manual, File
    source_url = Column(String)
    source_citation = Column(Text)
    
    # Data Quality
    collection_date = Column(DateTime)
    last_updated = Column(DateTime)
    data_version = Column(String)
    reliability_indicator = Column(String)  # High, Medium, Low
    completeness_percentage = Column(Float)
    
    # Specific Source Data
    seer_data = Column(JSON)  # Cancer-specific SEER data
    who_data = Column(JSON)  # WHO global health observatory data
    cdc_data = Column(JSON)  # CDC surveillance data
    gbd_data = Column(JSON)  # Global Burden of Disease data
    
    # Provenance
    source_hash = Column(String)
    sync_timestamp = Column(DateTime, default=datetime.utcnow)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationship
    disease = relationship("EpidemiologyDisease", back_populates="source_data")
    
    __table_args__ = (
        Index('idx_source_disease_name', 'disease_id', 'source_name'),
    )


class DiseaseTimeSeries(Base):
    """Time-series data for disease metrics"""
    __tablename__ = "disease_time_series"
    
    id = Column(Integer, primary_key=True, index=True)
    disease_id = Column(Integer, ForeignKey('epidemiology_diseases.id'), nullable=False, index=True)
    
    # Temporal Dimension
    year = Column(Integer, index=True)
    quarter = Column(Integer)  # 1-4
    month = Column(Integer)  # 1-12
    date = Column(DateTime, index=True)
    
    # Metrics over time
    incidence = Column(Float)
    prevalence = Column(Float)
    mortality = Column(Float)
    cases = Column(Integer)
    deaths = Column(Integer)
    
    # Geographic context
    geography_type = Column(String)  # Global, Country, Region, State
    geography_code = Column(String, index=True)
    geography_name = Column(String)
    
    # Source
    data_source = Column(String)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationship
    disease = relationship("EpidemiologyDisease", back_populates="time_series_data")
    
    __table_args__ = (
        Index('idx_timeseries_disease_year', 'disease_id', 'year'),
        Index('idx_timeseries_geo', 'geography_type', 'geography_code'),
    )


class DiseaseGeospatial(Base):
    """Geospatial disease distribution data"""
    __tablename__ = "disease_geospatial"
    
    id = Column(Integer, primary_key=True, index=True)
    disease_id = Column(Integer, ForeignKey('epidemiology_diseases.id'), nullable=False, index=True)
    
    # Geographic Information
    country_code = Column(String, index=True)  # ISO 3166-1 alpha-3
    country_name = Column(String)
    region = Column(String, index=True)  # WHO region, CDC region, etc.
    state_province = Column(String)
    
    # Metrics
    prevalence = Column(Float)
    incidence = Column(Float)
    mortality_rate = Column(Float)
    population = Column(Integer)
    cases = Column(Integer)
    
    # Year for temporal context
    year = Column(Integer, index=True)
    
    # Source
    data_source = Column(String)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        Index('idx_geo_disease_country', 'disease_id', 'country_code'),
        Index('idx_geo_region_year', 'region', 'year'),
    )


class DiseaseOntology(Base):
    """Disease relationships and ontology mapping"""
    __tablename__ = "disease_ontology"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Related Diseases
    disease_id = Column(Integer, ForeignKey('epidemiology_diseases.id'), nullable=False, index=True)
    related_disease_id = Column(Integer, ForeignKey('epidemiology_diseases.id'), index=True)
    
    # Relationship Type
    relationship_type = Column(String, index=True)  # comorbidity, risk_factor, parent, child
    relationship_strength = Column(Float)  # 0-1
    
    # Hierarchy
    parent_category = Column(String)
    hierarchy_level = Column(Integer)
    
    # Additional metadata
    notes = Column(Text)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        Index('idx_ontology_disease_related', 'disease_id', 'related_disease_id'),
    )


class ICD10ICD11Mapping(Base):
    """ICD-10 to ICD-11 crosswalk table"""
    __tablename__ = "icd_mapping"
    
    id = Column(Integer, primary_key=True, index=True)
    
    icd10_code = Column(String, index=True, nullable=False)
    icd10_description = Column(Text)
    
    icd11_code = Column(String, index=True)
    icd11_description = Column(Text)
    
    mapping_type = Column(String)  # exact, approximate, one-to-many
    mapping_confidence = Column(Float)  # 0-1
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        Index('idx_icd_10_11', 'icd10_code', 'icd11_code'),
    )


class DataIngestionLog(Base):
    """Track ETL pipeline runs and data ingestion"""
    __tablename__ = "data_ingestion_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Pipeline Info
    pipeline_name = Column(String, index=True)
    data_source = Column(String, index=True)  # SEER, WHO, CDC
    
    # Execution
    start_time = Column(DateTime, index=True)
    end_time = Column(DateTime)
    status = Column(String, index=True)  # running, success, failed
    
    # Results
    records_processed = Column(Integer)
    records_inserted = Column(Integer)
    records_updated = Column(Integer)
    records_failed = Column(Integer)
    
    # Error handling
    error_message = Column(Text)
    error_details = Column(JSON)
    
    # Metadata
    execution_metadata = Column(JSON)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ============================================================================
# FINANCIALS MODULE MODELS
# ============================================================================

class PriceTarget(Base):
    """Price target estimates from various sources (Street consensus)"""
    __tablename__ = "price_targets"
    
    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String, nullable=False, index=True)
    source = Column(String, nullable=False, index=True)  # Bank/Analyst name
    date = Column(DateTime, nullable=False, index=True)
    price_target = Column(Float, nullable=False)
    rationale = Column(Text)
    currency = Column(String, default="USD")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    __table_args__ = (
        Index('idx_price_target_ticker_date', 'ticker', 'date'),
        Index('idx_price_target_source', 'source'),
    )


class ConsensusEstimate(Base):
    """Street consensus estimates for various financial metrics"""
    __tablename__ = "consensus_estimates"
    
    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String, nullable=False, index=True)
    metric = Column(String, nullable=False, index=True)  # revenue, EPS, GM, OPEX, shares, WACC, TGR
    period = Column(String, nullable=False, index=True)  # YYYY or YYYY-Q1 format
    value = Column(Float, nullable=False)
    source = Column(String, index=True)  # Consensus source
    currency = Column(String, default="USD")
    unit = Column(String)  # millions, billions, percentage, etc.
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    __table_args__ = (
        Index('idx_consensus_ticker_metric_period', 'ticker', 'metric', 'period'),
    )


class RevenueLine(Base):
    """Revenue projections by asset, region, and year"""
    __tablename__ = "revenue_lines"
    
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(String, nullable=False, index=True)  # References therapeutic/asset
    asset_name = Column(String, nullable=False)
    region = Column(String, nullable=False, index=True)  # US, EU, ROW
    year = Column(Integer, nullable=False, index=True)
    
    # Revenue drivers
    net_price = Column(Float, nullable=False)  # Price per patient
    uptake = Column(Float, nullable=False)  # Market penetration (0-1)
    probability_of_success = Column(Float, nullable=False)  # PoS by phase (0-1)
    patients = Column(Integer)  # Patient count
    revenue = Column(Float, nullable=False)  # Total revenue
    
    # Metadata
    currency = Column(String, default="USD")
    scenario = Column(String, default="base")  # base, bull, bear
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    __table_args__ = (
        Index('idx_revenue_asset_year', 'asset_id', 'year'),
        Index('idx_revenue_region', 'region'),
    )


class PatentExpiry(Base):
    """Patent expiry and loss of exclusivity (LoE) events"""
    __tablename__ = "patent_expiries"
    
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(String, nullable=False, index=True)
    asset_name = Column(String, nullable=False)
    region = Column(String, nullable=False, index=True)  # US, EU, etc.
    expiry_date = Column(DateTime, nullable=False, index=True)
    
    exclusivity_type = Column(String, nullable=False)  # patent, data_exclusivity, orphan
    erosion_curve_id = Column(String, nullable=False)  # Reference to erosion curve
    
    # Erosion parameters
    peak_revenue_before_loe = Column(Float)
    year_1_erosion_rate = Column(Float)  # Percentage drop year 1
    year_2_erosion_rate = Column(Float)
    steady_state_share = Column(Float)  # Long-term generic share
    
    notes = Column(Text)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    __table_args__ = (
        Index('idx_patent_asset_region', 'asset_id', 'region'),
        Index('idx_patent_expiry_date', 'expiry_date'),
    )


class ValuationRun(Base):
    """Valuation model runs with inputs hash for reproducibility"""
    __tablename__ = "valuation_runs"
    
    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String, nullable=False, index=True)
    run_timestamp = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    
    # Inputs tracking
    inputs = Column(JSON, nullable=False)  # Full input parameters
    inputs_hash = Column(String, nullable=False, index=True)  # Hash for deduplication
    
    # Valuation outputs
    outputs = Column(JSON, nullable=False)  # DCF results, multiples, per-share value
    scenario = Column(String, default="base")  # base, bull, bear
    
    # Model metadata
    version = Column(String, default="1.0")  # Model version
    user = Column(String, index=True)  # User who ran the model
    notes = Column(Text)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        Index('idx_valuation_ticker_timestamp', 'ticker', 'run_timestamp'),
        Index('idx_valuation_hash', 'inputs_hash'),
    )


class ReportArtifact(Base):
    """Generated reports (XLSX, PPTX, PDF)"""
    __tablename__ = "report_artifacts"
    
    id = Column(Integer, primary_key=True, index=True)
    file_type = Column(String, nullable=False, index=True)  # xlsx, pptx, pdf
    template_id = Column(String, nullable=False, index=True)  # Template identifier
    
    # Report parameters
    ticker = Column(String, index=True)
    params = Column(JSON, nullable=False)  # Generation parameters
    
    # File storage
    file_path = Column(String, nullable=False)  # Storage path or URL
    file_size = Column(Integer)  # File size in bytes
    file_hash = Column(String)  # SHA256 hash
    
    # Access control
    download_url = Column(String)  # Signed download URL
    expiry_date = Column(DateTime)  # URL expiry
    
    # Metadata
    generated_by = Column(String, index=True)
    generated_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        Index('idx_report_ticker_type', 'ticker', 'file_type'),
        Index('idx_report_template', 'template_id'),
    )


# Database initialization
async def init_db():
    """Initialize database tables"""
    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)
        logger.info("✅ Database tables created successfully")
        
        # Seed with sample data if empty
        from .seed_data import seed_database
        await seed_database()
        
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")
        raise


# Database dependency
def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
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
    therapeutic_areas = Column(String)  # Comma-separated therapeutic areas

    # XBI tracking
    is_xbi_constituent = Column(Boolean, default=False, index=True)
    xbi_added_date = Column(DateTime)
    xbi_removed_date = Column(DateTime)

    # Profile data
    description = Column(Text)
    website = Column(String)
    investor_relations_url = Column(String)

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

    # Ionis-style stealth catalyst scoring (0-4 scale for leverage/clarity/surprise/downside, 0-3 for market_depth)
    event_leverage = Column(Integer)  # Hard endpoint likelihood (0-4): prespecified? clinically persuasive?
    timing_clarity = Column(Integer)  # Fixed PDUFA vs event-driven fog (0-3)
    surprise_factor = Column(Integer)  # Street models anchored on surrogate only? (0-3)
    downside_contained = Column(Integer)  # CRL-type or class read-through favors asymmetry? (0-3)
    market_depth = Column(Integer)  # Payer appetite + population size + guideline friendliness (0-3)

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

    # Point-in-time archive fields
    fetched_at = Column(DateTime(timezone=True), server_default=func.now())
    canonical_key = Column(String, index=True)  # normalized(title) for dedupe
    fulltext = Column(Text)
    ta_tags = Column(JSON)  # ["SMA","GLP-1","Oncology",...] therapeutic areas
    importance = Column(String)  # Critical, High, Medium, Low
    relevance_score = Column(Integer)
    cross_source_count = Column(Integer, default=1)

    # Relationships
    sentiments = relationship("Sentiment", back_populates="article", cascade="all, delete-orphan")
    entities = relationship("ArticleEntity", back_populates="article", cascade="all, delete-orphan")
    reactions = relationship("ArticleReaction", back_populates="article", cascade="all, delete-orphan")

    __table_args__ = (
        Index('idx_article_source_date', 'source', 'published_at'),
        Index('idx_article_hash', 'hash'),
        Index('idx_article_canonical_key', 'canonical_key'),
        Index('idx_article_importance', 'importance'),
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


class Entity(Base):
    """Entities: companies, drugs, diseases, targets, ETFs"""
    __tablename__ = "entities"

    id = Column(Integer, primary_key=True, index=True)
    kind = Column(String, nullable=False, index=True)  # company, drug, disease, target, etf
    name = Column(String, nullable=False, index=True)
    ticker = Column(String, index=True)  # for companies/ETFs
    exchange = Column(String)
    synonyms = Column(JSON)  # List of synonyms
    attributes = Column(JSON)  # optional: moa, mechanism, etc.
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    article_links = relationship("ArticleEntity", back_populates="entity", cascade="all, delete-orphan")
    snapshots = relationship("CompanySnapshot", back_populates="entity", cascade="all, delete-orphan")
    etf_memberships = relationship("ETFConstituent", back_populates="member_entity", foreign_keys="ETFConstituent.member_entity_id")
    reactions = relationship("ArticleReaction", back_populates="entity", foreign_keys="ArticleReaction.entity_id", cascade="all, delete-orphan")

    __table_args__ = (
        Index('idx_entity_kind_name', 'kind', 'name'),
        Index('idx_entity_ticker', 'ticker'),
    )


class ArticleEntity(Base):
    """Article ↔ Entity linking with role and confidence"""
    __tablename__ = "article_entities"

    id = Column(Integer, primary_key=True, index=True)
    article_id = Column(Integer, ForeignKey('articles.id'), nullable=False, index=True)
    entity_id = Column(Integer, ForeignKey('entities.id'), nullable=False, index=True)
    role = Column(String, nullable=False, index=True)  # primary, mentioned, competitor, etf
    confidence = Column(Float)  # 0-1 confidence score
    weight = Column(Float)  # exposure weight
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    article = relationship("Article", back_populates="entities")
    entity = relationship("Entity", back_populates="article_links")

    __table_args__ = (
        Index('idx_article_entity_role', 'article_id', 'entity_id', 'role'),
    )


class CompanySnapshot(Base):
    """Point-in-time market cap snapshot"""
    __tablename__ = "company_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    entity_id = Column(Integer, ForeignKey('entities.id'), nullable=False, index=True)
    asof_date = Column(DateTime, nullable=False, index=True)
    market_cap = Column(Float)
    cap_bucket = Column(String)  # Micro, Small, Mid, Large, Mega
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    entity = relationship("Entity", back_populates="snapshots")

    __table_args__ = (
        Index('idx_company_snapshot_date', 'entity_id', 'asof_date'),
    )


class ETFConstituent(Base):
    """Point-in-time ETF constituents snapshot"""
    __tablename__ = "etf_constituents"

    id = Column(Integer, primary_key=True, index=True)
    etf_entity_id = Column(Integer, ForeignKey('entities.id'), nullable=False, index=True)
    asof_date = Column(DateTime, nullable=False, index=True)
    member_entity_id = Column(Integer, ForeignKey('entities.id'), nullable=False, index=True)
    weight = Column(Float)  # 0-1 weight in ETF
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    etf_entity = relationship("Entity", foreign_keys=[etf_entity_id])
    member_entity = relationship("Entity", foreign_keys=[member_entity_id], back_populates="etf_memberships")

    __table_args__ = (
        Index('idx_etf_constituent', 'etf_entity_id', 'asof_date', 'member_entity_id'),
    )


class ArticleReaction(Base):
    """Price reaction per article x ticker"""
    __tablename__ = "article_reactions"

    id = Column(Integer, primary_key=True, index=True)
    article_id = Column(Integer, ForeignKey('articles.id'), nullable=False, index=True)
    entity_id = Column(Integer, ForeignKey('entities.id'), nullable=False, index=True)  # ticker
    event_time = Column(DateTime(timezone=True), nullable=False)
    window = Column(String, nullable=False)  # e.g., '[-1d,+1d]', '[0,+60m]'
    raw_return = Column(Float)  # % return
    benchmark_entity_id = Column(Integer, ForeignKey('entities.id'))  # XBI or custom basket
    abnormal_return = Column(Float)  # vs benchmark
    p_value = Column(Float)  # optional significance test
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    article = relationship("Article", back_populates="reactions")
    entity = relationship("Entity", foreign_keys=[entity_id], back_populates="reactions")
    benchmark_entity = relationship("Entity", foreign_keys=[benchmark_entity_id])

    __table_args__ = (
        Index('idx_article_reaction', 'article_id', 'entity_id', 'window'),
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


class PipelineAsset(Base):
    """Pipeline asset model for scraped company pipeline data"""
    __tablename__ = "pipeline_assets"

    id = Column(Integer, primary_key=True, index=True)

    # Core fields
    asset_name = Column(String, nullable=False, index=True)
    company_name = Column(String, nullable=False, index=True)
    company_id = Column(Integer, ForeignKey('companies.id'), index=True)

    # Pipeline details
    phase = Column(String, index=True)  # Preclinical, Phase I, Phase II, Phase III, Filed, Approved
    indication = Column(Text)  # Disease/condition being treated
    therapeutic_area = Column(String, index=True)  # Oncology, Immunology, etc.

    # Asset metadata
    mechanism_of_action = Column(String)  # MOA/target
    modality = Column(String)  # Small molecule, antibody, gene therapy, etc.
    development_status = Column(String, index=True)  # Active, Discontinued, On Hold

    # Source tracking
    source_url = Column(String)  # URL of pipeline page
    source_company = Column(String, index=True)  # Company whose website this came from
    logo_url = Column(String)  # Company/asset logo URL

    # Data provenance
    scraped_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    last_verified = Column(DateTime(timezone=True), onupdate=func.now())
    data_hash = Column(String, index=True)  # Hash for deduplication

    # Additional metadata
    metadata = Column(JSON)  # Flexible field for additional scraped data

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        Index('idx_pipeline_asset_company_phase', 'company_id', 'phase'),
        Index('idx_pipeline_asset_name_company', 'asset_name', 'company_name'),
        Index('idx_pipeline_asset_source', 'source_company', 'scraped_at'),
        Index('idx_pipeline_asset_hash', 'data_hash'),
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


# ============================================================================
# COMPANY PROFILE MODULE MODELS
# ============================================================================

class CompanySource(Base):
    """Company sources like investor presentations, press releases, IR materials"""
    __tablename__ = "company_sources"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey('companies.id'), nullable=False)
    ticker = Column(String, index=True)  # Denormalized for easier queries

    source_type = Column(String, index=True, nullable=False)  # PRESENTATION, PRESS_RELEASE, IR_MATERIAL, FILING
    title = Column(String, nullable=False)
    url = Column(String, nullable=False)
    published_date = Column(DateTime, index=True)
    description = Column(Text)

    # For filings
    filing_type = Column(String)  # 10-K, 10-Q, 8-K, etc.
    accession_number = Column(String)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index('idx_company_source_type_date', 'company_id', 'source_type', 'published_date'),
        Index('idx_company_source_ticker', 'ticker', 'published_date'),
    )


class CompanyArticle(Base):
    """News articles linked to companies"""
    __tablename__ = "company_articles"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey('companies.id'), nullable=False)
    ticker = Column(String, index=True)  # Denormalized for easier queries

    title = Column(String, nullable=False)
    source = Column(String)
    url = Column(String)
    published_date = Column(DateTime, index=True)
    summary = Column(Text)

    # Relevance and sentiment
    relevance_score = Column(Float)  # 0-1 relevance to company
    sentiment_score = Column(Float)  # -1 to 1 sentiment

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index('idx_company_article_date', 'company_id', 'published_date'),
        Index('idx_company_article_ticker', 'ticker', 'published_date'),
    )


class CompanyOwnership(Base):
    """Institutional ownership tracking"""
    __tablename__ = "company_ownership"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey('companies.id'), nullable=False)
    ticker = Column(String, index=True)  # Denormalized for easier queries

    institution_name = Column(String, nullable=False)
    shares_held = Column(Integer)
    percent_owned = Column(Float)
    value_usd = Column(Float)  # in dollars

    # Reporting details
    reporting_date = Column(DateTime, index=True, nullable=False)
    form_type = Column(String)  # 13F, 13G, etc.

    # Change tracking
    shares_change = Column(Integer)
    percent_change = Column(Float)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index('idx_ownership_company_date', 'company_id', 'reporting_date'),
        Index('idx_ownership_ticker', 'ticker', 'reporting_date'),
        Index('idx_ownership_institution', 'institution_name', 'reporting_date'),
    )


# ============================================================================
# KOL (KEY OPINION LEADER) TRACKING MODELS
# ============================================================================

class KOLSource(Base):
    """KOL data source tracking and health monitoring"""
    __tablename__ = "kol_sources"

    id = Column(Integer, primary_key=True, index=True)
    source_name = Column(String, unique=True, nullable=False, index=True)
    source_type = Column(String, nullable=False, index=True)  # social_media, news, academic, regulatory, conference
    platform = Column(String)  # Twitter/X, LinkedIn, PubMed, etc.

    # Source configuration
    scraper_class = Column(String)  # Java class name for scraper
    scraper_config = Column(JSON)  # Configuration parameters
    update_frequency = Column(String)  # hourly, daily, weekly

    # Health and reliability metrics
    is_active = Column(Boolean, default=True, index=True)
    reliability_score = Column(Float, default=1.0)  # 0-1, based on historical accuracy
    last_successful_scrape = Column(DateTime, index=True)
    last_failed_scrape = Column(DateTime)
    consecutive_failures = Column(Integer, default=0)

    # Statistics
    total_signals_collected = Column(Integer, default=0)
    avg_signal_quality = Column(Float)  # 0-1

    # Metadata
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        Index('idx_kol_source_type', 'source_type', 'is_active'),
    )


class KOLProfile(Base):
    """Individual Key Opinion Leader profiles"""
    __tablename__ = "kol_profiles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    username = Column(String)  # Social media username/handle
    platform = Column(String)  # Primary platform

    # KOL classification
    kol_type = Column(String, index=True)  # analyst, researcher, clinician, investor, executive
    specialty = Column(String, index=True)  # Therapeutic area focus
    affiliation = Column(String)  # Institution/Company

    # Credibility metrics
    credibility_score = Column(Float, default=0.5)  # 0-1, based on track record
    influence_score = Column(Float, default=0.5)  # 0-1, follower count, citations, etc.
    accuracy_score = Column(Float, default=0.5)  # 0-1, historical prediction accuracy

    # Contact/Profile
    profile_url = Column(String)
    email = Column(String)

    # Statistics
    total_signals = Column(Integer, default=0)
    correct_predictions = Column(Integer, default=0)
    incorrect_predictions = Column(Integer, default=0)

    # Status
    is_active = Column(Boolean, default=True, index=True)
    last_activity = Column(DateTime, index=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        Index('idx_kol_profile_type_specialty', 'kol_type', 'specialty'),
        Index('idx_kol_profile_credibility', 'credibility_score'),
    )


class KOLSignal(Base):
    """Individual KOL signals and opinions"""
    __tablename__ = "kol_signals"

    id = Column(Integer, primary_key=True, index=True)

    # Source tracking
    source_id = Column(Integer, ForeignKey('kol_sources.id'), nullable=False, index=True)
    kol_profile_id = Column(Integer, ForeignKey('kol_profiles.id'), index=True)

    # Signal content
    signal_type = Column(String, nullable=False, index=True)  # bullish, bearish, neutral, upgrade, downgrade
    signal_text = Column(Text, nullable=False)
    signal_sentiment = Column(Float)  # -1 (bearish) to 1 (bullish)

    # Entity links
    company_ticker = Column(String, index=True)
    drug_name = Column(String, index=True)
    catalyst_id = Column(Integer, ForeignKey('catalysts.id'), index=True)

    # Signal metadata
    signal_date = Column(DateTime, nullable=False, index=True)
    platform = Column(String)  # Twitter, LinkedIn, etc.
    post_url = Column(String)

    # Signal quality and impact
    quality_score = Column(Float)  # 0-1, signal quality assessment
    impact_score = Column(Float)  # 0-1, expected market impact
    confidence_level = Column(Float)  # 0-1, KOL's stated confidence

    # Verification and outcomes
    is_verified = Column(Boolean, default=False)
    outcome = Column(String)  # correct, incorrect, pending
    outcome_date = Column(DateTime)

    # Raw data
    raw_data = Column(JSON)  # Original scraped data

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index('idx_kol_signal_date_type', 'signal_date', 'signal_type'),
        Index('idx_kol_signal_ticker', 'company_ticker', 'signal_date'),
        Index('idx_kol_signal_quality', 'quality_score'),
        Index('idx_kol_signal_catalyst', 'catalyst_id'),
    )


class KOLScore(Base):
    """Aggregated KOL scoring for companies/assets"""
    __tablename__ = "kol_scores"

    id = Column(Integer, primary_key=True, index=True)

    # Entity identification
    entity_type = Column(String, nullable=False, index=True)  # company, drug, catalyst
    entity_id = Column(String, nullable=False, index=True)  # ticker, drug_id, catalyst_id
    entity_name = Column(String)

    # Aggregated scores
    aggregate_sentiment = Column(Float)  # -1 to 1, weighted average of signals
    bullish_signal_count = Column(Integer, default=0)
    bearish_signal_count = Column(Integer, default=0)
    neutral_signal_count = Column(Integer, default=0)

    # Weighted scores (considering KOL credibility)
    weighted_sentiment = Column(Float)  # Credibility-weighted sentiment
    confidence_score = Column(Float)  # 0-1, based on signal quality and KOL credibility

    # Predictive scores
    catalyst_probability_adjustment = Column(Float)  # -0.5 to +0.5, adjustment to base probability
    expected_price_impact = Column(Float)  # Expected % price movement

    # Time window
    score_date = Column(DateTime, nullable=False, index=True)
    lookback_days = Column(Integer, default=30)  # Days of signals considered

    # Signal composition
    signal_count = Column(Integer, default=0)
    top_kols_count = Column(Integer, default=0)  # Number of high-credibility KOLs

    # Metadata
    calculation_timestamp = Column(DateTime, server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index('idx_kol_score_entity', 'entity_type', 'entity_id', 'score_date'),
        Index('idx_kol_score_sentiment', 'weighted_sentiment'),
    )


class KOLAlgorithmRun(Base):
    """Track KOL ranking algorithm executions"""
    __tablename__ = "kol_algorithm_runs"

    id = Column(Integer, primary_key=True, index=True)

    run_timestamp = Column(DateTime, nullable=False, index=True)
    algorithm_version = Column(String, nullable=False)  # Version tracking

    # Run parameters
    lookback_days = Column(Integer)
    min_kol_credibility = Column(Float)
    min_signal_quality = Column(Float)

    # Run statistics
    signals_processed = Column(Integer)
    entities_scored = Column(Integer)
    top_kols_included = Column(Integer)

    # Results summary
    top_bullish_entity = Column(String)
    top_bearish_entity = Column(String)
    highest_confidence_signal = Column(String)

    # Performance metrics
    execution_time_ms = Column(Integer)
    status = Column(String)  # success, failed, partial
    error_message = Column(Text)

    # Metadata
    run_by = Column(String)  # User/system identifier
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index('idx_kol_run_timestamp', 'run_timestamp'),
    )


# ============================================================================
# IMPLIED VOLATILITY (IV) TRACKING MODELS
# ============================================================================

class OptionsIV(Base):
    """Options implied volatility data by ticker and tenor"""
    __tablename__ = "options_iv"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String, nullable=False, index=True)
    date = Column(DateTime, nullable=False, index=True)
    tenor_days = Column(Integer, nullable=False, index=True)  # 7, 14, 30, 60, 90

    # IV metrics
    iv_mid = Column(Float, nullable=False)  # Mid-point implied volatility (%)
    iv_bid = Column(Float)  # Bid IV
    iv_ask = Column(Float)  # Ask IV
    
    # Skew metrics (25-delta put-call skew)
    skew_25d = Column(Float)  # 25-delta put IV - 25-delta call IV
    skew_10d = Column(Float)  # 10-delta skew for deeper OTM
    
    # Open interest and volume
    total_oi = Column(Integer)  # Total open interest across all strikes
    total_volume = Column(Integer)  # Daily volume
    call_oi = Column(Integer)  # Call open interest
    put_oi = Column(Integer)  # Put open interest
    put_call_ratio = Column(Float)  # Put OI / Call OI
    
    # Historical context (computed fields)
    iv_pctile_1y = Column(Float)  # IV percentile over past year (0-100)
    iv_pctile_6m = Column(Float)  # IV percentile over past 6 months
    skew_25d_20d_median = Column(Float)  # 20-day median skew for comparison
    
    # Term structure flags
    is_backwardation = Column(Boolean, default=False)  # 7D > 30D (inverted term structure)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index('idx_options_iv_ticker_date', 'ticker', 'date'),
        Index('idx_options_iv_tenor', 'tenor_days'),
        Index('idx_options_iv_ticker_tenor_date', 'ticker', 'tenor_days', 'date'),
    )


class PriceData(Base):
    """Price and realized volatility data"""
    __tablename__ = "price_data"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String, nullable=False, index=True)
    date = Column(DateTime, nullable=False, index=True)
    
    # OHLCV data
    open = Column(Float)
    high = Column(Float)
    low = Column(Float)
    close = Column(Float, nullable=False)
    volume = Column(Integer)
    
    # Returns
    returns_1d = Column(Float)  # 1-day return
    returns_5d = Column(Float)  # 5-day return
    returns_20d = Column(Float)  # 20-day return
    
    # Realized volatility
    realized_vol_20d = Column(Float)  # 20-day realized volatility (%)
    realized_vol_60d = Column(Float)  # 60-day realized volatility
    
    # Volume metrics
    volume_20d_avg = Column(Float)  # 20-day average volume
    relative_volume = Column(Float)  # Volume / 20D avg volume
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index('idx_price_ticker_date', 'ticker', 'date'),
    )


class IVCatalystSignal(Base):
    """Pre-computed IV catalyst signals"""
    __tablename__ = "iv_catalyst_signals"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String, nullable=False, index=True)
    signal_date = Column(DateTime, nullable=False, index=True)
    catalyst_id = Column(Integer, ForeignKey('catalysts.id'), index=True)
    
    # Event details
    event_date = Column(DateTime, nullable=False, index=True)
    event_type = Column(String)
    days_to_event = Column(Integer)
    
    # IV metrics at signal generation
    iv7 = Column(Float)
    iv30 = Column(Float)
    iv_rv_ratio = Column(Float)  # IV7 / Realized Vol 20D
    term_backwardation = Column(Float)  # IV7 - IV30 (positive = backwardation)
    skew25d = Column(Float)
    skew_change = Column(Float)  # Current skew - 20D median
    iv7_pctile = Column(Float)  # IV7 percentile (1Y lookback)
    
    # Price metrics
    price = Column(Float)
    ret5d = Column(Float)  # 5-day return
    
    # Signal flags (each 0 or 1)
    backw_flag = Column(Integer, default=0)  # Term structure backwardation
    ivrv_flag = Column(Integer, default=0)  # IV/RV ratio elevated
    skew_flag = Column(Integer, default=0)  # Skew change significant
    oi_flag = Column(Integer, default=0)  # OI spike detected
    
    # Combined signal score (sum of flags, 0-4)
    signal_score = Column(Integer, index=True)
    
    # Signal quality
    confidence = Column(Float)  # 0-1 confidence score
    quality = Column(String, index=True)  # High, Medium, Low
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index('idx_iv_signal_ticker_date', 'ticker', 'signal_date'),
        Index('idx_iv_signal_event_date', 'event_date'),
        Index('idx_iv_signal_score', 'signal_score'),
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
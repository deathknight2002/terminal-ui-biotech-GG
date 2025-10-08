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
    title = Column(String, index=True)
    company = Column(String, index=True)
    drug = Column(String, index=True)
    event_type = Column(String, index=True)  # FDA Approval, Data Readout, etc.
    event_date = Column(DateTime, index=True)
    probability = Column(Float)  # 0.0 - 1.0
    impact = Column(String)  # High, Medium, Low
    description = Column(Text)
    status = Column(String, default="Upcoming")
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
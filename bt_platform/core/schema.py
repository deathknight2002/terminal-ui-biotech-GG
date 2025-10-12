"""
Enhanced Database Schema for Catalyst Prediction Platform
==========================================================

Canonical schema set including:
- Company, Program, Trial
- CatalystEvent (with event_type, endpoint, expected_date±range, sources)
- Evidence, ProviderRaw
- FeatureSnapshot (hash, features_json, created_at)
- Prediction (p, U, D, CI_low/high, implied_move, FinalRankScore, model_version)
- PriceBar, OptionsSnapshot
- Filing, Transcript

All tables include proper indexing, lineage tracking (provider_file_sha256, ingested_at),
and support for the ML pipeline and lakehouse architecture.
"""

from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Text, Boolean, JSON, ForeignKey, 
    Index, BigInteger, Date, Numeric, Table
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from typing import Optional

Base = declarative_base()


# ============================================================================
# Company and Program Management
# ============================================================================

class Company(Base):
    """Biotech/pharma company entity"""
    __tablename__ = "companies"
    
    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String(10), unique=True, index=True, nullable=False)
    name = Column(String(255), index=True, nullable=False)
    company_type = Column(String(50), index=True)  # Big Pharma, Biotech, SMid, China Pharma
    
    # Financial data
    market_cap = Column(BigInteger)  # in USD cents
    enterprise_value = Column(BigInteger)
    cash_position = Column(BigInteger)
    burn_rate_quarterly = Column(BigInteger)
    
    # Operational
    headquarters = Column(String(100))
    founded_year = Column(Integer)
    employees = Column(Integer)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    programs = relationship("Program", back_populates="company")
    catalyst_events = relationship("CatalystEvent", back_populates="company")
    filings = relationship("Filing", back_populates="company")
    transcripts = relationship("Transcript", back_populates="company")
    
    __table_args__ = (
        Index('idx_company_ticker_name', 'ticker', 'name'),
        Index('idx_company_type_mcap', 'company_type', 'market_cap'),
    )


class Program(Base):
    """Drug development program"""
    __tablename__ = "programs"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey('companies.id'), nullable=False)
    
    name = Column(String(255), index=True, nullable=False)
    drug_name = Column(String(255), index=True)
    generic_name = Column(String(255))
    
    # Scientific details
    mechanism = Column(String(255))
    target = Column(String(255))
    modality = Column(String(100))  # Small molecule, mAb, cell therapy, gene therapy, etc.
    
    # Development status
    phase = Column(String(50), index=True)  # Preclinical, Phase I, II, III, Filed, Approved
    therapeutic_area = Column(String(100), index=True)  # Oncology, Immunology, etc.
    indication = Column(Text)
    
    # Status tracking
    status = Column(String(50), default="Active", index=True)
    discontinued_date = Column(Date)
    discontinued_reason = Column(Text)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    company = relationship("Company", back_populates="programs")
    trials = relationship("Trial", back_populates="program")
    catalyst_events = relationship("CatalystEvent", back_populates="program")
    
    __table_args__ = (
        Index('idx_program_company_phase', 'company_id', 'phase'),
        Index('idx_program_therapeutic_area', 'therapeutic_area', 'phase'),
    )


# ============================================================================
# Clinical Trials
# ============================================================================

class Trial(Base):
    """Clinical trial entity"""
    __tablename__ = "trials"
    
    id = Column(Integer, primary_key=True, index=True)
    nct_id = Column(String(20), unique=True, index=True, nullable=False)
    program_id = Column(Integer, ForeignKey('programs.id'))
    
    title = Column(Text)
    phase = Column(String(50), index=True)
    status = Column(String(100), index=True)
    
    # Enrollment
    enrollment_target = Column(Integer)
    enrollment_actual = Column(Integer)
    enrollment_velocity = Column(Float)  # patients/month, for feature engineering
    
    # Endpoints
    primary_endpoint = Column(Text)
    endpoint_hardness = Column(Float)  # 0-1 score for feature engineering
    secondary_endpoints = Column(JSON)
    
    # Timeline
    start_date = Column(Date)
    primary_completion_date = Column(Date)
    completion_date = Column(Date)
    
    # Location and sponsor
    sponsor = Column(String(255), index=True)
    locations = Column(JSON)  # Array of location objects
    
    # Outcomes
    results_available = Column(Boolean, default=False)
    results_summary = Column(JSON)
    
    # Lineage
    provider_file_sha256 = Column(String(64), index=True)
    ingested_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    program = relationship("Program", back_populates="trials")
    
    __table_args__ = (
        Index('idx_trial_phase_status', 'phase', 'status'),
        Index('idx_trial_sponsor', 'sponsor'),
    )


# ============================================================================
# Catalyst Events (Core Prediction Target)
# ============================================================================

class CatalystEvent(Base):
    """Market catalyst event - primary prediction target"""
    __tablename__ = "catalyst_events"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey('companies.id'), nullable=False)
    program_id = Column(Integer, ForeignKey('programs.id'))
    
    # Event identification
    event_type = Column(String(100), index=True, nullable=False)
    # Types: FDA_APPROVAL, FDA_REJECTION, PDUFA_DATE, DATA_READOUT, 
    #        ADCOM_MEETING, EMA_DECISION, CONFERENCE_PRESENTATION, etc.
    
    title = Column(String(500), nullable=False)
    description = Column(Text)
    
    # Timeline with uncertainty
    expected_date = Column(Date, index=True)
    date_range_start = Column(Date)
    date_range_end = Column(Date)
    actual_date = Column(Date, index=True)
    timing_clarity_score = Column(Float)  # 0-1, high=PDUFA, low=event-driven
    
    # Clinical/regulatory details
    endpoint = Column(String(255))
    indication = Column(String(255))
    trial_nct_id = Column(String(20))
    
    # Importance scoring
    event_leverage = Column(Float)  # 0-1 for hard vs soft endpoint
    market_depth = Column(Float)  # TAM/market size relevance
    
    # Sources and provenance
    sources = Column(JSON)  # Array of {type, url, scraped_at}
    confidence = Column(Float)  # Source reliability 0-1
    
    # Actual outcome (post-event)
    actual_outcome = Column(String(50))  # SUCCESS, FAILURE, MIXED, NEUTRAL
    actual_move_pct = Column(Float)  # Realized stock move
    
    # Status
    status = Column(String(50), default="UPCOMING", index=True)
    # UPCOMING, OCCURRED, CANCELLED, POSTPONED
    
    # Lineage
    provider_file_sha256 = Column(String(64), index=True)
    ingested_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    company = relationship("Company", back_populates="catalyst_events")
    program = relationship("Program", back_populates="catalyst_events")
    predictions = relationship("Prediction", back_populates="catalyst_event")
    evidences = relationship("Evidence", back_populates="catalyst_event")
    
    __table_args__ = (
        Index('idx_catalyst_event_type_date', 'event_type', 'expected_date'),
        Index('idx_catalyst_company_status', 'company_id', 'status'),
        Index('idx_catalyst_expected_date', 'expected_date'),
    )


# ============================================================================
# Evidence and Source Data
# ============================================================================

class Evidence(Base):
    """Supporting evidence for catalyst events"""
    __tablename__ = "evidence"
    
    id = Column(Integer, primary_key=True, index=True)
    catalyst_event_id = Column(Integer, ForeignKey('catalyst_events.id'), nullable=False)
    
    evidence_type = Column(String(100), index=True)
    # Types: TRIAL_DATA, FDA_FILING, CONFERENCE_ABSTRACT, PRESS_RELEASE, etc.
    
    title = Column(String(500))
    content = Column(Text)
    summary = Column(Text)
    
    source_url = Column(String(1000))
    source_type = Column(String(100))
    published_date = Column(Date)
    
    # Semantic search support
    embedding_vector = Column(JSON)  # For pgvector integration
    
    # Lineage
    provider_file_sha256 = Column(String(64), index=True)
    ingested_at = Column(DateTime(timezone=True), server_default=func.now())
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    catalyst_event = relationship("CatalystEvent", back_populates="evidences")
    
    __table_args__ = (
        Index('idx_evidence_catalyst', 'catalyst_event_id'),
        Index('idx_evidence_type', 'evidence_type'),
    )


class ProviderRaw(Base):
    """Raw provider data storage (also in S3/Iceberg)"""
    __tablename__ = "provider_raw"
    
    id = Column(Integer, primary_key=True, index=True)
    
    provider_name = Column(String(100), index=True, nullable=False)
    # clinicaltrials.gov, fda.gov, ema.europa.eu, sec.gov, etc.
    
    provider_type = Column(String(100), index=True)
    # CLINICAL_TRIAL, REGULATORY, FILING, MARKET_DATA, etc.
    
    entity_id = Column(String(255), index=True)  # NCT ID, ticker, etc.
    
    # Content
    raw_json = Column(JSON, nullable=False)
    content_hash = Column(String(64), unique=True, index=True, nullable=False)
    
    # S3 pointer for full content
    s3_bucket = Column(String(255))
    s3_key = Column(String(1000))
    parquet_partition = Column(String(255))  # e.g., "year=2024/month=01/day=15"
    
    # Lineage
    fetch_timestamp = Column(DateTime(timezone=True), nullable=False)
    ingested_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Processing status
    processed = Column(Boolean, default=False, index=True)
    processed_at = Column(DateTime(timezone=True))
    
    __table_args__ = (
        Index('idx_provider_raw_provider_type', 'provider_name', 'provider_type'),
        Index('idx_provider_raw_hash', 'content_hash'),
        Index('idx_provider_raw_processed', 'processed', 'ingested_at'),
    )


# ============================================================================
# Feature Store and ML Pipeline
# ============================================================================

class FeatureSnapshot(Base):
    """Versioned feature vectors for ML models"""
    __tablename__ = "feature_snapshots"
    
    id = Column(Integer, primary_key=True, index=True)
    catalyst_event_id = Column(Integer, ForeignKey('catalyst_events.id'), nullable=False)
    
    # Feature metadata
    feature_schema_version = Column(String(50), index=True, nullable=False)
    hash = Column(String(64), unique=True, index=True, nullable=False)
    
    # Features as JSON (can also be columnar for performance)
    features_json = Column(JSON, nullable=False)
    
    # Individual feature columns for quick access
    phase_encoded = Column(Float)
    sample_size = Column(Integer)
    endpoint_hardness = Column(Float)
    enrollment_velocity = Column(Float)
    conference_tier = Column(Float)
    options_implied_move = Column(Float)
    short_interest_pct = Column(Float)
    consensus_dispersion = Column(Float)
    pr_cadence_30d = Column(Integer)
    prior_effect_size = Column(Float)
    safety_score = Column(Float)
    class_prior_success_rate = Column(Float)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    __table_args__ = (
        Index('idx_feature_snapshot_event', 'catalyst_event_id'),
        Index('idx_feature_snapshot_version', 'feature_schema_version', 'created_at'),
    )


class Prediction(Base):
    """ML model predictions for catalyst events"""
    __tablename__ = "predictions"
    
    id = Column(Integer, primary_key=True, index=True)
    catalyst_event_id = Column(Integer, ForeignKey('catalyst_events.id'), nullable=False)
    feature_snapshot_id = Column(Integer, ForeignKey('feature_snapshots.id'), nullable=False)
    
    # Model metadata
    model_version = Column(String(100), index=True, nullable=False)
    model_type = Column(String(100))  # HIERARCHICAL_BAYES, GBM, ENSEMBLE
    
    # Success probability
    p = Column(Float, nullable=False)  # Success probability [0, 1]
    p_ci_low = Column(Float)  # Conformal prediction lower bound
    p_ci_high = Column(Float)  # Conformal prediction upper bound
    
    # Return predictions
    U = Column(Float, nullable=False)  # Upside return (success case)
    D = Column(Float, nullable=False)  # Downside return (failure case)
    U_ci_low = Column(Float)
    U_ci_high = Column(Float)
    D_ci_low = Column(Float)
    D_ci_high = Column(Float)
    
    # Market baseline
    implied_move = Column(Float)  # From options straddle
    historical_baseline = Column(Float)  # Historical event-type distribution
    
    # Derived scores
    expected_torque = Column(Float, index=True)  # p*U + (1-p)*D
    surprise_alpha = Column(Float, index=True)  # ExpectedTorque - max(implied, baseline)
    event_leverage = Column(Float)
    final_rank_score = Column(Float, index=True)  # w1*Torque + w2*Alpha + w3*Leverage
    
    # Calibration metrics
    brier_score = Column(Float)
    pinball_loss = Column(Float)
    
    # Metadata
    predicted_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Relationships
    catalyst_event = relationship("CatalystEvent", back_populates="predictions")
    
    __table_args__ = (
        Index('idx_prediction_event_model', 'catalyst_event_id', 'model_version'),
        Index('idx_prediction_rank_score', 'final_rank_score'),
        Index('idx_prediction_date', 'predicted_at'),
    )


# ============================================================================
# Market Data
# ============================================================================

class PriceBar(Base):
    """Price and volume data"""
    __tablename__ = "price_bars"
    
    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String(10), index=True, nullable=False)
    
    # OHLCV
    timestamp = Column(DateTime(timezone=True), index=True, nullable=False)
    open = Column(Numeric(12, 4))
    high = Column(Numeric(12, 4))
    low = Column(Numeric(12, 4))
    close = Column(Numeric(12, 4), nullable=False)
    volume = Column(BigInteger)
    
    # Adjusted
    adj_close = Column(Numeric(12, 4))
    
    # Calculated fields
    returns_1d = Column(Float)
    returns_xbi_residual = Column(Float)  # Residualized vs XBI for idiosyncratic moves
    
    # Lineage
    provider_file_sha256 = Column(String(64), index=True)
    ingested_at = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        Index('idx_price_bar_ticker_timestamp', 'ticker', 'timestamp'),
    )


class OptionsSnapshot(Base):
    """Options data for implied volatility and moves"""
    __tablename__ = "options_snapshots"
    
    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String(10), index=True, nullable=False)
    snapshot_date = Column(Date, index=True, nullable=False)
    
    # Expiration closest to event
    expiration_date = Column(Date)
    days_to_expiration = Column(Integer)
    
    # ATM straddle for implied move
    atm_strike = Column(Numeric(12, 4))
    atm_call_price = Column(Numeric(12, 4))
    atm_put_price = Column(Numeric(12, 4))
    straddle_price = Column(Numeric(12, 4))
    implied_move_pct = Column(Float, index=True)
    
    # IV measurements
    iv_30d = Column(Float)
    iv_90d = Column(Float)
    iv_rank = Column(Float)
    
    # Skew
    put_call_ratio = Column(Float)
    
    # Lineage
    provider_file_sha256 = Column(String(64), index=True)
    ingested_at = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        Index('idx_options_ticker_date', 'ticker', 'snapshot_date'),
    )


# ============================================================================
# Filings and Transcripts
# ============================================================================

class Filing(Base):
    """SEC filings (10-K, 10-Q, 8-K, etc.)"""
    __tablename__ = "filings"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey('companies.id'), nullable=False)
    
    filing_type = Column(String(20), index=True, nullable=False)  # 10-K, 8-K, etc.
    accession_number = Column(String(50), unique=True, index=True)
    
    filing_date = Column(Date, index=True, nullable=False)
    reporting_date = Column(Date)
    
    # Content
    full_text = Column(Text)
    summary = Column(Text)
    
    # S3 pointer
    s3_key = Column(String(1000))
    
    # Lineage
    provider_file_sha256 = Column(String(64), index=True)
    ingested_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    company = relationship("Company", back_populates="filings")
    
    __table_args__ = (
        Index('idx_filing_company_type_date', 'company_id', 'filing_type', 'filing_date'),
    )


class Transcript(Base):
    """Earnings call and conference transcripts"""
    __tablename__ = "transcripts"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey('companies.id'), nullable=False)
    
    transcript_type = Column(String(100), index=True)  # EARNINGS, CONFERENCE, etc.
    event_name = Column(String(500))
    event_date = Column(Date, index=True, nullable=False)
    
    # Content
    full_text = Column(Text)
    summary = Column(Text)
    
    # Analysis
    sentiment_score = Column(Float)
    key_topics = Column(JSON)
    
    # S3 pointer
    s3_key = Column(String(1000))
    
    # Lineage
    provider_file_sha256 = Column(String(64), index=True)
    ingested_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    company = relationship("Company", back_populates="transcripts")
    
    __table_args__ = (
        Index('idx_transcript_company_date', 'company_id', 'event_date'),
    )


# ============================================================================
# Utility Functions
# ============================================================================

async def init_db(engine):
    """Initialize database with all tables"""
    from sqlalchemy.ext.asyncio import AsyncEngine
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


# Export all models
__all__ = [
    'Base',
    'Company',
    'Program',
    'Trial',
    'CatalystEvent',
    'Evidence',
    'ProviderRaw',
    'FeatureSnapshot',
    'Prediction',
    'PriceBar',
    'OptionsSnapshot',
    'Filing',
    'Transcript',
    'init_db',
]

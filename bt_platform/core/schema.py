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
    JSON,
    BigInteger,
    Boolean,
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Table,
    Text,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

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

    # XBI tracking
    is_xbi_constituent = Column(Boolean, default=False, index=True)
    xbi_added_date = Column(Date)
    xbi_removed_date = Column(Date)

    # Profile data
    description = Column(Text)
    website = Column(String(500))
    investor_relations_url = Column(String(500))

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    programs = relationship("Program", back_populates="company")
    catalyst_events = relationship("CatalystEvent", back_populates="company")
    filings = relationship("Filing", back_populates="company")
    transcripts = relationship("Transcript", back_populates="company")
    sources = relationship("CompanySource", back_populates="company")
    articles = relationship("CompanyArticle", back_populates="company")
    ownership_records = relationship("CompanyOwnership", back_populates="company")

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

    # Trial design
    design = Column(String(100))  # Randomized, Open-label, etc.
    control_type = Column(String(100))  # Placebo, Active, Historical

    # Enrollment
    enrollment_target = Column(Integer)
    enrollment_actual = Column(Integer)
    enrollment_velocity = Column(Float)  # patients/month, for feature engineering

    # Endpoints
    primary_endpoint = Column(Text)
    primary_endpoint_type = Column(String(100))  # For scoring
    endpoint_hardness = Column(Float)  # 0-1 score for feature engineering
    secondary_endpoints = Column(JSON)

    # Timeline
    start_date = Column(Date)
    primary_completion_date = Column(Date, index=True)
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
    catalyst_events = relationship("CatalystEvent", back_populates="trial")

    __table_args__ = (
        Index('idx_trial_phase_status', 'phase', 'status'),
        Index('idx_trial_sponsor', 'sponsor'),
        Index('idx_trial_completion', 'primary_completion_date'),
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
    trial_id = Column(Integer, ForeignKey('trials.id'))

    # Event identification
    event_type = Column(String(100), index=True, nullable=False)
    # Types: IND_ACCEPTANCE, ADCOM_SCHEDULED, PDUFA_DATE, CHMP_OPINION,
    #        APPROVAL, CRL, FPI, LAST_PATIENT_IN, TOPLINE_READOUT,
    #        FULL_DATA_CONFERENCE, DOSE_EXPANSION_DECISION, LAUNCH,
    #        LABEL_EXPANSION, PAYER_DECISION, MILESTONE_TRIGGER, ATM_ACTIVATION

    title = Column(String(500), nullable=False)
    description = Column(Text)

    # Timeline with uncertainty and confidence
    event_window_start = Column(Date, index=True)
    event_window_end = Column(Date, index=True)
    expected_date = Column(Date, index=True)  # Best estimate within window
    actual_date = Column(Date, index=True)

    # Date confidence levels
    date_confidence = Column(String(50), index=True)
    # Values: EXACT_DATE, DATE_WINDOW, QUARTER, BY_YEAR_END, HALF, VAGUE

    timing_clarity_score = Column(Float)  # 0-1, high=PDUFA, low=event-driven

    # Clinical/regulatory details
    endpoint = Column(String(255))
    primary_endpoint_type = Column(String(100))  # SURVIVAL, RESPONSE_RATE, etc.
    control_type = Column(String(100))  # PLACEBO, ACTIVE, HISTORICAL
    indication = Column(String(255))
    trial_nct_id = Column(String(20), index=True)
    trial_phase = Column(String(50))
    trial_design = Column(String(100))
    target_gene = Column(String(100))

    # Sample size
    n = Column(Integer)  # Trial enrollment

    # Regulatory designations
    orphan = Column(Boolean, default=False)
    fast_track = Column(Boolean, default=False)
    breakthrough = Column(Boolean, default=False)

    # Importance scoring (transparent formula components)
    event_leverage = Column(Float)  # 0-1 for hard vs soft endpoint
    endpoint_rigor = Column(Float)  # Quality of endpoint
    market_depth = Column(Float)  # TAM/market size relevance
    phase_weight = Column(Float)  # Weight by development phase
    unmet_need = Column(Float)  # Unmet need score
    complexity_penalty = Column(Float)  # Penalty for complex design
    quality_score = Column(Float)  # Computed catalyst quality score 0-100

    # Probability of Success (PoS)
    prob_of_success = Column(Float)  # 0-1 baseline PoS by phase/indication
    pos_overridden = Column(Boolean, default=False)  # Has analyst overridden?

    # Expected impact
    expected_impact = Column(String(50))
    # Values: REV_MOVING, LABEL_EXPANDING, DE_RISKING, LOW_IMPACT

    # Sources and provenance (deprecated - use entity_source_links instead)
    sources = Column(JSON)  # Legacy: Array of {type, url, scraped_at}
    confidence = Column(Float)  # Source reliability 0-1

    # Actual outcome (post-event)
    actual_outcome = Column(String(50))  # SUCCESS, FAILURE, MIXED, NEUTRAL
    actual_move_pct = Column(Float)  # Realized stock move

    # Status
    status = Column(String(50), default="UPCOMING", index=True)
    # UPCOMING, OCCURRED, CANCELLED, POSTPONED

    # Review and curation
    last_reviewed_at = Column(DateTime(timezone=True))

    # Lineage
    provider_file_sha256 = Column(String(64), index=True)
    ingested_at = Column(DateTime(timezone=True), server_default=func.now())

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    company = relationship("Company", back_populates="catalyst_events")
    program = relationship("Program", back_populates="catalyst_events")
    trial = relationship("Trial", back_populates="catalyst_events")
    predictions = relationship("Prediction", back_populates="catalyst_event")
    evidences = relationship("Evidence", back_populates="catalyst_event")

    __table_args__ = (
        Index('idx_catalyst_event_type_date', 'event_type', 'event_window_start'),
        Index('idx_catalyst_company_status', 'company_id', 'status'),
        Index('idx_catalyst_window', 'event_window_start', 'event_window_end'),
        Index('idx_catalyst_confidence', 'date_confidence', 'status'),
        Index('idx_catalyst_phase', 'trial_phase', 'event_type'),
    )


# ============================================================================
# Evidence and Source Data
# ============================================================================

class Evidence(Base):
    """Supporting evidence for catalyst events"""
    __tablename__ = "evidence"

    id = Column(Integer, primary_key=True, index=True)
    catalyst_event_id = Column(Integer, ForeignKey('catalyst_events.id'), nullable=True)

    evidence_type = Column(String(100), index=True)
    # Types: TRIAL_DATA, FDA_FILING, CONFERENCE_ABSTRACT, PRESS_RELEASE,
    #        MECHANISM_INSIGHT, CLINICAL_READOUT, GENETIC_EVIDENCE, etc.

    title = Column(String(500))
    content = Column(Text)
    summary = Column(Text)

    source_url = Column(String(1000))
    source_type = Column(String(100))
    published_date = Column(Date, index=True)

    # Versioning support for persistent evidence tracking
    version = Column(Integer, default=1, nullable=False)
    parent_version_id = Column(Integer, ForeignKey('evidence.id'), nullable=True)
    is_current = Column(Boolean, default=True, index=True)

    # Metadata for science journal
    event_date = Column(DateTime(timezone=True), index=True)  # When the event occurred
    entity_type = Column(String(50), index=True)  # DRUG, COMPANY, TARGET, INDICATION
    entity_id = Column(String(255), index=True)  # NCT ID, ticker, target name, etc.

    # Evidence classification
    evidence_class = Column(String(50), index=True)
    # Classes: GENETIC, PRECLINICAL, TRANSLATIONAL, CLINICAL, RWE, REGULATORY

    strength_score = Column(Float)  # 0-1 evidence strength
    citations = Column(JSON)  # Array of citation objects
    linkage_verified = Column(Boolean, default=False)

    # Semantic search support
    embedding_vector = Column(JSON)  # For pgvector integration

    # Lineage
    provider_file_sha256 = Column(String(64), index=True)
    ingested_at = Column(DateTime(timezone=True), server_default=func.now())

    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    catalyst_event = relationship("CatalystEvent", back_populates="evidences")
    parent_version = relationship("Evidence", remote_side=[id], foreign_keys=[parent_version_id])
    science_events = relationship("ScienceEvent", secondary="science_event_evidence", back_populates="evidences")

    __table_args__ = (
        Index('idx_evidence_catalyst', 'catalyst_event_id'),
        Index('idx_evidence_type', 'evidence_type'),
        Index('idx_evidence_entity', 'entity_type', 'entity_id'),
        Index('idx_evidence_class', 'evidence_class'),
        Index('idx_evidence_current', 'is_current', 'created_at'),
        Index('idx_evidence_published', 'published_date'),
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
# Source Provenance and Lineage
# ============================================================================

class SourceProvenance(Base):
    """
    Granular source provenance for every data claim.
    
    Tracks the exact source of every fact with URL, timestamp, content hash,
    parser version, and verbatim excerpt. Enables "one click from UI to the 
    raw line that justified the data."
    """
    __tablename__ = "source_provenance"

    id = Column(Integer, primary_key=True, index=True)

    # Source identification
    source_url = Column(String(1000), nullable=False, index=True)
    source_type = Column(String(100), nullable=False, index=True)
    # Types: CT.GOV, SEC_EDGAR, FDA, EMA, PRESS_RELEASE, IR_CALENDAR,
    #        CONFERENCE_SCHEDULE, COMPANY_WEBSITE

    # Temporal tracking
    accessed_at = Column(DateTime(timezone=True), nullable=False, index=True)

    # Content verification
    content_hash = Column(String(64), nullable=False, index=True)
    # SHA256 hash of the source content for change detection

    # Parser versioning
    parser_version = Column(String(50), nullable=False)
    # e.g., "ctgov_v1.2.0", "edgar_8k_v2.1.0"

    # Extraction details
    selector = Column(String(500))
    # CSS selector, XPath, or JSON path used to extract data

    verbatim_excerpt = Column(Text, nullable=False)
    # The exact text/data that was extracted

    # Metadata
    source_metadata = Column(JSON)
    # Additional source-specific metadata (document type, section, etc.)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index('idx_source_prov_type_accessed', 'source_type', 'accessed_at'),
        Index('idx_source_prov_hash', 'content_hash'),
    )


class EntitySourceLink(Base):
    """
    Links entities to their source provenance.
    
    Many-to-many relationship between entities (catalyst_events, trials, 
    programs, etc.) and source_provenance records.
    """
    __tablename__ = "entity_source_links"

    id = Column(Integer, primary_key=True, index=True)

    # Entity reference (polymorphic)
    entity_type = Column(String(50), nullable=False, index=True)
    # Types: CATALYST_EVENT, TRIAL, PROGRAM, COMPANY, etc.

    entity_id = Column(Integer, nullable=False, index=True)
    # The ID of the entity in its respective table

    # Source provenance reference
    source_provenance_id = Column(Integer, ForeignKey('source_provenance.id'), nullable=False)

    # Link metadata
    relevance_score = Column(Float)  # 0-1, how relevant this source is to the entity
    is_primary = Column(Boolean, default=False)  # Is this the primary source?

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    source_provenance = relationship("SourceProvenance")

    __table_args__ = (
        Index('idx_entity_source_link', 'entity_type', 'entity_id'),
        Index('idx_entity_source_prov', 'source_provenance_id'),
    )


class AliasMap(Base):
    """
    Entity alias mapping for synonym handling.
    
    Maps aliases to canonical entity names to support search and matching.
    E.g., "zuranolone" ≡ "SAGE-217"
    """
    __tablename__ = "alias_map"

    id = Column(Integer, primary_key=True, index=True)

    # Entity reference
    entity_type = Column(String(50), nullable=False, index=True)
    # Types: DRUG, COMPANY, TARGET, INDICATION

    canonical = Column(String(255), nullable=False, index=True)
    # The canonical/preferred name

    alias = Column(String(255), nullable=False, index=True)
    # The alternate name/alias

    # Alias metadata
    confidence = Column(Float, default=1.0)  # 0-1, confidence in the mapping
    note = Column(Text)  # Explanation or context for the alias

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index('idx_alias_entity_type', 'entity_type', 'canonical'),
        Index('idx_alias_search', 'entity_type', 'alias'),
    )


class AnalystNote(Base):
    """
    Analyst notes and annotations on entities.
    
    Allows analysts to override computed values (e.g., PoS) or add
    context to entities.
    """
    __tablename__ = "analyst_notes"

    id = Column(Integer, primary_key=True, index=True)

    # Entity reference (polymorphic)
    entity_type = Column(String(50), nullable=False, index=True)
    entity_id = Column(Integer, nullable=False, index=True)

    # Author and content
    author = Column(String(100), nullable=False)
    note = Column(Text, nullable=False)

    # Note metadata
    note_type = Column(String(50))  # OVERRIDE, COMMENT, FLAG, etc.
    override_field = Column(String(100))  # Field being overridden (if applicable)
    override_value = Column(String(500))  # New value (if applicable)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        Index('idx_analyst_note_entity', 'entity_type', 'entity_id'),
        Index('idx_analyst_note_author', 'author', 'created_at'),
    )


# ============================================================================
# Science Event Store - Persistent, Queryable, Versioned
# ============================================================================

class ScienceEvent(Base):
    """
    Persistent science event store for journalism-style insights.
    
    Canonical storage for:
    - Clinical readouts
    - Mechanism insights
    - Evidence journal entries
    - Mechanistic changes
    - Regulatory updates
    
    Every event is discrete, versioned, and queryable with full provenance.
    """
    __tablename__ = "science_events"

    id = Column(Integer, primary_key=True, index=True)

    # Event classification
    event_type = Column(String(100), index=True, nullable=False)
    # Types: CLINICAL_READOUT, MECHANISM_INSIGHT, EVIDENCE_UPDATE,
    #        REGULATORY_CHANGE, TRIAL_UPDATE, TARGET_VALIDATION, etc.

    event_category = Column(String(50), index=True)
    # Categories: CLINICAL, PRECLINICAL, REGULATORY, MECHANISM, COMMERCIAL

    # Event identity
    title = Column(String(500), nullable=False)
    description = Column(Text)
    summary = Column(Text)  # Short summary for timeline views

    # Temporal information
    event_date = Column(DateTime(timezone=True), index=True, nullable=False)
    published_date = Column(Date, index=True)

    # Entity associations
    entity_type = Column(String(50), index=True)  # DRUG, COMPANY, TARGET, INDICATION, TRIAL
    entity_id = Column(String(255), index=True)  # NCT ID, ticker, target name, etc.
    entity_name = Column(String(255))  # Human-readable name

    # Related entities (JSON array)
    related_entities = Column(JSON)
    # Example: [{"type": "DRUG", "id": "BPX-IL23", "name": "BPX-IL23"}, ...]

    # Source and provenance
    source_type = Column(String(100), index=True)  # FDA, CT.gov, EMA, SEC, PUBMED, etc.
    source_url = Column(String(1000))
    source_metadata = Column(JSON)  # Additional source info

    # Content and insights
    content = Column(Text)  # Full content if available
    key_findings = Column(JSON)  # Structured key findings
    impact_assessment = Column(Text)  # "So what?" explanation

    # Classification and scoring
    evidence_class = Column(String(50), index=True)
    # GENETIC, PRECLINICAL, TRANSLATIONAL, CLINICAL, RWE, REGULATORY

    confidence_score = Column(Float)  # 0-1 confidence in the data
    impact_score = Column(Float)  # 0-1 estimated impact

    # Versioning for updates over time
    version = Column(Integer, default=1, nullable=False)
    parent_version_id = Column(Integer, ForeignKey('science_events.id'), nullable=True)
    is_current = Column(Boolean, default=True, index=True)
    change_summary = Column(Text)  # What changed in this version

    # Metadata
    tags = Column(JSON)  # Array of tags for filtering
    event_metadata = Column(JSON)  # Flexible additional metadata (renamed from 'metadata' to avoid SQLAlchemy conflict)

    # Lineage
    provider_file_sha256 = Column(String(64), index=True)
    ingested_at = Column(DateTime(timezone=True), server_default=func.now())

    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    parent_version = relationship("ScienceEvent", remote_side=[id], foreign_keys=[parent_version_id])
    evidences = relationship("Evidence", secondary="science_event_evidence", back_populates="science_events")

    __table_args__ = (
        Index('idx_science_event_type', 'event_type', 'event_date'),
        Index('idx_science_event_entity', 'entity_type', 'entity_id'),
        Index('idx_science_event_source', 'source_type', 'published_date'),
        Index('idx_science_event_current', 'is_current', 'created_at'),
        Index('idx_science_event_category', 'event_category', 'event_date'),
        Index('idx_science_event_class', 'evidence_class', 'confidence_score'),
    )


# Association table for Science Events and Evidence (many-to-many)
science_event_evidence = Table(
    'science_event_evidence',
    Base.metadata,
    Column('science_event_id', Integer, ForeignKey('science_events.id'), primary_key=True),
    Column('evidence_id', Integer, ForeignKey('evidence.id'), primary_key=True),
    Column('relationship_type', String(50)),  # SUPPORTS, CONTRADICTS, REFINES, etc.
    Column('created_at', DateTime(timezone=True), server_default=func.now()),
    Index('idx_science_event_evidence_event', 'science_event_id'),
    Index('idx_science_event_evidence_evidence', 'evidence_id'),
)


class EventRelationship(Base):
    """
    Explicit relationships between science events for timeline analysis.
    
    Captures how events relate to each other:
    - Sequential relationships (FOLLOWS, PRECEDES)
    - Causal relationships (CAUSES, RESULTS_FROM)
    - Comparative relationships (CONTRADICTS, SUPPORTS, REFINES)
    """
    __tablename__ = "event_relationships"

    id = Column(Integer, primary_key=True, index=True)

    source_event_id = Column(Integer, ForeignKey('science_events.id'), nullable=False, index=True)
    target_event_id = Column(Integer, ForeignKey('science_events.id'), nullable=False, index=True)

    relationship_type = Column(String(50), index=True, nullable=False)
    # Types: FOLLOWS, PRECEDES, CAUSES, RESULTS_FROM, CONTRADICTS,
    #        SUPPORTS, REFINES, UPDATES, INVALIDATES

    description = Column(Text)  # Explanation of the relationship
    confidence = Column(Float)  # 0-1 confidence in the relationship

    # Additional metadata
    event_metadata = Column(JSON)  # Renamed from 'metadata' to avoid SQLAlchemy conflict

    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    __table_args__ = (
        Index('idx_event_rel_source', 'source_event_id', 'relationship_type'),
        Index('idx_event_rel_target', 'target_event_id', 'relationship_type'),
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
# Company Profile Extensions
# ============================================================================

class CompanySource(Base):
    """Company sources like investor presentations, press releases, IR materials"""
    __tablename__ = "company_sources"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey('companies.id'), nullable=False)

    source_type = Column(String(100), index=True, nullable=False)  # PRESENTATION, PRESS_RELEASE, IR_MATERIAL
    title = Column(String(500), nullable=False)
    url = Column(String(1000), nullable=False)
    published_date = Column(Date, index=True)
    description = Column(Text)

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    company = relationship("Company", back_populates="sources")

    __table_args__ = (
        Index('idx_company_source_type_date', 'company_id', 'source_type', 'published_date'),
    )


class CompanyArticle(Base):
    """News articles linked to companies"""
    __tablename__ = "company_articles"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey('companies.id'), nullable=False)

    title = Column(String(500), nullable=False)
    source = Column(String(200))
    url = Column(String(1000))
    published_date = Column(DateTime(timezone=True), index=True)
    summary = Column(Text)

    # Relevance and sentiment
    relevance_score = Column(Float)  # 0-1 relevance to company
    sentiment_score = Column(Float)  # -1 to 1 sentiment

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    company = relationship("Company", back_populates="articles")

    __table_args__ = (
        Index('idx_company_article_date', 'company_id', 'published_date'),
    )


class CompanyOwnership(Base):
    """Institutional ownership tracking"""
    __tablename__ = "company_ownership"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey('companies.id'), nullable=False)

    institution_name = Column(String(255), nullable=False)
    shares_held = Column(BigInteger)
    percent_owned = Column(Float)
    value_usd = Column(BigInteger)  # in cents

    # Reporting details
    reporting_date = Column(Date, index=True, nullable=False)
    form_type = Column(String(20))  # 13F, 13G, etc.

    # Change tracking
    shares_change = Column(BigInteger)
    percent_change = Column(Float)

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    company = relationship("Company", back_populates="ownership_records")

    __table_args__ = (
        Index('idx_ownership_company_date', 'company_id', 'reporting_date'),
        Index('idx_ownership_institution', 'institution_name', 'reporting_date'),
    )


# ============================================================================
# Utility Functions
# ============================================================================

async def init_db(engine):
    """Initialize database with all tables"""

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
    'CompanySource',
    'CompanyArticle',
    'CompanyOwnership',
    'init_db',
]

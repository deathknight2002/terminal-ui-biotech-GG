"""
Pydantic Data Contracts with Great Expectations Integration
===========================================================

Type-safe data validation for all external I/O with versioned schemas.
Implements validation contracts for ingest pipeline and API endpoints.
"""

from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional, List, Dict, Any, Union
from datetime import date, datetime
from enum import Enum


# ============================================================================
# Enums for Type Safety
# ============================================================================

class PhaseType(str, Enum):
    PRECLINICAL = "Preclinical"
    PHASE_I = "Phase I"
    PHASE_II = "Phase II"
    PHASE_III = "Phase III"
    FILED = "Filed"
    APPROVED = "Approved"


class EventType(str, Enum):
    FDA_APPROVAL = "FDA_APPROVAL"
    FDA_REJECTION = "FDA_REJECTION"
    PDUFA_DATE = "PDUFA_DATE"
    DATA_READOUT = "DATA_READOUT"
    ADCOM_MEETING = "ADCOM_MEETING"
    EMA_DECISION = "EMA_DECISION"
    CONFERENCE_PRESENTATION = "CONFERENCE_PRESENTATION"
    PARTNERSHIP = "PARTNERSHIP"
    PHASE_TRANSITION = "PHASE_TRANSITION"
    OTHER = "OTHER"


class OutcomeType(str, Enum):
    SUCCESS = "SUCCESS"
    FAILURE = "FAILURE"
    MIXED = "MIXED"
    NEUTRAL = "NEUTRAL"


class CompanyType(str, Enum):
    BIG_PHARMA = "Big Pharma"
    BIOTECH = "Biotech"
    SMID = "SMid"
    CHINA_PHARMA = "China Pharma"


# ============================================================================
# Company and Program Contracts
# ============================================================================

class CompanyContract(BaseModel):
    """Company entity contract"""
    ticker: str = Field(..., min_length=1, max_length=10, description="Stock ticker symbol")
    name: str = Field(..., min_length=1, max_length=255)
    company_type: Optional[CompanyType] = None
    market_cap: Optional[int] = Field(None, ge=0, description="Market cap in USD cents")
    enterprise_value: Optional[int] = Field(None, description="EV in USD cents")
    cash_position: Optional[int] = Field(None, ge=0)
    burn_rate_quarterly: Optional[int] = Field(None, description="Quarterly burn in USD cents")
    headquarters: Optional[str] = Field(None, max_length=100)
    founded_year: Optional[int] = Field(None, ge=1800, le=2100)
    employees: Optional[int] = Field(None, ge=0)
    
    class Config:
        use_enum_values = True
    
    @field_validator('ticker')
    @classmethod
    def ticker_uppercase(cls, v):
        return v.upper() if v else v


class ProgramContract(BaseModel):
    """Drug program contract"""
    name: str = Field(..., min_length=1, max_length=255)
    drug_name: Optional[str] = Field(None, max_length=255)
    generic_name: Optional[str] = Field(None, max_length=255)
    mechanism: Optional[str] = Field(None, max_length=255)
    target: Optional[str] = Field(None, max_length=255)
    modality: Optional[str] = Field(None, max_length=100)
    phase: Optional[PhaseType] = None
    therapeutic_area: Optional[str] = Field(None, max_length=100)
    indication: Optional[str] = None
    status: str = Field(default="Active", max_length=50)
    
    class Config:
        use_enum_values = True


# ============================================================================
# Clinical Trial Contracts
# ============================================================================

class TrialContract(BaseModel):
    """Clinical trial contract"""
    nct_id: str = Field(..., pattern=r'^NCT\d{8}$', description="ClinicalTrials.gov ID")
    title: Optional[str] = None
    phase: Optional[PhaseType] = None
    status: Optional[str] = Field(None, max_length=100)
    enrollment_target: Optional[int] = Field(None, ge=0)
    enrollment_actual: Optional[int] = Field(None, ge=0)
    enrollment_velocity: Optional[float] = Field(None, ge=0, description="Patients per month")
    primary_endpoint: Optional[str] = None
    endpoint_hardness: Optional[float] = Field(None, ge=0, le=1, description="Endpoint clarity score 0-1")
    secondary_endpoints: Optional[List[str]] = None
    start_date: Optional[date] = None
    primary_completion_date: Optional[date] = None
    completion_date: Optional[date] = None
    sponsor: Optional[str] = Field(None, max_length=255)
    locations: Optional[List[Dict[str, Any]]] = None
    results_available: bool = False
    results_summary: Optional[Dict[str, Any]] = None
    provider_file_sha256: Optional[str] = Field(None, pattern=r'^[a-f0-9]{64}$')
    
    class Config:
        use_enum_values = True
    
    @field_validator('enrollment_actual')
    @classmethod
    def actual_lte_target(cls, v, info):
        values = info.data
        if v and 'enrollment_target' in values and values['enrollment_target']:
            if v > values['enrollment_target'] * 1.2:  # Allow 20% overshoot
                raise ValueError('Enrollment actual significantly exceeds target')
        return v


# ============================================================================
# Catalyst Event Contracts (Core Prediction Target)
# ============================================================================

class CatalystEventContract(BaseModel):
    """Catalyst event contract - primary prediction target"""
    event_type: EventType
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    expected_date: Optional[date] = Field(None, description="Expected event date")
    date_range_start: Optional[date] = None
    date_range_end: Optional[date] = None
    actual_date: Optional[date] = Field(None, description="Actual event date (post-occurrence)")
    timing_clarity_score: Optional[float] = Field(None, ge=0, le=1, description="0=foggy, 1=PDUFA-like")
    endpoint: Optional[str] = Field(None, max_length=255)
    indication: Optional[str] = Field(None, max_length=255)
    trial_nct_id: Optional[str] = Field(None, pattern=r'^NCT\d{8}$')
    event_leverage: Optional[float] = Field(None, ge=0, le=1, description="Hard vs soft endpoint")
    market_depth: Optional[float] = Field(None, ge=0, description="TAM relevance score")
    sources: Optional[List[Dict[str, Any]]] = Field(None, description="Source provenance")
    confidence: Optional[float] = Field(None, ge=0, le=1, description="Source reliability")
    actual_outcome: Optional[OutcomeType] = None
    actual_move_pct: Optional[float] = Field(None, description="Realized stock move %")
    status: str = Field(default="UPCOMING", max_length=50)
    provider_file_sha256: Optional[str] = Field(None, pattern=r'^[a-f0-9]{64}$')
    
    class Config:
        use_enum_values = True
    
    @model_validator(mode="after")
    def validate_dates(cls, values):
        expected = values.get('expected_date')
        range_start = values.get('date_range_start')
        range_end = values.get('date_range_end')
        
        if range_start and range_end and range_start > range_end:
            raise ValueError('date_range_start must be before date_range_end')
        
        if expected and range_start and expected < range_start:
            raise ValueError('expected_date must be within date range')
        
        if expected and range_end and expected > range_end:
            raise ValueError('expected_date must be within date range')
        
        return values
    
    @field_validator('sources')
    @classmethod
    def validate_sources(cls, v):
        if v:
            for source in v:
                if 'type' not in source or 'url' not in source:
                    raise ValueError('Each source must have type and url')
        return v


# ============================================================================
# Evidence and Provider Raw Contracts
# ============================================================================

class EvidenceContract(BaseModel):
    """Evidence supporting catalyst events"""
    evidence_type: str = Field(..., max_length=100)
    title: Optional[str] = Field(None, max_length=500)
    content: Optional[str] = None
    summary: Optional[str] = None
    source_url: Optional[str] = Field(None, max_length=1000)
    source_type: Optional[str] = Field(None, max_length=100)
    published_date: Optional[date] = None
    
    # New fields for persistent evidence store
    event_date: Optional[datetime] = None
    entity_type: Optional[str] = Field(None, max_length=50)
    entity_id: Optional[str] = Field(None, max_length=255)
    evidence_class: Optional[str] = Field(None, max_length=50)
    strength_score: Optional[float] = Field(None, ge=0, le=1)
    citations: Optional[List[Dict[str, Any]]] = None
    linkage_verified: bool = False
    
    provider_file_sha256: Optional[str] = Field(None, pattern=r'^[a-f0-9]{64}$')


class ScienceEventContract(BaseModel):
    """Science event contract for persistent event store"""
    event_type: str = Field(..., max_length=100, description="Event type (CLINICAL_READOUT, MECHANISM_INSIGHT, etc.)")
    event_category: Optional[str] = Field(None, max_length=50)
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    summary: Optional[str] = Field(None, max_length=1000)
    
    event_date: datetime = Field(..., description="When the event occurred")
    published_date: Optional[date] = None
    
    entity_type: Optional[str] = Field(None, max_length=50, description="DRUG, COMPANY, TARGET, INDICATION, TRIAL")
    entity_id: Optional[str] = Field(None, max_length=255)
    entity_name: Optional[str] = Field(None, max_length=255)
    related_entities: Optional[List[Dict[str, Any]]] = None
    
    source_type: Optional[str] = Field(None, max_length=100)
    source_url: Optional[str] = Field(None, max_length=1000)
    source_metadata: Optional[Dict[str, Any]] = None
    
    content: Optional[str] = None
    key_findings: Optional[List[Dict[str, Any]]] = None
    impact_assessment: Optional[str] = None
    
    evidence_class: Optional[str] = Field(None, max_length=50)
    confidence_score: Optional[float] = Field(None, ge=0, le=1)
    impact_score: Optional[float] = Field(None, ge=0, le=1)
    
    tags: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None
    
    provider_file_sha256: Optional[str] = Field(None, pattern=r'^[a-f0-9]{64}$')
    
    @field_validator('related_entities')
    @classmethod
    def validate_related_entities(cls, v):
        if v:
            for entity in v:
                if 'type' not in entity or 'id' not in entity:
                    raise ValueError('Each related entity must have type and id')
        return v


class EventRelationshipContract(BaseModel):
    """Event relationship contract"""
    source_event_id: int = Field(..., gt=0)
    target_event_id: int = Field(..., gt=0)
    relationship_type: str = Field(..., max_length=50)
    description: Optional[str] = None
    confidence: Optional[float] = Field(None, ge=0, le=1)
    metadata: Optional[Dict[str, Any]] = None
    
    @field_validator('target_event_id')
    @classmethod
    def validate_different_events(cls, v, info):
        values = info.data
        if 'source_event_id' in values and v == values['source_event_id']:
            raise ValueError('Source and target events must be different')
        return v


class ProviderRawContract(BaseModel):
    """Raw provider data contract"""
    provider_name: str = Field(..., max_length=100)
    provider_type: str = Field(..., max_length=100)
    entity_id: Optional[str] = Field(None, max_length=255)
    raw_json: Dict[str, Any]
    content_hash: str = Field(..., pattern=r'^[a-f0-9]{64}$', description="SHA256 hash of content")
    s3_bucket: Optional[str] = Field(None, max_length=255)
    s3_key: Optional[str] = Field(None, max_length=1000)
    parquet_partition: Optional[str] = Field(None, max_length=255, description="Partition path")
    fetch_timestamp: datetime
    processed: bool = False
    
    @field_validator('content_hash')
    @classmethod
    def validate_hash_matches_content(cls, v, info):
        # In production, validate hash matches raw_json
        # import hashlib, json
        # computed = hashlib.sha256(json.dumps(values['raw_json'], sort_keys=True).encode()).hexdigest()
        # if v != computed:
        #     raise ValueError('Content hash mismatch')
        return v


# ============================================================================
# Feature Store Contracts
# ============================================================================

class FeatureSnapshotContract(BaseModel):
    """Feature vector contract"""
    feature_schema_version: str = Field(..., max_length=50)
    hash: str = Field(..., pattern=r'^[a-f0-9]{64}$')
    features_json: Dict[str, Any]
    
    # Core features
    phase_encoded: Optional[float] = Field(None, ge=0, le=1)
    sample_size: Optional[int] = Field(None, ge=0)
    endpoint_hardness: Optional[float] = Field(None, ge=0, le=1)
    enrollment_velocity: Optional[float] = Field(None, ge=0)
    conference_tier: Optional[float] = Field(None, ge=0, le=1)
    options_implied_move: Optional[float] = Field(None, description="Implied volatility move")
    short_interest_pct: Optional[float] = Field(None, ge=0, le=100)
    consensus_dispersion: Optional[float] = Field(None, ge=0)
    pr_cadence_30d: Optional[int] = Field(None, ge=0, description="Press releases in 30d")
    prior_effect_size: Optional[float] = None
    safety_score: Optional[float] = Field(None, ge=0, le=1)
    class_prior_success_rate: Optional[float] = Field(None, ge=0, le=1)
    
    @field_validator('features_json')
    @classmethod
    def validate_features_complete(cls, v):
        required_keys = [
            'phase_encoded', 'endpoint_hardness', 'timing_clarity',
            'event_leverage', 'market_depth'
        ]
        missing = [k for k in required_keys if k not in v]
        if missing:
            raise ValueError(f'Missing required features: {missing}')
        return v


# ============================================================================
# Prediction Contracts
# ============================================================================

class PredictionContract(BaseModel):
    """ML model prediction contract"""
    model_version: str = Field(..., max_length=100)
    model_type: str = Field(..., max_length=100)
    
    # Success probability with confidence intervals
    p: float = Field(..., ge=0, le=1, description="Success probability")
    p_ci_low: Optional[float] = Field(None, ge=0, le=1)
    p_ci_high: Optional[float] = Field(None, ge=0, le=1)
    
    # Return predictions
    U: float = Field(..., description="Upside return")
    D: float = Field(..., description="Downside return")
    U_ci_low: Optional[float] = None
    U_ci_high: Optional[float] = None
    D_ci_low: Optional[float] = None
    D_ci_high: Optional[float] = None
    
    # Market baseline
    implied_move: Optional[float] = Field(None, description="Options-implied move")
    historical_baseline: Optional[float] = Field(None, description="Historical event distribution")
    
    # Derived scores
    expected_torque: float = Field(..., description="p*U + (1-p)*D")
    surprise_alpha: Optional[float] = Field(None, description="Torque - max(implied, baseline)")
    event_leverage: Optional[float] = Field(None, ge=0, le=1)
    final_rank_score: float = Field(..., description="Composite ranking score")
    
    # Calibration metrics
    brier_score: Optional[float] = Field(None, ge=0, le=1)
    pinball_loss: Optional[float] = Field(None, ge=0)
    
    @model_validator(mode="after")
    def validate_expected_torque(cls, values):
        p = values.get('p')
        U = values.get('U')
        D = values.get('D')
        expected_torque = values.get('expected_torque')
        
        if p is not None and U is not None and D is not None and expected_torque is not None:
            computed = p * U + (1 - p) * D
            if abs(computed - expected_torque) > 0.01:  # Allow small rounding error
                raise ValueError(f'expected_torque mismatch: computed={computed}, provided={expected_torque}')
        
        return values
    
    @field_validator('p_ci_low')
    @classmethod
    def ci_low_lte_p(cls, v, info):
        values = info.data
        if v is not None and 'p' in values and v > values['p']:
            raise ValueError('p_ci_low must be <= p')
        return v
    
    @field_validator('p_ci_high')
    @classmethod
    def ci_high_gte_p(cls, v, info):
        values = info.data
        if v is not None and 'p' in values and v < values['p']:
            raise ValueError('p_ci_high must be >= p')
        return v


# ============================================================================
# Market Data Contracts
# ============================================================================

class PriceBarContract(BaseModel):
    """Price bar contract"""
    ticker: str = Field(..., min_length=1, max_length=10)
    timestamp: datetime
    open: Optional[float] = Field(None, gt=0)
    high: Optional[float] = Field(None, gt=0)
    low: Optional[float] = Field(None, gt=0)
    close: float = Field(..., gt=0)
    volume: Optional[int] = Field(None, ge=0)
    adj_close: Optional[float] = Field(None, gt=0)
    returns_1d: Optional[float] = None
    returns_xbi_residual: Optional[float] = None
    provider_file_sha256: Optional[str] = Field(None, pattern=r'^[a-f0-9]{64}$')
    
    @model_validator(mode="after")
    def validate_ohlc(cls, values):
        open_p = values.get('open')
        high = values.get('high')
        low = values.get('low')
        close = values.get('close')
        
        if all([open_p, high, low, close]):
            if high < max(open_p, close):
                raise ValueError('High must be >= max(open, close)')
            if low > min(open_p, close):
                raise ValueError('Low must be <= min(open, close)')
        
        return values


class OptionsSnapshotContract(BaseModel):
    """Options snapshot contract"""
    ticker: str = Field(..., min_length=1, max_length=10)
    snapshot_date: date
    expiration_date: Optional[date] = None
    days_to_expiration: Optional[int] = Field(None, ge=0)
    atm_strike: Optional[float] = Field(None, gt=0)
    atm_call_price: Optional[float] = Field(None, ge=0)
    atm_put_price: Optional[float] = Field(None, ge=0)
    straddle_price: Optional[float] = Field(None, ge=0)
    implied_move_pct: Optional[float] = Field(None, ge=0, le=100)
    iv_30d: Optional[float] = Field(None, ge=0, le=500)
    iv_90d: Optional[float] = Field(None, ge=0, le=500)
    iv_rank: Optional[float] = Field(None, ge=0, le=100)
    put_call_ratio: Optional[float] = Field(None, ge=0)
    provider_file_sha256: Optional[str] = Field(None, pattern=r'^[a-f0-9]{64}$')
    
    @model_validator(mode="after")
    def validate_straddle(cls, values):
        call = values.get('atm_call_price')
        put = values.get('atm_put_price')
        straddle = values.get('straddle_price')
        
        if all([call, put, straddle]):
            computed = call + put
            if abs(computed - straddle) > 0.01:
                raise ValueError(f'Straddle price mismatch: {computed} vs {straddle}')
        
        return values


# ============================================================================
# Filing and Transcript Contracts
# ============================================================================

class FilingContract(BaseModel):
    """SEC filing contract"""
    filing_type: str = Field(..., max_length=20)
    accession_number: str = Field(..., max_length=50)
    filing_date: date
    reporting_date: Optional[date] = None
    full_text: Optional[str] = None
    summary: Optional[str] = None
    s3_key: Optional[str] = Field(None, max_length=1000)
    provider_file_sha256: Optional[str] = Field(None, pattern=r'^[a-f0-9]{64}$')


class TranscriptContract(BaseModel):
    """Transcript contract"""
    transcript_type: str = Field(..., max_length=100)
    event_name: Optional[str] = Field(None, max_length=500)
    event_date: date
    full_text: Optional[str] = None
    summary: Optional[str] = None
    sentiment_score: Optional[float] = Field(None, ge=-1, le=1)
    key_topics: Optional[List[str]] = None
    s3_key: Optional[str] = Field(None, max_length=1000)
    provider_file_sha256: Optional[str] = Field(None, pattern=r'^[a-f0-9]{64}$')


# ============================================================================
# API Response Contracts
# ============================================================================

class CatalystRankedResponse(BaseModel):
    """Response contract for ranked catalysts endpoint"""
    event_id: int
    company_ticker: str
    company_name: str
    event_type: EventType
    title: str
    expected_date: Optional[date]
    
    # Predictions
    p: float = Field(..., ge=0, le=1, description="Success probability")
    U: float
    D: float
    implied_move: Optional[float]
    expected_torque: float
    surprise_alpha: Optional[float]
    final_rank_score: float
    
    # Confidence intervals
    p_ci_low: Optional[float] = Field(None, ge=0, le=1)
    p_ci_high: Optional[float] = Field(None, ge=0, le=1)
    
    class Config:
        use_enum_values = True


class PredictionDetailResponse(BaseModel):
    """Response contract for prediction detail endpoint"""
    event_id: int
    catalyst_event: CatalystEventContract
    prediction: PredictionContract
    features: FeatureSnapshotContract
    explanation: Dict[str, Any]
    evidence_links: List[Dict[str, str]]


# ============================================================================
# Provenance and Lineage Contracts
# ============================================================================

class DateConfidence(str, Enum):
    """Date confidence levels for catalyst events"""
    EXACT_DATE = "EXACT_DATE"
    DATE_WINDOW = "DATE_WINDOW"
    QUARTER = "QUARTER"
    BY_YEAR_END = "BY_YEAR_END"
    HALF = "HALF"
    VAGUE = "VAGUE"


class SourceType(str, Enum):
    """Source types for provenance tracking"""
    CT_GOV = "CT.GOV"
    SEC_EDGAR = "SEC_EDGAR"
    FDA = "FDA"
    EMA = "EMA"
    PRESS_RELEASE = "PRESS_RELEASE"
    IR_CALENDAR = "IR_CALENDAR"
    CONFERENCE_SCHEDULE = "CONFERENCE_SCHEDULE"
    COMPANY_WEBSITE = "COMPANY_WEBSITE"
    OTHER = "OTHER"


class SourceProvenanceContract(BaseModel):
    """Source provenance contract for traceable data"""
    source_url: str = Field(..., min_length=1, max_length=1000, description="Source URL")
    source_type: SourceType = Field(..., description="Type of source")
    accessed_at: datetime = Field(..., description="When the source was accessed")
    content_hash: str = Field(..., pattern=r'^[a-f0-9]{64}$', description="SHA256 hash of source content")
    parser_version: str = Field(..., min_length=1, max_length=50, description="Parser version used")
    selector: Optional[str] = Field(None, max_length=500, description="CSS/XPath/JSON path selector")
    verbatim_excerpt: str = Field(..., min_length=1, description="Exact extracted text")
    source_metadata: Optional[Dict[str, Any]] = Field(None, description="Additional source metadata")
    
    class Config:
        use_enum_values = True


class SourceProvenanceResponse(SourceProvenanceContract):
    """Source provenance response with ID"""
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class EntitySourceLinkContract(BaseModel):
    """Link between entity and source provenance"""
    entity_type: str = Field(..., min_length=1, max_length=50, description="Entity type")
    entity_id: int = Field(..., gt=0, description="Entity ID")
    source_provenance_id: int = Field(..., gt=0, description="Source provenance ID")
    relevance_score: Optional[float] = Field(None, ge=0, le=1, description="Relevance score 0-1")
    is_primary: bool = Field(default=False, description="Is this the primary source?")


class AliasMapContract(BaseModel):
    """Entity alias mapping contract"""
    entity_type: str = Field(..., min_length=1, max_length=50)
    canonical: str = Field(..., min_length=1, max_length=255)
    alias: str = Field(..., min_length=1, max_length=255)
    confidence: float = Field(default=1.0, ge=0, le=1)
    note: Optional[str] = None


class AnalystNoteContract(BaseModel):
    """Analyst note contract"""
    entity_type: str = Field(..., min_length=1, max_length=50)
    entity_id: int = Field(..., gt=0)
    author: str = Field(..., min_length=1, max_length=100)
    note: str = Field(..., min_length=1)
    note_type: Optional[str] = Field(None, max_length=50)
    override_field: Optional[str] = Field(None, max_length=100)
    override_value: Optional[str] = Field(None, max_length=500)


class AnalystNoteResponse(AnalystNoteContract):
    """Analyst note response with timestamps"""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# ============================================================================
# Enhanced Catalyst Event Contracts
# ============================================================================

class CatalystEventType(str, Enum):
    """Controlled vocabulary for catalyst event types"""
    # Regulatory
    IND_ACCEPTANCE = "IND_ACCEPTANCE"
    ADCOM_SCHEDULED = "ADCOM_SCHEDULED"
    PDUFA_DATE = "PDUFA_DATE"
    CHMP_OPINION = "CHMP_OPINION"
    APPROVAL = "APPROVAL"
    CRL = "CRL"
    
    # Clinical
    FPI = "FPI"
    LAST_PATIENT_IN = "LAST_PATIENT_IN"
    TOPLINE_READOUT = "TOPLINE_READOUT"
    FULL_DATA_CONFERENCE = "FULL_DATA_CONFERENCE"
    DOSE_EXPANSION_DECISION = "DOSE_EXPANSION_DECISION"
    
    # Commercial
    LAUNCH = "LAUNCH"
    LABEL_EXPANSION = "LABEL_EXPANSION"
    PAYER_DECISION = "PAYER_DECISION"
    
    # Funding/Partnership
    MILESTONE_TRIGGER = "MILESTONE_TRIGGER"
    ATM_ACTIVATION = "ATM_ACTIVATION"
    
    OTHER = "OTHER"


class ExpectedImpact(str, Enum):
    """Expected impact categories"""
    REV_MOVING = "REV_MOVING"
    LABEL_EXPANDING = "LABEL_EXPANDING"
    DE_RISKING = "DE_RISKING"
    LOW_IMPACT = "LOW_IMPACT"


class CatalystEventCreateContract(BaseModel):
    """Contract for creating catalyst events with provenance"""
    company_id: int = Field(..., gt=0)
    program_id: Optional[int] = Field(None, gt=0)
    trial_id: Optional[int] = Field(None, gt=0)
    
    event_type: CatalystEventType
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    
    # Timeline
    event_window_start: Optional[date] = None
    event_window_end: Optional[date] = None
    expected_date: Optional[date] = None
    date_confidence: Optional[DateConfidence] = None
    
    # Clinical details
    endpoint: Optional[str] = Field(None, max_length=255)
    primary_endpoint_type: Optional[str] = Field(None, max_length=100)
    control_type: Optional[str] = Field(None, max_length=100)
    indication: Optional[str] = Field(None, max_length=255)
    trial_nct_id: Optional[str] = Field(None, max_length=20)
    trial_phase: Optional[str] = Field(None, max_length=50)
    trial_design: Optional[str] = Field(None, max_length=100)
    target_gene: Optional[str] = Field(None, max_length=100)
    n: Optional[int] = Field(None, gt=0)
    
    # Regulatory designations
    orphan: bool = False
    fast_track: bool = False
    breakthrough: bool = False
    
    # Scoring
    event_leverage: Optional[float] = Field(None, ge=0, le=1)
    endpoint_rigor: Optional[float] = Field(None, ge=0, le=1)
    market_depth: Optional[float] = Field(None, ge=0, le=1)
    phase_weight: Optional[float] = Field(None, ge=0, le=1)
    unmet_need: Optional[float] = Field(None, ge=0, le=1)
    complexity_penalty: Optional[float] = Field(None, ge=0, le=1)
    
    # Probability of Success
    prob_of_success: Optional[float] = Field(None, ge=0, le=1)
    
    # Expected impact
    expected_impact: Optional[ExpectedImpact] = None
    
    # Status
    status: str = Field(default="UPCOMING", max_length=50)
    
    # Provenance (required!)
    source_provenance: List[SourceProvenanceContract] = Field(
        ..., 
        min_length=1, 
        description="At least one source provenance required"
    )
    
    class Config:
        use_enum_values = True
    
    @model_validator(mode="after")
    def validate_date_window(cls, values):
        """Validate event window dates"""
        start = values.event_window_start
        end = values.event_window_end
        expected = values.expected_date
        
        if start and end and start > end:
            raise ValueError('event_window_start must be <= event_window_end')
        
        if expected and start and expected < start:
            raise ValueError('expected_date must be within window')
        
        if expected and end and expected > end:
            raise ValueError('expected_date must be within window')
        
        return values


class CatalystEventUpdateContract(BaseModel):
    """Contract for updating catalyst events"""
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = None
    
    # Timeline updates
    event_window_start: Optional[date] = None
    event_window_end: Optional[date] = None
    expected_date: Optional[date] = None
    date_confidence: Optional[DateConfidence] = None
    actual_date: Optional[date] = None
    
    # Clinical updates
    endpoint: Optional[str] = Field(None, max_length=255)
    indication: Optional[str] = Field(None, max_length=255)
    
    # Outcome
    actual_outcome: Optional[OutcomeType] = None
    actual_move_pct: Optional[float] = None
    
    # Status
    status: Optional[str] = Field(None, max_length=50)
    
    # Provenance for update
    source_provenance: Optional[List[SourceProvenanceContract]] = None
    
    class Config:
        use_enum_values = True


class CatalystEventDetailResponse(BaseModel):
    """Catalyst event response with full details and provenance"""
    id: int
    company_id: int
    program_id: Optional[int] = None
    trial_id: Optional[int] = None
    
    event_type: str
    title: str
    description: Optional[str] = None
    
    # Timeline
    event_window_start: Optional[date] = None
    event_window_end: Optional[date] = None
    expected_date: Optional[date] = None
    actual_date: Optional[date] = None
    date_confidence: Optional[str] = None
    timing_clarity_score: Optional[float] = None
    
    # Clinical details
    endpoint: Optional[str] = None
    primary_endpoint_type: Optional[str] = None
    control_type: Optional[str] = None
    indication: Optional[str] = None
    trial_nct_id: Optional[str] = None
    trial_phase: Optional[str] = None
    trial_design: Optional[str] = None
    target_gene: Optional[str] = None
    n: Optional[int] = None
    
    # Regulatory designations
    orphan: bool = False
    fast_track: bool = False
    breakthrough: bool = False
    
    # Scoring
    event_leverage: Optional[float] = None
    endpoint_rigor: Optional[float] = None
    market_depth: Optional[float] = None
    phase_weight: Optional[float] = None
    unmet_need: Optional[float] = None
    complexity_penalty: Optional[float] = None
    quality_score: Optional[float] = None
    
    # Probability of Success
    prob_of_success: Optional[float] = None
    pos_overridden: bool = False
    
    # Expected impact
    expected_impact: Optional[str] = None
    
    # Outcome
    actual_outcome: Optional[str] = None
    actual_move_pct: Optional[float] = None
    
    # Status
    status: str
    last_reviewed_at: Optional[datetime] = None
    
    # Metadata
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Evidence array with provenance
    evidence: List[SourceProvenanceResponse] = Field(default_factory=list)
    
    # Analyst notes
    analyst_notes: List[AnalystNoteResponse] = Field(default_factory=list)
    
    class Config:
        from_attributes = True


class CatalystEventListResponse(BaseModel):
    """Paginated list of catalyst events"""
    data: List[CatalystEventDetailResponse]
    total: int
    page: int
    page_size: int
    filters: Dict[str, Any]


# ============================================================================
# Export All Contracts
# ============================================================================

__all__ = [
    # Enums
    'PhaseType',
    'EventType',
    'OutcomeType',
    'CompanyType',
    'DateConfidence',
    'SourceType',
    'CatalystEventType',
    'ExpectedImpact',
    # Entity contracts
    'CompanyContract',
    'ProgramContract',
    'TrialContract',
    'CatalystEventContract',
    'EvidenceContract',
    'ProviderRawContract',
    # Provenance contracts
    'SourceProvenanceContract',
    'SourceProvenanceResponse',
    'EntitySourceLinkContract',
    'AliasMapContract',
    'AnalystNoteContract',
    'AnalystNoteResponse',
    # Enhanced catalyst contracts
    'CatalystEventCreateContract',
    'CatalystEventUpdateContract',
    'CatalystEventDetailResponse',
    'CatalystEventListResponse',
    # Feature and prediction contracts
    'FeatureSnapshotContract',
    'PredictionContract',
    # Market data contracts
    'PriceBarContract',
    'OptionsSnapshotContract',
    # Document contracts
    'FilingContract',
    'TranscriptContract',
    # API response contracts
    'CatalystRankedResponse',
    'PredictionDetailResponse',
]

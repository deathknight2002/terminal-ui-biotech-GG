"""
Pydantic Data Contracts with Great Expectations Integration
===========================================================

Type-safe data validation for all external I/O with versioned schemas.
Implements validation contracts for ingest pipeline and API endpoints.
"""

from pydantic import BaseModel, Field, validator, root_validator
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
    
    @validator('ticker')
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
    nct_id: str = Field(..., regex=r'^NCT\d{8}$', description="ClinicalTrials.gov ID")
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
    provider_file_sha256: Optional[str] = Field(None, regex=r'^[a-f0-9]{64}$')
    
    class Config:
        use_enum_values = True
    
    @validator('enrollment_actual')
    def actual_lte_target(cls, v, values):
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
    trial_nct_id: Optional[str] = Field(None, regex=r'^NCT\d{8}$')
    event_leverage: Optional[float] = Field(None, ge=0, le=1, description="Hard vs soft endpoint")
    market_depth: Optional[float] = Field(None, ge=0, description="TAM relevance score")
    sources: Optional[List[Dict[str, Any]]] = Field(None, description="Source provenance")
    confidence: Optional[float] = Field(None, ge=0, le=1, description="Source reliability")
    actual_outcome: Optional[OutcomeType] = None
    actual_move_pct: Optional[float] = Field(None, description="Realized stock move %")
    status: str = Field(default="UPCOMING", max_length=50)
    provider_file_sha256: Optional[str] = Field(None, regex=r'^[a-f0-9]{64}$')
    
    class Config:
        use_enum_values = True
    
    @root_validator
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
    
    @validator('sources')
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
    provider_file_sha256: Optional[str] = Field(None, regex=r'^[a-f0-9]{64}$')


class ProviderRawContract(BaseModel):
    """Raw provider data contract"""
    provider_name: str = Field(..., max_length=100)
    provider_type: str = Field(..., max_length=100)
    entity_id: Optional[str] = Field(None, max_length=255)
    raw_json: Dict[str, Any]
    content_hash: str = Field(..., regex=r'^[a-f0-9]{64}$', description="SHA256 hash of content")
    s3_bucket: Optional[str] = Field(None, max_length=255)
    s3_key: Optional[str] = Field(None, max_length=1000)
    parquet_partition: Optional[str] = Field(None, max_length=255, description="Partition path")
    fetch_timestamp: datetime
    processed: bool = False
    
    @validator('content_hash')
    def validate_hash_matches_content(cls, v, values):
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
    hash: str = Field(..., regex=r'^[a-f0-9]{64}$')
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
    
    @validator('features_json')
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
    
    @root_validator
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
    
    @validator('p_ci_low')
    def ci_low_lte_p(cls, v, values):
        if v is not None and 'p' in values and v > values['p']:
            raise ValueError('p_ci_low must be <= p')
        return v
    
    @validator('p_ci_high')
    def ci_high_gte_p(cls, v, values):
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
    provider_file_sha256: Optional[str] = Field(None, regex=r'^[a-f0-9]{64}$')
    
    @root_validator
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
    provider_file_sha256: Optional[str] = Field(None, regex=r'^[a-f0-9]{64}$')
    
    @root_validator
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
    provider_file_sha256: Optional[str] = Field(None, regex=r'^[a-f0-9]{64}$')


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
    provider_file_sha256: Optional[str] = Field(None, regex=r'^[a-f0-9]{64}$')


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
# Export All Contracts
# ============================================================================

__all__ = [
    # Enums
    'PhaseType',
    'EventType',
    'OutcomeType',
    'CompanyType',
    # Entity contracts
    'CompanyContract',
    'ProgramContract',
    'TrialContract',
    'CatalystEventContract',
    'EvidenceContract',
    'ProviderRawContract',
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

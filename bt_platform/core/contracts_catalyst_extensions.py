"""
Catalyst Event Extensions Contracts
===================================

Pydantic models for catalyst event tracking including:
- Expectation bands
- Outcomes  
- Market reactions
- Peer comparisons

Follows global conventions from problem statement.
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any
from datetime import date, datetime
from enum import Enum
from decimal import Decimal


# ============================================================================
# Enums
# ============================================================================

class CatalystType(str, Enum):
    """Catalyst event types"""
    MA = "M&A"
    PH3_READOUT = "PH3_READOUT"
    SAFETY_PAUSE = "SAFETY_PAUSE"
    APPROVAL = "APPROVAL"
    LABEL_UPDATE = "LABEL_UPDATE"
    PDUFA_DATE = "PDUFA_DATE"
    DATA_READOUT = "DATA_READOUT"
    ADCOM = "ADCOM"
    PARTNERSHIP = "PARTNERSHIP"


class ExpectationSource(str, Enum):
    """Source of expectations"""
    SELL_SIDE = "sell_side"
    MGMT_GUIDE = "mgmt_guide"
    CONSENSUS = "consensus"
    INTERNAL = "internal"


class ExpectationClass(str, Enum):
    """Outcome vs expectation classification"""
    BEAT = "beat"
    INLINE = "inline"
    MISS = "miss"


class Geography(str, Enum):
    """Geographic markets"""
    US = "US"
    EU = "EU"
    GLOBAL = "Global"
    ROW = "ROW"


# ============================================================================
# Core Catalyst Event Structure
# ============================================================================

class CompanyInfo(BaseModel):
    """Company information"""
    name: str
    ticker: str
    exchange: Optional[str] = None
    logo_url: Optional[str] = None


class CatalystInfo(BaseModel):
    """Catalyst details"""
    type: CatalystType
    subtype: Optional[str] = None  # TenderOffer, Interim, Hold/Partial, sNDA
    program: Optional[str] = None  # AOC platform, BBP-418 FORTIFY, etc.
    indication: Optional[str] = None  # LGMD2I/R9, Menopause VMS, etc.
    geography: List[Geography] = Field(default_factory=list)


# ============================================================================
# Expectation Band Contracts
# ============================================================================

class ExpectationMetric(BaseModel):
    """Single expectation metric with confidence band"""
    name: str = Field(..., description="Metric name")
    unit: str = Field(..., description="Unit of measurement")
    expected: Optional[Decimal] = Field(None, description="Point estimate")
    band_low: Optional[Decimal] = Field(None, description="Lower bound")
    band_high: Optional[Decimal] = Field(None, description="Upper bound")
    what_matters: Optional[str] = Field(None, description="Why this metric matters")

    @field_validator('band_low', 'band_high')
    @classmethod
    def validate_bands(cls, v, info):
        """Ensure bands are reasonable"""
        if v is not None and v < 0 and info.field_name == 'band_low':
            # Allow negative values for some metrics (e.g., stock moves)
            pass
        return v


class ExpectationBandContract(BaseModel):
    """Expectation band for API input"""
    event_id: str = Field(..., description="ULID of catalyst event")
    metric: str
    unit: str
    expected: Optional[Decimal] = None
    band_low: Optional[Decimal] = None
    band_high: Optional[Decimal] = None
    source: ExpectationSource = ExpectationSource.SELL_SIDE
    what_matters: Optional[str] = None
    collected_at: datetime

    class Config:
        use_enum_values = True


class ExpectationBandResponse(BaseModel):
    """Expectation band response"""
    id: int
    event_id: str
    metric: str
    unit: str
    expected: Optional[Decimal]
    band_low: Optional[Decimal]
    band_high: Optional[Decimal]
    source: str
    what_matters: Optional[str]
    collected_at: datetime
    quality_flag: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class Expectations(BaseModel):
    """Collection of expectations for an event"""
    source: ExpectationSource
    metrics: List[ExpectationMetric]


# ============================================================================
# Outcome Contracts
# ============================================================================

class OutcomeMetric(BaseModel):
    """Single outcome metric"""
    name: str
    unit: str
    value: Decimal
    pvalue: Optional[float] = None
    n: Optional[int] = None  # Sample size
    window: Optional[str] = None  # Time window


class CatalystOutcomeContract(BaseModel):
    """Catalyst outcome for API input"""
    event_id: str
    metric: str
    unit: str
    value: Decimal
    pvalue: Optional[float] = Field(None, ge=0, le=1)
    n: Optional[int] = Field(None, ge=1)
    confidence_interval_low: Optional[Decimal] = None
    confidence_interval_high: Optional[Decimal] = None
    window: Optional[str] = None
    cohort: Optional[str] = None

    class Config:
        use_enum_values = True


class CatalystOutcomeResponse(BaseModel):
    """Catalyst outcome response"""
    id: int
    event_id: str
    metric: str
    unit: str
    value: Decimal
    pvalue: Optional[float]
    n: Optional[int]
    confidence_interval_low: Optional[Decimal]
    confidence_interval_high: Optional[Decimal]
    window: Optional[str]
    cohort: Optional[str]
    expectation_class: Optional[str]
    expectation_score: Optional[float]
    created_at: datetime

    class Config:
        from_attributes = True


class Outcome(BaseModel):
    """Collection of outcomes for an event"""
    metrics: List[OutcomeMetric]


# ============================================================================
# Market Reaction Contracts
# ============================================================================

class PriceReaction(BaseModel):
    """Price reaction data point"""
    window: str  # D-5, D-1, D0, D+1, D+5, D+10
    abs: Optional[float] = None  # Absolute % change
    rel_vs_XBI: Optional[float] = Field(None, alias="rel_vs_XBI")  # Relative to XBI
    intraday_high_low: Optional[Dict[str, float]] = None


class IVReaction(BaseModel):
    """Implied volatility reaction"""
    tenor: str  # 1w, 1m, 3m
    window: str  # D0, D+1, etc.
    iv: Optional[float] = None
    zscore_vs_1y: Optional[float] = None


class VolumeReaction(BaseModel):
    """Volume reaction"""
    window: str
    volume_multiple_vs_30d: Optional[float] = None


class MarketReactionContract(BaseModel):
    """Market reaction for API input"""
    event_id: str
    ticker: str
    window: str
    window_date: date
    price_abs: Optional[float] = None
    price_rel_vs_xbi: Optional[float] = None
    intraday_high: Optional[float] = None
    intraday_low: Optional[float] = None
    iv_1m_tenor: Optional[float] = None
    iv_1m_zscore: Optional[float] = None
    call_skew: Optional[float] = None
    volume: Optional[int] = None
    volume_multiple_vs_30d: Optional[float] = None


class MarketReactionResponse(BaseModel):
    """Market reaction response"""
    id: int
    event_id: str
    ticker: str
    window: str
    window_date: date
    price_abs: Optional[float]
    price_rel_vs_xbi: Optional[float]
    intraday_high: Optional[float]
    intraday_low: Optional[float]
    iv_1m_tenor: Optional[float]
    iv_1m_zscore: Optional[float]
    call_skew: Optional[float]
    volume: Optional[int]
    volume_multiple_vs_30d: Optional[float]
    created_at: datetime

    class Config:
        from_attributes = True


class MarketReaction(BaseModel):
    """Market reaction collection"""
    rel_windows: List[str] = Field(
        default=["D-5", "D-1", "D0", "D+1", "D+5", "D+10"],
        description="Relative time windows"
    )
    price: List[PriceReaction] = Field(default_factory=list)
    iv: List[IVReaction] = Field(default_factory=list)
    vol: List[VolumeReaction] = Field(default_factory=list)


# ============================================================================
# Peer Comparison Contracts
# ============================================================================

class PeerCompany(BaseModel):
    """Peer company info"""
    ticker: str
    reason_tag: str  # "RNA muscle peer", "AOC-adjacent"
    weight: float = Field(..., ge=0, le=1)


class PeerMetric(BaseModel):
    """Peer comparative metric"""
    metric: str
    value: Decimal
    peer_median: Optional[Decimal] = None
    peer_p75: Optional[Decimal] = None
    delta_to_median: Optional[Decimal] = None


class PeerComparisonContract(BaseModel):
    """Peer comparison for API input"""
    event_id: str
    peer_ticker: str
    peer_name: Optional[str] = None
    reason_tag: str
    weight: float = Field(..., ge=0, le=1)
    moat_moa: bool = False
    moat_stage: bool = False
    moat_indication: bool = False
    moat_delivery: bool = False
    moat_target: bool = False


class PeerComparisonResponse(BaseModel):
    """Peer comparison response"""
    id: int
    event_id: str
    peer_ticker: str
    peer_name: Optional[str]
    reason_tag: str
    weight: float
    moat_moa: bool
    moat_stage: bool
    moat_indication: bool
    moat_delivery: bool
    moat_target: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Peers(BaseModel):
    """Peer analysis collection"""
    moat_axes: List[str] = Field(
        default=["MoA", "Stage", "Indication", "Delivery", "Target"],
        description="Similarity dimensions"
    )
    list: List[PeerCompany] = Field(default_factory=list)
    comp_metrics: List[PeerMetric] = Field(default_factory=list)


# ============================================================================
# Event Source Contracts
# ============================================================================

class SourceInfo(BaseModel):
    """Source information"""
    title: str
    url: str
    ts: datetime
    type: str  # company_pr, broker_note, press_wire, conference


class EventSourceContract(BaseModel):
    """Event source for API input"""
    event_id: str
    title: str
    url: str
    source_type: str
    ts: datetime


class EventSourceResponse(BaseModel):
    """Event source response"""
    id: int
    event_id: str
    title: str
    url: str
    source_type: str
    ts: datetime
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# Complete Catalyst Event Contract
# ============================================================================

class CatalystEventFullContract(BaseModel):
    """
    Complete catalyst event with all metadata.
    Follows global conventions from problem statement.
    """
    event_id: str  # ULID
    as_of: datetime  # UTC timestamp
    company: CompanyInfo
    catalyst: CatalystInfo
    expectations: Optional[Expectations] = None
    outcome: Optional[Outcome] = None
    market_reaction: Optional[MarketReaction] = None
    peers: Optional[Peers] = None
    sources: List[SourceInfo] = Field(default_factory=list)


# ============================================================================
# Safety Event Contracts
# ============================================================================

class SafetyEventDetailContract(BaseModel):
    """Safety event details for clinical holds"""
    event_id: str
    sae_grade: Optional[int] = Field(None, ge=1, le=5, description="CTCAE grade")
    signal_type: Optional[str] = None  # hepatotoxicity, cytopenias
    enrollment_status: Optional[str] = None  # paused, halted, modified
    expected_pause_duration_weeks: Optional[int] = None
    resumption_probability: Optional[float] = Field(None, ge=0, le=1)
    class_risk_baseline: Optional[float] = Field(None, ge=0, le=1)
    class_read_through: Optional[str] = None
    pause_date: Optional[date] = None
    resume_date: Optional[date] = None


class SafetyEventDetailResponse(BaseModel):
    """Safety event details response"""
    id: int
    event_id: str
    sae_grade: Optional[int]
    signal_type: Optional[str]
    enrollment_status: Optional[str]
    expected_pause_duration_weeks: Optional[int]
    resumption_probability: Optional[float]
    class_risk_baseline: Optional[float]
    class_read_through: Optional[str]
    pause_date: Optional[date]
    resume_date: Optional[date]
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# M&A Deal Contracts
# ============================================================================

class MandADealDetailContract(BaseModel):
    """M&A deal details"""
    event_id: str
    acquirer: str
    target: str
    deal_premium: Optional[float] = None
    consideration: Optional[Decimal] = Field(None, description="Deal value in billions")
    spinco_required: bool = False
    ev_sales_ntm: Optional[float] = None
    ev_rd_employee: Optional[float] = None
    ev_lead_asset_phase: Optional[float] = None
    platform_name: Optional[str] = None
    therapeutic_focus: Optional[str] = None
    announced_date: Optional[date] = None
    expected_close: Optional[date] = None
    actual_close: Optional[date] = None


class MandADealDetailResponse(BaseModel):
    """M&A deal details response"""
    id: int
    event_id: str
    acquirer: str
    target: str
    deal_premium: Optional[float]
    consideration: Optional[Decimal]
    spinco_required: bool
    ev_sales_ntm: Optional[float]
    ev_rd_employee: Optional[float]
    ev_lead_asset_phase: Optional[float]
    platform_name: Optional[str]
    therapeutic_focus: Optional[str]
    announced_date: Optional[date]
    expected_close: Optional[date]
    actual_close: Optional[date]
    created_at: datetime

    class Config:
        from_attributes = True

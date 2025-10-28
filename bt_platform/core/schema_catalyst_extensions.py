"""
Catalyst Event Extensions Schema
================================

Additional tables for comprehensive catalyst event tracking including:
- Expectation bands (Street expectations)
- Market reactions (price, IV, volume)
- Peer comparisons
- Event sources and metadata

Extends the existing CatalystEvent model with granular tracking capabilities.
"""

from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Text, Boolean, JSON, ForeignKey,
    Index, Date, Numeric
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .schema import Base


# ============================================================================
# Expectation Band Model
# ============================================================================

class ExpectationBand(Base):
    """
    Street expectations for catalyst metrics with confidence bands.
    Stores what analysts/market expected before the event.
    """
    __tablename__ = "expectation_bands"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(String(100), index=True, nullable=False)  # ULID from CatalystEvent
    
    # Metric details
    metric = Column(String(255), index=True, nullable=False)  # e.g., "α-DG glycosylation"
    unit = Column(String(50))  # %, x, m/s, pp, $B, etc.
    
    # Expectation values
    expected = Column(Numeric(precision=20, scale=6))  # Point estimate
    band_low = Column(Numeric(precision=20, scale=6))  # Lower bound of expectation
    band_high = Column(Numeric(precision=20, scale=6))  # Upper bound of expectation
    
    # Context
    source = Column(String(100), index=True)  # sell_side, mgmt_guide, consensus, internal
    what_matters = Column(Text)  # Why this metric matters
    
    # Collection metadata
    collected_at = Column(DateTime(timezone=True), nullable=False)
    quality_flag = Column(String(50))  # VERIFIED, ESTIMATED, LOW_CONFIDENCE
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        Index('idx_expectation_event_metric', 'event_id', 'metric'),
        Index('idx_expectation_source', 'source', 'collected_at'),
    )


# ============================================================================
# Catalyst Outcome Model
# ============================================================================

class CatalystOutcome(Base):
    """
    Actual outcomes from catalyst events.
    Links to ExpectationBand for comparison.
    """
    __tablename__ = "catalyst_outcomes"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(String(100), index=True, nullable=False)
    
    # Outcome metric
    metric = Column(String(255), index=True, nullable=False)
    unit = Column(String(50))
    value = Column(Numeric(precision=20, scale=6), nullable=False)
    
    # Statistical details (for clinical data)
    pvalue = Column(Float)
    n = Column(Integer)  # Sample size
    confidence_interval_low = Column(Numeric(precision=20, scale=6))
    confidence_interval_high = Column(Numeric(precision=20, scale=6))
    
    # Context
    window = Column(String(50))  # Time window: "3m", "12m", "primary analysis"
    cohort = Column(String(255))  # Patient cohort details
    
    # Expectation delta (computed)
    expectation_class = Column(String(20), index=True)  # beat, inline, miss
    expectation_score = Column(Float)  # Magnitude of beat/miss (0-1)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        Index('idx_outcome_event_metric', 'event_id', 'metric'),
        Index('idx_outcome_class', 'expectation_class'),
    )


# ============================================================================
# Market Reaction Model
# ============================================================================

class MarketReaction(Base):
    """
    Market reaction to catalyst events - price, IV, volume tracking.
    Captures multi-day windows (D-5, D-1, D0, D+1, D+5, D+10).
    """
    __tablename__ = "market_reactions"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(String(100), index=True, nullable=False)
    ticker = Column(String(10), index=True, nullable=False)
    
    # Time window
    window = Column(String(10), index=True, nullable=False)  # D-5, D-1, D0, D+1, D+5, D+10
    window_date = Column(Date, index=True, nullable=False)
    
    # Price data
    price_abs = Column(Float)  # Absolute price change %
    price_rel_vs_xbi = Column(Float)  # Relative to XBI
    intraday_high = Column(Float)  # Intraday high price
    intraday_low = Column(Float)  # Intraday low price
    
    # Implied volatility (if options available)
    iv_1m_tenor = Column(Float)  # 1-month IV
    iv_1m_zscore = Column(Float)  # Z-score vs 1-year history
    call_skew = Column(Float)  # Call vs put skew
    
    # Volume
    volume = Column(Integer)
    volume_multiple_vs_30d = Column(Float)  # Volume as multiple of 30-day average
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        Index('idx_market_reaction_event', 'event_id', 'window'),
        Index('idx_market_reaction_ticker_date', 'ticker', 'window_date'),
    )


# ============================================================================
# Peer Comparison Model
# ============================================================================

class PeerComparison(Base):
    """
    Peer company comparisons for catalyst read-through analysis.
    Maps moat axes (MoA, Stage, Indication, Delivery, Target).
    """
    __tablename__ = "peer_comparisons"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(String(100), index=True, nullable=False)
    
    # Peer identification
    peer_ticker = Column(String(10), index=True, nullable=False)
    peer_name = Column(String(255))
    
    # Similarity dimensions
    reason_tag = Column(String(255), index=True)  # e.g., "RNA muscle peer", "AOC-adjacent"
    weight = Column(Float)  # Relevance weight (0-1)
    
    # Moat axes
    moat_moa = Column(Boolean, default=False)  # Mechanism of action match
    moat_stage = Column(Boolean, default=False)  # Development stage match
    moat_indication = Column(Boolean, default=False)  # Indication match
    moat_delivery = Column(Boolean, default=False)  # Delivery method match
    moat_target = Column(Boolean, default=False)  # Target match
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        Index('idx_peer_comparison_event', 'event_id'),
        Index('idx_peer_comparison_peer', 'peer_ticker'),
        Index('idx_peer_comparison_tag', 'reason_tag'),
    )


# ============================================================================
# Peer Metric Comparison Model
# ============================================================================

class PeerMetricComparison(Base):
    """
    Comparative metrics for peer analysis.
    Tracks how the subject company/event compares to peer benchmarks.
    """
    __tablename__ = "peer_metric_comparisons"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(String(100), index=True, nullable=False)
    
    # Metric details
    metric = Column(String(255), index=True, nullable=False)  # e.g., "1D move post-print"
    value = Column(Numeric(precision=20, scale=6), nullable=False)  # Subject value
    
    # Peer benchmarks
    peer_median = Column(Numeric(precision=20, scale=6))
    peer_p25 = Column(Numeric(precision=20, scale=6))
    peer_p75 = Column(Numeric(precision=20, scale=6))
    peer_min = Column(Numeric(precision=20, scale=6))
    peer_max = Column(Numeric(precision=20, scale=6))
    
    # Delta calculations
    delta_to_median = Column(Numeric(precision=20, scale=6))
    delta_to_p75 = Column(Numeric(precision=20, scale=6))
    percentile_rank = Column(Float)  # 0-1
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        Index('idx_peer_metric_event', 'event_id', 'metric'),
    )


# ============================================================================
# Event Source Model
# ============================================================================

class EventSource(Base):
    """
    Sources for catalyst events with timestamps and metadata.
    Supports per-slide footnote injection.
    """
    __tablename__ = "event_sources"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(String(100), index=True, nullable=False)
    
    # Source details
    title = Column(String(500), nullable=False)
    url = Column(String(1000), nullable=False)
    source_type = Column(String(100), index=True)  # company_pr, broker_note, press_wire, conference
    
    # Timestamps
    ts = Column(DateTime(timezone=True), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index('idx_event_source_event', 'event_id'),
        Index('idx_event_source_type', 'source_type', 'ts'),
    )


# ============================================================================
# Safety Event Details Model (for MAGNITUDE-style pauses)
# ============================================================================

class SafetyEventDetail(Base):
    """
    Detailed safety event tracking for clinical holds/pauses.
    Captures SAE grades, resolution timelines, and resumption probability.
    """
    __tablename__ = "safety_event_details"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(String(100), index=True, nullable=False, unique=True)
    
    # Safety details
    sae_grade = Column(Integer)  # CTCAE grade (1-5)
    signal_type = Column(String(100), index=True)  # hepatotoxicity, cytopenias, etc.
    enrollment_status = Column(String(50))  # paused, halted, modified
    
    # Expected resolution
    expected_pause_duration_weeks = Column(Integer)  # 2-8 weeks typical
    resumption_probability = Column(Float)  # 0-1 estimated probability
    
    # Class-wide implications
    class_risk_baseline = Column(Float)  # Baseline class risk probability
    class_read_through = Column(Text)  # Implications for peer programs
    
    # Timestamps
    pause_date = Column(Date)
    resume_date = Column(Date)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        Index('idx_safety_event_type', 'signal_type'),
        Index('idx_safety_event_status', 'enrollment_status'),
    )


# ============================================================================
# M&A Deal Details Model (for Novartis→Avidity style)
# ============================================================================

class MandADealDetail(Base):
    """
    M&A deal-specific details for acquisition catalysts.
    Tracks premiums, consideration, spinco requirements, and EV metrics.
    """
    __tablename__ = "manda_deal_details"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(String(100), index=True, nullable=False, unique=True)
    
    # Deal structure
    acquirer = Column(String(255), nullable=False)
    target = Column(String(255), nullable=False)
    deal_premium = Column(Float)  # % premium
    consideration = Column(Numeric(precision=20, scale=2))  # Deal value in billions
    spinco_required = Column(Boolean, default=False)
    
    # Valuation metrics
    ev_sales_ntm = Column(Float)  # EV/Sales next-twelve-months multiple
    ev_rd_employee = Column(Float)  # EV per R&D employee
    ev_lead_asset_phase = Column(Float)  # Normalized by lead asset phase
    
    # Context
    platform_name = Column(String(255))  # e.g., "AOC platform"
    therapeutic_focus = Column(String(255))  # e.g., "Neuromuscular RNA"
    
    # Timestamps
    announced_date = Column(Date)
    expected_close = Column(Date)
    actual_close = Column(Date)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        Index('idx_manda_deal_parties', 'acquirer', 'target'),
        Index('idx_manda_deal_platform', 'platform_name'),
    )

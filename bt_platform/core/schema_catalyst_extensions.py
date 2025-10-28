"""
Catalyst Tracking Extensions Schema
====================================

Extended schema for comprehensive catalyst tracking including:
- Expectation bands (consensus, sell-side, management guidance)
- Outcome metrics and expectation deltas
- Market reactions (price, IV, volume)
- Peer comparisons and competitive analysis
- Source citations

Supports the 5 catalyst types:
1. M&A (Novartis → Avidity)
2. Phase 3 Readout (BridgeBio FORTIFY)
3. Safety Pause (Intellia MAGNITUDE)
4. Approval (Bayer Lynkuet)
5. Label Update (Lilly Omvoh)
"""

from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Text, Boolean, JSON, ForeignKey,
    Index, Date, Numeric
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime

Base = declarative_base()


# ============================================================================
# Expectation Tracking
# ============================================================================

class ExpectationBand(Base):
    """
    Stores what the Street/analysts/management expected for each catalyst metric.
    
    Example metrics:
    - M&A: Deal Premium (%), EV/Sales (x), SpinCo Required (bool)
    - Clinical: α-DG fold change, CK reduction %, Velocity Δ (m/s), FVC Δ (pp)
    - Safety: Grade severity, Signal type, Pause duration (weeks)
    - Approval: Label indication breadth, Competitor positioning
    - Label: Dosing frequency change, Adherence uplift (%)
    """
    __tablename__ = "expectation_bands"
    
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(String(100), index=True, nullable=False)  # ULID or event identifier
    catalyst_event_id = Column(Integer, ForeignKey('catalyst_events.id'), nullable=True)
    
    # Metric definition
    metric_name = Column(String(255), nullable=False)
    unit = Column(String(50))  # %, x, bool, m/s, pp, weeks, etc.
    
    # Expectation range
    expected_value = Column(Float)  # Point estimate
    band_low = Column(Float)  # Lower bound
    band_high = Column(Float)  # Upper bound
    
    # Context
    what_matters = Column(Text)  # Why this metric is important
    
    # Source metadata
    source = Column(String(100), index=True)  # sell_side, mgmt_guide, consensus, internal
    source_analyst = Column(String(255))  # Analyst/firm name
    source_date = Column(Date)
    source_url = Column(String(1000))
    
    # Quality indicators
    confidence_score = Column(Float)  # 0-1, reliability of this expectation
    sample_size = Column(Integer)  # Number of analyst estimates averaged
    
    # Metadata
    collected_at = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    __table_args__ = (
        Index('idx_expectation_event', 'event_id'),
        Index('idx_expectation_catalyst', 'catalyst_event_id'),
        Index('idx_expectation_source', 'source', 'source_date'),
        Index('idx_expectation_metric', 'metric_name'),
    )


class OutcomeMetric(Base):
    """
    Actual outcome measurements for catalyst events.
    Paired with ExpectationBand to compute expectation deltas.
    """
    __tablename__ = "outcome_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(String(100), index=True, nullable=False)
    catalyst_event_id = Column(Integer, ForeignKey('catalyst_events.id'), nullable=True)
    
    # Metric definition (matches expectation metric_name)
    metric_name = Column(String(255), nullable=False, index=True)
    unit = Column(String(50))
    
    # Actual outcome
    value = Column(Float, nullable=False)
    
    # Statistical context (for clinical outcomes)
    p_value = Column(Float)
    confidence_interval_low = Column(Float)
    confidence_interval_high = Column(Float)
    n = Column(Integer)  # Sample size
    
    # Timing
    measurement_window = Column(String(100))  # e.g., "3 months", "12 weeks", "D0"
    announced_at = Column(DateTime(timezone=True))
    
    # Source
    source_url = Column(String(1000))
    source_type = Column(String(100))  # company_pr, sec_filing, conference, press
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        Index('idx_outcome_event', 'event_id'),
        Index('idx_outcome_catalyst', 'catalyst_event_id'),
        Index('idx_outcome_metric', 'metric_name'),
    )


# ============================================================================
# Market Reaction Tracking
# ============================================================================

class MarketReaction(Base):
    """
    Stock price, IV, and volume reactions to catalyst events.
    Tracks relative windows: D-5, D-1, D0, D+1, D+5, D+10
    """
    __tablename__ = "market_reactions"
    
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(String(100), index=True, nullable=False)
    catalyst_event_id = Column(Integer, ForeignKey('catalyst_events.id'), nullable=True)
    ticker = Column(String(10), index=True, nullable=False)
    
    # Reaction window
    window = Column(String(20), index=True, nullable=False)  # D-5, D-1, D0, D+1, D+5, D+10
    
    # Price data
    price_abs_change = Column(Float)  # Absolute price change in $
    price_pct_change = Column(Float)  # Percentage change
    price_rel_vs_xbi = Column(Float)  # Relative performance vs XBI
    intraday_high_pct = Column(Float)  # Intraday high relative to open
    intraday_low_pct = Column(Float)  # Intraday low relative to open
    
    # Options/volatility data
    iv_1m = Column(Float)  # 1-month implied volatility
    iv_3m = Column(Float)  # 3-month implied volatility
    iv_zscore_vs_1y = Column(Float)  # Z-score vs 1-year historical IV
    call_skew = Column(Float)  # Call skew metric
    put_skew = Column(Float)  # Put skew metric
    
    # Volume data
    volume = Column(BigInteger)
    volume_multiple_vs_30d = Column(Float)  # Volume as multiple of 30-day average
    volume_zscore = Column(Float)  # Z-score vs historical volume
    
    # Market context
    market_date = Column(Date, nullable=False, index=True)
    trading_day_offset = Column(Integer)  # Trading days from event
    
    # Data source
    data_provider = Column(String(100))  # yahoo, polygon, etc.
    fetched_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        Index('idx_market_reaction_event', 'event_id'),
        Index('idx_market_reaction_ticker_window', 'ticker', 'window'),
        Index('idx_market_reaction_date', 'market_date'),
    )


# ============================================================================
# Peer Comparison
# ============================================================================

class PeerComparison(Base):
    """
    Peer companies for comparative analysis.
    Moat axes: MoA, Stage, Indication, Delivery, Target
    """
    __tablename__ = "peer_comparisons"
    
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(String(100), index=True, nullable=False)
    catalyst_event_id = Column(Integer, ForeignKey('catalyst_events.id'), nullable=True)
    
    # Primary company
    primary_ticker = Column(String(10), index=True, nullable=False)
    
    # Peer company
    peer_ticker = Column(String(10), index=True, nullable=False)
    peer_name = Column(String(255))
    
    # Comparison axes
    moat_axis = Column(String(100))  # MoA, Stage, Indication, Delivery, Target
    reason_tag = Column(String(255))  # "RNA muscle peer", "AOC-adjacent", etc.
    
    # Weighting for composite metrics
    weight = Column(Float)  # 0-1, relative importance
    
    # Peer status
    phase = Column(String(50))
    therapeutic_area = Column(String(100))
    mechanism = Column(String(255))
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        Index('idx_peer_event', 'event_id'),
        Index('idx_peer_primary', 'primary_ticker'),
        Index('idx_peer_peer', 'peer_ticker'),
        Index('idx_peer_axis', 'moat_axis'),
    )


class PeerMetric(Base):
    """
    Comparative metrics for peer analysis.
    Example: Deal premium, 1D CAR, EV/R&D employee
    """
    __tablename__ = "peer_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    peer_comparison_id = Column(Integer, ForeignKey('peer_comparisons.id'), nullable=False)
    
    # Metric definition
    metric_name = Column(String(255), nullable=False)
    unit = Column(String(50))
    
    # Values
    value = Column(Float, nullable=False)  # Peer's value
    peer_median = Column(Float)  # Median across peer group
    peer_p25 = Column(Float)  # 25th percentile
    peer_p75 = Column(Float)  # 75th percentile
    delta_to_median = Column(Float)  # Difference from median
    
    # Context
    measurement_date = Column(Date)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        Index('idx_peer_metric_comparison', 'peer_comparison_id'),
        Index('idx_peer_metric_name', 'metric_name'),
    )


# ============================================================================
# Event Sources and Citations
# ============================================================================

class EventSource(Base):
    """
    Source citations for catalyst events.
    Per-slide footnote injection with timestamps.
    """
    __tablename__ = "event_sources"
    
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(String(100), index=True, nullable=False)
    catalyst_event_id = Column(Integer, ForeignKey('catalyst_events.id'), nullable=True)
    
    # Source metadata
    title = Column(String(500), nullable=False)
    url = Column(String(1000))
    source_type = Column(String(100))  # company_pr, sec_filing, reuters, analyst_note, etc.
    
    # Timing
    published_at = Column(DateTime(timezone=True))
    accessed_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Classification
    reliability_score = Column(Float)  # 0-1
    is_primary_source = Column(Boolean, default=False)
    
    # Content
    excerpt = Column(Text)  # Relevant excerpt from source
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        Index('idx_event_source_event', 'event_id'),
        Index('idx_event_source_type', 'source_type'),
        Index('idx_event_source_published', 'published_at'),
    )


# ============================================================================
# Expectation Delta Computed Results
# ============================================================================

class ExpectationDelta(Base):
    """
    Computed expectation deltas: beat, inline, or miss with magnitude.
    Generated from ExpectationBand + OutcomeMetric comparison.
    """
    __tablename__ = "expectation_deltas"
    
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(String(100), index=True, nullable=False)
    expectation_band_id = Column(Integer, ForeignKey('expectation_bands.id'), nullable=False)
    outcome_metric_id = Column(Integer, ForeignKey('outcome_metrics.id'), nullable=False)
    
    # Delta classification
    delta_class = Column(String(20), nullable=False)  # beat, inline, miss
    delta_score = Column(Float, nullable=False)  # 0-1 magnitude score
    
    # Statistical significance (for clinical outcomes)
    is_statistically_significant = Column(Boolean)
    
    # Computed at
    computed_at = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        Index('idx_expectation_delta_event', 'event_id'),
        Index('idx_expectation_delta_class', 'delta_class'),
    )

"""
Expectations ETL Pipeline
=========================

Extracts, transforms, and loads Street expectations for catalyst events.
Parses broker notes, management guidance, and consensus estimates.

Features:
- Semi-structured text parsing
- Unit validation and normalization  
- Outlier detection and clipping
- Quality flagging
"""

import logging
import re
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
from decimal import Decimal, InvalidOperation
from sqlalchemy.orm import Session

from ..core.schema_catalyst_extensions import ExpectationBand
from ..core.contracts_catalyst_extensions import ExpectationBandContract, ExpectationSource

logger = logging.getLogger(__name__)


# ============================================================================
# Unit Normalization
# ============================================================================

UNIT_ALIASES = {
    'percent': '%',
    'pct': '%',
    'percentage': '%',
    'bps': 'bp',
    'basis_points': 'bp',
    'fold': 'x',
    'times': 'x',
    'multiple': 'x',
    'billion': '$B',
    'billions': '$B',
    'million': '$M',
    'millions': '$M',
    'meters_per_second': 'm/s',
    'percentage_points': 'pp',
    'points': 'pp',
}


def normalize_unit(unit: str) -> str:
    """
    Normalize unit strings to standard format.
    
    Args:
        unit: Raw unit string
        
    Returns:
        Normalized unit string
    """
    if not unit:
        return ""
    
    unit_lower = unit.lower().strip()
    return UNIT_ALIASES.get(unit_lower, unit)


# ============================================================================
# Value Parsing and Validation
# ============================================================================

def parse_numeric_value(value_str: str) -> Optional[Decimal]:
    """
    Parse numeric value from string, handling various formats.
    
    Examples:
        "1.5x" -> 1.5
        "60%" -> 60
        "$12.0B" -> 12.0
        "0.27 m/s" -> 0.27
        
    Args:
        value_str: String containing numeric value
        
    Returns:
        Decimal value or None if parsing fails
    """
    if not value_str:
        return None
    
    # Remove common prefixes/suffixes
    cleaned = value_str.strip().replace('$', '').replace(',', '')
    
    # Extract numeric part
    match = re.search(r'[-+]?\d*\.?\d+', cleaned)
    if not match:
        return None
    
    try:
        return Decimal(match.group())
    except (InvalidOperation, ValueError):
        return None


def validate_expectation_band(
    expected: Optional[Decimal],
    band_low: Optional[Decimal],
    band_high: Optional[Decimal]
) -> Tuple[bool, Optional[str]]:
    """
    Validate that expectation bands are logically consistent.
    
    Args:
        expected: Point estimate
        band_low: Lower bound
        band_high: Upper bound
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    # Check if band bounds are in correct order
    if band_low is not None and band_high is not None:
        if band_low > band_high:
            return False, "band_low > band_high"
    
    # Check if expected is within bands
    if expected is not None:
        if band_low is not None and expected < band_low:
            return False, "expected < band_low"
        if band_high is not None and expected > band_high:
            return False, "expected > band_high"
    
    return True, None


def detect_outliers(
    values: List[Decimal],
    iqr_multiplier: float = 3.0
) -> List[bool]:
    """
    Detect outliers using IQR method.
    
    Args:
        values: List of numeric values
        iqr_multiplier: Multiplier for IQR bounds (default 3.0 for aggressive)
        
    Returns:
        List of boolean flags (True = outlier)
    """
    if len(values) < 4:
        return [False] * len(values)
    
    sorted_values = sorted(values)
    n = len(sorted_values)
    q1 = sorted_values[n // 4]
    q3 = sorted_values[3 * n // 4]
    iqr = q3 - q1
    
    lower_bound = q1 - iqr_multiplier * iqr
    upper_bound = q3 + iqr_multiplier * iqr
    
    return [v < lower_bound or v > upper_bound for v in values]


# ============================================================================
# Expectation Extraction
# ============================================================================

def extract_expectations_from_text(
    text: str,
    event_id: str,
    source: ExpectationSource = ExpectationSource.SELL_SIDE
) -> List[ExpectationBandContract]:
    """
    Extract expectation metrics from semi-structured text.
    
    This is a simplified parser. In production, consider:
    - LLM-assisted extraction
    - Human review queue
    - Confidence scoring
    
    Args:
        text: Raw text containing expectations
        event_id: Event identifier
        source: Source of expectations
        
    Returns:
        List of ExpectationBandContract objects
    """
    expectations = []
    
    # Example patterns - extend based on actual broker note formats
    patterns = [
        # "α-DG glycosylation: 1.5x (range 1.3-1.6x)"
        r'([A-Za-z0-9\-αβγ\s]+):\s*([\d.]+)\s*([%xmMbBpPs/]+)\s*\(range\s*([\d.]+)\s*-\s*([\d.]+)',
        # "CK reduction ≥60% (band 50-70%)"
        r'([A-Za-z0-9\-\s]+)\s*≥?\s*([\d.]+)\s*([%xmMbBpPs/]+)\s*\(band\s*([\d.]+)\s*-\s*([\d.]+)',
    ]
    
    for pattern in patterns:
        for match in re.finditer(pattern, text):
            metric_name = match.group(1).strip()
            expected_val = parse_numeric_value(match.group(2))
            unit = normalize_unit(match.group(3))
            band_low_val = parse_numeric_value(match.group(4))
            band_high_val = parse_numeric_value(match.group(5))
            
            if expected_val is not None:
                # Validate band
                is_valid, error = validate_expectation_band(
                    expected_val, band_low_val, band_high_val
                )
                
                quality_flag = "VERIFIED" if is_valid else f"INVALID:{error}"
                
                expectations.append(ExpectationBandContract(
                    event_id=event_id,
                    metric=metric_name,
                    unit=unit,
                    expected=expected_val,
                    band_low=band_low_val,
                    band_high=band_high_val,
                    source=source,
                    collected_at=datetime.utcnow()
                ))
    
    return expectations


def load_expectations(
    db: Session,
    expectations: List[ExpectationBandContract]
) -> int:
    """
    Load expectations into database.
    
    Args:
        db: Database session
        expectations: List of expectation contracts
        
    Returns:
        Number of records inserted
    """
    inserted = 0
    
    for exp in expectations:
        # Check for duplicates
        existing = db.query(ExpectationBand).filter(
            ExpectationBand.event_id == exp.event_id,
            ExpectationBand.metric == exp.metric,
            ExpectationBand.source == exp.source
        ).first()
        
        if existing:
            logger.info(f"Updating existing expectation: {exp.metric} for {exp.event_id}")
            existing.expected = exp.expected
            existing.band_low = exp.band_low
            existing.band_high = exp.band_high
            existing.collected_at = exp.collected_at
            existing.updated_at = datetime.utcnow()
        else:
            # Validate band
            is_valid, error = validate_expectation_band(
                exp.expected, exp.band_low, exp.band_high
            )
            
            quality_flag = "VERIFIED" if is_valid else f"INVALID:{error}"
            
            record = ExpectationBand(
                event_id=exp.event_id,
                metric=exp.metric,
                unit=exp.unit,
                expected=exp.expected,
                band_low=exp.band_low,
                band_high=exp.band_high,
                source=exp.source,
                what_matters=exp.what_matters,
                collected_at=exp.collected_at,
                quality_flag=quality_flag
            )
            db.add(record)
            inserted += 1
    
    try:
        db.commit()
        logger.info(f"Loaded {inserted} expectations")
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to load expectations: {e}")
        raise
    
    return inserted


# ============================================================================
# Coverage Validation
# ============================================================================

def check_expectation_coverage(
    db: Session,
    lookback_hours: int = 24
) -> Dict[str, Any]:
    """
    Check what percentage of events have expectations within lookback period.
    
    Target: 90% of events should have at least one expectation within 24h of ingest.
    
    Args:
        db: Database session
        lookback_hours: Hours to look back for expectations
        
    Returns:
        Coverage statistics
    """
    from datetime import timedelta
    from sqlalchemy import func, distinct
    
    cutoff = datetime.utcnow() - timedelta(hours=lookback_hours)
    
    # Count events with expectations
    events_with_expectations = db.query(
        func.count(distinct(ExpectationBand.event_id))
    ).filter(
        ExpectationBand.collected_at >= cutoff
    ).scalar() or 0
    
    # Count total events (would need to join with CatalystEvent table)
    # For now, just return what we have
    
    return {
        "lookback_hours": lookback_hours,
        "events_with_expectations": events_with_expectations,
        "timestamp": datetime.utcnow().isoformat()
    }


# ============================================================================
# Main ETL Function
# ============================================================================

def run_expectations_etl(
    db: Session,
    source_texts: List[Dict[str, str]],
    source_type: ExpectationSource = ExpectationSource.SELL_SIDE
) -> Dict[str, Any]:
    """
    Run complete expectations ETL pipeline.
    
    Args:
        db: Database session
        source_texts: List of dicts with 'event_id' and 'text' keys
        source_type: Type of expectation source
        
    Returns:
        Pipeline statistics
    """
    logger.info(f"Starting expectations ETL for {len(source_texts)} sources")
    
    all_expectations = []
    for item in source_texts:
        event_id = item['event_id']
        text = item['text']
        
        expectations = extract_expectations_from_text(text, event_id, source_type)
        all_expectations.extend(expectations)
    
    # Quality checks
    quality_issues = [
        exp for exp in all_expectations
        if not validate_expectation_band(exp.expected, exp.band_low, exp.band_high)[0]
    ]
    
    # Load to database
    inserted = load_expectations(db, all_expectations)
    
    stats = {
        "total_sources": len(source_texts),
        "total_expectations": len(all_expectations),
        "quality_issues": len(quality_issues),
        "inserted": inserted,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    logger.info(f"Expectations ETL complete: {stats}")
    return stats

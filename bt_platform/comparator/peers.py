"""
Peer Comparator
===============

Identifies and ranks peer companies for catalyst read-through analysis.
Uses weighted similarity across moat axes (MoA, Stage, Indication, Delivery, Target).

Features:
- Multi-dimensional similarity matching
- Deterministic ranking with explainability
- Sector median calculations
- Peer metric benchmarking
"""

import logging
from typing import List, Dict, Optional, Tuple
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from ..core.schema import Company, Program, Trial
from ..core.schema_catalyst_extensions import PeerComparison, PeerMetricComparison
from ..core.contracts_catalyst_extensions import (
    PeerComparisonContract,
    PeerCompany
)

logger = logging.getLogger(__name__)


# ============================================================================
# Moat Axes Weights
# ============================================================================

# Default weights for similarity calculation
MOAT_WEIGHTS = {
    "moa": 0.30,          # Mechanism of action
    "stage": 0.25,        # Development stage
    "indication": 0.25,   # Therapeutic indication
    "delivery": 0.10,     # Delivery method
    "target": 0.10        # Target protein/pathway
}


# ============================================================================
# Similarity Calculation
# ============================================================================

def calculate_indication_similarity(
    indication1: str,
    indication2: str
) -> float:
    """
    Calculate indication similarity score.
    
    Args:
        indication1: First indication
        indication2: Second indication
        
    Returns:
        Similarity score (0-1)
    """
    if not indication1 or not indication2:
        return 0.0
    
    ind1 = indication1.lower()
    ind2 = indication2.lower()
    
    # Exact match
    if ind1 == ind2:
        return 1.0
    
    # Substring match
    if ind1 in ind2 or ind2 in ind1:
        return 0.8
    
    # Common therapeutic area keywords
    therapeutic_areas = [
        "oncology", "cancer", "immunology", "neurology",
        "rare disease", "cardiovascular", "metabolic"
    ]
    
    for area in therapeutic_areas:
        if area in ind1 and area in ind2:
            return 0.6
    
    return 0.0


def calculate_moa_similarity(
    mechanism1: str,
    mechanism2: str
) -> float:
    """
    Calculate mechanism of action similarity.
    
    Args:
        mechanism1: First MoA
        mechanism2: Second MoA
        
    Returns:
        Similarity score (0-1)
    """
    if not mechanism1 or not mechanism2:
        return 0.0
    
    moa1 = mechanism1.lower()
    moa2 = mechanism2.lower()
    
    # Exact match
    if moa1 == moa2:
        return 1.0
    
    # Common mechanism keywords
    if any(keyword in moa1 and keyword in moa2 
           for keyword in ["inhibitor", "agonist", "antagonist", "antibody", "therapy"]):
        return 0.7
    
    return 0.0


def calculate_stage_similarity(
    phase1: str,
    phase2: str
) -> float:
    """
    Calculate development stage similarity.
    
    Args:
        phase1: First phase
        phase2: Second phase
        
    Returns:
        Similarity score (0-1)
    """
    if not phase1 or not phase2:
        return 0.0
    
    # Phase ordering
    phase_order = {
        "Preclinical": 0,
        "Phase I": 1,
        "Phase II": 2,
        "Phase III": 3,
        "Filed": 4,
        "Approved": 5
    }
    
    p1_val = phase_order.get(phase1, -1)
    p2_val = phase_order.get(phase2, -1)
    
    if p1_val < 0 or p2_val < 0:
        return 0.0
    
    # Exact match
    if p1_val == p2_val:
        return 1.0
    
    # Adjacent phases
    if abs(p1_val - p2_val) == 1:
        return 0.7
    
    # Two phases apart
    if abs(p1_val - p2_val) == 2:
        return 0.4
    
    return 0.0


def calculate_delivery_similarity(
    modality1: str,
    modality2: str
) -> float:
    """
    Calculate delivery method similarity.
    
    Args:
        modality1: First modality
        modality2: Second modality
        
    Returns:
        Similarity score (0-1)
    """
    if not modality1 or not modality2:
        return 0.0
    
    mod1 = modality1.lower()
    mod2 = modality2.lower()
    
    # Exact match
    if mod1 == mod2:
        return 1.0
    
    # Group similar modalities
    groups = [
        ["small molecule", "oral", "pill"],
        ["monoclonal antibody", "mab", "antibody"],
        ["gene therapy", "aav", "lentiviral"],
        ["cell therapy", "car-t", "tcr"],
        ["rna", "mrna", "sirna", "antisense"]
    ]
    
    for group in groups:
        if any(term in mod1 for term in group) and any(term in mod2 for term in group):
            return 0.8
    
    return 0.0


def calculate_target_similarity(
    target1: str,
    target2: str
) -> float:
    """
    Calculate target similarity.
    
    Args:
        target1: First target
        target2: Second target
        
    Returns:
        Similarity score (0-1)
    """
    if not target1 or not target2:
        return 0.0
    
    tgt1 = target1.lower()
    tgt2 = target2.lower()
    
    # Exact match
    if tgt1 == tgt2:
        return 1.0
    
    # Substring match
    if tgt1 in tgt2 or tgt2 in tgt1:
        return 0.8
    
    return 0.0


# ============================================================================
# Peer Identification
# ============================================================================

def get_peers(
    db: Session,
    ticker: str,
    indication: Optional[str] = None,
    moa: Optional[str] = None,
    phase: Optional[str] = None,
    max_peers: int = 10,
    weights: Dict[str, float] = None
) -> List[Tuple[Company, Program, float, Dict[str, bool]]]:
    """
    Get peer companies for a given ticker.
    
    Args:
        db: Database session
        ticker: Subject company ticker
        indication: Optional indication filter
        moa: Optional mechanism filter
        phase: Optional development phase filter
        max_peers: Maximum number of peers to return
        weights: Optional custom moat weights
        
    Returns:
        List of tuples (Company, Program, similarity_score, moat_flags)
    """
    if weights is None:
        weights = MOAT_WEIGHTS
    
    # Get subject company and program
    subject_company = db.query(Company).filter(Company.ticker == ticker).first()
    if not subject_company:
        logger.error(f"Company not found: {ticker}")
        return []
    
    # Get subject program (first active program)
    subject_program = db.query(Program).filter(
        and_(
            Program.company_id == subject_company.id,
            Program.status == "Active"
        )
    ).first()
    
    if not subject_program:
        logger.warning(f"No active programs found for {ticker}")
        # Use filters if provided
        subject_indication = indication
        subject_moa = moa
        subject_phase = phase
        subject_modality = None
        subject_target = None
    else:
        subject_indication = subject_program.indication or indication
        subject_moa = subject_program.mechanism or moa
        subject_phase = subject_program.phase or phase
        subject_modality = subject_program.modality
        subject_target = subject_program.target
    
    # Query all other companies with programs
    peer_programs = db.query(Company, Program).join(
        Program, Company.id == Program.company_id
    ).filter(
        and_(
            Company.ticker != ticker,
            Program.status == "Active"
        )
    ).all()
    
    # Calculate similarity for each peer
    peer_scores = []
    for company, program in peer_programs:
        scores = {
            "indication": calculate_indication_similarity(subject_indication, program.indication),
            "moa": calculate_moa_similarity(subject_moa, program.mechanism),
            "stage": calculate_stage_similarity(subject_phase, program.phase),
            "delivery": calculate_delivery_similarity(subject_modality, program.modality),
            "target": calculate_target_similarity(subject_target, program.target)
        }
        
        # Weighted total similarity
        total_similarity = (
            scores["indication"] * weights["indication"] +
            scores["moa"] * weights["moa"] +
            scores["stage"] * weights["stage"] +
            scores["delivery"] * weights["delivery"] +
            scores["target"] * weights["target"]
        )
        
        # Moat flags (>0.5 threshold for match)
        moat_flags = {
            "moat_moa": scores["moa"] > 0.5,
            "moat_stage": scores["stage"] > 0.5,
            "moat_indication": scores["indication"] > 0.5,
            "moat_delivery": scores["delivery"] > 0.5,
            "moat_target": scores["target"] > 0.5
        }
        
        if total_similarity > 0.1:  # Minimum threshold
            peer_scores.append((company, program, total_similarity, moat_flags))
    
    # Sort by similarity (deterministic)
    peer_scores.sort(key=lambda x: (-x[2], x[0].ticker))  # Descending similarity, then alphabetical
    
    return peer_scores[:max_peers]


def explain_peer_match(
    peer_ticker: str,
    moat_flags: Dict[str, bool],
    similarity_score: float
) -> str:
    """
    Generate explainability string for peer match.
    
    Args:
        peer_ticker: Peer ticker
        moat_flags: Dict of moat axis matches
        similarity_score: Overall similarity score
        
    Returns:
        Explanation string
    """
    matched_axes = [
        axis.replace("moat_", "").upper()
        for axis, matched in moat_flags.items()
        if matched
    ]
    
    if not matched_axes:
        return f"{peer_ticker}: Low similarity match"
    
    return f"{peer_ticker}: {', '.join(matched_axes)} match (score: {similarity_score:.2f})"


# ============================================================================
# Peer Metric Calculation
# ============================================================================

def calculate_peer_metrics(
    db: Session,
    event_id: str,
    subject_value: float,
    peer_tickers: List[str],
    metric_name: str,
    metric_values: Dict[str, float]
) -> Dict[str, float]:
    """
    Calculate peer benchmark statistics.
    
    Args:
        db: Database session
        event_id: Event identifier
        subject_value: Subject company metric value
        peer_tickers: List of peer tickers
        metric_name: Name of metric
        metric_values: Dict mapping ticker to metric value
        
    Returns:
        Dict with median, p25, p75, delta calculations
    """
    values = [metric_values.get(ticker, 0) for ticker in peer_tickers if ticker in metric_values]
    
    if not values:
        return {
            "peer_median": None,
            "peer_p25": None,
            "peer_p75": None,
            "delta_to_median": None,
            "percentile_rank": None
        }
    
    values_sorted = sorted(values)
    n = len(values_sorted)
    
    # Calculate percentiles
    median_idx = n // 2
    p25_idx = n // 4
    p75_idx = 3 * n // 4
    
    peer_median = values_sorted[median_idx]
    peer_p25 = values_sorted[p25_idx]
    peer_p75 = values_sorted[p75_idx]
    
    # Delta to median
    delta_to_median = subject_value - peer_median
    
    # Percentile rank
    below_subject = sum(1 for v in values if v < subject_value)
    percentile_rank = below_subject / n if n > 0 else 0.0
    
    return {
        "peer_median": peer_median,
        "peer_p25": peer_p25,
        "peer_p75": peer_p75,
        "peer_min": min(values_sorted),
        "peer_max": max(values_sorted),
        "delta_to_median": delta_to_median,
        "delta_to_p75": subject_value - peer_p75,
        "percentile_rank": percentile_rank
    }


# ============================================================================
# Database Operations
# ============================================================================

def save_peer_comparisons(
    db: Session,
    event_id: str,
    peers: List[Tuple[Company, Program, float, Dict[str, bool]]]
) -> int:
    """
    Save peer comparisons to database.
    
    Args:
        db: Database session
        event_id: Event identifier
        peers: List of peer tuples
        
    Returns:
        Number of records saved
    """
    saved = 0
    
    for company, program, similarity, moat_flags in peers:
        # Check for existing
        existing = db.query(PeerComparison).filter(
            and_(
                PeerComparison.event_id == event_id,
                PeerComparison.peer_ticker == company.ticker
            )
        ).first()
        
        # Generate reason tag
        reason_tag = explain_peer_match(company.ticker, moat_flags, similarity)
        
        if existing:
            # Update existing
            existing.weight = similarity
            existing.reason_tag = reason_tag
            existing.moat_moa = moat_flags.get("moat_moa", False)
            existing.moat_stage = moat_flags.get("moat_stage", False)
            existing.moat_indication = moat_flags.get("moat_indication", False)
            existing.moat_delivery = moat_flags.get("moat_delivery", False)
            existing.moat_target = moat_flags.get("moat_target", False)
            existing.updated_at = datetime.utcnow()
        else:
            # Create new
            record = PeerComparison(
                event_id=event_id,
                peer_ticker=company.ticker,
                peer_name=company.name,
                reason_tag=reason_tag,
                weight=similarity,
                moat_moa=moat_flags.get("moat_moa", False),
                moat_stage=moat_flags.get("moat_stage", False),
                moat_indication=moat_flags.get("moat_indication", False),
                moat_delivery=moat_flags.get("moat_delivery", False),
                moat_target=moat_flags.get("moat_target", False)
            )
            db.add(record)
            saved += 1
    
    try:
        db.commit()
        logger.info(f"Saved {saved} peer comparisons for event {event_id}")
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to save peer comparisons: {e}")
        raise
    
    return saved

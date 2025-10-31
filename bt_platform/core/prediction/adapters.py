"""
Database Adapters for Prediction Engine

Provides a clean interface between prediction models and the database layer.
Implements the adapter pattern to decouple prediction logic from data access.
"""

from dataclasses import dataclass
from typing import List, Dict, Optional, Literal, Tuple
import datetime as dt
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc, func

from ..database import Catalyst as DBCatalyst, Company as DBCompany

CatalystType = Literal["PDUFA", "TRIAL_READOUT", "EARNINGS", "M&A", "OTHER"]
PhaseType = Literal["P1", "P2", "P3", "FDA"]


@dataclass
class Catalyst:
    """Simplified catalyst model for prediction engine."""
    id: str
    ticker: str
    company: str
    therapeutic_area: str
    catalyst_type: CatalystType
    phase: Optional[PhaseType] = None
    # Anchor dates: e.g., trial start or expected window start; PDUFA_date for PDUFA
    anchor_date: Optional[dt.date] = None
    pdufa_date: Optional[dt.date] = None
    # Evidence flags for Bayesian outcome updates:
    prior_phase_success: bool = False
    biomarker_enrichment: bool = False
    hard_endpoints: bool = False
    large_trial: bool = False  # e.g., n above TA median
    # Past outcomes for momentum:
    # Each tuple: (date, +1 for positive, -1 for negative, weight by importance)
    outcome_history: Optional[List[Tuple[dt.date, int, float]]] = None


def _map_catalyst_type(db_catalyst: DBCatalyst) -> CatalystType:
    """Map database catalyst type to prediction engine type."""
    kind = (db_catalyst.kind or "").upper()
    event_type = (db_catalyst.event_type or "").upper()
    
    if "PDUFA" in kind or "PDUFA" in event_type:
        return "PDUFA"
    elif any(term in kind or term in event_type for term in ["TRIAL", "READOUT", "DATA", "PHASE"]):
        return "TRIAL_READOUT"
    elif any(term in kind or term in event_type for term in ["EARNINGS", "FINANCIAL"]):
        return "EARNINGS"
    elif any(term in kind or term in event_type for term in ["M&A", "ACQUISITION", "MERGER"]):
        return "M&A"
    else:
        return "OTHER"


def _map_phase(db_catalyst: DBCatalyst) -> Optional[PhaseType]:
    """Map database phase to prediction engine phase."""
    phase = getattr(db_catalyst, "phase", None)
    if not phase:
        # Try to extract from kind or event_type
        text = f"{db_catalyst.kind or ''} {db_catalyst.event_type or ''}".upper()
        if "PHASE 1" in text or "PHASE I" in text or "P1" in text:
            return "P1"
        elif "PHASE 2" in text or "PHASE II" in text or "P2" in text:
            return "P2"
        elif "PHASE 3" in text or "PHASE III" in text or "P3" in text:
            return "P3"
        elif "FDA" in text or "APPROVAL" in text or "NDA" in text or "BLA" in text:
            return "FDA"
        return None
    
    phase_str = str(phase).upper()
    if "1" in phase_str or "I" in phase_str and "II" not in phase_str and "III" not in phase_str:
        return "P1"
    elif "2" in phase_str or "II" in phase_str and "III" not in phase_str:
        return "P2"
    elif "3" in phase_str or "III" in phase_str:
        return "P3"
    elif "FDA" in phase_str or "APPROVAL" in phase_str:
        return "FDA"
    return None


def _parse_outcome_history(db: Session, company: str, lookback_days: int = 730) -> List[Tuple[dt.date, int, float]]:
    """Parse outcome history for a company from database."""
    cutoff = dt.datetime.now() - dt.timedelta(days=lookback_days)
    
    # Query past catalysts with outcomes
    catalysts = (
        db.query(DBCatalyst)
        .filter(
            and_(
                DBCatalyst.company == company,
                DBCatalyst.date >= cutoff,
                DBCatalyst.status.notin_(["Upcoming", "Pending"]),
            )
        )
        .order_by(DBCatalyst.date)
        .all()
    )
    
    history = []
    for cat in catalysts:
        if not cat.date:
            continue
        
        # Determine polarity from status/outcome
        polarity = 0
        outcome = getattr(cat, "outcome", None)
        status = cat.status or ""
        
        if outcome:
            outcome_lower = outcome.lower()
            if any(term in outcome_lower for term in ["success", "positive", "approved", "met"]):
                polarity = 1
            elif any(term in outcome_lower for term in ["fail", "negative", "reject", "missed"]):
                polarity = -1
        elif status:
            status_lower = status.lower()
            if any(term in status_lower for term in ["completed", "approved"]):
                polarity = 1
            elif any(term in status_lower for term in ["failed", "rejected", "terminated"]):
                polarity = -1
        
        if polarity != 0:
            # Weight by importance (could be enhanced with actual impact scoring)
            weight = 1.0
            if hasattr(cat, "impact") and cat.impact:
                impact_map = {"High": 1.5, "Medium": 1.0, "Low": 0.7}
                weight = impact_map.get(cat.impact, 1.0)
            
            history.append((cat.date.date() if isinstance(cat.date, dt.datetime) else cat.date, polarity, weight))
    
    return history


def get_catalyst_by_id(db: Session, catalyst_id: str) -> Catalyst:
    """
    Retrieve catalyst from database and convert to prediction engine format.
    
    Args:
        db: SQLAlchemy database session
        catalyst_id: Catalyst ID (string or int)
        
    Returns:
        Catalyst object for prediction engine
    """
    try:
        cid = int(catalyst_id)
    except (ValueError, TypeError):
        # Handle string IDs like "mock" or "upcoming-1"
        if catalyst_id.startswith("mock") or catalyst_id.startswith("upcoming-"):
            # Return mock data for development
            today = dt.date.today()
            return Catalyst(
                id=catalyst_id,
                ticker="TECX",
                company="Tectonic Therapeutic",
                therapeutic_area="Cardiovascular",
                catalyst_type="TRIAL_READOUT",
                phase="P3",
                anchor_date=today - dt.timedelta(days=540),
                prior_phase_success=True,
                biomarker_enrichment=True,
                hard_endpoints=True,
                large_trial=True,
                outcome_history=[
                    (today - dt.timedelta(days=220), 1, 1.0),
                    (today - dt.timedelta(days=120), 1, 1.0),
                    (today - dt.timedelta(days=30), 1, 1.0),
                ],
            )
        raise ValueError(f"Invalid catalyst_id: {catalyst_id}")
    
    # Query database
    db_cat = db.query(DBCatalyst).filter(DBCatalyst.id == cid).first()
    if not db_cat:
        raise ValueError(f"Catalyst not found: {catalyst_id}")
    
    # Convert to prediction format
    catalyst_type = _map_catalyst_type(db_cat)
    phase = _map_phase(db_cat)
    
    # Get therapeutic area
    therapeutic_area = getattr(db_cat, "therapeutic_area", None) or "Unknown"
    if not therapeutic_area or therapeutic_area == "Unknown":
        # Try to infer from indication
        indication = getattr(db_cat, "indication", "")
        if indication:
            ind_lower = indication.lower()
            if any(term in ind_lower for term in ["cancer", "tumor", "oncology"]):
                therapeutic_area = "Oncology"
            elif any(term in ind_lower for term in ["cardio", "heart", "cv"]):
                therapeutic_area = "Cardiovascular"
            elif any(term in ind_lower for term in ["neuro", "alzheimer", "parkinson"]):
                therapeutic_area = "Neurology"
            elif any(term in ind_lower for term in ["rare", "orphan"]):
                therapeutic_area = "Rare Disease"
    
    # Extract evidence flags
    biomarker_enrichment = getattr(db_cat, "biomarker_enrichment", False)
    hard_endpoints = False
    if hasattr(db_cat, "endpoint_type") and db_cat.endpoint_type:
        hard_endpoints = db_cat.endpoint_type in ["MACE", "Mortality", "Disease Progression", "Clinical Benefit"]
    
    large_trial = False
    if hasattr(db_cat, "trial_size") and db_cat.trial_size:
        # Consider large if > 500 patients (could be calibrated by TA)
        large_trial = db_cat.trial_size > 500
    
    # Check prior phase success
    prior_phase_success = False
    if hasattr(db_cat, "drug_id") and db_cat.drug_id:
        prior_catalysts = (
            db.query(DBCatalyst)
            .filter(
                and_(
                    DBCatalyst.drug_id == db_cat.drug_id,
                    DBCatalyst.id < cid,
                )
            )
            .order_by(DBCatalyst.date)
            .all()
        )
        if prior_catalysts:
            successes = sum(
                1 for c in prior_catalysts
                if getattr(c, "outcome", "") and "success" in getattr(c, "outcome", "").lower()
            )
            prior_phase_success = successes > len(prior_catalysts) / 2
    
    # Get outcome history
    outcome_history = _parse_outcome_history(db, db_cat.company, lookback_days=730)
    
    # Determine anchor and PDUFA dates
    anchor_date = None
    pdufa_date = None
    
    if hasattr(db_cat, "trial_start_date") and db_cat.trial_start_date:
        anchor_date = db_cat.trial_start_date.date() if isinstance(db_cat.trial_start_date, dt.datetime) else db_cat.trial_start_date
    elif db_cat.created_at:
        anchor_date = db_cat.created_at.date() if isinstance(db_cat.created_at, dt.datetime) else db_cat.created_at
    
    if catalyst_type == "PDUFA" and db_cat.date:
        pdufa_date = db_cat.date.date() if isinstance(db_cat.date, dt.datetime) else db_cat.date
    
    # Get company ticker
    ticker = "UNKNOWN"
    if hasattr(db_cat, "ticker") and db_cat.ticker:
        ticker = db_cat.ticker
    else:
        # Try to look up from company table
        company_record = db.query(DBCompany).filter(DBCompany.name == db_cat.company).first()
        if company_record and company_record.ticker:
            ticker = company_record.ticker
    
    return Catalyst(
        id=str(cid),
        ticker=ticker,
        company=db_cat.company,
        therapeutic_area=therapeutic_area,
        catalyst_type=catalyst_type,
        phase=phase,
        anchor_date=anchor_date,
        pdufa_date=pdufa_date,
        prior_phase_success=prior_phase_success,
        biomarker_enrichment=biomarker_enrichment,
        hard_endpoints=hard_endpoints,
        large_trial=large_trial,
        outcome_history=outcome_history,
    )


def get_company_outcomes(db: Session, company: str, lookback_days: int = 730) -> List[Tuple[dt.date, int, float]]:
    """
    Get outcome history for a company.
    
    Args:
        db: SQLAlchemy database session
        company: Company name
        lookback_days: Number of days to look back
        
    Returns:
        List of tuples (date, polarity:+1/-1, importance_weight:float)
    """
    return _parse_outcome_history(db, company, lookback_days)


def get_ta_outcomes(db: Session, lookback_days: int = 730) -> Dict[str, List[Tuple[dt.date, int, float]]]:
    """
    Get outcome history grouped by therapeutic area.
    
    Args:
        db: SQLAlchemy database session
        lookback_days: Number of days to look back
        
    Returns:
        Dict mapping therapeutic_area -> list of events (date, ±1, weight)
    """
    cutoff = dt.datetime.now() - dt.timedelta(days=lookback_days)
    
    # Query all catalysts with outcomes
    catalysts = (
        db.query(DBCatalyst)
        .filter(
            and_(
                DBCatalyst.date >= cutoff,
                DBCatalyst.status.notin_(["Upcoming", "Pending"]),
            )
        )
        .all()
    )
    
    # Group by therapeutic area
    ta_map: Dict[str, List[Tuple[dt.date, int, float]]] = {}
    
    for cat in catalysts:
        if not cat.date:
            continue
        
        # Get therapeutic area
        ta = getattr(cat, "therapeutic_area", None) or "Unknown"
        if not ta or ta == "Unknown":
            # Try to infer from indication
            indication = getattr(cat, "indication", "")
            if indication:
                ind_lower = indication.lower()
                if any(term in ind_lower for term in ["cancer", "tumor", "oncology"]):
                    ta = "Oncology"
                elif any(term in ind_lower for term in ["cardio", "heart", "cv"]):
                    ta = "Cardiovascular"
                elif any(term in ind_lower for term in ["neuro", "alzheimer", "parkinson"]):
                    ta = "Neurology"
                elif any(term in ind_lower for term in ["rare", "orphan"]):
                    ta = "Rare Disease"
        
        # Determine polarity
        polarity = 0
        outcome = getattr(cat, "outcome", None)
        status = cat.status or ""
        
        if outcome:
            outcome_lower = outcome.lower()
            if any(term in outcome_lower for term in ["success", "positive", "approved", "met"]):
                polarity = 1
            elif any(term in outcome_lower for term in ["fail", "negative", "reject", "missed"]):
                polarity = -1
        elif status:
            status_lower = status.lower()
            if any(term in status_lower for term in ["completed", "approved"]):
                polarity = 1
            elif any(term in status_lower for term in ["failed", "rejected", "terminated"]):
                polarity = -1
        
        if polarity != 0:
            # Weight by importance
            weight = 1.0
            if hasattr(cat, "impact") and cat.impact:
                impact_map = {"High": 1.5, "Medium": 1.0, "Low": 0.7}
                weight = impact_map.get(cat.impact, 1.0)
            
            if ta not in ta_map:
                ta_map[ta] = []
            
            date = cat.date.date() if isinstance(cat.date, dt.datetime) else cat.date
            ta_map[ta].append((date, polarity, weight))
    
    # Ensure major TAs exist even if empty
    for major_ta in ["Oncology", "Cardiovascular", "Neurology", "Rare Disease"]:
        if major_ta not in ta_map:
            ta_map[major_ta] = []
    
    return ta_map


def list_upcoming_catalysts(db: Session, limit: int = 20) -> List[Catalyst]:
    """
    List upcoming catalysts from database.
    
    Args:
        db: SQLAlchemy database session
        limit: Maximum number of catalysts to return
        
    Returns:
        List of Catalyst objects
    """
    # Query upcoming catalysts
    upcoming = (
        db.query(DBCatalyst)
        .filter(
            and_(
                DBCatalyst.status.in_(["Upcoming", "Pending"]),
                DBCatalyst.date >= dt.datetime.now(),
            )
        )
        .order_by(DBCatalyst.date)
        .limit(limit)
        .all()
    )
    
    # Convert to prediction format
    result = []
    for db_cat in upcoming:
        try:
            catalyst = get_catalyst_by_id(db, str(db_cat.id))
            result.append(catalyst)
        except Exception:
            # Skip catalysts that fail to convert
            continue
    
    # If no upcoming catalysts, return mock data for development
    if not result:
        for i in range(min(limit, 5)):
            result.append(get_catalyst_by_id(db, f"upcoming-{i}"))
    
    return result

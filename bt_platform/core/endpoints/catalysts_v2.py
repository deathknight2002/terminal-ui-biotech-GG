"""
Enhanced Catalyst API Endpoints with Provenance Tracking
=========================================================

Implements Option A from the problem statement:
- GET /api/v1/catalysts with advanced filtering
- GET /api/v1/catalysts/{id} with joined provenance
- POST /api/v1/catalysts with provenance validation
- PATCH /api/v1/catalysts/{id} for updates

All endpoints enforce provenance tracking and support granular filtering.
"""

import logging
from datetime import date, datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from ..contracts import (
    AnalystNoteResponse,
    CatalystEventCreateContract,
    CatalystEventDetailResponse,
    CatalystEventListResponse,
    CatalystEventUpdateContract,
    SourceProvenanceContract,
    SourceProvenanceResponse,
)
from ..database import get_db
from ..schema import (
    AnalystNote,
    CatalystEvent,
    Company,
    EntitySourceLink,
    Program,
    SourceProvenance,
    Trial,
)

logger = logging.getLogger(__name__)

router = APIRouter()


# ============================================================================
# Helper Functions
# ============================================================================

def parse_quarter(quarter_str: str) -> tuple[date, date]:
    """
    Parse quarter string (e.g., 'Q1 2025', '2025-Q1') into date range.
    
    Returns tuple of (quarter_start, quarter_end) dates.
    """
    # Normalize format
    quarter_str = quarter_str.upper().strip()

    # Try different formats
    if 'Q' in quarter_str:
        parts = quarter_str.replace('Q', '').replace('-', ' ').split()
        if len(parts) == 2:
            # Determine which part is the quarter (1-4) and which is the year (20XX)
            part0, part1 = int(parts[0]), int(parts[1])
            if 1 <= part0 <= 4:
                q, year = part0, part1
            elif 1 <= part1 <= 4:
                q, year = part1, part0
            else:
                raise ValueError(f"Invalid quarter format: {quarter_str}")
        else:
            raise ValueError(f"Invalid quarter format: {quarter_str}")
    else:
        raise ValueError(f"Invalid quarter format: {quarter_str}")

    # Calculate quarter dates
    if q == 1:
        start = date(year, 1, 1)
        end = date(year, 3, 31)
    elif q == 2:
        start = date(year, 4, 1)
        end = date(year, 6, 30)
    elif q == 3:
        start = date(year, 7, 1)
        end = date(year, 9, 30)
    elif q == 4:
        start = date(year, 10, 1)
        end = date(year, 12, 31)
    else:
        raise ValueError(f"Invalid quarter number: {q}")

    return start, end


def compute_quality_score(catalyst: CatalystEvent) -> float:
    """
    Compute transparent catalyst quality score (0-100).
    
    Formula components:
    - phase_weight * 30 (Phase III = 30, Phase II = 20, Phase I = 10)
    - endpoint_rigor * 20
    - min(20, log(n+1) * 2) (enrollment score)
    - breakthrough * 10
    - orphan * 8
    - market_depth * 10
    - complexity_penalty * -5
    """
    score = 0.0

    # Phase weight
    if catalyst.phase_weight:
        score += catalyst.phase_weight * 30

    # Endpoint rigor
    if catalyst.endpoint_rigor:
        score += catalyst.endpoint_rigor * 20

    # Enrollment (log scale)
    if catalyst.n:
        import math
        score += min(20, math.log1p(catalyst.n) * 2)

    # Regulatory designations
    if catalyst.breakthrough:
        score += 10
    if catalyst.orphan:
        score += 8

    # Market depth
    if catalyst.market_depth:
        score += catalyst.market_depth * 10

    # Complexity penalty
    if catalyst.complexity_penalty:
        score -= catalyst.complexity_penalty * 5

    return max(0, min(100, score))


def create_source_provenance(
    db: Session,
    prov_data: SourceProvenanceContract
) -> SourceProvenance:
    """Create a source provenance record from contract"""
    prov = SourceProvenance(
        source_url=prov_data.source_url,
        source_type=prov_data.source_type,
        accessed_at=prov_data.accessed_at,
        content_hash=prov_data.content_hash,
        parser_version=prov_data.parser_version,
        selector=prov_data.selector,
        verbatim_excerpt=prov_data.verbatim_excerpt,
        source_metadata=prov_data.source_metadata,
    )
    db.add(prov)
    db.flush()
    return prov


def link_entity_to_sources(
    db: Session,
    entity_type: str,
    entity_id: int,
    source_prov_ids: List[int]
):
    """Link entity to multiple source provenance records"""
    for idx, prov_id in enumerate(source_prov_ids):
        link = EntitySourceLink(
            entity_type=entity_type,
            entity_id=entity_id,
            source_provenance_id=prov_id,
            is_primary=(idx == 0)  # First source is primary
        )
        db.add(link)
    db.flush()


def get_entity_sources(
    db: Session,
    entity_type: str,
    entity_id: int
) -> List[SourceProvenance]:
    """Get all source provenance records for an entity"""
    links = db.query(EntitySourceLink).filter(
        EntitySourceLink.entity_type == entity_type,
        EntitySourceLink.entity_id == entity_id
    ).all()

    return [
        db.query(SourceProvenance).get(link.source_provenance_id)
        for link in links
        if db.query(SourceProvenance).get(link.source_provenance_id) is not None
    ]


# ============================================================================
# API Endpoints
# ============================================================================

@router.get("/", response_model=CatalystEventListResponse)
async def get_catalysts(
    # Search
    search: Optional[str] = Query(None, description="Search in title, description, company, drug"),

    # Company filters
    company: Optional[str] = Query(None, description="Company name or ticker"),
    ticker: Optional[str] = Query(None, description="Company ticker"),
    company_id: Optional[int] = Query(None, description="Company ID"),

    # Event type filters
    event_type: Optional[str] = Query(None, description="Event type (use CatalystEventType enum)"),

    # Phase filter
    phase: Optional[str] = Query(None, description="Trial phase (e.g., 'Phase III')"),

    # Date filters
    quarter: Optional[str] = Query(None, description="Quarter (e.g., 'Q1 2025')"),
    from_date: Optional[date] = Query(None, alias="from", description="Start date"),
    to_date: Optional[date] = Query(None, alias="to", description="End date"),

    # PoS and confidence filters
    pos_min: Optional[float] = Query(None, ge=0, le=1, description="Minimum probability of success"),
    pos_max: Optional[float] = Query(None, ge=0, le=1, description="Maximum probability of success"),
    confidence: Optional[str] = Query(None, description="Date confidence level"),

    # Additional filters
    target_gene: Optional[str] = Query(None, description="Target gene"),
    indication: Optional[str] = Query(None, description="Indication"),
    orphan: Optional[bool] = Query(None, description="Has orphan designation"),
    fast_track: Optional[bool] = Query(None, description="Has fast track designation"),
    breakthrough: Optional[bool] = Query(None, description="Has breakthrough designation"),

    # Status
    status: Optional[str] = Query("UPCOMING", description="Event status"),

    # Pagination
    limit: int = Query(50, ge=1, le=200, description="Results per page"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),

    db: Session = Depends(get_db)
):
    """
    Get catalyst events with advanced filtering and provenance.
    
    Supports multi-facet filtering by:
    - Company (name, ticker, ID)
    - Event type (controlled vocabulary)
    - Trial phase
    - Date range or quarter
    - Probability of success range
    - Date confidence level
    - Target gene, indication
    - Regulatory designations (orphan, fast track, breakthrough)
    - Status
    
    Returns paginated results with provenance links.
    """
    try:
        # Build base query
        query = db.query(CatalystEvent)

        # Search filter
        if search:
            search_term = f"%{search}%"
            query = query.join(Company, CatalystEvent.company_id == Company.id)
            query = query.filter(
                or_(
                    CatalystEvent.title.ilike(search_term),
                    CatalystEvent.description.ilike(search_term),
                    Company.name.ilike(search_term),
                    Company.ticker.ilike(search_term),
                    CatalystEvent.indication.ilike(search_term),
                )
            )

        # Company filters
        if company_id:
            query = query.filter(CatalystEvent.company_id == company_id)
        elif company or ticker:
            if not search:  # Avoid double join
                query = query.join(Company, CatalystEvent.company_id == Company.id)
            if company:
                query = query.filter(Company.name.ilike(f"%{company}%"))
            if ticker:
                query = query.filter(Company.ticker.ilike(f"%{ticker}%"))

        # Event type filter
        if event_type:
            query = query.filter(CatalystEvent.event_type == event_type)

        # Phase filter
        if phase:
            query = query.filter(CatalystEvent.trial_phase.ilike(f"%{phase}%"))

        # Date filters
        if quarter:
            try:
                q_start, q_end = parse_quarter(quarter)
                query = query.filter(
                    or_(
                        and_(
                            CatalystEvent.event_window_start.isnot(None),
                            CatalystEvent.event_window_start >= q_start,
                            CatalystEvent.event_window_start <= q_end
                        ),
                        and_(
                            CatalystEvent.expected_date.isnot(None),
                            CatalystEvent.expected_date >= q_start,
                            CatalystEvent.expected_date <= q_end
                        )
                    )
                )
            except ValueError as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid quarter format: {str(e)}"
                )

        if from_date:
            query = query.filter(
                or_(
                    CatalystEvent.event_window_start >= from_date,
                    CatalystEvent.expected_date >= from_date
                )
            )

        if to_date:
            query = query.filter(
                or_(
                    CatalystEvent.event_window_end <= to_date,
                    CatalystEvent.expected_date <= to_date
                )
            )

        # PoS filters
        if pos_min is not None:
            query = query.filter(CatalystEvent.prob_of_success >= pos_min)

        if pos_max is not None:
            query = query.filter(CatalystEvent.prob_of_success <= pos_max)

        # Confidence filter
        if confidence:
            query = query.filter(CatalystEvent.date_confidence == confidence)

        # Target gene filter
        if target_gene:
            query = query.filter(CatalystEvent.target_gene.ilike(f"%{target_gene}%"))

        # Indication filter
        if indication:
            query = query.filter(CatalystEvent.indication.ilike(f"%{indication}%"))

        # Regulatory designation filters
        if orphan is not None:
            query = query.filter(CatalystEvent.orphan == orphan)

        if fast_track is not None:
            query = query.filter(CatalystEvent.fast_track == fast_track)

        if breakthrough is not None:
            query = query.filter(CatalystEvent.breakthrough == breakthrough)

        # Status filter
        if status:
            query = query.filter(CatalystEvent.status == status)

        # Count total results
        total = query.count()

        # Apply pagination and ordering
        query = query.order_by(
            CatalystEvent.event_window_start.asc().nullslast(),
            CatalystEvent.expected_date.asc().nullslast(),
            CatalystEvent.created_at.desc()
        )
        query = query.offset(offset).limit(limit)

        # Execute query
        catalysts = query.all()

        # Build response with provenance
        response_data = []
        for catalyst in catalysts:
            # Get source provenance
            sources = get_entity_sources(db, "CATALYST_EVENT", catalyst.id)
            evidence = [
                SourceProvenanceResponse(
                    id=src.id,
                    source_url=src.source_url,
                    source_type=src.source_type,
                    accessed_at=src.accessed_at,
                    content_hash=src.content_hash,
                    parser_version=src.parser_version,
                    selector=src.selector,
                    verbatim_excerpt=src.verbatim_excerpt,
                    source_metadata=src.source_metadata,
                    created_at=src.created_at
                )
                for src in sources
            ]

            # Get analyst notes
            notes = db.query(AnalystNote).filter(
                AnalystNote.entity_type == "CATALYST_EVENT",
                AnalystNote.entity_id == catalyst.id
            ).all()

            analyst_notes = [
                AnalystNoteResponse(
                    id=note.id,
                    entity_type=note.entity_type,
                    entity_id=note.entity_id,
                    author=note.author,
                    note=note.note,
                    note_type=note.note_type,
                    override_field=note.override_field,
                    override_value=note.override_value,
                    created_at=note.created_at,
                    updated_at=note.updated_at
                )
                for note in notes
            ]

            response_data.append(
                CatalystEventDetailResponse(
                    id=catalyst.id,
                    company_id=catalyst.company_id,
                    program_id=catalyst.program_id,
                    trial_id=catalyst.trial_id,
                    event_type=catalyst.event_type,
                    title=catalyst.title,
                    description=catalyst.description,
                    event_window_start=catalyst.event_window_start,
                    event_window_end=catalyst.event_window_end,
                    expected_date=catalyst.expected_date,
                    actual_date=catalyst.actual_date,
                    date_confidence=catalyst.date_confidence,
                    timing_clarity_score=catalyst.timing_clarity_score,
                    endpoint=catalyst.endpoint,
                    primary_endpoint_type=catalyst.primary_endpoint_type,
                    control_type=catalyst.control_type,
                    indication=catalyst.indication,
                    trial_nct_id=catalyst.trial_nct_id,
                    trial_phase=catalyst.trial_phase,
                    trial_design=catalyst.trial_design,
                    target_gene=catalyst.target_gene,
                    n=catalyst.n,
                    orphan=catalyst.orphan,
                    fast_track=catalyst.fast_track,
                    breakthrough=catalyst.breakthrough,
                    event_leverage=catalyst.event_leverage,
                    endpoint_rigor=catalyst.endpoint_rigor,
                    market_depth=catalyst.market_depth,
                    phase_weight=catalyst.phase_weight,
                    unmet_need=catalyst.unmet_need,
                    complexity_penalty=catalyst.complexity_penalty,
                    quality_score=catalyst.quality_score,
                    prob_of_success=catalyst.prob_of_success,
                    pos_overridden=catalyst.pos_overridden,
                    expected_impact=catalyst.expected_impact,
                    actual_outcome=catalyst.actual_outcome,
                    actual_move_pct=catalyst.actual_move_pct,
                    status=catalyst.status,
                    last_reviewed_at=catalyst.last_reviewed_at,
                    created_at=catalyst.created_at,
                    updated_at=catalyst.updated_at,
                    evidence=evidence,
                    analyst_notes=analyst_notes
                )
            )

        return CatalystEventListResponse(
            data=response_data,
            total=total,
            page=offset // limit + 1,
            page_size=limit,
            filters={
                "search": search,
                "company": company,
                "ticker": ticker,
                "company_id": company_id,
                "event_type": event_type,
                "phase": phase,
                "quarter": quarter,
                "from": from_date.isoformat() if from_date else None,
                "to": to_date.isoformat() if to_date else None,
                "pos_min": pos_min,
                "pos_max": pos_max,
                "confidence": confidence,
                "target_gene": target_gene,
                "indication": indication,
                "orphan": orphan,
                "fast_track": fast_track,
                "breakthrough": breakthrough,
                "status": status
            }
        )

    except Exception as e:
        logger.error(f"Error fetching catalysts: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch catalysts: {str(e)}"
        )


@router.get("/{catalyst_id}", response_model=CatalystEventDetailResponse)
async def get_catalyst_by_id(
    catalyst_id: int,
    db: Session = Depends(get_db)
):
    """
    Get catalyst event by ID with full provenance.
    
    Returns:
    - Complete catalyst details
    - All linked source provenance records with excerpts
    - Analyst notes with author and timestamps
    """
    try:
        # Get catalyst with eager loading
        catalyst = db.query(CatalystEvent).filter(
            CatalystEvent.id == catalyst_id
        ).first()

        if not catalyst:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Catalyst event {catalyst_id} not found"
            )

        # Get source provenance
        sources = get_entity_sources(db, "CATALYST_EVENT", catalyst.id)
        evidence = [
            SourceProvenanceResponse(
                id=src.id,
                source_url=src.source_url,
                source_type=src.source_type,
                accessed_at=src.accessed_at,
                content_hash=src.content_hash,
                parser_version=src.parser_version,
                selector=src.selector,
                verbatim_excerpt=src.verbatim_excerpt,
                source_metadata=src.source_metadata,
                created_at=src.created_at
            )
            for src in sources
        ]

        # Get analyst notes
        notes = db.query(AnalystNote).filter(
            AnalystNote.entity_type == "CATALYST_EVENT",
            AnalystNote.entity_id == catalyst.id
        ).order_by(AnalystNote.created_at.desc()).all()

        analyst_notes = [
            AnalystNoteResponse(
                id=note.id,
                entity_type=note.entity_type,
                entity_id=note.entity_id,
                author=note.author,
                note=note.note,
                note_type=note.note_type,
                override_field=note.override_field,
                override_value=note.override_value,
                created_at=note.created_at,
                updated_at=note.updated_at
            )
            for note in notes
        ]

        return CatalystEventDetailResponse(
            id=catalyst.id,
            company_id=catalyst.company_id,
            program_id=catalyst.program_id,
            trial_id=catalyst.trial_id,
            event_type=catalyst.event_type,
            title=catalyst.title,
            description=catalyst.description,
            event_window_start=catalyst.event_window_start,
            event_window_end=catalyst.event_window_end,
            expected_date=catalyst.expected_date,
            actual_date=catalyst.actual_date,
            date_confidence=catalyst.date_confidence,
            timing_clarity_score=catalyst.timing_clarity_score,
            endpoint=catalyst.endpoint,
            primary_endpoint_type=catalyst.primary_endpoint_type,
            control_type=catalyst.control_type,
            indication=catalyst.indication,
            trial_nct_id=catalyst.trial_nct_id,
            trial_phase=catalyst.trial_phase,
            trial_design=catalyst.trial_design,
            target_gene=catalyst.target_gene,
            n=catalyst.n,
            orphan=catalyst.orphan,
            fast_track=catalyst.fast_track,
            breakthrough=catalyst.breakthrough,
            event_leverage=catalyst.event_leverage,
            endpoint_rigor=catalyst.endpoint_rigor,
            market_depth=catalyst.market_depth,
            phase_weight=catalyst.phase_weight,
            unmet_need=catalyst.unmet_need,
            complexity_penalty=catalyst.complexity_penalty,
            quality_score=catalyst.quality_score,
            prob_of_success=catalyst.prob_of_success,
            pos_overridden=catalyst.pos_overridden,
            expected_impact=catalyst.expected_impact,
            actual_outcome=catalyst.actual_outcome,
            actual_move_pct=catalyst.actual_move_pct,
            status=catalyst.status,
            last_reviewed_at=catalyst.last_reviewed_at,
            created_at=catalyst.created_at,
            updated_at=catalyst.updated_at,
            evidence=evidence,
            analyst_notes=analyst_notes
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching catalyst {catalyst_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch catalyst: {str(e)}"
        )


@router.post("/", response_model=CatalystEventDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_catalyst(
    catalyst_data: CatalystEventCreateContract,
    db: Session = Depends(get_db)
):
    """
    Create a new catalyst event with provenance.
    
    Requires:
    - At least one source provenance record
    - Valid company_id reference
    - Event window dates (if provided) must be logical
    
    Returns created catalyst with all provenance attached.
    """
    try:
        # Validate company exists
        company = db.query(Company).get(catalyst_data.company_id)
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Company {catalyst_data.company_id} not found"
            )

        # Validate program if provided
        if catalyst_data.program_id:
            program = db.query(Program).get(catalyst_data.program_id)
            if not program:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Program {catalyst_data.program_id} not found"
                )

        # Validate trial if provided
        if catalyst_data.trial_id:
            trial = db.query(Trial).get(catalyst_data.trial_id)
            if not trial:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Trial {catalyst_data.trial_id} not found"
                )

        # Create catalyst event
        catalyst = CatalystEvent(
            company_id=catalyst_data.company_id,
            program_id=catalyst_data.program_id,
            trial_id=catalyst_data.trial_id,
            event_type=catalyst_data.event_type,
            title=catalyst_data.title,
            description=catalyst_data.description,
            event_window_start=catalyst_data.event_window_start,
            event_window_end=catalyst_data.event_window_end,
            expected_date=catalyst_data.expected_date,
            date_confidence=catalyst_data.date_confidence,
            endpoint=catalyst_data.endpoint,
            primary_endpoint_type=catalyst_data.primary_endpoint_type,
            control_type=catalyst_data.control_type,
            indication=catalyst_data.indication,
            trial_nct_id=catalyst_data.trial_nct_id,
            trial_phase=catalyst_data.trial_phase,
            trial_design=catalyst_data.trial_design,
            target_gene=catalyst_data.target_gene,
            n=catalyst_data.n,
            orphan=catalyst_data.orphan,
            fast_track=catalyst_data.fast_track,
            breakthrough=catalyst_data.breakthrough,
            event_leverage=catalyst_data.event_leverage,
            endpoint_rigor=catalyst_data.endpoint_rigor,
            market_depth=catalyst_data.market_depth,
            phase_weight=catalyst_data.phase_weight,
            unmet_need=catalyst_data.unmet_need,
            complexity_penalty=catalyst_data.complexity_penalty,
            prob_of_success=catalyst_data.prob_of_success,
            expected_impact=catalyst_data.expected_impact,
            status=catalyst_data.status
        )

        # Compute quality score
        db.add(catalyst)
        db.flush()  # Get ID

        catalyst.quality_score = compute_quality_score(catalyst)

        # Create source provenance records
        source_ids = []
        for prov_data in catalyst_data.source_provenance:
            prov = create_source_provenance(db, prov_data)
            source_ids.append(prov.id)

        # Link sources to catalyst
        link_entity_to_sources(db, "CATALYST_EVENT", catalyst.id, source_ids)

        # Commit transaction
        db.commit()
        db.refresh(catalyst)

        # Return with provenance
        return await get_catalyst_by_id(catalyst.id, db)

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating catalyst: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create catalyst: {str(e)}"
        )


@router.patch("/{catalyst_id}", response_model=CatalystEventDetailResponse)
async def update_catalyst(
    catalyst_id: int,
    update_data: CatalystEventUpdateContract,
    db: Session = Depends(get_db)
):
    """
    Update catalyst event.
    
    Allows updating catalyst details and adding new provenance records.
    If source_provenance is provided, new sources are linked to the catalyst.
    """
    try:
        # Get existing catalyst
        catalyst = db.query(CatalystEvent).get(catalyst_id)
        if not catalyst:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Catalyst event {catalyst_id} not found"
            )

        # Update fields
        update_dict = update_data.model_dump(exclude_unset=True, exclude={'source_provenance'})
        for field, value in update_dict.items():
            setattr(catalyst, field, value)

        # Recompute quality score if scoring fields changed
        if any(f in update_dict for f in ['event_leverage', 'endpoint_rigor', 'market_depth',
                                           'phase_weight', 'unmet_need', 'complexity_penalty', 'n']):
            catalyst.quality_score = compute_quality_score(catalyst)

        # Add new provenance if provided
        if update_data.source_provenance:
            source_ids = []
            for prov_data in update_data.source_provenance:
                prov = create_source_provenance(db, prov_data)
                source_ids.append(prov.id)

            # Link new sources
            link_entity_to_sources(db, "CATALYST_EVENT", catalyst.id, source_ids)

        # Update timestamp
        catalyst.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(catalyst)

        # Return updated catalyst with provenance
        return await get_catalyst_by_id(catalyst.id, db)

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating catalyst {catalyst_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update catalyst: {str(e)}"
        )

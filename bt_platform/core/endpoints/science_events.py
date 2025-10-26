"""
Science Event Store API Endpoints

Persistent, queryable, versioned science event/evidence store.
Provides canonical backend storage for:
- Clinical readouts
- Mechanism insights
- Evidence journals
- Regulatory updates
- Target validations

Supports historical querying, filtering, aggregation, versioning, and linkage.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, func
from datetime import datetime, timedelta, date
from typing import Optional, List, Dict, Any
from ..database import get_db
from ..schema import ScienceEvent, Evidence, EventRelationship
from ..contracts import ScienceEventContract, EventRelationshipContract

router = APIRouter()


@router.post("/science-events", status_code=201)
async def create_science_event(
    event: ScienceEventContract,
    db: Session = Depends(get_db)
):
    """
    Create a new science event in the persistent store.

    Every event is stored as a discrete, versioned record with full provenance.
    """
    db_event = ScienceEvent(
        event_type=event.event_type,
        event_category=event.event_category,
        title=event.title,
        description=event.description,
        summary=event.summary,
        event_date=event.event_date,
        published_date=event.published_date,
        entity_type=event.entity_type,
        entity_id=event.entity_id,
        entity_name=event.entity_name,
        related_entities=event.related_entities,
        source_type=event.source_type,
        source_url=event.source_url,
        source_event_metadata=event.source_metadata,
        content=event.content,
        key_findings=event.key_findings,
        impact_assessment=event.impact_assessment,
        evidence_class=event.evidence_class,
        confidence_score=event.confidence_score,
        impact_score=event.impact_score,
        tags=event.tags,
        event_metadata=event.metadata,
        provider_file_sha256=event.provider_file_sha256,
        version=1,
        is_current=True
    )

    db.add(db_event)
    db.commit()
    db.refresh(db_event)

    return {
        "id": db_event.id,
        "event_type": db_event.event_type,
        "title": db_event.title,
        "event_date": db_event.event_date,
        "created_at": db_event.created_at
    }


@router.get("/science-events")
async def list_science_events(
    event_type: Optional[str] = Query(None, description="Filter by event type"),
    event_category: Optional[str] = Query(None, description="Filter by category"),
    entity_type: Optional[str] = Query(None, description="Filter by entity type"),
    entity_id: Optional[str] = Query(None, description="Filter by entity ID"),
    source_type: Optional[str] = Query(None, description="Filter by source type"),
    evidence_class: Optional[str] = Query(None, description="Filter by evidence class"),
    from_date: Optional[str] = Query(None, description="Start date (ISO format)"),
    to_date: Optional[str] = Query(None, description="End date (ISO format)"),
    tags: Optional[str] = Query(None, description="Comma-separated tags"),
    min_confidence: Optional[float] = Query(None, ge=0, le=1, description="Minimum confidence score"),
    min_impact: Optional[float] = Query(None, ge=0, le=1, description="Minimum impact score"),
    current_only: bool = Query(True, description="Only return current versions"),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """
    Query science events with flexible filtering.

    Supports historical querying, filtering by date range, entity, source,
    confidence/impact scores, and tags.
    """
    query = db.query(ScienceEvent)

    # Apply filters
    if current_only:
        query = query.filter(ScienceEvent.is_current == True)

    if event_type:
        query = query.filter(ScienceEvent.event_type == event_type)

    if event_category:
        query = query.filter(ScienceEvent.event_category == event_category)

    if entity_type:
        query = query.filter(ScienceEvent.entity_type == entity_type)

    if entity_id:
        query = query.filter(ScienceEvent.entity_id == entity_id)

    if source_type:
        query = query.filter(ScienceEvent.source_type == source_type)

    if evidence_class:
        query = query.filter(ScienceEvent.evidence_class == evidence_class)

    if from_date:
        from_dt = datetime.fromisoformat(from_date.replace('Z', '+00:00'))
        query = query.filter(ScienceEvent.event_date >= from_dt)

    if to_date:
        to_dt = datetime.fromisoformat(to_date.replace('Z', '+00:00'))
        query = query.filter(ScienceEvent.event_date <= to_dt)

    if min_confidence is not None:
        query = query.filter(ScienceEvent.confidence_score >= min_confidence)

    if min_impact is not None:
        query = query.filter(ScienceEvent.impact_score >= min_impact)

    if tags:
        tag_list = [t.strip() for t in tags.split(',')]
        # Filter events that have any of the specified tags
        query = query.filter(
            or_(*[ScienceEvent.tags.contains([tag]) for tag in tag_list])
        )

    # Order by event date descending
    query = query.order_by(desc(ScienceEvent.event_date))

    # Get total count before pagination
    total = query.count()

    # Apply pagination
    events = query.offset(offset).limit(limit).all()

    return {
        "events": [
            {
                "id": event.id,
                "event_type": event.event_type,
                "event_category": event.event_category,
                "title": event.title,
                "summary": event.summary,
                "event_date": event.event_date,
                "published_date": event.published_date,
                "entity_type": event.entity_type,
                "entity_id": event.entity_id,
                "entity_name": event.entity_name,
                "source_type": event.source_type,
                "source_url": event.source_url,
                "evidence_class": event.evidence_class,
                "confidence_score": event.confidence_score,
                "impact_score": event.impact_score,
                "version": event.version,
                "is_current": event.is_current,
                "tags": event.tags,
                "created_at": event.created_at
            }
            for event in events
        ],
        "total": total,
        "limit": limit,
        "offset": offset
    }


@router.get("/science-events/{event_id}")
async def get_science_event(
    event_id: int,
    db: Session = Depends(get_db)
):
    """
    Get detailed information about a specific science event.
    """
    event = db.query(ScienceEvent).filter(ScienceEvent.id == event_id).first()

    if not event:
        raise HTTPException(status_code=404, detail="Science event not found")

    return {
        "id": event.id,
        "event_type": event.event_type,
        "event_category": event.event_category,
        "title": event.title,
        "description": event.description,
        "summary": event.summary,
        "event_date": event.event_date,
        "published_date": event.published_date,
        "entity_type": event.entity_type,
        "entity_id": event.entity_id,
        "entity_name": event.entity_name,
        "related_entities": event.related_entities,
        "source_type": event.source_type,
        "source_url": event.source_url,
        "source_metadata": event.source_metadata,
        "content": event.content,
        "key_findings": event.key_findings,
        "impact_assessment": event.impact_assessment,
        "evidence_class": event.evidence_class,
        "confidence_score": event.confidence_score,
        "impact_score": event.impact_score,
        "version": event.version,
        "parent_version_id": event.parent_version_id,
        "is_current": event.is_current,
        "change_summary": event.change_summary,
        "tags": event.tags,
        "metadata": event.metadata,
        "created_at": event.created_at,
        "updated_at": event.updated_at
    }


@router.get("/science-events/{event_id}/history")
async def get_event_history(
    event_id: int,
    db: Session = Depends(get_db)
):
    """
    Get the version history of a science event.

    Returns all versions of the event in chronological order.
    """
    # Get the current event
    current_event = db.query(ScienceEvent).filter(
        ScienceEvent.id == event_id
    ).first()

    if not current_event:
        raise HTTPException(status_code=404, detail="Science event not found")

    # If this is a version, find the root
    root_id = event_id
    while current_event.parent_version_id is not None:
        root_id = current_event.parent_version_id
        current_event = db.query(ScienceEvent).filter(
            ScienceEvent.id == root_id
        ).first()

    # Get all versions starting from root
    versions = []
    queue = [root_id]
    visited = set()

    while queue:
        current_id = queue.pop(0)
        if current_id in visited:
            continue
        visited.add(current_id)

        event = db.query(ScienceEvent).filter(ScienceEvent.id == current_id).first()
        if event:
            versions.append(event)
            # Find child versions
            children = db.query(ScienceEvent).filter(
                ScienceEvent.parent_version_id == current_id
            ).all()
            queue.extend([child.id for child in children])

    # Sort by version number
    versions.sort(key=lambda x: x.version)

    return {
        "versions": [
            {
                "id": v.id,
                "version": v.version,
                "title": v.title,
                "event_date": v.event_date,
                "is_current": v.is_current,
                "change_summary": v.change_summary,
                "created_at": v.created_at
            }
            for v in versions
        ]
    }


@router.put("/science-events/{event_id}")
async def update_science_event(
    event_id: int,
    event: ScienceEventContract,
    change_summary: Optional[str] = Query(None, description="Summary of changes"),
    db: Session = Depends(get_db)
):
    """
    Update a science event by creating a new version.

    Preserves the old version for historical tracking.
    """
    # Get the current event
    current_event = db.query(ScienceEvent).filter(
        ScienceEvent.id == event_id,
        ScienceEvent.is_current == True
    ).first()

    if not current_event:
        raise HTTPException(status_code=404, detail="Science event not found or not current")

    # Mark current event as not current
    current_event.is_current = False

    # Create new version
    new_event = ScienceEvent(
        event_type=event.event_type,
        event_category=event.event_category,
        title=event.title,
        description=event.description,
        summary=event.summary,
        event_date=event.event_date,
        published_date=event.published_date,
        entity_type=event.entity_type,
        entity_id=event.entity_id,
        entity_name=event.entity_name,
        related_entities=event.related_entities,
        source_type=event.source_type,
        source_url=event.source_url,
        source_event_metadata=event.source_metadata,
        content=event.content,
        key_findings=event.key_findings,
        impact_assessment=event.impact_assessment,
        evidence_class=event.evidence_class,
        confidence_score=event.confidence_score,
        impact_score=event.impact_score,
        tags=event.tags,
        event_metadata=event.metadata,
        provider_file_sha256=event.provider_file_sha256,
        version=current_event.version + 1,
        parent_version_id=event_id,
        is_current=True,
        change_summary=change_summary
    )

    db.add(new_event)
    db.commit()
    db.refresh(new_event)

    return {
        "id": new_event.id,
        "version": new_event.version,
        "parent_version_id": new_event.parent_version_id,
        "created_at": new_event.created_at
    }


@router.get("/science-events/timeline/{entity_type}/{entity_id}")
async def get_entity_timeline(
    entity_type: str,
    entity_id: str,
    from_date: Optional[str] = Query(None, description="Start date (ISO format)"),
    to_date: Optional[str] = Query(None, description="End date (ISO format)"),
    event_types: Optional[str] = Query(None, description="Comma-separated event types"),
    db: Session = Depends(get_db)
):
    """
    Get a timeline of science events for a specific entity.

    Perfect for building evidence timelines and science dashboards.
    """
    query = db.query(ScienceEvent).filter(
        ScienceEvent.entity_type == entity_type,
        ScienceEvent.entity_id == entity_id,
        ScienceEvent.is_current == True
    )

    if from_date:
        from_dt = datetime.fromisoformat(from_date.replace('Z', '+00:00'))
        query = query.filter(ScienceEvent.event_date >= from_dt)

    if to_date:
        to_dt = datetime.fromisoformat(to_date.replace('Z', '+00:00'))
        query = query.filter(ScienceEvent.event_date <= to_dt)

    if event_types:
        type_list = [t.strip() for t in event_types.split(',')]
        query = query.filter(ScienceEvent.event_type.in_(type_list))

    events = query.order_by(ScienceEvent.event_date).all()

    return {
        "entity_type": entity_type,
        "entity_id": entity_id,
        "timeline": [
            {
                "id": event.id,
                "event_type": event.event_type,
                "event_category": event.event_category,
                "title": event.title,
                "summary": event.summary,
                "event_date": event.event_date,
                "source_type": event.source_type,
                "source_url": event.source_url,
                "evidence_class": event.evidence_class,
                "confidence_score": event.confidence_score,
                "impact_score": event.impact_score,
                "key_findings": event.key_findings
            }
            for event in events
        ],
        "total_events": len(events)
    }


@router.post("/event-relationships", status_code=201)
async def create_event_relationship(
    relationship: EventRelationshipContract,
    db: Session = Depends(get_db)
):
    """
    Create a relationship between two science events.

    Useful for building knowledge graphs and understanding event connections.
    """
    # Verify both events exist
    source = db.query(ScienceEvent).filter(ScienceEvent.id == relationship.source_event_id).first()
    target = db.query(ScienceEvent).filter(ScienceEvent.id == relationship.target_event_id).first()

    if not source or not target:
        raise HTTPException(status_code=404, detail="One or both events not found")

    db_rel = EventRelationship(
        source_event_id=relationship.source_event_id,
        target_event_id=relationship.target_event_id,
        relationship_type=relationship.relationship_type,
        description=relationship.description,
        confidence=relationship.confidence,
        event_metadata=relationship.metadata
    )

    db.add(db_rel)
    db.commit()
    db.refresh(db_rel)

    return {
        "id": db_rel.id,
        "source_event_id": db_rel.source_event_id,
        "target_event_id": db_rel.target_event_id,
        "relationship_type": db_rel.relationship_type,
        "created_at": db_rel.created_at
    }


@router.get("/event-relationships/{event_id}")
async def get_event_relationships(
    event_id: int,
    relationship_type: Optional[str] = Query(None, description="Filter by relationship type"),
    direction: str = Query("both", regex="^(incoming|outgoing|both)$"),
    db: Session = Depends(get_db)
):
    """
    Get relationships for a science event.

    Returns incoming, outgoing, or both relationship directions.
    """
    query_conditions = []

    if direction in ["incoming", "both"]:
        query_conditions.append(EventRelationship.target_event_id == event_id)

    if direction in ["outgoing", "both"]:
        query_conditions.append(EventRelationship.source_event_id == event_id)

    query = db.query(EventRelationship).filter(or_(*query_conditions))

    if relationship_type:
        query = query.filter(EventRelationship.relationship_type == relationship_type)

    relationships = query.all()

    return {
        "event_id": event_id,
        "relationships": [
            {
                "id": rel.id,
                "source_event_id": rel.source_event_id,
                "target_event_id": rel.target_event_id,
                "relationship_type": rel.relationship_type,
                "description": rel.description,
                "confidence": rel.confidence,
                "created_at": rel.created_at
            }
            for rel in relationships
        ]
    }


@router.get("/science-events/aggregate/by-type")
async def aggregate_events_by_type(
    from_date: Optional[str] = Query(None, description="Start date (ISO format)"),
    to_date: Optional[str] = Query(None, description="End date (ISO format)"),
    entity_type: Optional[str] = Query(None, description="Filter by entity type"),
    db: Session = Depends(get_db)
):
    """
    Aggregate science events by type for dashboard views.
    """
    query = db.query(
        ScienceEvent.event_type,
        func.count(ScienceEvent.id).label('count')
    ).filter(ScienceEvent.is_current == True)

    if from_date:
        from_dt = datetime.fromisoformat(from_date.replace('Z', '+00:00'))
        query = query.filter(ScienceEvent.event_date >= from_dt)

    if to_date:
        to_dt = datetime.fromisoformat(to_date.replace('Z', '+00:00'))
        query = query.filter(ScienceEvent.event_date <= to_dt)

    if entity_type:
        query = query.filter(ScienceEvent.entity_type == entity_type)

    results = query.group_by(ScienceEvent.event_type).all()

    return {
        "aggregations": [
            {
                "event_type": result.event_type,
                "count": result.count
            }
            for result in results
        ]
    }


@router.get("/science-events/search")
async def search_science_events(
    q: str = Query(..., min_length=3, description="Search query"),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """
    Full-text search across science events.

    Searches title, description, summary, and content fields.
    """
    search_pattern = f"%{q}%"

    events = db.query(ScienceEvent).filter(
        ScienceEvent.is_current == True,
        or_(
            ScienceEvent.title.ilike(search_pattern),
            ScienceEvent.description.ilike(search_pattern),
            ScienceEvent.summary.ilike(search_pattern),
            ScienceEvent.content.ilike(search_pattern)
        )
    ).order_by(desc(ScienceEvent.event_date)).limit(limit).all()

    return {
        "query": q,
        "results": [
            {
                "id": event.id,
                "event_type": event.event_type,
                "title": event.title,
                "summary": event.summary,
                "event_date": event.event_date,
                "entity_type": event.entity_type,
                "entity_id": event.entity_id,
                "source_type": event.source_type
            }
            for event in events
        ],
        "count": len(events)
    }

# Science Event Store - Implementation Guide

## Overview

The **Science Event Store** is a persistent, queryable, versioned backend system for capturing and managing science-relevant updates in structured form. It provides a canonical store for clinical readouts, mechanism insights, evidence journals, and regulatory updates with full provenance tracking, versioning, and relationship management.

## Problem Statement

Previously, science-relevant updates were surfaced as ephemeral "reports" shown in the terminal or UI without durable backend storage. This created several issues:

- **No canonical record**: Updates were generated on-the-fly, not stored for reuse
- **No historical tracking**: Past states of evidence couldn't be queried
- **No relationships**: Connections between events weren't captured
- **Duplication**: Terminal/UI layers had to regenerate content
- **No versioning**: Updates overwrote previous information without history

## Solution: Persistent Science Event Store

The Science Event Store provides:

1. **Discrete, versioned records** with timestamps, source metadata, and relationships
2. **Queryable storage** for historical data, filtering, and aggregation  
3. **Evidence timelines** and science dashboards over time
4. **Reusable data** across TUI and Web UI layers
5. **Knowledge graph** capabilities through event relationships

## Architecture

### Database Schema

#### ScienceEvent Model

The core model for storing science events:

```python
class ScienceEvent(Base):
    """Persistent science event store"""
    __tablename__ = "science_events"
    
    # Identity
    id: int (primary key)
    event_type: str  # CLINICAL_READOUT, MECHANISM_INSIGHT, etc.
    event_category: str  # CLINICAL, PRECLINICAL, REGULATORY, etc.
    title: str
    description: text
    summary: text
    
    # Temporal
    event_date: datetime (indexed)
    published_date: date
    
    # Entity associations
    entity_type: str  # DRUG, COMPANY, TARGET, INDICATION, TRIAL
    entity_id: str
    entity_name: str
    related_entities: JSON  # Array of related entities
    
    # Source and provenance
    source_type: str  # FDA, CT.gov, EMA, SEC, PUBMED
    source_url: str
    source_metadata: JSON
    
    # Content
    content: text
    key_findings: JSON
    impact_assessment: text  # "So what?" explanation
    
    # Classification
    evidence_class: str  # GENETIC, PRECLINICAL, CLINICAL, RWE, REGULATORY
    confidence_score: float (0-1)
    impact_score: float (0-1)
    
    # Versioning
    version: int (default 1)
    parent_version_id: int (self-referential FK)
    is_current: bool (indexed)
    change_summary: text
    
    # Metadata
    tags: JSON  # Array for filtering
    metadata: JSON  # Flexible additional data
```

#### Enhanced Evidence Model

Extended to support standalone evidence (not tied to catalyst events):

```python
class Evidence(Base):
    """Supporting evidence - can be standalone or linked to events"""
    __tablename__ = "evidence"
    
    # Link to catalyst (now optional)
    catalyst_event_id: int (nullable)
    
    # New fields for standalone evidence
    event_date: datetime (indexed)
    entity_type: str  # DRUG, COMPANY, TARGET, INDICATION
    entity_id: str
    evidence_class: str  # GENETIC, PRECLINICAL, TRANSLATIONAL, etc.
    strength_score: float (0-1)
    citations: JSON
    linkage_verified: bool
    
    # Versioning
    version: int
    parent_version_id: int
    is_current: bool
```

#### EventRelationship Model

Captures explicit relationships between events:

```python
class EventRelationship(Base):
    """Relationships between science events"""
    __tablename__ = "event_relationships"
    
    source_event_id: int
    target_event_id: int
    relationship_type: str  # FOLLOWS, PRECEDES, CAUSES, SUPPORTS, etc.
    description: text
    confidence: float (0-1)
```

### API Endpoints

All endpoints are under `/api/v1/science/*`:

#### Core CRUD Operations

**POST /science-events**
- Create a new science event
- Returns event ID and creation timestamp

**GET /science-events**
- List events with flexible filtering:
  - `event_type`: Filter by event type
  - `event_category`: Filter by category
  - `entity_type` / `entity_id`: Filter by entity
  - `source_type`: Filter by source
  - `from_date` / `to_date`: Date range filtering
  - `tags`: Comma-separated tag filter
  - `min_confidence` / `min_impact`: Score filtering
  - `current_only`: Only return current versions (default: true)
  - `limit` / `offset`: Pagination

**GET /science-events/{event_id}**
- Get detailed information about a specific event
- Returns full event data including all metadata

**PUT /science-events/{event_id}**
- Update an event by creating a new version
- Preserves old version for historical tracking
- Requires `change_summary` parameter

**GET /science-events/{event_id}/history**
- Get complete version history of an event
- Returns all versions in chronological order

#### Timeline and Aggregation

**GET /science-events/timeline/{entity_type}/{entity_id}**
- Get event timeline for a specific entity (drug, company, target, etc.)
- Perfect for building evidence timelines and science dashboards
- Supports date range and event type filtering

**GET /science-events/aggregate/by-type**
- Aggregate events by type for dashboard views
- Supports date range and entity type filtering

**GET /science-events/search**
- Full-text search across events
- Searches title, description, summary, and content

#### Relationship Management

**POST /event-relationships**
- Create a relationship between two events
- Verifies both events exist before creating link

**GET /event-relationships/{event_id}**
- Get relationships for an event
- Supports filtering by relationship type
- Can query incoming, outgoing, or both directions

## Usage Examples

### Creating a Clinical Readout Event

```python
import httpx
from datetime import datetime

event = {
    "event_type": "CLINICAL_READOUT",
    "event_category": "CLINICAL",
    "title": "Phase III IBD Trial Shows Positive Results",
    "description": "BPX-IL23 demonstrated statistically significant improvement...",
    "summary": "Positive Phase III results for IL-23 inhibitor in IBD",
    "event_date": datetime.utcnow().isoformat(),
    "entity_type": "DRUG",
    "entity_id": "BPX-IL23",
    "entity_name": "BPX-IL23",
    "source_type": "CT.gov",
    "source_url": "https://clinicaltrials.gov/study/NCT12345678",
    "evidence_class": "CLINICAL",
    "confidence_score": 0.95,
    "impact_score": 0.85,
    "key_findings": [
        {
            "finding": "Primary endpoint met",
            "significance": "p < 0.001"
        }
    ],
    "tags": ["IBD", "IL-23", "phase-3", "positive"]
}

response = httpx.post("http://localhost:8000/api/v1/science/science-events", json=event)
event_id = response.json()["id"]
```

### Querying Events for an Entity Timeline

```python
# Get all events for a specific drug
response = httpx.get(
    "http://localhost:8000/api/v1/science/science-events/timeline/DRUG/BPX-IL23",
    params={
        "from_date": "2024-01-01T00:00:00Z",
        "event_types": "CLINICAL_READOUT,REGULATORY_CHANGE"
    }
)

timeline = response.json()
for event in timeline["timeline"]:
    print(f"{event['event_date']}: {event['title']}")
```

### Creating Event Relationships

```python
# Link two related events
relationship = {
    "source_event_id": 123,  # Earlier mechanism insight
    "target_event_id": 456,  # Later clinical readout
    "relationship_type": "SUPPORTS",
    "description": "Preclinical findings validated in clinical trial",
    "confidence": 0.85
}

response = httpx.post(
    "http://localhost:8000/api/v1/science/event-relationships",
    json=relationship
)
```

### Updating an Event (Creates New Version)

```python
# Update event with new information
updated_event = {
    # ... same fields as original event, with updates
    "title": "Phase III IBD Trial Shows Positive Results - UPDATED",
    "key_findings": [
        # ... updated findings
    ]
}

response = httpx.put(
    f"http://localhost:8000/api/v1/science/science-events/{event_id}",
    json=updated_event,
    params={"change_summary": "Added final safety analysis data"}
)

new_version_id = response.json()["id"]
```

### Searching Events

```python
# Full-text search
response = httpx.get(
    "http://localhost:8000/api/v1/science/science-events/search",
    params={"q": "IL-23 inhibitor", "limit": 50}
)

results = response.json()["results"]
```

## Integration with Existing Systems

### Evidence Journal Integration

The Science Event Store complements the existing Evidence Journal feature:

- **Evidence Journal UI**: Consumes events from the store for display
- **Journal Notebook**: Users can pin events and add "So what?" notes
- **Today's Evidence**: Queries recent events for diff view
- **Catalyst Board**: Links to catalyst-related science events

### Terminal/UI Layer

```typescript
// Frontend integration example
import { useQuery } from '@tanstack/react-query';

function EvidenceTimeline({ drugId }: { drugId: string }) {
  const { data } = useQuery({
    queryKey: ['timeline', drugId],
    queryFn: () => fetch(
      `/api/v1/science/science-events/timeline/DRUG/${drugId}`
    ).then(res => res.json())
  });
  
  return (
    <div>
      {data?.timeline.map(event => (
        <TimelineItem key={event.id} event={event} />
      ))}
    </div>
  );
}
```

## Event Types

### Clinical Events
- `CLINICAL_READOUT`: Trial data readouts
- `TRIAL_UPDATE`: Protocol amendments, enrollment updates
- `ENDPOINT_CHANGE`: Endpoint modifications
- `SAFETY_SIGNAL`: Safety findings

### Regulatory Events
- `REGULATORY_CHANGE`: FDA/EMA guidance updates
- `LABEL_UPDATE`: Drug label changes
- `APPROVAL`: Regulatory approvals
- `REJECTION`: CRLs or rejections

### Mechanism Events
- `MECHANISM_INSIGHT`: MOA discoveries
- `TARGET_VALIDATION`: Target validation data
- `GENETIC_EVIDENCE`: New genetic associations
- `BIOMARKER_DISCOVERY`: Biomarker findings

### Commercial Events
- `PARTNERSHIP`: Business development
- `ACQUISITION`: M&A activity
- `COMPETITIVE_INTEL`: Competitor updates

## Evidence Classes

Events are classified by evidence type:

- **GENETIC**: Genetic associations, GWAS data
- **PRECLINICAL**: Animal studies, in vitro data
- **TRANSLATIONAL**: Biomarker studies, POC trials
- **CLINICAL**: Phase I-III clinical trials
- **RWE**: Real-world evidence, registry data
- **REGULATORY**: FDA/EMA filings and decisions

## Versioning Strategy

Events are versioned to preserve history:

1. **Initial Creation**: Version 1, `is_current = True`
2. **Updates**: New row created with incremented version
3. **Old Version**: Marked `is_current = False`
4. **Parent Link**: `parent_version_id` links to previous version
5. **Change Summary**: Required description of what changed

### Version History Query

```python
# Get all versions of an event
response = httpx.get(f"/api/v1/science/science-events/{event_id}/history")

for version in response.json()["versions"]:
    print(f"v{version['version']}: {version['change_summary']}")
```

## Relationship Types

Event relationships capture how events connect:

- **Sequential**: `FOLLOWS`, `PRECEDES`
- **Causal**: `CAUSES`, `RESULTS_FROM`
- **Comparative**: `CONTRADICTS`, `SUPPORTS`, `REFINES`
- **Hierarchical**: `UPDATES`, `INVALIDATES`

## Querying and Filtering

### By Date Range
```python
# Events in 2024
params = {
    "from_date": "2024-01-01T00:00:00Z",
    "to_date": "2024-12-31T23:59:59Z"
}
```

### By Entity
```python
# All events for a specific company
params = {
    "entity_type": "COMPANY",
    "entity_id": "BPXR"
}
```

### By Source
```python
# Only FDA events
params = {"source_type": "FDA"}
```

### By Scores
```python
# High-confidence, high-impact events
params = {
    "min_confidence": 0.8,
    "min_impact": 0.7
}
```

### By Tags
```python
# Events tagged with multiple tags
params = {"tags": "oncology,phase-3"}
```

## Performance Considerations

### Indexes

The schema includes comprehensive indexing:

- `event_type` + `event_date`: Fast filtering by type and time
- `entity_type` + `entity_id`: Fast entity lookups
- `source_type` + `published_date`: Source-based queries
- `is_current` + `created_at`: Version filtering
- `evidence_class` + `confidence_score`: Quality filtering

### Pagination

All list endpoints support pagination:
- Default limit: 100
- Max limit: 1000
- Use `offset` for page navigation

### Caching Strategy

Recommended caching:
- Entity timelines: Cache for 5 minutes
- Current events: Cache for 1 minute
- Historical versions: Cache indefinitely

## Migration from Ephemeral Reports

To migrate existing ephemeral report data:

1. **Identify Data Sources**: Map existing reports to event types
2. **Extract Structured Data**: Parse reports into event fields
3. **Assign Provenance**: Add source URLs and metadata
4. **Bulk Insert**: Use batch API calls for efficiency
5. **Create Relationships**: Link related events after import
6. **Verify**: Query timeline to ensure completeness

## Testing

Comprehensive tests in `tests/test_science_events.py`:

- Event creation and validation
- Versioning behavior
- Relationship constraints
- Entity linking
- Tag filtering
- Citation structure

Run tests:
```bash
pytest tests/test_science_events.py -v
```

## Future Enhancements

Planned improvements:

1. **Semantic Search**: pgvector integration for similarity search
2. **Event Notifications**: WebSocket push for real-time updates
3. **Bulk Operations**: Batch create/update endpoints
4. **Export Formats**: JSON, CSV, Parquet export
5. **Knowledge Graph**: GraphQL endpoint for relationship traversal
6. **ML Features**: Automated event classification and linking
7. **Provenance Chain**: Full lineage tracking from raw data to event

## Best Practices

### Event Creation
- Always include `source_url` for verifiability
- Use descriptive `title` and `summary` fields
- Add relevant `tags` for discoverability
- Set appropriate `confidence_score` based on source quality
- Include `impact_assessment` for "So what?" context

### Versioning
- Update events when material changes occur
- Write clear `change_summary` explaining what changed
- Don't create versions for minor corrections (typos)
- Mark truly incorrect events with low confidence

### Relationships
- Create relationships to build knowledge graph
- Use appropriate relationship types
- Set `confidence` based on link strength
- Add descriptive explanation of relationship

### Querying
- Use pagination for large result sets
- Filter by `current_only` unless historical view needed
- Leverage indexes (entity, date, source) for performance
- Cache frequently-accessed timelines

## API Reference

Complete API documentation available at `/docs` endpoint when server is running:

```bash
# Start the API server
uvicorn bt_platform.core.app:app --reload

# Open browser to
# http://localhost:8000/docs
```

Interactive Swagger UI provides:
- Full endpoint documentation
- Request/response schemas
- Try-it-out functionality
- Schema validation

## Monitoring and Observability

Recommended monitoring:

- **Query Performance**: Track slow queries (>100ms)
- **Storage Growth**: Monitor table sizes
- **Version Depth**: Alert on deep version chains (>10)
- **Relationship Density**: Track knowledge graph growth
- **API Latency**: P95/P99 latency for all endpoints

## Support and Feedback

For questions or issues:
- GitHub Issues: Report bugs or request features
- Documentation: This guide and inline code comments
- API Docs: Interactive Swagger UI at `/docs`

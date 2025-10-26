# Science Event Store Migration Guide

## Overview

This guide helps migrate from ephemeral science reports to the persistent Science Event Store. It covers data migration strategies, API transition paths, and UI integration updates.

## Pre-Migration Checklist

- [ ] Review existing report generation code
- [ ] Identify all science data sources
- [ ] Map report types to event types
- [ ] Plan database migration (add new tables)
- [ ] Set up testing environment
- [ ] Prepare rollback strategy

## Database Migration

### Step 1: Run Schema Migration

The new tables need to be created in your database:

```sql
-- Create science_events table
CREATE TABLE science_events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    event_category VARCHAR(50),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    summary TEXT,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    published_date DATE,
    entity_type VARCHAR(50),
    entity_id VARCHAR(255),
    entity_name VARCHAR(255),
    related_entities JSON,
    source_type VARCHAR(100),
    source_url VARCHAR(1000),
    source_metadata JSON,
    content TEXT,
    key_findings JSON,
    impact_assessment TEXT,
    evidence_class VARCHAR(50),
    confidence_score FLOAT,
    impact_score FLOAT,
    version INTEGER NOT NULL DEFAULT 1,
    parent_version_id INTEGER REFERENCES science_events(id),
    is_current BOOLEAN NOT NULL DEFAULT TRUE,
    change_summary TEXT,
    tags JSON,
    event_metadata JSON,
    provider_file_sha256 VARCHAR(64),
    ingested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX idx_science_event_type ON science_events(event_type, event_date);
CREATE INDEX idx_science_event_entity ON science_events(entity_type, entity_id);
CREATE INDEX idx_science_event_source ON science_events(source_type, published_date);
CREATE INDEX idx_science_event_current ON science_events(is_current, created_at);
CREATE INDEX idx_science_event_category ON science_events(event_category, event_date);
CREATE INDEX idx_science_event_class ON science_events(evidence_class, confidence_score);

-- Create event_relationships table
CREATE TABLE event_relationships (
    id SERIAL PRIMARY KEY,
    source_event_id INTEGER NOT NULL REFERENCES science_events(id),
    target_event_id INTEGER NOT NULL REFERENCES science_events(id),
    relationship_type VARCHAR(50) NOT NULL,
    description TEXT,
    confidence FLOAT,
    event_metadata JSON,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_event_rel_source ON event_relationships(source_event_id, relationship_type);
CREATE INDEX idx_event_rel_target ON event_relationships(target_event_id, relationship_type);

-- Create science_event_evidence association table
CREATE TABLE science_event_evidence (
    science_event_id INTEGER NOT NULL REFERENCES science_events(id),
    evidence_id INTEGER NOT NULL REFERENCES evidence(id),
    relationship_type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (science_event_id, evidence_id)
);

CREATE INDEX idx_science_event_evidence_event ON science_event_evidence(science_event_id);
CREATE INDEX idx_science_event_evidence_evidence ON science_event_evidence(evidence_id);

-- Update evidence table (add new columns)
ALTER TABLE evidence
    ADD COLUMN event_date TIMESTAMP WITH TIME ZONE,
    ADD COLUMN entity_type VARCHAR(50),
    ADD COLUMN entity_id VARCHAR(255),
    ADD COLUMN evidence_class VARCHAR(50),
    ADD COLUMN strength_score FLOAT,
    ADD COLUMN citations JSON,
    ADD COLUMN linkage_verified BOOLEAN DEFAULT FALSE,
    ADD COLUMN version INTEGER DEFAULT 1,
    ADD COLUMN parent_version_id INTEGER REFERENCES evidence(id),
    ADD COLUMN is_current BOOLEAN DEFAULT TRUE,
    ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for new evidence columns
CREATE INDEX idx_evidence_entity ON evidence(entity_type, entity_id);
CREATE INDEX idx_evidence_class ON evidence(evidence_class);
CREATE INDEX idx_evidence_current ON evidence(is_current, created_at);
CREATE INDEX idx_evidence_published ON evidence(published_date);

-- Make catalyst_event_id nullable (allow standalone evidence)
ALTER TABLE evidence ALTER COLUMN catalyst_event_id DROP NOT NULL;
```

### Step 2: SQLAlchemy/Alembic Migration

If using Alembic:

```bash
# Generate migration
alembic revision --autogenerate -m "Add science event store"

# Review and edit migration file in alembic/versions/

# Apply migration
alembic upgrade head
```

## Data Migration Strategies

### Strategy 1: Historical Data Import

Import existing historical data from previous systems:

```python
from datetime import datetime
import httpx

def migrate_historical_events(old_data_source):
    """
    Migrate historical events from old system to Science Event Store.
    """
    client = httpx.Client(base_url="http://localhost:8000/api/v1")

    for old_event in old_data_source:
        # Map old event format to new schema
        new_event = {
            "event_type": map_event_type(old_event["type"]),
            "event_category": categorize_event(old_event),
            "title": old_event["title"],
            "description": old_event.get("description", ""),
            "summary": old_event.get("summary", old_event["title"][:200]),
            "event_date": parse_event_date(old_event["date"]),
            "entity_type": old_event.get("entity_type", "DRUG"),
            "entity_id": old_event.get("entity_id"),
            "entity_name": old_event.get("entity_name"),
            "source_type": old_event.get("source", "UNKNOWN"),
            "source_url": old_event.get("url"),
            "content": old_event.get("content"),
            "evidence_class": classify_evidence(old_event),
            "confidence_score": old_event.get("confidence", 0.7),
            "impact_score": old_event.get("impact", 0.5),
            "tags": extract_tags(old_event)
        }

        # Create event
        response = client.post("/science/science-events", json=new_event)
        if response.status_code == 201:
            print(f"✓ Migrated: {new_event['title']}")
        else:
            print(f"✗ Failed: {new_event['title']} - {response.text}")

def map_event_type(old_type: str) -> str:
    """Map old event types to new schema"""
    mapping = {
        "trial_readout": "CLINICAL_READOUT",
        "fda_update": "REGULATORY_CHANGE",
        "target_data": "MECHANISM_INSIGHT",
        "trial_start": "TRIAL_UPDATE",
        # ... add more mappings
    }
    return mapping.get(old_type, "OTHER")
```

### Strategy 2: Incremental Migration

Migrate data incrementally while both systems run in parallel:

```python
class DualWriteAdapter:
    """
    Write to both old and new systems during transition period.
    """

    def __init__(self, old_system, new_store):
        self.old = old_system
        self.new = new_store

    def create_event(self, event_data):
        """Write to both systems"""
        # Write to old system
        old_id = self.old.create_report(event_data)

        # Write to new system
        try:
            new_event = self.transform_to_new_format(event_data)
            new_id = self.new.create_event(new_event)

            # Store mapping for reference
            self.store_id_mapping(old_id, new_id)

            return new_id
        except Exception as e:
            # Log error but don't fail - old system still works
            print(f"Warning: Failed to write to new store: {e}")
            return old_id
```

### Strategy 3: Lazy Migration

Migrate data on-demand as it's accessed:

```python
class LazyMigrationProxy:
    """
    Migrate data when first accessed in new system.
    """

    def get_event(self, event_id):
        # Check if already migrated
        event = self.new_store.get_event(event_id)
        if event:
            return event

        # Fetch from old system
        old_event = self.old_store.get_report(event_id)
        if not old_event:
            return None

        # Migrate now
        new_event = self.transform_and_create(old_event)
        return new_event
```

## API Migration

### Phase 1: Parallel APIs (Recommended)

Run both old and new APIs simultaneously:

```python
# Old endpoint (keep for compatibility)
@router.get("/evidence/today")
async def get_todays_evidence_legacy():
    """Legacy endpoint - generates reports on-the-fly"""
    return generate_ephemeral_report()

# New endpoint (recommended)
@router.get("/science/science-events")
async def get_science_events():
    """New persistent store endpoint"""
    return query_event_store()
```

Update clients gradually:
1. Week 1-2: Deploy new endpoints, keep old ones
2. Week 3-4: Update frontend to use new endpoints
3. Week 5-6: Monitor traffic, fix issues
4. Week 7+: Deprecate old endpoints

### Phase 2: Redirect Old to New

Once migration is complete, redirect old endpoints:

```python
@router.get("/evidence/today")
async def get_todays_evidence_legacy():
    """
    DEPRECATED: Use /science/science-events instead
    """
    # Redirect to new API
    yesterday = datetime.utcnow() - timedelta(days=1)
    events = await query_science_events(from_date=yesterday)

    # Transform to old format for compatibility
    return transform_to_legacy_format(events)
```

### Phase 3: Remove Old Endpoints

After all clients updated:
1. Add deprecation warnings
2. Monitor for usage
3. Remove old code
4. Update documentation

## UI Integration Updates

### Terminal App Updates

#### Before (Ephemeral Reports)
```typescript
// Old approach - generate reports on demand
function TodaysEvidence() {
  const { data } = useQuery('todays-evidence', () =>
    fetch('/api/v1/evidence/today').then(r => r.json())
  );

  return <ReportView data={data} />;
}
```

#### After (Persistent Store)
```typescript
// New approach - query persistent store
function TodaysEvidence() {
  const yesterday = new Date(Date.now() - 24*60*60*1000).toISOString();

  const { data } = useQuery('science-events-today', () =>
    fetch(`/api/v1/science/science-events?from_date=${yesterday}`)
      .then(r => r.json())
  );

  return <EventTimeline events={data.events} />;
}
```

#### Drug Timeline Component
```typescript
function DrugTimeline({ drugId }: { drugId: string }) {
  const { data } = useQuery(['timeline', drugId], () =>
    fetch(`/api/v1/science/science-events/timeline/DRUG/${drugId}`)
      .then(r => r.json())
  );

  return (
    <div className="timeline">
      {data?.timeline.map(event => (
        <TimelineItem
          key={event.id}
          date={event.event_date}
          title={event.title}
          type={event.event_type}
          confidence={event.confidence_score}
          impact={event.impact_score}
          sourceUrl={event.source_url}
        />
      ))}
    </div>
  );
}
```

### Evidence Journal Integration

Update Evidence Journal to use persistent store:

```typescript
// Today's Evidence Tab
function TodaysEvidenceTab() {
  const { data } = useQuery('todays-events', fetchTodaysEvents);

  return (
    <div>
      <Section title="Clinical Readouts">
        {data?.clinical_readouts.map(event => (
          <EventCard event={event} key={event.id} />
        ))}
      </Section>

      <Section title="Regulatory Changes">
        {data?.regulatory_changes.map(event => (
          <EventCard event={event} key={event.id} />
        ))}
      </Section>
    </div>
  );
}

// Catalyst Board Tab
function CatalystBoard() {
  const next90Days = new Date(Date.now() + 90*24*60*60*1000).toISOString();

  const { data } = useQuery('catalysts', () =>
    fetch(`/api/v1/science/science-events?event_category=CLINICAL&to_date=${next90Days}`)
      .then(r => r.json())
  );

  return <CatalystTimeline events={data?.events} />;
}
```

## Ingestion Pipeline Updates

Update data ingestion to create events:

```python
# Before
def process_clinical_trial_update(trial_data):
    """Old approach - update database, no event"""
    update_trial_in_database(trial_data)

# After
def process_clinical_trial_update(trial_data):
    """New approach - create science event"""
    # Update database
    update_trial_in_database(trial_data)

    # Create event in store
    event = {
        "event_type": "TRIAL_UPDATE",
        "event_category": "CLINICAL",
        "title": f"Trial {trial_data['nct_id']} Updated",
        "description": trial_data["status_update"],
        "event_date": datetime.utcnow().isoformat(),
        "entity_type": "TRIAL",
        "entity_id": trial_data["nct_id"],
        "source_type": "CT.gov",
        "source_url": f"https://clinicaltrials.gov/study/{trial_data['nct_id']}",
        "evidence_class": "CLINICAL",
        "confidence_score": 1.0,  # Direct from source
        "tags": ["trial-update", trial_data["phase"].lower()]
    }

    create_science_event(event)
```

## Testing Strategy

### Unit Tests
```python
def test_event_creation():
    """Test creating events via API"""
    event = create_test_event()
    assert event["id"] is not None
    assert event["version"] == 1

def test_event_versioning():
    """Test event updates create new versions"""
    v1 = create_test_event()
    v2 = update_event(v1["id"], {"title": "Updated"})
    assert v2["version"] == 2
    assert v2["parent_version_id"] == v1["id"]
```

### Integration Tests
```python
def test_timeline_query():
    """Test querying entity timeline"""
    # Create test events
    create_event(entity_id="DRUG-001", event_date="2024-01-01")
    create_event(entity_id="DRUG-001", event_date="2024-02-01")

    # Query timeline
    timeline = get_timeline("DRUG", "DRUG-001")
    assert len(timeline) == 2
    assert timeline[0]["event_date"] < timeline[1]["event_date"]
```

### End-to-End Tests
```python
def test_full_workflow():
    """Test complete workflow from ingestion to UI"""
    # 1. Ingest data
    ingest_trial_data(trial_nct_id="NCT12345678")

    # 2. Verify event created
    events = query_events(entity_id="NCT12345678")
    assert len(events) > 0

    # 3. Query via UI API
    timeline = get_ui_timeline("TRIAL", "NCT12345678")
    assert timeline["total_events"] > 0
```

## Rollback Plan

If issues occur during migration:

### Step 1: Stop New Writes
```python
# Add feature flag
USE_NEW_STORE = os.getenv("USE_NEW_STORE", "false") == "true"

if USE_NEW_STORE:
    create_science_event(event_data)
else:
    create_legacy_report(event_data)
```

### Step 2: Revert API Changes
```python
# Route to old endpoints
@router.get("/evidence/today")
async def get_todays_evidence():
    if ROLLBACK_ACTIVE:
        return generate_legacy_report()
    else:
        return query_new_store()
```

### Step 3: Data Cleanup
```sql
-- If needed, remove migrated data
DELETE FROM science_events WHERE ingested_at > '2024-01-01';
DELETE FROM event_relationships WHERE created_at > '2024-01-01';
```

## Performance Considerations

### Indexing
Ensure all indexes are created (see database migration above).

### Caching
```python
from functools import lru_cache
from datetime import timedelta

@lru_cache(maxsize=100)
def get_cached_timeline(entity_type: str, entity_id: str):
    """Cache timeline queries for 5 minutes"""
    return fetch_timeline(entity_type, entity_id)

# Use Redis for production
import redis
cache = redis.Redis()

def get_timeline_with_cache(entity_type, entity_id):
    cache_key = f"timeline:{entity_type}:{entity_id}"
    cached = cache.get(cache_key)

    if cached:
        return json.loads(cached)

    timeline = fetch_timeline(entity_type, entity_id)
    cache.setex(cache_key, 300, json.dumps(timeline))  # 5 min TTL
    return timeline
```

### Pagination
Always use pagination for large result sets:
```python
# Paginate through all events
offset = 0
limit = 100
all_events = []

while True:
    batch = query_events(offset=offset, limit=limit)
    if not batch:
        break
    all_events.extend(batch)
    offset += limit
```

## Monitoring

### Key Metrics
- Event creation rate
- Query latency (p50, p95, p99)
- Storage growth rate
- Cache hit rate
- API error rate

### Alerts
```python
# Alert if query latency too high
if query_time_ms > 500:
    alert("High query latency", query_time_ms)

# Alert if storage growing too fast
if daily_growth_mb > 1000:
    alert("High storage growth", daily_growth_mb)
```

## Support

For migration assistance:
- Review `docs/SCIENCE_EVENT_STORE.md` for API details
- Check `examples/science_event_store_integration.py` for code examples
- File issues on GitHub for problems
- Join team Slack for real-time help

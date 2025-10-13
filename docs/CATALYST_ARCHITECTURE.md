# Catalyst Intelligence System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CATALYST INTELLIGENCE SYSTEM                      │
│                    (Biotech Intel Machine with Receipts)                 │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                           USER INTERFACE LAYER                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │  Terminal App   │  │  Mobile App     │  │  API Consumers  │         │
│  │  (React)        │  │  (React Native) │  │  (External)     │         │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘         │
│           │                    │                     │                   │
│           └────────────────────┼─────────────────────┘                   │
│                                │                                         │
└────────────────────────────────┼─────────────────────────────────────────┘
                                 │
                                 │ HTTPS/REST
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         FASTAPI ENDPOINT LAYER                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  GET  /api/v1/catalysts/                     ┌──────────────────┐       │
│  ├─ Advanced Filtering (15+ params)          │  catalysts_v2.py │       │
│  ├─ Quarter Bucketing                        │                  │       │
│  ├─ Multi-facet Search                       │  - parse_quarter │       │
│  └─ Pagination (limit/offset)                │  - compute_score │       │
│                                               │  - link_sources  │       │
│  GET  /api/v1/catalysts/{id}                 └──────────────────┘       │
│  └─ Full provenance + analyst notes                                      │
│                                                                           │
│  POST /api/v1/catalysts/                                                 │
│  └─ Create with provenance (REQUIRED)                                    │
│                                                                           │
│  PATCH /api/v1/catalysts/{id}                                            │
│  └─ Update + add new provenance                                          │
│                                                                           │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 │ Pydantic Validation
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        PYDANTIC CONTRACT LAYER                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌────────────────────────────────────────────────────────────┐         │
│  │ CatalystEventCreateContract                                │         │
│  │  - Requires source_provenance[] (min_length=1)             │         │
│  │  - Validates date windows                                  │         │
│  │  - Validates company/program/trial references              │         │
│  └────────────────────────────────────────────────────────────┘         │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────┐         │
│  │ SourceProvenanceContract                                   │         │
│  │  - source_url (max 1000 chars)                             │         │
│  │  - content_hash (SHA256, 64 hex chars)                     │         │
│  │  - parser_version (e.g., "ctgov_v2.0.0")                   │         │
│  │  - verbatim_excerpt (exact text)                           │         │
│  └────────────────────────────────────────────────────────────┘         │
│                                                                           │
│  Enums: CatalystEventType, DateConfidence, SourceType, ExpectedImpact   │
│                                                                           │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 │ SQLAlchemy ORM
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          DATABASE SCHEMA LAYER                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────┐       │
│  │ catalyst_events (Enhanced with 20+ new fields)               │       │
│  │  - event_window_start/end                                    │       │
│  │  - date_confidence                                           │       │
│  │  - trial_phase, target_gene, indication                      │       │
│  │  - orphan, fast_track, breakthrough (booleans)               │       │
│  │  - quality_score, prob_of_success                            │       │
│  │  - expected_impact                                           │       │
│  └──────────────────────────────────────────────────────────────┘       │
│                              ▲                                            │
│                              │ ForeignKey                                │
│                              │                                           │
│  ┌──────────────────────────────────────────────────────────────┐       │
│  │ source_provenance (NEW)                                      │       │
│  │  - source_url, source_type, accessed_at                      │       │
│  │  - content_hash (SHA256)                                     │       │
│  │  - parser_version                                            │       │
│  │  - selector (CSS/XPath)                                      │       │
│  │  - verbatim_excerpt (TEXT)                                   │       │
│  └──────────────────────────────────────────────────────────────┘       │
│                              ▲                                            │
│                              │ ForeignKey                                │
│                              │                                           │
│  ┌──────────────────────────────────────────────────────────────┐       │
│  │ entity_source_links (NEW - Many-to-Many)                     │       │
│  │  - entity_type (polymorphic: CATALYST_EVENT, TRIAL, etc.)    │       │
│  │  - entity_id                                                 │       │
│  │  - source_provenance_id                                      │       │
│  │  - is_primary (boolean)                                      │       │
│  └──────────────────────────────────────────────────────────────┘       │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────┐       │
│  │ alias_map (NEW - Synonym handling)                           │       │
│  │  - entity_type, canonical, alias, confidence                 │       │
│  │  Example: "zuranolone" ≡ "SAGE-217"                          │       │
│  └──────────────────────────────────────────────────────────────┘       │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────┐       │
│  │ analyst_notes (NEW - Human annotations)                      │       │
│  │  - entity_type, entity_id, author, note                      │       │
│  │  - override_field, override_value (for PoS overrides)        │       │
│  └──────────────────────────────────────────────────────────────┘       │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────┐       │
│  │ companies, programs, trials (Existing, enhanced)             │       │
│  └──────────────────────────────────────────────────────────────┘       │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Example: Creating a Catalyst with Provenance

```
1. USER (Terminal UI)
   │
   │ POST /api/v1/catalysts/
   │ {
   │   "company_id": 123,
   │   "event_type": "PDUFA_DATE",
   │   "title": "Drug XYZ PDUFA Date",
   │   "expected_date": "2025-05-15",
   │   "source_provenance": [{
   │     "source_url": "https://sec.gov/filing.html",
   │     "source_type": "SEC_EDGAR",
   │     "content_hash": "a1b2c3...",
   │     "verbatim_excerpt": "PDUFA date: May 15, 2025"
   │   }]
   │ }
   ▼
2. FASTAPI ENDPOINT (catalysts_v2.py)
   │
   │ Validate request via Pydantic
   │ Check company_id exists
   │ Check source_provenance[] not empty
   ▼
3. PYDANTIC VALIDATION
   │
   │ CatalystEventCreateContract
   │ ├─ Validate event_type in enum
   │ ├─ Validate date_confidence
   │ ├─ Validate date windows (start <= end)
   │ └─ Validate source_provenance[] (min 1)
   │
   │ SourceProvenanceContract
   │ ├─ Validate source_url format
   │ ├─ Validate content_hash (64 hex chars)
   │ └─ Validate parser_version format
   ▼
4. SQLALCHEMY ORM
   │
   │ BEGIN TRANSACTION
   │
   │ CREATE catalyst_event
   │ ├─ Insert into catalyst_events table
   │ ├─ Set quality_score = compute_quality_score()
   │ └─ Get new catalyst.id
   │
   │ CREATE source_provenance records
   │ └─ For each in source_provenance[]
   │     ├─ Insert into source_provenance
   │     └─ Get source_prov.id
   │
   │ CREATE entity_source_links
   │ └─ For each source_provenance_id
   │     └─ Insert into entity_source_links
   │         ├─ entity_type = "CATALYST_EVENT"
   │         ├─ entity_id = catalyst.id
   │         ├─ source_provenance_id = prov.id
   │         └─ is_primary = (first source)
   │
   │ COMMIT TRANSACTION
   ▼
5. RESPONSE
   │
   │ CatalystEventDetailResponse
   │ {
   │   "id": 456,
   │   "title": "Drug XYZ PDUFA Date",
   │   "expected_date": "2025-05-15",
   │   "quality_score": 85.5,
   │   "evidence": [
   │     {
   │       "id": 789,
   │       "source_url": "https://sec.gov/filing.html",
   │       "verbatim_excerpt": "PDUFA date: May 15, 2025",
   │       ...
   │     }
   │   ],
   │   "created_at": "2024-12-15T10:30:00Z"
   │ }
   ▼
6. USER (Terminal UI)
   │
   │ Display catalyst with "Evidence Pack" button
   │ Click → Show provenance drawer with:
   │   - Source URL (clickable)
   │   - Verbatim excerpt (highlighted)
   │   - Parser version
   │   - Access timestamp
```

## Query Flow Example: Advanced Filtering

```
USER REQUEST:
  GET /api/v1/catalysts/?phase=Phase%20III&quarter=Q2%202025&breakthrough=true

1. ENDPOINT HANDLER
   │
   │ Parse query parameters
   │ ├─ phase = "Phase III"
   │ ├─ quarter = "Q2 2025"
   │ └─ breakthrough = true
   ▼
2. HELPER FUNCTIONS
   │
   │ parse_quarter("Q2 2025")
   │ └─ Returns (date(2025, 4, 1), date(2025, 6, 30))
   ▼
3. SQLALCHEMY QUERY BUILDER
   │
   │ query = db.query(CatalystEvent)
   │
   │ # Phase filter
   │ .filter(CatalystEvent.trial_phase.ilike("%Phase III%"))
   │
   │ # Quarter filter (uses OR for window or expected date)
   │ .filter(or_(
   │   and_(
   │     CatalystEvent.event_window_start >= date(2025, 4, 1),
   │     CatalystEvent.event_window_start <= date(2025, 6, 30)
   │   ),
   │   and_(
   │     CatalystEvent.expected_date >= date(2025, 4, 1),
   │     CatalystEvent.expected_date <= date(2025, 6, 30)
   │   )
   │ ))
   │
   │ # Breakthrough filter
   │ .filter(CatalystEvent.breakthrough == True)
   │
   │ # Order and paginate
   │ .order_by(CatalystEvent.event_window_start.asc())
   │ .offset(0).limit(50)
   ▼
4. DATABASE QUERY
   │
   │ SELECT * FROM catalyst_events
   │ WHERE trial_phase LIKE '%Phase III%'
   │   AND (
   │     (event_window_start BETWEEN '2025-04-01' AND '2025-06-30')
   │     OR (expected_date BETWEEN '2025-04-01' AND '2025-06-30')
   │   )
   │   AND breakthrough = 1
   │ ORDER BY event_window_start ASC
   │ LIMIT 50 OFFSET 0;
   ▼
5. PROVENANCE LOOKUP
   │
   │ For each catalyst in results:
   │   │
   │   │ Get entity_source_links
   │   │ └─ WHERE entity_type = "CATALYST_EVENT"
   │   │     AND entity_id = catalyst.id
   │   │
   │   │ Get source_provenance records
   │   │ └─ WHERE id IN (source_provenance_ids)
   │   │
   │   └─ Build evidence[] array
   ▼
6. RESPONSE
   │
   │ CatalystEventListResponse
   │ {
   │   "data": [...],  # With provenance attached
   │   "total": 15,
   │   "page": 1,
   │   "page_size": 50,
   │   "filters": {
   │     "phase": "Phase III",
   │     "quarter": "Q2 2025",
   │     "breakthrough": true
   │   }
   │ }
```

## Quality Score Computation Flow

```
INPUT: CatalystEvent object
  {
    phase_weight: 1.0,      # Phase III
    endpoint_rigor: 0.9,    # Hard endpoint
    n: 500,                 # Enrollment
    breakthrough: true,
    orphan: true,
    market_depth: 0.8,
    complexity_penalty: 0.1
  }

COMPUTE:
  │
  │ score = 0
  │
  │ # Phase contribution (max 30)
  │ score += phase_weight * 30
  │         = 1.0 * 30 = 30.0
  │
  │ # Endpoint rigor (max 20)
  │ score += endpoint_rigor * 20
  │         = 0.9 * 20 = 18.0
  │
  │ # Enrollment (log scale, max 20)
  │ score += min(20, log(n+1) * 2)
  │         = min(20, log(501) * 2)
  │         = min(20, 6.22 * 2)
  │         = 12.4
  │
  │ # Breakthrough designation
  │ score += breakthrough * 10
  │         = 1 * 10 = 10.0
  │
  │ # Orphan designation
  │ score += orphan * 8
  │         = 1 * 8 = 8.0
  │
  │ # Market depth (max 10)
  │ score += market_depth * 10
  │         = 0.8 * 10 = 8.0
  │
  │ # Complexity penalty (max -5)
  │ score -= complexity_penalty * 5
  │         = 0.1 * 5 = -0.5
  │
  │ TOTAL: 30 + 18 + 12.4 + 10 + 8 + 8 - 0.5 = 85.9
  │
  │ # Clamp to 0-100 range
  │ score = max(0, min(100, 85.9)) = 85.9
  ▼
OUTPUT: quality_score = 85.9

INTERPRETATION:
  80-100: High-quality catalyst ✓
  (Phase III, hard endpoint, good enrollment, multiple designations)
```

## System Benefits

### 1. Traceability
Every data point has provenance → "one click from UI to raw line"

### 2. Data Quality
Controlled vocabularies + validation → no garbage data

### 3. Transparent Scoring
Formula is documented → analysts can verify/debate

### 4. Flexible Filtering
15+ filter parameters → precise catalyst discovery

### 5. Extensibility
Polymorphic entity linking → add new entity types easily

### 6. Auditability
Parser versions + content hashes → full audit trail

### 7. Human-in-the-Loop
Analyst notes + PoS overrides → expert judgment preserved
```

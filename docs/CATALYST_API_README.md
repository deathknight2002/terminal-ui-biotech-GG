# Enhanced Catalyst API with Provenance Tracking

## Overview

The Enhanced Catalyst API implements Option A from the problem statement: a biotech intelligence system with granular, traceable provenance for every data claim.

## Key Features

### 1. **Provenance-First Design**
Every catalyst event requires at least one source provenance record with:
- Source URL
- Source type (CT.gov, SEC EDGAR, FDA, etc.)
- Access timestamp
- Content hash (SHA256)
- Parser version
- Exact verbatim excerpt
- CSS/XPath selector used

### 2. **Controlled Event Type Vocabulary**
```
Regulatory:
- IND_ACCEPTANCE
- ADCOM_SCHEDULED
- PDUFA_DATE
- CHMP_OPINION
- APPROVAL
- CRL

Clinical:
- FPI (First Patient In)
- LAST_PATIENT_IN
- TOPLINE_READOUT
- FULL_DATA_CONFERENCE
- DOSE_EXPANSION_DECISION

Commercial:
- LAUNCH
- LABEL_EXPANSION
- PAYER_DECISION

Funding/Partnership:
- MILESTONE_TRIGGER
- ATM_ACTIVATION
```

### 3. **Date Confidence Levels**
```
- EXACT_DATE: Fixed date (e.g., PDUFA)
- DATE_WINDOW: Date range with specific start/end
- QUARTER: Q1, Q2, Q3, Q4
- BY_YEAR_END: Expected by year end
- HALF: First half or second half
- VAGUE: General timeframe
```

### 4. **Transparent Quality Scoring**
Catalyst quality score (0-100) computed from:
```python
score = (
    phase_weight * 30 +           # Phase III = 30, Phase II = 20, Phase I = 10
    endpoint_rigor * 20 +          # Hard endpoint quality
    min(20, log(n+1) * 2) +        # Enrollment score (log scale)
    breakthrough * 10 +             # Breakthrough designation
    orphan * 8 +                    # Orphan designation
    market_depth * 10 -             # TAM/market size
    complexity_penalty * 5          # Design complexity penalty
)
```

### 5. **Advanced Multi-Facet Filtering**
Filter catalysts by:
- Company (name, ticker, ID)
- Event type
- Trial phase
- Date range or quarter
- Probability of success (PoS) range
- Date confidence level
- Target gene, indication
- Regulatory designations (orphan, fast track, breakthrough)
- Status

## API Endpoints

### GET /api/v1/catalysts/
List catalyst events with advanced filtering.

**Query Parameters:**
```
# Search
?search=egfr                    # Search in title, description, company, indication

# Company filters
?company=Vertex                 # Company name
?ticker=VRTX                    # Company ticker
?company_id=123                 # Company ID

# Event filters
?event_type=TOPLINE_READOUT     # Event type
?phase=Phase%20III              # Trial phase

# Date filters
?quarter=Q1%202025              # Quarter
?from=2025-01-01                # Start date
?to=2025-12-31                  # End date

# PoS and confidence
?pos_min=0.5                    # Min probability of success
?pos_max=0.8                    # Max probability of success
?confidence=EXACT_DATE          # Date confidence level

# Additional filters
?target_gene=EGFR               # Target gene
?indication=lung%20cancer       # Indication
?orphan=true                    # Has orphan designation
?fast_track=true                # Has fast track
?breakthrough=true              # Has breakthrough designation

# Status and pagination
?status=UPCOMING                # Event status
?limit=50                       # Results per page
?offset=0                       # Offset for pagination
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "company_id": 123,
      "program_id": 456,
      "trial_id": 789,
      "event_type": "TOPLINE_READOUT",
      "title": "Phase III NSCLC Topline Data",
      "description": "Top-line results from Phase III trial",
      "event_window_start": "2025-04-01",
      "event_window_end": "2025-06-30",
      "expected_date": "2025-05-15",
      "date_confidence": "DATE_WINDOW",
      "endpoint": "Overall Survival",
      "primary_endpoint_type": "SURVIVAL",
      "indication": "Non-small cell lung cancer",
      "trial_nct_id": "NCT12345678",
      "trial_phase": "Phase III",
      "n": 500,
      "orphan": false,
      "fast_track": false,
      "breakthrough": true,
      "quality_score": 87.5,
      "prob_of_success": 0.65,
      "expected_impact": "REV_MOVING",
      "status": "UPCOMING",
      "evidence": [
        {
          "id": 1,
          "source_url": "https://clinicaltrials.gov/study/NCT12345678",
          "source_type": "CT.GOV",
          "accessed_at": "2024-12-15T10:30:00Z",
          "content_hash": "a1b2c3...",
          "parser_version": "ctgov_v2.0.0",
          "selector": "PrimaryCompletionDate",
          "verbatim_excerpt": "Primary Completion Date: May 2025 (Estimated)",
          "created_at": "2024-12-15T10:30:00Z"
        }
      ],
      "analyst_notes": [],
      "created_at": "2024-12-15T10:30:00Z",
      "updated_at": null
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 50,
  "filters": {
    "quarter": "Q2 2025",
    "status": "UPCOMING"
  }
}
```

### GET /api/v1/catalysts/{id}
Get catalyst event by ID with full provenance.

**Response:**
Same as individual catalyst in list response above.

### POST /api/v1/catalysts/
Create a new catalyst event (requires provenance).

**Request Body:**
```json
{
  "company_id": 123,
  "program_id": 456,
  "trial_id": 789,
  "event_type": "PDUFA_DATE",
  "title": "PDUFA Date for Drug XYZ",
  "description": "FDA PDUFA target action date",
  "expected_date": "2025-05-15",
  "date_confidence": "EXACT_DATE",
  "endpoint": "Overall Survival",
  "primary_endpoint_type": "SURVIVAL",
  "indication": "Non-small cell lung cancer",
  "trial_nct_id": "NCT12345678",
  "trial_phase": "Phase III",
  "n": 500,
  "orphan": false,
  "fast_track": false,
  "breakthrough": true,
  "event_leverage": 0.9,
  "endpoint_rigor": 0.95,
  "market_depth": 0.8,
  "phase_weight": 1.0,
  "unmet_need": 0.85,
  "complexity_penalty": 0.1,
  "prob_of_success": 0.65,
  "expected_impact": "REV_MOVING",
  "status": "UPCOMING",
  "source_provenance": [
    {
      "source_url": "https://sec.gov/Archives/edgar/...",
      "source_type": "SEC_EDGAR",
      "accessed_at": "2024-12-15T10:00:00Z",
      "content_hash": "a1b2c3d4e5f6...",
      "parser_version": "edgar_8k_v1.0.0",
      "selector": "div.pdufa-section",
      "verbatim_excerpt": "The FDA has set a PDUFA target action date of May 15, 2025.",
      "source_metadata": {
        "document_type": "8-K",
        "filing_date": "2024-12-15"
      }
    }
  ]
}
```

**Response:** 201 Created with full catalyst details including provenance.

### PATCH /api/v1/catalysts/{id}
Update catalyst event (optionally add new provenance).

**Request Body:**
```json
{
  "title": "Updated PDUFA Date",
  "event_window_start": "2025-05-01",
  "event_window_end": "2025-05-31",
  "date_confidence": "DATE_WINDOW",
  "source_provenance": [
    {
      "source_url": "https://company.com/press-release",
      "source_type": "PRESS_RELEASE",
      "accessed_at": "2024-12-20T14:00:00Z",
      "content_hash": "f6e5d4c3b2a1...",
      "parser_version": "pr_v1.0.0",
      "verbatim_excerpt": "PDUFA date window updated to May 2025"
    }
  ]
}
```

**Response:** 200 OK with updated catalyst details.

## Usage Examples

### Example 1: Find all Phase III oncology catalysts in Q2 2025
```bash
curl "http://localhost:8000/api/v1/catalysts/?phase=Phase%20III&quarter=Q2%202025&search=oncology"
```

### Example 2: Find high-confidence PDUFA dates
```bash
curl "http://localhost:8000/api/v1/catalysts/?event_type=PDUFA_DATE&confidence=EXACT_DATE"
```

### Example 3: Find breakthrough-designated programs with PoS > 0.6
```bash
curl "http://localhost:8000/api/v1/catalysts/?breakthrough=true&pos_min=0.6"
```

### Example 4: Get catalyst with full provenance
```bash
curl "http://localhost:8000/api/v1/catalysts/123"
```

### Example 5: Create catalyst with provenance
```bash
curl -X POST "http://localhost:8000/api/v1/catalysts/" \
  -H "Content-Type: application/json" \
  -d @catalyst_payload.json
```

## Quarter Bucketing Logic

The API automatically handles quarter parsing:
- "Q1 2025" → Jan 1 - Mar 31, 2025
- "Q2 2025" → Apr 1 - Jun 30, 2025
- "Q3 2025" → Jul 1 - Sep 30, 2025
- "Q4 2025" → Oct 1 - Dec 31, 2025
- "2025-Q1" (alternate format) → Same as "Q1 2025"

## Data Validation

### Required Fields
- `company_id`: Must reference existing company
- `event_type`: Must be from controlled vocabulary
- `title`: Non-empty string
- `source_provenance`: At least one provenance record required

### Date Window Validation
- `event_window_start` must be <= `event_window_end`
- `expected_date` (if provided) must be within window

### Hash Validation
- `content_hash`: Must be valid SHA256 hash (64 hex characters)

## Provenance Best Practices

1. **Always provide verbatim excerpts**: Include the exact text that justifies the data point
2. **Use specific selectors**: CSS/XPath selectors help verify extraction
3. **Version parsers**: Increment parser_version when logic changes
4. **Hash source content**: Store SHA256 of raw content for change detection
5. **Include metadata**: Document type, section, page number, etc.

## Quality Score Interpretation

- **80-100**: High-quality catalyst (Phase III, hard endpoint, large N, designations)
- **60-79**: Good catalyst (Phase II/III, reasonable endpoint, adequate N)
- **40-59**: Moderate catalyst (Phase I/II or soft endpoint)
- **0-39**: Low-quality catalyst (early stage, small N, weak endpoint)

## Migration from Legacy API

Legacy catalysts API remains at `/api/v1/catalysts/legacy/*`

To migrate:
1. Use new API for all new catalysts
2. Backfill provenance for existing catalysts via PATCH
3. Update frontend to consume new response format
4. Deprecate legacy API after transition period

## Testing

Run comprehensive test suite:
```bash
poetry run pytest tests/test_catalysts_api.py -v
```

Tests cover:
- Quarter bucketing (all quarters, formats, errors)
- Confidence filtering
- Multi-facet filtering
- Provenance attachment
- Quality score computation
- Pagination and ordering

## Security Considerations

- Source URLs are validated but not fetched automatically
- Content hashes prevent tampering
- Parser versioning enables audit trail
- Analyst notes require author attribution

## Performance Tips

1. **Use pagination**: Default limit is 50, max is 200
2. **Filter early**: Use company_id when possible (indexed)
3. **Avoid wildcards in search**: Use specific terms
4. **Use date ranges**: Filtering by quarter/date range is optimized

## Future Enhancements

- [ ] Batch provenance backfill endpoint
- [ ] Provenance change detection
- [ ] Automated quality score recalculation
- [ ] Catalyst timeline visualization endpoint
- [ ] Diff tracking for date shifts
- [ ] Alert notifications for catalyst updates

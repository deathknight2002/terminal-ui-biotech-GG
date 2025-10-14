# NIH Open-Data Integration Plan

## Executive Summary

**Goal**: Build a reproducible, compliant data ingestion pipeline that exclusively uses open-source, freely-available NIH and public domain datasets to power a spider-web (radar) catalyst scoring system for biotech/pharma trade signal generation, following Redmile-style investment workflow principles.

**Core Principle**: This integration uses **ONLY** open-source and free data sources. No paid APIs, proprietary feeds, or commercial data subscriptions are included. All data sources must be publicly accessible without registration fees or subscription costs.

---

## 1. Priority Data Sources (Open/Free Only)

All sources listed below are verified to be open-source, free, and publicly accessible:

### 1.1 Clinical Trials Data

#### ClinicalTrials.gov API v2
- **Endpoint**: `https://clinicaltrials.gov/api/v2/studies`
- **License**: Public Domain (U.S. Government work)
- **Rate Limit**: 20 requests/second (recommended: 10 req/s)
- **Data Types**: Trial status, enrollment, phases, endpoints, sponsors, locations
- **Signals to Derive**:
  - Trial status changes (recruiting → active → completed)
  - Enrollment velocity (patients/month)
  - Primary endpoint rigor scoring
  - Sponsor activity patterns
  - Phase transition rates
- **API Key**: Not required
- **Documentation**: https://clinicaltrials.gov/api/gui

### 1.2 Scientific Literature

#### NCBI Entrez / PubMed API
- **Endpoint**: `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/`
- **License**: Public Domain (NLM)
- **Rate Limit**: 3 req/s without key, 10 req/s with free API key
- **Data Types**: Publications, abstracts, MeSH terms, citations
- **Signals to Derive**:
  - Publication velocity (papers/month per drug/target)
  - Citation impact and acceleration
  - Author network clustering (KOL identification)
  - MeSH term co-occurrence (mechanism validation)
- **API Key**: Free registration at https://www.ncbi.nlm.nih.gov/account/
- **Documentation**: https://www.ncbi.nlm.nih.gov/books/NBK25501/

#### PubMed Central (PMC) Open Access Subset
- **Endpoint**: `https://www.ncbi.nlm.nih.gov/pmc/tools/openftlist/`
- **License**: Various open licenses (CC BY, CC0)
- **Rate Limit**: Same as Entrez utilities
- **Data Types**: Full-text articles, figures, supplementary data
- **Signals to Derive**:
  - Full methodology extraction
  - Dosing regimen analysis
  - Safety data mining from full text
- **API Key**: Same as PubMed
- **Documentation**: https://www.ncbi.nlm.nih.gov/pmc/tools/oai/

#### bioRxiv / medRxiv RSS/API
- **Endpoint**: `https://api.biorxiv.org/` (unofficial but free)
- **RSS**: `https://connect.biorxiv.org/biorxiv_xml.php?subject=all`
- **License**: CC BY 4.0 / CC BY-NC 4.0
- **Rate Limit**: Reasonable use (1-2 req/s recommended)
- **Data Types**: Preprints, early drug data, conference abstracts
- **Signals to Derive**:
  - Early signal detection (pre-peer review)
  - Conference presentation tracking
  - Academic-to-industry transition signals

### 1.3 Chemical & Compound Data

#### PubChem REST API
- **Endpoint**: `https://pubchem.ncbi.nlm.nih.gov/rest/pug/`
- **License**: Public Domain (NIH)
- **Rate Limit**: 5 requests/second, 400 requests/minute
- **Data Types**: Compound structures, properties, bioassays, patents
- **Signals to Derive**:
  - Structure-activity relationships (SAR)
  - Patent landscape (via PubChem patent links)
  - Bioassay activity clustering
- **API Key**: Not required
- **Documentation**: https://pubchemdocs.ncbi.nlm.nih.gov/pug-rest

#### PubChem BioAssay
- **Endpoint**: `https://pubchem.ncbi.nlm.nih.gov/rest/pug/assay/`
- **License**: Public Domain (NIH)
- **Rate Limit**: Same as PubChem
- **Data Types**: Screening data, IC50/EC50 values, target assays
- **Signals to Derive**:
  - Potency benchmarking
  - Selectivity profiles
  - Target validation evidence

#### ChEMBL (Open Data)
- **Endpoint**: `https://www.ebi.ac.uk/chembl/api/data/`
- **License**: CC BY-SA 3.0 (Open Data)
- **Rate Limit**: No hard limit, reasonable use recommended
- **Data Types**: Bioactivity, drug metabolism, target data
- **Signals to Derive**:
  - Cross-reference to clinical compounds
  - ADME property distributions
  - Target druggability scoring
- **API Key**: Not required
- **Documentation**: https://chembl.gitbook.io/chembl-interface-documentation/web-services/chembl-data-web-services

### 1.4 Genetic & Variant Data

#### ClinVar (Public Variant Catalog)
- **Endpoint**: `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=clinvar`
- **License**: Public Domain (NIH)
- **Rate Limit**: Same as Entrez utilities
- **Data Types**: Variant pathogenicity, disease associations
- **Signals to Derive**:
  - Target validation via genetics
  - Precision medicine opportunity scoring
  - Biomarker identification

#### dbSNP (Single Nucleotide Polymorphism Database)
- **Endpoint**: Via Entrez utilities or bulk download
- **License**: Public Domain (NIH)
- **Rate Limit**: Same as Entrez utilities
- **Data Types**: SNP frequencies, population genetics
- **Signals to Derive**:
  - Patient stratification opportunities
  - Pharmacogenomics signals

#### NCBI GEO (Gene Expression Omnibus)
- **Endpoint**: `https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi`
- **License**: Public Domain (NIH)
- **Rate Limit**: Reasonable use
- **Data Types**: Gene expression datasets, microarray data
- **Signals to Derive**:
  - Disease signature validation
  - Biomarker discovery
  - Target expression profiling

### 1.5 Regulatory & Safety Data

#### OpenFDA
- **Endpoint**: `https://api.fda.gov/`
- **License**: Public Domain (U.S. Government)
- **Rate Limit**: 240 req/minute with API key, 40 req/minute without
- **Data Types**: Drug labels, adverse events (FAERS), recalls, enforcement
- **Signals to Derive**:
  - Safety signal detection
  - Label expansion opportunities
  - Competitive product profiling
- **API Key**: Free registration at https://open.fda.gov/apis/authentication/
- **Documentation**: https://open.fda.gov/apis/

### 1.6 Funding & Grants

#### NIH RePORTER (Research Portfolio Online Reporting Tools)
- **Endpoint**: `https://api.reporter.nih.gov/`
- **License**: Public Domain (NIH)
- **Rate Limit**: No published limit, reasonable use
- **Data Types**: Grant awards, publications, patents from funded research
- **Signals to Derive**:
  - Academic funding trends (target validation)
  - Early-stage research momentum
  - Institutional research focus shifts
- **API Key**: Not required
- **Documentation**: https://api.reporter.nih.gov/

### 1.7 Patent Data (Open Access Only)

#### USPTO Bulk Data / PatentsView API
- **Endpoint**: `https://api.patentsview.org/patents/query` (free)
- **Bulk Data**: `https://bulkdata.uspto.gov/`
- **License**: Public Domain (U.S. Government)
- **Rate Limit**: No published limit
- **Data Types**: Patent applications, grants, citations, assignees
- **Signals to Derive**:
  - IP landscape mapping
  - Citation network analysis
  - Technology lifecycle tracking

#### The Lens (Open Patent Search)
- **Endpoint**: `https://www.lens.org/lens/search/patent/` (free tier)
- **License**: Free for academic/research use
- **Rate Limit**: API available with free academic account
- **Data Types**: Patent families, citations, biological sequences
- **Signals to Derive**:
  - Patent family analysis
  - Freedom-to-operate assessment
  - Competitive intelligence

#### Google Patents Public Data
- **Endpoint**: BigQuery public dataset (free tier)
- **License**: Public Domain
- **Rate Limit**: BigQuery free tier limits (1 TB/month free)
- **Data Types**: Full patent corpus, citations, classifications
- **Signals to Derive**:
  - Patent landscaping at scale
  - Technology convergence detection

---

## 2. Integration Architecture

### 2.1 Connector Design Pattern

**Technology Stack**: Node.js/TypeScript for all connectors

**Interface Specification** (see `connectors/README.md`):
```typescript
interface DataConnector {
  name: string;
  source: string;
  version: string;
  
  // Fetch data with provenance
  fetch(query: QueryParams): Promise<RawDataRecord[]>;
  
  // Transform to canonical schema
  transform(raw: RawDataRecord[]): Promise<CanonicalRecord[]>;
  
  // Health check
  healthCheck(): Promise<HealthStatus>;
}

interface RawDataRecord {
  sourceId: string;
  sourceType: string;
  fetchedAt: string;  // ISO 8601
  rawPayload: any;    // Full JSON/XML response
  contentHash: string; // SHA-256 of rawPayload
  apiVersion: string;
}

interface CanonicalRecord {
  schemaVersion: string;
  recordType: 'Trial' | 'Publication' | 'Compound' | 'Patent' | 'Grant' | 'Variant' | 'CompanyEvent';
  data: any;  // Schema-specific
  provenance: ProvenanceMetadata;
}
```

### 2.2 ETL Pipeline

**Orchestration**: Dagster (existing in repository) or standalone Node.js jobs

**Flow**:
```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Connector  │────▶│  Rate Limiter│────▶│ Raw Storage  │────▶│  Transform   │
│  (TypeScript)│     │   + Cache    │     │  (S3/local)  │     │  to Canonical│
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                                                                         │
                                                                         ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Terminal UI │◀────│ Feature Store│◀────│  Canonical   │◀────│  Validation  │
│  (React)     │     │  (Postgres)  │     │   Schema     │     │  (Zod/JSON)  │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

### 2.3 Canonical Schemas

Extend existing schemas in `bt_platform/core/schema.py`:

#### Trial (Enhanced)
```python
class Trial(Base):
    nct_id: str
    title: str
    phase: str
    status: str
    enrollment_target: int
    enrollment_actual: int
    sponsor: str
    primary_endpoint: str
    # NEW fields:
    last_status_change_date: datetime
    enrollment_velocity: float  # patients/month
    endpoint_rigor_score: float  # 0-1
```

#### Publication
```python
class Publication(Base):
    pmid: str  # PubMed ID
    title: str
    abstract: str
    journal: str
    publication_date: date
    authors: str[]  # JSON array
    mesh_terms: str[]
    citation_count: int
    related_drugs: str[]  # Extracted mentions
    related_targets: str[]
```

#### Compound
```python
class Compound(Base):
    pubchem_cid: int
    chembl_id: str
    smiles: str
    molecular_weight: float
    bioassay_hits: int
    potency_ic50: float  # nM
    selectivity_ratio: float
```

#### Patent
```python
class Patent(Base):
    patent_number: str
    application_date: date
    grant_date: date
    title: str
    abstract: str
    assignee: str
    inventors: str[]
    citation_count: int
    family_size: int
```

#### Grant
```python
class Grant(Base):
    project_number: str  # NIH project ID
    agency: str
    fiscal_year: int
    award_amount: int
    title: str
    pi_name: str
    institution: str
    related_publications: int
```

#### Variant
```python
class Variant(Base):
    variant_id: str  # dbSNP rs ID or ClinVar
    gene: str
    clinical_significance: str
    disease_association: str
    population_frequency: float
```

#### CompanyEvent (from existing schema)
```python
class CatalystEvent(Base):
    # Existing fields + enhanced signals from integrated data
    event_type: str
    expected_date: datetime
    # NEW fields:
    publication_velocity_30d: int  # Papers in last 30 days
    trial_status_changes_90d: int
    patent_activity_12m: int
```

### 2.4 Storage Recommendation

**Database**: PostgreSQL (existing) with JSONB for flexible schema evolution

**Raw Data**: 
- Local: `data/lake/raw/{source}/{date}/` (parquet or JSON)
- Production: S3/Cloud Storage with Iceberg table format

**Canonical Data**: Postgres tables (see schemas above)

**Feature Store**: 
- Postgres with materialized views for fast queries
- DuckDB for analytics (existing in repository)

### 2.5 Provenance Tracking

Every record must include full provenance chain:

```typescript
interface ProvenanceMetadata {
  sourceUrl: string;          // API endpoint called
  sourceType: string;         // 'ClinicalTrials.gov', 'PubMed', etc.
  accessedAt: string;         // ISO 8601 timestamp
  contentHash: string;        // SHA-256 of raw response
  apiVersion: string;         // API version used
  connectorVersion: string;   // Connector code version
  rawPayloadLocation: string; // S3/local path to full response
}
```

**Benefits**:
- Audit trail for regulatory review
- Ability to replay transformations
- Data quality debugging
- Citation generation for research

---

## 3. Signal & Feature Extraction

### 3.1 Publication Velocity
- **Input**: PubMed API
- **Calculation**: Count papers per drug/target per time window (7d, 30d, 90d)
- **Signal**: Acceleration in publication rate indicates momentum
- **Weight in Scoring**: 0.15 (medium priority)

### 3.2 Trial Status Changes
- **Input**: ClinicalTrials.gov API
- **Calculation**: Track status transitions (recruiting → active → completed)
- **Signal**: Phase transitions, enrollment completion
- **Weight in Scoring**: 0.25 (high priority)

### 3.3 Bioactivity Hits
- **Input**: PubChem BioAssay, ChEMBL
- **Calculation**: Count active assays, potency improvements
- **Signal**: Target validation strength
- **Weight in Scoring**: 0.10 (supporting evidence)

### 3.4 Grant Awards
- **Input**: NIH RePORTER
- **Calculation**: Sum award amounts per target/indication
- **Signal**: Academic/NIH validation of biology
- **Weight in Scoring**: 0.08 (early validation)

### 3.5 Patent Activity
- **Input**: USPTO, The Lens
- **Calculation**: Patent applications, citations, family size
- **Signal**: IP strength, competitive moat
- **Weight in Scoring**: 0.12 (strategic importance)

### 3.6 Safety Signals
- **Input**: OpenFDA FAERS
- **Calculation**: Adverse event reporting rate vs. expected
- **Signal**: Risk flags for similar mechanisms
- **Weight in Scoring**: -0.15 (penalty for safety concerns)

### 3.7 Genetic Evidence
- **Input**: ClinVar, NCBI GEO
- **Calculation**: Variant pathogenicity, expression correlation
- **Signal**: Target validation via genetics
- **Weight in Scoring**: 0.10 (supporting evidence)

---

## 4. Spider-Web (Radar) Catalyst Scoring System

### 4.1 Scoring Dimensions

The spider-web visualization will plot 8 dimensions:

1. **Clinical Progress** (0-100)
   - Trial phase advancement
   - Enrollment velocity
   - Endpoint rigor

2. **Scientific Momentum** (0-100)
   - Publication velocity
   - Citation impact
   - Conference presentations

3. **Target Validation** (0-100)
   - Genetic evidence (ClinVar)
   - Bioassay potency (PubChem/ChEMBL)
   - Expression data (GEO)

4. **Intellectual Property** (0-100)
   - Patent family size
   - Citation network
   - Freedom-to-operate

5. **Funding & Academic Support** (0-100)
   - NIH grant awards
   - Academic partnerships
   - KOL involvement

6. **Safety Profile** (0-100)
   - FAERS signal strength
   - Mechanism-based risk
   - Historical safety data

7. **Regulatory Path** (0-100)
   - FDA guidance alignment
   - Endpoint acceptance
   - Precedent analysis

8. **Commercial Potential** (0-100)
   - Market size (from public sources)
   - Competitive landscape (patent analysis)
   - Unmet need (publication trends)

### 4.2 Weighting & Configuration

**Default Weights** (configurable via YAML):
```yaml
scoring:
  dimensions:
    clinical_progress:
      weight: 0.25
      min_threshold: 20  # Below this, flag as high-risk
    scientific_momentum:
      weight: 0.15
      min_threshold: 10
    target_validation:
      weight: 0.15
      min_threshold: 30
    intellectual_property:
      weight: 0.12
      min_threshold: 15
    funding_support:
      weight: 0.08
      min_threshold: 5
    safety_profile:
      weight: 0.15
      min_threshold: 40  # Inverse: higher = safer
    regulatory_path:
      weight: 0.05
      min_threshold: 20
    commercial_potential:
      weight: 0.05
      min_threshold: 10
  
  aggregation: "weighted_average"  # or "geometric_mean"
  
  risk_flags:
    - dimension: safety_profile
      threshold: 30
      severity: high
    - dimension: clinical_progress
      threshold: 15
      severity: medium
```

### 4.3 Explainability Requirements

**Per-Score Breakdown**:
```json
{
  "catalyst_id": "CATA123",
  "final_score": 72.5,
  "scores_by_dimension": {
    "clinical_progress": {
      "score": 85,
      "contributing_factors": [
        {"factor": "Phase 3 trial initiated", "weight": 0.4, "value": 100},
        {"factor": "Enrollment at 80% target", "weight": 0.3, "value": 80},
        {"factor": "Primary endpoint validated in P2", "weight": 0.3, "value": 75}
      ]
    },
    "scientific_momentum": {
      "score": 68,
      "contributing_factors": [
        {"factor": "15 publications in last 90 days", "weight": 0.5, "value": 75},
        {"factor": "2 high-impact journals", "weight": 0.3, "value": 60},
        {"factor": "ASCO presentation scheduled", "weight": 0.2, "value": 70}
      ]
    }
    // ... other dimensions
  },
  "risk_flags": [
    {
      "dimension": "safety_profile",
      "severity": "medium",
      "message": "2 FAERS reports in similar mechanism class",
      "source": "OpenFDA FAERS Q4 2024"
    }
  ],
  "data_sources": [
    "ClinicalTrials.gov (NCT12345678)",
    "PubMed (15 publications)",
    "OpenFDA (FAERS)",
    "NIH RePORTER (Grant R01CA123456)"
  ]
}
```

**UI Display**: 
- Spider-web chart with dimension scores
- Drill-down table showing contributing factors
- Data provenance links (clickable to source)
- Risk flag badges

### 4.4 Visualization in Terminal UI

Using existing terminal components (see `frontend-components/src/terminal/`):

```typescript
import { SpiderWebChart } from '@biotech-terminal/frontend-components/visualizations';
import { Panel } from '@biotech-terminal/frontend-components/terminal';

<Panel title="CATALYST SCORE" cornerBrackets>
  <SpiderWebChart
    dimensions={[
      { name: 'Clinical Progress', value: 85, max: 100 },
      { name: 'Scientific Momentum', value: 68, max: 100 },
      { name: 'Target Validation', value: 72, max: 100 },
      { name: 'IP Strength', value: 55, max: 100 },
      { name: 'Funding Support', value: 60, max: 100 },
      { name: 'Safety Profile', value: 45, max: 100 },
      { name: 'Regulatory Path', value: 70, max: 100 },
      { name: 'Commercial Potential', value: 50, max: 100 },
    ]}
    colorScheme="amber"
  />
</Panel>
```

---

## 5. Compliance & Ethics

### 5.1 Open-Source / Free-Only Requirement

**Strict Policy**:
- ✅ All data sources listed in Section 1 are verified free and open
- ❌ Do NOT integrate: Bloomberg, FactSet, Refinitiv, S&P Capital IQ, or any paid service
- ❌ Do NOT access: Controlled-access datasets (dbGaP, UK Biobank)
- ✅ Verify licensing before adding new sources
- ✅ Document API terms in `docs/DATA_SOURCES.md`

**Verification Checklist** (for new sources):
- [ ] No API key required OR free registration
- [ ] No subscription fee
- [ ] No commercial restrictions for research use
- [ ] Rate limits are reasonable (>=1 req/s)
- [ ] Data is redistributable (public domain or open license)

### 5.2 Rate Limits & API Terms

**Implementation**:
```typescript
// Use existing rate limiter from bt_platform/core/utils/ratelimit.py pattern
import { RateLimiter } from './utils/rate-limiter';

const ctgovLimiter = new RateLimiter({
  domain: 'clinicaltrials.gov',
  requestsPerSecond: 10,
  burst: 20,
  cacheTTL: 3600  // 1 hour
});
```

**Best Practices**:
- Conservative rate limits (50% of published limit)
- Exponential backoff on 429 (rate limit) responses
- Respect `Retry-After` headers
- Cache responses to minimize redundant requests
- Implement circuit breaker pattern for failing APIs

### 5.3 No PHI / Controlled-Access Data

**Prohibited**:
- ❌ Patient-level data from dbGaP (controlled access)
- ❌ Individual case reports with identifiers
- ❌ UK Biobank (requires application)
- ❌ Any dataset requiring IRB approval

**Allowed**:
- ✅ Aggregate trial results (ClinicalTrials.gov)
- ✅ De-identified FAERS adverse events (OpenFDA)
- ✅ Published abstracts and papers (PubMed)
- ✅ Variant catalogs without patient IDs (ClinVar, dbSNP)

### 5.4 Attribution & Provenance

**Requirements**:
- Every data point must link to source (URL, timestamp)
- UI must display "Data from [Source]" with clickable link
- API responses include `X-Data-Sources` header
- Exports include full provenance metadata

**Example**:
```
Data sources for ACME-123 trial:
- ClinicalTrials.gov (NCT98765432, accessed 2024-01-15)
- PubMed (PMID: 12345678, accessed 2024-01-15)
- NIH RePORTER (Grant R01CA999999, accessed 2024-01-15)
```

---

## 6. MVP Acceptance Criteria

### 6.1 Phase 1: Core Connectors (Month 1)

**Deliverables**:
- [x] Connector interface definition (`connectors/README.md`)
- [ ] ClinicalTrials.gov v2 connector
  - [ ] Search by condition
  - [ ] Incremental updates (since timestamp)
  - [ ] Transform to Trial canonical schema
- [ ] PubMed/Entrez connector
  - [ ] Search by drug/target
  - [ ] Fetch abstracts
  - [ ] Transform to Publication schema
- [ ] PubChem connector
  - [ ] Fetch compound properties
  - [ ] Fetch bioassay data
  - [ ] Transform to Compound schema

**Tests**:
- [ ] Unit tests for each connector
- [ ] Integration tests with live APIs
- [ ] Rate limiting validation
- [ ] Provenance tracking verification

**Acceptance**:
- All 3 connectors can fetch data from live APIs
- Raw data stored with full provenance
- Canonical schemas validated with Zod
- Rate limiters prevent API violations

### 6.2 Phase 2: ETL Pipeline (Month 2)

**Deliverables**:
- [ ] Dagster assets for scheduled ingestion
- [ ] Transformation logic (raw → canonical)
- [ ] Postgres schema migrations
- [ ] Data validation and error handling

**Tests**:
- [ ] End-to-end pipeline test (API → DB)
- [ ] Idempotency (re-running doesn't duplicate)
- [ ] Schema evolution (backward compatibility)

**Acceptance**:
- Daily automated ingestion runs successfully
- Data quality metrics dashboard
- 99.9% pipeline uptime

### 6.3 Phase 3: Feature Extraction (Month 3)

**Deliverables**:
- [ ] SQL views for feature calculations
- [ ] Publication velocity calculation
- [ ] Trial status change detection
- [ ] Bioactivity aggregation
- [ ] Grant award tracking

**Tests**:
- [ ] Feature calculation correctness
- [ ] Performance benchmarks (queries < 500ms)

**Acceptance**:
- Features update within 1 hour of data ingestion
- Feature store queryable via API

### 6.4 Phase 4: Spider-Web Scoring (Month 4)

**Deliverables**:
- [ ] Scoring engine implementation
- [ ] Configuration YAML for weights
- [ ] Explainability JSON output
- [ ] API endpoint: `GET /api/v1/catalysts/{id}/score`

**Tests**:
- [ ] Score reproducibility (same input → same output)
- [ ] Weight configuration validation
- [ ] Explainability completeness

**Acceptance**:
- Scores generated for all tracked catalysts
- Explainability shows all contributing factors
- Configuration changes don't break scoring

### 6.5 Phase 5: UI Integration (Month 5)

**Deliverables**:
- [ ] Spider-web chart component (if not exists)
- [ ] Catalyst score card with drill-down
- [ ] Data provenance links in UI
- [ ] Risk flag badges

**Tests**:
- [ ] Visual regression tests
- [ ] Accessibility (WCAG AA)
- [ ] Mobile responsiveness

**Acceptance**:
- Users can view catalyst scores in terminal UI
- Clicking dimensions shows contributing factors
- Data sources are clickable and open in new tab

---

## 7. Suggested Timeline & Milestones

**Total Duration**: 5 months (MVP)

### Milestone 1: Connector Foundation (Week 1-4)
- Week 1: Interface definition, rate limiter utility
- Week 2: ClinicalTrials.gov connector + tests
- Week 3: PubMed connector + tests
- Week 4: PubChem connector + tests

### Milestone 2: ETL Infrastructure (Week 5-8)
- Week 5: Dagster setup, raw storage
- Week 6: Transformation pipeline
- Week 7: Postgres schemas and migrations
- Week 8: End-to-end testing

### Milestone 3: Feature Engineering (Week 9-12)
- Week 9: SQL views for features
- Week 10: Publication velocity
- Week 11: Trial signals
- Week 12: Testing and validation

### Milestone 4: Scoring System (Week 13-16)
- Week 13: Scoring engine core
- Week 14: Configuration system
- Week 15: Explainability layer
- Week 16: API endpoints

### Milestone 5: UI & Polish (Week 17-20)
- Week 17: Spider-web component
- Week 18: Catalyst score card
- Week 19: Integration and styling
- Week 20: User testing and refinement

---

## 8. GitHub Project Configuration

### 8.1 Suggested Labels

Create these labels in GitHub Issues:

- `nih-integration` (primary label)
- `connector:new` (new connector implementation)
- `connector:enhancement` (improve existing connector)
- `data-source:open` (verified open-source)
- `data-source:verification-needed` (needs license check)
- `etl:pipeline` (ETL work)
- `feature:extraction` (feature engineering)
- `scoring:engine` (scoring system)
- `ui:visualization` (UI components)
- `compliance:required` (legal/compliance review needed)

### 8.2 Suggested Milestone

**Name**: NIH Open-Data Integration MVP

**Description**: 
> Ingest open-source NIH and public domain datasets to build spider-web catalyst scoring system for trade signal generation. Strictly open/free data only.

**Due Date**: 5 months from start

**Linked Issues** (examples):
- #1: Define connector interface
- #2: Implement ClinicalTrials.gov connector
- #3: Implement PubMed connector
- #4: Implement PubChem connector
- #5: Build ETL pipeline
- #6: Create feature extraction views
- #7: Build scoring engine
- #8: Create spider-web visualization

### 8.3 Example Checklist for Issues

When creating issues for new connectors, use this template:

```markdown
### Connector Implementation Checklist

- [ ] Verify data source is open/free (confirm in issue description)
- [ ] Document API endpoint, rate limits, license
- [ ] Implement fetch() with rate limiting
- [ ] Implement transform() to canonical schema
- [ ] Add unit tests (>80% coverage)
- [ ] Add integration test with live API
- [ ] Test rate limiter behavior
- [ ] Verify provenance tracking
- [ ] Update `docs/DATA_SOURCES.md`
- [ ] Add example usage to `connectors/README.md`
- [ ] Create PR with descriptive title
```

---

## 9. Recommendations for Contributors

### 9.1 Before Adding a New Data Source

1. **Verify Open/Free Status**:
   - Check if API key costs money
   - Check if there's a subscription tier
   - Read Terms of Service for commercial use restrictions

2. **Check Rate Limits**:
   - Document published rate limits
   - Test actual limits (may differ)
   - Plan conservative usage (50% of limit)

3. **Assess Data Quality**:
   - Sample data completeness
   - Check update frequency
   - Verify data accuracy against known examples

4. **Review License**:
   - Public domain? (✅ ideal)
   - Creative Commons? (✅ check attribution requirements)
   - Academic use only? (⚠️ may limit production deployment)
   - Proprietary? (❌ do not use)

### 9.2 Rate Limiting Strategy

**Implementation Pattern**:
```typescript
import { RateLimiter } from './utils/rate-limiter';

const limiter = new RateLimiter({
  domain: 'api.example.com',
  requestsPerSecond: 5,    // Conservative
  burst: 10,                // Allow short bursts
  cacheTTL: 3600,          // Cache for 1 hour
  backoffMultiplier: 2,     // Exponential backoff
  maxRetries: 3
});

async function fetchData(url: string) {
  return await limiter.fetch(url, {
    onRateLimit: (retryAfter) => {
      console.log(`Rate limited, retry after ${retryAfter}s`);
    },
    onError: (error) => {
      console.error('Fetch error:', error);
    }
  });
}
```

### 9.3 Caching Raw Payloads

**Storage Structure**:
```
data/lake/raw/
├── clinicaltrials/
│   └── 2024-01-15/
│       ├── 001-NCT12345678.json
│       ├── 002-NCT87654321.json
│       └── manifest.json
├── pubmed/
│   └── 2024-01-15/
│       ├── 001-PMID12345678.json
│       └── manifest.json
└── pubchem/
    └── 2024-01-15/
        └── ...
```

**Manifest Format**:
```json
{
  "date": "2024-01-15",
  "source": "ClinicalTrials.gov",
  "recordCount": 152,
  "files": [
    {
      "filename": "001-NCT12345678.json",
      "contentHash": "a1b2c3d4...",
      "fetchedAt": "2024-01-15T10:30:00Z",
      "apiVersion": "v2",
      "connectorVersion": "1.0.0"
    }
  ]
}
```

**Benefits**:
- Audit trail for compliance
- Ability to replay transformations
- Debug data quality issues
- Research reproducibility

### 9.4 Provenance Best Practices

**Always Include**:
- Source URL (exact endpoint called)
- Timestamp (ISO 8601, UTC)
- API version
- Connector code version
- Content hash (SHA-256 of response)

**Store Separately**:
- Raw payload in file storage (S3/local)
- Metadata in Postgres `ProviderRaw` table
- Transformed data in canonical tables

**Example Code**:
```typescript
async function fetchWithProvenance(url: string) {
  const response = await fetch(url);
  const rawPayload = await response.json();
  const contentHash = sha256(JSON.stringify(rawPayload));
  
  const provenance: ProvenanceMetadata = {
    sourceUrl: url,
    sourceType: 'ClinicalTrials.gov',
    accessedAt: new Date().toISOString(),
    contentHash: contentHash,
    apiVersion: 'v2',
    connectorVersion: '1.0.0',
    rawPayloadLocation: `s3://bucket/raw/${contentHash}.json`
  };
  
  // Store raw payload
  await storeRawPayload(contentHash, rawPayload);
  
  // Store provenance
  await storeProvenance(provenance);
  
  return { rawPayload, provenance };
}
```

---

## 10. Configurable Scoring System

### 10.1 Configuration File Format (YAML)

**Location**: `config/scoring/catalyst-scoring.yaml`

```yaml
version: "1.0"
description: "Catalyst scoring configuration for spider-web visualization"

dimensions:
  clinical_progress:
    weight: 0.25
    enabled: true
    thresholds:
      min: 20
      warning: 40
      good: 70
    factors:
      - name: trial_phase
        weight: 0.4
        source: Trial.phase
        mapping:
          "Phase I": 20
          "Phase II": 40
          "Phase III": 80
          "Filed": 95
          "Approved": 100
      - name: enrollment_progress
        weight: 0.3
        source: Trial.enrollment_actual / Trial.enrollment_target
        transform: "percentage"
      - name: endpoint_rigor
        weight: 0.3
        source: Trial.endpoint_rigor_score
        transform: "multiply_100"
  
  scientific_momentum:
    weight: 0.15
    enabled: true
    thresholds:
      min: 10
      warning: 30
      good: 60
    factors:
      - name: publication_velocity_30d
        weight: 0.5
        source: "COUNT(Publication WHERE date > NOW() - 30 days)"
        transform: "log_scale"
        log_base: 2
      - name: citation_impact
        weight: 0.3
        source: "AVG(Publication.citation_count)"
        transform: "percentile_rank"
      - name: high_impact_journals
        weight: 0.2
        source: "COUNT(Publication WHERE journal IN high_impact_list)"
        transform: "normalize"
  
  # ... other dimensions
  
aggregation:
  method: "weighted_average"  # or "geometric_mean", "harmonic_mean"
  normalize: true  # Scale final score to 0-100

risk_flags:
  - dimension: safety_profile
    operator: "<"
    threshold: 30
    severity: "high"
    message: "Low safety profile score indicates potential concerns"
  - dimension: clinical_progress
    operator: "<"
    threshold: 15
    severity: "medium"
    message: "Limited clinical progress"

explainability:
  include_factor_breakdown: true
  include_data_sources: true
  include_calculation_steps: true
```

### 10.2 Loading Configuration

```typescript
import YAML from 'yaml';
import fs from 'fs';

interface ScoringConfig {
  version: string;
  dimensions: Record<string, DimensionConfig>;
  aggregation: AggregationConfig;
  risk_flags: RiskFlag[];
  explainability: ExplainabilityConfig;
}

function loadScoringConfig(path: string): ScoringConfig {
  const fileContents = fs.readFileSync(path, 'utf8');
  return YAML.parse(fileContents);
}

const config = loadScoringConfig('config/scoring/catalyst-scoring.yaml');
```

### 10.3 Applying Configuration

```typescript
class CatalystScoringEngine {
  constructor(private config: ScoringConfig) {}
  
  async calculateScore(catalystId: string): Promise<ScoringResult> {
    const dimensionScores: Record<string, DimensionScore> = {};
    
    // Calculate each dimension
    for (const [dimName, dimConfig] of Object.entries(this.config.dimensions)) {
      if (!dimConfig.enabled) continue;
      
      const factors = await this.calculateFactors(catalystId, dimConfig.factors);
      const score = this.aggregateFactors(factors, dimConfig);
      
      dimensionScores[dimName] = {
        score,
        factors,
        threshold: dimConfig.thresholds
      };
    }
    
    // Aggregate dimensions
    const finalScore = this.aggregateDimensions(dimensionScores, this.config);
    
    // Check risk flags
    const riskFlags = this.checkRiskFlags(dimensionScores, this.config.risk_flags);
    
    // Build explainability
    const explainability = this.buildExplainability(
      dimensionScores,
      finalScore,
      riskFlags
    );
    
    return {
      catalystId,
      finalScore,
      dimensionScores,
      riskFlags,
      explainability
    };
  }
}
```

---

## 11. Next Steps

### 11.1 Immediate Actions (This Week)

1. **Create GitHub Milestone**: "NIH Open-Data Integration MVP"
2. **Create Initial Issues**:
   - Issue #1: Define connector interface (assign to lead engineer)
   - Issue #2: Setup connector directory structure
   - Issue #3: Implement rate limiter utility
3. **Setup Development Environment**:
   - Install dependencies
   - Create `connectors/` directory
   - Create `config/scoring/` directory

### 11.2 First Sprint (Week 1-2)

1. **Implement Connector Interface**:
   - Define TypeScript interfaces in `connectors/README.md`
   - Create base classes/utilities
   - Write example tests
2. **Setup Rate Limiting**:
   - Port Python rate limiter to TypeScript
   - Add caching layer
   - Test with live API
3. **ClinicalTrials.gov Connector** (Priority 1):
   - Implement fetch()
   - Implement transform()
   - Add tests

### 11.3 Ongoing

- **Weekly Sync**: Review progress, blockers
- **Data Source Review**: Evaluate new sources suggested by contributors
- **Compliance Check**: Quarterly review of API terms and licenses
- **Performance Monitoring**: Track API response times, rate limit hits

---

## 12. References & Resources

### Official Documentation
- **ClinicalTrials.gov API**: https://clinicaltrials.gov/api/gui
- **NCBI E-utilities**: https://www.ncbi.nlm.nih.gov/books/NBK25501/
- **PubChem REST API**: https://pubchemdocs.ncbi.nlm.nih.gov/pug-rest
- **OpenFDA**: https://open.fda.gov/apis/
- **NIH RePORTER API**: https://api.reporter.nih.gov/
- **ChEMBL Web Services**: https://chembl.gitbook.io/chembl-interface-documentation/

### Existing Documentation (this repo)
- `docs/DATA_SOURCES.md` - Current data source licensing
- `OPEN_DATA_TERMINAL_PLAN.md` - UI integration plan
- `CATALYST_PLATFORM_README.md` - Platform architecture
- `bt_platform/core/schema.py` - Database schemas

### Related Standards
- **CloudEvents**: For event messaging (P0_P1_IMPLEMENTATION.md)
- **FHIR**: Clinical data interoperability (future consideration)
- **OpenAPI**: API documentation standard

---

## Appendix A: Connector Prioritization Matrix

| Connector | Priority | Complexity | Impact | MVP Required |
|-----------|----------|------------|--------|--------------|
| ClinicalTrials.gov | P0 | Low | High | Yes |
| PubMed/Entrez | P0 | Low | High | Yes |
| PubChem | P0 | Medium | Medium | Yes |
| OpenFDA | P1 | Low | Medium | No |
| NIH RePORTER | P1 | Low | Low | No |
| ChEMBL | P1 | Medium | Medium | No |
| ClinVar | P2 | Medium | Low | No |
| dbSNP | P2 | High | Low | No |
| NCBI GEO | P2 | High | Low | No |
| USPTO/PatentsView | P2 | Medium | Low | No |
| bioRxiv/medRxiv | P3 | Low | Low | No |

**Priority Definitions**:
- P0: MVP critical, implement first
- P1: High value, implement after MVP
- P2: Nice-to-have, implement as resources allow
- P3: Future enhancement

---

## Appendix B: API Key Registration Links

For sources that require free registration:

1. **NCBI E-utilities API Key**: https://www.ncbi.nlm.nih.gov/account/
2. **OpenFDA API Key**: https://open.fda.gov/apis/authentication/
3. **The Lens Academic Account**: https://www.lens.org/lens/user/register

**No registration required** (anonymous access):
- ClinicalTrials.gov
- PubChem
- USPTO/PatentsView
- ChEMBL

---

## Appendix C: Sample Queries

### ClinicalTrials.gov
```bash
# Search for trials by condition
curl "https://clinicaltrials.gov/api/v2/studies?query.cond=ulcerative+colitis&pageSize=10"

# Get specific trial
curl "https://clinicaltrials.gov/api/v2/studies/NCT01234567"
```

### PubMed/Entrez
```bash
# Search for publications
curl "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=pembrolizumab&retmode=json"

# Fetch abstract
curl "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=12345678&retmode=xml"
```

### PubChem
```bash
# Get compound by CID
curl "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/2244/JSON"

# Search bioassays
curl "https://pubchem.ncbi.nlm.nih.gov/rest/pug/assay/target/geneid/12345/aids/JSON"
```

---

**Document Version**: 1.0  
**Last Updated**: 2024-01-15  
**Maintained By**: Data Platform Team  
**Review Frequency**: Quarterly

---

**End of NIH Integration Plan**

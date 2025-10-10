# Phase 2 Implementation Guide: Evidence Journal Enhancements

## Overview

This document describes the Phase 2 enhancements to the Evidence Journal system, implementing authoritative data feeds, expanded endpoint truth tables, and scientific rigor components.

## New Data Connectors

### 1. FDA Advisory Committee Connector (`src/connectors/fda-adcomm.ts`)

**Purpose**: Track AdComm meetings and upgrade catalyst confidence levels

**Features**:
- Scrapes FDA Advisory Committee Calendar
- Checks Federal Register postings for confirmation
- Automatically upgrades confidence: `estimated` → `likely` → `confirmed`

**Usage**:
```typescript
import { FDAAdCommConnector } from '@/connectors/fda-adcomm';

const connector = new FDAAdCommConnector();
const meetings = await connector.getUpcomingMeetings(180); // Next 180 days

// Check if meeting has Federal Register posting
const isConfirmed = await connector.checkFederalRegister('FDA-2026-N-0001');
```

**API Endpoints**:
- FDA Advisory Committee Calendar: `https://www.fda.gov/advisory-committees/advisory-committee-calendar`
- Federal Register API: `https://www.federalregister.gov/api/v1/documents.json`

---

### 2. SEC EDGAR Connector (`src/connectors/sec-edgar.ts`)

**Purpose**: Surface 8-K filings mentioning clinical endpoints

**Features**:
- Parses SEC EDGAR filings in JSON format
- Filters by clinical keywords (endpoints, phase, trial, PDUFA, etc.)
- Extracts company/ticker and filing metadata

**Usage**:
```typescript
import { SECEdgarConnector } from '@/connectors/sec-edgar';

const connector = new SECEdgarConnector();

// Get filings for a specific company
const filings = await connector.getFilingsByTicker('XYZ', 10);

// Search recent filings with clinical mentions
const clinicalFilings = await connector.searchClinicalEndpointFilings(30);
```

**Clinical Keywords Tracked**:
- Phase I/II/III trial mentions
- Endpoint language (primary endpoint, secondary endpoint)
- Regulatory events (PDUFA, NDA, BLA, CRL)
- Designation types (orphan, breakthrough, fast track)

---

### 3. EMA Connector (`src/connectors/ema.ts`)

**Purpose**: Retrieve European medicines data and CHMP meeting schedules

**Features**:
- Downloads medicine authorization data
- Tracks CHMP meeting calendar (monthly meetings)
- Identifies EU catalyst dates

**Usage**:
```typescript
import { EMAConnector } from '@/connectors/ema';

const connector = new EMAConnector();

// Get medicine data
const medicine = await connector.getMedicineByName('Example Medicine');

// Get upcoming CHMP meetings
const meetings = await connector.getUpcomingCHMPMeetings(12); // Next 12 months

// Check if CHMP opinion expected
const meeting = await connector.checkCHMPOpinion('Drug B');
```

**Data Sources**:
- EMA Medicine Data: `https://www.ema.europa.eu/en/medicines/download-medicine-data`
- CHMP Calendar: `https://www.ema.europa.eu/en/committees/chmp/chmp-agendas-minutes-highlights`

---

### 4. Open Targets Connector (`src/connectors/open-targets.ts`)

**Purpose**: Genetic and target-disease evidence for mechanism validation

**Features**:
- GraphQL API integration
- Target-disease association scores
- Genetic evidence strength (GWAS, rare variants)
- Known drug information

**Usage**:
```typescript
import { OpenTargetsConnector } from '@/connectors/open-targets';

const connector = new OpenTargetsConnector();

// Get target-disease associations
const associations = await connector.getTargetDiseaseAssociations('IL23A', 0.5);

// Get genetic evidence
const genetics = await connector.getGeneticEvidence('ENSG00000120738');

// Find known drugs for target
const drugs = await connector.getKnownDrugs('ENSG00000120738');
```

**Evidence Types**:
- Genetic score (GWAS associations, rare variants)
- Literature score (publication evidence)
- Animal model score (preclinical validation)
- Overall association score (0-1 range)

---

### 5. ChEMBL Connector (`src/connectors/chembl.ts`)

**Purpose**: Drug potency, selectivity, and assay data

**Features**:
- IC50/Ki/EC50 activity data
- Target selectivity analysis
- Mechanism of action details
- Publication linkage

**Usage**:
```typescript
import { ChEMBLConnector } from '@/connectors/chembl';

const connector = new ChEMBLConnector();

// Get activities for a molecule
const activities = await connector.getActivitiesByMolecule('CHEMBL1234');

// Calculate selectivity
const selectivity = await connector.calculateSelectivity('CHEMBL1234', 'Factor XI');

// Format IC50 values
const formatted = connector.formatIC50(4.2, 'nM'); // "4.2 nM"
```

**Activity Types**:
- IC50: Half maximal inhibitory concentration
- Ki: Inhibition constant
- EC50: Half maximal effective concentration
- Assay types: Binding, Functional, ADME

---

### 6. Enhanced CT.gov v2 Connector

**New Feature**: Incremental pull with timestamp cursors

**Purpose**: Enable deterministic Manual refresh with change tracking

**Usage**:
```typescript
import { CTGovV2Connector } from '@/connectors/ctgov-v2';

const connector = new CTGovV2Connector();

// Get trials updated since last pull
const lastPull = '2026-01-01T00:00:00Z';
const updatedTrials = await connector.getTrialsSinceTimestamp(lastPull, {
  condition: 'ulcerative colitis',
  pageSize: 100
});

// Get watermark for next pull
const newWatermark = connector.getLatestTimestamp(updatedTrials);
// Store newWatermark for next incremental pull
```

**Benefits**:
- Deterministic updates (no background polling)
- Efficient bandwidth usage
- Clear change tracking
- Manual refresh shows diff view

---

## Frontend Components

### 1. BayesianSnapshot Component

**Location**: `frontend-components/src/biotech/molecules/BayesianSnapshot/`

**Purpose**: Display plain-English Bayesian analysis for catalyst predictions

**Features**:
- Prior probability (base rate from historical data)
- Likelihood (trial design quality)
- Posterior thresholds (Win/Meh/Kill)
- Source citations
- Optional math explanation

**Usage**:
```tsx
import { BayesianSnapshot } from '@biotech-terminal/frontend-components/biotech';

<BayesianSnapshot
  prior={0.30}
  priorDescription="30% of Phase II IBD trials achieve clinical remission (CT.gov 2015-2024)"
  likelihoodDescription="Double-blind, placebo-controlled, N=200, 80% power"
  posterior={{ win: 0.70, meh: 0.40, kill: 0.15 }}
  sources={[
    { label: 'CT.gov Phase II IBD trials', url: 'https://clinicaltrials.gov' }
  ]}
  showMath={true}
/>
```

**Visual Design**:
- Terminal-style monospace fonts
- Color-coded thresholds (green/yellow/red)
- Clickable source chips
- Theme-aware styling

---

### 2. CredenceBadge Component

**Location**: `frontend-components/src/biotech/molecules/CredenceBadge/`

**Purpose**: Display data credibility indicators for catalysts

**Badge Types**:
- `db-lock`: Database locked (high confidence)
- `sap-lock`: Statistical Analysis Plan locked (high confidence)
- `adjudication`: Endpoint adjudication complete (high confidence)
- `federal-register`: Federal Register posting (confirmed)
- `pdufa-letter`: PDUFA action date confirmed
- `chmp-agenda`: CHMP meeting agenda published
- `filing-accepted`: Regulatory filing accepted
- `biomarker-only`: Surrogate endpoint (medium confidence)
- `post-hoc`: Post-hoc analysis (low confidence)
- `unblinded`: Open-label study (medium confidence)

**Usage**:
```tsx
import { CredenceBadge, CredenceBadgeGroup } from '@biotech-terminal/frontend-components/biotech';

// Single badge
<CredenceBadge 
  type="db-lock" 
  sourceUrl="https://clinicaltrials.gov/study/NCT12345678"
  date="2026-03-15"
/>

// Multiple badges
<CredenceBadgeGroup
  badges={[
    { type: 'db-lock', date: '2026-03-15' },
    { type: 'federal-register', sourceUrl: 'https://...' }
  ]}
  compact={true}
  maxVisible={3}
/>
```

**Confidence Levels**:
- High: Green border, indicates strong credibility
- Medium: Yellow/orange border, moderate credibility
- Low: Gray border, limited credibility

---

### 3. Enhanced SourceChip Component

**Location**: `frontend-components/src/terminal/atoms/SourceChip/`

**New Feature**: Hard fail mode for production data quality

**Usage**:
```tsx
import { SourceChip } from '@biotech-terminal/frontend-components/terminal';

// Normal mode (development)
<SourceChip citation={{
  url: "https://platform.opentargets.org/...",
  domain: "opentargets.org",
  pulledAt: "2024-01-15T10:30:00Z"
}} />

// Hard fail mode (production)
<SourceChip 
  citation={data.citation} 
  hardFail={true} 
/>
// If citation missing → shows error badge "⚠ NO SOURCE - DATA BLOCKED"
```

**Hard Fail Behavior**:
- Logs error to console
- Shows prominent error badge with animation
- Prevents data from being rendered without attribution
- Enforces data quality standards

---

## Expanded EndpointTruth Tables

**Location**: `platform/core/endpoints/evidence.py`

### New Indications Added (10+)

1. **IBD - Ulcerative Colitis** (6 endpoints)
   - Clinical remission
   - Endoscopic remission
   - Steroid-free remission ⭐ NEW
   - Histologic remission
   - Clinical response (CDAI)
   - Endoscopic improvement

2. **IBD - Crohn's Disease** (4 endpoints) ⭐ NEW
   - Clinical remission (CDAI)
   - Endoscopic response
   - Steroid-free clinical remission
   - Transmural healing

3. **Cardiology - HFrEF** (5 endpoints) ⭐ NEW
   - CV death or HF hospitalization
   - CV death
   - KCCQ total symptom score
   - NT-proBNP reduction
   - 6-minute walk distance

4. **Cardiology - HFpEF** (4 endpoints)
   - CV death or HF hospitalization
   - KCCQ clinical summary score ⭐ ENHANCED
   - Total HF hospitalizations
   - Exercise capacity (CPET)

5. **DMD - Duchenne Muscular Dystrophy** (6 endpoints)
   - North Star Ambulatory Assessment (NSAA)
   - Timed function tests (4-stair climb)
   - 10-meter walk/run velocity ⭐ NEW
   - Micro-dystrophin expression ⭐ ENHANCED
   - Dystrophin expression (exon-skipping)
   - Supine-to-stand time ⭐ NEW

6. **Retina - NPDR** (4 endpoints) ⭐ NEW
   - DRSS 2-step improvement
   - DRSS 3-step improvement
   - DRSS progression to PDR
   - BCVA (supportive)

7. **Retina - DME** (4 endpoints) ⭐ NEW
   - BCVA gain ≥15 letters
   - BCVA gain ≥10 letters
   - CST reduction
   - Avoidance of ≥15 letter loss

8. **Oncology - Solid Tumors Advanced** (4 endpoints) ⭐ NEW
   - Overall Survival (OS)
   - Progression-Free Survival (PFS)
   - Objective Response Rate (ORR)
   - Duration of Response (DoR)

9. **Oncology - Adjuvant** (3 endpoints) ⭐ NEW
   - Disease-Free Survival (DFS)
   - Event-Free Survival (EFS)
   - Pathologic Complete Response (pCR)

10. **Alzheimer's Disease** (4 endpoints) ⭐ NEW
    - CDR-SB (Clinical Dementia Rating)
    - ADAS-Cog (cognitive subscale)
    - Amyloid PET reduction
    - ADCS-ADL (Activities of Daily Living)

### Endpoint Structure

Each endpoint includes:
- **name**: Endpoint name
- **decisionGrade**: `true` if FDA considers approvable, `false` if supportive only
- **mcidDescription**: Minimal Clinically Important Difference with context
- **regulatoryPrecedent**: FDA/EMA guidance references and approved drugs

Example:
```python
{
    "name": "Steroid-free remission",
    "decisionGrade": True,
    "mcidDescription": "Clinical remission achieved without corticosteroids for ≥90 days",
    "regulatoryPrecedent": "FDA guidance emphasizes steroid-free endpoints; critical for approval"
}
```

---

## Integration Pattern

### Complete Data Flow

```
1. External Data Sources
   ├─ ClinicalTrials.gov v2 → CTGovV2Connector
   ├─ FDA AdComm Calendar → FDAAdCommConnector
   ├─ SEC EDGAR → SECEdgarConnector
   ├─ EMA → EMAConnector
   ├─ Open Targets → OpenTargetsConnector
   └─ ChEMBL → ChEMBLConnector

2. Backend Aggregation
   └─ platform/core/endpoints/evidence.py
      ├─ Pulls from all connectors
      ├─ Enriches with provenance
      ├─ Applies EndpointTruth validation
      └─ Returns unified JSON

3. Frontend Display
   └─ Terminal App
      ├─ BayesianSnapshot (catalyst predictions)
      ├─ CredenceBadge (data credibility)
      ├─ SourceChip (provenance display)
      └─ Manual refresh (deterministic updates)
```

### Provenance Schema

Every data point must include:
```typescript
{
  url: string;           // Source URL
  domain: string;        // Source domain (e.g., "clinicaltrials.gov")
  pulledAt: string;      // ISO 8601 timestamp
  verifiedAt?: string;   // Optional verification timestamp
}
```

---

## Testing

### Unit Tests (TODO)

1. **Connector Tests**:
   ```bash
   npm test src/connectors/fda-adcomm.test.ts
   npm test src/connectors/sec-edgar.test.ts
   ```

2. **Component Tests**:
   ```bash
   cd frontend-components
   npm test -- BayesianSnapshot
   npm test -- CredenceBadge
   ```

3. **Python Tests**:
   ```bash
   poetry run pytest platform/tests/test_evidence.py
   ```

### Integration Tests (TODO)

1. Test incremental CT.gov pulls
2. Test AdComm confidence upgrades
3. Test SourceChip hard fail mode
4. Test Bayesian calculation accuracy

---

## Rate Limiting & Caching (TODO)

Implement rate limiting for external APIs:

1. **CT.gov**: 1 request per second
2. **SEC EDGAR**: User-Agent required, respect rate limits
3. **Open Targets**: GraphQL rate limits (check docs)
4. **ChEMBL**: REST API rate limits

Cache strategy:
- Raw JSON responses with `pulledAt` timestamp
- TTL based on source (trials: 24h, filings: 1h)
- Redis or local file cache

---

## Next Steps

### Remaining Items

1. **Integrate Drugs@FDA** data files (tab-delimited)
2. **Update evidence.py** to call new connectors
3. **Implement data versioning** with source cursors
4. **Create kill-memo switch** (adversarial mode)
5. **Add noise filter** for underpowered studies
6. **Write comprehensive tests**
7. **Add rate limiting** and caching layer
8. **Update Manual refresh** with diff detection

### Documentation Tasks

1. API documentation for each connector
2. Component storybook examples
3. Integration guide for new data sources
4. Best practices for provenance tracking

---

## References

- **FDA Guidance**: https://www.fda.gov/regulatory-information/search-fda-guidance-documents
- **CT.gov API v2**: https://clinicaltrials.gov/data-api/api
- **SEC EDGAR**: https://www.sec.gov/developer
- **EMA**: https://www.ema.europa.eu/en/medicines/download-medicine-data
- **Open Targets**: https://platform-docs.opentargets.org/
- **ChEMBL**: https://www.ebi.ac.uk/chembl/

---

**Last Updated**: October 10, 2025  
**Implementation Status**: Sprint A & B (Core Features Complete)

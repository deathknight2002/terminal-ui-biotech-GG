# Evidence Journal - Implementation Guide

## Overview

The **Evidence Journal** is a science-first biotech intelligence feature that ranks companies and assets by mechanistic differentiation and surfaces near-term catalysts with transparent evidence trails. It's designed to reduce "time-to-conviction" and "time-to-disqualification" with every insight being sourced, timestamped, and reproducible.

## Product North Star

- **Purpose**: A science-first evidence journal that ranks companies and assets by mechanistic differentiation
- **Success Metrics**: Reduce time-to-conviction and time-to-disqualification with transparent evidence trails
- **Philosophy**: Every insight is sourced, timestamped, and reproducible

## Key Features

### 1. Refresh Modes

Three distinct update modes to balance research stability with data freshness:

#### Manual (Default) ✅ IMPLEMENTED
- **Zero background network** after initial load
- User clicks refresh button to update data
- Shows "Last Refreshed" timestamp
- Perfect for research notebook vibe where you don't want surprise data churn mid-analysis
- Aligns with existing PWA manual-refresh model

#### Scheduled (Future Enhancement)
- Pull data every N minutes (configurable)
- Show countdown timer
- Pause automatically on user edit to prevent data conflicts
- Display "Next refresh in X minutes"

#### Live (Future Enhancement)
- Stream incremental updates via WebSocket/SSE
- Show change badges on affected components
- Offer "apply diff" preview before mutating notes
- Display pending changes counter

**Current Status**: Manual mode is fully implemented. Scheduled and Live modes have UI toggle ready but require backend WebSocket/polling implementation.

### 2. Core Pages

#### Today's Evidence (`/science/evidence-journal` → Today's Evidence tab)

**Purpose**: Surface new developments since last refresh

**Components**:
- **New Trial Events**: Status changes, enrollment milestones, readout dates from ClinicalTrials.gov
- **Label/Guidance Changes**: FDA label updates, guidance documents, safety alerts
- **AdComm Docket Changes**: Advisory committee meeting updates from FDA calendar
- **New 8-K Filings**: SEC filings mentioning clinical endpoints or regulatory updates

**Data Sources** (API-ready structure):
- ClinicalTrials.gov API v2
- FDA: openFDA, Drugs@FDA data files
- SEC/EDGAR 8-K filings
- EMA CHMP meeting calendars

**Features**:
- Each card shows diff view with "Add to Journal" button
- Source badges (CT.gov, FDA, EMA, SEC) with color coding
- Pending updates banner for Scheduled/Live modes

#### Catalyst Board (`/science/evidence-journal` → Catalyst Board tab)

**Purpose**: Timeline of next 90-180 days with catalyst events

**Features**:
- Color-encoded by confidence level:
  - **High**: Green border (confirmed dates from FDA/EMA)
  - **Medium**: Yellow border (company estimates with uncertainty)
  - **Low**: Red border (analyst projections)
- Each catalyst shows:
  - Date (or date range for readout windows)
  - Type (PDUFA, AdComm, Readout, CHMP, etc.)
  - Drug and company names
  - Source (FDA AdComm calendar, Drugs@FDA, CT.gov, 8-K)
- Click opens detailed dossier with trials, endpoints, precedents
- "Promote to Watchlist" button to track catalysts

**Catalyst Impact Score**:
```
Impact = Readout credibility × Market relevance × Competitive density
```

**Credibility Keys**:
- Pre-specified endpoints (vs post-hoc)
- Multiplicity control in trial design
- Adequate statistical powering
- Historical effect size in indication

#### MoA Explorer (`/science/evidence-journal` → MoA Explorer tab)

**Purpose**: Mechanism-centric differentiation analysis

**Features**:
- Search targets: IL-23, TL1A, Factor XI, Lp(a), etc.
- For each target, display:
  - **Genetic Evidence**: Open Targets association score (0-1)
  - **Bench Potency**: ChEMBL IC50/Ki data
  - **Biomarker Linkage**: Translational markers
  - **Competitor Heatmap**: All drugs targeting same mechanism
  - **Differentiation Score** (0-100): Calculated from genetic prior, selectivity, PoC markers, class precedents

**Differentiation Score Formula**:
```
Score = f(genetic_prior, selectivity, PoC_markers, class_precedents)
```

**Data Sources** (API-ready):
- Open Targets GraphQL API
- ChEMBL for target/assay potency
- PubMed for biomarker validation

**Domain Focus Areas** (from problem statement):
- **Cardiology**: Lp(a), Factor XI, HFpEF mechanisms with FDA 2019 HF draft guidance context
- **IBD**: IL-23 class, TL1A/DR3, emerging orals with MMS/CDAI benchmarks
- **DMD**: Gene therapy comparison (Elevidys vs next-gen capsids/transgenes)
- **Retina**: NPDR/DME with long-acting anti-VEGF and DRSS shift endpoints

#### Company Scorecard (`/science/evidence-journal` → Company Scorecard tab)

**Purpose**: Evidence stack pyramid + cash runway + near catalysts

**Components**:

1. **Evidence Stack Pyramid** (hierarchical weighting):
   - **Genetic** (highest weight): Open Targets score, PubMed links
   - **Translational** (medium weight): Biomarker alignment
   - **Clinical** (endpoint-dependent): OS > PFS > ORR (disease-specific)
   
   Down-weight factors:
   - N < 50 (underpowered)
   - Post-hoc only analyses
   - Single-arm in non-rare settings

2. **Cash Runway**:
   - Months of cash estimated from latest 10-K/10-Q filings
   - Source: SEC EDGAR filings

3. **Near Catalysts**:
   - Next 90 days only
   - Pulled from Catalyst Board data

**Evidence Weighting Hierarchy**:
```
Genetic (OT score/PubMed) > Translational (biomarker) > Clinical (endpoint hierarchy)
```

**Replicability Guardrails**:
- Flag if no matching PubMed link to NCT ("linkage gap")
- Show caution banner for unverified evidence

#### Journal Notebook (`/science/evidence-journal` → Journal tab)

**Purpose**: The actual research notebook with pinned notes and evidence stream

**Layout**:
- **Left Panel**: Pinned notes with "So what?" one-liner thesis
- **Right Panel**: Evidence stream with source-linked snippets

**Features**:
- **Add Evidence to Journal**:
  1. Select snippet from any view
  2. Auto-attach citation + permalink
  3. User writes one-sentence "So what?" explanation
  4. Saved with refresh timestamp
  
- **Lock State**: When `refreshMode = "manual"`, journal is locked during refresh
- **Pending Updates Badge**: Show count of new evidence items (Scheduled/Live modes)
- **Source Provenance**: Every snippet shows source icon, timestamp, deep link

**Evidence Stream Items**:
- Evidence class badge (Genetic, Preclinical, Translational, Clinical, RWE)
- Source badge (Open Targets, PubMed, CT.gov, FDA, EMA, SEC)
- Date published
- Snippet text with summary
- "View source" link (click-through to original)
- "Add to Journal" button

### 3. Data Integration Points

**API-Ready Structure** (no live data yet, but schema defined):

```typescript
// Type definitions in src/types/biotech.ts
- RefreshMode: "manual" | "scheduled" | "live"
- EvidenceCompany: Company with cash_runway_est, disclosures[]
- EvidenceDrug: Drug with moa, targets[], differentiation_score
- EvidenceCatalyst: Enhanced catalyst with confidence, source_urls[], impact_score
- Evidence: Class, strength_score, citations[], linkage_verified
- EvidenceTrial: Full NCT data with endpoints[], multiplicity_controlled
- MoaData: Target with genetic_evidence, bench_potency, competitor_heatmap
- CompanyScorecard: Evidence stack pyramid structure
- JournalEntry: User notes with evidence_snippets[], refresh_timestamp
- TodaysEvidence: Daily updates structure for diff view
```

**Backend Endpoints** (to be implemented):
- `GET /api/v1/evidence/today` - Today's evidence updates
- `GET /api/v1/evidence/catalysts?days=90` - Catalyst timeline
- `GET /api/v1/evidence/moa/:target` - MoA differentiation data
- `GET /api/v1/evidence/scorecard/:company` - Company evidence stack
- `GET /api/v1/evidence/journal` - User's journal entries
- `POST /api/v1/evidence/journal` - Create journal entry
- `PUT /api/v1/evidence/journal/:id` - Update journal entry

**External Data Sources** (API endpoints documented):
1. **ClinicalTrials.gov API v2**: Trial status, enrollment, readout dates
2. **FDA**:
   - openFDA for labeling/FAERS
   - Drugs@FDA data files for approvals/metadata
   - AdComm calendar from Federal Register
3. **SEC/EDGAR**: 8-K filings with R&D updates, CRLs, guidance
4. **EMA**: CHMP meeting cadence, downloadable medicine tables
5. **Open Targets GraphQL**: Target-disease genetic plausibility
6. **ChEMBL**: Target/assay potency data
7. **AACT mirror** (optional): Bulk CT.gov analytics at scale

### 4. Evidence Scoring & Filters

#### Evidence Weighting Algorithm

```
Priority: Genetic > Translational > Clinical
```

**Genetic Evidence**:
- Open Targets association score (0-1)
- PubMed links validating target-disease connection
- Top decile genetics = highest weight

**Translational Evidence**:
- Biomarker alignment in early studies
- Mechanistic validation in relevant models

**Clinical Evidence**:
- Endpoint hierarchy (disease-specific):
  - Cardio: OS > Functional capacity (per FDA 2019 HF guidance) > Symptoms
  - IBD: Endoscopic/histologic remission > MMS/CDAI > ORR
  - DMD: Functional capacity > Expression levels > Safety
  - Retina: DRSS shift > BCVA > Durability metrics
- Trial quality factors:
  - Pre-specified endpoints (vs post-hoc)
  - Multiplicity control
  - Adequate powering (N ≥ 50 for most indications)
  - Blinded design (except rare disease exceptions)

#### Noise Filters

**Default Filters** (hide unless user opts in):
- Underpowered trials (N < 50 in non-rare)
- Post-hoc only analyses without pre-specified endpoints
- Non-blinded studies in competitive indications
- Single-arm trials in non-rare diseases

**Replicability Checks**:
- Flag "linkage gap" if no matching PubMed link to NCT
- Show caution banner for unverified evidence
- Require source URL for every data point

### 5. Compliance & Source Labeling

**Transparency Requirements**:
- Every tile shows source icon, timestamp, deep link
- No opaque AI summaries without click-through to raw data
- Label any AI-generated content as "assistant notes"
- Prefer primary sources (FDA, SEC, EMA) over third-party calendars

**Third-Party Calendar Labels**:
If using BioPharmCatalyst, BPIQ, RTTNews, etc., label as "secondary/estimates" and always cross-reference with primary sources.

**PRV (Rare Pediatric Disease Voucher) Context**:
- Status: RPD PRVs lapsed Dec 2024
- Approvals by Sept 30, 2026 still earn vouchers (unless Congress extends)
- Historical pricing: $21M–$350M (FY-25 user fee ≈ $2.5M)
- Track in Catalyst Board with "PRV eligible" badge

## Technical Implementation

### Component Architecture

```
Evidence Journal Page (terminal/src/pages/EvidenceJournalPage.tsx)
├── RefreshModeToggle (frontend-components/src/terminal/molecules/)
├── Tab Navigation (Today | Catalysts | MoA | Scorecard | Journal)
├── TodaysEvidenceView
│   └── EvidenceCard[] (Trial events, Label changes, AdComm, 8-K)
├── CatalystBoardView
│   └── CatalystCard[] (Timeline with confidence colors)
├── MoaExplorerView
│   └── MoaCard[] (Target differentiation scores)
├── CompanyScorecardView
│   ├── Evidence Pyramid (Genetic > Translational > Clinical)
│   ├── Cash Runway Widget
│   └── Near Catalysts Widget
└── JournalNotebookView
    ├── Pinned Notes Panel
    └── Evidence Stream Panel
```

### Styling

- **File**: `terminal/src/pages/EvidenceJournalPage.css`
- **Theme Support**: All 5 accent themes (amber, green, cyan, purple, blue)
- **Responsive**: Mobile-friendly grid layouts
- **Bloomberg Aesthetic**: Monospace fonts, sharp edges, high contrast

### Navigation

- **Route**: `/science/evidence-journal`
- **Menu**: SCIENCE → Evidence Journal
- **Description**: "Science-first biotech intelligence"

### State Management

```typescript
// Current implementation (local state)
const [refreshMode, setRefreshMode] = useState<RefreshMode>('manual');
const [lastRefreshed] = useState<string>(new Date().toISOString());
const [activeTab, setActiveTab] = useState<'today' | 'catalysts' | 'moa' | 'scorecard' | 'journal'>('today');

// Future: React Query for server data
const { data: todaysEvidence } = useQuery(['evidence', 'today'], fetchTodaysEvidence);
const { data: catalysts } = useQuery(['evidence', 'catalysts'], fetchCatalysts);
```

## User Workflows

### 1. Add Evidence to Journal

```
1. User navigates to Today's Evidence or Evidence Stream
2. Finds relevant evidence item (trial, label change, genetic association)
3. Clicks "Add to Journal" button
4. Modal opens: snippet pre-filled + citation + permalink auto-attached
5. User writes one-sentence "So what?" explanation
6. Saved with current refresh_timestamp
7. Evidence appears in Journal → Pinned Notes (if starred) or Evidence Stream
```

### 2. Promote to Watchlist

```
1. User views Catalyst Board
2. Finds important upcoming catalyst (e.g., Phase III readout)
3. Clicks "Promote to Watchlist"
4. Catalyst added to personal watchlist
5. Appears in Today's Evidence when updates occur
```

### 3. Mode Switch (Manual → Scheduled → Live)

```
1. User clicks refresh mode toggle
2. Selects new mode (e.g., Scheduled)
3. UI updates:
   - Shows countdown timer ("Next refresh in 8 minutes")
   - Pauses countdown when user is editing notes
   - Displays pending updates banner when new data arrives
4. User reviews changes via "Review & Apply Changes" button
5. Diff preview modal shows added/changed/removed items
6. User confirms → data updates → refresh timestamp updates
```

## Domain-Specific Examples

### Cardiology (Lp(a), Factor XI, HFpEF)

**MoA Explorer Search**: "Factor XI"
- Genetic evidence score: 0.91 (top genetic validation)
- Competitors: Drug F (Phase III), Drug G (Phase II)
- Differentiation: 88/100 (high selectivity, strong genetic prior)

**Evidence Weighting**:
- FDA 2019 HF draft guidance: Functional capacity now approvable alongside OS
- Symptom/functional gains elevated in scoring

### IBD (IL-23, TL1A/DR3, Orals)

**MoA Explorer Search**: "IL-23"
- Genetic evidence: 0.85 (strong Crohn's association)
- Benchmarks: MMS/CDAI for efficacy, endoscopic/histologic for remission
- Competitors: Multiple Phase III programs
- Differentiation: 78/100 (crowded space but strong science)

**Scoring Notes**:
- Track combo strategies (aim to crack 30-40% remission ceiling)
- Endoscopic remission weighted higher than symptomatic

### DMD (Gene Therapy Race)

**Company Scorecard**: Compare Elevidys vs next-gen
- Evidence stack: 
  - Genetic: Dystrophin gene validated (100%)
  - Translational: Expression levels, distribution
  - Clinical: Functional capacity (North Star Ambulatory Assessment)
- Differentiation: First-mover vs better expression/safety profile

**Catalyst Board**:
- Accelerated approval criteria: Expression + functional capacity
- Safety durability monitoring (2-year data expected Q3 2026)

### Retina (NPDR/DME)

**Market Opportunity**:
- Under-treated pool: NPDR prevention huge market
- Long-acting anti-VEGF: Once or twice-yearly dosing
- Gene therapy: Potential one-time treatment

**Evidence Scoring**:
- Primary: DRSS shift (disease progression)
- Secondary: BCVA (visual acuity)
- Durability: 6-month, 12-month follow-up data

## Future Enhancements

### Phase 1: Backend Integration
- [ ] Implement `/api/v1/evidence/*` endpoints
- [ ] Connect to ClinicalTrials.gov API v2
- [ ] Integrate FDA openFDA and Drugs@FDA
- [ ] Connect SEC EDGAR for 8-K filings
- [ ] Set up Open Targets GraphQL queries
- [ ] Add ChEMBL API for potency data

### Phase 2: Scheduled Mode
- [ ] Add polling mechanism (configurable interval)
- [ ] Implement pause-on-edit logic
- [ ] Add countdown timer UI
- [ ] Create diff detection algorithm
- [ ] Build diff preview modal

### Phase 3: Live Mode
- [ ] Set up WebSocket server for real-time updates
- [ ] Implement SSE fallback for older browsers
- [ ] Create change badge system
- [ ] Build "apply diff" workflow with rollback
- [ ] Add conflict resolution for concurrent edits

### Phase 4: Advanced Features
- [ ] User authentication and journal persistence
- [ ] Export journal entries to PDF/Markdown
- [ ] Share journal snippets with team
- [ ] Collaborative annotations
- [ ] Custom alert rules for specific catalysts
- [ ] Mobile-optimized journal interface

## Related Documentation

- [Manual Refresh Model](../IMPLEMENTATION_MANUAL_REFRESH_PWA.md) - Current PWA refresh philosophy
- [Refresh Model Details](../docs/REFRESH_MODEL.md) - Backend refresh patterns
- [iOS PWA Guide](../docs/IOS_PWA_GUIDE.md) - Mobile installation
- [Type Definitions](../src/types/biotech.ts) - All Evidence Journal types

## References

Problem statement quotes the following sources and guidance:
- FDA 2019 Heart Failure draft guidance (functional capacity endpoints)
- Open Targets for genetic validation
- ChEMBL for bench potency
- ClinicalTrials.gov API v2 for trial data
- FDA AdComm calendar and Drugs@FDA
- SEC EDGAR for 8-K filings
- EMA CHMP meeting cadence
- PRV program status (2026 deadline unless extended)

---

**Implementation Status**: ✅ Phase 1 UI Complete | 🔄 Backend Integration Pending | 📋 Scheduled/Live Modes Planned

**Last Updated**: October 10, 2025

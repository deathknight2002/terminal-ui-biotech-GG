# PM Mode - Visual Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PM MODE ARCHITECTURE                             │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  STICKY HEADER (PMStickyHeader.tsx)                    [Always Visible] │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┬──────────────────────────────────────────────────────┐ │
│  │ IONS        │ EV: $4.2B  │ Market Cap: $4.8B │ Cash: $850M      │ │
│  │ $42.50      │ Runway: 17mo │ Programs: 42 (85% owned)          │ │
│  │ +2.35%      │ 3M ADV: 1.25M │ Short: 8.5%                       │ │
│  └─────────────┴──────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ TOP 3 rNPV: Pelacarsen ($735M) • ION-859 ($510M) • ION-703 ($465M)│ │
│  │ CATALYSTS: Feb 15 Data • May 20 Filing • Aug 10 AdCom            │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  CONTROLS & ACTIONS                                                      │
├─────────────────────────────────────────────────────────────────────────┤
│  [← BACK]  IONS - PM MODE                [💾 SAVE] [📤 EXPORT] [🔗]   │
└─────────────────────────────────────────────────────────────────────────┘

┌───────────────────┬───────────────────┬─────────────────────────────────┐
│  rNPV LADDER      │  CATALYST         │  VALUATION & SCENARIOS          │
│  (RnpvLadder.tsx) │  TIMELINE         │  (DCF Calculator)               │
├───────────────────┤  (CatalystTime    ├─────────────────────────────────┤
│ 1. Pelacarsen     │   line.tsx)       │  ┌─────────────────────────┐   │
│ ████████ $735M    │ ┌───────────────┐ │  │ Revenue:        $800M   │   │
│                   │ │📊 Feb 15, 2025│ │  │ Growth:          18%    │   │
│ 2. ION-859        │ │ Pelacarsen    │ │  │ EBITDA Margin:   40%    │   │
│ ██████ $510M      │ │ Phase III     │ │  │ WACC:           9.5%    │   │
│                   │ │ HIGH urgency  │ │  │                         │   │
│ 3. ION-703        │ └───────────────┘ │  │ Fair Value: $52.30      │   │
│ █████ $465M       │ ┌───────────────┐ │  │                         │   │
│                   │ │📄 May 20, 2025│ │  │ [Bull] [Base] [Bear]    │   │
│ 4. Donidalorsen   │ │ ION-703       │ │  └─────────────────────────┘   │
│ ████ $294M        │ │ Phase I       │ │                                 │
│                   │ │ MEDIUM        │ │                                 │
│ 5. Olezarsen      │ └───────────────┘ │                                 │
│ ████ $273M        │                   │                                 │
│                   │ [Filters]         │                                 │
│ ... (10 total)    │ Type: All         │                                 │
│                   │ Phase: All        │                                 │
│ TOTAL: $5.2B      │                   │                                 │
└───────────────────┴───────────────────┴─────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  PIPELINE SWIMLANES (PipelineVisualization.tsx)                         │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ PRECLINICAL ──────────────────── [18 programs] ─────────────────→│  │
│  │ PHASE I     ───────────── [8 programs] ──────────────────────────→│  │
│  │ PHASE II    ────── [7 programs] ─────────────────────────────────→│  │
│  │ PHASE III   ─── [3 programs] ────────────────────────────────────→│  │
│  │ FILED       ─ [0 programs] ──────────────────────────────────────→│  │
│  │ APPROVED    ─ [1 program] ───────────────────────────────────────→│  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  [Zoom/Pan Controls] [Filter by TA] [Filter by Phase]                  │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  THERAPEUTIC AREA EXPOSURE                                               │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌────────────┬────────────┬────────────┬────────────┬────────────┐    │
│  │Cardiovasc. │ Neurology  │  Oncology  │ Metabolic  │   Renal    │    │
│  │  8 progs   │ 10 progs   │  6 progs   │  8 progs   │  5 progs   │    │
│  │  Avg: 41%  │  Avg: 20%  │  Avg: 13%  │  Avg: 21%  │  Avg: 35%  │    │
│  │  $2.1B     │  $3.8B     │  $1.9B     │  $2.2B     │  $1.2B     │    │
│  └────────────┴────────────┴────────────┴────────────┴────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  NOTES & PROVENANCE (Placeholder - Phase C)                             │
├─────────────────────────────────────────────────────────────────────────┤
│  📝 Analyst notes, tags, and source tracking coming soon                │
│  ✓ Pipeline data: Ionis Q4 2024 Pipeline Update                         │
│  ✓ Financials: Yahoo Finance, Dec 2024                                  │
│  ✓ Catalysts: Company presentations & SEC filings                       │
└─────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════
                            DATA FLOW DIAGRAM
═══════════════════════════════════════════════════════════════════════════

┌──────────────────┐
│ Ionis Data       │
│ ─────────────    │
│ • ionisData.ts   │    ┌─────────────────────────────────────────┐
│ • ionisPipeline  │───→│ pmModeHelpers.ts                        │
│   .ts (42 progs) │    │ ─────────────────                       │
└──────────────────┘    │ • convertToPMMetrics()                  │
                        │ • convertToRnpvLadder()                 │
                        │ • convertToCatalystTimeline()           │
                        │                                         │
                        │ Calculations:                           │
                        │ rNPV = PoS × PeakSales × 0.3           │
                        └──────────────┬──────────────────────────┘
                                       │
                                       ↓
                        ┌──────────────────────────────────────────┐
                        │ IonisPMModePage.tsx                      │
                        │ ────────────────────                     │
                        │ Main orchestrator component              │
                        │ • Loads data from helpers                │
                        │ • Manages view state                     │
                        │ • Renders all sub-components             │
                        └──────────────┬───────────────────────────┘
                                       │
                ┌──────────────────────┼──────────────────────┐
                ↓                      ↓                      ↓
    ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
    │ PMStickyHeader   │  │ RnpvLadder       │  │ CatalystTimeline │
    │ ──────────────   │  │ ──────────       │  │ ────────────     │
    │ PMHeaderMetrics  │  │ RnpvLadderItem[] │  │ CatalystEvent[]  │
    └──────────────────┘  └──────────────────┘  └──────────────────┘

                        ┌──────────────────────────────────────────┐
                        │ PMLayoutPersistence.ts                   │
                        │ ──────────────────────                   │
                        │ • saveView(SavedView)                    │
                        │ • loadCurrentView()                      │
                        │ • generateShareHash(view)                │
                        │ • parseShareHash(hash)                   │
                        └────────────────┬─────────────────────────┘
                                         │
                                         ↓
                        ┌──────────────────────────────────────────┐
                        │ LocalStorage                             │
                        │ ────────────                             │
                        │ • pm_mode_saved_views                    │
                        │ • pm_mode_current_view                   │
                        └──────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════
                          TYPE HIERARCHY
═══════════════════════════════════════════════════════════════════════════

biotech.ts (Types)
├── Phase = 'Preclinical' | 'Phase I' | ... | 'Approved'
│
├── Program {
│   ├── id: string
│   ├── assetName: string
│   ├── phase: Phase
│   ├── rnPV?: number
│   └── sources?: Citation[]
│   }
│
├── PMHeaderMetrics {
│   ├── ticker: string
│   ├── price: number
│   ├── enterpriseValue: number
│   ├── topRnpvDrivers: {name, value}[]
│   └── nextCatalysts: {date, event, program}[]
│   }
│
├── RnpvLadderItem {
│   ├── id: string
│   ├── name: string
│   ├── rnpv: number
│   ├── phase: Phase
│   └── isPartnered: boolean
│   }
│
├── CatalystTimelineEvent {
│   ├── id: string
│   ├── date: string
│   ├── eventType: 'Data' | 'Filing' | 'AdCom' | 'PDUFA'
│   ├── importance: number
│   └── evDelta?: number
│   }
│
└── SavedView {
    ├── id: string
    ├── name: string
    ├── filters: Record<string, string[]>
    ├── layout: 'pmMode' | 'dragGrid'
    └── hash?: string
    }


═══════════════════════════════════════════════════════════════════════════
                        COMPONENT HIERARCHY
═══════════════════════════════════════════════════════════════════════════

IonisPMModePage
├── PMStickyHeader (sticky position)
│   ├── Ticker Info
│   ├── Financial Metrics
│   ├── Top 3 rNPV Drivers
│   └── Next 3 Catalysts
│
├── Control Bar
│   ├── Back Button
│   ├── Title
│   └── Actions (Save, Export, Share)
│
├── Top Row (Grid 3 columns)
│   ├── RnpvLadder (Panel)
│   │   ├── Header (total, count)
│   │   ├── Chart (bars)
│   │   └── Footer (pagination)
│   │
│   ├── CatalystTimeline (Panel)
│   │   ├── Filters (type, phase)
│   │   ├── Event List
│   │   └── Event Cards
│   │
│   └── DCF Calculator (Panel)
│       └── Form + Results
│
├── Middle Row
│   └── PipelineVisualization (Panel)
│       └── Swimlanes + Controls
│
├── Bottom Row
│   └── TA Exposure (Panel)
│       └── Card Grid
│
└── Right Rail
    └── Notes & Provenance (Panel)
        └── Placeholder


═══════════════════════════════════════════════════════════════════════════
                         USER INTERACTION FLOWS
═══════════════════════════════════════════════════════════════════════════

SAVE VIEW:
User clicks "💾 SAVE VIEW"
    ↓
Dialog opens with name input
    ↓
User enters name "My Neuro View"
    ↓
Click SAVE
    ↓
PMLayoutPersistence.saveView(...)
    ↓
Saved to localStorage
    ↓
Dialog closes
    ↓
Confirmation (console log)


SHARE VIEW:
User clicks "🔗 SHARE LINK"
    ↓
Current state captured
    ↓
PMLayoutPersistence.generateShareHash(view)
    ↓
Hash generated (base64)
    ↓
URL constructed: /pm-mode?view={hash}
    ↓
Copy to clipboard
    ↓
Alert: "Link copied!"


LOAD SHARED VIEW:
User opens shared link: /pm-mode?view=abc123
    ↓
useEffect detects ?view param
    ↓
PMLayoutPersistence.parseShareHash("abc123")
    ↓
State extracted from hash
    ↓
Filters/layout applied
    ↓
View restored exactly


═══════════════════════════════════════════════════════════════════════════
```

# PM Mode Implementation - Phase A Complete

## Overview

This document describes the **PM Mode (Portfolio Manager Mode)** implementation for the biotech terminal, specifically designed to provide investor-ready company profile views with decision-focused layouts and key metrics at-a-glance.

## What is PM Mode?

PM Mode is an opinionated layout pattern that transforms individual widgets into a cohesive portfolio manager narrative. It answers the key question: **"What moves EV in the next 3-12 months?"**

### Design Philosophy

- **Decision units, not data units**: Every piece of information answers investment questions
- **Ownership of truth**: All data includes source and timestamp
- **Keyboard-first & fast**: Optimized for rapid decision-making
- **Saved views & sharing**: Preserve and share exact configurations via URL

## Phase A - Core Implementation ✅

### 1. PM Sticky Header

**Location**: `terminal/src/components/pm-mode/PMStickyHeader.tsx`

A sticky header that remains visible while scrolling, providing at-a-glance metrics:

**Metrics Displayed:**
- Ticker symbol with current price and % change
- Enterprise Value (EV)
- Market Cap
- Net Cash position
- Cash Runway (in months)
- 3-month Average Daily Volume (ADV)
- Total programs (with % owned)
- Short interest %
- Top 3 rNPV drivers
- Next 3 upcoming catalysts

**Features:**
- Sticky positioning (always visible)
- Color-coded price changes (green/red)
- Responsive design for mobile/tablet
- Terminal-style monospace fonts
- Bloomberg-inspired aesthetic

### 2. rNPV Ladder Component

**Location**: `terminal/src/components/pm-mode/RnpvLadder.tsx`

Visual representation of programs sorted by PoS-weighted peak sales contribution to enterprise value.

**Features:**
- Horizontal bar chart sorted by rNPV (descending by default)
- Color-coded by phase (Preclinical → Phase III → Approved)
- Striped pattern for partnered programs
- Shows rank, program name, therapeutic area, and value
- Displays total rNPV across all programs
- Configurable max items to show (default: top 10)

**Visual Design:**
- Phase colors match existing palette
- Hover effects highlight individual programs
- Corner brackets styling for terminal aesthetic

### 3. Catalyst Timeline Component

**Location**: `terminal/src/components/pm-mode/CatalystTimeline.tsx`

12-month forward-looking catalyst timeline with filtering and urgency indicators.

**Features:**
- Event type icons (📊 Data, 📄 Filing, 🏛️ AdCom, ✅ PDUFA)
- Filter by event type and phase
- Urgency color coding:
  - High (≤30 days): Red border
  - Medium (31-90 days): Orange border
  - Low (>90 days): Blue border
- Shows days until event
- Importance bar (0-100% based on PoS)
- EV impact estimates
- Therapeutic area context

**Data Structure:**
```typescript
interface CatalystTimelineEvent {
  id: string;
  date: string;
  program: string;
  eventType: 'Data' | 'Filing' | 'AdCom' | 'PDUFA' | 'Other';
  importance: number;
  description: string;
  phase: Phase;
  therapeuticArea: string;
  evDelta?: number;
}
```

### 4. PM Mode Page Layout

**Location**: `terminal/src/pages/IonisPMModePage.tsx`

Complete investor-ready page layout for Ionis Pharmaceuticals (42 programs).

**Layout Structure:**

```
┌─────────────────────────────────────────────────────────┐
│  PM STICKY HEADER (always visible)                      │
│  Ticker | Price | EV | Net Cash | Runway | Programs     │
│  Top 3 rNPV Drivers | Next 3 Catalysts                  │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│  CONTROL BAR                                             │
│  [← BACK] [IONS - PM MODE] [💾 SAVE] [📤 EXPORT] [🔗]  │
└─────────────────────────────────────────────────────────┘
┌──────────────┬──────────────┬──────────────────────────┐
│   rNPV       │   CATALYST   │   VALUATION &            │
│   LADDER     │   TIMELINE   │   SCENARIOS              │
│   (Top 10)   │   (12 mo)    │   (DCF Calculator)       │
└──────────────┴──────────────┴──────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│  PIPELINE SWIMLANES                                      │
│  (Full visualization with zoom/pan)                      │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│  THERAPEUTIC AREA EXPOSURE                               │
│  [Cards showing programs, avg PoS, total rNPV by TA]    │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│  NOTES & PROVENANCE                                      │
│  (Placeholder for analyst notes and source tracking)     │
└─────────────────────────────────────────────────────────┘
```

### 5. Layout Persistence

**Location**: `terminal/src/utils/pmLayoutPersistence.ts`

LocalStorage-based persistence for saved views and current state.

**Features:**
- Save named views with filters and layout
- Load/restore previous session
- Generate shareable URL hashes
- Parse shared links to restore exact state
- Delete saved views
- Clear all saved data

**API:**
```typescript
PMLayoutPersistence.saveView(view: SavedView)
PMLayoutPersistence.getAllViews(): SavedView[]
PMLayoutPersistence.getView(id: string): SavedView | null
PMLayoutPersistence.deleteView(id: string)
PMLayoutPersistence.saveCurrentView(filters, layout)
PMLayoutPersistence.loadCurrentView()
PMLayoutPersistence.generateShareHash(view): string
PMLayoutPersistence.parseShareHash(hash): Partial<SavedView>
```

### 6. Helper Utilities

**Location**: `terminal/src/utils/pmModeHelpers.ts`

Conversion functions to transform existing Ionis data into PM Mode format.

**Functions:**
- `convertToPMMetrics()`: Profile + pipeline → PMHeaderMetrics
- `convertToRnpvLadder()`: Pipeline → RnpvLadderItem[]
- `convertToCatalystTimeline()`: Pipeline → CatalystTimelineEvent[]

**rNPV Calculation:**
```typescript
rNPV = PoS × PeakSales × Margin (0.3)
```

### 7. Type System Extensions

**Location**: `src/types/biotech.ts`

New types added:
- `Phase`: Phase type enum
- `Program`: Full program data structure with partner info, milestones, sources
- `SavedView`: View configuration with filters, sort, layout
- `PMHeaderMetrics`: All header metrics in one interface
- `RnpvLadderItem`: Single ladder entry
- `CatalystTimelineEvent`: Timeline event with EV impact

## Navigation

### Routes Added:
- `/companies/ionis/pm-mode` - PM Mode page for Ionis

### Navigation Points:
- From `/companies/ionis` (regular profile) → "📊 PM MODE" button in header

## Usage

### Accessing PM Mode:

1. Navigate to regular Ionis profile: `/companies/ionis`
2. Click "📊 PM MODE" button in header
3. Or directly: `/companies/ionis/pm-mode`

### Saving a View:

1. Configure filters (future feature)
2. Click "💾 SAVE VIEW"
3. Enter view name
4. Click "SAVE"
5. View is saved to localStorage

### Sharing a View:

1. Configure your view
2. Click "🔗 SHARE LINK"
3. Link is copied to clipboard
4. Share URL with colleagues
5. Recipients see exact same view

### Exporting:

1. Click "📤 EXPORT DECK"
2. Coming soon: PowerPoint/PDF with key charts

## Performance

### Build Stats:
- Total bundle size: ~5.9 MB (gzipped: 1.78 MB)
- PM Mode adds: ~15 KB uncompressed
- CSS additions: ~10 KB

### Load Performance:
- No additional API calls (uses existing Ionis data)
- All calculations done client-side
- LocalStorage for persistence (minimal I/O)

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Responsive design

## Testing

### Manual Testing Checklist:

- [x] Header displays all metrics correctly
- [x] Header remains sticky on scroll
- [x] rNPV ladder sorts programs correctly
- [x] Phase colors display properly
- [x] Catalyst timeline shows events
- [x] Filters work (type and phase)
- [x] Urgency colors indicate proximity
- [x] DCF calculator integrates
- [x] Pipeline visualization renders
- [x] TA exposure cards calculate correctly
- [x] Save view dialog opens
- [x] Share link generates and copies
- [x] Responsive on mobile/tablet

### Future Testing:

- [ ] E2E tests for save/restore
- [ ] Screenshot tests for visual regression
- [ ] Performance tests with 200+ programs

## Accessibility

- ✅ Semantic HTML structure
- ✅ ARIA labels on interactive elements
- ✅ Keyboard navigation (buttons, inputs)
- ✅ Color contrast meets WCAG AA
- ✅ Focus indicators visible
- 🔄 Screen reader optimization (Phase B)

## Next Steps - Phase B

See the main implementation plan for Phase B tasks:

1. **Virtualized Pipeline Swimlanes**
   - Support 150+ programs at 60fps
   - Canvas/WebGL rendering for performance
   - React for controls only

2. **Foldable Hierarchy**
   - Therapeutic Area → Indication → Asset
   - Collapse/expand nodes
   - PoS-weighted summaries at each level

3. **Program Drawer**
   - Right-side drawer with full details
   - MoA, target, NCT links
   - Partner terms and milestones
   - Sources and PoS rationale

4. **Query Builder**
   - Filter chips for Phase, TA, Indication, etc.
   - Saved views with names
   - Quick filters (e.g., "Neuro mid-stage")

5. **Focus Mode**
   - Auto-surface top 10 EV drivers
   - Dim all other programs
   - One-click toggle

## Code Statistics

**Files Added:**
- `terminal/src/components/pm-mode/PMStickyHeader.tsx` (118 lines)
- `terminal/src/components/pm-mode/PMStickyHeader.css` (175 lines)
- `terminal/src/components/pm-mode/RnpvLadder.tsx` (113 lines)
- `terminal/src/components/pm-mode/RnpvLadder.css` (163 lines)
- `terminal/src/components/pm-mode/CatalystTimeline.tsx` (178 lines)
- `terminal/src/components/pm-mode/CatalystTimeline.css` (249 lines)
- `terminal/src/pages/IonisPMModePage.tsx` (190 lines)
- `terminal/src/pages/IonisPMModePage.css` (329 lines)
- `terminal/src/utils/pmModeHelpers.ts` (143 lines)
- `terminal/src/utils/pmLayoutPersistence.ts` (127 lines)

**Files Modified:**
- `src/types/biotech.ts` (+92 lines)
- `terminal/src/App.tsx` (+2 lines)
- `terminal/src/pages/IonisProfilePage.tsx` (+4 lines)

**Total Lines Added:** ~1,881 lines

## Known Limitations

1. **Data Conversion**: Currently uses simplified rNPV calculation. Real implementation needs proper DCF with discount rates, patent life, etc.

2. **Partner Data**: Partnered status not yet tracked in pipeline data. Striped bars will show once data available.

3. **Export**: Placeholder buttons for PowerPoint/PDF export. Needs dom-to-image or similar library.

4. **Peer Comparison**: Not yet implemented (Phase C).

5. **Virtualization**: Pipeline swimlanes not yet virtualized. Current implementation handles 42 programs fine, but 150+ will need Phase B work.

## References

- **Problem Statement**: Original PM Mode requirements document
- **Design Inspiration**: Bloomberg Terminal, Redmile investor workflows
- **Ionis Data**: `terminal/src/data/ionisPipeline.ts` (42 programs)
- **Existing Components**: DCF Calculator, Pipeline Visualization, Panel

## Support

For questions or issues with PM Mode:
1. Check this documentation
2. Review code comments in source files
3. Test with Ionis demo data first
4. Reference existing terminal patterns

---

**Status**: ✅ Phase A Complete (December 2024)
**Next**: Phase B - Virtualized Pipeline & Hierarchy

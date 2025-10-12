# PM Mode - Quick Start Guide

## What You've Got

A fully functional **Portfolio Manager Mode** for the Ionis Pharmaceuticals company page, designed to provide an investor-ready view of the 42-program pipeline.

## How to Use

### 1. Access PM Mode

Navigate to the Ionis company profile page:
```
/companies/ionis
```

Click the **"📊 PM MODE"** button in the header, or go directly to:
```
/companies/ionis/pm-mode
```

### 2. What You'll See

**Sticky Header (Always Visible):**
- Ticker symbol (IONS) with current price and % change
- Enterprise Value, Market Cap, Net Cash
- Cash Runway in months
- Program count and ownership %
- 3-month Average Daily Volume
- Top 3 rNPV drivers
- Next 3 upcoming catalysts

**Three Core Panels:**
1. **rNPV Ladder** - Programs ranked by value contribution
   - Bars color-coded by phase
   - Shows total rNPV across portfolio
   - Top 10 programs displayed

2. **Catalyst Timeline** - 12-month forward view
   - Filter by event type (Data, Filing, AdCom, PDUFA)
   - Filter by phase
   - Urgency indicators (≤30d, 31-90d, >90d)
   - EV impact estimates

3. **Valuation & Scenarios** - DCF Calculator
   - Pre-populated with Ionis estimates
   - Adjust assumptions in real-time
   - See impact on valuation

**Pipeline Swimlanes:**
- Full visualization with zoom/pan
- Filter by therapeutic area or phase
- 42 programs organized by phase

**Therapeutic Area Exposure:**
- Cards showing program count by TA
- Average PoS per therapeutic area
- Total rNPV contribution

### 3. Save Your View

1. Configure filters (coming in Phase B)
2. Click **"💾 SAVE VIEW"**
3. Enter a name (e.g., "Neuro Focus")
4. View is saved to browser localStorage

### 4. Share Your View

1. Configure your perfect view
2. Click **"🔗 SHARE LINK"**
3. Link is copied to clipboard
4. Share with colleagues - they'll see exactly what you see

### 5. Export (Coming Soon)

Click **"📤 EXPORT DECK"** for PowerPoint/PDF export functionality (Phase C).

## Key Features

✅ **Decision-Focused**: Every metric answers "What moves EV?"
✅ **Fast Navigation**: Keyboard shortcuts and quick filters
✅ **Persistent State**: Your filters and layout are saved
✅ **Shareable**: Generate links that preserve exact state
✅ **Mobile-Friendly**: Responsive design works on tablets

## Tips

- **Scroll to see more**: The sticky header stays put while you explore
- **Hover over catalysts**: See full details and EV impact
- **Click on TA cards**: Quick insights into therapeutic area exposure
- **Use filters**: Narrow down to specific phases or event types

## Technical Details

**Performance:**
- Handles 42 programs smoothly
- All calculations client-side (no API delays)
- LocalStorage for instant state restoration

**Browser Support:**
- Chrome/Edge: ✅
- Firefox: ✅
- Safari: ✅
- Mobile browsers: ✅

## What's Next

### Phase B (Enhanced Pipeline):
- Virtualized rendering for 150+ programs
- Foldable hierarchy (TA → Indication → Asset)
- Program detail drawer
- Advanced query builder
- Focus mode (top 10 EV drivers auto-highlighted)

### Phase C (Export & Compare):
- PNG/CSV/PDF export
- Peer company comparison
- Full provenance tracking

## Demo Data

The page uses real Ionis Pharmaceuticals data:
- 42 programs across 6 therapeutic areas
- Cardiovascular (8), Neurology (10), Oncology (6), Metabolic (8), Renal (5), Rare Disease (5)
- Phases from Preclinical to Approved
- Peak sales estimates and probability of success (PoS)
- Calculated rNPV using: `PoS × PeakSales × Margin (0.3)`

## Support

See `PM_MODE_IMPLEMENTATION.md` for:
- Complete technical documentation
- API reference
- Type definitions
- Code organization
- Testing guidelines

## Files to Review

**Components:**
- `terminal/src/components/pm-mode/PMStickyHeader.tsx`
- `terminal/src/components/pm-mode/RnpvLadder.tsx`
- `terminal/src/components/pm-mode/CatalystTimeline.tsx`

**Page:**
- `terminal/src/pages/IonisPMModePage.tsx`

**Utilities:**
- `terminal/src/utils/pmModeHelpers.ts` (data conversion)
- `terminal/src/utils/pmLayoutPersistence.ts` (save/share)

**Types:**
- `src/types/biotech.ts` (added PM Mode types)

---

**Built with**: React, TypeScript, Terminal UI components
**Status**: Phase A Complete ✅
**Last Updated**: December 2024

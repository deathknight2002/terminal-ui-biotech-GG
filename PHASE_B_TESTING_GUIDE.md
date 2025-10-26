# Phase B - Enhanced Pipeline Visualization Testing Guide

## Overview

This guide provides instructions for testing the Phase B enhanced pipeline visualization features.

## Test Scenarios

### 1. Virtualized Rendering (150+ Programs)

**Goal**: Verify smooth 60fps scrolling with large datasets

**Steps:**
1. Navigate to PM Mode: `/companies/ionis/pm-mode`
2. Click "VIRTUALIZED VIEW (150+ Programs)" button
3. Scroll rapidly through the list
4. Open Chrome DevTools > Rendering > Frame Rendering Stats
5. Verify: FPS should remain at or near 60fps

**Expected Result:**
- Smooth scrolling with no jank
- Only visible rows rendered in DOM (check Elements panel)
- Frame rate consistently at 60fps

### 2. Foldable Hierarchy

**Goal**: Verify expand/collapse functionality and aggregations

**Steps:**
1. In virtualized view, observe initial state (TAs collapsed by default)
2. Click on a Therapeutic Area node (e.g., "NEUROLOGY")
3. Verify it expands to show Indications
4. Click on an Indication node
5. Verify it expands to show Assets
6. Verify aggregated metrics update correctly:
   - Program count
   - Average PoS
   - Total rNPV
7. Click "EXPAND ALL" button
8. Verify all nodes expand
9. Click "COLLAPSE ALL" button
10. Verify all nodes collapse

**Expected Result:**
- Smooth expand/collapse animations
- Correct aggregated metrics at each level
- Proper indentation (24px per level)
- Node state preserved during operations

### 3. Program Detail Drawer

**Goal**: Verify comprehensive program information display

**Steps:**
1. In virtualized view, expand hierarchy to asset level
2. Click on an asset/program node
3. Verify drawer slides in from right
4. Scroll through all sections:
   - Basic Information
   - Financial Metrics
   - Partnership (if applicable)
   - Next Milestone (if applicable)
   - Sources & Provenance
   - PoS Rationale
   - External Links
5. Click on external links to verify they open correctly
6. Click X button or overlay to close drawer

**Expected Result:**
- Smooth slide-in animation
- All program details displayed correctly
- External links open in new tabs
- Close functionality works from both X and overlay

### 4. Advanced Query Builder

**Goal**: Verify filtering and saved views

**Steps:**
1. In query builder section, click on Phase filter chips
2. Verify programs filter in real-time
3. Add multiple filters (Phase + TA)
4. Verify active filter count updates
5. Click "SAVE VIEW" button
6. Enter name "Test View 1"
7. Click SAVE
8. Verify view appears in "SAVED VIEWS" section
9. Clear all filters
10. Click on saved view to reload
11. Verify filters restore correctly
12. Try quick filters:
    - "Neuro Mid-Stage"
    - "Late-Stage"
    - "Partnered Programs"
13. Delete saved view using X button

**Expected Result:**
- Real-time filtering with no lag
- Filter chips show active state
- Saved views persist across page reloads
- Quick filters apply correct combinations
- Delete removes saved view from list

### 5. Focus Mode

**Goal**: Verify top 10 EV drivers highlighting

**Steps:**
1. In virtualized view, expand hierarchy to see assets
2. Click "🎯 FOCUS MODE OFF" button
3. Verify:
   - Button changes to "🎯 FOCUS MODE ON"
   - Top 10 programs by rNPV are highlighted
   - Top 10 have "⭐ TOP 10" badge
   - Top 10 have left accent border
   - Other programs are dimmed (30% opacity, grayscale)
4. Toggle focus mode off
5. Verify all programs return to normal opacity

**Expected Result:**
- Clear visual distinction between top 10 and others
- Smooth transition when toggling
- Top 10 calculation is correct (sorted by rNPV)
- No performance impact

### 6. Responsive Design

**Goal**: Verify mobile/tablet compatibility

**Steps:**
1. Open Chrome DevTools > Device Toolbar
2. Test different viewports:
   - Mobile (375px width)
   - Tablet (768px width)
   - Desktop (1440px width)
3. Verify:
   - Query builder adapts to smaller screens
   - Filter chips wrap appropriately
   - Drawer takes full width on mobile
   - Toggle buttons stack on mobile
   - Hierarchy nodes remain readable

**Expected Result:**
- No horizontal scrolling
- Readable text at all sizes
- Touch-friendly targets on mobile
- Proper layout adaptation

## Performance Benchmarks

### Metrics to Monitor

**Initial Render:**
- Target: <100ms for 150 programs
- Measure: Chrome DevTools > Performance > Record page load

**Scroll Performance:**
- Target: 60fps sustained
- Measure: Chrome DevTools > Rendering > Frame Rendering Stats

**Filter Update:**
- Target: <50ms to apply filters
- Measure: Chrome DevTools > Performance > Record filter change

**Hierarchy Toggle:**
- Target: <20ms per node
- Measure: Chrome DevTools > Performance > Record expand/collapse

### Testing with Large Datasets

To test with 150+ programs, create a test dataset:

```typescript
// terminal/src/data/testLargePipeline.ts
import { IONIS_PIPELINE } from './ionisPipeline';
import type { Program } from '../../../src/types/biotech';

export const LARGE_PIPELINE: Program[] = [
  ...IONIS_PIPELINE,
  // Duplicate and modify
  ...IONIS_PIPELINE.map((p, idx) => ({
    ...p,
    id: `${p.id}-dup-${idx}`,
    assetName: `${p.assetName} (Test ${idx + 1})`,
  })),
  // Repeat as needed to reach 150+
];
```

Then update `IonisPMModePage.tsx`:
```typescript
import { LARGE_PIPELINE } from '../data/testLargePipeline';

// Use LARGE_PIPELINE instead of IONIS_PIPELINE for testing
```

## Known Issues & Limitations

### Current Limitations:
1. No persistence of expanded/collapsed state between page reloads
2. Saved filters stored in localStorage (not synced across devices)
3. Quick filters are hardcoded (not user-configurable)
4. Program drawer scroll position resets when closing

### Future Enhancements:
1. Add performance monitoring dashboard
2. Export filtered/focused view as CSV
3. Keyboard shortcuts for expand/collapse
4. Bulk operations on selected programs
5. Comparison mode for multiple programs

## Troubleshooting

### Issue: Slow scrolling performance
**Solution**:
- Check browser DevTools for console errors
- Verify @tanstack/react-virtual is installed
- Clear browser cache and reload

### Issue: Filters not applying
**Solution**:
- Check console for JavaScript errors
- Verify Program interface matches expected structure
- Clear localStorage: `localStorage.clear()`

### Issue: Drawer not opening
**Solution**:
- Check that program has required fields (id, assetName, etc.)
- Verify ProgramDrawer component is imported correctly
- Check z-index conflicts in CSS

### Issue: Hierarchy not expanding
**Solution**:
- Verify expandedNodes state is updating (add console.log)
- Check that node IDs are unique
- Verify onClick handlers are attached

## Reporting Issues

When reporting issues, please include:
1. Browser and version
2. Screen size/viewport dimensions
3. Steps to reproduce
4. Console errors (if any)
5. Expected vs actual behavior
6. Screenshots/recordings if possible

## Contact

For questions or issues:
- GitHub: [deathknight2002/terminal-ui-biotech-GG](https://github.com/deathknight2002/terminal-ui-biotech-GG)
- Branch: `copilot/enhanced-pipeline-visualization`

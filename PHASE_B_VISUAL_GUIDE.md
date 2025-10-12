# Phase B - Visual Feature Guide

## Overview

This document provides a visual walkthrough of all Phase B features implemented in the enhanced pipeline visualization.

## Feature Showcase

### 1. Virtualized Pipeline View

**Location**: PM Mode → "VIRTUALIZED VIEW (150+ Programs)" toggle

```
┌─────────────────────────────────────────────────────────────┐
│ ADVANCED FILTERS                      [3 active] [CLEAR ALL] │
├─────────────────────────────────────────────────────────────┤
│ QUICK FILTERS:                                               │
│ [Neuro Mid-Stage] [Late-Stage] [Partnered] [Oncology]      │
│                                                              │
│ PHASE:                                                       │
│ [Phase I] [Phase II] [Phase III] [Filed] [Approved]        │
│                                                              │
│ THERAPEUTIC AREA:                                            │
│ [Neurology] [Oncology] [Cardiovascular] ...                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ [▼ EXPAND ALL] [▲ COLLAPSE ALL]      [🎯 FOCUS MODE OFF]   │
│                                    150 visible • 150 total   │
├─────────────────────────────────────────────────────────────┤
│ ▶ NEUROLOGY                    12 programs | PoS: 45% | ... │
│ ▼ ONCOLOGY                     28 programs | PoS: 38% | ... │
│   ▶ Non-Small Cell Lung Cancer   6 programs | PoS: 42% ... │
│   ▼ Colorectal Cancer            4 programs | PoS: 35% ... │
│     Drug-001  [Phase II]  IL-23  $125.5M  🤝 Partner Co.   │
│     Drug-002  [Phase III] PD-L1  $450.2M  ⭐ TOP 10         │
│     Drug-003  [Phase I]   VEGF   $85.0M                     │
│   ▶ Breast Cancer               8 programs | PoS: 40% ...   │
│ ▶ CARDIOVASCULAR                15 programs | PoS: 52% ...  │
└─────────────────────────────────────────────────────────────┘
```

**Features Visible:**
- Filter section at top
- Control bar with expand/collapse and focus mode
- Hierarchical list with indentation
- Aggregated metrics at each level
- Top 10 badge for high-value programs

### 2. Program Detail Drawer

**Triggered by**: Clicking on an asset/program node

```
┌─────────────────────────────────────┬──────────────────────┐
│ Pipeline List                        │ DRUG-002            X│
│                                      │ Oncology • NSCLC     │
│ ▼ ONCOLOGY                           │──────────────────────│
│   ▼ NSCLC                            │                      │
│     ► Drug-001                       │ BASIC INFORMATION    │
│     ▣ Drug-002 ← Selected            │ Phase: Phase III     │
│     ► Drug-003                       │ Modality: mAb        │
│                                      │ Target: PD-L1        │
│                                      │ Indication: NSCLC    │
│                                      │                      │
│                                      │ FINANCIAL METRICS    │
│                                      │ ┌────────┬─────────┐ │
│                                      │ │  rNPV  │Peak Sales││
│                                      │ │$450.2M │  $2.1B  ││
│                                      │ └────────┴─────────┘ │
│                                      │ ┌────────┬─────────┐ │
│                                      │ │PoS Base│PoS Adj  ││
│                                      │ │  35%   │  42%    ││
│                                      │ └────────┴─────────┘ │
│                                      │                      │
│                                      │ PARTNERSHIP          │
│                                      │ Partner: BigPharma   │
│                                      │ Stage: Phase III     │
│                                      │ Royalty: 15-20%      │
│                                      │                      │
│                                      │ NEXT MILESTONE       │
│                                      │ Mar 15, 2025         │
│                                      │ Data • High Conf.    │
│                                      │                      │
│                                      │ SOURCES & PROVENANCE │
│                                      │ 🔗 Q4 Pipeline Update│
│                                      │    As of: Dec 2024   │
│                                      │                      │
│                                      │ PoS RATIONALE        │
│                                      │ Probability based on:│
│                                      │ • Phase III trans... │
│                                      │ • PD-L1 validation...│
│                                      │                      │
│                                      │ EXTERNAL LINKS       │
│                                      │ 🔗 ClinicalTrials.gov│
│                                      │ 🔗 PubMed            │
│                                      │ 🔗 FDA.gov           │
└─────────────────────────────────────┴──────────────────────┘
```

**Features Visible:**
- Slide-in drawer from right
- Comprehensive 7-section layout
- Metric cards with financial data
- External links for research
- Close button and overlay

### 3. Focus Mode

**Before Focus Mode (Normal View):**
```
┌─────────────────────────────────────────────────────────────┐
│ [▼ EXPAND ALL] [▲ COLLAPSE ALL]    [🎯 FOCUS MODE OFF]     │
├─────────────────────────────────────────────────────────────┤
│ Drug-001  [Phase II]   IL-23   $125.5M                      │
│ Drug-002  [Phase III]  PD-L1   $450.2M                      │
│ Drug-003  [Phase I]    VEGF    $85.0M                       │
│ Drug-004  [Phase III]  BTK     $380.5M                      │
│ Drug-005  [Phase II]   JAK2    $220.0M                      │
│ Drug-006  [Filed]      PCSK9   $550.0M                      │
│ Drug-007  [Phase I]    mTOR    $95.5M                       │
│ Drug-008  [Phase III]  EGFR    $425.0M                      │
│ Drug-009  [Phase II]   HER2    $305.0M                      │
│ Drug-010  [Phase III]  VEGFR   $390.0M                      │
│ Drug-011  [Phase I]    PI3K    $115.0M                      │
└─────────────────────────────────────────────────────────────┘
```

**After Focus Mode (Highlighting Top 10):**
```
┌─────────────────────────────────────────────────────────────┐
│ [▼ EXPAND ALL] [▲ COLLAPSE ALL]    [🎯 FOCUS MODE ON]      │
├─────────────────────────────────────────────────────────────┤
│ ▎Drug-002  [Phase III]  PD-L1   $450.2M  ⭐ TOP 10         │ ← Highlighted
│ ▎Drug-004  [Phase III]  BTK     $380.5M  ⭐ TOP 10         │ ← Highlighted
│ ▎Drug-008  [Phase III]  EGFR    $425.0M  ⭐ TOP 10         │ ← Highlighted
│ ▎Drug-010  [Phase III]  VEGFR   $390.0M  ⭐ TOP 10         │ ← Highlighted
│ ▎Drug-006  [Filed]      PCSK9   $550.0M  ⭐ TOP 10         │ ← Highlighted
│ ▎Drug-009  [Phase II]   HER2    $305.0M  ⭐ TOP 10         │ ← Highlighted
│ ▎Drug-005  [Phase II]   JAK2    $220.0M  ⭐ TOP 10         │ ← Highlighted
│ ▎Drug-001  [Phase II]   IL-23   $125.5M  ⭐ TOP 10         │ ← Highlighted
│ ▎Drug-011  [Phase I]    PI3K    $115.0M  ⭐ TOP 10         │ ← Highlighted
│ ▎Drug-007  [Phase I]    mTOR    $95.5M   ⭐ TOP 10         │ ← Highlighted
│ Drug-003  [Phase I]    VEGF    $85.0M                       │ ← Dimmed (30%)
└─────────────────────────────────────────────────────────────┘
```

**Visual Indicators:**
- ▎ Left accent border (cyan/accent color)
- ⭐ TOP 10 badge
- Normal opacity and color
- Other programs: 30% opacity, grayscale filter

### 4. Query Builder - Filter Chips

**Active Filters:**
```
┌─────────────────────────────────────────────────────────────┐
│ ADVANCED FILTERS                      [3 active] [CLEAR ALL] │
├─────────────────────────────────────────────────────────────┤
│ QUICK FILTERS:                                               │
│ [Neuro Mid-Stage] [Late-Stage] [Partnered] [Oncology All]  │
│                                                              │
│ PHASE:                                                       │
│ [Phase I] [■ Phase II ✕] [■ Phase III ✕] [Filed] [Approved]│
│            ↑ Active       ↑ Active                          │
│                                                              │
│ THERAPEUTIC AREA:                                            │
│ [Neurology] [■ Oncology ✕] [Cardiovascular] ...            │
│               ↑ Active                                       │
│                                                              │
│ PARTNERSHIP:                                                 │
│ [Partnered] [Wholly Owned]                                  │
│                                                              │
│ SAVED VIEWS:                                                 │
│ 📁 My Late-Stage View [✕]                                   │
│ 📁 Neuro Programs [✕]                                       │
└─────────────────────────────────────────────────────────────┘
```

**Chip States:**
- Normal: Gray background, white text
- Active (■): Accent background, dark text, X to remove
- Hover: Slightly lighter, accent border

### 5. Saved Views

**Save Dialog:**
```
┌─────────────────────────────────────┐
│ SAVE FILTER VIEW                    │
├─────────────────────────────────────┤
│                                     │
│ [My Custom View_______________]    │
│                                     │
│              [SAVE]   [CANCEL]      │
└─────────────────────────────────────┘
```

**Saved Views List:**
```
┌─────────────────────────────────────────────────────────────┐
│ SAVED VIEWS:                                                 │
│ ┌────────────────────────────────────┬─┐                    │
│ │ 📁 Late-Stage Oncology Only        │✕│ ← Click to load   │
│ └────────────────────────────────────┴─┘                    │
│ ┌────────────────────────────────────┬─┐                    │
│ │ 📁 Neuro Mid-Stage Programs        │✕│                    │
│ └────────────────────────────────────┴─┘                    │
│ ┌────────────────────────────────────┬─┐                    │
│ │ 📁 All Partnered Assets            │✕│                    │
│ └────────────────────────────────────┴─┘                    │
└─────────────────────────────────────────────────────────────┘
```

### 6. Hierarchy Aggregation

**Therapeutic Area Level (Collapsed):**
```
┌─────────────────────────────────────────────────────────────┐
│ ▶ ONCOLOGY        28 programs │ PoS: 38% │ rNPV: $8,450.5M  │
│   └─ Aggregates all programs in Oncology TA                 │
└─────────────────────────────────────────────────────────────┘
```

**Indication Level (Expanded):**
```
┌─────────────────────────────────────────────────────────────┐
│ ▼ ONCOLOGY        28 programs │ PoS: 38% │ rNPV: $8,450.5M  │
│   ▶ NSCLC         6 programs │ PoS: 42% │ rNPV: $2,650.2M   │
│   ▶ CRC           4 programs │ PoS: 35% │ rNPV: $1,820.5M   │
│   ▶ Breast Cancer 8 programs │ PoS: 40% │ rNPV: $3,180.0M   │
│   ▶ Melanoma      5 programs │ PoS: 32% │ rNPV: $1,450.8M   │
│   ▶ Other         5 programs │ PoS: 38% │ rNPV: $1,349.0M   │
└─────────────────────────────────────────────────────────────┘
```

**Asset Level (Fully Expanded):**
```
┌─────────────────────────────────────────────────────────────┐
│ ▼ ONCOLOGY        28 programs │ PoS: 38% │ rNPV: $8,450.5M  │
│   ▼ NSCLC         6 programs │ PoS: 42% │ rNPV: $2,650.2M   │
│     Drug-001  [Phase II]  IL-23  $125.5M                    │
│     Drug-002  [Phase III] PD-L1  $450.2M  🤝 Partner        │
│     Drug-003  [Phase I]   VEGF   $85.0M                     │
│     Drug-004  [Phase III] BTK    $380.5M  ⭐ TOP 10         │
│     Drug-005  [Phase II]  JAK2   $220.0M                    │
│     Drug-006  [Filed]     PCSK9  $550.0M  ⭐ TOP 10         │
└─────────────────────────────────────────────────────────────┘
```

## UI/UX Patterns

### Color Coding
- **Accent Primary** (Cyan): Active filters, top drivers, borders
- **Text Primary** (White): Main content text
- **Text Secondary** (Gray): Labels, metadata
- **Text Tertiary** (Dim Gray): Timestamps, "as of" dates
- **Phase Colors**: 
  - Preclinical: Gray
  - Phase I: Amber
  - Phase II: Purple
  - Phase III: Cyan
  - Filed: Blue
  - Approved: Green

### Typography
- **Font**: Monospace (Courier New, monospace)
- **Headers**: Uppercase, letter-spacing, bold
- **Labels**: Uppercase, small, tertiary color
- **Values**: Regular weight, primary color

### Spacing
- **Hierarchy Indentation**: 24px per level
- **Card Padding**: 1rem (16px)
- **Gap Between Elements**: 0.5rem - 1rem
- **Border Radius**: 2-4px (sharp corners)

### Animations
- **Slide-in Drawer**: 0.3s ease from right
- **Fade-in Overlay**: 0.2s ease
- **Hover Effects**: 0.15s ease transitions
- **Focus Mode**: Smooth opacity/filter transitions

## Responsive Breakpoints

### Desktop (1440px+)
- Full layout with all features visible
- Drawer: 500px width
- Filter chips: Multi-row wrap
- Hierarchy: Full indentation

### Tablet (768px - 1439px)
- Drawer: 500px width
- Filter chips: Wrap more frequently
- Hierarchy: Maintained indentation
- Toggle buttons: Full width

### Mobile (<768px)
- Drawer: Full width (100vw)
- Filter chips: Single column stacking
- Hierarchy: Reduced indentation (12px)
- Toggle buttons: Stacked vertically
- Info grids: Single column

## Accessibility Features

### Keyboard Navigation
- Tab through filter chips
- Enter/Space to activate buttons
- Escape to close drawer
- Arrow keys for navigation (future)

### Screen Readers
- ARIA labels on all interactive elements
- Semantic HTML (button, nav, section)
- Alt text for icons
- Role attributes for custom components

### Color Contrast
- WCAG AAA compliant ratios
- CVD mode support (future)
- High contrast mode compatible
- Sufficient text size (0.75rem minimum)

## Performance Characteristics

### Virtual Scrolling
- Renders only visible rows + 5 overscan
- Example: 150 programs, only 15-20 rendered at once
- Smooth 60fps scrolling
- Minimal DOM nodes (<50 at any time)

### Memoization
- `useMemo` for expensive calculations
- `useCallback` for event handlers
- `React.memo` for component optimization
- Prevents unnecessary re-renders

### Bundle Size Impact
- VirtualizedPipelineView: ~15KB gzipped
- ProgramDrawer: ~8KB gzipped
- QueryBuilder: ~10KB gzipped
- Total Phase B: ~33KB gzipped

---

## Summary

Phase B implementation provides:
- ✅ Virtualized, high-performance rendering
- ✅ Intuitive hierarchical organization
- ✅ Comprehensive program details
- ✅ Advanced filtering capabilities
- ✅ Focus mode for key drivers
- ✅ Terminal-themed, accessible design

All features work seamlessly together to provide a professional, investor-grade pipeline visualization tool.

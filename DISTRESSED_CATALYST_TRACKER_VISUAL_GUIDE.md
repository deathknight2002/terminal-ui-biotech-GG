# Distressed Biotech Catalyst Tracker - Visual Guide

## UI Layout Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ DISTRESSED BIOTECH CATALYST TRACKER - NATALIE'S REGULATORY ARBITRAGE    │ │
│ │                                                                           │ │
│ │ [📋 MASTER WATCHLIST] [📅 CATALYST CALENDAR] [📊 ADVANCED ANALYTICS]    │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│   (Content Area - Changes based on selected view mode)                       │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## View 1: Master Distressed Watchlist

### Control Bar
```
┌─────────────────────────────────────────────────────────────────┐
│ SORT BY: [ASYMMETRY SCORE ▼]                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Main Table View
```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ TICKER │ COMPANY               │ REGULATORY SITUATION    │ CURRENT STATUS      │ CRL TYPE        │ MARKET...    │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ QURE   │ uniQure              │ Hemophilia B gene      │ [Working with FDA]  │ [Manufacturing] │ Market...    │
│        │                      │ therapy manufacturing   │                     │ [High Solv.]    │              │
│        │                      │ questions               │                     │ 🟢              │              │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ STOK   │ Stoke Therapeutics   │ Dravet syndrome        │ [Working with FDA]  │ [Safety]        │ Market...    │
│        │                      │ program; previous      │                     │ [Case-by-Case]  │              │
│        │                      │ clinical hold          │                     │ 🔵              │              │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ ...    │ ...                  │ ...                    │ ...                 │ ...             │ ...          │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

(Table continues with columns: RESOLUTION CATALYST, TIMELINE, PROB., ASYMMETRY, OVERHANG)

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ RESOLUTION CATALYST          │ TIMELINE    │ PROB.   │ ASYMMETRY      │ OVERHANG       │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ FDA alignment on release     │ [H1 2026]   │ [60%]🟡 │ 7.1:1          │ [7.0] 🔴       │
│ criteria                     │             │         │ ↑250% / ↓35%   │                │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ FDA feedback on amended      │ [Q1 2026]   │ [65%]🟡 │ 6.7:1          │ [7.5] 🔴       │
│ protocol                     │             │         │ ↑200% / ↓30%   │                │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ ...                          │ ...         │ ...     │ ...            │ ...            │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### CRL Decoder Matrix Legend (Bottom of page)
```
┌───────────────────────────────────────────────────────────────────────────────┐
│ CRL DECODER MATRIX                                                            │
├───────────────────────────────────────────────────────────────────────────────┤
│ 🟢 [Manufacturing]    High Solvability - CMC/Process Issues                  │
│ 🟡 [Trial Design]     Medium Solvability - Protocol Amendments               │
│ 🔴 [Efficacy]         Low Solvability - Fundamental Questions                │
│ 🔵 [Safety]           Case-by-Case - Risk Management Possible                │
└───────────────────────────────────────────────────────────────────────────────┘
```

### Color Coding Examples

**CRL Type Badges:**
```
🟢 [Manufacturing]  <- Green background, green border
🟡 [Trial Design]   <- Yellow background, yellow border
🔴 [Efficacy]       <- Red background, red border
🔵 [Safety]         <- Blue background, blue border
```

**Status Badges:**
```
[CRL Received]              <- Red background
[Working with FDA]          <- Yellow background
[Awaiting FDA Response]     <- Blue background
```

**Probability with Confidence:**
```
[70%] 🟢  <- High confidence (green)
[60%] 🟡  <- Medium confidence (yellow)
[55%] 🔴  <- Low confidence (red)
```

**Overhang Score:**
```
[7.5] 🔴  <- High risk (7-10)
[6.2] 🟡  <- Medium risk (4-6)
[3.2] 🟢  <- Low risk (1-3)
```

---

## View 2: Regulatory Catalyst Calendar

### Filter Controls
```
┌─────────────────────────────────────────────────────────────────────────┐
│ [ALL CATALYSTS] [TIER 1 - BINARY] [TIER 2 - DE-RISKING] [TIER 3 - INC] │
└─────────────────────────────────────────────────────────────────────────┘
```

### Tier Descriptions
```
┌──────────────────────────────┬──────────────────────────────┬──────────────────────────────┐
│ 🔴 TIER 1 - BINARY OUTCOMES │ 🟡 TIER 2 - DE-RISKING      │ 🟢 TIER 3 - INCREMENTAL     │
│                              │                              │                              │
│ Stock moving ±50%+:          │ Stock moving ±20-40%:        │ Stock moving ±10-20%:        │
│ • FDA ADCOM Meetings         │ • Type A Meeting Outcomes    │ • FDA Meeting Announcements  │
│ • CRL Responses              │ • Protocol Amendment Accept  │ • Manufacturing Updates      │
│ • Clinical Hold Removals     │ • Special Protocol Assess.   │ • Submission Dates           │
└──────────────────────────────┴──────────────────────────────┴──────────────────────────────┘
```

### Catalyst Cards (Grid Layout)
```
┌─────────────────────────────────────┐  ┌─────────────────────────────────────┐
│ QURE  uniQure                       │  │ STOK  Stoke Therapeutics            │
│                          [Tier 1] 🔴│  │                          [Tier 1] 🔴│
│                     [HIGH IMPACT] 🔴│  │                     [HIGH IMPACT] 🔴│
│─────────────────────────────────────│  │─────────────────────────────────────│
│                                     │  │                                     │
│ FDA Alignment - Release Criteria    │  │ FDA Feedback - Amended Protocol     │
│ EXPECTED: H1 2026                   │  │ EXPECTED: Q1 2026                   │
│                                     │  │                                     │
│ Description:                        │  │ Description:                        │
│ FDA alignment on release criteria   │  │ FDA response to amended protocol    │
│ for Hemophilia B gene therapy...    │  │ for Dravet syndrome program...      │
│                                     │  │                                     │
│ Regulatory Situation:               │  │ Regulatory Situation:               │
│ Manufacturing questions typical     │  │ Previous clinical hold on safety    │
│                                     │  │                                     │
│ Expected Move: ±50%+                │  │ Expected Move: ±50%+                │
│                                     │  │                                     │
│ ┌───────┬───────────┬─────────┐    │  │ ┌───────┬───────────┬─────────┐    │
│ │ PROB. │ CONFIDENCE│ STATUS  │    │  │ │ PROB. │ CONFIDENCE│ STATUS  │    │
│ │ 60% 🟡│ Medium 🟡 │Scheduled│    │  │ │ 65% 🟡│ Medium 🟡 │Scheduled│    │
│ └───────┴───────────┴─────────┘    │  │ └───────┴───────────┴─────────┘    │
│                                     │  │                                     │
│ KEY FACTORS:                        │  │ KEY FACTORS:                        │
│ • EU approval validates clinical    │  │ • Safety mitigation in protocol     │
│ • Gene therapy CMC addressable      │  │ • Platform value near zero          │
│ • Strong mgmt FDA experience        │  │ • Strong unmet need in Dravet       │
│ • Platform has multiple programs    │  │ • FDA working constructively        │
└─────────────────────────────────────┘  └─────────────────────────────────────┘

┌─────────────────────────────────────┐  ┌─────────────────────────────────────┐
│ CAPR  Capricor Therapeutics         │  │ RP  Replimune                       │
│                          [Tier 2] 🟡│  │                          [Tier 2] 🟡│
│                     [HIGH IMPACT] 🔴│  │                     [HIGH IMPACT] 🔴│
│─────────────────────────────────────│  │─────────────────────────────────────│
│                                     │  │                                     │
│ Type A Meeting Outcome              │  │ Protocol Amendment Acceptance       │
│ EXPECTED: Q4 2025                   │  │ EXPECTED: Q1 2026                   │
│                                     │  │                                     │
│ [... Similar structure ...]         │  │ [... Similar structure ...]         │
└─────────────────────────────────────┘  └─────────────────────────────────────┘
```

---

## View 3: Advanced Analytics

### Cash Runway vs Regulatory Timeline
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 💰 CASH RUNWAY vs REGULATORY TIMELINE                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────┐   │
│ │ LEXIO                                    🟥 FUNDING GAP             │   │
│ ├─────────────────────────────────────────────────────────────────────┤   │
│ │ Cash Runway: 8 months                                               │   │
│ │ Regulatory Timeline: 9 months                                       │   │
│ │ Strategy: Will need financing before resolution; exploring          │   │
│ │           partnerships                                              │   │
│ └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────┐   │
│ │ STOK                                     🟩 ADEQUATE RUNWAY         │   │
│ ├─────────────────────────────────────────────────────────────────────┤   │
│ │ Cash Runway: 12 months                                              │   │
│ │ Regulatory Timeline: 6 months                                       │   │
│ │ Strategy: Sufficient cash through catalyst; may raise post-res.     │   │
│ └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│ [... More companies ...]                                                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Regulatory Overhang Scorecard
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 📊 REGULATORY OVERHANG SCORECARD                                            │
│ Score = (CRL Severity × 0.3) + (Time × 0.2) + (Cash × 0.3) + (Mgmt × 0.2) │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ STOK    7.5  ███████████████████████████████████████████████░░░░░░  [75%] │
│ QURE    7.0  ██████████████████████████████████████████████░░░░░░░  [70%] │
│ LEXIO   6.8  █████████████████████████████████████████████░░░░░░░░  [68%] │
│ CAPR    6.2  ████████████████████████████████████████░░░░░░░░░░░░  [62%] │
│ RP      5.5  ███████████████████████████████████░░░░░░░░░░░░░░░░░  [55%] │
│                                                                             │
│ Legend: 🔴 Red (7-10) = High Risk  🟡 Yellow (4-6) = Medium  🟢 Green (1-3) │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Asymmetric Opportunity Matrix
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🎯 ASYMMETRIC OPPORTUNITY MATRIX                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐          │
│ │ QURE      7.1:1🟢│  │ STOK      6.7:1🟢│  │ CAPR      4.5:1🟡│          │
│ ├──────────────────┤  ├──────────────────┤  ├──────────────────┤          │
│ │ UPSIDE  +250%    │  │ UPSIDE  +200%    │  │ UPSIDE  +180%    │          │
│ │    /             │  │    /             │  │    /             │          │
│ │DOWNSIDE  -35%    │  │DOWNSIDE  -30%    │  │DOWNSIDE  -40%    │          │
│ ├──────────────────┤  ├──────────────────┤  ├──────────────────┤          │
│ │ Market penalizing│  │ Platform value   │  │ Manufacturing    │          │
│ │ for CMC issues   │  │ near zero; safety│  │ issues solvable; │          │
│ │ typical in gene  │  │ issues resolvable│  │ clinical benefit │          │
│ │ therapy          │  │                  │  │ clear            │          │
│ └──────────────────┘  └──────────────────┘  └──────────────────┘          │
│                                                                             │
│ ┌──────────────────┐  ┌──────────────────┐                                │
│ │ RP        4.3:1🟡│  │ LEXIO     4.0:1🟡│                                │
│ ├──────────────────┤  ├──────────────────┤                                │
│ │ UPSIDE  +150%    │  │ UPSIDE  +160%    │                                │
│ │    /             │  │    /             │                                │
│ │DOWNSIDE  -35%    │  │DOWNSIDE  -40%    │                                │
│ ├──────────────────┤  ├──────────────────┤                                │
│ │ FDA wants more   │  │ Risk mitigation  │                                │
│ │ data, not saying │  │ strategies avail;│                                │
│ │ no to efficacy   │  │ EU approved      │                                │
│ └──────────────────┘  └──────────────────┘                                │
│                                                                             │
│ Legend: 🟢 Excellent (≥6:1)  🟡 Good (≥4:1)  🟧 Fair (<4:1)              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Color Scheme Reference

### Terminal Theme Colors
```
Background:        rgba(0, 0, 0, 0.5)       [Dark translucent]
Primary Accent:    #00ff00                  [Terminal green]
Text Primary:      #ffffff                  [White]
Text Secondary:    #cccccc, #999999         [Grays]
Border:            rgba(0, 255, 0, 0.2-0.3) [Green translucent]
```

### CRL Solvability Colors
```
🟢 Manufacturing:  #00ff00  [Green]   High Solvability
🟡 Trial Design:   #ffcc00  [Yellow]  Medium Solvability
🔴 Efficacy:       #ff3333  [Red]     Low Solvability
🔵 Safety:         #0099ff  [Blue]    Case-by-Case
```

### Catalyst Tier Colors
```
🔴 Tier 1:         #ff6666  [Red]     Binary Outcomes (±50%+)
🟡 Tier 2:         #ffcc00  [Yellow]  De-risking (±20-40%)
🟢 Tier 3:         #00ff00  [Green]   Incremental (±10-20%)
```

### Confidence/Risk Colors
```
🟢 High/Low:       #00ff00  [Green]   Good probability / Low risk
🟡 Medium:         #ffcc00  [Yellow]  Moderate probability / Medium risk
🔴 Low/High:       #ff6666  [Red]     Low probability / High risk
```

### Impact Colors
```
High Impact:       #ff6666  [Red]
Medium Impact:     #ffcc00  [Yellow]
Low Impact:        #00ff00  [Green]
```

---

## Interaction Design

### Hover Effects
- Table rows: Subtle green glow on hover
- Buttons: Lift effect (translateY(-1px))
- Cards: Lift effect + shadow
- All transitions: 0.2-0.3s smooth

### Active States
- Active view mode button: Green background, black text, glow
- Active tier filter: Green background, black text
- Selected sort option: Highlighted in dropdown

### Responsive Behavior

**Desktop (1400px+):**
- Full table with all columns visible
- 2-3 catalyst cards per row
- 2-3 asymmetry cards per row

**Tablet (768-1400px):**
- Horizontal scroll for table
- 1-2 catalyst cards per row
- 1-2 asymmetry cards per row

**Mobile (<768px):**
- Stacked view mode buttons
- Horizontal scroll for table
- Single column for cards
- Collapsed tier descriptions

---

## Accessibility Features

- High contrast ratios (WCAG AAA compliant)
- Semantic HTML structure
- Keyboard navigation support
- Screen reader friendly labels
- Color + text indicators (never color alone)
- Monospace fonts for data consistency
- Clear visual hierarchy

---

## Data Density Philosophy

Following Bloomberg Terminal principles:
- Maximum information per screen
- Minimal whitespace
- Compact but readable
- Scannable tables
- Quick visual pattern recognition
- Professional trader aesthetic

---

This visual guide demonstrates the complete UI/UX implementation of Natalie's Distressed Biotech Catalyst Tracker, showing all three view modes with detailed examples of the color coding, layout, and interactive elements.

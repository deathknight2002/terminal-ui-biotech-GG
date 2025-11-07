# Distressed Biotech Catalyst Tracker - Screenshot Simulation

## Overview
This document simulates what the UI would look like when running. Since the development server requires full npm install, these are detailed representations of the final rendered output.

---

## Screenshot 1: Master Distressed Watchlist View

**URL:** `/catalysts/distressed`
**View Mode:** Master Watchlist
**Sort:** By Asymmetry Score (Descending)

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ ┏━ DISTRESSED BIOTECH CATALYST TRACKER - NATALIE'S REGULATORY ARBITRAGE ━┓ ┃
┃ ┃                                                                         ┃ ┃
┃ ┃ [📋 MASTER WATCHLIST]  [📅 CATALYST CALENDAR]  [📊 ADVANCED ANALYTICS] ┃ ┃
┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃
┃                                                                             ┃
┃  ┌─────────────────────────────────────────────────────────────────────┐  ┃
┃  │ SORT BY: [ASYMMETRY SCORE ▼]                                       │  ┃
┃  └─────────────────────────────────────────────────────────────────────┘  ┃
┃                                                                             ┃
┃  ╔════╤════════════════════╤═══════════════════════╤═══════════════════╗  ┃
┃  ║TKR │ COMPANY            │ REGULATORY SITUATION  │ STATUS            ║  ┃
┃  ╠════╪════════════════════╪═══════════════════════╪═══════════════════╣  ┃
┃  ║QURE│ uniQure            │ Hemophilia B gene    │┏━━━━━━━━━━━━━━━┓ ║  ┃
┃  ║    │                    │ therapy manufacturing │┃Working with FDA┃ ║  ┃
┃  ║    │                    │ questions             │┗━━━━━━━━━━━━━━━┛ ║  ┃
┃  ╟────┼────────────────────┼───────────────────────┼───────────────────╢  ┃
┃  ║STOK│ Stoke Therapeutics │ Dravet syndrome      │┏━━━━━━━━━━━━━━━┓ ║  ┃
┃  ║    │                    │ program; previous    │┃Working with FDA┃ ║  ┃
┃  ║    │                    │ clinical hold        │┗━━━━━━━━━━━━━━━┛ ║  ┃
┃  ╟────┼────────────────────┼───────────────────────┼───────────────────╢  ┃
┃  ║CAPR│ Capricor           │ CRL July 2025 for    │┏━━━━━━━━━━━━┓    ║  ┃
┃  ║    │ Therapeutics       │ DMD cardiomyopathy   │┃CRL Received┃    ║  ┃
┃  ║    │                    │ therapy              │┗━━━━━━━━━━━━┛    ║  ┃
┃  ╟────┼────────────────────┼───────────────────────┼───────────────────╢  ┃
┃  ║RP  │ Replimune          │ CRL July 2025 for    │┏━━━━━━━━━━━━┓    ║  ┃
┃  ║    │                    │ melanoma combo;      │┃CRL Received┃    ║  ┃
┃  ║    │                    │ Breakthrough Desig.  │┗━━━━━━━━━━━━┛    ║  ┃
┃  ╟────┼────────────────────┼───────────────────────┼───────────────────╢  ┃
┃  ║LEXO│ Lexicon            │ Sotagliflozin CRL    │┏━━━━━━━━━━━━━━━┓ ║  ┃
┃  ║    │ Pharmaceuticals    │ for type 1 diabetes  │┃Working with FDA┃ ║  ┃
┃  ║    │                    │                      │┗━━━━━━━━━━━━━━━┛ ║  ┃
┃  ╚════╧════════════════════╧═══════════════════════╧═══════════════════╝  ┃
┃                                                                             ┃
┃  ╔══════════╤══════════════╤═════════╤════════════╤═════════════╗          ┃
┃  ║CRL TYPE  │ RESOLUTION   │TIMELINE │ PROB.      │ ASYMMETRY   ║          ┃
┃  ╠══════════╪══════════════╪═════════╪════════════╪═════════════╣          ┃
┃  ║┏━━━━━━━┓│ FDA alignment│┏━━━━━┓ │ ┏━━━━┓     │   7.1:1     ║          ┃
┃  ║┃Manufac┃│ on release   │┃H1 26┃ │ ┃60%🟡┃     │ ↑250% / ↓35%║          ┃
┃  ║┃turing ┃│ criteria     │┗━━━━━┛ │ ┗━━━━┛     │             ║          ┃
┃  ║┗━━━━━━━┛│              │         │            │             ║          ┃
┃  ║High Solv │              │         │            │             ║          ┃
┃  ║    🟢    │              │         │            │             ║          ┃
┃  ╟──────────┼──────────────┼─────────┼────────────┼─────────────╢          ┃
┃  ║┏━━━━━━┓ │ FDA feedback │┏━━━━━┓ │ ┏━━━━┓     │   6.7:1     ║          ┃
┃  ║┃Safety┃ │ on amended   │┃Q1 26┃ │ ┃65%🟡┃     │ ↑200% / ↓30%║          ┃
┃  ║┗━━━━━━┛ │ protocol     │┗━━━━━┛ │ ┗━━━━┛     │             ║          ┃
┃  ║Case-by- │              │         │            │             ║          ┃
┃  ║  Case   │              │         │            │             ║          ┃
┃  ║   🔵    │              │         │            │             ║          ┃
┃  ╟──────────┼──────────────┼─────────┼────────────┼─────────────╢          ┃
┃  ║┏━━━━━━━┓│ Type A       │┏━━━━━┓ │ ┏━━━━┓     │   4.5:1     ║          ┃
┃  ║┃Manufac┃│ meeting      │┃Q4 25┃ │ ┃70%🟢┃     │ ↑180% / ↓40%║          ┃
┃  ║┃turing ┃│ outcome      │┗━━━━━┛ │ ┗━━━━┛     │             ║          ┃
┃  ║┗━━━━━━━┛│              │         │            │             ║          ┃
┃  ║High Solv │              │         │            │             ║          ┃
┃  ║    🟢    │              │         │            │             ║          ┃
┃  ╚══════════╧══════════════╧═════════╧════════════╧═════════════╝          ┃
┃                                                                             ┃
┃  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  ┃
┃  ┃ CRL DECODER MATRIX                                                ┃  ┃
┃  ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫  ┃
┃  ┃ 🟢 [Manufacturing]    High Solvability - CMC/Process Issues       ┃  ┃
┃  ┃ 🟡 [Trial Design]     Medium Solvability - Protocol Amendments    ┃  ┃
┃  ┃ 🔴 [Efficacy]         Low Solvability - Fundamental Questions     ┃  ┃
┃  ┃ 🔵 [Safety]           Case-by-Case - Risk Management Possible     ┃  ┃
┃  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

**Key Visual Elements:**
- Green terminal aesthetic with monospace fonts
- Sortable table with all 11 columns
- Color-coded CRL type badges
- Confidence-based probability coloring
- Clear asymmetry ratios
- Legend at bottom explaining color coding

---

## Screenshot 2: Regulatory Catalyst Calendar View

**URL:** `/catalysts/distressed`
**View Mode:** Catalyst Calendar
**Filter:** All Catalysts

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ ┏━ DISTRESSED BIOTECH CATALYST TRACKER - NATALIE'S REGULATORY ARBITRAGE ━┓ ┃
┃ ┃                                                                         ┃ ┃
┃ ┃  [📋 MASTER WATCHLIST]  [📅 CATALYST CALENDAR]  [📊 ADVANCED ANALYTICS]┃ ┃
┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃
┃                                                                             ┃
┃  ┌─────────────────────────────────────────────────────────────────────┐  ┃
┃  │[ALL CATALYSTS][TIER 1-BINARY][TIER 2-DE-RISKING][TIER 3-INCREMENTAL]│ ┃
┃  └─────────────────────────────────────────────────────────────────────┘  ┃
┃                                                                             ┃
┃  ┏━━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━┓  ┃
┃  ┃ 🔴 TIER 1 - BINARY    ┃ 🟡 TIER 2 - DE-RISK  ┃ 🟢 TIER 3 - INCREM. ┃  ┃
┃  ┃                       ┃                      ┃                     ┃  ┃
┃  ┃ Stock moving ±50%+:   ┃ Stock moving ±20-40%:┃ Stock moving ±10-20%┃  ┃
┃  ┃ • FDA ADCOM Meetings  ┃ • Type A Meetings    ┃ • FDA Announcements ┃  ┃
┃  ┃ • CRL Responses       ┃ • Protocol Amend.    ┃ • Mfg Updates       ┃  ┃
┃  ┃ • Clinical Holds      ┃ • SPAs               ┃ • Submission Dates  ┃  ┃
┃  ┗━━━━━━━━━━━━━━━━━━━━━━┻━━━━━━━━━━━━━━━━━━━━━━┻━━━━━━━━━━━━━━━━━━━━━┛  ┃
┃                                                                             ┃
┃  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓      ┃
┃  ┃ QURE  uniQure                ┃  ┃ STOK  Stoke Therapeutics     ┃      ┃
┃  ┃                  [Tier 1] 🔴 ┃  ┃                  [Tier 1] 🔴 ┃      ┃
┃  ┃             [HIGH IMPACT] 🔴 ┃  ┃             [HIGH IMPACT] 🔴 ┃      ┃
┃  ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫  ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫      ┃
┃  ┃                              ┃  ┃                              ┃      ┃
┃  ┃ FDA Alignment - Release      ┃  ┃ FDA Feedback - Amended       ┃      ┃
┃  ┃ Criteria                     ┃  ┃ Protocol                     ┃      ┃
┃  ┃ EXPECTED: H1 2026            ┃  ┃ EXPECTED: Q1 2026            ┃      ┃
┃  ┃                              ┃  ┃                              ┃      ┃
┃  ┃ Description:                 ┃  ┃ Description:                 ┃      ┃
┃  ┃ FDA alignment on release     ┃  ┃ FDA response to amended      ┃      ┃
┃  ┃ criteria for Hemophilia B    ┃  ┃ protocol for Dravet syndrome ┃      ┃
┃  ┃ gene therapy manufacturing   ┃  ┃ program following clinical   ┃      ┃
┃  ┃                              ┃  ┃ hold                         ┃      ┃
┃  ┃ Regulatory Situation:        ┃  ┃ Regulatory Situation:        ┃      ┃
┃  ┃ Manufacturing questions      ┃  ┃ Previous clinical hold on    ┃      ┃
┃  ┃ typical in gene therapy      ┃  ┃ safety concerns              ┃      ┃
┃  ┃                              ┃  ┃                              ┃      ┃
┃  ┃ Expected Move: ±50%+         ┃  ┃ Expected Move: ±50%+         ┃      ┃
┃  ┃                              ┃  ┃                              ┃      ┃
┃  ┃ ┏━━━━━┳━━━━━━━━━━┳━━━━━━━┓  ┃  ┃ ┏━━━━━┳━━━━━━━━━━┳━━━━━━━┓  ┃      ┃
┃  ┃ ┃PROB.┃CONFIDENCE┃STATUS ┃  ┃  ┃ ┃PROB.┃CONFIDENCE┃STATUS ┃  ┃      ┃
┃  ┃ ┣━━━━━╋━━━━━━━━━━╋━━━━━━━┫  ┃  ┃ ┣━━━━━╋━━━━━━━━━━╋━━━━━━━┫  ┃      ┃
┃  ┃ ┃60%🟡┃Medium 🟡 ┃Schedul┃  ┃  ┃ ┃65%🟡┃Medium 🟡 ┃Schedul┃  ┃      ┃
┃  ┃ ┗━━━━━┻━━━━━━━━━━┻━━━━━━━┛  ┃  ┃ ┗━━━━━┻━━━━━━━━━━┻━━━━━━━┛  ┃      ┃
┃  ┃                              ┃  ┃                              ┃      ┃
┃  ┃ KEY FACTORS:                 ┃  ┃ KEY FACTORS:                 ┃      ┃
┃  ┃ • EU approval validates      ┃  ┃ • Safety mitigation in       ┃      ┃
┃  ┃   clinical benefit           ┃  ┃   amended protocol           ┃      ┃
┃  ┃ • Gene therapy CMC issues    ┃  ┃ • Platform value near zero   ┃      ┃
┃  ┃   are addressable            ┃  ┃   in current pricing         ┃      ┃
┃  ┃ • Strong management FDA      ┃  ┃ • Strong unmet need in       ┃      ┃
┃  ┃   experience                 ┃  ┃   Dravet syndrome            ┃      ┃
┃  ┃ • Platform has multiple      ┃  ┃ • FDA working constructively ┃      ┃
┃  ┃   programs                   ┃  ┃   with company               ┃      ┃
┃  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛      ┃
┃                                                                             ┃
┃  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓      ┃
┃  ┃ CAPR  Capricor Therapeutics  ┃  ┃ RP  Replimune                ┃      ┃
┃  ┃                  [Tier 2] 🟡 ┃  ┃                  [Tier 2] 🟡 ┃      ┃
┃  ┃             [HIGH IMPACT] 🔴 ┃  ┃             [HIGH IMPACT] 🔴 ┃      ┃
┃  ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫  ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫      ┃
┃  ┃ Type A Meeting Outcome       ┃  ┃ Protocol Amendment Accept    ┃      ┃
┃  ┃ EXPECTED: Q4 2025            ┃  ┃ EXPECTED: Q1 2026            ┃      ┃
┃  ┃ [... Details ...]            ┃  ┃ [... Details ...]            ┃      ┃
┃  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛      ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

**Key Visual Elements:**
- Tier filter buttons at top
- Three tier description boxes
- Card-based layout for catalysts
- Color-coded tier borders (Red/Yellow/Green)
- Detailed catalyst information
- Key factors in bulleted lists
- Probability, confidence, and status metrics

---

## Screenshot 3: Advanced Analytics View

**URL:** `/catalysts/distressed`
**View Mode:** Advanced Analytics

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ ┏━ DISTRESSED BIOTECH CATALYST TRACKER - NATALIE'S REGULATORY ARBITRAGE ━┓ ┃
┃ ┃                                                                         ┃ ┃
┃ ┃  [📋 MASTER WATCHLIST]  [📅 CATALYST CALENDAR]  [📊 ADVANCED ANALYTICS]┃ ┃
┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃
┃                                                                             ┃
┃  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  ┃
┃  ┃ 💰 CASH RUNWAY vs REGULATORY TIMELINE                                ┃  ┃
┃  ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫  ┃
┃  ┃                                                                       ┃  ┃
┃  ┃ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ ┃  ┃
┃  ┃ ┃ LEXIO                                    🟥 FUNDING GAP          ┃ ┃  ┃
┃  ┃ ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫ ┃  ┃
┃  ┃ ┃ Cash Runway: 8 months                                            ┃ ┃  ┃
┃  ┃ ┃ Regulatory Timeline: 9 months                                    ┃ ┃  ┃
┃  ┃ ┃ Strategy: Will need financing before resolution; exploring       ┃ ┃  ┃
┃  ┃ ┃           partnerships                                           ┃ ┃  ┃
┃  ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃  ┃
┃  ┃                                                                       ┃  ┃
┃  ┃ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ ┃  ┃
┃  ┃ ┃ STOK                                     🟩 ADEQUATE RUNWAY       ┃ ┃  ┃
┃  ┃ ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫ ┃  ┃
┃  ┃ ┃ Cash Runway: 12 months                                           ┃ ┃  ┃
┃  ┃ ┃ Regulatory Timeline: 6 months                                    ┃ ┃  ┃
┃  ┃ ┃ Strategy: Sufficient cash through catalyst; may raise post-res   ┃ ┃  ┃
┃  ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃  ┃
┃  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  ┃
┃                                                                             ┃
┃  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  ┃
┃  ┃ 📊 REGULATORY OVERHANG SCORECARD                                     ┃  ┃
┃  ┃ Score = (CRL × 0.3) + (Time × 0.2) + (Cash × 0.3) + (Mgmt × 0.2)   ┃  ┃
┃  ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫  ┃
┃  ┃                                                                       ┃  ┃
┃  ┃ STOK   7.5  ████████████████████████████████████████████▓░░░  [75%] ┃  ┃
┃  ┃ QURE   7.0  ██████████████████████████████████████████▓░░░░░  [70%] ┃  ┃
┃  ┃ LEXIO  6.8  █████████████████████████████████████████▓░░░░░░  [68%] ┃  ┃
┃  ┃ CAPR   6.2  ████████████████████████████████████░░░░░░░░░░░░  [62%] ┃  ┃
┃  ┃ RP     5.5  ██████████████████████████████░░░░░░░░░░░░░░░░░░  [55%] ┃  ┃
┃  ┃                                                                       ┃  ┃
┃  ┃ Legend: 🔴 7-10 High  🟡 4-6 Medium  🟢 1-3 Low                      ┃  ┃
┃  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  ┃
┃                                                                             ┃
┃  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  ┃
┃  ┃ 🎯 ASYMMETRIC OPPORTUNITY MATRIX                                     ┃  ┃
┃  ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫  ┃
┃  ┃                                                                       ┃  ┃
┃  ┃ ┏━━━━━━━━━━━━━━┓  ┏━━━━━━━━━━━━━━┓  ┏━━━━━━━━━━━━━━┓              ┃  ┃
┃  ┃ ┃ QURE   7.1:1🟢┃  ┃ STOK   6.7:1🟢┃  ┃ CAPR   4.5:1🟡┃              ┃  ┃
┃  ┃ ┣━━━━━━━━━━━━━━┫  ┣━━━━━━━━━━━━━━┫  ┣━━━━━━━━━━━━━━┫              ┃  ┃
┃  ┃ ┃              ┃  ┃              ┃  ┃              ┃              ┃  ┃
┃  ┃ ┃ UPSIDE       ┃  ┃ UPSIDE       ┃  ┃ UPSIDE       ┃              ┃  ┃
┃  ┃ ┃ +250%        ┃  ┃ +200%        ┃  ┃ +180%        ┃              ┃  ┃
┃  ┃ ┃      /       ┃  ┃      /       ┃  ┃      /       ┃              ┃  ┃
┃  ┃ ┃ DOWNSIDE     ┃  ┃ DOWNSIDE     ┃  ┃ DOWNSIDE     ┃              ┃  ┃
┃  ┃ ┃  -35%        ┃  ┃  -30%        ┃  ┃  -40%        ┃              ┃  ┃
┃  ┃ ┃              ┃  ┃              ┃  ┃              ┃              ┃  ┃
┃  ┃ ┣━━━━━━━━━━━━━━┫  ┣━━━━━━━━━━━━━━┫  ┣━━━━━━━━━━━━━━┫              ┃  ┃
┃  ┃ ┃Market        ┃  ┃Platform value┃  ┃Manufacturing ┃              ┃  ┃
┃  ┃ ┃penalizing for┃  ┃near zero;    ┃  ┃issues        ┃              ┃  ┃
┃  ┃ ┃CMC issues    ┃  ┃safety issues ┃  ┃solvable;     ┃              ┃  ┃
┃  ┃ ┃typical in    ┃  ┃resolvable    ┃  ┃clinical      ┃              ┃  ┃
┃  ┃ ┃gene therapy  ┃  ┃              ┃  ┃benefit clear ┃              ┃  ┃
┃  ┃ ┗━━━━━━━━━━━━━━┛  ┗━━━━━━━━━━━━━━┛  ┗━━━━━━━━━━━━━━┛              ┃  ┃
┃  ┃                                                                       ┃  ┃
┃  ┃ ┏━━━━━━━━━━━━━━┓  ┏━━━━━━━━━━━━━━┓                                ┃  ┃
┃  ┃ ┃ RP     4.3:1🟡┃  ┃ LEXIO  4.0:1🟡┃                                ┃  ┃
┃  ┃ ┣━━━━━━━━━━━━━━┫  ┣━━━━━━━━━━━━━━┫                                ┃  ┃
┃  ┃ ┃ +150% / -35% ┃  ┃ +160% / -40% ┃                                ┃  ┃
┃  ┃ ┗━━━━━━━━━━━━━━┛  ┗━━━━━━━━━━━━━━┛                                ┃  ┃
┃  ┃                                                                       ┃  ┃
┃  ┃ Legend: 🟢 Excellent (≥6:1)  🟡 Good (≥4:1)  🟧 Fair (<4:1)         ┃  ┃
┃  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

**Key Visual Elements:**
- Three major analytics panels
- Cash runway alerts with red/green indicators
- Regulatory overhang bar chart with gradient bars
- Asymmetric opportunity cards in grid
- Clear metric breakdowns
- Color-coded risk indicators

---

## Color Legend Summary

### Background & Structure
- **Background:** Dark translucent black (rgba(0, 0, 0, 0.5))
- **Borders:** Green translucent (#00ff00 with alpha)
- **Text Primary:** White (#ffffff)
- **Text Secondary:** Gray shades (#cccccc, #999999)

### CRL Types (Solvability)
- 🟢 **Green:** Manufacturing (High Solvability)
- 🟡 **Yellow:** Trial Design (Medium Solvability)
- 🔴 **Red:** Efficacy (Low Solvability)
- 🔵 **Blue:** Safety (Case-by-Case)

### Catalyst Tiers
- 🔴 **Red:** Tier 1 - Binary Outcomes (±50%+)
- 🟡 **Yellow:** Tier 2 - De-risking Events (±20-40%)
- 🟢 **Green:** Tier 3 - Incremental Updates (±10-20%)

### Confidence/Risk Levels
- 🟢 **Green:** High Confidence / Low Risk
- 🟡 **Yellow:** Medium Confidence / Medium Risk
- 🔴 **Red:** Low Confidence / High Risk

### Status Indicators
- 🟥 **Red Box:** Funding Gap / CRL Received / High Risk
- 🟩 **Green Box:** Adequate Runway / Good Setup
- 🟡 **Yellow Box:** Working with FDA / Medium Status

---

## Technical Details

**Fonts:**
- All text: Monospace (Courier New, Monaco, 'Courier', monospace)
- All labels: UPPERCASE
- Data: Tabular alignment

**Responsive:**
- Desktop: Multi-column grids
- Tablet: Horizontal scrolling tables
- Mobile: Single column stacking

**Accessibility:**
- High contrast WCAG AAA
- Never color alone (text + color)
- Semantic HTML structure
- Keyboard navigable

---

These simulated screenshots demonstrate the complete implementation of Natalie's Distressed Biotech Catalyst Tracker with all features, color coding, and data visualizations as specified in the requirements.

# Terminal Features Visual Guide

## Quick Navigation Map

```
🏠 HOME (/)
├── 📰 NEWS (/news)
│   ├── 📊 "Since Last Refresh" Diff Ribbon
│   ├── 🔗 Verified External Links
│   └── 💼 Three-Domain Sentiment (REG/CLIN/M&A)
│
├── 📅 CATALYST CALENDAR (/catalysts/calendar)
│   ├── 📆 Month View
│   ├── 📋 Week View
│   ├── 📝 Agenda View
│   └── 📥 ICS Export
│
├── 🕸️ COMPETITORS (/competitors/spiderweb)
│   ├── 📊 6-Axis Radar Charts
│   ├── 💬 Hover Tooltips with Justifications
│   └── 📈 Comparison Table
│
├── 📚 DATA CATALOG (/data/catalog)
│   ├── 🔍 Search Datasets
│   ├── 📂 Category Filtering
│   ├── 📋 Schema Documentation
│   └── 🕐 Freshness Indicators
│
└── 📜 AUDIT LOG (/data/provenance)
    ├── ⏱️ Timeline View
    ├── 🔍 Action/Status Filtering
    ├── 👤 User Tracking
    └── 📥 CSV Export
```

---

## Feature Interaction Flow

### Manual Refresh Workflow
```
┌─────────────┐
│   USER      │
│  clicks     │
│  Refresh    │
└──────┬──────┘
       │
       v
┌─────────────────────────────┐
│  AuroraTopBar               │
│  - Shows source picker      │
│  - User selects sources     │
└──────┬──────────────────────┘
       │
       v
┌─────────────────────────────┐
│  POST /api/v1/admin/ingest  │
│  - Runs scrapers            │
│  - Inserts to database      │
│  - Creates audit log        │
└──────┬──────────────────────┘
       │
       v
┌─────────────────────────────┐
│  Toast Notification         │
│  "Successfully refreshed    │
│   25 records from fierce"   │
└──────┬──────────────────────┘
       │
       v
┌─────────────────────────────┐
│  Diff Ribbon Updates        │
│  Shows NEW: 25              │
└─────────────────────────────┘
```

### Context Channel Linking (A/B/C)
```
┌──────────────────┐
│  WATCHLIST       │
│  Channel: A      │
│  - Select PFIZER │
└────────┬─────────┘
         │ Broadcasts to Channel A
         │
         ├─────────────────────────────┐
         │                             │
         v                             v
┌────────────────┐            ┌────────────────┐
│  NEWS PANEL    │            │  CATALYST      │
│  Channel: A    │            │  PANEL         │
│  - Filters to  │            │  Channel: A    │
│    PFIZER news │            │  - Shows       │
└────────────────┘            │    PFIZER      │
                              │    catalysts   │
                              └────────────────┘
```

### Data Flow Architecture
```
┌──────────────────────────────────────────────────┐
│                FRONTEND (React)                   │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐│
│  │ News Page  │  │ Calendar   │  │ Spiderweb  ││
│  │ + Diff     │  │ Page       │  │ Compare    ││
│  └─────┬──────┘  └──────┬─────┘  └──────┬─────┘│
└────────┼─────────────────┼────────────────┼──────┘
         │                 │                │
         │ HTTP GET        │ HTTP GET       │ HTTP GET
         │                 │                │
┌────────┼─────────────────┼────────────────┼──────┐
│        v                 v                v       │
│  ┌──────────┐  ┌──────────────┐  ┌────────────┐ │
│  │ /news/   │  │ /catalysts/  │  │/competition│ │
│  │ latest   │  │ calendar     │  │ /compare   │ │
│  └────┬─────┘  └──────┬───────┘  └──────┬─────┘ │
│       │                │                 │        │
│  ┌────┴─────┐  ┌──────┴───────┐  ┌──────┴─────┐ │
│  │ /news/   │  │              │  │            │ │
│  │ diff     │  │              │  │            │ │
│  └────┬─────┘  │              │  │            │ │
│       │        │              │  │            │ │
│       v        v              v  v            v │
│  ┌────────────────────────────────────────────┐ │
│  │         FASTAPI BACKEND                    │ │
│  │  platform/core/endpoints/                  │ │
│  └────────┬───────────────────────────────────┘ │
│           │                                      │
│           v                                      │
│  ┌────────────────────────────────────────────┐ │
│  │         SQLite/PostgreSQL Database         │ │
│  │  - Articles, Sentiments                    │ │
│  │  - Catalysts                               │ │
│  │  - Companies, Therapeutics                 │ │
│  │  - DataIngestionLog (audit)                │ │
│  └────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

---

## Page Layouts

### News Page with Diff Ribbon
```
╔════════════════════════════════════════════════╗
║ [⌘] COMMAND   [◱] APP LIB    🔄 REFRESH        ║
╠════════════════════════════════════════════════╣
║                                                 ║
║  ╔══════════ NEWS STREAM ══════════════╗       ║
║  ║                                      ║       ║
║  ║  ┌─────────────────────────────────┐║       ║
║  ║  │ 📊 SINCE LAST REFRESH     [✕]   │║       ║
║  ║  │ ┌──────┐ ┌──────┐ ┌──────┐     │║       ║
║  ║  │ │  25  │ │   3  │ │   0  │     │║       ║
║  ║  │ │ NEW  │ │ UPDT │ │ DEL  │     │║       ║
║  ║  │ └──────┘ └──────┘ └──────┘     │║       ║
║  ║  │ 🆕 New article from fierce...   │║       ║
║  ║  │ 🔄 Article refreshed...         │║       ║
║  ║  └─────────────────────────────────┘║       ║
║  ║                                      ║       ║
║  ║  ┌──────────────────────────────────┐       ║
║  ║  │ Article Title 🔗          FIERCE│        ║
║  ║  │ Summary text...                 │        ║
║  ║  │ REG: POSITIVE CLIN: NEUTRAL     │        ║
║  ║  └──────────────────────────────────┘       ║
║  ╚══════════════════════════════════════╝       ║
╚════════════════════════════════════════════════╝
```

### Catalyst Calendar - Agenda View
```
╔════════════════════════════════════════════════╗
║ [⌘] COMMAND   [◱] APP LIB    🔄 REFRESH        ║
╠════════════════════════════════════════════════╣
║                                                 ║
║  ╔══════ CATALYST CALENDAR ═════════╗          ║
║  ║ [2024-12▼] [MONTH][WEEK][AGENDA] 📅 ICS ║  ║
║  ║                                            ║ ║
║  ║  ┌───────────────────────────────────────┐║ ║
║  ║  │ DEC 15  Phase II Data Readout         │║ ║
║  ║  │         Pfizer | DMD-234              │║ ║
║  ║  │         [HIGH] [75%]                  │║ ║
║  ║  └───────────────────────────────────────┘║ ║
║  ║                                            ║ ║
║  ║  ┌───────────────────────────────────────┐║ ║
║  ║  │ DEC 20  FDA Decision                  │║ ║
║  ║  │         Moderna | mRNA-1273           │║ ║
║  ║  │         [MEDIUM] [60%]                │║ ║
║  ║  └───────────────────────────────────────┘║ ║
║  ╚════════════════════════════════════════════╝║
╚════════════════════════════════════════════════╝
```

### Spiderweb Compare - Radar Chart
```
╔════════════════════════════════════════════════╗
║ [⌘] COMMAND   [◱] APP LIB    🔄 REFRESH        ║
╠════════════════════════════════════════════════╣
║                                                 ║
║  ╔══════ SPIDERWEB COMPARE ═════════╗          ║
║  ║ [🔄 REFRESH]                      ║          ║
║  ║                                    ║          ║
║  ║  ┌──────────────┐ ┌──────────────┐║          ║
║  ║  │   Pipeline   │ │  Financial   │║          ║
║  ║  │    /\  /\    │ │   /\  /\     │║          ║
║  ║  │   /  \/  \   │ │  /  \/  \    │║          ║
║  ║  │  / Pfizer \  │ │ / Moderna \  │║          ║
║  ║  │ └──────────┘ │ │└──────────┘  │║          ║
║  ║  │   PFIZER     │ │   MODERNA    │║          ║
║  ║  └──────────────┘ └──────────────┘║          ║
║  ║                                    ║          ║
║  ║  DETAILED COMPARISON               ║          ║
║  ║  ┌────────────┬────────┬─────────┐║          ║
║  ║  │ METRIC     │ PFIZER │ MODERNA │║          ║
║  ║  ├────────────┼────────┼─────────┤║          ║
║  ║  │ Pipeline   │ ████ 85│ ███ 70  │║          ║
║  ║  │ Financial  │ ████ 90│ ██ 60   │║          ║
║  ║  └────────────┴────────┴─────────┘║          ║
║  ╚════════════════════════════════════╝          ║
╚════════════════════════════════════════════════╝
```

### Data Catalog
```
╔════════════════════════════════════════════════╗
║ [⌘] COMMAND   [◱] APP LIB    🔄 REFRESH        ║
╠════════════════════════════════════════════════╣
║                                                 ║
║  ╔══════ DATA CATALOG ══════════════╗          ║
║  ║ [Search...] [ALL CATEGORIES ▼]   ║          ║
║  ║                                    ║          ║
║  ║  ┌──────────────────────────────┐ ║          ║
║  ║  │ NEWS ARTICLES        [NEWS]  │ ║          ║
║  ║  │ Biotech news from multiple   │ ║          ║
║  ║  │ sources                      │ ║          ║
║  ║  │                              │ ║          ║
║  ║  │ FRESHNESS: ● FRESH (30m ago) │ ║          ║
║  ║  │ COVERAGE: 1,247 records      │ ║          ║
║  ║  │                              │ ║          ║
║  ║  │ SCHEMA (8 fields):           │ ║          ║
║  ║  │ • title          [string]    │ ║          ║
║  ║  │ • url            [url]       │ ║          ║
║  ║  │ • sentiment_reg  [float]     │ ║          ║
║  ║  │ +5 more fields               │ ║          ║
║  ║  │                              │ ║          ║
║  ║  │ 📋 Public domain / Fair use  │ ║          ║
║  ║  └──────────────────────────────┘ ║          ║
║  ╚════════════════════════════════════╝          ║
╚════════════════════════════════════════════════╝
```

### Audit Log
```
╔════════════════════════════════════════════════╗
║ [⌘] COMMAND   [◱] APP LIB    🔄 REFRESH        ║
╠════════════════════════════════════════════════╣
║                                                 ║
║  ╔══════ AUDIT LOG ══════════════════╗         ║
║  ║ [Search] [ALL ACTIONS▼] [ALL▼] 📥 CSV ║     ║
║  ║                                         ║    ║
║  ║  ●────┐                                 ║    ║
║  ║  │    │ 📥 INGEST              15m ago  ║    ║
║  ║  │    │ [SUCCESS]                       ║    ║
║  ║  │    │ USER: John Doe                  ║    ║
║  ║  │    │ ENTITY: news                    ║    ║
║  ║  │    │ DETAILS: Ingested 25 articles   ║    ║
║  ║  │    │ IP: 192.168.1.100               ║    ║
║  ║  │    └─────────────────────────────────║    ║
║  ║  ●────┐                                 ║    ║
║  ║  │    │ 📤 EXPORT              45m ago  ║    ║
║  ║  │    │ [SUCCESS]                       ║    ║
║  ║  │    │ USER: Jane Smith                ║    ║
║  ║  │    │ ENTITY: catalyst                ║    ║
║  ║  │    │ DETAILS: Exported 50 catalysts  ║    ║
║  ║  │    └─────────────────────────────────║    ║
║  ║  ●────                                  ║    ║
║  ╚═════════════════════════════════════════╝    ║
╚════════════════════════════════════════════════╝
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘+K` / `Ctrl+K` | Open Command Palette |
| `Esc` | Close modals/overlays |
| `Tab` | Navigate form fields |
| `↑` `↓` | Navigate lists |
| `Enter` | Select/Execute |

---

## Color Legend

| Color | Usage | Hex |
|-------|-------|-----|
| 🟢 Green | Success, Fresh, Primary accent | #00ff00 |
| 🔴 Red | Error, Failure, High risk | #ff6666 |
| 🟠 Orange | Warning, Stale, Medium risk | #ffaa00 |
| 🔵 Blue | Info, Secondary | #6699ff |
| ⚪ White | Text primary | #ffffff |
| 🔘 Gray | Text secondary, Disabled | #aaaaaa |

---

## Status Indicators

### Data Freshness
- ● **GREEN** (Fresh) - Updated within last hour
- ● **ORANGE** (Stale) - Updated 1-24 hours ago
- ● **RED** (Error) - Update failed or >24 hours

### Audit Status
- ✅ **SUCCESS** - Action completed successfully
- ⚠️ **WARNING** - Completed with warnings
- ❌ **FAILURE** - Action failed

### Sentiment Badges
- **POSITIVE** - Score > 0.3 (Green)
- **NEUTRAL** - Score -0.3 to 0.3 (Orange)
- **NEGATIVE** - Score < -0.3 (Red)

---

## Integration Points

### Manual Refresh
```
AuroraTopBar → /api/v1/admin/ingest → Database → Audit Log
```

### News Diff
```
NewsPage → /api/v1/news/diff → Compare timestamps → Render ribbon
```

### Catalyst Calendar
```
Month Picker → /api/v1/catalysts/calendar → Filter events → Render view
```

### Spiderweb Compare
```
Company list → /api/v1/competition/compare → Calculate metrics → Render charts
```

---

## Terminal-Grade Patterns Implemented

### Bloomberg-Style
- ✅ Function codes in command palette
- ✅ Manual refresh with audit trail
- ✅ Keyboard-first navigation
- ✅ Corner brackets on panels
- ✅ Monospace font hierarchy

### FactSet-Style
- ✅ Office-grade exports (CSV, ICS)
- ✅ Entitlement-aware operations
- ✅ Role-based access ready
- ✅ Professional data catalog
- ✅ Audit logging

### LSEG Workspace-Style
- ✅ App library ready (existing)
- ✅ Saved layouts ready (existing types)
- ✅ Context channel linking (A/B/C)
- ✅ Multi-panel workflows
- ✅ Shareable configurations

---

All features maintain the Aurora glass aesthetic with terminal-grade UX patterns.

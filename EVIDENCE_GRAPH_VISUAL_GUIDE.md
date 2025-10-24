# Evidence Graph - Visual Guide

## UI Screenshots & Layout

### Main Evidence Graph Page

```
┌─────────────────────────────────────────────────────────────────────┐
│ EVIDENCE GRAPH                                                      │
│ Graph-based evidence tracking • Nodes: 4 • Edges: 2               │
│                                                                     │
│ [⟳ REFRESH]  [GRAPH VIEW]  [TIMELINE VIEW]                        │
└─────────────────────────────────────────────────────────────────────┘
│                                                                     │
│  ┌───────────────────────────┐  ┌────────────────────────────────┐│
│  │                           │  │ NODE TYPES                      ││
│  │    Force-Directed Graph   │  │ ◆ Thesis                       ││
│  │                           │  │ ● Trial                        ││
│  │      thesis:SRRK-core     │  │ ★ Catalyst                     ││
│  │           ◆               │  │ ■ KOL                          ││
│  │          / \              │  │ ■ Document                     ││
│  │         /   \             │  │                                ││
│  │        /     \            │  ├────────────────────────────────┤│
│  │       ●       ★           │  │ NODE DETAILS                   ││
│  │  trial:SRRK  event:PDUFA │  │                                ││
│  │                           │  │ ID: thesis:SRRK-core          ││
│  │   thesis:IONIS-ATTR       │  │ TYPE: thesis                   ││
│  │          ◆                │  │ COMPANY: Scholar Rock          ││
│  │                           │  │ ASSET: Apitegromab            ││
│  │    (Click nodes to view   │  │ INDICATION: SMA               ││
│  │     details or timeline)  │  │                                ││
│  │                           │  │ NOTES: Scholar Rock /          ││
│  │                           │  │ Apitegromab / SMA thesis       ││
│  └───────────────────────────┘  └────────────────────────────────┘│
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Timeline Scrubber View

```
┌─────────────────────────────────────────────────────────────────────┐
│ [← BACK TO GRAPH]                                                   │
│                                                                     │
│ THESIS TIMELINE: thesis:SRRK-core                                  │
│ UPDATES: 1    FINAL POS: -3.0%    FINAL SENTIMENT: -0.05          │
│                                                                     │
│ Timeline Track:                                                     │
│ ─────────────●───────────────────────────────────────────         │
│              │                                                      │
│         2025-10-01                                                  │
│         trial:SRRK-301-P3-RESILIENT                                │
│         ΔPoS: -3.0%  ΔSent: -5.0%                                  │
│                                                                     │
│ Selected Update Details:                                            │
│ ┌─────────────────────────────────────────────────────────────────┐│
│ │ SOURCE: trial:SRRK-301-P3-RESILIENT                            ││
│ │ RELATION: updates                                               ││
│ │ DATE: 2025-10-01T12:00:00Z                                     ││
│ │                                                                 ││
│ │ DELTA:                                                          ││
│ │   PoS: -0.03 (-3.0%)                                           ││
│ │   Sentiment: -0.05                                             ││
│ │                                                                 ││
│ │ CONFIDENCE: 85%                                                 ││
│ │                                                                 ││
│ │ REASON: Phase 3 readout showed mixed results - primary         ││
│ │ endpoint not met but secondary endpoints promising             ││
│ │                                                                 ││
│ │ CUMULATIVE:                                                     ││
│ │   Total PoS: -3.0%                                             ││
│ │   Total Sentiment: -0.05                                       ││
│ └─────────────────────────────────────────────────────────────────┘│
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Color Scheme (Bloomberg Terminal Style)

**Background Colors:**
- Page Background: `#0f1419` (Very dark gray-blue)
- Content Panels: `#1a202c` (Dark gray)
- Buttons: `#2d3748` (Medium gray)

**Accent Colors:**
- Primary Accent: `#ed8936` (Orange - for titles, active buttons)
- Node Type Colors:
  - Thesis: `#805ad5` (Purple)
  - Trial: `#3182ce` (Blue)
  - Catalyst: `#dd6b20` (Orange)
  - KOL: `#38a169` (Green)
  - Document: `#d69e2e` (Yellow)

**Text Colors:**
- Primary Text: `#e2e8f0` (Light gray)
- Subtitle Text: `#a0aec0` (Medium gray)
- Positive Values: `#48bb78` (Green)
- Negative Values: `#f56565` (Red)

**Interactive Elements:**
- Refresh Button: `#2c5282` → `#3182ce` on hover
- View Buttons: `#2d3748` → `#ed8936` when active
- Nodes: Glow effect on hover

## Key Features Highlighted

### 1. Manual Refresh Button
```
[⟳ REFRESH]  ← Click to manually fetch data from server
             ← NO automatic polling or WebSocket updates
             ← Button shows "⟳ LOADING..." while fetching
```

### 2. Force-Directed Graph
```
- Nodes arranged using physics simulation (repulsion + centering)
- Drag nodes to reposition them
- Click nodes to:
  - View details in right panel
  - Load timeline (for thesis nodes)
- Edges show relationships with delta indicators
```

### 3. Timeline Scrubber
```
- Time-ordered visualization of thesis updates
- Cumulative PoS and sentiment calculation
- Click timeline points to see update details
- Shows source node, relation type, delta, confidence
```

## Data Flow (Manual Refresh Only)

```
┌─────────────┐
│   User      │
│  clicks     │
│ "⟳ REFRESH" │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│  evidenceGraphApi.getGraphData()    │
│  - Fetches nodes from API           │
│  - Fetches edges from API           │
│  - NO polling or WebSocket          │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Python FastAPI Backend             │
│  http://localhost:8000              │
│  - Reads from evidence.json file    │
│  - Returns JSON data                │
│  - NO server-side push              │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  React State Update                 │
│  - setNodes(data.nodes)             │
│  - setEdges(data.edges)             │
│  - Re-renders graph                 │
└─────────────────────────────────────┘
```

## API Response Examples

### GET /nodes
```json
[
  {
    "id": "thesis:SRRK-core",
    "type": "thesis",
    "company": "Scholar Rock",
    "asset": "Apitegromab",
    "indication": "SMA",
    "notes": "Scholar Rock / Apitegromab / SMA thesis"
  },
  ...
]
```

### GET /edges
```json
[
  {
    "from": "trial:SRRK-301-P3-RESILIENT",
    "to": "thesis:SRRK-core",
    "relation": "updates",
    "delta": {
      "pos": -0.03,
      "sentiment": -0.05
    },
    "confidence": 0.85,
    "reason": "Phase 3 readout showed mixed results...",
    "created_at": "2025-10-01T12:00:00Z"
  },
  ...
]
```

### GET /thesis/{id}/timeline
```json
{
  "thesis_id": "thesis:SRRK-core",
  "thesis": { ... },
  "timeline": [
    {
      "edge": { ... },
      "source_node": { ... },
      "timestamp": "2025-10-01T12:00:00Z",
      "cumulative": {
        "pos": -0.03,
        "sentiment": -0.05
      }
    }
  ],
  "summary": {
    "total_updates": 1,
    "final_pos": -0.03,
    "final_sentiment": -0.05
  }
}
```

## Technical Architecture

### Frontend Stack
- React 19.1.1
- TypeScript 5.9.3
- Vite 7.1.7 (build tool)
- Standard fetch API (no WebSocket libraries)

### Backend Stack
- Python 3.9+
- FastAPI 0.104.1+
- Pydantic v2.4.2+
- Uvicorn 0.24.0+

### Data Storage
- JSON files in `bt_platform/core/evidence_graph/data/`
- `seed_data.json` - Initial seed data (read-only)
- `evidence.json` - Active data (read-write)
- Auto-seeds from seed_data.json on first run

### No Real-Time Features
- ❌ No WebSocket connections
- ❌ No Socket.IO
- ❌ No setInterval polling
- ❌ No Server-Sent Events
- ✅ Manual refresh only via button click
- ✅ Standard HTTP GET/POST requests
- ✅ Works offline with cached data

## Performance Characteristics

- **Initial Load**: ~100-200ms (4 nodes, 2 edges)
- **Refresh**: ~100-200ms (manual button click)
- **Timeline Load**: ~50-100ms (per thesis)
- **Graph Rendering**: 60 FPS force simulation
- **Memory Usage**: Minimal (no background timers)
- **Network Usage**: Only on user action

## Browser Compatibility

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile browsers (responsive layout)

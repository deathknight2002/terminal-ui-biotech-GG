# Evidence Graph - Quick Start Guide

## Overview

The Evidence Graph is a **manual-refresh** graph-based evidence tracking system for biotech theses, clinical trials, and catalysts. This implementation follows the specification provided, with NO real-time updates or WebSocket connections.

## ✅ What's Included

### Backend (Python FastAPI)
- ✅ Pydantic v2 models (NodeBase, Edge, EdgeDelta)
- ✅ JSON file-backed storage
- ✅ Seed data with Ionis/SRRK examples
- ✅ All required API endpoints:
  - `GET /health` - Health check
  - `GET /nodes` - Get all nodes
  - `POST /node` - Create/update node
  - `GET /edges` - Get all edges
  - `POST /edge` - Add edge
  - `GET /thesis/{id}/timeline` - Timeline scrubber data
  - `GET /screen` - Filter edges by criteria
  - `POST /seed` - Re-load seed data
- ✅ CORS enabled for `http://localhost:3000`

### Frontend (React/TypeScript)
- ✅ Force-directed graph visualization (D3-like physics)
- ✅ Interactive timeline scrubber
- ✅ Node details panel
- ✅ Manual REFRESH button (no auto-polling)
- ✅ Click nodes to view timeline

## 🚀 Quick Start

### 1. Start the Backend (Python FastAPI)

**Option A: Standalone Mode (Recommended for testing)**
```bash
# From repository root
python3 standalone_evidence_api.py

# Or with uvicorn
uvicorn standalone_evidence_api:app --host 0.0.0.0 --port 8000 --reload
```

**Option B: Full Platform Mode**
```bash
cd platform
poetry run uvicorn bt_platform.core.app:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

### 2. Test the Backend

```bash
# Run the smoke test
bash test_evidence_graph.sh

# Or test manually
curl http://localhost:8000/health
curl http://localhost:8000/api/v1/evidence-graph/nodes
curl http://localhost:8000/api/v1/evidence-graph/edges
```

### 3. Start the Frontend

```bash
cd terminal
npm install  # First time only
npm run dev
```

The terminal app will be available at `http://localhost:3000`

### 4. Access the Evidence Graph

Navigate to: `http://localhost:3000/evidence-graph`

**Key Features:**
- Click **⟳ REFRESH** to manually load data from the server
- Click nodes to view details
- Click thesis nodes to load their timeline
- Drag nodes to reposition them
- Switch between Graph View and Timeline View

## 📊 Seed Data

The system comes pre-seeded with example data:

### Nodes (4)
1. **thesis:SRRK-core** - Scholar Rock / Apitegromab / SMA
2. **thesis:IONIS-ATTR** - Ionis / Eplontersen / ATTR-PN
3. **trial:SRRK-301-P3-RESILIENT** - Phase 3 trial (PoS: 0.62)
4. **event:PDUFA-IONIS-ATTR-2025-12-21** - PDUFA date (PoS: 0.73)

### Edges (2)
1. SRRK trial → SRRK thesis (updates, ΔPoS: -0.03)
2. IONIS PDUFA → IONIS thesis (catalyst_for, ΔPoS: +0.02)

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the `terminal/` directory (optional):

```bash
# Python FastAPI backend
VITE_PYTHON_API_URL=http://localhost:8000

# Node.js Express backend (not used by evidence graph)
VITE_API_URL=http://localhost:3001
```

### CORS Configuration

For **development**, CORS is wide open:
```python
allow_origins=["*"]  # In standalone_evidence_api.py
```

For **production**, restrict to specific domains:
```python
allow_origins=["http://localhost:3000", "https://yourdomain.com"]
```

## 📝 API Examples

### Get All Nodes
```bash
curl http://localhost:8000/api/v1/evidence-graph/nodes
```

### Get Thesis Timeline
```bash
curl http://localhost:8000/api/v1/evidence-graph/thesis/thesis:SRRK-core/timeline
```

### Filter Edges by ΔPoS
```bash
curl "http://localhost:8000/api/v1/evidence-graph/screen?pos_delta_abs_gt=0.02&days=30"
```

### Add New Node
```bash
curl -X POST http://localhost:8000/api/v1/evidence-graph/node \
  -H "Content-Type: application/json" \
  -d '{
    "id": "trial:NEW-001",
    "type": "trial",
    "company": "BioTech",
    "asset": "Drug-X",
    "pos_estimate": 0.75
  }'
```

### Add New Edge
```bash
curl -X POST http://localhost:8000/api/v1/evidence-graph/edge \
  -H "Content-Type: application/json" \
  -d '{
    "from": "trial:NEW-001",
    "to": "thesis:SRRK-core",
    "relation": "supports",
    "delta": {"pos": 0.05},
    "confidence": 0.9
  }'
```

### Re-seed Data
```bash
curl -X POST http://localhost:8000/api/v1/evidence-graph/seed
```

## 🔒 Manual Refresh Architecture

**Key principle: NO real-time updates**

- ✅ Data loads only on page load or manual refresh
- ✅ Click "⟳ REFRESH" button to fetch new data
- ✅ No WebSocket connections
- ✅ No automatic polling/setInterval
- ✅ Timeline loads only when thesis node is clicked
- ✅ All data fetching is user-initiated

This ensures:
- Predictable resource usage
- Works offline with cached data
- No background processes
- User controls when data is fetched

## 🧪 Testing

Run the comprehensive smoke test:

```bash
bash test_evidence_graph.sh
```

This verifies:
- ✅ All API endpoints working
- ✅ Nodes and edges loaded correctly
- ✅ Timeline endpoint working
- ✅ No WebSocket/real-time features
- ✅ No auto-refresh mechanisms

## 📚 File Structure

```
.
├── bt_platform/core/evidence_graph/
│   ├── models.py                    # Pydantic v2 models
│   ├── storage.py                   # JSON file storage
│   ├── __init__.py
│   └── data/
│       ├── seed_data.json          # Initial seed data
│       └── evidence.json           # Active data (auto-created)
│
├── bt_platform/core/endpoints/
│   └── evidence_graph.py           # FastAPI routes
│
├── terminal/src/
│   ├── components/
│   │   ├── EvidenceGraph.tsx       # Force-directed graph
│   │   ├── EvidenceGraph.css
│   │   ├── TimelineScrubber.tsx    # Timeline visualization
│   │   └── TimelineScrubber.css
│   ├── pages/
│   │   ├── EvidenceGraphPage.tsx   # Main page
│   │   └── EvidenceGraphPage.css
│   ├── types/
│   │   └── evidence-graph.ts       # TypeScript types
│   ├── utils/
│   │   └── evidence-graph-api.ts   # API client
│   └── config/
│       └── api.ts                  # API endpoints config
│
├── standalone_evidence_api.py      # Standalone server
├── test_evidence_graph.sh          # Smoke test script
└── EVIDENCE_GRAPH_README.md        # Detailed documentation
```

## 🐛 Troubleshooting

### Backend not starting
```bash
# Check Python version (requires 3.9+)
python3 --version

# Install dependencies
pip install fastapi pydantic uvicorn

# Check port
lsof -ti:8000 | xargs kill -9  # Kill process on port 8000
```

### Frontend not connecting
```bash
# Verify backend is running
curl http://localhost:8000/health

# Check CORS errors in browser console
# Update standalone_evidence_api.py if needed

# Verify API base URL
cat terminal/src/config/api.ts | grep PYTHON_BASE_URL
```

### Data not loading
```bash
# Check evidence.json exists
ls -la bt_platform/core/evidence_graph/data/

# Re-seed data
curl -X POST http://localhost:8000/api/v1/evidence-graph/seed

# Check file permissions
chmod 644 bt_platform/core/evidence_graph/data/*.json
```

## 🎯 Next Steps

1. **Add more nodes/edges**: Use the API to add your own data
2. **Customize visualization**: Edit `EvidenceGraph.tsx` for different layouts
3. **Export data**: Add export functionality for sharing graphs
4. **Neo4j migration**: Migrate from JSON to graph database for scale
5. **Confidence weighting**: Add sliders to filter by confidence levels

## 📖 More Information

- Full documentation: `EVIDENCE_GRAPH_README.md`
- API specification: Check FastAPI docs at `http://localhost:8000/docs`
- Type definitions: `terminal/src/types/evidence-graph.ts`

## ⚠️ Important Notes

- **Manual refresh only** - No real-time updates
- CORS is wide open in dev - Restrict for production
- JSON storage is simple but not scalable - Consider Neo4j for large datasets
- Timeline calculation is cumulative - Initial PoS values affect results

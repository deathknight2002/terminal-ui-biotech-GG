# Evidence Graph Feature

## Overview

The Evidence Graph is a graph-based evidence tracking system for biotech theses, clinical trials, and catalysts. It provides visualization and temporal analysis of how evidence updates affect investment theses over time.

## Features

### Backend (Python FastAPI)

- **Nodes**: Represents different entities in the biotech evidence graph
  - `thesis`: Investment thesis for a company/asset
  - `trial`: Clinical trial with readout data
  - `catalyst`: Regulatory or market event (PDUFA, AdComm, etc.)
  - `kol`: Key Opinion Leader
  - `doc`: Document or publication

- **Edges**: Represents relationships between nodes
  - `supports`: Evidence supports a thesis
  - `contradicts`: Evidence contradicts a thesis
  - `updates`: New data updates a thesis
  - `catalyst_for`: Event is a catalyst for a thesis
  - `related_to`: General relationship

- **API Endpoints** (Base: `/api/v1/evidence-graph`)
  - `GET /health` - Health check
  - `GET /nodes` - Get all nodes
  - `GET /nodes/{id}` - Get specific node
  - `POST /node` - Create/update a node
  - `GET /edges` - Get all edges
  - `POST /edge` - Add new edge
  - `GET /thesis/{id}/timeline` - Get timeline of thesis updates (supports timeline scrubber)
  - `GET /screen?pos_delta_abs_gt={value}&days={n}` - Filter edges by criteria
  - `POST /seed` - Re-load seed data

### Frontend (React/TypeScript)

- **Force-Directed Graph Visualization**
  - Interactive canvas-based graph
  - Drag nodes to reposition
  - Color-coded by node type
  - Click nodes to view details or load timeline

- **Timeline Scrubber**
  - Interactive timeline for thesis analysis
  - Shows cumulative changes in PoS and sentiment
  - Scrub through historical updates
  - View detailed information for each update

- **Node Details Panel**
  - View node properties
  - Company, asset, indication information
  - PoS and sentiment metrics

## Data Model

### Node Structure
```json
{
  "id": "thesis:SRRK-core",
  "type": "thesis",
  "date": "2025-05-12",
  "company": "Scholar Rock",
  "asset": "Apitegromab",
  "indication": "SMA",
  "phase": "Phase III",
  "pos_estimate": 0.62,
  "sentiment": 0.15,
  "source_url": "https://...",
  "notes": "Description"
}
```

### Edge Structure
```json
{
  "from": "trial:SRRK-301-P3-RESILIENT",
  "to": "thesis:SRRK-core",
  "relation": "updates",
  "delta": {
    "pos": -0.03,
    "sentiment": -0.05
  },
  "confidence": 0.85,
  "reason": "Trial missed primary endpoint",
  "created_at": "2025-10-01T12:00:00Z"
}
```

## Seed Data

The system comes pre-seeded with example data:

### Nodes
1. **thesis:SRRK-core** - Scholar Rock / Apitegromab / SMA thesis
2. **thesis:IONIS-ATTR** - Ionis / Eplontersen / ATTR-PN thesis
3. **trial:SRRK-301-P3-RESILIENT** - Phase 3 trial (PoS: 0.62)
4. **event:PDUFA-IONIS-ATTR-2025-12-21** - PDUFA date (PoS: 0.73)

### Edges
1. SRRK trial → SRRK thesis (updates, ΔPoS: -0.03)
2. IONIS PDUFA → IONIS thesis (catalyst_for, ΔPoS: +0.02)

## Running the Evidence Graph API

### Standalone Mode (Recommended for Testing)

```bash
# Start the standalone API server
python3 standalone_evidence_api.py

# API will be available at http://localhost:8000
# Test with: curl http://localhost:8000/health
```

### Integrated Mode (Full Platform)

The evidence graph endpoints are integrated into the main FastAPI application:

```bash
# Start the full platform
cd platform
poetry run uvicorn bt_platform.core.app:app --reload --port 8000

# Evidence graph endpoints at: http://localhost:8000/api/v1/evidence-graph/
```

## Accessing the Frontend

1. Start the backend (either standalone or integrated mode)
2. Start the terminal app:
   ```bash
   cd terminal
   npm run dev
   ```
3. Navigate to:
   - Main view: http://localhost:3000/evidence-graph
   - Science menu: http://localhost:3000/science/evidence-graph

## Storage

- **Backend**: JSON file storage at `bt_platform/core/evidence_graph/data/`
  - `seed_data.json` - Initial seed data
  - `evidence.json` - Active data (auto-created from seed on first run)

## API Configuration

The frontend is configured to use:
- **Python Backend**: `http://localhost:8000` (FastAPI)
- **Node.js Backend**: `http://localhost:3001` (Express)

To change these URLs, set environment variables:
```bash
export VITE_PYTHON_API_URL=http://your-python-api:8000
export VITE_API_URL=http://your-nodejs-api:3001
```

## Usage Examples

### Get all nodes
```bash
curl http://localhost:8000/api/v1/evidence-graph/nodes
```

### Get thesis timeline
```bash
curl http://localhost:8000/api/v1/evidence-graph/thesis/thesis:SRRK-core/timeline
```

### Filter significant edges
```bash
curl "http://localhost:8000/api/v1/evidence-graph/screen?pos_delta_abs_gt=0.02&days=30"
```

### Add new node
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

### Add new edge
```bash
curl -X POST http://localhost:8000/api/v1/evidence-graph/edges \
  -H "Content-Type: application/json" \
  -d '{
    "from": "trial:NEW-001",
    "to": "thesis:SRRK-core",
    "relation": "supports",
    "delta": {"pos": 0.05},
    "confidence": 0.9
  }'
```

## Architecture

### Backend
- **Models**: `bt_platform/core/evidence_graph/models.py` - Pydantic v2 models
- **Storage**: `bt_platform/core/evidence_graph/storage.py` - JSON file backend
- **Endpoints**: `bt_platform/core/endpoints/evidence_graph.py` - FastAPI routes
- **Data**: `bt_platform/core/evidence_graph/data/` - JSON storage

### Frontend
- **Types**: `terminal/src/types/evidence-graph.ts` - TypeScript definitions
- **API Client**: `terminal/src/utils/evidence-graph-api.ts` - API wrapper
- **Components**:
  - `terminal/src/components/EvidenceGraph.tsx` - Force-directed graph
  - `terminal/src/components/TimelineScrubber.tsx` - Timeline visualization
- **Page**: `terminal/src/pages/EvidenceGraphPage.tsx` - Main page component

## Extension Ideas

1. **Edge confidence weighting**: Add slider to fade low-confidence edges
2. **Thesis snapshots**: Save thesis state when cumulative ΔPoS > threshold
3. **Catalyst calibration**: Analyze average Δ by catalyst type
4. **Neo4j backend**: Migrate from JSON to graph database
5. **Real-time updates**: WebSocket support for live data
6. **Export/Import**: Export graph data to various formats

## Testing

### Backend Tests
```bash
# Test models
python3 -c "from bt_platform.core.evidence_graph.models import NodeBase, Edge; print('✅ Models OK')"

# Test storage
python3 -c "from bt_platform.core.evidence_graph.storage import EvidenceGraphStorage; s=EvidenceGraphStorage(); print(f'Nodes: {len(s.get_nodes())}')"
```

### API Tests
```bash
# Start server and test endpoints
python3 standalone_evidence_api.py &
sleep 2
curl http://localhost:8000/health
curl http://localhost:8000/api/v1/evidence-graph/nodes
curl http://localhost:8000/api/v1/evidence-graph/edges
```

## Troubleshooting

### Backend not starting
- Check Python version (requires 3.9+)
- Install dependencies: `pip install fastapi pydantic uvicorn`
- Check port 8000 is not in use

### Frontend not connecting
- Verify backend is running on port 8000
- Check CORS configuration in backend
- Verify API base URL in `terminal/src/config/api.ts`

### Data not loading
- Check `evidence.json` exists in `bt_platform/core/evidence_graph/data/`
- Run `POST /seed` to reload from seed_data.json
- Check file permissions

## License

MIT License - Part of the Biotech Terminal Platform

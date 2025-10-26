# Evidence Graph — Quickstart (5 minutes)

## 0) Prereqs
- Python 3.10+
- Node 18+
- bash, curl, (optional) jq

## 1) Start Backend (FastAPI)
```bash
python3 standalone_evidence_api.py
```

- Seeds Ionis/SRRK data if store is empty.
- CORS allows localhost:3000 by default.

## 2) Start Frontend (Terminal UI)

```bash
cd terminal
npm install
npm run dev
```

Open http://localhost:3000/evidence-graph

## 3) Use It
- Click **⟳ REFRESH** to load nodes/edges.
- Click a thesis node to load Timeline (on demand).
- No background updates by design.

## 4) Smoke Test (optional)

```bash
bash test_evidence_graph.sh
```

This verifies:
- All 9 endpoints are working
- No realtime primitives exist in the codebase
- Data is seeded correctly

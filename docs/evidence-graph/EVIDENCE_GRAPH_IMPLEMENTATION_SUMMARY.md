# Implementation Summary

## Overview
- Evidence-as-graph with **Nodes** (trials, catalysts, KOL, docs, theses) and **Edges** (supports/contradicts/updates/catalyst_for/related_to).
- Time-aware deltas (ΔPoS, ΔSentiment, ΔTAM) captured on edges.

## Architecture
- **Frontend:** React page + d3 force graph + on-demand timeline scrubber.
- **Backend:** FastAPI (Pydantic v2), JSON storage, auto-seed.
- **Manual Refresh Policy:** Only user-initiated fetching.

## Endpoints (9)
- GET `/health`
- GET `/openapi.json`
- GET `/api/v1/evidence-graph/nodes`
- POST `/api/v1/evidence-graph/node`
- GET `/api/v1/evidence-graph/edges`
- POST `/api/v1/evidence-graph/edge`
- GET `/api/v1/evidence-graph/thesis/{id}/timeline`
- GET `/api/v1/evidence-graph/screen?pos_delta_abs_gt=...&days=...`
- POST `/api/v1/evidence-graph/seed`

## Constraints
- No WebSockets/SSE/Socket.IO.
- No timers/polling on the client.
- CORS restricted in prod.

## Feature Checklist
- [x] Graph render
- [x] Timeline scrubber (loads on selection)
- [x] Manual REFRESH with loading states
- [x] Seed data (Ionis/SRRK)
- [x] Smoke test
- [x] Docs suite
- [x] ETag caching support
- [x] AbortController for request cancellation
- [x] Keyboard shortcuts (Press 'R' to refresh)

# Evidence Graph — Feature README

## What Is It?
A graph-native way to journal and visualize evidence (trials, catalysts, KOL takes) with time-aware deltas that update theses.

## Manual-Refresh Architecture
**Included**
- User clicks **⟳ REFRESH** to load graph (nodes + edges).
- Timeline fetch triggers only when a thesis node is selected.
- Initial page load fetches data once.
- Keyboard shortcut: Press 'R' to refresh data.

**Excluded**
- WebSockets, SSE, Socket.IO.
- setInterval/setTimeout polling.
- Background revalidation.

## Env
- `VITE_PYTHON_API_URL` (frontend) - defaults to `http://localhost:8000`.
- Restrict CORS in the API for production.

## Security
- No secrets in query strings.
- JSON storage kept local/server-side.
- ETag support for efficient caching.
- Rate limiting on API endpoints.
- Security headers included in responses.

## Deploy
- Backend as ASGI (Uvicorn/Gunicorn).
- Frontend static build; route `/evidence-graph` added to app nav.

## Storage Backends
The API supports two storage backends:
1. **JSON File Storage** (default) - Simple JSON file storage
2. **SQLite Storage** - For production use with better concurrency

Configure via environment variables:
```bash
EVIDENCE_GRAPH_STORAGE=sqlite
EVIDENCE_GRAPH_DB_URL=sqlite:///evidence_graph.db
```

## Features
- **ETag Caching**: Client can use If-None-Match header for cache validation
- **Abort Controllers**: In-flight requests are cancelled on component unmount or new requests
- **Filtering**: Filter nodes by type, company; filter edges by criteria
- **Pagination**: Support for limit/offset on node queries
- **Timeline**: Time-based view of evidence updates for thesis nodes

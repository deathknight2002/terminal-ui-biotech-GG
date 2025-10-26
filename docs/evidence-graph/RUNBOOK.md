# Evidence Graph — Ops Runbook

**Owner**: Evidence Graph Team  
**Last Updated**: 2025-10-26  
**Status**: Production Ready

## Overview

The Evidence Graph is a manual-refresh-only visual analytics system for tracking pharmaceutical evidence as a time-aware graph. This runbook covers operational procedures, health checks, common tasks, and troubleshooting.

## Architecture Summary

- **Backend**: FastAPI (Python 3.11+)
- **Storage**: SQLite (production) or JSON (dev fallback)
- **Frontend**: React + D3.js force graph
- **Refresh Model**: Manual refresh only (no WebSocket, no auto-polling)
- **Caching**: ETag-based HTTP caching

## SLO (Service Level Objectives)

### Performance Targets
- **P95 GET /nodes**: ≤ 200ms
- **P95 GET /edges**: ≤ 200ms
- **P95 GET /thesis/{id}/timeline**: ≤ 300ms
- **Error rate**: < 0.5% per 1k requests
- **Availability**: 99.5% uptime

### Data Freshness
- **Node updates**: Manual refresh on-demand
- **Timeline scrubber**: Real-time calculation (< 100ms)
- **Seed data**: On-demand via POST /seed

## Health Checks

### Primary Health Endpoint
```bash
curl -f http://localhost:8000/health
# Expected: {"status":"ok"}
```

### Evidence Graph Health
```bash
curl -f http://localhost:8000/api/v1/evidence-graph/health
# Expected: {"status":"ok","version":"1.0.0","storage":"sqlite"}
```

### Comprehensive Check
```bash
# Run full smoke test
bash test_evidence_graph.sh
```

## Common Tasks

### 1. Reload Seed Data (Dev Only)
```bash
# Re-initialize with demo data
curl -X POST http://localhost:8000/api/v1/evidence-graph/seed

# Expected response:
# {"status":"success","message":"Evidence graph seeded successfully","nodes":X,"edges":Y}
```

### 2. Verify Conditional Caching (ETag)
```bash
# Step 1: Get initial response with ETag
curl -I http://localhost:8000/api/v1/evidence-graph/nodes
# Note the ETag header value

# Step 2: Send conditional request
curl -I -H "If-None-Match: <etag-value>" http://localhost:8000/api/v1/evidence-graph/nodes
# Expected: HTTP 304 Not Modified (cache hit)
```

### 3. Query Timeline for Thesis
```bash
# Get full timeline
curl "http://localhost:8000/api/v1/evidence-graph/thesis/thesis:SRRK-core/timeline"

# Response includes:
# - summary.total_updates
# - summary.final_pos (final Probability of Success)
# - updates[] array with deltas
```

### 4. Screen Edges by Delta
```bash
# Find edges with significant PoS changes (> 1%)
curl "http://localhost:8000/api/v1/evidence-graph/screen?pos_delta_abs_gt=0.01"

# Filter by confidence
curl "http://localhost:8000/api/v1/evidence-graph/screen?min_confidence=0.6"
```

### 5. Create Custom Node
```bash
curl -X POST http://localhost:8000/api/v1/evidence-graph/node \
  -H "Content-Type: application/json" \
  -d '{
    "id": "custom:my-node",
    "type": "thesis",
    "notes": "My custom thesis node"
  }'
```

### 6. Create Edge with Delta
```bash
curl -X POST http://localhost:8000/api/v1/evidence-graph/edge \
  -H "Content-Type: application/json" \
  -d '{
    "from": "thesis:A",
    "to": "thesis:B",
    "relation": "supports",
    "delta": {"pos": 0.05, "sentiment": 0.1},
    "confidence": 0.8,
    "reason": "Positive Phase II results"
  }'
```

## Monitoring & Alerts

### Key Metrics to Track

1. **Response Times**
   - `/nodes` endpoint latency (P50, P95, P99)
   - `/edges` endpoint latency
   - `/timeline` endpoint latency

2. **Error Rates**
   - 4xx errors (client errors)
   - 5xx errors (server errors)
   - Database connection failures

3. **Cache Hit Rate**
   - ETag-based cache hits (304 responses)
   - Target: > 80% for repeated requests

4. **Data Integrity**
   - Node count stability
   - Edge count stability
   - Orphaned edges (edges with missing nodes)

### Alert Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Error Rate | > 1% | > 5% |
| P95 Latency /nodes | > 200ms | > 500ms |
| P95 Latency /edges | > 200ms | > 500ms |
| Availability | < 99% | < 95% |

## Troubleshooting

### Issue: API Returns Empty Nodes/Edges

**Symptoms**: GET /nodes or GET /edges returns []

**Diagnosis**:
```bash
# Check if database file exists
ls -lh bt_platform/core/evidence_graph/data/evidence.db

# Check seed status
curl http://localhost:8000/api/v1/evidence-graph/health
```

**Resolution**:
```bash
# Re-seed the database
curl -X POST http://localhost:8000/api/v1/evidence-graph/seed
```

### Issue: Slow Timeline Queries

**Symptoms**: /timeline endpoint > 300ms

**Diagnosis**:
- Check number of updates for the thesis
- Verify database indexes

**Resolution**:
```bash
# For SQLite backend, run ANALYZE
sqlite3 evidence.db "ANALYZE;"

# Check query plan
sqlite3 evidence.db "EXPLAIN QUERY PLAN SELECT * FROM edges WHERE from_id = 'thesis:X';"
```

### Issue: ETag Cache Not Working

**Symptoms**: Conditional requests always return 200 instead of 304

**Diagnosis**:
```bash
# Check if ETag headers are present
curl -I http://localhost:8000/api/v1/evidence-graph/nodes | grep -i etag
```

**Resolution**:
- Ensure middleware is enabled in `standalone_evidence_api.py`
- Check if response content is deterministic (same data = same ETag)

### Issue: "Manual-Refresh Policy Violated" Error in CI

**Symptoms**: CI fails with "Realtime primitive detected"

**Diagnosis**:
```bash
# Run local policy check
grep -RInE "WebSocket|EventSource|setInterval|setTimeout|useSWR" \
  terminal/src/pages/EvidenceGraph* \
  terminal/src/components/EvidenceGraph*
```

**Resolution**:
- Remove any real-time constructs from Evidence Graph files
- Use manual refresh pattern with onClick handlers only
- Run pre-commit hooks: `pre-commit run --all-files`

### Issue: Orphaned Edges

**Symptoms**: Edges reference nodes that don't exist

**Diagnosis**:
```bash
# Check for orphaned edges via screen endpoint
curl "http://localhost:8000/api/v1/evidence-graph/screen" | jq -r '.[] | select(.from_exists == false or .to_exists == false)'
```

**Resolution**:
- Re-seed database to reset to known good state
- Implement referential integrity checks before creating edges

## Deployment

### Pre-Deployment Checklist
- [ ] Run `bash test_evidence_graph.sh` locally
- [ ] Verify CI passes (evidence-graph.yml workflow)
- [ ] Check pre-commit hooks pass
- [ ] Review CODEOWNERS approvals
- [ ] Verify no real-time primitives in Evidence Graph code

### Rollback Procedure
1. Revert to previous release tag
2. Re-deploy previous container image
3. If data corruption, restore from last known good backup

## Maintenance Windows

- **Scheduled**: None required (stateless API, can deploy anytime)
- **Recommended**: Deploy during low-traffic periods
- **Data migrations**: Test in staging first, use seed endpoint for fresh start

## Escalation

### On-Call Contacts
- **Primary**: Evidence Graph Team (@deathknight2002)
- **Secondary**: Platform Engineering Team
- **Escalation**: SRE Team

### Incident Response
1. Check health endpoints
2. Review logs for errors
3. Check CI/CD pipeline status
4. If database corruption, restore from backup or re-seed
5. Document incident in post-mortem

## Related Documentation

- **Implementation Guide**: [EVIDENCE_GRAPH_README.md](./EVIDENCE_GRAPH_README.md)
- **Quickstart**: [EVIDENCE_GRAPH_QUICKSTART.md](./EVIDENCE_GRAPH_QUICKSTART.md)
- **Architecture Decision Record**: [docs/ADR-001-manual-refresh-only.md](../ADR-001-manual-refresh-only.md)
- **Smoke Test Script**: [test_evidence_graph.sh](../../test_evidence_graph.sh)
- **Visual Demo**: [VISUAL_DEMONSTRATION.md](./VISUAL_DEMONSTRATION.md)

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-10-26 | Initial runbook created | Evidence Graph Team |

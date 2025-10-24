# ADR 001: Manual Refresh Only for Evidence Graph

**Status:** Accepted  
**Date:** 2025-01-24  
**Deciders:** Engineering Team  
**Tags:** architecture, ux, performance

## Context and Problem Statement

The Evidence Graph feature visualizes relationships between pharmaceutical data entities (theses, trials, catalysts, KOLs, documents). We need to decide how data freshness should be managed: automatic background updates vs. user-initiated manual refresh.

## Decision Drivers

* **Data Integrity:** Ensure users understand when they're viewing potentially stale data
* **Performance:** Minimize unnecessary server load and network traffic
* **User Control:** Give users explicit control over data retrieval timing
* **Resource Efficiency:** Reduce battery drain and bandwidth usage
* **Debugging:** Simplify troubleshooting by eliminating background processes
* **Cost:** Reduce API call volume for potential metered services

## Considered Options

1. **Manual Refresh Only** (Selected)
2. Automatic Polling (e.g., every 30 seconds)
3. WebSocket Real-time Updates
4. Hybrid: Manual + Optional Auto-refresh with User Toggle

## Decision Outcome

**Chosen option:** "Manual Refresh Only" with enhanced UX features

### Rationale

The Evidence Graph is a **research and analysis tool** where:
- Users spend significant time analyzing existing data before needing updates
- Data changes infrequently (not real-time market data)
- Users need stable views during analysis (automatic updates would be disruptive)
- Explicit refresh gives users control over their workflow

### Implementation Details

To maintain discipline and provide excellent UX despite manual-only refresh:

#### 1. UX Enhancements
- **Last-Updated Timestamp:** Always visible near refresh button
- **Keyboard Shortcut:** Press 'R' key to refresh (common convention)
- **Debounce Guard:** Prevent accidental double-clicks
- **Loading States:** Clear feedback during fetch operations
- **AbortController:** Cancel in-flight requests when user triggers new refresh

#### 2. Performance Optimizations
- **ETag Caching:** Server returns SHA-256 hash of data
- **HTTP 304 Not Modified:** Clients send `If-None-Match` header
- **HEAD Requests:** Check for updates without downloading full payload
- **Cache-Control Headers:** `no-store` to prevent browser caching (manual only)

#### 3. API Design
- **No WebSocket Connections:** Zero persistent connections
- **No Polling Intervals:** Zero background timers
- **Filtering & Pagination:** Reduce payload size when manual refresh occurs
- **Rate Limiting:** 60 requests/minute per IP (reasonable for manual use)

### Evidence of Manual-Only

```typescript
// No polling timers
useEffect(() => {
  loadData();  // Only on mount
  return () => {
    controllerRef.current?.abort();  // Cleanup
  };
}, []);  // Empty dependency array - no re-runs

// No setInterval/setTimeout for auto-refresh
// No WebSocket connections
// No Server-Sent Events (SSE)
```

### Positive Consequences

* ✅ **Predictable Behavior:** Users know exactly when data updates occur
* ✅ **Reduced Server Load:** 90-95% fewer API calls vs. polling
* ✅ **Battery Friendly:** No background timers on mobile devices
* ✅ **Easier Debugging:** No race conditions from concurrent updates
* ✅ **Cost Effective:** Minimal API usage for metered services
* ✅ **Workflow Control:** Users refresh when ready, not interrupted mid-analysis

### Negative Consequences

* ⚠️ **Manual Action Required:** Users must remember to refresh
* ⚠️ **Potential Staleness:** Data might be outdated if user forgets to refresh
* ⚠️ **Notification Gap:** No automatic alerts for new data

### Mitigation Strategies

1. **Prominent Refresh Button:** Orange accent color, top of page
2. **Last-Updated Stamp:** Constantly visible reminder of data age
3. **Keyboard Shortcut:** Quick access (R key) reduces friction
4. **Documentation:** Clear guidance on when to refresh
5. **ETag Optimization:** Fast 304 responses make refreshing low-cost

## Validation and Testing

### E2E Tests (Playwright)
```typescript
test('manual refresh only - no background polling', async ({ page }) => {
  await page.goto('/evidence-graph');
  
  // Verify REFRESH button exists
  await expect(page.getByRole('button', { name: 'REFRESH' })).toBeVisible();
  
  // Capture network requests
  const requests = [];
  page.on('request', req => requests.push(req.url()));
  
  // Wait 10 seconds
  await page.waitForTimeout(10000);
  
  // Assert: No background API calls (except initial load)
  const apiCalls = requests.filter(url => url.includes('/api/'));
  expect(apiCalls.length).toBeLessThanOrEqual(2);  // nodes + edges on load
  
  // Assert: No WebSocket connections
  const wsCalls = requests.filter(url => url.startsWith('ws://') || url.startsWith('wss://'));
  expect(wsCalls.length).toBe(0);
});
```

### API Tests (pytest)
```python
def test_no_polling_endpoints():
    """Verify no polling-specific endpoints exist."""
    response = client.get("/api/v1/evidence-graph/subscribe")
    assert response.status_code == 404  # Should not exist
    
    response = client.get("/api/v1/evidence-graph/stream")
    assert response.status_code == 404  # Should not exist
```

## Links

* [Evidence Graph Implementation Summary](./EVIDENCE_GRAPH_IMPLEMENTATION_SUMMARY.md)
* [Manual Refresh Complete Guide](./MANUAL_REFRESH_COMPLETE.md)
* [API Integration Quickstart](./API_INTEGRATION_QUICKSTART.md)

## Future Considerations

If requirements change and automatic updates become necessary:

1. **Option A: Server-Sent Events (SSE)**
   - One-way server → client updates
   - Simpler than WebSocket
   - Fallback to manual refresh if connection fails

2. **Option B: User-Configurable Polling**
   - Off by default (manual only)
   - Users can opt-in to auto-refresh
   - Configurable interval (30s, 60s, 5m)
   - Clear UI indicator when enabled

3. **Option C: Smart Notifications**
   - Server tracks last-fetch timestamp per client
   - Client polls a lightweight "has-updates" endpoint
   - Only full refresh when updates exist

**Decision:** Stick with manual-only unless business requirements explicitly demand real-time updates for specific use cases.

## Appendix: Production Checklist

When deploying manual-refresh Evidence Graph:

- [ ] ETag headers enabled on GET /nodes and GET /edges
- [ ] HEAD method returns headers without body
- [ ] Rate limiting enforced (60 req/min per IP)
- [ ] Last-updated timestamp visible in UI
- [ ] Keyboard shortcut (R) documented in UI
- [ ] Security headers configured (CSP, X-Frame-Options)
- [ ] E2E test validates "no background polling"
- [ ] Monitoring alerts on excessive refresh rates (potential bot activity)
- [ ] Documentation explains manual-refresh philosophy

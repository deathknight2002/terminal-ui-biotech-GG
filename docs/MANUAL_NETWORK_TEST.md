# Manual Network Request Test - Zero Background Network Guarantee

## Test Objective

Verify that the Biotech Terminal makes **ZERO** network requests after initial page load until the user explicitly clicks the Refresh button.

## Background

The terminal implements a manual-refresh-only data model to ensure:
- Predictable network usage
- Lower backend load
- No surprise API quota consumption
- Better mobile battery life
- Full user control over data fetching

This is achieved through:
1. React Query configuration with all auto-refetch options disabled
2. No WebSocket connections
3. No EventSource/SSE
4. No polling timers
5. Service Worker only caching static assets

## Test Environment

### Required Tools
- Modern web browser with DevTools (Chrome, Firefox, Edge, or Safari)
- Browser DevTools Network tab
- Development server running locally

### Browser Setup
1. Open browser in private/incognito mode (to avoid cached data)
2. Open DevTools (F12 or Cmd+Option+I on Mac)
3. Navigate to **Network** tab
4. Ensure "Preserve log" is enabled
5. Clear any existing network logs

## Test Methodology

### Phase 1: Initial Load Baseline

**Purpose**: Capture all network requests during initial page load.

**Steps**:
1. Clear browser cache and DevTools network log
2. Navigate to terminal application URL (e.g., http://localhost:3000)
3. Wait for page to fully load (spinner stops, content visible)
4. Record all network requests in a table

**Expected Results**:
- Static assets loaded (HTML, CSS, JS, fonts, images)
- Initial API calls to fetch dashboard data
- Service worker registration (if applicable)
- Total requests: 10-50 (depending on components loaded)

**Recording Format**:
```
Request # | Type      | URL                                  | Status | Size
----------|-----------|--------------------------------------|--------|------
1         | document  | http://localhost:3000/               | 200    | 2.4KB
2         | script    | /src/main.tsx                        | 200    | 1.2KB
3         | fetch     | /api/v1/biotech/dashboard            | 200    | 8.5KB
...
```

### Phase 2: Post-Load Observation Period

**Purpose**: Verify NO network requests occur after initial load.

**Steps**:
1. Note the timestamp of the last request from Phase 1
2. Clear the network log in DevTools (right-click → "Clear")
3. Wait for 5 minutes without any user interaction
4. Document any network requests that appear

**Expected Results**:
- **Network log remains empty**
- No XHR/Fetch requests
- No WebSocket connections established
- No EventSource connections
- No polling requests
- Zero total requests during observation period

**If ANY requests appear**, this indicates a violation of the zero-network guarantee and requires investigation.

### Phase 3: User Interaction Without Refresh

**Purpose**: Verify navigation and UI interactions don't trigger network requests.

**Steps**:
1. Clear the network log
2. Perform the following interactions:
   - Click through different pages/tabs (Dashboard, Pipeline, News, etc.)
   - Hover over charts and metrics
   - Open modals or panels
   - Resize the window
   - Scroll through data tables
3. Document any network requests that appear

**Expected Results**:
- **Network log remains empty**
- All navigation uses cached data
- UI is fully responsive with existing data
- No background fetches triggered by user actions
- Total requests: 0

### Phase 4: Explicit Refresh Button Test

**Purpose**: Verify refresh button triggers network requests as expected.

**Steps**:
1. Clear the network log
2. Locate the Refresh button in the top bar
3. Click the Refresh button and select "Refresh All"
4. Wait for the refresh operation to complete
5. Document all network requests that appear

**Expected Results**:
- Network requests ARE made to backend APIs
- Refresh spinner shows during operation
- "LAST REFRESHED" timestamp updates in footer
- Toast notification appears: "Refresh Complete"
- New data appears in the UI
- Total requests: 1-10 (depending on data sources)

**Recording Format**:
```
Request # | Type   | URL                                  | Status | Initiated By
----------|--------|--------------------------------------|--------|---------------
1         | fetch  | /api/v1/biotech/dashboard            | 200    | Refresh button
2         | fetch  | /api/v1/biotech/trials               | 200    | Refresh button
...
```

### Phase 5: Post-Refresh Observation

**Purpose**: Verify no automatic follow-up requests after manual refresh.

**Steps**:
1. After refresh completes, clear the network log
2. Wait for another 5 minutes without interaction
3. Document any network requests that appear

**Expected Results**:
- **Network log remains empty**
- No automatic re-fetching
- No polling initiated
- Cached data remains visible
- Total requests: 0

## Test Results Template

### Test Execution Details

- **Date**: [ISO timestamp]
- **Tester**: [Name]
- **Browser**: [Name and version]
- **OS**: [Operating system]
- **Terminal Version**: [Git commit hash or version]
- **Backend Status**: [Running locally / Mock data / Production]

### Phase 1: Initial Load
- Total Requests: [number]
- Last Request Time: [timestamp]
- Status: ✅ PASS / ❌ FAIL
- Notes: [Any observations]

### Phase 2: Post-Load Observation (5 minutes)
- Total Requests: [number - should be 0]
- Duration: [actual time observed]
- Status: ✅ PASS / ❌ FAIL
- Notes: [Any observations]

### Phase 3: User Interactions
- Actions Performed: [list of interactions]
- Total Requests: [number - should be 0]
- Status: ✅ PASS / ❌ FAIL
- Notes: [Any observations]

### Phase 4: Explicit Refresh
- Total Requests: [number]
- Refresh Duration: [time in seconds]
- Status: ✅ PASS / ❌ FAIL
- Notes: [Any observations]

### Phase 5: Post-Refresh Observation (5 minutes)
- Total Requests: [number - should be 0]
- Status: ✅ PASS / ❌ FAIL
- Notes: [Any observations]

### Overall Test Result

- **Zero Network Guarantee**: ✅ VERIFIED / ❌ FAILED
- **Summary**: [Brief summary of findings]

### Screenshots/Evidence

1. **Network Log After Initial Load**: [screenshot or exported HAR file]
2. **Empty Network Log During Observation**: [screenshot showing 0 requests]
3. **Network Requests on Refresh**: [screenshot showing refresh requests]
4. **Footer Timestamp Update**: [screenshot showing updated "LAST REFRESHED"]

## Validation Criteria

### ✅ Test PASSES if:
1. No network requests occur during 5-minute post-load observation
2. No network requests occur during user interactions
3. Network requests ONLY occur when refresh button is clicked
4. No network requests occur after refresh completes
5. "LAST REFRESHED" timestamp updates only on manual refresh

### ❌ Test FAILS if:
1. ANY network request appears during observation periods
2. Polling or interval-based requests are detected
3. WebSocket connections are established
4. Window focus/blur triggers requests
5. Page navigation triggers background requests
6. Service worker fetches API data in background

## Troubleshooting

### If Unexpected Requests Appear:

1. **Check Request URL**: Identify what endpoint is being called
2. **Check Initiator**: DevTools shows which code triggered the request
3. **Check Timing**: Note if requests are periodic (indicates polling)
4. **Check Type**: WebSocket, EventSource, XHR, Fetch, etc.

### Common False Positives:

- Browser extensions making their own requests (test in incognito mode)
- Service worker updating static assets (should not be API calls)
- Favicon requests (browser behavior, not app requests)
- Browser telemetry (can be disabled in browser settings)

### Investigation Steps:

1. Check React Query configuration in `terminal/src/App.tsx`
2. Search codebase for `refetchInterval`, `refetchOnWindowFocus`, `refetchOnReconnect`
3. Check for WebSocket imports: `socket.io-client`, `ws`
4. Check for EventSource usage
5. Check for `setInterval` or `setTimeout` with network calls
6. Review service worker code in `terminal/public/sw.js`

## Configuration Verification

### Key Settings to Verify:

**React Query Client** (`terminal/src/App.tsx`):
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,              // ✅ Never auto-refetch
      refetchOnWindowFocus: false,      // ✅ Disabled
      refetchOnReconnect: false,        // ✅ Disabled
      refetchInterval: false,           // ✅ Disabled
    },
  },
});
```

**No Active WebSockets**:
```bash
# Search for WebSocket usage
grep -r "io(" terminal/src/
grep -r "new WebSocket" terminal/src/
```

**No Polling Timers**:
```bash
# Search for interval-based fetching
grep -r "setInterval.*fetch" terminal/src/
grep -r "refetchInterval:" terminal/src/
```

## References

- Implementation Summary: [IMPLEMENTATION_MANUAL_REFRESH_PWA.md](../IMPLEMENTATION_MANUAL_REFRESH_PWA.md)
- Refresh Model Documentation: [REFRESH_MODEL.md](./REFRESH_MODEL.md)
- React Query Configuration: [terminal/src/App.tsx](../terminal/src/App.tsx)
- Service Worker: [terminal/public/sw.js](../terminal/public/sw.js)

## Change History

| Date | Tester | Result | Notes |
|------|--------|--------|-------|
| [Date] | [Name] | ✅/❌ | [Summary] |

---

**Document Version**: 1.0  
**Last Updated**: October 10, 2025  
**Status**: Ready for Testing

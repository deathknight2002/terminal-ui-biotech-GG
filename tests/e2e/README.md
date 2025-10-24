# Evidence Graph E2E Tests (Placeholder)

This directory is reserved for Playwright end-to-end tests.

## TODO: Implement Playwright Tests

### Installation
```bash
npm install -D @playwright/test
npx playwright install
```

### Test Cases to Implement

1. **Manual Refresh Only**
   - Verify no background API calls after page load
   - Verify no WebSocket connections
   - Verify no polling intervals

2. **Refresh Button Behavior**
   - Click updates last-updated timestamp
   - Shows loading state during fetch
   - Updates node/edge count

3. **Keyboard Shortcut**
   - Press 'R' key triggers refresh
   - Only works when not typing in input

4. **ETag Caching**
   - First request gets full data
   - Subsequent request with same ETag returns 304
   - Timestamp still updates even with 304

5. **Error Handling**
   - API down shows error message
   - Retry button works
   - Network errors handled gracefully

6. **Graph Visualization**
   - Nodes render correctly
   - Edges render correctly
   - Click node shows details

See `evidence-graph-placeholder.md` for example test code.

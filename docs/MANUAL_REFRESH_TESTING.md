# Manual-Refresh PWA Testing Guide

This guide provides step-by-step instructions for testing the manual-refresh PWA implementation.

## Automated Verification

Run the verification script to check all requirements:

```bash
./scripts/verify-manual-refresh.sh
```

Expected output: All checks should pass (✅).

## Manual Testing Checklist

### 1. Zero Background Network Traffic

**Test:** Verify no automatic network requests after initial load.

1. Open terminal in browser with DevTools Network tab open
2. Clear Network tab and load the page
3. Wait 60 seconds without clicking anything
4. Verify NO network requests occur (API calls, WebSocket, etc.)

**Expected:** Only static asset requests on initial load, then zero activity.

**How to verify:**
```bash
# 1. Start dev server
cd terminal && npm run dev

# 2. Open http://localhost:3000
# 3. Open Chrome DevTools > Network tab
# 4. Clear network log
# 5. Wait 60 seconds
# 6. Should see ZERO requests
```

### 2. Manual Refresh Functionality

**Test:** Refresh button triggers data updates.

1. Open terminal app
2. Note the "LAST REFRESHED" timestamp in footer
3. Click the refresh icon (top right)
4. Select "Refresh All"
5. Wait for spinner to complete

**Expected:**
- ✅ Spinner shows during refresh
- ✅ "LAST REFRESHED" timestamp updates
- ✅ Toast notification shows "Refresh Complete"
- ✅ Network tab shows API requests ONLY during refresh

### 3. Error Banner (429/5xx)

**Test:** Banner shows on API errors while preserving cached data.

**Simulate 429 Rate Limit:**
```bash
# In platform/core/endpoints/biotech.py, temporarily add:
@router.get("/dashboard")
async def get_dashboard(db: Session = Depends(get_db)):
    from fastapi import HTTPException
    raise HTTPException(status_code=429, detail="Rate limit exceeded")
```

1. Restart backend
2. Click "Refresh All" in terminal
3. Verify banner appears: "Service busy; showing cached data."
4. Verify banner has dismiss button (×)
5. Verify existing data still displays
6. Click dismiss button

**Expected:**
- ✅ Banner appears at top of page
- ✅ Banner is dismissible
- ✅ Banner has `role="status"` and `aria-live="polite"` (check in DevTools)
- ✅ Cached data remains visible

### 4. Backend Caching (HTTP Headers)

**Test:** Verify Cache-Control and ETag headers.

1. Start backend server
2. Make API request and check response headers:

```bash
curl -i http://localhost:8000/api/v1/biotech/dashboard
```

**Expected headers:**
```
Cache-Control: public, max-age=1800
ETag: "a1b2c3d4e5f6..."
Last-Modified: Thu, 10 Oct 2024 12:00:00 GMT
```

**Test conditional request:**
```bash
# First request
curl -i http://localhost:8000/api/v1/biotech/dashboard > /tmp/first.txt

# Extract ETag from first request
ETAG=$(grep -i "etag:" /tmp/first.txt | cut -d' ' -f2 | tr -d '\r')

# Second request with If-None-Match
curl -i -H "If-None-Match: $ETAG" http://localhost:8000/api/v1/biotech/dashboard
```

**Expected:** Second request returns `304 Not Modified` (no body).

### 5. Service Worker (Static Assets Only)

**Test:** Service worker caches static assets, not API routes.

1. Build and serve production build:
```bash
cd terminal
npm run build
npx serve dist
```

2. Open in browser (use HTTPS or localhost)
3. Open DevTools > Application > Service Workers
4. Verify service worker is "activated and running"
5. Open Network tab
6. Reload page
7. Check requests - static assets should show "(from ServiceWorker)"

**Test API routes NOT cached:**
1. Open Network tab
2. Click "Refresh All"
3. Check API requests - should show "200 OK" from network, not ServiceWorker

**Expected:**
- ✅ Static assets (JS, CSS, HTML) served from ServiceWorker
- ✅ API routes (/api/*) always go to network
- ✅ No background sync or periodic sync

### 6. iOS PWA Installation

**Test:** Install on iOS device and verify fullscreen mode.

**Requirements:**
- iOS device (iPhone/iPad) running iOS 16.4+
- App deployed to HTTPS server
- Safari browser

**Steps:**
1. Open Safari on iOS device
2. Navigate to app URL (e.g., https://your-domain.com)
3. Tap Share button (square with arrow)
4. Scroll down and tap "Add to Home Screen"
5. Verify "Open as Web App" toggle is ON
6. Tap "Add"
7. Launch app from Home Screen

**Expected:**
- ✅ App icon appears on Home Screen
- ✅ App launches in fullscreen (no Safari UI)
- ✅ Top bar respects notch (safe area)
- ✅ Bottom bar respects gesture area (safe area)
- ✅ Refresh button works
- ✅ "LAST REFRESHED" timestamp updates

**Check safe areas:**
- Open app on iPhone with notch (X/11/12/13/14/15)
- Verify header doesn't overlap with notch
- Verify footer doesn't overlap with bottom gesture bar
- Test in portrait and landscape

### 7. Lighthouse PWA Audit

**Test:** Run Lighthouse audit for PWA installability.

**Steps:**
1. Build production version:
```bash
cd terminal && npm run build
```

2. Serve with HTTPS (required for Lighthouse):
```bash
npx serve -s dist -p 3000 --ssl-cert cert.pem --ssl-key key.pem
# OR use ngrok for quick HTTPS:
npx ngrok http 3000
```

3. Open in Chrome
4. Open DevTools (F12)
5. Go to "Lighthouse" tab
6. Select "Progressive Web App" category
7. Click "Analyze page load"

**Expected scores:**
- ✅ Installability: 100/100
- ✅ PWA Optimized: ≥90/100
- ✅ "Registers a service worker"
- ✅ "Web app manifest meets installability requirements"
- ✅ "Configured for a custom splash screen"
- ✅ "Sets a theme color"

### 8. Offline Functionality

**Test:** App shell works offline, API requires network.

1. Open app in browser
2. Let it fully load
3. Open DevTools > Network tab
4. Switch to "Offline" mode
5. Reload page

**Expected:**
- ✅ App UI loads (served from service worker cache)
- ✅ Last cached data displays
- ✅ Clicking "Refresh All" shows error (network unavailable)

### 9. React Query Configuration

**Test:** Verify no auto-refetch behavior.

**Check in code:**
```bash
grep -A 5 "defaultOptions" terminal/src/App.tsx
```

**Expected:**
```typescript
defaultOptions: {
  queries: {
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
  },
}
```

**Manual test:**
1. Open app
2. Switch to another tab
3. Switch back to app tab
4. Check Network tab

**Expected:** Zero network requests on tab focus change.

### 10. WebSocket Disabled

**Test:** Verify WebSocket doesn't auto-connect.

1. Open app with DevTools > Network > WS (WebSocket) filter
2. Wait 30 seconds

**Expected:** No WebSocket connections.

**Check in code:**
```bash
grep "autoConnect" terminal/src/hooks/useMonitoring.ts
```

Should show: `autoConnect = false`

## Performance Benchmarks

### Expected Network Traffic

**Initial Load (first visit):**
- HTML: ~5KB
- JS bundle: ~500KB (production build, minified)
- CSS: ~50KB
- Icons: ~150KB total
- **Total:** ~700KB (one-time download)

**Subsequent Loads (cached):**
- Service worker serves from cache
- **Total:** ~5KB (only HTML from network)

**Manual Refresh:**
- API calls: ~50KB (compressed JSON)
- If unchanged (304): ~200 bytes (headers only)

**Zero Background Traffic:**
- After initial load: **0 KB/min**
- After manual refresh: **0 KB/min**

### Expected API Response Times

**With Cache Hit (304 Not Modified):**
- Dashboard: <10ms
- Trials: <10ms
- News: <10ms

**With Cache Miss (200 OK):**
- Dashboard: 50-200ms
- Trials: 100-300ms
- News: 100-500ms

## Troubleshooting

### Issue: Service Worker Not Registering

**Symptoms:** Lighthouse fails "Registers a service worker"

**Solutions:**
1. Ensure app is served over HTTPS (or localhost)
2. Check browser console for SW registration errors
3. Verify `sw.js` is accessible at `/sw.js`
4. Clear site data and reload

### Issue: Icons Not Showing

**Symptoms:** PWA installs but shows generic icon

**Solutions:**
1. Verify icons exist in `terminal/public/icons/`
2. Check manifest.json references correct paths
3. Regenerate icons: `./scripts/generate-icons.sh`
4. Clear browser cache and reinstall

### Issue: Background Network Requests

**Symptoms:** Network tab shows requests after load

**Solutions:**
1. Run verification script: `./scripts/verify-manual-refresh.sh`
2. Check for:
   - `setInterval` in code
   - WebSocket connections
   - EventSource usage
   - React Query auto-refetch
3. Review DevTools Network > Initiator column

### Issue: Error Banner Not Showing

**Symptoms:** 429/5xx errors don't display banner

**Solutions:**
1. Verify StatusBanner component exists
2. Check TerminalLayout integration
3. Simulate error with backend mock
4. Check browser console for errors

### Issue: Caching Not Working

**Symptoms:** Every refresh downloads full data

**Solutions:**
1. Verify CachingMiddleware is registered in `platform/core/app.py`
2. Check response headers include Cache-Control and ETag
3. Ensure requests include If-None-Match header
4. Check backend logs for 304 responses

## Production Deployment Checklist

Before deploying to production:

- [ ] Run `./scripts/verify-manual-refresh.sh` (all checks pass)
- [ ] Run Lighthouse audit (PWA score ≥90)
- [ ] Test on real iOS device (iPhone/iPad)
- [ ] Test on Android device (Chrome)
- [ ] Test offline functionality
- [ ] Verify zero background network traffic
- [ ] Test manual refresh button
- [ ] Test error banner with 429/5xx
- [ ] Verify safe areas on notched devices
- [ ] Check performance (initial load <3s)
- [ ] Verify HTTPS certificate valid
- [ ] Test in multiple browsers (Safari, Chrome, Firefox)
- [ ] Document deployment URL in README

## Success Metrics

The implementation is successful if:

1. ✅ Zero network requests between manual refreshes
2. ✅ Lighthouse PWA score ≥90
3. ✅ Installs on iOS Home Screen
4. ✅ Runs fullscreen on iOS
5. ✅ Error banner shows on API failures
6. ✅ 304 responses for unchanged data
7. ✅ Service worker caches static assets only
8. ✅ No WebSocket/SSE connections
9. ✅ Safe areas respected on iOS
10. ✅ Manual refresh updates all data

## Next Steps

After successful testing:

1. Deploy to production (HTTPS required)
2. Share installation instructions with users
3. Monitor server logs for 304 cache hit rate
4. Collect user feedback on refresh UX
5. Consider adding optional native wrapper (Capacitor/SwiftUI)

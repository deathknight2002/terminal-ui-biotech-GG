#!/bin/bash
# Manual-Refresh PWA Verification Script
# Validates that all manual-refresh requirements are implemented

set -e

echo "🔍 Manual-Refresh PWA Verification"
echo "=================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track failures
FAILURES=0

# Helper functions
check_pass() {
  echo -e "${GREEN}✅ PASS${NC}: $1"
}

check_fail() {
  echo -e "${RED}❌ FAIL${NC}: $1"
  FAILURES=$((FAILURES + 1))
}

check_warning() {
  echo -e "${YELLOW}⚠️  WARN${NC}: $1"
}

echo "1. Checking PWA Infrastructure"
echo "------------------------------"

# Check manifest exists
if [ -f "terminal/public/manifest.webmanifest" ]; then
  check_pass "manifest.webmanifest exists"
else
  check_fail "manifest.webmanifest missing"
fi

# Check service worker exists
if [ -f "terminal/public/sw.js" ]; then
  check_pass "Service worker (sw.js) exists"
else
  check_fail "Service worker missing"
fi

# Check icons exist
REQUIRED_ICONS=("icon-180.png" "icon-192.png" "icon-256.png" "icon-384.png" "icon-512.png" "icon-512-maskable.png")
ICONS_OK=true
for icon in "${REQUIRED_ICONS[@]}"; do
  if [ -f "terminal/public/icons/$icon" ]; then
    check_pass "Icon $icon exists"
  else
    check_fail "Icon $icon missing"
    ICONS_OK=false
  fi
done

echo ""
echo "2. Checking React Query Configuration"
echo "-------------------------------------"

# Check React Query config for manual-only refresh
if grep -q "refetchOnWindowFocus: false" terminal/src/App.tsx; then
  check_pass "refetchOnWindowFocus disabled"
else
  check_fail "refetchOnWindowFocus not disabled"
fi

if grep -q "refetchOnReconnect: false" terminal/src/App.tsx; then
  check_pass "refetchOnReconnect disabled"
else
  check_fail "refetchOnReconnect not disabled"
fi

if grep -q "refetchInterval: false" terminal/src/App.tsx; then
  check_pass "refetchInterval disabled"
else
  check_fail "refetchInterval not disabled"
fi

echo ""
echo "3. Checking for Background Updaters"
echo "-----------------------------------"

# Check for setInterval in non-demo code
if grep -r "setInterval" terminal/src --include="*.tsx" --include="*.ts" --exclude="GlassUIDemoPage.tsx" | grep -v "clearInterval" | grep -v "// "; then
  check_fail "Found setInterval usage in production code"
else
  check_pass "No setInterval in production code"
fi

# Check WebSocket auto-connect is disabled
if grep -q "autoConnect = false" terminal/src/hooks/useMonitoring.ts; then
  check_pass "WebSocket auto-connect disabled"
else
  check_fail "WebSocket auto-connect not disabled"
fi

# Check for EventSource
if grep -r "EventSource" terminal/src --include="*.tsx" --include="*.ts"; then
  check_fail "Found EventSource usage"
else
  check_pass "No EventSource usage"
fi

echo ""
echo "4. Checking Backend Caching"
echo "---------------------------"

# Check caching middleware exists
if [ -f "platform/core/middleware/caching.py" ]; then
  check_pass "Caching middleware exists"
else
  check_fail "Caching middleware missing"
fi

# Check middleware is registered
if grep -q "CachingMiddleware" platform/core/app.py; then
  check_pass "Caching middleware registered in app"
else
  check_fail "Caching middleware not registered"
fi

# Check for Cache-Control in middleware
if grep -q "Cache-Control" platform/core/middleware/caching.py; then
  check_pass "Cache-Control headers implemented"
else
  check_fail "Cache-Control headers not found"
fi

# Check for ETag support
if grep -q "ETag" platform/core/middleware/caching.py; then
  check_pass "ETag support implemented"
else
  check_fail "ETag support not found"
fi

echo ""
echo "5. Checking Error Banner"
echo "------------------------"

# Check StatusBanner component exists
if [ -f "terminal/src/components/StatusBanner/StatusBanner.tsx" ]; then
  check_pass "StatusBanner component exists"
else
  check_fail "StatusBanner component missing"
fi

# Check for aria-live in StatusBanner
if grep -q 'aria-live="polite"' terminal/src/components/StatusBanner/StatusBanner.tsx; then
  check_pass "StatusBanner has aria-live attribute"
else
  check_fail "StatusBanner missing aria-live"
fi

# Check for role="status" in StatusBanner
if grep -q 'role="status"' terminal/src/components/StatusBanner/StatusBanner.tsx; then
  check_pass "StatusBanner has role=status"
else
  check_fail "StatusBanner missing role=status"
fi

# Check StatusBanner integrated in TerminalLayout
if grep -q "StatusBanner" terminal/src/components/TerminalLayout.tsx; then
  check_pass "StatusBanner integrated in TerminalLayout"
else
  check_fail "StatusBanner not integrated"
fi

echo ""
echo "6. Checking Service Worker"
echo "--------------------------"

# Check service worker doesn't cache API routes
if grep -q "startsWith('/api/')" terminal/public/sw.js; then
  check_pass "Service worker skips API routes"
else
  check_fail "Service worker may cache API routes"
fi

# Check no periodic background sync
if grep -q "periodicSync\|backgroundSync" terminal/public/sw.js; then
  check_fail "Service worker has background sync"
else
  check_pass "No background sync in service worker"
fi

echo ""
echo "7. Checking Documentation"
echo "-------------------------"

# Check README has iOS installation guide
if grep -q "Lighthouse PWA Installability Checklist" README.md; then
  check_pass "README has Lighthouse checklist"
else
  check_fail "README missing Lighthouse checklist"
fi

# Check iOS PWA guide exists
if [ -f "docs/IOS_PWA_GUIDE.md" ]; then
  check_pass "IOS_PWA_GUIDE.md exists"
else
  check_warning "IOS_PWA_GUIDE.md not found (optional)"
fi

# Check refresh model doc exists
if [ -f "docs/REFRESH_MODEL.md" ]; then
  check_pass "REFRESH_MODEL.md exists"
else
  check_warning "REFRESH_MODEL.md not found (optional)"
fi

echo ""
echo "=================================="
echo "Summary"
echo "=================================="

if [ $FAILURES -eq 0 ]; then
  echo -e "${GREEN}✅ All checks passed!${NC}"
  echo ""
  echo "The manual-refresh PWA implementation is complete."
  echo "Next steps:"
  echo "1. Run 'npm run dev' to test locally"
  echo "2. Deploy to HTTPS server"
  echo "3. Test on iOS device (Settings > Safari > Add to Home Screen)"
  echo "4. Run Lighthouse PWA audit"
  exit 0
else
  echo -e "${RED}❌ $FAILURES check(s) failed${NC}"
  echo ""
  echo "Please fix the issues above before deploying."
  exit 1
fi

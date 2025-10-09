#!/bin/bash
# Validation script for manual-refresh model and PWA setup
# This script checks that all required files and configurations are in place

set -e

echo "🔍 Validating Manual-Refresh Model & PWA Implementation..."
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR/.."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_pass() {
    echo -e "${GREEN}✓${NC} $1"
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    exit 1
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

echo "📋 Checking PWA Files..."
echo ""

# Check manifest.webmanifest
if [ -f "$PROJECT_ROOT/terminal/public/manifest.webmanifest" ]; then
    check_pass "manifest.webmanifest exists"
else
    check_fail "manifest.webmanifest is missing"
fi

# Check service worker
if [ -f "$PROJECT_ROOT/terminal/public/sw.js" ]; then
    check_pass "Service worker (sw.js) exists"
else
    check_fail "Service worker is missing"
fi

# Check PWA styles
if [ -f "$PROJECT_ROOT/terminal/src/styles/pwa.css" ]; then
    check_pass "PWA styles (pwa.css) exists"
else
    check_fail "PWA styles are missing"
fi

# Check icon template
if [ -f "$PROJECT_ROOT/terminal/public/icons/icon.svg" ]; then
    check_pass "Icon template (icon.svg) exists"
else
    check_fail "Icon template is missing"
fi

echo ""
echo "📋 Checking Code Changes..."
echo ""

# Check App.tsx for manual-refresh config
if grep -q "refetchOnWindowFocus: false" "$PROJECT_ROOT/terminal/src/App.tsx"; then
    check_pass "QueryClient configured for manual-refresh"
else
    check_fail "QueryClient missing manual-refresh configuration"
fi

# Check index.html for PWA meta tags
if grep -q "viewport-fit=cover" "$PROJECT_ROOT/terminal/index.html"; then
    check_pass "index.html has viewport-fit=cover"
else
    check_fail "index.html missing viewport-fit=cover"
fi

if grep -q "manifest.webmanifest" "$PROJECT_ROOT/terminal/index.html"; then
    check_pass "index.html links to manifest"
else
    check_fail "index.html missing manifest link"
fi

if grep -q "apple-touch-icon" "$PROJECT_ROOT/terminal/index.html"; then
    check_pass "index.html has apple-touch-icon"
else
    check_fail "index.html missing apple-touch-icon"
fi

# Check TerminalLayout for refresh handler
if grep -q "invalidateQueries" "$PROJECT_ROOT/terminal/src/components/TerminalLayout.tsx"; then
    check_pass "TerminalLayout uses invalidateQueries for refresh"
else
    check_fail "TerminalLayout missing invalidateQueries"
fi

if grep -q "lastRefreshed" "$PROJECT_ROOT/terminal/src/components/TerminalLayout.tsx"; then
    check_pass "TerminalLayout tracks lastRefreshed timestamp"
else
    check_fail "TerminalLayout missing lastRefreshed timestamp"
fi

# Check DashboardPage removed refetchInterval
if ! grep -q "refetchInterval" "$PROJECT_ROOT/terminal/src/pages/DashboardPage.tsx"; then
    check_pass "DashboardPage has no refetchInterval (manual-refresh only)"
else
    check_fail "DashboardPage still has refetchInterval"
fi

echo ""
echo "📋 Checking Backend Cache Configuration..."
echo ""

# Check backend cache TTL increased
if grep -q "30 \* 60 \* 1000" "$PROJECT_ROOT/backend/src/services/real-data-service.ts"; then
    check_pass "Backend cache TTL set to 30 minutes"
else
    check_warn "Backend cache TTL may not be configured correctly"
fi

# Check Cache-Control headers
if grep -q "Cache-Control" "$PROJECT_ROOT/backend/src/routes/biotech-data.ts"; then
    check_pass "Backend routes set Cache-Control headers"
else
    check_warn "Backend routes may be missing Cache-Control headers"
fi

echo ""
echo "📋 Checking Documentation..."
echo ""

# Check iOS PWA guide
if [ -f "$PROJECT_ROOT/docs/IOS_PWA_GUIDE.md" ]; then
    check_pass "iOS PWA installation guide exists"
else
    check_fail "iOS PWA guide is missing"
fi

# Check updated REFRESH_MODEL.md
if grep -q "Frontend Manual Refresh" "$PROJECT_ROOT/docs/REFRESH_MODEL.md"; then
    check_pass "REFRESH_MODEL.md updated with frontend details"
else
    check_fail "REFRESH_MODEL.md missing frontend section"
fi

# Check README updated
if grep -q "iOS Progressive Web App" "$PROJECT_ROOT/README.md"; then
    check_pass "README.md has PWA section"
else
    check_fail "README.md missing PWA section"
fi

echo ""
echo "📋 Optional Checks..."
echo ""

# Check if icons are generated
ICON_COUNT=$(ls -1 "$PROJECT_ROOT/terminal/public/icons/"*.png 2>/dev/null | wc -l)
if [ "$ICON_COUNT" -ge 5 ]; then
    check_pass "PWA icons generated ($ICON_COUNT PNG files)"
else
    check_warn "PWA icons not yet generated (run ./scripts/generate-icons.sh)"
fi

# Check if ImageMagick is available
if command -v convert &> /dev/null; then
    check_pass "ImageMagick installed (can generate icons)"
else
    check_warn "ImageMagick not installed (needed for icon generation)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Validation Complete!"
echo ""
echo "📱 Next Steps:"
echo ""
echo "1. Generate PWA icons (if not done):"
echo "   ./scripts/generate-icons.sh"
echo ""
echo "2. Test locally:"
echo "   cd terminal && npm run dev"
echo "   Open http://localhost:3000 in browser"
echo "   Open DevTools → Network tab"
echo "   Verify: Zero requests after initial load"
echo ""
echo "3. Test PWA installation:"
echo "   Deploy to HTTPS server (required for PWA)"
echo "   Open in Safari on iOS 26"
echo "   Share → Add to Home Screen"
echo "   Launch from Home Screen"
echo ""
echo "4. Verify manual refresh:"
echo "   Click refresh button in top bar"
echo "   Verify 'Last Refreshed' timestamp updates"
echo "   Check Network tab for new requests only on refresh"
echo ""
echo "📖 See docs/IOS_PWA_GUIDE.md for detailed instructions"
echo ""

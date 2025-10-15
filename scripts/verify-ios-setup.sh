#!/bin/bash
# iOS Mobile App Setup Verification Script
# Run this to verify your iOS mobile app setup is complete

set -e

echo "🍎 iOS Mobile App Setup Verification"
echo "===================================="
echo ""

ERRORS=0
WARNINGS=0

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check functions
check_pass() {
    echo -e "${GREEN}✓${NC} $1"
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ERRORS=$((ERRORS + 1))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    WARNINGS=$((WARNINGS + 1))
}

# 1. Check if we're on macOS
echo "1. Checking Operating System..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    check_pass "Running on macOS"
else
    check_warn "Not running on macOS - iOS development requires macOS with Xcode"
fi
echo ""

# 2. Check Node.js
echo "2. Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    check_pass "Node.js installed: $NODE_VERSION"
else
    check_fail "Node.js not found - install Node.js 18+"
fi
echo ""

# 3. Check npm
echo "3. Checking npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    check_pass "npm installed: $NPM_VERSION"
else
    check_fail "npm not found"
fi
echo ""

# 4. Check if mobile directory exists
echo "4. Checking mobile directory..."
if [ -d "mobile" ]; then
    check_pass "mobile/ directory exists"
else
    check_fail "mobile/ directory not found"
fi
echo ""

# 5. Check Capacitor configuration
echo "5. Checking Capacitor configuration..."
if [ -f "mobile/capacitor.config.ts" ]; then
    check_pass "capacitor.config.ts exists"
else
    check_fail "capacitor.config.ts not found"
fi
echo ""

# 6. Check iOS project
echo "6. Checking iOS native project..."
if [ -d "mobile/ios" ]; then
    check_pass "iOS project directory exists"
    
    if [ -f "mobile/ios/App/App.xcworkspace/contents.xcworkspacedata" ]; then
        check_pass "Xcode workspace configured"
    else
        check_warn "Xcode workspace may need to be regenerated"
    fi
    
    if [ -f "mobile/ios/App/Podfile" ]; then
        check_pass "Podfile exists"
    else
        check_fail "Podfile not found"
    fi
else
    check_fail "iOS project not found - run: cd mobile && npx cap add ios"
fi
echo ""

# 7. Check if Xcode is installed (macOS only)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "7. Checking Xcode..."
    if command -v xcodebuild &> /dev/null; then
        XCODE_VERSION=$(xcodebuild -version | head -n 1)
        check_pass "Xcode installed: $XCODE_VERSION"
    else
        check_fail "Xcode not found - install from Mac App Store"
    fi
    echo ""
    
    # 8. Check CocoaPods
    echo "8. Checking CocoaPods..."
    if command -v pod &> /dev/null; then
        POD_VERSION=$(pod --version)
        check_pass "CocoaPods installed: $POD_VERSION"
    else
        check_warn "CocoaPods not installed - run: sudo gem install cocoapods"
    fi
    echo ""
fi

# 9. Check if dependencies are installed
echo "9. Checking dependencies..."
if [ -d "mobile/node_modules/@capacitor" ]; then
    check_pass "Capacitor packages installed"
else
    check_warn "Capacitor packages not installed - run: cd mobile && npm install"
fi
echo ""

# 10. Check if web assets are built
echo "10. Checking web assets..."
if [ -d "mobile/dist" ]; then
    check_pass "mobile/dist/ exists"
    
    if [ -f "mobile/dist/index.html" ]; then
        check_pass "Web assets built"
    else
        check_warn "Web assets may be incomplete - run: npm run build:mobile"
    fi
else
    check_warn "mobile/dist/ not found - run: npm run build:mobile"
fi
echo ""

# 11. Check frontend-components build
echo "11. Checking frontend components..."
if [ -d "frontend-components/dist" ]; then
    check_pass "frontend-components built"
else
    check_warn "frontend-components not built - run: npm run build:components"
fi
echo ""

# Summary
echo ""
echo "===================================="
echo "Summary:"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "You're ready to build the iOS app!"
    echo ""
    echo "Next steps:"
    echo "1. cd mobile"
    echo "2. npm run cap:open:ios"
    echo "3. In Xcode: Select your device and click Run (▶)"
    echo ""
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ Setup complete with $WARNINGS warning(s)${NC}"
    echo ""
    echo "You should be able to build, but review warnings above."
    echo ""
else
    echo -e "${RED}✗ Setup incomplete - $ERRORS error(s), $WARNINGS warning(s)${NC}"
    echo ""
    echo "Fix errors above before proceeding."
    echo ""
fi

echo "For detailed setup instructions, see:"
echo "- docs/IOS_NATIVE_APP_GUIDE.md"
echo "- docs/IOS_QUICK_REFERENCE.md"
echo ""

exit $ERRORS

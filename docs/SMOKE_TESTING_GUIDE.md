# Smoke Testing Guide

Comprehensive guide for testing all front-end UI features on both mobile and desktop platforms.

## Quick Start

### Option 1: Full Automated Smoke Test (Recommended)

Run the complete automated smoke test suite:

```bash
npm run smoke-test
```

This will:
- ✓ Verify all dependencies are installed
- ✓ Check mobile and desktop platform setup
- ✓ Validate TypeScript configuration
- ✓ Run linting checks
- ✓ Build all workspaces
- ✓ Test dev servers startup
- ✓ Provide detailed error messages with codes and timestamps

**Expected duration:** 5-10 minutes (includes building)

### Option 2: Quick Pre-flight Check

For a faster verification of your development environment:

```bash
npm run preflight
```

This quick check verifies:
- Node.js and npm installation
- Project structure
- Dependencies installation
- Port availability
- Basic configuration files

**Expected duration:** 10-30 seconds

### Option 3: Mobile-Specific Setup Verification

For detailed mobile installation guidance:

```bash
npm run verify:mobile
```

This provides:
- Step-by-step mobile setup verification
- Extremely clear error messages
- Specific solutions for each problem
- Interactive progress reporting

**Expected duration:** 1-2 minutes

## Error Codes Reference

All smoke tests use standardized error codes for easy identification:

| Code | Issue | Common Solution |
|------|-------|-----------------|
| **E001** | Dependencies not installed | Run `npm install` in root directory |
| **E002** | Build failed | Check TypeScript errors, ensure dependencies installed |
| **E003** | Test failed | Review test output, fix failing tests |
| **E004** | Linting failed | Run `npm run lint` and fix reported issues |
| **E005** | TypeScript check failed | Run `npm run typecheck` and fix type errors |
| **E006** | Configuration file missing | Ensure repository is properly cloned |
| **E007** | Mobile setup invalid | Verify mobile workspace structure and dependencies |
| **E008** | Desktop setup invalid | Verify terminal workspace structure and dependencies |
| **E009** | Component missing | Rebuild frontend-components: `npm run build:components` |
| **E010** | Route invalid | Check route configuration in App.tsx |

## Manual Testing Procedures

### Desktop/Terminal App Testing

#### 1. Start the Terminal App

```bash
# Build components first (required)
npm run build:components

# Start terminal app
npm run dev:terminal
```

Access at: `http://localhost:3000`

#### 2. Test All Routes

Navigate to each page and verify it loads without errors:

**Core Pages:**
- [x] Dashboard: `http://localhost:3000/`
- [x] News: `http://localhost:3000/news`
- [x] Clinical Trials: `http://localhost:3000/trials`
- [x] Pipeline: `http://localhost:3000/pipeline`
- [x] Financial Modeling: `http://localhost:3000/financial`
- [x] Market Intelligence: `http://localhost:3000/intelligence`
- [x] Data Explorer: `http://localhost:3000/explorer`
- [x] Epidemiology: `http://localhost:3000/science/epidemiology`

**Financial Pages:**
- [x] Financials Overview: `http://localhost:3000/financials/overview`
- [x] Price Targets: `http://localhost:3000/financials/price-targets`
- [x] LoE Cliff Analysis: `http://localhost:3000/financials/loe-cliff`
- [x] DCF & Multiples: `http://localhost:3000/financials/dcf`
- [x] Consensus vs House: `http://localhost:3000/financials/consensus`

**Other Pages:**
- [x] Catalyst Calendar: `http://localhost:3000/catalysts/calendar`
- [x] Competitors Spiderweb: `http://localhost:3000/competitors/spiderweb`
- [x] Data Catalog: `http://localhost:3000/data/catalog`
- [x] Audit Log: `http://localhost:3000/data/provenance`

#### 3. Check Console for Errors

Open browser DevTools (F12) and check for:
- ❌ No red error messages
- ⚠️  Warnings are acceptable but should be investigated
- ✅ Successful API calls (if backend is running)

#### 4. Test Responsive Design

In DevTools, test different screen sizes:
- Desktop: 1920x1080
- Laptop: 1366x768
- Tablet: 768x1024

### Mobile App Testing

#### 1. Start the Mobile App

```bash
# Build components first (required)
npm run build:components

# Start mobile app
npm run dev:mobile
```

Access at: `http://localhost:3002`

#### 2. Test Mobile Routes

Navigate to each mobile page:

- [x] Dashboard: `http://localhost:3002/dashboard`
- [x] Pipeline: `http://localhost:3002/pipeline`
- [x] Trials: `http://localhost:3002/trials`
- [x] Financial: `http://localhost:3002/financial`
- [x] Intelligence: `http://localhost:3002/intelligence`
- [x] News: `http://localhost:3002/news`

#### 3. Test Mobile-Specific Features

**Device Emulation:**

In Chrome DevTools:
1. Press `Ctrl+Shift+M` (Windows/Linux) or `Cmd+Shift+M` (Mac)
2. Select device: iPhone 14 Pro, iPhone SE, iPad
3. Test both portrait and landscape orientations

**Test Checklist:**

Navigation:
- [x] Hamburger menu opens
- [x] Navigation drawer shows all sections
- [x] Bottom tab bar displays correctly
- [x] Tab navigation works
- [x] Active tab is highlighted

Layout:
- [x] Content fits screen without horizontal scroll
- [x] Cards stack vertically
- [x] Text is readable without zooming
- [x] Touch targets are at least 44x44pt
- [x] Safe area insets respected (notch/home indicator)

Touch Interactions:
- [x] Tap actions respond
- [x] Swipe gestures work (if implemented)
- [x] Pinch-to-zoom disabled appropriately
- [x] Refresh button works
- [x] All buttons are tappable

Visual:
- [x] Aurora background renders
- [x] Glass panels display correctly
- [x] Charts scale to mobile width
- [x] Metrics display clearly
- [x] Status badges show properly

#### 4. Test on Real Devices

**iOS Testing:**

1. Find your local IP address:
   ```bash
   # macOS/Linux
   ifconfig | grep "inet "
   
   # Windows
   ipconfig
   ```

2. Access from iPhone Safari:
   ```
   http://YOUR_IP_ADDRESS:3002
   ```

3. Add to Home Screen:
   - Tap Share button
   - Select "Add to Home Screen"
   - Test PWA functionality

**Android Testing:**

1. Same IP address approach
2. Open in Chrome
3. Test "Add to Home screen"

### Backend Testing (Optional)

If testing with real data:

```bash
# Start Python backend
npm run dev:backend

# Or manually
poetry run uvicorn platform.core.app:app --reload --port 3001
```

Access API at: `http://localhost:3001/docs` (Swagger UI)

## Common Issues and Solutions

### Issue: Dependencies not installed

**Error:** `E001 - Dependencies are not installed`

**Solution:**
```bash
cd /path/to/terminal-ui-biotech-GG
npm install
```

### Issue: Frontend components not built

**Error:** Mobile or terminal fails to load with module errors

**Solution:**
```bash
# Build components first
npm run build:components

# Then start your app
npm run dev:mobile  # or npm run dev:terminal
```

### Issue: Port already in use

**Error:** `EADDRINUSE: address already in use`

**Solution:**
```bash
# Find process using the port (3000, 3002, or 3001)
lsof -i :3002  # macOS/Linux
netstat -ano | findstr :3002  # Windows

# Kill the process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows

# Or use a different port in vite.config.ts
```

### Issue: TypeScript errors

**Error:** `E005 - TypeScript check failed`

**Solution:**
```bash
# Check specific workspace
cd mobile  # or terminal, or frontend-components
npm run typecheck

# Fix reported errors
# Common fixes:
# - Add missing imports
# - Fix type annotations
# - Update dependencies
```

### Issue: Mobile layout broken

**Symptoms:** Content overflows, not responsive

**Solution:**
1. Clear browser cache (Ctrl+Shift+Delete)
2. Rebuild components: `npm run build:components`
3. Restart dev server: `npm run dev:mobile`
4. Check viewport meta tag in mobile/index.html
5. Verify CSS imports in mobile/src/main.tsx

### Issue: Aurora background not showing

**Solution:**
1. Check CSS imports order in main.tsx
2. Verify glass-ui-enhanced.css is loaded
3. Check browser console for CSS errors
4. Clear browser cache

## Performance Testing

### Load Time Testing

1. Open DevTools Network tab
2. Disable cache
3. Reload page
4. Check metrics:
   - **First Contentful Paint:** < 1.5s
   - **Largest Contentful Paint:** < 2.5s
   - **Time to Interactive:** < 3.5s

### Mobile Performance

1. Use Chrome DevTools Performance tab
2. Enable CPU throttling (4x slowdown)
3. Enable network throttling (Fast 3G)
4. Record page load
5. Check for:
   - Smooth animations (60fps)
   - No layout shifts
   - Quick interaction response

## Automated Testing

### Run All Tests

```bash
# All workspaces
npm run test

# Specific workspace
npm run test:mobile
npm run test:terminal
npm run test:components
```

### Run Linting

```bash
# All workspaces
npm run lint

# Specific workspace
npm run lint:mobile
npm run lint:terminal
npm run lint:components
```

### Build All

```bash
# Build everything
npm run build

# Build specific workspace
npm run build:mobile
npm run build:terminal
npm run build:components
```

## Continuous Testing

For development, use watch modes:

```bash
# Terminal app with hot reload
cd terminal && npm run dev

# Mobile app with hot reload
cd mobile && npm run dev

# Components with rebuild on change
cd frontend-components && npm run dev
```

## Reporting Issues

When reporting issues found during smoke testing:

1. **Include error code** (e.g., E001, E007)
2. **Include timestamp** (when the error occurred)
3. **Include full error message** from console or terminal
4. **Include steps to reproduce**
5. **Include environment info:**
   - OS: macOS/Windows/Linux
   - Node version: `node --version`
   - Browser: Chrome/Safari/Firefox + version
   - Device (if mobile testing): iPhone model, Android device

## Success Criteria

✅ **All tests pass if:**

- All dependencies installed without errors
- All pages load without console errors
- TypeScript validation passes
- Linting passes (or warnings only)
- Builds complete successfully
- Dev servers start on correct ports
- Mobile layout is responsive
- Desktop layout is functional
- All routes navigate correctly
- Touch interactions work on mobile
- No critical errors in browser console

## Next Steps After Smoke Testing

Once all smoke tests pass:

1. **Development Ready:** Start building new features
2. **Testing Ready:** Begin integration and E2E testing
3. **Deployment Ready:** Proceed with production build
4. **Documentation Ready:** Update user-facing documentation

## Additional Resources

- **Mobile Setup:** `mobile/README.md`
- **iOS PWA Guide:** `docs/IOS_PWA_GUIDE.md`
- **Cross-Platform Testing:** `docs/CROSS_PLATFORM_TESTING_GUIDE.md`
- **Feature Verification:** `docs/FEATURE_AUDIT_AND_DEPLOYMENT_VERIFICATION.md`
- **Installation Guide:** `INSTALLATION.md`
- **Main README:** `README.md`

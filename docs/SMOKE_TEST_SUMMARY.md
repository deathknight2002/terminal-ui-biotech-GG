# Smoke Testing Tools - Summary

**Complete overview of all smoke testing and quality assurance tools available.**

## 🎯 Overview

This project provides **4 comprehensive smoke testing tools** to ensure your development environment and applications are properly set up and functioning correctly:

1. **Preflight Check** - Quick environment verification (30 seconds)
2. **Mobile Setup Verification** - Interactive mobile setup guide (2 minutes)
3. **Automated Smoke Test** - Full feature testing (5-10 minutes)
4. **Interactive UI Test** - Manual testing with visual checklist

## 🚀 Quick Reference

| Tool | Use Case | Duration | Command |
|------|----------|----------|---------|
| **Preflight Check** | Quick environment check before starting work | 30s | `npm run preflight` |
| **Mobile Verification** | First-time mobile setup with guidance | 2min | `npm run verify:mobile` |
| **Automated Smoke Test** | Full testing before deployment | 5-10min | `npm run smoke-test` |
| **Quick Smoke Test** | Fast checks without builds | 10s | `npm run smoke-test:quick` |
| **Interactive UI Test** | Manual feature verification | Variable | Open `docs/INTERACTIVE_SMOKE_TEST.html` |

## 📋 Tool Details

### 1. Preflight Check (`npm run preflight`)

**Purpose:** Quickly verify your development environment is ready.

**What it checks:**
- ✅ Node.js and npm installation
- ✅ Python and Poetry (for backend)
- ✅ Git installation
- ✅ Root dependencies installed
- ✅ Workspace dependencies (mobile, terminal, components, backend)
- ✅ Mobile platform files
- ✅ Desktop platform files
- ✅ Component library build status
- ✅ Port availability (3000, 3001, 3002)

**Output:**
```bash
========================================
Pre-flight Check Summary
========================================

Results:
  ✓ Passed: 23
  ✗ Failed: 2
  ⚠ Warnings: 1

✓ Pre-flight check PASSED
Your development environment is ready!
```

**When to use:**
- Before starting development each day
- After pulling new code
- When encountering setup issues
- Before running the full smoke test

**Script:** `scripts/preflight-check.sh`

---

### 2. Mobile Setup Verification (`npm run verify:mobile`)

**Purpose:** Provide step-by-step guidance for mobile app setup with extremely clear error messages.

**Features:**
- 📱 10 interactive steps with progress tracking
- 💡 Detailed error messages with error codes and timestamps
- 🔧 Specific solutions for every problem
- ✅ Success confirmation with next steps
- 📖 Helpful instructions throughout

**Steps verified:**
1. Node.js installation and version
2. npm package manager
3. Project structure
4. Root dependencies
5. Mobile workspace completeness
6. Mobile dependencies
7. Frontend components build
8. Mobile page components
9. TypeScript configuration
10. Dev server startup test

**Output example:**
```bash
━━━ Step 1: Verify Node.js Installation ━━━
[✓ SUCCESS] Node.js v20.19.5 is installed (minimum: v18.0.0)

━━━ Step 5: Verify Mobile Workspace ━━━
[✓ SUCCESS] Mobile package configuration: package.json
[✓ SUCCESS] Mobile app HTML entry point: index.html
```

**When to use:**
- First time setting up mobile app
- After cloning repository
- When mobile app isn't working
- To understand what's missing

**Script:** `scripts/verify-mobile-setup.sh`

---

### 3. Automated Smoke Test (`npm run smoke-test`)

**Purpose:** Comprehensive automated testing of all features and configurations.

**Full Test (5-10 minutes):**
```bash
npm run smoke-test
```

Runs 8 test phases:
1. Dependency verification
2. Mobile platform setup
3. Desktop platform setup
4. TypeScript validation
5. Code quality (linting)
6. Build verification
7. Mobile dev server test
8. Desktop dev server test

**Quick Test (10 seconds):**
```bash
npm run smoke-test:quick
```

Runs only phases 1-3 (dependency and structure checks).

**Error codes:**
- `E001`: Dependencies not installed
- `E002`: Build failed
- `E003`: Test failed
- `E004`: Linting failed
- `E005`: TypeScript check failed
- `E006`: Configuration file missing
- `E007`: Mobile setup invalid
- `E008`: Desktop setup invalid
- `E009`: Component missing
- `E010`: Route invalid

**Output example:**
```bash
================================================================================
Test Summary
================================================================================

Total Tests: 30
✓ Passed: 28
✗ Failed: 2
⚠ Warnings: 0
Duration: 127.45s

✓ ALL SMOKE TESTS PASSED
The application is ready for use on both mobile and desktop platforms.
```

**When to use:**
- Before creating a pull request
- Before deployment
- After major refactoring
- Weekly quality check
- CI/CD pipeline integration

**Script:** `scripts/smoke-test.js`

---

### 4. Interactive UI Test (`docs/INTERACTIVE_SMOKE_TEST.html`)

**Purpose:** Manual feature testing with visual progress tracking.

**Features:**
- 🎨 Beautiful terminal-themed UI
- ✅ Click to mark tests as passed/failed
- 💾 Auto-saves test state to browser
- 📊 Real-time progress tracking
- 📄 Export test results report
- 🔄 Reset tests option

**Test coverage:**
- **Desktop/Terminal:** 18 tests
  - All major pages and routes
  - Console error checking
  - Navigation functionality
  - Responsive design
  - Visual elements (Aurora, themes)

- **Mobile:** 23 tests
  - All mobile pages
  - Mobile layouts (iPhone SE, 14, iPad)
  - Navigation (hamburger menu, tabs)
  - Touch interactions
  - Visual elements
  - Orientation support

**How to use:**
1. Open `docs/INTERACTIVE_SMOKE_TEST.html` in browser
2. Start mobile or desktop dev server
3. Click through each test item
4. Mark as passed (✓) or failed (✗)
5. Export report when done

**When to use:**
- Manual QA testing
- Before release
- User acceptance testing
- Demonstrating features
- Training new developers

---

## 🎨 Visual Comparison

### Preflight Check
```
Quick verification ────┐
                       │
No detailed guidance   │  ← Fast, automated
                       │
Pass/Fail output      ─┘
```

### Mobile Verification
```
Step-by-step guide ───┐
                      │
Very detailed errors  │  ← Educational, helpful
                      │
Interactive prompts  ─┘
```

### Automated Smoke Test
```
Full test suite ──────┐
                      │
Comprehensive checks  │  ← Complete, thorough
                      │
Detailed report      ─┘
```

### Interactive UI Test
```
Manual checklist ─────┐
                      │
Visual interface      │  ← Hands-on, visual
                      │
Exportable results   ─┘
```

## 🔧 Error Code Reference

| Code | Issue | Solution |
|------|-------|----------|
| **E001** | Dependencies not installed | `npm install` |
| **E002** | Build failed | Fix TypeScript/build errors |
| **E003** | Test failed | Fix failing tests |
| **E004** | Linting failed | `npm run lint` and fix issues |
| **E005** | TypeScript errors | `npm run typecheck` and fix |
| **E006** | Config file missing | Check repository structure |
| **E007** | Mobile setup invalid | Run `npm run verify:mobile` |
| **E008** | Desktop setup invalid | Check terminal workspace |
| **E009** | Component missing | `npm run build:components` |
| **E010** | Route invalid | Check route configuration |

## 📊 Testing Workflow

### Daily Development
```bash
# Morning: Quick check
npm run preflight

# Development work...

# Before committing
npm run smoke-test:quick
```

### First-Time Setup
```bash
# 1. Clone repository
git clone <repo>

# 2. Verify mobile setup
npm run verify:mobile

# 3. Follow the interactive guide
# (installs dependencies, builds components, starts server)

# 4. Quick smoke test
npm run smoke-test:quick
```

### Before Deployment
```bash
# 1. Full automated test
npm run smoke-test

# 2. Manual UI testing
open docs/INTERACTIVE_SMOKE_TEST.html

# 3. Review all results
# Ensure 100% pass rate
```

### Continuous Integration
```yaml
# .github/workflows/test.yml
- name: Run smoke tests
  run: npm run smoke-test:quick

- name: Full smoke test (weekly)
  if: github.event.schedule
  run: npm run smoke-test
```

## 🎯 Success Criteria

### Preflight Check
- ✅ All dependencies installed
- ✅ All files present
- ✅ Ports available

### Mobile Verification
- ✅ All 10 steps complete
- ✅ Dev server starts
- ✅ Can access at localhost:3002

### Automated Smoke Test
- ✅ 0 failed tests
- ✅ All builds succeed
- ✅ Dev servers start

### Interactive UI Test
- ✅ All pages load
- ✅ No console errors
- ✅ All features work

## 📚 Documentation

- [Smoke Testing Guide](SMOKE_TESTING_GUIDE.md) - Comprehensive testing procedures
- [Mobile Quick Start](MOBILE_QUICK_START.md) - Mobile-specific setup
- [iOS PWA Guide](IOS_PWA_GUIDE.md) - iOS installation and testing
- [Cross-Platform Testing](CROSS_PLATFORM_TESTING_GUIDE.md) - Multi-platform verification
- [Feature Audit](FEATURE_AUDIT_AND_DEPLOYMENT_VERIFICATION.md) - Feature verification

## 💡 Tips & Best Practices

1. **Run preflight daily** - Catches issues early
2. **Use verify:mobile for new setups** - Saves time with clear guidance
3. **Run full smoke test before PRs** - Ensures quality
4. **Use interactive test for demos** - Visual and clear
5. **Check error codes** - Each has specific solution
6. **Keep tests updated** - Add new features to checklists

## 🔍 Troubleshooting

### Tests failing consistently?
1. Run `npm install` again
2. Clear node_modules: `rm -rf node_modules package-lock.json`
3. Reinstall: `npm install`
4. Build components: `npm run build:components`

### Mobile verification stuck?
- Check port 3002 is free
- Verify firewall isn't blocking
- Try different browser
- Check console for errors

### Dev servers won't start?
1. Kill processes on ports: `lsof -i :3000,3001,3002`
2. Check for syntax errors: `npm run typecheck`
3. Ensure components built: `npm run build:components`

### Interactive test not loading?
- Open in modern browser (Chrome, Firefox, Safari)
- Check browser console for errors
- Try different browser
- Ensure file isn't blocked by security

## 🚀 Next Steps

After smoke tests pass:

1. **Start developing**: All systems ready
2. **Review documentation**: Understand features
3. **Explore examples**: See components in action
4. **Deploy confidently**: Tests ensure quality

## 📞 Getting Help

1. Check error code in output
2. Read specific solution provided
3. Review relevant documentation
4. Check GitHub issues
5. Run verification scripts for guidance

---

**Remember:** These tools are here to help you succeed. Use them often, read the error messages carefully, and follow the suggested solutions. Every error code has a specific fix!

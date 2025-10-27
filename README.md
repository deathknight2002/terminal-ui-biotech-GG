# 🧬 Biotech Terminal Platform

> **Open-source biotech data intelligence platform** with Bloomberg Terminal aesthetics, built on OpenBB architecture patterns.

A comprehensive **React/TypeScript frontend** + **Python FastAPI backend** platform for pharmaceutical data visualization, drug development pipeline tracking, and biotech market intelligence.

**🆓 100% Free Data Sources** - No paid APIs, no rate limits, no account sign-ups required!

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.9+](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/downloads/)
[![Node.js 18+](https://img.shields.io/badge/node.js-18+-green.svg)](https://nodejs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com/)
[![React 18](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)

## 🎯 Key Features

- 📊 **Real-time Market Data** - Yahoo Finance integration (40+ biotech stocks, 4 ETFs)
- 🧬 **Clinical Trials Tracking** - Live data from ClinicalTrials.gov
- 🏛️ **FDA Calendar** - PDUFA dates, drug approvals, regulatory events
- 💼 **Insider Trading** - SEC Form 4 filings from EDGAR database
- 📈 **Analyst Ratings** - Institutional ownership, price targets, recommendations
- 📉 **IV Catalyst Tracker** - Implied volatility signals for asymmetric biotech setups ⭐ NEW!
- 🎨 **Bloomberg-style UI** - Professional terminal aesthetics
- 📱 **Progressive Web App** - Install on iOS/Android like a native app
- 🔒 **100% Free** - No paid APIs, all data from public sources

## 🆕 New Platform Features

- 🧪 **E2E Testing** - Playwright tests for Evidence Graph and platform features
- 🎨 **Code Quality** - Pre-commit hooks with Black, Flake8, isort, Prettier
- 📊 **Observability** - Structured logging, Prometheus metrics, Sentry integration
- 🔐 **API Authentication** - Optional token-based auth for write operations
- 💾 **SQLite Storage** - High-performance database for Evidence Graph (replaces JSON)

📖 **[See Full Implementation Guide](./FEATURES_IMPLEMENTATION_GUIDE.md)** | **[Quick Reference](./FEATURES_QUICK_REFERENCE.md)**

## 🧬 Evidence Graph

**Manual-refresh-only visual analytics** for tracking pharmaceutical evidence as a time-aware graph with deltas (ΔPoS, ΔSentiment, ΔTAM).

The Evidence Graph provides a D3-powered force-directed graph visualization for exploring relationships between theses, evidence, data points, and catalysts in pharmaceutical research. Built on a **manual-refresh-only architecture** to ensure predictable data loading and cache-friendly operation.

### Key Capabilities
- 📊 **Node Types**: Thesis, Evidence, Data, Catalyst
- 🔗 **Edge Relations**: supports, refutes, updates, depends_on
- 📈 **Time-Aware Deltas**: Track Probability of Success (ΔPoS), Sentiment (ΔSentiment), TAM changes (ΔTAM)
- 🎯 **Timeline Scrubber**: Visualize how theses evolve over time
- 🔍 **Edge Screening**: Filter by confidence, delta magnitude, date ranges
- ⚡ **ETag Caching**: HTTP conditional requests for efficient data loading

### Documentation

- 📖 **[Docs Hub](./docs/evidence-graph/EVIDENCE_GRAPH_INDEX.md)** - Central navigation for all Evidence Graph documentation
- 🚀 **[Quickstart Guide](./docs/evidence-graph/EVIDENCE_GRAPH_QUICKSTART.md)** - Get up and running in 5 minutes
- 📝 **[Implementation Summary](./docs/evidence-graph/EVIDENCE_GRAPH_IMPLEMENTATION_SUMMARY.md)** - Technical overview and architecture
- 🎥 **[Visual Demonstration](./docs/evidence-graph/VISUAL_DEMONSTRATION.md)** - Screenshots and usage examples
- 📋 **[PR Summary](./docs/evidence-graph/PR_SUMMARY.md)** - Pull request summary and changes
- 📚 **[README](./docs/evidence-graph/EVIDENCE_GRAPH_README.md)** - Detailed feature documentation
- 🔧 **[Operations Runbook](./docs/evidence-graph/RUNBOOK.md)** - SLOs, health checks, troubleshooting

### Architecture
- **Backend**: FastAPI with SQLite storage
- **Frontend**: React + D3.js force graph
- **Refresh Model**: Manual-only (no WebSocket, no polling)
- **API**: RESTful with ETag support for caching
- **Testing**: Comprehensive smoke test suite ([`test_evidence_graph.sh`](./test_evidence_graph.sh))

### Quick Access
```bash
# Start Evidence Graph API
python3 standalone_evidence_api.py

# Run smoke tests
bash test_evidence_graph.sh

# Access UI
# Navigate to: http://localhost:3000/evidence-graph
```

## 📉 IV Catalyst Tracker - Asymmetric Biotech Setups

**NEW FEATURE**: Identify high-conviction trading opportunities using implied volatility spikes ahead of biotech catalysts.

The IV Catalyst system monitors options market data to detect early accumulation of optionality before known events (PDUFAs, readouts, AdComms), surfacing setups where IV expansion precedes price movement.

### Key Capabilities
- 🎯 **Signal Generation**: 4-flag system (backwardation, IV/RV ratio, skew shift, OI spike)
- 📊 **Quality Scoring**: High/Medium/Low tiers based on signal strength and IV percentile
- 📅 **Catalyst Calendar**: Timeline view with IV heatmap (D-30 → D+5)
- 🔍 **Peer Comparison**: Compare IV metrics across same MOA/therapeutic area
- ⚡ **Spark Tiles**: Compact price + IV visualization
- 📈 **Term Structure**: Detect backwardation (7D > 30D IV inversion)

### Signal Rules (Any 2 = Alert)
1. **Backwardation**: 7D IV ↑ >20% w/w AND 7D-30D term structure inverts
2. **IV/RV Elevated**: IV/20D RV >1.4 while 5D return between -2% and +2%
3. **Skew Shift**: 30D call-skew ↑ >10 delta-points vs 20D median
4. **OI Spike**: New OI at event-relevant strikes >2× 30D average

### Quick Access
```bash
# Seed sample IV data (demo mode)
poetry run python -m bt_platform.core.etl.seed_iv_data --quick

# Compute signals
curl -X POST http://localhost:8000/api/v1/iv/compute-signals

# Access UI
# Navigate to: http://localhost:3000/catalysts/iv
```

### Documentation
- 📖 **[IV Catalyst Playbook](./docs/IV_CATALYST_PLAYBOOK.md)** - Entry/exit strategies, position sizing, risk management
- 📝 **[Implementation Guide](./docs/IV_CATALYST_IMPLEMENTATION.md)** - Technical architecture, API reference, setup
- 🎯 **API Endpoints**: `/api/v1/iv/signals`, `/api/v1/iv/calendar`, `/api/v1/iv/stats/{ticker}`

### Architecture
- **Backend**: Python FastAPI with SQLAlchemy ORM
- **Data Models**: OptionsIV (term structure), PriceData (realized vol), IVCatalystSignal (pre-computed)
- **ETL Pipeline**: Synthetic IV generation for demo (production: integrate real options provider)
- **Frontend**: React components (IVCatalystPage, IVCatalystHeatmap, IVPeerComparison, IVSparkTile)

### Risk-Reward Framework
- **Pre-Event**: Debit call spreads or calendar spreads if IV <85th percentile
- **Avoid**: Naked premium when IV >90th percentile (already priced in)
- **Post-Event**: IV collapses - favor delta expressions (stock) or fade pops with put spreads

## 📊 Proprietary Data Collection

The platform uses **proprietary scrapers** to collect data from free, unlimited sources:

| Data Source | What We Get | Cost | Rate Limit |
|------------|-------------|------|------------|
| **Yahoo Finance** | Prices, volumes, analyst ratings, ownership | Free | Unlimited* |
| **ClinicalTrials.gov** | Active trials, phases, enrollment | Free | Unlimited |
| **FDA.gov** | Drug approvals, PDUFA dates | Free | Unlimited |
| **SEC EDGAR** | Form 4 insider trading filings | Free | 10 req/sec |

*With respectful scraping practices (rate limiting, caching)

📖 **[See Full Data Architecture Documentation](./DATA_COLLECTION_ARCHITECTURE.md)**

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** and **npm**
- **Python 3.9+** and **pip**

### 1. Install Dependencies

**One-command setup for Windows:**
```powershell
.\scripts\setup.ps1
```

**One-command setup for macOS/Linux:**
```bash
./scripts/setup.sh
```

### 2. Fetch Live Data

**Collect real-time biotech data from free sources:**
```bash
./scripts/fetch-live-data.sh
```

This runs the Python scraper to collect:
- Market data from Yahoo Finance (40+ stocks, 4 ETFs)
- Clinical trials from ClinicalTrials.gov
- FDA calendar events (PDUFA dates, approvals)
- Insider trading from SEC EDGAR

Output: `live_biotech_data.json` (used by backend APIs)

### 3. Start Development

```bash
# Windows
.\scripts\setup.ps1 dev

# macOS/Linux
./scripts/setup.sh dev
```

**Platform will be running at:**
- 🔧 **Backend API**: http://localhost:8000
- 📖 **API Documentation**: http://localhost:8000/docs
- 🖥️ **Web Terminal Application**: http://localhost:3000
- 💻 **CLI Terminal (TUI)**: `python3 -m bt_platform.tui`

### Manual Data Refresh

To update data while the app is running:
```bash
# Terminal 1: Backend and frontend are running
# Terminal 2: Refresh data
cd backend/python-scrapers && python biotech_scraper.py

# Backend will automatically serve new data on next request
```

## 📱 iOS Progressive Web App (PWA)

The Biotech Terminal is optimized for iOS 26 as a Progressive Web App. Install it on your iPhone/iPad for a native app experience.

### Quick Install (iOS 26)

1. Open Safari and navigate to the terminal URL (must be HTTPS in production)
2. Tap the **Share** button (square with arrow pointing up)
3. Scroll down and tap **"Add to Home Screen"**
4. Ensure **"Open as Web App"** toggle is **ON** (default in iOS 26)
5. Edit the name if desired, then tap **Add**
6. The app icon appears on your Home Screen
7. Launch from Home Screen for fullscreen standalone mode

**Alternative (iOS 16+):**
- Safari may show an install banner at the bottom of the page
- Tap "Install" on the banner for one-tap installation

### Lighthouse PWA Installability Checklist

Before deploying, verify your PWA passes these checks:

- ✅ **HTTPS required** - PWAs must be served over HTTPS (or localhost for dev)
- ✅ **Web app manifest** - `manifest.webmanifest` with name, icons, start_url, display
- ✅ **Service worker** - Registered and active (handles offline/caching)
- ✅ **Icons** - Multiple sizes provided (180px for iOS, 192px+ for Android)
- ✅ **Viewport meta tag** - `viewport-fit=cover` for iPhone notch support
- ✅ **Apple touch icon** - `<link rel="apple-touch-icon">` for iOS
- ✅ **Theme color** - `<meta name="theme-color">` matching brand

**Run Lighthouse audit:**
```bash
# In Chrome DevTools
1. Open DevTools (F12)
2. Go to Lighthouse tab
3. Select "Progressive Web App" category
4. Run audit
5. Score should be 100/100 for installability
```

**Test on real iOS device:**
- Install on iPhone/iPad running iOS 16.4+
- Verify fullscreen mode (no Safari UI)
- Check safe areas (notch/bottom bar spacing)
- Test offline behavior (airplane mode)
- Confirm refresh button updates data

### Manual Refresh Data Model

The PWA uses **manual-refresh-only** with zero background network:
- ⚡ **Explicit refresh** - Tap refresh button to update data
- 🚫 **No auto-polling** - Zero network traffic after initial load
- ⏱️ **Last refreshed** timestamp shown in footer
- 💾 **30-min server cache** - Fast refresh with Cache-Control headers
- ❌ **No WebSocket/SSE** - No background connections

**Why?**
- Predictable resource usage
- Controlled network traffic
- Lower backend costs
- Better debugging

See [docs/IOS_PWA_GUIDE.md](docs/IOS_PWA_GUIDE.md) for detailed iOS installation guide and [docs/REFRESH_MODEL.md](docs/REFRESH_MODEL.md) for refresh semantics.

### PWA Features

✅ **Standalone fullscreen** - No Safari UI when launched
✅ **Safe area support** - Respects iPhone notch and bottom bar
✅ **Liquid Glass effects** - Backdrop blur headers (iOS 26 design)
✅ **Offline app shell** - Cached static assets work offline
✅ **Service worker** - Static assets only, no dynamic data caching

### Native iOS App (Personal Use)

For personal use on your iPhone/iPad, we've set up **Capacitor** to build a native iOS app:

**Quick Start:**
```bash
npm run build:mobile        # Build web assets
cd mobile
npm run cap:open:ios        # Open in Xcode
# Select your device and click Run (▶)
```

**Features:**
- ✅ Native iOS app experience
- ✅ No App Store submission required for personal use
- ✅ Install directly on your device via Xcode
- ✅ Same functionality as PWA but with native wrapper
- ✅ Full access to device capabilities if needed

**Complete Setup Guide**: [docs/IOS_NATIVE_APP_GUIDE.md](docs/IOS_NATIVE_APP_GUIDE.md)

**Requirements:**
- macOS with Xcode 14.0+
- Apple ID (free, no developer membership required for personal use)
- iOS device running iOS 14.0+

### Optional: Native App Wrappers

For App Store distribution or advanced native features:
- **Capacitor** (iOS/Android) - Already configured in `/mobile` directory
- **SwiftUI + WKWebView** - Custom native shell

See [docs/IOS_NATIVE_APP_GUIDE.md](docs/IOS_NATIVE_APP_GUIDE.md) for Capacitor setup and [docs/IOS_PWA_GUIDE.md](docs/IOS_PWA_GUIDE.md) for PWA alternative.

## � Platform Architecture

This repository is organized as a **multi-package workspace** following OpenBB platform patterns:

```
📦 biotech-terminal-platform/
├── 🐍 bt_platform/        # Python FastAPI backend
│   ├── core/              # Main application and database
│   ├── providers/         # Data source integrations
│   ├── routers/           # API endpoints
│   └── tui/               # Terminal User Interface (CLI)
├── 🎨 frontend-components/ # React component library
│   ├── terminal/          # Terminal UI components
│   ├── tables/            # Data grid components
│   ├── plotly/           # Chart visualizations
│   └── biotech/          # Domain-specific components
├── 🖥️ terminal/           # Web terminal application
├── 📚 examples/           # Component demos
└── 📖 docs/              # Documentation
```

### Backend Platform (`bt_platform/`)

**Python FastAPI** backend with:
- **Async SQLAlchemy ORM** for data modeling
- **Provider pattern** for pluggable data sources
- **OpenAPI/Swagger** automatic documentation
- **SQLite** database (production-ready PostgreSQL support)
- **Built-in seed data** for pharmaceutical datasets

**Key Models:**
- `Drug` - Development pipeline tracking
- `ClinicalTrial` - Trial data and outcomes
- `Company` - Biotech/pharma company profiles
- `Catalyst` - Market-moving events

### Frontend Components (`frontend-components/`)

**Reusable React components** organized by function:
- **Terminal**: Bloomberg-style UI primitives
- **Tables**: Advanced data grids with virtualization
- **Plotly**: Scientific/financial charting
- **Biotech**: Domain-specific visualizations

**Design System:**
- 🎨 **5 accent themes**: amber, green, cyan, purple, blue
- ♿ **Accessibility**: WCAG AAA + colorblind support
- 🖥️ **Terminal aesthetics**: Monospace fonts, sharp edges
- � **Data density**: Bloomberg Terminal-inspired layouts

### Terminal Application (`terminal/`)

**Full-featured biotech terminal** with:
- 📈 **Drug Development Dashboard** - Pipeline visualization
- 💰 **Financial Modeling** - DCF, risk-adjusted NPV
- 🔍 **Market Intelligence** - Competitor analysis
- 📊 **Clinical Trial Tracker** - Real-time trial data
- 🧬 **Biotech Data Explorer** - Interactive data discovery
- 🔬 **Evidence Journal** - Science-first catalyst tracking (NEW!)
- 🏢 **XBI Company Profiles** - Comprehensive profiles for all XBI constituents (NEW!)

#### XBI Company Profiles - Comprehensive Company Intelligence

**Route**: `/xbi-companies`

A comprehensive company profile system providing detailed information on all SPDR S&P Biotech ETF (XBI) constituents with advanced search and filtering capabilities.

**Key Features**:
- **120+ Company Profiles**: Complete XBI constituent coverage
- **Free Financial Data**: Powered by Yahoo Finance (yfinance library)
- **Advanced Search**: Find companies by name or ticker symbol
- **Smart Filtering**: Filter by company type (Big Pharma, Large/Mid/Small Cap) and market cap range
- **Detailed Profiles**: Business summaries, financials, pipeline, catalysts, and more
- **Intelligent Caching**: 24-hour cache TTL for improved performance
- **Pagination**: Browse through companies efficiently
- **Click-through Navigation**: Access full profiles from the company list

**Data Provider**:
- Yahoo Finance via `yfinance` Python library (free, no API key required)
- Company profiles with sector, industry, headquarters, employee count
- Financial metrics: market cap, revenue, margins, valuation ratios
- Analyst recommendations and price targets
- Stock price history and trading data

**Usage**:
```bash
# Populate database with XBI companies
python -m bt_platform.core.ingest_xbi_companies

# Force refresh (bypass cache)
python -m bt_platform.core.ingest_xbi_companies --force-refresh

# Ingest specific company
python -m bt_platform.core.ingest_xbi_companies --ticker VRTX
```

See [docs/XBI_COMPANY_PROFILES.md](docs/XBI_COMPANY_PROFILES.md) for complete documentation.

#### Evidence Journal - Science-First Intelligence

**Route**: `/science/evidence-journal`

A mechanism-centric evidence platform that ranks companies and assets by mechanistic differentiation and surfaces near-term catalysts with transparent evidence trails.

**Key Features**:
- **Refresh Modes**: Manual (default, zero background network) | Scheduled | Live
- **Today's Evidence**: Trial updates, FDA label changes, AdComm dockets, SEC 8-K filings
- **Catalyst Board**: 90-180 day timeline with confidence-coded events (PDUFA, AdComm, readouts)
- **MoA Explorer**: Target differentiation analysis (genetic evidence + bench potency scores)
- **Company Scorecard**: Evidence pyramid (Genetic > Translational > Clinical) + cash runway
- **Journal Notebook**: Research notes with evidence snippets and "So what?" one-liners

**Domain Focus**:
- **Cardiology**: Lp(a), Factor XI, HFpEF with FDA 2019 HF guidance context
- **IBD**: IL-23 class, TL1A/DR3, orals with MMS/CDAI benchmarks
- **DMD**: Gene therapy competitive mapping (Elevidys vs next-gen)
- **Retina**: NPDR/DME durability with DRSS shift endpoints

**Data Sources** (API-ready structure):
- ClinicalTrials.gov API v2, FDA (openFDA, Drugs@FDA, AdComm calendar)
- SEC/EDGAR 8-K filings, EMA CHMP meetings
- Open Targets GraphQL (genetic validation), ChEMBL (bench potency)

See [docs/EVIDENCE_JOURNAL.md](docs/EVIDENCE_JOURNAL.md) for complete feature documentation.

#### Catalyst Scoring System - "Ionis-Style" Stealth Watchlist (NEW!)

**50-catalyst watchlist** with quantitative scoring framework for identifying high-torque biotech setups.

**Scoring Methodology** (0-16 points across 5 dimensions):
1. **Event Leverage (0-4)**: Hard endpoint likelihood (MACE, pancreatitis events, CV death)
2. **Timing Clarity (0-3)**: Fixed PDUFA vs event-driven fog
3. **Surprise Factor (0-3)**: Street models underweight key endpoints?
4. **Downside Contained (0-3)**: CRL resolution or class read-through
5. **Market Depth (0-3)**: Payer appetite + population size + guideline friendliness

**Tier Classifications**:
- 🚀 **High-Torque (>8/16)**: High asymmetric upside with contained downside
- 📊 **Tradable (6-8/16)**: Moderate setup with tradable risk/reward
- 👁️ **Watch (<6/16)**: Watch list candidates with lower conviction

**50 Pre-Seeded Catalysts** covering:
- Cardiometabolic & CV outcomes (apoC-III, Lp(a), HTN, gene editing)
- Rare disease & neuro (SMA, DMD, Angelman, DEB, Hunter syndrome)
- Oncology (ADCs, BTK degraders, synthetic lethality, oncolytics)
- Immunology & derm (STAT6 degrader, T-reg therapies)
- And more...

**API Endpoint**: `GET /api/v1/biotech/catalysts` returns catalysts with scoring fields
**UI Component**: `CatalystScoringRadar` - Beautiful glass-morphic radar chart
**Example**: See `examples/CatalystScoringExample.tsx`

See [docs/CATALYST_SCORING_SYSTEM.md](docs/CATALYST_SCORING_SYSTEM.md) for complete documentation.


### TUI - Command Line Interface (`bt_platform/tui/`)

**Interactive terminal user interface** for biotech portfolio analysis:
- 🎯 **Onboarding Panel** - Usage instructions and recent assets
- 📊 **Watchlist Management** - Track assets of interest
- 🕒 **Recent Assets Tracking** - Last 3 accessed assets
- 📈 **Risk Metrics Display** - Success probability, burn rate, runway
- 🔄 **Data Refresh** - Manual refresh with status updates

See [docs/TUI.md](docs/TUI.md) for detailed usage instructions.

## 🛠️ Development

### Prerequisites

- **Python 3.9+** with Poetry
- **Node.js 18+** with npm
- **Git** for version control

### Setup Development Environment

1. **Clone and setup:**

   ```bash
   git clone <repository-url>
   cd biotech-terminal-platform

   # Windows
   .\scripts\setup.ps1

   # macOS/Linux
   ./scripts/setup.sh
   ```

   The setup script will:
   - Install Python dependencies via Poetry
   - Install Node.js dependencies for all workspaces
   - Create `.env` file with default configuration
   - Initialize database and run migrations
   - Seed database with sample pharmaceutical data

2. **Start development servers:**

   ```bash
   # Windows
   .\scripts\setup.ps1 dev

   # macOS/Linux
   ./scripts/setup.sh dev
   ```

## 🧪 Smoke Testing & Quality Assurance

Before starting development or deployment, verify your setup with our comprehensive smoke testing tools:

### Quick Pre-flight Check (30 seconds)

Quickly verify your development environment is ready:

```bash
npm run preflight
```

This checks:
- ✅ Node.js and npm installation
- ✅ Dependencies installed in all workspaces
- ✅ Project structure and critical files
- ✅ Port availability (3000, 3001, 3002)
- ✅ Python and Poetry (optional for backend)

### Mobile Setup Verification (Interactive)

For first-time mobile setup with step-by-step guidance:

```bash
npm run verify:mobile
```

Features:
- 📱 **Extremely clear error messages** with codes and timestamps
- 💡 **Step-by-step guidance** through the entire setup process
- 🔧 **Specific solutions** for every problem that may occur
- ✅ **Interactive progress** reporting
- 📋 **Mobile-specific checks** (viewport, routes, components)

### Full Smoke Test Suite (5-10 minutes)

Comprehensive testing of all features:

```bash
npm run smoke-test
```

This automated suite verifies:
- Dependencies installation across all workspaces
- Mobile and desktop platform setup
- TypeScript configuration and type checking
- Code quality (linting)
- Build process for all workspaces
- Dev servers startup (mobile and desktop)

**Error codes reference:**
- `E001`: Dependencies not installed
- `E002`: Build failed
- `E005`: TypeScript errors
- `E007`: Mobile setup invalid
- `E008`: Desktop setup invalid

### Interactive UI Smoke Test

For manual feature verification with a visual checklist:

1. Open in browser: `docs/INTERACTIVE_SMOKE_TEST.html`
2. Follow the interactive checklist
3. Test each feature systematically
4. Export results report

Features:
- ✅ Check off each test as you complete it
- 📊 Real-time progress tracking
- 💾 Automatic save of test state
- 📄 Export detailed test reports
- 🎯 Covers all desktop and mobile routes

### Common Error Solutions

**E001 - Dependencies not installed:**
```bash
cd /path/to/project
npm install
```

**E007 - Mobile setup invalid:**
```bash
# Build components first (required)
npm run build:components
# Then start mobile app
npm run dev:mobile
```

**E008 - Desktop setup invalid:**
```bash
# Ensure frontend-components is built
npm run build:components
# Then start terminal app
npm run dev:terminal
```

**Port already in use:**
```bash
# Find and kill process using the port
lsof -i :3002  # macOS/Linux
netstat -ano | findstr :3002  # Windows
```

### Documentation

For complete testing procedures:
- 📖 [Smoke Testing Guide](docs/SMOKE_TESTING_GUIDE.md) - Comprehensive testing procedures
- 📱 [Mobile Setup Guide](mobile/README.md) - Mobile-specific setup instructions
- 🍎 [iOS PWA Guide](docs/IOS_PWA_GUIDE.md) - iOS installation and testing
- 🔍 [Cross-Platform Testing](docs/CROSS_PLATFORM_TESTING_GUIDE.md) - Multi-platform verification

**New Features Documentation:**
- 🧪 [E2E Tests Guide](tests/e2e/README.md) - Playwright end-to-end testing
- 🎨 [Pre-commit Hooks Guide](docs/PRECOMMIT_HOOKS.md) - Code quality automation
- 📊 [Observability Guide](docs/OBSERVABILITY.md) - Logging, metrics, and monitoring
- 🔐 [Authentication Guide](docs/AUTHENTICATION.md) - API token authentication
- 💾 [SQLite Migration Guide](docs/SQLITE_MIGRATION.md) - Evidence Graph storage migration

## 📊 Features

### Atoms (18 components)

| Component | Description | Key Features |
|-----------|-------------|--------------|
| **Button** | Action buttons | 5 variants, loading state, icons |
| **Text** | Typography | Multiple variants, semantic colors |
| **Input** | Form input | Prefix/suffix, error states |
| **Badge** | Status badges | Dot indicator, 4 variants |
| **Spinner** | Loading indicator | 3 sizes, customizable color |
| **Checkbox** | Checkbox input | Controlled/uncontrolled |
| **Switch** | Toggle switch | Keyboard accessible |
| **Progress** | Progress bar | Linear, 4 variants |
| **Select** | Dropdown select | Keyboard navigation, disabled options |
| **Tooltip** | Hover popover | 4 positions, auto-positioning |
| **Breadcrumbs** | Navigation trail | Custom separator, clickable items |

### Molecules (5 components)

| Component | Description | Key Features |
|-----------|-------------|--------------|
| **Metric** | KPI display | Trend indicators, change % |
| **StatusIndicator** | Status display | Pulse animation, customizable |
| **Card** | Content card | Bordered variant, header/footer |
| **Toast** | Notifications | Auto-dismiss, useToast hook, 4 positions |
| **Accordion** | Collapsible sections | Single/multiple open, disabled items |

### Organisms (6 components)

| Component | Description | Key Features |
|-----------|-------------|--------------|
| **Panel** | Container panel | Corner brackets, header/footer |
| **DataTable** | Data grid | Sortable, custom renderers |
| **Tabs** | Tab navigation | Controlled/uncontrolled |
| **Section** | Colored sections | 5 variants (warning/success/danger/info) |
| **MonitoringTable** | Action items list | Progress bars, status, action buttons |
| **Modal** | Dialog/popup | Portal rendering, ESC/overlay close, 4 sizes |

### Visualizations (9 components)

| Component | Description | Use Case |
|-----------|-------------|----------|
| **Gauge** | 270° arc gauge | CPU, memory, disk metrics |
| **DonutChart** | Pie/donut chart | Task distribution, proportions |
| **BarChart** | Bar chart | Monthly metrics, comparisons |
| **SparkLine** | Micro line chart | Trends, network traffic |
| **ProgressCircle** | Circular progress | Uptime, load percentage |
| **WorldMap** | Animated globe | Geographic data points |
| **RadarChart** | 6-sided radar | Multi-metric comparison |
| **ActivityGraph** | Time-series line | Activity over time |
| **HeatmapGrid** | 24x7 grid | Weekly activity patterns |

## 🎨 Design System

### Theming

Change accent color via `data-theme` attribute:

```html
<html data-theme="cyan">
  <!-- Your app -->
</html>
```

**Available themes:**
- `amber` (default) - Bloomberg-style `#FF9500`
- `green` - Matrix/Hacker `#00FF00`
- `cyan` - Cyberpunk `#00D4FF`
- `purple` - Synthwave `#A855F7`
- `blue` - Classic Terminal `#0A84FF`

### Color Blindness Support

```html
<html data-cvd="deuteranopia">
  <!-- Accessible for color blind users -->
</html>
```

Modes: `deuteranopia`, `protanomaly`

### Design Principles

- **Terminal Aesthetics** - Monospace fonts, sharp edges
- **Information Density** - Maximum data in minimum space
- **High Contrast** - WCAG AAA (7:1+) compliant
- **Keyboard First** - Full keyboard navigation
- **Performance** - Optimized for 60fps

## 📖 Examples

### Dashboard with Metrics

```tsx
import { Panel, Metric, Gauge, SparkLine } from '@biotech-terminal/frontend-components/terminal';

function Dashboard() {
  const sparkData = Array.from({ length: 20 }, () => Math.random() * 100);

  return (
    <>
      <Panel title="SYSTEM OVERVIEW" cornerBrackets>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <Metric label="CPU" value={78} trend="up" change={2.3} />
          <Metric label="MEMORY" value={92} trend="down" change={-5.1} />
          <Metric label="UPTIME" value="99.9%" />
        </div>
      </Panel>

      <Panel title="CPU UTILIZATION">
        <Gauge value={78} label="CPU" status="success" />
      </Panel>

      <Panel title="NETWORK TRAFFIC">
        <SparkLine data={sparkData} width={300} height={60} />
      </Panel>
    </>
  );
}
```

### Modal with Form

```tsx
import { Modal, Button, Input, Select, useToast } from '@biotech-terminal/frontend-components/terminal';
import { useState } from 'react';

function ConfigModal() {
  const [isOpen, setIsOpen] = useState(false);
  const { notify } = useToast();

  const options = [
    { value: 'opt1', label: 'Option 1' },
    { value: 'opt2', label: 'Option 2' },
  ];

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>OPEN CONFIG</Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="SYSTEM CONFIGURATION"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsOpen(false)}>
              CANCEL
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                notify('Configuration saved!', 'success');
                setIsOpen(false);
              }}
            >
              SAVE
            </Button>
          </>
        }
      >
        <Input placeholder="System name" />
        <Select options={options} placeholder="Select option" />
      </Modal>
    </>
  );
}
```

### Toast Notifications

```tsx
import { Toast, useToast, Button } from '@biotech-terminal/frontend-components/terminal';

function NotificationDemo() {
  const { messages, notify, remove } = useToast();

  return (
    <>
      <Button onClick={() => notify('Success!', 'success')}>
        SUCCESS TOAST
      </Button>
      <Button onClick={() => notify('Error occurred', 'error', 5000)}>
        ERROR TOAST
      </Button>

      <Toast messages={messages} onRemove={remove} position="top-right" />
    </>
  );
}
```

### Data Table

```tsx
import { DataTable, Badge } from '@biotech-terminal/frontend-components/terminal';

function AgentTable() {
  const data = [
    { id: 'G-001', name: 'ALPHA', status: 'success', missions: 23 },
    { id: 'G-002', name: 'BETA', status: 'warning', missions: 45 },
  ];

  const columns = [
    { key: 'id', header: 'ID', width: 100 },
    { key: 'name', header: 'NAME', width: 200 },
    {
      key: 'status',
      header: 'STATUS',
      width: 120,
      render: (row) => <Badge variant={row.status}>{row.status}</Badge>,
    },
    { key: 'missions', header: 'MISSIONS', width: 100, align: 'right' },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      keyExtractor={(row) => row.id}
    />
  );
}
```

## 🔧 Configuration

### TypeScript

TypeScript definitions are included. Import types:

```tsx
import type {
  ButtonProps,
  PanelProps,
  DataTableProps,
  Column,
  Status
} from '@biotech-terminal/frontend-components/terminal';
```

### CSS Customization

Override CSS variables:

```css
:root {
  --accent-primary: #00d4ff;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
  --space-4: 16px;
}
```

## 🧪 Development

```bash
# Clone repository
git clone https://github.com/deaxu/terminal-ui.git

# Install dependencies
npm install

# Start dev server
npm run dev

# Build library
npm run build

# Run tests
npm run test
```

## 📁 Project Structure

```
src/
├── components/
│   ├── atoms/           # Button, Input, Badge, Select, etc.
│   ├── molecules/       # Metric, Card, Toast, Accordion, etc.
│   └── organisms/       # Panel, DataTable, Modal, etc.
├── visualizations/      # Charts and data viz components
├── styles/
│   ├── variables.css    # Design tokens
│   ├── global.css       # Global styles
│   └── reset.css        # CSS reset
├── types/               # TypeScript types
└── index.ts             # Main export
```

## 📊 Data Sources & Architecture

The platform is **100% self-sufficient** using only free, unlimited data sources:

### Real-Time Market Data (Yahoo Finance)
- **Stock Prices**: 40+ biotech stocks with live quotes
- **ETFs**: XBI, IBB, ARKG, PBE biotech index tracking
- **Analyst Data**: Ratings, price targets, recommendations
- **Ownership**: Institutional holdings, insider ownership percentages
- **Financials**: Market cap, P/E ratios, revenue growth, debt metrics
- **Trading Metrics**: Volume, short interest, float shares

### Clinical Trials (ClinicalTrials.gov)
- **Active Trials**: Real-time data on ongoing clinical studies
- **Trial Phases**: Preclinical through Phase IV tracking
- **Enrollment**: Patient numbers, recruitment status
- **Timelines**: Start dates, primary completion dates
- **Sponsors**: Company and institution affiliations

### FDA Regulatory Data (FDA.gov)
- **Drug Approvals**: Recent FDA approvals and rejections
- **PDUFA Dates**: Prescription Drug User Fee Act action dates
- **Advisory Committees**: Upcoming committee meetings
- **sNDA Filings**: Supplemental New Drug Applications

### Insider Trading (SEC EDGAR)
- **Form 4 Filings**: Real-time insider buy/sell transactions
- **Filing Dates**: When insiders report trades
- **Direct Access**: Links to official SEC filings

### Data Refresh Model
- **Manual Refresh**: User-initiated via refresh button
- **Python Scrapers**: Run on-demand to fetch latest data
- **30-Min Cache**: Server-side caching for performance
- **No Background Polling**: Zero network traffic when idle

**Learn More**: See [DATA_COLLECTION_ARCHITECTURE.md](./DATA_COLLECTION_ARCHITECTURE.md) for complete technical details.

## 🤝 Contributing

Contributions welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

## 📄 License

MIT © [Deaxu](https://github.com/deaxu)

## 🙏 Acknowledgments

- **Bloomberg Terminal** - Professional data interfaces
- **Cyberpunk 2077** - Futuristic UI aesthetics
- **Matrix** - Classic terminal green theme

---

**Built with ⚡ Vite + ⚛️ React + 📘 TypeScript**

*"Form follows function, but function can look cool."*

## 📊 Evidence Graph - Production-Ready Features

The **Evidence Graph** feature visualizes relationships between pharmaceutical entities (theses, trials, catalysts, KOLs, documents) with production-grade capabilities.

### ✨ Key Features

- **Manual Refresh Only**: No background polling or WebSocket connections - user-controlled data updates
- **ETag Caching**: HTTP 304 responses reduce bandwidth by ~90% for unchanged data
- **Rate Limiting**: 60 requests/minute per IP to prevent abuse
- **Atomic Writes**: Data integrity guaranteed with temp file + rename pattern
- **Security Headers**: CSP, X-Frame-Options, HSTS, and more
- **Query Filtering**: `?type=thesis&company=Pfizer&limit=100` for efficient data retrieval
- **Keyboard Shortcuts**: Press `R` to refresh instantly

### 🚀 Getting Started

```bash
# Start the Evidence Graph API
uvicorn standalone_evidence_api:app --reload --port 8000

# Or with Docker
docker-compose -f docker-compose.evidence-graph.yml up
```

Access at:
- API: http://localhost:8000/api/v1/evidence-graph/nodes
- Docs: http://localhost:8000/docs
- Terminal UI: http://localhost:3000/evidence-graph

### 📖 Documentation

- [ADR 001: Manual Refresh Only](./docs/ADR-001-manual-refresh-only.md) - Architecture decision and rationale
- [Production Checklist](./docs/PRODUCTION_CHECKLIST.md) - Pre-deployment validation
- [Evidence Graph Implementation](./EVIDENCE_GRAPH_IMPLEMENTATION_SUMMARY.md) - Technical details

### 🧪 Testing

```bash
# Run API tests
pytest tests/test_evidence_graph_api.py -v

# Expected: 20+ tests passing
# Coverage: ETag caching, HEAD requests, filtering, rate limiting, security headers
```

### 🔒 Production Deployment

See [Production Checklist](./docs/PRODUCTION_CHECKLIST.md) for complete deployment guide.

**Quick validation:**
```bash
# Set production environment variables
export ENV=production
export CORS_ORIGINS=https://yourdomain.com

# Run pre-deployment checks
pytest tests/
npm run lint
npm run typecheck

# Deploy with Docker
docker build -t evidence-graph-api -f Dockerfile.evidence-api .
docker run -p 8000:8000 -e ENV=production evidence-graph-api
```


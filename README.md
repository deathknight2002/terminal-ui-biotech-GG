# 🧬 Biotech Terminal Platform

> **Open-source biotech data intelligence platform** with Bloomberg Terminal aesthetics, built on OpenBB architecture patterns.

A comprehensive **React/TypeScript frontend** + **Python FastAPI backend** platform for pharmaceutical data visualization, drug development pipeline tracking, and biotech market intelligence.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.9+](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/downloads/)
[![Node.js 18+](https://img.shields.io/badge/node.js-18+-green.svg)](https://nodejs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com/)
[![React 18](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)

## 🚀 Quick Start

**One-command setup for Windows:**
```powershell
.\scripts\setup.ps1
```

**One-command setup for macOS/Linux:**
```bash
./scripts/setup.sh
```

**Start development:**
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
- 💻 **CLI Terminal (TUI)**: `python3 -m platform.tui`

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

### Optional: Native App Wrappers

For App Store distribution, wrap with:
- **Capacitor** (iOS/Android) - See `/mobile` directory
- **SwiftUI + WKWebView** - Custom native shell

See [docs/IOS_PWA_GUIDE.md](docs/IOS_PWA_GUIDE.md) for Capacitor and SwiftUI setup instructions.

## � Platform Architecture

This repository is organized as a **multi-package workspace** following OpenBB platform patterns:

```
📦 biotech-terminal-platform/
├── 🐍 platform/           # Python FastAPI backend
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

### Backend Platform (`platform/`)

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


### TUI - Command Line Interface (`platform/tui/`)

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

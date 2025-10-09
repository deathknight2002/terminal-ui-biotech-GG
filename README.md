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

2. **Start development servers:**

   ```bash
   # Windows
   .\scripts\setup.ps1 dev
   
   # macOS/Linux
   ./scripts/setup.sh dev
   ```

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

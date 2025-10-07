# Biotech Terminal Platform - Copilot Instructions

## Project Overview

This is a **multi-workspace monorepo** combining Python FastAPI backend with React/TypeScript frontend for biotech/pharmaceutical intelligence. Architecture follows OpenBB platform patterns with Bloomberg Terminal aesthetics.

**Key Components:**
- **Platform (Python)**: FastAPI backend with SQLAlchemy, DuckDB ingestion pipelines
- **Frontend Components (React)**: Modular component library organized by function
- **Backend (Node.js)**: Express.js API with WebSocket support for real-time data
- **Terminal App (React)**: Full-featured pharmaceutical intelligence application

## Repository Architecture

### Workspace Structure (NPM Workspaces)
```
root/                           # Monorepo orchestration
├── platform/                   # Python FastAPI backend (Poetry)
│   ├── core/                   # app.py, database.py, routers.py
│   ├── providers/              # Data provider implementations
│   └── ingestion/              # DuckDB pipeline for data ingestion
├── frontend-components/        # React component library (publishable)
│   ├── src/terminal/           # Bloomberg-style UI primitives
│   ├── src/tables/             # Data grid components  
│   ├── src/plotly/             # Chart visualizations
│   └── src/biotech/            # Domain-specific biotech widgets
├── backend/                    # Node.js Express API (TypeScript)
│   └── src/routes/             # market-data, biotech-data, analytics
├── terminal/                   # Full terminal application
│   └── src/                    # React app consuming frontend-components
└── examples/                   # Component demos and documentation
```

### Dual Backend Architecture (Critical Understanding)
**Two backends serve different purposes:**
1. **Python FastAPI** (`platform/core/app.py` on port 8000): Data providers, database models, batch analytics
2. **Node.js Express** (`backend/src/index.ts` on port 3001): Real-time WebSocket, market data streaming

### Component Organization (Atomic Design)
```
frontend-components/src/
├── terminal/                   # Core UI atoms, molecules, organisms
│   ├── atoms/                  # Button, Input, Badge (18 primitives)
│   ├── molecules/              # Metric, Card, Toast, MetricCard
│   ├── organisms/              # Panel, DataTable, Modal, AuroraBackdrop
│   └── visualizations/         # Gauge, DonutChart, WorldMap, SparkLine
├── tables/                     # OpenBB-style data grids
├── plotly/                     # Financial chart wrappers
└── biotech/                    # Drug pipeline, catalyst tracking widgets
```

### Design System Principles
- **Terminal Aesthetics**: Monospace fonts, sharp edges, WCAG AAA contrast
- **Bloomberg Inspired**: `cornerBrackets` prop, uppercase labels, data density
- **Multi-theme**: 5 themes via `data-theme="amber|green|cyan|purple|blue"`
- **CVD Support**: Color-blind modes via `data-cvd="deuteranopia|protanomaly"`

## Critical Developer Workflows

### One-Command Setup (First Time)
```bash
# macOS/Linux
./scripts/setup.sh

# Windows
.\scripts\setup.ps1
```
**What it does**: Installs Poetry, Node.js dependencies for all workspaces, builds frontend-components, creates .env file

### Development Mode (All Services)
```bash
# Start everything (Python API + Node.js API + Terminal App)
npm run start:dev     # or ./scripts/setup.sh dev

# Individual services
npm run dev:backend      # Python FastAPI at :8000 (poetry run uvicorn)
npm run dev:components   # Vite dev server at :5173 (frontend-components)
npm run dev:terminal     # Vite dev server at :3000 (terminal app)
```

### Backend Workflows
```bash
# Python backend (platform/)
poetry run uvicorn platform.core.app:app --reload
poetry run pytest                    # Run tests
poetry run ruff check platform/      # Linting

# Node.js backend (backend/)
cd backend && npm run dev            # tsx watch mode
npm run db:seed                      # Seed pharmaceutical data
```

### Component Library Development
```bash
cd frontend-components
npm run dev           # Vite dev server with HMR
npm run build         # Build for distribution
npm run typecheck     # TypeScript validation (catches errors before build)
npm run lint          # ESLint checking
```

### Testing Strategy
```bash
npm run test                  # All workspaces (components + terminal + platform)
npm run test:components       # Vitest in frontend-components/
npm run test:terminal         # Vitest in terminal/
poetry run pytest             # Python backend tests
poetry run pytest --cov       # With coverage report
```

### Building for Production
```bash
npm run build:all             # Poetry build + npm build (all workspaces)
npm run build:components      # Just frontend-components (for npm publish)
npm run build:terminal        # Terminal app static build
```

## Project-Specific Conventions

### Type System (Critical for Biotech Domain)
All pharmaceutical types in `src/types/biotech.ts` (root level, NOT in frontend-components):
```typescript
// Pipeline and Development
PhaseType: "Preclinical" | "Phase I" | "Phase II" | "Phase III" | "Filed" | "Approved"
TherapeuticArea: "Oncology" | "Immunology" | "Neurology" | "Rare Disease"
CompanyType: "Big Pharma" | "SMid" | "Biotech" | "China Pharma"

// Financial Modeling (used by BiotechFinancialDashboard)
Asset, DevelopmentMilestone, SalesMilestone, RoyaltyTier, GlobalParameters

// Intelligence Tracking
Catalyst, Indication, Competitor, LauraDoc, RagAnswer, AuroraAdapters
```

### Component Naming Conventions
- **Bio-prefix**: `BioMetricGrid`, `BioAuroraDashboard` for pharmaceutical-specific components
- **Terminal Style**: `cornerBrackets` prop, ALL CAPS labels in titles
- **Status Variants**: Consistent `success|warning|error|info` across all status-aware components
- **Modular Exports**: Import from subpaths `@biotech-terminal/frontend-components/terminal`

### CSS Architecture (Pure CSS, No CSS-in-JS)
```typescript
// Import pattern for consuming apps
import '@biotech-terminal/frontend-components/styles';

// CSS modules for component-specific styles
import styles from './MyComponent.module.css';

// Design tokens in frontend-components/src/styles/variables.css
--accent-primary, --bg-terminal, --font-mono
```

### Python Backend Patterns
```python
# Provider pattern for data sources (platform/providers/)
class MyProvider(Provider):
    async def fetch_data(self, **kwargs):
        return {"data": ...}

# Endpoint registration (platform/core/routers.py)
api_router = APIRouter()
api_router.include_router(biotech_router, prefix="/biotech")

# Database models (platform/core/database.py)
# SQLAlchemy async with SQLite (dev) / PostgreSQL (prod)
```

### OpenBB Integration Pattern
Financial data flows through `src/integrations/openbb/`:
- `OpenBBTable` - Transforms OpenBB data grids to terminal tables
- `OpenBBPlot` - Wraps Plotly.js charts with terminal styling
- Backend routes at `/api/v1/biotech/*` (Python) or `/api/market/*` (Node.js)

## Integration Points & Data Flow

### External Dependencies
- **OpenBB Platform**: Financial data via `external/OpenBB/` submodule (Git submodule)
- **Radix UI**: Headless primitives (`@radix-ui/react-dialog`, `@radix-ui/react-select`)
- **TanStack**: Virtual scrolling (`@tanstack/react-virtual`), tables (`@tanstack/react-table`), queries (`@tanstack/react-query` in terminal app)
- **Plotly.js**: Scientific/financial charting (`plotly.js-dist-min`, wrapped in `src/plotly/`)
- **Framer Motion**: Aurora effects and animations
- **Recharts**: Simpler chart components in visualizations

### Data Flow Architecture
```
1. External APIs → Python Providers → FastAPI Endpoints → Terminal App
2. Real-time data → Node.js WebSocket → Terminal App (live updates)
3. DuckDB Pipeline → Ingestion → SQLite/PostgreSQL → FastAPI
4. Terminal App → React Query → Zustand State → Components
```

### Cross-Workspace Communication
**Terminal App Consumes Frontend Components:**
```typescript
// terminal/package.json
"@biotech-terminal/frontend-components": "file:../frontend-components"

// terminal/src/pages/Dashboard.tsx
import { Panel, Metric } from '@biotech-terminal/frontend-components/terminal';
import { DrugPipeline } from '@biotech-terminal/frontend-components/biotech';
```

**Python Backend → Node.js Backend:**
- Python handles batch data processing, database models
- Node.js handles real-time WebSocket streaming
- Both can be run simultaneously in development

### WebSocket Communication Pattern
```typescript
// backend/src/websocket/index.ts - Node.js WebSocket server
io.on('connection', (socket) => {
  socket.on('subscribe:market', ...)
  socket.emit('market_data', data)
})

// terminal/src/hooks/useWebSocket.ts - Consumer
const { data } = useWebSocket('ws://localhost:3001');
```

## Common Gotchas & Critical Knowledge

### Multi-Workspace Build Dependencies
**CRITICAL**: Components must be built before terminal can develop:
```bash
cd frontend-components && npm run build  # Required first
cd ../terminal && npm run dev             # Now works
```
Reason: Terminal imports `@biotech-terminal/frontend-components` via `file:../` workspace link

### Two src/ Directories (Confusing!)
- `src/` (root) - Legacy library code, types, integrations (still used for types)
- `frontend-components/src/` - Actual component library (the real source)
- When adding components, use `frontend-components/src/terminal/` path

### Python Environment Management
```bash
poetry install           # Installs dependencies in .venv
poetry run <command>     # Always prefix Python commands with poetry run
poetry shell             # OR activate shell to omit poetry run prefix
```

### TypeScript Build Errors vs Runtime
- Build fails don't always mean code is wrong (especially WorldMap component)
- Run `npm run typecheck` in workspace before building to catch issues early
- Check `tsconfig.json` paths - workspace references can cause confusion

### CSS Import Order Matters
```typescript
// Correct order in terminal app
import '@biotech-terminal/frontend-components/styles';  // First
import './App.css';                                      // Then app styles
```

### DuckDB Ingestion Pipeline
Located in `platform/ingestion/` - separate from FastAPI app:
```bash
cd platform/ingestion
python -m platform.ingestion  # Run pipeline manually
```
Ingests parquet/CSV → DuckDB → SQLite for analysis

### Mock Data Strategy
- **Development**: `src/mocks/handlers.ts` (MSW) for frontend-only dev
- **Real Data**: Requires both Python backend (port 8000) + Node.js backend (port 3001)
- Terminal app can run standalone with mocks, or connect to backends

### Common Import Errors
```typescript
// ❌ Wrong (imports from dist, not src)
import { Panel } from '@biotech-terminal/frontend-components';

// ✅ Correct (explicit subpath)
import { Panel } from '@biotech-terminal/frontend-components/terminal';
```

## Key Files to Understand

### Entry Points
- `platform/core/app.py` - Python FastAPI application entry
- `backend/src/index.ts` - Node.js Express application entry
- `frontend-components/src/index.ts` - Component library main export
- `terminal/src/main.tsx` - Terminal application entry

### Configuration Files
- `pyproject.toml` - Python dependencies and Poetry config
- `package.json` (root) - Workspace configuration and scripts
- `frontend-components/package.json` - Component library dependencies
- `backend/package.json` - Node.js backend dependencies
- `tsconfig.json` (multiple) - TypeScript configs per workspace

### Type Definitions
- `src/types/biotech.ts` - Pharmaceutical domain models (root level)
- `frontend-components/src/types/` - Component prop types

### Styling System
- `frontend-components/src/styles/variables.css` - Design tokens
- `frontend-components/src/styles/biotech-theme.css` - Aurora theme
- `frontend-components/src/styles/global.css` - Base styles

### Example Components
- `frontend-components/src/terminal/organisms/Panel/` - Panel component example
- `frontend-components/src/biotech/BiotechFinancialDashboard/` - Complex biotech component
- `examples/` - Component demonstrations

When adding new biotech components: follow atomic design, use types from `src/types/biotech.ts`, maintain terminal aesthetics with `cornerBrackets` and uppercase labels, and test in both component library and terminal app contexts.
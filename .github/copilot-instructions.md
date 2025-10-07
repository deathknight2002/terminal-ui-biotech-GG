# Biotech Terminal UI Library - Copilot Instructions

## Project Overview

This is a specialized React component library (`@deaxu/terminal-ui`) targeting **biotech/pharmaceutical data visualization** with Bloomberg Terminal aesthetics. The project combines:

- **Frontend**: Modern React/TypeScript UI component library with biotech-specific visualizations
- **Backend**: Express.js API with PostgreSQL/QuestDB for time-series pharmaceutical data
- **Integration**: OpenBB financial platform integration for market data
- **Specialization**: Drug development pipelines, catalyst tracking, clinical trials, and pharmaceutical intelligence

## Architecture Patterns

### Component Hierarchy (Atomic Design)
```
src/components/
├── atoms/          # Button, Input, Badge, Select (18 components)
├── molecules/      # Metric, Card, Toast, BioMetricGrid (5 core + biotech)
├── organisms/      # Panel, DataTable, Modal, BiotechFinancialDashboard (6 core + biotech)
└── visualizations/ # Gauge, DonutChart, WorldMap, SparkLine (9 specialized charts)
```

### Key Design Principles
- **Terminal Aesthetics**: Monospace fonts, sharp edges, high contrast (WCAG AAA)
- **Bloomberg Style**: Data-dense interfaces with `cornerBrackets`, uppercase labels
- **Multi-theme**: 5 accent colors (`amber`, `green`, `cyan`, `purple`, `blue`) via `data-theme`
- **CVD Support**: Color-blind accessible via `data-cvd="deuteranopia"`

### Backend Service Architecture
```
backend/src/
├── routes/         # market-data, biotech-data, financial-modeling, analytics
├── database/       # PostgreSQL + QuestDB time-series integration  
├── websocket/      # Real-time market data streaming
└── dagster/        # Data orchestration pipelines (planned)
```

## Development Workflows

### Component Development
```bash
# Library development with live demo
npm run dev          # Starts examples/demo at localhost:5173
npm run build        # Builds library for distribution
npm run test         # Vitest unit tests
```

### Backend Development  
```bash
cd backend
npm run dev          # tsx watch with hot reload
npm run db:migrate   # Database migrations
npm run db:seed      # Seed pharmaceutical data
```

### Key Commands
- **Demo**: `npm run demo` - Live component showcase
- **Full Stack**: Start both frontend demo + backend API
- **Tests**: `npm run test:coverage` - Component + API test coverage

## Biotech-Specific Patterns

### Type System (Critical for AI Understanding)
The project's core types in `src/types/biotech.ts` define pharmaceutical domain models:

```typescript
// Drug Development Pipeline
PhaseType: "Preclinical" | "Phase I" | "Phase II" | "Phase III" | "Filed" | "Approved"
TherapeuticArea: "Oncology" | "Immunology" | "Neurology" | "Rare Disease"
CompanyType: "Big Pharma" | "SMid" | "Biotech" | "China Pharma"

// Financial Modeling
Asset, DevelopmentMilestone, SalesMilestone, RoyaltyTier, GlobalParameters

// Intelligence Tracking  
Catalyst, Indication, Competitor, LauraDoc, RagAnswer
```

### OpenBB Integration Pattern
Financial market data flows through `src/integrations/openbb/`:
- `OpenBBTable` - Transforms financial data grids
- `OpenBBPlot` - Plotly.js chart integration
- Backend routes at `/api/market` provide real-time biotech market data

### Component Naming Conventions
- **Bio-prefixed**: `BioMetricGrid`, `BioAuroraDashboard` for pharmaceutical-specific components
- **Terminal Style**: ALL CAPS labels, `cornerBrackets` props, monospace typography
- **Status-driven**: Components use `success|warning|error|info` status variants consistently

## Integration Points

### External Dependencies
- **OpenBB Platform**: Financial data integration via `external/OpenBB/` submodule
- **Radix UI**: Headless component primitives (`@radix-ui/react-*`)
- **TanStack**: Virtual scrolling (`@tanstack/react-virtual`), data tables (`@tanstack/react-table`)
- **Plotly.js**: Scientific/financial charting (`plotly.js-dist-min`)

### Data Flow Architecture
1. **Backend APIs** (`/api/*`) aggregate pharmaceutical data
2. **WebSocket** (`/websocket`) streams real-time market updates  
3. **OpenBB Tables/Plots** render financial data with terminal styling
4. **Aurora Adapters** interface provides RAG search and document intelligence

### Cross-Component Communication
- **Toast System**: `useToast()` hook for global notifications
- **Theme Provider**: `data-theme` attributes cascade styling
- **WebSocket Client**: Real-time data updates via `src/services/websocket-client.ts`

## Common Gotchas

### Library vs Application Context
- **Library Build**: Components export for npm distribution
- **Demo Application**: `examples/` directory showcases all components
- **Backend Services**: Separate Node.js API in `backend/` directory

### Styling Architecture
- Import styles: `import '@deaxu/terminal-ui/styles'` 
- CSS Variables: `--accent-primary`, `--font-mono` for theming
- **No CSS-in-JS**: Pure CSS with design tokens in `src/styles/variables.css`

### Data Requirements
- **Mock Data**: `src/mocks/handlers.ts` provides MSW service worker responses
- **Real Data**: Backend APIs require PostgreSQL + QuestDB setup
- **Financial Data**: OpenBB integration requires separate API keys/setup

When building new biotech components, follow the atomic design pattern, use the established type system from `biotech.ts`, and maintain terminal aesthetic consistency with existing components.
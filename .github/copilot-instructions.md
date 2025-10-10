# Biotech Terminal Platform - Copilot Instructions

## Table of Contents

1. [Project Overview](#project-overview)
2. [Repository Architecture](#repository-architecture)
3. [Critical Developer Workflows](#critical-developer-workflows)
4. [Project-Specific Conventions](#project-specific-conventions)
5. [Integration Points & Data Flow](#integration-points--data-flow)
6. [Common Gotchas & Critical Knowledge](#common-gotchas--critical-knowledge)
7. [Key Files to Understand](#key-files-to-understand)
8. [Testing Guidelines](#testing-guidelines) ⭐ NEW
9. [Linting and Code Quality](#linting-and-code-quality) ⭐ NEW
10. [CI/CD Pipeline](#cicd-pipeline) ⭐ NEW
11. [Security Best Practices](#security-best-practices) ⭐ NEW
12. [Code Review Expectations](#code-review-expectations) ⭐ NEW
13. [Troubleshooting Guide](#troubleshooting-guide) ⭐ NEW
14. [Common Development Patterns](#common-development-patterns) ⭐ NEW
15. [Important Notes for AI Assistants](#important-notes-for-ai-assistants) ⭐ NEW

---

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

## Testing Guidelines

### Running Tests Before Making Changes
**ALWAYS run tests before making changes to understand baseline:**
```bash
# Check Python backend tests
cd platform && poetry run pytest -v

# Check frontend component tests
cd frontend-components && npm test

# Check terminal app tests
cd terminal && npm test

# Run all tests from root
npm run test
```

### Writing New Tests
**Follow existing test patterns:**
```typescript
// Component tests (Vitest + React Testing Library)
import { render, screen } from '@testing-library/react';
import { Panel } from './Panel';

test('renders with title', () => {
  render(<Panel title="TEST PANEL">Content</Panel>);
  expect(screen.getByText('TEST PANEL')).toBeInTheDocument();
});
```

```python
# Python tests (pytest with async support)
import pytest
from platform.core.database import Drug

@pytest.mark.asyncio
async def test_drug_creation(db_session):
    drug = Drug(name="Test Drug", phase="Phase I")
    db_session.add(drug)
    await db_session.commit()
    assert drug.id is not None
```

### Test Coverage Requirements
- **Python**: Aim for 80%+ coverage on new code (`poetry run pytest --cov`)
- **TypeScript**: Components should have unit tests for critical functionality
- **Integration**: Test API endpoints with actual database transactions
- **E2E**: Not required for minor changes, but recommended for major features

### When Tests Fail
1. **Read the error message carefully** - pytest and Vitest give detailed output
2. **Check if it's an existing failure** - some tests may be flaky or environment-dependent
3. **Run tests in isolation** - `npm test -- Button.test.tsx` or `pytest tests/test_drugs.py::test_specific`
4. **Check for async issues** - common in FastAPI tests, ensure `@pytest.mark.asyncio` is used

## Linting and Code Quality

### Python Linting (Ruff)
```bash
# Check all Python code
poetry run ruff check platform/

# Auto-fix issues
poetry run ruff check --fix platform/

# Format code (Black style)
poetry run ruff format platform/
```

**Common Ruff Errors:**
- `F401` - Unused import → Remove the import
- `E501` - Line too long → Break into multiple lines or use parentheses
- `F841` - Unused variable → Remove or prefix with underscore `_unused`
- `UP` - Outdated syntax → Use modern Python 3.9+ features

### TypeScript/JavaScript Linting (ESLint)
```bash
# Check frontend-components
cd frontend-components && npm run lint

# Check terminal app
cd terminal && npm run lint

# Auto-fix issues
npm run lint -- --fix
```

**Common ESLint Errors:**
- `react-hooks/exhaustive-deps` - Missing dependency in useEffect → Add to dependency array
- `@typescript-eslint/no-unused-vars` - Unused variable → Remove or prefix with underscore
- `react/prop-types` - Missing prop validation → Add TypeScript types (we don't use PropTypes)

### Type Checking
```bash
# Check TypeScript types before building
cd frontend-components && npm run typecheck
cd terminal && npm run typecheck

# Common fixes:
# - Add missing type annotations
# - Import types from correct location
# - Use proper generic types for hooks
```

### Pre-commit Checklist
Before committing code, run:
```bash
# 1. Format and lint
poetry run ruff format platform/
poetry run ruff check --fix platform/
npm run lint -- --fix

# 2. Type check
npm run typecheck

# 3. Run affected tests
npm run test:components  # If you changed components
poetry run pytest        # If you changed Python code

# 4. Build to ensure no errors
npm run build:components  # If you changed components
```

## CI/CD Pipeline

### GitHub Actions Workflow
**File**: `.github/workflows/npm-grunt.yml`

**What runs on every PR:**
1. **Node.js matrix build** (18.x, 20.x, 22.x)
2. **npm install** - Install all dependencies
3. **grunt** - Run build tasks

**Expected behavior:**
- All jobs must pass before merge
- Matrix tests ensure compatibility across Node versions
- Build failures will block PR merge

### Local CI Simulation
```bash
# Simulate CI build locally
npm install
npm run build
npm run test
npm run lint
```

## Security Best Practices

### Input Validation
**Always validate user input:**
```python
# Python - Use Pydantic models
from pydantic import BaseModel, validator

class DrugCreate(BaseModel):
    name: str
    phase: PhaseType
    
    @validator('name')
    def name_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Name cannot be empty')
        return v.strip()
```

```typescript
// TypeScript - Use Zod for runtime validation
import { z } from 'zod';

const drugSchema = z.object({
  name: z.string().min(1).max(100),
  phase: z.enum(['Preclinical', 'Phase I', 'Phase II', 'Phase III'])
});
```

### SQL Injection Prevention
- **Use SQLAlchemy ORM** - Never build raw SQL strings
- **Parameterized queries** - Use SQLAlchemy query builders
```python
# ✅ Good - Using ORM
drugs = await session.execute(
    select(Drug).where(Drug.name == user_input)
)

# ❌ Bad - Never do this
query = f"SELECT * FROM drugs WHERE name = '{user_input}'"
```

### XSS Prevention
- **React escapes by default** - Trust React's automatic escaping
- **Use `xss` library** - For user-generated HTML content
```typescript
import xss from 'xss';

// Only when you must render user HTML
const sanitized = xss(userContent);
```

### API Security
- **Rate limiting** - Configured in FastAPI middleware
- **CORS** - Properly configured in `platform/core/app.py`
- **Authentication** - Use JWT tokens for protected endpoints
- **Never commit secrets** - Use `.env` files (already in `.gitignore`)

### Dependency Security
```bash
# Check for vulnerabilities
npm audit
poetry check

# Update vulnerable packages
npm audit fix
poetry update <package>
```

## Code Review Expectations

### What Reviewers Look For

**1. Code Quality**
- [ ] Follows existing code style and patterns
- [ ] No hardcoded values (use constants or config)
- [ ] Proper error handling (try/catch, error boundaries)
- [ ] No console.log() in production code
- [ ] TypeScript types are specific (not `any`)

**2. Testing**
- [ ] New functionality has tests
- [ ] Tests cover edge cases
- [ ] Tests are not flaky (run multiple times)
- [ ] Mocks are used appropriately

**3. Documentation**
- [ ] JSDoc/docstrings for public APIs
- [ ] README updated if adding new features
- [ ] Type definitions exported properly
- [ ] Examples added if needed

**4. Performance**
- [ ] No N+1 queries in database operations
- [ ] Large lists use virtualization (`@tanstack/react-virtual`)
- [ ] Expensive calculations are memoized
- [ ] Async operations don't block UI

**5. Accessibility**
- [ ] Semantic HTML elements used
- [ ] ARIA labels for custom components
- [ ] Keyboard navigation works
- [ ] Color contrast meets WCAG AA (ideally AAA)

**6. Security**
- [ ] User input is validated
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] Secrets not committed

### PR Description Template
```markdown
## What changed
Brief description of the change

## Why
Explanation of the motivation

## Testing
How to test this change

## Screenshots
(If UI change) Before/After screenshots

## Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Linting passes
- [ ] No breaking changes (or documented)
```

## Troubleshooting Guide

### Build Failures

**"Cannot find module '@biotech-terminal/frontend-components'"**
```bash
# Components not built yet
cd frontend-components && npm run build
cd ../terminal && npm run dev
```

**"Module not found: Error: Can't resolve 'X'"**
```bash
# Missing dependency
npm install
# Or for specific workspace
cd frontend-components && npm install
```

**"Type error: Cannot find type definition"**
```bash
# Missing type packages or stale types
npm install
npm run typecheck  # See specific errors
```

### Test Failures

**"Database connection error"**
```bash
# Python tests need database
cd platform
poetry run python -c "from platform.core.database import init_db; import asyncio; asyncio.run(init_db())"
poetry run pytest
```

**"Port already in use"**
```bash
# Kill existing processes
lsof -ti:8000 | xargs kill -9  # Python backend
lsof -ti:3000 | xargs kill -9  # Terminal app
lsof -ti:3001 | xargs kill -9  # Node.js backend
```

**"Timeout errors in tests"**
- Increase timeout in test config
- Check if database/external services are slow
- Run fewer tests in parallel

### Runtime Errors

**"CORS error in browser"**
- Check `CORS_ORIGINS` in `.env` file
- Ensure backend is running on correct port
- Clear browser cache

**"WebSocket connection failed"**
```bash
# Ensure Node.js backend is running
cd backend && npm run dev
```

**"Module 'X' has no exported member 'Y'"**
- Check import path (use subpath imports)
- Rebuild components: `cd frontend-components && npm run build`
- Clear node_modules: `rm -rf node_modules && npm install`

### Performance Issues

**"Slow database queries"**
```python
# Add indexes to frequently queried fields
# In database.py
class Drug(Base):
    __tablename__ = "drugs"
    
    name = Column(String, index=True)  # Add index=True
    phase = Column(String, index=True)
```

**"Slow rendering of large lists"**
```typescript
// Use TanStack Virtual
import { useVirtualizer } from '@tanstack/react-virtual';

// Virtualize rows
const rowVirtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 35,
});
```

**"Memory leaks in React"**
- Clean up subscriptions in useEffect
- Cancel fetch requests on unmount
- Avoid creating functions in render

## Common Development Patterns

### Adding a New API Endpoint
```python
# 1. Create endpoint in platform/core/routers.py
from fastapi import APIRouter

biotech_router = APIRouter()

@biotech_router.get("/drugs")
async def get_drugs(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Drug))
    return result.scalars().all()

# 2. Register in app.py
app.include_router(biotech_router, prefix="/api/v1/biotech")

# 3. Test with curl
curl http://localhost:8000/api/v1/biotech/drugs
```

### Adding a New Component
```typescript
// 1. Create in frontend-components/src/terminal/atoms/
export interface MyComponentProps {
  title: string;
  variant?: 'primary' | 'secondary';
}

export const MyComponent: React.FC<MyComponentProps> = ({ title, variant = 'primary' }) => {
  return <div className={`my-component ${variant}`}>{title}</div>;
};

// 2. Export from index.ts
export { MyComponent } from './atoms/MyComponent/MyComponent';

// 3. Add test
// MyComponent.test.tsx

// 4. Use in terminal app
import { MyComponent } from '@biotech-terminal/frontend-components/terminal';
```

### Adding a New Database Model
```python
# 1. Define in platform/core/database.py
class NewModel(Base):
    __tablename__ = "new_models"
    
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

# 2. Create migration (for production)
# Use Alembic for migrations

# 3. For development, recreate database
rm biotech_terminal.db
poetry run python -c "from platform.core.database import init_db; import asyncio; asyncio.run(init_db())"
```

## Important Notes for AI Assistants

### When Making Changes
1. **Read existing code first** - Understand patterns before changing
2. **Run tests before and after** - Ensure you don't break existing functionality
3. **Follow the monorepo structure** - Changes may need to be made in multiple workspaces
4. **Build dependencies matter** - frontend-components must be built before terminal can use it
5. **Check both backends** - Python and Node.js backends serve different purposes

### When You're Unsure
1. **Check docs/** folder for detailed guides
2. **Look at existing similar code** for patterns
3. **Run `npm run dev` to see it working** before making changes
4. **Ask for clarification** rather than guessing

### Red Flags to Avoid
- ❌ Don't delete tests without understanding why they exist
- ❌ Don't commit `.env` files or secrets
- ❌ Don't use `any` type in TypeScript without good reason
- ❌ Don't bypass security validations
- ❌ Don't ignore linting errors
- ❌ Don't skip writing tests for new functionality
- ❌ Don't hardcode API URLs (use environment variables)
- ❌ Don't modify `package-lock.json` or `poetry.lock` manually
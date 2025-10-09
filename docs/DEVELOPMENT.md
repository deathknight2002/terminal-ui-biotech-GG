# Development Guide

## Repository Structure

This repository follows the OpenBB platform architecture pattern with clear separation between components:

```
biotech-terminal-platform/
├── platform/                  # Python backend platform
│   ├── core/                  # FastAPI application
│   ├── providers/             # Data provider modules
│   ├── extensions/            # Analytics and modeling (planned)
│   └── models/                # Database schemas
├── frontend-components/       # Reusable React components
│   ├── terminal/              # Core terminal UI components
│   ├── tables/                # Data grid components
│   ├── plotly/                # Chart components
│   └── biotech/               # Biotech-specific widgets
├── terminal/                  # Full terminal application
├── examples/                  # Component examples and demos
├── docs/                      # Documentation
└── scripts/                   # Setup and utility scripts
```

## Quick Start

### One-Command Setup
```bash
npm run setup
```

### Development
```bash
# Start all services
npm run start:dev

# Individual services
npm run dev:backend      # Python API at :8000
npm run dev:components   # Component dev server at :5173
npm run dev:terminal     # Terminal app at :3000
```

## Platform Backend (Python)

### Architecture
- **FastAPI**: High-performance async web framework
- **SQLAlchemy**: Database ORM with SQLite for development
- **Poetry**: Dependency management
- **Provider Pattern**: Modular data sources

### Key Files
- `platform/core/app.py`: Main FastAPI application
- `platform/core/database.py`: Database models and setup
- `platform/providers/`: Data provider implementations
- `platform/core/endpoints/`: API route handlers

### Adding New Data Provider
```python
# platform/providers/my_provider.py
from .base import Provider

class MyProvider(Provider):
    async def fetch_data(self, **kwargs):
        return {"data": "example"}
    
    def get_schema(self):
        return {"required": ["field1"]}
```

## Frontend Components

### Architecture
- **Atomic Design**: atoms → molecules → organisms
- **Modular Exports**: Components grouped by purpose
- **TypeScript**: Full type safety
- **CSS Variables**: Theming system

### Component Organization
```
frontend-components/
├── terminal/              # Core UI (Button, Input, Panel)
├── tables/                # OpenBB-style data tables
├── plotly/                # Financial charts
└── biotech/               # Drug pipeline, catalysts
```

### Using Components
```tsx
import { Panel, Metric } from '@biotech-terminal/frontend-components/terminal';
import { DrugPipeline } from '@biotech-terminal/frontend-components/biotech';
import '@biotech-terminal/frontend-components/styles';

<Panel title="PIPELINE" cornerBrackets>
  <DrugPipeline data={pipelineData} />
</Panel>
```

## Terminal Application

Full-featured biotech terminal built with the platform:

### Features
- **Real-time Data**: WebSocket connections to backend
- **Multiple Views**: Dashboard, pipeline, market, analytics
- **State Management**: Zustand for client state
- **Routing**: React Router for navigation

### Key Files
- `terminal/src/App.tsx`: Main application
- `terminal/src/pages/`: Page components
- `terminal/src/hooks/`: Custom hooks for data fetching
- `terminal/src/store/`: Global state management

## Data Flow

### Backend → Frontend
```
1. Data Providers → Platform API → WebSocket
2. Terminal App ← HTTP/WS ← Platform API
3. Components ← Props ← Terminal App
```

### Adding New Endpoint
```python
# platform/core/endpoints/my_endpoint.py
@router.get("/my-data")
async def get_my_data():
    provider = MyProvider()
    data = await provider.fetch_data()
    return data
```

```tsx
// terminal/src/hooks/useMyData.ts
export const useMyData = () => {
  return useQuery({
    queryKey: ['my-data'],
    queryFn: () => api.get('/my-data')
  });
};
```

## Testing

### Backend Tests
```bash
poetry run pytest
poetry run pytest --cov=platform
```

### Frontend Tests
```bash
npm run test:components
npm run test:terminal
```

### Integration Tests
```bash
npm run test  # Runs all tests
```

## Building & Deployment

### Development Build
```bash
npm run build:all
```

### Production Deployment
```bash
# Backend
poetry build
poetry run uvicorn platform.core.app:app --host 0.0.0.0 --port 8000

# Frontend
npm run build:components
npm run build:terminal
# Serve terminal/dist/ as static files
```

## Configuration

### Database Setup

The platform uses SQLite for development (PostgreSQL for production). The database is automatically initialized on first run:

```bash
# Database is created automatically when running:
poetry run uvicorn platform.core.app:app

# Or initialize manually:
python -c "from platform.core.database import init_db; import asyncio; asyncio.run(init_db())"
```

**Database Migrations:**
- Schema migrations are located in `platform/core/migrations/`
- The `init_db()` function creates all tables and seeds sample data
- Database file: `biotech_terminal.db` (gitignored, not committed to repo)

**Seed Data:**
- Sample pharmaceutical data is automatically loaded via `seed_data.py`
- Includes drugs, clinical trials, companies, and catalyst events
- Run setup scripts to initialize the database with seed data

### Environment Variables
```bash
# .env
DEBUG=true
DATABASE_URL=sqlite:///./biotech_terminal.db
API_PORT=8000
CORS_ORIGINS=["http://localhost:3000"]

# Optional external APIs
FDA_API_KEY=
CLINICALTRIALS_API_KEY=
```

### Theme Configuration
```css
/* Terminal theme variables */
:root {
  --accent-primary: #ff9500;
  --bg-terminal: #0a0e27;
  --text-primary: #ffffff;
  --font-mono: 'JetBrains Mono', monospace;
}
```

## Contributing

### Code Style
- **Python**: Black formatter, Ruff linter
- **TypeScript**: ESLint, Prettier
- **Commits**: Conventional commits

### Pull Request Process
1. Fork repository
2. Create feature branch
3. Add tests for new functionality
4. Update documentation
5. Submit pull request

### Component Guidelines
- Follow atomic design principles
- Include TypeScript types
- Add Storybook stories
- Terminal aesthetic consistency
- Accessibility (WCAG AA)

## Troubleshooting

### Common Issues

**Backend won't start**
```bash
# Check Python version
python3 --version  # Should be 3.9+

# Reinstall dependencies
poetry install --no-cache
```

**Frontend build fails**
```bash
# Clear node_modules
rm -rf node_modules
npm install

# Check Node version
node --version  # Should be 18+
```

**Database issues**
```bash
# Reset database
rm biotech_terminal.db
poetry run python -c "from platform.core.database import init_db; import asyncio; asyncio.run(init_db())"
```

### Performance Tips

1. **Backend**: Use async/await for I/O operations
2. **Frontend**: Lazy load routes and components
3. **Database**: Add indexes for frequently queried fields
4. **Charts**: Virtualize large datasets with TanStack Virtual

## API Reference

### Core Endpoints

**GET /api/v1/biotech/drugs**
- Get drug pipeline data
- Query params: `therapeutic_area`, `phase`, `company`, `limit`

**GET /api/v1/biotech/clinical-trials**
- Get clinical trial data
- Query params: `phase`, `status`, `condition`, `sponsor`

**GET /api/v1/biotech/catalysts**
- Get upcoming market catalysts
- Query params: `upcoming_days`, `company`, `event_type`

**WebSocket /ws**
- Real-time data updates
- Events: `market_data`, `catalyst_update`, `trial_update`

### Component API

**Panel Component**
```tsx
interface PanelProps {
  title?: string;
  cornerBrackets?: boolean;
  children: ReactNode;
  className?: string;
}
```

**DrugPipeline Component**
```tsx
interface DrugPipelineProps {
  data: Drug[];
  groupBy?: 'phase' | 'company' | 'therapeutic_area';
  onDrugClick?: (drug: Drug) => void;
}
```
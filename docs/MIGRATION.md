# Migration Guide

## Repository Reorganization Plan

This guide helps migrate from the current UI library structure to the new OpenBB-style platform architecture.

## Overview of Changes

### Before (Current Structure)
```
terminal-ui-biotech-GG/
├── src/                    # UI library source
├── backend/                # Separate backend
├── examples/               # Demo application
└── external/OpenBB/        # Git submodule
```

### After (New Structure)
```
biotech-terminal-platform/
├── platform/               # Python backend platform
├── frontend-components/    # Reusable React components
├── terminal/               # Full terminal application
├── examples/               # Component showcase
└── docs/                   # Documentation
```

## Migration Steps

### Step 1: Platform Backend Setup

**Move and reorganize backend code:**

```bash
# Create new platform structure
mkdir -p platform/{core,providers,extensions,models}

# Move existing backend files
mv backend/src/* platform/core/
mv backend/package.json platform/core/

# Update Python project structure
# (Already created: platform/core/app.py, database.py, etc.)
```

**Key Changes:**
- FastAPI replaces Express.js
- SQLAlchemy replaces manual database handling
- Provider pattern for data sources
- Async/await throughout

### Step 2: Frontend Components Reorganization

**Reorganize component library:**

```bash
# Create frontend-components structure
mkdir -p frontend-components/{terminal,tables,plotly,biotech}

# Move existing components by category
# Terminal UI components
mv src/components/atoms/* frontend-components/terminal/
mv src/components/molecules/* frontend-components/terminal/
mv src/components/organisms/* frontend-components/terminal/

# Specialized components
mv src/components/visualizations/* frontend-components/plotly/
mv src/integrations/openbb/* frontend-components/tables/
# Biotech-specific components will be created new
```

**Component Mapping:**
- `src/components/` → `frontend-components/terminal/`
- `src/integrations/openbb/` → `frontend-components/tables/`
- `src/components/visualizations/` → `frontend-components/plotly/`
- New biotech components → `frontend-components/biotech/`

### Step 3: Terminal Application Creation

**Create new terminal application:**

```bash
# Terminal app structure
mkdir -p terminal/src/{pages,components,hooks,store,utils}

# Move examples content as starting point
cp -r examples/* terminal/
```

**Terminal App Features:**
- Full-featured biotech intelligence platform
- Real-time data from platform backend
- Multi-page application with routing
- State management with Zustand
- Integration with all component packages

### Step 4: Data Provider Migration

**Convert existing backend routes to providers:**

**Current backend/src/routes/biotech-data.ts** → **platform/providers/biotech_provider.py**
**Current backend/src/routes/market-data.ts** → **platform/providers/market_provider.py**
**Current backend/src/routes/financial-modeling.ts** → **platform/extensions/financial/**

### Step 5: Type System Migration

**TypeScript types migration:**

```bash
# Move biotech types to platform
cp src/types/biotech.ts platform/models/biotech_types.py

# Update frontend components to use new types
# Generate TypeScript types from Python models
```

**Type Generation:**
- Python Pydantic models → TypeScript interfaces
- Shared types between backend and frontend
- Automatic type generation pipeline

### Step 6: Integration Layer

**OpenBB integration updates:**

```bash
# Move OpenBB integration to frontend-components
mv src/integrations/openbb/* frontend-components/tables/
mv external/OpenBB/frontend-components/* frontend-components/tables/

# Update imports and dependencies
```

## File-by-File Migration Guide

### Backend Files

| Current File | New Location | Changes |
|--------------|--------------|---------|
| `backend/src/index.ts` | `platform/core/app.py` | Express → FastAPI |
| `backend/src/routes/biotech-data.ts` | `platform/core/endpoints/biotech.py` | Router → FastAPI router |
| `backend/src/routes/market-data.ts` | `platform/providers/market_provider.py` | Service → Provider pattern |
| `backend/src/database/connection.ts` | `platform/core/database.py` | Manual DB → SQLAlchemy |

### Frontend Files

| Current File | New Location | Changes |
|--------------|--------------|---------|
| `src/components/atoms/Button.tsx` | `frontend-components/terminal/Button.tsx` | No changes |
| `src/components/organisms/Panel.tsx` | `frontend-components/terminal/Panel.tsx` | No changes |
| `src/integrations/openbb/OpenBBTable.tsx` | `frontend-components/tables/OpenBBTable.tsx` | Package import updates |
| `src/types/biotech.ts` | `frontend-components/biotech/types.ts` | Split into component-specific types |

### Application Files

| Current File | New Location | Changes |
|--------------|--------------|---------|
| `examples/App.tsx` | `terminal/src/App.tsx` | Full app instead of demo |
| `examples/BiotechExample.tsx` | `terminal/src/pages/Dashboard.tsx` | Page component |
| `src/mocks/handlers.ts` | `terminal/src/mocks/handlers.ts` | Updated API endpoints |

## Code Changes Required

### 1. Import Path Updates

**Before:**
```tsx
import { Button, Panel } from '@deaxu/terminal-ui';
import '@deaxu/terminal-ui/styles';
```

**After:**
```tsx
import { Button, Panel } from '@biotech-terminal/frontend-components/terminal';
import '@biotech-terminal/frontend-components/styles';
```

### 2. API Integration Updates

**Before (TypeScript/Express):**
```typescript
app.get('/api/biotech/drugs', async (req, res) => {
  const drugs = await getDrugs();
  res.json(drugs);
});
```

**After (Python/FastAPI):**
```python
@router.get("/drugs")
async def get_drugs(db: Session = Depends(get_db)):
    drugs = db.query(Drug).all()
    return {"data": drugs}
```

### 3. Component Export Updates

**Before:**
```typescript
// src/index.ts
export { Button } from './components/atoms/Button';
export { Panel } from './components/organisms/Panel';
```

**After:**
```typescript
// frontend-components/terminal/index.ts
export { Button } from './Button';
export { Panel } from './Panel';

// frontend-components/index.ts
export * from './terminal';
export * from './tables';
export * from './plotly';
export * from './biotech';
```

### 4. Type System Updates

**Before:**
```typescript
// src/types/biotech.ts
export interface Drug {
  name: string;
  company: string;
  phase: PhaseType;
}
```

**After (Python):**
```python
# platform/models/biotech.py
class Drug(BaseModel):
    name: str
    company: str
    phase: PhaseType
```

**After (TypeScript):**
```typescript
// Generated from Python models
export interface Drug {
  name: string;
  company: string;
  phase: PhaseType;
}
```

## Testing Strategy

### 1. Component Tests
```bash
# Test existing components work in new structure
cd frontend-components && npm test

# Test component exports
npm run test:exports
```

### 2. Integration Tests
```bash
# Test backend API endpoints
cd platform && poetry run pytest

# Test frontend-backend integration
npm run test:integration
```

### 3. Application Tests
```bash
# Test full terminal application
cd terminal && npm test

# Test end-to-end workflows
npm run test:e2e
```

## Deployment Updates

### Development
```bash
# Before
npm run dev          # Frontend only
cd backend && npm run dev  # Backend separately

# After  
npm run start:dev    # Full platform with hot reload
npm run dev:backend  # Backend only
npm run dev:terminal # Terminal app only
```

### Production
```bash
# Before
npm run build        # UI library
cd backend && npm run build  # Backend

# After
npm run build:all    # Everything
poetry build         # Python package
npm run build:components  # Component library
npm run build:terminal   # Terminal application
```

## Timeline and Phases

### Phase 1: Platform Backend (Week 1)
- ✅ Create Python FastAPI structure
- ✅ Migrate database models
- ✅ Create data providers
- ✅ Set up API endpoints

### Phase 2: Component Reorganization (Week 2)
- Move components to new structure
- Update imports and exports
- Test component functionality
- Update documentation

### Phase 3: Terminal Application (Week 3)
- Create full terminal app
- Integrate with backend APIs
- Add state management
- Implement routing

### Phase 4: Integration & Testing (Week 4)
- End-to-end integration
- Performance optimization
- Documentation updates
- Deployment setup

## Rollback Plan

If migration issues occur:

1. **Keep original structure** alongside new structure
2. **Git branches** for each migration phase
3. **Backup scripts** to restore original state
4. **Progressive migration** - move components incrementally

## Support and Resources

### Documentation
- [Development Guide](./DEVELOPMENT.md)
- [API Reference](./API.md)
- [Component Storybook](./STORYBOOK.md)

### Help
- Check existing issues in repository
- Create new issue with `migration` label
- Reference OpenBB platform patterns

---

**Migration Status: Phase 1 Complete ✅**

The platform backend is ready. Next steps:
1. Run setup script: `npm run setup`
2. Test backend: `npm run dev:backend`
3. Begin Phase 2: Component reorganization
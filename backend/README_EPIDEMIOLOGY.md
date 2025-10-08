# Epidemiology Intelligence Platform - Backend Setup

## Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- Redis 6+
- npm or yarn

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Copy environment template
cp .env.example .env

# 3. Edit .env with your database credentials
# Required:
#   DATABASE_URL="postgresql://user:password@localhost:5432/epidemiology_db"
#   REDIS_URL="redis://localhost:6379"

# 4. Generate Prisma client
npm run db:generate

# 5. Run database migrations
npm run db:migrate

# 6. Seed database with initial data
npm run db:seed

# 7. Start development server
npm run dev
```

Server will start on http://localhost:3001

## Available Scripts

### Development
```bash
npm run dev              # Start with hot reload
npm run build            # Build for production
npm start                # Run production build
npm run typecheck        # Check TypeScript errors
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint errors
```

### Database
```bash
npm run db:generate         # Generate Prisma client
npm run db:migrate          # Run migrations (dev)
npm run db:migrate:deploy   # Deploy migrations (prod)
npm run db:seed             # Seed database
npm run db:studio           # Open Prisma Studio GUI
```

### ETL (Extract, Transform, Load)
```bash
npm run etl:all          # Run all ETL pipelines
npm run etl:seer         # Run SEER cancer data ETL
npm run etl:who          # Run WHO disease burden ETL
npm run etl:cdc          # Run CDC chronic disease ETL
```

### Testing
```bash
npm test                 # Run tests
npm run test:coverage    # Run with coverage report
```

## Database Setup

### PostgreSQL

Create database:
```sql
CREATE DATABASE epidemiology_db;
CREATE USER epi_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE epidemiology_db TO epi_user;
```

Update `.env`:
```
DATABASE_URL="postgresql://epi_user:your_password@localhost:5432/epidemiology_db"
```

### Redis

Start Redis:
```bash
# macOS
brew services start redis

# Ubuntu
sudo systemctl start redis

# Docker
docker run -d -p 6379:6379 redis:7-alpine
```

Update `.env`:
```
REDIS_URL="redis://localhost:6379"
```

## ETL Pipelines

### Overview

The platform includes ETL connectors for three authoritative sources:

1. **SEER** (Surveillance, Epidemiology, and End Results)
   - 5 major cancers
   - Survival rates and mortality trends
   - Race/ethnicity breakdowns
   
2. **WHO** (World Health Organization)
   - 4 infectious diseases
   - Global disease burden (DALYs, YLLs, YLDs)
   - Regional distribution
   
3. **CDC** (Centers for Disease Control and Prevention)
   - 7 chronic diseases
   - US state-level data
   - Age-stratified demographics

### Running ETL

**First time setup:**
```bash
npm run db:seed
```

This will:
1. Clear existing data (optional)
2. Initialize ICD crosswalk mappings
3. Run all ETL pipelines
4. Report results

**Updating data:**
```bash
npm run etl:all
```

Safe to run multiple times - ETL is idempotent (won't create duplicates).

**Update specific source:**
```bash
npm run etl:seer     # Update only cancer data
npm run etl:who      # Update only WHO data
npm run etl:cdc      # Update only CDC data
```

### ETL Results

Each run reports:
- Diseases processed
- Metrics created (new)
- Metrics updated (changed)
- Metrics skipped (unchanged)
- Errors encountered
- Duration

Example output:
```
✅ ETL pipelines completed successfully!
   Total diseases processed: 16
   Metrics created: 428
   Metrics updated: 0
   Metrics skipped (unchanged): 0
   Errors: 0
   Duration: 18.42s
```

## Data Model

### Disease
```typescript
{
  id: string;           // Unique identifier
  name: string;         // Disease name
  icd10: string;        // ICD-10 code (unique)
  icd11?: string;       // ICD-11 code
  snomed?: string;      // SNOMED CT code
  category: string;     // Disease category
  description?: string; // Description
}
```

### Metric
```typescript
{
  id: string;
  diseaseId: string;
  source: string;         // 'SEER' | 'WHO' | 'CDC'
  metricType: string;     // 'incidence' | 'mortality' | etc.
  valueNumeric?: number;  // Numeric value
  valueJson?: any;        // Complex structured data
  unit?: string;          // 'per_100k' | 'percentage' | etc.
  sex?: string;           // 'M' | 'F' | 'All'
  ageGroup?: string;      // '0-18' | '19-44' | etc.
  raceEthnicity?: string;
  regionCode?: string;    // ISO code
  regionLevel?: string;   // 'country' | 'state' | etc.
  year?: number;
}
```

### Provenance (Audit Trail)
```typescript
{
  metricId: string;
  sourceName: string;
  sourceUrl: string;
  sourceVersion?: string;
  retrievedAt: Date;
  ingestedAt: Date;
  hash: string;           // SHA-256 hash
  reliabilityScore?: number; // 0-100
  notes?: string;
}
```

## API Endpoints (Current)

### Search
```
GET /api/epidemiology/search?query=diabetes&category=Metabolic
```

### Get All
```
GET /api/epidemiology/models
```

### Get By ID
```
GET /api/epidemiology/models/:id
```

### Get By Category
```
GET /api/epidemiology/categories/:category
```

### Get Statistics
```
GET /api/epidemiology/metadata/statistics
```

## Services

### Audit Service

Provenance and audit trail queries.

```typescript
import { getMetricProvenance, getDiseaseSources } from './services/audit-service';

// Get full provenance for a metric
const provenance = await getMetricProvenance(metricId);

// Get all data sources for a disease
const sources = await getDiseaseSources(diseaseId);
```

### Compare Service

Multi-disease analytics and comparison.

```typescript
import { compareDiseases, getDiseaseTrend } from './services/compare-service';

// Compare multiple diseases
const comparison = await compareDiseases(
  ['disease1', 'disease2'],
  ['incidence', 'mortality'],
  { region: 'USA', ageGroup: 'All' }
);

// Get trend over time
const trend = await getDiseaseTrend(
  diseaseId,
  'incidence',
  { fromYear: 2000, toYear: 2024 }
);
```

### Export Service

CSV and JSON export with citations.

```typescript
import { exportToCSV, exportToJSON } from './services/export-service';

// Export to CSV
const csvExport = await exportToCSV({
  diseaseIds: ['disease1', 'disease2'],
  metricTypes: ['incidence', 'mortality'],
  fromYear: 2020,
  toYear: 2024
});

// Export to JSON
const jsonExport = await exportToJSON({
  diseaseIds: ['disease1'],
  metricTypes: ['incidence']
});
```

## Environment Variables

### Required
```bash
DATABASE_URL="postgresql://..."
REDIS_URL="redis://..."
```

### Optional
```bash
# Server
PORT="3001"
NODE_ENV="development"
JWT_SECRET="your-secret"

# API Keys (if required by sources)
SEER_API_KEY=""
WHO_API_KEY=""
CDC_API_KEY=""

# Rate Limiting
RATE_LIMIT_WINDOW_MS="900000"
RATE_LIMIT_MAX_REQUESTS="100"

# Caching
CACHE_TTL_SECONDS="900"
CACHE_MAX_SIZE="1000"

# ETL
ETL_BATCH_SIZE="100"
ETL_RETRY_ATTEMPTS="3"
ETL_RETRY_DELAY_MS="5000"

# Logging
LOG_LEVEL="info"
LOG_FORMAT="json"

# CORS
CORS_ORIGIN="http://localhost:3000,http://localhost:5173"
```

## Troubleshooting

### Database Connection Failed

```bash
# Test connection
psql -U epi_user -d epidemiology_db

# Check DATABASE_URL in .env
echo $DATABASE_URL
```

### Redis Connection Failed

```bash
# Test connection
redis-cli ping
# Should return: PONG

# Check REDIS_URL in .env
echo $REDIS_URL
```

### Prisma Client Not Generated

```bash
# Regenerate client
npm run db:generate

# Check output directory
ls -la src/generated/prisma/
```

### ETL Fails

```bash
# Check logs
tail -f logs/etl.log

# Run with verbose logging
LOG_LEVEL=debug npm run etl:seer

# Test database connection
npm run db:studio
```

### Port Already in Use

```bash
# Find process using port 3001
lsof -ti:3001

# Kill process
kill -9 $(lsof -ti:3001)

# Or change port in .env
PORT=3002 npm run dev
```

## Performance Tips

### Optimize Queries

```typescript
// Include only needed relations
const disease = await prisma.disease.findUnique({
  where: { id },
  select: {
    id: true,
    name: true,
    icd10: true,
    // Don't include metrics if not needed
  }
});
```

### Use Caching

```typescript
import { getRedisClient } from './db';

const redis = await getRedisClient();

// Check cache first
const cached = await redis.get(`disease:${id}`);
if (cached) return JSON.parse(cached);

// Query database
const disease = await prisma.disease.findUnique({ where: { id } });

// Cache result (15 minutes)
await redis.setEx(`disease:${id}`, 900, JSON.stringify(disease));
```

### Batch Operations

```typescript
// Bad: N+1 queries
for (const id of diseaseIds) {
  const disease = await prisma.disease.findUnique({ where: { id } });
}

// Good: Single query
const diseases = await prisma.disease.findMany({
  where: { id: { in: diseaseIds } }
});
```

## Monitoring

### Health Check

```bash
curl http://localhost:3001/health
```

### Database Stats

```sql
-- Table sizes
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size(tablename::regclass)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(tablename::regclass) DESC;

-- Row counts
SELECT 
  'diseases' AS table_name, COUNT(*) FROM diseases
UNION ALL
SELECT 'metrics', COUNT(*) FROM metrics
UNION ALL
SELECT 'provenance', COUNT(*) FROM provenance
UNION ALL
SELECT 'crosswalks', COUNT(*) FROM crosswalks;
```

### Redis Stats

```bash
# Connect to Redis CLI
redis-cli

# Get info
INFO stats

# Check keys
KEYS *

# Get cache hit rate
INFO stats | grep keyspace_hits
```

## Development Workflow

1. **Make schema changes**
   ```bash
   # Edit prisma/schema.prisma
   npm run db:migrate
   npm run db:generate
   ```

2. **Update services**
   ```bash
   # Edit files in src/services/
   npm run typecheck
   npm run lint
   ```

3. **Test changes**
   ```bash
   npm test
   npm run test:coverage
   ```

4. **Run ETL**
   ```bash
   npm run etl:all
   ```

5. **Start dev server**
   ```bash
   npm run dev
   ```

## Production Deployment

```bash
# 1. Set environment
export NODE_ENV=production

# 2. Install dependencies
npm ci

# 3. Generate Prisma client
npm run db:generate

# 4. Deploy migrations
npm run db:migrate:deploy

# 5. Build application
npm run build

# 6. Run ETL
npm run etl:all

# 7. Start server
npm start
```

## Support

- Documentation: `docs/EPIDEMIOLOGY_PLATFORM_EXPANSION.md`
- Data Governance: `docs/DATA_GOVERNANCE.md`
- Architecture: `docs/ARCHITECTURE_OVERVIEW.md`
- Issues: https://github.com/deathknight2002/terminal-ui-biotech-GG/issues

## License

MIT - See LICENSE file

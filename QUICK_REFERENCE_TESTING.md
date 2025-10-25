# Quick Reference: Testing and Code Quality

## Quick Commands

### E2E Testing
```bash
# Run all E2E tests
npm run test:e2e

# Run specific test suite
npx playwright test tests/e2e/health-check.spec.ts
npx playwright test tests/e2e/observability.spec.ts
npx playwright test tests/e2e/api-authentication.spec.ts
npx playwright test tests/e2e/database-storage.spec.ts
npx playwright test tests/e2e/evidence-graph.spec.ts

# Interactive mode
npm run test:e2e:ui

# Headed mode (see browser)
npm run test:e2e:headed

# Debug mode
npx playwright test --debug
```

### Pre-commit Hooks
```bash
# Install hooks
pre-commit install

# Run all hooks
pre-commit run --all-files

# Run specific hooks
pre-commit run black --all-files
pre-commit run prettier --all-files
pre-commit run flake8 --all-files
```

### Manual Code Quality Checks

#### Python
```bash
# Format code
poetry run black bt_platform/

# Sort imports
poetry run isort bt_platform/

# Lint code
poetry run flake8 bt_platform/
poetry run ruff check bt_platform/

# Security scan
poetry run bandit -r bt_platform/
```

#### JavaScript/TypeScript
```bash
# Format code
npx prettier --write "tests/e2e/**/*.ts"

# Lint code
npx eslint "tests/e2e/**/*.ts"

# Type check
npx tsc --noEmit
```

## Environment Setup

### .env File
```bash
# Copy example
cp .env.example .env

# Edit configuration
nano .env
```

### Required Settings
```bash
# Observability
METRICS_ENABLED=true
LOG_LEVEL=INFO
LOG_FORMAT=json

# Optional: Sentry
SENTRY_DSN=https://your-dsn@sentry.io/project
SENTRY_ENVIRONMENT=development

# Optional: Authentication
API_TOKEN_ENABLED=true
API_TOKEN=your-secret-token

# Database
DATABASE_URL=sqlite:///./biotech_terminal.db
EVIDENCE_GRAPH_STORAGE=sqlite
```

## Development Workflow

### 1. Before Starting Work
```bash
# Update dependencies
npm install
poetry install

# Install pre-commit hooks
pre-commit install

# Start development servers
npm run dev:backend  # Python backend (port 8000)
npm run dev:terminal # Terminal app (port 3000)
```

### 2. During Development
```bash
# Run pre-commit on changes
pre-commit run

# Test specific feature
npx playwright test tests/e2e/health-check.spec.ts
```

### 3. Before Committing
```bash
# Run all quality checks
pre-commit run --all-files

# Run all tests
npm run test:e2e

# Check git status
git status
```

### 4. Commit and Push
```bash
# Add files
git add .

# Commit (hooks run automatically)
git commit -m "Your message"

# Push
git push
```

## Testing Checklist

### Before Each PR
- [ ] All E2E tests pass
- [ ] Pre-commit hooks pass
- [ ] No TypeScript errors
- [ ] No Python linting errors
- [ ] Documentation updated
- [ ] Environment variables documented

### Running Complete Test Suite
```bash
# 1. Pre-commit hooks
pre-commit run --all-files

# 2. E2E tests
npm run test:e2e

# 3. Python tests (if applicable)
poetry run pytest

# 4. Type checking
npx tsc --noEmit
```

## Common Issues and Solutions

### Playwright Installation Issues
```bash
# Install browsers manually
npx playwright install chromium --force

# Install with system dependencies
sudo npx playwright install-deps chromium
```

### Pre-commit Hooks Slow
```bash
# Run only on changed files
pre-commit run

# Skip specific hooks
SKIP=bandit,eslint pre-commit run
```

### Port Already in Use
```bash
# Kill process on port
lsof -ti:8000 | xargs kill -9
lsof -ti:3000 | xargs kill -9
```

### TypeScript Errors
```bash
# Clean and rebuild
rm -rf node_modules package-lock.json
npm install

# Check specific file
npx tsc --noEmit tests/e2e/health-check.spec.ts
```

## Useful Scripts

### Test Health Check
```bash
# Check if backend is running
curl http://localhost:8000/health

# Check metrics
curl http://localhost:8000/metrics

# Check with authentication
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:8000/api/v1/drugs
```

### Clean Build
```bash
# Remove build artifacts
rm -rf dist/ build/ *.egg-info/

# Remove Python cache
find . -type d -name __pycache__ -exec rm -rf {} +
find . -type f -name "*.pyc" -delete

# Remove Node modules
rm -rf node_modules/
```

### Reset Database
```bash
# Remove SQLite databases
rm -f biotech_terminal.db
rm -f data/evidence_graph.db

# Recreate with seed data
poetry run python -c "from bt_platform.core.database import init_db; import asyncio; asyncio.run(init_db())"
```

## Documentation Links

- [E2E Tests README](tests/e2e/README.md)
- [Implementation Summary](IMPLEMENTATION_E2E_TESTS.md)
- [Pre-commit Hooks Guide](PRE_COMMIT_HOOKS_GUIDE.md)
- [Main README](README.md)

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.9'
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          pip install poetry
          poetry install
          npm install
      
      - name: Run pre-commit
        run: poetry run pre-commit run --all-files
      
      - name: Install Playwright
        run: npx playwright install --with-deps chromium
      
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          CI: true
          BASE_URL: http://localhost:3000
```

## Performance Tips

### Playwright Tests
- Use `--workers=1` for debugging
- Use `--repeat-each=3` to catch flaky tests
- Use `--project=chromium` to test single browser

### Pre-commit Hooks
- Use `pre-commit run` (not `--all-files`) during development
- Use `SKIP=bandit` to skip expensive hooks
- Update hooks regularly with `pre-commit autoupdate`

## Security Checklist

- [ ] No API tokens in source code
- [ ] `.env` file in `.gitignore`
- [ ] Bandit security checks pass
- [ ] No private keys committed
- [ ] Authentication enabled for production
- [ ] HTTPS enabled for production
- [ ] Sentry configured for error tracking

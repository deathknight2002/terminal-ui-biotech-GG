# Quick Reference: platform → bt_platform Migration

## Command Changes

### Python Module Execution
| Old Command | New Command |
|------------|-------------|
| `python -m platform.tui` | `python -m bt_platform.tui` |
| `python -m platform.cli.scrape` | `python -m bt_platform.cli.scrape` |
| `python -m platform.ingestion` | `python -m bt_platform.ingestion` |

### Poetry/Uvicorn Commands
| Old Command | New Command |
|------------|-------------|
| `poetry run uvicorn platform.core.app:app` | `poetry run uvicorn bt_platform.core.app:app` |
| `poetry run ruff check platform/` | `poetry run ruff check bt_platform/` |
| `poetry run pytest --cov=platform.tui` | `poetry run pytest --cov=bt_platform.tui` |

## Import Changes

### Python Imports
```python
# OLD ❌
from platform.tui.services import WatchlistManager
from platform.core.database import get_db
from platform.scrapers.base import ScraperRegistry

# NEW ✅
from bt_platform.tui.services import WatchlistManager
from bt_platform.core.database import get_db
from bt_platform.scrapers.base import ScraperRegistry
```

## Directory Structure

### Old Structure (Removed)
```
platform/
├── core/
├── tui/
├── cli/
├── scrapers/
└── providers/
```

### New Structure
```
bt_platform/
├── core/              # FastAPI application
├── tui/               # Terminal User Interface
├── cli/               # CLI tools (scrape, etc.)
├── scrapers/          # Web scrapers
├── providers/         # Data providers
├── ingestion/         # Data ingestion pipeline
└── logic/             # Business logic
```

## npm Scripts (package.json)

### Development
```bash
# Backend API (FastAPI)
npm run dev:backend      # Uses bt_platform.core.app:app

# Production
npm run start:prod       # Uses bt_platform.core.app:app

# Linting
npm run lint             # Checks bt_platform/
```

## Testing

### Run Tests
```bash
# All tests
poetry run pytest

# TUI tests only
poetry run pytest tests/tui/ -v

# With coverage
poetry run pytest --cov=bt_platform.tui --cov-report=html
```

### Linting
```bash
# Check all Python code
poetry run ruff check bt_platform/

# Auto-fix issues
poetry run ruff check --fix bt_platform/

# Format code
poetry run ruff format bt_platform/
```

## Common Use Cases

### Launch TUI
```bash
python -m bt_platform.tui
```

### Run Web Scraper
```bash
# Scrape FierceBiotech
python -m bt_platform.cli.scrape --source fierce --since 7d --limit 20

# Scrape FDA with fixtures
python -m bt_platform.cli.scrape --source fda --save-fixture --limit 10

# Or use convenience script
./scripts/scrape.sh --source fierce --since 7d
```

### Start Backend API
```bash
# Development mode (with hot reload)
poetry run uvicorn bt_platform.core.app:app --reload --port 8000

# Or use npm script
npm run dev:backend

# Production mode
npm run start:prod
```

## Configuration Files

### pyproject.toml
```toml
[tool.poetry]
packages = [
    {include = "bt_platform"},
]

[tool.coverage.run]
source = ["bt_platform"]
```

### package.json
```json
{
  "scripts": {
    "dev:backend": "poetry run uvicorn bt_platform.core.app:app --reload --port 3001",
    "start:prod": "poetry run uvicorn bt_platform.core.app:app --host 0.0.0.0 --port 3001",
    "lint": "... && poetry run ruff check bt_platform/"
  }
}
```

## Environment Setup

### Copy Environment File
```bash
cp .env.example .env
# Edit .env with your configuration
```

### Key Variables
See `.env.example` for comprehensive list. Key variables:
- `POSTGRES_DSN` - Database connection
- `REDIS_URL` - Redis cache
- `JWT_SECRET` - API security
- `API_PORT` - Backend port (default: 3001)

## Troubleshooting

### Import Errors
If you see `ModuleNotFoundError: No module named 'platform'`:
1. Update your imports: `platform.` → `bt_platform.`
2. Clear Python cache: `find . -type d -name __pycache__ -exec rm -rf {} +`
3. Reinstall if needed: `poetry install`

### Old References
If you find old `platform.` references:
```bash
# Search for them
grep -r "from platform\." --include="*.py" .
grep -r "import platform\." --include="*.py" .

# Update them
sed -i 's/from platform\./from bt_platform\./g' your_file.py
sed -i 's/import platform\./import bt_platform\./g' your_file.py
```

### CLI Not Working
If `python -m bt_platform.tui` doesn't work:
1. Check you're in the project root
2. Set PYTHONPATH if needed: `export PYTHONPATH=$(pwd)`
3. Verify package exists: `ls -la bt_platform/`

## Verification

Run the verification script:
```bash
python verify_rename.py
```

Expected output:
- ✅ Basic Import
- ✅ TUI Imports
- ✅ Test Imports
- ✅ Old Directory Removed
- ✅ New Directory Exists
- ✅ Documentation Updated

## Additional Resources

- Full summary: `RENAME_SUMMARY.md`
- Environment config: `.env.example`
- TUI documentation: `docs/TUI.md`
- Development guide: `docs/DEVELOPMENT.md`
- Main README: `README.md`

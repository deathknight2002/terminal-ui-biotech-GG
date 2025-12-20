# 🚀 Enterprise Deployment Guide

Complete guide for deploying Biotech Terminal Platform in enterprise environments, including integration with Bloomberg Terminal and AlphaSense.

## Table of Contents

1. [Quick Deploy (Docker)](#quick-deploy-docker)
2. [Manual Installation](#manual-installation)
3. [Enterprise Integration](#enterprise-integration)
4. [Corporate Network Configuration](#corporate-network-configuration)
5. [Production Best Practices](#production-best-practices)
6. [Troubleshooting](#troubleshooting)

---

## Quick Deploy (Docker)

### Prerequisites
- Docker Desktop or Docker Engine 20.10+
- Docker Compose 2.0+
- 4GB RAM minimum (8GB recommended)
- 10GB disk space

### 1. Clone Repository

```bash
git clone https://github.com/deathknight2002/terminal-ui-biotech-GG.git
cd terminal-ui-biotech-GG
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your settings
# Required changes for production:
# - SECRET_KEY: Generate with: openssl rand -hex 32
# - POSTGRES_PASSWORD: Change default password
# - API_TOKEN: Generate with: openssl rand -hex 32
# - CORS_ORIGINS: Add your domain
```

### 3. Start All Services

```bash
# Start with PostgreSQL + Redis (recommended for production)
docker-compose up -d

# OR start minimal (SQLite only, no external dependencies)
docker-compose up -d biotech-terminal

# Check status
docker-compose ps

# View logs
docker-compose logs -f biotech-terminal
```

### 4. Access Application

- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

### 5. Initial Setup

```bash
# Create database tables and seed data
docker-compose exec biotech-terminal python -c "
import asyncio
from bt_platform.core.database import init_db
asyncio.run(init_db())
"

# Collect initial data
docker-compose exec biotech-terminal python scripts/fetch-live-data.sh
```

### 6. Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v
```

---

## Manual Installation

For environments without Docker or requiring custom configurations.

### Prerequisites

- **Python 3.9-3.12** (3.11 recommended)
- **Node.js 18+** and npm
- **PostgreSQL 13+** (optional, can use SQLite)
- **Redis 6+** (optional)

### 1. Clone and Setup Python Environment

```bash
# Clone repository
git clone https://github.com/deathknight2002/terminal-ui-biotech-GG.git
cd terminal-ui-biotech-GG

# Install Poetry (Python package manager)
curl -sSL https://install.python-poetry.org | python3 -

# Install Python dependencies
poetry install --no-dev

# Activate virtual environment
poetry shell
```

### 2. Install Node.js Dependencies

```bash
# Install all workspace dependencies
npm install

# Build frontend components
cd frontend-components
npm run build
cd ..

# Build terminal application
cd terminal
npm run build
cd ..
```

### 3. Configure Environment

```bash
# Copy and customize .env
cp .env.example .env

# Required settings for production:
nano .env
```

**Minimum production configuration:**
```env
DEBUG=false
SECRET_KEY=your-generated-secret-key
DATABASE_URL=postgresql://user:password@localhost:5432/biotech_terminal
API_TOKEN_ENABLED=true
API_TOKEN=your-api-token
CORS_ORIGINS=https://your-domain.com
```

### 4. Setup Database

**Option A: PostgreSQL (Recommended for Production)**
```bash
# Create database
createdb biotech_terminal

# Initialize tables
poetry run python -c "
import asyncio
from bt_platform.core.database import init_db
asyncio.run(init_db())
"
```

**Option B: SQLite (Simple Setup)**
```bash
# Set in .env
DATABASE_URL=sqlite:///./biotech_terminal.db

# Initialize
poetry run python -c "
import asyncio
from bt_platform.core.database import init_db
asyncio.run(init_db())
"
```

### 5. Start Application

**Development Mode:**
```bash
# Start backend
poetry run uvicorn bt_platform.core.app:app --reload --port 8000

# In another terminal, start frontend dev server
cd terminal
npm run dev
```

**Production Mode:**
```bash
# Start with Gunicorn (production WSGI server)
poetry run gunicorn bt_platform.core.app:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --timeout 30 \
  --access-logfile logs/access.log \
  --error-logfile logs/error.log
```

### 6. Serve Frontend (Production)

**Option A: Using Nginx**
```bash
# Copy built files to web root
cp -r terminal/dist/* /var/www/biotech-terminal/

# Configure Nginx (see nginx.conf example below)
sudo systemctl reload nginx
```

**Option B: Using FastAPI Static Files**
```python
# In bt_platform/core/app.py (already configured)
# FastAPI serves static files from terminal/dist
# Access at http://localhost:8000/
```

---

## Enterprise Integration

### Bloomberg Terminal Integration

The platform can integrate with Bloomberg Terminal to combine biotech intelligence with real-time market data.

#### 1. Enable Bloomberg Integration

```env
# In .env
BLOOMBERG_ENABLED=true
BLOOMBERG_API_HOST=your-bloomberg-api.com
BLOOMBERG_API_PORT=8194
BLOOMBERG_API_KEY=your-api-key
```

#### 2. Configure Bloomberg Data Feeds

```python
# Example: Fetch Bloomberg data in your code
from bt_platform.integrations.bloomberg import BloombergClient

client = BloombergClient()
stock_data = await client.get_stock_data("CELG US Equity")
```

#### 3. Available Bloomberg Functions

- **Price Data**: Real-time and historical pricing
- **News Feed**: Bloomberg news integration
- **Analyst Estimates**: Consensus estimates and ratings
- **Corporate Actions**: Dividends, splits, M&A

#### 4. Display in Terminal

The terminal UI automatically enriches biotech data with Bloomberg information when enabled.

### AlphaSense Integration

Integrate expert call transcripts and document search.

#### 1. Setup AlphaSense

```env
# In .env
ALPHASENSE_ENABLED=true
ALPHASENSE_API_KEY=your-alphasense-key
ALPHASENSE_API_URL=https://api.alpha-sense.com
```

#### 2. Search Documents

```python
from bt_platform.integrations.alphasense import AlphaSenseClient

client = AlphaSenseClient()
results = await client.search_documents(
    query="PARP inhibitor clinical trial",
    doc_types=["transcript", "filing"]
)
```

#### 3. Features Available

- **Earnings Call Transcripts**: Search and analyze
- **SEC Filings**: Enhanced search capabilities
- **Expert Insights**: KOL commentary and analysis
- **Sentiment Analysis**: Document-level sentiment

### Integration Best Practices

1. **API Rate Limiting**: Both Bloomberg and AlphaSense have rate limits
   ```python
   # Configured in bt_platform/core/config.py
   BLOOMBERG_RATE_LIMIT = 10  # requests per second
   ALPHASENSE_RATE_LIMIT = 5
   ```

2. **Caching**: Cache expensive API calls
   ```env
   REDIS_URL=redis://localhost:6379
   CACHE_TTL=1800  # 30 minutes
   ```

3. **Error Handling**: Graceful degradation if services are unavailable
   - Platform continues to work with free data sources
   - Premium features disabled if integrations fail

---

## Corporate Network Configuration

### Proxy Settings

Many corporate networks require proxy configuration.

#### 1. Configure System Proxy

```env
# In .env
HTTP_PROXY=http://proxy.yourcompany.com:8080
HTTPS_PROXY=http://proxy.yourcompany.com:8080
NO_PROXY=localhost,127.0.0.1,.yourcompany.com
```

#### 2. SSL Certificate Issues

If your corporate network uses SSL inspection:

```bash
# Option A: Add corporate CA certificate
export REQUESTS_CA_BUNDLE=/path/to/corporate-ca-bundle.crt

# Option B: Disable SSL verification (NOT recommended for production)
export CURL_CA_BUNDLE=""
export REQUESTS_CA_BUNDLE=""
```

#### 3. Firewall Whitelisting

Request your IT team to whitelist these domains:

**Required (Free Data Sources):**
- `finance.yahoo.com` - Market data
- `clinicaltrials.gov` - Clinical trial data
- `fda.gov` - FDA approvals and PDUFA dates
- `sec.gov` - SEC EDGAR filings

**Optional (Premium Integrations):**
- `bloomberg.com` - Bloomberg API
- `alpha-sense.com` - AlphaSense API

### Windows Domain Authentication

For Windows environments with Active Directory:

```python
# bt_platform/core/auth.py can integrate with Windows Auth
# Example configuration:
WINDOWS_AUTH_ENABLED=true
AD_DOMAIN=YOURCOMPANY
AD_SERVER=dc.yourcompany.com
```

### Internal Deployment (No Internet)

For air-gapped environments:

1. **Download dependencies offline:**
   ```bash
   # On internet-connected machine
   poetry export -f requirements.txt -o requirements.txt
   pip download -r requirements.txt -d packages/
   npm pack
   
   # Transfer packages/ folder to air-gapped machine
   ```

2. **Install from local packages:**
   ```bash
   pip install --no-index --find-links=packages/ -r requirements.txt
   npm install from-tarball.tgz
   ```

3. **Use pre-downloaded data:**
   - Manually download CSV files from data sources
   - Place in `data/` directory
   - Configure `OFFLINE_MODE=true`

---

## Production Best Practices

### 1. Security Hardening

```env
# Strong secrets
SECRET_KEY=$(openssl rand -hex 32)
API_TOKEN=$(openssl rand -hex 32)

# Enable authentication
API_TOKEN_ENABLED=true

# Restrict CORS
CORS_ORIGINS=https://biotech-terminal.yourcompany.com

# HTTPS only
FORCE_HTTPS=true
```

### 2. Database Optimization

```env
# PostgreSQL recommended for production
DATABASE_URL=postgresql://biotech:password@localhost:5432/biotech_terminal

# Connection pooling
DB_POOL_SIZE=20
DB_MAX_OVERFLOW=10
```

### 3. Performance Tuning

```env
# Multiple workers
WORKERS=4  # (2 * CPU cores) + 1

# Request timeouts
REQUEST_TIMEOUT=30

# Redis caching
REDIS_URL=redis://localhost:6379
CACHE_TTL=1800
```

### 4. Monitoring

```env
# Sentry error tracking
SENTRY_DSN=your-sentry-dsn
SENTRY_ENVIRONMENT=production

# Prometheus metrics
PROMETHEUS_ENABLED=true
```

### 5. Backup Strategy

```bash
# Automated PostgreSQL backups
0 2 * * * pg_dump biotech_terminal | gzip > /backups/biotech-$(date +\%Y\%m\%d).sql.gz

# Backup evidence graph
0 3 * * * cp /app/data/evidence_graph.db /backups/evidence-$(date +\%Y\%m\%d).db
```

### 6. SSL/TLS Configuration

**Using Nginx as reverse proxy:**

```nginx
server {
    listen 443 ssl http2;
    server_name biotech-terminal.yourcompany.com;
    
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## Troubleshooting

### Common Issues

#### 1. Port Already in Use

```bash
# Check what's using port 8000
lsof -i :8000

# Kill process
kill -9 <PID>

# Or use different port
PORT=8001 poetry run uvicorn bt_platform.core.app:app
```

#### 2. Database Connection Failed

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -h localhost -U biotech -d biotech_terminal

# Check DATABASE_URL in .env
echo $DATABASE_URL
```

#### 3. Module Import Errors

```bash
# Ensure virtual environment is activated
poetry shell

# Reinstall dependencies
poetry install

# Check PYTHONPATH
export PYTHONPATH=/path/to/terminal-ui-biotech-GG:$PYTHONPATH
```

#### 4. Frontend Build Fails

```bash
# Clear node_modules and rebuild
rm -rf node_modules frontend-components/node_modules terminal/node_modules
npm install
npm run build
```

#### 5. Permission Denied Errors

```bash
# Fix file permissions
chmod +x scripts/*.sh

# Fix data directory permissions
mkdir -p data logs
chmod 755 data logs
```

#### 6. Corporate Proxy Issues

```bash
# Test proxy connectivity
curl -x $HTTP_PROXY https://finance.yahoo.com

# Bypass proxy for local services
export NO_PROXY=localhost,127.0.0.1

# Use system proxy settings
export HTTP_PROXY=$(scutil --proxy | grep HTTPProxy | awk '{print $3}')
```

#### 7. Docker Build Fails

```bash
# Clear Docker cache
docker builder prune

# Build without cache
docker-compose build --no-cache

# Check Docker resources (increase if needed)
docker system df
```

### Performance Issues

#### Slow API Responses

1. **Enable Redis caching:**
   ```env
   REDIS_URL=redis://localhost:6379
   ```

2. **Increase workers:**
   ```env
   WORKERS=8  # Increase based on CPU
   ```

3. **Database query optimization:**
   ```bash
   # Add indexes
   poetry run python scripts/optimize-database.py
   ```

#### High Memory Usage

1. **Reduce worker count:**
   ```env
   WORKERS=2
   ```

2. **Limit database pool:**
   ```env
   DB_POOL_SIZE=10
   DB_MAX_OVERFLOW=5
   ```

3. **Enable swap (Linux):**
   ```bash
   sudo fallocate -l 4G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   ```

### Getting Help

1. **Check logs:**
   ```bash
   # Application logs
   tail -f logs/biotech-terminal.log
   
   # Docker logs
   docker-compose logs -f
   ```

2. **Health check endpoint:**
   ```bash
   curl http://localhost:8000/health
   ```

3. **Run diagnostics:**
   ```bash
   poetry run python scripts/verify_production_readiness.py
   ```

4. **Community support:**
   - GitHub Issues: https://github.com/deathknight2002/terminal-ui-biotech-GG/issues
   - Documentation: See `docs/` directory

---

## Next Steps

1. ✅ Complete deployment
2. 📊 Configure data sources
3. 🔐 Setup authentication
4. 🔗 Enable enterprise integrations
5. 📈 Monitor performance
6. 🔄 Setup automated backups

For more detailed information, see:
- [PRODUCTION_DEPLOYMENT_CHECKLIST.md](docs/PRODUCTION_DEPLOYMENT_CHECKLIST.md)
- [ARCHITECTURE_OVERVIEW.md](docs/ARCHITECTURE_OVERVIEW.md)
- [API_INTEGRATION.md](docs/API_INTEGRATION.md)

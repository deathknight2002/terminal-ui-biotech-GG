# ⚡ Quick Deploy Reference Card

One-page reference for deploying Biotech Terminal Platform.

## 🚀 Fastest Start (Docker)

```bash
# 1. Clone
git clone https://github.com/deathknight2002/terminal-ui-biotech-GG.git
cd terminal-ui-biotech-GG

# 2. Deploy
chmod +x deploy.sh
./deploy.sh

# 3. Access
open http://localhost:8000/docs
```

## 📦 Deployment Options

| Method | Best For | Time | Complexity |
|--------|----------|------|------------|
| **Docker Compose** | Quick start, testing | 5 min | ⭐ Easy |
| **Docker + PostgreSQL** | Production, scale | 10 min | ⭐⭐ Medium |
| **Manual Install** | Custom environments | 20 min | ⭐⭐⭐ Advanced |
| **Kubernetes** | Enterprise, HA | 30 min | ⭐⭐⭐⭐ Expert |

## 🐳 Docker Quick Commands

```bash
# Start (minimal)
docker-compose up -d biotech-terminal

# Start (full stack)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down

# Update
git pull && docker-compose up -d --build

# Backup
docker-compose exec postgres pg_dump -U biotech biotech_terminal > backup.sql
```

## 🔧 Manual Install Steps

```bash
# 1. Install dependencies
curl -sSL https://install.python-poetry.org | python3 -
poetry install --no-dev
npm install

# 2. Build
npm run build:components
npm run build:terminal

# 3. Configure
cp .env.example .env
# Edit .env with your settings

# 4. Initialize database
poetry run python -c "
import asyncio
from bt_platform.core.database import init_db
asyncio.run(init_db())
"

# 5. Start
poetry run uvicorn bt_platform.core.app:app --host 0.0.0.0 --port 8000
```

## ⚙️ Essential Environment Variables

```env
# Required
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///./biotech_terminal.db

# Production
API_TOKEN_ENABLED=true
API_TOKEN=your-api-token
CORS_ORIGINS=https://your-domain.com

# Enterprise
BLOOMBERG_ENABLED=true
BLOOMBERG_API_KEY=your-key
ALPHASENSE_ENABLED=true
ALPHASENSE_API_KEY=your-key

# Corporate Network
HTTP_PROXY=http://proxy:8080
HTTPS_PROXY=http://proxy:8080
```

## 🔐 Security Checklist

- [ ] Change `SECRET_KEY` from default
- [ ] Generate strong `API_TOKEN`
- [ ] Update `POSTGRES_PASSWORD`
- [ ] Configure `CORS_ORIGINS`
- [ ] Enable HTTPS (production)
- [ ] Review firewall rules
- [ ] Setup backup strategy

## 🏢 Corporate Environment

```bash
# Proxy configuration
export HTTP_PROXY=http://proxy.company.com:8080
export HTTPS_PROXY=http://proxy.company.com:8080

# SSL certificate (if corporate SSL inspection)
export SSL_CERT_FILE=/path/to/company-ca-bundle.crt

# Deploy behind corporate firewall
./deploy.sh
```

## 🔌 Enterprise Integrations

### Bloomberg Terminal

```env
BLOOMBERG_ENABLED=true
BLOOMBERG_API_HOST=bloomberg-api.yourcompany.com
BLOOMBERG_API_PORT=8194
BLOOMBERG_API_KEY=your-bloomberg-key
```

### AlphaSense

```env
ALPHASENSE_ENABLED=true
ALPHASENSE_API_KEY=your-alphasense-key
ALPHASENSE_API_URL=https://api.alpha-sense.com
```

## 📊 Health Checks

```bash
# API health
curl http://localhost:8000/health

# Full diagnostics
poetry run python scripts/verify_production_readiness.py

# Container status
docker-compose ps
docker-compose logs biotech-terminal
```

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| Port 8000 in use | `lsof -i :8000` then `kill -9 <PID>` |
| Database locked | Switch to PostgreSQL |
| Docker build fails | `docker builder prune` |
| Module not found | `poetry install` |
| CORS errors | Add domain to `CORS_ORIGINS` |

## 📚 Documentation

- **Full Guide**: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- **Troubleshooting**: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- **Production**: [docs/PRODUCTION_DEPLOYMENT_CHECKLIST.md](docs/PRODUCTION_DEPLOYMENT_CHECKLIST.md)

## 🆘 Quick Help

```bash
# View full deployment guide
cat DEPLOYMENT_GUIDE.md

# Troubleshooting guide
cat TROUBLESHOOTING.md

# Collect diagnostics
docker-compose logs > diagnostics.log

# GitHub issues
open https://github.com/deathknight2002/terminal-ui-biotech-GG/issues
```

## 🔄 Update & Maintenance

```bash
# Update application
git pull
docker-compose down
docker-compose up -d --build

# Backup database
docker-compose exec postgres pg_dump -U biotech biotech_terminal | gzip > backup-$(date +%Y%m%d).sql.gz

# View logs
docker-compose logs -f --tail=100

# Restart services
docker-compose restart
```

## 📈 Production Optimization

```env
# Performance
WORKERS=8
DB_POOL_SIZE=20
REDIS_URL=redis://localhost:6379

# Monitoring
SENTRY_DSN=your-sentry-dsn
PROMETHEUS_ENABLED=true

# Caching
CACHE_TTL=1800
```

## 🌐 Access Points

| Service | URL | Description |
|---------|-----|-------------|
| **API** | http://localhost:8000 | Main API |
| **Docs** | http://localhost:8000/docs | Interactive API documentation |
| **Health** | http://localhost:8000/health | Health check endpoint |
| **Metrics** | http://localhost:8000/metrics | Prometheus metrics |

---

**Need more help?** See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for comprehensive instructions.

# 🔧 Troubleshooting Guide

Comprehensive troubleshooting guide for common deployment and operational issues.

## Table of Contents

1. [Installation Issues](#installation-issues)
2. [Docker Problems](#docker-problems)
3. [Database Errors](#database-errors)
4. [Network and Connectivity](#network-and-connectivity)
5. [Performance Issues](#performance-issues)
6. [Corporate Environment Issues](#corporate-environment-issues)
7. [Integration Issues](#integration-issues)
8. [Security and Authentication](#security-and-authentication)

---

## Installation Issues

### Python Version Incompatibility

**Symptom:** `poetry install` fails with version errors

**Solution:**
```bash
# Check Python version
python3 --version

# Must be 3.9-3.12. If not, install correct version:
# Ubuntu/Debian
sudo apt install python3.11

# macOS
brew install python@3.11

# Windows
# Download from python.org

# Use specific Python version with Poetry
poetry env use python3.11
poetry install
```

### Poetry Not Found

**Symptom:** `poetry: command not found`

**Solution:**
```bash
# Install Poetry
curl -sSL https://install.python-poetry.org | python3 -

# Add to PATH
export PATH="$HOME/.local/bin:$PATH"

# Add to shell profile permanently
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

### Node.js Version Issues

**Symptom:** npm install fails with version errors

**Solution:**
```bash
# Check Node.js version
node --version

# Must be 18+. Use nvm to manage versions:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

### Build Failures

**Symptom:** `npm run build` fails

**Solution:**
```bash
# Clear all caches
rm -rf node_modules
rm -rf frontend-components/node_modules
rm -rf terminal/node_modules
rm -rf frontend-components/dist
rm -rf terminal/dist

# Reinstall
npm install

# Build in order
cd frontend-components && npm run build
cd ../terminal && npm run build
```

---

## Docker Problems

### Docker Daemon Not Running

**Symptom:** `Cannot connect to the Docker daemon`

**Solution:**
```bash
# Linux
sudo systemctl start docker
sudo systemctl enable docker

# macOS/Windows
# Start Docker Desktop application
```

### Port Already in Use

**Symptom:** `port is already allocated`

**Solution:**
```bash
# Find what's using the port
lsof -i :8000

# Kill the process
kill -9 <PID>

# Or change port in docker-compose.yml
APP_PORT=8001 docker-compose up -d
```

### Container Won't Start

**Symptom:** Container exits immediately

**Solution:**
```bash
# Check container logs
docker-compose logs biotech-terminal

# Common issues:
# 1. Missing environment variables
docker-compose config  # Validate configuration

# 2. Database connection failed
# Check DATABASE_URL in .env

# 3. Port conflict
# Change ports in docker-compose.yml
```

### Build Fails - Out of Memory

**Symptom:** Docker build killed or out of memory

**Solution:**
```bash
# Increase Docker memory (Docker Desktop Settings)
# Recommended: 4GB minimum, 8GB for production

# Build with reduced parallelism
docker-compose build --parallel 1

# Clear Docker cache
docker builder prune
```

### Cannot Access Container Services

**Symptom:** `localhost:8000` not accessible

**Solution:**
```bash
# Check if container is running
docker-compose ps

# Check container health
docker inspect biotech-terminal-app | grep Health

# Check container IP
docker inspect biotech-terminal-app | grep IPAddress

# Test from inside container
docker-compose exec biotech-terminal curl http://localhost:8000/health

# Check Docker network
docker network ls
docker network inspect biotech-terminal-network
```

---

## Database Errors

### Cannot Connect to PostgreSQL

**Symptom:** `FATAL: password authentication failed`

**Solution:**
```bash
# Verify credentials
echo $DATABASE_URL

# Test connection
psql -h localhost -U biotech -d biotech_terminal

# Reset PostgreSQL password
docker-compose exec postgres psql -U postgres -c "ALTER USER biotech WITH PASSWORD 'newpassword';"

# Update .env
DATABASE_URL=postgresql://biotech:newpassword@localhost:5432/biotech_terminal
```

### Database Migration Errors

**Symptom:** `relation does not exist`

**Solution:**
```bash
# Initialize database
poetry run python -c "
import asyncio
from bt_platform.core.database import init_db
asyncio.run(init_db())
"

# Or with Docker
docker-compose exec biotech-terminal python -c "..."
```

### SQLite Database Locked

**Symptom:** `database is locked`

**Solution:**
```bash
# Check for stale processes
lsof biotech_terminal.db

# Kill processes using database
kill -9 <PID>

# Switch to PostgreSQL for concurrent access
# In .env:
DATABASE_URL=postgresql://biotech:password@localhost:5432/biotech_terminal
```

### Data Persistence Issues

**Symptom:** Data disappears after container restart

**Solution:**
```bash
# Ensure volumes are configured
docker-compose down
# Edit docker-compose.yml to verify volumes section

# Don't use -v flag (removes volumes)
docker-compose down  # Good
docker-compose down -v  # BAD - deletes data

# Backup before changes
docker-compose exec postgres pg_dump -U biotech biotech_terminal > backup.sql
```

---

## Network and Connectivity

### Cannot Fetch External Data

**Symptom:** API requests to external sources fail

**Solution:**
```bash
# Test connectivity
curl -I https://finance.yahoo.com
curl -I https://clinicaltrials.gov

# Check proxy settings
echo $HTTP_PROXY
echo $HTTPS_PROXY

# Configure proxy in .env
HTTP_PROXY=http://proxy.yourcompany.com:8080
HTTPS_PROXY=http://proxy.yourcompany.com:8080
```

### CORS Errors in Browser

**Symptom:** `Access-Control-Allow-Origin` error

**Solution:**
```bash
# Add your frontend URL to .env
CORS_ORIGINS=http://localhost:3000,https://your-domain.com

# Restart backend
docker-compose restart biotech-terminal

# For development, you can temporarily allow all:
CORS_ORIGINS=*  # NOT recommended for production
```

### SSL Certificate Errors

**Symptom:** `SSL: CERTIFICATE_VERIFY_FAILED`

**Solution:**
```bash
# Corporate SSL inspection - add CA certificate
export REQUESTS_CA_BUNDLE=/path/to/corporate-ca-bundle.crt

# Or in .env
SSL_CERT_FILE=/path/to/ca-bundle.crt

# Temporary bypass (development only)
export CURL_CA_BUNDLE=""
export PYTHONHTTPSVERIFY=0  # NOT recommended
```

### Firewall Blocking Requests

**Symptom:** Timeout errors when fetching data

**Solution:**
```bash
# Test specific endpoints
curl -v https://finance.yahoo.com

# Check firewall rules (Linux)
sudo iptables -L

# Request IT to whitelist:
# - finance.yahoo.com
# - clinicaltrials.gov
# - fda.gov
# - sec.gov
```

---

## Performance Issues

### Slow API Response Times

**Symptom:** Requests take >5 seconds

**Diagnosis:**
```bash
# Check API endpoint performance
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:8000/api/v1/drugs

# curl-format.txt:
time_namelookup:  %{time_namelookup}\n
time_connect:  %{time_connect}\n
time_starttransfer:  %{time_starttransfer}\n
time_total:  %{time_total}\n
```

**Solutions:**

1. **Enable Redis caching:**
```env
REDIS_URL=redis://localhost:6379
```

2. **Increase workers:**
```env
WORKERS=8
```

3. **Add database indexes:**
```bash
poetry run python scripts/optimize-database.py
```

4. **Monitor with Prometheus:**
```bash
curl http://localhost:8000/metrics
```

### High Memory Usage

**Symptom:** Application using >2GB RAM

**Solutions:**

1. **Reduce workers:**
```env
WORKERS=2
DB_POOL_SIZE=10
```

2. **Check for memory leaks:**
```bash
# Install memory profiler
poetry add memory-profiler

# Profile endpoints
poetry run python -m memory_profiler bt_platform/core/app.py
```

3. **Increase swap (Linux):**
```bash
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### Database Query Performance

**Symptom:** Slow database queries

**Solutions:**

1. **Add indexes:**
```python
# In models
class Drug(Base):
    name = Column(String, index=True)
    phase = Column(String, index=True)
```

2. **Enable query logging:**
```env
LOG_LEVEL=DEBUG
```

3. **Use database query analysis:**
```sql
EXPLAIN ANALYZE SELECT * FROM drugs WHERE phase = 'Phase III';
```

---

## Corporate Environment Issues

### Proxy Authentication

**Symptom:** 407 Proxy Authentication Required

**Solution:**
```bash
# Configure proxy with credentials
HTTP_PROXY=http://username:password@proxy.company.com:8080
HTTPS_PROXY=http://username:password@proxy.company.com:8080

# Or use environment variables
export HTTP_PROXY="http://proxy.company.com:8080"
export HTTPS_PROXY="http://proxy.company.com:8080"

# Configure in Python code
# bt_platform/core/config.py
PROXIES = {
    'http': os.getenv('HTTP_PROXY'),
    'https': os.getenv('HTTPS_PROXY'),
}
```

### Windows Domain Authentication

**Symptom:** Cannot authenticate with Windows credentials

**Solution:**
```python
# Enable Windows authentication
# In .env
WINDOWS_AUTH_ENABLED=true
AD_DOMAIN=YOURCOMPANY
AD_SERVER=dc.yourcompany.com

# Install required packages
poetry add requests-ntlm
```

### Air-Gapped Environment

**Symptom:** No internet access for package installation

**Solution:**
```bash
# On internet-connected machine:
# Export dependencies
poetry export -f requirements.txt -o requirements.txt
pip download -r requirements.txt -d packages/

# Package node modules
npm pack
tar -czf node_modules.tar.gz node_modules

# Transfer to air-gapped machine
scp packages/ air-gapped-server:/tmp/
scp node_modules.tar.gz air-gapped-server:/tmp/

# On air-gapped machine:
pip install --no-index --find-links=/tmp/packages -r requirements.txt
tar -xzf /tmp/node_modules.tar.gz
```

---

## Integration Issues

### Bloomberg API Connection Failed

**Symptom:** Cannot connect to Bloomberg API

**Solution:**
```bash
# Verify Bloomberg Terminal is running
# Check Bloomberg API service status

# Test connection
telnet bloomberg-api.com 8194

# Verify credentials in .env
BLOOMBERG_ENABLED=true
BLOOMBERG_API_HOST=bloomberg-api.yourcompany.com
BLOOMBERG_API_KEY=your-key

# Check Bloomberg SDK installation
poetry show | grep bloomberg
```

### AlphaSense API Errors

**Symptom:** 401 Unauthorized from AlphaSense

**Solution:**
```bash
# Verify API key
curl -H "Authorization: Bearer $ALPHASENSE_API_KEY" \
  https://api.alpha-sense.com/v1/health

# Check rate limits
# AlphaSense has strict rate limits

# Configure in .env
ALPHASENSE_ENABLED=true
ALPHASENSE_API_KEY=your-key
ALPHASENSE_RATE_LIMIT=5  # requests per second
```

---

## Security and Authentication

### API Token Authentication Failing

**Symptom:** 401 Unauthorized despite correct token

**Solution:**
```bash
# Verify token is enabled
grep API_TOKEN_ENABLED .env

# Test with curl
curl -H "X-API-Token: your-token" http://localhost:8000/api/v1/drugs

# Check header name (case-sensitive)
# Default: X-API-Token

# Regenerate token
openssl rand -hex 32
```

### HTTPS Certificate Issues

**Symptom:** SSL certificate errors in production

**Solution:**
```bash
# Use Let's Encrypt for free certificates
certbot --nginx -d biotech-terminal.yourcompany.com

# Or generate self-signed (development only)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout infrastructure/nginx/ssl/key.pem \
  -out infrastructure/nginx/ssl/cert.pem
```

### Secret Key Errors

**Symptom:** Token generation fails

**Solution:**
```bash
# Generate new secret key
openssl rand -hex 32

# Update in .env
SECRET_KEY=new-generated-key

# Restart application
docker-compose restart biotech-terminal
```

---

## Diagnostic Commands

### Health Check

```bash
# Basic health
curl http://localhost:8000/health

# Detailed diagnostics
poetry run python scripts/verify_production_readiness.py

# Component health
curl http://localhost:8000/api/v1/health/detailed
```

### Log Analysis

```bash
# Application logs
tail -f logs/biotech-terminal.log

# Docker logs
docker-compose logs -f biotech-terminal

# PostgreSQL logs
docker-compose logs postgres

# Filter for errors
docker-compose logs biotech-terminal | grep ERROR
```

### System Resources

```bash
# Docker stats
docker stats biotech-terminal-app

# System resources
top
htop

# Disk usage
df -h
du -sh data/

# Database size
docker-compose exec postgres psql -U biotech -d biotech_terminal -c "
  SELECT pg_size_pretty(pg_database_size('biotech_terminal'));
"
```

---

## Getting Additional Help

### Collect Diagnostic Information

```bash
# Run full diagnostic report
./scripts/collect-diagnostics.sh > diagnostics.txt

# Include:
# - System information
# - Docker version
# - Python version
# - Node version
# - Environment variables (sanitized)
# - Recent logs
# - Error messages
```

### Support Channels

1. **GitHub Issues**: https://github.com/deathknight2002/terminal-ui-biotech-GG/issues
2. **Documentation**: See `docs/` directory
3. **Email Support**: Include diagnostics.txt

### Before Requesting Help

- [ ] Check this troubleshooting guide
- [ ] Review logs for error messages
- [ ] Test with minimal configuration
- [ ] Verify prerequisites are met
- [ ] Include diagnostic information
- [ ] Specify environment (OS, Docker version, etc.)

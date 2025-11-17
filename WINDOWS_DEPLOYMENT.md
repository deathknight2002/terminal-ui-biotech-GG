# 🪟 Windows Deployment Guide

Complete guide for deploying Biotech Terminal Platform on Windows environments.

## Prerequisites

### Required Software

1. **Windows 10/11** (64-bit)
2. **Docker Desktop for Windows** 
   - Download: https://www.docker.com/products/docker-desktop
   - Requires WSL2 for best performance
3. **Git for Windows**
   - Download: https://git-scm.com/download/win

### Optional (for manual installation)

4. **Python 3.9-3.12**
   - Download: https://www.python.org/downloads/
   - ✅ Check "Add Python to PATH" during installation
5. **Node.js 18+**
   - Download: https://nodejs.org/
   - LTS version recommended

## Quick Start with Docker (Recommended)

### 1. Enable WSL2 (if not already enabled)

Open PowerShell as Administrator and run:

```powershell
# Enable WSL
wsl --install

# Restart computer if prompted
```

### 2. Install Docker Desktop

1. Download and install Docker Desktop
2. Start Docker Desktop
3. Wait for Docker to fully start (whale icon in system tray)

### 3. Clone Repository

Open PowerShell or Command Prompt:

```powershell
# Clone repository
git clone https://github.com/deathknight2002/terminal-ui-biotech-GG.git
cd terminal-ui-biotech-GG
```

### 4. Deploy with Docker

**Option A: Automated Deployment (PowerShell)**

```powershell
# Copy environment template
Copy-Item .env.example .env

# Start services
docker compose up -d

# Check status
docker compose ps
```

**Option B: Using deploy script**

```powershell
# Make script executable and run
.\scripts\setup.ps1
```

### 5. Access Application

- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Health**: http://localhost:8000/health

### 6. Verify Deployment

```powershell
# Check container logs
docker compose logs -f biotech-terminal

# Test API
curl http://localhost:8000/health
# Or in PowerShell:
Invoke-WebRequest -Uri http://localhost:8000/health
```

## Manual Installation (Without Docker)

### 1. Install Python

1. Download Python from https://python.org
2. Run installer
3. ✅ **IMPORTANT**: Check "Add Python to PATH"
4. Verify installation:

```powershell
python --version
# Should show Python 3.9 or higher
```

### 2. Install Poetry

```powershell
# Using PowerShell
(Invoke-WebRequest -Uri https://install.python-poetry.org -UseBasicParsing).Content | python -
```

Add Poetry to PATH:
1. Open Start Menu → "Environment Variables"
2. Edit "Path" variable
3. Add: `C:\Users\YourUsername\AppData\Roaming\Python\Scripts`
4. Click OK and restart PowerShell

Verify:
```powershell
poetry --version
```

### 3. Install Node.js

1. Download from https://nodejs.org
2. Run installer (use default options)
3. Verify:

```powershell
node --version
npm --version
```

### 4. Setup Project

```powershell
# Clone repository
git clone https://github.com/deathknight2002/terminal-ui-biotech-GG.git
cd terminal-ui-biotech-GG

# Install Python dependencies
poetry install

# Install Node.js dependencies
npm install

# Build frontend
cd frontend-components
npm run build
cd ..

cd terminal
npm run build
cd ..
```

### 5. Configure Environment

```powershell
# Copy environment template
Copy-Item .env.example .env

# Edit .env file with Notepad
notepad .env
```

**Required changes for production:**
- `SECRET_KEY`: Generate random string
- `DATABASE_URL`: SQLite or PostgreSQL connection
- `CORS_ORIGINS`: Your domain

### 6. Initialize Database

```powershell
# Create database
poetry run python -c "import asyncio; from bt_platform.core.database import init_db; asyncio.run(init_db())"
```

### 7. Start Application

```powershell
# Start backend
poetry run uvicorn bt_platform.core.app:app --host 0.0.0.0 --port 8000
```

Access at http://localhost:8000

## Corporate Windows Environment

### Working Behind Corporate Proxy

1. **Configure Windows Proxy**

```powershell
# Set proxy in PowerShell
$env:HTTP_PROXY = "http://proxy.yourcompany.com:8080"
$env:HTTPS_PROXY = "http://proxy.yourcompany.com:8080"

# Or add to .env file
notepad .env
# Add:
# HTTP_PROXY=http://proxy.yourcompany.com:8080
# HTTPS_PROXY=http://proxy.yourcompany.com:8080
```

2. **Configure Git Proxy**

```powershell
git config --global http.proxy http://proxy.yourcompany.com:8080
git config --global https.proxy http://proxy.yourcompany.com:8080
```

3. **Configure npm Proxy**

```powershell
npm config set proxy http://proxy.yourcompany.com:8080
npm config set https-proxy http://proxy.yourcompany.com:8080
```

### SSL Certificate Issues

If your company uses SSL inspection:

```powershell
# Get corporate CA certificate from IT
# Save as: C:\certs\company-ca.crt

# Set environment variable
$env:SSL_CERT_FILE = "C:\certs\company-ca.crt"
$env:REQUESTS_CA_BUNDLE = "C:\certs\company-ca.crt"

# For npm
npm config set cafile "C:\certs\company-ca.crt"
```

### Windows Firewall

If Windows Firewall blocks the application:

1. Open Windows Defender Firewall
2. Click "Allow an app through firewall"
3. Click "Change settings"
4. Click "Allow another app"
5. Browse to `python.exe` and add
6. Allow for both Private and Public networks

## Integration with Windows Apps

### Bloomberg Terminal Integration

```powershell
# In .env file
BLOOMBERG_ENABLED=true
BLOOMBERG_API_HOST=localhost
BLOOMBERG_API_PORT=8194
BLOOMBERG_API_KEY=your-key
```

### Excel Integration (Optional)

Using Python xlwings for Excel integration:

```powershell
poetry add xlwings

# Create Excel macro
# Open Excel → Developer tab → Visual Basic
# Add reference to Python
```

## Troubleshooting Windows Issues

### Docker Issues

**Problem**: Docker Desktop won't start

**Solution**:
```powershell
# Restart Docker service
net stop com.docker.service
net start com.docker.service

# Or restart Docker Desktop from system tray
```

**Problem**: WSL2 not installed

**Solution**:
```powershell
# Run as Administrator
wsl --install
wsl --set-default-version 2

# Restart computer
```

### Python Issues

**Problem**: `python: command not found`

**Solution**:
- Reinstall Python with "Add to PATH" checked
- Or manually add to PATH:
  1. Win + R → "sysdm.cpl"
  2. Advanced → Environment Variables
  3. Edit Path → Add Python directory

**Problem**: Poetry not found

**Solution**:
```powershell
# Add Poetry to PATH
$env:Path += ";$env:APPDATA\Python\Scripts"

# Make permanent in PowerShell profile
notepad $PROFILE
# Add line: $env:Path += ";$env:APPDATA\Python\Scripts"
```

### Permission Issues

**Problem**: Access denied errors

**Solution**:
- Run PowerShell as Administrator
- Or change folder permissions:
  ```powershell
  icacls terminal-ui-biotech-GG /grant Everyone:F /T
  ```

### Port Already in Use

**Problem**: Port 8000 is already allocated

**Solution**:
```powershell
# Find what's using the port
netstat -ano | findstr :8000

# Kill the process (use PID from above)
taskkill /PID <PID> /F

# Or use different port
$env:PORT = "8001"
```

## Performance Optimization for Windows

### 1. WSL2 Performance

```powershell
# Create/edit .wslconfig in C:\Users\YourName\
notepad $env:USERPROFILE\.wslconfig

# Add:
[wsl2]
memory=4GB
processors=4
```

### 2. Docker Performance

In Docker Desktop settings:
- Resources → Memory: 4GB minimum
- Resources → CPUs: 4 cores
- Resources → Disk: 50GB recommended

### 3. Antivirus Exclusions

Add these directories to Windows Defender exclusions:
- `C:\Users\YourName\terminal-ui-biotech-GG`
- `C:\Users\YourName\.poetry`
- Docker Desktop data directory

## Scheduled Tasks (Windows Task Scheduler)

### Auto-start on Windows Boot

1. Open Task Scheduler
2. Create Basic Task
3. Name: "Biotech Terminal"
4. Trigger: At startup
5. Action: Start a program
6. Program: `docker-compose.exe`
7. Arguments: `up -d`
8. Start in: `C:\path\to\terminal-ui-biotech-GG`

### Scheduled Data Updates

```powershell
# Create PowerShell script: update-data.ps1
Set-Location C:\path\to\terminal-ui-biotech-GG
docker compose exec biotech-terminal python scripts/fetch-live-data.sh

# Schedule in Task Scheduler
# Daily at 8 AM, run: powershell.exe -File update-data.ps1
```

## Windows Service (Advanced)

To run as Windows Service:

```powershell
# Install NSSM (Non-Sucking Service Manager)
choco install nssm

# Create service
nssm install BiotechTerminal "docker-compose.exe" "up"
nssm set BiotechTerminal AppDirectory "C:\path\to\terminal-ui-biotech-GG"

# Start service
nssm start BiotechTerminal
```

## Backup and Recovery

### Automated Backup Script

Create `backup.ps1`:

```powershell
$BackupPath = "C:\Backups\BiotechTerminal"
$Date = Get-Date -Format "yyyyMMdd"

# Create backup directory
New-Item -ItemType Directory -Force -Path $BackupPath

# Backup database
docker compose exec -T postgres pg_dump -U biotech biotech_terminal | `
    Out-File -FilePath "$BackupPath\backup-$Date.sql"

# Backup environment
Copy-Item .env "$BackupPath\.env-$Date"

Write-Host "Backup completed: $BackupPath\backup-$Date.sql"
```

Schedule with Task Scheduler to run daily.

## Next Steps

1. ✅ Complete deployment
2. 🔐 Configure authentication
3. 🔗 Setup enterprise integrations
4. 📊 Configure monitoring
5. 💾 Setup automated backups

## Additional Resources

- **Docker Desktop Documentation**: https://docs.docker.com/desktop/windows/
- **WSL2 Documentation**: https://docs.microsoft.com/en-us/windows/wsl/
- **PowerShell Documentation**: https://docs.microsoft.com/en-us/powershell/

## Support

For Windows-specific issues:
- Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- Review Docker Desktop logs
- Check Windows Event Viewer
- GitHub Issues: https://github.com/deathknight2002/terminal-ui-biotech-GG/issues

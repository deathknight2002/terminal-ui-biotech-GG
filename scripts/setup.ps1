# Biotech Terminal Platform Setup Script (PowerShell)
# One-command setup for Windows environments

param(
    [Parameter(Position=0)]
    [ValidateSet("setup", "dev", "build", "python", "nodejs")]
    [string]$Command = "setup"
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Setting up Biotech Terminal Platform..." -ForegroundColor Green

function Test-Prerequisites {
    Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow

    # Check Python
    try {
        $pythonVersion = python --version 2>$null
        if (-not $pythonVersion) {
            Write-Host "❌ Python 3.9+ is required but not installed." -ForegroundColor Red
            exit 1
        }
        Write-Host "✅ Found $pythonVersion" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Python is not installed or not in PATH." -ForegroundColor Red
        exit 1
    }

    # Check Node.js
    try {
        $nodeVersion = node --version 2>$null
        if (-not $nodeVersion) {
            Write-Host "❌ Node.js 18+ is required but not installed." -ForegroundColor Red
            exit 1
        }
        Write-Host "✅ Found Node.js $nodeVersion" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Node.js is not installed or not in PATH." -ForegroundColor Red
        exit 1
    }

    # Check npm
    try {
        $npmVersion = npm --version 2>$null
        if (-not $npmVersion) {
            Write-Host "❌ npm is required but not installed." -ForegroundColor Red
            exit 1
        }
        Write-Host "✅ Found npm $npmVersion" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ npm is not installed or not in PATH." -ForegroundColor Red
        exit 1
    }

    Write-Host "✅ Prerequisites check passed" -ForegroundColor Green
}

function Install-PythonEnvironment {
    Write-Host "🐍 Setting up Python environment..." -ForegroundColor Yellow

    # Install Poetry if not available
    try {
        poetry --version 2>$null | Out-Null
        Write-Host "✅ Poetry already installed" -ForegroundColor Green
    }
    catch {
        Write-Host "📦 Installing Poetry..." -ForegroundColor Yellow
        (Invoke-WebRequest -Uri https://install.python-poetry.org -UseBasicParsing).Content | python -

        # Add Poetry to PATH for current session
        $env:PATH += ";$env:USERPROFILE\.local\bin"
    }

    # Install Python dependencies
    Write-Host "📦 Installing Python dependencies..." -ForegroundColor Yellow
    poetry install

    # Initialize database
    Write-Host "🗄️ Initializing database..." -ForegroundColor Yellow
    $env:PYTHONPATH = (Get-Location).Path
    poetry run python -c @"
import asyncio
from platform.core.database import init_db
asyncio.run(init_db())
"@

    Write-Host "✅ Python setup complete" -ForegroundColor Green
}

function Install-NodeEnvironment {
    Write-Host "📦 Setting up Node.js environment..." -ForegroundColor Yellow

    # Install root dependencies
    Write-Host "📦 Installing root dependencies..." -ForegroundColor Yellow
    npm install

    # Setup frontend components
    if (Test-Path "frontend-components") {
        Write-Host "🎨 Setting up frontend components..." -ForegroundColor Yellow
        Set-Location frontend-components
        npm install
        npm run build
        Set-Location ..
    }

    # Setup terminal application
    if (Test-Path "terminal") {
        Write-Host "🖥️ Setting up terminal application..." -ForegroundColor Yellow
        Set-Location terminal
        npm install
        Set-Location ..
    }

    # Setup examples
    if (Test-Path "examples") {
        Write-Host "📚 Setting up examples..." -ForegroundColor Yellow
        Set-Location examples
        npm install
        Set-Location ..
    }

    Write-Host "✅ Node.js setup complete" -ForegroundColor Green
}

function New-EnvironmentFile {
    Write-Host "⚙️ Creating environment configuration..." -ForegroundColor Yellow

    if (-not (Test-Path ".env")) {
        $envContent = @"
# Biotech Terminal Platform Configuration

# Application
DEBUG=true
API_VERSION=v1

# Server
HOST=0.0.0.0
PORT=8000

# Database
DATABASE_URL=sqlite:///./biotech_terminal.db

# Redis (optional)
REDIS_URL=redis://localhost:6379

# External APIs (optional - platform works without them)
FDA_API_KEY=
CLINICALTRIALS_API_KEY=
PUBMED_API_KEY=

# Security
SECRET_KEY=biotech-terminal-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Logging
LOG_LEVEL=INFO
"@
        Set-Content -Path ".env" -Value $envContent
        Write-Host "✅ Created .env file" -ForegroundColor Green
    }
    else {
        Write-Host "✅ .env file already exists" -ForegroundColor Green
    }
}

function Start-DevServices {
    Write-Host "🚀 Starting services..." -ForegroundColor Green

    # Start backend in background
    Write-Host "🔧 Starting backend platform..." -ForegroundColor Yellow
    $backendJob = Start-Job -ScriptBlock {
        Set-Location $using:PWD
        $env:PYTHONPATH = $using:PWD
        poetry run uvicorn platform.core.app:app --reload --port 8000
    }

    Start-Sleep -Seconds 3

    # Check if backend started successfully
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Backend platform running at http://localhost:8000" -ForegroundColor Green
            Write-Host "📖 API documentation at http://localhost:8000/docs" -ForegroundColor Cyan
        }
    }
    catch {
        Write-Host "❌ Backend failed to start" -ForegroundColor Red
        Stop-Job $backendJob -Force
        Remove-Job $backendJob -Force
        exit 1
    }

    # Start frontend
    if (Test-Path "terminal") {
        Write-Host "🎨 Starting terminal application..." -ForegroundColor Yellow
        $frontendJob = Start-Job -ScriptBlock {
            Set-Location $using:PWD\terminal
            npm run dev
        }

        Start-Sleep -Seconds 3
        Write-Host "✅ Terminal application will be available at http://localhost:3000" -ForegroundColor Green
    }

    Write-Host ""
    Write-Host "🎉 Biotech Terminal Platform is running!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Backend API: http://localhost:8000" -ForegroundColor Cyan
    Write-Host "📖 API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
    Write-Host "🖥️ Terminal App: http://localhost:3000" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Yellow

    # Cleanup function
    $cleanup = {
        Write-Host "🔄 Shutting down services..." -ForegroundColor Yellow
        if ($backendJob) { Stop-Job $backendJob -Force; Remove-Job $backendJob -Force }
        if ($frontendJob) { Stop-Job $frontendJob -Force; Remove-Job $frontendJob -Force }
    }

    # Handle Ctrl+C
    try {
        # Wait for user to stop
        while ($true) {
            Start-Sleep -Seconds 1
        }
    }
    finally {
        & $cleanup
    }
}

function Build-Production {
    Write-Host "🏗️ Building for production..." -ForegroundColor Yellow

    # Build Python package
    Write-Host "📦 Building Python package..." -ForegroundColor Yellow
    poetry build

    # Build frontend components
    if (Test-Path "frontend-components") {
        Write-Host "🎨 Building frontend components..." -ForegroundColor Yellow
        Set-Location frontend-components
        npm run build
        Set-Location ..
    }

    # Build terminal application
    if (Test-Path "terminal") {
        Write-Host "🖥️ Building terminal application..." -ForegroundColor Yellow
        Set-Location terminal
        npm run build
        Set-Location ..
    }

    Write-Host "✅ Production build complete" -ForegroundColor Green
    Write-Host "📦 Artifacts:" -ForegroundColor Cyan
    Write-Host "  - Python wheel: dist/" -ForegroundColor White
    Write-Host "  - Frontend components: frontend-components/dist/" -ForegroundColor White
    Write-Host "  - Terminal app: terminal/dist/" -ForegroundColor White
}

# Main execution
switch ($Command) {
    "setup" {
        Test-Prerequisites
        New-EnvironmentFile
        Install-PythonEnvironment
        Install-NodeEnvironment
        Write-Host ""
        Write-Host "🎉 Setup complete!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "  .\scripts\setup.ps1 dev    # Start development servers" -ForegroundColor White
        Write-Host "  .\scripts\setup.ps1 build  # Build for production" -ForegroundColor White
    }
    "dev" {
        Start-DevServices
    }
    "build" {
        Build-Production
    }
    "python" {
        Install-PythonEnvironment
    }
    "nodejs" {
        Install-NodeEnvironment
    }
    default {
        Write-Host "Usage: .\scripts\setup.ps1 [setup|dev|build|python|nodejs]" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Commands:" -ForegroundColor Cyan
        Write-Host "  setup   - Full platform setup (default)" -ForegroundColor White
        Write-Host "  dev     - Start development servers" -ForegroundColor White
        Write-Host "  build   - Build for production" -ForegroundColor White
        Write-Host "  python  - Setup Python environment only" -ForegroundColor White
        Write-Host "  nodejs  - Setup Node.js environment only" -ForegroundColor White
        exit 1
    }
}
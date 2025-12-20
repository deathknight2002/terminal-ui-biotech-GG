#!/bin/bash

# Biotech Terminal - Enterprise Quick Deploy Script
# One-command deployment for enterprise environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default configuration
DEPLOYMENT_MODE="${DEPLOYMENT_MODE:-production}"
USE_DOCKER="${USE_DOCKER:-true}"
ENABLE_POSTGRES="${ENABLE_POSTGRES:-true}"
ENABLE_REDIS="${ENABLE_REDIS:-true}"

echo -e "${BLUE}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                      ║${NC}"
echo -e "${BLUE}║     🧬 Biotech Terminal Platform                    ║${NC}"
echo -e "${BLUE}║     Enterprise Quick Deploy                         ║${NC}"
echo -e "${BLUE}║                                                      ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to print section headers
print_section() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Function to check command availability
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}✗ $1 is not installed${NC}"
        return 1
    else
        echo -e "${GREEN}✓ $1 is installed${NC}"
        return 0
    fi
}

# Function to generate secure random string
generate_secret() {
    openssl rand -hex 32 2>/dev/null || python3 -c "import secrets; print(secrets.token_hex(32))"
}

# Check prerequisites
print_section "1. Checking Prerequisites"

PREREQUISITES_OK=true

if [ "$USE_DOCKER" = "true" ]; then
    check_command docker || PREREQUISITES_OK=false
    check_command docker-compose || check_command "docker compose" || PREREQUISITES_OK=false
else
    check_command python3 || PREREQUISITES_OK=false
    check_command node || PREREQUISITES_OK=false
    check_command npm || PREREQUISITES_OK=false
fi

if [ "$PREREQUISITES_OK" = "false" ]; then
    echo ""
    echo -e "${RED}Missing required dependencies. Please install them first.${NC}"
    echo ""
    echo "For Docker deployment:"
    echo "  - Docker Desktop: https://www.docker.com/products/docker-desktop"
    echo ""
    echo "For manual deployment:"
    echo "  - Python 3.9+: https://www.python.org/downloads/"
    echo "  - Node.js 18+: https://nodejs.org/"
    exit 1
fi

# Interactive configuration
print_section "2. Configuration"

echo "Select deployment type:"
echo "  1) Quick Start (Docker with SQLite)"
echo "  2) Production (Docker with PostgreSQL + Redis)"
echo "  3) Enterprise (Manual install with custom configuration)"
echo ""
read -p "Enter choice [1-3]: " deploy_choice

case $deploy_choice in
    1)
        echo -e "${GREEN}Selected: Quick Start${NC}"
        USE_DOCKER=true
        ENABLE_POSTGRES=false
        ENABLE_REDIS=false
        ;;
    2)
        echo -e "${GREEN}Selected: Production${NC}"
        USE_DOCKER=true
        ENABLE_POSTGRES=true
        ENABLE_REDIS=true
        ;;
    3)
        echo -e "${GREEN}Selected: Enterprise${NC}"
        USE_DOCKER=false
        ;;
    *)
        echo -e "${RED}Invalid choice. Using Quick Start.${NC}"
        USE_DOCKER=true
        ENABLE_POSTGRES=false
        ENABLE_REDIS=false
        ;;
esac

# Environment setup
print_section "3. Environment Configuration"

if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp .env.example .env
    
    # Generate secrets
    SECRET_KEY=$(generate_secret)
    API_TOKEN=$(generate_secret)
    POSTGRES_PASSWORD=$(generate_secret | cut -c1-16)
    
    # Update .env file
    sed -i.bak "s/SECRET_KEY=.*/SECRET_KEY=${SECRET_KEY}/" .env
    sed -i.bak "s/API_TOKEN=$/API_TOKEN=${API_TOKEN}/" .env
    sed -i.bak "s/POSTGRES_PASSWORD=changeme/POSTGRES_PASSWORD=${POSTGRES_PASSWORD}/" .env
    sed -i.bak "s/DEPLOYMENT_MODE=development/DEPLOYMENT_MODE=${DEPLOYMENT_MODE}/" .env
    
    rm .env.bak 2>/dev/null || true
    
    echo -e "${GREEN}✓ Environment file created${NC}"
    echo -e "${YELLOW}⚠ Important: Save these credentials securely!${NC}"
    echo ""
    echo "API_TOKEN: ${API_TOKEN}"
    echo "SECRET_KEY: ${SECRET_KEY}"
    if [ "$ENABLE_POSTGRES" = "true" ]; then
        echo "POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}"
    fi
    echo ""
else
    echo -e "${YELLOW}⚠ .env file already exists, skipping...${NC}"
fi

# Deployment
print_section "4. Deployment"

if [ "$USE_DOCKER" = "true" ]; then
    echo "Building Docker images..."
    
    # Build the application
    if ! docker-compose build; then
        echo -e "${RED}✗ Docker build failed${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Docker images built${NC}"
    
    # Start services
    echo "Starting services..."
    
    if [ "$ENABLE_POSTGRES" = "true" ]; then
        docker-compose up -d
    else
        docker-compose up -d biotech-terminal
    fi
    
    # Wait for services to be ready
    echo "Waiting for services to start..."
    sleep 10
    
    # Check health
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Application is running${NC}"
    else
        echo -e "${YELLOW}⚠ Application may not be ready yet. Check logs with: docker-compose logs -f${NC}"
    fi
    
    # Initialize database
    echo "Initializing database..."
    docker-compose exec -T biotech-terminal python -c "
import asyncio
from bt_platform.core.database import init_db
asyncio.run(init_db())
" || echo -e "${YELLOW}⚠ Database initialization may have failed. This is normal if already initialized.${NC}"
    
else
    # Manual installation
    echo "Installing Python dependencies..."
    
    # Install Poetry if needed
    if ! command -v poetry &> /dev/null; then
        echo "Installing Poetry..."
        curl -sSL https://install.python-poetry.org | python3 -
        export PATH="$HOME/.local/bin:$PATH"
    fi
    
    # Install Python packages
    poetry install --no-dev
    
    echo "Installing Node.js dependencies..."
    npm install
    
    echo "Building frontend..."
    npm run build:components
    npm run build:terminal
    
    echo "Initializing database..."
    poetry run python -c "
import asyncio
from bt_platform.core.database import init_db
asyncio.run(init_db())
"
    
    echo -e "${GREEN}✓ Manual installation complete${NC}"
fi

# Post-deployment verification
print_section "5. Verification"

echo "Running health checks..."

# Check API health
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ API health check passed${NC}"
else
    echo -e "${RED}✗ API health check failed${NC}"
fi

# Check API docs
if curl -f http://localhost:8000/docs > /dev/null 2>&1; then
    echo -e "${GREEN}✓ API documentation accessible${NC}"
else
    echo -e "${YELLOW}⚠ API documentation not accessible${NC}"
fi

# Success message
print_section "Deployment Complete! 🎉"

echo ""
echo -e "${GREEN}Your Biotech Terminal Platform is now running!${NC}"
echo ""
echo "Access points:"
echo -e "  ${BLUE}API:${NC}              http://localhost:8000"
echo -e "  ${BLUE}API Documentation:${NC} http://localhost:8000/docs"
echo -e "  ${BLUE}Health Check:${NC}      http://localhost:8000/health"
echo ""

if [ "$USE_DOCKER" = "true" ]; then
    echo "Docker commands:"
    echo "  View logs:    docker-compose logs -f"
    echo "  Stop:         docker-compose down"
    echo "  Restart:      docker-compose restart"
    echo "  Status:       docker-compose ps"
    echo ""
fi

echo "Next steps:"
echo "  1. Review the DEPLOYMENT_GUIDE.md for advanced configuration"
echo "  2. Configure enterprise integrations (Bloomberg, AlphaSense)"
echo "  3. Setup monitoring and backups"
echo "  4. Review security settings in .env"
echo ""

echo -e "${YELLOW}Important Security Notes:${NC}"
echo "  • Change default passwords in .env"
echo "  • Configure CORS_ORIGINS for your domain"
echo "  • Enable API_TOKEN_ENABLED=true for production"
echo "  • Setup HTTPS with reverse proxy (Nginx/Apache)"
echo ""

echo "For help and documentation:"
echo "  📖 Deployment Guide: cat DEPLOYMENT_GUIDE.md"
echo "  📚 Full Documentation: docs/"
echo "  🐛 Issues: https://github.com/deathknight2002/terminal-ui-biotech-GG/issues"
echo ""

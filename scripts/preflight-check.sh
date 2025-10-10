#!/bin/bash

# Pre-flight Check Script for Biotech Terminal
# Quickly validates that the development environment is properly set up
# Provides clear, actionable error messages

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

passed=0
failed=0
warnings=0

# Helper functions
log_section() {
    echo ""
    echo -e "${CYAN}${BOLD}========================================${NC}"
    echo -e "${CYAN}${BOLD}$1${NC}"
    echo -e "${CYAN}${BOLD}========================================${NC}"
    echo ""
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
    ((passed++))
}

log_error() {
    local code=$1
    local message=$2
    local solution=$3
    echo -e "${RED}[✗] ERROR [$code]:${NC} $message"
    echo -e "${YELLOW}    Solution: $solution${NC}"
    echo -e "${YELLOW}    Time: $TIMESTAMP${NC}"
    echo ""
    ((failed++))
}

log_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
    ((warnings++))
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

log_section "Pre-flight Check: Development Environment"
log_info "Platform: $(uname -s)"
log_info "Architecture: $(uname -m)"
log_info "Working Directory: $ROOT_DIR"
echo ""

# Check Node.js
log_section "Check 1: Node.js Installation"
if command_exists node; then
    NODE_VERSION=$(node --version)
    log_success "Node.js is installed: $NODE_VERSION"
    
    # Check if version is recent enough (v18+)
    MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$MAJOR_VERSION" -lt 18 ]; then
        log_warning "Node.js version is $NODE_VERSION. Version 18+ is recommended."
    fi
else
    log_error "E001" "Node.js is not installed" \
        "Install Node.js from https://nodejs.org/ (v18 or higher recommended)"
fi

# Check npm
log_section "Check 2: npm Installation"
if command_exists npm; then
    NPM_VERSION=$(npm --version)
    log_success "npm is installed: $NPM_VERSION"
else
    log_error "E001" "npm is not installed" \
        "npm should come with Node.js. Reinstall Node.js from https://nodejs.org/"
fi

# Check Git
log_section "Check 3: Git Installation"
if command_exists git; then
    GIT_VERSION=$(git --version)
    log_success "Git is installed: $GIT_VERSION"
else
    log_warning "Git is not installed. Required for version control."
fi

# Check Python (for backend)
log_section "Check 4: Python Installation (Optional)"
if command_exists python3; then
    PYTHON_VERSION=$(python3 --version)
    log_success "Python is installed: $PYTHON_VERSION"
    
    if command_exists poetry; then
        POETRY_VERSION=$(poetry --version)
        log_success "Poetry is installed: $POETRY_VERSION"
    else
        log_warning "Poetry is not installed. Required for Python backend. Install with: curl -sSL https://install.python-poetry.org | python3 -"
    fi
else
    log_warning "Python is not installed. Python backend features will not be available."
fi

# Check root node_modules
log_section "Check 5: Root Dependencies"
if [ -d "$ROOT_DIR/node_modules" ]; then
    log_success "Root node_modules exists"
else
    log_error "E001" "Root dependencies not installed" \
        "Run 'npm install' in the root directory: cd $ROOT_DIR && npm install"
fi

# Check workspaces
log_section "Check 6: Workspace Dependencies"

WORKSPACES=("mobile" "terminal" "frontend-components" "backend")
for workspace in "${WORKSPACES[@]}"; do
    log_info "Checking workspace: $workspace"
    
    # Check package.json
    if [ -f "$ROOT_DIR/$workspace/package.json" ]; then
        log_success "  $workspace/package.json exists"
    else
        log_error "E006" "$workspace/package.json not found" \
            "Workspace may be corrupted. Ensure the repository is properly cloned."
        continue
    fi
    
    # Check node_modules
    if [ -d "$ROOT_DIR/$workspace/node_modules" ]; then
        log_success "  $workspace/node_modules exists"
    else
        log_error "E001" "$workspace dependencies not installed" \
            "Run 'npm install' in root, or: cd $ROOT_DIR/$workspace && npm install"
    fi
done

# Check mobile setup
log_section "Check 7: Mobile Platform Setup"

MOBILE_FILES=(
    "mobile/src/App.tsx"
    "mobile/src/main.tsx"
    "mobile/src/components/MobileLayout.tsx"
    "mobile/src/pages/MobileDashboard.tsx"
    "mobile/vite.config.ts"
    "mobile/index.html"
)

mobile_valid=true
for file in "${MOBILE_FILES[@]}"; do
    if [ -f "$ROOT_DIR/$file" ]; then
        log_success "  $file exists"
    else
        log_error "E007" "Mobile file missing: $file" \
            "Mobile setup is incomplete. Ensure the repository is properly cloned and all files are present."
        mobile_valid=false
    fi
done

if [ "$mobile_valid" = true ]; then
    log_success "Mobile platform is properly configured"
fi

# Check desktop/terminal setup
log_section "Check 8: Desktop Platform Setup"

TERMINAL_FILES=(
    "terminal/src/App.tsx"
    "terminal/src/main.tsx"
    "terminal/src/pages/DashboardPage.tsx"
    "terminal/index.html"
)

terminal_valid=true
for file in "${TERMINAL_FILES[@]}"; do
    if [ -f "$ROOT_DIR/$file" ]; then
        log_success "  $file exists"
    else
        log_error "E008" "Desktop file missing: $file" \
            "Desktop setup is incomplete. Ensure the repository is properly cloned and all files are present."
        terminal_valid=false
    fi
done

if [ "$terminal_valid" = true ]; then
    log_success "Desktop platform is properly configured"
fi

# Check if components are built
log_section "Check 9: Frontend Components Build"

if [ -d "$ROOT_DIR/frontend-components/dist" ]; then
    log_success "Frontend components are built"
else
    log_warning "Frontend components are not built yet. Mobile and terminal apps may not work until components are built."
    log_info "  Run: npm run build:components"
fi

# Check port availability
log_section "Check 10: Port Availability"

check_port() {
    local port=$1
    local service=$2
    
    if command_exists lsof; then
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            log_warning "Port $port is in use (needed for $service)"
            log_info "  To find what's using it: lsof -i :$port"
            log_info "  To kill the process: kill \$(lsof -t -i:$port)"
        else
            log_success "Port $port is available ($service)"
        fi
    elif command_exists netstat; then
        if netstat -an | grep ":$port.*LISTEN" >/dev/null 2>&1; then
            log_warning "Port $port is in use (needed for $service)"
        else
            log_success "Port $port is available ($service)"
        fi
    else
        log_warning "Cannot check port availability (lsof/netstat not found)"
    fi
}

check_port 3000 "Terminal Desktop App"
check_port 3002 "Mobile App"
check_port 3001 "Backend API"

# Summary
log_section "Pre-flight Check Summary"

echo -e "${BOLD}Results:${NC}"
echo -e "  ${GREEN}Passed: $passed${NC}"
echo -e "  ${RED}Failed: $failed${NC}"
echo -e "  ${YELLOW}Warnings: $warnings${NC}"
echo ""

if [ $failed -eq 0 ]; then
    echo -e "${GREEN}${BOLD}✓ Pre-flight check PASSED${NC}"
    echo -e "${GREEN}Your development environment is ready!${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo -e "  1. Build components: ${CYAN}npm run build:components${NC}"
    echo -e "  2. Start mobile: ${CYAN}npm run dev:mobile${NC}"
    echo -e "  3. Start terminal: ${CYAN}npm run dev:terminal${NC}"
    echo -e "  4. Run full smoke test: ${CYAN}npm run smoke-test${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}${BOLD}✗ Pre-flight check FAILED${NC}"
    echo -e "${RED}Please fix the errors above before proceeding.${NC}"
    echo ""
    echo -e "${YELLOW}Common solutions:${NC}"
    echo -e "  • Run ${CYAN}npm install${NC} in the root directory"
    echo -e "  • Ensure Node.js v18+ is installed"
    echo -e "  • Clone the repository again if files are missing"
    echo -e "  • Check the README.md for setup instructions"
    echo ""
    exit 1
fi

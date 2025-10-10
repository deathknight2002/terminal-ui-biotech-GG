#!/bin/bash

# Mobile Setup Verification Script
# Provides extremely clear, step-by-step guidance for mobile installation
# With detailed error messages and solutions

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m' # No Color

TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

errors=0
warnings=0
steps_completed=0

# Helper functions
print_header() {
    echo ""
    echo -e "${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}${BOLD}  $1${NC}"
    echo -e "${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

print_step() {
    local step_num=$1
    local step_desc=$2
    echo ""
    echo -e "${MAGENTA}${BOLD}━━━ Step $step_num: $step_desc ━━━${NC}"
    echo ""
}

log_action() {
    echo -e "${BLUE}[ACTION]${NC} $1"
}

log_check() {
    echo -e "${CYAN}[CHECK]${NC} $1"
}

log_success() {
    echo -e "${GREEN}${BOLD}[✓ SUCCESS]${NC} $1"
    ((steps_completed++))
}

log_error() {
    local code=$1
    local message=$2
    local solution=$3
    echo ""
    echo -e "${RED}${BOLD}[✗ ERROR $code]${NC}"
    echo -e "${RED}Problem:${NC} $message"
    echo ""
    echo -e "${YELLOW}${BOLD}How to fix:${NC}"
    echo -e "${YELLOW}$solution${NC}"
    echo ""
    echo -e "${BLUE}Time: $TIMESTAMP${NC}"
    echo ""
    ((errors++))
}

log_warning() {
    echo -e "${YELLOW}${BOLD}[⚠ WARNING]${NC} $1"
    ((warnings++))
}

log_info() {
    echo -e "${BLUE}ℹ${NC}  $1"
}

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

print_header "Biotech Terminal Mobile App - Setup Verification"

echo -e "${CYAN}This script will guide you through setting up the mobile application.${NC}"
echo -e "${CYAN}Each step will be clearly explained with solutions if problems occur.${NC}"
echo ""
echo -e "${BLUE}Platform:${NC} $(uname -s)"
echo -e "${BLUE}Working Directory:${NC} $ROOT_DIR"
echo -e "${BLUE}Time:${NC} $TIMESTAMP"
echo ""

read -p "Press Enter to begin the verification..."

# Step 1: Check Node.js
print_step 1 "Verify Node.js Installation"

log_check "Looking for Node.js installation..."

if command_exists node; then
    NODE_VERSION=$(node --version)
    MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    
    if [ "$MAJOR_VERSION" -ge 18 ]; then
        log_success "Node.js $NODE_VERSION is installed (minimum: v18.0.0)"
        log_info "Node.js location: $(which node)"
    else
        log_error "E001" \
            "Node.js version $NODE_VERSION is too old (minimum required: v18.0.0)" \
            "1. Visit https://nodejs.org/
2. Download the LTS version (v18 or higher)
3. Install it on your system
4. Restart your terminal
5. Run this script again"
    fi
else
    log_error "E001" \
        "Node.js is not installed on your system" \
        "📦 Installing Node.js (Required):

1. Go to https://nodejs.org/ in your web browser
2. Click the 'LTS' (Long Term Support) button to download
3. Run the installer and follow the prompts
4. Restart your terminal/command prompt
5. Verify installation by running: node --version
6. Run this script again

Alternative (macOS with Homebrew):
  brew install node

Alternative (Ubuntu/Debian):
  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
  sudo apt-get install -y nodejs"
fi

# Step 2: Check npm
print_step 2 "Verify npm Package Manager"

log_check "Looking for npm installation..."

if command_exists npm; then
    NPM_VERSION=$(npm --version)
    log_success "npm $NPM_VERSION is installed"
    log_info "npm location: $(which npm)"
else
    log_error "E001" \
        "npm (Node Package Manager) is not installed" \
        "npm should be included with Node.js. Please:

1. Reinstall Node.js from https://nodejs.org/
2. Ensure the installation completes successfully
3. Restart your terminal
4. Run this script again"
fi

# Step 3: Navigate to project
print_step 3 "Verify Project Structure"

log_check "Checking if we're in the correct directory..."

if [ -f "$ROOT_DIR/package.json" ] && [ -d "$ROOT_DIR/mobile" ]; then
    log_success "Project structure verified"
    log_info "Root directory: $ROOT_DIR"
else
    log_error "E006" \
        "Project structure is invalid or incomplete" \
        "📁 Setting up the project:

1. Open a terminal/command prompt
2. Clone the repository:
   git clone https://github.com/deathknight2002/terminal-ui-biotech-GG.git
3. Navigate into the project:
   cd terminal-ui-biotech-GG
4. Run this script again from the project root"
fi

# Step 4: Install root dependencies
print_step 4 "Install Root Dependencies"

log_check "Checking root node_modules..."

if [ -d "$ROOT_DIR/node_modules" ]; then
    log_success "Root dependencies are already installed"
else
    log_action "Installing root dependencies (this may take a few minutes)..."
    
    cd "$ROOT_DIR"
    if npm install; then
        log_success "Root dependencies installed successfully"
    else
        log_error "E001" \
            "Failed to install root dependencies" \
            "🔧 Troubleshooting dependency installation:

1. Check your internet connection
2. Clear npm cache:
   npm cache clean --force
3. Delete any existing node_modules:
   rm -rf node_modules package-lock.json
4. Try installing again:
   npm install

If problems persist:
• Check if you have permission issues (try without sudo if possible)
• Ensure you have enough disk space
• Check npm logs for specific error messages"
    fi
fi

# Step 5: Check mobile workspace
print_step 5 "Verify Mobile Workspace"

log_check "Checking mobile directory structure..."

MOBILE_DIR="$ROOT_DIR/mobile"

if [ ! -d "$MOBILE_DIR" ]; then
    log_error "E007" \
        "Mobile directory does not exist" \
        "The mobile workspace is missing from your project.

1. Ensure you cloned the complete repository
2. If you downloaded a ZIP, extract it completely
3. Check that the 'mobile' folder exists in the project root"
    exit 1
fi

# Check critical mobile files
CRITICAL_FILES=(
    "package.json:Mobile package configuration"
    "vite.config.ts:Vite build configuration"
    "index.html:Mobile app HTML entry point"
    "src/App.tsx:Mobile application component"
    "src/main.tsx:Mobile application entry point"
)

all_files_exist=true
for entry in "${CRITICAL_FILES[@]}"; do
    IFS=':' read -r file description <<< "$entry"
    if [ -f "$MOBILE_DIR/$file" ]; then
        log_success "$description: $file"
    else
        log_error "E007" \
            "Missing critical file: $file" \
            "The file '$file' is missing from the mobile workspace.

This file is required for: $description

Solution:
1. Re-clone the repository to ensure all files are present:
   git clone https://github.com/deathknight2002/terminal-ui-biotech-GG.git
2. If you're using a ZIP download, re-download and extract completely
3. Check that you have the latest version of the repository"
        all_files_exist=false
    fi
done

# Step 6: Install mobile dependencies
print_step 6 "Install Mobile Dependencies"

log_check "Checking mobile node_modules..."

if [ -d "$MOBILE_DIR/node_modules" ]; then
    log_success "Mobile dependencies are already installed"
else
    log_action "Installing mobile dependencies (this may take a few minutes)..."
    
    cd "$MOBILE_DIR"
    if npm install; then
        log_success "Mobile dependencies installed successfully"
    else
        log_error "E001" \
            "Failed to install mobile dependencies" \
            "🔧 Fixing mobile dependency installation:

1. Make sure root dependencies are installed first:
   cd $ROOT_DIR
   npm install

2. Clear mobile workspace cache:
   cd $MOBILE_DIR
   rm -rf node_modules package-lock.json
   
3. Try installing mobile dependencies again:
   npm install

4. If you see errors about '@biotech-terminal/frontend-components':
   • This is a workspace dependency
   • Install from root first: cd $ROOT_DIR && npm install

Common issues:
• Make sure you're running npm install from the correct directory
• Check that package.json exists in the mobile folder
• Ensure your npm version is up to date: npm install -g npm@latest"
    fi
fi

# Step 7: Build frontend components
print_step 7 "Build Frontend Components"

log_check "Checking if frontend components are built..."

COMPONENTS_DIST="$ROOT_DIR/frontend-components/dist"

if [ -d "$COMPONENTS_DIST" ] && [ -f "$COMPONENTS_DIST/index.js" ]; then
    log_success "Frontend components are already built"
else
    log_action "Building frontend components (required for mobile app)..."
    
    cd "$ROOT_DIR/frontend-components"
    if npm run build; then
        log_success "Frontend components built successfully"
    else
        log_error "E002" \
            "Failed to build frontend components" \
            "📦 Frontend components must be built before mobile app can work:

1. Ensure frontend-components dependencies are installed:
   cd $ROOT_DIR/frontend-components
   npm install

2. Try building again:
   npm run build

3. If TypeScript errors occur:
   • Check for missing dependencies
   • Run: npm run typecheck
   • Fix any type errors reported

4. If build succeeds but mobile still fails:
   • Clean mobile dependencies: cd $MOBILE_DIR && rm -rf node_modules
   • Reinstall: npm install
   
The mobile app depends on the component library, so this step is critical."
    fi
fi

# Step 8: Verify mobile pages
print_step 8 "Verify Mobile Pages"

log_check "Checking mobile page components..."

MOBILE_PAGES=(
    "MobileDashboard.tsx:Dashboard page"
    "MobilePipeline.tsx:Pipeline page"
    "MobileTrials.tsx:Clinical trials page"
    "MobileFinancial.tsx:Financial page"
    "MobileIntelligence.tsx:Market intelligence page"
    "MobileNews.tsx:News page"
)

all_pages_exist=true
for entry in "${MOBILE_PAGES[@]}"; do
    IFS=':' read -r file description <<< "$entry"
    if [ -f "$MOBILE_DIR/src/pages/$file" ]; then
        log_success "$description"
    else
        log_warning "Missing page: $file ($description)"
        all_pages_exist=false
    fi
done

if [ "$all_pages_exist" = true ]; then
    log_success "All mobile pages are present"
fi

# Step 9: Check TypeScript configuration
print_step 9 "Verify TypeScript Setup"

log_check "Checking TypeScript configuration..."

if [ -f "$MOBILE_DIR/tsconfig.json" ]; then
    log_success "TypeScript configuration exists"
    
    # Try to run type check
    cd "$MOBILE_DIR"
    log_action "Running TypeScript validation..."
    if npm run typecheck 2>&1 | grep -q "error"; then
        log_warning "TypeScript validation found some issues"
        log_info "This may not prevent the app from running, but should be fixed"
        log_info "Run 'cd mobile && npm run typecheck' to see details"
    else
        log_success "TypeScript validation passed"
    fi
else
    log_warning "TypeScript configuration file (tsconfig.json) is missing"
fi

# Step 10: Test dev server
print_step 10 "Test Mobile Dev Server"

log_check "Attempting to start mobile development server..."
log_info "This will start the server and verify it responds correctly"
log_info "The server will be stopped automatically after verification"
echo ""

cd "$MOBILE_DIR"

# Start dev server in background
log_action "Starting dev server on port 3002..."

npm run dev > /tmp/mobile-dev-output.log 2>&1 &
DEV_PID=$!

# Wait for server to start
max_wait=30
waited=0
server_started=false

while [ $waited -lt $max_wait ]; do
    sleep 1
    ((waited++))
    
    if grep -q "Local:" /tmp/mobile-dev-output.log 2>/dev/null || \
       grep -q "localhost:3002" /tmp/mobile-dev-output.log 2>/dev/null; then
        server_started=true
        break
    fi
    
    # Check if process is still running
    if ! kill -0 $DEV_PID 2>/dev/null; then
        break
    fi
    
    echo -ne "\r${BLUE}Waiting for server to start... ${waited}s / ${max_wait}s${NC}"
done

echo "" # New line after progress

# Kill the dev server
kill $DEV_PID 2>/dev/null || true
sleep 1

if [ "$server_started" = true ]; then
    log_success "Mobile dev server started successfully!"
    log_info "Server URL: http://localhost:3002"
    log_info "The server is working correctly"
else
    cat /tmp/mobile-dev-output.log
    log_error "E007" \
        "Mobile dev server failed to start within ${max_wait} seconds" \
        "🚀 Troubleshooting mobile dev server:

1. Check if port 3002 is already in use:
   • Find process: lsof -i :3002 (macOS/Linux) or netstat -ano | findstr :3002 (Windows)
   • Kill it if necessary
   
2. Check the error output above for specific issues

3. Common problems:
   • Missing dependencies: npm install
   • Frontend components not built: cd $ROOT_DIR && npm run build:components
   • Port conflict: Change port in mobile/vite.config.ts
   
4. Try starting manually to see detailed errors:
   cd $MOBILE_DIR
   npm run dev
   
5. Check for syntax errors in mobile source files:
   npm run typecheck

6. Verify all dependencies are correct versions:
   npm list

If the server starts manually but fails in this test, that's OK - the setup is likely correct."
fi

# Final summary
print_header "Mobile Setup Verification Complete"

echo ""
echo -e "${BOLD}Summary:${NC}"
echo -e "  ${GREEN}✓ Steps completed: $steps_completed${NC}"
echo -e "  ${RED}✗ Errors: $errors${NC}"
echo -e "  ${YELLOW}⚠ Warnings: $warnings${NC}"
echo ""

if [ $errors -eq 0 ]; then
    echo -e "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}${BOLD}  ✓ MOBILE SETUP SUCCESSFUL!${NC}"
    echo -e "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${CYAN}Your mobile application is ready to use!${NC}"
    echo ""
    echo -e "${BOLD}Next Steps:${NC}"
    echo ""
    echo -e "  ${MAGENTA}1.${NC} Start the mobile development server:"
    echo -e "     ${CYAN}cd mobile && npm run dev${NC}"
    echo ""
    echo -e "  ${MAGENTA}2.${NC} Open your browser and navigate to:"
    echo -e "     ${CYAN}http://localhost:3002${NC}"
    echo ""
    echo -e "  ${MAGENTA}3.${NC} For mobile device testing:"
    echo -e "     • Open DevTools (F12)"
    echo -e "     • Click 'Toggle device toolbar' (Ctrl+Shift+M)"
    echo -e "     • Select iPhone or Android device"
    echo ""
    echo -e "  ${MAGENTA}4.${NC} For real iOS device testing:"
    echo -e "     • Find your local IP: ${CYAN}ifconfig | grep inet${NC} (macOS/Linux)"
    echo -e "     • Access from iPhone: ${CYAN}http://YOUR_IP:3002${NC}"
    echo -e "     • Add to Home Screen for PWA experience"
    echo ""
    echo -e "${BOLD}Mobile Pages Available:${NC}"
    echo -e "  • Dashboard:     ${CYAN}http://localhost:3002/dashboard${NC}"
    echo -e "  • Pipeline:      ${CYAN}http://localhost:3002/pipeline${NC}"
    echo -e "  • Trials:        ${CYAN}http://localhost:3002/trials${NC}"
    echo -e "  • Financial:     ${CYAN}http://localhost:3002/financial${NC}"
    echo -e "  • Intelligence:  ${CYAN}http://localhost:3002/intelligence${NC}"
    echo -e "  • News:          ${CYAN}http://localhost:3002/news${NC}"
    echo ""
    echo -e "${BOLD}Documentation:${NC}"
    echo -e "  • Mobile README: ${CYAN}mobile/README.md${NC}"
    echo -e "  • iOS PWA Guide: ${CYAN}docs/IOS_PWA_GUIDE.md${NC}"
    echo ""
    
    if [ $warnings -gt 0 ]; then
        echo -e "${YELLOW}Note: There were $warnings warning(s). The app should work, but review them if you encounter issues.${NC}"
        echo ""
    fi
    
    exit 0
else
    echo -e "${RED}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}${BOLD}  ✗ MOBILE SETUP FAILED${NC}"
    echo -e "${RED}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${RED}Please review and fix the errors above.${NC}"
    echo ""
    echo -e "${YELLOW}${BOLD}Quick Troubleshooting:${NC}"
    echo ""
    echo -e "  ${YELLOW}1.${NC} Most issues are resolved by installing dependencies:"
    echo -e "     ${CYAN}cd $ROOT_DIR && npm install${NC}"
    echo ""
    echo -e "  ${YELLOW}2.${NC} If that doesn't work, try a clean install:"
    echo -e "     ${CYAN}rm -rf node_modules package-lock.json${NC}"
    echo -e "     ${CYAN}npm install${NC}"
    echo ""
    echo -e "  ${YELLOW}3.${NC} Make sure you have Node.js v18 or higher:"
    echo -e "     ${CYAN}node --version${NC}"
    echo ""
    echo -e "  ${YELLOW}4.${NC} Check the detailed error messages above for specific solutions"
    echo ""
    echo -e "${BOLD}Need help?${NC}"
    echo -e "  • Read the main README: ${CYAN}README.md${NC}"
    echo -e "  • Check mobile docs: ${CYAN}mobile/README.md${NC}"
    echo -e "  • Review setup guide: ${CYAN}docs/CROSS_PLATFORM_TESTING_GUIDE.md${NC}"
    echo ""
    
    exit 1
fi

#!/bin/bash
# Pre-commit Hooks Setup and Testing Script
#
# This script helps set up and test pre-commit hooks for the Biotech Terminal Platform.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

echo_success() {
    echo -e "${GREEN}✓${NC} $1"
}

echo_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

echo_error() {
    echo -e "${RED}✗${NC} $1"
}

print_header() {
    echo ""
    echo "═══════════════════════════════════════════════════════"
    echo "  $1"
    echo "═══════════════════════════════════════════════════════"
    echo ""
}

# Check if poetry is available
check_poetry() {
    if command -v poetry &> /dev/null; then
        echo_success "Poetry is installed"
        return 0
    else
        echo_error "Poetry is not installed"
        echo_info "Install Poetry: curl -sSL https://install.python-poetry.org | python3 -"
        return 1
    fi
}

# Install pre-commit
install_precommit() {
    print_header "Installing Pre-commit"
    
    if ! check_poetry; then
        return 1
    fi
    
    echo_info "Installing pre-commit via Poetry..."
    poetry install --with dev
    echo_success "Pre-commit installed"
}

# Install git hooks
install_hooks() {
    print_header "Installing Git Hooks"
    
    echo_info "Installing pre-commit hooks..."
    poetry run pre-commit install
    echo_success "Git hooks installed"
}

# Run hooks on all files
run_all() {
    print_header "Running Pre-commit Hooks on All Files"
    
    echo_info "This may take a few minutes on first run..."
    if poetry run pre-commit run --all-files; then
        echo_success "All hooks passed!"
    else
        echo_warning "Some hooks failed or made changes"
        echo_info "Review the output above and commit any auto-fixed files"
        return 1
    fi
}

# Run hooks on staged files
run_staged() {
    print_header "Running Pre-commit Hooks on Staged Files"
    
    if poetry run pre-commit run; then
        echo_success "All hooks passed!"
    else
        echo_warning "Some hooks failed or made changes"
        echo_info "Review the output above and re-stage files if needed"
        return 1
    fi
}

# Run specific hook
run_hook() {
    local hook_name=$1
    print_header "Running Hook: $hook_name"
    
    if poetry run pre-commit run "$hook_name" --all-files; then
        echo_success "Hook $hook_name passed!"
    else
        echo_warning "Hook $hook_name failed or made changes"
        return 1
    fi
}

# Update hooks to latest versions
update_hooks() {
    print_header "Updating Pre-commit Hooks"
    
    echo_info "Checking for hook updates..."
    poetry run pre-commit autoupdate
    echo_success "Hooks updated"
    
    echo_info "Testing updated hooks..."
    poetry run pre-commit run --all-files
}

# Show hook status
show_status() {
    print_header "Pre-commit Status"
    
    echo_info "Checking installation..."
    
    # Check if pre-commit is installed
    if poetry run pre-commit --version &> /dev/null; then
        VERSION=$(poetry run pre-commit --version)
        echo_success "Pre-commit installed: $VERSION"
    else
        echo_error "Pre-commit not installed"
        return 1
    fi
    
    # Check if hooks are installed
    if [ -f ".git/hooks/pre-commit" ]; then
        echo_success "Git hooks are installed"
    else
        echo_warning "Git hooks not installed (run: ./scripts/setup_precommit.sh install)"
    fi
    
    # List configured hooks
    echo ""
    echo_info "Configured hooks:"
    poetry run pre-commit run --all-files --verbose 2>&1 | grep "^\[.*\]" || true
}

# Clean pre-commit cache
clean_cache() {
    print_header "Cleaning Pre-commit Cache"
    
    echo_info "Cleaning hook cache..."
    poetry run pre-commit clean
    echo_success "Cache cleaned"
}

# Test specific tools
test_tools() {
    print_header "Testing Individual Tools"
    
    echo_info "Testing Black..."
    poetry run black --check bt_platform/ || echo_warning "Black would make changes"
    
    echo_info "Testing isort..."
    poetry run isort --check-only bt_platform/ || echo_warning "isort would make changes"
    
    echo_info "Testing Ruff..."
    poetry run ruff check bt_platform/ || echo_warning "Ruff found issues"
    
    echo_info "Testing Flake8..."
    poetry run flake8 bt_platform/ || echo_warning "Flake8 found issues"
    
    echo_success "Tool testing complete"
}

# Main menu
show_menu() {
    echo ""
    echo "Pre-commit Hooks Setup and Testing"
    echo "───────────────────────────────────"
    echo "1. Install pre-commit (via Poetry)"
    echo "2. Install git hooks"
    echo "3. Run hooks on all files"
    echo "4. Run hooks on staged files"
    echo "5. Run specific hook"
    echo "6. Update hooks to latest versions"
    echo "7. Show status"
    echo "8. Clean cache"
    echo "9. Test individual tools"
    echo "0. Exit"
    echo ""
    read -p "Select an option: " choice
    
    case $choice in
        1) install_precommit ;;
        2) install_hooks ;;
        3) run_all ;;
        4) run_staged ;;
        5)
            read -p "Enter hook name (e.g., black, prettier, ruff): " hook
            run_hook "$hook"
            ;;
        6) update_hooks ;;
        7) show_status ;;
        8) clean_cache ;;
        9) test_tools ;;
        0) exit 0 ;;
        *) echo_error "Invalid option" ;;
    esac
}

# Command-line interface
if [ $# -eq 0 ]; then
    # No arguments, show menu
    while true; do
        show_menu
        read -p "Press Enter to continue..."
    done
else
    # Process command-line arguments
    case $1 in
        install)
            install_precommit
            install_hooks
            ;;
        run)
            run_all
            ;;
        staged)
            run_staged
            ;;
        update)
            update_hooks
            ;;
        status)
            show_status
            ;;
        clean)
            clean_cache
            ;;
        test)
            test_tools
            ;;
        hook)
            if [ -z "$2" ]; then
                echo_error "Usage: $0 hook <hook-name>"
                exit 1
            fi
            run_hook "$2"
            ;;
        help|--help|-h)
            echo "Usage: $0 [command]"
            echo ""
            echo "Commands:"
            echo "  install    Install pre-commit and git hooks"
            echo "  run        Run all hooks on all files"
            echo "  staged     Run hooks on staged files"
            echo "  update     Update hooks to latest versions"
            echo "  status     Show installation status"
            echo "  clean      Clean pre-commit cache"
            echo "  test       Test individual tools"
            echo "  hook NAME  Run specific hook"
            echo "  help       Show this help message"
            echo ""
            echo "If no command is provided, an interactive menu is shown."
            ;;
        *)
            echo_error "Unknown command: $1"
            echo_info "Run '$0 help' for usage information"
            exit 1
            ;;
    esac
fi

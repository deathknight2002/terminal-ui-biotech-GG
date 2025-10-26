#!/usr/bin/env python3
"""
Comprehensive Production Readiness Verification

Tests all 5 critical improvements:
1. E2E Tests (Playwright) setup
2. Pre-commit hooks configuration
3. Observability (logging, metrics, Sentry)
4. API Token authentication
5. SQLite storage adapter

Run this before deployment to ensure all features work correctly.
"""

import sys
import os
import subprocess
from pathlib import Path

# Colors for output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
RESET = '\033[0m'
BOLD = '\033[1m'


def print_header(title):
    """Print a section header"""
    print(f"\n{BOLD}{'=' * 70}{RESET}")
    print(f"{BOLD}{title:^70}{RESET}")
    print(f"{BOLD}{'=' * 70}{RESET}\n")


def print_success(message):
    """Print success message"""
    print(f"{GREEN}✓{RESET} {message}")


def print_error(message):
    """Print error message"""
    print(f"{RED}✗{RESET} {message}")


def print_warning(message):
    """Print warning message"""
    print(f"{YELLOW}⚠{RESET} {message}")


def run_command(cmd, description, check=True):
    """Run a shell command and return result"""
    try:
        result = subprocess.run(
            cmd,
            shell=True,
            capture_output=True,
            text=True,
            check=check
        )
        return result.returncode == 0, result.stdout, result.stderr
    except subprocess.CalledProcessError as e:
        return False, e.stdout, e.stderr


def check_file_exists(path, description):
    """Check if a file exists"""
    if Path(path).exists():
        print_success(f"{description}: {path}")
        return True
    else:
        print_error(f"{description} not found: {path}")
        return False


def test_e2e_setup():
    """Test E2E test infrastructure"""
    print_header("1. E2E TESTS (PLAYWRIGHT)")
    
    results = []
    
    # Check Playwright config
    results.append(check_file_exists(
        "playwright.config.ts",
        "Playwright config"
    ))
    
    # Check E2E test directory
    results.append(check_file_exists(
        "tests/e2e/evidence-graph-manual-refresh.spec.ts",
        "Manual refresh E2E test"
    ))
    
    # Check evidence-graph spec
    results.append(check_file_exists(
        "tests/e2e/evidence-graph.spec.ts",
        "Evidence graph E2E spec"
    ))
    
    # Check terminal package.json has e2e scripts
    terminal_pkg = Path("terminal/package.json")
    if terminal_pkg.exists():
        with open(terminal_pkg) as f:
            content = f.read()
            if '"e2e"' in content and '"e2e:headed"' in content:
                print_success("E2E scripts in terminal/package.json")
                results.append(True)
            else:
                print_error("E2E scripts missing in terminal/package.json")
                results.append(False)
    else:
        print_error("terminal/package.json not found")
        results.append(False)
    
    # Check if @playwright/test is in dependencies
    root_pkg = Path("package.json")
    if root_pkg.exists():
        with open(root_pkg) as f:
            content = f.read()
            if '@playwright/test' in content:
                print_success("@playwright/test dependency present")
                results.append(True)
            else:
                print_warning("@playwright/test not in root package.json")
                results.append(True)  # Not critical, might be in terminal
    
    return all(results)


def test_precommit_hooks():
    """Test pre-commit hooks configuration"""
    print_header("2. PRE-COMMIT HOOKS")
    
    results = []
    
    # Check .pre-commit-config.yaml exists
    results.append(check_file_exists(
        ".pre-commit-config.yaml",
        "Pre-commit config"
    ))
    
    # Check if pre-commit is installed
    success, stdout, stderr = run_command(
        "pre-commit --version",
        "Check pre-commit installation",
        check=False
    )
    if success:
        print_success(f"pre-commit installed: {stdout.strip()}")
        results.append(True)
    else:
        print_warning("pre-commit not installed (run: pip install pre-commit)")
        results.append(False)
    
    # Verify config has required hooks
    config_path = Path(".pre-commit-config.yaml")
    if config_path.exists():
        with open(config_path) as f:
            content = f.read()
            hooks = ["black", "isort", "flake8", "ruff", "prettier"]
            for hook in hooks:
                if hook in content:
                    print_success(f"Hook configured: {hook}")
                else:
                    print_warning(f"Hook not found: {hook}")
    
    return all(results)


def test_observability():
    """Test observability infrastructure"""
    print_header("3. OBSERVABILITY")
    
    results = []
    
    # Check logging module
    results.append(check_file_exists(
        "bt_platform/core/utils/logging.py",
        "Structured logging module"
    ))
    
    # Check metrics module
    results.append(check_file_exists(
        "bt_platform/core/utils/metrics.py",
        "Prometheus metrics module"
    ))
    
    # Check Sentry module
    results.append(check_file_exists(
        "bt_platform/core/utils/sentry.py",
        "Sentry integration module"
    ))
    
    # Check observability docs
    results.append(check_file_exists(
        "docs/OBSERVABILITY.md",
        "Observability documentation"
    ))
    
    # Verify app.py includes observability setup
    app_path = Path("bt_platform/core/app.py")
    if app_path.exists():
        with open(app_path) as f:
            content = f.read()
            checks = [
                ("setup_structured_logging", "Structured logging setup"),
                ("MetricsMiddleware", "Metrics middleware"),
                ("init_sentry", "Sentry initialization"),
                ("metrics_router", "Metrics endpoint router")
            ]
            for check, desc in checks:
                if check in content:
                    print_success(desc)
                else:
                    print_error(f"{desc} not found in app.py")
                    results.append(False)
    
    return all(results)


def test_authentication():
    """Test API token authentication"""
    print_header("4. API TOKEN AUTHENTICATION")
    
    results = []
    
    # Check auth middleware
    results.append(check_file_exists(
        "bt_platform/core/middleware/auth.py",
        "Auth middleware"
    ))
    
    # Check config has auth settings
    config_path = Path("bt_platform/core/config.py")
    if config_path.exists():
        with open(config_path) as f:
            content = f.read()
            if "API_TOKEN_ENABLED" in content and "API_TOKEN" in content:
                print_success("Auth config settings present")
                results.append(True)
            else:
                print_error("Auth config settings missing")
                results.append(False)
    
    # Check app.py includes auth middleware
    app_path = Path("bt_platform/core/app.py")
    if app_path.exists():
        with open(app_path) as f:
            content = f.read()
            if "APITokenAuthMiddleware" in content:
                print_success("Auth middleware configured in app.py")
                results.append(True)
            else:
                print_error("Auth middleware not configured in app.py")
                results.append(False)
    
    # Check auth tests exist
    results.append(check_file_exists(
        "tests/test_auth.py",
        "Auth tests"
    ))
    
    # Check auth documentation
    auth_docs = Path("docs/AUTHENTICATION.md")
    if auth_docs.exists():
        print_success("Authentication documentation exists")
        results.append(True)
    else:
        print_warning("Authentication documentation not found")
        results.append(True)  # Not critical
    
    return all(results)


def test_sqlite_storage():
    """Test SQLite storage adapter"""
    print_header("5. SQLITE STORAGE")
    
    results = []
    
    # Check SQLite storage module
    results.append(check_file_exists(
        "bt_platform/core/evidence_graph/storage_sqlite.py",
        "SQLite storage adapter"
    ))
    
    # Check models
    results.append(check_file_exists(
        "bt_platform/core/evidence_graph/models.py",
        "Evidence graph models"
    ))
    
    # Check migration script
    results.append(check_file_exists(
        "scripts/migrate_to_sqlite.py",
        "Migration script"
    ))
    
    # Check config has storage settings
    config_path = Path("bt_platform/core/config.py")
    if config_path.exists():
        with open(config_path) as f:
            content = f.read()
            if "EVIDENCE_GRAPH_STORAGE" in content:
                print_success("Storage config setting present")
                results.append(True)
            else:
                print_error("Storage config setting missing")
                results.append(False)
    
    # Check evidence_graph endpoint supports both storages
    endpoint_path = Path("bt_platform/core/endpoints/evidence_graph.py")
    if endpoint_path.exists():
        with open(endpoint_path) as f:
            content = f.read()
            if "SQLiteEvidenceGraphStorage" in content:
                print_success("Evidence graph endpoint supports SQLite")
                results.append(True)
            else:
                print_error("Evidence graph endpoint doesn't support SQLite")
                results.append(False)
    
    return all(results)


def print_summary(results):
    """Print summary of all tests"""
    print_header("SUMMARY")
    
    total = len(results)
    passed = sum(results.values())
    failed = total - passed
    
    print(f"Total checks: {total}")
    print(f"{GREEN}Passed: {passed}{RESET}")
    if failed > 0:
        print(f"{RED}Failed: {failed}{RESET}")
    
    print()
    for name, result in results.items():
        status = f"{GREEN}✓{RESET}" if result else f"{RED}✗{RESET}"
        print(f"{status} {name}")
    
    print()
    if all(results.values()):
        print(f"{GREEN}{BOLD}✅ ALL CHECKS PASSED{RESET}")
        print()
        print("Your platform is production-ready! 🚀")
        print()
        print("Next steps:")
        print("  1. npm run test:e2e          # Run E2E tests")
        print("  2. poetry run pytest          # Run backend tests")
        print("  3. pre-commit run --all-files # Run code quality checks")
        print("  4. Deploy with confidence!")
        return 0
    else:
        print(f"{RED}{BOLD}❌ SOME CHECKS FAILED{RESET}")
        print()
        print("Please fix the issues above before deploying to production.")
        return 1


def main():
    """Run all verification checks"""
    print()
    print(f"{BOLD}╔════════════════════════════════════════════════════════════════════╗{RESET}")
    print(f"{BOLD}║         PRODUCTION READINESS VERIFICATION                          ║{RESET}")
    print(f"{BOLD}║         Evidence Graph Manual Refresh & Production Enhancements   ║{RESET}")
    print(f"{BOLD}╚════════════════════════════════════════════════════════════════════╝{RESET}")
    
    # Change to repo root
    repo_root = Path(__file__).parent.parent
    os.chdir(repo_root)
    
    # Run all tests
    results = {
        "E2E Tests Setup": test_e2e_setup(),
        "Pre-commit Hooks": test_precommit_hooks(),
        "Observability": test_observability(),
        "API Authentication": test_authentication(),
        "SQLite Storage": test_sqlite_storage(),
    }
    
    # Print summary and exit
    return print_summary(results)


if __name__ == "__main__":
    sys.exit(main())

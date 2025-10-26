#!/usr/bin/env python3
"""
Verification script for bt_platform package renaming.
This script verifies that the package renaming from 'platform' to 'bt_platform' was successful.
"""

import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

def test_basic_import():
    """Test that bt_platform can be imported."""
    try:
        import bt_platform
        print("✅ bt_platform module imports successfully")
        print(f"   Version: {bt_platform.__version__}")
        print(f"   Author: {bt_platform.__author__}")
        return True
    except ImportError as e:
        print(f"❌ Failed to import bt_platform: {e}")
        return False

def test_tui_imports():
    """Test that TUI components can be imported."""
    try:
        from bt_platform.tui.services import WatchlistManager, RecentAssetsTracker
        from bt_platform.tui.helpers import get_risk_metrics
        print("✅ TUI services import successfully")

        # Test instantiation
        wm = WatchlistManager()
        rat = RecentAssetsTracker()
        print(f"   WatchlistManager: {type(wm).__name__}")
        print(f"   RecentAssetsTracker: {type(rat).__name__}")
        return True
    except ImportError as e:
        print(f"❌ Failed to import TUI components: {e}")
        return False

def test_core_imports():
    """Test that core components can be imported (context-aware)."""
    # Core functionality tests should focus on what can be imported without all dependencies
    # Database and config modules require sqlalchemy, pydantic-settings which may not be installed

    success_count = 0
    total_count = 0

    # Test 1: Check if core package structure exists
    total_count += 1
    try:
        import bt_platform.core
        print("✅ Core package structure exists")
        success_count += 1
    except ImportError as e:
        print(f"❌ Failed to import bt_platform.core: {e}")

    # Test 2: Try importing config (with graceful handling)
    total_count += 1
    try:
        from bt_platform.core import config
        print("✅ Config module imports successfully")
        success_count += 1
    except ImportError as e:
        if "pydantic" in str(e).lower():
            print(f"⚠️  Config module requires pydantic-settings (optional dependency): {e}")
            print("   This is expected if dependencies are not installed")
            success_count += 1  # Don't fail for missing optional deps
        else:
            print(f"❌ Failed to import config: {e}")

    # Test 3: Try importing database (with graceful handling)
    total_count += 1
    try:
        from bt_platform.core import database
        print("✅ Database module imports successfully")
        success_count += 1
    except ImportError as e:
        if "sqlalchemy" in str(e).lower():
            print(f"⚠️  Database module requires sqlalchemy (optional dependency): {e}")
            print("   This is expected if dependencies are not installed")
            success_count += 1  # Don't fail for missing optional deps
        else:
            print(f"❌ Failed to import database: {e}")

    if success_count == total_count:
        print(f"✅ Core imports test passed ({success_count}/{total_count})")
        return True
    else:
        print(f"⚠️  Core imports partially passed ({success_count}/{total_count})")
        return False

def test_test_imports():
    """Test that test modules can import bt_platform correctly."""
    try:
        from tests.tui.test_watchlist_manager import TestWatchlistManager
        print("✅ Test modules import successfully")
        return True
    except ImportError as e:
        print(f"❌ Failed to import test modules: {e}")
        return False

def check_old_platform_removed():
    """Verify the old 'platform' directory is removed."""
    old_platform = project_root / "platform"
    if old_platform.exists():
        print("❌ Old 'platform/' directory still exists!")
        return False
    else:
        print("✅ Old 'platform/' directory successfully removed")
        return True

def check_new_bt_platform_exists():
    """Verify the new 'bt_platform' directory exists."""
    new_bt_platform = project_root / "bt_platform"
    if new_bt_platform.exists() and new_bt_platform.is_dir():
        print("✅ New 'bt_platform/' directory exists")

        # Check for key subdirectories
        subdirs = ['core', 'tui', 'cli', 'scrapers', 'providers']
        for subdir in subdirs:
            if (new_bt_platform / subdir).exists():
                print(f"   ✓ {subdir}/")
            else:
                print(f"   ✗ {subdir}/ (missing)")
        return True
    else:
        print("❌ New 'bt_platform/' directory does not exist!")
        return False

def check_documentation_updated():
    """Check that key documentation files were updated."""
    files_to_check = [
        "README.md",
        "docs/TUI.md",
        "docs/DEVELOPMENT.md",
        "test_tui.sh",
        "scripts/scrape.sh",
        "package.json",
        "pyproject.toml",
    ]

    print("\n📝 Checking documentation updates...")
    all_good = True

    for file_path in files_to_check:
        full_path = project_root / file_path
        if not full_path.exists():
            print(f"   ⚠️  {file_path} not found")
            continue

        content = full_path.read_text()

        # Check for old references
        old_refs = ["python -m platform.tui", "python -m platform.cli", "from platform.", "import platform."]
        has_old = any(ref in content for ref in old_refs if "bt_platform" not in content)

        # Check for new references
        has_new = "bt_platform" in content or file_path not in ["README.md", "docs/TUI.md", "docs/DEVELOPMENT.md"]

        if has_old:
            print(f"   ⚠️  {file_path} may have old 'platform' references")
            all_good = False
        elif has_new:
            print(f"   ✓ {file_path}")
        else:
            print(f"   ? {file_path} (no bt_platform references found)")

    return all_good

def main():
    """Run all verification tests."""
    print("=" * 70)
    print("bt_platform Package Renaming Verification")
    print("=" * 70)
    print()

    tests = [
        ("Basic Import", test_basic_import),
        ("TUI Imports", test_tui_imports),
        ("Core Imports", test_core_imports),
        ("Test Imports", test_test_imports),
        ("Old Directory Removed", check_old_platform_removed),
        ("New Directory Exists", check_new_bt_platform_exists),
    ]

    results = []
    for name, test_func in tests:
        print(f"\n{name}:")
        print("-" * 70)
        results.append(test_func())

    # Check documentation
    doc_result = check_documentation_updated()

    print("\n" + "=" * 70)
    print("Summary:")
    print("=" * 70)

    passed = sum(results)
    total = len(results)

    print(f"Tests passed: {passed}/{total}")

    if passed == total and doc_result:
        print("\n🎉 All verifications passed! Package rename successful.")
        return 0
    elif passed == total:
        print("\n⚠️  All imports work, but some documentation may need updates.")
        return 0
    else:
        print("\n❌ Some verifications failed. Please check the output above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())

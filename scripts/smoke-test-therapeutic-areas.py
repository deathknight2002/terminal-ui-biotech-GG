#!/usr/bin/env python3
"""
Smoke Test Script for Therapeutic Areas API

Tests the API endpoints to ensure they work correctly:
- GET /api/v1/therapeutic-areas/areas
- GET /api/v1/therapeutic-areas/areas/{area}
- GET /api/v1/therapeutic-areas/areas/compare/radar
"""

import sys
import yaml
from pathlib import Path

# Add project root to path
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))


def test_yaml_files():
    """Test that YAML files are valid and have correct structure"""
    print("=" * 60)
    print("Testing YAML Data Files")
    print("=" * 60)
    
    # Test companies.yaml
    companies_file = PROJECT_ROOT / "data" / "companies.yaml"
    if not companies_file.exists():
        print(f"❌ Missing: {companies_file}")
        return False
    
    try:
        with open(companies_file) as f:
            companies = yaml.safe_load(f)
        
        print(f"✓ Loaded {len(companies)} companies from companies.yaml")
        
        # Validate structure
        required_fields = ['name', 'ticker', 'is_private', 'areas', 'hq', 'pipeline_count']
        for i, company in enumerate(companies[:3]):  # Check first 3
            missing = [f for f in required_fields if f not in company]
            if missing:
                print(f"  ⚠️  Company {i} missing fields: {missing}")
            else:
                print(f"  ✓ Company {i}: {company['name']} ({company['ticker']})")
        
        # Count by therapeutic area
        dmd_count = sum(1 for c in companies if 'DMD' in c.get('areas', []))
        cardio_count = sum(1 for c in companies if 'Cardiology' in c.get('areas', []))
        medtech_count = sum(1 for c in companies if 'MedTech' in c.get('areas', []))
        
        print(f"\n  Breakdown:")
        print(f"    - DMD: {dmd_count} companies")
        print(f"    - Cardiology: {cardio_count} companies")
        print(f"    - MedTech: {medtech_count} companies")
        
        if len(companies) != 28:
            print(f"  ⚠️  Expected 28 companies, got {len(companies)}")
        
    except Exception as e:
        print(f"❌ Error loading companies.yaml: {e}")
        return False
    
    # Test programs.yaml
    programs_file = PROJECT_ROOT / "data" / "programs.yaml"
    if not programs_file.exists():
        print(f"❌ Missing: {programs_file}")
        return False
    
    try:
        with open(programs_file) as f:
            programs = yaml.safe_load(f)
        
        print(f"\n✓ Loaded {len(programs)} programs from programs.yaml")
        
        # Validate structure
        required_fields = ['company', 'name', 'mechanism', 'indication', 'phase', 'registry_ids']
        for i, program in enumerate(programs[:3]):  # Check first 3
            missing = [f for f in required_fields if f not in program]
            if missing:
                print(f"  ⚠️  Program {i} missing fields: {missing}")
            else:
                print(f"  ✓ Program {i}: {program['name']} ({program['phase']})")
        
        if len(programs) != 16:
            print(f"  ⚠️  Expected 16 programs, got {len(programs)}")
        
    except Exception as e:
        print(f"❌ Error loading programs.yaml: {e}")
        return False
    
    print("\n✅ YAML files validated successfully\n")
    return True


def test_api_structure():
    """Test that API module structure is correct"""
    print("=" * 60)
    print("Testing API Structure")
    print("=" * 60)
    
    try:
        from platform.core.endpoints.therapeutic_areas import (
            DB, ATTRS, AreaScores, list_areas, get_area, compare_radar
        )
        
        print("✓ Successfully imported therapeutic_areas module")
        print(f"  - DB has {len(DB)} therapeutic areas")
        print(f"  - ATTRS has {len(ATTRS)} attributes")
        
        # Test DB structure
        for area_id, area in DB.items():
            if not isinstance(area, AreaScores):
                print(f"  ⚠️  {area_id} is not an AreaScores instance")
            else:
                if len(area.scores) != 7:
                    print(f"  ⚠️  {area_id} has {len(area.scores)} scores (expected 7)")
        
        print("\n✓ API structure is valid")
        
        # Test list_areas
        areas = list_areas()
        print(f"✓ list_areas() returns {len(areas)} areas")
        
        # Test get_area
        dmd = get_area("DMD")
        print(f"✓ get_area('DMD') returns: {dmd.area}")
        
        # Test compare_radar
        result = compare_radar(["DMD", "Cardiology"])
        print(f"✓ compare_radar(['DMD', 'Cardiology']) returns:")
        print(f"  - {len(result['attributes'])} attributes")
        print(f"  - {len(result['series'])} series")
        print(f"  - palette: {result['palette']}")
        
        print("\n✅ API structure tests passed\n")
        return True
        
    except Exception as e:
        print(f"❌ Error testing API structure: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_rate_limiter():
    """Test rate limiter utility"""
    print("=" * 60)
    print("Testing Rate Limiter Utility")
    print("=" * 60)
    
    try:
        from platform.core.utils.ratelimit import (
            rate_limited, get_cache_stats, get_rate_limiter_stats
        )
        
        print("✓ Successfully imported ratelimit module")
        
        # Test decorator
        @rate_limited(domain="test.example.com", rps=10.0, burst=5, ttl=60)
        def mock_fetch(url, **kwargs):
            return {"status": "ok", "url": url}
        
        result = mock_fetch("https://test.example.com/api")
        print(f"✓ rate_limited decorator works: {result}")
        
        # Test cache stats
        cache_stats = get_cache_stats()
        print(f"✓ Cache stats: {cache_stats}")
        
        # Test rate limiter stats
        rl_stats = get_rate_limiter_stats()
        print(f"✓ Rate limiter stats: {rl_stats}")
        
        print("\n✅ Rate limiter tests passed\n")
        return True
        
    except Exception as e:
        print(f"❌ Error testing rate limiter: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all smoke tests"""
    print("\n" + "=" * 60)
    print("THERAPEUTIC AREAS API SMOKE TESTS")
    print("=" * 60 + "\n")
    
    results = []
    
    # Run tests
    results.append(("YAML Files", test_yaml_files()))
    results.append(("API Structure", test_api_structure()))
    results.append(("Rate Limiter", test_rate_limiter()))
    
    # Summary
    print("=" * 60)
    print("SUMMARY")
    print("=" * 60)
    
    for name, passed in results:
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"{status} - {name}")
    
    all_passed = all(passed for _, passed in results)
    
    if all_passed:
        print("\n🎉 All smoke tests passed!")
        print("\nNext steps:")
        print("  1. Start FastAPI backend:")
        print("     cd platform && poetry run uvicorn platform.core.app:app --reload")
        print("\n  2. Test endpoints:")
        print("     curl http://localhost:8000/api/v1/therapeutic-areas/areas")
        print('     curl "http://localhost:8000/api/v1/therapeutic-areas/areas/compare/radar?areas=DMD&areas=Cardiology"')
        return 0
    else:
        print("\n❌ Some tests failed. Please fix the issues above.")
        return 1


if __name__ == "__main__":
    sys.exit(main())

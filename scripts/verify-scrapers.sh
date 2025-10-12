#!/bin/bash
# Verification script for scraper framework

set -e

echo "🔍 Verifying Scraper Framework Installation..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

pass=0
fail=0

# Test 1: Python imports
echo "Testing Python imports..."
python -c "from platform.scrapers.base.registry import ScraperRegistry" 2>/dev/null && echo -e "${GREEN}✓${NC} Import ScraperRegistry" && ((pass++)) || (echo -e "${RED}✗${NC} Import ScraperRegistry" && ((fail++)))

python -c "from platform.scrapers.base.interface import ScraperInterface, ScraperResult" 2>/dev/null && echo -e "${GREEN}✓${NC} Import ScraperInterface" && ((pass++)) || (echo -e "${RED}✗${NC} Import ScraperInterface" && ((fail++)))

python -c "from platform.scrapers.utils.http_client import AsyncHTTPClient" 2>/dev/null && echo -e "${GREEN}✓${NC} Import AsyncHTTPClient" && ((pass++)) || (echo -e "${RED}✗${NC} Import AsyncHTTPClient" && ((fail++)))

python -c "from platform.scrapers.utils.rate_limiter import TokenBucketRateLimiter" 2>/dev/null && echo -e "${GREEN}✓${NC} Import TokenBucketRateLimiter" && ((pass++)) || (echo -e "${RED}✗${NC} Import TokenBucketRateLimiter" && ((fail++)))

python -c "from platform.scrapers.utils.deduplication import canonical_url, content_hash" 2>/dev/null && echo -e "${GREEN}✓${NC} Import deduplication utils" && ((pass++)) || (echo -e "${RED}✗${NC} Import deduplication utils" && ((fail++)))

python -c "from platform.scrapers.utils.parsing import extract_article_metadata" 2>/dev/null && echo -e "${GREEN}✓${NC} Import parsing utils" && ((pass++)) || (echo -e "${RED}✗${NC} Import parsing utils" && ((fail++)))

# Test 2: Registry loading
echo ""
echo "Testing registry..."
python -c "from platform.scrapers.base.registry import ScraperRegistry; r = ScraperRegistry(); assert len(r.list_sources()) > 0" 2>/dev/null && echo -e "${GREEN}✓${NC} Registry loads with sources" && ((pass++)) || (echo -e "${RED}✗${NC} Registry loads with sources" && ((fail++)))

# Test 3: Scraper imports
echo ""
echo "Testing scraper implementations..."
python -c "from platform.scrapers.sites.fierce_scraper import FierceScraper" 2>/dev/null && echo -e "${GREEN}✓${NC} Import FierceScraper" && ((pass++)) || (echo -e "${RED}✗${NC} Import FierceScraper" && ((fail++)))

python -c "from platform.scrapers.sites.press_release_scraper import BusinessWireScraper" 2>/dev/null && echo -e "${GREEN}✓${NC} Import BusinessWireScraper" && ((pass++)) || (echo -e "${RED}✗${NC} Import BusinessWireScraper" && ((fail++)))

python -c "from platform.scrapers.sites.regulator_scraper import FDAScraper" 2>/dev/null && echo -e "${GREEN}✓${NC} Import FDAScraper" && ((pass++)) || (echo -e "${RED}✗${NC} Import FDAScraper" && ((fail++)))

# Test 4: CLI
echo ""
echo "Testing CLI..."
python -m bt_platform.cli.scrape --help >/dev/null 2>&1 && echo -e "${GREEN}✓${NC} CLI help works" && ((pass++)) || (echo -e "${RED}✗${NC} CLI help works" && ((fail++)))

# Test 5: Utilities
echo ""
echo "Testing utilities..."
python -c "from platform.scrapers.utils.deduplication import canonical_url; assert canonical_url('https://EXAMPLE.COM/test?utm_source=x') == 'https://example.com/test'" 2>/dev/null && echo -e "${GREEN}✓${NC} URL canonicalization" && ((pass++)) || (echo -e "${RED}✗${NC} URL canonicalization" && ((fail++)))

python -c "from platform.scrapers.utils.deduplication import content_hash; assert len(content_hash('test')) == 64" 2>/dev/null && echo -e "${GREEN}✓${NC} Content hashing" && ((pass++)) || (echo -e "${RED}✗${NC} Content hashing" && ((fail++)))

# Test 6: Scripts
echo ""
echo "Testing scripts..."
[ -x ./scripts/scrape.sh ] && echo -e "${GREEN}✓${NC} scrape.sh is executable" && ((pass++)) || (echo -e "${RED}✗${NC} scrape.sh is executable" && ((fail++)))

[ -f ./Makefile ] && echo -e "${GREEN}✓${NC} Makefile exists" && ((pass++)) || (echo -e "${RED}✗${NC} Makefile exists" && ((fail++)))

# Test 7: Documentation
echo ""
echo "Testing documentation..."
[ -f ./docs/SCRAPERS_GUIDE.md ] && echo -e "${GREEN}✓${NC} SCRAPERS_GUIDE.md exists" && ((pass++)) || (echo -e "${RED}✗${NC} SCRAPERS_GUIDE.md exists" && ((fail++)))

[ -f ./docs/REFRESH_MODEL.md ] && echo -e "${GREEN}✓${NC} REFRESH_MODEL.md exists" && ((pass++)) || (echo -e "${RED}✗${NC} REFRESH_MODEL.md exists" && ((fail++)))

[ -f ./docs/SOURCE_PACKS.md ] && echo -e "${GREEN}✓${NC} SOURCE_PACKS.md exists" && ((pass++)) || (echo -e "${RED}✗${NC} SOURCE_PACKS.md exists" && ((fail++)))

[ -f ./platform/scrapers/README.md ] && echo -e "${GREEN}✓${NC} Scrapers README exists" && ((pass++)) || (echo -e "${RED}✗${NC} Scrapers README exists" && ((fail++)))

# Test 8: Registry file
echo ""
echo "Testing registry file..."
[ -f ./platform/scrapers/registry.yaml ] && echo -e "${GREEN}✓${NC} registry.yaml exists" && ((pass++)) || (echo -e "${RED}✗${NC} registry.yaml exists" && ((fail++)))

grep -q "fierce_biotech" ./platform/scrapers/registry.yaml && echo -e "${GREEN}✓${NC} Registry contains fierce_biotech" && ((pass++)) || (echo -e "${RED}✗${NC} Registry contains fierce_biotech" && ((fail++)))

grep -q "fda" ./platform/scrapers/registry.yaml && echo -e "${GREEN}✓${NC} Registry contains fda" && ((pass++)) || (echo -e "${RED}✗${NC} Registry contains fda" && ((fail++)))

# Test 9: Directory structure
echo ""
echo "Testing directory structure..."
[ -d ./platform/scrapers/base ] && echo -e "${GREEN}✓${NC} base/ directory exists" && ((pass++)) || (echo -e "${RED}✗${NC} base/ directory exists" && ((fail++)))

[ -d ./platform/scrapers/sites ] && echo -e "${GREEN}✓${NC} sites/ directory exists" && ((pass++)) || (echo -e "${RED}✗${NC} sites/ directory exists" && ((fail++)))

[ -d ./platform/scrapers/utils ] && echo -e "${GREEN}✓${NC} utils/ directory exists" && ((pass++)) || (echo -e "${RED}✗${NC} utils/ directory exists" && ((fail++)))

[ -d ./platform/scrapers/tests ] && echo -e "${GREEN}✓${NC} tests/ directory exists" && ((pass++)) || (echo -e "${RED}✗${NC} tests/ directory exists" && ((fail++)))

[ -d ./platform/cli ] && echo -e "${GREEN}✓${NC} cli/ directory exists" && ((pass++)) || (echo -e "${RED}✗${NC} cli/ directory exists" && ((fail++)))

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "Results: ${GREEN}${pass} passed${NC}, ${RED}${fail} failed${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $fail -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "🚀 Scraper framework is ready to use!"
    echo ""
    echo "Quick start:"
    echo "  python -m bt_platform.cli.scrape --source fierce --since 7d --limit 10"
    echo "  make scrape-fierce"
    echo "  ./scripts/scrape.sh --source fda --limit 5"
    exit 0
else
    echo -e "${RED}✗ Some checks failed${NC}"
    echo ""
    echo "Please install missing dependencies:"
    echo "  pip install httpx pyyaml selectolax feedparser python-dateutil orjson simhash datasketch beautifulsoup4 lxml"
    exit 1
fi

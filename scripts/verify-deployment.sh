#!/bin/bash

# Deployment Verification Script
# Tests that the deployment is working correctly

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                      ║${NC}"
echo -e "${BLUE}║     🧬 Biotech Terminal - Deployment Verification   ║${NC}"
echo -e "${BLUE}║                                                      ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

PASSED=0
FAILED=0
WARNINGS=0

# Function to test endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local expected_status=${3:-200}
    
    echo -n "Testing $name... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    
    if [ "$response" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $response)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (HTTP $response, expected $expected_status)"
        ((FAILED++))
        return 1
    fi
}

# Function to test command
test_command() {
    local name=$1
    local command=$2
    
    echo -n "Testing $name... "
    
    if eval "$command" &> /dev/null; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        ((FAILED++))
        return 1
    fi
}

echo -e "${YELLOW}1. Testing Prerequisites${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_command "Python 3.9+" "python3 --version | grep -E 'Python 3\.(9|1[0-2])'"
test_command "Node.js 18+" "node --version | grep -E 'v(1[8-9]|[2-9][0-9])'"
test_command "Docker" "docker --version"

if command -v "docker compose" &> /dev/null; then
    test_command "Docker Compose" "docker compose version"
elif command -v "docker-compose" &> /dev/null; then
    test_command "Docker Compose" "docker-compose --version"
else
    echo -n "Testing Docker Compose... "
    echo -e "${YELLOW}⚠ SKIP${NC} (not required for manual install)"
    ((WARNINGS++))
fi

echo ""
echo -e "${YELLOW}2. Testing File Structure${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_command "bt_platform directory" "[ -d bt_platform ]"
test_command "frontend-components directory" "[ -d frontend-components ]"
test_command "terminal directory" "[ -d terminal ]"
test_command "pyproject.toml" "[ -f pyproject.toml ]"
test_command "package.json" "[ -f package.json ]"

echo -n "Testing .env file... "
if [ -f .env ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ WARN${NC} (not found, using .env.example)"
    ((WARNINGS++))
fi

echo ""
echo -e "${YELLOW}3. Testing Application Endpoints${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Wait for service to be ready
echo -n "Waiting for service to start... "
sleep 2
echo -e "${GREEN}✓${NC}"

test_endpoint "API Health Check" "http://localhost:8000/health" "200"
test_endpoint "API Documentation" "http://localhost:8000/docs" "200"
test_endpoint "OpenAPI Schema" "http://localhost:8000/openapi.json" "200"

# Test some API endpoints
echo ""
echo -e "${YELLOW}4. Testing API Functionality${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_endpoint "Drugs Endpoint" "http://localhost:8000/api/v1/drugs" "200"
test_endpoint "Companies Endpoint" "http://localhost:8000/api/v1/companies" "200"

# Test metrics (optional)
echo -n "Testing Prometheus Metrics... "
response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8000/metrics" 2>/dev/null || echo "000")
if [ "$response" = "200" ]; then
    echo -e "${GREEN}✓ PASS${NC} (Metrics enabled)"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ SKIP${NC} (Metrics may be disabled)"
    ((WARNINGS++))
fi

echo ""
echo -e "${YELLOW}5. Testing Docker Containers (if applicable)${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if command -v docker &> /dev/null && docker info &> /dev/null; then
    # Check if containers are running
    echo -n "Testing biotech-terminal container... "
    if docker ps | grep -q biotech-terminal-app; then
        echo -e "${GREEN}✓ PASS${NC} (running)"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠ SKIP${NC} (not using Docker)"
        ((WARNINGS++))
    fi
    
    echo -n "Testing PostgreSQL container... "
    if docker ps | grep -q biotech-terminal-db; then
        echo -e "${GREEN}✓ PASS${NC} (running)"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠ SKIP${NC} (not using PostgreSQL)"
        ((WARNINGS++))
    fi
    
    echo -n "Testing Redis container... "
    if docker ps | grep -q biotech-terminal-redis; then
        echo -e "${GREEN}✓ PASS${NC} (running)"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠ SKIP${NC} (not using Redis)"
        ((WARNINGS++))
    fi
else
    echo -e "${YELLOW}⚠ Docker not available - skipping container tests${NC}"
    ((WARNINGS+=3))
fi

echo ""
echo -e "${YELLOW}6. Testing Database${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -n "Testing database connection... "
# Try to query the database through API
response=$(curl -s "http://localhost:8000/api/v1/drugs?limit=1" 2>/dev/null)
if [ ! -z "$response" ] && [ "$response" != "null" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ WARN${NC} (database may be empty)"
    ((WARNINGS++))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}Test Results${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}Passed:   $PASSED${NC}"
echo -e "${RED}Failed:   $FAILED${NC}"
echo -e "${YELLOW}Warnings: $WARNINGS${NC}"
echo ""

TOTAL=$((PASSED + FAILED))
if [ $TOTAL -gt 0 ]; then
    SUCCESS_RATE=$(( (PASSED * 100) / TOTAL ))
    echo "Success Rate: $SUCCESS_RATE%"
fi

echo ""
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}╔══════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                      ║${NC}"
    echo -e "${GREEN}║          ✓ All critical tests passed!                ║${NC}"
    echo -e "${GREEN}║          Deployment appears healthy                  ║${NC}"
    echo -e "${GREEN}║                                                      ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Access your platform at:"
    echo -e "  ${BLUE}API:${NC}              http://localhost:8000"
    echo -e "  ${BLUE}Documentation:${NC}    http://localhost:8000/docs"
    echo ""
    exit 0
else
    echo -e "${RED}╔══════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                                                      ║${NC}"
    echo -e "${RED}║          ✗ Some tests failed!                        ║${NC}"
    echo -e "${RED}║          Please review errors above                  ║${NC}"
    echo -e "${RED}║                                                      ║${NC}"
    echo -e "${RED}╚══════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Check application logs: docker compose logs -f"
    echo "  2. Verify .env configuration"
    echo "  3. See TROUBLESHOOTING.md for common issues"
    echo "  4. Run diagnostics: ./scripts/collect-diagnostics.sh"
    echo ""
    exit 1
fi

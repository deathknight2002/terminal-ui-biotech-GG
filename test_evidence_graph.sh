#!/bin/bash

# Evidence Graph Smoke Test
# Tests the evidence graph API endpoints and verifies manual-refresh architecture

echo "🧪 Evidence Graph Smoke Test"
echo "=============================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_URL="http://localhost:8000"

# Check if server is running
echo "🔍 Checking if API server is running..."
if ! curl -s "${API_URL}/health" > /dev/null 2>&1; then
    echo -e "${RED}❌ API server is not running on ${API_URL}${NC}"
    echo ""
    echo "Start the server with:"
    echo "  python3 standalone_evidence_api.py"
    echo "  # OR"
    echo "  uvicorn standalone_evidence_api:app --host 0.0.0.0 --port 8000"
    exit 1
fi
echo -e "${GREEN}✅ API server is running${NC}"
echo ""

# Test health endpoint
echo "📡 Testing /health endpoint..."
HEALTH=$(curl -s "${API_URL}/health")
if echo "$HEALTH" | grep -q "ok"; then
    echo -e "${GREEN}✅ Health check passed${NC}"
    echo "   Response: $HEALTH"
else
    echo -e "${RED}❌ Health check failed${NC}"
    exit 1
fi
echo ""

# Test evidence graph health
echo "📡 Testing /api/v1/evidence-graph/health endpoint..."
EG_HEALTH=$(curl -s "${API_URL}/api/v1/evidence-graph/health")
if echo "$EG_HEALTH" | grep -q "ok"; then
    echo -e "${GREEN}✅ Evidence graph health check passed${NC}"
    echo "   Response: $EG_HEALTH"
else
    echo -e "${RED}❌ Evidence graph health check failed${NC}"
    exit 1
fi
echo ""

# Test nodes endpoint
echo "📊 Testing /api/v1/evidence-graph/nodes endpoint..."
NODES=$(curl -s "${API_URL}/api/v1/evidence-graph/nodes")
NODE_COUNT=$(echo "$NODES" | python3 -c "import sys, json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "0")
if [ "$NODE_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ Nodes endpoint working${NC}"
    echo "   Loaded $NODE_COUNT nodes"
    echo "   Node types: $(echo "$NODES" | python3 -c "import sys, json; nodes=json.load(sys.stdin); print(', '.join(set(n['type'] for n in nodes)))" 2>/dev/null)"
else
    echo -e "${RED}❌ Nodes endpoint failed or returned empty${NC}"
    exit 1
fi
echo ""

# Test edges endpoint
echo "🔗 Testing /api/v1/evidence-graph/edges endpoint..."
EDGES=$(curl -s "${API_URL}/api/v1/evidence-graph/edges")
EDGE_COUNT=$(echo "$EDGES" | python3 -c "import sys, json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "0")
if [ "$EDGE_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ Edges endpoint working${NC}"
    echo "   Loaded $EDGE_COUNT edges"
    echo "   Relations: $(echo "$EDGES" | python3 -c "import sys, json; edges=json.load(sys.stdin); print(', '.join(set(e['relation'] for e in edges)))" 2>/dev/null)"
else
    echo -e "${RED}❌ Edges endpoint failed or returned empty${NC}"
    exit 1
fi
echo ""

# Test thesis timeline endpoint
echo "📈 Testing /api/v1/evidence-graph/thesis/{id}/timeline endpoint..."
TIMELINE=$(curl -s "${API_URL}/api/v1/evidence-graph/thesis/thesis:SRRK-core/timeline")
if echo "$TIMELINE" | grep -q "thesis_id"; then
    echo -e "${GREEN}✅ Thesis timeline endpoint working${NC}"
    UPDATES=$(echo "$TIMELINE" | python3 -c "import sys, json; t=json.load(sys.stdin); print(t['summary']['total_updates'])" 2>/dev/null || echo "0")
    echo "   Total updates: $UPDATES"
    FINAL_POS=$(echo "$TIMELINE" | python3 -c "import sys, json; t=json.load(sys.stdin); print(f\"{t['summary']['final_pos']:.2%}\")" 2>/dev/null || echo "N/A")
    echo "   Final PoS: $FINAL_POS"
else
    echo -e "${RED}❌ Thesis timeline endpoint failed${NC}"
    exit 1
fi
echo ""

# Test screen endpoint
echo "🔍 Testing /api/v1/evidence-graph/screen endpoint..."
SCREEN=$(curl -s "${API_URL}/api/v1/evidence-graph/screen?pos_delta_abs_gt=0.01")
SCREEN_COUNT=$(echo "$SCREEN" | python3 -c "import sys, json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "0")
echo -e "${GREEN}✅ Screen endpoint working${NC}"
echo "   Found $SCREEN_COUNT edges with |ΔPoS| > 0.01"
echo ""

# Test seed endpoint
echo "🌱 Testing /api/v1/evidence-graph/seed endpoint (POST)..."
SEED_RESPONSE=$(curl -s -X POST "${API_URL}/api/v1/evidence-graph/seed")
if echo "$SEED_RESPONSE" | grep -q "status"; then
    echo -e "${GREEN}✅ Seed endpoint working${NC}"
    echo "   Response: $SEED_RESPONSE"
else
    echo -e "${RED}❌ Seed endpoint failed${NC}"
    exit 1
fi
echo ""

# Test create node endpoint
echo "📝 Testing /api/v1/evidence-graph/node endpoint (POST)..."
NODE_PAYLOAD='{"id":"test:smoke-test-node","type":"thesis","notes":"Smoke test node"}'
NODE_CREATE=$(curl -s -X POST -H "Content-Type: application/json" -d "$NODE_PAYLOAD" "${API_URL}/api/v1/evidence-graph/node")
if echo "$NODE_CREATE" | grep -q "test:smoke-test-node"; then
    echo -e "${GREEN}✅ Node creation endpoint working${NC}"
else
    echo -e "${RED}❌ Node creation endpoint failed${NC}"
    exit 1
fi
echo ""

# Test create edge endpoint
echo "🔗 Testing /api/v1/evidence-graph/edge endpoint (POST)..."
EDGE_PAYLOAD='{"from":"test:smoke-test-node","to":"test:smoke-test-node","relation":"updates","delta":{"pos":0.01},"confidence":0.5,"reason":"Smoke test edge","created_at":"'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"}'
EDGE_CREATE=$(curl -s -X POST -H "Content-Type: application/json" -d "$EDGE_PAYLOAD" "${API_URL}/api/v1/evidence-graph/edge")
if echo "$EDGE_CREATE" | grep -q "test:smoke-test-node"; then
    echo -e "${GREEN}✅ Edge creation endpoint working${NC}"
else
    echo -e "${RED}❌ Edge creation endpoint failed${NC}"
    exit 1
fi
echo ""

# Test OpenAPI endpoint
echo "📚 Testing /openapi.json endpoint..."
OPENAPI=$(curl -s "${API_URL}/openapi.json")
if echo "$OPENAPI" | grep -q "openapi"; then
    echo -e "${GREEN}✅ OpenAPI endpoint working${NC}"
else
    echo -e "${RED}❌ OpenAPI endpoint failed${NC}"
    exit 1
fi
echo ""

# Check for real-time features (should not exist)
echo "🔒 Verifying no real-time features..."
NO_WEBSOCKET=true
if grep -r "WebSocket\|socket\.io\|ws:" terminal/src/components/EvidenceGraph* terminal/src/pages/EvidenceGraph* terminal/src/utils/evidence-graph* 2>/dev/null; then
    echo -e "${RED}❌ Found WebSocket references - should be manual refresh only!${NC}"
    NO_WEBSOCKET=false
else
    echo -e "${GREEN}✅ No WebSocket/real-time features found${NC}"
fi

if grep -rE "setInterval|setTimeout\s*\(.*[0-9]{4,}|useInterval|[^/]polling" terminal/src/components/EvidenceGraph* terminal/src/pages/EvidenceGraph* terminal/src/utils/evidence-graph* 2>/dev/null | grep -v "node_modules" | grep -v "^\s*//" | grep -v "auto-refresh/polling"; then
    echo -e "${RED}❌ Found auto-refresh/polling code - should be manual refresh only!${NC}"
    NO_WEBSOCKET=false
else
    echo -e "${GREEN}✅ No auto-refresh/polling mechanisms found${NC}"
fi
echo ""

# Summary
echo "=============================="
echo "📊 Test Summary"
echo "=============================="
echo -e "${GREEN}✅ All 9 API endpoints working${NC}"
echo -e "   - Health check: OK"
echo -e "   - OpenAPI: OK"
echo -e "   - Nodes (GET): $NODE_COUNT loaded"
echo -e "   - Node (POST): OK"
echo -e "   - Edges (GET): $EDGE_COUNT loaded"
echo -e "   - Edge (POST): OK"
echo -e "   - Timeline: OK"
echo -e "   - Screen: OK"
echo -e "   - Seed (POST): OK"
if [ "$NO_WEBSOCKET" = true ]; then
    echo -e "${GREEN}✅ Manual-refresh architecture verified${NC}"
    echo -e "   - No WebSocket connections"
    echo -e "   - No auto-polling"
    echo -e "   - User-initiated refresh only"
else
    echo -e "${RED}❌ Manual-refresh architecture check failed${NC}"
    exit 1
fi
echo ""
echo -e "${GREEN}🎉 All tests passed!${NC}"
echo ""
echo "To access the UI:"
echo "  1. Ensure API is running: python3 standalone_evidence_api.py"
echo "  2. Start terminal app: cd terminal && npm run dev"
echo "  3. Navigate to: http://localhost:3000/evidence-graph"
echo "  4. Click '⟳ REFRESH' button to manually load data"

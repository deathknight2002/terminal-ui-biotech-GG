# Evidence Graph - Documentation Index

Welcome to the Evidence Graph feature documentation! This index helps you navigate all available documentation.

## 📚 Documentation Suite

### 1. [Quick Start Guide](EVIDENCE_GRAPH_QUICKSTART.md) ⭐ **START HERE**
**Best for:** Getting up and running quickly

**Contents:**
- 5-minute setup guide
- Backend and frontend startup commands
- Basic usage instructions
- API examples
- Troubleshooting tips

**Time to complete:** ~5 minutes

---

### 2. [Implementation Summary](EVIDENCE_GRAPH_IMPLEMENTATION_SUMMARY.md) 📊
**Best for:** Understanding what's implemented and how it works

**Contents:**
- Complete feature checklist
- Architecture overview
- File structure
- API endpoints reference
- Data models
- Manual refresh architecture
- Test results
- Compliance verification

**Time to read:** ~10 minutes

---

### 3. [Visual Guide](EVIDENCE_GRAPH_VISUAL_GUIDE.md) 🎨
**Best for:** Understanding the UI layout and visual design

**Contents:**
- ASCII diagrams of UI layout
- Color scheme (Bloomberg Terminal style)
- Data flow diagrams
- API response examples
- Performance characteristics
- Browser compatibility

**Time to read:** ~8 minutes

---

### 4. [Detailed README](EVIDENCE_GRAPH_README.md) 📖
**Best for:** Deep dive into all features and configurations

**Contents:**
- Complete feature list
- Data model specifications
- All API endpoints with examples
- Manual refresh architecture details
- Storage configuration
- Extension ideas
- Testing procedures

**Time to read:** ~15 minutes

---

## 🚀 Quick Navigation

### I want to...

**...get started immediately**
→ Read [EVIDENCE_GRAPH_QUICKSTART.md](EVIDENCE_GRAPH_QUICKSTART.md)

**...understand the architecture**
→ Read [EVIDENCE_GRAPH_IMPLEMENTATION_SUMMARY.md](EVIDENCE_GRAPH_IMPLEMENTATION_SUMMARY.md)

**...see what the UI looks like**
→ Read [EVIDENCE_GRAPH_VISUAL_GUIDE.md](EVIDENCE_GRAPH_VISUAL_GUIDE.md)

**...learn all the details**
→ Read [EVIDENCE_GRAPH_README.md](EVIDENCE_GRAPH_README.md)

**...run tests**
→ Run `bash test_evidence_graph.sh`

**...use the API**
→ Check API examples in [EVIDENCE_GRAPH_QUICKSTART.md](EVIDENCE_GRAPH_QUICKSTART.md) or visit http://localhost:8000/docs

**...understand the data models**
→ See "Data Model" section in [EVIDENCE_GRAPH_README.md](EVIDENCE_GRAPH_README.md)

**...verify manual-refresh architecture**
→ See "Manual Refresh Architecture" in [EVIDENCE_GRAPH_IMPLEMENTATION_SUMMARY.md](EVIDENCE_GRAPH_IMPLEMENTATION_SUMMARY.md)

---

## 🎯 Quick Start (3 Steps)

Don't want to read documentation? Here's the absolute minimum:

```bash
# 1. Start API
python3 standalone_evidence_api.py

# 2. Test it (optional)
bash test_evidence_graph.sh

# 3. Start UI
cd terminal && npm run dev
# Then navigate to: http://localhost:3000/evidence-graph
```

**Done!** Click "⟳ REFRESH" to load data.

---

## 📁 File Locations

### Backend
- **Models**: `bt_platform/core/evidence_graph/models.py`
- **Storage**: `bt_platform/core/evidence_graph/storage.py`
- **Endpoints**: `bt_platform/core/endpoints/evidence_graph.py`
- **Data**: `bt_platform/core/evidence_graph/data/`

### Frontend
- **Main Page**: `terminal/src/pages/EvidenceGraphPage.tsx`
- **Graph Component**: `terminal/src/components/EvidenceGraph.tsx`
- **Timeline Component**: `terminal/src/components/TimelineScrubber.tsx`
- **API Client**: `terminal/src/utils/evidence-graph-api.ts`
- **Types**: `terminal/src/types/evidence-graph.ts`

### Standalone
- **API Server**: `standalone_evidence_api.py`
- **Smoke Test**: `test_evidence_graph.sh`

---

## 🧪 Testing

Run comprehensive smoke test:
```bash
bash test_evidence_graph.sh
```

Expected output:
```
✅ All API endpoints working
✅ Manual-refresh architecture verified
🎉 All tests passed!
```

---

## 🔧 Configuration

### Development
- API: `http://localhost:8000`
- UI: `http://localhost:3000`
- CORS: Wide open (`allow_origins=["*"]`)

### Production
- Update CORS in `standalone_evidence_api.py`:
  ```python
  allow_origins=["https://yourdomain.com"]
  ```
- Set environment variables in `terminal/.env.local`:
  ```bash
  VITE_PYTHON_API_URL=https://api.yourdomain.com
  ```

---

## 🔒 Key Features

### Manual Refresh Only ✅
- NO WebSocket connections
- NO automatic polling
- NO real-time updates
- User clicks "⟳ REFRESH" button to fetch data

### Complete API ✅
- 9 endpoints total
- Health checks
- Node/edge management
- Timeline with cumulative metrics
- Edge filtering/screening

### Interactive UI ✅
- Force-directed graph
- Drag nodes
- Click for details
- Timeline scrubber
- Bloomberg Terminal style

---

## 📊 Seed Data

Pre-loaded with:
- **4 nodes**: 2 theses, 1 trial, 1 catalyst
- **2 edges**: 1 updates, 1 catalyst_for
- **Companies**: Scholar Rock, Ionis
- **Assets**: Apitegromab, Eplontersen

---

## ❓ Troubleshooting

**API won't start?**
```bash
pip install fastapi pydantic uvicorn
python3 --version  # Need 3.9+
```

**Frontend won't connect?**
```bash
curl http://localhost:8000/health  # Check API is running
# Check browser console for CORS errors
```

**Tests failing?**
```bash
# Make sure API is running first
python3 standalone_evidence_api.py &
sleep 2
bash test_evidence_graph.sh
```

---

## 📞 Support

- **Documentation**: Read the guides above
- **API Reference**: Visit http://localhost:8000/docs
- **Smoke Test**: Run `bash test_evidence_graph.sh`
- **TypeScript Types**: Check `terminal/src/types/evidence-graph.ts`

---

## 🎉 Ready to Start?

1. Read the [Quick Start Guide](EVIDENCE_GRAPH_QUICKSTART.md)
2. Start the backend: `python3 standalone_evidence_api.py`
3. Start the frontend: `cd terminal && npm run dev`
4. Navigate to: http://localhost:3000/evidence-graph
5. Click "⟳ REFRESH" to load data

**Happy graphing! 📊**

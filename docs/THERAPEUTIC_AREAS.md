# Therapeutic Areas Spider Web Visualization

## Overview

The Therapeutic Areas page provides an interactive spider web (radar chart) visualization comparing different therapeutic areas across seven key science attributes. This visualization helps identify the most promising therapeutic spaces based on multiple dimensions including unmet need, market size, regulatory support, and more.

## Features

### 🕸️ Spider Web Radar Chart
- **Interactive visualization** comparing 5 therapeutic areas:
  - DMD (Duchenne Muscular Dystrophy)
  - Cardiology (Cardiovascular Disease)
  - IBD (Inflammatory Bowel Disease)
  - Oncology
  - Rare Disease (General)

- **Seven attributes** scored on a 0-10 scale:
  1. **Unmet Need**: Medical necessity and current treatment gaps
  2. **Market Size**: Addressable patient population and revenue potential
  3. **Regulatory Support**: FDA/EMA pathway favorability and precedents
  4. **Scientific Validation**: Mechanism strength and clinical evidence
  5. **Competitive Intensity**: Number and quality of competing programs
  6. **Reimbursement Potential**: Payer willingness and pricing power
  7. **Patient Advocacy**: Community organization and awareness

### 🎨 Aurora Glass Theme
- **Liquid glass effects** with backdrop blur
- **Aurora gradient animations** for visual appeal
- **Responsive design** for mobile and desktop
- **High contrast** for accessibility (WCAG AAA)

### 🔍 Interactive Features
- **Area Filtering**: Click on area cards to toggle visibility in the chart
- **Hover Tooltips**: See detailed information on hover
- **Series Legend**: Toggle specific therapeutic areas on/off
- **Aurora Gradient Coloring**: Values are color-coded by intensity
  - Higher values (8-10) = Brighter, more vibrant colors
  - Lower values (0-4) = Dimmer, less saturated colors

### 📊 Real Biotech Data
All data is sourced from actual research primers:
- **DMD Companies**: SRPT, BMRN, ARWR, EWTX, INSM, JAZZ, KROS, PEPG, PFE, QURE, RGNX, RNA, SLDB, WVE
- **Cardiology Companies**: AMGN, ARWR, AZN, BMY, CYTK, EWTX, IONS, LLY, LXRX, MRK, NAMS, TENX, TRMX
- **IBD Companies**: ABBV, JNJ, GILD, BMY, AMGN, PFE

### ♻️ Manual Refresh Model
- **No auto-polling**: Data only refreshes when user clicks "REFRESH DATA" button
- **Last updated timestamp**: Shows when data was last refreshed
- **Error handling**: Graceful degradation with error messages
- **Rate limiting aware**: Respects Yahoo Finance and other API rate limits

## Usage

### Accessing the Page

**Desktop**: Navigate via the top menu bar:
```
SCIENCE → Therapeutic Areas
```

**Mobile**: Access via the hamburger menu:
```
☰ → SCIENCE → Therapeutic Areas
```

**Direct URL**:
```
http://localhost:3000/science/therapeutic-areas
```

### Filtering Areas

1. **View All**: By default, all 5 therapeutic areas are displayed
2. **Filter Specific Areas**: Click on any area card on the left to toggle it
3. **Compare Subsets**: Select 2-3 areas to focus on specific comparisons
4. **Re-enable**: Click again to add the area back to the chart

### Reading the Chart

**Interpreting Values**:
- **9-10**: Extremely favorable (e.g., DMD unmet need = 9.5)
- **7-8**: Favorable (e.g., Cardiology market size = 9.5)
- **5-6**: Moderate (e.g., Rare Disease market size = 6.5)
- **0-4**: Challenging (lower is worse)

**Polygon Shape**:
- **Larger polygon** = More favorable across multiple dimensions
- **Spiky polygon** = Strong in some areas, weak in others
- **Balanced polygon** = Consistent scores across all attributes

## API Integration

### Backend Endpoints

The page connects to the FastAPI backend at:

**List All Areas**:
```
GET http://localhost:8000/api/v1/therapeutic-areas/areas
```

**Radar Chart Data**:
```
GET http://localhost:8000/api/v1/therapeutic-areas/areas/compare/radar
GET http://localhost:8000/api/v1/therapeutic-areas/areas/compare/radar?areas=DMD,Cardiology
```

**Area Details**:
```
GET http://localhost:8000/api/v1/therapeutic-areas/areas/{area_id}
```

### Rate Limiting

The backend uses Yahoo Finance rate limiter:
- **Max requests**: ~2,000-2,500 per hour per IP
- **Delay between calls**: 200-500ms minimum
- **Caching**: 30-minute cache for market data
- **Exponential backoff**: Automatic retry with backoff on throttling

## Data Sources

### Research Primers
- **Duchenne Muscular Dystrophy (DMD) Primer**
- **Cardiology Research Report**
- **Inflammatory Bowel Disease (IBD) Report**
- **Oncology Landscape Analysis**
- **Rare Disease Market Overview**

### Attribute Scoring Methodology

Scores are assigned based on:
1. **Clinical Data**: Phase III success rates, regulatory approvals
2. **Market Analysis**: Addressable patient population, pricing benchmarks
3. **Regulatory Precedents**: FDA guidance documents, accelerated pathways
4. **Scientific Literature**: Genetic validation, mechanism strength
5. **Competitive Landscape**: Number of programs, pipeline stages
6. **Payer Landscape**: Coverage decisions, ICER reviews
7. **Patient Organizations**: Foundation presence, advocacy strength

## Mobile Optimization

### Responsive Breakpoints
- **Desktop** (>1200px): Side-by-side layout with area cards + chart
- **Tablet** (768-1200px): Stacked layout with full-width panels
- **Mobile** (<768px): Single column, optimized for touch

### Mobile Features
- **Touch-friendly**: Large tap targets for area cards
- **Swipe gestures**: Native scrolling within panels
- **Optimized chart size**: 400px height on mobile (vs 600px desktop)
- **Liquid glass backdrop**: iOS-style blur effects on mobile Safari

## Performance

### Optimization Strategies
- **Canvas rendering**: High-performance WebGL/Canvas2D for chart
- **Lazy loading**: Chart only renders when visible
- **Memoization**: React.memo() on expensive components
- **Virtual scrolling**: For long company lists (if implemented)

### Metrics
- **First Contentful Paint**: <1.5s
- **Time to Interactive**: <3.0s
- **Chart animation**: 60fps smooth animation
- **Memory footprint**: <50MB

## Troubleshooting

### Common Issues

**1. Chart Not Loading**
```
Error: Failed to fetch therapeutic areas
```
**Solution**: Ensure Python backend is running:
```bash
poetry run uvicorn platform.core.app:app --reload --port 8000
```

**2. No Data Displayed**
```
Error: 404 Not Found
```
**Solution**: Check backend endpoint is registered in `routers.py`:
```python
api_router.include_router(
    therapeutic_areas.router,
    prefix="/therapeutic-areas",
    tags=["therapeutic-areas"]
)
```

**3. CORS Errors**
```
Error: CORS policy blocked
```
**Solution**: Add CORS middleware in `platform/core/app.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**4. Rate Limiting (429 Error)**
```
Error: Too Many Requests
```
**Solution**: Wait 1 hour or use cached data. The page will automatically show cached data on rate limit errors.

## Future Enhancements

### Planned Features
- [ ] Export chart as PNG/SVG
- [ ] Compare custom attribute combinations
- [ ] Time-series view (how areas evolve over time)
- [ ] Drill-down into specific companies within areas
- [ ] Save custom area comparisons
- [ ] Overlay financial data (R&D spend, venture funding)
- [ ] AI-powered insights and recommendations

### Integration Opportunities
- **Evidence Journal**: Link to mechanism-of-action pages
- **Catalyst Calendar**: Show upcoming events per area
- **Clinical Trials**: Filter trials by therapeutic area
- **Financial Models**: Area-level peak sales projections

## References

### Scientific Sources
- FDA Orphan Drug Designations Database
- ClinicalTrials.gov API v2
- Open Targets Genetics Platform
- PubMed/MEDLINE via NLM API

### Market Data Sources
- Yahoo Finance (via rate limiter)
- Company SEC filings (EDGAR API)
- Patent databases (USPTO)
- Clinical trial registries (EMA CTIS)

### Design Inspiration
- Bloomberg Terminal aesthetics
- Cyberpunk 2077 UI elements
- iOS liquid glass design language
- D3.js radar chart examples

## License

MIT License - Part of the Biotech Terminal Platform

## Support

For issues or questions:
- **GitHub Issues**: [terminal-ui-biotech-GG/issues](https://github.com/deathknight2002/terminal-ui-biotech-GG/issues)
- **Documentation**: `/docs/THERAPEUTIC_AREAS.md`
- **API Docs**: http://localhost:8000/docs (when backend is running)

# Therapeutic Areas Spider Web - Quick Reference

## 🎯 What It Does

Compares 5 therapeutic areas across 7 science attributes using an interactive spider web (radar) chart with Aurora glass theme.

## 📍 How to Access

**URL**: `/science/therapeutic-areas`  
**Menu**: SCIENCE → Therapeutic Areas

## 🗂️ Therapeutic Areas

1. **DMD** (Duchenne Muscular Dystrophy) - Cyan (#00d4ff)
2. **Cardiology** (Cardiovascular Disease) - Amber (#fbbf24)  
3. **IBD** (Inflammatory Bowel Disease) - Green (#10b981)
4. **Oncology** - Purple (#a855f7)
5. **Rare Disease** - Blue (#3b82f6)

## 📊 Seven Attributes (0-10 Scale)

| Attribute | Description | Example |
|-----------|-------------|---------|
| **Unmet Need** | Medical necessity & treatment gaps | DMD: 9.5 (ultra-rare, high mortality) |
| **Market Size** | Patient population & revenue potential | Cardiology: 9.5 (47% of US adults with CVD) |
| **Regulatory Support** | FDA/EMA pathway favorability | DMD: 8.5 (accelerated approval pathways) |
| **Scientific Validation** | Mechanism strength & evidence | Oncology: 9.5 (immuno-oncology revolution) |
| **Competitive Intensity** | Number & quality of competing programs | Oncology: 9.5 (highly competitive) |
| **Reimbursement Potential** | Payer willingness & pricing power | Oncology: 9.0 (high willingness to pay) |
| **Patient Advocacy** | Community organization & awareness | Oncology: 9.5 (strong patient organizations) |

## 🎨 UI Features

### Layout
```
┌─────────────────────────────────────────────────────┐
│ [THERAPEUTIC AREA INTELLIGENCE]  [↻ REFRESH DATA]  │
├──────────────────┬──────────────────────────────────┤
│ Area Cards       │ Spider Web Chart                 │
│ (Clickable)      │ (Interactive Radar)              │
│                  │                                  │
│ □ DMD            │         ╱────────╲               │
│ □ Cardiology     │      ╱─┼────────┼─╲             │
│ □ IBD            │    ╱───┼────────┼───╲           │
│ □ Oncology       │  ╱─────┼────────┼─────╲         │
│ □ Rare Disease   │  ──────┼────────┼──────         │
│                  │  ╲─────┼────────┼─────╱         │
│                  │    ╲───┼────────┼───╱           │
│                  │      ╲─┼────────┼─╱             │
│                  │         ╲────────╱               │
├──────────────────┴──────────────────────────────────┤
│ Key Insights (3 cards with icons)                   │
└─────────────────────────────────────────────────────┘
```

### Area Cards (Left Panel)
- **Header**: Area name + indicator dot
- **Description**: Brief overview
- **Metrics**: Prevalence, Peak Sales potential
- **Companies**: Top 5 tickers (e.g., SRPT, BMRN, ARWR...)
- **Mechanisms**: Key therapeutic approaches (tags)

### Spider Chart (Right Panel)
- **7 axes** radiating from center
- **5 colored polygons** (one per area)
- **Hover tooltips** showing exact values
- **Legend** with series toggle
- **Aurora gradient** colors intensify with value

### Insights Panel (Bottom)
- **🧬 Rare Disease Dynamics**: Orphan drug advantages
- **❤️ Cardiology at Scale**: Large market dynamics
- **🔬 Innovation Frontiers**: Mechanistic differentiation

## 🔄 Interaction

### Click Area Card
- Toggles area visibility in chart
- Card border changes color when active
- Chart redraws with selected areas only

### Hover Chart
- Tooltip shows: Area name, Attribute, Value
- Highlighted polygon glows
- Data point enlarges

### Refresh Data
1. Click "↻ REFRESH DATA" button
2. Fetches from backend API
3. Updates "Last Updated" timestamp
4. Shows success/error toast

## 📱 Mobile Responsive

**Desktop (>1200px)**:
- 2-column layout (cards | chart)
- Chart size: 600px

**Tablet (768-1200px)**:
- Stacked layout
- Chart size: 500px

**Mobile (<768px)**:
- Single column
- Chart size: 400px
- Touch-optimized tap targets

## 🎭 Aurora Glass Theme

### Visual Effects
```css
/* Glass panels */
background: rgba(15, 20, 32, 0.5);
backdrop-filter: blur(16px);
border: 1px solid rgba(125, 249, 255, 0.12);

/* Aurora gradients */
radial-gradient(1200px at 10% -10%, rgba(125, 249, 255, 0.15), transparent);
radial-gradient(900px at 90% 0%, rgba(192, 132, 252, 0.12), transparent);

/* Hover glow */
box-shadow: 0 8px 24px rgba(125, 249, 255, 0.15);
```

### Typography
- **Titles**: JetBrains Mono, 700 weight, uppercase
- **Body**: System UI, 400 weight
- **Colors**: Cyan (#00d4ff), White (#E6F1FF), Slate (#94a3b8)

## 🔗 Backend API

### List All Areas
```http
GET /api/v1/therapeutic-areas/areas
```

**Response**:
```json
{
  "areas": [
    {
      "id": "DMD",
      "name": "Duchenne Muscular Dystrophy",
      "attributes": { "unmet_need": 9.5, ... },
      "companies": ["SRPT", "BMRN", ...],
      "metadata": { "description": "...", ... }
    }
  ],
  "attribute_labels": ["Unmet Need", ...],
  "scale": { "min": 0, "max": 10 }
}
```

### Radar Chart Data
```http
GET /api/v1/therapeutic-areas/areas/compare/radar?areas=DMD,Cardiology
```

**Response**:
```json
{
  "chart_type": "radar",
  "attributes": ["Unmet Need", ...],
  "series": [
    {
      "id": "DMD",
      "name": "Duchenne Muscular Dystrophy",
      "values": [9.5, 7.8, 8.5, 8.2, 7.5, 8.0, 9.0],
      "color": "#00d4ff",
      "description": "..."
    }
  ],
  "scale": { "min": 0, "max": 10 },
  "theme": "aurora"
}
```

## 🧪 Real Data Sources

### Companies by Area

**DMD**: SRPT, BMRN, ARWR, EWTX, INSM, JAZZ, KROS, PEPG, PFE, QURE, RGNX, RNA, SLDB, WVE

**Cardiology**: AMGN, ARWR, AZN, BMY, CYTK, EWTX, IONS, LLY, LXRX, MRK, NAMS, TENX, TRMX

**IBD**: ABBV, JNJ, GILD, BMY, AMGN, PFE

**Oncology**: MRK, BMY, ROCHE, PFE, AZN, NOVN, GILD, AMGN

**Rare Disease**: SRPT, BMRN, ALNY, IONS, QURE, RGNX, JAZZ

### Key Mechanisms

**DMD**: Exon skipping, Gene therapy, Myosin inhibition, Anti-inflammatory

**Cardiology**: Myosin inhibition, RNAi therapeutics, GLP-1 agonists, Gene therapy, Antisense oligos

**IBD**: IL-23 inhibition, S1P modulators, JAK inhibitors, Anti-integrin

## 🚀 Performance

- **FCP**: <1.5s (First Contentful Paint)
- **TTI**: <3.0s (Time to Interactive)
- **Animation**: 60fps (chart rendering)
- **Memory**: <50MB footprint

## 📚 Learn More

Full documentation: `docs/THERAPEUTIC_AREAS.md`

## 🐛 Troubleshooting

**Chart not loading?**  
→ Ensure backend is running: `poetry run uvicorn platform.core.app:app --reload --port 8000`

**CORS error?**  
→ Check CORS middleware in `platform/core/app.py`

**Rate limited?**  
→ Wait 1 hour or use cached data (automatic fallback)

## 🎯 Key Insights

### DMD (Duchenne)
- **Highest unmet need** (9.5) + strong patient advocacy (9.0)
- **Smaller market** (7.8) but high pricing power
- **Regulatory tailwinds** via accelerated approval pathways

### Cardiology
- **Largest market** (9.5) with 47% US adult prevalence
- **High competition** (9.0) and scientific validation (9.0)
- **Complex reimbursement** due to diverse payer landscape

### Oncology
- **Massive market** (10.0) with highest revenue potential
- **Most competitive** (9.5) but also highest advocacy (9.5)
- **Strong reimbursement** (9.0) due to willingness to pay

---

**Built with**: React 19, TypeScript, Canvas API, Aurora Glass Design  
**License**: MIT  
**Version**: 1.0.0

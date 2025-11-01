# Aurora Lava Dashboard - Visual Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AURORA LAVA DASHBOARD                                │
│                     http://localhost:8000/dash/                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  HEADER BAR (header.py)                                                      │
│  ┌──────────────┬──────────────────────────────┬────────────────────────┐   │
│  │ EVIDENCE     │ [SERIES ▼] [TICKER ▼]       │ [REFRESH ▼] Updated:   │   │
│  │ GRAPH        │ SRRK_SMA    SRRK             │ 30s         22:00:00   │   │
│  │ Live PoS & IV│                              │ ⚡ 45ms                │   │
│  └──────────────┴──────────────────────────────┴────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  KPI TILES (tiles.py)                                                        │
│  ┌────────────┬────────────┬────────────┬────────────┐                      │
│  │  +2.3%     │     78     │  Q2 2026   │   MEDIUM   │                      │
│  │ PoS 7D     │  IV RANK   │   NEXT     │  BINARY    │                      │
│  │  CHANGE    │ Percentile │ CATALYST   │   RISK     │                      │
│  │ ▲ vs prev  │ ▲ vs avg   │ Expected   │ ● Event    │                      │
│  └────────────┴────────────┴────────────┴────────────┘                      │
└─────────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────┬─────────────────────────────────────────────┐
│  PoS GAUGE (pos_gauge.py)     │  IV CHART (iv_chart.py)                     │
│  ┌───────────────────────────┐│  ┌─────────────────────────────────────────┐│
│  │  PROBABILITY OF SUCCESS   ││  │  IMPLIED VOLATILITY                     ││
│  │                           ││  │                                         ││
│  │         ╔═══╗             ││  │  60│         ┌──────┐                  ││
│  │       ╔═══════╗           ││  │    │    ┌────┤      │                  ││
│  │     ╔═══════════╗         ││  │  45│┌───┤    │      ├─────┐   ╱╲       ││
│  │    ║             ║        ││  │    ││   │    │      │     │  ╱  ╲      ││
│  │    ║    65%      ║  🟢    ││  │  30│└───┘    └──────┘     └─╱    ╲─   ││
│  │    ║             ║        ││  │    │                                    ││
│  │     ╚═══════════╝         ││  │  15│                                    ││
│  │       ╚═══════╝           ││  │    └────────────────────────────────────││
│  │         ╚═══╝             ││  │     Jan  Feb  Mar  Apr  May  Jun  Jul   ││
│  │   PoS 7D CHANGE           ││  │                                         ││
│  │       +2.3%               ││  │  ▬ IV Bars (Cyan)  ▬ HV Line (Magenta) ││
│  └───────────────────────────┘│  └─────────────────────────────────────────┘│
└───────────────────────────────┴─────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  CATALYST HEATMAP (catalyst_heatmap.py)                                      │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  CATALYST HEATMAP                                                      │  │
│  │         │ Week 1 │ Week 2 │ Week 3 │ Week 4 │                         │  │
│  │  ───────┼────────┼────────┼────────┼────────┤                         │  │
│  │   SRRK  │   🟩   │   🟨   │   🟨   │   🟥   │  🟩 High IV Rank       │  │
│  │   IONIS │   🟩   │   🟩   │   🟨   │   🟩   │  🟨 Med IV Rank        │  │
│  │   KRYS  │   🟨   │   🟨   │   🟩   │   🟨   │  🟥 Low IV Rank        │  │
│  │         │        │        │        │        │                         │  │
│  │  Hover for event details: Date, Certainty, Risk                       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  WEBGL BACKGROUND (lava-bg.js)                                               │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │         ·  ·──·  ·     ·──·──·     ·──·  ·                           │  │
│  │      ·──·      ·──·──·        ·──·      ·──·                         │  │
│  │   ·──·  ·──·──·     ·──·──·──·     ·──·  ·──·                       │  │
│  │      ·──·      ·──·──·        ·──·      ·──·                         │  │
│  │         ·  ·──·  ·     ·──·──·     ·──·  ·                           │  │
│  │                                                                       │  │
│  │  Animated network particles with perlin noise (opacity: 0.08)        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘

TECH STACK:
├── Dash 3.2.0              (Framework)
├── Dash Mantine Components (UI Library)
├── Plotly.js               (Charts)
├── Vanta.js + Three.js     (WebGL Background)
└── Flask-Caching           (API Response Cache)

COLOR PALETTE:
├── Accent:     #00ff9f (Cyan-Green) 🟢
├── Magenta:    #9a4dff (Purple)     🟣
├── Cyan:       #00d9ff (Sky Blue)   🔵
├── Heat Lo:    #ff5a5f (Red)        🔴
├── Heat Mid:   #ffcc00 (Amber)      🟡
└── Heat Hi:    #29d344 (Green)      🟢

ANIMATIONS:
├── PoS Gauge:    350ms cubic-in-out transition
├── IV Chart:     300ms cubic-in-out transition
├── KPI Tiles:    250ms hover transform + glow
├── Skeleton:     1.5s infinite loading shimmer
└── WebGL:        60fps particle network animation

PERFORMANCE:
├── TTI:          < 1.5s
├── Handler:      < 100ms
├── Cache:        15s API responses
└── FPS:          60fps WebGL (pauses on blur)

ACCESSIBILITY:
├── Contrast:     WCAG AAA (7:1 minimum)
├── Keyboard:     Full navigation support
├── ARIA:         Labels on all interactive elements
├── Motion:       Respects prefers-reduced-motion
└── Focus:        Visible 2px accent rings
```

## Component Hierarchy

```
MantineProvider (theme)
└── Div (main container)
    ├── Header (render_header)
    │   ├── Branding (title + subtitle)
    │   ├── Controls
    │   │   ├── Series Dropdown
    │   │   └── Ticker Dropdown
    │   └── Status
    │       ├── Refresh Dropdown
    │       ├── Last Updated
    │       └── Latency Pill
    ├── KPI Tiles (render_kpi_tiles)
    │   ├── Tile: PoS 7D Change
    │   ├── Tile: IV Rank
    │   ├── Tile: Next Catalyst
    │   └── Tile: Binary Risk
    ├── Hero Row
    │   ├── Panel: PoS Gauge
    │   │   └── Graph (render_pos_gauge)
    │   └── Panel: IV Chart
    │       └── Graph (render_iv_chart)
    └── Panel: Catalyst Heatmap
        └── Graph (render_catalyst_heatmap)
```

## Data Flow

```
User Interaction
     │
     ├── Series/Ticker Change
     │   └── callbacks.py::update_dashboard()
     │       └── api.py::get_pos_data()
     │           ├── httpx GET /api/v1/evidence/pos
     │           └── cache.py (15s TTL)
     │
     ├── Refresh Interval
     │   └── callbacks.py::update_dashboard()
     │       └── [Same as above]
     │
     └── Component Render
         ├── pos_gauge.py::render_pos_gauge()
         ├── iv_chart.py::render_iv_chart()
         ├── catalyst_heatmap.py::render_catalyst_heatmap()
         └── tiles.py::render_kpi_tiles()
```

## File Size Breakdown

```
Component Files:      1,247 lines (56%)
Service Files:          275 lines (12%)
Assets (CSS/JS):        702 lines (32%)
─────────────────────────────────────
Total Production:     2,224 lines

Test Files:             187 lines
Documentation:          783 lines
─────────────────────────────────────
Grand Total:          3,194 lines
```

## Browser Compatibility Matrix

```
✅ Chrome 90+     (Full support)
✅ Edge 90+       (Full support)
✅ Firefox 88+    (Full support)
✅ Safari 14+     (Full support)
⚠️  IE 11         (Not supported - no WebGL 2.0)
✅ Mobile Chrome  (Responsive layout)
✅ Mobile Safari  (Responsive layout)
```

## Key Features Summary

```
┌─────────────────────────┬──────────────────────────────────────────┐
│ Feature                 │ Status                                   │
├─────────────────────────┼──────────────────────────────────────────┤
│ Animated PoS Gauge      │ ✅ 350ms cubic-in-out, color gradient    │
│ IV Combo Chart          │ ✅ Bars + sparkline, dual axes          │
│ Catalyst Heatmap        │ ✅ Matrix view, color-coded             │
│ KPI Tiles               │ ✅ 4 tiles, hover effects               │
│ WebGL Background        │ ✅ Vanta.js NET effect, 60fps           │
│ Auto-Refresh            │ ✅ 15s/30s/60s/Off options              │
│ Responsive Design       │ ✅ Mobile-friendly grid                 │
│ Dark Theme              │ ✅ Bloomberg-inspired aesthetic         │
│ Accessibility           │ ✅ WCAG AAA compliant                   │
│ Caching                 │ ✅ 15s API response cache               │
│ Error Handling          │ ✅ Graceful fallbacks                   │
│ Loading States          │ ✅ Skeleton loaders                     │
│ Tests                   │ ✅ 16 tests, all passing                │
│ Documentation           │ ✅ Comprehensive guides                 │
└─────────────────────────┴──────────────────────────────────────────┘
```
